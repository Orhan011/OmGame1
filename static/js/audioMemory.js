/**
 * Sesli Hafıza: Melodi Oyunu
 * 
 * İşitsel hafızayı geliştirmek için tasarlanmış interaktif bir oyun.
 * Kullanıcılar, rastgele oluşturulan ses dizilerini doğru sırada tekrarlamaya çalışır.
 * Zorluk seviyesi arttıkça diziler daha uzun ve hızlı hale gelir.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Oyun elementlerini seç
  const pads = document.querySelectorAll('.simon-pad');
  const startButton = document.getElementById('start-btn');
  const hintButton = document.getElementById('hint-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const statusMessage = document.getElementById('status-message');
  const scoreDisplay = document.getElementById('score-display');
  const levelDisplay = document.getElementById('level-display');
  const timeDisplay = document.getElementById('time-display');
  const progressBar = document.getElementById('progress-bar');
  
  // Zorluk seviyesi butonları
  const easyButton = document.getElementById('easy-btn');
  const mediumButton = document.getElementById('medium-btn');
  const hardButton = document.getElementById('hard-btn');
  
  // Tema butonları
  const natureTheme = document.getElementById('nature-theme');
  const instrumentTheme = document.getElementById('instrument-theme');
  const urbanTheme = document.getElementById('urban-theme');
  
  // Oyun sonu modal
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScore = document.getElementById('final-score');
  const maxLevel = document.getElementById('max-level');
  const starRating = document.getElementById('star-rating');
  const playAgainBtn = document.getElementById('play-again-btn');
  const saveScoreBtn = document.getElementById('save-score-btn');

  // Oyun değişkenleri
  let gamePattern = [];
  let userPattern = [];
  let level = 0;
  let score = 0;
  let isPlaying = false;
  let isShowingPattern = false;
  let canClick = false;
  let soundOn = true;
  let hintsLeft = 1;
  let currentTheme = 'nature';
  let difficulty = 'easy';
  let gameTimer = null;
  let roundTimer = null;
  let timeLimit = 0;
  let gameStartTime = 0;
  
  // Ses dosyaları
  const sounds = {
    nature: [
      new Audio('/static/sounds/bird.mp3'),
      new Audio('/static/sounds/water.mp3'),
      new Audio('/static/sounds/wind.mp3'),
      new Audio('/static/sounds/leaves.mp3')
    ],
    instrument: [
      new Audio('/static/sounds/piano.mp3'),
      new Audio('/static/sounds/guitar.mp3'),
      new Audio('/static/sounds/drum.mp3'),
      new Audio('/static/sounds/violin.mp3')
    ],
    urban: [
      new Audio('/static/sounds/car.mp3'),
      new Audio('/static/sounds/phone.mp3'),
      new Audio('/static/sounds/bell.mp3'),
      new Audio('/static/sounds/typewriter.mp3')
    ],
    success: new Audio('/static/sounds/success.mp3'),
    error: new Audio('/static/sounds/error.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3')
  };
  
  // Sahte ses nesneleri oluştur
  function createDummySounds() {
    // AudioContext oluştur
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Sayfa ilk yüklendiğinde gerçek sesleri yüklememek için boş sahte sesler
    // AudioContext kullanarak basit sesler oluşturulabilir
    
    const themes = ['nature', 'instrument', 'urban'];
    
    themes.forEach(theme => {
      sounds[theme] = [];
      
      // Her tema için 4 farklı ton oluştur
      const baseFreq = theme === 'nature' ? 220 : theme === 'instrument' ? 330 : 440;
      
      for (let i = 0; i < 4; i++) {
        // Her pad için farklı bir ton oluştur
        const freq = baseFreq * (1 + i * 0.25);
        
        sounds[theme].push({
          play: function() {
            if (!soundOn) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = theme === 'nature' ? 'sine' : 
                             theme === 'instrument' ? 'triangle' : 'square';
            oscillator.frequency.value = freq;
            
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            
            // 0.5 saniye sonra sesi durdur
            setTimeout(() => {
              oscillator.stop();
            }, 500);
          }
        });
      }
    });
    
    // Efekt sesleri için de sahte fonksiyonlar
    const effectSounds = ['success', 'error', 'levelUp', 'gameOver'];
    effectSounds.forEach(effect => {
      sounds[effect] = {
        play: function() {
          if (!soundOn) return;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Her efekt için farklı bir ton
          if (effect === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
          } else if (effect === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 200;
          } else if (effect === 'levelUp') {
            oscillator.type = 'triangle';
            oscillator.frequency.value = 600;
          } else {
            oscillator.type = 'square';
            oscillator.frequency.value = 150;
          }
          
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          
          setTimeout(() => {
            oscillator.stop();
          }, effect === 'gameOver' ? 1000 : 500);
        }
      };
    });
  }
  
  // Sayfa ilk yüklendiğinde sahte sesleri oluştur
  createDummySounds();
  
  // Event Listener'ları ayarla
  function setupEventListeners() {
    // Pad tıklama olaylarını dinle
    pads.forEach(pad => {
      pad.addEventListener('click', function() {
        if (canClick && !isShowingPattern) {
          const padIndex = parseInt(this.id.split('-')[1]);
          padPress(padIndex);
          checkAnswer(padIndex);
        }
      });
    });
    
    // Başlat butonu
    startButton.addEventListener('click', function() {
      if (!isPlaying) {
        startGame();
      } else {
        togglePause();
      }
    });
    
    // İpucu butonu
    hintButton.addEventListener('click', function() {
      if (isPlaying && !isShowingPattern && hintsLeft > 0) {
        useHint();
      }
    });
    
    // Ses açma/kapama
    soundToggle.addEventListener('click', function() {
      soundOn = !soundOn;
      this.classList.toggle('active');
    });
    
    // Zorluk seviyesi butonları
    easyButton.addEventListener('click', function() {
      if (!isPlaying) {
        setDifficulty('easy');
        easyButton.classList.add('active');
        mediumButton.classList.remove('active');
        hardButton.classList.remove('active');
      }
    });
    
    mediumButton.addEventListener('click', function() {
      if (!isPlaying) {
        setDifficulty('medium');
        easyButton.classList.remove('active');
        mediumButton.classList.add('active');
        hardButton.classList.remove('active');
      }
    });
    
    hardButton.addEventListener('click', function() {
      if (!isPlaying) {
        setDifficulty('hard');
        easyButton.classList.remove('active');
        mediumButton.classList.remove('active');
        hardButton.classList.add('active');
      }
    });
    
    // Tema butonları
    natureTheme.addEventListener('click', function() {
      if (!isPlaying) {
        setTheme('nature');
        natureTheme.classList.add('active');
        instrumentTheme.classList.remove('active');
        urbanTheme.classList.remove('active');
      }
    });
    
    instrumentTheme.addEventListener('click', function() {
      if (!isPlaying) {
        setTheme('instrument');
        natureTheme.classList.remove('active');
        instrumentTheme.classList.add('active');
        urbanTheme.classList.remove('active');
      }
    });
    
    urbanTheme.addEventListener('click', function() {
      if (!isPlaying) {
        setTheme('urban');
        natureTheme.classList.remove('active');
        instrumentTheme.classList.remove('active');
        urbanTheme.classList.add('active');
      }
    });
    
    // Oyun sonu butonları
    playAgainBtn.addEventListener('click', function() {
      closeModal();
      resetGame();
      setTimeout(() => {
        startGame();
      }, 500);
    });
    
    saveScoreBtn.addEventListener('click', function() {
      saveScore();
    });
    
    // Klavye kontrolleri
    document.addEventListener('keydown', function(e) {
      if (canClick && !isShowingPattern) {
        if (e.key === '1' || e.key === 'q') {
          padPress(0);
          checkAnswer(0);
        } else if (e.key === '2' || e.key === 'w') {
          padPress(1);
          checkAnswer(1);
        } else if (e.key === '3' || e.key === 'a') {
          padPress(2);
          checkAnswer(2);
        } else if (e.key === '4' || e.key === 's') {
          padPress(3);
          checkAnswer(3);
        }
      }
      
      // Boşluk tuşu ile oyunu başlat/duraklat
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (!isPlaying) {
          startGame();
        } else {
          togglePause();
        }
      }
      
      // H tuşu ile ipucu kullan
      if (e.key === 'h' || e.key === 'H') {
        if (isPlaying && !isShowingPattern && hintsLeft > 0) {
          useHint();
        }
      }
    });
  }
  
  // Pad'e basma animasyonunu ve sesini çal
  function padPress(padIndex) {
    const pad = document.getElementById(`pad-${padIndex}`);
    
    // Görsel efekt
    pad.classList.add('active');
    setTimeout(() => {
      pad.classList.remove('active');
    }, 300);
    
    // Ses çal
    playSoundForPad(padIndex);
  }
  
  // Pad için ses çal
  function playSoundForPad(padIndex) {
    if (soundOn) {
      sounds[currentTheme][padIndex].play();
    }
  }
  
  // Oyunun zorluk seviyesini ayarla
  function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    
    // Zorluk seviyesine göre zaman sınırını ayarla
    if (difficulty === 'easy') {
      timeLimit = 8000; // 8 saniye
    } else if (difficulty === 'medium') {
      timeLimit = 5000; // 5 saniye
    } else {
      timeLimit = 3000; // 3 saniye
    }
  }
  
  // Temayı ayarla
  function setTheme(newTheme) {
    currentTheme = newTheme;
  }
  
  // Oyunu başlat
  function startGame() {
    isPlaying = true;
    level = 0;
    score = 0;
    gamePattern = [];
    hintsLeft = 1;
    hintButton.disabled = false;
    
    updateScoreDisplay();
    updateHintDisplay();
    
    startButton.innerHTML = '<i class="fas fa-pause"></i> Duraklat';
    statusMessage.textContent = 'Hazırlan! Dizi başlıyor...';
    
    // Oyun başlangıç zamanını kaydet
    gameStartTime = Date.now();
    
    // İlk seviyeye başla
    setTimeout(() => {
      nextLevel();
    }, 1500);
  }
  
  // Bir sonraki seviyeye geç
  function nextLevel() {
    level++;
    userPattern = [];
    isShowingPattern = true;
    canClick = false;
    
    // Yeni bir rastgele renk ekle
    const randomNumber = Math.floor(Math.random() * 4);
    gamePattern.push(randomNumber);
    
    // Seviye ve skor görüntüsünü güncelle
    levelDisplay.textContent = level;
    
    // Durum mesajını güncelle
    statusMessage.textContent = 'Diziyi izle ve dinle...';
    
    // Kısa bir bekleme sonrası diziyi göster
    setTimeout(() => {
      showPattern();
    }, 1000);
  }
  
  // Diziyi göster
  function showPattern() {
    let i = 0;
    
    // Zorluk seviyesine göre bekleme süresini belirle
    let patternSpeed = 1000; // Kolay seviye için
    if (difficulty === 'medium') {
      patternSpeed = 800;
    } else if (difficulty === 'hard') {
      patternSpeed = 600;
    }
    
    const interval = setInterval(() => {
      if (i < gamePattern.length) {
        padPress(gamePattern[i]);
        i++;
      } else {
        clearInterval(interval);
        
        // Gösterim bitti, kullanıcının yanıt vermesini bekle
        isShowingPattern = false;
        canClick = true;
        
        // Durum mesajını güncelle
        statusMessage.textContent = 'Şimdi sıra sende! Diziyi tekrarla.';
        
        // Süre sınırı başlat
        startRoundTimer();
      }
    }, patternSpeed);
  }
  
  // Tur için süre sınırı başlat
  function startRoundTimer() {
    // Önceki zamanlayıcıyı temizle
    if (roundTimer) {
      clearTimeout(roundTimer);
    }
    
    // İlerleme çubuğunu sıfırla
    progressBar.style.width = '100%';
    
    // Kalan süreyi gösteren animasyonu başlat
    let startTime = Date.now();
    let elapsedTime = 0;
    
    // Süre limitini güncelle (seviye arttıkça daha fazla süre)
    let adjustedTimeLimit = timeLimit + (level * 300);
    
    // İlerleme çubuğunu güncelleme aralığı
    const updateInterval = 50; // 50ms
    
    const updateProgressBar = () => {
      elapsedTime = Date.now() - startTime;
      const remainingTimePercentage = 100 - (elapsedTime / adjustedTimeLimit * 100);
      progressBar.style.width = `${Math.max(0, remainingTimePercentage)}%`;
      
      // Kalan süreyi göster
      const remainingTime = Math.max(0, Math.ceil((adjustedTimeLimit - elapsedTime) / 1000));
      timeDisplay.textContent = `${remainingTime} saniye`;
      
      // Renk değişimi: %30'un altında kırmızıya dön
      if (remainingTimePercentage < 30) {
        progressBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6666)';
      } else {
        progressBar.style.background = 'linear-gradient(90deg, #00e6e6, #6a5ae0)';
      }
      
      if (elapsedTime < adjustedTimeLimit) {
        requestAnimationFrame(updateProgressBar);
      }
    };
    
    updateProgressBar();
    
    // Süre dolunca oyunu bitir
    roundTimer = setTimeout(() => {
      if (canClick) {
        timeDisplay.textContent = '0 saniye';
        progressBar.style.width = '0%';
        gameOver(false, 'Süre doldu!');
      }
    }, adjustedTimeLimit);
  }
  
  // Kullanıcının yanıtını kontrol et
  function checkAnswer(userChosenColour) {
    userPattern.push(userChosenColour);
    
    // Mevcut indeksi hesapla
    const currentIndex = userPattern.length - 1;
    
    // Kullanıcının seçimi doğru mu?
    if (userPattern[currentIndex] === gamePattern[currentIndex]) {
      // Şu ana kadarki cevap doğru
      
      // Kullanıcının diziyi tamamladı mı kontrol et
      if (userPattern.length === gamePattern.length) {
        // Tur tamamlandı, süre sayacını durdur
        clearTimeout(roundTimer);
        
        // Seviye başına puan hesapla
        const basePoints = 10;
        const levelMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
        const pointsEarned = basePoints * level * levelMultiplier;
        
        // Puan ekle
        score += pointsEarned;
        updateScoreDisplay();
        
        // Seviye geçiş efekti
        statusMessage.textContent = `Doğru! +${pointsEarned} puan kazandın.`;
        if (soundOn) sounds.success.play();
        
        // Bir sonraki seviyeye geç
        setTimeout(() => {
          nextLevel();
        }, 1500);
      }
    } else {
      // Yanlış cevap
      gameOver(false, 'Yanlış sıralama!');
    }
  }
  
  // İpucu kullan
  function useHint() {
    if (hintsLeft <= 0) return;
    
    hintsLeft--;
    updateHintDisplay();
    
    // İpucu olarak diziyi tekrar göster
    isShowingPattern = true;
    canClick = false;
    
    // Süre sayacını durdur
    clearTimeout(roundTimer);
    
    statusMessage.textContent = 'İpucu: Diziyi tekrar izle...';
    
    // Kısa bir bekleme sonrası diziyi göster
    setTimeout(() => {
      showPattern();
    }, 500);
  }
  
  // İpucu sayısını güncelle
  function updateHintDisplay() {
    document.getElementById('hint-count').textContent = `(${hintsLeft})`;
    
    if (hintsLeft <= 0) {
      hintButton.disabled = true;
    } else {
      hintButton.disabled = false;
    }
  }
  
  // Skor gösterimini güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (isPlaying) {
      // Duraklat
      isPlaying = false;
      canClick = false;
      clearTimeout(roundTimer);
      
      startButton.innerHTML = '<i class="fas fa-play"></i> Devam Et';
      statusMessage.textContent = 'Oyun duraklatıldı. Devam etmek için tıkla.';
    } else {
      // Devam et
      isPlaying = true;
      
      startButton.innerHTML = '<i class="fas fa-pause"></i> Duraklat';
      statusMessage.textContent = 'Oyun devam ediyor...';
      
      // Duraklatıldığı yerden devam et
      if (isShowingPattern) {
        setTimeout(() => {
          showPattern();
        }, 1000);
      } else {
        canClick = true;
        startRoundTimer();
      }
    }
  }
  
  // Oyun bittiğinde
  function gameOver(isWin, message = 'Oyun Bitti!') {
    // Süre sayacını durdur
    clearTimeout(roundTimer);
    
    // Oyun sonu durumunu ayarla
    isPlaying = false;
    canClick = false;
    
    // Ses çal
    if (soundOn) sounds.gameOver.play();
    
    // Durum mesajını güncelle
    statusMessage.textContent = message;
    
    // Başlat butonunu sıfırla
    startButton.innerHTML = '<i class="fas fa-play"></i> Başla';
    
    // Oyun bitiminde modal göster
    finalScore.textContent = score;
    maxLevel.textContent = level;
    
    // Yıldız derecelendirmesi hesapla
    let stars = 0;
    if (level >= 15) {
      stars = 5;
    } else if (level >= 12) {
      stars = 4;
    } else if (level >= 9) {
      stars = 3;
    } else if (level >= 6) {
      stars = 2;
    } else if (level >= 3) {
      stars = 1;
    }
    
    // Yıldızları güncelle
    Array.from(starRating.children).forEach((star, index) => {
      if (index < stars) {
        star.className = 'fas fa-star';
      } else {
        star.className = 'far fa-star';
      }
    });
    
    // Oyun sonu modalını göster
    showModal();
  }
  
  // Oyun sonu modalını göster
  function showModal() {
    gameOverModal.classList.add('visible');
  }
  
  // Oyun sonu modalını kapat
  function closeModal() {
    gameOverModal.classList.remove('visible');
  }
  
  // Skoru sunucuya kaydet
  function saveScore() {
    // Skor kaydetme durumunu göster
    saveScoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';
    saveScoreBtn.disabled = true;
    
    // API isteği gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'audioMemory',
        score: score
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        saveScoreBtn.innerHTML = '<i class="fas fa-check"></i> Kaydedildi!';
        
        // Başarı mesajı göster
        statusMessage.textContent = 'Skorun başarıyla kaydedildi!';
      } else {
        saveScoreBtn.innerHTML = '<i class="fas fa-times"></i> Hata!';
        
        // Hata mesajı göster
        statusMessage.textContent = 'Skor kaydedilirken bir hata oluştu!';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      saveScoreBtn.innerHTML = '<i class="fas fa-times"></i> Hata!';
      
      // Hata mesajı göster
      statusMessage.textContent = 'Skor kaydedilirken bir hata oluştu!';
    });
  }
  
  // Oyunu sıfırla
  function resetGame() {
    gamePattern = [];
    userPattern = [];
    level = 0;
    score = 0;
    hintsLeft = 1;
    
    updateScoreDisplay();
    updateHintDisplay();
    
    levelDisplay.textContent = '1';
    scoreDisplay.textContent = '0';
    timeDisplay.textContent = '';
    progressBar.style.width = '0%';
    progressBar.style.background = 'linear-gradient(90deg, #00e6e6, #6a5ae0)';
    
    startButton.innerHTML = '<i class="fas fa-play"></i> Başla';
    statusMessage.textContent = 'Sesli Hafıza oyununa hoş geldin!';
    
    // İpucu butonunu etkinleştir
    hintButton.disabled = false;
    
    // Modalı kapat
    closeModal();
  }
  
  // İnitialize
  function init() {
    // Varsayılan zorluk seviyesini ayarla
    setDifficulty('easy');
    
    // Varsayılan temayı ayarla
    setTheme('nature');
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Oyun hazır mesajı
    statusMessage.textContent = 'Sesli Hafıza oyununa hoş geldin! Başlamak için "Başla" butonuna tıkla.';
  }
  
  // Oyunu başlat
  init();
});