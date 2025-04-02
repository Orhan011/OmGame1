/**
 * Sesli Hafıza: Melodi - Modern Ultra Tasarım
 * 
 * Şık tasarım ve modern animasyonlarla desteklenen profesyonel hafıza geliştirme oyunu
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

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

  // Ses temaları - hem ana dizin hem alt dizin desteği
  const soundThemes = {
    electronic: [
      '/static/sounds/audio-memory/note1.mp3',
      '/static/sounds/audio-memory/note2.mp3',
      '/static/sounds/audio-memory/note3.mp3',
      '/static/sounds/audio-memory/note4.mp3',
      '/static/sounds/audio-memory/note5.mp3',
      '/static/sounds/audio-memory/note6.mp3',
      '/static/sounds/audio-memory/note7.mp3',
      '/static/sounds/audio-memory/note8.mp3'
    ],
    musical: [
      '/static/sounds/audio-memory/note1.mp3',
      '/static/sounds/audio-memory/note2.mp3',
      '/static/sounds/audio-memory/note3.mp3',
      '/static/sounds/audio-memory/note4.mp3',
      '/static/sounds/audio-memory/note5.mp3',
      '/static/sounds/audio-memory/note6.mp3',
      '/static/sounds/audio-memory/note7.mp3',
      '/static/sounds/audio-memory/note8.mp3'
    ],
    drums: [
      '/static/sounds/audio-memory/note1.mp3',
      '/static/sounds/audio-memory/note2.mp3',
      '/static/sounds/audio-memory/note3.mp3',
      '/static/sounds/audio-memory/note4.mp3',
      '/static/sounds/audio-memory/note5.mp3',
      '/static/sounds/audio-memory/note6.mp3',
      '/static/sounds/audio-memory/note7.mp3',
      '/static/sounds/audio-memory/note8.mp3'
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

  // Ses dosyalarını önceden yükle ve hazırla
  function preloadSounds() {
    try {
      console.log('Ses dosyaları yükleniyor...');

      // UI sesleri
      // Ana dizinden yüklemeyi dene, başarısız olursa alt dizinden yüklemeyi dene
      try {
        sounds.correct = new Audio('/static/sounds/correct.mp3');
        sounds.wrong = new Audio('/static/sounds/wrong.mp3');
        sounds.levelUp = new Audio('/static/sounds/level-up.mp3');
        sounds.gameOver = new Audio('/static/sounds/game-over.mp3');
        sounds.gameComplete = new Audio('/static/sounds/success.mp3');
      } catch (e) {
        console.warn('Ana dizinden ses yükleme başarısız, alt dizinden deneniyor...');
        try {
          sounds.correct = new Audio('/static/sounds/audio-memory/correct.mp3');
          sounds.wrong = new Audio('/static/sounds/audio-memory/wrong.mp3');
          sounds.levelUp = new Audio('/static/sounds/audio-memory/level-up.mp3');
          sounds.gameOver = new Audio('/static/sounds/audio-memory/game-over.mp3');
          sounds.gameComplete = new Audio('/static/sounds/audio-memory/success.mp3');
        } catch (innerE) {
          console.error('Ses yükleme hatası, varsayılan sesler kullanılacak:', innerE);
          createFallbackSounds();
        }
      }

      // Ses seviyelerini ayarla
      sounds.correct.volume = 0.7;
      sounds.wrong.volume = 0.7;
      sounds.levelUp.volume = 0.7;
      sounds.gameOver.volume = 0.7;
      sounds.gameComplete.volume = 0.7;

      console.log('Ses dosyaları yüklendi');

      // Tema sesleri, oyun başladığında yüklenecek
      loadThemeSounds();
    } catch (e) {
      console.error('Ses yükleme hatası:', e);
      createFallbackSounds();
    }
  }

  // Tema seslerini yükle
  function loadThemeSounds() {
    try {
      // Tema seslerini yükle
      const currentSoundSet = soundThemes[currentTheme];
      const tileCount = difficultySettings[currentDifficulty].tileCount;

      // Mevcut ses dizisini temizle
      sounds.tiles = [];

      // Her kutu için ses yükle
      for (let i = 0; i < tileCount; i++) {
        if (i < currentSoundSet.length) {
          try {
            // Önce normal yoldan yüklemeyi dene
            const sound = new Audio(currentSoundSet[i]);
            sound.volume = 0.8;
            sounds.tiles.push(sound);
          } catch (noteError) {
            console.warn(`Not ${i+1} ana dizinden yüklenemedi, alternatif konumları deneniyor...`);
            try {
              // Alt dizinden yüklemeyi dene
              const altPath = currentSoundSet[i].replace('/static/sounds/', '/static/sounds/audio-memory/');
              const sound = new Audio(altPath);
              sound.volume = 0.8;
              sounds.tiles.push(sound);
            } catch (innerError) {
              console.error(`Not ${i+1} yüklenemedi, varsayılan ses kullanılıyor`, innerError);
              // Varsayılan ses
              const dummySound = {
                play: function() { console.log(`Kutucuk ${i+1} sesi çalınıyor (varsayılan)`); return Promise.resolve(); },
                pause: function() { console.log('Ses durduruldu'); },
                currentTime: 0,
                volume: 0.8
              };
              sounds.tiles.push(dummySound);
            }
          }
        } else {
          // Ses temasında yeterli ses yoksa varsayılan ses kullan
          try {
            const fallbackSound = new Audio('/static/sounds/note1.mp3');
            fallbackSound.volume = 0.8;
            sounds.tiles.push(fallbackSound);
          } catch (fbError) {
            console.warn('Varsayılan ses 1 yüklenemedi, alternatif dizin deneniyor');
            try {
              const fallbackSound = new Audio('/static/sounds/audio-memory/note1.mp3');
              fallbackSound.volume = 0.8;
              sounds.tiles.push(fallbackSound);
            } catch (innerFBError) {
              console.error('Varsayılan ses de yüklenemedi, sessiz nesne kullanılıyor');
              const dummySound = {
                play: function() { console.log(`Kutucuk ${i+1} sesi çalınıyor (varsayılan)`); return Promise.resolve(); },
                pause: function() { console.log('Ses durduruldu'); },
                currentTime: 0,
                volume: 0.8
              };
              sounds.tiles.push(dummySound);
            }
          }
        }
      }
    } catch (e) {
      console.error('Tema sesleri yükleme hatası:', e);
      createFallbackTileSounds();
    }
  }

  // Hata durumunda varsayılan sesleri oluştur
  function createFallbackSounds() {
    console.warn('Varsayılan ses efektleri oluşturuluyor...');

    const dummySound = {
      play: function() { 
        console.log('Ses çalınıyor (varsayılan)'); 
        return Promise.resolve();
      },
      pause: function() { console.log('Ses durduruldu'); },
      currentTime: 0,
      volume: 0.7
    };

    sounds.correct = dummySound;
    sounds.wrong = dummySound;
    sounds.levelUp = dummySound;
    sounds.gameOver = dummySound;
    sounds.gameComplete = dummySound;

    // Kutucuk sesleri
    createFallbackTileSounds();
  }

  // Hata durumunda kutucuklar için varsayılan sesleri oluştur
  function createFallbackTileSounds() {
    sounds.tiles = [];
    const tileCount = difficultySettings[currentDifficulty].tileCount;

    for (let i = 0; i < tileCount; i++) {
      sounds.tiles.push({
        play: function() { 
          console.log(`Kutucuk ${i+1} sesi çalınıyor (varsayılan)`); 
          return Promise.resolve();
        },
        pause: function() { console.log('Ses durduruldu'); },
        currentTime: 0,
        volume: 0.8
      });
    }
  }

  // Event listener'ları ayarla
  function initEventListeners() {
    // Oyun başlatma butonu
    if (startGameBtn) {
      startGameBtn.addEventListener('click', startGame);
    }

    // Zorluk seviyesi butonları
    levelButtons.forEach(button => {
      button.addEventListener('click', function() {
        levelButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentDifficulty = this.getAttribute('data-level');
      });
    });

    // Ses tema butonları
    themeButtons.forEach(button => {
      button.addEventListener('click', function() {
        themeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentTheme = this.getAttribute('data-theme');

        // Tema değiştiğinde sesleri yeniden yükle
        loadThemeSounds();
      });
    });

    // Özel modlar
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

        // Bonus modu kapatılınca combo sıfırlanır
        if (!bonusMode) {
          combo = 0;
          streakMultiplier = 1;
        }
      });
    }

    // Oyun içi kontroller
    if (pauseGameBtn) {
      pauseGameBtn.addEventListener('click', togglePause);
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', togglePause);
    }

    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', toggleSound);
    }

    // Sonuç ekranı butonları
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', restartGame);
    }

    if (saveScoreBtn) {
      saveScoreBtn.addEventListener('click', saveScore);
    }
  }

  // Oyunu başlat
  function startGame() {
    console.log('Kartlar oluşturuldu, timer başlatılıyor...');

    // Ekranları ayarla
    gameIntro.style.display = 'none';
    gameBoard.style.display = 'block';
    gameResults.style.display = 'none';

    // Oyun durumunu sıfırla
    resetGameState();

    // Kutucukları oluştur
    createTiles();

    // Zamanlayıcıyı başlat
    startTimer();

    // İlk seviyeyi başlat
    startLevel();

    // Oyunu aktif et
    gameActive = true;

    console.log('Oyun başarıyla başlatıldı!');
  }

  // Oyun durumunu sıfırla
  function resetGameState() {
    // Oyun değişkenlerini sıfırla
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

    // UI'ı güncelle
    updateDisplay();

    // İlerleme çubuğunu sıfırla
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';

    // Duraklatma durumunu sıfırla
    gamePaused = false;
    pauseOverlay.style.display = 'none';
  }

  // Kutucukları oluştur
  function createTiles() {
    // Önce konteyneri temizle
    tilesContainer.innerHTML = '';

    // Buton sayısını zorluk seviyesine göre ayarla
    const tileCount = difficultySettings[currentDifficulty].tileCount;

    // Grid düzenini ayarla ve veri özniteliğini ekle
    tilesContainer.setAttribute('data-count', tileCount);

    // Kutucukları oluştur
    tiles = [];
    for (let i = 0; i < tileCount; i++) {
      const tile = document.createElement('div');
      tile.className = `audio-tile audio-tile-${(i % 8) + 1}`;
      tile.dataset.index = i;

      // Ses dalgası içeriği ekle
      const waveContainer = document.createElement('div');
      waveContainer.className = 'audio-wave';

      // Dalga çubukları oluştur
      for (let j = 0; j < 5; j++) {
        const bar = document.createElement('div');
        bar.className = 'audio-wave-bar';
        bar.style.left = `${(j * 20) + 10}%`;
        bar.style.animationDelay = `${j * 0.1}s`;
        waveContainer.appendChild(bar);
      }

      // Kutucuğa tıklama olayı
      tile.addEventListener('click', () => {
        if (!isPlayerTurn || gamePaused) return;

        // Kutucuğu aktif et ve sesini çal
        activateTile(i);

        // Oyuncu sırasını kontrol et
        checkPlayerSequence(i);
      });

      // Konteynere ekle
      tilesContainer.appendChild(tile);
      tiles.push(tile);
    }

    console.log(`${tileCount} kutucuk oluşturuldu`);
  }

  // Yeni seviyeyi başlat
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
    updateStatusMessage('Sırayı İzleyin...', 'info');

    // Yeni seviyede sıradaki kutucukları ekle
    if (level === 1) {
      // İlk seviyede başlangıç uzunluğunda sekans oluştur
      sequence = [];
      const startLength = difficultySettings[currentDifficulty].startSequenceLength;

      for (let i = 0; i < startLength; i++) {
        addRandomToSequence();
      }
    } else {
      // Sonraki seviyelerde yeni kutucuk ekle
      addRandomToSequence();
    }

    // Kısa bir beklemeden sonra sekansı göster
    setTimeout(() => {
      playSequence();
    }, 1000);
  }

  // Sekansa rastgele bir kutucuk ekle
  function addRandomToSequence() {
    const randomIndex = Math.floor(Math.random() * tiles.length);
    sequence.push(randomIndex);
  }

  // Mevcut sekansı oynat
  function playSequence() {
    if (gamePaused) return;

    console.log('Sekans oynatılıyor:', sequence);

    // İlerleme çubuğunu sıfırla
    statusProgressBar.style.width = '0%';

    // Zorluk seviyesine göre hız ayarla
    let speedMultiplier = difficultySettings[currentDifficulty].speedMultiplier;

    // Hız modu açıksa daha hızlı oynat
    if (speedMode) {
      speedMultiplier *= 0.7;
    }

    const interval = 600 * speedMultiplier;
    const pauseDuration = 400 * speedMultiplier;

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

        // Sıradaki kutucuğu aktifleştir
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

  // Oyuncu sırasını başlat
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

  // Kutucuğu aktifleştir ve ses çal
  function activateTile(tileIndex) {
    if (gamePaused) return;

    const tile = tiles[tileIndex];

    // Eğer kutucuk zaten aktif ise, işlemi tekrarlama
    if (tile.classList.contains('active')) return;

    // Kutucuğu aktifleştir
    tile.classList.add('active');

    // Ses çal
    playSound(sounds.tiles[tileIndex]);

    // Işıltı efekti oluştur
    createGlowEffect(tile);

    // Ses dalgası efekti oluştur
    createWaveEffect(tile);

    // İkonu belirginleştir
    const icon = tile.querySelector('i');
    if (icon) {
      icon.style.opacity = '1';
    }

    // Kutucuğu belirli bir süre sonra deaktifleştir
    setTimeout(() => {
      tile.classList.remove('active');

      // İkonu normal haline getir
      if (icon) {
        icon.style.opacity = '0.7';
      }
    }, 350);
  }

  // Kutucuğa ışıltı efekti ekle
  function createGlowEffect(tile) {
    // Mevcut efekti temizle
    const existingGlow = tile.querySelector('.audio-glow');
    if (existingGlow) {
      tile.removeChild(existingGlow);
    }

    // Yeni ışıltı efekti oluştur
    const glow = document.createElement('div');
    glow.className = 'audio-glow';
    tile.appendChild(glow);

    // Belirli bir süre sonra efekti temizle
    setTimeout(() => {
      if (glow && glow.parentNode) {
        glow.parentNode.removeChild(glow);
      }
    }, 500);
  }

  // Kutucuğa ses dalgası efekti ekle
  function createWaveEffect(tile) {
    // Zaten var olan wave barları aktifleştir
    const existingWave = tile.querySelector('.audio-wave');
    if (existingWave) {
      const bars = existingWave.querySelectorAll('.audio-wave-bar');
      bars.forEach(bar => {
        // Görünürlüğü aktifleştir
        bar.style.opacity = '1';

        // Rastgele yükseklik animasyonu
        bar.style.height = `${20 + Math.random() * 50}%`;

        // Animasyon gecikmesi
        bar.style.animationDelay = `${Math.random() * 0.3}s`;
      });

      // Belirli bir süre sonra dalgaları gizle
      setTimeout(() => {
        bars.forEach(bar => {
          bar.style.opacity = '0';
          bar.style.height = '20%';
        });
      }, 300);

      return;
    }

    // Dalga yoksa, yeni dalga container'ı oluştur
    const wave = document.createElement('div');
    wave.className = 'audio-wave';

    // Dalga barları oluştur
    const barCount = 5;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-wave-bar';
      bar.style.setProperty('--i', i);

      // Bar konumu
      bar.style.left = `${(i / (barCount - 1)) * 80 + 10}%`;

      // Genişlik ve animasyon gecikmesi
      bar.style.width = '4px';
      bar.style.opacity = '1';
      bar.style.height = `${20 + Math.random() * 50}%`;
      bar.style.animationDelay = `${Math.random() * 0.3}s`;

      wave.appendChild(bar);
    }

    // Tile'a ekle
    tile.appendChild(wave);

    // Belirli bir süre sonra dalgaları gizle
    setTimeout(() => {
      const bars = wave.querySelectorAll('.audio-wave-bar');
      bars.forEach(bar => {
        bar.style.opacity = '0';
        bar.style.height = '20%';
      });
    }, 300);
  }

  // Oyuncu sırasını kontrol et
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
      // Doğru kutucuk
      currentStep++;

      // Tüm sekans tamamlandı mı kontrol et
      if (currentStep === sequence.length) {
        // Seviyeyi tamamladı
        handleLevelComplete();
      }
    } else {
      // Yanlış kutucuk - oyun bitti
      handleGameOver();
    }
  }

  // Seviye tamamlandı
  function handleLevelComplete() {
    console.log('Seviye tamamlandı!');

    // Oyuncu sırasını kapat
    isPlayerTurn = false;

    // Durum mesajını güncelle
    updateStatusMessage('Harika! Doğru Sıra!', 'success');

    // Doğru sesi çal
    playSound(sounds.correct);

    // Bonus mod açıksa combo'yu güncelle
    if (bonusMode) {
      combo++;
      // En yüksek combo değerini güncelle
      maxCombo = Math.max(maxCombo, combo);

      // Combo 3 ve üzeriyse çarpan değerini artır
      if (combo >= 3) {
        streakMultiplier = Math.min(3, 1 + (combo - 3) * 0.25);
      }
    }

    // Perfect sequence - tüm diziliş ilk denemede doğru tamamlandı
    if (playerSequence.length === sequence.length) {
      perfectSequences++;
    }

    // Puan hesapla
    const levelPoints = difficultySettings[currentDifficulty].pointsPerLevel;
    const timeBonus = Math.max(0, 50 - Math.floor(timer / 5));
    const streakBonus = Math.floor(levelPoints * (streakMultiplier - 1));
    const perfectBonus = perfectSequences * 5;
    const totalPoints = Math.floor((levelPoints + timeBonus + perfectBonus) * streakMultiplier);

    // Bonus puan animasyonu göster
    if (streakBonus > 0 || perfectBonus > 0) {
      showBonusPoints(totalPoints);
    }

    // Skoru güncelle
    score += totalPoints;

    // Ekranı güncelle
    updateDisplay();

    // Puan bilgisini göster
    if (streakMultiplier > 1) {
      showAlert(`+${totalPoints} Puan! 🔥 ${streakMultiplier.toFixed(1)}x Combo!`, 'success');
    } else {
      showAlert(`+${totalPoints} Puan! 🎉`, 'success');
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

    // Yeni seviyeyi başlat
    setTimeout(() => {
      // Seviye atlama sesi çal
      playSound(sounds.levelUp);

      // Seviye atlama bilgisini göster
      showAlert(`Seviye ${level} Başlıyor! 🚀`, 'info');

      // Yeni seviyeyi başlat
      startLevel();
    }, 1500);
  }

  // Oyun bitti - Başarısız
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

  // Doğru sekansı göster
  function showCorrectSequence(callback) {
    let step = 0;

    // Doğru sırayı göster
    const showStep = () => {
      if (step < sequence.length) {
        // Kutucuğu işaretle
        const tileIndex = sequence[step];
        const tile = tiles[tileIndex];

        // Doğru kutucuk ise yeşil, yanlış tıklanan son kutucuk ise kırmızı ışıklandır
        const isLastWrong = step === playerSequence.length - 1 && 
                         playerSequence[step] !== sequence[step];

        if (isLastWrong) {
          tile.style.boxShadow = '0 0 20px var(--error)';
        } else {
          tile.style.boxShadow = '0 0 20px var(--success)';
        }

        // Kutucuğu aktifleştir
        activateTile(tileIndex);

        // Bekle ve sonraki adıma geç
        setTimeout(() => {
          // Kutucuk stilini sıfırla
          tile.style.boxShadow = '';
          step++;
          showStep();
        }, 600);
      } else {
        // Tamamlandı, callback'i çağır
        if (callback) callback();
      }
    };

    // Gösterimi başlat
    showStep();
  }

  // Oyunu bitir
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
    gameResults.style.display = 'flex';
  }

  // Sonuç ekranını hazırla
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

  // Performansı hesapla ve yıldızları güncelle
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

  // Yıldız değerlendirmesini güncelle
  function updateStarRating(rating) {
    // Yarım yıldıza yuvarla
    const roundedRating = Math.round(rating * 2) / 2;

    // Yıldızları güncelle
    const stars = performanceStars.querySelectorAll('i');
    stars.forEach((star, index) => {
      star.style.setProperty('--i', index);

      if (index + 1 <= roundedRating) {
        star.className = 'bi bi-star-fill';
      } else if (index + 0.5 === roundedRating) {
        star.className = 'bi bi-star-half';
      } else {
        star.className = 'bi bi-star';
      }
    });
  }

  // Değeri animasyonla güncelle
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

  // Zamanlayıcıyı başlat
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

  // Zamanlayıcı göstergesini güncelle
  function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Bonus puan animasyonu göster
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

  // Durum mesajını güncelle
  function updateStatusMessage(message, type = 'info') {
    statusText.textContent = message;

    // Stil sınıflarını güncelle
    statusText.className = '';
    statusText.classList.add(`status-${type}`);
  }

  // Uyarı mesajı göster
  function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('gameAlerts');

    if (!alertsContainer) return;

    // Uyarı elementi oluştur
    const alert = document.createElement('div');
    alert.className = `alert-message ${type}`;
    alert.textContent = message;

    // Uyarılar konteynerine ekle
    alertsContainer.appendChild(alert);

    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      if (alert.parentNode) {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 400);
      }
    }, 2500);
  }

  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    // Seviyeye göre ilerlemeyi hesapla (yüzde olarak)
    const progress = Math.min(100, (level / maxLevel) * 100);

    // Çubuğu animasyonla güncelle
    progressBar.style.width = `${progress}%`;

    // Yüzde metnini güncelle
    progressPercent.textContent = `${Math.round(progress)}%`;

    // Önemli dönüm noktaları için kutlama mesajları
    if (Math.round(progress) === 25) {
      showAlert('İlerlemeniz harika! Devam edin! 🚀', 'info');
    } else if (Math.round(progress) === 50) {
      showAlert('Yarıyı geçtiniz! Harika ilerleme! 🏆', 'info');
    } else if (Math.round(progress) === 75) {
      showAlert('Son düzlüğe girdiniz! 🏁', 'info');
    }
  }

  // Ekran değerlerini güncelle
  function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
  }

  // Oyunu duraklat/devam et
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

  // Sesi aç/kapat
  function toggleSound() {
    soundEnabled = !soundEnabled;

    const soundIcon = soundToggleBtn.querySelector('i');
    if (soundEnabled) {
      soundIcon.className = 'bi bi-volume-up-fill';
    } else {
      soundIcon.className = 'bi bi-volume-mute-fill';
    }
  }

  // Ses çal - güçlendirilmiş
  function playSound(sound) {
    if (!soundEnabled || !sound) return;

    try {
      // Geçerli bir Audio nesnesi mi kontrol et
      if (sound instanceof Audio) {
        // Sesi başa sar
        if (sound.currentTime !== undefined) {
          sound.currentTime = 0;
        }

        // Sesi çal
        sound.play().catch(e => {
          console.log('Ses çalma hatası:', e);
          // Hata durumunda alternatif çalma yöntemi
          if (sound.src) {
            try {
              // Yeni bir ses nesnesi oluştur ve çal
              const tempSound = new Audio(sound.src);
              tempSound.volume = sound.volume || 0.7;
              tempSound.play().catch(innerE => {
                console.log('Alternatif ses çalma hatası:', innerE);
              });
            } catch (altError) {
              console.error('Alternatif ses çalma başarısız:', altError);
            }
          }
        });
      } else if (sound.play && typeof sound.play === 'function') {
        // Custom ses nesnesi (kendi oluşturduğumuz)
        sound.play();
      } else {
        console.warn('Geçersiz ses nesnesi, çalınamıyor:', sound);
      }
    } catch (e) {
      console.error('Ses çalma hatası:', e);
    }
  }

  // Oyunu yeniden başlat
  function restartGame() {
    gameResults.style.display = 'none';
    startGame();
  }

  // Skoru kaydet
  function saveScore() {
    // Butonu devre dışı bırak
    saveScoreBtn.disabled = true;
    saveScoreBtn.textContent = 'Kaydediliyor...';

    // Veri hazırla
    const scoreData = {
      game_type: 'audioMemory',
      score: score
    };

    console.log('Skor kaydediliyor:', scoreData);

    // API URL doğru mu kontrol et
    let apiUrl = '/api/save-score';

    // İlk önce /api/save-score'u dene, başarısız olursa /save_score'u dene
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    })
    .then(response => {
      if (!response.ok) {
        console.warn('İlk API endpoint başarısız, alternatif deneniyor');
        // İlk endpoint başarısız olursa alternatif endpoint'i dene
        apiUrl = '/save_score';
        return fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scoreData)
        });
      }
      return response;
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showAlert('Skorunuz başarıyla kaydedildi!', 'success');
        saveScoreBtn.textContent = '✓ Kaydedildi';
        saveScoreBtn.classList.add('btn-success');
      } else {
        showAlert('Skor kaydedilemedi: ' + (data.message || 'Bilinmeyen hata'), 'error');
        saveScoreBtn.textContent = 'Tekrar Dene';
        saveScoreBtn.disabled = false;
      }
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
      showAlert('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      saveScoreBtn.textContent = 'Tekrar Dene';
      saveScoreBtn.disabled = false;
    });
  }

  // Oyunu başlat
  function initGame() {
    // Sesleri önceden yükle
    preloadSounds();

    // Olay dinleyicilerini ayarla
    initEventListeners();

    console.log('Sesli Hafıza: Melodi oyunu başarıyla yüklendi!');
  }

  // Oyunu başlat
  initGame();
});