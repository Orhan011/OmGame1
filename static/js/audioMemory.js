
// Sesli Hafıza Oyunu

// Ses düğmeleri ve ses efektleri için değişkenler
let buttons = [];
let gameSequence = [];
let playerSequence = [];
let level = 1;
let score = 0;
let sequenceLength = 3;
let isPlaying = false;
let canPlay = false;
let correctCount = 0;
let synth;
let gameOver = false;

// Oyun başlatma fonksiyonu
function startGame() {
  // Müzik sentezleyicisini başlat
  if (!synth) {
    synth = new Tone.Synth().toDestination();
    console.log("Audio is ready");
  }

  resetGame();
  
  // Intro bölümünü gizle ve oyun konteynerını göster
  document.getElementById('intro-section').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  document.getElementById('game-over-container').style.display = 'none';
  
  // Düğmeleri oluştur
  createButtons();
  
  // İlk diziyi başlat
  setTimeout(() => {
    playSequence();
  }, 1000);
}

// Oyunu sıfırlama fonksiyonu
function resetGame() {
  gameSequence = [];
  playerSequence = [];
  level = 1;
  score = 0;
  sequenceLength = 3;
  isPlaying = true;
  canPlay = false;
  correctCount = 0;
  gameOver = false;
  
  updateDisplay();
}

// Ekran göstergelerini güncelleme
function updateDisplay() {
  document.getElementById('score-display').textContent = score;
  document.getElementById('level-display').textContent = level;
  document.getElementById('sequence-length').textContent = sequenceLength;
  document.getElementById('correct-display').textContent = correctCount;
}

// Düğmeleri oluşturma
function createButtons() {
  const buttonContainer = document.getElementById('audio-buttons');
  buttonContainer.innerHTML = '';
  buttons = [];
  
  // Ses notaları
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
  
  // Renk kodları
  const colors = [
    '#FF5252', '#FF9800', '#FFEB3B', 
    '#66BB6A', '#42A5F5', '#7E57C2'
  ];
  
  for (let i = 0; i < 6; i++) {
    const btn = document.createElement('div');
    btn.className = 'audio-button';
    btn.dataset.index = i;
    btn.dataset.note = notes[i];
    btn.style.backgroundColor = colors[i];
    
    btn.addEventListener('click', () => {
      if (canPlay && isPlaying) {
        playSound(i, notes[i]);
        checkSequence(i);
      }
    });
    
    buttonContainer.appendChild(btn);
    buttons.push(btn);
  }
}

// Rastgele bir ses dizisi oluşturma
function generateSequence() {
  for (let i = 0; i < sequenceLength; i++) {
    const randomIndex = Math.floor(Math.random() * 6);
    gameSequence.push(randomIndex);
  }
}

// Ses dizisini oynatma
function playSequence() {
  // Oyuncu girişini devre dışı bırak
  canPlay = false;
  
  // Eğer dizi boşsa yeni bir dizi oluştur
  if (gameSequence.length === 0) {
    generateSequence();
  }
  
  // Diziyi oynat
  let i = 0;
  const interval = setInterval(() => {
    const index = gameSequence[i];
    const note = buttons[index].dataset.note;
    
    playSound(index, note);
    
    i++;
    if (i >= gameSequence.length) {
      clearInterval(interval);
      
      // Oyuncunun sırası
      setTimeout(() => {
        canPlay = true;
        playerSequence = [];
      }, 500);
    }
  }, 800);
}

// Ses çalma ve düğme animasyonu
function playSound(index, note) {
  // Visual feedback
  const button = buttons[index];
  button.classList.add('active');
  
  // Play sound
  if (synth) {
    synth.triggerAttackRelease(note, "8n");
  }
  
  // Remove active class after animation
  setTimeout(() => {
    button.classList.remove('active');
  }, 300);
}

// Oyuncunun girdilerini kontrol etme
function checkSequence(index) {
  // Oyuncunun seçimini kaydet
  playerSequence.push(index);
  
  // Son giriş kontrolü
  const currentIndex = playerSequence.length - 1;
  
  // Yanlış giriş
  if (gameSequence[currentIndex] !== index) {
    gameOver = true;
    endGame();
    return;
  }
  
  // Dizi tamamlandı mı kontrol et
  if (playerSequence.length === gameSequence.length) {
    // Doğru sayısını artır
    correctCount++;
    
    // Skoru güncelle: Seviye x Dizi uzunluğu x 10
    score += level * sequenceLength * 10;
    
    // Displayi güncelle
    updateDisplay();
    
    // Sonraki seviyeye geç
    setTimeout(() => {
      nextLevel();
    }, 1000);
  }
}

// Sonraki seviyeye geçme
function nextLevel() {
  level++;
  
  // Her 2 seviyede dizi uzunluğunu artır
  if (level % 2 === 0) {
    sequenceLength++;
  }
  
  // Diziyi temizle ve yeni dizi oluştur
  gameSequence = [];
  playerSequence = [];
  
  // Ekranı güncelle
  updateDisplay();
  
  // Yeni diziyi oynat
  setTimeout(() => {
    playSequence();
  }, 1000);
}

// Oyun sonu
function endGame() {
  isPlaying = false;
  canPlay = false;
  
  // Game over ekranını göster
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('game-over-container').style.display = 'block';
  
  // Sonuç göster
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-level').textContent = level;
  document.getElementById('final-correct').textContent = correctCount;
  
  // Skor kaydet (backend'e gönder)
  if (score > 0) {
    saveScore();
  }
}

// Skoru kaydetme
function saveScore() {
  fetch('/save_score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game: 'audio_memory',
      score: score,
      level: level
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Score saved:', data);
  })
  .catch(error => {
    console.error('Error saving score:', error);
  });
}

// Belge yüklendiğinde olay dinleyicilerini ekle
document.addEventListener('DOMContentLoaded', function() {
  // Başlat butonu
  const startButton = document.getElementById('start-game');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }
  
  // Yeniden başlat butonu
  const restartButton = document.getElementById('restart-game');
  if (restartButton) {
    restartButton.addEventListener('click', startGame);
  }
});
