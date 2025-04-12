
/**
 * Standartlaştırılmış Skor Hesaplama Sistemi
 * Farklı oyunlar için tutarlı puanlama sağlar
 */
const ScoreCalculator = {
  /**
   * Oyun verilerine göre standartlaştırılmış puanı hesaplar
   * @param {Object} gameData - Oyun verileri
   * @returns {Object} Hesaplanan puan ve detaylar
   */
  calculate: function(gameData) {
    try {
      if (!gameData) {
        console.error("Geçersiz oyun verisi!");
        return {
          finalScore: 50,
          breakdown: {
            baseScore: 30,
            difficultyMultiplier: 1.0,
            difficulty: 'medium',
            error: true
          }
        };
      }
      
      const { 
        gameType,         // Oyun tipi (örn. 'puzzle', 'wordle', 'tetris', vb.)
        difficulty = 'medium', // Zorluk seviyesi (easy, medium, hard, expert)
        rawScore,         // Oyunun orijinal puanı
        maxPossibleScore, // Mümkün olan maksimum puan
        accuracy,         // Doğruluk oranı (0-1)
        timeSpent,        // Harcanan süre (saniye)
        expectedTime,     // Beklenen tamamlama süresi (saniye)
        optimalTime,      // Optimal tamamlama süresi (saniye)
        moves,            // Yapılan hamle sayısı
        totalMoves,       // Yapılan toplam hamle sayısı  
        expectedMoves,    // Beklenen hamle sayısı
        optimalMoves,     // Optimal hamle sayısı
        hintsUsed,        // Kullanılan ipucu sayısı
        lives,            // Kalan can sayısı
        maxLives,         // Maksimum can sayısı
        combo,            // Elde edilen kombo 
        level             // Oyun seviyesi
      } = gameData;

      // Temel puan hesaplaması (oyun tipine göre)
      let baseScore = 50; // Varsayılan temel puan
      
      if (accuracy !== undefined && accuracy !== null) {
        // Doğruluk temelli puanlama (örn. hedef vurma oyunları)
        baseScore = Math.round(accuracy * 80);
      } 
      else if (rawScore !== undefined && maxPossibleScore !== undefined) {
        // Raw skor temelli puanlama (örn. kelime oyunları)
        if (maxPossibleScore > 0) {
          baseScore = Math.round((rawScore / maxPossibleScore) * 80);
        }
      }
      else if (lives !== undefined && maxLives !== undefined) {
        // Can temelli puanlama (örn. platform oyunları)
        if (maxLives > 0) {
          baseScore = Math.round(40 + (lives / maxLives) * 40);
        }
      }
      else if ((moves !== undefined && expectedMoves !== undefined) || (totalMoves !== undefined && optimalMoves !== undefined)) {
        // Hamle temelli puanlama (örn. bulmaca oyunları)
        const actualMoves = totalMoves || moves;
        const targetMoves = optimalMoves || expectedMoves;
        
        if (targetMoves > 0) {
          const moveEfficiency = Math.min(targetMoves / actualMoves, 2);
          baseScore = Math.round(40 + moveEfficiency * 30);
        }
      }
      else if ((timeSpent !== undefined && expectedTime !== undefined) || (timeSpent !== undefined && optimalTime !== undefined)) {
        // Zaman temelli puanlama (örn. hız testleri)
        const targetTime = optimalTime || expectedTime;
        
        if (targetTime > 0) {
          const timeEfficiency = Math.min(targetTime / timeSpent, 2);
          baseScore = Math.round(40 + timeEfficiency * 30);
        }
      }
      else if (combo !== undefined) {
        // Combo temelli puanlama (örn. ritim oyunları)
        baseScore = Math.min(40 + combo * 2, 90);
      }
      else if (level !== undefined) {
        // Seviye temelli puanlama
        baseScore = Math.min(30 + level * 5, 90);
      }
      
      // Oyun tipine göre özel temel puan ayarlamaları
      const gameSpecificBaseScore = this.getGameSpecificBaseScore(gameType);
      if (gameSpecificBaseScore) {
        baseScore = Math.round((baseScore + gameSpecificBaseScore) / 2);
      }
      
      // Zorluk çarpanı
      const difficultyMultipliers = {
        'easy': 0.8,
        'medium': 1.0,
        'hard': 1.5,
        'expert': 2.0
      };
      
      // Geçerli zorluk kontrolü
      const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;
      
      // İpucu cezası (varsa)
      const hintPenalty = hintsUsed ? Math.min(hintsUsed * 5, 30) : 0;
      
      // Zaman bonusu/cezası
      let timeBonus = 0;
      if (timeSpent && (optimalTime || expectedTime)) {
        const targetTime = optimalTime || expectedTime;
        const timeRatio = targetTime / timeSpent;
        timeBonus = Math.round((timeRatio - 1) * 20); // -20 ile +20 arası bonus
        // Sınırla
        timeBonus = Math.max(-20, Math.min(20, timeBonus));
      }
      
      // Hamle verimliliği bonusu
      let moveBonus = 0;
      if ((moves || totalMoves) && (optimalMoves || expectedMoves)) {
        const actualMoves = totalMoves || moves;
        const targetMoves = optimalMoves || expectedMoves;
        const moveRatio = targetMoves / actualMoves;
        moveBonus = Math.round((moveRatio - 1) * 15); // -15 ile +15 arası bonus
        // Sınırla
        moveBonus = Math.max(-15, Math.min(15, moveBonus));
      }
      
      // Final puan hesaplaması
      let finalScore = Math.round(baseScore * difficultyMultiplier) - hintPenalty + timeBonus + moveBonus;
      
      // Puanı 10-100 aralığında sınırla
      finalScore = Math.max(10, Math.min(100, finalScore));
      
      // Hesaplama ayrıntılarını döndür
      return {
        finalScore,
        breakdown: {
          baseScore,
          difficultyMultiplier,
          difficulty,
          hintPenalty: hintPenalty || 0,
          timeBonus: timeBonus || 0,
          moveBonus: moveBonus || 0,
          gameType
        }
      };
    } 
    catch (error) {
      console.error("Puan hesaplama hatası:", error);
      
      // Hata durumunda varsayılan değer
      return {
        finalScore: 50,
        breakdown: {
          baseScore: 30,
          difficultyMultiplier: 1.0,
          difficulty: 'medium',
          error: true,
          errorMessage: error.message
        }
      };
    }
  },
  
  /**
   * Oyun tipine göre zorluk çarpanı döndürür
   * @param {string} gameType - Oyun tipi
   * @param {string} difficulty - Zorluk seviyesi
   * @returns {number} Zorluk çarpanı
   */
  getDifficultyMultiplier: function(gameType, difficulty) {
    const difficultyMultipliers = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.5,
      'expert': 2.0
    };
    
    // Belirli oyunlar için özel çarpanlar
    const gameSpecificMultipliers = {
      'chess': {
        'easy': 0.9,
        'medium': 1.2,
        'hard': 1.8,
        'expert': 2.5
      },
      'tetris': {
        'easy': 0.7,
        'medium': 1.0,
        'hard': 1.6,
        'expert': 2.2
      },
      'wordle': {
        'easy': 0.8,
        'medium': 1.0,
        'hard': 1.4,
        'expert': 1.8
      }
    };
    
    // Oyuna özel çarpan varsa onu kullan, yoksa standart çarpanı döndür
    if (gameSpecificMultipliers[gameType] && gameSpecificMultipliers[gameType][difficulty]) {
      return gameSpecificMultipliers[gameType][difficulty];
    }
    
    return difficultyMultipliers[difficulty] || 1.0;
  },
  
  /**
   * Oyun tipine göre özel temel puan değerleri
   * @param {string} gameType - Oyun tipi
   * @returns {number|null} Temel puan veya null
   */
  getGameSpecificBaseScore: function(gameType) {
    const baseScores = {
      'memoryCards': 70,
      'wordPuzzle': 60,
      'numberSequence': 80,
      'tetris': 40,
      'wordle': 100,
      'puzzle_slider': 60,
      'chess': 75,
      'simon_says': 50,
      'typing_speed': 40,
      'snake_game': 30,
      'audioMemory': 65,
      'nBack': 85,
      '2048': 45,
      'labyrinth': 80,
      'puzzle': 60,
      'color_match': 55,
      'math_challenge': 70,
      'minesweeper': 75,
      'hangman': 65
    };
    
    return baseScores[gameType] || null;
  }
};

// Modülü global olarak kullanılabilir yap
window.ScoreCalculator = ScoreCalculator;
