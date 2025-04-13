/**
 * ScoreHandler - Oyun skorlarını yönetmek için API sınıfı
 * Bu modül, oyun skorlarını sunucuya göndermek, göstermek ve yerel olarak saklamak için kullanılır.
 */

window.ScoreHandler = (function() {
  // Zorluk seviyesi çarpanları
  const DIFFICULTY_MULTIPLIERS = {
    'easy': 0.8,
    'medium': 1.0,
    'hard': 1.3,
    'expert': 1.6
  };

  /**
   * Skoru sunucuya gönder
   * @param {string} gameType - Oyun türü
   * @param {number} score - Skor değeri
   * @param {string} difficulty - Zorluk seviyesi
   * @param {number} playtime - Oynama süresi (saniye)
   * @param {Object} gameStats - Oyun istatistikleri
   * @returns {Promise} - Skor kaydetme işleminin sonucunu içeren Promise
   */
  function saveScore(gameType, score, difficulty, playtime, gameStats = {}) {
    return new Promise((resolve, reject) => {
      console.log(`Saving score for ${gameType}: ${score} points, difficulty: ${difficulty}, playtime: ${playtime}s`);
      
      // API isteği için veri hazırla
      const scoreData = {
        game_type: gameType,
        score: score,
        difficulty: difficulty || 'medium',
        playtime: playtime || 0,
        game_stats: gameStats || {}
      };
      
      // API'ye POST isteği gönder
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log("Score saved successfully:", data);
          
          // Skor başarıyla kaydedildiyse bildirim ver
          if (window.showNotification) {
            window.showNotification(`Puanınız kaydedildi: ${score} puan`, { type: 'success' });
          }
          
          resolve(data);
        } else {
          console.warn("Score save failed:", data.message || "Unknown error");
          
          // Hata durumunda bildirim ver
          if (window.showNotification) {
            window.showNotification(`Puan kaydedilirken hata oluştu: ${data.message || "Bilinmeyen hata"}`, { type: 'error' });
          }
          
          reject(new Error(data.message || "Unknown error"));
        }
      })
      .catch(error => {
        console.error("Error saving score:", error);
        
        // Bağlantı hatası durumunda bildirim ver
        if (window.showNotification) {
          window.showNotification("Puan kaydedilirken bağlantı hatası oluştu", { type: 'error' });
        }
        
        reject(error);
      });
    });
  }

  /**
   * Zorluk seviyesi çarpanını getir
   * @param {string} difficulty - Zorluk seviyesi
   * @returns {number} - Çarpan değeri
   */
  function getDifficultyMultiplier(difficulty) {
    return DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
  }

  // API'yi dışa aktar
  return {
    saveScore,
    getDifficultyMultiplier,
    DIFFICULTY_MULTIPLIERS
  };
})();

// Compatibility layer for global saveScoreAndDisplay function
window.saveScoreAndDisplay = function(gameType, score, time, difficulty, gameStats = {}, callback) {
  console.log(`Global saveScoreAndDisplay: ${gameType}, ${score}, ${difficulty}`);
  
  if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
    window.ScoreHandler.saveScore(gameType, score, difficulty, time, gameStats)
      .then(data => {
        if (typeof callback === 'function') {
          // Puan özeti HTML'i oluştur
          let scoreHtml = '';
          if (data.success) {
            scoreHtml = `
              <div class="score-summary">
                <h3>Skor Özeti</h3>
                <div class="score-detail">
                  <span>Temel Puan:</span>
                  <span>${data.points?.base_points || score}</span>
                </div>
                <div class="score-detail">
                  <span>Zorluk Çarpanı:</span>
                  <span>x${window.ScoreHandler.getDifficultyMultiplier(difficulty)}</span>
                </div>
                <div class="score-detail total">
                  <span>Toplam:</span>
                  <span>${data.points?.total || score} puan</span>
                </div>
              </div>
            `;
          } else {
            scoreHtml = `
              <div class="score-summary guest">
                <p>Puanınız: ${score}</p>
                <p>Skorlarınızı kaydetmek ve liderlik tablosunda yer almak için giriş yapın veya kaydolun.</p>
                <a href="/login" class="btn btn-primary">Giriş Yap</a>
                <a href="/register" class="btn btn-outline-primary">Kayıt Ol</a>
              </div>
            `;
          }
          callback(scoreHtml);
        }
      })
      .catch(error => {
        console.error("Error in saveScoreAndDisplay:", error);
        if (typeof callback === 'function') {
          callback(`<div class="error-message">Puan kaydedilirken hata oluştu.</div>`);
        }
      });
  } else {
    console.warn("ScoreHandler not found, using direct API call");
    // Doğrudan API çağrısı
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score,
        difficulty: difficulty || 'medium',
        playtime: time || 0,
        game_stats: gameStats || {}
      })
    })
    .then(response => response.json())
    .then(data => {
      if (typeof callback === 'function') {
        // Basit skor özeti
        let html = `
          <div class="score-summary">
            <h3>Skor Özeti</h3>
            <div class="score-detail total">
              <span>Toplam:</span>
              <span>${score} puan</span>
            </div>
          </div>
        `;
        callback(html);
      }
    })
    .catch(error => {
      console.error("Error in direct API call:", error);
      if (typeof callback === 'function') {
        callback(`<div class="error-message">Puan kaydedilirken hata oluştu.</div>`);
      }
    });
  }
};