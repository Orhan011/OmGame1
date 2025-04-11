function endGame(isWin) {
  gameActive = false;

  // Oyun skorunu hesapla
  const score = calculateScore(isWin);

  // Skoru kaydet
  saveScoreToLeaderboard(score, isWin);

  // Sonuç mesajını göster
  const resultMessage = document.getElementById('result-message');
  resultMessage.textContent = isWin ? 'Tebrikler, kazandınız!' : 'Üzgünüm, kaybettiniz!';
  resultMessage.className = isWin ? 'win' : 'lose';

  // Doğru cevabı göster
  const wordReveal = document.getElementById('word-reveal');
  wordReveal.textContent = `Kelime: ${currentWord}`;

  // Sonuç ekranını göster
  document.getElementById('game-over').style.display = 'flex';
}

// Puanı hesapla
function calculateScore(isWin) {
  if (!isWin) return 0;

  // Kelime uzunluğu ve kalan hak sayısına göre skor hesapla
  const baseScore = currentWord.length * 10;
  const attemptBonus = remainingAttempts * 15;

  return baseScore + attemptBonus;
}

// Skoru liderlik tablosuna kaydet
function saveScoreToLeaderboard(finalScore, isWin) {
  // Zorluk seviyesini belirle (varsayılan: medium)
  const difficulty = localStorage.getItem('currentDifficulty') || 'medium';

  // Oyun istatistiklerini topla
  const gameStats = {
    word: currentWord,
    word_length: currentWord.length,
    success: isWin,
    attempts_used: maxAttempts - remainingAttempts,
    attempts_remaining: remainingAttempts
  };

  // Skor kaydetme
  if (window.ScoreHandler) {
    window.ScoreHandler.saveScore('hangman', finalScore, difficulty, Math.floor((Date.now() - gameStartTime) / 1000), gameStats);
  } else if (window.saveScoreAndDisplay) {
    window.saveScoreAndDisplay('hangman', finalScore, Math.floor((Date.now() - gameStartTime) / 1000), difficulty, gameStats, function(scoreHtml) {
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
        game_type: 'hangman',
        score: finalScore,
        difficulty: difficulty,
        playtime: Math.floor((Date.now() - gameStartTime) / 1000),
        game_stats: gameStats
      })
    }).catch(err => console.error("Skor kaydetme hatası:", err));
  }
}

// Oyun başlangıç zamanını kaydet
let gameStartTime = Date.now();