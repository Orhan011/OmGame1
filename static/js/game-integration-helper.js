
/**
 * Oyun entegrasyonu için yardımcı fonksiyonlar
 * Oyunları modernize eden ve ortak özellikleri sağlayan yardımcı fonksiyonlar içerir
 */

// Tarayıcı için kapsamlı kontroller
function checkBrowserCompatibility() {
  if (typeof window === 'undefined') return true;
  
  // Temel HTML5 kontrolü
  const hasHTML5 = !!document.createElement('canvas').getContext;
  // Temel CSS3 kontrolü
  const hasCSS3 = window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');
  // LocalStorage kontrolü
  const hasLocalStorage = (function() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  })();
  
  // Temel tarayıcı özelliklerinin kontrolü
  if (!hasHTML5 || !hasCSS3 || !hasLocalStorage) {
    console.warn('Tarayıcınız güncel değil veya bazı özellikler desteklenmiyor.');
    return false;
  }
  
  return true;
}

// Standart zorluk seçici ekleme (gameContainer, zorluk değişikliği için callback)
function addDifficultySelector(container, callback) {
  if (!container) return null;
  
  const difficultySelector = document.createElement('div');
  difficultySelector.className = 'difficulty-selector';
  difficultySelector.innerHTML = `
    <div class="difficulty-title">Zorluk Seviyesi</div>
    <div class="difficulty-options">
      <button class="difficulty-btn" data-difficulty="easy">Kolay</button>
      <button class="difficulty-btn selected" data-difficulty="medium">Orta</button>
      <button class="difficulty-btn" data-difficulty="hard">Zor</button>
      <button class="difficulty-btn" data-difficulty="expert">Uzman</button>
    </div>
  `;
  
  // Önceden belirtilen konteynere ekle
  if (typeof container === 'string') {
    const targetElement = document.querySelector(container);
    if (targetElement) {
      targetElement.appendChild(difficultySelector);
    } else {
      console.error(`Belirtilen konteyner bulunamadı: ${container}`);
      return null;
    }
  } else if (container instanceof HTMLElement) {
    container.appendChild(difficultySelector);
  } else {
    console.error('Geçersiz konteyner, string ya da HTMLElement olmalı');
    return null;
  }
  
  // Zorluk seviyesi değişimini dinle
  const buttons = difficultySelector.querySelectorAll('.difficulty-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      // Seçilen zorluğu callback ile bildir
      if (typeof callback === 'function') {
        callback(btn.getAttribute('data-difficulty'));
      }
    });
  });
  
  return difficultySelector;
}

// Oyun yeniden başlatma işlemi
function addRestartButton(container, callback) {
  if (!container) return null;
  
  const restartButton = document.createElement('button');
  restartButton.className = 'restart-button';
  restartButton.innerHTML = '<i class="fas fa-redo"></i> Yeniden Başlat';
  
  // Konteynere ekle
  if (typeof container === 'string') {
    const targetElement = document.querySelector(container);
    if (targetElement) {
      targetElement.appendChild(restartButton);
    } else {
      console.error(`Belirtilen konteyner bulunamadı: ${container}`);
      return null;
    }
  } else if (container instanceof HTMLElement) {
    container.appendChild(restartButton);
  } else {
    console.error('Geçersiz konteyner, string ya da HTMLElement olmalı');
    return null;
  }
  
  // Tıklama olayını dinle
  restartButton.addEventListener('click', () => {
    if (typeof callback === 'function') {
      callback();
    }
  });
  
  return restartButton;
}

// Oyun ipucu sistemi
function addHintButton(container, callback, hints = 3) {
  if (!container) return null;
  
  const hintSystem = document.createElement('div');
  hintSystem.className = 'hint-system';
  hintSystem.innerHTML = `
    <button class="hint-button" ${hints <= 0 ? 'disabled' : ''}>
      <i class="fas fa-lightbulb"></i> İpucu
      <span class="hint-count">${hints}</span>
    </button>
  `;
  
  // Konteynere ekle
  if (typeof container === 'string') {
    const targetElement = document.querySelector(container);
    if (targetElement) {
      targetElement.appendChild(hintSystem);
    } else {
      console.error(`Belirtilen konteyner bulunamadı: ${container}`);
      return null;
    }
  } else if (container instanceof HTMLElement) {
    container.appendChild(hintSystem);
  } else {
    console.error('Geçersiz konteyner, string ya da HTMLElement olmalı');
    return null;
  }
  
  const hintButton = hintSystem.querySelector('.hint-button');
  const hintCount = hintSystem.querySelector('.hint-count');
  
  // İpucu kullanım olayını dinle
  hintButton.addEventListener('click', () => {
    if (hints <= 0) return;
    
    hints--;
    hintCount.textContent = hints;
    
    if (hints <= 0) {
      hintButton.setAttribute('disabled', 'disabled');
    }
    
    // İpucu kullanıldığını bildir
    if (typeof callback === 'function') {
      callback(hints);
    }
    
    // İpucu kullanıldı ses efekti
    playSound('hint');
  });
  
  // İpucu sayısını güncelleyen yardımcı fonksiyon
  hintSystem.updateHintCount = (newCount) => {
    hints = newCount;
    hintCount.textContent = hints;
    
    if (hints <= 0) {
      hintButton.setAttribute('disabled', 'disabled');
    } else {
      hintButton.removeAttribute('disabled');
    }
  };
  
  return hintSystem;
}

// Ses efektleri çalmak için yardımcı fonksiyon
function playSound(soundName) {
  try {
    const soundMap = {
      'correct': '/static/sounds/correct.mp3',
      'wrong': '/static/sounds/wrong.mp3',
      'success': '/static/sounds/success.mp3',
      'game-over': '/static/sounds/game-over.mp3',
      'hint': '/static/sounds/hint.mp3',
      'click': '/static/sounds/click.mp3',
      'match': '/static/sounds/match.mp3',
      'no-match': '/static/sounds/no-match.mp3',
      'game-complete': '/static/sounds/game-complete.mp3',
      'level-up': '/static/sounds/level-up.mp3',
      'card-flip': '/static/sounds/card-flip.mp3'
    };
    
    const soundPath = soundMap[soundName] || soundName;
    const audio = new Audio(soundPath);
    audio.play().catch(err => {
      console.warn('Ses çalınamadı:', err);
    });
  } catch (e) {
    console.warn('Ses çalarken hata:', e);
  }
}

// Kronometre / zamanlayıcı oluşturma
function createTimer(container, options = {}) {
  if (!container) return null;
  
  const {
    autoStart = false,
    countDown = false,
    duration = 0,
    updateInterval = 1000,
    onTick = null,
    onComplete = null,
    format = 'mm:ss'
  } = options;
  
  const timerElement = document.createElement('div');
  timerElement.className = 'game-timer';
  
  // Konteynere ekle
  if (typeof container === 'string') {
    const targetElement = document.querySelector(container);
    if (targetElement) {
      targetElement.appendChild(timerElement);
    } else {
      console.error(`Belirtilen konteyner bulunamadı: ${container}`);
      return null;
    }
  } else if (container instanceof HTMLElement) {
    container.appendChild(timerElement);
  } else {
    console.error('Geçersiz konteyner, string ya da HTMLElement olmalı');
    return null;
  }
  
  // Zamanlayıcı durumu
  let startTime = 0;
  let elapsedTime = 0;
  let timerInterval = null;
  let isRunning = false;
  let remainingTime = countDown ? duration : 0;
  
  // Zaman formatını oluştur
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (format === 'hh:mm:ss') {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else if (format === 'mm:ss') {
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else if (format === 'ss') {
      return `${seconds}`;
    }
    
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = Math.floor((currentTime - startTime) / 1000);
    
    if (countDown) {
      remainingTime = Math.max(0, duration - elapsedTime);
      timerElement.textContent = formatTime(remainingTime);
      
      if (remainingTime <= 0) {
        stopTimer();
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    } else {
      timerElement.textContent = formatTime(elapsedTime);
    }
    
    if (typeof onTick === 'function') {
      onTick(countDown ? remainingTime : elapsedTime);
    }
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = Date.now() - (elapsedTime * 1000);
    timerInterval = setInterval(updateTimer, updateInterval);
    updateTimer();
  }
  
  // Zamanlayıcıyı durdur
  function stopTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
  }
  
  // Zamanlayıcıyı sıfırla
  function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    remainingTime = countDown ? duration : 0;
    timerElement.textContent = formatTime(countDown ? remainingTime : 0);
  }
  
  // İlk zaman görüntüsünü oluştur
  timerElement.textContent = formatTime(countDown ? duration : 0);
  
  // Otomatik başlatma
  if (autoStart) {
    startTimer();
  }
  
  // API
  return {
    element: timerElement,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
    getTime: () => countDown ? remainingTime : elapsedTime,
    isRunning: () => isRunning,
    setDuration: (newDuration) => {
      duration = newDuration;
      if (countDown) {
        remainingTime = duration;
        timerElement.textContent = formatTime(remainingTime);
      }
    }
  };
}

// Oyun arayüzü için başlık ve kontrol öğeleri oluşturma
function createGameHeader(container, options = {}) {
  if (!container) return null;
  
  const {
    title = 'Oyun',
    showTimer = false,
    timerOptions = {},
    showDifficulty = false,
    difficultyCallback = null,
    showRestart = false,
    restartCallback = null,
    showHint = false,
    hintCallback = null,
    hintCount = 3
  } = options;
  
  // Ana başlık konteyneri
  const headerElement = document.createElement('div');
  headerElement.className = 'game-header';
  
  // Başlık metni
  const titleElement = document.createElement('h1');
  titleElement.className = 'game-title';
  titleElement.textContent = title;
  headerElement.appendChild(titleElement);
  
  // Kontrol öğeleri konteyneri
  const controlsElement = document.createElement('div');
  controlsElement.className = 'game-controls';
  headerElement.appendChild(controlsElement);
  
  // API nesnesi
  const api = {
    element: headerElement,
    title: titleElement,
    controls: controlsElement,
    timer: null,
    difficultySelector: null,
    restartButton: null,
    hintSystem: null
  };
  
  // Zamanlayıcı
  if (showTimer) {
    api.timer = createTimer(controlsElement, timerOptions);
  }
  
  // Zorluk seçici
  if (showDifficulty) {
    api.difficultySelector = addDifficultySelector(controlsElement, difficultyCallback);
  }
  
  // Yeniden başlat butonu
  if (showRestart) {
    api.restartButton = addRestartButton(controlsElement, restartCallback);
  }
  
  // İpucu sistemi
  if (showHint) {
    api.hintSystem = addHintButton(controlsElement, hintCallback, hintCount);
  }
  
  // Konteynere ekle
  if (typeof container === 'string') {
    const targetElement = document.querySelector(container);
    if (targetElement) {
      targetElement.appendChild(headerElement);
    } else {
      console.error(`Belirtilen konteyner bulunamadı: ${container}`);
      return api;
    }
  } else if (container instanceof HTMLElement) {
    container.appendChild(headerElement);
  } else {
    console.error('Geçersiz konteyner, string ya da HTMLElement olmalı');
    return api;
  }
  
  return api;
}

// Oyun başarısı / tamamlanması gösterimi
function showGameSuccess(message, options = {}) {
  const {
    title = 'Tebrikler!',
    buttonText = 'Yeniden Oyna',
    buttonCallback = () => location.reload()
  } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'game-success-overlay';
  
  overlay.innerHTML = `
    <div class="game-success-popup">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="success-button">${buttonText}</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Animasyon için küçük bir gecikme ekleyin
  setTimeout(() => {
    overlay.classList.add('visible');
  }, 50);
  
  // Buton tıklama olayını dinle
  const button = overlay.querySelector('.success-button');
  button.addEventListener('click', () => {
    overlay.classList.remove('visible');
    
    // Kaldırma için animasyonun tamamlanmasını bekle
    setTimeout(() => {
      overlay.remove();
      if (typeof buttonCallback === 'function') {
        buttonCallback();
      }
    }, 300);
  });
  
  // Başarı ses efekti çal
  playSound('success');
  
  return overlay;
}

// Oyun sonu (başarısız) gösterimi
function showGameOver(message, options = {}) {
  const {
    title = 'Oyun Bitti',
    buttonText = 'Tekrar Dene',
    buttonCallback = () => location.reload()
  } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  
  overlay.innerHTML = `
    <div class="game-over-popup">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="retry-button">${buttonText}</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Animasyon için küçük bir gecikme ekleyin
  setTimeout(() => {
    overlay.classList.add('visible');
  }, 50);
  
  // Buton tıklama olayını dinle
  const button = overlay.querySelector('.retry-button');
  button.addEventListener('click', () => {
    overlay.classList.remove('visible');
    
    // Kaldırma için animasyonun tamamlanmasını bekle
    setTimeout(() => {
      overlay.remove();
      if (typeof buttonCallback === 'function') {
        buttonCallback();
      }
    }, 300);
  });
  
  // Başarısız ses efekti çal
  playSound('game-over');
  
  return overlay;
}

// Öğretici modal gösterimi
function showTutorial(steps, options = {}) {
  const {
    title = 'Nasıl Oynanır',
    closeText = 'Başla',
    closeCallback = null
  } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  
  let stepsHTML = '';
  steps.forEach((step, index) => {
    stepsHTML += `
      <div class="tutorial-step" data-step="${index + 1}">
        <div class="step-number">${index + 1}</div>
        <div class="step-content">
          <h3>${step.title}</h3>
          <p>${step.content}</p>
          ${step.image ? `<img src="${step.image}" alt="${step.title}">` : ''}
        </div>
      </div>
    `;
  });
  
  overlay.innerHTML = `
    <div class="tutorial-popup">
      <h2>${title}</h2>
      <div class="tutorial-content">
        ${stepsHTML}
      </div>
      <div class="tutorial-navigation">
        <button class="tutorial-prev" disabled>&laquo; Önceki</button>
        <div class="tutorial-indicators"></div>
        <button class="tutorial-next">Sonraki &raquo;</button>
      </div>
      <button class="tutorial-close">${closeText}</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Adımlar arası gezinme
  const popup = overlay.querySelector('.tutorial-popup');
  const stepsElements = overlay.querySelectorAll('.tutorial-step');
  const prevButton = overlay.querySelector('.tutorial-prev');
  const nextButton = overlay.querySelector('.tutorial-next');
  const closeButton = overlay.querySelector('.tutorial-close');
  const indicators = overlay.querySelector('.tutorial-indicators');
  
  // Gösterge noktalarını oluştur
  steps.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'tutorial-dot';
    dot.dataset.step = index + 1;
    if (index === 0) dot.classList.add('active');
    indicators.appendChild(dot);
    
    // Gösterge tıklanınca o adıma git
    dot.addEventListener('click', () => {
      goToStep(index + 1);
    });
  });
  
  let currentStep = 1;
  
  // Belirli bir adıma git
  function goToStep(step) {
    stepsElements.forEach(el => el.classList.remove('active'));
    const targetStep = overlay.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (targetStep) targetStep.classList.add('active');
    
    // Göstergeleri güncelle
    const dots = overlay.querySelectorAll('.tutorial-dot');
    dots.forEach(dot => dot.classList.remove('active'));
    const targetDot = overlay.querySelector(`.tutorial-dot[data-step="${step}"]`);
    if (targetDot) targetDot.classList.add('active');
    
    // Gezinme butonlarını güncelle
    prevButton.disabled = step === 1;
    if (step === steps.length) {
      nextButton.disabled = true;
      closeButton.style.display = 'block';
    } else {
      nextButton.disabled = false;
      closeButton.style.display = 'none';
    }
    
    currentStep = step;
  }
  
  // İlk adımı göster
  goToStep(1);
  
  // Önceki adıma git
  prevButton.addEventListener('click', () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });
  
  // Sonraki adıma git
  nextButton.addEventListener('click', () => {
    if (currentStep < steps.length) {
      goToStep(currentStep + 1);
    }
  });
  
  // Kapatma işlemi
  closeButton.addEventListener('click', () => {
    overlay.classList.add('closing');
    
    // Kapatma için animasyonun tamamlanmasını bekle
    setTimeout(() => {
      overlay.remove();
      if (typeof closeCallback === 'function') {
        closeCallback();
      }
    }, 300);
  });
  
  // Animasyon için küçük bir gecikme ekleyin
  setTimeout(() => {
    overlay.classList.add('visible');
  }, 50);
  
  return overlay;
}

// Bildirim gösterimi
function showNotification(message, options = {}) {
  const {
    type = 'info',
    duration = 3000,
    position = 'top-right'
  } = options;
  
  const notification = document.createElement('div');
  notification.className = `game-notification ${type} ${position}`;
  notification.innerHTML = message;
  
  // Varsa mevcut bildirim konteyneri bul, yoksa oluştur
  let container = document.querySelector(`.notification-container.${position}`);
  if (!container) {
    container = document.createElement('div');
    container.className = `notification-container ${position}`;
    document.body.appendChild(container);
  }
  
  container.appendChild(notification);
  
  // Gösterme animasyonu için küçük bir gecikme
  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);
  
  // Otomatik kapatma
  const closeTimeout = setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => notification.remove(), 300);
    
    // Konteyner boşaldıysa kaldır
    if (container.children.length === 0) {
      container.remove();
    }
  }, duration);
  
  // Manuel kapatma
  notification.addEventListener('click', () => {
    clearTimeout(closeTimeout);
    notification.classList.remove('visible');
    setTimeout(() => notification.remove(), 300);
    
    // Konteyner boşaldıysa kaldır
    if (container.children.length === 0) {
      container.remove();
    }
  });
  
  return notification;
}

// Kullanıcı oturumu kontrolü
function isUserLoggedIn() {
  return new Promise((resolve) => {
    // API'den mevcut kullanıcı bilgilerini al
    fetch('/api/get-current-user')
      .then(response => response.json())
      .then(data => {
        resolve(data.loggedIn === true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

// Kullanıcı kimliği alımı
function getUserId() {
  return new Promise((resolve) => {
    // API'den mevcut kullanıcı bilgilerini al
    fetch('/api/get-current-user')
      .then(response => response.json())
      .then(data => {
        resolve(data.id || null);
      })
      .catch(() => {
        resolve(null);
      });
  });
}

// Oyun puanı hesaplama yardımcı fonksiyonu
function calculateGameScore(params) {
  const {
    score = 0,
    difficulty = 'medium',
    timeSpent = 0,
    maxTime = 0,
    correctAnswers = 0,
    totalQuestions = 0,
    hintsUsed = 0,
    gameType = '',
    moves = 0,
    optimalMoves = 0
  } = params;
  
  // Zorluk seviyesi katsayısı
  const difficultyMultiplier = {
    'easy': 0.8,
    'medium': 1.0,
    'hard': 1.3,
    'expert': 1.6
  }[difficulty] || 1.0;
  
  // Zaman katsayısı - eğer hızlı tamamlandıysa bonus puan
  let timeMultiplier = 1.0;
  if (maxTime > 0 && timeSpent > 0) {
    // Zamanın yarısından önce tamamlandıysa bonus
    if (timeSpent < maxTime / 2) {
      timeMultiplier = 1.2;
    } 
    // Zamanın tamamına yakın sürede tamamlandıysa düşük çarpan
    else if (timeSpent > maxTime * 0.8) {
      timeMultiplier = 0.9;
    }
  }
  
  // Doğruluk oranı
  let accuracyMultiplier = 1.0;
  if (totalQuestions > 0) {
    const accuracy = correctAnswers / totalQuestions;
    accuracyMultiplier = accuracy * 0.5 + 0.5; // Minimum 0.5 çarpan
  }
  
  // Hamle verimliliği
  let moveEfficiencyMultiplier = 1.0;
  if (moves > 0 && optimalMoves > 0) {
    // Eğer hamle sayısı optimal sayıdan azsa bonus ver, fazlaysa ceza
    moveEfficiencyMultiplier = Math.max(0.6, Math.min(1.3, optimalMoves / moves));
  }
  
  // İpuçları kullanımı cezası
  const hintPenalty = Math.max(0, 1 - (hintsUsed * 0.1)); // Her ipucu %10 puan düşürür
  
  // Oyun tipine özel ayarlamalar
  let gameTypeMultiplier = 1.0;
  switch (gameType) {
    case 'tetris':
    case 'snake':
      // Süre bazlı oyunlarda uzun süre oynamak iyi
      gameTypeMultiplier = 1.0 + (timeSpent / 300) * 0.5; // Her 5 dakika için %50 bonus
      break;
    case 'wordle':
    case 'memoryCards':
      // Doğruluk odaklı
      gameTypeMultiplier = accuracyMultiplier * 1.2;
      break;
    case 'puzzle':
    case 'memoryMatch':
      // Hamle verimliliği önemli
      gameTypeMultiplier = moveEfficiencyMultiplier * 1.2;
      break;
    default:
      gameTypeMultiplier = 1.0;
  }
  
  // Temel puanı hesapla
  let baseScore = score;
  
  // Puan hesaplama
  let finalScore = baseScore * difficultyMultiplier * timeMultiplier * accuracyMultiplier * hintPenalty * gameTypeMultiplier * moveEfficiencyMultiplier;
  
  // 0-100 arasına dönüştür - her oyun için farklı ölçekleme olabilir
  const gameTypeNormalization = {
    'tetris': 200,      // Tetris'te 200 puan mükemmel puan
    'wordle': 6,        // Wordle'da 6 deneme hakkı
    'memoryCards': 20,  // Hafıza kartlarında 20 hamle
    'puzzle': 500,      // Yapboz için 500 puan maksimum
    'snake': 50,        // Yılan oyunu için 50 elma
    'minesweeper': 300, // Mayın tarlası için 300 puan
    'hangman': 100,     // Adam asmaca için 100 puan
    'numberSequence': 500, // Sayı dizisi için 500 puan
    'numberChain': 300, // Sayı zinciri için 300 puan
    'nBack': 200,       // N-Back için 200 puan
    'patternRecognition': 200, // Örüntü tanıma için 200 puan
    'wordPuzzle': 200,  // Kelime bulmaca için 200 puan 
    'labyrinth': 200,   // Labirent için 200 puan
    'chess': 1000,      // Satranç puanı
    'default': 100      // Varsayılan
  };
  
  const maxScoreForGame = gameTypeNormalization[gameType] || gameTypeNormalization.default;
  
  // Nihai puanı 0-100 arasına normalize et
  finalScore = Math.min(100, Math.max(0, (finalScore / maxScoreForGame) * 100));
  
  // Tam sayıya yuvarla
  return Math.round(finalScore);
}

// Oyun sonucunu gösterme yardımcı fonksiyonu
function showGameScoreResult(gameType, score, gameStats = {}, options = {}) {
  const {
    difficulty = 'medium',
    timeSpent = 0,
    maxTime = 0,
    correctAnswers = 0,
    totalQuestions = 0,
    hintsUsed = 0,
    moves = 0,
    optimalMoves = 0
  } = gameStats;
  
  // Puanı hesapla
  const calculatedScore = calculateGameScore({
    score,
    difficulty,
    timeSpent,
    maxTime,
    correctAnswers,
    totalQuestions,
    hintsUsed,
    gameType,
    moves,
    optimalMoves
  });
  
  // Oyun istatistiklerini hazırla
  const stats = {
    ...gameStats,
    timeBonus: maxTime > 0 ? Math.max(0, 1 - (timeSpent / maxTime)) : 0,
    accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 100,
    normalized_score: calculatedScore
  };
  
  // Puan kaydetme fonksiyonu
  if (window.saveScoreToLeaderboard) {
    window.saveScoreToLeaderboard(gameType, calculatedScore, timeSpent, difficulty, stats)
      .then(data => {
        console.log("Puan kaydedildi:", data);
        
        // Kullanıcıya bildirim göster
        showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
      })
      .catch(error => {
        console.error("Puan kaydedilirken hata:", error);
        showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
      });
  } else if (window.ScoreHandler && typeof window.ScoreHandler.saveScore === 'function') {
    window.ScoreHandler.saveScore(gameType, calculatedScore, difficulty, timeSpent, stats)
      .then(() => {
        showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
      })
      .catch(error => {
        console.error("Puan kaydedilirken hata:", error);
        showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
      });
  } else {
    // ScoreHandler yoksa sadece bildirimi göster
    showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
    
    // Son çare olarak doğrudan API'ye istek gönder
    try {
      fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: gameType,
          score: calculatedScore,
          difficulty: difficulty,
          playtime: timeSpent,
          game_stats: stats
        })
      });
    } catch (e) {
      console.error("API isteği sırasında hata:", e);
    }
  }
  
  return calculatedScore;
}

// Oyun sonucunu gösterme yardımcı fonksiyonu
function showGameScoreResult(gameType, score, gameStats = {}, options = {}) {
  const {
    difficulty = 'medium',
    timeSpent = 0,
    maxTime = 0,
    correctAnswers = 0,
    totalQuestions = 0,
    hintsUsed = 0
  } = gameStats;
  
  // Puanı hesapla
  const calculatedScore = calculateGameScore({
    score,
    difficulty,
    timeSpent,
    maxTime,
    correctAnswers,
    totalQuestions,
    hintsUsed,
    gameType
  });
  
  // Oyun istatistiklerini hazırla
  const stats = {
    ...gameStats,
    timeBonus: maxTime > 0 ? Math.max(0, 1 - (timeSpent / maxTime)) : 0,
    accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 100
  };
  
  // Liderlik tablosuna kaydet
  if (window.saveScoreToLeaderboard) {
    window.saveScoreToLeaderboard(gameType, score, timeSpent, difficulty, stats)
      .then(data => {
        console.log("Puan kaydedildi:", data);
        
        // Puan bildirimini göster (saveScoreToLeaderboard zaten gösteriyor)
        // Ek özellikler eklenmek istenirse buraya eklenebilir
      })
      .catch(error => {
        console.error("Puan kaydedilirken hata:", error);
        // Hata durumunda da puanı göster
        showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
      });
  } else {
    // saveScoreToLeaderboard fonksiyonu yoksa sadece bildirimi göster
    showNotification(`Oyun puanınız: ${calculatedScore}/100`, { type: 'info' });
  }
  
  return calculatedScore;
}

// Dışa aktarılan tüm yardımcı fonksiyonlar
window.GameHelper = {
  checkBrowserCompatibility,
  addDifficultySelector,
  addRestartButton,
  addHintButton,
  playSound,
  createTimer,
  createGameHeader,
  showGameSuccess,
  showGameOver,
  showTutorial,
  showNotification,
  isUserLoggedIn,
  getUserId,
  calculateGameScore,
  showGameScoreResult
};
