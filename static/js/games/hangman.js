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
  try {
    // Zorluk seviyesini belirle (varsayılan: medium)
    const difficulty = localStorage.getItem('currentDifficulty') || 'medium';
    const playtime = Math.floor((Date.now() - gameStartTime) / 1000);

    // Oyun istatistiklerini topla
    const gameStats = {
      word: currentWord,
      word_length: currentWord.length,
      success: isWin,
      attempts_used: maxAttempts - remainingAttempts,
      attempts_remaining: remainingAttempts
    };

    console.log(`Kullanıcı profiline puan kaydediliyor: hangman: ${finalScore} puan, zorluk: ${difficulty}`);
    
    // Skor kaydetme (üç farklı API seçeneği kontrol et)
    if (typeof window.LeaderboardManager !== 'undefined' && typeof window.LeaderboardManager.saveScoreToLeaderboard === 'function') {
      // Yeni API kullan (leaderboard-fix.js)
      window.LeaderboardManager.saveScoreToLeaderboard('hangman', finalScore, playtime, difficulty, gameStats)
        .then(data => {
          console.log("Puan kaydedildi:", data);
          // Skor verileri
          console.log("Skor verileri:", data);
        })
        .catch(error => console.error("Puan kaydedilirken hata:", error));
    }
    // Alternatif olarak ScoreHandler API'sini kullan
    else if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      // Score-handler.js modülünü kullan
      window.ScoreHandler.saveScore('hangman', finalScore, playtime, difficulty, gameStats);
    } 
    // Alternatif olarak global saveScoreAndDisplay fonksiyonunu kullan
    else if (typeof window.saveScoreAndDisplay === 'function') {
      // Standart skor gösterme fonksiyonu
      window.saveScoreAndDisplay('hangman', finalScore, playtime, difficulty, gameStats, function(scoreHtml) {
        // Skor özeti göster (opsiyonel)
        const scoreContainer = document.getElementById('score-container');
        if (scoreContainer) {
          scoreContainer.innerHTML = scoreHtml;
        }
      });
    } else {
      console.error("Skor kaydedici bulunamadı! API'ye doğrudan gönderiliyor...");
      // Son çare olarak doğrudan API'ye gönder
      fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'hangman',
          score: finalScore,
          difficulty: difficulty,
          playtime: playtime,
          game_stats: gameStats
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Score saved successfully");
      })
      .catch(err => console.error("Skor kaydetme hatası:", err));
    }
  } catch (e) {
    console.error("Skor kaydetme işleminde hata:", e);
  }
}

// Oyun başlangıç zamanını kaydet
let gameStartTime = Date.now();