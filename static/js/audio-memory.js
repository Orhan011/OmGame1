/**
 * Sesli Hafıza Oyunu (Audio Memory Game)
 * ---
 * Bu oyun, kullanıcının işitsel hafızasını ve konsantrasyon becerilerini
 * geliştirmek için tasarlanmış interaktif bir hafıza oyunudur.
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elemanları
  const gameIntro = document.getElementById('gameIntro');
  const gameBoard = document.getElementById('gameBoard');
  const gameResults = document.getElementById('gameResults');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const audioButtonsGrid = document.getElementById('audioButtonsGrid');

  // Kontrol butonları
  const startGameBtn = document.getElementById('startGame');
  const pauseGameBtn = document.getElementById('pauseGame');
  const resumeBtn = document.getElementById('resumeBtn');
  const soundToggleBtn = document.getElementById('soundToggle');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const saveScoreBtn = document.getElementById('saveScoreBtn');

  // Skor ve seviye göstergeleri
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const levelDisplay = document.getElementById('level');
  const currentLevelDisplay = document.getElementById('currentLevelDisplay');
  const statusText = document.getElementById('statusText');
  const statusProgressBar = document.getElementById('statusProgressBar');

  // İlerleme çubuğu
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');

  // Sonuç ekranı
  const finalScore = document.getElementById('finalScore');
  const finalLevel = document.getElementById('finalLevel');
  const finalTime = document.getElementById('finalTime');
  const performanceStars = document.getElementById('performanceStars');
  const performanceText = document.getElementById('performanceText');

  // Seviye ve tema butonları
  const levelButtons = document.querySelectorAll('.level-btn');
  const themeButtons = document.querySelectorAll('.theme-btn');

  // Oyun değişkenleri
  let sequence = [];
  let playerSequence = [];
  let level = 1;
  let maxLevel = 20;
  let score = 0;
  let timer = 0;
  let timerInterval;
  let gamePaused = false;
  let soundEnabled = true;
  let isPlayerTurn = false;
  let currentStep = 0;
  let hints = 3;
  let buttons = [];
  let currentDifficulty = 'easy';
  let currentTheme = 'notes';
  let gameActive = false;
  let combo = 0;
  let maxCombo = 0;
  let streakMultiplier = 1;
  let speedMode = false;
  let bonusMode = true;
  let perfectSequences = 0;
  let totalReactions = 0;
  let timeReactionAvg = 0;

  // Zorluk seviyesi ayarları
  const difficultySettings = {
    easy: {
      startLength: 2,
      speedMultiplier: 1,
      pointsPerLevel: 10,
      buttonCount: 4
    },
    medium: {
      startLength: 3,
      speedMultiplier: 0.8,
      pointsPerLevel: 15,
      buttonCount: 6
    },
    hard: {
      startLength: 4,
      speedMultiplier: 0.6,
      pointsPerLevel: 20,
      buttonCount: 9
    }
  };

  // Buton renkleri ve ikonları
  const buttonStyles = [
    { background: 'linear-gradient(145deg, #fd6262, #e71d1d)', icon: 'bi-person-fill' },
    { background: 'linear-gradient(145deg, #2edb99, #05b67a)', icon: 'bi-droplet-fill' },
    { background: 'linear-gradient(145deg, #4a9bfa, #2055d0)', icon: 'bi-circle-fill' },
    { background: 'linear-gradient(145deg, #ffcb38, #ed8c00)', icon: 'bi-plus-lg' },
    { background: 'linear-gradient(145deg, #9966ff, #6633cc)', icon: 'bi-star-fill' },
    { background: 'linear-gradient(145deg, #ff66cc, #cc3399)', icon: 'bi-heart-fill' },
    { background: 'linear-gradient(145deg, #33ccff, #0099cc)', icon: 'bi-diamond-fill' },
    { background: 'linear-gradient(145deg, #99cc33, #669900)', icon: 'bi-cloud-fill' },
    { background: 'linear-gradient(145deg, #ff9933, #cc6600)', icon: 'bi-lightning-fill' }
  ];

  // Ses dosyaları
  const sounds = {
    buttons: [],
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    gameComplete: new Audio('/static/sounds/success.mp3')
  };

  /**
   * Oyunu başlat
   */
  function init() {
    console.log('Sesli Hafıza oyunu başlatılıyor...');

    // Olay dinleyicilerini ayarla
    setupEventListeners();

    // Ses dosyalarını yükle
    loadSounds();
  }

  /**
   * Tüm olay dinleyicilerini ayarla
   */
  function setupEventListeners() {
    // Oyun başlatma
    startGameBtn.addEventListener('click', startGame);

    // Seviye seçimi
    levelButtons.forEach(button => {
      button.addEventListener('click', () => {
        levelButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentDifficulty = button.dataset.level;
      });
    });

    // Tema seçimi
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTheme = button.dataset.theme;
      });
    });

    // Oyun modu kontrolleri
    const speedModeSwitch = document.getElementById('speedMode');
    if (speedModeSwitch) {
      speedModeSwitch.addEventListener('change', function() {
        speedMode = this.checked;
      });
    }

    const bonusModeSwitch = document.getElementById('bonusMode');
    if (bonusModeSwitch) {
      bonusModeSwitch.addEventListener('change', function() {
        bonusMode = this.checked;
        if (!this.checked) {
          streakMultiplier = 1;
          combo = 0;
        }
      });
    }

    // Oyun kontrolleri
    pauseGameBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    soundToggleBtn.addEventListener('click', toggleSound);

    // Sonuç ekranı kontrolleri
    playAgainBtn.addEventListener('click', resetGame);
    saveScoreBtn.addEventListener('click', saveScore);
  }

  /**
   * Ses dosyalarını yükle
   */
  function loadSounds() {
    try {
      // Buton sesleri için notalar kullan
      const noteFiles = [
        '/static/sounds/note1.mp3',
        '/static/sounds/note2.mp3',
        '/static/sounds/note3.mp3',
        '/static/sounds/note4.mp3'
      ];

      // Buton sesleri
      const buttonCount = difficultySettings[currentDifficulty].buttonCount;
      sounds.buttons = [];

      for (let i = 0; i < buttonCount; i++) {
        try {
          // Mevcut notalardan döngüsel olarak seç
          const soundFile = noteFiles[i % noteFiles.length];
          const sound = new Audio(soundFile);
          sound.volume = 0.8;
          sounds.buttons.push(sound);
        } catch (err) {
          console.log(`Ses dosyası yüklenemedi, yedek ses kullanılıyor`);
          // Yedek ses (click) kullan
          const backupSound = new Audio('/static/sounds/click.mp3');
          backupSound.volume = 0.8;
          sounds.buttons.push(backupSound);
        }
      }

      // Diğer seslerin ses seviyelerini ayarla
      sounds.correct.volume = 0.7;
      sounds.wrong.volume = 0.7;
      sounds.levelUp.volume = 0.7;
      sounds.gameOver.volume = 0.7;
      sounds.gameComplete.volume = 0.7;

      console.log('Ses dosyaları yüklendi');
    } catch (e) {
      console.error('Ses yükleme hatası:', e);
      createFallbackSounds();
    }
  }

  /**
   * Yedek ses dosyaları oluştur (hata durumunda)
   */
  function createFallbackSounds() {
    console.log('Yedek ses dosyaları kullanılıyor...');

    // Buton sayısı
    const buttonCount = difficultySettings[currentDifficulty].buttonCount;
    sounds.buttons = [];

    // Yedek buton sesleri
    for (let i = 0; i < buttonCount; i++) {
      const dummySound = new Audio('/static/sounds/click.mp3');
      dummySound.volume = 0.8;
      sounds.buttons.push(dummySound);
    }

    // Yedek diğer sesler
    sounds.correct = new Audio('/static/sounds/click.mp3');
    sounds.wrong = new Audio('/static/sounds/click.mp3');
    sounds.levelUp = new Audio('/static/sounds/click.mp3');
    sounds.gameOver = new Audio('/static/sounds/click.mp3');
    sounds.gameComplete = new Audio('/static/sounds/click.mp3');

    // Ses seviyeleri
    sounds.correct.volume = 0.7;
    sounds.wrong.volume = 0.7;
    sounds.levelUp.volume = 0.7;
    sounds.gameOver.volume = 0.7;
    sounds.gameComplete.volume = 0.7;
  }

  /**
   * Ses çal
   * @param {object} sound - Ses objesi
   */
  function playSound(sound) {
    if (!soundEnabled || !sound) return Promise.resolve();

    try {
      // Sesi başa sar
      sound.currentTime = 0;

      // Sesi çal ve promise döndür
      return sound.play()
        .catch(error => {
          console.log(`${sound.src} çalma başarısız, devam ediliyor`);
          return Promise.resolve();
        });
    } catch (error) {
      console.log('Ses çalma hatası:', error);
      return Promise.resolve();
    }
  }

  /**
   * Oyunu başlat
   */
  function startGame() {
    console.log('Oyun başlatılıyor...');

    // Oyun arayüzünü göster
    gameIntro.style.display = 'none';
    gameResults.style.display = 'none';
    gameBoard.style.display = 'block';

    // Oyun değişkenlerini sıfırla
    resetGameState();

    // Butonları oluştur
    createButtons();

    // Zamanlayıcıyı başlat
    startTimer();

    // İlk seviyeyi başlat
    startLevel();

    // Oyunu aktif et
    gameActive = true;

    console.log('Oyun başlatıldı - Seviye:', level);
  }

  /**
   * Oyun durumunu sıfırla
   */
  function resetGameState() {
    sequence = [];
    playerSequence = [];
    level = 1;
    score = 0;
    timer = 0;
    isPlayerTurn = false;
    currentStep = 0;
    combo = 0;
    maxCombo = 0;
    perfectSequences = 0;

    // Ekran değerlerini güncelle
    updateDisplay();

    // İlerleme çubuğunu sıfırla
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';

    // Oyun durumunu güncelle
    gamePaused = false;
    pauseOverlay.style.display = 'none';
  }

  /**
   * Ses butonlarını oluştur
   */
  function createButtons() {
    try {
      // Önce grid içeriğini temizle
      audioButtonsGrid.innerHTML = '';

      // Buton sayısını zorluk seviyesine göre ayarla
      const buttonCount = difficultySettings[currentDifficulty].buttonCount;

      // Grid düzenini ayarla
      if (buttonCount <= 4) {
        audioButtonsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      } else if (buttonCount <= 6) {
        audioButtonsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      } else {
        audioButtonsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      }

      // Butonları oluştur
      buttons = [];
      for (let i = 0; i < buttonCount; i++) {
        const button = document.createElement('button');
        button.className = 'audio-btn';
        button.dataset.index = i;

        // Her butona özel stil ver
        const style = buttonStyles[i % buttonStyles.length];
        button.style.background = style.background;

        // İkon ekle
        const icon = document.createElement('i');
        icon.className = `bi ${style.icon} btn-icon`;
        button.appendChild(icon);

        // Tıklama olayı
        button.addEventListener('click', () => {
          if (!isPlayerTurn || gamePaused) return;

          // Butonu aktifleştir ve ses çal
          activateButton(i);

          // Oyuncu sırasını kontrol et
          checkPlayerSequence(i);
        });

        // Butonları ekle
        audioButtonsGrid.appendChild(button);
        buttons.push(button);
      }

      console.log(`${buttonCount} buton oluşturuldu`);
    } catch (error) {
      console.error('Buton oluşturma hatası:', error);
      showAlert('Butonlar oluşturulurken bir hata oluştu', 'error');
    }
  }

  /**
   * Yeni seviyeyi başlat
   */
  function startLevel() {
    console.log(`Seviye ${level} başlatılıyor...`);

    // Ekranı güncelle
    updateDisplay();
    currentLevelDisplay.textContent = `Seviye ${level}`;

    // Oyuncu sırasını kapat
    isPlayerTurn = false;

    // Oyuncu sırasını sıfırla
    playerSequence = [];
    currentStep = 0;

    // Durum mesajını güncelle
    updateStatus('Sırayı İzleyin...', 'info');

    // Yeni seviyede sıradaki elemanı ekle
    if (level === 1) {
      // İlk seviyede başlangıç uzunluğunda sekans oluştur
      sequence = [];
      const startLength = difficultySettings[currentDifficulty].startLength;

      for (let i = 0; i < startLength; i++) {
        addRandomToSequence();
      }
    } else {
      // Sonraki seviyelerde bir eleman ekle
      addRandomToSequence();
    }

    // Kısa bir beklemeden sonra sekansı göster
    setTimeout(() => {
      playSequence();
    }, 1000);
  }

  /**
   * Sekansa rastgele bir buton ekle
   */
  function addRandomToSequence() {
    const randomIndex = Math.floor(Math.random() * buttons.length);
    sequence.push(randomIndex);
  }

  /**
   * Mevcut sekansı çal
   */
  function playSequence() {
    if (gamePaused) return;

    console.log('Sekans oynatılıyor:', sequence);

    // İlerleme çubuğunu sıfırla
    statusProgressBar.style.width = '0%';

    // Her adımı sırayla oynat
    let step = 0;

    // Zorluk seviyesine göre hız ayarla
    const speedMultiplier = difficultySettings[currentDifficulty].speedMultiplier;
    const baseInterval = speedMode ? 400 : 600;
    const interval = baseInterval * speedMultiplier;
    const pauseDuration = (speedMode ? 200 : 400) * speedMultiplier;

    const playStep = () => {
      if (gamePaused) {
        // Oyun duraklatıldıysa, sekans durdur ve devam edildiğinde yeniden başlat
        const resumePlayback = () => {
          if (!gamePaused) {
            setTimeout(() => {
              playSequence();
            }, 500);
            document.removeEventListener('resumeGame', resumePlayback);
          }
        };
        document.addEventListener('resumeGame', resumePlayback);
        return;
      }

      if (step < sequence.length) {
        // İlerleme göstergesini güncelle
        const progress = (step / sequence.length) * 100;
        statusProgressBar.style.width = `${progress}%`;

        // Sıradaki butonu aktifleştir
        const buttonIndex = sequence[step];
        activateButton(buttonIndex);

        // Sonraki adıma geç
        step++;

        // Sonraki adımı başlat
        setTimeout(playStep, interval);
      } else {
        // İlerleme çubuğunu tamamla
        statusProgressBar.style.width = '100%';

        // Sekans tamamlandı, oyuncuya sıra ver
        setTimeout(() => {
          startPlayerTurn();
        }, pauseDuration);
      }
    };

    // İlk adımı başlat
    setTimeout(playStep, pauseDuration);
  }

  /**
   * Oyuncu sırasını başlat
   */
  function startPlayerTurn() {
    console.log('Oyuncu sırası başladı');

    // Oyuncu sırasını aç
    isPlayerTurn = true;

    // Sırayı sıfırla
    playerSequence = [];
    currentStep = 0;

    // Durum mesajını güncelle
    updateStatus('Sırayı Tekrarlayın!', 'warning');

    // İlerleme çubuğunu sıfırla
    statusProgressBar.style.width = '0%';
  }

  /**
   * Buton aktifleştir ve ses çal
   * @param {number} index - Buton indeksi
   */
  function activateButton(index) {
    if (gamePaused) return;

    const button = buttons[index];

    // Butonu aktifleştir
    button.classList.add('playing');

    // Işıltı efekti ekle
    const glow = document.createElement('div');
    glow.className = 'audio-glow';
    button.appendChild(glow);

    // Ses çal
    playSound(sounds.buttons[index]);

    // Dalga efekti ekle
    createWaveEffect(button);

    // Butonu deaktifleştir ve efektleri temizle
    setTimeout(() => {
      button.classList.remove('playing');
      if (glow && glow.parentNode) {
        glow.parentNode.removeChild(glow);
      }
    }, 300);
  }

  /**
   * Dalga efekti oluştur
   * @param {HTMLElement} parent - Dalga efektinin ekleneceği eleman
   */
  function createWaveEffect(parent) {
    // Mevcut dalga elementini temizle
    const existingWave = parent.querySelector('.audio-wave');
    if (existingWave) {
      parent.removeChild(existingWave);
    }

    // Yeni dalga elementi oluştur
    const wave = document.createElement('div');
    wave.className = 'audio-wave';

    // Dalga çubuklarını oluştur
    const barCount = 10;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-wave-bar';
      bar.style.left = `${(i / barCount) * 100}%`;
      bar.style.width = `${2 + Math.random() * 3}px`;
      bar.style.animationDelay = `${Math.random() * 0.5}s`;
      wave.appendChild(bar);
    }

    // Dalga elementini ekle
    parent.appendChild(wave);

    // Belirli bir süre sonra temizle
    setTimeout(() => {
      if (wave && wave.parentNode) {
        parent.removeChild(wave);
      }
    }, 800);
  }

  /**
   * Oyuncu sırasını kontrol et
   * @param {number} buttonIndex - Basılan buton indeksi
   */
  function checkPlayerSequence(buttonIndex) {
    // Oyuncu sırasına ekle
    playerSequence.push(buttonIndex);

    // İlerleme çubuğunu güncelle
    const progress = (playerSequence.length / sequence.length) * 100;
    statusProgressBar.style.width = `${progress}%`;

    // Doğru buton mu kontrol et
    const expectedIndex = sequence[currentStep];

    if (buttonIndex === expectedIndex) {
      // Doğru buton
      currentStep++;

      // Tüm sekans tamamlandı mı kontrol et
      if (currentStep === sequence.length) {
        // Seviyeyi tamamladın
        handleLevelComplete();
      }
    } else {
      // Yanlış buton - oyun bitti
      handleGameOver();
    }
  }

  /**
   * Seviye tamamlandı
   */
  function handleLevelComplete() {
    console.log('Seviye tamamlandı!');

    // Oyuncu sırasını kapat
    isPlayerTurn = false;

    // Durum mesajını güncelle
    updateStatus('Harika! Doğru Sıra!', 'success');

    // Doğru sesi çal
    playSound(sounds.correct);

    // Bonus mod açıksa combo sistemini güncelle
    if (bonusMode) {
      combo++;
      // En yüksek combo puanını güncelle
      maxCombo = Math.max(maxCombo, combo);

      if (combo >= 3) {
        streakMultiplier = Math.min(3, 1 + (combo - 3) * 0.25);
      }
    }

    // Perfect sequence - her buton ilk denemede doğru
    if (playerSequence.length === sequence.length) {
      perfectSequences++;
    }

    // Puan ekle
    const levelPoints = difficultySettings[currentDifficulty].pointsPerLevel;
    const timeBonus = Math.max(0, 50 - Math.floor(timer / 5));
    const streakBonus = Math.floor(levelPoints * (streakMultiplier - 1));
    const pointsEarned = Math.floor((levelPoints + timeBonus) * streakMultiplier);

    score += pointsEarned;

    // Ekranı güncelle
    updateDisplay();

    // Puan mesajını göster
    if (streakMultiplier > 1) {
      showAlert(`+${pointsEarned} Puan! 🔥 ${streakMultiplier.toFixed(1)}x Combo!`, 'success');
    } else {
      showAlert(`+${pointsEarned} Puan!`, 'success');
    }

    // İlerleme çubuğunu güncelle
    updateProgressBar();

    // Son seviye mi kontrol et
    if (level === maxLevel) {
      // Oyunu başarıyla tamamladı
      setTimeout(() => {
        endGame(true);
      }, 1500);
      return;
    }

    // Sonraki seviyeye geç
    level++;

    // Yeni seviye başlat
    setTimeout(() => {
      // Seviye atlama sesi çal
      playSound(sounds.levelUp);

      // Seviye atlama mesajı
      showAlert(`Seviye ${level} Başlıyor!`, 'info');

      // Yeni seviyeyi başlat
      startLevel();
    }, 1500);
  }

  /**
   * Oyun bitti - başarısız
   */
  function handleGameOver() {
    console.log('Oyun bitti - yanlış sıra');

    // Oyuncu sırasını kapat
    isPlayerTurn = false;

    // Yanlış sesi çal
    playSound(sounds.wrong);

    // Durum mesajını güncelle
    updateStatus('Yanlış! Oyun Bitti!', 'error');

    // Doğru sekansı göster
    showCorrectSequence(() => {
      // Oyunu bitir
      setTimeout(() => {
        endGame(false);
      }, 1000);
    });
  }

  /**
   * Doğru sekansı göster
   * @param {Function} callback - Tamamlandığında çağrılacak fonksiyon
   */
  function showCorrectSequence(callback) {
    let step = 0;

    const showStep = () => {
      if (step < sequence.length) {
        // Butonu vurgula
        const buttonIndex = sequence[step];
        const button = buttons[buttonIndex];

        // Doğru ise yeşil, oyuncunun son yanlış tıklaması ise kırmızı yap
        const isLastWrong = step === playerSequence.length - 1 && 
                          playerSequence[step] !== sequence[step];

        if (isLastWrong) {
          button.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        } else {
          button.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        }

        // Butonu aktifleştir
        activateButton(buttonIndex);

        // Sonraki adıma geç
        setTimeout(() => {
          button.style.boxShadow = '';
          step++;
          showStep();
        }, 600);
      } else {
        // Tamamlandı, callback'i çağır
        if (callback) callback();
      }
    };

    // Başlat
    showStep();
  }

  /**
   * Oyunu bitir
   * @param {boolean} success - Başarılı tamamlandı mı
   */
  function endGame(success) {
    console.log('Oyun bitiyor - Başarılı:', success);

    // Oyun aktif durumunu kapat
    gameActive = false;

    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);

    // Ses çal
    if (success) {
      playSound(sounds.gameComplete);
      showAlert('Tebrikler! Tüm seviyeleri tamamladınız!', 'success');
    } else {
      playSound(sounds.gameOver);
      showAlert('Oyun Bitti! Tekrar Deneyin!', 'error');
    }

    // Sonuç ekranını hazırla
    prepareResults(success);

    // Oyun tahtasını gizle, sonuç ekranını göster
    gameBoard.style.display = 'none';
    gameResults.style.display = 'block';
  }

  /**
   * Sonuç ekranını hazırla
   * @param {boolean} success - Başarılı tamamlandı mı
   */
  function prepareResults(success) {
    // Sonuç değerlerini ayarla
    finalScore.textContent = score;
    finalLevel.textContent = level;

    // Zamanı formatla
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    finalTime.textContent = formattedTime;

    // Detaylı istatistikleri güncelle
    document.getElementById('maxComboStat').textContent = maxCombo;
    document.getElementById('perfectSequencesStat').textContent = perfectSequences;

    // Doğruluk oranını hesapla (başarılı seviye / toplam seviye)
    const accuracy = Math.round((level / (level + (level === maxLevel ? 0 : 1))) * 100);
    document.getElementById('accuracyStat').textContent = `${accuracy}%`;

    // Ortalama tepki süresi (varsayılan bir değer)
    document.getElementById('avgReactionStat').textContent = '0.85s';

    // Performansı hesapla ve yıldızları güncelle
    setTimeout(() => {
      calculatePerformance(success);
    }, 600);
  }

  /**
   * Performansı hesapla ve yıldızları göster
   * @param {boolean} success - Başarılı tamamlandı mı
   */
  function calculatePerformance(success) {
    // Seviye oranı
    const levelRatio = level / maxLevel;

    // Zaman verimlilik puanı (daha az süre daha iyi)
    const timeEfficiency = Math.max(0, 1 - (timer / (level * 20)));

    // Performans puanı (5 üzerinden)
    let performanceScore;

    if (success) {
      // Oyun başarıyla tamamlandıysa 4-5 arası puan
      performanceScore = 4 + (timeEfficiency * 1);
    } else {
      // Seviye oranı ve zaman verimliliğine göre 0-4 arası puan
      performanceScore = Math.min(4, (levelRatio * 3) + (timeEfficiency * 1));
    }

    // Yıldız sayısını güncelle
    updateStarRating(performanceScore);

    // Performans metnini güncelle
    if (performanceScore >= 4.5) {
      performanceText.textContent = 'Mükemmel! 🏆';
    } else if (performanceScore >= 3.5) {
      performanceText.textContent = 'Çok İyi! 🎉';
    } else if (performanceScore >= 2.5) {
      performanceText.textContent = 'İyi Performans! 👍';
    } else if (performanceScore >= 1.5) {
      performanceText.textContent = 'İyi Çalışma 👌';
    } else {
      performanceText.textContent = 'Gelişim Gösteriyorsun 💪';
    }
  }

  /**
   * Yıldız değerlendirmesini güncelle
   * @param {number} rating - 0-5 arası puan
   */
  function updateStarRating(rating) {
    // Yarım yıldıza yuvarla
    const roundedRating = Math.round(rating * 2) / 2;

    // Yıldızları güncelle
    const stars = performanceStars.querySelectorAll('i');
    stars.forEach((star, index) => {
      if (index + 1 <= roundedRating) {
        star.className = 'bi bi-star-fill';
      } else if (index + 0.5 === roundedRating) {
        star.className = 'bi bi-star-half';
      } else {
        star.className = 'bi bi-star';
      }
    });
  }

  /**
   * Zamanlayıcıyı başlat
   */
  function startTimer() {
    timer = 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (!gamePaused) {
        timer++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  /**
   * Zamanlayıcı göstergesini güncelle
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Durum mesajını güncelle
   * @param {string} message - Mesaj
   * @param {string} type - Mesaj tipi (info, success, warning, error)
   */
  function updateStatus(message, type = 'info') {
    statusText.textContent = message;

    // Önceki sınıfları temizle
    statusText.className = '';

    // Yeni sınıf ekle
    statusText.classList.add(`status-${type}`);
  }

  /**
   * Uyarı mesajı göster
   * @param {string} message - Mesaj
   * @param {string} type - Mesaj tipi (success, error, warning, info)
   */
  function showAlert(message, type = 'info') {
    const alerts = document.getElementById('gameAlerts');

    // Uyarı elementi oluştur
    const alert = document.createElement('div');
    alert.className = `audio-memory-alert-message ${type}`;
    alert.textContent = message;

    // Uyarılar konteynerine ekle
    alerts.appendChild(alert);

    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 500);
    }, 2000);
  }

  /**
   * İlerleme çubuğunu güncelle
   */
  function updateProgressBar() {
    // Seviyeye göre ilerlemeyi hesapla
    const progress = Math.min(100, (level / maxLevel) * 100);

    // Çubuğu animasyonla güncelle
    progressBar.style.transition = 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
    progressBar.style.width = `${progress}%`;

    // Yüzde metnini güncelle
    progressPercent.textContent = `${Math.round(progress)}%`;

    // Dönüm noktaları için kutlama mesajları
    if (progress >= 25 && progress < 30) {
      showAlert('İlerlemeniz harika! Devam edin! 🚀','info');
    } else if (progress >= 50 && progress < 55) {
      showAlert('Yarıyı geçtiniz! Harika ilerleme! 🏆', 'info');
    } else if (progress >= 75 && progress < 80) {
      showAlert('Son düzlüğe girdiniz! 🏁', 'info');
    }
  }

  /**
   * Ekran değerlerini güncelle
   */
  function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
  }

  /**
   * Oyunu duraklat/devam et
   */
  function togglePause() {
    gamePaused = !gamePaused;

    if (gamePaused) {
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';

      // Oyun devam ettiğinde bir olay tetikle
      document.dispatchEvent(new Event('resumeGame'));
    }
  }

  /**
   * Sesi aç/kapat
   */
  function toggleSound() {
    soundEnabled = !soundEnabled;

    const soundIcon = soundToggleBtn.querySelector('i');
    if (soundEnabled) {
      soundIcon.className = 'bi bi-volume-up-fill';
      showAlert('Ses açıldı', 'info');
    } else {
      soundIcon.className = 'bi bi-volume-mute-fill';
      showAlert('Ses kapatıldı', 'info');
    }
  }

  /**
   * Oyunu sıfırla ve yeniden başlat
   */
  function resetGame() {
    gameResults.style.display = 'none';
    startGame();
  }

  /**
   * Skoru kaydet
   */
  function saveScore() {
    // Butonu devre dışı bırak
    saveScoreBtn.disabled = true;
    saveScoreBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Kaydediliyor...';

    // Skor verisini hazırla
    const scoreData = {
      game_type: 'audioMemory',
      score: score
    };

    // Sunucuya gönder
    fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('Skorunuz başarıyla kaydedildi!', 'success');
        saveScoreBtn.innerHTML = '<i class="bi bi-check-lg"></i> Kaydedildi';
        saveScoreBtn.classList.add('btn-success');
      } else {
        showAlert('Skor kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        saveScoreBtn.disabled = false;
        saveScoreBtn.innerHTML = '<i class="bi bi-save-fill"></i> Tekrar Dene';
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
      showAlert('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      saveScoreBtn.disabled = false;
      saveScoreBtn.innerHTML = '<i class="bi bi-save-fill"></i> Tekrar Dene';
    });
  }

  // Oyunu başlat
  init();
});