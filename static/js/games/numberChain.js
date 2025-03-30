/**
 * Sayı Zinciri Oyunu - 1.0
 * 
 * Çalışma belleğini ve sayı dizisi hatırlama yeteneğini geliştiren oyun.
 * 
 * Özellikler:
 * - Artan zorluk seviyelerinde sayı dizileri
 * - Görsel ve işitsel hafızayı destekleyen sunum
 * - Farklı puan mekanizmaları
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
  const soundToggleBtn = document.getElementById('sound-toggle');
  const pauseOverlay = document.getElementById('pause-overlay');
  const difficultyButtons = document.querySelectorAll('.level-btn');
  
  // Oyun alanı elementleri
  const sequenceDisplay = document.getElementById('sequence-display');
  const countdownDisplay = document.getElementById('countdown-display');
  const answerContainer = document.getElementById('answer-container');
  const numberButtonsGrid = document.getElementById('number-buttons');
  const userSequenceDisplay = document.getElementById('user-sequence');
  const clearBtn = document.getElementById('clear-btn');
  const submitAnswerBtn = document.getElementById('submit-answer');
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
  let soundEnabled = true;
  let difficulty = 'EASY';
  let currentLevel = 1;
  let maxSequenceReached = 0;
  let correctAnswers = 0;
  let currentPhase = 'observe'; // 'observe' veya 'recall'
  let score = 0;
  let currentSequence = [];
  let userSequence = [];
  let countdownTimer = null;
  
  // Oyun parametreleri
  const DIFFICULTIES = {
    EASY: {
      initialLength: 3,
      maxLevel: 10,
      observeTime: 800, // ms
      numberRange: 9, // 1-9 arası
      timePerDigit: 1000, // ms
      bonusPoints: 10
    },
    MEDIUM: {
      initialLength: 4,
      maxLevel: 15,
      observeTime: 700,
      numberRange: 9,
      timePerDigit: 800,
      bonusPoints: 15
    },
    HARD: {
      initialLength: 5,
      maxLevel: 20,
      observeTime: 600,
      numberRange: 9,
      timePerDigit: 600,
      bonusPoints: 20
    }
  };
  
  // Event Listeners
  function initEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    soundToggleBtn.addEventListener('click', toggleSound);
    clearBtn.addEventListener('click', clearUserSequence);
    submitAnswerBtn.addEventListener('click', checkAnswer);
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
    
    // Duyarlı tasarım için pencere yeniden boyutlandırma olayı
    window.addEventListener('resize', adjustLayout);
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
    createNumberButtons();
    startLevel();
  }
  
  // Seviyeyi başlat
  function startLevel() {
    const params = DIFFICULTIES[difficulty];
    
    // Sequence uzunluğunu hesapla (seviyeyle artar)
    const sequenceLength = params.initialLength + Math.floor((currentLevel - 1) / 2);
    if (sequenceLength > maxSequenceReached) {
      maxSequenceReached = sequenceLength;
    }
    
    // UI güncelleme
    levelDisplay.textContent = currentLevel;
    sequenceLengthDisplay.textContent = sequenceLength;
    updateProgressBar();
    
    // Yeni bir sayı dizisi oluştur
    generateSequence(sequenceLength, params.numberRange);
    
    // İzleme fazını başlat
    startObservePhase();
  }
  
  // Sayı butonlarını oluştur
  function createNumberButtons() {
    numberButtonsGrid.innerHTML = '';
    
    // 1-9 arası butonlar
    for (let i = 1; i <= 9; i++) {
      const button = document.createElement('button');
      button.className = 'number-button';
      button.textContent = i;
      button.dataset.number = i;
      
      button.addEventListener('click', function() {
        if (currentPhase === 'recall' && gameActive && !gamePaused) {
          addNumberToUserSequence(parseInt(this.dataset.number));
        }
      });
      
      numberButtonsGrid.appendChild(button);
    }
    
    // 0 butonu
    const zeroButton = document.createElement('button');
    zeroButton.className = 'number-button';
    zeroButton.textContent = '0';
    zeroButton.dataset.number = 0;
    zeroButton.addEventListener('click', function() {
      if (currentPhase === 'recall' && gameActive && !gamePaused) {
        addNumberToUserSequence(0);
      }
    });
    
    // 0 butonunu ortala
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-button-space';
    numberButtonsGrid.appendChild(emptyDiv);
    numberButtonsGrid.appendChild(zeroButton);
  }
  
  // Rastgele sequence oluştur
  function generateSequence(length, range) {
    currentSequence = [];
    for (let i = 0; i < length; i++) {
      // 0 ile range arasında rastgele bir sayı
      const randomNum = Math.floor(Math.random() * (range + 1));
      currentSequence.push(randomNum);
    }
    userSequence = [];
  }
  
  // İzleme fazını başlat
  function startObservePhase() {
    currentPhase = 'observe';
    phaseText.textContent = 'Sayıları İzle';
    
    // Kullanıcı giriş alanını gizle
    answerContainer.style.display = 'none';
    sequenceDisplay.style.display = 'block';
    sequenceDisplay.textContent = '';
    
    // Sayı dizisini göster (birer birer)
    displaySequence();
  }
  
  // Sayı dizisini göster
  function displaySequence() {
    const params = DIFFICULTIES[difficulty];
    
    // Her bir sayıyı belli aralıklarla göster
    let index = 0;
    
    function showNextNumber() {
      if (index < currentSequence.length) {
        sequenceDisplay.textContent = currentSequence[index];
        playSound('number');
        
        // Bir sonraki sayıyı göster
        setTimeout(() => {
          sequenceDisplay.textContent = '';
          setTimeout(() => {
            index++;
            showNextNumber();
          }, params.observeTime / 2);
        }, params.observeTime);
      } else {
        // Tüm sayılar gösterildi, hatırlama fazına geç
        setTimeout(() => {
          startRecallPhase();
        }, 500);
      }
    }
    
    // İlk sayıyı göster
    showNextNumber();
  }
  
  // Hatırlama fazını başlat
  function startRecallPhase() {
    currentPhase = 'recall';
    phaseText.textContent = 'Sayıları Hatırla';
    
    // Sayı dizisini gizle ve kullanıcı giriş alanını göster
    sequenceDisplay.style.display = 'none';
    answerContainer.style.display = 'block';
    userSequenceDisplay.innerHTML = '';
    
    // Kullanıcı giriş alanını temizle
    clearUserSequence();
  }
  
  // Kullanıcı dizisine sayı ekle
  function addNumberToUserSequence(number) {
    if (userSequence.length >= currentSequence.length) {
      return; // Maksimum uzunluğa ulaşıldı
    }
    
    userSequence.push(number);
    updateUserSequenceDisplay();
    playSound('click');
    
    // Kullanıcı tüm sayıları girdiyse otomatik kontrol et
    if (userSequence.length === currentSequence.length) {
      setTimeout(() => {
        checkAnswer();
      }, 500);
    }
  }
  
  // Kullanıcı dizisini temizle
  function clearUserSequence() {
    userSequence = [];
    updateUserSequenceDisplay();
  }
  
  // Kullanıcı dizisi göstergesini güncelle
  function updateUserSequenceDisplay() {
    userSequenceDisplay.innerHTML = '';
    
    userSequence.forEach(number => {
      const numberElement = document.createElement('span');
      numberElement.className = 'number-element';
      numberElement.textContent = number;
      userSequenceDisplay.appendChild(numberElement);
    });
    
    // Placeholder elemanlar ekle
    for (let i = userSequence.length; i < currentSequence.length; i++) {
      const placeholder = document.createElement('span');
      placeholder.className = 'number-placeholder';
      placeholder.textContent = '_';
      userSequenceDisplay.appendChild(placeholder);
    }
  }
  
  // Kullanıcı cevabını kontrol et
  function checkAnswer() {
    // Kullanıcı tüm sayıları girmemiş ise
    if (userSequence.length < currentSequence.length) {
      showAlert('Tüm sayıları girmelisiniz!', 'warning');
      return;
    }
    
    // Cevabın doğru olup olmadığını kontrol et
    let correct = true;
    for (let i = 0; i < currentSequence.length; i++) {
      if (userSequence[i] !== currentSequence[i]) {
        correct = false;
        break;
      }
    }
    
    if (correct) {
      // Doğru cevap
      correctAnswers++;
      
      // Puan hesapla
      const params = DIFFICULTIES[difficulty];
      const sequenceLength = currentSequence.length;
      const basePoints = sequenceLength * 50;
      const levelBonus = currentLevel * params.bonusPoints;
      const difficultyBonus = {
        'EASY': 1,
        'MEDIUM': 1.5,
        'HARD': 2
      }[difficulty];
      
      const pointsEarned = Math.round((basePoints + levelBonus) * difficultyBonus);
      score += pointsEarned;
      
      // Animasyon ve UI güncelleme
      showAlert(`Doğru! +${pointsEarned} Puan`, 'success');
      playSound('correct');
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
    } else {
      // Yanlış cevap
      playSound('wrong');
      showAlert('Yanlış! Doğru sıra: ' + currentSequence.join(' '), 'danger');
      
      // Oyun sona erdi
      setTimeout(() => {
        endGame(false);
      }, 2000);
    }
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
        name: 'Hafıza Dehası',
        description: '10 basamaklı sayı dizisini hatırladın!'
      };
    } else if (correctAnswers >= 10) {
      achievement = {
        name: 'Profesyonel Hafıza',
        description: '10 seviyeyi doğru tamamladın!'
      };
    } else if (score >= 5000) {
      achievement = {
        name: 'Sayı Ustası',
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
    const gameType = 'numberChain';
    
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
    const scoreText = `Sayı Zinciri oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, En Uzun Zincir: ${maxSequenceReached}`;
    
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
    const scoreText = `Sayı Zinciri oyununda ${score} puan kazandım! Seviye: ${currentLevel - 1}, En Uzun Zincir: ${maxSequenceReached}`;
    
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
  
  // Sesi açıp kapat
  function toggleSound() {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundToggleBtn.classList.add('active');
    } else {
      soundToggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundToggleBtn.classList.remove('active');
    }
  }
  
  // Ses çal
  function playSound(soundName) {
    if (!soundEnabled) return;
    
    const sounds = {
      number: new Audio('/static/sounds/number.mp3'),
      click: new Audio('/static/sounds/click.mp3'),
      correct: new Audio('/static/sounds/correct.mp3'),
      wrong: new Audio('/static/sounds/wrong.mp3'),
      levelUp: new Audio('/static/sounds/level-up.mp3')
    };
    
    if (sounds[soundName]) {
      sounds[soundName].volume = 0.5;
      sounds[soundName].play().catch(e => console.log('Sound play error:', e));
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
  
  // Sayfa boyutuna göre düzeni ayarla
  function adjustLayout() {
    // Mobil cihazlarda boyutları küçült
    if (window.innerWidth <= 576) {
      numberButtonsGrid.classList.add('small-buttons');
    } else {
      numberButtonsGrid.classList.remove('small-buttons');
    }
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
    if (!document.getElementById('number-chain-styles')) {
      const styles = document.createElement('style');
      styles.id = 'number-chain-styles';
      styles.textContent = `
        .number-chain-display-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          min-height: 180px;
        }
        
        .sequence-display {
          font-size: 5rem;
          font-weight: 700;
          color: #6a5ae0;
          background: rgba(33, 33, 61, 0.2);
          border-radius: 15px;
          padding: 20px 40px;
          min-width: 150px;
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .countdown-display {
          font-size: 3rem;
          font-weight: 700;
          color: #ff4d6b;
          margin-top: 15px;
        }
        
        .number-chain-answer-container {
          background: rgba(33, 33, 61, 0.2);
          border-radius: 15px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .number-buttons-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-gap: 10px;
          margin-bottom: 20px;
        }
        
        .number-button {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, rgba(106, 90, 224, 0.9), rgba(90, 103, 216, 0.9));
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          margin: 0 auto;
        }
        
        .number-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        
        .number-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .answer-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .user-sequence {
          background: rgba(33, 33, 61, 0.4);
          border-radius: 10px;
          padding: 10px 20px;
          min-height: 60px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex: 1;
          margin-right: 15px;
        }
        
        .number-element {
          background: rgba(106, 90, 224, 0.8);
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: popIn 0.3s ease;
        }
        
        .number-placeholder {
          color: rgba(255, 255, 255, 0.4);
          font-size: 1.5rem;
          font-weight: 700;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .control-btn {
          background: rgba(33, 33, 61, 0.6);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-btn:hover {
          background: rgba(33, 33, 61, 0.8);
        }
        
        .submit-btn {
          background: linear-gradient(135deg, #5cb85c, #3e8f3e);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 15px 30px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .submit-btn:hover {
          background: linear-gradient(135deg, #4cae4c, #2d682d);
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        
        .submit-btn:active {
          transform: translateY(1px);
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
        
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .sequence-display {
            font-size: 4rem;
            padding: 15px 30px;
            min-width: 120px;
            min-height: 120px;
          }
          
          .number-buttons-grid.small-buttons .number-button {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }
          
          .user-sequence {
            padding: 8px 15px;
            min-height: 50px;
          }
          
          .number-element, .number-placeholder {
            width: 35px;
            height: 35px;
            font-size: 1.3rem;
          }
        }
        
        @media (max-width: 576px) {
          .sequence-display {
            font-size: 3.5rem;
            padding: 10px 20px;
            min-width: 100px;
            min-height: 100px;
          }
          
          .number-buttons-grid.small-buttons .number-button {
            width: 45px;
            height: 45px;
            font-size: 1.3rem;
          }
          
          .answer-display {
            flex-direction: column;
            gap: 10px;
          }
          
          .user-sequence {
            margin-right: 0;
            margin-bottom: 10px;
            width: 100%;
          }
          
          .control-btn {
            width: 100%;
            justify-content: center;
          }
          
          .submit-btn {
            padding: 12px 20px;
            font-size: 1rem;
          }
          
          .number-element, .number-placeholder {
            width: 30px;
            height: 30px;
            font-size: 1.1rem;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  // Oyunu başlat
  initEventListeners();
  addStyles();
  adjustLayout();
});