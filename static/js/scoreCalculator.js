
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
        moves,            // Yapılan hamle sayısı
        expectedMoves,    // Beklenen hamle sayısı
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
      else if (moves !== undefined && expectedMoves !== undefined) {
        // Hamle temelli puanlama (örn. bulmaca oyunları)
        if (expectedMoves > 0) {
          const moveEfficiency = Math.min(expectedMoves / moves, 2);
          baseScore = Math.round(40 + moveEfficiency * 30);
        }
      }
      else if (timeSpent !== undefined && expectedTime !== undefined) {
        // Zaman temelli puanlama (örn. hız testleri)
        if (expectedTime > 0) {
          const timeEfficiency = Math.min(expectedTime / timeSpent, 2);
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
      
      // Final puan hesaplaması
      let finalScore = Math.round(baseScore * difficultyMultiplier) - hintPenalty;
      
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
   * Beklenen hamle sayısını oyun tipine göre belirler
   * @param {string} gameType - Oyun tipi
   * @returns {number} Beklenen hamle sayısı
   */
  getExpectedMoves: function(gameType) {
    const expectedMoves = {
      'memoryCards': 30,
      'wordPuzzle': 25,
      'puzzle_slider': 40,
      'tetris': 100,
      'chess': 40,
      'wordle': 20,
      '2048': 80,
      'snake_game': 120,
      'simon_says': 25,
      'audioMemory': 35,
      'nBack': 40,
      'numberSequence': 45,
      'labyrinth': 50,
      'puzzle': 35,
      'color_match': 60,
      'math_challenge': 30,
      'typing_speed': 200,
      'iq_test': 20,
      'numberChain': 40,
      'minesweeper': 50,
      'memoryMatch': 25
    };
    
    return expectedMoves[gameType] || 40;
  },
  
  /**
   * Beklenen süreyi oyun tipine göre belirler (saniye cinsinden)
   * @param {string} gameType - Oyun tipi
   * @returns {number} Beklenen süre (saniye)
   */
  getExpectedTime: function(gameType) {
    const expectedTimes = {
      'memoryCards': 150, // 2.5 dakika
      'wordPuzzle': 180,  // 3 dakika
      'puzzle_slider': 240, // 4 dakika
      'tetris': 300,     // 5 dakika (süre uzun olması iyi)
      'chess': 600,      // 10 dakika
      'wordle': 120,     // 2 dakika
      '2048': 180,       // 3 dakika
      'snake_game': 180, // 3 dakika (süre uzun olması iyi)
      'simon_says': 120, // 2 dakika
      'audioMemory': 150, // 2.5 dakika
      'nBack': 180,      // 3 dakika
      'numberSequence': 120, // 2 dakika
      'labyrinth': 240,  // 4 dakika
      'puzzle': 300,     // 5 dakika
      'color_match': 120, // 2 dakika
      'math_challenge': 180, // 3 dakika
      'typing_speed': 60, // 1 dakika
      'iq_test': 600,    // 10 dakika
      'numberChain': 150, // 2.5 dakika
      'minesweeper': 240, // 4 dakika
      'memoryMatch': 180  // 3 dakika
    };
    
    return expectedTimes[gameType] || 180; // Varsayılan 3 dakika
  },
  
  /**
   * Oyun için hızlı puan hesaplaması
   * @param {Object} params - Hesaplama parametreleri
   * @returns {number} Hesaplanan puan (10-100 arası)
   */
  quickScore: function(params) {
    try {
      // Temel parametreleri kontrol et
      const gameType = params.gameType || 'unknown';
      const difficulty = params.difficulty || 'medium';
      
      // Zorluk çarpanı
      let difficultyMultiplier = this.getDifficultyMultiplier(gameType, difficulty);
      
      // Temel skor (varsayılan 50)
      let baseScore = 50;
      
      // Parametre tipine göre puan hesapla
      if (params.accuracy !== undefined) {
        // Doğruluk bazlı (0-1 arası)
        baseScore = Math.round(params.accuracy * 80);
      } 
      else if (params.time !== undefined && params.expectedTime !== undefined) {
        // Süre bazlı
        const timeRatio = params.expectedTime / Math.max(1, params.time);
        baseScore = Math.round(40 + Math.min(timeRatio, 2) * 20);
      }
      else if (params.moves !== undefined && params.expectedMoves !== undefined) {
        // Hamle bazlı
        const moveRatio = params.expectedMoves / Math.max(1, params.moves);
        baseScore = Math.round(40 + Math.min(moveRatio, 2) * 20);
      }
      else if (params.score !== undefined && params.maxScore !== undefined) {
        // Skor bazlı
        const scoreRatio = params.score / Math.max(1, params.maxScore);
        baseScore = Math.round(scoreRatio * 80);
      }
      
      // İpucu cezası
      const hintPenalty = params.hintsUsed ? Math.min(params.hintsUsed * 5, 30) : 0;
      
      // Son puan hesaplaması ve sınırlama
      let finalScore = Math.round(baseScore * difficultyMultiplier) - hintPenalty;
      finalScore = Math.max(10, Math.min(100, finalScore));
      
      return finalScore;
    } catch (error) {
      console.error("Hızlı puan hesaplama hatası:", error);
      return 50; // Hata durumunda orta seviye puan
    }
  }
};

// Modülü global olarak kullanılabilir yap
window.ScoreCalculator = ScoreCalculator;
