/**
 * game-modernizer.js
 * Bu script, var olan oyunları modernize etmek için dinamik olarak CSS ekler
 * ve gerekli DOM manipülasyonlarını gerçekleştirir.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Modernize edici CSS dosyasını ekle
  const modernizeCSS = document.createElement('link');
  modernizeCSS.rel = 'stylesheet';
  modernizeCSS.href = '/static/css/game-modernizer.css';
  document.head.appendChild(modernizeCSS);
  
  // Font Awesome'ı ekle (simgeler için)
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  // Hangi oyunun sayfasında olduğumuzu belirle
  const currentPage = getGameType();
  
  // Sayfa yapısını düzenle
  wrapPageContent();
  
  // Oyun tipine göre özel modernizasyon işlemlerini uygula
  applyGameSpecificModernization(currentPage);
  
  // Bildirim sistemini ekle
  addNotificationSystem();
  
  // Mobil düğmeleri ekle (gerekirse)
  addMobileControls(currentPage);
  
  console.log(`${currentPage} oyunu modernize edildi.`);
});

/**
 * Sayfanın içeriğini modern konteynerlerle sarar
 */
function wrapPageContent() {
  const mainElement = document.querySelector('main');
  if (!mainElement) return;
  
  // Sayfanın orijinal içeriğini al
  const originalContent = mainElement.innerHTML;
  
  // Sayfa başlığını ve açıklamasını çıkar
  const pageTitle = document.querySelector('h1, h2, .game-title')?.textContent || document.title;
  const pageDescription = document.querySelector('p, .game-description')?.textContent || '';
  
  // Modernize edilmiş yapıyı oluştur
  mainElement.innerHTML = `
    <div class="page-container">
      <div class="game-container">
        <div class="game-header">
          <h1>${pageTitle}</h1>
          <p class="game-description">${pageDescription}</p>
        </div>
        <div class="game-content">${originalContent}</div>
      </div>
    </div>
  `;
}

/**
 * Hangi oyun sayfasında olduğumuzu belirler
 */
function getGameType() {
  const url = window.location.pathname;
  
  if (url.includes('tetris')) return 'tetris';
  if (url.includes('typing-speed')) return 'typingSpeed';
  if (url.includes('puzzle-slider')) return 'puzzleSlider';
  if (url.includes('color-match')) return 'colorMatch';
  if (url.includes('iq-test')) return 'iqTest';
  if (url.includes('math-challenge')) return 'mathChallenge';
  if (url.includes('snake')) return 'snake';
  
  return 'unknown';
}

/**
 * Oyun tipine göre özel modernizasyon uygula
 */
function applyGameSpecificModernization(gameType) {
  switch (gameType) {
    case 'tetris':
      modernizeTetris();
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
    case 'iqTest':
      modernizeIQTest();
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
 * Tetris oyununu modernize et
 */
function modernizeTetris() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Tetris tahtası ve kontrol elemanlarını bul
  const tetrisCanvas = document.querySelector('canvas');
  const scoreElement = document.querySelector('.score, #score');
  const levelElement = document.querySelector('.level, #level');
  const buttonsContainer = document.querySelector('.controls, .buttons');
  
  if (!tetrisCanvas) return;
  
  // Oyunun orijinal stil sınıflarını temizle
  tetrisCanvas.className = '';
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="tetris-modern-container">
      <div class="tetris-modern-sidebar left-sidebar">
        <div class="stats-card">
          <h3>Oyun Bilgileri</h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name">Skor:</span>
              <span class="stat-value score-display">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Seviye:</span>
              <span class="stat-value level-display">1</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Çizgiler:</span>
              <span class="stat-value lines-display">0</span>
            </div>
          </div>
        </div>
        
        <div class="stats-card">
          <h3>Kontroller</h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-left"></i></span>
              <span class="stat-value">Sola Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-right"></i></span>
              <span class="stat-value">Sağa Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-down"></i></span>
              <span class="stat-value">Aşağı Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-up"></i></span>
              <span class="stat-value">Döndür</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Space</span>
              <span class="stat-value">Düşür</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="tetris-modern-board">
        <div class="board-container"></div>
      </div>
      
      <div class="tetris-modern-sidebar right-sidebar">
        <div class="stats-card">
          <h3>En İyi Skorlar</h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name">En Yüksek:</span>
              <span class="stat-value high-score-display">0</span>
            </div>
          </div>
        </div>
        
        <div class="game-controls">
          <button class="btn btn-primary restart-btn">
            <i class="fas fa-redo me-2"></i>Yeniden Başlat
          </button>
          <button class="btn btn-secondary pause-btn">
            <i class="fas fa-pause me-2"></i>Duraklat
          </button>
          <a href="/all-games" class="btn btn-outline">
            <i class="fas fa-th-large me-2"></i>Tüm Oyunlar
          </a>
        </div>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Tetris tahtasını yeni yere yerleştir
  const boardContainer = document.querySelector('.board-container');
  if (boardContainer && tetrisCanvas) {
    boardContainer.appendChild(tetrisCanvas);
  }
  
  // Skor ve seviye bilgilerini güncelle
  if (scoreElement) {
    const scoreObserver = new MutationObserver(function(mutations) {
      document.querySelector('.score-display').textContent = scoreElement.textContent;
    });
    
    scoreObserver.observe(scoreElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.score-display').textContent = scoreElement.textContent || '0';
  }
  
  if (levelElement) {
    const levelObserver = new MutationObserver(function(mutations) {
      document.querySelector('.level-display').textContent = levelElement.textContent;
    });
    
    levelObserver.observe(levelElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.level-display').textContent = levelElement.textContent || '1';
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
  
  // Duraklat düğmesi işlevselliği
  const pauseBtn = document.querySelector('.pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function() {
      const originalPauseBtn = document.querySelector('.pause, #pause, [onclick*="pause"]');
      if (originalPauseBtn) {
        originalPauseBtn.click();
      }
    });
  }
}

/**
 * Yazma Hızı oyununu modernize et
 */
function modernizeTypingSpeed() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const textDisplay = document.querySelector('.text-display, #text-display');
  const textInput = document.querySelector('.text-input, #text-input, input[type="text"]');
  const timerElement = document.querySelector('.timer, #timer');
  const wpmElement = document.querySelector('.wpm, #wpm');
  const accuracyElement = document.querySelector('.accuracy, #accuracy');
  
  if (!textDisplay || !textInput) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="typing-modern-container">
      <div class="typing-modern-metrics">
        <div class="typing-modern-metric">
          <div class="metric-label">Süre</div>
          <div class="metric-value time-display">60</div>
        </div>
        <div class="typing-modern-metric">
          <div class="metric-label">Kelime/dk</div>
          <div class="metric-value wpm-display">0</div>
        </div>
        <div class="typing-modern-metric">
          <div class="metric-label">Doğruluk</div>
          <div class="metric-value accuracy-display">100%</div>
        </div>
      </div>
      
      <div class="typing-modern-text"></div>
      
      <input type="text" class="typing-modern-input" placeholder="Yazmaya başlayın...">
      
      <div class="game-controls">
        <button class="btn btn-primary restart-btn">
          <i class="fas fa-redo me-2"></i>Yeniden Başlat
        </button>
        <a href="/all-games" class="btn btn-outline">
          <i class="fas fa-th-large me-2"></i>Tüm Oyunlar
        </a>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Orijinal metin içeriğini modern metin kutusuna taşı
  document.querySelector('.typing-modern-text').innerHTML = textDisplay.innerHTML;
  
  // Orijinal input'un değerini takip et ve modern inputa yansıt
  const modernInput = document.querySelector('.typing-modern-input');
  
  modernInput.addEventListener('input', function() {
    textInput.value = this.value;
    
    // Manuel olarak bir olay tetikle
    const inputEvent = new Event('input', { bubbles: true });
    textInput.dispatchEvent(inputEvent);
  });
  
  // Orijinal zamanı takip et
  if (timerElement) {
    const timerObserver = new MutationObserver(function(mutations) {
      document.querySelector('.time-display').textContent = timerElement.textContent;
    });
    
    timerObserver.observe(timerElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.time-display').textContent = timerElement.textContent || '60';
  }
  
  // Kelime/dk değerini takip et
  if (wpmElement) {
    const wpmObserver = new MutationObserver(function(mutations) {
      document.querySelector('.wpm-display').textContent = wpmElement.textContent;
    });
    
    wpmObserver.observe(wpmElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.wpm-display').textContent = wpmElement.textContent || '0';
  }
  
  // Doğruluk değerini takip et
  if (accuracyElement) {
    const accuracyObserver = new MutationObserver(function(mutations) {
      document.querySelector('.accuracy-display').textContent = accuracyElement.textContent;
    });
    
    accuracyObserver.observe(accuracyElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.accuracy-display').textContent = accuracyElement.textContent || '100%';
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
}

/**
 * Puzzle Slider oyununu modernize et
 */
function modernizePuzzleSlider() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const puzzleBoard = document.querySelector('.puzzle-board, #puzzle-board, .board');
  const moveCounter = document.querySelector('.moves, #moves, .move-counter');
  const timerElement = document.querySelector('.timer, #timer');
  
  if (!puzzleBoard) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="puzzle-modern-container">
      <div class="puzzle-modern-board">
        <div class="board-container"></div>
      </div>
      
      <div class="puzzle-modern-sidebar">
        <div class="stats-card">
          <h3>Oyun Bilgileri</h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name">Hamleler:</span>
              <span class="stat-value moves-display">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-name">Süre:</span>
              <span class="stat-value timer-display">00:00</span>
            </div>
          </div>
        </div>
        
        <div class="stats-card">
          <h3>Nasıl Oynanır?</h3>
          <div class="stats-list">
            <div class="stat-row">
              <i class="fas fa-info-circle"></i>
              <span>Kareleri sırayla düzenleyin.</span>
            </div>
            <div class="stat-row">
              <i class="fas fa-puzzle-piece"></i>
              <span>Her kareyi doğru yerleştirin.</span>
            </div>
            <div class="stat-row">
              <i class="fas fa-trophy"></i>
              <span>Minimum hamle ile tamamlayın.</span>
            </div>
          </div>
        </div>
        
        <div class="game-controls">
          <button class="btn btn-primary shuffle-btn">
            <i class="fas fa-random me-2"></i>Karıştır
          </button>
          <button class="btn btn-secondary restart-btn">
            <i class="fas fa-redo me-2"></i>Yeniden Başlat
          </button>
          <a href="/all-games" class="btn btn-outline">
            <i class="fas fa-th-large me-2"></i>Tüm Oyunlar
          </a>
        </div>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Puzzle tahtasını yeni yere yerleştir
  const boardContainer = document.querySelector('.board-container');
  if (boardContainer && puzzleBoard) {
    boardContainer.appendChild(puzzleBoard);
  }
  
  // Hamle sayısını takip et
  if (moveCounter) {
    const moveObserver = new MutationObserver(function(mutations) {
      document.querySelector('.moves-display').textContent = moveCounter.textContent;
    });
    
    moveObserver.observe(moveCounter, { childList: true, characterData: true, subtree: true });
    document.querySelector('.moves-display').textContent = moveCounter.textContent || '0';
  }
  
  // Zamanı takip et
  if (timerElement) {
    const timerObserver = new MutationObserver(function(mutations) {
      document.querySelector('.timer-display').textContent = timerElement.textContent;
    });
    
    timerObserver.observe(timerElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.timer-display').textContent = timerElement.textContent || '00:00';
  }
  
  // Karıştır düğmesi işlevselliği
  const shuffleBtn = document.querySelector('.shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', function() {
      const originalShuffleBtn = document.querySelector('.shuffle, #shuffle, [onclick*="shuffle"]');
      if (originalShuffleBtn) {
        originalShuffleBtn.click();
      }
    });
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
}

/**
 * Renk Eşleştirme oyununu modernize et
 */
function modernizeColorMatch() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const colorWord = document.querySelector('.color-word, #color-word, .word');
  const scoreElement = document.querySelector('.score, #score');
  const streakElement = document.querySelector('.streak, #streak');
  const timerElement = document.querySelector('.timer, #timer');
  
  if (!colorWord) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="color-modern-container">
      <div class="color-modern-stats">
        <div class="color-modern-stat">
          <div class="stat-title">Skor</div>
          <div class="stat-number score-display">0</div>
        </div>
        <div class="color-modern-stat">
          <div class="stat-title">Seri</div>
          <div class="stat-number streak-display">0</div>
        </div>
        <div class="color-modern-stat">
          <div class="stat-title">Süre</div>
          <div class="stat-number timer-display">60</div>
        </div>
      </div>
      
      <div class="color-modern-word"></div>
      
      <div class="color-modern-controls">
        <button class="btn color-modern-btn color-true-btn true-btn">
          <i class="fas fa-check me-2"></i>DOĞRU
        </button>
        <button class="btn color-modern-btn color-false-btn false-btn">
          <i class="fas fa-times me-2"></i>YANLIŞ
        </button>
      </div>
      
      <div class="game-controls">
        <button class="btn btn-primary restart-btn">
          <i class="fas fa-redo me-2"></i>Yeniden Başlat
        </button>
        <a href="/all-games" class="btn btn-outline">
          <i class="fas fa-th-large me-2"></i>Tüm Oyunlar
        </a>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Renk kelimesini takip et ve modern kelime konteynerine yansıt
  const modernColorWord = document.querySelector('.color-modern-word');
  modernColorWord.innerHTML = colorWord.innerHTML;
  
  // Kelimeyi gözlemle ve değişiklikleri yansıt
  const wordObserver = new MutationObserver(function(mutations) {
    modernColorWord.innerHTML = colorWord.innerHTML;
    modernColorWord.style.color = colorWord.style.color;
  });
  
  wordObserver.observe(colorWord, { childList: true, attributes: true, subtree: true });
  modernColorWord.style.color = colorWord.style.color;
  
  // Skoru takip et
  if (scoreElement) {
    const scoreObserver = new MutationObserver(function(mutations) {
      document.querySelector('.score-display').textContent = scoreElement.textContent;
    });
    
    scoreObserver.observe(scoreElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.score-display').textContent = scoreElement.textContent || '0';
  }
  
  // Seriyi takip et
  if (streakElement) {
    const streakObserver = new MutationObserver(function(mutations) {
      document.querySelector('.streak-display').textContent = streakElement.textContent;
    });
    
    streakObserver.observe(streakElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.streak-display').textContent = streakElement.textContent || '0';
  }
  
  // Zamanı takip et
  if (timerElement) {
    const timerObserver = new MutationObserver(function(mutations) {
      document.querySelector('.timer-display').textContent = timerElement.textContent;
    });
    
    timerObserver.observe(timerElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.timer-display').textContent = timerElement.textContent || '60';
  }
  
  // Doğru düğmesi işlevselliği
  const trueBtn = document.querySelector('.true-btn');
  if (trueBtn) {
    trueBtn.addEventListener('click', function() {
      const originalTrueBtn = document.querySelector('#true, #yes, [onclick*="true"], [onclick*="yes"]');
      if (originalTrueBtn) {
        originalTrueBtn.click();
      }
    });
  }
  
  // Yanlış düğmesi işlevselliği
  const falseBtn = document.querySelector('.false-btn');
  if (falseBtn) {
    falseBtn.addEventListener('click', function() {
      const originalFalseBtn = document.querySelector('#false, #no, [onclick*="false"], [onclick*="no"]');
      if (originalFalseBtn) {
        originalFalseBtn.click();
      }
    });
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
}

/**
 * IQ Test oyununu modernize et
 */
function modernizeIQTest() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const questionBox = document.querySelector('.question, #question, .question-box');
  const optionsContainer = document.querySelector('.options, #options, .options-container');
  const scoreElement = document.querySelector('.score, #score');
  
  if (!questionBox) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="iq-modern-container">
      <div class="iq-modern-progress">
        <div class="progress-fill"></div>
      </div>
      
      <div class="iq-modern-question">
        <div class="question-text"></div>
        <div class="iq-modern-options"></div>
      </div>
      
      <div class="stats-card">
        <h3>Skor</h3>
        <div class="stats-list">
          <div class="stat-row">
            <span class="stat-name">Doğru:</span>
            <span class="stat-value correct-display">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">Yanlış:</span>
            <span class="stat-value wrong-display">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">Toplam:</span>
            <span class="stat-value score-display">0</span>
          </div>
        </div>
      </div>
      
      <div class="game-controls">
        <button class="btn btn-primary next-btn">
          <i class="fas fa-arrow-right me-2"></i>Sonraki Soru
        </button>
        <button class="btn btn-secondary restart-btn">
          <i class="fas fa-redo me-2"></i>Yeniden Başlat
        </button>
        <a href="/all-games" class="btn btn-outline">
          <i class="fas fa-th-large me-2"></i>Tüm Oyunlar
        </a>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Soruyu modern konteyner'a taşı
  const modernQuestion = document.querySelector('.question-text');
  modernQuestion.innerHTML = questionBox.innerHTML;
  
  // Soruyu gözlemle ve değişiklikleri yansıt
  const questionObserver = new MutationObserver(function(mutations) {
    modernQuestion.innerHTML = questionBox.innerHTML;
  });
  
  questionObserver.observe(questionBox, { childList: true, subtree: true });
  
  // Skoru takip et
  if (scoreElement) {
    const scoreObserver = new MutationObserver(function(mutations) {
      document.querySelector('.score-display').textContent = scoreElement.textContent;
    });
    
    scoreObserver.observe(scoreElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.score-display').textContent = scoreElement.textContent || '0';
  }
  
  // Orijinal şıkları modern yapıya taşı
  if (optionsContainer) {
    const modernOptions = document.querySelector('.iq-modern-options');
    
    // Şıkları kopyala
    const options = optionsContainer.querySelectorAll('button, .option, div[onclick]');
    options.forEach((option, index) => {
      const modernOption = document.createElement('div');
      modernOption.className = 'iq-modern-option';
      modernOption.innerHTML = option.innerHTML;
      
      // Orijinal tıklama işlevini taşı
      modernOption.addEventListener('click', function() {
        option.click();
        
        // Seçilen şıkkı vurgula
        document.querySelectorAll('.iq-modern-option').forEach(opt => opt.classList.remove('selected'));
        modernOption.classList.add('selected');
      });
      
      modernOptions.appendChild(modernOption);
    });
    
    // Şıkları gözlemle ve değişiklikleri yansıt
    const optionsObserver = new MutationObserver(function(mutations) {
      modernOptions.innerHTML = '';
      
      const updatedOptions = optionsContainer.querySelectorAll('button, .option, div[onclick]');
      updatedOptions.forEach((option, index) => {
        const modernOption = document.createElement('div');
        modernOption.className = 'iq-modern-option';
        modernOption.innerHTML = option.innerHTML;
        
        // Orijinal tıklama işlevini taşı
        modernOption.addEventListener('click', function() {
          option.click();
          
          // Seçilen şıkkı vurgula
          document.querySelectorAll('.iq-modern-option').forEach(opt => opt.classList.remove('selected'));
          modernOption.classList.add('selected');
        });
        
        modernOptions.appendChild(modernOption);
      });
    });
    
    optionsObserver.observe(optionsContainer, { childList: true, subtree: true });
  }
  
  // Sonraki soru düğmesi işlevselliği
  const nextBtn = document.querySelector('.next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      const originalNextBtn = document.querySelector('.next, #next, [onclick*="next"]');
      if (originalNextBtn) {
        originalNextBtn.click();
      }
    });
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
  
  // İlerleme çubuğunu güncelle
  function updateProgressBar(current, total) {
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
      const percent = (current / total) * 100;
      progressBar.style.width = `${percent}%`;
    }
  }
  
  // İlerleme durumunu takip et
  updateProgressBar(1, 10); // Varsayılan olarak 10 soru üzerinden 1 ile başla
}

/**
 * Math Challenge oyununu modernize et
 */
function modernizeMathChallenge() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const problemElement = document.querySelector('.problem, #problem, .equation');
  const inputElement = document.querySelector('input[type="text"], .answer-input, #answer');
  const scoreElement = document.querySelector('.score, #score');
  const timerElement = document.querySelector('.timer, #timer');
  
  if (!problemElement || !inputElement) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="math-modern-container">
      <div class="math-modern-stats">
        <div class="math-modern-stat">
          <div class="stat-title">Skor</div>
          <div class="stat-number score-display">0</div>
        </div>
        <div class="math-modern-stat">
          <div class="stat-title">Süre</div>
          <div class="stat-number timer-display">60</div>
        </div>
        <div class="math-modern-stat">
          <div class="stat-title">Seviye</div>
          <div class="stat-number level-display">1</div>
        </div>
      </div>
      
      <div class="math-modern-timer">
        <div class="timer-bar"></div>
      </div>
      
      <div class="math-modern-problem"></div>
      
      <input type="text" class="math-modern-input" placeholder="Cevabı girin">
      
      <div class="game-controls">
        <button class="btn btn-primary check-btn">
          <i class="fas fa-check me-2"></i>Kontrol Et
        </button>
        <button class="btn btn-secondary next-btn">
          <i class="fas fa-arrow-right me-2"></i>Sonraki
        </button>
        <button class="btn btn-outline restart-btn">
          <i class="fas fa-redo me-2"></i>Yeniden Başlat
        </button>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Problem ifadesini takip et ve modern konteyner'a yansıt
  const modernProblem = document.querySelector('.math-modern-problem');
  modernProblem.innerHTML = problemElement.innerHTML;
  
  // Problem ifadesini gözlemle ve değişiklikleri yansıt
  const problemObserver = new MutationObserver(function(mutations) {
    modernProblem.innerHTML = problemElement.innerHTML;
  });
  
  problemObserver.observe(problemElement, { childList: true, subtree: true });
  
  // Modern girdi kutusunu orijinal girdi ile senkronize et
  const modernInput = document.querySelector('.math-modern-input');
  
  modernInput.addEventListener('input', function() {
    inputElement.value = this.value;
    
    // Manuel olarak bir olay tetikle
    const inputEvent = new Event('input', { bubbles: true });
    inputElement.dispatchEvent(inputEvent);
  });
  
  // Skoru takip et
  if (scoreElement) {
    const scoreObserver = new MutationObserver(function(mutations) {
      document.querySelector('.score-display').textContent = scoreElement.textContent;
    });
    
    scoreObserver.observe(scoreElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.score-display').textContent = scoreElement.textContent || '0';
  }
  
  // Zamanı takip et
  if (timerElement) {
    const timerObserver = new MutationObserver(function(mutations) {
      document.querySelector('.timer-display').textContent = timerElement.textContent;
      
      // Zamanlayıcı çubuğunu güncelle
      const timerBar = document.querySelector('.timer-bar');
      const maxTime = 60; // Varsayılan maksimum süre
      const currentTime = parseInt(timerElement.textContent) || 0;
      const percent = (currentTime / maxTime) * 100;
      
      timerBar.style.width = `${percent}%`;
      
      // Zamanın azalmasına göre renklendirme
      if (percent < 30) {
        timerBar.style.background = 'linear-gradient(to right, #ff4757, #ff6b81)';
      } else {
        timerBar.style.background = 'linear-gradient(to right, #6a5ae0, #a890ff)';
      }
    });
    
    timerObserver.observe(timerElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.timer-display').textContent = timerElement.textContent || '60';
  }
  
  // Kontrol et düğmesi işlevselliği
  const checkBtn = document.querySelector('.check-btn');
  if (checkBtn) {
    checkBtn.addEventListener('click', function() {
      const originalSubmitBtn = document.querySelector('.submit, #submit, [onclick*="check"], [onclick*="submit"]');
      if (originalSubmitBtn) {
        originalSubmitBtn.click();
      }
    });
  }
  
  // Sonraki düğmesi işlevselliği
  const nextBtn = document.querySelector('.next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      const originalNextBtn = document.querySelector('.next, #next, [onclick*="next"]');
      if (originalNextBtn) {
        originalNextBtn.click();
      }
    });
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
  
  // Enter tuşu ile gönderim
  modernInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const originalSubmitBtn = document.querySelector('.submit, #submit, [onclick*="check"], [onclick*="submit"]');
      if (originalSubmitBtn) {
        originalSubmitBtn.click();
      }
    }
  });
}

/**
 * Snake oyununu modernize et
 */
function modernizeSnake() {
  const gameContent = document.querySelector('.game-content');
  if (!gameContent) return;
  
  // Oyun elemanlarını bul
  const gameCanvas = document.querySelector('canvas, #game-canvas, .snake-canvas');
  const scoreElement = document.querySelector('.score, #score');
  
  if (!gameCanvas) return;
  
  // Modern konteyner yapısı oluştur
  const modernStructure = `
    <div class="snake-modern-container">
      <div class="snake-modern-board">
        <div class="board-container"></div>
      </div>
      
      <div class="snake-modern-sidebar">
        <div class="snake-modern-score">
          <div class="snake-score-label">Skor</div>
          <div class="snake-score-value score-display">0</div>
        </div>
        
        <div class="stats-card">
          <h3>Kontroller</h3>
          <div class="stats-list">
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-left"></i></span>
              <span class="stat-value">Sola Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-right"></i></span>
              <span class="stat-value">Sağa Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-up"></i></span>
              <span class="stat-value">Yukarı Git</span>
            </div>
            <div class="stat-row">
              <span class="stat-name"><i class="fas fa-arrow-down"></i></span>
              <span class="stat-value">Aşağı Git</span>
            </div>
          </div>
        </div>
        
        <div class="game-controls">
          <button class="btn btn-primary start-btn">
            <i class="fas fa-play me-2"></i>Başlat
          </button>
          <button class="btn btn-secondary pause-btn">
            <i class="fas fa-pause me-2"></i>Duraklat
          </button>
          <button class="btn btn-outline restart-btn">
            <i class="fas fa-redo me-2"></i>Yeniden Başlat
          </button>
        </div>
      </div>
      
      <div class="snake-mobile-controls">
        <button class="snake-control-btn up-btn">
          <i class="fas fa-arrow-up"></i>
        </button>
        <div class="horizontal-controls">
          <button class="snake-control-btn left-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
          <button class="snake-control-btn down-btn">
            <i class="fas fa-arrow-down"></i>
          </button>
          <button class="snake-control-btn right-btn">
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  gameContent.innerHTML = modernStructure;
  
  // Snake tahtasını yeni yere yerleştir
  const boardContainer = document.querySelector('.board-container');
  if (boardContainer && gameCanvas) {
    boardContainer.appendChild(gameCanvas);
  }
  
  // Skoru takip et
  if (scoreElement) {
    const scoreObserver = new MutationObserver(function(mutations) {
      document.querySelector('.score-display').textContent = scoreElement.textContent;
    });
    
    scoreObserver.observe(scoreElement, { childList: true, characterData: true, subtree: true });
    document.querySelector('.score-display').textContent = scoreElement.textContent || '0';
  }
  
  // Başlat düğmesi işlevselliği
  const startBtn = document.querySelector('.start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      const originalStartBtn = document.querySelector('.start, #start, [onclick*="start"]');
      if (originalStartBtn) {
        originalStartBtn.click();
      }
    });
  }
  
  // Duraklat düğmesi işlevselliği
  const pauseBtn = document.querySelector('.pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function() {
      const originalPauseBtn = document.querySelector('.pause, #pause, [onclick*="pause"]');
      if (originalPauseBtn) {
        originalPauseBtn.click();
      }
    });
  }
  
  // Yeniden başlat düğmesi işlevselliği
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      const originalRestartBtn = document.querySelector('.restart, #restart, [onclick*="restart"]');
      if (originalRestartBtn) {
        originalRestartBtn.click();
      } else {
        location.reload();
      }
    });
  }
  
  // Mobil kontrol düğmelerinin işlevselliği - klavye olaylarını taklit et
  const upBtn = document.querySelector('.up-btn');
  const downBtn = document.querySelector('.down-btn');
  const leftBtn = document.querySelector('.left-btn');
  const rightBtn = document.querySelector('.right-btn');
  
  upBtn.addEventListener('click', function() {
    simulateKeyPress('ArrowUp');
  });
  
  downBtn.addEventListener('click', function() {
    simulateKeyPress('ArrowDown');
  });
  
  leftBtn.addEventListener('click', function() {
    simulateKeyPress('ArrowLeft');
  });
  
  rightBtn.addEventListener('click', function() {
    simulateKeyPress('ArrowRight');
  });
  
  // Klavye tuşu simülasyonu
  function simulateKeyPress(key) {
    const keyEvent = new KeyboardEvent('keydown', { key });
    document.dispatchEvent(keyEvent);
  }
}

/**
 * Mobil kontrolleri ekle (gerekirse)
 */
function addMobileControls(gameType) {
  // Mobil cihazlar için kontroller zaten oyun modernizasyon işlevlerinde ekleniyor
}

/**
 * Bildirim sistemini ekle
 */
function addNotificationSystem() {
  // Bildirim konteynerini oluştur ve ekle
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'game-notification';
  notificationContainer.innerHTML = `
    <div class="notification-content">
      <p id="notification-message"></p>
      <button id="close-notification" class="btn-close"><i class="fas fa-times"></i></button>
    </div>
  `;
  
  document.body.appendChild(notificationContainer);
  
  // Kapatma düğmesine işlevsellik ekle
  const closeBtn = document.getElementById('close-notification');
  closeBtn.addEventListener('click', () => {
    notificationContainer.classList.remove('show');
  });
  
  // Global bildirim fonksiyonunu oluştur
  window.showGameNotification = function(message, duration = 3000) {
    const messageEl = document.getElementById('notification-message');
    messageEl.textContent = message;
    
    notificationContainer.classList.add('show');
    
    // Otomatik kapatma
    if (duration > 0) {
      setTimeout(() => {
        notificationContainer.classList.remove('show');
      }, duration);
    }
  };
}

// Puan animasyonu eklemek için yardımcı fonksiyon
function createScoreAnimation(element, amount) {
  const scoreAnimation = document.createElement('div');
  scoreAnimation.className = 'score-update';
  scoreAnimation.textContent = amount > 0 ? `+${amount}` : amount;
  
  // Elemanın pozisyonunu al
  const rect = element.getBoundingClientRect();
  scoreAnimation.style.left = `${rect.left + rect.width / 2}px`;
  scoreAnimation.style.top = `${rect.top}px`;
  
  // Animasyonu ekle
  document.body.appendChild(scoreAnimation);
  
  // Animasyon tamamlandığında elemanı kaldır
  setTimeout(() => {
    document.body.removeChild(scoreAnimation);
  }, 1000);
}