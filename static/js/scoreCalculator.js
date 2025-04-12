
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
/**
 * Oyun puanlarını hesaplayan modül
 * @version 2.0.0
 */

// Genel puan hesaplama sınıfı
class ScoreCalculator {
  // Varsayılan puan faktörleri
  static DEFAULT_FACTORS = {
    difficulty: {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
      expert: 2.0
    },
    time: {
      // Süre çarpanları (ne kadar hızlı o kadar fazla puan)
      superFast: 1.5, // Beklenen sürenin %40'ından az
      fast: 1.2,      // Beklenen sürenin %70'inden az
      average: 1.0,   // Beklenen süre
      slow: 0.8,      // Beklenen sürenin %150'sinden az
      verySlow: 0.6   // Beklenen sürenin %150'sinden fazla
    },
    moves: {
      // Hamle çarpanları (ne kadar az hamle o kadar fazla puan)
      perfect: 1.5,   // Optimal hamlelerin %110'undan az
      good: 1.2,      // Optimal hamlelerin %130'undan az
      average: 1.0,   // Optimal hamlelerin %150'sinden az
      poor: 0.8,      // Optimal hamlelerin %180'inden az
      bad: 0.6        // Optimal hamlelerin %180'inden fazla
    },
    accuracy: {
      // Doğruluk çarpanları (ne kadar doğru o kadar fazla puan)
      perfect: 1.5,   // %90'dan fazla
      good: 1.2,      // %75'ten fazla
      average: 1.0,   // %60'tan fazla
      poor: 0.8,      // %40'tan fazla
      bad: 0.6        // %40'tan az
    },
    hints: {
      // İpucu kullanımı çarpanları (ne kadar az ipucu o kadar fazla puan)
      none: 1.2,      // Hiç ipucu kullanılmamış
      few: 1.0,       // 1-3 ipucu
      some: 0.9,      // 4-6 ipucu
      many: 0.8,      // 7+ ipucu
    },
    completion: {
      // Tamamlama çarpanları
      complete: 1.0,  // Oyun tamamlandı
      partial: 0.5    // Oyun tamamlanmadı
    }
  };

  /**
   * Oyun verilerini kullanarak standartlaştırılmış puanı hesaplar
   * @param {Object} gameData - Oyun verileri
   * @returns {Object} Hesaplanan puan ve detayları
   */
  static calculate(gameData) {
    try {
      // Null kontrolü
      if (!gameData) {
        console.error('Puan hesaplanamadı: Oyun verisi boş');
        return { finalScore: 50, breakdown: { error: 'Geçersiz veri' } };
      }

      console.log('Puan hesaplanıyor:', gameData);

      // Ham puanı normalize et (0-100 arası)
      const baseScore = this.normalizeScore(gameData.score, gameData.maxScore);
      
      // Çarpanları hesapla
      const factors = this.calculateFactors(gameData);
      
      // Hesaplama detayları
      const breakdown = {
        baseScore: baseScore,
        ...factors
      };
      
      // Toplam çarpanı hesapla
      const totalFactor = this.calculateTotalFactor(factors);
      
      // Final puanını hesapla ve yuvarla
      let finalScore = Math.round(baseScore * totalFactor);
      
      // 0-100 aralığında sınırla
      finalScore = Math.max(0, Math.min(100, finalScore));
      
      console.log(`Hesaplanan ${gameData.gameType} puanı: ${finalScore} (ham: ${baseScore}, çarpan: ${totalFactor})`);
      
      return {
        finalScore: finalScore,
        breakdown: breakdown
      };
    } catch (error) {
      console.error('Puan hesaplama hatası:', error);
      return {
        finalScore: 50,
        breakdown: {
          baseScore: 50,
          error: true,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Ham puanı 0-100 aralığına normalize eder
   * @param {number} score - Ham puan
   * @param {number} maxScore - Maksimum ham puan
   * @returns {number} Normalize edilmiş puan (0-100)
   */
  static normalizeScore(score, maxScore) {
    if (score === undefined || score === null || isNaN(score)) {
      return 50; // Varsayılan değer
    }
    
    if (maxScore === undefined || maxScore === null || maxScore <= 0) {
      maxScore = 100;
    }
    
    // 0-100 aralığına ölçekle
    return Math.min(100, Math.max(0, (score / maxScore) * 100));
  }

  /**
   * Oyun verileri için çarpanları hesaplar
   * @param {Object} gameData - Oyun verileri
   * @returns {Object} Hesaplanan çarpanlar
   */
  static calculateFactors(gameData) {
    const factors = {};
    
    // Zorluk çarpanı
    factors.difficultyFactor = this.getDifficultyFactor(gameData.difficulty);
    
    // Zaman çarpanı (eğer beklenen süre belirtilmişse)
    if (gameData.expectedTime && gameData.timeSpent) {
      factors.timeFactor = this.getTimeFactor(gameData.timeSpent, gameData.expectedTime);
    }
    
    // Hamle çarpanı (eğer optimal hamle sayısı belirtilmişse)
    if (gameData.optimalMoves && gameData.moves) {
      factors.movesFactor = this.getMovesFactor(gameData.moves, gameData.optimalMoves);
    }
    
    // Doğruluk çarpanı (eğer doğruluk oranı belirtilmişse)
    if (gameData.accuracy !== undefined) {
      factors.accuracyFactor = this.getAccuracyFactor(gameData.accuracy);
    }
    
    // İpucu kullanımı çarpanı
    if (gameData.hintsUsed !== undefined) {
      factors.hintsFactor = this.getHintsFactor(gameData.hintsUsed);
    }
    
    // Tamamlama çarpanı
    factors.completionFactor = this.getCompletionFactor(gameData.completed);
    
    return factors;
  }

  /**
   * Çarpanları birleştirerek toplam çarpanı hesaplar
   * @param {Object} factors - Çarpanlar
   * @returns {number} Toplam çarpan
   */
  static calculateTotalFactor(factors) {
    // Toplam çarpan için ağırlıklar
    const weights = {
      difficultyFactor: 0.25,
      timeFactor: 0.15,
      movesFactor: 0.15,
      accuracyFactor: 0.20,
      hintsFactor: 0.10,
      completionFactor: 0.15
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Her bir çarpanı ağırlığı ile çarp ve topla
    for (const [factor, value] of Object.entries(factors)) {
      if (value !== undefined && weights[factor] !== undefined) {
        weightedSum += value * weights[factor];
        totalWeight += weights[factor];
      }
    }
    
    // Toplam ağırlık 0 ise varsayılan 1.0 çarpanını kullan
    if (totalWeight === 0) {
      return 1.0;
    }
    
    // Ağırlıklı ortalaması 
    return weightedSum / totalWeight;
  }

  /**
   * Zorluk seviyesine göre çarpanı hesaplar
   * @param {string} difficulty - Zorluk seviyesi (easy, medium, hard, expert)
   * @returns {number} Zorluk çarpanı
   */
  static getDifficultyFactor(difficulty) {
    if (!difficulty) {
      return this.DEFAULT_FACTORS.difficulty.medium;
    }
    
    const lowerDifficulty = difficulty.toLowerCase();
    
    if (this.DEFAULT_FACTORS.difficulty[lowerDifficulty] !== undefined) {
      return this.DEFAULT_FACTORS.difficulty[lowerDifficulty];
    }
    
    return this.DEFAULT_FACTORS.difficulty.medium;
  }

  /**
   * Harcanan süreye göre zaman çarpanını hesaplar
   * @param {number} timeSpent - Harcanan süre (saniye)
   * @param {number} expectedTime - Beklenen süre (saniye)
   * @returns {number} Zaman çarpanı
   */
  static getTimeFactor(timeSpent, expectedTime) {
    if (!timeSpent || !expectedTime || expectedTime <= 0) {
      return this.DEFAULT_FACTORS.time.average;
    }
    
    const timeRatio = timeSpent / expectedTime;
    
    if (timeRatio < 0.4) {
      return this.DEFAULT_FACTORS.time.superFast;
    } else if (timeRatio < 0.7) {
      return this.DEFAULT_FACTORS.time.fast;
    } else if (timeRatio < 1.1) {
      return this.DEFAULT_FACTORS.time.average;
    } else if (timeRatio < 1.5) {
      return this.DEFAULT_FACTORS.time.slow;
    } else {
      return this.DEFAULT_FACTORS.time.verySlow;
    }
  }

  /**
   * Hamle sayısına göre hamle çarpanını hesaplar
   * @param {number} moves - Yapılan hamle sayısı
   * @param {number} optimalMoves - Optimal hamle sayısı
   * @returns {number} Hamle çarpanı
   */
  static getMovesFactor(moves, optimalMoves) {
    if (!moves || !optimalMoves || optimalMoves <= 0) {
      return this.DEFAULT_FACTORS.moves.average;
    }
    
    const moveRatio = moves / optimalMoves;
    
    if (moveRatio < 1.1) {
      return this.DEFAULT_FACTORS.moves.perfect;
    } else if (moveRatio < 1.3) {
      return this.DEFAULT_FACTORS.moves.good;
    } else if (moveRatio < 1.5) {
      return this.DEFAULT_FACTORS.moves.average;
    } else if (moveRatio < 1.8) {
      return this.DEFAULT_FACTORS.moves.poor;
    } else {
      return this.DEFAULT_FACTORS.moves.bad;
    }
  }

  /**
   * Doğruluk oranına göre doğruluk çarpanını hesaplar
   * @param {number} accuracy - Doğruluk oranı (0-1)
   * @returns {number} Doğruluk çarpanı
   */
  static getAccuracyFactor(accuracy) {
    if (accuracy === undefined || accuracy === null) {
      return this.DEFAULT_FACTORS.accuracy.average;
    }
    
    // 0-1 aralığında sınırla
    const normalizedAccuracy = Math.min(1, Math.max(0, accuracy));
    
    if (normalizedAccuracy > 0.9) {
      return this.DEFAULT_FACTORS.accuracy.perfect;
    } else if (normalizedAccuracy > 0.75) {
      return this.DEFAULT_FACTORS.accuracy.good;
    } else if (normalizedAccuracy > 0.6) {
      return this.DEFAULT_FACTORS.accuracy.average;
    } else if (normalizedAccuracy > 0.4) {
      return this.DEFAULT_FACTORS.accuracy.poor;
    } else {
      return this.DEFAULT_FACTORS.accuracy.bad;
    }
  }

  /**
   * İpucu kullanımına göre ipucu çarpanını hesaplar
   * @param {number} hintsUsed - Kullanılan ipucu sayısı
   * @returns {number} İpucu çarpanı
   */
  static getHintsFactor(hintsUsed) {
    if (hintsUsed === undefined || hintsUsed === null) {
      return this.DEFAULT_FACTORS.hints.none;
    }
    
    if (hintsUsed === 0) {
      return this.DEFAULT_FACTORS.hints.none;
    } else if (hintsUsed <= 3) {
      return this.DEFAULT_FACTORS.hints.few;
    } else if (hintsUsed <= 6) {
      return this.DEFAULT_FACTORS.hints.some;
    } else {
      return this.DEFAULT_FACTORS.hints.many;
    }
  }

  /**
   * Tamamlama durumuna göre tamamlama çarpanını hesaplar
   * @param {boolean} completed - Tamamlama durumu
   * @returns {number} Tamamlama çarpanı
   */
  static getCompletionFactor(completed) {
    return completed ? 
      this.DEFAULT_FACTORS.completion.complete : 
      this.DEFAULT_FACTORS.completion.partial;
  }
}

// Standart puan hesaplama fonksiyonu
function calculateAndDisplayScore(gameData, callback) {
  try {
    // ScoreCalculator ile puanı hesapla
    const scoreDetails = ScoreCalculator.calculate(gameData);
    
    // Hesaplanan puanı kullanarak puan gösteren HTML oluştur
    generateScoreDisplay(gameData, scoreDetails, (scoreHtml) => {
      // Puanı API'ye kaydet
      saveScore(gameData, scoreDetails.finalScore)
        .then(apiData => {
          // Callback'i çağır
          if (typeof callback === 'function') {
            callback(scoreHtml, { 
              ...apiData, 
              score: scoreDetails.finalScore, 
              breakdown: scoreDetails.breakdown,
              game_type: gameData.gameType,
              game_name: getGameName(gameData.gameType)
            });
          }
        })
        .catch(error => {
          console.error('Puan kaydetme hatası:', error);
          // Hata olsa bile en azından görsel göster
          if (typeof callback === 'function') {
            callback(scoreHtml, { 
              score: scoreDetails.finalScore, 
              breakdown: scoreDetails.breakdown,
              game_type: gameData.gameType,
              game_name: getGameName(gameData.gameType),
              error: true
            });
          }
        });
    });
  } catch (error) {
    console.error('Puan hesaplama hatası:', error);
    
    // Hataya rağmen basit bir skor gösterimi oluştur
    const fallbackHtml = generateFallbackScoreDisplay(gameData);
    
    if (typeof callback === 'function') {
      callback(fallbackHtml, { 
        score: 50, 
        game_type: gameData.gameType,
        game_name: getGameName(gameData.gameType),
        error: true 
      });
    }
  }
}

/**
 * Oyun tipi ID'sinden oyun adını alır
 * @param {string} gameType - Oyun tipi ID'si
 * @returns {string} Oyun adı
 */
function getGameName(gameType) {
  const gameNames = {
    'wordle': 'Kelime Bulmaca',
    'wordPuzzle': 'Kelime Bilmece',
    'memoryCards': 'Hafıza Kartları',
    'minesweeper': 'Mayın Tarlası',
    'sudoku': 'Sudoku',
    'puzzle': 'Yapboz',
    'tetris': 'Tetris',
    'snake': 'Yılan',
    'hangman': 'Adam Asmaca',
    'chess': 'Satranç',
    'patternRecognition': 'Desen Tanıma',
    'numberSequence': 'Sayı Dizileri',
    'audioMemory': 'Ses Hafızası',
    'mathChallenge': 'Matematik Mücadelesi',
    'iqTest': 'IQ Testi',
    'nBack': 'N-Back Hafıza',
    '3dRotation': '3D Döndürme',
    'visualAttention': 'Görsel Dikkat',
    'numberChain': 'Sayı Zinciri',
    'brainGym': 'Beyin Jimnastiği',
    'whereIsIt': 'Nerede Bu?',
    'labyrinth': 'Labirent'
  };
  
  return gameNames[gameType] || gameType;
}

/**
 * Puan gösterim ekranı HTML'ini oluşturur
 * @param {Object} gameData - Oyun verileri
 * @param {Object} scoreDetails - Hesaplanan puan detayları
 * @param {Function} callback - Oluşturulan HTML ile çağrılacak fonksiyon
 */
function generateScoreDisplay(gameData, scoreDetails, callback) {
  const score = scoreDetails.finalScore;
  const gameName = getGameName(gameData.gameType);
  const breakdown = scoreDetails.breakdown;
  
  const completionText = gameData.completed ? 
    'Tebrikler! Oyunu başarıyla tamamladın.' : 
    'Oyunu tamamlayamadın, ama yine de puan kazandın.';
  
  const difficultyText = gameData.difficulty ? 
    `${gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1)} zorluk seviyesinde oynadın.` : 
    '';
  
  // Yıldız derecelendirmesi (0-5 arasında)
  const stars = Math.min(5, Math.max(0, Math.round(score / 20)));
  let starsHtml = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < stars) {
      starsHtml += '<i class="fas fa-star filled"></i>';
    } else {
      starsHtml += '<i class="fas fa-star empty"></i>';
    }
  }
  
  // Puan detayları
  let breakdownHtml = '';
  
  if (breakdown) {
    breakdownHtml = `
      <div class="score-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">Temel Puan:</span>
          <span class="breakdown-value">${Math.round(breakdown.baseScore)}</span>
        </div>
        ${breakdown.difficultyFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Zorluk Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.difficultyFactor.toFixed(1)}</span>
          </div>
        ` : ''}
        ${breakdown.timeFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Süre Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.timeFactor.toFixed(1)}</span>
          </div>
        ` : ''}
        ${breakdown.movesFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Hamle Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.movesFactor.toFixed(1)}</span>
          </div>
        ` : ''}
        ${breakdown.accuracyFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Doğruluk Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.accuracyFactor.toFixed(1)}</span>
          </div>
        ` : ''}
        ${breakdown.hintsFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">İpucu Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.hintsFactor.toFixed(1)}</span>
          </div>
        ` : ''}
        ${breakdown.completionFactor ? `
          <div class="breakdown-item">
            <span class="breakdown-label">Tamamlama Çarpanı:</span>
            <span class="breakdown-value">x${breakdown.completionFactor.toFixed(1)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // İstatistikler
  let statsHtml = '';
  
  if (gameData.timeSpent) {
    const minutes = Math.floor(gameData.timeSpent / 60);
    const seconds = gameData.timeSpent % 60;
    const timeText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    statsHtml += `
      <div class="stat-item">
        <i class="fas fa-clock"></i>
        <span class="stat-value">${timeText}</span>
        <span class="stat-label">Süre</span>
      </div>
    `;
  }
  
  if (gameData.moves !== undefined) {
    statsHtml += `
      <div class="stat-item">
        <i class="fas fa-shoe-prints"></i>
        <span class="stat-value">${gameData.moves}</span>
        <span class="stat-label">Hamle</span>
      </div>
    `;
  }
  
  if (gameData.hintsUsed !== undefined) {
    statsHtml += `
      <div class="stat-item">
        <i class="fas fa-lightbulb"></i>
        <span class="stat-value">${gameData.hintsUsed}</span>
        <span class="stat-label">İpucu</span>
      </div>
    `;
  }
  
  if (gameData.accuracy !== undefined) {
    const accuracyPercent = Math.round(gameData.accuracy * 100);
    
    statsHtml += `
      <div class="stat-item">
        <i class="fas fa-bullseye"></i>
        <span class="stat-value">${accuracyPercent}%</span>
        <span class="stat-label">Doğruluk</span>
      </div>
    `;
  }
  
  // Skor gösterim HTML'i
  const html = `
    <div class="game-result-overlay">
      <div class="game-result-container">
        <button class="game-result-close"><i class="fas fa-times"></i></button>
        
        <div class="game-result-header">
          <h2>${gameName}</h2>
          <div class="game-result-stars">
            ${starsHtml}
          </div>
        </div>
        
        <div class="game-result-score">
          <div class="score-circle">
            <span class="score-value">${score}</span>
            <span class="score-label">puan</span>
          </div>
        </div>
        
        <div class="game-result-text">
          <p>${completionText}</p>
          <p>${difficultyText}</p>
        </div>
        
        <div class="game-result-stats">
          ${statsHtml}
        </div>
        
        ${breakdownHtml}
        
        <div class="game-result-actions">
          <button class="game-result-replay"><i class="fas fa-redo"></i> Tekrar Oyna</button>
          <button class="game-result-leaderboard"><i class="fas fa-trophy"></i> Liderlik Tablosu</button>
          <button class="game-result-share"><i class="fas fa-share-alt"></i> Paylaş</button>
          <button class="game-result-copy"><i class="fas fa-copy"></i> Kopyala</button>
          <button class="game-result-home"><i class="fas fa-home"></i> Ana Sayfa</button>
        </div>
      </div>
    </div>
  `;
  
  // Callback ile HTML'i dön
  if (typeof callback === 'function') {
    callback(html);
  }
}

/**
 * Hata durumunda basit bir skor gösterimi oluşturur
 * @param {Object} gameData - Oyun verileri
 * @returns {string} Oluşturulan HTML
 */
function generateFallbackScoreDisplay(gameData) {
  const gameName = getGameName(gameData.gameType);
  
  return `
    <div class="game-result-overlay">
      <div class="game-result-container">
        <button class="game-result-close"><i class="fas fa-times"></i></button>
        
        <div class="game-result-header">
          <h2>${gameName}</h2>
        </div>
        
        <div class="game-result-score">
          <div class="score-circle">
            <span class="score-value">50</span>
            <span class="score-label">puan</span>
          </div>
        </div>
        
        <div class="game-result-text">
          <p>Oyun tamamlandı!</p>
        </div>
        
        <div class="game-result-actions">
          <button class="game-result-replay"><i class="fas fa-redo"></i> Tekrar Oyna</button>
          <button class="game-result-home"><i class="fas fa-home"></i> Ana Sayfa</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hesaplanmış puanı API'ye kaydeder
 * @param {Object} gameData - Oyun verileri
 * @param {number} calculatedScore - Hesaplanmış nihai puan
 * @returns {Promise} API yanıtı
 */
function saveScore(gameData, calculatedScore) {
  return new Promise((resolve, reject) => {
    try {
      // API'ye gönderilecek veriyi hazırla
      const scoreData = {
        game_type: gameData.gameType,
        score: calculatedScore,
        playtime: gameData.timeSpent || 60,
        difficulty: gameData.difficulty || 'medium',
        game_stats: {
          moves: gameData.moves,
          hints_used: gameData.hintsUsed,
          accuracy: gameData.accuracy,
          completion: gameData.completed ? 1 : 0,
          time_spent: gameData.timeSpent,
          raw_score: gameData.score,
          max_score: gameData.maxScore
        },
        timestamp: new Date().toISOString()
      };

      console.log(`Puanlar kaydediliyor: ${gameData.gameType}: ${calculatedScore} puan`);
      
      // API'ye POST isteği
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
        credentials: 'include' // Çerezlerin gönderilmesi için gerekli
      })
      .then(response => {
        if (!response.ok) {
          console.warn(`Puan kaydetme API yanıtı başarısız: ${response.status}`);
          throw new Error(`Sunucu yanıtı: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Puan başarıyla kaydedildi:', data);
        
        // Liderlik tablosunu ve profil puanlarını güncelle
        if (typeof window.updateScoreBoard === 'function') {
          window.updateScoreBoard(gameData.gameType, true);
        } else {
          console.log('updateScoreBoard fonksiyonu bulunamadı, tablo güncellenmeyecek');
        }
        
        resolve(data);
      })
      .catch(error => {
        console.error('Puan kaydetme başarısız:', error);
        
        // Hataya rağmen başarılı kabul et, diğer işlemlerin devam etmesini sağla
        resolve({
          success: false,
          error: error.message,
          score: calculatedScore,
          game_type: gameData.gameType
        });
      });
    } catch (error) {
      console.error('Puan kaydetme işlemi sırasında hata:', error);
      
      // Hataya rağmen başarılı kabul et, diğer işlemlerin devam etmesini sağla
      resolve({
        success: false,
        error: error.message,
        score: calculatedScore,
        game_type: gameData.gameType
      });
    }
  });
}

// Global erişim için window nesnesine ekle
window.ScoreCalculator = ScoreCalculator;
window.calculateAndDisplayScore = calculateAndDisplayScore;
