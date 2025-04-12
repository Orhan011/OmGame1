
/**
 * Profesyonel Puan Hesaplama Sistemi
 * @author OmGame Dev Team
 * @version 2.0.0
 */
const ScoreCalculator = {
  /**
   * Tüm oyun türleri için standartlaştırılmış puan hesaplama
   * @param {Object} gameData - Oyun verileri ve metrikleri
   * @returns {Object} Hesaplanan puan ve detaylı dağılım
   */
  calculate: function(gameData) {
    try {
      // Geçerli oyun verisi kontrolü
      if (!gameData || typeof gameData !== 'object') {
        console.error("Geçersiz oyun verisi:", gameData);
        return this._generateFallbackScore("invalid_data");
      }

      // Temel parametreleri çıkar
      const {
        gameType,              // Oyun tipi (string: puzzle, wordle, chess, vb.)
        difficulty = 'medium', // Zorluk seviyesi (string: easy, medium, hard, expert)
        timeSpent = 0,         // Harcanan süre (saniye)
        expectedTime = 0,      // Beklenen tamamlama süresi (saniye)
        optimalTime = 0,       // Optimal tamamlama süresi (saniye)
        moves = 0,             // Yapılan hamle sayısı
        optimalMoves = 0,      // Optimal hamle sayısı
        hintsUsed = 0,         // Kullanılan ipucu sayısı
        maxHints = 3,          // Maksimum kullanılabilir ipucu sayısı
        accuracy = null,       // Doğruluk oranı (0-1 arası)
        successRate = null,    // Başarı oranı (0-1 arası)
        completionPercentage = 1.0, // Tamamlanma yüzdesi (0-1 arası)
        level = 1,             // Oyun seviyesi
        maxLevel = 1,          // Maksimum seviye
        combo = 0,             // Kombo sayısı
        streakMultiplier = 1.0, // Seri çarpanı
        score = null,          // Ham oyun puanı 
        maxScore = null,       // Maksimum olası puan
        bonusPoints = 0,       // Bonus puanlar
        penaltyPoints = 0      // Ceza puanları
      } = gameData;

      // Oyun tipine göre temel puan ağırlık dağılımını belirle
      const weights = this._getGameTypeWeights(gameType);
      
      // 1. TEBtemel Puan Hesaplama (0-60 arası)
      let baseScore = this._calculateBaseScore(gameData, weights);
      
      // 2. Hamle Verimliliği Hesaplama (-15 ila +20 arası)
      let moveEfficiencyScore = this._calculateMoveEfficiency(moves, optimalMoves, weights.moveEfficiencyWeight);
      
      // 3. Zaman Verimliliği Hesaplama (-15 ila +20 arası)
      let timeEfficiencyScore = this._calculateTimeEfficiency(timeSpent, expectedTime, optimalTime, weights.timeEfficiencyWeight);
      
      // 4. İpucu Kullanım Cezası (0 ila -25 arası)
      let hintPenalty = this._calculateHintPenalty(hintsUsed, maxHints);
      
      // 5. Zorluk Çarpanı (0.7 ila 2.0 arası)
      let difficultyMultiplier = this._getDifficultyMultiplier(gameType, difficulty);
      
      // 6. Bonus Puanlar (0-15 arası)
      let bonusScore = this._calculateBonusScore(gameData);

      // Ham puanı hesapla (zorluk çarpanı uygulanmadan)
      let rawScore = baseScore + moveEfficiencyScore + timeEfficiencyScore - hintPenalty + bonusScore;
      
      // Zorluk çarpanını uygula
      let adjustedScore = Math.round(rawScore * difficultyMultiplier);
      
      // Puan aralığını sınırla (0-100)
      let finalScore = Math.max(0, Math.min(100, adjustedScore));
      
      // Minimum puan kontrolü - her oyun için en az 10 puan alınmalı
      if (finalScore < 10 && completionPercentage >= 0.5) {
        finalScore = 10;
      }

      // Sonuç ve ayrıntılı dağılımı döndür
      return {
        finalScore: finalScore,
        breakdown: {
          baseScore: Math.round(baseScore),
          moveEfficiencyScore: Math.round(moveEfficiencyScore),
          timeEfficiencyScore: Math.round(timeEfficiencyScore),
          hintPenalty: Math.round(hintPenalty),
          difficultyMultiplier: parseFloat(difficultyMultiplier.toFixed(2)),
          bonusScore: Math.round(bonusScore),
          rawScore: Math.round(rawScore),
          adjustedScore: adjustedScore,
          gameType: gameType,
          difficulty: difficulty,
          calculationVersion: "2.0.0"
        }
      };
    } catch (error) {
      console.error("Puan hesaplaması sırasında hata:", error);
      return this._generateFallbackScore("error", error.message);
    }
  },

  /**
   * Oyun tipine göre ağırlık dağılımını belirler
   * @private
   * @param {string} gameType - Oyun tipi
   * @returns {Object} Ağırlık dağılımı
   */
  _getGameTypeWeights: function(gameType) {
    // Varsayılan ağırlıklar
    const defaultWeights = {
      baseScoreWeight: 1.0,
      moveEfficiencyWeight: 1.0,
      timeEfficiencyWeight: 1.0,
      accuracyWeight: 1.0,
      completionWeight: 1.0
    };

    // Oyun türüne göre özelleştirilmiş ağırlıklar
    const gameTypeWeights = {
      // Hız odaklı oyunlar
      'typing_speed': {
        baseScoreWeight: 0.6,
        moveEfficiencyWeight: 0.5,
        timeEfficiencyWeight: 1.5,
        accuracyWeight: 1.2,
        completionWeight: 0.8
      },
      'tetris': {
        baseScoreWeight: 0.7,
        moveEfficiencyWeight: 1.2,
        timeEfficiencyWeight: 1.3,
        accuracyWeight: 0.8,
        completionWeight: 0.7
      },
      
      // Stratejik oyunlar
      'chess': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.5,
        timeEfficiencyWeight: 0.7,
        accuracyWeight: 1.2,
        completionWeight: 1.0
      },
      'puzzle': {
        baseScoreWeight: 0.9,
        moveEfficiencyWeight: 1.4,
        timeEfficiencyWeight: 0.8,
        accuracyWeight: 1.0,
        completionWeight: 1.0
      },
      'sudoku': {
        baseScoreWeight: 0.9,
        moveEfficiencyWeight: 1.3,
        timeEfficiencyWeight: 0.9,
        accuracyWeight: 1.2,
        completionWeight: 1.0
      },
      
      // Hafıza oyunları
      'memory_cards': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.2,
        timeEfficiencyWeight: 0.9,
        accuracyWeight: 1.3,
        completionWeight: 0.9
      },
      'memoryCards': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.2,
        timeEfficiencyWeight: 0.9,
        accuracyWeight: 1.3,
        completionWeight: 0.9
      },
      'audioMemory': {
        baseScoreWeight: 0.7,
        moveEfficiencyWeight: 0.9,
        timeEfficiencyWeight: 0.8,
        accuracyWeight: 1.5,
        completionWeight: 1.0
      },
      'nBack': {
        baseScoreWeight: 0.6,
        moveEfficiencyWeight: 0.7,
        timeEfficiencyWeight: 0.8,
        accuracyWeight: 1.6,
        completionWeight: 1.0
      },
      
      // Kelime oyunları
      'wordle': {
        baseScoreWeight: 0.9,
        moveEfficiencyWeight: 1.3,
        timeEfficiencyWeight: 0.7,
        accuracyWeight: 1.2,
        completionWeight: 1.0
      },
      'wordPuzzle': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.1,
        timeEfficiencyWeight: 0.8,
        accuracyWeight: 1.2,
        completionWeight: 1.0
      },
      'hangman': {
        baseScoreWeight: 0.9,
        moveEfficiencyWeight: 1.2,
        timeEfficiencyWeight: 0.7,
        accuracyWeight: 1.1,
        completionWeight: 1.0
      },
      
      // Beceri oyunları
      'snake_game': {
        baseScoreWeight: 0.7,
        moveEfficiencyWeight: 0.9,
        timeEfficiencyWeight: 1.2,
        accuracyWeight: 1.0,
        completionWeight: 0.8
      },
      'minesweeper': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.0,
        timeEfficiencyWeight: 0.9,
        accuracyWeight: 1.3,
        completionWeight: 1.0
      },
      'labyrinth': {
        baseScoreWeight: 0.8,
        moveEfficiencyWeight: 1.2,
        timeEfficiencyWeight: 1.0,
        accuracyWeight: 1.0,
        completionWeight: 1.0
      }
    };

    return gameTypeWeights[gameType] || defaultWeights;
  },

  /**
   * Temel puan hesaplama
   * @private
   * @param {Object} gameData - Oyun verileri
   * @param {Object} weights - Ağırlık dağılımı
   * @returns {number} Temel puan (0-60 arası)
   */
  _calculateBaseScore: function(gameData, weights) {
    const {
      gameType,
      accuracy,
      successRate,
      completionPercentage = 1.0,
      score,
      maxScore,
      level = 1,
      maxLevel = 1
    } = gameData;

    let baseScore = 35; // Varsayılan temel puan
    
    // Doğruluk bazlı puanlama
    if (accuracy !== null && accuracy !== undefined) {
      const accuracyScore = Math.min(60, Math.round(accuracy * 60 * weights.accuracyWeight));
      baseScore = Math.max(baseScore, accuracyScore);
    }
    
    // Başarı oranı bazlı puanlama
    if (successRate !== null && successRate !== undefined) {
      const successScore = Math.min(60, Math.round(successRate * 60 * weights.accuracyWeight));
      baseScore = Math.max(baseScore, successScore);
    }
    
    // Ham puan bazlı puanlama
    if (score !== null && maxScore !== null && maxScore > 0) {
      const scoreRatio = Math.min(1, score / maxScore);
      const scoreBasedScore = Math.min(60, Math.round(scoreRatio * 60 * weights.baseScoreWeight));
      baseScore = Math.max(baseScore, scoreBasedScore);
    }
    
    // Seviye bazlı ek puanlama
    if (maxLevel > 1) {
      const levelRatio = level / maxLevel;
      const levelBonus = Math.round(levelRatio * 15);
      baseScore += levelBonus;
    }
    
    // Tamamlanma oranına göre azaltma
    if (completionPercentage < 1.0) {
      baseScore = Math.round(baseScore * completionPercentage * weights.completionWeight);
    }
    
    // Oyun türüne göre özel puan ayarlamaları
    const gameSpecificScore = this._getGameSpecificBaseScore(gameType);
    if (gameSpecificScore !== null) {
      // Oyun türüne özel puan ile mevcut puanın ağırlıklı ortalamasını al
      baseScore = Math.round((baseScore + gameSpecificScore) / 2);
    }
    
    // 0-60 aralığında sınırla
    return Math.max(0, Math.min(60, baseScore));
  },

  /**
   * Hamle verimliliği puanı hesaplama
   * @private
   * @param {number} moves - Yapılan hamle sayısı
   * @param {number} optimalMoves - Optimal hamle sayısı
   * @param {number} weight - Ağırlık faktörü
   * @returns {number} Hamle verimliliği puanı (-15 ila +20 arası)
   */
  _calculateMoveEfficiency: function(moves, optimalMoves, weight = 1.0) {
    // Hamle verisi yoksa sıfır döndür
    if (!moves || !optimalMoves || optimalMoves <= 0) {
      return 0;
    }
    
    // Hamle verimliliği oranı (1.0 = optimal, <1.0 = fazla hamle, >1.0 = daha az hamle)
    const efficiencyRatio = optimalMoves / moves;
    
    let efficiencyScore;
    
    if (efficiencyRatio >= 1) {
      // Optimal veya daha az hamle - bonus
      efficiencyScore = Math.min(20, Math.round((efficiencyRatio - 0.8) * 25) * weight);
    } else {
      // Optimal hamleden fazla - ceza
      efficiencyScore = Math.max(-15, Math.round((efficiencyRatio - 1) * 20) * weight);
    }
    
    return efficiencyScore;
  },

  /**
   * Zaman verimliliği puanı hesaplama
   * @private
   * @param {number} timeSpent - Harcanan süre (saniye)
   * @param {number} expectedTime - Beklenen süre (saniye)
   * @param {number} optimalTime - Optimal süre (saniye)
   * @param {number} weight - Ağırlık faktörü
   * @returns {number} Zaman verimliliği puanı (-15 ila +20 arası)
   */
  _calculateTimeEfficiency: function(timeSpent, expectedTime, optimalTime, weight = 1.0) {
    // Süre verisi yoksa sıfır döndür
    if (!timeSpent || timeSpent <= 0 || (!expectedTime && !optimalTime)) {
      return 0;
    }
    
    const targetTime = optimalTime || expectedTime;
    
    // Zaman verimliliği oranı (1.0 = hedeflenen, <1.0 = daha hızlı, >1.0 = daha yavaş)
    const efficiencyRatio = targetTime / timeSpent;
    
    let timeScore;
    
    if (efficiencyRatio >= 1) {
      // Beklenen süreden daha hızlı tamamlama - bonus
      timeScore = Math.min(20, Math.round((efficiencyRatio - 0.8) * 25) * weight);
    } else {
      // Beklenen süreden daha yavaş tamamlama - ceza (ama çok sert değil)
      timeScore = Math.max(-15, Math.round((efficiencyRatio - 1) * 20) * weight);
    }
    
    return timeScore;
  },

  /**
   * İpucu kullanım cezası hesaplama
   * @private
   * @param {number} hintsUsed - Kullanılan ipucu sayısı
   * @param {number} maxHints - Maksimum kullanılabilir ipucu sayısı
   * @returns {number} İpucu cezası (0 ila -25 arası)
   */
  _calculateHintPenalty: function(hintsUsed, maxHints = 3) {
    if (!hintsUsed || hintsUsed <= 0) {
      return 0;
    }
    
    // Maksimum ipucu sayısı için varsayılan değer yoksa düzelt
    maxHints = maxHints || 3;
    
    // İpucu kullanım oranı
    const hintRatio = hintsUsed / maxHints;
    
    // Artan ceza - her ipucu daha fazla ceza getirir
    const penaltyPerHint = [5, 8, 12, 16, 20, 25];
    
    // Toplam ceza (maksimum -25)
    let totalPenalty = 0;
    for (let i = 0; i < hintsUsed && i < penaltyPerHint.length; i++) {
      totalPenalty += penaltyPerHint[i];
    }
    
    // Maksimum cezayla sınırla
    return Math.min(25, totalPenalty);
  },

  /**
   * Zorluk seviyesi çarpanı hesaplama
   * @private
   * @param {string} gameType - Oyun tipi
   * @param {string} difficulty - Zorluk seviyesi
   * @returns {number} Zorluk çarpanı (0.7 ila 2.0 arası)
   */
  _getDifficultyMultiplier: function(gameType, difficulty) {
    // Temel zorluk çarpanları
    const difficultyMultipliers = {
      'easy': 0.7,     // %70 puan
      'medium': 1.0,   // %100 puan
      'hard': 1.5,     // %150 puan
      'expert': 2.0    // %200 puan
    };
    
    // Oyun türüne özel zorluk çarpanları
    const gameSpecificMultipliers = {
      'chess': {
        'easy': 0.8,
        'medium': 1.1,
        'hard': 1.7,
        'expert': 2.2
      },
      'puzzle': {
        'easy': 0.7,
        'medium': 1.0,
        'hard': 1.4,
        'expert': 1.8
      },
      'wordle': {
        'easy': 0.7,
        'medium': 1.0,
        'hard': 1.6,
        'expert': 2.0
      },
      'minesweeper': {
        'easy': 0.7,
        'medium': 1.1,
        'hard': 1.6,
        'expert': 2.1
      },
      'labyrinth': {
        'easy': 0.8,
        'medium': 1.2,
        'hard': 1.7,
        'expert': 2.2
      }
    };
    
    // Oyuna özel çarpan varsa onu kullan, yoksa standart çarpanı döndür
    if (gameSpecificMultipliers[gameType] && gameSpecificMultipliers[gameType][difficulty]) {
      return gameSpecificMultipliers[gameType][difficulty];
    }
    
    return difficultyMultipliers[difficulty] || 1.0;
  },

  /**
   * Bonus puan hesaplama
   * @private
   * @param {Object} gameData - Oyun verileri
   * @returns {number} Bonus puanlar (0-15 arası)
   */
  _calculateBonusScore: function(gameData) {
    let bonusScore = 0;
    
    // Kombo bonusu
    if (gameData.combo && gameData.combo > 0) {
      bonusScore += Math.min(10, gameData.combo);
    }
    
    // Seri çarpanı bonusu
    if (gameData.streakMultiplier && gameData.streakMultiplier > 1.0) {
      bonusScore += Math.min(5, Math.round((gameData.streakMultiplier - 1) * 10));
    }
    
    // Oyun tanımlı bonus puanlar
    if (gameData.bonusPoints && gameData.bonusPoints > 0) {
      bonusScore += Math.min(15, gameData.bonusPoints);
    }
    
    // Oyun tanımlı ceza puanları
    if (gameData.penaltyPoints && gameData.penaltyPoints > 0) {
      bonusScore -= Math.min(bonusScore, gameData.penaltyPoints);
    }
    
    return Math.max(0, Math.min(15, bonusScore));
  },

  /**
   * Oyun tipine göre özel temel puan değerleri
   * @private
   * @param {string} gameType - Oyun tipi
   * @returns {number|null} Temel puan veya null
   */
  _getGameSpecificBaseScore: function(gameType) {
    const baseScores = {
      'memoryCards': 42,
      'memory_cards': 42,
      'wordPuzzle': 40,
      'word_puzzle': 40,
      'numberSequence': 44, 
      'number_sequence': 44,
      'tetris': 38,
      'wordle': 45,
      'puzzle_slider': 39,
      'puzzleSlider': 39,
      'chess': 48,
      'simon_says': 36,
      'simonSays': 36,
      'typing_speed': 38,
      'typingSpeed': 38,
      'snake_game': 34,
      'snake': 34,
      'audioMemory': 40,
      'audio_memory': 40,
      'nBack': 46,
      'n_back': 46,
      '2048': 38,
      'labyrinth': 44,
      'puzzle': 40,
      'color_match': 38,
      'colorMatch': 38,
      'math_challenge': 42,
      'mathChallenge': 42,
      'minesweeper': 44,
      'hangman': 40,
      'sudoku': 43
    };
    
    return baseScores[gameType] || null;
  },

  /**
   * Acil durum/hata durumu puanı oluşturma
   * @private
   * @param {string} reason - Sebep kodu
   * @param {string} errorMessage - Hata mesajı (opsiyonel)
   * @returns {Object} Varsayılan puan ve detayları
   */
  _generateFallbackScore: function(reason, errorMessage = "") {
    console.warn(`Varsayılan puan hesaplanıyor. Sebep: ${reason}`);
    
    // Sebebe göre varsayılan puan değerleri
    const fallbackValues = {
      "invalid_data": {
        finalScore: 35,
        baseScore: 35,
        fallbackReason: "Geçersiz oyun verisi"
      },
      "error": {
        finalScore: 30,
        baseScore: 30,
        fallbackReason: "Hesaplama hatası: " + errorMessage
      },
      "default": {
        finalScore: 40,
        baseScore: 40,
        fallbackReason: "Bilinmeyen hata"
      }
    };
    
    const values = fallbackValues[reason] || fallbackValues["default"];
    
    return {
      finalScore: values.finalScore,
      breakdown: {
        baseScore: values.baseScore,
        moveEfficiencyScore: 0,
        timeEfficiencyScore: 0,
        hintPenalty: 0,
        difficultyMultiplier: 1.0,
        bonusScore: 0,
        rawScore: values.baseScore,
        adjustedScore: values.finalScore,
        gameType: "unknown",
        difficulty: "medium",
        calculationVersion: "2.0.0",
        fallbackReason: values.fallbackReason,
        isEmergencyScore: true
      }
    };
  }
};

// Uyumluluk için V1 API'yi koru
ScoreCalculator.getDifficultyMultiplier = function(gameType, difficulty) {
  return this._getDifficultyMultiplier(gameType, difficulty);
};

ScoreCalculator.getGameSpecificBaseScore = function(gameType) {
  return this._getGameSpecificBaseScore(gameType);
};

// Modülü global olarak kullanılabilir yap
window.ScoreCalculator = ScoreCalculator;
