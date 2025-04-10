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
  
  // Ses sistemi
  const sounds = {};
  let soundsLoaded = false;
  
  // Sesleri yükle
  function loadSounds() {
    try {
      sounds.number = new Audio('/static/sounds/number.mp3');
      sounds.click = new Audio('/static/sounds/click.mp3');
      sounds.correct = new Audio('/static/sounds/correct.mp3');
      sounds.wrong = new Audio('/static/sounds/wrong.mp3');
      sounds.levelUp = new Audio('/static/sounds/level-up.mp3');
      
      // Sesleri önceden başlat (bir kullanıcı etkileşimi sırasında)
      soundToggleBtn.addEventListener('mousedown', function() {
        sounds.click.volume = 0;
        sounds.click.play().catch(e => {});
      }, { once: true });
      
      soundsLoaded = true;
      return true;
    } catch (error) {
      console.log("Ses yükleme hatası:", error);
      soundsLoaded = false;
      return false;
    }
  }
  
  // Sesleri yükle
  loadSounds();
  
  // Ses çal (güvenli)
  function playSound(soundName) {
    if (!soundEnabled || !soundsLoaded || !sounds[soundName]) return;
    
    try {
      // Her durumda yeni ses objeleri oluştur
      const tempSound = new Audio(sounds[soundName].src);
      tempSound.volume = 0.5;
      
      const playPromise = tempSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Bir kullanıcı etkileşimi gerektiğinde ses çalmaya çalışırsa hata verebilir
          // Bu beklenen bir durum, sessizce devam et
        });
      }
    } catch (error) {
      // Ses çalma hatası, sessizce devam et
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
// Sayı Zinciri (Number Chain) Oyunu
document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start-game');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const levelDisplays = document.querySelectorAll('.level-btn');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const sequenceDisplay = document.getElementById('sequence-display');
  const userInputContainer = document.getElementById('user-input-container');
  const levelElement = document.getElementById('level-display');
  const resultContainer = document.getElementById('result-container');
  const resultMessage = document.getElementById('result-message');
  const resultScore = document.getElementById('result-score');
  const nextLevelBtn = document.getElementById('next-level-btn');
  const gameOverBtn = document.getElementById('game-over-btn');
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    number: new Audio('/static/sounds/number.mp3')
  };

  // Ses oynatma fonksiyonu
  function playSound(sound) {
    try {
      sounds[sound].currentTime = 0;
      sounds[sound].play().catch(err => console.log("Sound play error:", err));
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }
  
  // Oyun durumu
  let gameState = {
    isPlaying: false,
    level: 1,
    score: 0,
    currentSequence: [],
    userSequence: [],
    showingSequence: false,
    inputEnabled: false,
    difficulty: 'EASY',
    lives: 3,
    maxLevel: 20
  };
  
  // Zorluk ayarları
  const difficultySettings = {
    EASY: {
      initialLength: 3,
      timePerNumber: 1000,
      scoreMultiplier: 1,
      maxNumbers: 10, // Bir seviyede gösterilecek max sayı
      numbersPerLevel: 1 // Her seviyede kaç sayı eklenecek
    },
    MEDIUM: {
      initialLength: 4,
      timePerNumber: 800,
      scoreMultiplier: 1.5,
      maxNumbers: 12,
      numbersPerLevel: 1
    },
    HARD: {
      initialLength: 5,
      timePerNumber: 600,
      scoreMultiplier: 2,
      maxNumbers: 15,
      numbersPerLevel: 2
    }
  };
  
  // Zorluk seviyesi butonları
  levelDisplays.forEach(button => {
    button.addEventListener('click', function() {
      levelDisplays.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      gameState.difficulty = this.getAttribute('data-level');
      playSound('click');
    });
  });
  
  // Oyunu başlat butonu
  startButton.addEventListener('click', function() {
    playSound('click');
    startGame();
  });
  
  // Sonraki seviye butonu
  nextLevelBtn.addEventListener('click', function() {
    playSound('click');
    startNextLevel();
  });
  
  // Oyun sonu butonu
  gameOverBtn.addEventListener('click', function() {
    playSound('click');
    finishGame();
  });
  
  // Oyunu başlat
  function startGame() {
    // Oyun durumunu sıfırla
    gameState.isPlaying = true;
    gameState.level = 1;
    gameState.score = 0;
    gameState.userSequence = [];
    gameState.lives = 3;
    
    // Ekranı güncelle
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    
    levelElement.textContent = '1';
    updateScoreDisplay();
    updateLivesDisplay();
    
    // İlk seviyeyi başlat
    startLevel();
  }
  
  // Seviyeyi başlat
  function startLevel() {
    // Seviye ekranını güncelle
    levelElement.textContent = gameState.level;
    
    // Zorluk ayarlarını al
    const settings = difficultySettings[gameState.difficulty];
    
    // Seviye uzunluğunu hesapla (başlangıç + seviye * artış)
    const additionalNumbers = (gameState.level - 1) * settings.numbersPerLevel;
    const sequenceLength = Math.min(
      settings.initialLength + additionalNumbers,
      settings.maxNumbers
    );
    
    // Yeni dizi oluştur
    gameState.currentSequence = generateSequence(sequenceLength);
    gameState.userSequence = [];
    
    // Sayı ekranını temizle
    sequenceDisplay.innerHTML = '';
    userInputContainer.innerHTML = '';
    
    // Diziyi göster
    showSequence();
  }
  
  // Diziyi göster
  function showSequence() {
    gameState.showingSequence = true;
    gameState.inputEnabled = false;
    
    // Arka planı karartma efekti
    sequenceDisplay.classList.add('sequence-active');
    
    // "Sırayı İzleyin" mesajını göster
    const watchMessage = document.createElement('div');
    watchMessage.className = 'watch-message';
    watchMessage.innerHTML = '<i class="fas fa-eye"></i> Sırayı İzleyin';
    sequenceDisplay.appendChild(watchMessage);
    
    // Sayma animasyonu
    let countdownValue = 3;
    const countdownElement = document.createElement('div');
    countdownElement.className = 'countdown';
    countdownElement.textContent = countdownValue;
    sequenceDisplay.appendChild(countdownElement);
    
    const countdownInterval = setInterval(() => {
      countdownValue--;
      countdownElement.textContent = countdownValue;
      
      if (countdownValue === 0) {
        clearInterval(countdownInterval);
        
        // Mesajları kaldır
        sequenceDisplay.innerHTML = '';
        
        // Diziyi göstermeye başla
        showSequenceNumbers();
      }
    }, 1000);
  }
  
  // Dizi sayılarını sırayla göster
  function showSequenceNumbers() {
    // Sayıları gösterme zamanı
    const settings = difficultySettings[gameState.difficulty];
    const displayTime = settings.timePerNumber;
    
    gameState.currentSequence.forEach((number, index) => {
      setTimeout(() => {
        // Önceki sayıyı temizle
        sequenceDisplay.innerHTML = '';
        
        // Sayıyı göster
        const numberElement = document.createElement('div');
        numberElement.className = 'sequence-number';
        numberElement.textContent = number;
        sequenceDisplay.appendChild(numberElement);
        
        // Sayı sesi çal
        playSound('number');
        
        // Son sayıdan sonra giriş moduna geç
        if (index === gameState.currentSequence.length - 1) {
          setTimeout(() => {
            sequenceDisplay.innerHTML = '';
            sequenceDisplay.classList.remove('sequence-active');
            setupUserInput();
          }, displayTime);
        }
      }, index * displayTime);
    });
  }
  
  // Kullanıcı giriş alanını hazırla
  function setupUserInput() {
    gameState.showingSequence = false;
    gameState.inputEnabled = true;
    
    // Giriş mesajı
    const inputMessage = document.createElement('div');
    inputMessage.className = 'input-message';
    inputMessage.innerHTML = '<i class="fas fa-keyboard"></i> Gördüğünüz Sayıları Sırayla Girin';
    sequenceDisplay.appendChild(inputMessage);
    
    // Sayı tuşlarını oluştur (1-9, 0)
    const numberPad = document.createElement('div');
    numberPad.className = 'number-pad';
    
    for (let i = 1; i <= 9; i++) {
      createNumberButton(i, numberPad);
    }
    
    createNumberButton(0, numberPad);
    
    userInputContainer.appendChild(numberPad);
    
    // Mevcut kullanıcı sırası ekranı
    const userSequenceDisplay = document.createElement('div');
    userSequenceDisplay.className = 'user-sequence-display';
    userSequenceDisplay.id = 'user-sequence-display';
    userInputContainer.appendChild(userSequenceDisplay);
    
    // Silme ve tamamlama butonları
    const controlButtons = document.createElement('div');
    controlButtons.className = 'control-buttons';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'control-button delete-btn';
    deleteButton.innerHTML = '<i class="fas fa-backspace"></i>';
    deleteButton.addEventListener('click', function() {
      if (!gameState.inputEnabled) return;
      
      playSound('click');
      
      if (gameState.userSequence.length > 0) {
        gameState.userSequence.pop();
        updateUserSequenceDisplay();
      }
    });
    
    const submitButton = document.createElement('button');
    submitButton.className = 'control-button submit-btn';
    submitButton.innerHTML = '<i class="fas fa-check"></i>';
    submitButton.addEventListener('click', function() {
      if (!gameState.inputEnabled) return;
      
      // Kullanıcı doğru sayıda rakam girdiyse kontrolü yap
      if (gameState.userSequence.length === gameState.currentSequence.length) {
        checkSequence();
      } else {
        showMessage('Tüm sayıları girmeniz gerekiyor!', 'warning');
      }
    });
    
    controlButtons.appendChild(deleteButton);
    controlButtons.appendChild(submitButton);
    
    userInputContainer.appendChild(controlButtons);
    
    // Ayrıca klavye desteği ekle
    document.addEventListener('keydown', handleKeyPress);
  }
  
  // Sayı tuşu oluştur
  function createNumberButton(number, container) {
    const button = document.createElement('button');
    button.className = 'number-button';
    button.textContent = number;
    
    button.addEventListener('click', function() {
      if (!gameState.inputEnabled) return;
      
      // Kullanıcı dizisi dolu değilse sayıyı ekle
      if (gameState.userSequence.length < gameState.currentSequence.length) {
        gameState.userSequence.push(number);
        playSound('click');
        updateUserSequenceDisplay();
        
        // Eğer tüm sayılar girildiyse otomatik kontrol et
        if (gameState.userSequence.length === gameState.currentSequence.length) {
          checkSequence();
        }
      }
    });
    
    container.appendChild(button);
  }
  
  // Klavye tuşları ile oynama desteği
  function handleKeyPress(event) {
    if (!gameState.inputEnabled) return;
    
    // Sayı tuşları (0-9)
    if (event.key >= '0' && event.key <= '9') {
      const number = parseInt(event.key);
      
      if (gameState.userSequence.length < gameState.currentSequence.length) {
        gameState.userSequence.push(number);
        playSound('click');
        updateUserSequenceDisplay();
        
        // Eğer tüm sayılar girildiyse otomatik kontrol et
        if (gameState.userSequence.length === gameState.currentSequence.length) {
          checkSequence();
        }
      }
    }
    
    // Backspace tuşu
    else if (event.key === 'Backspace') {
      if (gameState.userSequence.length > 0) {
        gameState.userSequence.pop();
        playSound('click');
        updateUserSequenceDisplay();
      }
    }
    
    // Enter tuşu
    else if (event.key === 'Enter') {
      if (gameState.userSequence.length === gameState.currentSequence.length) {
        checkSequence();
      } else {
        showMessage('Tüm sayıları girmeniz gerekiyor!', 'warning');
      }
    }
  }
  
  // Kullanıcı dizisi ekranını güncelle
  function updateUserSequenceDisplay() {
    const display = document.getElementById('user-sequence-display');
    display.innerHTML = '';
    
    gameState.userSequence.forEach(number => {
      const digit = document.createElement('span');
      digit.className = 'user-digit';
      digit.textContent = number;
      display.appendChild(digit);
    });
  }
  
  // Diziyi kontrol et
  function checkSequence() {
    gameState.inputEnabled = false;
    document.removeEventListener('keydown', handleKeyPress);
    
    // Doğru mu kontrol et
    let isCorrect = true;
    
    for (let i = 0; i < gameState.currentSequence.length; i++) {
      if (gameState.userSequence[i] !== gameState.currentSequence[i]) {
        isCorrect = false;
        break;
      }
    }
    
    // Temizle
    userInputContainer.innerHTML = '';
    
    if (isCorrect) {
      handleCorrectSequence();
    } else {
      handleWrongSequence();
    }
  }
  
  // Doğru dizi
  function handleCorrectSequence() {
    playSound('correct');
    
    // Puan hesapla
    const settings = difficultySettings[gameState.difficulty];
    const basePoints = gameState.currentSequence.length * 10;
    const levelBonus = gameState.level * 5;
    const difficultyBonus = Math.round(basePoints * (settings.scoreMultiplier - 1));
    
    const totalPoints = basePoints + levelBonus + difficultyBonus;
    gameState.score += totalPoints;
    
    updateScoreDisplay();
    
    // Başarı mesajı
    showSuccessMessage(totalPoints);
    
    // Son seviyeye ulaşıldı mı kontrol et
    if (gameState.level >= gameState.maxLevel) {
      showGameComplete();
    } else {
      // Sonraki seviye butonu
      nextLevelBtn.style.display = 'block';
      gameOverBtn.style.display = 'none';
      resultContainer.style.display = 'flex';
    }
  }
  
  // Yanlış dizi
  function handleWrongSequence() {
    playSound('wrong');
    
    // Can azalt
    gameState.lives--;
    updateLivesDisplay();
    
    if (gameState.lives <= 0) {
      // Oyun bitti
      showGameOver();
    } else {
      // Başarısız mesajı
      showFailureMessage();
      
      // Aynı seviyeyi tekrar dene
      setTimeout(() => {
        sequenceDisplay.innerHTML = '';
        // Aynı seviyeyi başlat
        startLevel();
      }, 2000);
    }
  }
  
  // Başarı mesajı göster
  function showSuccessMessage(points) {
    resultMessage.innerHTML = `<i class="fas fa-check-circle"></i> Mükemmel! Doğru sıra!`;
    resultScore.innerHTML = `+${points} puan kazandınız!`;
    
    if (gameState.level < gameState.maxLevel) {
      nextLevelBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${gameState.level + 1}. Seviyeye Geç`;
    } else {
      nextLevelBtn.innerHTML = `<i class="fas fa-check"></i> Oyunu Tamamla`;
    }
  }
  
  // Başarısız mesajı göster
  function showFailureMessage() {
    sequenceDisplay.innerHTML = '';
    
    const failureMessage = document.createElement('div');
    failureMessage.className = 'failure-message';
    failureMessage.innerHTML = `<i class="fas fa-times-circle"></i> Yanlış sıra!<br><span>Kalan Can: ${gameState.lives}</span>`;
    sequenceDisplay.appendChild(failureMessage);
    
    // Doğru sırayı göster
    const correctSequence = document.createElement('div');
    correctSequence.className = 'correct-sequence';
    
    const sequenceTitle = document.createElement('div');
    sequenceTitle.className = 'sequence-title';
    sequenceTitle.textContent = 'Doğru Sıra:';
    correctSequence.appendChild(sequenceTitle);
    
    const sequenceNumbers = document.createElement('div');
    sequenceNumbers.className = 'sequence-numbers';
    
    gameState.currentSequence.forEach(number => {
      const digit = document.createElement('span');
      digit.className = 'correct-digit';
      digit.textContent = number;
      sequenceNumbers.appendChild(digit);
    });
    
    correctSequence.appendChild(sequenceNumbers);
    sequenceDisplay.appendChild(correctSequence);
  }
  
  // Oyun tamamlandı mesajı
  function showGameComplete() {
    playSound('success');
    
    resultMessage.innerHTML = `<i class="fas fa-trophy"></i> Tebrikler! Tüm Seviyeleri Tamamladınız!`;
    resultScore.innerHTML = `Toplam Puanınız: ${gameState.score}`;
    
    nextLevelBtn.style.display = 'none';
    gameOverBtn.style.display = 'block';
    gameOverBtn.innerHTML = `<i class="fas fa-check"></i> Oyunu Bitir`;
    
    resultContainer.style.display = 'flex';
  }
  
  // Oyun bitti mesajı
  function showGameOver() {
    playSound('gameOver');
    
    resultMessage.innerHTML = `<i class="fas fa-heart-broken"></i> Oyun Bitti!`;
    resultScore.innerHTML = `Toplam Puanınız: ${gameState.score}`;
    
    nextLevelBtn.style.display = 'none';
    gameOverBtn.style.display = 'block';
    gameOverBtn.innerHTML = `<i class="fas fa-check"></i> Oyunu Bitir`;
    
    resultContainer.style.display = 'flex';
  }
  
  // Sonraki seviyeyi başlat
  function startNextLevel() {
    gameState.level++;
    resultContainer.style.display = 'none';
    startLevel();
  }
  
  // Oyunu bitir
  function finishGame() {
    // Sonuç ekranını hazırla
    const gameResults = document.getElementById('game-results');
    if (gameResults) {
      const finalScore = gameState.score;
      const resultsHTML = `
        <div class="result-card">
          <h3>Oyun Bitti!</h3>
          <div class="result-details">
            <p>Skorunuz: <strong>${finalScore}</strong></p>
            <p>Ulaştığınız seviye: <strong>${gameState.level}</strong></p>
            <p>Doğru sayı: <strong>${gameState.correctAnswers}</strong></p>
          </div>
          <div class="rating">
            <div id="rating-stars">
              ${getRatingStars(finalScore)}
            </div>
            <p id="rating-text">${getRatingText(finalScore)}</p>
          </div>
          <div class="game-results-footer">
            <button id="play-again" class="btn btn-primary btn-lg"><i class="fas fa-redo me-2"></i>Tekrar Oyna</button>
            <a href="/" id="go-home" class="btn btn-outline-primary btn-lg"><i class="fas fa-home me-2"></i>Ana Sayfa</a>
          </div>
        </div>
      `;
      
      gameResults.innerHTML = resultsHTML;
      document.getElementById('game-container').style.display = 'none';
      gameResults.style.display = 'block';
      
      // Tekrar oyna butonu etkinleştirme
      document.getElementById('play-again').addEventListener('click', () => {
        gameResults.style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        resetGame();
        startGame();
      });
    }
    
    // Skoru sunucuya gönder
    saveScore();
  }
  
  function getRatingStars(score) {
    const maxStars = 5;
    const starsCount = Math.min(Math.ceil(score / 200), maxStars);
    
    let starsHTML = '';
    for (let i = 0; i < maxStars; i++) {
      starsHTML += `<i class="${i < starsCount ? 'fas' : 'far'} fa-star"></i>`;
    }
    
    return starsHTML;
  }
  
  function getRatingText(score) {
    if (score < 200) return 'Başlangıç';
    if (score < 400) return 'İyi';
    if (score < 600) return 'Harika';
    if (score < 800) return 'Mükemmel';
    return 'Efsanevi!';
  }
  
  // Skoru kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'numberChain',
        score: gameState.score,
        difficulty: difficulty.toLowerCase(),
        playtime: Math.floor(Date.now() - gameState.startTime),
        game_stats: {
          level: currentLevel,
          sequence_length: maxSequenceReached,
          correct_answers: correctAnswers,
          completed: currentLevel > DIFFICULTIES[difficulty].maxLevel
        }
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
  
  // Skor ekranını güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }
  
  // Can ekranını güncelle
  function updateLivesDisplay() {
    const livesContainer = document.querySelector('.lives-display');
    
    if (livesContainer) {
      livesContainer.innerHTML = '';
      
      for (let i = 0; i < gameState.lives; i++) {
        const heartIcon = document.createElement('i');
        heartIcon.className = 'fas fa-heart';
        livesContainer.appendChild(heartIcon);
      }
    }
  }
  
  // Rastgele sayı dizisi oluştur
  function generateSequence(length) {
    const sequence = [];
    
    for (let i = 0; i < length; i++) {
      const digit = Math.floor(Math.random() * 10); // 0-9 arası sayılar
      sequence.push(digit);
    }
    
    return sequence;
  }
  
  // Mesaj göster
  function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    
    if (!messageContainer) return;
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    
    messageContainer.appendChild(message);
    
    // 3 saniye sonra kaybolsun
    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => {
        if (messageContainer.contains(message)) {
          messageContainer.removeChild(message);
        }
      }, 500);
    }, 3000);
  }
});
