/**
 * ScoreFixer.js - Oyun sonuç ekranlarındaki rastgele puanları temizleyen araç
 * 
 * Bu script, oyun sonunda görünen rastgele istatistikleri tamamen kaldırır
 * ve sadece backend API'den gelen gerçek skoru gösterir.
 */
(function() {
  // Gerçek skor değeri - API'den alınacak
  let realScore = null;
  
  // Sayfa yüklendiğinde başla
  document.addEventListener('DOMContentLoaded', function() {
    console.log("ScoreFixer başlatıldı");
    
    // İlk temizlemeyi yap
    setTimeout(cleanupRandomScores, 500);
    
    // API yanıtını dinle
    setupApiListener();
    
    // DOM değişikliklerini izle
    observeResultsDisplay();
  });
  
  // Interval ile periyodik olarak kontrol et - bu yaklaşım ek güvenlik sağlar
  setInterval(cleanupRandomScores, 1000);
  
  /**
   * API yanıtını dinleyerek gerçek skoru yakala
   */
  function setupApiListener() {
    // ScoreHandler.saveScore metodunu yakala
    if (window.ScoreHandler && window.ScoreHandler.saveScore) {
      const originalSaveScore = window.ScoreHandler.saveScore;
      
      window.ScoreHandler.saveScore = function() {
        // Skoru kaydet
        const result = originalSaveScore.apply(this, arguments);
        
        // Score API yanıtını izle
        if (result && typeof result.then === 'function') {
          result.then(function(data) {
            if (data && data.success) {
              // Gerçek skoru al - API yanıtı
              realScore = data.points?.total || data.score || 0;
              console.log("API'den gerçek skor alındı:", realScore);
              
              // Skoru temizle ve güncelle
              cleanupRandomScores();
            }
          });
        }
        
        return result;
      };
    }
  }
  
  /**
   * Sonuç ekranlarının görüntülenmesini izle
   */
  function observeResultsDisplay() {
    // MutationObserver kullanarak DOM değişikliklerini takip et
    const observer = new MutationObserver(function(mutations) {
      let shouldCleanup = false;
      
      mutations.forEach(function(mutation) {
        // Yeni eklenen elementleri kontrol et
        if (mutation.addedNodes && mutation.addedNodes.length) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            
            // Element türündeki nodeları kontrol et
            if (node.nodeType === 1) {
              // Sonuç/istatistik ekranı olup olmadığını kontrol et
              if (node.className && typeof node.className === 'string') {
                if (node.className.indexOf('result') !== -1 || 
                    node.className.indexOf('score') !== -1 || 
                    node.className.indexOf('game-over') !== -1 || 
                    node.className.indexOf('stats') !== -1) {
                  shouldCleanup = true;
                  break;
                }
              }
            }
          }
        }
        
        // Görünür hale gelen elementleri kontrol et
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target.style) {
          if (mutation.target.style.display === 'block' || 
              mutation.target.style.display === 'flex' || 
              mutation.target.style.visibility === 'visible') {
            
            // Element sonuç/istatistik ekranı mı?
            if (mutation.target.className && typeof mutation.target.className === 'string') {
              if (mutation.target.className.indexOf('result') !== -1 || 
                  mutation.target.className.indexOf('score') !== -1 || 
                  mutation.target.className.indexOf('game-over') !== -1 || 
                  mutation.target.className.indexOf('stats') !== -1) {
                shouldCleanup = true;
              }
            }
          }
        }
      });
      
      // Eğer temizleme gerekiyorsa yap
      if (shouldCleanup) {
        cleanupRandomScores();
      }
    });
    
    // Tüm DOM'u izle
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  /**
   * Oyun sonuç ekranındaki tüm rastgele puanları temizler
   */
  function cleanupRandomScores() {
    // Sonuç konteynerlerini bul
    const resultContainers = document.querySelectorAll(
      '.game-over, .result-screen, .score-display, ' +
      '.game-result, .results-stats, .game-result-stats, ' +
      '.game-stats, .score-stats, .stats-container'
    );
    
    resultContainers.forEach(function(container) {
      // Bu konteyner zaten temizlendi mi?
      if (container.hasAttribute('data-cleaned')) {
        return;
      }
      
      // İstatistik elemanlarını bul
      const statElements = container.querySelectorAll('.stat, .result-stat, .game-stat');
      let scoreElement = null;
      
      // İstatistik elemanlarını işle
      for (let i = 0; i < statElements.length; i++) {
        const stat = statElements[i];
        const text = stat.textContent.toLowerCase();
        
        // Skor/puan içeren istatistiği bul
        if (text.indexOf('puan') !== -1 || 
            text.indexOf('skor') !== -1 || 
            text.indexOf('point') !== -1 || 
            text.indexOf('score') !== -1) {
          scoreElement = stat;
        } else {
          // Diğer istatistik elemanlarını gizle
          stat.style.display = 'none';
        }
      }
      
      // Skor elementi bulunduysa
      if (scoreElement) {
        // Değer elemanını bul
        const valueElement = scoreElement.querySelector('.stat-value, .result-stat-value, span[data-value]');
        
        if (valueElement) {
          // Stil düzenlemeleri
          valueElement.style.fontSize = '3rem';
          valueElement.style.fontWeight = 'bold';
          valueElement.style.color = '#6a5ae0';
          valueElement.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
          
          // Gerçek skor ile değiştir - eğer biliniyorsa
          if (realScore !== null) {
            // Animasyonlu geçiş
            animateScoreChange(valueElement, parseInt(valueElement.textContent) || 0, realScore);
          }
        }
        
        // Merkezi göster
        scoreElement.style.display = 'flex';
        scoreElement.style.justifyContent = 'center';
        scoreElement.style.alignItems = 'center';
        scoreElement.style.flexDirection = 'column';
        scoreElement.style.width = '100%';
        scoreElement.style.textAlign = 'center';
      }
      
      // Derecelendirme yıldızlarını gizle
      const ratingElements = container.querySelectorAll('.rating, .rating-stars, .rating-text');
      for (let i = 0; i < ratingElements.length; i++) {
        ratingElements[i].style.display = 'none';
      }
      
      // Bu konteyner temizlendi olarak işaretle
      container.setAttribute('data-cleaned', 'true');
    });
    
    // Final skor elementlerini bul ve güncelle
    updateFinalScoreElements();
  }
  
  /**
   * Final skor elementlerini günceller
   */
  function updateFinalScoreElements() {
    // Final skor elementlerini bul
    const finalScoreElements = document.querySelectorAll(
      '#final-score, .final-score, #finalScore, .game-result-score, [id$="-score"]'
    );
    
    finalScoreElements.forEach(function(element) {
      // Stilini düzenle
      element.style.fontSize = '3rem';
      element.style.fontWeight = 'bold';
      element.style.color = '#6a5ae0';
      element.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
      
      // Gerçek skor varsa güncelle
      if (realScore !== null) {
        // Mevcut değeri al
        const currentValue = parseInt(element.textContent) || 0;
        
        // Eğer gerçek skordan çok farklıysa güncelle
        if (Math.abs(currentValue - realScore) > 5) {
          animateScoreChange(element, currentValue, realScore);
        }
      }
    });
  }
  
  /**
   * Skor değerini animasyonlu şekilde değiştirir
   */
  function animateScoreChange(element, startValue, endValue) {
    if (!element) return;
    
    // Değerler aynıysa işlem yapma
    if (startValue === endValue) return;
    
    const duration = 1000; // 1 saniye
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Yavaşlayan hareket
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      // Geçerli değeri hesapla
      const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
      
      // Elementi güncelle
      element.textContent = currentValue;
      
      // Animasyon devam ediyorsa sonraki kareyi çiz
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    // Animasyonu başlat
    requestAnimationFrame(update);
  }
  
  // Global erişim
  window.ScoreFixer = {
    setRealScore: function(score) {
      realScore = score;
      cleanupRandomScores();
    },
    cleanup: cleanupRandomScores
  };
})();