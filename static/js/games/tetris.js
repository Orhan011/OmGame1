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
  try {
    // Zorluk seviyesini belirle (varsayılan: medium)
    const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

    // Oyun istatistiklerini topla
    const gameStats = {
      lines_cleared: lines,
      level: level,
      duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
      pieces_placed: pieces
    };

    console.log(`Saving score for tetris: ${finalScore} points, difficulty: ${difficulty}`);
    
    // Skor kaydetme (skor gösterimi olmadan)
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      window.ScoreHandler.saveScore('tetris', finalScore, difficulty, gameStats.duration_seconds, gameStats);
    } else if (typeof window.saveScoreAndDisplay === 'function') {
      window.saveScoreAndDisplay('tetris', finalScore, gameStats.duration_seconds, difficulty, gameStats, function() {
        // Skor gösterimi kaldırıldı
      });
    } else {
      console.error("Skor kaydedici bulunamadı! API'ye doğrudan gönderiliyor...");
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