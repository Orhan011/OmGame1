/**
 * Tüm oyunlar için ortak skor kaydetme modülü
 * Bu modül, oyunlarda kazanılan skorları API'ye göndermek için kullanılır
 */

// ScoreHandler nesnesini global olarak tanımlıyoruz
window.ScoreHandler = {
  /**
   * Oyunu derecelendir
   * @param {string} gameType - Oyun türü (örn. "wordle", "tetris", "chess" vb.)
   * @param {number} rating - Derecelendirme (1-5 arası)
   * @param {string} comment - Kullanıcı yorumu (opsiyonel)
   * @return {Promise} - API yanıtını içeren Promise nesnesi
   */
  rateGame: function(gameType, rating, comment = "") {
    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);

    // Derecelendirme verisini hazırla
    const data = {
      game_type: gameType,
      rating: rating,
      comment: comment
    };

    console.log(`Rating game ${gameType}: ${rating}/5 stars`);

    // API'ye POST isteği
    return fetch('/api/rate-game', {
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
      console.log("Game rated:", data);
      return data;
    })
    .catch(error => {
      console.error("Error rating game:", error);
      return { success: false, message: "Error rating game" };
    });
  },

  /**
   * Oyun derecelendirmelerini çek
   * @param {string} gameType - Oyun türü
   * @return {Promise} - API yanıtını içeren Promise nesnesi (derecelendirmeler)
   */
  getGameRatings: function(gameType) {
    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);

    return fetch(`/api/get-game-ratings/${gameType}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Game ratings retrieved:", data);
        return data;
      })
      .catch(error => {
        console.error("Error retrieving game ratings:", error);
        return { success: false, message: "Error retrieving game ratings" };
      });
  },

  /**
   * Kullanıcının derecelendirmesini çek
   * @param {string} gameType - Oyun türü
   * @return {Promise} - API yanıtını içeren Promise nesnesi (kullanıcı derecelendirmesi)
   */
  getUserRating: function(gameType) {
    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);

    return fetch(`/api/get-user-rating/${gameType}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("User rating retrieved:", data);
        return data;
      })
      .catch(error => {
        console.error("Error retrieving user rating:", error);
        return { success: false, message: "Error retrieving user rating" };
      });
  },
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
        // Seviye atlama kontrolü
        if (data.xp && data.xp.level_up) {
          showLevelUpNotification(data.xp.old_level, data.xp.level);
        }

        // Skor kaydedildi bildirimi göster
        showScoreNotification(score, data.points?.total || score, gameType);
        console.log("Score saved successfully");
        return data;
      } 
      // Misafir kullanıcı kontrolü
      else if (data.guest && data.login_required) {
        showLoginRequiredNotification();
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
  }
};

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
      
      // Skoru kaydet
      window.ScoreHandler.saveScore(gameType, finalScore, difficulty, playtime, gameStats)
        .then(data => {
          // Callback varsa çalıştır
          if (typeof callback === 'function') {
            let scoreHtml = '';

            // Skor özeti HTML'i oluştur
            if (data.success) {
              scoreHtml = `
                <div class="score-summary">
                  <h3>Skor Özeti</h3>
                  <div class="score-detail">
                    <span>Oyun:</span>
                    <span>${formatGameName(gameType)}</span>
                  </div>
                  <div class="score-detail">
                    <span>Zorluk:</span>
                    <span>${formatDifficulty(difficulty)}</span>
                  </div>
                  <div class="score-detail">
                    <span>Temel Puan:</span>
                    <span>${data.points?.rewards?.base_points || Math.round(finalScore * 0.8)}</span>
                  </div>
                  <div class="score-detail">
                    <span>Zorluk Çarpanı:</span>
                    <span>×${data.points?.rewards?.difficulty_multiplier || window.ScoreHandler.getDifficultyMultiplier(difficulty)}</span>
                  </div>
                  <div class="score-detail total">
                    <span>Toplam Puan:</span>
                    <span>${data.points?.total || finalScore}</span>
                  </div>
                </div>
              `;
            } else if (data.guest) {
              scoreHtml = `
                <div class="score-summary guest">
                  <h3>Giriş Yapmalısınız</h3>
                  <p>Skorunuzu kaydetmek ve liderlik tablosunda yer almak için giriş yapın.</p>
                  <a href="/login?redirect=${encodeURIComponent(window.location.pathname)}" class="btn btn-primary">Giriş Yap</a>
                </div>
              `;
            }

            callback(scoreHtml, data);
          }
        })
        .catch(error => {
          console.error("Score saving error:", error);
          // Hata durumunda callback'i boş veri ile çağır
          if (typeof callback === 'function') {
            callback('', { success: false, error: error.message });
          }
        });
    } catch (e) {
      console.error("Error in saveScoreAndDisplay:", e);
      if (typeof callback === 'function') {
        callback('', { success: false, error: e.message });
      }
    }
  };
}

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