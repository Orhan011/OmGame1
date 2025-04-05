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


// Oyun değişkenleri
let gamePattern = [];
let playerPattern = [];
let level = 1;
let score = 0;
let gameStarted = false;
let playerTurn = false;
let currentDifficulty = 'easy';
let visiblePads = 4;


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

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.05);
  gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
  gainNode.gain.setValueAtTime(0.5, now + duration - 0.1);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

// Pad efekt animasyonu
function animatePad(pad) {
  pad.classList.add('active');
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
  generatePattern();
  playGamePattern();
}

// Dizi oluştur
function generatePattern() {
  const visiblePadElements = Array.from(soundPads).filter(pad => 
    pad.style.display !== 'none'
  );

  if (visiblePadElements.length === 0) return;

  const selectedPad = visiblePadElements[Math.floor(Math.random() * visiblePadElements.length)];
  gamePattern.push(selectedPad.dataset.note);
}

// Oyun dizisini çal
function playGamePattern() {
  let i = 0;
  progressBar.style.setProperty('--progress', '0%');

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
    const pad = Array.from(soundPads).find(pad => pad.dataset.note === note);

    if (pad) {
      playSound(note);
      animatePad(pad);
    }

    const progress = ((i + 1) / gamePattern.length) * 100;
    progressBar.style.setProperty('--progress', `${progress}%`);

    i++;
  }, 1000);
}

// Oyuncu girişini kontrol et
function checkAnswer() {
  if (!playerTurn) return;

  const currentNote = playerPattern[playerPattern.length - 1];
  const expectedNote = gamePattern[playerPattern.length - 1];

  if (currentNote === expectedNote) {
    if (playerPattern.length === gamePattern.length) {
      score += level * 10;
      scoreCount.textContent = score;
      playerTurn = false;
      setTimeout(() => {
        level++;
        levelCount.textContent = level;
        startLevel();
      }, 1000);
    }
  } else {
    gameOver();
  }
}

// Oyun sonu
function gameOver() {
  playerTurn = false;
  gameStarted = false;
  updateStatusMessage('Oyun bitti! Tekrar denemek için "Başla" butonuna basın.');
  startBtn.textContent = 'Tekrar Başla';

  // Patlama efekti
  soundPads.forEach(pad => {
    setTimeout(() => {
      animatePad(pad);
    }, Math.random() * 500);
  });
}

// Durum mesajını güncelle
function updateStatusMessage(message) {
  statusMessage.textContent = message;
}

// İlerleme çubuğunu güncelle
function updateProgressBar(percent) {
  progressBar.style.setProperty('--progress', `${percent}%`);
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
    startBtn.textContent = 'Devam Et';

    startLevel();
  }
});

resetBtn.addEventListener('click', () => {
  if (gameStarted) {
    gameStarted = false;
    updateStatusMessage('Oyun sıfırlandı. Başlamak için "Başla" butonuna basın.');
    startBtn.textContent = 'Başla';
  }
});

soundPads.forEach(pad => {
  pad.addEventListener('click', () => {
    if (!playerTurn) return;

    const note = pad.dataset.note;
    playSound(note);
    animatePad(pad);
    createParticles(pad); //particle effect added here
    playerPattern.push(note);
    checkAnswer();
  });
});


// Zorluk seviyesini ayarla
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  document.querySelector('.game-container').className = 'game-container difficulty-' + difficulty;

  switch(difficulty) {
    case 'easy':
      visiblePads = 4;
      soundPads.forEach((pad, index) => {
        pad.style.display = index < 4 ? 'block' : 'none';
      });
      break;
    case 'medium':
      visiblePads = 9;
      soundPads.forEach((pad, index) => {
        pad.style.display = index < 9 ? 'block' : 'none';
      });
      break;
    case 'hard':
      visiblePads = 16;
      soundPads.forEach(pad => {
        pad.style.display = 'block';
      });
      break;
  }
}

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
setDifficulty('easy');