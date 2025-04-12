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
  try {
    // Zorluk seviyesini belirle (varsayılan: medium)
    const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

    // Oyun istatistiklerini topla
    const gameStats = {
      food_eaten: score,
      snake_length: snake ? snake.length : 0,
      duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
      board_size: `${gridSize}x${gridSize}`
    };

    console.log(`Saving score for snake_game: ${finalScore} points, difficulty: ${difficulty}`);
    
    // Skor kaydetme (gösterim olmadan)
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      window.ScoreHandler.saveScore('snake_game', finalScore, difficulty, gameStats.duration_seconds, gameStats);
    } else if (typeof window.saveScoreAndDisplay === 'function') {
      window.saveScoreAndDisplay('snake_game', finalScore, gameStats.duration_seconds, difficulty, gameStats, function() {
        // Skor gösterimi kaldırıldı
      });
    } else {
      console.error("Skor kaydedici bulunamadı! API'ye doğrudan gönderiliyor...");
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
      })
      .then(response => response.json())
      .then(data => {
        console.log("Score saved:", data);
      })
      .catch(err => console.error("Skor kaydetme hatası:", err));
    }
  } catch (e) {
    console.error("Skor kaydetme işleminde hata:", e);
  }
}

// Oyun başlangıç zamanını kaydet
let gameStartTime = Date.now();