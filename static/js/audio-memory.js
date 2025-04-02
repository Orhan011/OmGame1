
/**
 * Sesli Hafıza: Melodi - Ana JavaScript dosyası
 * 
 * Oyun mantığı ve kullanıcı etkileşimleri için gerekli kodlar
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const introScreen = document.getElementById('introScreen');
  const gameScreen = document.getElementById('gameScreen');
  const resultsScreen = document.getElementById('resultsScreen');
  const statsBar = document.getElementById('statsBar');
  const audioButtonsContainer = document.getElementById('audioButtonsContainer');
  const waveContainer = document.getElementById('waveContainer');
  const playbackStatus = document.getElementById('playbackStatus');
  const statusMessage = document.getElementById('statusMessage');
  const notification = document.getElementById('notification');
  
  // İstatistik Elementleri
  const scoreValue = document.getElementById('scoreValue');
  const timeValue = document.getElementById('timeValue');
  const levelValue = document.getElementById('levelValue');
  const sequenceValue = document.getElementById('sequenceValue');
  const jokerCounter = document.getElementById('jokerCounter');
  
  // Sonuç Ekranı Elementleri
  const finalScore = document.getElementById('finalScore');
  const finalSequence = document.getElementById('finalSequence');
  const finalTime = document.getElementById('finalTime');
  const resultMessage = document.getElementById('resultMessage');
  
  // Butonlar
  const startGameBtn = document.getElementById('startGameBtn');
  const replayBtn = document.getElementById('replayBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const endGameBtn = document.getElementById('endGameBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const returnHomeBtn = document.getElementById('returnHomeBtn');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const themeBtns = document.querySelectorAll('.theme-btn');
  
  // Paylaşım Butonları
  const shareWhatsapp = document.getElementById('shareWhatsapp');
  const shareTwitter = document.getElementById('shareTwitter');
  const shareFacebook = document.getElementById('shareFacebook');

  // Oyun Durumu
  let gameState = {
    isPlaying: false,
    sequence: [],
    playerSequence: [],
    level: 1,
    score: 0,
    startTime: null,
    elapsedTime: 0,
    timer: null,
    difficulty: 'easy',
    theme: 'nature',
    soundEnabled: true,
    jokerUsed: false,
    gameEnded: false,
    maxJokers: 1,
    availableJokers: 1,
    currentlyPlayingIndex: -1,
    waitingForPlayerInput: false,
    sequencePlaybackTimeout: null,
    sounds: {
      nature: [],
      instruments: [],
      retro: []
    },
    fallbackSounds: {
      match: null,
      noMatch: null,
      hint: null,
      gameComplete: null,
      flip: null
    }
  };

  // Zorluk seviyesine göre ayarlar
  const difficultySettings = {
    easy: {
      buttonCount: 4,
      initialSequenceLength: 2,
      playbackSpeed: 1000,
      maxJokers: 1
    },
    medium: {
      buttonCount: 6,
      initialSequenceLength: 3,
      playbackSpeed: 800,
      maxJokers: 1
    },
    hard: {
      buttonCount: 8,
      initialSequenceLength: 4,
      playbackSpeed: 600,
      maxJokers: 1
    }
  };

  // Ses temalarına göre renk sınıfları
  const themeClasses = {
    nature: ['nature-1', 'nature-2', 'nature-3', 'nature-4'],
    instruments: ['instruments-1', 'instruments-2', 'instruments-3', 'instruments-4'],
    retro: ['retro-1', 'retro-2', 'retro-3', 'retro-4']
  };

  // Ses Dosyalarını Yükle
  function loadSounds() {
    try {
      // Tema sesleri
      const natureTheme = [
        new Audio('/static/sounds/note1.mp3'), // Kuş sesi yerine
        new Audio('/static/sounds/note2.mp3'), // Su sesi yerine
        new Audio('/static/sounds/note3.mp3'), // Rüzgar sesi yerine
        new Audio('/static/sounds/note4.mp3')  // Orman sesi yerine
      ];
      
      const instrumentsTheme = [
        new Audio('/static/sounds/note1.mp3'),
        new Audio('/static/sounds/note2.mp3'),
        new Audio('/static/sounds/note3.mp3'),
        new Audio('/static/sounds/note4.mp3')
      ];
      
      const retroTheme = [
        new Audio('/static/sounds/note1.mp3'),
        new Audio('/static/sounds/note2.mp3'),
        new Audio('/static/sounds/note3.mp3'),
        new Audio('/static/sounds/note4.mp3')
      ];
      
      // Tema seslerini ayarla
      gameState.sounds.nature = natureTheme;
      gameState.sounds.instruments = instrumentsTheme;
      gameState.sounds.retro = retroTheme;
      
      // Yedek sistem sesleri
      gameState.fallbackSounds.match = new Audio('/static/sounds/match.mp3');
      gameState.fallbackSounds.noMatch = new Audio('/static/sounds/no-match.mp3');
      gameState.fallbackSounds.hint = new Audio('/static/sounds/hint.mp3');
      gameState.fallbackSounds.gameComplete = new Audio('/static/sounds/game-complete.mp3');
      gameState.fallbackSounds.flip = new Audio('/static/sounds/card-flip.mp3');
      
      console.log("Ses dosyaları yüklendi");
    } catch (error) {
      console.error("Ses dosyalarını yüklerken hata:", error);
      showNotification("Ses dosyaları yüklenemedi, ancak oyun oynanabilir.", "error");
    }
  }

  // Ses Çal
  function playSound(type, index = -1) {
    if (!gameState.soundEnabled) return;
    
    try {
      if (type === 'button' && index >= 0) {
        const sound = gameState.sounds[gameState.theme][index];
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(err => {
            console.log(`${gameState.theme} teması ${index} indeksi ses dosyası yüklenemedi`);
          });
        }
      } else if (type in gameState.fallbackSounds) {
        const sound = gameState.fallbackSounds[type];
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(err => {
            console.log(`${type} çalma başarısız, devam ediliyor`);
          });
        }
      }
    } catch (error) {
      console.log(`${type} ses dosyası yüklenemedi`);
    }
  }

  // Bildirim Göster
  function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'audio-notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Oyun Zaman Sayacı
  function startTimer() {
    gameState.startTime = gameState.startTime || Date.now();
    
    gameState.timer = setInterval(() => {
      const now = Date.now();
      gameState.elapsedTime = Math.floor((now - gameState.startTime) / 1000);
      
      const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
      const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
      
      timeValue.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  // Zamanlayıcıyı Durdur
  function stopTimer() {
    clearInterval(gameState.timer);
  }

  // Ses Dalgası Animasyonu
  function setVisualizerState(isPlaying) {
    if (isPlaying) {
      waveContainer.classList.add('playing');
    } else {
      waveContainer.classList.remove('playing');
    }
  }

  // Ses Butonlarını Oluştur
  function createAudioButtons() {
    const settings = difficultySettings[gameState.difficulty];
    audioButtonsContainer.innerHTML = '';
    
    const buttonCount = Math.min(settings.buttonCount, 
                                 gameState.sounds[gameState.theme].length);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = document.createElement('button');
      button.className = `audio-button ${themeClasses[gameState.theme][i % themeClasses[gameState.theme].length]}`;
      button.dataset.index = i;
      
      button.addEventListener('click', () => {
        if (!gameState.waitingForPlayerInput) return;
        
        handlePlayerInput(i);
      });
      
      audioButtonsContainer.appendChild(button);
    }
  }

  // Oyunu Başlat
  function startGame() {
    introScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    resultsScreen.style.display = 'none';
    
    // Oyun durumunu sıfırla
    const settings = difficultySettings[gameState.difficulty];
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.startTime = Date.now();
    gameState.jokerUsed = false;
    gameState.gameEnded = false;
    gameState.availableJokers = settings.maxJokers;
    gameState.waitingForPlayerInput = false;
    
    // İstatistikleri güncelle
    scoreValue.textContent = gameState.score;
    levelValue.textContent = gameState.level;
    sequenceValue.textContent = gameState.sequence.length;
    jokerCounter.textContent = gameState.availableJokers;
    
    // Butonları hazırla
    createAudioButtons();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    console.log("Oyun başlatılıyor...");
    
    // İlk diziyi oluştur
    generateSequence(settings.initialSequenceLength);
    
    // Diziyi 1 saniye sonra çal
    setTimeout(() => {
      console.log("Kartlar oluşturuldu, timer başlatılıyor...");
      playSequence();
    }, 1000);
    
    showNotification("Oyun başarıyla başlatıldı!", "success");
  }

  // Rastgele Ses Dizisi Oluştur
  function generateSequence(length) {
    const settings = difficultySettings[gameState.difficulty];
    const maxButtonIndex = Math.min(settings.buttonCount, 
                                   gameState.sounds[gameState.theme].length) - 1;
    
    // Önceki dizi korunurken yeni elemanlar ekle
    const currentLength = gameState.sequence.length;
    
    for (let i = currentLength; i < length; i++) {
      const randomButtonIndex = Math.floor(Math.random() * (maxButtonIndex + 1));
      gameState.sequence.push(randomButtonIndex);
    }
    
    sequenceValue.textContent = gameState.sequence.length;
  }

  // Ses Dizisini Oynat
  function playSequence() {
    setVisualizerState(true);
    updateStatusMessage('listen');
    gameState.waitingForPlayerInput = false;
    gameState.playerSequence = [];
    gameState.currentlyPlayingIndex = -1;
    
    const settings = difficultySettings[gameState.difficulty];
    playbackStatus.textContent = "Ses dizisini dinleyin...";
    
    // Dizideki her ses için timeoutlar ile çalma
    gameState.sequence.forEach((buttonIndex, sequenceIndex) => {
      gameState.sequencePlaybackTimeout = setTimeout(() => {
        gameState.currentlyPlayingIndex = sequenceIndex;
        
        // Tüm butonları normal hale getir
        const buttons = audioButtonsContainer.querySelectorAll('.audio-button');
        buttons.forEach(btn => btn.classList.remove('playing'));
        
        // İlgili butonu vurgula ve sesini çal
        const currentButton = buttons[buttonIndex];
        if (currentButton) {
          currentButton.classList.add('playing');
          playSound('button', buttonIndex);
          
          // Vurgulamayı 400ms sonra kaldır
          setTimeout(() => {
            currentButton.classList.remove('playing');
          }, settings.playbackSpeed * 0.4);
        }
        
        // Son ses çalındıktan sonra oyuncunun giriş yapması için hazırla
        if (sequenceIndex === gameState.sequence.length - 1) {
          setTimeout(() => {
            setVisualizerState(false);
            updateStatusMessage('repeat');
            gameState.waitingForPlayerInput = true;
            playbackStatus.textContent = "Şimdi sırayı tekrarlayın!";
            replayBtn.disabled = false;
          }, settings.playbackSpeed);
        }
      }, sequenceIndex * settings.playbackSpeed);
    });
  }

  // Oyuncu Girişini İşle
  function handlePlayerInput(buttonIndex) {
    const settings = difficultySettings[gameState.difficulty];
    gameState.playerSequence.push(buttonIndex);
    
    // Basılan butonu vurgula ve sesini çal
    const buttons = audioButtonsContainer.querySelectorAll('.audio-button');
    const currentButton = buttons[buttonIndex];
    
    if (currentButton) {
      currentButton.classList.add('playing');
      playSound('button', buttonIndex);
      
      // Vurgulamayı 300ms sonra kaldır
      setTimeout(() => {
        currentButton.classList.remove('playing');
      }, 300);
    }
    
    // Son girilen sesin, dizideki karşılık gelen ses ile eşleşip eşleşmediğini kontrol et
    const currentIndex = gameState.playerSequence.length - 1;
    
    if (gameState.playerSequence[currentIndex] !== gameState.sequence[currentIndex]) {
      // Yanlış ses - oyun bitti
      playSound('noMatch');
      updateStatusMessage('error');
      endGame(false);
      return;
    }
    
    // Oyuncu tüm diziyi doğru girdi mi kontrol et
    if (gameState.playerSequence.length === gameState.sequence.length) {
      // Dizi tamamlandı
      gameState.waitingForPlayerInput = false;
      updateStatusMessage('success');
      playSound('match');
      
      // Skoru güncelle
      gameState.score += gameState.sequence.length * 10;
      scoreValue.textContent = gameState.score;
      
      // Sonraki seviyeye geç
      setTimeout(() => {
        gameState.level++;
        levelValue.textContent = gameState.level;
        
        // Diziye 1 eleman daha ekle
        generateSequence(gameState.sequence.length + 1);
        
        // Tekrar joker hakkı ver
        if (gameState.level % 5 === 0 && gameState.availableJokers < settings.maxJokers) {
          gameState.availableJokers++;
          jokerCounter.textContent = gameState.availableJokers;
          showNotification("Seviye atladınız! +1 Joker hakkı kazandınız.", "success");
        }
        
        // 1.5 saniye bekle ve yeni diziyi oynat
        setTimeout(() => {
          playSequence();
        }, 1500);
      }, 1000);
    }
  }

  // Durum Mesajını Güncelle
  function updateStatusMessage(status) {
    statusMessage.className = 'game-status-message';
    
    switch(status) {
      case 'listen':
        statusMessage.innerHTML = '<div class="status-icon"><i class="bi bi-headphones"></i></div><div class="status-text">Dinle ve hatırla</div>';
        break;
      case 'repeat':
        statusMessage.innerHTML = '<div class="status-icon"><i class="bi bi-arrow-repeat"></i></div><div class="status-text">Sıralamayı tekrarla</div>';
        break;
      case 'success':
        statusMessage.innerHTML = '<div class="status-icon"><i class="bi bi-check-circle"></i></div><div class="status-text">Harika! Doğru sıralama</div>';
        statusMessage.classList.add('success');
        break;
      case 'error':
        statusMessage.innerHTML = '<div class="status-icon"><i class="bi bi-x-circle"></i></div><div class="status-text">Yanlış! Oyun bitti</div>';
        statusMessage.classList.add('error');
        break;
    }
  }

  // Oyunu Bitir
  function endGame(completed = false) {
    stopTimer();
    gameState.gameEnded = true;
    gameState.waitingForPlayerInput = false;
    
    // İlgili ses efektini çal
    if (completed) {
      playSound('gameComplete');
    } else {
      playSound('noMatch');
    }
    
    // Timeoutları temizle
    clearTimeout(gameState.sequencePlaybackTimeout);
    
    // Sonuç değerlerini güncelle
    finalScore.textContent = gameState.score;
    finalSequence.textContent = gameState.sequence.length - (completed ? 0 : 1);
    
    const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
    finalTime.textContent = `${minutes}:${seconds}`;
    
    // Sonuç mesajını hazırla
    if (completed) {
      resultMessage.textContent = "Tebrikler! Tüm ses dizisini başarıyla tamamladınız.";
    } else if (gameState.score === 0) {
      resultMessage.textContent = "Henüz başaramadınız, tekrar deneyin!";
    } else if (gameState.sequence.length <= 4) {
      resultMessage.textContent = "İyi bir başlangıç! Daha fazla pratik yaparak ilerleyebilirsiniz.";
    } else if (gameState.sequence.length <= 8) {
      resultMessage.textContent = "Güzel! Hafızanız giderek gelişiyor.";
    } else if (gameState.sequence.length <= 12) {
      resultMessage.textContent = "Harika! Müthiş bir hafızanız var.";
    } else {
      resultMessage.textContent = "İnanılmaz! Rekor kırdınız, hafızanız çok gelişmiş.";
    }
    
    // Sonuç ekranını göster
    gameScreen.style.display = 'none';
    resultsScreen.style.display = 'block';
    
    // Paylaşım butonlarını ayarla
    setupShareButtons();
  }

  // Paylaşım butonlarını ayarla
  function setupShareButtons() {
    const shareText = `ZekaPark'ta Sesli Hafıza Oyununda ${gameState.score} puan topladım! ${gameState.sequence.length - 1} ses dizisini hatırladım. Sen de dene!`;
    const shareUrl = window.location.href;
    
    shareWhatsapp.addEventListener('click', () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`);
    });
    
    shareTwitter.addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
    });
    
    shareFacebook.addEventListener('click', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
    });
  }

  // Ses Yeniden Dinle (Joker)
  function replaySequence() {
    if (gameState.availableJokers <= 0 || !gameState.waitingForPlayerInput) return;
    
    gameState.availableJokers--;
    jokerCounter.textContent = gameState.availableJokers;
    replayBtn.disabled = gameState.availableJokers <= 0;
    
    gameState.waitingForPlayerInput = false;
    playSound('hint');
    
    // Mevcut oyuncu girişini temizle
    gameState.playerSequence = [];
    
    // 0.5 saniye bekle ve diziyi tekrar oynat
    setTimeout(() => {
      playSequence();
    }, 500);
  }

  // Ses Aç/Kapat
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
      soundToggleBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i><span class="btn-hint">Ses</span>';
      showNotification("Ses açıldı", "info");
    } else {
      soundToggleBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i><span class="btn-hint">Ses</span>';
      showNotification("Ses kapatıldı", "info");
    }
  }

  // Zorluk Seviyesi Butonları
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.difficulty = btn.dataset.difficulty;
    });
  });

  // Tema Butonları
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.theme = btn.dataset.theme;
    });
  });

  // Olay Dinleyicileri
  startGameBtn.addEventListener('click', startGame);
  replayBtn.addEventListener('click', replaySequence);
  soundToggleBtn.addEventListener('click', toggleSound);
  endGameBtn.addEventListener('click', () => endGame(false));
  playAgainBtn.addEventListener('click', startGame);
  returnHomeBtn.addEventListener('click', () => {
    window.location.href = '/games';
  });

  // Sayfa yüklendiğinde sesleri yükle
  loadSounds();
});
