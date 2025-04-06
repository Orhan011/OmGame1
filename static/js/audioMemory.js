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
  if (pad && pad.dataset && pad.dataset.color) {
    pad.style.backgroundColor = pad.dataset.color;
  }
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
  if (!pad) return;
  
  pad.classList.add('active');

  // Parçacık efekti
  createParticles(pad);

  setTimeout(() => {
    pad.classList.remove('active');
  }, 300);
}

// Parçacık efekti oluştur
function createParticles(element) {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Rastgele özellikler
    const size = Math.random() * 10 + 5;
    let color = "#00c6ff";  // Default color
    if (element.dataset && element.dataset.color) {
      color = element.dataset.color;
    }
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
      particle.style.transform = `scale(${Math.random() * 0.5 + 0.5})`;
    }, 10);

    // Parçacığı kaldır
    setTimeout(() => {
      particle.remove();
    }, lifetime);
  }
}

// Yeni seviye başlat
function startLevel() {
  playerPattern = [];
  playerTurn = false;
  
  // Zorluk seviyesine göre görünür pedleri ayarla
  updateVisiblePads();
  
  // Yeni melodiyi oluştur
  gamePattern = generateComplexPattern();
  
  // İlerleme çubuğunu sıfırla
  updateProgressBar(0);
  
  // Melodiyi oynat
  updateStatusMessage('Melodiyi dinleyin...');
  
  // Oyun moduna göre oynatma hızını ayarla
  let speed = 700; // Default
  if (currentMode === 'speed') {
    speed = 700 - (level * 20); // Seviye arttıkça hızlanır
  } else {
    speed = 1000 - (level * 15);
  }
  
  setTimeout(() => {
    playGamePattern();
  }, 1000);
}

// Görünür pedleri güncelle
function updateVisiblePads() {
  const maxPads = soundPads.length;
  
  // Zorluk seviyesine göre görünür pad sayısını ayarla
  switch (currentDifficulty) {
    case 'easy':
      visiblePads = 4;
      break;
    case 'medium':
      visiblePads = 9;
      break;
    case 'hard':
      visiblePads = maxPads;
      break;
    default:
      visiblePads = 4;
  }
  
  // Tüm pedleri önce gizle
  soundPads.forEach(pad => {
    if (pad) pad.style.display = 'none';
  });
  
  // Belirlenen sayıda pedi göster
  for (let i = 0; i < visiblePads; i++) {
    if (soundPads[i]) soundPads[i].style.display = 'flex';
  }
}

// Daha karmaşık melodi oluştur
function generateComplexPattern() {
  const sequence = [];
  const sequenceLength = Math.min(level + 2, 20); // Seviye + 2 (max 20)
  
  // Görünür pedlerden rastgele seç
  const visiblePadsList = Array.from(soundPads)
    .filter((pad, index) => index < visiblePads && pad);
  
  if (visiblePadsList.length === 0) return [];
  
  // Zorluk seviyesine göre karmaşıklığı belirle
  let usePatterns = false;
  let repeatChance = 0;
  
  switch (currentDifficulty) {
    case 'easy':
      usePatterns = false;
      repeatChance = 0.2;
      break;
    case 'medium':
      usePatterns = level > 3;
      repeatChance = 0.3;
      break;
    case 'hard':
      usePatterns = true;
      repeatChance = 0.4;
      break;
  }
  
  // Basit rastgele dizi
  if (!usePatterns) {
    for (let i = 0; i < sequenceLength; i++) {
      const randomPad = visiblePadsList[Math.floor(Math.random() * visiblePadsList.length)];
      if (randomPad && randomPad.dataset && randomPad.dataset.note) {
        sequence.push(randomPad.dataset.note);
      }
    }
    return sequence;
  }
  
  // Karmaşık dizi oluştur (motifler, tekrarlar vs.)
  const createSubsequence = (length) => {
    const subseq = [];
    for (let i = 0; i < length; i++) {
      const randomPad = visiblePadsList[Math.floor(Math.random() * visiblePadsList.length)];
      if (randomPad && randomPad.dataset && randomPad.dataset.note) {
        subseq.push(randomPad.dataset.note);
      }
    }
    return subseq;
  };
  
  let remainingLength = sequenceLength;
  while (remainingLength > 0) {
    // Belirli bir olasılıkla önceki diziden parça tekrarla
    if (sequence.length >= 2 && Math.random() < repeatChance) {
      const repeatLength = Math.min(Math.floor(Math.random() * 3) + 2, remainingLength);
      const startPos = Math.floor(Math.random() * (sequence.length - repeatLength + 1));
      const repeatSeq = sequence.slice(startPos, startPos + repeatLength);
      sequence.push(...repeatSeq);
      remainingLength -= repeatLength;
    } else {
      // Yeni bir alt dizi oluştur
      const subseqLength = Math.min(Math.floor(Math.random() * 3) + 1, remainingLength);
      const subseq = createSubsequence(subseqLength);
      sequence.push(...subseq);
      remainingLength -= subseqLength;
    }
  }
  
  return sequence;
}

// Oyun desenini çalma
function playGamePattern() {
  let i = 0;
  
  const playNext = () => {
    if (i >= gamePattern.length) {
      // Tüm desen oynatıldı, oyuncunun sırası
      playerTurn = true;
      updateStatusMessage('Sıra sizde! Melodiyi tekrarlayın.');
      return;
    }

    const note = gamePattern[i];
    i++;
    
    // Notaya karşılık gelen pedi bul ve çal
    const pad = Array.from(soundPads).find(p => p && p.dataset && p.dataset.note === note);
    if (pad) {
      playSound(note);
      animatePad(pad);
    }
    
    // İlerleme çubuğunu güncelle
    updateProgressBar((i / gamePattern.length) * 100);
    
    // Oyun moduna ve seviyeye göre hızı ayarla
    let speed = 700; // Default
    if (currentMode === 'speed') {
      speed = 700 - (level * 20);
    } else {
      speed = 1000 - (level * 15);
    }
    
    setTimeout(playNext, speed);
  };
  
  playNext();
}

// Cevabı kontrol et
function checkAnswer(index) {
  // Oyuncu sırası değilse veya oyun başlamadıysa işlem yapma
  if (!playerTurn || !gameStarted) return;
  
  // Doğru cevap kontrolü
  if (playerPattern[index] === gamePattern[index]) {
    // İlerleme çubuğunu güncelle
    updateProgressBar(((index + 1) / gamePattern.length) * 100);
    
    // Son nota mı?
    if (index === gamePattern.length - 1) {
      playerTurn = false;
      
      // Skoru artır
      score += level * 10;
      scoreCount.textContent = score;
      
      // Level atla ve başarı sesi
      setTimeout(() => {
        const successSound = new Audio('/static/sounds/success.mp3');
        successSound.play();
        levelUp();
      }, 500);
    }
  } else {
    // Yanlış cevap, oyun bitti
    playerTurn = false;
    
    // Hata sesi
    const failSound = new Audio('/static/sounds/wrong.mp3');
    failSound.play();
    
    // Doğru notanın padding'ini vurgula
    const correctNote = gamePattern[index];
    const correctPad = Array.from(soundPads).find(p => p && p.dataset && p.dataset.note === correctNote);
    if (correctPad) {
      correctPad.classList.add('correct');
      setTimeout(() => {
        correctPad.classList.remove('correct');
      }, 1000);
    }
    
    // Oyunu bitir
    setTimeout(() => {
      gameOver();
    }, 500);
  }
}

// Seviye atlamak
function levelUp() {
  level++;
  levelCount.textContent = level;
  
  // Level-up animasyonu
  levelCount.classList.add('level-up-animation');
  setTimeout(() => {
    levelCount.classList.remove('level-up-animation');
  }, 1000);
  
  // Level-up ses efekti
  const levelUpSound = new Audio('/static/sounds/level-up.mp3');
  levelUpSound.play();
  
  // Modal ve efekt
  newLevelSpan.textContent = level;
  levelUpModal.classList.add('active');
  
  setTimeout(() => {
    levelUpModal.classList.remove('active');
    
    // Sonraki seviyeyi başlat
    setTimeout(() => {
      startLevel();
    }, 1000);
  }, 2000);
}

// Oyun sonu
function gameOver() {
  playerTurn = false;
  gameStarted = false;
  updateStatusMessage('Oyun bitti! Tekrar denemek için "Başla" butonuna basın.');

  // Patlama efekti
  soundPads.forEach(pad => {
    if (pad) {
      setTimeout(() => {
        animatePad(pad);
      }, Math.random() * 500);
    }
  });

  // Oyun sonu sesi
  const gameOverSound = new Audio('/static/sounds/game-over.mp3');
  gameOverSound.play();

  // Skoru kaydet
  if (score > 0) {
    saveScore();
  }

  // Başla butonunu güncelle
  startBtn.textContent = 'Başla';

  // Eski oyun değişkenlerini sıfırla
  setTimeout(() => {
    level = 1;
    score = 0;
    levelCount.textContent = level;
    scoreCount.textContent = score;
  }, 2000);
}

// Skor kaydetme fonksiyonu
function saveScore() {
  console.log(`Audio Memory skoru kaydediliyor: ${score}`);
  
  fetch('/save-score', {
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
      throw new Error('Skor kaydetme başarısız oldu');
    }
    return response.json();
  })
  .then(data => {
    console.log('Skor başarıyla kaydedildi:', data);
  })
  .catch(error => {
    console.error('Skor kaydedilirken hata oluştu:', error);
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
  
  // UI güncelleme (mod düğmeleri kaldırıldı)
}

// Zorluk seviyesini ayarla
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  updateVisiblePads();
  
  // Görsel feedback
  if (gameStarted) {
    updateStatusMessage(`Zorluk seviyesi ${difficulty} olarak ayarlandı. Yeni seviye başladığında etkin olacak.`);
  }
}

// Başlat ve Reset butonları için olay dinleyicileri
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (!gameStarted) {
      gameStarted = true;
      gamePattern = [];
      playerPattern = [];
      
      updateStatusMessage('Oyun başlıyor...');
      startBtn.textContent = 'Devam Et';

      startLevel();
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (gameStarted) {
      gameStarted = false;
      updateStatusMessage('Oyun sıfırlandı. Başlamak için "Başla" butonuna basın.');
      startBtn.textContent = 'Başla';
    }
  });
}

soundPads.forEach(pad => {
  if (pad) {
    pad.addEventListener('click', () => {
      if (!playerTurn) return;

      if (pad.dataset && pad.dataset.note) {
        const note = pad.dataset.note;
        playSound(note);
        animatePad(pad);

        playerPattern.push(note);
        checkAnswer(playerPattern.length - 1);
      }
    });
  }
});

// Seviye atlamayı devam ettirme düğmesi
if (continueBtn) {
  continueBtn.addEventListener('click', () => {
    levelUpModal.classList.remove('active');
    setTimeout(() => {
      startLevel();
    }, 500);
  });
}

// Zorluk seçicileri için olay dinleyicileri
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      if (!gameStarted) {
        difficultyBtns.forEach(b => {
          if (b) b.classList.remove('active');
        });
        btn.classList.add('active');
        
        if (btn.dataset && btn.dataset.difficulty) {
          setDifficulty(btn.dataset.difficulty);
        }
      } else {
        updateStatusMessage('Oyun sırasında zorluk seviyesi değiştirilemez.');
      }
    });
  }
});

// İlk durum ayarları
updateStatusMessage('Başlamak için "Başla" butonuna basın');
setDifficulty('easy'); // Varsayılan olarak kolay modu ayarla
setGameMode('classic'); // Varsayılan olarak klasik modu ayarla

function playRandomSequence() {
  let sequence = [];
  let playerSequence = [];
  let sequenceLength = getCurrentSequenceLength();

  // Sadece görünür pedleri kullan
  const visiblePadsList = Array.from(soundPads).filter(pad => 
    pad && pad.style && pad.style.display !== 'none');

  if (visiblePadsList.length === 0) {
    console.error("Görünür pad bulunamadı!");
    return;
  }

  for (let i = 0; i < sequenceLength; i++) {
    // randomPadIndex yerine doğrudan visiblePadsList'ten rastgele öğe seçiyoruz
    const randomPad = visiblePadsList[Math.floor(Math.random() * visiblePadsList.length)];

    // Null kontrolü ekle
    if (randomPad && randomPad.dataset && randomPad.dataset.note) {
      sequence.push(randomPad.dataset.note);
    } else {
      console.error("Geçersiz pad algılandı, atlanıyor");
      i--; // Geçersiz pad için döngüyü tekrarla
    }
  }
  
  return sequence;
}

// getCurrentSequenceLength fonksiyonu eksik, varsayılan değer döndüren bir fonksiyon ekledim
function getCurrentSequenceLength() {
  // Level'e göre uzunluk belirle
  return Math.min(5 + Math.floor(level / 2), 20); // Örnek bir değer, gerçek uygulamanızda burayı değiştirmeniz gerekebilir.
}

// Swipe back navigation için gerekli fonksiyon
function goBack() {
  window.location.href = '/all-games';
}
