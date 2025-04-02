/**
 * Sesli Hafıza Oyunu (Audio Memory) - Pro Edition
 * Geliştirilmiş ve Profesyonel versiyonu
 * 
 * Özellikler:
 * - Çoklu zorluk seviyeleri (4, 6, 9 butonlu)
 * - Yüksek kaliteli ses efektleri
 * - Modern ve şık arayüz
 * - Animasyonlu geçişler ve efektler
 * - Tam responsif tasarım
 * - Puan sistemi ve en yüksek skor takibi
 * - Kullanıcı dostu arayüz ve geri bildirimler
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementlerini Seç
  // Oyun kontrolleri ve göstergeler
  const startButton = document.getElementById('start-button');
  const resetButton = document.getElementById('reset-button');
  const statusDisplay = document.getElementById('status-display');
  const scoreDisplay = document.getElementById('score');
  const levelDisplay = document.getElementById('level');
  const highScoreDisplay = document.getElementById('high-score');
  
  // Zorluk seviyesi butonları
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  
  // Oyun alanları (her zorluk seviyesi için)
  const easyButtonsContainer = document.getElementById('audio-buttons-easy');
  const mediumButtonsContainer = document.getElementById('audio-buttons-medium');
  const hardButtonsContainer = document.getElementById('audio-buttons-hard');
  
  // Ses butonları (her zorluk seviyesi için)
  const easyButtons = easyButtonsContainer.querySelectorAll('.audio-button');
  const mediumButtons = mediumButtonsContainer.querySelectorAll('.audio-button');
  const hardButtons = hardButtonsContainer.querySelectorAll('.audio-button');
  
  // Oyun Durumu Nesnesi
  const gameState = {
    isPlaying: false,         // Oyun oynuyor mu?
    canClick: false,          // Oyuncu butona tıklayabilir mi?
    isComputerTurn: false,    // Bilgisayarın sırası mı?
    difficulty: 'easy',       // Zorluk seviyesi (easy, medium, hard)
    sequence: [],             // Oyundaki ses sırası
    playerSequence: [],       // Oyuncunun girdiği ses sırası
    level: 1,                 // Mevcut seviye
    score: 0,                 // Mevcut skor
    highScore: 0,             // En yüksek skor
    
    // Zorluk seviyelerine göre ayarlar
    settings: {
      easy: {
        buttonCount: 4,     // Butun sayısı
        playSpeed: 800,     // Ses çalma hızı (ms)
        pauseTime: 300,     // Butonlar arasındaki bekleme süresi (ms)
        scoreMultiplier: 1  // Skor çarpanı
      },
      medium: {
        buttonCount: 6,
        playSpeed: 650, 
        pauseTime: 250,
        scoreMultiplier: 2
      },
      hard: {
        buttonCount: 9,
        playSpeed: 500,
        pauseTime: 200,
        scoreMultiplier: 3
      }
    }
  };
  
  // Ses Efektleri (AudioContext kullanarak)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Farklı sesler için frekanslar (müzik notaları)
  const tones = {
    red: 261.63,      // C4
    blue: 293.66,     // D4
    green: 329.63,    // E4
    yellow: 349.23,   // F4
    purple: 392.00,   // G4
    orange: 440.00,   // A4
    teal: 493.88,     // B4
    pink: 523.25,     // C5
    lime: 587.33      // D5
  };
  
  // Oyun sesleri
  const gameSounds = {
    start: null,
    success: null,
    fail: null,
    buttonSounds: {}
  };
  
  // Ses fonksiyonları
  function playTone(frequency, duration = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Tını ve fade efektleri için
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return oscillator;
  }
  
  function playGameSound(type) {
    switch(type) {
      case 'start':
        // Başlangıç sesi: Artan bir arpej
        setTimeout(() => playTone(tones.red, 0.1), 0);
        setTimeout(() => playTone(tones.yellow, 0.1), 150);
        setTimeout(() => playTone(tones.green, 0.1), 300);
        setTimeout(() => playTone(tones.blue, 0.2), 450);
        break;
        
      case 'success':
        // Başarı sesi: Yükselen ton
        setTimeout(() => playTone(tones.green, 0.1), 0);
        setTimeout(() => playTone(tones.green * 1.5, 0.3), 150);
        break;
        
      case 'fail':
        // Başarısızlık sesi: Düşen ton
        setTimeout(() => playTone(tones.red, 0.1), 0);
        setTimeout(() => playTone(tones.red * 0.5, 0.3), 150);
        break;
        
      case 'levelUp':
        // Seviye atlama sesi: Çift yükselen ton
        setTimeout(() => playTone(tones.blue, 0.1), 0);
        setTimeout(() => playTone(tones.blue * 1.25, 0.1), 150);
        setTimeout(() => playTone(tones.blue * 1.5, 0.2), 300);
        break;
    }
  }
  
  function playButtonSound(index) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'teal', 'pink', 'lime'];
    const color = colors[index % colors.length];
    playTone(tones[color], 0.3);
  }
  
  // Oyunu Başlatma
  function startGame() {
    // Oyun durumunu sıfırla
    gameState.isPlaying = true;
    gameState.canClick = false;
    gameState.isComputerTurn = true;
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    
    // Arayüzü güncelle
    updateUI();
    
    // Oyun başlangıç sesi çal
    playGameSound('start');
    
    // Durum mesajını güncelle
    updateStatus('Oyun başlıyor...', 'ready');
    
    // Butonları güncelle
    startButton.disabled = true;
    resetButton.disabled = false;
    
    // Zorluk butonlarını devre dışı bırak
    difficultyButtons.forEach(btn => {
      btn.disabled = true;
    });
    
    // İlk sekansı oluştur
    setTimeout(() => {
      generateNextSequence();
    }, 1500);
  }
  
  // Oyunu Sıfırlama
  function resetGame() {
    // Oyun durumunu güncelle
    gameState.isPlaying = false;
    gameState.canClick = false;
    
    // Arayüzü güncelle
    updateStatus('Oyuna başlamak için "Başlat" butonuna tıklayın');
    
    // Butonları güncelle
    startButton.disabled = false;
    resetButton.disabled = true;
    
    // Zorluk butonlarını etkinleştir
    difficultyButtons.forEach(btn => {
      btn.disabled = false;
    });
    
    // Skorları güncelle
    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '1';
  }
  
  // Sonraki Sekansı Oluşturma
  function generateNextSequence() {
    // Yeni rastgele buton ekle
    const buttonCount = gameState.settings[gameState.difficulty].buttonCount;
    const randomButton = Math.floor(Math.random() * buttonCount);
    gameState.sequence.push(randomButton);
    
    // Oyuncu sırasını temizle
    gameState.playerSequence = [];
    
    // Durum mesajını güncelle
    updateStatus('Sırayı izleyin...', 'waiting');
    
    // Sırayı oynat
    playSequence();
  }
  
  // Sekansı Oynatma
  function playSequence() {
    gameState.isComputerTurn = true;
    gameState.canClick = false;
    
    const { playSpeed, pauseTime } = gameState.settings[gameState.difficulty];
    
    let i = 0;
    const intervalId = setInterval(() => {
      // Tüm dizi oynatıldıysa
      if (i >= gameState.sequence.length) {
        clearInterval(intervalId);
        
        // Oyuncunun sırası
        setTimeout(() => {
          gameState.isComputerTurn = false;
          gameState.canClick = true;
          updateStatus('Şimdi sizin sıranız! Sırayı tekrarlayın.', 'ready');
        }, pauseTime);
        
        return;
      }
      
      // Düğmeyi aktifleştir ve sesini çal
      const buttonIndex = gameState.sequence[i];
      activateButton(buttonIndex);
      
      i++;
    }, playSpeed);
  }
  
  // Düğme Aktivasyonu ve Ses Çalma
  function activateButton(index) {
    let button;
    
    // Zorluk seviyesine göre doğru buton setini seç
    if (gameState.difficulty === 'easy') {
      button = easyButtons[index];
    } else if (gameState.difficulty === 'medium') {
      button = mediumButtons[index];
    } else {
      button = hardButtons[index];
    }
    
    // Buton efekti
    button.classList.add('active');
    
    // Buton sesini çal
    playButtonSound(index);
    
    // Aktivasyonu kaldır
    setTimeout(() => {
      button.classList.remove('active');
    }, 300);
  }
  
  // Oyuncu Girişini Kontrol Etme
  function checkPlayerInput(index) {
    // Oyuncunun tıkladığı butonu kaydet
    gameState.playerSequence.push(index);
    
    // Şimdiye kadarki sıra doğru mu kontrol et
    const currentIndex = gameState.playerSequence.length - 1;
    
    if (gameState.sequence[currentIndex] !== index) {
      // Yanlış buton - oyun bitti
      gameOver();
      return;
    }
    
    // Oyuncu tam sekansı tamamladı mı?
    if (gameState.playerSequence.length === gameState.sequence.length) {
      // Seviye tamamlandı
      levelComplete();
    }
  }
  
  // Seviye Tamamlandığında
  function levelComplete() {
    // Oyuncu girişini geçici olarak devre dışı bırak
    gameState.canClick = false;
    
    // Skoru güncelle: Seviye x Zorluk Çarpanı x 10
    const scoreMultiplier = gameState.settings[gameState.difficulty].scoreMultiplier;
    const levelScore = gameState.level * scoreMultiplier * 10;
    gameState.score += levelScore;
    
    // Seviyeyi artır
    gameState.level += 1;
    
    // Durum mesajını güncelle
    updateStatus(`Harika! +${levelScore} puan kazandınız.`, 'success');
    
    // Seviye atlama sesi çal
    playGameSound('levelUp');
    
    // Seviye animasyonu
    levelDisplay.classList.add('level-up');
    setTimeout(() => {
      levelDisplay.classList.remove('level-up');
    }, 600);
    
    // Arayüzü güncelle
    updateUI();
    
    // Yüksek skoru kontrol et
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      highScoreDisplay.textContent = gameState.highScore;
      
      // Yerel depolamada kaydet
      localStorage.setItem('audioMemoryHighScore', gameState.highScore);
    }
    
    // Sonraki seviyeye geç
    setTimeout(() => {
      generateNextSequence();
    }, 1500);
  }
  
  // Oyun Sonu
  function gameOver() {
    // Oyun durumunu güncelle
    gameState.isPlaying = false;
    gameState.canClick = false;
    
    // Başarısızlık sesi çal
    playGameSound('fail');
    
    // Durum mesajını güncelle
    updateStatus(`Oyun bitti! Skorunuz: ${gameState.score}`, 'error');
    
    // Skoru sunucuya gönder
    saveScore();
    
    // Butonları güncelle
    startButton.disabled = false;
    resetButton.disabled = true;
    
    // Zorluk butonlarını etkinleştir
    difficultyButtons.forEach(btn => {
      btn.disabled = false;
    });
  }
  
  // Skoru Sunucuya Gönderme
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
  
  // Arayüzü Güncelleme
  function updateUI() {
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;
    highScoreDisplay.textContent = gameState.highScore;
  }
  
  // Durum Mesajını Güncelleme
  function updateStatus(message, state = '') {
    statusDisplay.textContent = message;
    
    // Tüm durum sınıflarını kaldır
    statusDisplay.classList.remove('ready', 'waiting', 'error', 'success');
    
    // Belirtilen durum sınıfını ekle
    if (state) {
      statusDisplay.classList.add(state);
    }
  }
  
  // Zorluk Seviyesini Değiştirme
  function changeDifficulty(difficulty) {
    if (gameState.isPlaying) return;
    
    gameState.difficulty = difficulty;
    
    // Buton konteynerlerini gizle/göster
    easyButtonsContainer.style.display = 'none';
    mediumButtonsContainer.style.display = 'none';
    hardButtonsContainer.style.display = 'none';
    
    // Seçilen zorluk seviyesine göre buton konteynerini göster
    if (difficulty === 'easy') {
      easyButtonsContainer.style.display = 'grid';
    } else if (difficulty === 'medium') {
      mediumButtonsContainer.style.display = 'grid';
    } else if (difficulty === 'hard') {
      hardButtonsContainer.style.display = 'grid';
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
  
  // ----- Event Listener'lar -----
  
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
  
  // Ses butonları için event listener'lar
  function setupButtonListeners() {
    // Kolay mod butonları
    easyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.isComputerTurn) return;
        
        const index = parseInt(btn.dataset.index);
        
        btn.classList.add('active');
        playButtonSound(index);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(index);
      });
    });
    
    // Orta mod butonları
    mediumButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.isComputerTurn) return;
        
        const index = parseInt(btn.dataset.index);
        
        btn.classList.add('active');
        playButtonSound(index);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(index);
      });
    });
    
    // Zor mod butonları
    hardButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!gameState.canClick || gameState.isComputerTurn) return;
        
        const index = parseInt(btn.dataset.index);
        
        btn.classList.add('active');
        playButtonSound(index);
        
        setTimeout(() => {
          btn.classList.remove('active');
        }, 300);
        
        checkPlayerInput(index);
      });
    });
  }
  
  // Klavye kontrolleri
  document.addEventListener('keydown', (e) => {
    if (!gameState.canClick || gameState.isComputerTurn) return;
    
    // Sayı tuşları 1-9 arası
    const keyToIndex = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, 
      '6': 5, '7': 6, '8': 7, '9': 8
    };
    
    if (keyToIndex[e.key] !== undefined) {
      const index = keyToIndex[e.key];
      
      // Geçerli zorluk seviyesinde bu buton varsa
      const buttonCount = gameState.settings[gameState.difficulty].buttonCount;
      if (index < buttonCount) {
        // İlgili butona programlı tıklama
        let button;
        
        if (gameState.difficulty === 'easy') {
          button = easyButtons[index];
        } else if (gameState.difficulty === 'medium') {
          button = mediumButtons[index];
        } else {
          button = hardButtons[index];
        }
        
        if (button) {
          button.classList.add('active');
          playButtonSound(index);
          
          setTimeout(() => {
            button.classList.remove('active');
          }, 300);
          
          checkPlayerInput(index);
        }
      }
    }
  });
  
  // ----- Başlangıç İşlemleri -----
  
  // Buton olay dinleyicilerini ekle
  setupButtonListeners();
  
  // Başlangıç zorluk seviyesini ayarla
  changeDifficulty('easy');
  
  // Yerel depolamadan yüksek skoru yükle
  const savedHighScore = localStorage.getItem('audioMemoryHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
    highScoreDisplay.textContent = gameState.highScore;
  }
  
  // AudioContext etkinleştirme
  document.addEventListener('click', function initAudio() {
    // AudioContext açılışta askıya alınmış olabilir (tarayıcı politikası)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    document.removeEventListener('click', initAudio);
  }, { once: true });
});