/**
 * Game Responsive Modernizer
 * This script enhances and modernizes game interfaces for better mobile experience
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Detect game type based on URL or content
  const gameType = detectGameType();
  
  // Apply general modernization to all games
  applyGeneralModernization();
  
  // Apply game-specific modernizations
  if (gameType) {
    applyGameSpecificModernization(gameType);
  }
  
  // Apply mobile-specific improvements
  if (isMobileDevice()) {
    applyMobileImprovements(gameType);
  }
});

/**
 * Detect which game is currently being played
 * @returns {string|null} The detected game type or null if not detected
 */
function detectGameType() {
  const url = window.location.pathname;
  
  if (url.includes('tetris')) return 'tetris';
  if (url.includes('iqTest')) return 'iqTest';
  if (url.includes('typingSpeed')) return 'typingSpeed';
  if (url.includes('puzzleSlider')) return 'puzzleSlider';
  if (url.includes('colorMatch')) return 'colorMatch';
  if (url.includes('mathChallenge')) return 'mathChallenge';
  if (url.includes('snake')) return 'snake';
  
  // Alternative detection method using page content if URL detection fails
  const pageContent = document.body.textContent;
  
  if (pageContent.includes('Tetris') && pageContent.includes('Klasik Blok Puzzle')) return 'tetris';
  if (pageContent.includes('IQ Test') && pageContent.includes('Zeka ve Mantık')) return 'iqTest';
  if (pageContent.includes('Yazma Hızı') && pageContent.includes('Klavye Hız Testi')) return 'typingSpeed';
  if (pageContent.includes('Puzzle Slider') && pageContent.includes('Görsel Bulmaca')) return 'puzzleSlider';
  if (pageContent.includes('Renk Eşleştirme') && pageContent.includes('Odaklanma Oyunu')) return 'colorMatch';
  if (pageContent.includes('Matematik Mücadelesi') && pageContent.includes('Sayısal Beceri')) return 'mathChallenge';
  if (pageContent.includes('Yılan Oyunu') && pageContent.includes('Klasik Arcade')) return 'snake';
  
  return null;
}

/**
 * Check if the user is on a mobile device
 * @returns {boolean} True if it's a mobile device
 */
function isMobileDevice() {
  return (window.innerWidth <= 768) || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Apply general modernization improvements to all games
 */
function applyGeneralModernization() {
  // Add main CSS file link if not already included
  if (!document.querySelector('link[href*="game-responsive-modernizer.css"]')) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/static/css/game-responsive-modernizer.css';
    document.head.appendChild(cssLink);
  }
  
  // Modernize the game container
  const gameContainer = document.querySelector('.game-container');
  if (gameContainer) {
    gameContainer.classList.add('modernized-game-container');
  }
  
  // Modernize the game header
  const gameHeader = document.querySelector('.game-header');
  if (gameHeader) {
    gameHeader.classList.add('modernized-game-header');
  }
  
  // Add smooth scrolling to all game pages
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Modernize buttons
  modernizeButtons();
}

/**
 * Apply game-specific modernization
 * @param {string} gameType The type of game to modernize
 */
function applyGameSpecificModernization(gameType) {
  switch (gameType) {
    case 'tetris':
      modernizeTetris();
      break;
    case 'iqTest':
      modernizeIQTest();
      break;
    case 'typingSpeed':
      modernizeTypingSpeed();
      break;
    case 'puzzleSlider':
      modernizePuzzleSlider();
      break;
    case 'colorMatch':
      modernizeColorMatch();
      break;
    case 'mathChallenge':
      modernizeMathChallenge();
      break;
    case 'snake':
      modernizeSnake();
      break;
  }
}

/**
 * Apply mobile-specific improvements
 * @param {string} gameType The type of game
 */
function applyMobileImprovements(gameType) {
  // Increase button sizes for better touch targets
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(button => {
    if (!button.classList.contains('modernized-btn')) {
      button.style.minHeight = '48px';
      button.style.padding = button.classList.contains('btn-sm') ? '8px 16px' : '12px 24px';
    }
  });
  
  // Ensure inputs have sufficient touch target size
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]');
  inputs.forEach(input => {
    input.style.minHeight = '48px';
    input.style.fontSize = '16px'; // Prevent zoom on iOS
  });
  
  // Add active states for better touch feedback
  document.body.addEventListener('touchstart', function() {}, { passive: true });
  
  // Game-specific mobile improvements
  if (gameType === 'tetris') {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.style.display = 'grid';
    }
  }
  
  if (gameType === 'snake') {
    const mobileControls = document.querySelector('.snake-mobile-controls');
    if (mobileControls) {
      mobileControls.style.display = 'flex';
    }
  }
}

/**
 * Modernize button styles across the game
 */
function modernizeButtons() {
  const buttons = document.querySelectorAll('button:not(.modernized-btn), .btn:not(.modernized-btn)');
  
  buttons.forEach(button => {
    // Skip buttons that are part of frameworks or special components
    if (button.classList.contains('navbar-toggler') || 
        button.closest('.modal-content') ||
        button.getAttribute('data-dismiss') ||
        button.getAttribute('data-toggle')) {
      return;
    }
    
    // Apply modernized button classes
    button.classList.add('modernized-btn');
    
    if (button.classList.contains('btn-primary')) {
      button.classList.add('modernized-btn-primary');
    } else if (button.classList.contains('btn-secondary') || button.classList.contains('btn-outline-light')) {
      button.classList.add('modernized-btn-secondary');
    } else if (button.classList.contains('btn-success')) {
      button.classList.add('modernized-btn-success');
    } else if (button.classList.contains('btn-warning') || button.classList.contains('btn-outline-warning')) {
      button.classList.add('modernized-btn-warning');
    } else if (button.classList.contains('btn-danger') || button.classList.contains('btn-outline-danger')) {
      button.classList.add('modernized-btn-danger');
    }
    
    if (button.classList.contains('btn-lg')) {
      button.classList.add('modernized-btn-lg');
    } else if (button.classList.contains('btn-sm')) {
      button.classList.add('modernized-btn-sm');
    }
    
    if (button.classList.contains('btn-block')) {
      button.classList.add('modernized-btn-block');
    }
  });
}

/**
 * Tetris game modernization
 */
function modernizeTetris() {
  // Find tetris container
  const tetrisContainer = document.querySelector('.tetris-container');
  if (!tetrisContainer) return;
  
  // Apply modernized container
  tetrisContainer.classList.add('modernized-tetris-container');
  
  // Modernize tetris board
  const tetrisBoard = document.querySelector('.tetris-board-container');
  if (tetrisBoard) {
    tetrisBoard.classList.add('modernized-tetris-board');
  }
  
  // Modernize tetris canvas
  const tetrisCanvas = document.getElementById('tetris-canvas');
  if (tetrisCanvas) {
    tetrisCanvas.classList.add('modernized-tetris-canvas');
  }
  
  // Ensure touch controls are visible on mobile
  if (isMobileDevice()) {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.style.display = 'grid';
      touchControls.classList.add('modernized-tetris-controls');
      
      // Modernize touch control buttons
      const touchButtons = touchControls.querySelectorAll('.touch-control-btn');
      touchButtons.forEach(btn => {
        btn.classList.add('modernized-tetris-touch-btn');
      });
    }
  }
  
  // Make sure instructions are collapsed on mobile
  if (isMobileDevice()) {
    const helpSection = document.querySelector('.tetris-help');
    if (helpSection) {
      // Create collapsible instructions
      const title = helpSection.querySelector('.tetris-help-title');
      const items = helpSection.querySelector('.tetris-help-items');
      
      if (title && items) {
        items.style.display = 'none';
        
        title.style.cursor = 'pointer';
        title.innerHTML += ' <i class="fas fa-chevron-down"></i>';
        
        title.addEventListener('click', function() {
          if (items.style.display === 'none') {
            items.style.display = 'grid';
            title.innerHTML = title.innerHTML.replace('fa-chevron-down', 'fa-chevron-up');
          } else {
            items.style.display = 'none';
            title.innerHTML = title.innerHTML.replace('fa-chevron-up', 'fa-chevron-down');
          }
        });
      }
    }
  }
}

/**
 * IQ Test modernization
 */
function modernizeIQTest() {
  // Find IQ Test container
  const iqContainer = document.querySelector('.iq-test-container');
  if (!iqContainer) return;
  
  // Apply modernized container
  iqContainer.classList.add('modernized-iq-test-container');
  
  // Modernize question container
  const questionContainer = document.querySelector('.question-container');
  if (questionContainer) {
    questionContainer.classList.add('modernized-iq-question');
  }
  
  // Modernize question text
  const questionText = document.querySelector('.question-text');
  if (questionText) {
    questionText.classList.add('modernized-iq-question-text');
  }
  
  // Modernize options
  const optionsContainer = document.querySelector('.options-container');
  if (optionsContainer) {
    optionsContainer.classList.add('modernized-iq-options');
    
    // Add classes to options
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => {
      option.classList.add('modernized-iq-option');
    });
  }
  
  // Optimize navigation on mobile
  if (isMobileDevice()) {
    const navigation = document.querySelector('.question-navigation');
    if (navigation) {
      navigation.classList.add('modernized-game-controls');
    }
  }
}

/**
 * Typing Speed game modernization
 */
function modernizeTypingSpeed() {
  // Find Typing Speed container
  const typingContainer = document.querySelector('.typing-container');
  if (!typingContainer) return;
  
  // Apply modernized container
  typingContainer.classList.add('modernized-typing-container');
  
  // Modernize typing text area
  const typingText = document.querySelector('.typing-text');
  if (typingText) {
    typingText.classList.add('modernized-typing-text');
  }
  
  // Modernize input field
  const inputField = document.querySelector('.input-field');
  if (inputField) {
    inputField.classList.add('modernized-typing-input');
  }
  
  // Optimize stats display for mobile
  if (isMobileDevice()) {
    const typingStats = document.querySelector('.typing-stats');
    if (typingStats) {
      typingStats.classList.add('modernized-stats-bar');
      
      const statItems = typingStats.querySelectorAll('.stat-item');
      statItems.forEach(item => {
        item.classList.add('modernized-stat-item');
      });
      
      const statLabels = typingStats.querySelectorAll('.stat-label');
      statLabels.forEach(label => {
        label.classList.add('modernized-stat-label');
      });
      
      const statValues = typingStats.querySelectorAll('.stat-value');
      statValues.forEach(value => {
        value.classList.add('modernized-stat-value');
      });
    }
  }
  
  // Optimize controls for mobile
  if (isMobileDevice()) {
    const controls = document.querySelector('.typing-controls');
    if (controls) {
      controls.classList.add('modernized-game-controls');
    }
  }
}

/**
 * Puzzle Slider game modernization
 */
function modernizePuzzleSlider() {
  // Find Puzzle Slider container
  const puzzleContainer = document.querySelector('.puzzle-slider-container');
  if (!puzzleContainer) return;
  
  // Apply modernized container
  puzzleContainer.classList.add('modernized-puzzle-container');
  
  // Modernize puzzle board
  const puzzleBoard = document.querySelector('.puzzle-board');
  if (puzzleBoard) {
    puzzleBoard.classList.add('modernized-puzzle-board');
    
    // Optimize puzzle tiles with better touch areas
    const tiles = puzzleBoard.querySelectorAll('.puzzle-tile');
    tiles.forEach(tile => {
      tile.classList.add('modernized-puzzle-tile');
    });
  }
  
  // Modernize controls
  const puzzleControls = document.querySelector('.puzzle-controls');
  if (puzzleControls) {
    puzzleControls.classList.add('modernized-game-controls');
  }
  
  // Make puzzle instructions collapsible on mobile
  if (isMobileDevice()) {
    const instructions = document.querySelector('.game-instructions');
    if (instructions) {
      // Create collapsible instructions
      const title = instructions.querySelector('.instruction-title');
      const list = instructions.querySelector('.instruction-list');
      
      if (title && list) {
        list.style.display = 'none';
        
        title.style.cursor = 'pointer';
        title.innerHTML = title.innerHTML.replace('fa-info-circle', 'fa-info-circle fa-chevron-down');
        
        title.addEventListener('click', function() {
          if (list.style.display === 'none') {
            list.style.display = 'block';
            title.innerHTML = title.innerHTML.replace('fa-chevron-down', 'fa-chevron-up');
          } else {
            list.style.display = 'none';
            title.innerHTML = title.innerHTML.replace('fa-chevron-up', 'fa-chevron-down');
          }
        });
      }
    }
  }
  
  // Optimize puzzle tiles size based on screen width for mobile
  if (isMobileDevice()) {
    const puzzleTiles = document.querySelectorAll('.puzzle-tile');
    const boardSize = getComputedStyle(document.documentElement).getPropertyValue('--board-size') || 3;
    
    // Determine optimal tile size based on screen width
    const screenWidth = window.innerWidth;
    const maxBoardWidth = Math.min(screenWidth * 0.85, 350); // 85% of screen width or max 350px
    const tileSize = Math.floor(maxBoardWidth / boardSize) - 10; // Subtract gap/padding
    
    puzzleTiles.forEach(tile => {
      tile.style.width = `${tileSize}px`;
      tile.style.height = `${tileSize}px`;
      tile.style.fontSize = `${Math.max(tileSize / 2.5, 18)}px`; // Responsive font size
    });
  }
}

/**
 * Color Match game modernization
 */
function modernizeColorMatch() {
  // Find Color Match container
  const colorContainer = document.querySelector('.color-match-container');
  if (!colorContainer) return;
  
  // Apply modernized container
  colorContainer.classList.add('modernized-color-match-container');
  
  // Modernize color word
  const colorWord = document.querySelector('.color-word, #color-word');
  if (colorWord) {
    colorWord.classList.add('modernized-color-word');
  }
  
  // Modernize game controls
  const gameControls = document.querySelector('.game-controls');
  if (gameControls) {
    gameControls.classList.add('modernized-color-controls');
    
    // Add classes to answer buttons
    const trueBtn = document.querySelector('.true-btn, #true-btn');
    if (trueBtn) {
      trueBtn.classList.add('modernized-color-btn', 'true');
    }
    
    const falseBtn = document.querySelector('.false-btn, #false-btn');
    if (falseBtn) {
      falseBtn.classList.add('modernized-color-btn', 'false');
    }
  }
  
  // Modernize status display
  const gameStatus = document.querySelector('.game-status');
  if (gameStatus) {
    gameStatus.classList.add('modernized-stats-bar');
    
    const statusItems = gameStatus.querySelectorAll('.status-item');
    statusItems.forEach(item => {
      item.classList.add('modernized-stat-item');
    });
    
    const statusLabels = gameStatus.querySelectorAll('.status-label');
    statusLabels.forEach(label => {
      label.classList.add('modernized-stat-label');
    });
    
    const statusValues = gameStatus.querySelectorAll('.status-value');
    statusValues.forEach(value => {
      value.classList.add('modernized-stat-value');
    });
  }
}

/**
 * Math Challenge game modernization
 */
function modernizeMathChallenge() {
  // Find Math Challenge container
  const mathContainer = document.querySelector('.math-container');
  if (!mathContainer) return;
  
  // Apply modernized container
  mathContainer.classList.add('modernized-math-container');
  
  // Modernize math problem
  const mathProblem = document.querySelector('.math-problem');
  if (mathProblem) {
    mathProblem.classList.add('modernized-math-problem');
    
    const problemText = document.getElementById('problem-text');
    if (problemText) {
      problemText.classList.add('modernized-math-problem-text');
    }
  }
  
  // Modernize answer input
  const answerInput = document.querySelector('.answer-input');
  if (answerInput) {
    answerInput.classList.add('modernized-math-input');
    
    // Make sure input has numeric keyboard on mobile
    const input = document.getElementById('answer-input');
    if (input) {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('pattern', '[0-9]*');
    }
  }
  
  // Modernize HUD
  const gameHud = document.querySelector('.game-hud');
  if (gameHud) {
    const hudItems = gameHud.querySelectorAll('.hud-item');
    hudItems.forEach(item => {
      item.classList.add('modernized-stat-item');
    });
    
    const hudLabels = gameHud.querySelectorAll('.hud-label');
    hudLabels.forEach(label => {
      label.classList.add('modernized-stat-label');
    });
    
    const hudValues = gameHud.querySelectorAll('.hud-value');
    hudValues.forEach(value => {
      value.classList.add('modernized-stat-value');
    });
  }
  
  // Optimize for mobile
  if (isMobileDevice()) {
    // Focus input field when touching the problem text
    const problemText = document.getElementById('problem-text');
    const input = document.getElementById('answer-input');
    
    if (problemText && input) {
      problemText.addEventListener('click', function() {
        input.focus();
      });
    }
  }
}

/**
 * Snake game modernization
 */
function modernizeSnake() {
  // Find Snake container
  const snakeContainer = document.querySelector('.snake-container');
  if (!snakeContainer) return;
  
  // Apply modernized container
  snakeContainer.classList.add('modernized-snake-container');
  
  // Modernize snake game canvas
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.add('modernized-snake-canvas');
  }
  
  // Modernize mobile controls
  const mobileControls = document.querySelector('.snake-mobile-controls');
  if (mobileControls) {
    mobileControls.classList.add('modernized-snake-controls');
    
    // Style control buttons
    const controlButtons = mobileControls.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
      btn.classList.add('modernized-snake-btn');
      
      if (btn.id === 'up-btn') btn.classList.add('up');
      if (btn.id === 'left-btn') btn.classList.add('left');
      if (btn.id === 'right-btn') btn.classList.add('right');
      if (btn.id === 'down-btn') btn.classList.add('down');
    });
  }
  
  // Modernize stats
  const snakeStats = document.querySelector('.snake-stats');
  if (snakeStats) {
    const statItems = snakeStats.querySelectorAll('.stat-item');
    statItems.forEach(item => {
      item.classList.add('modernized-stat-item');
    });
    
    const statLabels = snakeStats.querySelectorAll('.stat-label');
    statLabels.forEach(label => {
      label.classList.add('modernized-stat-label');
    });
    
    const statValues = snakeStats.querySelectorAll('.stat-value');
    statValues.forEach(value => {
      value.classList.add('modernized-stat-value');
    });
  }
  
  // Improve mobile layout
  if (isMobileDevice()) {
    // Ensure the canvas is not too large
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      const screenWidth = window.innerWidth;
      const canvasSize = Math.min(screenWidth * 0.85, 350);
      
      gameCanvas.style.width = `${canvasSize}px`;
      gameCanvas.style.height = `${canvasSize}px`;
    }
    
    // Show mobile controls
    const mobileControls = document.querySelector('.snake-mobile-controls');
    if (mobileControls) {
      mobileControls.style.display = 'flex';
    }
  }
}

// Additional utility functions can be added here