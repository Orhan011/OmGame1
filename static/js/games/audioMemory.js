/**
 * Sesli Hafıza Oyunu - 1.0
 * 
 * İşitsel hafıza ve dikkat gücünü geliştiren ses dizilerini tekrarlama oyunu.
 * 
 * Özellikler:
 * - Artan zorluk seviyelerinde ses dizileri
 * - Görsel ve işitsel geri bildirim
 * - Tone.js kütüphanesi ile yaratılan melodiler
 * - Responsive tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const startGameBtn = document.getElementById('start-game');
  const playAgainBtn = document.getElementById('play-again');
  const pauseGameBtn = document.getElementById('pause-game');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const replaySequenceBtn = document.getElementById('replay-sequence');
  const pauseOverlay = document.getElementById('pause-overlay');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  
  // Oyun alanı elementleri
  const audioPads = document.getElementById('audio-pads');
  const countdownDisplay = document.getElementById('countdown-display');
  const recallMessage = document.getElementById('recall-message');
  const phaseIndicator = document.getElementById('phase-indicator');
  const phaseText = document.getElementById('phase-text');
  
  // Skor göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const levelDisplay = document.getElementById('level-display');
  const sequenceLengthDisplay = document.getElementById('sequence-length');
  const correctDisplay = document.getElementById('correct-display');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  
  // Sonuç göstergeleri
  const finalScore = document.getElementById('final-score');
  const finalLevel = document.getElementById('final-level');
  const finalLength = document.getElementById('final-length');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const gameAchievement = document.getElementById('game-achievement');
  const achievementName = document.getElementById('achievement-name');
  const gameResultTitle = document.getElementById('game-result-title');
  
  // Paylaşım düğmeleri
  const copyScoreBtn = document.getElementById('copy-score');
  const shareScoreBtn = document.getElementById('share-score');
  
  // Oyun durumu
  let gameActive = false;
  let gamePaused = false;
  let difficulty = 'EASY';
  let currentLevel = 1;
  let maxSequenceReached = 0;
  let correctAnswers = 0;
  let currentPhase = 'listen'; // 'listen' veya 'recall'
  let score = 0;
  let currentSequence = [];
  let userSequence = [];
  let sequenceTimer = null;
  let isPlayingSequence = false;
  
  // Oyun parametreleri
  const DIFFICULTIES = {
    EASY: {
      initialLength: 3,
      maxLevel: 10,
      playSpeed: 800, // ms
      maxSequenceLength: 12,
      sounds: ['C4', 'E4', 'G4', 'B4']
    },
    MEDIUM: {
      initialLength: 4,
      maxLevel: 15,
      playSpeed: 600,
      maxSequenceLength: 16,
      sounds: ['C4', 'D4', 'E4', 'G4']
    },
    HARD: {
      initialLength: 5,
      maxLevel: 20,
      playSpeed: 500,
      maxSequenceLength: 20,
      sounds: ['C4', 'D4', 'E4', 'F4']
    }
  };
  
  // Tone.js Synth kurulumu
  let synth;
  
  // Event Listeners
  function initEventListeners() {
    startGameBtn.addEventListener('click', initializeAudio);
    playAgainBtn.addEventListener('click', resetGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    replaySequenceBtn.addEventListener('click', replayCurrentSequence);
    copyScoreBtn.addEventListener('click', copyScore);
    shareScoreBtn.addEventListener('click', shareScore);
    
    // Zorluk seviyesi butonları
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        difficulty = this.dataset.level;
      });
    });
    
    // Ses tuşları
    const pads = document.querySelectorAll('.audio-pad');
    pads.forEach(pad => {
      pad.addEventListener('click', function() {
        if (currentPhase === 'recall' && gameActive && !gamePaused && !isPlayingSequence) {
          const soundIndex = parseInt(pad.dataset.sound) - 1;
          playPadSound(soundIndex);
          animatePad(pad);
          handleUserInput(soundIndex);
        }
      });
      
      // Hover animasyonları
      pad.addEventListener('mousedown', function() {
        pad.classList.add('active');
      });
      
      pad.addEventListener('mouseup', function() {
        pad.classList.remove('active');
      });
      
      pad.addEventListener('mouseleave', function() {
        pad.classList.remove('active');
      });
    });
  }
  
  // Tone.js başlatma (kullanıcı etkileşimi gerekli)
  function initializeAudio() {
    // Tone.js başlat
    Tone.start().then(() => {
      console.log('Audio is ready');
      
      // Synth oluştur
      synth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();
      
      // Oyunu başlat
      startGame();
    }).catch(e => {
      console.error("Audio couldn't be started", e);
      showAlert("Ses başlatılamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.", "error");
    });
  }
  
  // Oyunu başlat
  function startGame() {
    gameActive = true;
    currentLevel = 1;
    score = 0;
    correctAnswers = 0;
    maxSequenceReached = 0;
    
    hideIntro();
    showGameContainer();
    updateUI();
    startLevel();
  }
  
  // Seviyeyi başlat
  function startLevel() {
    const params = DIFFICULTIES[difficulty];
    
    // Sequence uzunluğunu hesapla (seviyeyle artar)
    const sequenceLength = Math.min(
      params.initialLength + Math.floor((currentLevel - 1) / 2),
      params.maxSequenceLength
    );
    
    if (sequenceLength > maxSequenceReached) {
      maxSequenceReached = sequenceLength;
    }
    
    // UI güncelleme
    levelDisplay.textContent = currentLevel;
    sequenceLengthDisplay.textContent = sequenceLength;
    updateProgressBar();
    
    // Yeni bir ses dizisi oluştur
    generateSequence(sequenceLength);
    
    // Dinleme fazını başlat
    setTimeout(() => {
      startListenPhase();
    }, 1000);
  }
  
  // Rastgele ses dizisi oluştur
  function generateSequence(length) {
    currentSequence = [];
    const params = DIFFICULTIES[difficulty];
    const soundCount = params.sounds.length;
    
    for (let i = 0; i < length; i++) {
      // 0 ile soundCount-1 arasında rastgele bir indeks
      const randomIndex = Math.floor(Math.random() * soundCount);
      currentSequence.push(randomIndex);
    }
    userSequence = [];
  }
  
  // Dinleme fazını başlat
  function startListenPhase() {
    currentPhase = 'listen';
    phaseText.textContent = 'Sesleri Dinle';
    
    // Ses dizisini çal
    countdownDisplay.style.display = 'block';
    recallMessage.style.display = 'none';
    replaySequenceBtn.style.display = 'none';
    
    playSequence();
  }
  
  // Ses dizisini çal
  function playSequence() {
    isPlayingSequence = true;
    const params = DIFFICULTIES[difficulty];
    
    // Her bir ses için
    let index = 0;
    
    function playNextSound() {
      if (index < currentSequence.length) {
        const soundIndex = currentSequence[index];
        const pad = document.querySelector(`.audio-pad[data-sound="${soundIndex + 1}"]`);
        
        playPadSound(soundIndex);
        animatePad(pad);
        
        // Bir sonraki sesi çal
        index++;
        setTimeout(playNextSound, params.playSpeed);
      } else {
        // Tüm sesler çalındı, hatırlama fazına geç
        isPlayingSequence = false;
        setTimeout(() => {
          startRecallPhase();
        }, 500);
      }
    }
    
    // İlk sesi çal
    playNextSound();
  }
  
  // Mevcut diziyi tekrar çal
  function replayCurrentSequence() {
    if (currentPhase === 'recall' && !isPlayingSequence) {
      playSequence();
    }
  }
  
  // Hatırlama fazını başlat
  function startRecallPhase() {
    currentPhase = 'recall';
    phaseText.textContent = 'Sesleri Tekrarla';
    
    // UI ayarları
    countdownDisplay.style.display = 'none';
    recallMessage.style.display = 'block';
    replaySequenceBtn.style.display = 'inline-block';
    
    // Kullanıcı giriş alanını temizle
    userSequence = [];
  }
  
  // Kullanıcı girişini işle
  function handleUserInput(soundIndex) {
    if (currentPhase !== 'recall' || isPlayingSequence) return;
    
    userSequence.push(soundIndex);
    
    // Şu ana kadar doğru mu kontrol et
    const currentLength = userSequence.length;
    const isCorrect = currentSequence[currentLength - 1] === soundIndex;
    
    if (!isCorrect) {
      // Yanlış ses
      playWrongSound();
      showAlert('Yanlış!', 'danger');
      
      // Oyun sona erdi
      setTimeout(() => {
        endGame(false);
      }, 1000);
      return;
    }
    
    // Tüm sesleri girdi mi kontrol et
    if (userSequence.length === currentSequence.length) {
      // Doğru tamamlandı
      correctAnswers++;
      
      // Puan hesapla
      const sequenceLength = currentSequence.length;
      const basePoints = sequenceLength * 50;
      const levelBonus = currentLevel * 20;
      const difficultyMultiplier = {
        'EASY': 1,
        'MEDIUM': 1.5,
        'HARD': 2
      }[difficulty];
      
      const pointsEarned = Math.round((basePoints + levelBonus) * difficultyMultiplier);
      score += pointsEarned;
      
      // Animasyon ve UI güncelleme
      showAlert(`Doğru! +${pointsEarned} Puan`, 'success');
      updateScoreDisplay();
      updateCorrectDisplay();
      
      // Bir sonraki seviyeye geç
      setTimeout(() => {
        currentLevel++;
        if (currentLevel > DIFFICULTIES[difficulty].maxLevel) {
          endGame(true);
        } else {
          startLevel();
        }
      }, 1500);
    }
  }
  
  // Pad sesini çal
  function playPadSound(index) {
    if (!synth) return;
    
    const params = DIFFICULTIES[difficulty];
    const note = params.sounds[index];
    
    synth.triggerAttackRelease(note, '8n');
  }
  
  // Yanlış ses çal
  function playWrongSound() {
    if (!synth) return;
    
    synth.triggerAttackRelease('C3', '8n', '+0.1');
    synth.triggerAttackRelease('B2', '8n', '+0.3');
  }
  
  // Pad animasyonu
  function animatePad(pad) {
    pad.classList.add('active');
    
    setTimeout(() => {
      pad.classList.remove('active');
    }, 300);
  }
  
  // Oyunu bitir
  function endGame(completed = false) {
    gameActive = false;
    
    // Sonuç ekranını hazırla
    prepareResultScreen(completed);
    
    // UI güncelle
    hideGameContainer();
    showGameOverScreen();
    
    // Sonucu kaydet
    saveScore();
  }
  
  // Sonuç ekranını hazırla
  function prepareResultScreen(completed) {
    // Sonuç verilerini ata
    finalScore.textContent = score;
    finalLevel.textContent = currentLevel - 1;
    finalLength.textContent = maxSequenceReached;
    
    // Başlığı ayarla
    if (completed) {
      gameResultTitle.textContent = 'Tebrikler! Tüm Seviyeleri Tamamladınız!';
    } else {
      gameResultTitle.textContent = 'Oyun Tamamlandı!';
    }
    
    // Yıldız derecesini hesapla
    const maxLevel = DIFFICULTIES[difficulty].maxLevel;
    const levelRatio = (currentLevel - 1) / maxLevel;
    const correctRatio = correctAnswers / (currentLevel - 1);
    
    let stars = 0;
    if (completed || (levelRatio >= 0.9 && correctRatio >= 0.9)) stars = 5;
    else if (levelRatio >= 0.75 && correctRatio >= 0.8) stars = 4;
    else if (levelRatio >= 0.6 && correctRatio >= 0.7) stars = 3;
    else if (levelRatio >= 0.4 && correctRatio >= 0.6) stars = 2;
    else stars = 1;
    
    // Yıldızları göster
    updateRatingStarsDisplay(stars);
    
    // Puan değerlendirme metni
    const ratingTexts = ['Geliştirebilirsin', 'İyi', 'Harika', 'Mükemmel', 'Olağanüstü!'];
    ratingText.textContent = ratingTexts[Math.min(stars - 1, 4)];
    
    // Başarım kontrolü
    checkAchievements();
  }
  
  // Başarımları kontrol et
  function checkAchievements() {
    let achievement = null;
    
    if (maxSequenceReached >= 10) {
      achievement = {
        name: 'Müzikal Hafıza',
        description: '10 sesi doğru hatırladın!'
      };
    } else if (correctAnswers >= 10) {
      achievement = {
        name: 'Kulak Maestrosu',
        description: '10 seviyeyi doğru tamamladın!'
      };
    } else if (score >= 5000) {
      achievement = {
        name: 'Ses Virtüözü',
        description: '5000 puan barajını aştın!'
      };
    }
    
    if (achievement) {
      showAchievement(achievement);
    } else {
      gameAchievement.style.display = 'none';
    }
  }
  
  // Başarımı göster
  function showAchievement(achievement) {
    achievementName.textContent = achievement.name;
    gameAchievement.style.display = 'flex';
  }
  
  // Yıldız derecelendirmesini güncelle
  function updateRatingStarsDisplay(starsCount) {
    const stars = ratingStars.querySelectorAll('i');
    
    for (let i = 0; i < stars.length; i++) {
      if (i < starsCount) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    if (score <= 0) return;
    
    // Oyun türü için backend'de tanımlı ID
    const gameType = 'audioMemory';
    
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score
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
  
  // Skoru kopyala
  function copyScore() {
    const scoreText = `Sesli Hafıza oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, En Uzun Dizi: ${maxSequenceReached}`;
    
    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showAlert('Skor kopyalandı!', 'success');
      })
      .catch(() => {
        showAlert('Kopyalama başarısız oldu', 'error');
      });
  }
  
  // Skoru paylaş
  function shareScore() {
    const scoreText = `Sesli Hafıza oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, En Uzun Dizi: ${maxSequenceReached}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'OmGame Skorumu Paylaş',
        text: scoreText,
      })
      .catch((error) => console.log('Sharing failed', error));
    } else {
      copyScore();
    }
  }
  
  // Oyunu sıfırla
  function resetGame() {
    // Oyunu tekrar başlat
    hideGameOverScreen();
    startGame();
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    // Pause menüsünü kapat
    pauseOverlay.style.display = 'none';
    gamePaused = false;
    
    // Yeniden başlat
    startGame();
  }
  
  // Duraklatma durumunu değiştir
  function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      pauseOverlay.style.display = 'flex';
    } else {
      pauseOverlay.style.display = 'none';
    }
  }
  
  // Bildirim göster
  function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.remove();
      }, 300);
    }, 2000);
  }
  
  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    const maxLevel = DIFFICULTIES[difficulty].maxLevel;
    const progress = ((currentLevel - 1) / maxLevel) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
  }
  
  // Skor göstergesini güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // Doğru sayısı göstergesini güncelle
  function updateCorrectDisplay() {
    correctDisplay.textContent = correctAnswers;
  }
  
  // UI güncelle
  function updateUI() {
    updateScoreDisplay();
    updateCorrectDisplay();
    levelDisplay.textContent = currentLevel;
  }
  
  // UI yardımcı fonksiyonlar
  function hideIntro() {
    introSection.style.display = 'none';
  }
  
  function showGameContainer() {
    gameContainer.style.display = 'block';
  }
  
  function hideGameContainer() {
    gameContainer.style.display = 'none';
  }
  
  function showGameOverScreen() {
    gameOverContainer.style.display = 'block';
  }
  
  function hideGameOverScreen() {
    gameOverContainer.style.display = 'none';
  }
  
  // CSS Stilleri Ekle
  function addStyles() {
    if (!document.getElementById('audio-memory-styles')) {
      const styles = document.createElement('style');
      styles.id = 'audio-memory-styles';
      styles.textContent = `
        .audio-memory-play-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }
        
        .sequence-status {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .countdown-display {
          font-size: 1.5rem;
          font-weight: 700;
          color: #6a5ae0;
          animation: pulse 1.5s infinite;
        }
        
        .recall-message {
          font-size: 1.5rem;
          font-weight: 700;
          color: #5cb85c;
          margin-bottom: 10px;
        }
        
        .audio-pads-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 20px;
          max-width: 500px;
          width: 100%;
          margin: 0 auto;
        }
        
        .audio-pad {
          position: relative;
          width: 100%;
          padding-bottom: 100%; /* Aspect ratio 1:1 */
          border-radius: 15px;
          cursor: pointer;
          box-shadow: 0 8px 0 rgba(0, 0, 0, 0.2);
          transition: all 0.1s ease;
          background-color: var(--pad-color);
          user-select: none;
          overflow: hidden;
        }
        
        .pad-inner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.1);
          transition: background 0.2s ease;
        }
        
        .audio-pad:hover .pad-inner {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .audio-pad.active {
          transform: translateY(4px);
          box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
        }
        
        .audio-pad.active .pad-inner {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .phase-indicator {
          background-color: rgba(106, 90, 224, 0.2);
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 1rem;
          display: inline-block;
          color: white;
          font-weight: 600;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        /* Responsive styles */
        @media (max-width: 576px) {
          .audio-pads-grid {
            grid-gap: 10px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  // Oyunu başlat
  initEventListeners();
  addStyles();
});