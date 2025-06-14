function endGame() {
  // Zamanlayıcıyı durdur
  clearInterval(timerInterval);
  isGameOver = true;

  // Oyun skorunu hesapla
  const score = calculateScore();

  // Skoru kaydet
  saveScoreToLeaderboard(score);

  // Tebrik mesajını göster
  const result = document.getElementById('result-message');
  result.textContent = 'Tebrikler! Sudoku'yu başarıyla tamamladınız!';

  // İstatistikleri göster
  const stats = document.getElementById('game-stats');
  stats.style.display = 'block';

  document.getElementById('final-time').textContent = formatTime(totalSeconds);
  document.getElementById('final-mistakes').textContent = mistakes;
  document.getElementById('final-hints').textContent = hintsUsed;

  // Sonuç ekranını göster
  document.getElementById('game-over').style.display = 'flex';
}

// Puanı hesapla
function calculateScore() {
  // Zaman, hata ve ipucu kullanımına göre skor hesapla
  const baseScore = 1000;
  const timeMultiplier = Math.max(0.5, 1 - (totalSeconds / 3600)); // 1 saat üzeri minimum 0.5 çarpan
  const mistakePenalty = mistakes * 50;
  const hintPenalty = hintsUsed * 100;

  let finalScore = Math.floor((baseScore * timeMultiplier) - mistakePenalty - hintPenalty);
  return Math.max(50, finalScore); // Minimum 50 puan
}

// Skoru liderlik tablosuna kaydet
function saveScoreToLeaderboard(finalScore) {
  try {
    // Zorluk seviyesini belirle (varsayılan: medium)
    const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

    // Oyun istatistiklerini topla
    const gameStats = {
      time_seconds: totalSeconds,
      mistakes: mistakes,
      hints_used: hintsUsed,
      difficulty_level: currentDifficulty
    };

    console.log(`Saving score for sudoku: ${finalScore} points, difficulty: ${difficulty}`);
    
    // Skor kaydetme
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      window.ScoreHandler.saveScore('sudoku', finalScore, difficulty, totalSeconds, gameStats);
    } else if (typeof window.saveScoreAndDisplay === 'function') {
      window.saveScoreAndDisplay('sudoku', finalScore, totalSeconds, difficulty, gameStats, function(scoreHtml) {
        // Skor özeti göster (opsiyonel)
        const scoreContainer = document.getElementById('score-container');
        if (scoreContainer) {
          scoreContainer.innerHTML = scoreHtml;
        }
      });
    } else {
      console.error("Skor kaydedici bulunamadı! API'ye doğrudan gönderiliyor...");
      // Alternatif olarak doğrudan API'ye gönder
      fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'sudoku',
          score: finalScore,
          difficulty: difficulty,
          playtime: totalSeconds,
          game_stats: gameStats
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Score saved:", data);
        // Skor özeti göster (opsiyonel)
        const scoreContainer = document.getElementById('score-container');
        if (scoreContainer) {
          scoreContainer.innerHTML = '<div class="score-summary"><p>Skor başarıyla kaydedildi.</p></div>';
        }
      })
      .catch(err => console.error("Skor kaydetme hatası:", err));
    }
  } catch (e) {
    console.error("Skor kaydetme işleminde hata:", e);
  }
}