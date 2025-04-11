
/**
 * Tüm oyunlar için ortak skor kaydetme modülü
 * Bu modül, oyunlarda kazanılan skorları API'ye göndermek için kullanılır
 */

const ScoreHandler = {
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
    
    // Zorluk seviyesi doğrulama
    const validDifficulties = ["easy", "medium", "hard", "expert"];
    if (!validDifficulties.includes(difficulty)) {
      difficulty = "medium"; // Varsayılan değer
    }
    
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
        showScoreNotification(score, data.points.total, gameType);
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
  }
};

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
    "hangman": "Adam Asmaca",
    "color_match": "Renk Eşleştirme",
    "audioMemory": "Sesli Hafıza",
    "typing_speed": "Yazma Hızı",
    "math_challenge": "Matematik Mücadelesi",
    "2048": "2048",
    "numberChain": "Sayı Zinciri",
    "nBack": "N-Back",
    "wordPuzzle": "Kelime Bulmaca",
    "puzzle_slider": "Resim Bulmaca",
    "memoryCards": "Hafıza Kartları",
    "sudoku": "Sudoku",
    "numberSequence": "Sayı Dizisi",
    "labyrinth": "3D Labirent"
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

// Global nesne olarak tanımla
window.ScoreHandler = ScoreHandler;
