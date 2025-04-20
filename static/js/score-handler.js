
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
   * Skoru standardize et (0-100 arası)
   * @param {Object} params - Oyun parametreleri
   * @returns {Object} - Standardize edilmiş puan ve detaylar
   */
  function standardizeScore(params) {
    // ScoreCalculator modülünü kullan (varsa)
    if (typeof window.ScoreCalculator !== 'undefined') {
      return window.ScoreCalculator.calculate(params);
    }
    
    // Calculator yoksa, basit hesaplama yap
    const { 
      gameType, 
      score, 
      difficulty = 'medium'
    } = params;
    
    // Zorluk çarpanı
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    
    // Baz puan (0-80 arası)
    const baseScore = Math.min(80, Math.round(score));
    
    // Nihai puan (0-100 arası)
    const finalScore = Math.min(100, Math.round(baseScore * difficultyMultiplier));
    
    return {
      finalScore,
      breakdown: {
        baseScore,
        difficultyMultiplier,
        rawScore: baseScore * difficultyMultiplier
      }
    };
  }

  /**
   * Skoru sunucuya gönder
   * @param {string} gameType - Oyun türü
   * @param {number} score - Ham skor değeri
   * @param {string} difficulty - Zorluk seviyesi
   * @param {number} playtime - Oynama süresi (saniye)
   * @param {Object} gameStats - Oyun istatistikleri ve ek performans metrikleri
   * @returns {Promise} - Skor kaydetme işleminin sonucunu içeren Promise
   */
  function saveScore(gameType, score, difficulty, playtime, gameStats = {}) {
    return new Promise((resolve, reject) => {
      console.log(`Saving score for ${gameType}: ${score} points, difficulty: ${difficulty}, playtime: ${playtime}s`);
      
      // Standart 0-100 puanını hesapla
      const gameCompleted = gameStats.completed || (score > 0);
      const standardizedScore = standardizeScore({
        gameType, 
        score, 
        difficulty,
        timeSpent: playtime,
        maxTime: gameStats.maxTime || 0,
        correctAnswers: gameStats.correctAnswers || 0,
        totalQuestions: gameStats.totalQuestions || 0,
        hintsUsed: gameStats.hintsUsed || 0,
        moves: gameStats.moves || 0,
        gameCompleted: gameCompleted,
        streakDays: gameStats.streakDays || 0,
        socialActions: gameStats.socialActions || 0,
        gameSpecificStats: gameStats
      });
      
      console.log('Standardized score:', standardizedScore);
      
      // API isteği için veri hazırla
      const scoreData = {
        game_type: gameType,
        score: score, // Orijinal skor
        normalized_score: standardizedScore.finalScore, // 0-100 arası standardize edilmiş puan
        difficulty: difficulty || 'medium',
        playtime: playtime || 0,
        game_stats: {
          ...gameStats,
          score_breakdown: standardizedScore.breakdown,
          completed: gameCompleted
        }
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
            window.showNotification(`Puanınız kaydedildi: ${standardizedScore.finalScore} puan`, { type: 'success' });
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
   * Orijinal skoru göstergelik puana dönüştür (0-100 arası)
   * @param {string} gameType - Oyun türü
   * @param {number} score - Orijinal skor
   * @param {string} difficulty - Zorluk seviyesi
   * @returns {number} - 0-100 arası standardize edilmiş puan
   */
  function normalizeScore(gameType, score, difficulty = 'medium') {
    // ScoreCalculator modülünü kullan (varsa)
    if (typeof window.ScoreCalculator !== 'undefined') {
      return window.ScoreCalculator.calculateLegacy(gameType, score, difficulty).finalScore;
    }
    
    // Calculator yoksa, basit hesaplama yap
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    const baseScore = Math.min(80, Math.round(score)); // 0-80 arası
    return Math.min(100, Math.round(baseScore * difficultyMultiplier)); // 0-100 arası
  }

  /**
   * Puan özeti HTML'i oluştur
   * @param {Object} data - API yanıtı
   * @param {number} originalScore - Orijinal skor
   * @param {string} difficulty - Zorluk seviyesi
   * @returns {string} - HTML içeriği
   */
  function createScoreSummaryHTML(data, originalScore, difficulty) {
    if (data.success) {
      // Puan detaylarını al
      const points = data.points || {};
      const breakdown = points.rewards || {};
      const performanceScore = data.score_info?.performance_score || 0;
      const skillScore = data.score_info?.skill_score || 0;
      const socialScore = data.score_info?.social_score || 0;
      
      return `
        <div class="score-summary">
          <h3>Skor Özeti</h3>
          
          <div class="score-category">
            <h4>Performans (60%)</h4>
            <div class="score-detail">
              <span>Temel Puan:</span>
              <span>${breakdown.base_points || Math.round(originalScore * 0.5)}</span>
            </div>
            <div class="score-detail">
              <span>Oyun Skoru:</span>
              <span>${breakdown.score_points || Math.round(originalScore * 0.5)}</span>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: ${performanceScore}%;"></div>
            </div>
          </div>
          
          <div class="score-category">
            <h4>Beceri (30%)</h4>
            <div class="score-detail">
              <span>Zamanlama:</span>
              <span>${breakdown.time_factor || '+'} ${breakdown.time_bonus || (data.playtime ? Math.round(30 / data.playtime) : 5)}</span>
            </div>
            <div class="score-detail">
              <span>Doğruluk:</span>
              <span>${breakdown.accuracy || 'N/A'}</span>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: ${skillScore}%;"></div>
            </div>
          </div>
          
          <div class="score-category">
            <h4>Sosyal (10%)</h4>
            <div class="score-detail">
              <span>Giriş Zinciri:</span>
              <span>${breakdown.streak_bonus || 0}</span>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: ${socialScore}%;"></div>
            </div>
          </div>
          
          <div class="score-detail difficulty">
            <span>Zorluk Çarpanı:</span>
            <span>x${DIFFICULTY_MULTIPLIERS[difficulty] || 1.0}</span>
          </div>
          
          <div class="score-detail total">
            <span>Toplam:</span>
            <span>${points.total || data.score_info?.total_score || originalScore} puan</span>
          </div>
          
          <div class="xp-info">
            <span>Kazanılan XP:</span>
            <span>+${data.xp?.gain || 0}</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="score-summary guest">
          <p>Puanınız: ${normalizeScore('default', originalScore, difficulty)}/100</p>
          <p>Skorlarınızı kaydetmek ve liderlik tablosunda yer almak için giriş yapın veya kaydolun.</p>
          <div class="auth-buttons">
            <a href="/login" class="btn btn-primary">Giriş Yap</a>
            <a href="/register" class="btn btn-outline-primary">Kayıt Ol</a>
          </div>
        </div>
      `;
    }
  }

  // API'yi dışa aktar
  return {
    saveScore,
    normalizeScore,
    standardizeScore,
    DIFFICULTY_MULTIPLIERS,
    createScoreSummaryHTML
  };
})();

// Eski global saveScoreAndDisplay fonksiyonu için uyumluluk katmanı
window.saveScoreAndDisplay = function(gameType, score, time, difficulty, gameStats = {}, callback) {
  console.log(`Global saveScoreAndDisplay: ${gameType}, ${score}, ${difficulty}`);
  
  if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
    window.ScoreHandler.saveScore(gameType, score, difficulty, time, gameStats)
      .then(data => {
        if (typeof callback === 'function') {
          // ScoreHandler'ın HTML oluşturma fonksiyonunu kullan
          const scoreHtml = window.ScoreHandler.createScoreSummaryHTML(data, score, difficulty);
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
