/**
 * Sesli Hafıza Oyunu
 * Modern tasarım ve akıcı animasyonlarla desteklenen hafıza geliştirme oyunu.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elementleri
  const gameIntro = document.getElementById('gameIntro');
  const gameBoard = document.getElementById('gameBoard');
  const gameResults = document.getElementById('gameResults');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const tilesContainer = document.getElementById('tilesContainer');
  
  // Skor ve seviye göstergeleri
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const timerDisplay = document.getElementById('timer');
  const currentLevelDisplay = document.getElementById('currentLevelDisplay');
  const statusText = document.getElementById('statusText');
  const statusProgressBar = document.getElementById('statusProgressBar');
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  
  // Sonuç ekranı elementleri
  const finalScore = document.getElementById('finalScore');
  const finalLevel = document.getElementById('finalLevel');
  const finalTime = document.getElementById('finalTime');
  const performanceStars = document.getElementById('performanceStars');
  const performanceText = document.getElementById('performanceText');
  
  // Butonlar
  const startGameBtn = document.getElementById('startGame');
  const levelButtons = document.querySelectorAll('.level-btn');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const pauseGameBtn = document.getElementById('pauseGame');
  const soundToggleBtn = document.getElementById('soundToggle');
  const resumeBtn = document.getElementById('resumeBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const saveScoreBtn = document.getElementById('saveScoreBtn');
  
  // Oyun değişkenleri
  let sequence = [];
  let playerSequence = [];
  let level = 1;
  let maxLevel = 20;
  let score = 0;
  let timer = 0;
  let timerInterval;
  let gameActive = false;
  let isPlayerTurn = false;
  let gamePaused = false;
  let soundEnabled = true;
  let currentStep = 0;
  let tiles = [];
  let currentDifficulty = 'easy';
  let currentTheme = 'electronic';
  let combo = 0;
  let maxCombo = 0;
  let streakMultiplier = 1;
  let speedMode = false;
  let bonusMode = true;
  let perfectSequences = 0;
  let totalReactions = 0;
  let lastReactionTime = 0;
  let totalReactionTime = 0;
  
  // Ses teması ve zorluk ayarları
  const difficultySettings = {
    easy: {
      tileCount: 4,
      startSequenceLength: 2,
      speedMultiplier: 1.0,
      pointsPerLevel: 10
    },
    medium: {
      tileCount: 6,
      startSequenceLength: 3,
      speedMultiplier: 0.8,
      pointsPerLevel: 15
    },
    hard: {
      tileCount: 8,
      startSequenceLength: 4,
      speedMultiplier: 0.6,
      pointsPerLevel: 20
    }
  };
  
  // Ses temaları
  const soundThemes = {
    electronic: [
      '/static/sounds/electronic1.mp3',
      '/static/sounds/electronic2.mp3',
      '/static/sounds/electronic3.mp3',
      '/static/sounds/electronic4.mp3',
      '/static/sounds/electronic5.mp3',
      '/static/sounds/electronic6.mp3',
      '/static/sounds/electronic7.mp3',
      '/static/sounds/electronic8.mp3'
    ],
    musical: [
      '/static/sounds/note1.mp3',
      '/static/sounds/note2.mp3',
      '/static/sounds/note3.mp3',
      '/static/sounds/note4.mp3',
      '/static/sounds/note5.mp3',
      '/static/sounds/note6.mp3',
      '/static/sounds/note7.mp3',
      '/static/sounds/note8.mp3'
    ],
    drums: [
      '/static/sounds/drum1.mp3',
      '/static/sounds/drum2.mp3',
      '/static/sounds/drum3.mp3',
      '/static/sounds/drum4.mp3',
      '/static/sounds/drum5.mp3',
      '/static/sounds/drum6.mp3',
      '/static/sounds/drum7.mp3',
      '/static/sounds/drum8.mp3'
    ]
  };

  // Oyun ses efektleri
  const sounds = {
    tiles: [],
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
    console.log('Sesli Hafıza oyunu başlatılıyor...');
    
    // Olay dinleyicilerini ayarla
    setupEventListeners();
    
    // Ses dosyalarını yükle
    loadSounds();
    
    console.log('Ses dosyaları yüklendi');
  }
  
  /**
   * Olay dinleyicilerini ayarla
   */
  function setupEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    
    // Zorluk seviyesi seçimi
    levelButtons.forEach(button => {
      button.addEventListener('click', () => {
        levelButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentDifficulty = button.getAttribute('data-level');
      });
    });
    
    // Ses teması seçimi
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTheme = button.getAttribute('data-theme');
        
        // Yeni temaya göre sesleri yükle
        loadSounds();
      });
    });
    
    // Hız modu seçimi
    const speedModeSwitch = document.getElementById('speedMode');
    if (speedModeSwitch) {
      speedModeSwitch.addEventListener('change', function() {
        speedMode = this.checked;
      });
    }
    
    // Bonus modu seçimi
    const bonusModeSwitch = document.getElementById('bonusMode');
    if (bonusModeSwitch) {
      bonusModeSwitch.addEventListener('change', function() {
        bonusMode = this.checked;
        
        // Bonus mod kapatılırsa combo'yu sıfırla
        if (!bonusMode) {
          combo = 0;
          streakMultiplier = 1;
        }
      });
    }
    
    // Oyun kontrolleri
    pauseGameBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    soundToggleBtn.addEventListener('click', toggleSound);
    
    // Sonuç ekranı butonları
    playAgainBtn.addEventListener('click', restartGame);
    saveScoreBtn.addEventListener('click', saveScore);
  }
  
  /**
   * Ses dosyalarını yükle
   */
  function loadSounds() {
    try {
      // Tema seslerini yükle
      const currentSoundSet = soundThemes[currentTheme];
      
      // Buton seslerini yükle
      sounds.tiles = [];
      const tileCount = difficultySettings[currentDifficulty].tileCount;
      
      for (let i = 0; i < tileCount; i++) {
        // Eğer ses temasında yeterli ses dosyası yoksa varsayılan ses kullan
        if (i < currentSoundSet.length) {
          const sound = new Audio(currentSoundSet[i]);
          sound.volume = 0.8;
          sounds.tiles.push(sound);
        } else {
          // Varsayılan ses oluştur
          const fallbackSound = new Audio('/static/sounds/note1.mp3');
          fallbackSound.volume = 0.8;
          sounds.tiles.push(fallbackSound);
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
    } catch (e) {
      console.error('Ses yükleme hatası:', e);
      createDefaultSounds();
    }
  }
  
  /**
   * Hata durumunda varsayılan sesleri oluştur
   */
  function createDefaultSounds() {
    // Dummy ses objesi oluştur
    const createDummySound = () => {
      return {
        play: function() {
          console.log('Ses çalınıyor (varsayılan)');
          return Promise.resolve();
        },
        pause: function() { console.log('Ses duraklatıldı'); },
        currentTime: 0,
        volume: 0.7
      };
    };
    
    // Buton sesleri için dummy sesler oluştur
    sounds.tiles = [];
    const tileCount = difficultySettings[currentDifficulty].tileCount;
    
    for (let i = 0; i < tileCount; i++) {
      sounds.tiles.push(createDummySound());
    }
    
    // Oyun sesleri için dummy sesler
    sounds.correct = createDummySound();
    sounds.wrong = createDummySound();
    sounds.levelUp = createDummySound();
    sounds.gameOver = createDummySound();
    sounds.gameComplete = createDummySound();
  }
  
  /**
   * Ses çal
   */
  function playSound(sound) {
    if (!soundEnabled || !sound) return;
    
    try {
      // Sesi başa sar
      sound.currentTime = 0;
      
      // Sesi çal
      sound.play().catch(e => {
        console.log('Ses çalma hatası:', e);
      });
    } catch (e) {
      console.error('Ses çalma hatası:', e);
    }
  }
  
  /**
   * Oyunu başlat
   */
  function startGame() {
    console.log('Oyun başlatılıyor...');
    
    // Oyun arayüzlerini değiştir
    gameIntro.style.display = 'none';
    gameBoard.style.display = 'block';
    gameResults.style.display = 'none';
    
    // Oyun değişkenlerini sıfırla
    resetGameState();
    
    // Kutuları oluştur
    createTiles();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // İlk seviyeyi başlat
    startLevel();
    
    // Oyunu aktif yap
    gameActive = true;
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
    streakMultiplier = 1;
    perfectSequences = 0;
    totalReactions = 0;
    totalReactionTime = 0;
    
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
   * Kutuları oluştur
   */
  function createTiles() {
    // Önce konteyneri temizle
    tilesContainer.innerHTML = '';
    
    // Buton sayısını zorluk seviyesine göre ayarla
    const tileCount = difficultySettings[currentDifficulty].tileCount;
    
    // Grid düzenini ayarla
    if (tileCount <= 4) {
      tilesContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (tileCount <= 6) {
      tilesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
      tilesContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    
    // Kutuları oluştur
    tiles = [];
    for (let i = 0; i < tileCount; i++) {
      const tile = document.createElement('div');
      tile.className = `audio-tile audio-tile-${(i % 8) + 1}`;
      tile.dataset.index = i;
      
      // Kutuya tıklama olayı
      tile.addEventListener('click', () => {
        if (!isPlayerTurn || gamePaused) return;
        
        // Kutucuğu aktifleştir ve ses çal
        activateTile(i);
        
        // Oyuncu sırasını kontrol et
        checkPlayerSequence(i);
      });
      
      // Konteynere ekle
      tilesContainer.appendChild(tile);
      tiles.push(tile);
    }
    
    console.log(`${tileCount} kutu oluşturuldu`);
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
    updateStatusMessage('Dizilimi İzleyin...', 'info');
    
    // Yeni seviyede sıradaki kutuları ekle
    if (level === 1) {
      // İlk seviyede başlangıç uzunluğunda sekans oluştur
      sequence = [];
      const startLength = difficultySettings[currentDifficulty].startSequenceLength;
      
      for (let i = 0; i < startLength; i++) {
        addRandomToSequence();
      }
    } else {
      // Sonraki seviyelerde bir kutu ekle
      addRandomToSequence();
    }
    
    // Kısa bir beklemeden sonra sekansı göster
    setTimeout(() => {
      playSequence();
    }, 1000);
  }
  
  /**
   * Sekansa rastgele bir kutu ekle
   */
  function addRandomToSequence() {
    const randomIndex = Math.floor(Math.random() * tiles.length);
    sequence.push(randomIndex);
  }
  
  /**
   * Mevcut sekansı oynat
   */
  function playSequence() {
    if (gamePaused) return;
    
    console.log('Sekans oynatılıyor:', sequence);
    
    // İlerleme çubuğunu sıfırla
    statusProgressBar.style.width = '0%';
    
    // Zorluk seviyesine göre hız ayarla
    const speedMultiplier = difficultySettings[currentDifficulty].speedMultiplier;
    // Hız modu açıksa daha hızlı oynat
    const actualSpeedMultiplier = speedMode ? speedMultiplier * 0.7 : speedMultiplier;
    
    const interval = 600 * actualSpeedMultiplier;
    const pauseDuration = 400 * actualSpeedMultiplier;
    
    // Her adımı sırayla oynat
    let step = 0;
    const playStep = () => {
      if (gamePaused) {
        // Oyun duraklatıldıysa, oyun devam ettiğinde sekansı tekrar başlat
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
        
        // Sıradaki kutuyu aktifleştir
        const tileIndex = sequence[step];
        activateTile(tileIndex);
        
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
    lastReactionTime = Date.now();
    
    // Durum mesajını güncelle
    updateStatusMessage('Sırayı Tekrarlayın!', 'warning');
    
    // İlerleme çubuğunu sıfırla
    statusProgressBar.style.width = '0%';
  }
  
  /**
   * Kutuyu aktifleştir ve ses çal
   */
  function activateTile(tileIndex) {
    if (gamePaused) return;
    
    const tile = tiles[tileIndex];
    
    // Kutuyu aktifleştir
    tile.classList.add('active');
    
    // Işıltı efekti ekle
    const glow = document.createElement('div');
    glow.className = 'audio-glow';
    tile.appendChild(glow);
    
    // Ses çal
    playSound(sounds.tiles[tileIndex]);
    
    // Ses dalgası efekti oluştur
    createWaveEffect(tile);
    
    // Kutuyu deaktifleştir ve efektleri temizle
    setTimeout(() => {
      tile.classList.remove('active');
      
      // Işıltı elementini temizle
      if (glow && glow.parentNode) {
        glow.parentNode.removeChild(glow);
      }
    }, 300);
  }
  
  /**
   * Ses dalgası efekti oluştur
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
   */
  function checkPlayerSequence(tileIndex) {
    // Oyuncu sırasına ekle
    playerSequence.push(tileIndex);
    
    // Tepki süresini kaydet
    if (lastReactionTime > 0) {
      const reactionTime = (Date.now() - lastReactionTime) / 1000;
      totalReactionTime += reactionTime;
      totalReactions++;
      lastReactionTime = Date.now();
    }
    
    // İlerleme göstergesini güncelle
    const progress = (playerSequence.length / sequence.length) * 100;
    statusProgressBar.style.width = `${progress}%`;
    
    // Doğru kutu mu kontrol et
    const expectedIndex = sequence[currentStep];
    
    if (tileIndex === expectedIndex) {
      // Doğru kutu
      currentStep++;
      
      // Tüm sekans tamamlandı mı kontrol et
      if (currentStep === sequence.length) {
        // Seviyeyi tamamladın
        handleLevelComplete();
      }
    } else {
      // Yanlış kutu - oyun bitti
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
    updateStatusMessage('Harika! Doğru Sıra!', 'success');
    
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
      showBonusPoints(pointsEarned);
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
    updateStatusMessage('Yanlış! Oyun Bitti!', 'error');
    
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
   */
  function showCorrectSequence(callback) {
    let step = 0;
    
    // Doğru sırayı göster
    const showStep = () => {
      if (step < sequence.length) {
        // Kutuyu belirginleştir
        const tileIndex = sequence[step];
        const tile = tiles[tileIndex];
        
        // Doğru ise yeşil, oyuncunun son yanlış tıklaması ise kırmızı yap
        const isLastWrong = step === playerSequence.length - 1 && 
                         playerSequence[step] !== sequence[step];
        
        if (isLastWrong) {
          tile.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        } else {
          tile.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        }
        
        // Kutuyu aktifleştir
        activateTile(tileIndex);
        
        // Bekle ve sonraki adıma geç
        setTimeout(() => {
          // Kutu stilini sıfırla
          tile.style.boxShadow = '';
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
   */
  function prepareResults(success) {
    // Puanları animasyonla göster
    animateValue(finalScore, 0, score, 1500);
    animateValue(finalLevel, 0, level, 1200);
    
    // Zamanı formatla
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    finalTime.textContent = formattedTime;
    
    // Performansı hesapla ve yıldızları güncelle
    setTimeout(() => {
      calculatePerformance(success);
    }, 600);
  }
  
  /**
   * Performansı hesapla ve yıldızları güncelle
   */
  function calculatePerformance(success) {
    // Seviye oranı
    const levelRatio = level / maxLevel;
    
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
   * Değeri animasyonla göster
   */
  function animateValue(element, start, end, duration) {
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
   */
  function showBonusPoints(points) {
    // Bonus puan elementini oluştur
    const bonusElement = document.createElement('div');
    bonusElement.className = 'bonus-points';
    bonusElement.textContent = `+${points}`;
    
    // Pozisyon ayarla - ortada göster
    const boardRect = gameBoard.getBoundingClientRect();
    bonusElement.style.top = `${boardRect.top + window.scrollY + (boardRect.height / 3)}px`;
    bonusElement.style.left = `${boardRect.left + window.scrollX + (boardRect.width / 2) - 20}px`;
    
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
   * Durum mesajını güncelle
   */
  function updateStatusMessage(message, type = 'info') {
    statusText.textContent = message;
    
    // Renk sınıfını ayarla
    statusText.className = '';
    statusText.classList.add(`status-${type}`);
  }
  
  /**
   * Uyarı mesajı göster
   */
  function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('gameAlerts');
    
    // Uyarı elementi oluştur
    const alert = document.createElement('div');
    alert.className = `alert-message ${type}`;
    alert.textContent = message;
    
    // Uyarılar konteynerine ekle
    alertsContainer.appendChild(alert);
    
    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      alert.style.opacity = '0';
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
      
      // Oyun devam ettiğinde özel olay tetikle
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
   * Oyunu yeniden başlat
   */
  function restartGame() {
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