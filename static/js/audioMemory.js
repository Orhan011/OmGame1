
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const introSection = document.getElementById('intro-section');
  const gameSection = document.getElementById('game-section');
  const gameOverSection = document.getElementById('game-over-section');
  const startButton = document.getElementById('start-button');
  const restartButton = document.getElementById('restart-button');
  const scoreDisplay = document.getElementById('score-display');
  const levelDisplay = document.getElementById('level-display');
  const sequenceLengthDisplay = document.getElementById('sequence-length');
  const correctDisplay = document.getElementById('correct-display');
  const finalScoreDisplay = document.getElementById('final-score');
  
  // Game variables
  let score = 0;
  let level = 1;
  let sequenceLength = 3;
  let correctCount = 0;
  let currentSequence = [];
  let playerSequence = [];
  let isPlayingSequence = false;
  let canPlayerInput = false;
  
  // Colors and sounds
  const buttons = document.querySelectorAll('.sound-btn');
  const sounds = {
    red: new Audio('/static/sounds/note1.mp3'),
    green: new Audio('/static/sounds/note2.mp3'),
    blue: new Audio('/static/sounds/note3.mp3'),
    yellow: new Audio('/static/sounds/note4.mp3')
  };
  
  // Initialize Tone.js for better audio performance
  let audioReady = false;
  
  // Setup Tone.js if available
  if (typeof Tone !== 'undefined') {
    Tone.start().then(() => {
      console.log('Audio is ready');
      audioReady = true;
    }).catch(e => {
      console.error('Could not start audio:', e);
    });
  }
  
  // Event listeners
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  
  if (restartButton) {
    restartButton.addEventListener('click', restartGame);
  }
  
  // Setup button click events
  buttons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
  });
  
  // Functions
  function startGame() {
    introSection.classList.add('d-none');
    if (gameSection) {
      gameSection.classList.remove('d-none');
    }
    if (gameOverSection) {
      gameOverSection.classList.add('d-none');
    }
    
    resetGame();
    nextLevel();
  }
  
  function restartGame() {
    gameOverSection.classList.add('d-none');
    if (gameSection) {
      gameSection.classList.remove('d-none');
    }
    
    resetGame();
    nextLevel();
  }
  
  function resetGame() {
    score = 0;
    level = 1;
    sequenceLength = 3;
    correctCount = 0;
    currentSequence = [];
    
    updateDisplay();
  }
  
  function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    sequenceLengthDisplay.textContent = sequenceLength;
    correctDisplay.textContent = correctCount;
  }
  
  function nextLevel() {
    playerSequence = [];
    currentSequence = generateSequence(sequenceLength);
    
    setTimeout(() => {
      playSequence();
    }, 1000);
  }
  
  function generateSequence(length) {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const sequence = [];
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      sequence.push(colors[randomIndex]);
    }
    
    return sequence;
  }
  
  function playSequence() {
    isPlayingSequence = true;
    canPlayerInput = false;
    
    buttons.forEach(button => {
      button.classList.add('disabled');
    });
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentSequence.length) {
        activateButton(currentSequence[i]);
        i++;
      } else {
        clearInterval(interval);
        isPlayingSequence = false;
        canPlayerInput = true;
        
        buttons.forEach(button => {
          button.classList.remove('disabled');
        });
      }
    }, 800);
  }
  
  function activateButton(color) {
    const button = document.querySelector(`.sound-btn[data-color="${color}"]`);
    
    if (button) {
      button.classList.add('active');
      playSound(color);
      
      setTimeout(() => {
        button.classList.remove('active');
      }, 500);
    }
  }
  
  function playSound(color) {
    if (sounds[color]) {
      // Clone the audio to allow overlapping sounds
      const sound = sounds[color].cloneNode();
      sound.volume = 0.7;
      sound.play().catch(e => console.error('Error playing sound:', e));
    }
  }
  
  function handleButtonClick(event) {
    if (!canPlayerInput || isPlayingSequence) return;
    
    const color = event.currentTarget.getAttribute('data-color');
    activateButton(color);
    playerSequence.push(color);
    
    const currentIndex = playerSequence.length - 1;
    
    if (playerSequence[currentIndex] !== currentSequence[currentIndex]) {
      gameOver();
      return;
    }
    
    if (playerSequence.length === currentSequence.length) {
      canPlayerInput = false;
      correctCount++;
      score += level * 10;
      
      updateDisplay();
      
      setTimeout(() => {
        if (correctCount >= 3) {
          level++;
          sequenceLength++;
          correctCount = 0;
        }
        
        updateDisplay();
        nextLevel();
      }, 1000);
    }
  }
  
  function gameOver() {
    canPlayerInput = false;
    finalScoreDisplay.textContent = score;
    
    // Save score to server if logged in
    if (typeof saveScore === 'function') {
      saveScore(score, 'audioMemory');
    }
    
    if (gameSection) {
      gameSection.classList.add('d-none');
    }
    
    gameOverSection.classList.remove('d-none');
  }
  
  // Common function to save score
  function saveScore(score, gameType) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: score,
        game_type: gameType
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Score saved successfully!');
        
        // Handle XP and level up notifications
        if (data.is_level_up) {
          showNotification('Seviye Atladınız!', `Yeni seviyeniz: ${data.level}`, 'success');
        }
        
        if (data.is_high_score) {
          showNotification('Yeni Rekor!', 'Bu oyunda yeni bir rekor kırdınız!', 'success');
        }
      } else if (data.message === 'Login required') {
        showNotification('Giriş Gerekli', 'Skorunuzu kaydetmek için giriş yapmalısınız.', 'warning');
      } else {
        console.log('Score could not be saved.');
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
  
  // Notification function
  function showNotification(title, message, type = 'info') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: title,
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      alert(`${title}: ${message}`);
    }
  }
});

