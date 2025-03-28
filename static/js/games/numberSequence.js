document.addEventListener('DOMContentLoaded', function() {
  const sequenceDisplay = document.getElementById('sequence-display');
  const sequenceInput = document.getElementById('sequence-input');
  const submitBtn = document.getElementById('submit-answer');
  const scoreDisplay = document.getElementById('score-display');
  const levelDisplay = document.getElementById('level-display');
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-game');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const finalScoreDisplay = document.getElementById('final-score');
  
  let currentSequence = [];
  let currentAnswer = 0;
  let score = 0;
  let level = 1;
  let timer;
  let isGameActive = false;
  
  startBtn.addEventListener('click', startGame);
  
  function startGame() {
    // Hide start button, show game
    startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Reset game state
    score = 0;
    level = 1;
    isGameActive = true;
    
    // Update displays
    updateScoreDisplay();
    updateLevelDisplay();
    
    // Start the first sequence
    generateSequence();
    
    // Start the timer (3 minutes)
    timer = window.startTimer(180, 'timer-display', endGame);
    
    // Setup input and button
    sequenceInput.value = '';
    sequenceInput.focus();
    submitBtn.addEventListener('click', submitAnswer);
    
    // Setup keyboard event
    sequenceInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        submitAnswer();
      }
    });
  }
  
  function generateSequence() {
    // Clear input
    sequenceInput.value = '';
    
    // Different types of sequences based on level
    const sequenceTypes = [
      // Arithmetic sequences
      () => {
        const start = Math.floor(Math.random() * 10) + 1;
        const difference = Math.floor(Math.random() * 5) + 1;
        currentSequence = [start];
        
        for (let i = 1; i < 5; i++) {
          currentSequence.push(currentSequence[i-1] + difference);
        }
        
        currentAnswer = currentSequence[4] + difference;
        return currentSequence;
      },
      
      // Geometric sequences
      () => {
        const start = Math.floor(Math.random() * 5) + 1;
        const ratio = Math.floor(Math.random() * 3) + 2;
        currentSequence = [start];
        
        for (let i = 1; i < 5; i++) {
          currentSequence.push(currentSequence[i-1] * ratio);
        }
        
        currentAnswer = currentSequence[4] * ratio;
        return currentSequence;
      },
      
      // Fibonacci-like sequences
      () => {
        const start1 = Math.floor(Math.random() * 5) + 1;
        const start2 = Math.floor(Math.random() * 5) + 1;
        currentSequence = [start1, start2];
        
        for (let i = 2; i < 5; i++) {
          currentSequence.push(currentSequence[i-1] + currentSequence[i-2]);
        }
        
        currentAnswer = currentSequence[4] + currentSequence[3];
        return currentSequence;
      },
      
      // Square numbers with offset
      () => {
        const offset = Math.floor(Math.random() * 10);
        currentSequence = [];
        
        for (let i = 1; i <= 5; i++) {
          currentSequence.push(i*i + offset);
        }
        
        currentAnswer = 6*6 + offset;
        return currentSequence;
      },
      
      // Alternating sequences
      () => {
        const start = Math.floor(Math.random() * 10) + 1;
        const increment1 = Math.floor(Math.random() * 5) + 1;
        const increment2 = Math.floor(Math.random() * 5) + 1;
        currentSequence = [start];
        
        for (let i = 1; i < 5; i++) {
          if (i % 2 === 1) {
            currentSequence.push(currentSequence[i-1] + increment1);
          } else {
            currentSequence.push(currentSequence[i-1] + increment2);
          }
        }
        
        // The next number in the sequence depends on whether we ended with increment1 or increment2
        if (5 % 2 === 1) {
          currentAnswer = currentSequence[4] + increment1;
        } else {
          currentAnswer = currentSequence[4] + increment2;
        }
        
        return currentSequence;
      }
    ];
    
    // Choose a sequence type based on level
    const sequenceIndex = Math.min(level - 1, sequenceTypes.length - 1);
    const sequence = sequenceTypes[sequenceIndex]();
    
    // Display the sequence
    sequenceDisplay.textContent = sequence.join(', ') + ', ?';
  }
  
  function submitAnswer() {
    if (!isGameActive) return;
    
    const answer = parseInt(sequenceInput.value.trim());
    
    if (isNaN(answer)) {
      showMessage('Please enter a valid number', 'warning');
      return;
    }
    
    if (answer === currentAnswer) {
      // Correct answer
      const pointsGained = 10 * level;
      score += pointsGained;
      level++;
      
      showMessage(`Correct! +${pointsGained} points`, 'success');
      
      // Update displays
      updateScoreDisplay();
      updateLevelDisplay();
      
      // Generate next sequence
      generateSequence();
    } else {
      // Incorrect answer
      const pointsLost = 5;
      score = Math.max(0, score - pointsLost);
      
      showMessage(`Incorrect. The answer was ${currentAnswer}. -${pointsLost} points`, 'danger');
      
      // Update score display
      updateScoreDisplay();
      
      // Generate next sequence
      generateSequence();
    }
    
    // Clear input and focus
    sequenceInput.value = '';
    sequenceInput.focus();
  }
  
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  function updateLevelDisplay() {
    levelDisplay.textContent = level;
  }
  
  function endGame() {
    isGameActive = false;
    
    // Stop the timer
    if (timer && timer.stop) {
      timer.stop();
    }
    
    // Show game over screen
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    finalScoreDisplay.textContent = score;
    
    // Save score
    window.saveScore('numberSequence', score);
    
    // Add play again button functionality
    document.getElementById('play-again').addEventListener('click', startGame);
  }
  
  function showMessage(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 150);
    }, 3000);
  }
});
