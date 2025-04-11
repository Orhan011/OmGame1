/**
 * Stat Cleaner - Oyun İstatistik Ekranı Temizleyici
 * 
 * Bu script, oyun sonunda görünen istatistik ekranlarındaki rastgele puanları kaldırır
 * ve sadece gerçek API skorlarını gösterir.
 */
(function() {
  // Sayfa yüklendiğinde çalıştır
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Stat Cleaner yüklendi, istatistik ekranları temizlenecek');
    
    // Hemen çalıştır
    cleanAllStatElements();
    
    // Düzenli aralıklarla kontrol et (500ms)
    setInterval(cleanAllStatElements, 500);
    
    // DOM değişikliklerini takip et
    setupMutationObserver();
    
    // Score yanıtlarını dinle
    setupScoreListeners();
  });
  
  // Selektörler
  const SCORE_SELECTORS = [
    '#final-score', '#finalScore', '.final-score', '.game-result-score', 
    '[id$="-score"]', '.result-stat-value span', '.score-value', '.score-display'
  ];
  
  const STAT_CONTAINER_SELECTORS = [
    '.results-stats', '.game-result-stats', '.game-stats', '.result-details',
    '.game-result-stat', '.result-stat', '.statistic-item'
  ];
  
  // Tüm istatistik elementlerini temizle
  function cleanAllStatElements() {
    try {
      // Önce istatistik konteynerlerini bul
      const containers = document.querySelectorAll(STAT_CONTAINER_SELECTORS.join(', '));
      
      // Her konteynerde sadece puan gösteren elementleri bırak
      containers.forEach(function(container) {
        if (!container || !container.children) return;
        
        let scoreElement = null;
        const statElements = Array.from(container.children);
        
        // Her çocuk elemanı kontrol et
        statElements.forEach(function(statEl) {
          if (!statEl) return;
          
          // Eleman metnini al
          let text = '';
          if (statEl.textContent) {
            text = statEl.textContent.toLowerCase();
          }
          
          // İçinde puan/skor geçen elementleri bul
          if (text.includes('puan') || text.includes('skor') || text.includes('toplam')) {
            scoreElement = statEl;
          } else {
            // Puan/skor içermeyenleri gizle
            statEl.style.display = 'none';
          }
        });
        
        // Puan elementi varsa düzenle
        if (scoreElement) {
          scoreElement.style.flex = '1';
          scoreElement.style.textAlign = 'center';
          
          // Değer elementini bul ve stillendir
          const valueEl = scoreElement.querySelector('.result-stat-value, .stat-value');
          if (valueEl) {
            valueEl.style.fontSize = '3rem';
            valueEl.style.fontWeight = 'bold';
            valueEl.style.color = '#6a5ae0';
            valueEl.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
            valueEl.style.padding = '20px 0';
          }
          
          // İkonu bul ve stillendir
          const iconEl = scoreElement.querySelector('i');
          if (iconEl) {
            iconEl.style.fontSize = '2.5rem';
            iconEl.style.color = '#6a5ae0';
            iconEl.style.margin = '10px 0';
          }
        }
      });
      
      // Tüm skor değerlerine stil uygula
      SCORE_SELECTORS.forEach(selector => {
        const scoreElements = document.querySelectorAll(selector);
        scoreElements.forEach(element => {
          if (element) {
            element.style.fontSize = '3rem';
            element.style.fontWeight = 'bold';
            element.style.color = '#6a5ae0';
          }
        });
      });
      
      // Derecelendirme yıldızlarını gizle
      const ratingElements = document.querySelectorAll('.results-rating, .rating-stars, .rating-text');
      ratingElements.forEach(element => {
        if (element) {
          element.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('İstatistik temizleme hatası:', error);
    }
  }
  
  // DOM değişikliklerini izle
  function setupMutationObserver() {
    try {
      // MutationObserver oluştur
      const observer = new MutationObserver(function(mutations) {
        let needsCleaning = false;
        
        mutations.forEach(function(mutation) {
          // Eklenen nodlarda result, game-over, stat gibi classları kontrol et
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Class name kontrolü
                const className = node.className || '';
                if (typeof className === 'string' && 
                    (className.indexOf('result') !== -1 || 
                     className.indexOf('stat') !== -1 || 
                     className.indexOf('score') !== -1 || 
                     className.indexOf('game-over') !== -1)) {
                  needsCleaning = true;
                  break;
                }
              }
            }
          }
          
          // Display değişikliklerini kontrol et (görünür hale gelen elemanlar)
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' && 
              mutation.target.style && 
              (mutation.target.style.display === 'block' || 
               mutation.target.style.display === 'flex')) {
            const className = mutation.target.className || '';
            if (typeof className === 'string' && 
                (className.indexOf('result') !== -1 || 
                 className.indexOf('game-over') !== -1)) {
              needsCleaning = true;
            }
          }
        });
        
        // Temizlik gerekiyorsa çalıştır
        if (needsCleaning) {
          cleanAllStatElements();
        }
      });
      
      // Tüm DOM'u izle
      observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['style', 'class'] 
      });
    } catch (error) {
      console.error('MutationObserver hatası:', error);
      // Hata durumunda düzenli aralıklarla tekrar dene
      setInterval(cleanAllStatElements, 500);
    }
  }
  
  // Skor API isteklerini dinle
  function setupScoreListeners() {
    // API yanıtlarını dinle
    document.addEventListener('scoreApiResponse', function(e) {
      if (e.detail && e.detail.data) {
        // API'den gelen gerçek skoru al
        const data = e.detail.data;
        const realScore = data.points?.total || data.score || 0;
        
        console.log('API skor yanıtı alındı:', realScore);
        
        // Tüm stat temizleme işlemini yap
        cleanAllStatElements();
        
        // Skor değerlerini güncelle
        setTimeout(function() {
          updateScoreValues(realScore);
        }, 100);
      }
    });
    
    // Skor kaydetme işlemini yeniden tanımla (varsa)
    if (window.ScoreHandler && window.ScoreHandler.saveScore) {
      const origSaveMethod = window.ScoreHandler.saveScore;
      
      window.ScoreHandler.saveScore = function() {
        // Orijinal metodu çağır
        const result = origSaveMethod.apply(this, arguments);
        
        // Promise dönüyorsa dinle
        if (result && typeof result.then === 'function') {
          result.then(function(data) {
            if (data && data.success) {
              // scoreApiResponse eventini manuel olarak tetikle
              document.dispatchEvent(new CustomEvent('scoreApiResponse', {
                detail: { data: data }
              }));
              
              // İstatistik ekranlarını tekrar temizle
              setTimeout(cleanAllStatElements, 200);
              setTimeout(cleanAllStatElements, 500);
              setTimeout(cleanAllStatElements, 1000);
            }
          });
        }
        
        return result;
      };
    }
  }
  
  // Skor değerlerini güncelle
  function updateScoreValues(score) {
    try {
      // Tüm skor gösterge elementlerini bul
      SCORE_SELECTORS.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.textContent) {
            // Mevcut değeri al
            const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
            
            // Animasyonlu geçiş yap
            animateScoreValue(element, currentValue, score);
          }
        });
      });
    } catch (error) {
      console.error('Skor güncelleme hatası:', error);
    }
  }
  
  // Skor değeri animasyonu
  function animateScoreValue(element, startValue, endValue) {
    try {
      // Animasyon için gereken değişkenler
      const duration = 1000; // 1 saniye
      const startTime = performance.now();
      
      // Animasyon fonksiyonu
      function updateValue(timestamp) {
        // Geçen süreyi hesapla
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Yumuşak easing efekti
        const easing = 1 - Math.pow(1 - progress, 3);
        
        // Mevcut değeri hesapla
        const currentValue = Math.round(startValue + (endValue - startValue) * easing);
        
        // Elementi güncelle
        element.textContent = currentValue;
        
        // Animasyon devam ediyorsa tekrar çağır
        if (progress < 1) {
          requestAnimationFrame(updateValue);
        }
      }
      
      // Animasyonu başlat
      requestAnimationFrame(updateValue);
    } catch (error) {
      console.error('Animasyon hatası:', error);
      // Hata durumunda doğrudan değeri ata
      if (element) element.textContent = endValue;
    }
  }
  
  // Global olarak erişilebilir fonksiyonlar
  window.StatCleaner = {
    clean: cleanAllStatElements,
    updateScore: updateScoreValues
  };
})();