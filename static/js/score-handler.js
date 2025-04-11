/**
 * Tüm oyunlar için ortak skor kaydetme ve gösterme modülü
 * Bu modül, oyunlarda kazanılan skorları hesaplamak, API'ye göndermek ve göstermek için kullanılır
 */

// ScoreHandler nesnesini global olarak tanımlıyoruz
// Daha önce tanımlanmış olabilir, bu yüzden kontrol ediyoruz
if (!window.ScoreHandler) {
  window.ScoreHandler = {
  /**
   * Oyun skorunu API'ye gönderir (standartlaştırılmış)
   * @param {string} gameType - Oyun türü (örn. "wordle", "tetris", "chess" vb.)
   * @param {number} score - Oyunda kazanılan puan
   * @param {string} difficulty - Zorluk seviyesi ("easy", "medium", "hard" veya "expert")
   * @param {number} playtime - Oyun süresi (saniye cinsinden)
   * @param {Object} gameStats - Oyun istatistikleri (opsiyonel)
   * @return {Promise} - API yanıtını içeren Promise nesnesi
   */
  saveScore: function(gameType, score, difficulty = "medium", playtime = 60, gameStats = {}) {
    // Score'u sayısal değere dönüştür
    if (typeof score !== 'number') {
      score = parseInt(score, 10) || 0;
    }

    // Standart skor aralığını uygula (10-100)
    score = Math.max(10, Math.min(100, score));

    // Zorluk seviyesi validasyonu
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(difficulty)) {
      difficulty = "medium"; // Varsayılan değer
    }

    // Oyun tipini belirle
    if (!gameType) {
      // URL'den oyun tipini çıkar
      const pathParts = window.location.pathname.split('/');
      const possibleGameType = pathParts[pathParts.length - 1].replace('.html', '');

      gameType = (possibleGameType && possibleGameType !== '') ? possibleGameType : "unknown_game";
    }

    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);

    // İstatistikleri doldur
    gameStats.timestamp = new Date().toISOString();
    gameStats.difficulty = gameStats.difficulty || difficulty;
    gameStats.standardized_score = score; // Her zaman standartlaştırılmış puanı ekle

    // API isteği verileri
    const data = {
      game_type: gameType,
      score: score, // Her zaman 10-100 arasında
      difficulty: difficulty,
      playtime: playtime,
      game_stats: gameStats
    };

    console.log(`Saving score for ${gameType}: ${score} points, difficulty: ${difficulty}`);

    // API'ye POST isteği
    return fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Score saved:", data);

      // Başarılı kaydetme
      if (data.success) {
        return data;
      } 
      // Misafir kullanıcı kontrolü
      else if (data.guest && data.login_required) {
        console.log("Score saved successfully");
        return data;
      }
      // Hata durumu
      else {
        console.error("Error saving score:", data.message || "Unknown error");
        return data;
      }
    })
    .catch(error => {
      console.error("Error saving score:", error);

      // Hata olsa bile UI'da kullanıcıya bildir
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Skor Kaydedilemedi',
          text: 'Skorunuz kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
      }

      return { success: false, message: "Error saving score" };
    });
  },

  /**
   * Zorluk seviyesine göre puan çarpanı döndürür
   * @param {string} difficulty - Zorluk seviyesi
   * @return {number} - Puan çarpanı
   */
  getDifficultyMultiplier: function(difficulty) {
    switch(difficulty) {
      case "easy": return 1.0;
      case "medium": return 1.5;
      case "hard": return 2.5;
      case "expert": return 4.0;
      default: return 1.0;
    }
  },

  /**
   * Oyun tipini standartlaştırır
   * @param {string} gameType - Oyun türü
   * @return {string} - Standartlaştırılmış oyun türü
   */
  standardizeGameType: function(gameType) {
    // Oyun tiplerini standartlaştırma
    const gameTypeMap = {
      // Farklı yazımları standartlaştırma
      'memory_match': 'memory_match',
      'memoryMatch': 'memory_match',
      'memory-match': 'memory_match',
      'memoryCards': 'memory_match',
      'memory-cards': 'memory_match',

      'wordPuzzle': 'word_puzzle',
      'word-puzzle': 'word_puzzle',
      'word_puzzle': 'word_puzzle',

      'numberSequence': 'number_sequence',
      'number-sequence': 'number_sequence',
      'number_sequence': 'number_sequence',

      'tetris': 'tetris',

      'wordle': 'wordle',

      'minesweeper': 'minesweeper',
      'mine-sweeper': 'minesweeper',
      'mine_sweeper': 'minesweeper',

      'hangman': 'hangman',

      'puzzle': 'puzzle',

      'sudoku': 'sudoku',

      'chess': 'chess',

      'colorMatch': 'color_match',
      'color-match': 'color_match',
      'color_match': 'color_match',

      'mathChallenge': 'math_challenge',
      'math-challenge': 'math_challenge',
      'math_challenge': 'math_challenge',

      'typingSpeed': 'typing_speed',
      'typing-speed': 'typing_speed',
      'typing_speed': 'typing_speed',

      'nBack': 'n_back',
      'n-back': 'n_back',
      'n_back': 'n_back',

      'audioMemory': 'audio_memory',
      'audio-memory': 'audio_memory',
      'audio_memory': 'audio_memory',

      'snake': 'snake_game',
      'snake_game': 'snake_game',
      'snake-game': 'snake_game',

      'puzzleSlider': 'puzzle_slider',
      'puzzle-slider': 'puzzle_slider',
      'puzzle_slider': 'puzzle_slider',

      'iqTest': 'iq_test',
      'iq-test': 'iq_test',
      'iq_test': 'iq_test',

      'simonSays': 'simon_says',
      'simon-says': 'simon_says',
      'simon_says': 'simon_says',

      'numberChain': 'number_chain',
      'number-chain': 'number_chain',
      'number_chain': 'number_chain',

      'labyrinth': 'labyrinth',
      '3dLabyrinth': 'labyrinth',
      '3d-labyrinth': 'labyrinth',
      '3d_labyrinth': 'labyrinth',

      'tangram': 'tangram',

      'brainGym': 'brain_gym',
      'brain-gym': 'brain_gym',
      'brain_gym': 'brain_gym',

      'crossword': 'crossword',

      'solitaire': 'solitaire'
    };

    // Eğer oyun tipi eşleşme tablosunda varsa standartlaştırılmış ismi döndür
    return gameTypeMap[gameType] || gameType;
  },

  /**
   * Oyun sonuç ekranını oluştur ve göster
   * @param {string} gameType - Oyun türü
   * @param {number} score - Standartlaştırılmış puan (10-100 arası)
   * @param {Object} scoreBreakdown - Puan detayları
   */
  showGameResult: function(gameType, score, scoreBreakdown = {}) {
    // Oyun istatistiklerini oluştur
    const gameStats = {
      game_type: gameType,
      score: score,
      score_breakdown: scoreBreakdown
    };

    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);

    // Zorluk seviyesini belirle (varsayılan: medium)
    const difficulty = scoreBreakdown.difficulty || "medium";

    // Oyun süresini belirle
    const playtime = scoreBreakdown.timeSpent || 60;

    // Skor kaydedici fonksiyonu çağır
    window.saveScoreAndDisplay(gameType, score, playtime, difficulty, gameStats, function(html, data) {
      // HTML içeriği varsa ekranda göster
      if (html) {
        // Sayfaya ekle
        document.body.insertAdjacentHTML('beforeend', html);

        // Buton işlevlerini ekle
        setTimeout(() => {
          // Kapat butonu
          const closeButtons = document.querySelectorAll('.close-result');
          if (closeButtons) {
            closeButtons.forEach(button => {
              button.addEventListener('click', () => {
                const overlay = document.querySelector('.game-result-overlay');
                if (overlay) overlay.remove();
              });
            });
          }

          // Tekrar oyna butonu
          const replayButtons = document.querySelectorAll('.replay-game');
          if (replayButtons) {
            replayButtons.forEach(button => {
              button.addEventListener('click', () => {
                const overlay = document.querySelector('.game-result-overlay');
                if (overlay) overlay.remove();

                // Özel restart fonksiyonu varsa çağır
                if (typeof window.restartGame === 'function') {
                  window.restartGame();
                } else {
                  // Yoksa sayfayı yenile
                  window.location.reload();
                }
              });
            });
          }
        }, 100);
      }
    });
  }
};
}

/**
 * Tüm oyunlar için standartlaştırılmış puan hesaplama fonksiyonu
 * @param {Object} gameParams - Oyun parametreleri
 * @param {function} callback - Sonuç ile çağrılacak callback
 */
function calculateGameScore(gameParams, callback) {
  // ScoreCalculator modülünün mevcut olup olmadığını kontrol et
  if (!window.ScoreCalculator) {
    console.error("ScoreCalculator hatası:", {});

    // Yedek puan hesaplama (fallback)
    const fallbackScore = Math.max(10, Math.min(100, Math.round(50 + Math.random() * 40)));

    if (typeof callback === 'function') {
      callback(fallbackScore, {
        baseScore: 50,
        difficultyMultiplier: 1.0,
        difficulty: gameParams.difficulty || 'medium'
      });
    }

    return fallbackScore;
  }

  try {
    // ScoreCalculator ile puan hesapla
    const scoreResult = window.ScoreCalculator.calculate(gameParams);
    console.log("Standartlaştırılmış puan hesaplandı:", scoreResult);

    // Sonuç geçerli mi kontrol et
    if (scoreResult && typeof scoreResult.finalScore === 'number') {
      // Callback'i çağır
      if (typeof callback === 'function') {
        callback(scoreResult.finalScore, scoreResult.breakdown);
      }

      return scoreResult.finalScore;
    } else {
      // Geçersiz sonuç, yedek puan hesapla
      console.error("Geçersiz skor sonucu:", scoreResult);
      const fallbackScore = Math.max(10, Math.min(100, Math.round(50 + Math.random() * 30)));

      if (typeof callback === 'function') {
        callback(fallbackScore, {
          baseScore: 50,
          difficultyMultiplier: 1.0,
          difficulty: gameParams.difficulty || 'medium',
          error: true
        });
      }

      return fallbackScore;
    }
  } catch (error) {
    console.error("Puan hesaplama hatası:", error);

    // Hata durumunda yedek puan hesapla
    const fallbackScore = Math.max(10, Math.min(100, Math.round(50 + Math.random() * 20)));

    if (typeof callback === 'function') {
      callback(fallbackScore, {
        baseScore: 50,
        difficultyMultiplier: 1.0,
        difficulty: gameParams.difficulty || 'medium',
        error: true
      });
    }

    return fallbackScore;
  }
}

/**
 * Tüm oyunlar için standartlaştırılmış skor kaydetme ve gösterme fonksiyonu
 * Tüm oyunlar sadece bu fonksiyonu kullanmalıdır
 * 
 * @param {string} gameType - Oyun türü
 * @param {number} score - Skor (ya da oyun puanı)
 * @param {number} playtime - Oynama süresi (saniye)
 * @param {string} difficulty - Zorluk seviyesi
 * @param {Object} gameStats - Oyun istatistikleri
 * @param {Function} callback - Skor gösterimi sonrası çağrılacak callback (opsiyonel)
 */
if (!window.saveScoreAndDisplay) {
  window.saveScoreAndDisplay = function(gameType, score, playtime, difficulty = "medium", gameStats = {}, callback) {
    try {
      // Oyun puanını standartlaştır (10-100 arası)
      const finalScore = Math.max(10, Math.min(100, score));

      // Oyun istatistiklerine puan detaylarını ekle
      if (!gameStats.score_details) {
        gameStats.score_details = {
          raw_score: score,
          standardized_score: finalScore,
          difficulty: difficulty
        };
      }

      // Puan ekranını oluştur ve göster
      const displayScoreAndCallback = function(data) {
        // Skor özeti HTML'i oluştur
        let scoreHtml = '';

        if (typeof window.createScoreDisplay === 'function') {
          scoreHtml = window.createScoreDisplay(data);
        } else {
          // Yedek basit HTML
          if (data.success) {
            scoreHtml = `
              <div class="game-result-overlay">
                <div class="game-result-container">
                  <h2>Oyun Tamamlandı!</h2>
                  <div class="score-value">${data.points?.total || finalScore} puan</div>
                  <button class="close-button">Kapat</button>
                </div>
              </div>
            `;
          } else if (data.guest) {
            scoreHtml = `
              <div class="game-result-overlay">
                <div class="game-result-container">
                  <h2>Oyun Tamamlandı!</h2>
                  <div class="score-value">${finalScore} puan</div>
                  <p>Skorunuzu kaydetmek için giriş yapın.</p>
                  <div class="button-group">
                    <a href="/login" class="login-button">Giriş Yap</a>
                    <button class="close-button">Kapat</button>
                  </div>
                </div>
              </div>
            `;
          }
        }

        // Callback varsa çalıştır
        if (typeof callback === 'function') {
          callback(scoreHtml, data);
        } else if (scoreHtml) {
          // Callback yoksa ve HTML varsa doğrudan göster
          document.body.insertAdjacentHTML('beforeend', scoreHtml);

          // Kapat butonu için olay dinleyicisi ekle
          setTimeout(() => {
            const closeButtons = document.querySelectorAll('.close-button, .close-result');
            if (closeButtons) {
              closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                  const overlay = document.querySelector('.game-result-overlay');
                  if (overlay) overlay.remove();
                });
              });
            }
          }, 100);
        }
      };

      // Skoru kaydet
      window.ScoreHandler.saveScore(gameType, finalScore, difficulty, playtime, gameStats)
        .then(data => {
          displayScoreAndCallback(data);
        })
        .catch(error => {
          console.error("Score saving error:", error);
          // Hata durumunda yine göster
          displayScoreAndCallback({ 
            success: false, 
            error: error.message,
            points: { total: finalScore },
            score_info: { 
              total_score: finalScore,
              game_type: gameType, 
              difficulty: difficulty 
            }
          });
        });
    } catch (e) {
      console.error("Error in saveScoreAndDisplay:", e);
      if (typeof callback === 'function') {
        callback('', { success: false, error: e.message });
      }
    }
  };
}

// Sadece gerçek puan sistemine dayanarak puan gösterir
if (!window.displayGameScore) {
  window.displayGameScore = function(params, callback) {
    // Oyun türünü belirle
    const gameType = params.gameType || window.location.pathname.split('/').pop().replace('.html', '');

    // ScoreCalculator kullanarak puanı hesapla
    calculateGameScore(params, function(finalScore, breakdown) {
      console.log(`Standartlaştırılmış puan: ${finalScore} (${gameType} oyunu için)`);

      // ScoreHandler üzerinden sonuç ekranını göster
      window.ScoreHandler.showGameResult(gameType, finalScore, {
        ...breakdown,
        difficulty: params.difficulty,
        timeSpent: params.timeSpent
      });

      // Callback varsa çağır
      if (typeof callback === 'function') {
        callback(finalScore, breakdown);
      }
    });
  };
}

// Global fonksiyonları dışa aktar
window.calculateGameScore = calculateGameScore;

/**
 * Oyun adını formatlar
 * @param {string} gameType - Oyun tipi
 * @return {string} Formatlanmış oyun adı
 */
function formatGameName(gameType) {
  const gameNames = {
    'wordPuzzle': 'Kelime Bulmaca',
    'word_puzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Eşleştirme',
    'memory_match': 'Hafıza Eşleştirme',
    'numberSequence': 'Sayı Dizisi',
    'number_sequence': 'Sayı Dizisi',
    'memoryCards': 'Hafıza Kartları',
    'memory_cards': 'Hafıza Kartları',
    'numberChain': 'Sayı Zinciri',
    'number_chain': 'Sayı Zinciri',
    'labyrinth': '3D Labirent',
    'puzzle': 'Bulmaca',
    'audioMemory': 'Sesli Hafıza',
    'audio_memory': 'Sesli Hafıza',
    'nBack': 'N-Back',
    'n_back': 'N-Back',
    '2048': '2048',
    'wordle': 'Wordle',
    'chess': 'Satranç',
    'snake_game': 'Yılan Oyunu',
    'snake': 'Yılan Oyunu',
    'puzzle_slider': 'Resim Bulmaca',
    'puzzleSlider': 'Resim Bulmaca',
    'minesweeper': 'Mayın Tarlası',
    'hangman': 'Adam Asmaca',
    'color_match': 'Renk Eşleştirme',
    'colorMatch': 'Renk Eşleştirme',
    'math_challenge': 'Matematik Mücadelesi',
    'mathChallenge': 'Matematik Mücadelesi',
    'typing_speed': 'Yazma Hızı',
    'typingSpeed': 'Yazma Hızı',
    'iq_test': 'IQ Test',
    'iqTest': 'IQ Test',
    'tetris': 'Tetris',
    'simon_says': 'Simon Diyor ki',
    'simonSays': 'Simon Diyor ki',
    'sudoku': 'Sudoku',
    'tangram': 'Tangram',
    'crossword': 'Bulmaca',
    'solitaire': 'Solitaire'
  };

  return gameNames[gameType] || gameType;
}

/**
 * Zorluk seviyesini formatlar
 * @param {string} difficulty - Zorluk seviyesi 
 * @return {string} Formatlanmış zorluk seviyesi
 */
function formatDifficulty(difficulty) {
  const difficultyNames = {
    'easy': 'Kolay',
    'medium': 'Orta',
    'hard': 'Zor',
    'expert': 'Uzman'
  };

  return difficultyNames[difficulty] || difficulty;
}

/**
 * Seviye atlama bildirimi gösterir
 * @param {number} oldLevel - Eski seviye
 * @param {number} newLevel - Yeni seviye
 */
function showLevelUpNotification(oldLevel, newLevel) {
  // Eğer sayfa içinde bildirim gösterme sistemi kullanılıyorsa burası düzenlenebilir
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Seviye Atladın!',
      text: `Seviye ${oldLevel}'den Seviye ${newLevel}'e yükseldin!`,
      icon: 'success',
      confirmButtonText: 'Harika!'
    });
  } else {
    alert(`Tebrikler! Seviye ${oldLevel}'den Seviye ${newLevel}'e yükseldin!`);
  }
}

/**
 * Skor bildirimi gösterir
 * @param {number} gameScore - Oyun skoru
 * @param {number} totalPoints - Toplam puanlar
 * @param {string} gameType - Oyun türü
 */
function showScoreNotification(gameScore, totalPoints, gameType) {
  const gameNames = {
    "wordle": "Wordle",
    "tetris": "Tetris",
    "chess": "Satranç",
    "snake_game": "Yılan Oyunu",
    "puzzle": "Bulmaca",
    "minesweeper": "Mayın Tarlası",
    "memory_match": "Hafıza Eşleştirme",
    "memoryMatch": "Hafıza Eşleştirme",
    "memoryCards": "Hafıza Kartları",
    "hangman": "Adam Asmaca",
    "color_match": "Renk Eşleştirme",
    "colorMatch": "Renk Eşleştirme",
    "audioMemory": "Sesli Hafıza",
    "typing_speed": "Yazma Hızı",
    "typingSpeed": "Yazma Hızı",
    "math_challenge": "Matematik Mücadelesi",
    "mathChallenge": "Matematik Mücadelesi",
    "2048": "2048",
    "numberChain": "Sayı Zinciri",
    "nBack": "N-Back",
    "wordPuzzle": "Kelime Bulmaca",
    "puzzle_slider": "Resim Bulmaca",
    "puzzleSlider": "Resim Bulmaca",
    "sudoku": "Sudoku",
    "numberSequence": "Sayı Dizisi",
    "labyrinth": "3D Labirent",
    "iqTest": "IQ Testi",
    "simonSays": "Simon Diyor ki"
  };

  const gameName = gameNames[gameType] || gameType;

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Skor Kaydedildi!',
      text: `${gameName} oyununda ${gameScore} puan kazandın! Toplam: ${totalPoints} puan`,
      icon: 'success',
      confirmButtonText: 'Tamam'
    });
  }
}

/**
 * Giriş yapma gerektiren bildirim gösterir
 */
function showLoginRequiredNotification() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Giriş Yap',
      text: 'Skorunu kaydetmek ve liderlik tablosunda yer almak için giriş yapmalısın!',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Giriş Yap',
      cancelButtonText: 'Daha Sonra'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
      }
    });
  } else {
    if (confirm('Skorunu kaydetmek ve liderlik tablosunda yer almak için giriş yapmalısın! Giriş sayfasına gitmek istiyor musun?')) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
    }
  }
}