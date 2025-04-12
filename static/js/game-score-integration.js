
/**
 * Tüm oyunlar için puan sistemi entegrasyonu
 * Bu modül, oyunların puanlarını hesaplamak ve kaydetmek için ortak bir arayüz sağlar
 * @version 1.1.0
 */

// Oyun puanlama sisteminin hazır olup olmadığını kontrol et
const isScoreSystemReady = () => {
  return typeof window.ScoreCalculator !== 'undefined' && 
         typeof window.calculateAndSaveScore !== 'undefined' &&
         typeof window.calculateAndDisplayScore !== 'undefined';
};

// Puan sistemi hazır değilse konsola uyarı gönder
if (!isScoreSystemReady()) {
  console.warn("Puanlama sistemi bileşenleri yüklenemedi. Puanlar kaydedilemeyebilir.");
}

/**
 * GameScoreIntegration sınıfı
 * Oyun skorlarını standart hale getirme, hesaplama ve kaydetme işlemlerini yönetir
 */
class GameScoreIntegration {
  /**
   * GameScoreIntegration yapıcı fonksiyonu
   * @param {Object} options - Ayarlar
   * @param {string} options.gameType - Oyun tipi (wordle, puzzle, memoryCards vb.)
   * @param {string} options.difficulty - Zorluk seviyesi (easy, medium, hard, expert)
   * @param {number} options.maxScore - Oyunun maksimum ham puanı
   * @param {number} options.optimalMoves - Optimal hamle sayısı (varsa)
   * @param {number} options.optimalTime - Optimal tamamlama süresi (saniye, varsa)
   * @param {number} options.expectedTime - Beklenen tamamlama süresi (saniye, varsa)
   */
  constructor(options = {}) {
    this.gameType = options.gameType || 'unknown_game';
    this.difficulty = options.difficulty || 'medium';
    this.maxScore = options.maxScore || 100;
    this.optimalMoves = options.optimalMoves || null;
    this.optimalTime = options.optimalTime || null;
    this.expectedTime = options.expectedTime || null;

    // Oyun metrikleri
    this.startTime = Date.now();
    this.endTime = null;
    this.moves = 0;
    this.hintsUsed = 0;
    this.score = 0;
    this.completed = false;
    this.accuracy = null;
    this.combo = 0;

    console.log(`Puan sistemi başlatıldı: ${this.gameType} oyunu, ${this.difficulty} zorluk`);
  }

  /**
   * Oyun metriklerini günceller
   * @param {Object} metrics - Güncellenecek oyun metrikleri
   */
  updateMetrics(metrics = {}) {
    // Değerleri güncelle
    if (metrics.moves !== undefined) this.moves = metrics.moves;
    if (metrics.hintsUsed !== undefined) this.hintsUsed = metrics.hintsUsed;
    if (metrics.score !== undefined) this.score = metrics.score;
    if (metrics.accuracy !== undefined) this.accuracy = metrics.accuracy;
    if (metrics.combo !== undefined) this.combo = metrics.combo;
    if (metrics.completed !== undefined) this.completed = metrics.completed;

    return this;
  }

  /**
   * Hamle sayısını artırır
   * @param {number} count - Artış miktarı
   */
  incrementMoves(count = 1) {
    this.moves += count;
    return this;
  }

  /**
   * Kullanılan ipucu sayısını artırır
   * @param {number} count - Artış miktarı
   */
  incrementHints(count = 1) {
    this.hintsUsed += count;
    return this;
  }

  /**
   * Kombo sayısını günceller
   * @param {number} combo - Yeni kombo değeri
   */
  updateCombo(combo) {
    this.combo = combo;
    return this;
  }

  /**
   * Ham puanı günceller
   * @param {number} score - Yeni puan değeri
   */
  updateScore(score) {
    this.score = score;
    return this;
  }

  /**
   * Doğruluk oranını günceller
   * @param {number} accuracy - Doğruluk oranı (0-1 arası)
   */
  updateAccuracy(accuracy) {
    this.accuracy = Math.max(0, Math.min(1, accuracy));
    return this;
  }

  /**
   * Oyunu tamamlandı olarak işaretler ve bitiş zamanını kaydeder
   * @param {boolean} completed - Tamamlanma durumu
   */
  setCompleted(completed = true) {
    this.completed = completed;
    this.endTime = Date.now();
    return this;
  }

  /**
   * Oyun verilerini toplayıp hazırlayan yardımcı metot
   * @returns {Object} Hazırlanan oyun verileri
   */
  getGameData() {
    // Oyun süresini hesapla (saniye)
    const timeSpent = Math.round(((this.endTime || Date.now()) - this.startTime) / 1000);

    // Tamamlanma yüzdesini hesapla (tamamlanmış ise 1, değilse 0.5)
    const completionPercentage = this.completed ? 1.0 : 0.5;

    // Puan hesaplama için veri hazırla
    return {
      gameType: this.gameType,
      difficulty: this.difficulty,
      timeSpent: timeSpent,
      expectedTime: this.expectedTime,
      optimalTime: this.optimalTime,
      moves: this.moves,
      optimalMoves: this.optimalMoves,
      hintsUsed: this.hintsUsed,
      accuracy: this.accuracy,
      completionPercentage: completionPercentage,
      score: this.score,
      maxScore: this.maxScore,
      combo: this.combo,
      completed: this.completed
    };
  }

  /**
   * Zorluk seviyesini günceller
   * @param {string} difficulty - Zorluk seviyesi (easy, medium, hard, expert)
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    return this;
  }

  /**
   * Oyun tipini günceller
   * @param {string} gameType - Oyun tipi
   */
  setGameType(gameType) {
    this.gameType = gameType;
    return this;
  }

  /**
   * Oyun istatistiklerini hesaplar ve puanı kaydeder
   * @param {Function} callback - Sonuç HTML'i ile çağrılacak fonksiyon
   */
  saveScore(callback) {
    try {
      if (!isScoreSystemReady()) {
        console.error("Puanlama sistemi hazır değil, puanlar kaydedilemedi!");
        return;
      }

      // Oyun henüz tamamlanmadıysa bitiş zamanını şimdi ayarla
      if (!this.endTime) {
        this.endTime = Date.now();
      }

      // Oyun verilerini hazırla
      const gameData = this.getGameData();

      console.log(`Oyun verileri hesaplanıyor:`, gameData);

      // Standart puan hesaplama ve görüntüleme
      window.calculateAndDisplayScore(gameData, (scoreHtml, data) => {
        console.log("Skor başarıyla kaydedildi, kullanıcı verilerine yükleniyor...");

        // DOM'da göster ve etkinlik dinleyicileri ekle
        this.displayScoreInDom(scoreHtml, data);

        if (typeof callback === 'function') {
          callback(scoreHtml, data);
        }

        // Liderlik tablosunu ve profil puanlarını güncelle
        if (typeof window.updateScoreBoard === 'function') {
          window.updateScoreBoard(this.gameType);
        }
      });
    } catch (error) {
      console.error("Puan hesaplama hatası:", error);
    }
  }

  /**
   * Skor ekranını DOM'a yerleştirir ve gösterir
   * @param {string} scoreHtml - Skor ekranı HTML içeriği
   * @param {Object} data - Skor verileri
   * @private
   */
  displayScoreInDom(scoreHtml, data) {
    if (!scoreHtml || scoreHtml.trim() === '') {
      console.error('Skor görüntüsü oluşturulamadı!');
      return;
    }

    console.log('Skor ekranı oluşturuldu, DOM\'a ekleniyor...');

    // Daha önce açık bir skor ekranı varsa kaldır
    const existingOverlay = document.querySelector('.game-result-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // HTML içeriğini ekle
    document.body.insertAdjacentHTML('beforeend', scoreHtml);

    // Ekranı görünür yap
    setTimeout(() => {
      const overlay = document.querySelector('.game-result-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        console.log('Skor ekranı başarıyla gösterildi');

        // Etkinlik dinleyicileri ekle
        this.addScoreScreenEventListeners(data);
      } else {
        console.error('Skor ekranı DOM\'a eklendi ama bulunamadı!');
      }
    }, 100);
  }

  /**
   * Skor ekranı etkinlik dinleyicilerini ekler
   * @param {Object} scoreData - Skor verileri
   * @private
   */
  addScoreScreenEventListeners(scoreData) {
    try {
      // Kapat düğmesi
      const closeBtn = document.querySelector('.game-result-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          const overlay = document.querySelector('.game-result-overlay');
          if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
          }
        });
      }

      // Yeniden oyna düğmesi
      const replayBtn = document.querySelector('.game-result-replay');
      if (replayBtn) {
        replayBtn.addEventListener('click', function() {
          location.reload();
        });
      }

      // Ana sayfa düğmesi
      const homeBtn = document.querySelector('.game-result-home');
      if (homeBtn) {
        homeBtn.addEventListener('click', function() {
          window.location.href = '/';
        });
      }

      // Liderlik tablosu düğmesi
      const leaderboardBtn = document.querySelector('.game-result-leaderboard');
      if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', function() {
          window.location.href = '/leaderboard?game=' + (scoreData.game_type || '');
        });
      }

      // Paylaş düğmesi
      const shareBtn = document.querySelector('.game-result-share');
      if (shareBtn) {
        shareBtn.addEventListener('click', function() {
          if (navigator.share) {
            navigator.share({
              title: 'Oyun Skorumu Gör!',
              text: `${scoreData.game_name || 'Oyun'} skorumu gör: ${scoreData.score} puan!`,
              url: window.location.href,
            })
            .catch((error) => console.log('Paylaşım hatası:', error));
          } else {
            alert('Skorun: ' + scoreData.score + ' puan!');
          }
        });
      }

      // Kopyala düğmesi
      const copyScoreBtn = document.querySelector('.game-result-copy');
      if (copyScoreBtn) {
        copyScoreBtn.addEventListener('click', function() {
          const scoreText = `${scoreData.game_name || 'Oyun'} skorumu gör: ${scoreData.score} puan!`;
          navigator.clipboard.writeText(scoreText)
            .then(() => {
              const originalText = copyScoreBtn.textContent;
              copyScoreBtn.textContent = 'Kopyalandı!';
              setTimeout(() => {
                copyScoreBtn.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Panoya kopyalama hatası:', err);
            });
        });
      }

      console.log('Skor ekranı etkinlik dinleyicileri eklendi');
    } catch (error) {
      console.error('Etkinlik dinleyicileri eklenirken hata:', error);
    }
  }

  /**
   * Oyun sonu puanını hesaplar ve görüntüler
   * @param {boolean} finalScore - Final puanı mı?
   * @param {Function} callback - Sonuç HTML'i ile çağrılacak fonksiyon
   */
  endGame(finalScore = true, callback) {
    // Oyunu tamamlandı olarak işaretle
    this.setCompleted(finalScore);

    // Puanı kaydet ve göster
    this.saveScore(callback);
  }

  /**
   * Oyunu yeniden başlatır
   */
  restart() {
    this.startTime = Date.now();
    this.endTime = null;
    this.moves = 0;
    this.hintsUsed = 0;
    this.score = 0;
    this.completed = false;
    this.accuracy = null;
    this.combo = 0;

    return this;
  }

  /**
   * Ham puan hesaplama (yardımcı metot)
   * @param {number} currentScore - Mevcut ham puan
   * @param {number} maxScore - Maksimum ham puan
   * @param {number} timeBonus - Zaman bonusu
   * @param {number} accuracyBonus - Doğruluk bonusu
   * @returns {number} Hesaplanan ham puan
   */
  static calculateRawScore(currentScore, maxScore, timeBonus = 0, accuracyBonus = 0) {
    // Mevcut puanı maksimum puana oranlayarak 0-100 arasında bir değer elde et
    const normalizedScore = (currentScore / maxScore) * 100;

    // Bonus puanları ekle
    let finalScore = normalizedScore + timeBonus + accuracyBonus;

    // 0-100 arasında sınırla
    return Math.max(0, Math.min(100, finalScore));
  }
}

// Global erişim için window nesnesine ekle
window.GameScoreIntegration = GameScoreIntegration;
