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
  }

  // Global fonksiyonlar
  window.GameResultsHandler = {
    cleanupResults: initGameResults
  };

})();