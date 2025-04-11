/**
 * N-Back Testi - 1.0
 * 
 * Çalışma belleğini geliştirmek için tasarlanmış bilimsel bir test.
 * 
 * Özellikler:
 * - Farklı N değerlerine göre zorluk seviyeleri (1-back, 2-back, 3-back vb.)
 * - Görsel uyaranlar (harfler, şekiller, konumlar)
 * - İlerledikçe artan zorluk ve puan
 * - Kişiselleştirilmiş sonuçlar ve performans istatistikleri
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
  const stimulusDisplay = document.getElementById('stimulus-display');
  const matchButton = document.getElementById('match-button');
  const nLevelDisplay = document.getElementById('n-level-display');
  const trialCounter = document.getElementById('trial-counter');
  const trialProgressBar = document.getElementById('trial-progress-bar');
  
  // Skor göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const nValueDisplay = document.getElementById('n-value');
  const correctDisplay = document.getElementById('correct-display');
  const errorDisplay = document.getElementById('error-display');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  
  // Sonuç göstergeleri
  const finalScore = document.getElementById('final-score');
  const finalN = document.getElementById('final-n');
  const finalAccuracy = document.getElementById('final-accuracy');
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
  let currentN = 2; // default n-back değeri
  let maxNReached = 0;
  let score = 0;
  let correctResponses = 0;
  let incorrectResponses = 0;
  
  // Geçerli oturum değişkenleri
  let currentSession = [];
  let sessionTrials = [];
  let currentTrialIndex = 0;
  let totalTrials = 0;
  let currentStimulus = null;
  let stimulusInterval = null;
  let userResponse = false;
  let responseTimeout = null;
  
  // Oyun parametreleri
  const DIFFICULTIES = {
    EASY: {
      initialN: 1,
      maxN: 3,
      stimulusTime: 2500, // ms
      interStimulusInterval: 500, // ms
      stimulusTypes: ['LETTER'],
      trialsPerSession: 20,
      sessionsPerNLevel: 2,
      accuracy_threshold: 0.75
    },
    MEDIUM: {
      initialN: 2,
      maxN: 5,
      stimulusTime: 2000,
      interStimulusInterval: 500,
      stimulusTypes: ['LETTER'],
      trialsPerSession: 25,
      sessionsPerNLevel: 2,
      accuracy_threshold: 0.80
    },
    HARD: {
      initialN: 3,
      maxN: 7,
      stimulusTime: 1500,
      interStimulusInterval: 500,
      stimulusTypes: ['LETTER'],
      trialsPerSession: 30,
      sessionsPerNLevel: 2,
      accuracy_threshold: 0.85
    }
  };
  
  // Stimulus sets
  const STIMULUS_SETS = {
    LETTER: ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z'],
    NUMBER: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    SHAPE: ['KARE', 'DAİRE', 'ÜÇGEN', 'YILDIZ', 'ALTIGEN', 'KALP', 'BAKLİYE', 'ELMAS', 'ARTISIMGE']
  };
  
  // Event Listeners
  function initEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    pauseGameBtn.addEventListener('click', togglePause);
    resumeGameBtn.addEventListener('click', togglePause);
    restartGameBtn.addEventListener('click', restartGame);
    soundToggleBtn.addEventListener('click', toggleSound);
    matchButton.addEventListener('click', handleMatchResponse);
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
    
    // Klavye kısayolları
    document.addEventListener('keydown', function(e) {
      if (gameActive && !gamePaused) {
        if (e.code === 'Space') {
          e.preventDefault();
          handleMatchResponse();
        }
      }
    });
  }
  
  // Oyunu başlat
  function startGame() {
    gameActive = true;
    score = 0;
    correctResponses = 0;
    incorrectResponses = 0;
    
    // Başlangıç n-back seviyesini ayarla
    currentN = DIFFICULTIES[difficulty].initialN;
    maxNReached = currentN > maxNReached ? currentN : maxNReached;
    
    hideIntro();
    showGameContainer();
    updateUI();
    
    // İlk oturumu başlat
    startSession();
  }
  
  // Yeni oturum başlat
  function startSession() {
    const params = DIFFICULTIES[difficulty];
    
    // Oturum değişkenlerini sıfırla
    currentTrialIndex = 0;
    totalTrials = params.trialsPerSession;
    currentSession = [];
    sessionTrials = [];
    
    // Uyaranları oluştur
    generateTrials(totalTrials, currentN, params.stimulusTypes);
    
    // UI güncelleme
    nValueDisplay.textContent = currentN;
    nLevelDisplay.textContent = `${currentN}-BACK`;
    updateTrialProgress();
    
    // İlk uyaranı göster
    showNextStimulus();
  }
  
  // Deney setini oluştur
  function generateTrials(numTrials, n, stimulusTypes) {
    // Rastgele bir uyaran tipi seç
    const stimulusType = stimulusTypes[Math.floor(Math.random() * stimulusTypes.length)];
    const stimulusSet = STIMULUS_SETS[stimulusType];
    
    // Target eşleşme oranı (~30%)
    const targetTrials = Math.floor(numTrials * 0.3);
    const nonTargetTrials = numTrials - targetTrials;
    
    // İlk n uyaranı oluştur (bunlar target olamaz)
    for (let i = 0; i < n; i++) {
      const randomStimulus = stimulusSet[Math.floor(Math.random() * stimulusSet.length)];
      sessionTrials.push({
        stimulus: randomStimulus,
        isTarget: false,
        type: stimulusType
      });
    }
    
    // Kalan uyaranları oluştur
    let targetsAdded = 0;
    
    for (let i = n; i < numTrials; i++) {
      let isTarget = false;
      let stimulus;
      
      // Target eşleşme oranını kontrol et
      if (targetsAdded < targetTrials && Math.random() < 0.4) {
        isTarget = true;
        stimulus = sessionTrials[i - n].stimulus; // n önceki uyaranla aynı
        targetsAdded++;
      } else {
        // Rastgele uyaran seç, ama n öncekiyle aynı olmasın
        do {
          stimulus = stimulusSet[Math.floor(Math.random() * stimulusSet.length)];
        } while (stimulus === sessionTrials[i - n].stimulus);
      }
      
      sessionTrials.push({
        stimulus: stimulus,
        isTarget: isTarget,
        type: stimulusType
      });
    }
    
    // Son bir kontrol ve karıştırma (hedef triallerin dağılımı)
    checkAndAdjustTargets();
  }
  
  // Hedef triallerin dağılımını kontrol et ve düzelt
  function checkAndAdjustTargets() {
    // İlk n trial hedef olamaz
    for (let i = 0; i < currentN; i++) {
      sessionTrials[i].isTarget = false;
    }
    
    // Ardışık targetler olmamalı
    for (let i = currentN + 1; i < sessionTrials.length; i++) {
      if (sessionTrials[i].isTarget && sessionTrials[i-1].isTarget) {
        // Bir sonraki uyaran için rastgele bir değer seç
        const stimulusType = sessionTrials[i].type;
        const stimulusSet = STIMULUS_SETS[stimulusType];
        
        do {
          sessionTrials[i].stimulus = stimulusSet[Math.floor(Math.random() * stimulusSet.length)];
        } while (sessionTrials[i].stimulus === sessionTrials[i - currentN].stimulus);
        
        sessionTrials[i].isTarget = false;
      }
    }
  }
  
  // Bir sonraki uyaranı göster
  function showNextStimulus() {
    if (currentTrialIndex >= totalTrials) {
      endSession();
      return;
    }
    
    const params = DIFFICULTIES[difficulty];
    const trial = sessionTrials[currentTrialIndex];
    currentStimulus = trial;
    
    // Uyaranı göster
    stimulusDisplay.textContent = trial.stimulus;
    userResponse = false;
    
    // Süre sınırlaması
    if (responseTimeout) clearTimeout(responseTimeout);
    
    responseTimeout = setTimeout(() => {
      // Süre doldu, kullanıcı cevap vermedi
      evaluateResponse(false);
      
      // Sonraki uyarana geç
      setTimeout(() => {
        stimulusDisplay.textContent = '-';
        // Inter-stimulus interval
        setTimeout(showNextStimulus, params.interStimulusInterval);
      }, 200);
      
    }, params.stimulusTime);
  }
  
  // Kullanıcı eşleşme butonuna bastığında
  function handleMatchResponse() {
    if (!gameActive || gamePaused || currentTrialIndex >= totalTrials) return;
    
    userResponse = true;
    
    // Cevabı değerlendir
    evaluateResponse(true);
    
    // Süre ayarlayıcıyı temizle
    if (responseTimeout) clearTimeout(responseTimeout);
    
    // Sonraki uyarana geç
    const params = DIFFICULTIES[difficulty];
    
    setTimeout(() => {
      stimulusDisplay.textContent = '-';
      // Inter-stimulus interval
      setTimeout(showNextStimulus, params.interStimulusInterval);
    }, 200);
  }
  
  // Cevabı değerlendir
  function evaluateResponse(matchPressed) {
    const trial = currentStimulus;
    const isCorrect = (matchPressed === trial.isTarget);
    
    if (isCorrect) {
      // Doğru cevap
      correctResponses++;
      if (matchPressed) {
        // Doğru pozitif
        showFeedback(true);
        playSound('correct');
      } else {
        // Doğru negatif
      }
    } else {
      // Yanlış cevap
      incorrectResponses++;
      if (matchPressed) {
        // Yanlış pozitif
        showFeedback(false);
        playSound('wrong');
      } else {
        // Yanlış negatif (cevap vermedi ama vermesi gerekiyordu)
        if (trial.isTarget) {
          showFeedback(false);
        }
      }
    }
    
    // UI güncelle
    currentTrialIndex++;
    updateTrialProgress();
    updateCorrectErrorDisplays();
  }
  
  // Görsel geri bildirim göster
  function showFeedback(isCorrect) {
    stimulusDisplay.classList.add(isCorrect ? 'correct-feedback' : 'error-feedback');
    
    setTimeout(() => {
      stimulusDisplay.classList.remove('correct-feedback', 'error-feedback');
    }, 300);
  }
  
  // Oturum ilerleme çubuğunu güncelle
  function updateTrialProgress() {
    trialCounter.textContent = `${currentTrialIndex}/${totalTrials}`;
    const progress = (currentTrialIndex / totalTrials) * 100;
    trialProgressBar.style.width = `${progress}%`;
  }
  
  // Oturumu bitir
  function endSession() {
    // Sonuçları hesapla
    const totalResponses = correctResponses + incorrectResponses;
    const accuracy = totalResponses > 0 ? correctResponses / totalResponses : 0;
    
    // Puanı hesapla
    const basePoints = correctResponses * 20;
    const nBonus = currentN * 50;
    const accuracyBonus = Math.round(accuracy * 100);
    const difficultyMultiplier = {
      'EASY': 1,
      'MEDIUM': 1.5,
      'HARD': 2
    }[difficulty];
    
    const sessionScore = Math.round((basePoints + nBonus + accuracyBonus) * difficultyMultiplier);
    score += sessionScore;
    
    // Sonraki N seviyesini belirle
    const params = DIFFICULTIES[difficulty];
    let nextN = currentN;
    
    if (accuracy >= params.accuracy_threshold) {
      // Doğruluk yeterince yüksekse, seviyeyi artır
      nextN = Math.min(currentN + 1, params.maxN);
      showAlert(`Tebrikler! ${currentN}-Back seviyesini tamamladınız!`, 'success');
    } else if (accuracy < 0.6 && currentN > params.initialN) {
      // Doğruluk çok düşükse, seviyeyi düşür
      nextN = currentN - 1;
      showAlert(`${currentN}-Back seviyesi zorlandınız. Bir önceki seviyeye dönülüyor.`, 'info');
    } else {
      showAlert(`${currentN}-Back oturumu tamamlandı. Aynı seviyeye devam.`, 'info');
    }
    
    // Maksimum N değerini güncelle
    if (nextN > maxNReached) {
      maxNReached = nextN;
    }
    
    // Yeni N değerini ayarla
    currentN = nextN;
    
    // UI güncelle
    updateUI();
    
    // Tüm N seviyeleri tamamlandı mı kontrol et
    if (currentN > params.maxN || score >= 5000) {
      endGame(true);
    } else {
      // Yeni bir oturum başlat
      setTimeout(startSession, 2000);
    }
  }
  
  // Oyunu bitir
  function endGame(completed = false) {
    gameActive = false;
    
    // Süre ayarlayıcıları temizle
    if (responseTimeout) clearTimeout(responseTimeout);
    
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
    finalN.textContent = maxNReached;
    
    // Doğruluk oranını hesapla
    const totalResponses = correctResponses + incorrectResponses;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
    finalAccuracy.textContent = `${Math.round(accuracy)}%`;
    
    // Başlığı ayarla
    if (completed) {
      gameResultTitle.textContent = 'Tebrikler! Testi Başarıyla Tamamladınız!';
    } else {
      gameResultTitle.textContent = 'Test Tamamlandı!';
    }
    
    // Yıldız derecesini hesapla
    const params = DIFFICULTIES[difficulty];
    const nRatio = maxNReached / params.maxN;
    
    let stars = 0;
    if (maxNReached >= params.maxN && accuracy >= 90) stars = 5;
    else if (maxNReached >= params.maxN - 1 && accuracy >= 85) stars = 4;
    else if (maxNReached >= params.maxN - 2 && accuracy >= 80) stars = 3;
    else if (maxNReached >= params.initialN + 1 && accuracy >= 70) stars = 2;
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
    
    if (maxNReached >= 5) {
      achievement = {
        name: 'Çalışma Belleği Uzmanı',
        description: '5-Back seviyesine ulaştın!'
      };
    } else if (maxNReached >= 4) {
      achievement = {
        name: 'Zihin Jimnastiği',
        description: '4-Back seviyesini tamamladın!'
      };
    } else if (score >= 3000) {
      achievement = {
        name: 'N-Back Ustası',
        description: '3000 puan barajını aştın!'
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
      correct: new Audio('/static/sounds/correct.mp3'),
      wrong: new Audio('/static/sounds/wrong.mp3')
    };
    
    if (sounds[soundName]) {
      sounds[soundName].volume = 0.5;
      sounds[soundName].play().catch(e => console.log('Sound play error:', e));
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    if (score <= 0) return;
    
    // Oyun istatistiklerini hazırla
    const gameStats = {
      maxN: currentN,
      correctResponses: correctResponses,
      falsePositives: falsePositives,
      falseNegatives: falseNegatives,
      accuracy: calculateAccuracy()
    };
    
    // Merkezi puan sistemini kullan
    saveScoreAndDisplay('n_back', score, elapsedTime, difficulty, gameStats, function(html) {
      // Kaldırıldı - artık merkezi sistem tarafından işleniyor
      console.log('Score saved successfully');
    });
  }
  
  // Skoru kopyala
  function copyScore() {
    const scoreText = `N-Back Testinde ${score} puan kazandım! Maksimum N: ${maxNReached}, Doğruluk: ${finalAccuracy.textContent}`;
    
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
    const scoreText = `N-Back Testinde ${score} puan kazandım! Maksimum N: ${maxNReached}, Doğruluk: ${finalAccuracy.textContent}`;
    
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
      if (responseTimeout) clearTimeout(responseTimeout);
    } else {
      pauseOverlay.style.display = 'none';
      // Devam ettir - mevcut uyaranı göster
      showNextStimulus();
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
    }, 3000);
  }
  
  // İlerleme çubuğunu güncelle
  function updateProgressBar() {
    const maxN = DIFFICULTIES[difficulty].maxN;
    const progress = ((currentN - DIFFICULTIES[difficulty].initialN) / (maxN - DIFFICULTIES[difficulty].initialN)) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
  }
  
  // Skor göstergesini güncelle
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  // Doğru/yanlış sayı göstergelerini güncelle
  function updateCorrectErrorDisplays() {
    correctDisplay.textContent = correctResponses;
    errorDisplay.textContent = incorrectResponses;
  }
  
  // UI güncelle
  function updateUI() {
    updateScoreDisplay();
    updateCorrectErrorDisplays();
    nValueDisplay.textContent = currentN;
    nLevelDisplay.textContent = `${currentN}-BACK`;
    updateProgressBar();
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
    if (!document.getElementById('n-back-styles')) {
      const styles = document.createElement('style');
      styles.id = 'n-back-styles';
      styles.textContent = `
        .n-back-display-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
        }
        
        .session-progress {
          width: 100%;
          margin-bottom: 20px;
        }
        
        .stimulus-container {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(33, 33, 61, 0.2);
          border-radius: 15px;
          margin: 20px 0;
          position: relative;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .stimulus-display {
          font-size: 5rem;
          font-weight: 700;
          color: #6a5ae0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .stimulus-display.correct-feedback {
          color: #5cb85c;
          transform: scale(1.1);
        }
        
        .stimulus-display.error-feedback {
          color: #d9534f;
          transform: scale(1.1);
        }
        
        .response-buttons {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }
        
        .response-btn {
          padding: 12px 25px;
          border-radius: 10px;
          border: none;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .match-btn {
          background: linear-gradient(135deg, #5cb85c, #3e8f3e);
          color: white;
        }
        
        .match-btn:hover {
          background: linear-gradient(135deg, #4cae4c, #2d682d);
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        
        .match-btn:active {
          transform: translateY(1px);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        
        .n-back-indicator {
          background-color: rgba(106, 90, 224, 0.2);
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 1rem;
          display: inline-block;
          color: white;
          font-weight: 600;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .stimulus-container {
            width: 160px;
            height: 160px;
          }
          
          .stimulus-display {
            font-size: 4rem;
          }
        }
        
        @media (max-width: 576px) {
          .stimulus-container {
            width: 140px;
            height: 140px;
          }
          
          .stimulus-display {
            font-size: 3.5rem;
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