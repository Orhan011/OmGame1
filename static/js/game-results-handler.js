/**
 * Oyun Sonuçları İşleyici
 * 
 * Bu script, oyun sonundaki istatistik ekranını düzenlemeye yarar.
 * Rastgele puanların gösterilmesini engeller ve sadece gerçek puanları gösterir.
 */
(function() {
  // Sayfa yüklendiği zaman çalışacak
  document.addEventListener('DOMContentLoaded', initializeResultsHandler);
  
  // İçeriğe her müdahale edildiğinde (DOM değişikliği) kontrol edilmesi gereken selektörler
  const RESULT_STAT_SELECTORS = '.result-stat, .result-stat-value, .game-result-stat, .game-stat';
  const SCORE_DISPLAY_SELECTORS = '#final-score, #finalScore, .final-score, .game-result-score, [id$="-score"]';
  const STATS_CONTAINER_SELECTORS = '.results-stats, .game-result-stats, .game-stats';
  const RATING_SELECTORS = '.results-rating, .rating-stars, #rating-stars, .rating-text, #rating-text';
  
  /**
   * Sonuç işleyicisini başlat - Bu, sayfa yüklendiğinde ve içerik değiştiğinde çalışır
   */
  function initializeResultsHandler() {
    console.log("İstatistik ekranı temizleme işlemi başlatılıyor...");
    
    // İlk temizlemeyi hemen yap
    cleanupAllResultScreens();
    
    // Skor API yanıtını dinle
    setupScoreApiListener();
    
    // DOM'daki değişiklikleri izle - Dinamik olarak sonuç ekranları eklendiğinde temizle
    setupMutationObserver();
    
    // 1 saniye sonra ve 3 saniye sonra tekrar temizleme işlemini yap
    // Bu zamanlayıcılar, DOM'a gecikmeli olarak eklenen sonuç ekranlarının da temizlenmesini sağlar
    setTimeout(cleanupAllResultScreens, 1000);
    setTimeout(cleanupAllResultScreens, 3000);
  }
  
  /**
   * DOM değişikliklerini izler ve yeni sonuç ekranları eklendiğinde onları temizler
   */
  function setupMutationObserver() {
    // DOM değişikliklerini izlemek için MutationObserver kullan
    const observer = new MutationObserver(function(mutations) {
      let shouldCleanup = false;
      
      mutations.forEach(function(mutation) {
        // Eklenen düğümleri kontrol et
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            
            // Element türünde bir düğüm ise ve result ya da stat içeriyorsa
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.className && 
                 (node.className.includes('result') || 
                  node.className.includes('stat') || 
                  node.className.includes('score')))) {
              shouldCleanup = true;
              break;
            }
          }
        }
        
        // Öznitelik değişikliklerini kontrol et - display: block/flex olduğunda
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target.style && 
            (mutation.target.style.display === 'block' || 
             mutation.target.style.display === 'flex') && 
            (mutation.target.className && 
             (mutation.target.className.includes('result') || 
              mutation.target.className.includes('game-over')))) {
          shouldCleanup = true;
        }
      });
      
      // Eğer temizlenmesi gereken bir şey varsa
      if (shouldCleanup) {
        cleanupAllResultScreens();
      }
    });
    
    // Tüm DOM'u izle, alt öğeler dahil
    observer.observe(document.body, { 
      childList: true,      // DOM'a eklenen/çıkarılan elemanları izle
      subtree: true,        // Tüm alt öğeleri de izle
      attributes: true,     // Öznitelik değişikliklerini izle
      attributeFilter: ['style', 'class']  // Sadece stil ve sınıf değişikliklerini izle
    });
  }
  
  /**
   * Tüm sonuç ekranlarını temizler
   */
  function cleanupAllResultScreens() {
    try {
      // 1. İstatistik kaplarını bul
      document.querySelectorAll(STATS_CONTAINER_SELECTORS).forEach(statsContainer => {
        cleanStatisticsContainer(statsContainer);
      });
      
      // 2. Tüm derecelendirme elementlerini gizle
      document.querySelectorAll(RATING_SELECTORS).forEach(element => {
        element.style.display = 'none';
      });
      
      // 3. Puan ekranlarını düzenle
      enhanceScoreDisplays();
      
      console.log("İstatistik ekranları temizlendi!");
    } catch (error) {
      console.error("İstatistik temizleme hatası:", error);
    }
  }
  
  /**
   * Belirli bir istatistik konteynerini temizler, sadece skor bilgisini bırakır
   */
  function cleanStatisticsContainer(statsContainer) {
    try {
      if (!statsContainer) return;
      
      // Tüm istatistik öğelerini bul
      const statElements = statsContainer.querySelectorAll(RESULT_STAT_SELECTORS);
      let scoreElement = null;
      
      // Sadece puan içeren elementi bul, diğerlerini gizle
      statElements.forEach(statElement => {
        const statLabel = statElement.querySelector('.result-stat-label, .stat-label');
        const labelText = statLabel ? statLabel.textContent.toLowerCase() : '';
        
        if (labelText.includes('puan') || labelText.includes('skor') || labelText.includes('toplam puan')) {
          scoreElement = statElement;
        } else {
          // Puan dışındaki istatistikleri gizle
          statElement.style.display = 'none';
        }
      });
      
      // Skor elementi bulunamadıysa ve ebeveyn içerisindeyse, konteynerı gizle
      if (!scoreElement && statsContainer.parentElement) {
        //statsContainer.style.display = 'none';
      } 
      // Skor elementi bulunursa, tek başına merkezi durmasını sağla
      else if (scoreElement) {
        scoreElement.style.flex = '1';
        scoreElement.style.textAlign = 'center';
        
        // Diğer elementleri gizle
        Array.from(statsContainer.children).forEach(child => {
          if (child !== scoreElement) {
            child.style.display = 'none';
          }
        });
        
        // Görselleştirmeyi iyileştir
        enhanceScoreElement(scoreElement);
      }
    } catch (error) {
      console.error("İstatistik konteyner temizleme hatası:", error);
    }
  }
  
  /**
   * Score elementlerini daha görünür ve çekici hale getirir
   */
  function enhanceScoreElement(scoreElement) {
    try {
      if (!scoreElement) return;
      
      // Skor değerini içeren elementi bul
      const valueElement = scoreElement.querySelector('.result-stat-value, .stat-value');
      if (valueElement) {
        valueElement.style.fontSize = '3rem';
        valueElement.style.fontWeight = 'bold';
        valueElement.style.color = '#6a5ae0';
        valueElement.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
        valueElement.style.padding = '20px 0';
      }
      
      // Skor ikonunu bul
      const iconElement = scoreElement.querySelector('i');
      if (iconElement) {
        iconElement.style.fontSize = '2.5rem';
        iconElement.style.color = '#6a5ae0';
        iconElement.style.margin = '10px 0';
      }
    } catch (error) {
      console.error("Skor elementi geliştirme hatası:", error);
    }
  }
  
  /**
   * Tüm skor gösterimlerini iyileştirir
   */
  function enhanceScoreDisplays() {
    try {
      // Sayfadaki tüm final skor elementlerini bul
      const scoreDisplays = document.querySelectorAll(SCORE_DISPLAY_SELECTORS);
      
      // Her birine stil uygula
      scoreDisplays.forEach(element => {
        if (element) {
          element.style.fontSize = '3rem';
          element.style.fontWeight = 'bold';
          element.style.color = '#6a5ae0';
          element.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
        }
      });
    } catch (error) {
      console.error("Skor gösterimi geliştirme hatası:", error);
    }
  }
  
  /**
   * Skor API yanıtını dinleyerek istatistik ekranlarını günceller
   */
  function setupScoreApiListener() {
    try {
      // API yanıtları için özel olay dinleyicisi
      document.addEventListener('scoreApiResponse', function(e) {
        if (e.detail && e.detail.data) {
          const data = e.detail.data;
          const realScore = data.points?.total || data.score || 0;
          
          // Temizleme işlemini tekrarla ve puanları güncelle
          cleanupAllResultScreens();
          updateAllScoreDisplays(realScore);
        }
      });
      
      // ScoreHandler.saveScore metodunu extend et (varsa)
      if (window.ScoreHandler && window.ScoreHandler.saveScore) {
        const originalSaveScore = window.ScoreHandler.saveScore;
        
        window.ScoreHandler.saveScore = function() {
          const result = originalSaveScore.apply(this, arguments);
          
          // API yanıtını yakala
          if (result && typeof result.then === 'function') {
            result.then(data => {
              if (data && data.success) {
                // Özel olay tetikle
                document.dispatchEvent(new CustomEvent('scoreApiResponse', {
                  detail: { data: data }
                }));
                
                // DOM'u tekrar temizle
                setTimeout(cleanupAllResultScreens, 500);
              }
            }).catch(error => {
              console.error('Skor API hatası:', error);
            });
          }
          
          return result;
        };
      }
    } catch (error) {
      console.error("API dinleyici kurulum hatası:", error);
    }
  }
  
  /**
   * Tüm skor gösterimlerini gerçek skorla günceller
   */
  function updateAllScoreDisplays(score) {
    try {
      // Sayfadaki tüm skor gösterimlerini bul
      const scoreElements = document.querySelectorAll(SCORE_DISPLAY_SELECTORS);
      
      // Her birine animasyonlu geçiş uygula
      scoreElements.forEach(element => {
        if (element) {
          const currentValue = parseInt(element.textContent) || 0;
          animateScoreTransition(element, currentValue, score);
        }
      });
    } catch (error) {
      console.error("Skor gösterimi güncelleme hatası:", error);
    }
  }
  
  /**
   * Bir skor gösteriminin değerini animasyonlu şekilde değiştirir
   */
  function animateScoreTransition(element, startValue, endValue) {
    try {
      const duration = 1000;  // 1 saniye
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Yavaşlatılan animasyon efekti
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Mevcut değeri hesapla
        const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
        
        // Elementi güncelle
        element.textContent = currentValue;
        
        // Animasyon devam ediyorsa bir sonraki kareyi çiz
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Skor animasyon hatası:", error);
      // Hata durumunda doğrudan değeri ata
      if (element) element.textContent = endValue;
    }
  }
  
  // Global erişim için fonksiyonları dışa aktar
  window.GameResultsHandler = {
    cleanupResults: cleanupAllResultScreens,
    updateScoreDisplay: updateAllScoreDisplays,
    initialize: initializeResultsHandler
  };
})();