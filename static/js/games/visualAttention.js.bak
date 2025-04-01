/**
 * Görsel Dikkat Oyunu - 1.0
 * 
 * Görsel dikkat, odaklanma ve bellek egzersizi sunan profesyonel oyun.
 * 
 * Özellikler:
 * - Artan zorluk seviyelerine sahip görsel dikkat egzersizleri
 * - Özelleştirilebilir zorluk seviyesi
 * - Detaylı skor ve performans analizi
 * - Seviye sistemi ve ilerleme takibi
 * - Tam duyarlı (responsive) arayüz tasarımı
 * - Görsel ve işitsel geri bildirimler
 * - Profesyonel animasyonlar ve kullanıcı deneyimi
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const gameBoard = document.getElementById('game-board');
  const instructionsPanel = document.getElementById('instructions');
  const settingsPanel = document.getElementById('settings-panel');
  const controlPanel = document.getElementById('control-panel');
  const levelInfo = document.getElementById('level-info');
  const timerBarContainer = document.getElementById('timer-bar-container');
  const timerBar = document.getElementById('timer-bar');
  const levelDisplay = document.getElementById('level-display');
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const soundToggle = document.getElementById('sound-toggle');
  const pauseButton = document.getElementById('pause-button');
  const startButton = document.getElementById('start-game');
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  const messageOverlay = document.getElementById('message-overlay');
  const messageTitle = document.getElementById('message-title');
  const messageContent = document.getElementById('message-content');
  const finalScore = document.getElementById('final-score');
  const restartButton = document.getElementById('restart-button');
  const menuButton = document.getElementById('menu-button');

  // Game state
  let gameState = {
    isPlaying: false,
    isPaused: false,
    isMuted: false,
    level: 1,
    score: 0,
    difficulty: 'easy',
    timeRemaining: 0,
    timer: null,
    patterns: [],
    visiblePattern: null,
    missingIndex: null,
    gridSize: 16, // Starting grid size (4x4)
    displayTime: 3000, // Time to show patterns in milliseconds
    solveTime: 10000, // Time to solve in milliseconds
    targetCount: 6, // Number of targets to show
    currentPhase: 'idle' // 'idle', 'settings', 'memorize', 'solve', 'complete'
  };

  // Audio elements
  const sounds = {
    correct: new Audio(),
    incorrect: new Audio(),
    levelUp: new Audio(),
    click: new Audio(),
    gameOver: new Audio(),
    background: new Audio()
  };

  // Initialize sounds with base64 or placeholder URLs
  sounds.correct.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAiIiIiIiIiIiIiIiIiIiIiIiIiIjMzMzMzMzMzMzMzMzMzMzMzMzMzMz///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYHAAAAAAAAsGFLb9AAAAAAAAAAAAAAAAAAAP/jOMAAAAJFgdBAGAZGJAMAgBAMSKrk4DAEACCQH/j0I4QPBJjvwTiQHCcP/MRyJ4EgQP/3Ec8Dg4Efg8IHCB//xHMP/7zmAIH/cB4f/g+D9YHgfB9weD//EP//iQOAP/5wH/YMCcG4Jwd//EPsDg33//sY8g7cAwJwfB5wHgOBwHAfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8P/jOMAAAAGhAMgwAEAHABMIZDIAAAgABQADDmAMI/ERwAhGABAj+cRyJ4+D/+DBwIMfyAPg+/B4OfcHwcBPH//iOeBIPB44MODwf7AeB8HweB//wPDwQ41AOB7/+B45wQCMDwfSM78Hwe/wPgg6QP/8H+YEIsDw8B4Pg+D4JA4Xg8mB4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAAAIhAYhEAIAYAQj2SZcAAQAgCAQAgY5gHiQHBBIAcQHMuHAgyLnMZTEgiDgcH/83H/ZXLnlgGLiy4P/7zGoDA8j0HA8D4P/qgADwQB//9MPDgjqQ8H/8H+MRxIciQfBwEgOB4H9QY4Pgy57g/yA4P8YD9+B78HZRjw+DwPg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg';
    sounds.incorrect.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAc8AiIiIiIiIiIiIiIiIiIiIiIiIiIjMzMzMzMzMzMzMzMzMzMzMzMzMzMz///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJARAAAAAAAAAz1kLQwwAAAAAAAAAAAAAAAAAAP/jOMAAAAMRAaBAACBGRQOAEAoFAwCCxkCMDgOBACAYPBBeB4EiA4RwR/yhwfB8HkQ4OBwH/wfB/iHB4iODgOA4HgfB9+D4OCDHA///EcwcCOcHAf5gcHAcB0geB/UByAPDweB4P9gOA6Ef//8Q+B/kAeDweB4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABDYFgQAIAKgPBFAqTAAABCMCBAmIZ44HAjg45gHicJAciOPAAIIODgf/B4EOD4P84POB4Hwf7AeD/GD///OB4HwTAePB8HwcB4EgOB4H/YDoOBB8Hgf/B4APDAOCQPg/+D9GAcBccH2QB8Hwf/B/yAHAcBP/w+D4Pg/B8Hwf7AcHwQA8EAYLAcB0HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABHIJgQAAJCQPJFgqABGAgAgUDBQkBKh44D9QHLnEciHxIMkeAPB4Pg8CBmByJ5/kBwPwcCPB8HwPA8D4Pg+D4PzgPg/9+B4Hgf/B//A7p5cBnWBwfB+DgR/gP/UB/8HA///AA8HwN/+QHBXPLgQch8HwfyAdzg+DHAOA+H/4PDwHgcD8EMOCwOP/3A8B8HwfAYD4Pg+D4Ph/A8HwfB8HwfB8HwfB8HwfA';
    sounds.levelUp.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAf8AYGBgYGBgYGBgYGBgYGBgYGBgYGBggICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgwMDAwMDAwMDAwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg4ODg4ODg4ODg////////////////AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAVtAAAAAAAA/6caL0EAAAAAAAAAAAAAAAAAAP/jOMAAAANMAcBgAkBsikHQeEAoIJYFgcQcLAuDwOBQGBALAuCYOdYIA/wfBMkS4fByGBHPxIgOHl0sgkQnH+Y7qkHPweDg4MOC2D/iQcB+BwcH+QHBwIPA4PkwHAjuD8HA8DgOA8DgfB8HgcB0HwfB8HqA6DoPg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABKwJgQAgSTgPEEgqIEuWJcucSJfAEB8HM6HPuQB//kB+LgMA4DuHyoABB//HIh8RLlwGDh/iBIODOcB8EOO////B8HM63LlM4Pg+D4ENx/kBwf4wcjmB/+D+mA/ioDg+DuoHgPgx5gGCOP8w4cLAf/g4EODgcHzA5EPgOB4H/8GAWBJqf//lwfB8DwPA+D4PgTB4HwfAaGAOA6D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABJEHgQAgaWAPBDASZFZEAgAwdpAQIDgPg+CQEAOBwEgj/g7iBA+f8uA4P+XCwPg/zjlw4Pg+DIHhQPg+Af/wPLnHLgfB/kBzhzmBB8HhYHAeB0XB//8iHB4PIlwcB4HgOBwJ2I8H//9YHX/ygPh/zgPggBwPAOCOIc//uB4G+44PDwHwPA8DoPg+DwmcHHLi/yD5gfP/zD/l3/+kBwfKgPy4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABJUJAQAgWjwPAGAQGpZDgfHwYOHwPB3EODhgGBwYBodBKI+Jng84A/+DAsD/9QPAeDvMcueXB//Bw+QBguA+D4OA8D//+PAxwN28B//1AcMAtqg//Bg7mAaDoPg+D4Pg+D2oN+gOBwQB4f7D4Pg+D4iBw+cOeXzh/h/gP8DpAcHwYPDwHwf/wYP/w/xnHLg+C+cHy4Pgx4Pg+D4Pg+D4eBQHgfB8HwfB8HwfB8HwfB8H';
    sounds.click.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAVkAVVVVVVVVVVVVVVVVVVVVVVVVVVVVgICAgICAgICAgICAgICAgICAgICAgIC1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tf////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAPiAAAAAAAAWYpB5YEAAAAAAAAAAAAAAAAAAP/jOMAAAAJpAYFAADAIDgRKgQB4AAAIAACADgYuDA4Jnjl2+PyQBAEAVOJyJ44P//8j/KAcJA8PMf/yP//+IP//5weB4Hw=';
    sounds.gameOver.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAicAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQIAAAACAgICAgICAgICAgICAgICAgICAgICAgKAAAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoMAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwOAAAADg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OAAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAZGAAAAAAAAJ7FQ1ZcAAAAAAAAAAAAAAAAAAP/jOMAAAAPUAeAwBtCMikCBwMAgCBgCAQECEhIUEYZQMCwpDPLHQsWBhQNBYeA4f4N/LO/g8pgnGB4PB4MOApB3B/+D4f8PCh/xIOB//ig4cGePLgMBADhQDg8Dw8B+LgMH/5g5cCcP/+QHBj/EDgYsB4Pig4OQYLB7g//gg4CAGoOD/+D4f/wQcPg+HgYMP/ygPB8P4x0B4CQOAwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABMAFgQAABEAPKegkSAeAACIPxwZBbBpAcdqAgFggBgdYHAYFBBf82D//OJDg4EOJxIflyDgcEAeBA///EOBB8HweHgf/+REn+JB/1AcD/YPB3CQHgf4wcH/yg//B//B8HQQPLD//+B4YGwQB4H/+D/GHFzwcODwfg6D4Pg9MH+mB4HwfB8EAM7Ac0A4Pg+7A8HwOg8XAeB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABMANYQAABEASsWg0YAxBgGAICNxwGBEDBJHXVEzgaCQQBQWDEgY5y5UB7/OHPLh8gcCHBBw5//+QcH//kPNQQB4Hwf/+IHIhwcxnX//hzPkiP/B4MuHBweB80HDg/B//g+Dww+D/MOHy4HwfB8HweB8PuQcc0YeBwPggVg+CYYHgP/+B8Hy6oHB/5cD/qA/+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABHwKgQAAAZASyXgzCB6JAcAoBgYCDQIEgVHqI7a6WQEoLQsMBiCDDkP8oEcR+I/EhQQB7uWB//A7/CeP//Ah3/+C4P8R///8uDoK+pZXA8DwgDw58B//CA/wg//g//0g+XJAfjgOB8Hwf/B8MdYH//wOB/1Af48ODwH/8Hw+dw0ePh8Hwf7B+Dx//g71goLgd//B8Hx3LuDglB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABJoLgQAABJQPGIAYZZSAEhhA4PEwJQwShDjnBL1TLiuJDg+QHA/+H+I+C4c4f4jnzh/+H+QH/sGDg///h/h//8H//wfh8H//h//B//B//B//B///+H///8PA4I5cHwfBADg+7kHB/1Af/B/iO8H/8Hw/h/0gNPLgfB8PhQJAcEoP4eDodB//B9+D/eDvoDgcCGHh8HwcGng/B/1Af/B//B//B//B//B//B//B//B//B//B//B/';
    
    /* Real sound URLs would be used in production
    sounds.correct.src = '/static/sounds/correct.mp3';
    sounds.incorrect.src = '/static/sounds/incorrect.mp3';
    sounds.levelUp.src = '/static/sounds/level-up.mp3';
    sounds.click.src = '/static/sounds/click.mp3';
    sounds.gameOver.src = '/static/sounds/game-over.mp3';
    sounds.background.src = '/static/sounds/background.mp3';
    */

    // Preload all sounds
    for (const sound in sounds) {
      sounds[sound].load();
    }

    // Set background music properties
    sounds.background.loop = true;
    sounds.background.volume = 0.3;

    // Event listeners
    startButton.addEventListener('click', startSettings);
    soundToggle.addEventListener('click', toggleSound);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', restartGame);
    menuButton.addEventListener('click', () => {
      window.location.href = '/';
    });

    difficultyOptions.forEach(option => {
      option.addEventListener('click', () => {
        difficultyOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        gameState.difficulty = option.dataset.difficulty;
        playSound('click');
      });
    });

    // Game functions
    function startSettings() {
      playSound('click');
      instructionsPanel.style.display = 'none';
      settingsPanel.style.display = 'block';
      
      const startGameBtn = document.createElement('button');
      startGameBtn.className = 'btn-game';
      startGameBtn.textContent = 'Oyunu Başlat';
      startGameBtn.style.marginTop = '20px';
      startGameBtn.style.display = 'block';
      startGameBtn.style.margin = '20px auto 0';
      
      settingsPanel.appendChild(startGameBtn);
      
      startGameBtn.addEventListener('click', () => {
        playSound('click');
        startGame();
      });
    }

    function startGame() {
      gameState.level = 1;
      gameState.score = 0;
      gameState.isPlaying = true;
      gameState.isPaused = false;
      
      // Set difficulty parameters
      updateDifficultySettings();
      
      // Update UI
      settingsPanel.style.display = 'none';
      controlPanel.style.display = 'flex';
      gameBoard.style.display = 'block';
      levelInfo.style.display = 'block';
      timerBarContainer.style.display = 'block';
      
      levelDisplay.textContent = gameState.level;
      scoreDisplay.textContent = gameState.score;
      
      // Start background music
      if (!gameState.isMuted) {
        sounds.background.play();
      }
      
      startLevel();
    }

    function updateDifficultySettings() {
      // Set parameters based on difficulty
      switch(gameState.difficulty) {
        case 'easy':
          gameState.targetCount = 5 + Math.min(gameState.level - 1, 2);
          gameState.displayTime = 3000 - (gameState.level - 1) * 200;
          gameState.displayTime = Math.max(gameState.displayTime, 1500);
          gameState.solveTime = 10000 - (gameState.level - 1) * 500;
          gameState.solveTime = Math.max(gameState.solveTime, 5000);
          gameState.gridSize = 16; // 4x4
          break;
        case 'medium':
          gameState.targetCount = 7 + Math.min(gameState.level - 1, 3);
          gameState.displayTime = 2500 - (gameState.level - 1) * 200;
          gameState.displayTime = Math.max(gameState.displayTime, 1200);
          gameState.solveTime = 8000 - (gameState.level - 1) * 500;
          gameState.solveTime = Math.max(gameState.solveTime, 4000);
          gameState.gridSize = 25; // 5x5
          break;
        case 'hard':
          gameState.targetCount = 9 + Math.min(gameState.level - 1, 4);
          gameState.displayTime = 2000 - (gameState.level - 1) * 200;
          gameState.displayTime = Math.max(gameState.displayTime, 800);
          gameState.solveTime = 6000 - (gameState.level - 1) * 400;
          gameState.solveTime = Math.max(gameState.solveTime, 3000);
          gameState.gridSize = 36; // 6x6
          break;
      }
    }

    function startLevel() {
      // Update level info
      levelInfo.textContent = `Seviye ${gameState.level}: Desenleri izleyin`;
      updateScoreDisplay();
      
      // Clear game board
      gameBoard.innerHTML = '';
      
      // Generate patterns and game board
      generatePatterns();
      createGameBoard();
      
      // Start memorize phase
      gameState.currentPhase = 'memorize';
      showPatterns();
      
      // Set timer for memorize phase
      gameState.timeRemaining = gameState.displayTime / 1000;
      updateTimerDisplay();
      
      // Animate timer
      timerBar.style.width = '100%';
      
      // Start timer for memorize phase
      startTimer(gameState.displayTime, () => {
        hidePatterns();
        startSolvePhase();
      });
    }

    function generatePatterns() {
      const symbols = ['★', '♦', '♠', '♥', '♣', '▲', '■', '●', '◆', '✿', '✤', '✦', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '✹', '✺', '✻', '✼', '✽', '✾', '❄', '❅', '❆', '❈', '❉', '❊', '❋', '⟡', '⟢', '⟣', '⟤', '⟥', '⟦', '⟧', '⟨', '⟩', '⟪', '⟫', '⟬', '⟭', '⟮', '⟯', '⟰', '⟱', '⟲', '⟳', '⟴', '⟵', '⟶', '⟷', '⟸', '⟹', '⟺', '⟻'];
      
      // Shuffle symbols
      const shuffledSymbols = shuffleArray(symbols);
      
      // Generate unique grid positions
      const positions = [];
      for (let i = 0; i < gameState.gridSize; i++) {
        positions.push(i);
      }
      const shuffledPositions = shuffleArray(positions);
      
      // Take target number of positions
      const selectedPositions = shuffledPositions.slice(0, gameState.targetCount);
      
      // Create pattern objects with position and symbol
      gameState.patterns = [];
      for (let i = 0; i < gameState.targetCount; i++) {
        gameState.patterns.push({
          position: selectedPositions[i],
          symbol: shuffledSymbols[i]
        });
      }
      
      // Choose random pattern to be missing
      gameState.missingIndex = Math.floor(Math.random() * gameState.targetCount);
      gameState.visiblePattern = [...gameState.patterns];
    }

    function createGameBoard() {
      // Determine grid dimensions based on gridSize
      let cols;
      if (gameState.gridSize === 16) {
        cols = 4;
      } else if (gameState.gridSize === 25) {
        cols = 5;
      } else {
        cols = 6;
      }
      
      gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      
      // Create all grid items
      for (let i = 0; i < gameState.gridSize; i++) {
        const item = document.createElement('div');
        item.className = 'target-item';
        item.dataset.index = i;
        
        item.addEventListener('click', () => {
          if (gameState.currentPhase === 'solve') {
            checkAnswer(i);
          }
        });
        
        gameBoard.appendChild(item);
      }
    }

    function showPatterns() {
      // Show all patterns
      gameState.patterns.forEach(pattern => {
        const item = gameBoard.querySelector(`.target-item[data-index="${pattern.position}"]`);
        item.textContent = pattern.symbol;
        item.classList.add('highlight');
      });
    }

    function hidePatterns() {
      // Hide all patterns
      const items = gameBoard.querySelectorAll('.target-item');
      items.forEach(item => {
        item.textContent = '';
        item.classList.remove('highlight');
      });
    }

    function startSolvePhase() {
      // Update level info
      levelInfo.textContent = `Seviye ${gameState.level}: Eksik deseni bulun`;
      
      // Show visible patterns (all except the missing one)
      for (let i = 0; i < gameState.visiblePattern.length; i++) {
        if (i !== gameState.missingIndex) {
          const pattern = gameState.visiblePattern[i];
          const item = gameBoard.querySelector(`.target-item[data-index="${pattern.position}"]`);
          item.textContent = pattern.symbol;
        }
      }
      
      // Set phase
      gameState.currentPhase = 'solve';
      
      // Set timer for solve phase
      gameState.timeRemaining = gameState.solveTime / 1000;
      updateTimerDisplay();
      
      // Animate timer
      timerBar.style.width = '100%';
      
      // Start timer for solve phase
      startTimer(gameState.solveTime, () => {
        // Time's up!
        gameOver();
      });
    }

    function checkAnswer(position) {
      if (gameState.isPaused) return;
      
      const missingPattern = gameState.patterns[gameState.missingIndex];
      const clickedItem = gameBoard.querySelector(`.target-item[data-index="${position}"]`);
      
      if (position === missingPattern.position) {
        // Correct answer
        clickedItem.textContent = missingPattern.symbol;
        clickedItem.classList.add('correct');
        playSound('correct');
        
        // Calculate score based on time remaining
        const timeBonus = Math.ceil(gameState.timeRemaining * 10);
        const levelBonus = gameState.level * 50;
        const difficultyMultiplier = gameState.difficulty === 'easy' ? 1 : 
                                     gameState.difficulty === 'medium' ? 1.5 : 2;
        
        const pointsEarned = Math.floor((100 + timeBonus + levelBonus) * difficultyMultiplier);
        gameState.score += pointsEarned;
        
        // Clear timer
        if (gameState.timer) {
          clearInterval(gameState.timer);
        }
        
        // Show success message with animation
        const successOverlay = document.createElement('div');
        successOverlay.className = 'message-overlay';
        successOverlay.style.backgroundColor = 'rgba(50, 205, 50, 0.7)';
        
        const successBox = document.createElement('div');
        successBox.className = 'message-box';
        successBox.style.background = 'linear-gradient(135deg, #34c759 0%, #2ea043 100%)';
        
        successBox.innerHTML = `
          <h2 class="message-title">Harika!</h2>
          <p class="message-content">
            Doğru cevap!
            <span class="score-highlight">+${pointsEarned}</span>
            puan kazandınız!
          </p>
        `;
        
        successOverlay.appendChild(successBox);
        document.body.appendChild(successOverlay);
        
        // Update score display
        updateScoreDisplay();
        
        // Remove success message after a short delay and go to next level
        setTimeout(() => {
          document.body.removeChild(successOverlay);
          nextLevel();
        }, 1500);
      } else {
        // Wrong answer
        const wrongItem = gameBoard.querySelector(`.target-item[data-index="${position}"]`);
        wrongItem.classList.add('incorrect');
        playSound('incorrect');
        
        // Reduce score (if greater than 0)
        const penaltyPoints = Math.min(25, gameState.score);
        gameState.score = Math.max(0, gameState.score - penaltyPoints);
        updateScoreDisplay();
        
        // Remove incorrect class after a short delay
        setTimeout(() => {
          wrongItem.classList.remove('incorrect');
        }, 500);
      }
    }

    function nextLevel() {
      gameState.level++;
      
      // Play level up sound
      playSound('levelUp');
      
      // Update difficulty settings based on new level
      updateDifficultySettings();
      
      // Start the next level
      startLevel();
    }

    function gameOver() {
      // Clear all timers
      if (gameState.timer) {
        clearInterval(gameState.timer);
      }
      
      // Stop background music
      sounds.background.pause();
      sounds.background.currentTime = 0;
      
      // Play game over sound
      playSound('gameOver');
      
      // Show answer
      const missingPattern = gameState.patterns[gameState.missingIndex];
      const missedItem = gameBoard.querySelector(`.target-item[data-index="${missingPattern.position}"]`);
      missedItem.textContent = missingPattern.symbol;
      missedItem.classList.add('highlight');
      
      // Set game state
      gameState.isPlaying = false;
      
      // Prepare game over message
      messageTitle.textContent = 'Oyun Bitti!';
      
      // Customize message based on score
      let message = '';
      if (gameState.score > 2000) {
        message = 'İnanılmaz bir performans! Olağanüstü görsel dikkat becerinizi gösterdiniz!';
      } else if (gameState.score > 1000) {
        message = 'Muhteşem! Görsel dikkatiniz çok gelişmiş!';
      } else if (gameState.score > 500) {
        message = 'Harika bir çaba! Görsel dikkat becerileriniz gelişiyor!';
      } else {
        message = 'İyi bir başlangıç! Düzenli pratikle görsel dikkatinizi geliştirebilirsiniz.';
      }
      
      messageContent.innerHTML = `
        ${message}
        <span class="score-highlight">${gameState.score}</span>
        puan kazandınız!
      `;
      
      finalScore.textContent = gameState.score;
      
      // Show message overlay
      messageOverlay.style.display = 'flex';
      
      // Try to save score
      saveScore();
    }

    function restartGame() {
      // Hide message overlay
      messageOverlay.style.display = 'none';
      
      // Start new game
      startGame();
    }

    function togglePause() {
      if (!gameState.isPlaying) return;
      
      if (gameState.isPaused) {
        // Unpause
        gameState.isPaused = false;
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        
        // If in the middle of a timer, restart it
        if (gameState.currentPhase === 'memorize' || gameState.currentPhase === 'solve') {
          startTimer(gameState.timeRemaining * 1000);
        }
        
        // Unpause background music
        if (!gameState.isMuted) {
          sounds.background.play();
        }
      } else {
        // Pause
        gameState.isPaused = true;
        pauseButton.innerHTML = '<i class="fas fa-play"></i>';
        
        // Clear existing timer
        if (gameState.timer) {
          clearInterval(gameState.timer);
        }
        
        // Pause background music
        sounds.background.pause();
      }
    }

    function toggleSound() {
      gameState.isMuted = !gameState.isMuted;
      
      if (gameState.isMuted) {
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        sounds.background.pause();
      } else {
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        if (gameState.isPlaying && !gameState.isPaused) {
          sounds.background.play();
        }
      }
    }

    function playSound(soundName) {
      if (gameState.isMuted) return;
      
      // Instead of trying to play sounds (which causes errors),
      // we'll just log that we would play a sound
      console.log(`Sound effect played: ${soundName}`);
      
      // Using a visual feedback instead of sound
      // This creates a brief flash effect to indicate something happened
      switch(soundName) {
        case 'correct':
          flashEffect('#34c759', 300); // Green flash for correct
          break;
        case 'incorrect':
          flashEffect('#ff3b30', 300); // Red flash for incorrect
          break;
        case 'levelUp':
          flashEffect('#5b42f3', 500); // Purple flash for level up
          break;
        case 'gameOver':
          flashEffect('#ff9500', 700); // Orange flash for game over
          break;
        default:
          // No flash effect for other sounds
          break;
      }
    }
    
    // Visual feedback instead of sound
    function flashEffect(color, duration) {
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'fixed';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = color;
      flashOverlay.style.opacity = '0.2';
      flashOverlay.style.pointerEvents = 'none';
      flashOverlay.style.zIndex = '9999';
      flashOverlay.style.transition = 'opacity 0.3s ease';
      
      document.body.appendChild(flashOverlay);
      
      setTimeout(() => {
        flashOverlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flashOverlay);
        }, 300);
      }, duration);
    }

    function startTimer(duration, callbackFn) {
      // Clear existing timer
      if (gameState.timer) {
        clearInterval(gameState.timer);
      }
      
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      gameState.timer = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = Math.max(0, endTime - currentTime);
        
        if (timeLeft <= 0) {
          clearInterval(gameState.timer);
          gameState.timeRemaining = 0;
          updateTimerDisplay();
          timerBar.style.width = '0%';
          
          if (callbackFn) {
            callbackFn();
          }
        } else {
          gameState.timeRemaining = timeLeft / 1000;
          updateTimerDisplay();
          
          // Update timer bar
          const percentLeft = (timeLeft / duration) * 100;
          timerBar.style.width = `${percentLeft}%`;
        }
      }, 100);
    }

    function updateScoreDisplay() {
      scoreDisplay.textContent = gameState.score;
    }

    function updateTimerDisplay() {
      timeDisplay.textContent = Math.ceil(gameState.timeRemaining);
    }

    function saveScore() {
      // Save score to backend
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameType: 'visualAttention',
          score: gameState.score
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Score saved successfully!');
          // Could add some visual feedback here if needed
        } else {
          console.log('Failed to save score:', data.message);
          // Handle error, maybe show login prompt
          if (data.message === 'Login required') {
            // Could show a login prompt
          }
        }
      })
      .catch(error => {
        console.error('Error saving score:', error);
      });
    }

    // Utility functions
    function shuffleArray(array) {
      // Create a copy of the array
      const shuffled = [...array];
      
      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled;
    }
});