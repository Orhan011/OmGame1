
// ScoreCalculator ile standardize edilmiş puan hesaplama fonksiyonu
function calculateStandardizedScore(gameType, score, difficulty, timeSpent, gameStats) {
  if (window.ScoreCalculator) {
    const result = window.ScoreCalculator.calculate({
      gameType: gameType,
      score: score,
      difficulty: difficulty,
      timeSpent: timeSpent,
      correctAnswers: gameStats.correctAnswers || 0,
      totalQuestions: gameStats.totalQuestions || 0,
      hintsUsed: gameStats.hintsUsed || 0,
      moves: gameStats.moves || 0,
      gameSpecificStats: gameStats
    });
    
    return result.finalScore;
  }
  
  // ScoreCalculator yoksa orijinal skoru döndür
  return score;
}

