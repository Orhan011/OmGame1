
/**
 * ScoreDisplay - Oyun skorlarını görüntüleme için yardımcı fonksiyonlar
 * Bu modül, skorları görüntülemek için kullanılan yardımcı fonksiyonları içerir
 */

window.ScoreDisplay = (function() {
  /**
   * Puan özetini göster
   * @param {Object} data - API yanıtı veya skor verileri
   * @param {string} containerId - Puan özetinin gösterileceği container ID
   */
  function showScoreSummary(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }
    
    // ScoreHandler'dan HTML içeriği oluştur (varsa)
    let html = '';
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.createScoreSummaryHTML === 'function') {
      const originalScore = data.original_score || data.score || 0;
      const difficulty = data.difficulty || 'medium';
      html = window.ScoreHandler.createScoreSummaryHTML(data, originalScore, difficulty);
    } else {
      // Basit skor özeti
      const total = data.points?.total || data.score_info?.total_score || data.score || 0;
      html = `
        <div class="score-summary">
          <h3>Skor Özeti</h3>
          <div class="score-detail total">
            <span>Toplam Puan:</span>
            <span>${total}</span>
          </div>
        </div>
      `;
    }
    
    // HTML içeriğini ekle
    container.innerHTML = html;
    
    // Container'ı görünür yap
    container.style.display = 'block';
  }
  
  /**
   * Oyun skoru kaydet ve göster
   * @param {string} gameType - Oyun türü
   * @param {number} score - Ham skor değeri
   * @param {number} playtime - Oynama süresi (saniye)
   * @param {string} difficulty - Zorluk seviyesi
   * @param {Object} gameStats - Oyun istatistikleri
   * @param {string} containerId - Puan özetinin gösterileceği container ID
   */
  function saveAndShowScore(gameType, score, playtime, difficulty = 'medium', gameStats = {}, containerId) {
    // ScoreHandler ile skoru kaydet
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      window.ScoreHandler.saveScore(gameType, score, difficulty, playtime, gameStats)
        .then(data => {
          // Başarıyla kaydedilince puan özetini göster
          showScoreSummary(data, containerId);
        })
        .catch(error => {
          console.error("Score save error:", error);
          
          // Hata durumunda basit bir mesaj göster
          const container = document.getElementById(containerId);
          if (container) {
            container.innerHTML = `<div class="error-message">Puan kaydedilirken bir hata oluştu.</div>`;
            container.style.display = 'block';
          }
        });
    } else {
      console.warn("ScoreHandler not found, using legacy function");
      
      // Eski saveScoreAndDisplay fonksiyonunu kullan
      if (typeof window.saveScoreAndDisplay === 'function') {
        window.saveScoreAndDisplay(gameType, score, playtime, difficulty, gameStats, html => {
          const container = document.getElementById(containerId);
          if (container) {
            container.innerHTML = html;
            container.style.display = 'block';
          }
        });
      } else {
        console.error("No score saving function available");
      }
    }
  }
  
  /**
   * Standardize edilmiş puanı göster (0-100 arası)
   * @param {number} score - Standartlaştırılmış puan (0-100)
   * @param {string} elementId - Puanın gösterileceği element ID
   */
  function displayStandardizedScore(score, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      // Puanı göster
      element.textContent = score;
      
      // Puan aralığına göre renk ata
      if (score >= 90) {
        element.classList.add('score-excellent');
      } else if (score >= 75) {
        element.classList.add('score-great');
      } else if (score >= 60) {
        element.classList.add('score-good');
      } else if (score >= 40) {
        element.classList.add('score-average');
      } else if (score >= 20) {
        element.classList.add('score-below-average');
      } else {
        element.classList.add('score-poor');
      }
    }
  }

  // Dışa aktarılan API
  return {
    showScoreSummary,
    saveAndShowScore,
    displayStandardizedScore
  };
})();
