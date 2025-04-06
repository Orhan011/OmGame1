// MelodiX - Sesli Hafıza Oyunu JavaScript

// Ses öğelerini yükle
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const notes = {
  do: 261.63, // C4
  re: 293.66, // D4
  mi: 329.63, // E4
  fa: 349.23, // F4
  sol: 392.00, // G4
  la: 440.00, // A4
  si: 493.88, // B4
  do2: 523.25, // C5
  re2: 587.33, // D5
  mi2: 659.25, // E5
  fa2: 698.46, // F5
  sol2: 783.99, // G5
  la2: 880.00, // A5
  si2: 987.77, // B5
  do3: 1046.50, // C6
  re3: 1174.66  // D6
};

// DOM öğeleri
const soundPads = document.querySelectorAll('.sound-pad');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const levelCount = document.getElementById('level-count');
const scoreCount = document.getElementById('score-count');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const levelUpModal = document.getElementById('level-up-modal');
const newLevelSpan = document.getElementById('new-level');
const continueBtn = document.getElementById('continue-btn');
// Mode buttons removed

// Oyun değişkenleri
let gamePattern = [];
let playerPattern = [];
let level = 1;
let score = 0;
let gameStarted = false;
let playerTurn = false;
let currentMode = 'classic';
let currentDifficulty = 'easy';
let visiblePads = 4; // Başlangıçta görünür pad sayısı
let complexityFactor = 1; // Melodilerin karmaşıklık faktörü

// Renkleri ayarla
soundPads.forEach(pad => {
  pad.style.backgroundColor = pad.dataset.color;
});

// Ses çalma fonksiyonu
function playSound(note, duration = 0.5) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = notes[note];
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // ADSR envelope (Attack, Decay, Sustain, Release)
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.05); // Attack
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);  // Decay
  gainNode.gain.setValueAtTime(0.5, now + duration - 0.1); // Sustain
  gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

  oscillator.start(now);
  oscillator.stop(now + duration);

  return { oscillator, gainNode };
}

// Pad efekt animasyonu
function animatePad(pad) {
  pad.classList.add('active');

  // Parçacık efekti
  createParticles(pad);

  setTimeout(() => {
    pad.classList.remove('active');
  }, 300);
}

// Parçacık efekti oluştur
function createParticles(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Rastgele özellikler
    const size = Math.random() * 10 + 5;
    const color = element.dataset.color;
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 3 + 2;
    const lifetime = Math.random() * 1000 + 500;

    // Stili ayarla
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color;
    particle.style.boxShadow = `0 0 ${size/2}px ${color}`;

    // Pozisyonu ayarla
    document.body.appendChild(particle);
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    // Animasyon
    setTimeout(() => {
      particle.style.transition = `all ${lifetime/1000}s ease-out`;
      particle.style.left = `${centerX + Math.cos(angle) * velocity * 50}px`;
      particle.style.top = `${centerY + Math.sin(angle) * velocity * 50}px`;
      particle.style.opacity = '0';

      // Kaldır
      setTimeout(() => {
        document.body.removeChild(particle);
      }, lifetime);
    }, 10);
  }
}

// Seviye başlat
function startLevel() {
  playerPattern = [];
  playerTurn = false;

  updateStatusMessage('Dinle ve hatırla...');

  // Zorluk seviyesine göre kompleks melodiler oluştur
  generateComplexPattern();

  // Sıra ile sesleri çal
  playGamePattern();
}

// Karmaşık melodi üret
function generateComplexPattern() {
  // Zorluk seviyesine göre başlangıç nota sayısını belirle
  let initialNotes = 0;

  if (gamePattern.length === 0) {
    // Oyun ilk başladığında zorluk seviyesine göre başlangıç nota sayısı
    if (currentDifficulty === 'easy') {
      initialNotes = 2; // Kolay mod için 2 nota ile başla
    } else if (currentDifficulty === 'medium') {
      initialNotes = 3; // Orta mod için 3 nota ile başla
    } else if (currentDifficulty === 'hard') {
      initialNotes = 4; // Zor mod için 4 nota ile başla
    }
  }

  // Seviyeye ve zorluğa göre eklenecek nota sayısı
  // Kolay mod: Her seviyede 1 nota ekle
  // Orta mod: Her seviyede 1 nota ekle, başlangıç 3
  // Zor mod: Her seviyede 1 nota ekle, başlangıç 4
  const notesToAdd = initialNotes + (gamePattern.length === 0 ? 0 : 1);

  // Görünür pad'leri filtrele
  const visiblePadsList = [...soundPads].filter(pad => pad.style.display !== 'none');
  
  if (visiblePadsList.length === 0) {
    console.error("Görünür pad bulunamadı!");
    return;
  }

  for (let i = 0; i < notesToAdd; i++) {
    // Tamamen karmaşık seçim için her seferinde rastgele pad seç
    let randomPadIndex = Math.floor(Math.random() * visiblePadsList.length);

    // Karmaşıklığı artırmak için bazen aynı notayı tekrarlama
    if (gamePattern.length > 0 && Math.random() > 0.7) {
      // %30 ihtimalle önceki notalardan birini seç
      const randomPrevIndex = Math.floor(Math.random() * gamePattern.length);
      const prevNote = gamePattern[randomPrevIndex];
      const prevPadIndex = visiblePadsList.findIndex(pad => pad.dataset.note === prevNote);

      if (prevPadIndex !== -1) {
        randomPadIndex = prevPadIndex;
      }
    }

    const randomNote = visiblePadsList[randomPadIndex].dataset.note;

    // Modlara göre özel melodi oluşturma
    if (currentMode === 'classic' || currentMode === 'timed') {
      gamePattern.push(randomNote);
    } else if (currentMode === 'reverse') {
      // Ters çevirme modunda dizinin başına ekle
      gamePattern.unshift(randomNote);
    } else if (currentMode === 'memory' && gamePattern.length > 0) {
      // Hafıza modunda tekrarlayan kalıplar ekle
      const patternLength = gamePattern.length;
      const patternChunk = Math.floor(Math.random() * patternLength);
      gamePattern.push(gamePattern[patternChunk]);
    } else if (currentMode === 'speed') {
      // Hız modunda daha kısa aralıklarla nota ekle
      gamePattern.push(randomNote);
      if (Math.random() > 0.6) { // %40 ihtimalle arka arkaya aynı nota
        gamePattern.push(randomNote);
      }
    } else {
      gamePattern.push(randomNote);
    }
  }
}

// Oyun dizisini çal
function playGamePattern() {
  let i = 0;

  // İlerleme çubuğunu ayarla
  progressBar.style.width = '0%';

  // Mod ve zorluk seviyesine göre hız ayarla
  let speed = 1000; // Varsayılan hız

  if (currentMode === 'speed') {
    speed = 700 - (level * 20); // Seviye arttıkça hızlanır
    speed = Math.max(speed, 300); // Minimum 300ms
  } else {
    speed = 1000 - (level * 15);
    speed = Math.max(speed, 500); // Minimum 500ms
  }

  const interval = setInterval(() => {
    if (i >= gamePattern.length) {
      clearInterval(interval);
      setTimeout(() => {
        playerTurn = true;
        updateStatusMessage('Şimdi senin sıran!');
      }, 500);
      return;
    }

    const note = gamePattern[i];
    const pad = [...soundPads].find(pad => pad.dataset.note === note);

    if (pad) {
      // Mod bazlı ses efektleri
      if (currentMode === 'memory') {
        // Hafıza modunda daha kısa ses
        playSound(note, 0.4);
      } else if (currentMode === 'reverse') {
        // Ters modda farklı ses tonu
        playSound(note, 0.6);
      } else {
        playSound(note);
      }

      animatePad(pad);
    }

    // İlerleme çubuğunu güncelle
    const progress = ((i + 1) / gamePattern.length) * 100;
    progressBar.style.width = `${progress}%`;

    i++;
  }, speed);
}

// Oyuncu girişini kontrol et
function checkAnswer(index) {
  if (!playerTurn) return;

  const currentNote = playerPattern[index];
  const expectedNote = gamePattern[index];

  if (currentNote === expectedNote) {
    // Doğru cevap
    if (playerPattern.length === gamePattern.length) {
      // Seviye tamamlandı
      score += level * 10;
      scoreCount.textContent = score;

      playerTurn = false;
      setTimeout(() => {
        levelUp();
      }, 1000);
    }
  } else {
    // Yanlış cevap
    gameOver();
  }
}

// Seviye atla
function levelUp() {
  level++;
  levelCount.textContent = level;

  // Modal olmadan direkt olarak bir sonraki seviyeye geç
  setTimeout(() => {
    // Her seviye geçişinde gamePattern sıfırlanmamalı, kümülatif olmalı
    // Yeni seviyede sadece notalar eklenecek
    startLevel();
  }, 1000);
}

// Oyun sonu
function gameOver() {
  playerTurn = false;
  gameStarted = false;
  updateStatusMessage('Oyun bitti! Tekrar denemek için "Başla" butonuna basın.');

  // Patlama efekti
  soundPads.forEach(pad => {
    setTimeout(() => {
      animatePad(pad);
    }, Math.random() * 500);
  });

  // Skoru kaydet
  saveScore();

  // Skoru kaydet
  saveScore();
  startBtn.textContent = 'Tekrar Başla';
}

// Skoru sunucuya gönderme
function saveScore() {
  // Skor 0 ise kaydetmeye gerek yok
  if (score <= 0) {
    console.log('Kaydedilecek skor yok');
    return;
  }
  
  console.log(`Skor gönderiliyor: ${score}`);
  
  // Backend'e skoru gönder
  fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_type: 'audio_memory',
      score: score
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP hata! Durum: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Skor başarıyla kaydedildi:', data);
    
    if (data.success && data.achievement) {
      // Başarı bildirimi göster
      const notification = document.createElement('div');
      notification.className = 'achievement-notification';
      notification.textContent = `🏆 Başarı: ${data.achievement.title}`;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '15px';
      notification.style.background = 'linear-gradient(135deg, rgba(106, 90, 224, 0.9), rgba(90, 55, 200, 0.9))';
      notification.style.color = 'white';
      notification.style.borderRadius = '10px';
      notification.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      notification.style.zIndex = '1000';
      notification.style.transform = 'translateX(120%)';
      notification.style.transition = 'transform 0.3s ease-in-out';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        setTimeout(() => {
          notification.style.transform = 'translateX(120%)';
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      }, 100);
    }
  })
  .catch(error => {
    console.error('Skor gönderme hatası:', error);
  });
}

// Durum mesajını güncelle
function updateStatusMessage(message) {
  statusMessage.textContent = message;
}

// İlerleme çubuğunu güncelle
function updateProgressBar(percent) {
  progressBar.style.width = `${percent}%`;
}

// Oyun modunu ayarla
function setGameMode(mode) {
  currentMode = mode;
  // Mode buttons were removed, so we don't need to update UI

  // Mod özellikleri
  switch(mode) {
    case 'classic':
      // Standart mod
      complexityFactor = 1;
      break;
    case 'timed':
      // Zamanlı mod
      complexityFactor = 1;
      break;
    case 'duet':
      // Düet modu
      complexityFactor = 1.2;
      break;
    case 'reverse':
      // Ters mod - notalar ters sırayla çalar
      complexityFactor = 1.3;
      break;
    case 'memory':
      // Hafıza modu - tekrarlayan kalıplar
      complexityFactor = 1.4;
      break;
    case 'speed':
      // Hız modu - daha hızlı oynanır
      complexityFactor = 1.5;
      break;
  }
}

// Zorluk seviyesini ayarla
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  document.querySelector('.game-container').className = 'game-container difficulty-' + difficulty;

  // Zorluk seviyesine göre görünür pad sayısını ayarla
  switch(difficulty) {
    case 'easy':
      visiblePads = 4;
      // 4 pad göster (2x2), diğerlerini gizle
      soundPads.forEach((pad, index) => {
        pad.style.display = index < 4 ? 'block' : 'none';
      });
      break;
    case 'medium':
      visiblePads = 9;
      // 9 pad göster (3x3), diğerlerini gizle
      soundPads.forEach((pad, index) => {
        pad.style.display = index < 9 ? 'block' : 'none';
      });
      break;
    case 'hard':
      visiblePads = 16;
      // 16 pad göster (4x4)
      soundPads.forEach((pad, index) => {
        pad.style.display = index < 16 ? 'block' : 'none';
      });
      break;
  }
}

// Olay dinleyicileri
startBtn.addEventListener('click', () => {
  if (!gameStarted) {
    // Ses bağlamını başlat (tarayıcı politikası gereği kullanıcı etkileşimi gerekir)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    gameStarted = true;
    gamePattern = [];
    playerPattern = [];
    level = 1;
    score = 0;
    levelCount.textContent = level;
    scoreCount.textContent = score;
  // Skoru kaydet
  saveScore();
    startBtn.textContent = 'Devam Et';

    startLevel();
  }
});

resetBtn.addEventListener('click', () => {
  if (gameStarted) {
    gameStarted = false;
    updateStatusMessage('Oyun sıfırlandı. Başlamak için "Başla" butonuna basın.');
  // Skoru kaydet
  saveScore();
    startBtn.textContent = 'Başla';
  }
});

soundPads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (!playerTurn) return;

    const note = pad.dataset.note;
    playSound(note);
    animatePad(pad);

    playerPattern.push(note);
    checkAnswer(playerPattern.length - 1);
  });
});

// Modal ile seviye atlamayı kaldırdığımız için bu event listener'a artık ihtiyaç yok
// continueBtn.addEventListener('click', () => { ... });

// Mode buttons removed

// Zorluk seçicileri için olay dinleyicileri
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!gameStarted) {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setDifficulty(btn.dataset.difficulty);
    } else {
      updateStatusMessage('Oyun sırasında zorluk seviyesi değiştirilemez.');
    }
  });
});

// İlk durum ayarları
updateStatusMessage('Başlamak için "Başla" butonuna basın');
setDifficulty('easy'); // Varsayılan olarak kolay modu ayarla
setGameMode('classic'); // Varsayılan olarak klasik modu ayarla// Skoru sunucuya gönderme
function saveScore() {
  // Skor 0 ise kaydetmeye gerek yok
  if (score <= 0) {
    console.log('Kaydedilecek skor yok');
    return;
  }
  
  console.log(`Skor gönderiliyor: ${score}`);
  
  // Backend'e skoru gönder
  fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_type: 'audio_memory',
      score: score
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP hata! Durum: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Skor başarıyla kaydedildi:', data);
    
    if (data.success && data.achievement) {
      // Başarı bildirimi göster
      const notification = document.createElement('div');
      notification.className = 'achievement-notification';
      notification.textContent = `🏆 Başarı: ${data.achievement.title}`;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '15px';
      notification.style.background = 'linear-gradient(135deg, rgba(106, 90, 224, 0.9), rgba(90, 55, 200, 0.9))';
      notification.style.color = 'white';
      notification.style.borderRadius = '10px';
      notification.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      notification.style.zIndex = '1000';
      notification.style.transform = 'translateX(120%)';
      notification.style.transition = 'transform 0.3s ease-in-out';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        setTimeout(() => {
          notification.style.transform = 'translateX(120%)';
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      }, 100);
    }
  })
  .catch(error => {
    console.error('Skor gönderme hatası:', error);
  });
}
