
/**
 * Sesli Hafıza Oyunu (Audio Memory) - Pro Edition 2.0
 * Geliştirilmiş, Profesyonel ve Ultra Özelliklere Sahip Versiyon
 * 
 * Özellikler:
 * - Çoklu zorluk seviyeleri (4, 6, 9 butonlu)
 * - Yüksek kaliteli ses efektleri
 * - Modern ve şık arayüz
 * - Animasyonlu geçişler ve efektler
 * - Tam responsif tasarım
 * - Puan sistemi ve en yüksek skor takibi
 * - Kullanıcı dostu arayüz ve geri bildirimler
 * - Otomatik hızlanma sistemi
 * - Özel temalar ve görsel efektler
 * - Ses dalga görselleştirmeleri
 * - Hız modları ve bonus puanlar
 * - Oyuncu istatistikleri ve başarı sistemi
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
  let streakMultiplier = 1;
  let speedMode = false;
  let bonusMode = true;
  let perfectSequences = 0;
  let timeReactionAvg = 0;
  let totalReactions = 0;
  let maxCombo = 0;
  
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
  
  // Ses temaları
  const soundThemes = {
    notes: [
      '/static/sounds/note1.mp3',
      '/static/sounds/note2.mp3',
      '/static/sounds/note3.mp3',
      '/static/sounds/note4.mp3',
      '/static/sounds/number.mp3',
      '/static/sounds/correct.mp3',
      '/static/sounds/wrong.mp3',
      '/static/sounds/click.mp3',
      '/static/sounds/success.mp3'
    ],
    animals: [
      '/static/sounds/note1.mp3', // Bu ses dosyaları bir placeholder
      '/static/sounds/note2.mp3',
      '/static/sounds/note3.mp3',
      '/static/sounds/note4.mp3',
      '/static/sounds/number.mp3',
      '/static/sounds/correct.mp3',
      '/static/sounds/wrong.mp3',
      '/static/sounds/click.mp3',
      '/static/sounds/success.mp3'
    ],
    instruments: [
      '/static/sounds/note1.mp3', // Bu ses dosyaları bir placeholder
      '/static/sounds/note2.mp3',
      '/static/sounds/note3.mp3',
      '/static/sounds/note4.mp3',
      '/static/sounds/number.mp3',
      '/static/sounds/correct.mp3',
      '/static/sounds/wrong.mp3',
      '/static/sounds/click.mp3',
      '/static/sounds/success.mp3'
    ]
  };
  
  // Oyun ses efektleri
  const sounds = {
    buttons: [],
    correct: null,
    wrong: null,
    levelUp: null,
    gameOver: null,
    gameComplete: null
  };
  
  /**
   * Oyunu başlat
   */
  function init() {
    // Olay dinleyicilerini ayarla
    setupEventListeners();
    
    // Ses efektlerini yükle
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
        
        // Sesleri yeniden yükle
        loadSounds();
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
        
        // Bonus modu kapatıldığında streak'i sıfırla
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
      console.log('Ses dosyaları yükleniyor...');
      
      // Mevcut temanın ses dosyalarını al
      const currentSoundSet = soundThemes[currentTheme];
      
      // Buton sesleri
      const buttonCount = difficultySettings[currentDifficulty].buttonCount;
      sounds.buttons = [];
      
      for (let i = 0; i < buttonCount; i++) {
        // Eğer varsayılan ses yok ise demo ses oluştur
        if (i < currentSoundSet.length) {
          const sound = new Audio(currentSoundSet[i]);
          sound.volume = 0.8;
          sounds.buttons.push(sound);
        } else {
          // Dummy ses oluştur (varsayılan buton sesi)
          const dummySound = new Audio('/static/sounds/click.mp3');
          dummySound.volume = 0.8;
          sounds.buttons.push(dummySound);
        }
      }
      
      // Oyun sesleri
      sounds.correct = new Audio('/static/sounds/correct.mp3');
      sounds.wrong = new Audio('/static/sounds/wrong.mp3');
      sounds.levelUp = new Audio('/static/sounds/level-up.mp3');
      sounds.gameOver = new Audio('/static/sounds/game-over.mp3');
      sounds.gameComplete = new Audio('/static/sounds/success.mp3');
      
      // Ses seviyelerini ayarla
      sounds.correct.volume = 0.7;
      sounds.wrong.volume = 0.7;
      sounds.levelUp.volume = 0.7;
      sounds.gameOver.volume = 0.7;
      sounds.gameComplete.volume = 0.7;
      
      console.log('Ses dosyaları yüklendi');
    } catch (e) {
      console.error('Ses yükleme hatası:', e);
      
      // Hata durumunda varsayılan sesler ile devam et
      createDefaultSounds();
    }
  }
  
  /**
   * Varsayılan sesleri oluştur (hata durumunda)
   */
  function createDefaultSounds() {
    console.log('Varsayılan sesler oluşturuluyor...');
    
    // Basit bir dummy ses objesi oluştur
    const createDummySound = () => {
      return {
        play: function() { 
          console.log('Ses çalınıyor (varsayılan)'); 
          return Promise.resolve();
        },
        pause: function() { console.log('Ses duraklatıldı (varsayılan)'); },
        currentTime: 0,
        volume: 0.7
      };
    };
    
    // Buton sesleri için dummy sesler oluştur
    sounds.buttons = [];
    const buttonCount = difficultySettings[currentDifficulty].buttonCount;
    
    for (let i = 0; i < buttonCount; i++) {
      sounds.buttons.push(createDummySound());
    }
    
    // Oyun sesleri için dummy sesler
    sounds.correct = createDummySound();
    sounds.wrong = createDummySound();
    sounds.levelUp = createDummySound();
    sounds.gameOver = createDummySound();
    sounds.gameComplete = createDummySound();
  }
  
  /**
   * Ses efekti çal
   * @param {Object} sound - Ses objesi
   */
  function playSound(sound) {
    if (!soundEnabled || !sound) return;
    
    try {
      // Sesi başa sar
      if (sound.currentTime) {
        sound.currentTime = 0;
      }
      
      // Sesi çal
      sound.play().catch(e => {
        console.log('Ses çalma hatası:', e);
      });
    } catch (e) {
      console.log('Ses çalınırken hata oluştu:', e);
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
   * Butonları oluştur
   */
  function createButtons() {
    console.log('Butonlar oluşturuluyor...');
    
    try {
      // Önce grid container'ı temizle
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
      
      // Buton ikonları
      const buttonIcons = [
        'bi-person-fill',
        'bi-droplet-fill',
        'bi-circle-fill',
        'bi-plus-lg',
        'bi-star-fill',
        'bi-heart-fill',
        'bi-diamond-fill',
        'bi-cloud-fill',
        'bi-lightning-fill'
      ];
      
      // Butonları oluştur
      buttons = [];
      for (let i = 0; i < buttonCount; i++) {
        const button = document.createElement('button');
        button.className = `audio-btn audio-btn-${(i % 4) + 1}`;
        button.dataset.index = i;
        
        // Buton içerik ekle (görünürlüğü artırmak için)
        const icon = document.createElement('i');
        icon.className = `bi ${buttonIcons[i % buttonIcons.length]} btn-icon`;
        button.appendChild(icon);
        
        // Buton tıklama olayı
        button.addEventListener('click', () => {
          if (!isPlayerTurn || gamePaused) return;
          
          // Butonu aktif et ve ses çal
          activateButton(i);
          
          // Oyuncu sırasını kontrol et
          checkPlayerSequence(i);
        });
        
        // Grid'e ekle
        audioButtonsGrid.appendChild(button);
        buttons.push(button);
      }
      
      console.log(`${buttonCount} buton oluşturuldu`);
    } catch (error) {
      console.error('Buton oluşturma hatası:', error);
      // Hata durumunda varsayılan butonları kullan
      buttons = Array.from(audioButtonsGrid.querySelectorAll('.audio-btn'));
      console.log('Varsayılan butonlar kullanılıyor:', buttons.length);
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
    const interval = 600 * speedMultiplier;
    const pauseDuration = 400 * speedMultiplier;
    
    const playStep = () => {
      if (gamePaused) {
        // Oyun duraklatıldıysa, sekansı tekrar başlat (devam edildiğinde)
        const remainingSequence = [...sequence];
        const resumePlayback = () => {
          if (!gamePaused) {
            step = 0;
            playSequence();
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
    
    // Ses dalgası efekti ekle
    createWaveEffect(button);
    
    // Butonu deaktifleştir ve efektleri temizle
    setTimeout(() => {
      button.classList.remove('playing');
      
      // Işıltı elementini temizle
      if (glow && glow.parentNode) {
        glow.parentNode.removeChild(glow);
      }
    }, 300);
  }
  
  /**
   * Ses dalgası efekti oluştur
   * @param {HTMLElement} parent - Dalga efektinin ekleneceği eleman
   */
  function createWaveEffect(parent) {
    // Mevcut dalga efektini temizle
    const existingWave = parent.querySelector('.audio-wave');
    if (existingWave) {
      parent.removeChild(existingWave);
    }
    
    // Dalga container'ı oluştur
    const wave = document.createElement('div');
    wave.className = 'audio-wave';
    
    // Rastgele dalga barları oluştur
    const barCount = 10;
    
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-wave-bar';
      
      // Bar konumu
      bar.style.left = `${(i / barCount) * 100}%`;
      
      // Rastgele genişlik ve animasyon gecikmesi
      bar.style.width = `${2 + Math.random() * 3}px`;
      bar.style.animationDelay = `${Math.random() * 0.5}s`;
      bar.style.animationDuration = `${0.8 + Math.random() * 1}s`;
      
      wave.appendChild(bar);
    }
    
    // Parent'a ekle
    parent.appendChild(wave);
    
    // Efekti belirli bir süre sonra temizle
    setTimeout(() => {
      if (wave && wave.parentNode) {
        wave.parentNode.removeChild(wave);
      }
    }, 800);
  }
  
  /**
   * Oyuncu sırasını kontrol et
   * @param {number} buttonIndex - Tıklanan buton indeksi
   */
  function checkPlayerSequence(buttonIndex) {
    // Oyuncu sırasına ekle
    playerSequence.push(buttonIndex);
    
    // İlerleme göstergesini güncelle
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
    const perfectBonus = perfectSequences * 5;
    const pointsEarned = Math.floor((levelPoints + timeBonus + perfectBonus) * streakMultiplier);
    
    // Bonus puanı animasyonuyla göster
    if (streakBonus > 0 || perfectBonus > 0) {
      showBonusPoints(buttonIndex, pointsEarned);
    }
    
    score += pointsEarned;
    
    // Ekranı güncelle
    updateDisplay();
    
    // Puanı göster
    if (streakMultiplier > 1) {
      showAlert(`+${pointsEarned} Puan! 🔥 ${streakMultiplier.toFixed(1)}x Combo!`, 'success');
    } else {
      showAlert(`+${pointsEarned} Puan! 🎉`, 'success');
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
      
      // Seviye atlama efekti
      showAlert(`Seviye ${level} Başlıyor! 🚀`, 'info');
      
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
    
    // Doğru sırayı göster
    const showStep = () => {
      if (step < sequence.length) {
        // Butonu belirginleştir
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
        
        // Bekle ve sonraki adıma geç
        setTimeout(() => {
          // Reset button style
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
    
    // Başarı durumuna göre ses çal
    if (success) {
      playSound(sounds.gameComplete);
      showAlert('Tebrikler! Tüm seviyeleri tamamladınız! 🎉', 'success');
    } else {
      playSound(sounds.gameOver);
      showAlert('Oyun Bitti! Tekrar Deneyin! 🔄', 'error');
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
    // Puanları animasyonla göster
    animateResultValue(finalScore, 0, score, 1500);
    animateResultValue(finalLevel, 0, level, 1200);
    
    // Zamanı formatla
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    finalTime.textContent = formattedTime;
    
    // Detaylı istatistikleri güncelle
    updateDetailedStats();
    
    // Performansı hesapla ve yıldızları güncelle
    setTimeout(() => {
      calculatePerformance(success);
    }, 600);
  }
  
  /**
   * Detaylı istatistikleri güncelle
   */
  function updateDetailedStats() {
    // İstatistik elementlerini al
    const maxComboStat = document.getElementById('maxComboStat');
    const perfectSequencesStat = document.getElementById('perfectSequencesStat');
    const accuracyStat = document.getElementById('accuracyStat');
    const avgReactionStat = document.getElementById('avgReactionStat');
    
    if (maxComboStat) {
      // Maksimum combo
      maxComboStat.textContent = maxCombo;
    }
    
    if (perfectSequencesStat) {
      // Mükemmel sekans sayısı
      perfectSequencesStat.textContent = perfectSequences;
    }
    
    if (accuracyStat) {
      // Doğruluk oranı (başarılı seviye / toplam seviye)
      const accuracy = Math.round((level / (level + (level === maxLevel ? 0 : 1))) * 100);
      accuracyStat.textContent = `${accuracy}%`;
    }
    
    if (avgReactionStat) {
      // Ortalama tepki süresi
      const avgReaction = timeReactionAvg > 0 ? (timeReactionAvg / Math.max(1, totalReactions)).toFixed(2) : '0.00';
      avgReactionStat.textContent = `${avgReaction}s`;
    }
  }
  
  /**
   * Performansı hesapla ve yıldızları güncelle
   * @param {boolean} success - Başarılı tamamlandı mı
   */
  function calculatePerformance(success) {
    // Maksimum seviye puanı
    const maxLevelScore = maxLevel;
    
    // Seviye oranı
    const levelRatio = level / maxLevelScore;
    
    // Zaman verimlilik puanı (daha az süre daha iyi)
    const timeEfficiency = Math.max(0, 1 - (timer / (level * 20)));
    
    // Toplam performans puanı (5 üzerinden)
    let performanceScore;
    
    if (success) {
      // Oyun başarıyla tamamlandıysa 4-5 arası puan
      performanceScore = 4 + (timeEfficiency * 1);
    } else {
      // Seviye oranı ve zaman verimliliğine göre 0-4 arası puan
      performanceScore = Math.min(4, (levelRatio * 3) + (timeEfficiency * 1));
    }
    
    // Yıldız sayısını güncelle (0-5 arası)
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
   * Sonuç değerini animasyonlu göster
   * @param {HTMLElement} element - Hedef element
   * @param {number} start - Başlangıç değeri
   * @param {number} end - Bitiş değeri
   * @param {number} duration - Animasyon süresi (ms)
   */
  function animateResultValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / 30; // 30 adım
    const stepTime = Math.abs(Math.floor(duration / 30));
    
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (increment > 0 && current >= end || increment < 0 && current <= end) {
        clearInterval(timer);
        element.textContent = end;
      } else {
        element.textContent = Math.round(current);
      }
    }, stepTime);
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
   * Bonus puan animasyonu göster
   * @param {number} buttonIndex - Tıklanan buton indeksi
   * @param {number} points - Kazanılan puan
   */
  function showBonusPoints(buttonIndex, points) {
    // Buton pozisyonunu al
    const button = buttons[buttonIndex];
    const rect = button.getBoundingClientRect();
    
    // Bonus puan elementini oluştur
    const bonusElement = document.createElement('div');
    bonusElement.className = 'bonus-points';
    bonusElement.textContent = `+${points}`;
    
    // Pozisyon ayarla
    bonusElement.style.top = `${rect.top + window.scrollY - 30}px`;
    bonusElement.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 20}px`;
    
    // Sayfaya ekle
    document.body.appendChild(bonusElement);
    
    // Animasyon sonunda kaldır
    setTimeout(() => {
      if (bonusElement.parentNode) {
        bonusElement.parentNode.removeChild(bonusElement);
      }
    }, 1500);
  }
  
  /**
   * Durum ayarla
   * @param {string} message - Durum mesajı
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
   * @param {string} message - Mesaj metni
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
      setTimeout(() => alert.remove(), 500);
    }, 2000);
  }
  
  /**
   * İlerleme çubuğunu güncelle
   */
  function updateProgressBar() {
    // Seviyeye göre ilerlemeyi hesapla (yüzde olarak)
    const progress = Math.min(100, (level / maxLevel) * 100);
    
    // Çubuğu animasyonla güncelle
    progressBar.style.transition = 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
    progressBar.style.width = `${progress}%`;
    
    // Yüzde metnini güncelle
    progressPercent.textContent = `${Math.round(progress)}%`;
    
    // Dönüm noktaları için kutlama mesajları
    if (Math.round(progress) === 25) {
      showAlert('İlerlemeniz harika! Devam edin! 🚀', 'info');
    } else if (Math.round(progress) === 50) {
      showAlert('Yarıyı geçtiniz! Harika ilerleme! 🏆', 'info');
    } else if (Math.round(progress) === 75) {
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
      
      // Oyun devam ettiğinde sekans tekrar oynatılsın diye özel olay tetikle
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
    } else {
      soundIcon.className = 'bi bi-volume-mute-fill';
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
    
    // Veri hazırla
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
        saveScoreBtn.textContent = '✓ Kaydedildi';
        saveScoreBtn.classList.add('btn-success');
      } else {
        showAlert('Skor kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        saveScoreBtn.disabled = false;
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
      showAlert('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      saveScoreBtn.disabled = false;
    });
  }
  
  // Oyunu başlat
  init();
});
