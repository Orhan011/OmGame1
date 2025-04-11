/**
 * Oyun Sonuçları İşleyici
 * 
 * Bu script, oyun sonundaki istatistik ekranını düzenlemeye yarar.
 * Rastgele puanların gösterilmesini engeller ve sadece gerçek puanları gösterir.
 */
(function() {
  // DOM yüklendiğinde çalışacak
  document.addEventListener('DOMContentLoaded', function() {
    // Tüm oyun sonucu istatistik elementlerini bul
    initGameResults();
    // Skor API yanıtını dinle
    listenForScoreApiResponse();
  });

  /**
   * Oyun sonuç ekranındaki istatistikleri temizler ve sadece gerçek puanların gösterilmesini sağlar
   */
  function initGameResults() {
    // Sayfadaki tüm istatistik ekranlarını bul
    const resultStats = document.querySelectorAll('.results-stats, .game-result-stats');
    
    // Her bir istatistik ekranı için işlem yap
    resultStats.forEach(statsContainer => {
      // Rastgele istatistik elementlerini bul (sadece puan içerenler hariç)
      const statElements = statsContainer.querySelectorAll('.result-stat');
      
      // Sadece gerçek puan elementini bul ve sadece onu göster
      let scoreElement = null;
      
      // Tüm istatistik elementlerini kontrol et
      statElements.forEach(statElement => {
        const statLabel = statElement.querySelector('.result-stat-label');
        const labelText = statLabel ? statLabel.textContent.toLowerCase() : '';
        
        // Eğer bu element puan gösteriyorsa, saklayalım
        if (labelText.includes('puan') || labelText.includes('skor') || labelText.includes('toplam puan')) {
          scoreElement = statElement;
        } else {
          // Puan olmayan elementleri gizle
          statElement.style.display = 'none';
        }
      });
      
      // Eğer puan elemanı yoksa ekranı tamamen gizleyelim
      if (!scoreElement && statsContainer.parentElement) {
        statsContainer.style.display = 'none';
      } else if (scoreElement) {
        // Puan elemanının görünümünü düzenle, tam ekranı kaplasın
        scoreElement.style.flex = '1';
        scoreElement.style.textAlign = 'center';
        
        // Diğer istatistik elementleri için ekstra bir temizleme yapalım
        const otherStats = statsContainer.querySelectorAll('.result-stat:not(:first-child)');
        otherStats.forEach(stat => {
          stat.style.display = 'none';
        });
      }
    });
    
    // Yıldız derecelendirme elementlerini temizleyelim
    const ratingElements = document.querySelectorAll('.results-rating, .rating-stars, .rating-text');
    ratingElements.forEach(element => {
      element.style.display = 'none';
    });

    // Puan animasyonunu da düzeltelim
    fixFinalScoreAnimations();
  }

  /**
   * Final skor gösterimi ve animasyonlarını düzeltir
   */
  function fixFinalScoreAnimations() {
    // Sayfadaki tüm final skor elementlerini bul
    const finalScoreElements = document.querySelectorAll('#final-score, #finalScore, .final-score, .game-result-score');
    
    finalScoreElements.forEach(element => {
      // Stil düzenlemeleri
      if (element) {
        element.style.fontSize = '3rem';
        element.style.fontWeight = 'bold';
        element.style.color = '#6a5ae0';
        element.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
      }
    });
  }

  /**
   * Skor API yanıtını dinler ve gerçek skor değerlerini ekranda günceller
   */
  function listenForScoreApiResponse() {
    // API yanıtı için özel bir event dinleyici ekle
    document.addEventListener('scoreApiResponse', function(e) {
      if (e.detail && e.detail.data) {
        const data = e.detail.data;
        
        // Gerçek skoru al
        const realScore = data.points?.total || data.score || 0;
        
        // Sayfadaki tüm skor gösterge elemanlarını güncelle
        updateAllScoreDisplays(realScore);
      }
    });

    // ScoreHandler fonksiyonunu genişlet - sunucudan gelen skorları yakalama
    if (window.ScoreHandler) {
      const origSaveScore = window.ScoreHandler.saveScore;
      
      // ScoreHandler'ın saveScore metodunu extend et
      window.ScoreHandler.saveScore = function() {
        // Orijinal metodu çağır
        const result = origSaveScore.apply(this, arguments);
        
        // Yanıt promise'ini dinle ve skorları yakala
        if (result && typeof result.then === 'function') {
          result.then(data => {
            if (data && data.success) {
              // API yanıtını yayınla
              document.dispatchEvent(new CustomEvent('scoreApiResponse', {
                detail: { data: data }
              }));
            }
          }).catch(error => {
            console.error('Score API error:', error);
          });
        }
        
        return result;
      };
    }
  }

  /**
   * Tüm skor gösterge elemanlarını gerçek skorla günceller
   */
  function updateAllScoreDisplays(score) {
    // Sayfadaki tüm skor gösterge elemanlarını bul ve güncelle
    const scoreElements = document.querySelectorAll('#final-score, #finalScore, .final-score, .game-result-score, [id$="-score"]');
    
    scoreElements.forEach(element => {
      if (element) {
        // Animasyonlu geçiş için mevcut değeri al
        const currentValue = parseInt(element.textContent) || 0;
        
        // Animasyonlu geçiş efekti
        animateScoreChange(element, currentValue, score);
      }
    });
  }

  /**
   * Skorun animasyonlu geçişini sağlar
   */
  function animateScoreChange(element, startValue, endValue) {
    const duration = 1000; // 1 saniye
    const start = performance.now();
    
    function updateScore(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing fonksiyonu (yavaşlayan animasyon)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      // Skoru hesapla ve güncelle
      const currentScore = Math.floor(startValue + (endValue - startValue) * easedProgress);
      element.textContent = currentScore;
      
      // Animasyon tamamlanmadıysa devam et
      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    }
    
    requestAnimationFrame(updateScore);
  }

  // Global fonksiyonlar
  window.GameResultsHandler = {
    cleanupResults: initGameResults,
    updateScoreDisplay: updateAllScoreDisplays
  };

})();