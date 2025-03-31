document.addEventListener('DOMContentLoaded', function() {
  // Oyun durumu
  let gameState = {
    level: 'EASY',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    score: 0,
    gameStarted: false,
    hintsRemaining: 3,
    combo: 0,
    soundEnabled: true,
    gameOver: false,
    paused: false
  };

  // DOM elementleri
  const memoryGrid = document.getElementById('memory-grid');
  const levelButtons = document.querySelectorAll('.level-btn');
  const startGameButton = document.getElementById('start-game');
  const pauseButton = document.getElementById('pause-game');
  const soundToggle = document.getElementById('sound-toggle');
  const hintButton = document.getElementById('hint-button');
  const hintCounter = document.getElementById('hint-counter');
  const progressPercent = document.getElementById('progress-percent');
  const themeIndicator = document.getElementById('theme-indicator');
  const alertContainer = document.getElementById('alert-container');

  // Ses efektleri
  const sounds = {
    flip: new Audio('/static/sounds/card-flip.mp3'),
    match: new Audio('/static/sounds/match.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelComplete: new Audio('/static/sounds/level-complete.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    click: new Audio('/static/sounds/click.mp3')
  };

  // Event Listeners
  levelButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (!gameState.gameStarted) {
        levelButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        gameState.level = button.dataset.level;
        playSound('click');
      }
    });
  });

  if (startGameButton) {
    startGameButton.addEventListener('click', function() {
      playSound('click');
      if (!gameState.gameStarted) {
        startGame();
      }
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', function() {
      togglePause();
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', function() {
      gameState.soundEnabled = !gameState.soundEnabled;
      soundToggle.innerHTML = gameState.soundEnabled ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
      soundToggle.classList.toggle('active', gameState.soundEnabled);
      playSound('click');
    });
  }

  if (hintButton) {
    hintButton.addEventListener('click', function() {
      if (gameState.gameStarted && !gameState.paused && gameState.hintsRemaining > 0) {
        useHint();
      }
    });
  }


  // Oyun sonucunu göster ve veritabanına kaydet
  function showResults() {
    gameState.gameOver = true;
    saveScore(gameState.score, 'memory_cards')
      .then(data => {
        console.log("Score saved:", data);
        const gameContainer = document.querySelector('.memory-game-container');
        if (gameContainer) {
          gameContainer.innerHTML = `
            <div class="memory-results-container">
              <div class="memory-results-card">
                <div class="memory-results-header">
                  <div class="result-badge">
                    <i class="fas fa-trophy"></i>
                  </div>
                  <h2>Tebrikler!</h2>
                </div>
                <div class="memory-results-body">
                  <div class="results-stats">
                    <div class="result-stat">
                      <i class="fas fa-star"></i>
                      <div class="stat-label">Skor</div>
                      <div class="stat-value">${gameState.score}</div>
                    </div>
                    <div class="result-stat">
                      <i class="fas fa-exchange-alt"></i>
                      <div class="stat-label">Hamle</div>
                      <div class="stat-value">${gameState.moves}</div>
                    </div>
                    <div class="result-stat">
                      <i class="fas fa-brain"></i>
                      <div class="stat-label">Zorluk</div>
                      <div class="stat-value">${getDifficultyName(gameState.level)}</div>
                    </div>
                  </div>
                  <div class="results-message mt-4 text-center">
                    <p class="mb-0">
                      ${data && data.is_high_score ? 
                        '<div class="achievement mb-3"><i class="fas fa-medal"></i> Yeni Yüksek Skor!</div>' : ''}
                      ${data && data.is_level_up ? 
                        `<div class="achievement mb-3"><i class="fas fa-level-up-alt"></i> Seviye Atladın! Yeni Seviye: ${data.level}</div>` : ''}
                      <span class="text-muted">Kazanılan XP: +${data ? data.xp_gained : 0}</span>
                    </p>
                  </div>
                </div>
                <div class="memory-results-footer">
                  <a href="/games/memory-cards" class="btn btn-outline-light"><i class="fas fa-redo me-2"></i>Tekrar Oyna</a>
                  <a href="/profile" class="btn btn-primary"><i class="fas fa-user me-2"></i>Profilim</a>
                </div>
              </div>
            </div>
          `;
        }
      })
      .catch(err => {
        console.error("Error saving score:", err);
      });
  }

  // ... rest of the game logic (startGame, togglePause, useHint, playSound, getDifficultyName, saveScore) ...

});