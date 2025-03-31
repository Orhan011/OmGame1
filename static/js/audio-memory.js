document.addEventListener('DOMContentLoaded', function() {
  const simonButtons = document.querySelectorAll('.simon-button');
  const startButton = document.getElementById('start-button');
  const resetButton = document.getElementById('reset-button');
  const scoreElement = document.getElementById('score');
  const levelElement = document.getElementById('level');
  const statusMessage = document.getElementById('status-message');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');

  let sequence = [];
  let playerSequence = [];
  let round = 0;
  let score = 0;
  let level = 1;
  let gameActive = false;
  let gameMode = 'normal'; // Default mode

  // Sound effects
  const greenSound = new Audio('/static/sounds/green.mp3');
  const redSound = new Audio('/static/sounds/red.mp3');
  const yellowSound = new Audio('/static/sounds/yellow.mp3');
  const blueSound = new Audio('/static/sounds/blue.mp3');
  const errorSound = new Audio('/static/sounds/error.mp3');
  const successSound = new Audio('/static/sounds/success.mp3');


  function updateScore() {
    score++;
    scoreElement.textContent = score;

    // Update level every 3 points
    if (score % 3 === 0) {
      level++;
      levelElement.textContent = level;
      showToast(`🎮 Tebrikler! Seviye ${level}'e yükseldiniz!`, 'success');
    }

    // Send score to server
    fetch('/update_game_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: 'audio_memory',
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.achievement) {
        showToast(`🏆 Başarı Kazanıldı: ${data.achievement.title}`, 'success');
      }
    })
    .catch(error => console.error('Error:', error));
  }

  // ... (rest of the JavaScript code) ...

});

// ... (rest of the JavaScript code, including functions like showToast, etc.) ...