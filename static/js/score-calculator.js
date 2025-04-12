
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
   * Puan hesaplama
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
      gameSpecificStats = {}
    } = params;

    // Hesaplama için alt fonksiyonlar
    function calculateTimeScore() {
      if (!maxTime || maxTime <= 0) return 20; // Zaman yoksa ortalama puan

      // Zamanın yarısından önce bitirildiyse bonus
      if (timeSpent < maxTime / 2) {
        return 30; // Maksimum zaman puanı
      } 
      // Zamanın tamamına yakın bitirildiyse az puan
      else if (timeSpent > maxTime * 0.8) {
        return 10; // Minimum zaman puanı
      }
      // Normal aralık
      else {
        return 20; // Ortalama zaman puanı
      }
    }

    function calculateAccuracyScore() {
      if (totalQuestions <= 0) return 25; // Soru yoksa ortalama puan

      // Doğruluk oranını hesapla
      const accuracy = correctAnswers / totalQuestions;
      return Math.round(accuracy * 50); // 0-50 arası puan
    }

    function calculateHintPenalty() {
      // Her ipucu kullanımı için 5 puan düşür, max 25 puan
      return Math.min(25, hintsUsed * 5);
    }

    function calculateMoveEfficiency() {
      if (moves <= 0) return 20; // Hamle yoksa ortalama puan

      // Oyun tipine göre optimal hamle sayısını hesapla
      let optimalMoves = gameSpecificStats.optimalMoves || 0;
      
      // Eğer optimal hamle verilmemişse ve oyun tipi için hesaplama varsa
      if (!optimalMoves && OPTIMAL_MOVES[gameType]) {
        optimalMoves = OPTIMAL_MOVES[gameType](
          difficulty, 
          gameSpecificStats.boardSize || gameSpecificStats.cardCount || gameSpecificStats.questionCount
        );
      }

      if (optimalMoves <= 0) return 20; // Hesaplanamadıysa ortalama puan
      
      // Hamle verimliliği puanı
      if (moves <= optimalMoves) {
        return 40; // Optimal veya daha iyi
      } else {
        // Her fazla hamle için puan düşür
        const efficiency = Math.max(0, 1 - ((moves - optimalMoves) / optimalMoves) * 0.5);
        return Math.round(efficiency * 40);
      }
    }

    // Temel puan bileşenlerini hesapla
    const timeScore = calculateTimeScore();
    const accuracyScore = calculateAccuracyScore();
    const moveScore = calculateMoveEfficiency();
    const hintPenalty = calculateHintPenalty();

    // Temel puanı hesapla
    const baseScore = Math.max(0, timeScore + accuracyScore + moveScore - hintPenalty);
    
    // Zorluk çarpanını uygula
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    
    // Ham puanı hesapla
    const rawScore = Math.round(baseScore * difficultyMultiplier);
    
    // Nihai puanı hesapla (0-100 arası)
    const finalScore = Math.min(100, Math.max(0, rawScore));

    // Detaylı puan dökümü
    return {
      finalScore: finalScore,
      breakdown: {
        baseScore: baseScore,
        timeScore: timeScore,
        accuracyScore: accuracyScore,
        moveScore: moveScore,
        hintPenalty: hintPenalty,
        difficultyMultiplier: difficultyMultiplier,
        rawScore: rawScore
      }
    };
  }

  // Dışa aktarılan API
  return {
    calculate: calculate,
    DIFFICULTY_MULTIPLIERS: DIFFICULTY_MULTIPLIERS,
    MAX_SCORES: MAX_SCORES
  };
})();
