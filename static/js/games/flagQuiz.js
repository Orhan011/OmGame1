/**
 * Bayrak Tahmin Oyunu - v2.0
 * 
 * Dünya bayraklarını tahmin etmeye dayalı eğitici bir oyun
 * 
 * Özellikler:
 * - Farklı zorluk seviyelerinde 200'den fazla ülke bayrağı
 * - Çoktan seçmeli veya yazarak cevaplama modları
 * - Zamanlı veya zamansız oyun seçenekleri
 * - Detaylı skor sistemi
 * - Öğrenilen bayraklar takibi
 * - Kullanıcı istatistikleri
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startButton = document.getElementById('flagQuizStartButton');
  const restartButton = document.getElementById('flagQuizPlayAgain');
  const returnButton = document.getElementById('flagQuizReturnToMenu');
  const difficultyButtons = document.querySelectorAll('.difficulty-option');
  const timeButtons = document.querySelectorAll('.time-option');
  const modeButtons = document.querySelectorAll('.mode-option');
  const increaseFlagCountButton = document.getElementById('increaseFlagCount');
  const decreaseFlagCountButton = document.getElementById('decreaseFlagCount');
  const flagCountDisplay = document.querySelector('.fq-counter-display');
  const soundToggle = document.getElementById('flagQuizSoundToggle');
  
  const gameSettings = document.getElementById('flagQuizSettings');
  const gamePlay = document.getElementById('flagQuizGameplay');
  const gameOver = document.getElementById('flagQuizGameOver');
  
  const scoreDisplay = document.getElementById('flagQuizScore');
  const correctDisplay = document.getElementById('flagQuizCorrect');
  const wrongDisplay = document.getElementById('flagQuizWrong');
  const timerDisplay = document.getElementById('flagQuizTimer');
  const progressBar = document.getElementById('flagQuizProgress');
  
  const flagImage = document.getElementById('flagQuizCurrentFlag');
  const countryInfo = document.getElementById('flagQuizCountryInfo');
  const countryName = document.getElementById('flagQuizCountryName');
  const countryDetails = document.getElementById('flagQuizCountryDetails');
  
  const choicesContainer = document.getElementById('flagQuizChoices');
  const writeAnswerContainer = document.getElementById('flagQuizWriteAnswer');
  const answerInput = document.getElementById('flagQuizAnswerInput');
  const submitButton = document.getElementById('flagQuizSubmitAnswer');
  const skipButton = document.getElementById('flagQuizSkipQuestion');
  
  const feedbackContainer = document.getElementById('flagQuizFeedback');
  
  const finalScoreDisplay = document.getElementById('flagQuizFinalScore');
  const finalCorrectDisplay = document.getElementById('flagQuizFinalCorrect');
  const finalWrongDisplay = document.getElementById('flagQuizFinalWrong');
  const accuracyDisplay = document.getElementById('flagQuizAccuracy');
  const averageTimeDisplay = document.getElementById('flagQuizAverageTime');
  const personalBestDisplay = document.getElementById('flagQuizPersonalBestValue');
  const learnedFlagsContainer = document.getElementById('flagQuizLearnedFlags');
  
  // Oyun değişkenleri
  let gameState = {
    isPlaying: false,
    difficulty: 'medium', // easy, medium, hard
    timeLimit: 'normal', // none, relaxed, normal, challenge
    gameMode: 'choice', // choice, write
    flagCount: 10,
    soundEnabled: true,
    
    // Oyun istatistikleri
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    skippedAnswers: 0,
    currentFlagIndex: 0,
    timer: null,
    timeLeft: 0,
    startTime: 0,
    totalTime: 0,
    answerTimes: [],
    
    // Oyun verileri
    allCountries: [], // Tüm ülkeler listesi
    gameCountries: [], // Bu oyun için seçilen ülkeler
    currentCountry: null, // Şu anda gösterilen ülke
    currentOptions: [], // Çoktan seçmeli modda gösterilen seçenekler
    learnedFlags: [], // Öğrenilen bayraklar
    
    // Kullanıcı istatistikleri
    personalBest: 0 // Kişisel en yüksek skor
  };
  
  // Zorluk seviyelerine göre ülke grupları
  const difficultyGroups = {
    easy: [
      // Yaygın olarak bilinen/tanınan ülkeler
      'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 
      'Italy', 'Spain', 'Russia', 'China', 'Japan', 'Australia', 'Brazil', 
      'Mexico', 'India', 'South Africa', 'Egypt', 'Turkey', 'Greece', 
      'South Korea', 'Saudi Arabia', 'Sweden', 'Switzerland', 'Netherlands', 
      'Belgium', 'Portugal', 'Ireland', 'New Zealand', 'Poland', 'Austria', 'Norway'
    ],
    medium: [
      // Orta zorlukta ülkeler
      'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Uruguay', 
      'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines', 'Singapore', 
      'Pakistan', 'Bangladesh', 'Sri Lanka', 'Ukraine', 'Czech Republic', 'Hungary', 
      'Finland', 'Denmark', 'Croatia', 'Serbia', 'Bulgaria', 'Romania', 'Morocco', 
      'Algeria', 'Nigeria', 'Kenya', 'Ethiopia', 'Iran', 'Iraq', 'Israel', 
      'United Arab Emirates', 'Qatar', 'Cuba', 'Jamaica', 'Dominican Republic'
    ],
    hard: [
      // Zor ülkeler
      'Mongolia', 'Myanmar', 'Laos', 'Cambodia', 'Nepal', 'Bhutan', 'Uzbekistan', 
      'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Afghanistan', 
      'Azerbaijan', 'Armenia', 'Georgia', 'Moldova', 'Belarus', 'Lithuania', 
      'Latvia', 'Estonia', 'Slovenia', 'Slovakia', 'North Macedonia', 'Albania', 
      'Montenegro', 'Bosnia and Herzegovina', 'Luxembourg', 'Malta', 'Cyprus', 
      'Lebanon', 'Jordan', 'Yemen', 'Oman', 'Bahrain', 'Kuwait', 'Tunisia', 
      'Libya', 'Sudan', 'South Sudan', 'Eritrea', 'Djibouti', 'Somalia', 
      'Uganda', 'Rwanda', 'Burundi', 'Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 
      'Mozambique', 'Botswana', 'Namibia', 'Madagascar', 'Mauritius', 'Seychelles', 
      'Comoros', 'Cape Verde', 'São Tomé and Príncipe', 'Guinea-Bissau', 'Guinea', 
      'Sierra Leone', 'Liberia', 'Ivory Coast', 'Ghana', 'Togo', 'Benin', 
      'Burkina Faso', 'Mali', 'Niger', 'Chad', 'Central African Republic', 
      'Cameroon', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 
      'Angola', 'Equatorial Guinea', 'Gambia', 'Senegal', 'Mauritania', 'Western Sahara', 
      'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Tonga', 
      'Kiribati', 'Micronesia', 'Marshall Islands', 'Palau', 'Nauru', 'Tuvalu', 
      'Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 
      'Panama', 'Haiti', 'Bahamas', 'Barbados', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
      'Grenada', 'Antigua and Barbuda', 'Saint Kitts and Nevis', 'Trinidad and Tobago', 
      'Guyana', 'Suriname', 'Paraguay', 'Bolivia', 'Ecuador'
    ]
  };
  
  // Ses efektleri
  const sounds = {
    correct: '/static/sounds/correct-answer.mp3',
    incorrect: '/static/sounds/wrong-answer.mp3',
    gameOver: '/static/sounds/game-over.mp3',
    click: '/static/sounds/click.mp3',
    success: '/static/sounds/success.mp3'
  };
  
  // Bayrak API kullanım fonksiyonu - ülke kodu ile bayrak resmi alır
  function getFlagImageUrl(countryCode) {
    return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
  }
  
  // Ülke kodunu ülke adından alır
  function getCountryCode(countryName) {
    // Bu fonksiyon, daha kapsamlı bir uygulamada API'dan veya
    // oluşturulmuş bir haritadan ülke kodlarını alabilir
    const countryCodes = {
      'United States': 'us', 'Canada': 'ca', 'United Kingdom': 'gb', 'France': 'fr', 
      'Germany': 'de', 'Italy': 'it', 'Spain': 'es', 'Russia': 'ru', 
      'China': 'cn', 'Japan': 'jp', 'Australia': 'au', 'Brazil': 'br', 
      'Mexico': 'mx', 'India': 'in', 'South Africa': 'za', 'Egypt': 'eg', 
      'Turkey': 'tr', 'Greece': 'gr', 'South Korea': 'kr', 'Saudi Arabia': 'sa', 
      'Sweden': 'se', 'Switzerland': 'ch', 'Netherlands': 'nl', 'Belgium': 'be', 
      'Portugal': 'pt', 'Ireland': 'ie', 'New Zealand': 'nz', 'Poland': 'pl', 
      'Austria': 'at', 'Norway': 'no', 'Argentina': 'ar', 'Chile': 'cl', 
      'Colombia': 'co', 'Peru': 'pe', 'Venezuela': 've', 'Uruguay': 'uy', 
      'Thailand': 'th', 'Vietnam': 'vn', 'Indonesia': 'id', 'Malaysia': 'my', 
      'Philippines': 'ph', 'Singapore': 'sg', 'Pakistan': 'pk', 'Bangladesh': 'bd', 
      'Sri Lanka': 'lk', 'Ukraine': 'ua', 'Czech Republic': 'cz', 'Hungary': 'hu', 
      'Finland': 'fi', 'Denmark': 'dk', 'Croatia': 'hr', 'Serbia': 'rs', 
      'Bulgaria': 'bg', 'Romania': 'ro', 'Morocco': 'ma', 'Algeria': 'dz', 
      'Nigeria': 'ng', 'Kenya': 'ke', 'Ethiopia': 'et', 'Iran': 'ir', 
      'Iraq': 'iq', 'Israel': 'il', 'United Arab Emirates': 'ae', 'Qatar': 'qa', 
      'Cuba': 'cu', 'Jamaica': 'jm', 'Dominican Republic': 'do',
      'Mongolia': 'mn', 'Myanmar': 'mm', 'Laos': 'la', 'Cambodia': 'kh', 
      'Nepal': 'np', 'Bhutan': 'bt', 'Uzbekistan': 'uz', 'Kazakhstan': 'kz', 
      'Kyrgyzstan': 'kg', 'Tajikistan': 'tj', 'Turkmenistan': 'tm', 'Afghanistan': 'af', 
      'Azerbaijan': 'az', 'Armenia': 'am', 'Georgia': 'ge', 'Moldova': 'md', 
      'Belarus': 'by', 'Lithuania': 'lt', 'Latvia': 'lv', 'Estonia': 'ee', 
      'Slovenia': 'si', 'Slovakia': 'sk', 'North Macedonia': 'mk', 'Albania': 'al', 
      'Montenegro': 'me', 'Bosnia and Herzegovina': 'ba', 'Luxembourg': 'lu', 'Malta': 'mt', 
      'Cyprus': 'cy', 'Lebanon': 'lb', 'Jordan': 'jo', 'Yemen': 'ye', 
      'Oman': 'om', 'Bahrain': 'bh', 'Kuwait': 'kw', 'Tunisia': 'tn', 
      'Libya': 'ly', 'Sudan': 'sd', 'South Sudan': 'ss', 'Eritrea': 'er', 
      'Djibouti': 'dj', 'Somalia': 'so', 'Uganda': 'ug', 'Rwanda': 'rw', 
      'Burundi': 'bi', 'Tanzania': 'tz', 'Malawi': 'mw', 'Zambia': 'zm', 
      'Zimbabwe': 'zw', 'Mozambique': 'mz', 'Botswana': 'bw', 'Namibia': 'na', 
      'Madagascar': 'mg', 'Mauritius': 'mu', 'Seychelles': 'sc', 'Comoros': 'km', 
      'Cape Verde': 'cv', 'São Tomé and Príncipe': 'st', 'Guinea-Bissau': 'gw', 
      'Guinea': 'gn', 'Sierra Leone': 'sl', 'Liberia': 'lr', 'Ivory Coast': 'ci', 
      'Ghana': 'gh', 'Togo': 'tg', 'Benin': 'bj', 'Burkina Faso': 'bf', 
      'Mali': 'ml', 'Niger': 'ne', 'Chad': 'td', 'Central African Republic': 'cf', 
      'Cameroon': 'cm', 'Gabon': 'ga', 'Republic of the Congo': 'cg', 
      'Democratic Republic of the Congo': 'cd', 'Angola': 'ao', 'Equatorial Guinea': 'gq', 
      'Gambia': 'gm', 'Senegal': 'sn', 'Mauritania': 'mr', 'Western Sahara': 'eh', 
      'Papua New Guinea': 'pg', 'Fiji': 'fj', 'Solomon Islands': 'sb', 'Vanuatu': 'vu', 
      'Samoa': 'ws', 'Tonga': 'to', 'Kiribati': 'ki', 'Micronesia': 'fm', 
      'Marshall Islands': 'mh', 'Palau': 'pw', 'Nauru': 'nr', 'Tuvalu': 'tv', 
      'Belize': 'bz', 'Costa Rica': 'cr', 'El Salvador': 'sv', 'Guatemala': 'gt', 
      'Honduras': 'hn', 'Nicaragua': 'ni', 'Panama': 'pa', 'Haiti': 'ht', 
      'Bahamas': 'bs', 'Barbados': 'bb', 'Saint Lucia': 'lc', 
      'Saint Vincent and the Grenadines': 'vc', 'Grenada': 'gd', 'Antigua and Barbuda': 'ag', 
      'Saint Kitts and Nevis': 'kn', 'Trinidad and Tobago': 'tt', 'Guyana': 'gy', 
      'Suriname': 'sr', 'Paraguay': 'py', 'Bolivia': 'bo', 'Ecuador': 'ec'
    };
    
    return countryCodes[countryName] || 'unknown';
  }
  
  // Ses çalma fonksiyonu
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    const audio = new Audio(sounds[soundName]);
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Ses çalma hatası:', e));
  }
  
  // Ayarları başlat
  function initSettings() {
    // Varsayılan zorluğu ayarla
    document.querySelector(`.difficulty-option[data-difficulty="${gameState.difficulty}"]`).classList.add('active');
    
    // Varsayılan zamanı ayarla
    document.querySelector(`.time-option[data-time="${gameState.timeLimit}"]`).classList.add('active');
    
    // Varsayılan modu ayarla
    document.querySelector(`.mode-option[data-mode="${gameState.gameMode}"]`).classList.add('active');
    
    // Bayrak sayısını ayarla
    flagCountDisplay.textContent = gameState.flagCount;
    
    // Ses ayarını aktif et
    soundToggle.classList.add('active');
    
    // Local storage'dan kişisel en iyi skoru yükle
    const savedPersonalBest = localStorage.getItem('flagQuiz_personalBest');
    if (savedPersonalBest) {
      gameState.personalBest = parseInt(savedPersonalBest);
    }
    
    // Öğrenilen bayrakları yükle
    const savedLearnedFlags = localStorage.getItem('flagQuiz_learnedFlags');
    if (savedLearnedFlags) {
      gameState.learnedFlags = JSON.parse(savedLearnedFlags);
    }
    
    // Zorluk seviyesi butonlarına tıklama işlevselliği ekle
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        gameState.difficulty = this.dataset.difficulty;
        playSound('click');
      });
    });
    
    // Zaman butonlarına tıklama işlevselliği ekle
    timeButtons.forEach(button => {
      button.addEventListener('click', function() {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        gameState.timeLimit = this.dataset.time;
        playSound('click');
      });
    });
    
    // Mod butonlarına tıklama işlevselliği ekle
    modeButtons.forEach(button => {
      button.addEventListener('click', function() {
        modeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        gameState.gameMode = this.dataset.mode;
        playSound('click');
      });
    });
    
    // Bayrak sayısı ayarlama butonlarını ekle
    increaseFlagCountButton.addEventListener('click', function() {
      if (gameState.flagCount < 30) {
        gameState.flagCount += 5;
        flagCountDisplay.textContent = gameState.flagCount;
        playSound('click');
      }
    });
    
    decreaseFlagCountButton.addEventListener('click', function() {
      if (gameState.flagCount > 5) {
        gameState.flagCount -= 5;
        flagCountDisplay.textContent = gameState.flagCount;
        playSound('click');
      }
    });
    
    // Ses butonu işlevselliği
    soundToggle.addEventListener('click', function() {
      gameState.soundEnabled = !gameState.soundEnabled;
      if (gameState.soundEnabled) {
        this.innerHTML = '<i class="fas fa-volume-up"></i>';
        this.classList.add('active');
      } else {
        this.innerHTML = '<i class="fas fa-volume-mute"></i>';
        this.classList.remove('active');
      }
      playSound('click');
    });
    
    // Oyunu başlat butonu
    startButton.addEventListener('click', startGame);
    
    // Tekrar oyna butonu
    restartButton.addEventListener('click', function() {
      gameOver.classList.add('d-none');
      gameSettings.classList.remove('d-none');
      playSound('click');
    });
    
    // Ana menüye dön butonu
    returnButton.addEventListener('click', function() {
      window.location.href = '/education_games';
    });
  }
  
  // Tüm ülkeler listesini hazırla
  function prepareCountryList() {
    gameState.allCountries = [];
    
    // Seçilen zorluk seviyesine göre ülkeleri ekle
    if (gameState.difficulty === 'easy') {
      gameState.allCountries = [...difficultyGroups.easy];
    } else if (gameState.difficulty === 'medium') {
      gameState.allCountries = [...difficultyGroups.easy, ...difficultyGroups.medium];
    } else if (gameState.difficulty === 'hard') {
      gameState.allCountries = [...difficultyGroups.easy, ...difficultyGroups.medium, ...difficultyGroups.hard];
    }
    
    // Ülkeleri karıştır ve belirtilen sayıda ülke seç
    gameState.gameCountries = shuffleArray([...gameState.allCountries]).slice(0, gameState.flagCount);
  }
  
  // Oyunu başlat
  function startGame() {
    // Ayarları kaydet
    prepareCountryList();
    
    // Oyun süresini belirle
    let timeInSeconds = 0;
    switch(gameState.timeLimit) {
      case 'none':
        timeInSeconds = 0; // Limitsiz
        break;
      case 'relaxed':
        timeInSeconds = 30;
        break;
      case 'normal':
        timeInSeconds = 15;
        break;
      case 'challenge':
        timeInSeconds = 8;
        break;
    }
    
    // Oyun durumunu sıfırla
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.skippedAnswers = 0;
    gameState.currentFlagIndex = 0;
    gameState.totalTime = 0;
    gameState.answerTimes = [];
    gameState.startTime = Date.now();
    gameState.timeLeft = timeInSeconds;
    
    // Ekranları güncelle
    gameSettings.classList.add('d-none');
    gamePlay.classList.remove('d-none');
    
    // İstatistikleri sıfırla
    scoreDisplay.textContent = '0';
    correctDisplay.textContent = '0';
    wrongDisplay.textContent = '0';
    
    if (timeInSeconds > 0) {
      timerDisplay.textContent = timeInSeconds;
      timerDisplay.parentNode.classList.remove('d-none');
    } else {
      timerDisplay.parentNode.classList.add('d-none');
    }
    
    progressBar.style.width = '0%';
    
    // Cevap modunu ayarla
    setupAnswerMode();
    
    // İlk bayrağı göster
    showNextFlag();
    
    // Zamanlı mod ise sayacı başlat
    if (timeInSeconds > 0) {
      startTimer();
    }
    
    playSound('click');
  }
  
  // Cevap verme modunu ayarla
  function setupAnswerMode() {
    if (gameState.gameMode === 'choice') {
      choicesContainer.classList.remove('d-none');
      writeAnswerContainer.classList.add('d-none');
    } else {
      choicesContainer.classList.add('d-none');
      writeAnswerContainer.classList.remove('d-none');
      
      // Input için event listener ekle
      answerInput.addEventListener('keyup', function(event) {
        if (event.key === "Enter") {
          checkWrittenAnswer();
        }
      });
      
      submitButton.addEventListener('click', checkWrittenAnswer);
      skipButton.addEventListener('click', skipQuestion);
    }
  }
  
  // Bir sonraki bayrağı göster
  function showNextFlag() {
    // Oyun bitti mi kontrol et
    if (gameState.currentFlagIndex >= gameState.gameCountries.length) {
      endGame();
      return;
    }
    
    // Mevcut ülkeyi al
    gameState.currentCountry = gameState.gameCountries[gameState.currentFlagIndex];
    const countryCode = getCountryCode(gameState.currentCountry);
    
    // Bayrak resmini ayarla
    flagImage.src = getFlagImageUrl(countryCode);
    flagImage.alt = `${gameState.currentCountry} Flag`;
    
    // Ülke bilgisini gizle (yanlış cevaptan sonra gösterilir)
    countryInfo.classList.add('d-none');
    
    // İlerleme çubuğunu güncelle
    const progress = (gameState.currentFlagIndex / gameState.gameCountries.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    if (gameState.gameMode === 'choice') {
      // Çoktan seçmeli cevap seçeneklerini oluştur
      createAnswerOptions(gameState.currentCountry);
    } else {
      // Yazarak cevaplama için input alanını temizle
      answerInput.value = '';
      answerInput.focus();
    }
    
    // Zamanlı mod varsa zamanlayıcıyı sıfırla
    if (gameState.timeLimit !== 'none') {
      switch(gameState.timeLimit) {
        case 'relaxed':
          gameState.timeLeft = 30;
          break;
        case 'normal':
          gameState.timeLeft = 15;
          break;
        case 'challenge':
          gameState.timeLeft = 8;
          break;
      }
      timerDisplay.textContent = gameState.timeLeft;
      timerDisplay.parentNode.classList.remove('warning');
    }
  }
  
  // Çoktan seçmeli mod için cevap seçeneklerini oluştur
  function createAnswerOptions(correctAnswer) {
    // Seçenekleri temizle
    choicesContainer.innerHTML = '';
    
    // Doğru cevabı dahil et
    let options = [correctAnswer];
    
    // Diğer ülkelerin içinden rastgele 3 tane seç
    const otherCountries = gameState.allCountries.filter(country => country !== correctAnswer);
    const shuffledCountries = shuffleArray(otherCountries);
    options = options.concat(shuffledCountries.slice(0, 3));
    
    // Seçenekleri karıştır
    options = shuffleArray(options);
    gameState.currentOptions = options;
    
    // Seçenekleri ekrana ekle
    options.forEach(option => {
      const choiceButton = document.createElement('button');
      choiceButton.textContent = option;
      choiceButton.addEventListener('click', () => checkAnswer(option));
      choicesContainer.appendChild(choiceButton);
    });
  }
  
  // Yazarak girilen cevabı kontrol et
  function checkWrittenAnswer() {
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) return;
    
    // Cevap yazı modunda doğru mu kontrolü
    const isCorrect = userAnswer.toLowerCase() === gameState.currentCountry.toLowerCase();
    processAnswer(isCorrect);
  }
  
  // Soruyu atla
  function skipQuestion() {
    gameState.skippedAnswers++;
    showFeedback(`Atlandı! Doğru cevap: ${gameState.currentCountry}`, 'incorrect');
    showCorrectAnswer();
    
    // 1 saniye sonra bir sonraki soruya geç
    setTimeout(() => {
      gameState.currentFlagIndex++;
      showNextFlag();
    }, 1500);
  }
  
  // Seçilen cevabı kontrol et
  function checkAnswer(selectedCountry) {
    const isCorrect = selectedCountry === gameState.currentCountry;
    processAnswer(isCorrect);
  }
  
  // Cevabı işle
  function processAnswer(isCorrect) {
    // Doğru cevap için
    if (isCorrect) {
      gameState.correctAnswers++;
      correctDisplay.textContent = gameState.correctAnswers;
      
      // Puan hesapla
      let pointsEarned = 5; // Temel puan
      
      // Zorluk bonusu
      if (gameState.difficulty === 'medium') pointsEarned += 2;
      if (gameState.difficulty === 'hard') pointsEarned += 4;
      
      // Hız bonusu (zamanlı mod için)
      if (gameState.timeLimit !== 'none') {
        const timeBonus = Math.floor(gameState.timeLeft / 5); // Her 5 saniye için 1 puan
        pointsEarned += timeBonus;
      }
      
      gameState.score += pointsEarned;
      scoreDisplay.textContent = gameState.score;
      
      // Bayrak öğrenildi olarak işaretle
      addToLearnedFlags(gameState.currentCountry);
      
      showFeedback(`Doğru! +${pointsEarned} puan`, 'correct');
      playSound('correct');
      
      // Sonraki soruya geç
      setTimeout(() => {
        gameState.currentFlagIndex++;
        showNextFlag();
      }, 1000);
    } 
    // Yanlış cevap için
    else {
      gameState.wrongAnswers++;
      wrongDisplay.textContent = gameState.wrongAnswers;
      
      // 2 puan düş
      gameState.score = Math.max(0, gameState.score - 2);
      scoreDisplay.textContent = gameState.score;
      
      showFeedback(`Yanlış! Doğru cevap: ${gameState.currentCountry}`, 'incorrect');
      playSound('incorrect');
      
      // Doğru cevabı göster
      showCorrectAnswer();
      
      // 2 saniye sonra bir sonraki soruya geç
      setTimeout(() => {
        gameState.currentFlagIndex++;
        showNextFlag();
      }, 2000);
    }
  }
  
  // Doğru cevabı göster
  function showCorrectAnswer() {
    countryName.textContent = gameState.currentCountry;
    countryDetails.textContent = `Kıta: ${getContinent(gameState.currentCountry)}`;
    countryInfo.classList.remove('d-none');
  }
  
  // Geri bildirim mesajı göster
  function showFeedback(message, type) {
    feedbackContainer.innerHTML = '';
    
    const feedback = document.createElement('div');
    feedback.classList.add('fq-feedback-message', `fq-feedback-${type}`);
    feedback.textContent = message;
    
    feedbackContainer.appendChild(feedback);
    
    // 3 saniye sonra geri bildirimi temizle
    setTimeout(() => {
      feedbackContainer.innerHTML = '';
    }, 3000);
  }
  
  // Öğrenilen bayraklara ekle
  function addToLearnedFlags(countryName) {
    if (!gameState.learnedFlags.includes(countryName)) {
      gameState.learnedFlags.push(countryName);
      localStorage.setItem('flagQuiz_learnedFlags', JSON.stringify(gameState.learnedFlags));
    }
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
      gameState.timeLeft--;
      updateTimerDisplay();
      
      // Süre bitti mi kontrol et
      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timer);
        showFeedback('Süre doldu!', 'incorrect');
        showCorrectAnswer();
        
        // 2 saniye sonra bir sonraki soruya geç
        setTimeout(() => {
          gameState.currentFlagIndex++;
          showNextFlag();
        }, 2000);
      }
    }, 1000);
  }
  
  // Zamanlayıcı görüntüsünü güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = gameState.timeLeft;
    
    // Son 5 saniye için uyarı efekti ekle
    if (gameState.timeLeft <= 5) {
      timerDisplay.parentNode.classList.add('warning');
    } else {
      timerDisplay.parentNode.classList.remove('warning');
    }
  }
  
  // Oyunu bitir
  function endGame() {
    clearInterval(gameState.timer);
    
    // Oyun sonunu göster
    gamePlay.classList.add('d-none');
    gameOver.classList.remove('d-none');
    
    // Toplam süreyi hesapla
    gameState.totalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // İstatistikleri güncelle
    finalScoreDisplay.textContent = gameState.score;
    finalCorrectDisplay.textContent = gameState.correctAnswers;
    finalWrongDisplay.textContent = gameState.wrongAnswers;
    
    // Doğruluk oranını hesapla
    const totalAnswered = gameState.correctAnswers + gameState.wrongAnswers;
    const accuracy = totalAnswered > 0 ? Math.round((gameState.correctAnswers / totalAnswered) * 100) : 0;
    accuracyDisplay.textContent = `${accuracy}%`;
    
    // Ortalama cevap süresini hesapla
    const averageTime = gameState.totalTime > 0 ? Math.round(gameState.totalTime / totalAnswered) : 0;
    averageTimeDisplay.textContent = `${averageTime}s`;
    
    // Kişisel rekor kontrolü
    if (gameState.score > gameState.personalBest) {
      gameState.personalBest = gameState.score;
      localStorage.setItem('flagQuiz_personalBest', gameState.personalBest);
      personalBestDisplay.textContent = gameState.personalBest;
      personalBestDisplay.parentNode.classList.add('new-record');
    } else {
      personalBestDisplay.textContent = gameState.personalBest;
      personalBestDisplay.parentNode.classList.remove('new-record');
    }
    
    // Öğrenilen bayrakları göster
    showLearnedFlags();
    
    playSound('gameOver');
    
    // Skorları sunucuya gönder
    saveGameScore();
  }
  
  // Öğrenilen bayrakları göster
  function showLearnedFlags() {
    learnedFlagsContainer.innerHTML = '';
    
    // Son oyunda öğrenilen bayraklar
    let recentlyLearned = gameState.gameCountries.filter(country => {
      return gameState.learnedFlags.includes(country);
    });
    
    // Son 10 ülkeyi göster
    recentlyLearned = recentlyLearned.slice(0, 10);
    
    recentlyLearned.forEach(country => {
      const flagItem = document.createElement('div');
      flagItem.classList.add('fq-gallery-item');
      
      const flagImg = document.createElement('img');
      flagImg.src = getFlagImageUrl(getCountryCode(country));
      flagImg.alt = country;
      flagImg.classList.add('fq-gallery-img');
      
      const flagName = document.createElement('div');
      flagName.textContent = country;
      flagName.classList.add('fq-gallery-name');
      
      flagItem.appendChild(flagImg);
      flagItem.appendChild(flagName);
      
      learnedFlagsContainer.appendChild(flagItem);
    });
  }
  
  // Skoru sunucuya kaydet
  function saveGameScore() {
    const gameData = {
      game_type: 'flag_quiz',
      score: gameState.score,
      difficulty: gameState.difficulty,
      correct_answers: gameState.correctAnswers,
      wrong_answers: gameState.wrongAnswers,
      skipped_answers: gameState.skippedAnswers,
      time_spent: gameState.totalTime,
      mode: gameState.gameMode,
      flag_count: gameState.flagCount
    };
    
    fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Ülkenin bulunduğu kıtayı döndür
  function getContinent(countryName) {
    const continentMap = {
      // Avrupa
      'United Kingdom': 'Avrupa', 'France': 'Avrupa', 'Germany': 'Avrupa', 
      'Italy': 'Avrupa', 'Spain': 'Avrupa', 'Portugal': 'Avrupa', 
      'Netherlands': 'Avrupa', 'Belgium': 'Avrupa', 'Switzerland': 'Avrupa', 
      'Austria': 'Avrupa', 'Greece': 'Avrupa', 'Sweden': 'Avrupa', 
      'Norway': 'Avrupa', 'Denmark': 'Avrupa', 'Finland': 'Avrupa', 
      'Ireland': 'Avrupa', 'Poland': 'Avrupa', 'Czech Republic': 'Avrupa', 
      'Hungary': 'Avrupa', 'Romania': 'Avrupa', 'Bulgaria': 'Avrupa', 
      'Serbia': 'Avrupa', 'Croatia': 'Avrupa', 'Slovenia': 'Avrupa', 
      'Slovakia': 'Avrupa', 'North Macedonia': 'Avrupa', 'Albania': 'Avrupa', 
      'Montenegro': 'Avrupa', 'Bosnia and Herzegovina': 'Avrupa', 
      'Luxembourg': 'Avrupa', 'Malta': 'Avrupa', 'Cyprus': 'Avrupa', 
      'Ukraine': 'Avrupa', 'Belarus': 'Avrupa', 'Lithuania': 'Avrupa', 
      'Latvia': 'Avrupa', 'Estonia': 'Avrupa', 'Moldova': 'Avrupa',
      
      // Asya
      'Russia': 'Asya', 'China': 'Asya', 'Japan': 'Asya', 'India': 'Asya', 
      'South Korea': 'Asya', 'Turkey': 'Asya', 'Saudi Arabia': 'Asya', 
      'Thailand': 'Asya', 'Vietnam': 'Asya', 'Indonesia': 'Asya', 
      'Malaysia': 'Asya', 'Philippines': 'Asya', 'Singapore': 'Asya', 
      'Pakistan': 'Asya', 'Bangladesh': 'Asya', 'Sri Lanka': 'Asya', 
      'Iran': 'Asya', 'Iraq': 'Asya', 'Israel': 'Asya', 
      'United Arab Emirates': 'Asya', 'Qatar': 'Asya', 'Mongolia': 'Asya', 
      'Myanmar': 'Asya', 'Laos': 'Asya', 'Cambodia': 'Asya', 
      'Nepal': 'Asya', 'Bhutan': 'Asya', 'Uzbekistan': 'Asya', 
      'Kazakhstan': 'Asya', 'Kyrgyzstan': 'Asya', 'Tajikistan': 'Asya', 
      'Turkmenistan': 'Asya', 'Afghanistan': 'Asya', 'Azerbaijan': 'Asya', 
      'Armenia': 'Asya', 'Georgia': 'Asya', 'Lebanon': 'Asya', 
      'Jordan': 'Asya', 'Yemen': 'Asya', 'Oman': 'Asya', 
      'Bahrain': 'Asya', 'Kuwait': 'Asya',
      
      // Kuzey Amerika
      'United States': 'Kuzey Amerika', 'Canada': 'Kuzey Amerika', 
      'Mexico': 'Kuzey Amerika', 'Cuba': 'Kuzey Amerika', 
      'Jamaica': 'Kuzey Amerika', 'Dominican Republic': 'Kuzey Amerika', 
      'Belize': 'Kuzey Amerika', 'Costa Rica': 'Kuzey Amerika', 
      'El Salvador': 'Kuzey Amerika', 'Guatemala': 'Kuzey Amerika', 
      'Honduras': 'Kuzey Amerika', 'Nicaragua': 'Kuzey Amerika', 
      'Panama': 'Kuzey Amerika', 'Haiti': 'Kuzey Amerika', 
      'Bahamas': 'Kuzey Amerika', 'Barbados': 'Kuzey Amerika', 
      'Saint Lucia': 'Kuzey Amerika', 'Saint Vincent and the Grenadines': 'Kuzey Amerika', 
      'Grenada': 'Kuzey Amerika', 'Antigua and Barbuda': 'Kuzey Amerika', 
      'Saint Kitts and Nevis': 'Kuzey Amerika', 'Trinidad and Tobago': 'Kuzey Amerika',
      
      // Güney Amerika
      'Brazil': 'Güney Amerika', 'Argentina': 'Güney Amerika', 
      'Chile': 'Güney Amerika', 'Colombia': 'Güney Amerika', 
      'Peru': 'Güney Amerika', 'Venezuela': 'Güney Amerika', 
      'Uruguay': 'Güney Amerika', 'Guyana': 'Güney Amerika', 
      'Suriname': 'Güney Amerika', 'Paraguay': 'Güney Amerika', 
      'Bolivia': 'Güney Amerika', 'Ecuador': 'Güney Amerika',
      
      // Afrika
      'South Africa': 'Afrika', 'Egypt': 'Afrika', 'Morocco': 'Afrika', 
      'Algeria': 'Afrika', 'Nigeria': 'Afrika', 'Kenya': 'Afrika', 
      'Ethiopia': 'Afrika', 'Tunisia': 'Afrika', 'Libya': 'Afrika', 
      'Sudan': 'Afrika', 'South Sudan': 'Afrika', 'Eritrea': 'Afrika', 
      'Djibouti': 'Afrika', 'Somalia': 'Afrika', 'Uganda': 'Afrika', 
      'Rwanda': 'Afrika', 'Burundi': 'Afrika', 'Tanzania': 'Afrika', 
      'Malawi': 'Afrika', 'Zambia': 'Afrika', 'Zimbabwe': 'Afrika', 
      'Mozambique': 'Afrika', 'Botswana': 'Afrika', 'Namibia': 'Afrika', 
      'Madagascar': 'Afrika', 'Mauritius': 'Afrika', 'Seychelles': 'Afrika', 
      'Comoros': 'Afrika', 'Cape Verde': 'Afrika', 'São Tomé and Príncipe': 'Afrika', 
      'Guinea-Bissau': 'Afrika', 'Guinea': 'Afrika', 'Sierra Leone': 'Afrika', 
      'Liberia': 'Afrika', 'Ivory Coast': 'Afrika', 'Ghana': 'Afrika', 
      'Togo': 'Afrika', 'Benin': 'Afrika', 'Burkina Faso': 'Afrika', 
      'Mali': 'Afrika', 'Niger': 'Afrika', 'Chad': 'Afrika', 
      'Central African Republic': 'Afrika', 'Cameroon': 'Afrika', 
      'Gabon': 'Afrika', 'Republic of the Congo': 'Afrika', 
      'Democratic Republic of the Congo': 'Afrika', 'Angola': 'Afrika', 
      'Equatorial Guinea': 'Afrika', 'Gambia': 'Afrika', 
      'Senegal': 'Afrika', 'Mauritania': 'Afrika', 'Western Sahara': 'Afrika',
      
      // Okyanusya
      'Australia': 'Okyanusya', 'New Zealand': 'Okyanusya', 
      'Papua New Guinea': 'Okyanusya', 'Fiji': 'Okyanusya', 
      'Solomon Islands': 'Okyanusya', 'Vanuatu': 'Okyanusya', 
      'Samoa': 'Okyanusya', 'Tonga': 'Okyanusya', 'Kiribati': 'Okyanusya', 
      'Micronesia': 'Okyanusya', 'Marshall Islands': 'Okyanusya', 
      'Palau': 'Okyanusya', 'Nauru': 'Okyanusya', 'Tuvalu': 'Okyanusya'
    };
    
    return continentMap[countryName] || 'Bilinmiyor';
  }
  
  // Sayfa yüklendiğinde ayarları başlat
  initSettings();
});