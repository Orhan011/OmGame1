/**
 * Sesli Hafıza Oyunu (Simon)
 * ==========================
 * Renkli düğmelerin çaldığı ses dizisini takip eden interaktif bir hafıza oyunu.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Oyun durumu
  const state = {
    sequence: [],
    playerSequence: [],
    round: 0,
    level: 1,
    score: 0,
    bestScore: localStorage.getItem('audioMemory_bestScore') ? parseInt(localStorage.getItem('audioMemory_bestScore')) : 0,
    gameSpeed: 1000, // ms
    playerTurn: false,
    gameActive: false
  };

  // Ses dosyalarını oluşturmak ve çalmak için Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Ses frekansları (Hz)
  const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  
  // DOM elementleri
  const elements = {
    gameButtons: document.querySelectorAll('.game-btn'),
    startButton: document.getElementById('start-btn'),
    levelElement: document.getElementById('level'),
    scoreElement: document.getElementById('score'),
    bestScoreElement: document.getElementById('best-score'),
    statusMessage: document.getElementById('status-message'),
    difficultyButtons: document.querySelectorAll('.difficulty-btn'),
    gameOverOverlay: document.getElementById('game-over'),
    resultLevel: document.getElementById('result-level'),
    resultScore: document.getElementById('result-score'),
    resultMessage: document.getElementById('result-message'),
    tryAgainButton: document.getElementById('try-again-btn')
  };

  // Oyunu başlat
  function init() {
    // Event listener'ları ayarla
    setupEventListeners();
    
    // En iyi skoru güncelle
    updateBestScore();
  }

  // Event listener'ları ayarla
  function setupEventListeners() {
    // Başlat düğmesi
    elements.startButton.addEventListener('click', startGame);
    
    // Tekrar dene düğmesi
    elements.tryAgainButton.addEventListener('click', () => {
      elements.gameOverOverlay.classList.add('hidden');
      startGame();
    });
    
    // Oyun düğmeleri
    elements.gameButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (state.playerTurn && state.gameActive) {
          playerMove(index);
        }
      });
    });
    
    // Zorluk düğmeleri
    elements.difficultyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Aktif düğmeyi güncelle
        elements.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Oyun hızını güncelle
        state.gameSpeed = parseInt(e.target.dataset.speed);
      });
    });
  }

  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    resetGame();
    
    // Oyunu başlat
    state.gameActive = true;
    elements.startButton.textContent = 'Yeniden Başlat';
    
    // İlk turu başlat
    nextRound();
  }

  // Oyunu sıfırla
  function resetGame() {
    state.sequence = [];
    state.playerSequence = [];
    state.round = 0;
    state.level = 1;
    state.score = 0;
    state.playerTurn = false;
    
    // UI'ı güncelle
    elements.levelElement.textContent = state.level;
    elements.scoreElement.textContent = state.score;
    elements.statusMessage.textContent = 'Hazır? Başlıyoruz!';
  }

  // Sonraki tura geç
  function nextRound() {
    state.round++;
    state.playerSequence = [];
    state.playerTurn = false;
    
    // Seviyeyi güncelle (her 3 turda 1 seviye)
    const newLevel = Math.floor((state.round - 1) / 3) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      elements.levelElement.textContent = state.level;
      
      // Seviye yükseltme bonusu
      addScore(50);
    }
    
    // Durum mesajını güncelle
    elements.statusMessage.textContent = `${state.round}. Tur - Diziyi İzleyin`;
    
    // Yeni bir tuş ekle
    addToSequence();
    
    // Kısa bir beklemeden sonra diziyi göster
    setTimeout(() => {
      playSequence();
    }, 1000);
  }

  // Diziye yeni bir öğe ekle
  function addToSequence() {
    // Rastgele bir düğme seç (0-3 arası)
    const randomButton = Math.floor(Math.random() * 4);
    state.sequence.push(randomButton);
  }

  // Diziyi göster
  function playSequence() {
    let i = 0;
    
    // Her düğmeyi sırayla çal
    const interval = setInterval(() => {
      if (i >= state.sequence.length) {
        clearInterval(interval);
        
        // Oyuncunun sırası
        setTimeout(() => {
          state.playerTurn = true;
          elements.statusMessage.textContent = 'Şimdi Siz Sırayı Tekrarlayın!';
        }, 500);
        
        return;
      }
      
      // Düğmeyi vurgula ve sesi çal
      const buttonIndex = state.sequence[i];
      activateButton(buttonIndex);
      
      i++;
    }, state.gameSpeed);
  }

  // Düğmeyi vurgula ve sesini çal
  function activateButton(index) {
    const button = elements.gameButtons[index];
    
    // Düğmeyi vurgula
    button.classList.add('active');
    
    // Ses çal
    playTone(index);
    
    // Vurgulamayı kaldır
    setTimeout(() => {
      button.classList.remove('active');
    }, state.gameSpeed / 2);
  }

  // Belirli bir frekans ve sürede ses çal
  function playTone(index) {
    // Ses çalmak için osilator oluştur
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Sesi ayarla
    oscillator.frequency.value = frequencies[index];
    oscillator.type = 'sine'; // Sinüs dalgası (düz ton)
    
    // Ses seviyesini ayarla (yavaşça azalacak şekilde)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Bağlantıları kur
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sesi çal
    oscillator.start();
    
    // Sesi durdur
    setTimeout(() => {
      oscillator.stop();
    }, state.gameSpeed / 2);
  }

  // Oyuncu hamlesi
  function playerMove(buttonIndex) {
    // Oyuncu sırası değilse işlem yapma
    if (!state.playerTurn) return;
    
    // Düğmeyi vurgula ve sesini çal
    activateButton(buttonIndex);
    
    // Hamleyi oyuncu dizisine ekle
    state.playerSequence.push(buttonIndex);
    
    // Hamlenin doğruluğunu kontrol et
    const currentIndex = state.playerSequence.length - 1;
    
    if (state.playerSequence[currentIndex] !== state.sequence[currentIndex]) {
      // Hatalı hamle
      gameOver();
      return;
    }
    
    // Doğru hamle için puan ekle
    addScore(10);
    
    // Oyuncu tüm diziyi tamamladı mı?
    if (state.playerSequence.length === state.sequence.length) {
      // Tur tamamlandı
      state.playerTurn = false;
      
      // Tur tamamlama bonusu
      addScore(state.round * 5);
      
      // Durum mesajını güncelle
      elements.statusMessage.textContent = 'Harika! Sonraki tura hazırlanın...';
      
      // Sonraki tura geç
      setTimeout(() => {
        nextRound();
      }, 1500);
    }
  }

  // Oyunu bitir
  function gameOver() {
    state.gameActive = false;
    state.playerTurn = false;
    
    // Oyun sonu mesajı
    const gameOverMessage = getGameOverMessage();
    
    // Sonuç ekranını güncelle
    elements.resultLevel.textContent = state.level;
    elements.resultScore.textContent = state.score;
    elements.resultMessage.textContent = gameOverMessage;
    
    // Sonuç ekranını göster
    elements.gameOverOverlay.classList.remove('hidden');
    
    // Skoru sunucuya kaydet
    saveScoreToServer();
  }

  // Skoru güncelle
  function addScore(points) {
    state.score += points;
    elements.scoreElement.textContent = state.score;
    
    // En iyi skoru güncelle
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem('audioMemory_bestScore', state.bestScore);
      updateBestScore();
    }
  }

  // En iyi skoru güncelle
  function updateBestScore() {
    elements.bestScoreElement.textContent = state.bestScore;
  }

  // Oyun sonu mesajı oluştur
  function getGameOverMessage() {
    if (state.level === 1) {
      return 'Bir dahaki sefere daha iyi olacak!';
    } else if (state.level <= 3) {
      return 'İyi bir başlangıç. Hafızanı geliştirmeye devam et!';
    } else if (state.level <= 5) {
      return 'Harika bir performans. Kısa süreli hafızan güçleniyor!';
    } else if (state.level <= 7) {
      return 'Etkileyici! Simon ustası olmaya başlıyorsun!';
    } else {
      return 'İnanılmaz! Üstün bir hafıza gösterisi!';
    }
  }

  // Skoru sunucuya kaydet
  function saveScoreToServer() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: 'audioMemory',
        score: state.score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }

  // Oyunu başlat
  init();
});