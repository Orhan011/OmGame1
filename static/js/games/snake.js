function gameOver() {
  clearInterval(gameInterval);
  isGameOver = true;

  // Skoru kaydet
  saveScoreToLeaderboard(score);

  // Game over mesajını göster
  const gameOverElement = document.getElementById('game-over');
  const finalScoreElement = document.getElementById('final-score');

  finalScoreElement.textContent = score;
  gameOverElement.style.display = 'flex';
}

// Skoru liderlik tablosuna kaydet
function saveScoreToLeaderboard(finalScore) {
  // Zorluk seviyesini belirle (varsayılan: medium)
  const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

  // Oyun istatistiklerini topla
  const gameStats = {
    food_eaten: score,
    snake_length: snake.length,
    duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
    board_size: `${gridSize}x${gridSize}`
  };

  // Skor kaydetme
  if (window.ScoreHandler) {
    window.ScoreHandler.saveScore('snake_game', finalScore, difficulty, gameStats.duration_seconds, gameStats);
  } else if (window.saveScoreAndDisplay) {
    window.saveScoreAndDisplay('snake_game', finalScore, gameStats.duration_seconds, difficulty, gameStats, function(scoreHtml) {
      // Skor özeti göster (opsiyonel)
      const scoreContainer = document.getElementById('score-container');
      if (scoreContainer) {
        scoreContainer.innerHTML = scoreHtml;
      }
    });
  } else {
    console.error("Skor kaydedici bulunamadı!");
    // Alternatif olarak doğrudan API'ye gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'snake_game',
        score: finalScore,
        difficulty: difficulty,
        playtime: gameStats.duration_seconds,
        game_stats: gameStats
      })
    }).catch(err => console.error("Skor kaydetme hatası:", err));
  }
}

// Oyun başlangıç zamanını kaydet
let gameStartTime = Date.now();