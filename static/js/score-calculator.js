
/**
 * ScoreCalculator - Tüm oyunlar için standart puan hesaplama sınıfı
 * Bu modül, oyunlardaki puanları 0-100 arasında standart bir şekilde hesaplar
 */

window.ScoreCalculator = (function() {
  // Zorluk seviyesi çarpanları
  const DIFFICULTY_MULTIPLIERS = {
    'easy': 0.8,
    'medium': 1.0,
    'hard': 1.3,
    'expert': 1.6
  };

  // Oyun tipi için maksimum puanlar
  const MAX_SCORES = {
    'tetris': 200,      // Tetris'te 200 puan mükemmel puan
    'wordle': 6,        // Wordle'da 6 deneme hakkı
    'memoryCards': 20,  // Hafıza kartlarında 20 hamle
    'puzzle': 500,      // Yapboz için 500 puan maksimum
    'snake': 50,        // Yılan oyunu için 50 elma
    'minesweeper': 300, // Mayın tarlası için 300 puan
    'hangman': 100,     // Adam asmaca için 100 puan
    'numberSequence': 500, // Sayı dizisi için 500 puan
    'numberChain': 300, // Sayı zinciri için 300 puan
    'nBack': 200,       // N-Back için 200 puan
    'patternRecognition': 200, // Örüntü tanıma için 200 puan
    'wordPuzzle': 200,  // Kelime bulmaca için 200 puan 
    'labyrinth': 200,   // Labirent için 200 puan
    'chess': 1000,      // Satranç puanı
    'audio_memory': 150, // Sesli hafıza oyunu
    'color_match': 250, // Renk eşleştirme
    'math_challenge': 200, // Matematik mücadelesi
    'default': 100      // Varsayılan
  };

  // Optimal hamle sayıları
  const OPTIMAL_MOVES = {
    'puzzle': function(difficulty, boardSize) {
      // Basit hesaplama: tahta boyutu başına optimal hamle
      const [rows, cols] = (boardSize || '3x4').split('x').map(Number);
      return rows * cols * 1.5;
    },
    'memoryCards': function(difficulty, cardCount) {
      // Kart sayısına göre optimal hamle sayısı
      return (cardCount || 16) * 1.2;
    },
    'minesweeper': function(difficulty) {
      // Zorluk seviyesine göre optimal hamle
      return difficulty === 'easy' ? 20 : (difficulty === 'medium' ? 40 : 60);
    },
    'numberSequence': function(difficulty, questionCount) {
      // Soru sayısına göre optimal hamle
      return questionCount || 10;
    }
  };

  /**
   * 0-100 arasında puan hesaplama
   * @param {Object} params - Hesaplama parametreleri
   * @returns {Object} - Hesaplanan puanlar ve detaylar
   */
  function calculate(params) {
    // Varsayılan değerlerle parametreleri genişlet
    const {
      gameType = 'default',
      difficulty = 'medium',
      score = 0,
      timeSpent = 0,
      maxTime = 0,
      correctAnswers = 0,
      totalQuestions = 0,
      hintsUsed = 0,
      moves = 0,
      gameCompleted = false,
      streakDays = 0,
      socialActions = 0,
      gameSpecificStats = {}
    } = params;

    // =====================================================
    // 1. PERFORMANS METRİKLERİ (Toplam Puanın %60'ı)
    // =====================================================
    
    // Oyun tamamlama puanı (0-10 puan)
    let completionScore = gameCompleted ? 10 : 2;
    
    // Skor bazlı puan (0-20 puan)
    let maxPossibleScore = MAX_SCORES[gameType] || 100;
    let scoreFactor = Math.min(1, score / maxPossibleScore);
    let scoreBasedPoints = scoreFactor * 20;

    // =====================================================
    // 2. YETENEK & BECERİ FAKTÖRLERİ (Toplam Puanın %30'u)
    // =====================================================
    
    // Zaman verimliliği (0-10 puan)
    let timeEfficiencyScore = 5; // Varsayılan orta değer
    if (maxTime > 0 && timeSpent > 0) {
      timeEfficiencyScore = Math.max(0, Math.min(10, (1 - (timeSpent / maxTime)) * 10));
    }
    
    // Doğruluk oranı (0-10 puan)
    let accuracyScore = 5; // Varsayılan orta değer
    if (totalQuestions > 0 && correctAnswers >= 0) {
      accuracyScore = Math.min(10, (correctAnswers / totalQuestions) * 10);
    } 
    // Eğer doğru/yanlış bilgisi yoksa, hamle verimliliğini kullan
    else if (moves > 0) {
      // Oyun tipine göre optimal hamle sayısını hesapla
      let optimalMoves = gameSpecificStats.optimalMoves || 0;
      
      // Eğer optimal hamle verilmemişse ve oyun tipi için hesaplama varsa
      if (!optimalMoves && OPTIMAL_MOVES[gameType]) {
        optimalMoves = OPTIMAL_MOVES[gameType](
          difficulty, 
          gameSpecificStats.boardSize || gameSpecificStats.cardCount || gameSpecificStats.questionCount
        );
      }
      
      if (optimalMoves > 0) {
        const moveRatio = optimalMoves / moves;
        accuracyScore = Math.min(10, moveRatio * 10);
      }
    }
    
    // İpucu kullanımı cezası (0-10 puan üzerinden)
    const hintPenalty = Math.min(10, hintsUsed * 2); // Her ipucu 2 puan düşürür
    
    // =====================================================
    // 3. SOSYAL & DAVRANIŞSAL FAKTÖRLER (Toplam Puanın %10'u)
    // =====================================================
    
    // Günlük giriş zinciri puanı (max 7 puan)
    const streakScore = Math.min(7, streakDays);
    
    // Sosyal aktiviteler puanı (max 3 puan)
    const socialScore = Math.min(3, socialActions);

    // =====================================================
    // 4. TOPLAM PUAN HESAPLAMA
    // =====================================================
    
    // Alt puanları hesapla
    const performanceScore = completionScore + scoreBasedPoints; // Max 30
    const skillScore = timeEfficiencyScore + accuracyScore - hintPenalty; // Max 20
    const socialScore_total = streakScore + socialScore; // Max 10
    
    // Alt kategorileri normalize et (0-100 arası)
    const normalizedPerformance = (performanceScore / 30) * 100;
    const normalizedSkill = (skillScore / 20) * 100;
    const normalizedSocial = (socialScore_total / 10) * 100;
    
    // Ana formül: Toplam Puan = (Performans Puanı * 0.6) + (Yetenek Puanı * 0.3) + (Sosyal Puan * 0.1)
    let rawScore = (normalizedPerformance * 0.6) + 
                 (normalizedSkill * 0.3) + 
                 (normalizedSocial * 0.1);
                 
    // Zorluk seviyesi katsayısını uygula
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    rawScore = rawScore * difficultyMultiplier;
    
    // Sınırları uygula (0-100 arası)
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Detaylı puan dökümü
    return {
      finalScore,
      breakdown: {
        performance: {
          total: Math.round(normalizedPerformance),
          completion: completionScore,
          scorePoints: Math.round(scoreBasedPoints)
        },
        skill: {
          total: Math.round(normalizedSkill),
          timeEfficiency: Math.round(timeEfficiencyScore),
          accuracy: Math.round(accuracyScore),
          hintPenalty: Math.round(hintPenalty)
        },
        social: {
          total: Math.round(normalizedSocial),
          streak: streakScore,
          social: socialScore
        },
        difficultyMultiplier,
        rawScore: Math.round(rawScore)
      }
    };
  }

  /**
   * Basitleştirilmiş puan hesaplama (oyun skoru + zorluk çarpanı)
   * Mevcut oyunlarla geriye dönük uyumluluk için
   */
  function calculateLegacy(gameType, score, difficulty = 'medium') {
    // Maksimum skor bulunması
    const maxScore = MAX_SCORES[gameType] || 100;
    
    // Skor oranı (0-1 arası)
    const scoreRatio = Math.min(1, score / maxScore);
    
    // Baz puan (0-80 arası)
    const baseScore = Math.round(scoreRatio * 80);
    
    // Zorluk çarpanı
    const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    
    // Nihai puan (0-100 arası)
    const finalScore = Math.min(100, Math.round(baseScore * diffMultiplier));
    
    return {
      finalScore,
      breakdown: {
        baseScore,
        difficultyMultiplier: diffMultiplier,
        rawScore: baseScore * diffMultiplier
      }
    };
  }

  // Dışa aktarılan API
  return {
    calculate,
    calculateLegacy,
    DIFFICULTY_MULTIPLIERS,
    MAX_SCORES
  };
})();
