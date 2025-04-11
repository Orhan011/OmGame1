// Oyun Sonu İşlemleri
function gameOver() {
  isGameOver = true;
  clearInterval(gameInterval);

  // Skoru kaydet
  saveScoreToLeaderboard(score);

  showGameOverMessage();
}

// Skoru liderlik tablosuna kaydet
function saveScoreToLeaderboard(finalScore) {
  // Zorluk seviyesini belirle (varsayılan: medium)
  const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

  // Oyun istatistiklerini topla
  const gameStats = {
    lines_cleared: lines,
    level: level,
    duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
    pieces_placed: pieces
  };

  // Skor kaydetme
  if (window.ScoreHandler) {
    window.ScoreHandler.saveScore('tetris', finalScore, difficulty, gameStats.duration_seconds, gameStats);
  } else if (window.saveScoreAndDisplay) {
    window.saveScoreAndDisplay('tetris', finalScore, gameStats.duration_seconds, difficulty, gameStats, function(scoreHtml) {
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
        game_type: 'tetris',
        score: finalScore,
        difficulty: difficulty,
        playtime: gameStats.duration_seconds,
        game_stats: gameStats
      })
    }).catch(err => console.error("Skor kaydetme hatası:", err));
  }
}