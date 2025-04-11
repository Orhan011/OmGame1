
/**
 * Tüm oyunlar için ortak skor kaydetme modülü
 * Bu modül, oyunlarda kazanılan skorları API'ye göndermek için kullanılır
 */

// Önceden tanımlanmış bir ScoreHandler varsa, onu kullanmaya devam et
if (!window.ScoreHandler) {
  window.ScoreHandler = {
  /**
   * Oyun skorunu API'ye gönderir
   * @param {string} gameType - Oyun türü (örn. "wordle", "tetris", "chess" vb.)
   * @param {number} score - Oyunda kazanılan puan
   * @param {string} difficulty - Zorluk seviyesi ("easy", "medium", "hard" veya "expert")
   * @param {number} playtime - Oyun süresi (saniye cinsinden)
   * @param {Object} gameStats - Oyun istatistikleri (opsiyonel)
   * @return {Promise} - API yanıtını içeren Promise nesnesi
   */
  saveScore: function(gameType, score, difficulty = "medium", playtime = 60, gameStats = {}) {
    // Score sayısal değer olmalıdır
    if (typeof score !== 'number') {
      score = parseInt(score, 10) || 0;
    }
    
    // Negatif puanlar 0 olarak ayarlanır
    if (score < 0) score = 0;
    
    // Zorluk seviyesi doğrulama
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(difficulty)) {
      difficulty = "medium"; // Varsayılan değer
    }
    
    // Oyun tipi validasyonu ve düzeltme
    if (!gameType) {
      // Sayfanın URL'sinden oyun tipini tahmin etmeye çalış
      const pathParts = window.location.pathname.split('/');
      const possibleGameType = pathParts[pathParts.length - 1].replace('.html', '');
      
      if (possibleGameType && possibleGameType !== '') {
        gameType = possibleGameType;
      } else {
        gameType = "unknown_game";
      }
    }
    
    // Oyun tipini standartlaştır
    gameType = this.standardizeGameType(gameType);
    
    // API isteği verileri
    const data = {
      game_type: gameType,
      score: score,
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
}

/**
 * Tüm oyunlar için skor kaydetme ve gösterme fonksiyonu
 * @param {string} gameType - Oyun türü
 * @param {number} score - Skor
 * @param {number} playtime - Oynama süresi (saniye)
 * @param {string} difficulty - Zorluk seviyesi
 * @param {Object} gameStats - Oyun istatistikleri
 * @param {Function} callback - Skor gösterimi sonrası çağrılacak callback (opsiyonel)
 */
if (!window.saveScoreAndDisplay) {
  window.saveScoreAndDisplay = function(gameType, score, playtime, difficulty, gameStats = {}, callback) {
  try {
    // Zorluğun geçerli olduğundan emin ol
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(difficulty)) {
      difficulty = "medium";
    }
    
    // Skoru kaydet
    window.ScoreHandler.saveScore(gameType, score, difficulty, playtime, gameStats)
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
                  <span>Temel Puan:</span>
                  <span>${data.points?.rewards?.base_points || score}</span>
                </div>
                <div class="score-detail">
                  <span>Zorluk Çarpanı:</span>
                  <span>x${data.points?.rewards?.difficulty_multiplier || window.ScoreHandler.getDifficultyMultiplier(difficulty)}</span>
                </div>
                <div class="score-detail total">
                  <span>Toplam:</span>
                  <span>${data.points?.total || score} puan</span>
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
  }
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
