/**
 * Sesli Hafıza Oyunu (Simon) - v1.0
 * Ses sıralarını hafızada tutmaya dayalı interaktif oyun.
 * Kullanıcı, rastgele oluşturulan ses dizilerini doğru sırada tekrarlamaya çalışır.
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startButton = document.getElementById('start-button');
  const resetButton = document.getElementById('reset-button');
  const levelDisplay = document.getElementById('level');
  const scoreDisplay = document.getElementById('score');
  const highScoreDisplay = document.getElementById('highScore');
  const statusDisplay = document.getElementById('status-display');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  
  // Ses butonları için konteynerlar
  const easyButtons = document.getElementById('easy-buttons');
  const mediumButtons = document.getElementById('medium-buttons');
  const hardButtons = document.getElementById('hard-buttons');
  
  // Oyun Durumu
  let gameState = {
    sequence: [],            // Mevcut ses dizisi
    playerSequence: [],      // Oyuncunun girdiği dizi
    level: 1,                // Mevcut seviye
    score: 0,                // Mevcut skor
    highScore: 0,            // En yüksek skor
    isPlaying: false,        // Oyun çalışıyor mu?
    canClick: false,         // Oyuncu tıklayabilir mi?
    gameOver: false,         // Oyun bitti mi?
    difficulty: 'easy',      // Zorluk seviyesi (easy, medium, hard)
    difficultySettings: {
      easy: { buttonCount: 4, playSpeed: 1000, pauseTime: 400 },
      medium: { buttonCount: 6, playSpeed: 800, pauseTime: 300 },
      hard: { buttonCount: 8, playSpeed: 600, pauseTime: 200 }
    },
    sounds: []              // Ses objeleri
  };

  // Ses Dizisi Ayarları
  let noteFiles = [
    'note1.mp3', 'note2.mp3', 'note3.mp3', 'note4.mp3',
    'note1.mp3', 'note2.mp3', 'note3.mp3', 'note4.mp3'  // 8 ses için (tekrarlı)
  ];
  
  // Sesleri önceden yükle
  function preloadSounds() {
    for (let i = 0; i < noteFiles.length; i++) {
      const sound = new Audio(`/static/sounds/${noteFiles[i]}`);
      gameState.sounds.push(sound);
    }
  }
  
  // Oyun başlatma
  function startGame() {
    // Oyun durumunu sıfırla
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.gameOver = false;
    
    // Yerel depolamadan yüksek skoru al (eğer varsa)
    const savedHighScore = localStorage.getItem('audioMemoryHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
      highScoreDisplay.textContent = gameState.highScore;
    }
    
    // UI güncellemeleri
    updateUI();
    
    // İlk sekansı oluştur ve oynat
    setTimeout(() => {
      generateNextSequence();
    }, 1000);
    
    // Başlatma butonunu devre dışı bırak, sıfırlama butonunu etkinleştir
    startButton.disabled = true;
    resetButton.disabled = false;
    
    // Zorluk butonlarını devre dışı bırak
    difficultyButtons.forEach(btn => {
      btn.disabled = true;
    });
  }
  
  // Oyunu sıfırlama
  function resetGame() {
    // Oyun durumunu güncelle
    gameState.isPlaying = false;
    gameState.gameOver = true;
    
    // UI güncellemeleri
    statusDisplay.textContent = 'Oyun sıfırlandı. Başlamak için "Başlat" butonuna tıklayın';
    
    // Buton durumlarını güncelle
    startButton.disabled = false;
    resetButton.disabled = true;
    
    // Zorluk butonlarını etkinleştir
    difficultyButtons.forEach(btn => {
      btn.disabled = false;
    });
  }
  
  // Yeni sekans oluşturma
  function generateNextSequence() {
    // Yeni rastgele düğme ekle
    const buttonCount = gameState.difficultySettings[gameState.difficulty].buttonCount;
    const randomButton = Math.floor(Math.random() * buttonCount);
    gameState.sequence.push(randomButton);
    
    // Oyuncu sırasını temizle
    gameState.playerSequence = [];
    
    // Durum mesajını güncelle
    statusDisplay.textContent = 'Sırayı izleyin...';
    
    // Sırayı oynat
    playSequence();
  }
  
  // Oluşturulan sekansı oynatma
  function playSequence() {
    gameState.canClick = false;
    let i = 0;
    
    // Zorluk seviyesine göre hız ayarları
    const { playSpeed, pauseTime } = gameState.difficultySettings[gameState.difficulty];
    
    // Dizideki her düğme için zamanlayıcı oluştur
    const interval = setInterval(() => {
      if (i >= gameState.sequence.length) {
        clearInterval(interval);
        
        // Sıra tamamlandığında oyuncunun tıklamasına izin ver
        setTimeout(() => {
          statusDisplay.textContent = 'Sırayı tekrarlayın!';
          gameState.canClick = true;
        }, pauseTime);
        
        return;
      }
      
      // Mevcut butonu vurgula ve sesini çal
      const buttonIndex = gameState.sequence[i];
      activateButton(buttonIndex);
      i++;
    }, playSpeed);
  }
  
  // Buton aktivasyonu
  function activateButton(index) {
    // Zorluk derecesine göre doğru buton setini seç
    let currentButtons;
    let idPrefix = '';
    
    if (gameState.difficulty === 'easy') {
      currentButtons = easyButtons.querySelectorAll('.simon-btn');
      idPrefix = 'btn';
    } else if (gameState.difficulty === 'medium') {
      currentButtons = mediumButtons.querySelectorAll('.simon-btn');
      idPrefix = 'btn';
    } else {
      currentButtons = hardButtons.querySelectorAll('.simon-btn');
      idPrefix = 'btn';
    }
    
    // Buton elementini bul
    const buttonElement = document.querySelector(`#${idPrefix}${index}-${gameState.difficulty === 'easy' ? '' : gameState.difficulty}`);
    
    if (buttonElement) {
      // Butonu aktifleştir
      buttonElement.classList.add('active');
      
      // Sesi çal
      playSound(index);
      
      // Aktivasyonu kaldır
      setTimeout(() => {
        buttonElement.classList.remove('active');
      }, 300);
    }
  }
  
  // Ses çalma
  function playSound(index) {
    // Ses dizisindeki ses ile aynı ses dizinini kullan (mod ile wrap)
    const sound = gameState.sounds[index % gameState.sounds.length];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Ses çalma hatası:', e));
    }
  }
  
  // Oyuncu girişini kontrol etme
  function checkPlayerInput(buttonIndex) {
    // Oyuncunun tıkladığı butonu kaydet
    gameState.playerSequence.push(buttonIndex);
    
    // Şimdiye kadarki sıra doğru mu kontrol et
    const currentIndex = gameState.playerSequence.length - 1;
    
    if (gameState.sequence[currentIndex] !== buttonIndex) {
      // Sıra yanlış, oyun bitti
      endGame();
      return;
    }
    
    // Oyuncu tam sekansı tamamladı mı?
    if (gameState.playerSequence.length === gameState.sequence.length) {
      // Seviye tamamlandı
      levelComplete();
    }
  }
  
  // Seviye tamamlandığında
  function levelComplete() {
    // Skoru ve seviyeyi artır
    gameState.score += gameState.level * 10;
    gameState.level += 1;
    
    // Kısa bir süre bekledikten sonra bir sonraki seviyeye geç
    gameState.canClick = false;
    statusDisplay.textContent = 'Doğru! Sonraki seviyeye hazırlanın...';
    
    // Level up animasyonu
    levelDisplay.classList.add('level-up');
    setTimeout(() => {
      levelDisplay.classList.remove('level-up');
    }, 500);
    
    // UI güncelle
    updateUI();
    
    // Yüksek skoru kontrol et ve güncelle
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('audioMemoryHighScore', gameState.highScore);
      highScoreDisplay.textContent = gameState.highScore;
    }
    
    // Sonraki sekansı başlat
    setTimeout(() => {
      generateNextSequence();
    }, 1500);
  }
  
  // Oyun sonu
  function endGame() {
    // Oyun durumunu güncelle
    gameState.isPlaying = false;
    gameState.gameOver = true;
    gameState.canClick = false;
    
    // Ses çal
    const gameOverSound = new Audio('/static/sounds/game-over.mp3');
    gameOverSound.play().catch(e => console.log('Ses çalma hatası:', e));
    
    // Durum mesajını güncelle
    statusDisplay.textContent = `Oyun bitti! Skorunuz: ${gameState.score}`;
    statusDisplay.classList.add('error-shake');
    setTimeout(() => {
      statusDisplay.classList.remove('error-shake');
    }, 400);
    
    // Skoru sunucuya kaydet
    saveScore();
    
    // Butonları güncelle
    startButton.disabled = false;
    resetButton.disabled = true;
    
    // Zorluk butonlarını etkinleştir
    difficultyButtons.forEach(btn => {
      btn.disabled = false;
    });
  }
  
  // Skoru sunucuya kaydetme
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'audioMemory',
        score: gameState.score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilemedi:', error);
    });
  }
  
  // UI Güncelleme
  function updateUI() {
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    highScoreDisplay.textContent = gameState.highScore;
  }
  
  // Zorluk seviyesi değiştirme
  function changeDifficulty(difficulty) {
    if (gameState.isPlaying) return;
    
    gameState.difficulty = difficulty;
    
    // Buton konteynerlarını gizle/göster
    easyButtons.style.display = 'none';
    mediumButtons.style.display = 'none';
    hardButtons.style.display = 'none';
    
    // Seçilen zorluk seviyesi için buton konteynerini göster
    if (difficulty === 'easy') {
      easyButtons.style.display = 'grid';
    } else if (difficulty === 'medium') {
      mediumButtons.style.display = 'grid';
    } else if (difficulty === 'hard') {
      hardButtons.style.display = 'grid';
    }
    
    // Aktif zorluk butonunu güncelle
    difficultyButtons.forEach(btn => {
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  // ----- Event Listeners -----
  
  // Başlat butonu
  startButton.addEventListener('click', startGame);
  
  // Sıfırla butonu
  resetButton.addEventListener('click', resetGame);
  
  // Zorluk butonları
  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      changeDifficulty(btn.dataset.difficulty);
    });
  });
  
  // Oyun butonları için event listener'ları ekle
  function addButtonListeners() {
    // Kolay mod butonları
    const easyBtns = easyButtons.querySelectorAll('.simon-btn');
    easyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.gameOver) return;
        
        const buttonIndex = parseInt(btn.dataset.sound);
        btn.classList.add('active');
        playSound(buttonIndex);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(buttonIndex);
      });
    });
    
    // Orta zorluk butonları
    const mediumBtns = mediumButtons.querySelectorAll('.simon-btn');
    mediumBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.gameOver) return;
        
        const buttonIndex = parseInt(btn.dataset.sound);
        btn.classList.add('active');
        playSound(buttonIndex);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(buttonIndex);
      });
    });
    
    // Zor mod butonları
    const hardBtns = hardButtons.querySelectorAll('.simon-btn');
    hardBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.gameOver) return;
        
        const buttonIndex = parseInt(btn.dataset.sound);
        btn.classList.add('active');
        playSound(buttonIndex);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(buttonIndex);
      });
    });
  }
  
  // Klavye kontrolleri
  document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying || !gameState.canClick) return;
    
    // Sayı tuşları ile butonlara basılmasını sağla (1-4 kolay mod için)
    const keyToIndex = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      '5': 4, '6': 5, '7': 6, '8': 7
    };
    
    if (keyToIndex[e.key] !== undefined) {
      const index = keyToIndex[e.key];
      
      // Geçerli zorluk seviyesinde bu buton varsa
      const buttonCount = gameState.difficultySettings[gameState.difficulty].buttonCount;
      if (index < buttonCount) {
        // İlgili butona bas
        let buttonElement;
        
        if (gameState.difficulty === 'easy') {
          buttonElement = document.querySelector(`#btn${index}`);
        } else if (gameState.difficulty === 'medium') {
          buttonElement = document.querySelector(`#btn${index}-medium`);
        } else {
          buttonElement = document.querySelector(`#btn${index}-hard`);
        }
        
        if (buttonElement) {
          buttonElement.click();
        }
      }
    }
  });
  
  // ----- Başlangıç -----
  
  // Sesleri önceden yükle
  preloadSounds();
  
  // Oyun butonları için event listener'ları ekle
  addButtonListeners();
  
  // Başlangıç zorluk seviyesini ayarla
  changeDifficulty('easy');
  
  // Yüksek skoru kontrol et ve yükle
  const savedHighScore = localStorage.getItem('audioMemoryHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
    highScoreDisplay.textContent = gameState.highScore;
  }
});