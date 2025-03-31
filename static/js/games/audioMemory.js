
// Audio Memory Game - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Game elements
  const introScreen = document.getElementById('intro-screen');
  const gameScreen = document.getElementById('game-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const levelCompleteScreen = document.getElementById('level-complete-screen');
  const startBtn = document.getElementById('start-game');
  const levelButtons = document.querySelectorAll('.level-btn');
  const audioPads = document.querySelectorAll('.audio-pad');
  const playSequenceBtn = document.getElementById('play-sequence');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const restartButton = document.getElementById('restart-button');
  const backToMenuBtn = document.getElementById('back-to-menu');
  const nextLevelBtn = document.getElementById('next-level-btn');
  
  // Status displays
  const currentLevelDisplay = document.getElementById('current-level');
  const scoreValueDisplay = document.getElementById('score-value');
  const sequenceLengthDisplay = document.getElementById('sequence-length');
  const statusMessageDisplay = document.getElementById('status-message');
  const statusSubmessageDisplay = document.getElementById('status-submessage');
  
  // Results displays
  const finalScoreDisplay = document.getElementById('final-score');
  const finalLevelDisplay = document.getElementById('final-level');
  const finalSequenceDisplay = document.getElementById('final-sequence');
  const levelCompleteScoreDisplay = document.getElementById('level-complete-score');
  const levelCompleteSequenceDisplay = document.getElementById('level-complete-sequence');
  
  // Game state variables
  let currentLevel = 1;
  let currentScore = 0;
  let totalScore = 0;
  let sequence = [];
  let playerSequence = [];
  let isPlayingSequence = false;
  let isListening = false;
  let isSoundEnabled = true;
  let difficultyLevel = 'easy';
  let maxLevelReached = 1;
  let maxSequenceLength = 3;
  
  // Synth for audio
  let synth = null;
  
  // Difficulty settings
  const difficulties = {
    easy: {
      startLength: 3,
      maxMistakes: 3,
      speedFactor: 1.0,
      pointsPerCorrect: 10
    },
    medium: {
      startLength: 4,
      maxMistakes: 2,
      speedFactor: 0.8,
      pointsPerCorrect: 15
    },
    hard: {
      startLength: 5,
      maxMistakes: 1,
      speedFactor: 0.6,
      pointsPerCorrect: 20
    }
  };
  
  // Notes for each pad (can be customized)
  const notes = ["C4", "E4", "G4", "B4", "D5", "F5"];
  
  // Initialize audio context
  async function initAudio() {
    // Initialize Tone.js
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    console.log("Audio is ready");
  }
  
  // Setup event listeners
  function setupEvents() {
    // Start button
    startBtn.addEventListener('click', startGame);
    
    // Difficulty level buttons
    levelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        levelButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficultyLevel = btn.dataset.level;
      });
    });
    
    // Audio pads
    audioPads.forEach(pad => {
      pad.addEventListener('click', () => {
        if (isListening && !isPlayingSequence) {
          const padIndex = parseInt(pad.dataset.pad);
          playPad(padIndex);
          checkPadInput(padIndex);
        }
      });
    });
    
    // Play sequence button
    playSequenceBtn.addEventListener('click', () => {
      if (!isPlayingSequence) {
        playSequence();
      }
    });
    
    // Sound toggle button
    soundToggleBtn.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      soundToggleBtn.innerHTML = isSoundEnabled ? 
        '<i class="fas fa-volume-up"></i> Ses' : 
        '<i class="fas fa-volume-mute"></i> Ses';
    });
    
    // Restart button
    restartButton.addEventListener('click', () => {
      hideAllScreens();
      showScreen(introScreen);
    });
    
    // Back to menu button
    backToMenuBtn.addEventListener('click', () => {
      hideAllScreens();
      showScreen(introScreen);
    });
    
    // Next level button
    nextLevelBtn.addEventListener('click', () => {
      hideAllScreens();
      showScreen(gameScreen);
      startNextLevel();
    });
  }
  
  // Helper function to hide all screens
  function hideAllScreens() {
    introScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    levelCompleteScreen.style.display = 'none';
  }
  
  // Helper function to show a specific screen
  function showScreen(screen) {
    screen.style.display = 'block';
  }
  
  // Start the game
  async function startGame() {
    if (!synth) {
      await initAudio();
    }
    
    // Reset game state
    currentLevel = 1;
    currentScore = 0;
    totalScore = 0;
    maxLevelReached = 1;
    maxSequenceLength = difficulties[difficultyLevel].startLength;
    
    // Update UI
    currentLevelDisplay.textContent = currentLevel;
    scoreValueDisplay.textContent = currentScore;
    sequenceLengthDisplay.textContent = maxSequenceLength;
    
    // Hide intro and show game
    hideAllScreens();
    showScreen(gameScreen);
    
    // Start first level
    startLevel();
  }
  
  // Start a level
  function startLevel() {
    // Reset level-specific state
    sequence = [];
    playerSequence = [];
    isPlayingSequence = false;
    isListening = false;
    
    // Generate new sequence
    generateSequence();
    
    // Update UI
    currentLevelDisplay.textContent = currentLevel;
    sequenceLengthDisplay.textContent = sequence.length;
    
    // Update status message
    updateStatus('Dinle ve izle...', 'Ses dizisini hafızana kaydet');
    
    // Play the sequence after a short delay
    setTimeout(() => {
      playSequence();
    }, 1000);
  }
  
  // Generate a random sequence for the current level
  function generateSequence() {
    const sequenceLength = difficulties[difficultyLevel].startLength + (currentLevel - 1);
    maxSequenceLength = Math.max(maxSequenceLength, sequenceLength);
    
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(Math.floor(Math.random() * 6)); // 6 pads
    }
  }
  
  // Play the entire sequence
  function playSequence() {
    if (isPlayingSequence) return;
    
    isPlayingSequence = true;
    isListening = false;
    let index = 0;
    
    // Disable play button during sequence playback
    playSequenceBtn.disabled = true;
    
    // Update status
    updateStatus('Dinle ve izle...', 'Ses dizisini hafızana kaydet');
    
    // Play each pad in sequence with timing
    const sequenceInterval = setInterval(() => {
      if (index < sequence.length) {
        playPad(sequence[index]);
        index++;
      } else {
        clearInterval(sequenceInterval);
        isPlayingSequence = false;
        isListening = true;
        playSequenceBtn.disabled = false;
        
        // Update status for player's turn
        updateStatus('Senin sıran!', 'Diziyi aynı sırayla tekrarla');
      }
    }, 800 * difficulties[difficultyLevel].speedFactor);
  }
  
  // Play a specific pad (with sound and animation)
  function playPad(padIndex) {
    if (padIndex < 0 || padIndex >= audioPads.length) return;
    
    const pad = audioPads[padIndex];
    
    // Visual feedback
    pad.classList.add('playing');
    setTimeout(() => {
      pad.classList.remove('playing');
    }, 300);
    
    // Audio feedback
    if (isSoundEnabled && synth) {
      // Play the corresponding note
      synth.triggerAttackRelease(notes[padIndex], "8n");
    }
  }
  
  // Check player's pad input
  function checkPadInput(padIndex) {
    // Add to player's sequence
    playerSequence.push(padIndex);
    
    // Check if the input is correct
    const currentPosition = playerSequence.length - 1;
    
    if (sequence[currentPosition] === padIndex) {
      // Correct input
      
      // Add points
      currentScore += difficulties[difficultyLevel].pointsPerCorrect;
      scoreValueDisplay.textContent = currentScore;
      
      // Check if player completed the sequence
      if (playerSequence.length === sequence.length) {
        // Level completed!
        isListening = false;
        
        // Update status
        updateStatus('Harika!', 'Seviye tamamlandı');
        
        // Add level completion bonus
        const levelBonus = currentLevel * 50;
        currentScore += levelBonus;
        totalScore += currentScore;
        
        // Show level complete screen after short delay
        setTimeout(() => {
          levelCompleteScoreDisplay.textContent = currentScore;
          levelCompleteSequenceDisplay.textContent = sequence.length;
          hideAllScreens();
          showScreen(levelCompleteScreen);
          
          // Update max level
          maxLevelReached = Math.max(maxLevelReached, currentLevel);
          
          // Save score to leaderboard if logged in
          saveScore();
        }, 1000);
      }
    } else {
      // Wrong input - game over!
      isListening = false;
      
      // Update status
      updateStatus('Hata!', 'Yanlış sıralama');
      
      // Visual feedback - flash all pads red
      audioPads.forEach(pad => {
        pad.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.7)';
      });
      
      setTimeout(() => {
        audioPads.forEach(pad => {
          pad.style.boxShadow = '';
        });
        
        // Play correct sequence one more time
        playCorrectSequence();
        
        // Add current score to total
        totalScore += currentScore;
        
        // Show game over after sequence replay
        setTimeout(() => {
          finalScoreDisplay.textContent = totalScore;
          finalLevelDisplay.textContent = maxLevelReached;
          finalSequenceDisplay.textContent = maxSequenceLength;
          
          hideAllScreens();
          showScreen(gameOverScreen);
          
          // Save score to leaderboard if logged in
          saveScore();
        }, (sequence.length * 800) + 1000);
      }, 1000);
    }
  }
  
  // Play correct sequence after mistake
  function playCorrectSequence() {
    let index = 0;
    isPlayingSequence = true;
    
    updateStatus('Doğru sıralama', 'İzle ve öğren');
    
    const correctInterval = setInterval(() => {
      if (index < sequence.length) {
        playPad(sequence[index]);
        index++;
      } else {
        clearInterval(correctInterval);
        isPlayingSequence = false;
      }
    }, 800 * difficulties[difficultyLevel].speedFactor);
  }
  
  // Start next level
  function startNextLevel() {
    // Increment level
    currentLevel++;
    
    // Reset current level score but keep total
    currentScore = 0;
    scoreValueDisplay.textContent = currentScore;
    
    // Start new level
    startLevel();
  }
  
  // Update status message
  function updateStatus(message, submessage) {
    statusMessageDisplay.textContent = message;
    statusSubmessageDisplay.textContent = submessage;
  }
  
  // Save score to leaderboard
  function saveScore() {
    // Check if user is logged in
    const scoreData = {
      score: totalScore,
      game_type: 'audioMemory',
      level: maxLevelReached,
      sequence_length: maxSequenceLength,
      difficulty: difficultyLevel
    };
    
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
      
      // If user leveled up or got XP, show notification
      if (data.is_level_up) {
        showNotification(`Seviye atladın! Yeni seviye: ${data.level}`, 'success');
      } else if (data.xp_gained) {
        showNotification(`+${data.xp_gained} XP kazandın!`, 'info');
      }
    })
    .catch(error => {
      console.log('Error saving score:', error);
    });
  }
  
  // Show notification
  function showNotification(message, type) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = `game-notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);
    }, 100);
  }
  
  // Initialize the game
  function init() {
    setupEvents();
    // Try to initialize audio
    initAudio().catch(err => {
      console.error("Audio initialization error:", err);
      showNotification("Ses başlatılamadı. Oyuna devam etmek için sayfaya tıklayın.", "error");
    });
  }
  
  // Start initialization
  init();
});
