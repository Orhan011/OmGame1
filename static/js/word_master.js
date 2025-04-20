// Kelime veritabanı
const wordDatabase = {
  A1: [
    // Mevcut kelimeler
    { word: "book", meaning: "kitap", options: ["kitap", "masa", "kalem", "araba"] },
    { word: "house", meaning: "ev", options: ["bina", "ev", "apartman", "okul"] },
    { word: "car", meaning: "araba", options: ["araba", "bisiklet", "uçak", "tren"] },
    { word: "dog", meaning: "köpek", options: ["kedi", "köpek", "kuş", "balık"] },
    { word: "water", meaning: "su", options: ["su", "çay", "kahve", "süt"] },
    { word: "friend", meaning: "arkadaş", options: ["arkadaş", "aile", "kardeş", "komşu"] },
    { word: "school", meaning: "okul", options: ["okul", "hastane", "market", "park"] },
    { word: "family", meaning: "aile", options: ["aile", "arkadaş", "öğretmen", "doktor"] },
    { word: "apple", meaning: "elma", options: ["elma", "muz", "portakal", "çilek"] },
    { word: "bread", meaning: "ekmek", options: ["ekmek", "peynir", "et", "yumurta"] },
    // Yeni A1 kelimeleri
    { word: "hello", meaning: "merhaba", options: ["merhaba", "hoşçakal", "teşekkürler", "özür dilerim"] },
    { word: "goodbye", meaning: "hoşçakal", options: ["merhaba", "hoşçakal", "teşekkürler", "özür dilerim"] },
    { word: "yes", meaning: "evet", options: ["evet", "hayır", "belki", "tamam"] },
    { word: "no", meaning: "hayır", options: ["evet", "hayır", "belki", "tamam"] },
    { word: "please", meaning: "lütfen", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] },
    { word: "thank you", meaning: "teşekkürler", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] },
    { word: "sorry", meaning: "özür dilerim", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] }
  ],
  A2: [
    // Mevcut kelimeler
    { word: "happy", meaning: "mutlu", options: ["mutlu", "üzgün", "kızgın", "şaşkın"] },
    { word: "difficult", meaning: "zor", options: ["kolay", "zor", "basit", "karmaşık"] },
    { word: "beautiful", meaning: "güzel", options: ["güzel", "çirkin", "orta", "mükemmel"] },
    { word: "important", meaning: "önemli", options: ["önemli", "önemsiz", "gerekli", "gereksiz"] },
    { word: "interesting", meaning: "ilginç", options: ["ilginç", "sıkıcı", "eğlenceli", "üzücü"] },
    { word: "restaurant", meaning: "restoran", options: ["kafe", "restoran", "market", "mağaza"] },
    { word: "weather", meaning: "hava durumu", options: ["mevsim", "hava durumu", "sıcaklık", "nem"] },
    { word: "vacation", meaning: "tatil", options: ["iş", "tatil", "toplantı", "eğitim"] },
    { word: "weekend", meaning: "hafta sonu", options: ["hafta içi", "hafta sonu", "pazartesi", "cuma"] },
    { word: "language", meaning: "dil", options: ["kelime", "cümle", "dil", "konuşma"] }
  ],
  B1: [
    { word: "achievement", meaning: "başarı", options: ["başarı", "başarısızlık", "çaba", "deneme"] },
    { word: "experience", meaning: "tecrübe", options: ["tecrübe", "deneyim", "olay", "hayat"] },
    { word: "opportunity", meaning: "fırsat", options: ["fırsat", "şans", "seçenek", "olasılık"] },
    { word: "responsibility", meaning: "sorumluluk", options: ["sorumluluk", "görev", "yetki", "hak"] },
    { word: "environment", meaning: "çevre", options: ["çevre", "dünya", "doğa", "atmosfer"] }
  ],
  B2: [
    { word: "controversial", meaning: "tartışmalı", options: ["tartışmalı", "kesin", "net", "açık"] },
    { word: "negotiate", meaning: "müzakere etmek", options: ["müzakere etmek", "konuşmak", "tartışmak", "anlaşmak"] },
    { word: "commitment", meaning: "taahhüt", options: ["taahhüt", "söz", "vaat", "anlaşma"] },
    { word: "fundamental", meaning: "temel", options: ["temel", "önemli", "kritik", "basit"] },
    { word: "phenomenon", meaning: "fenomen", options: ["fenomen", "olay", "durum", "gerçek"] }
  ]
};

// Oyun durumu
const gameState = {
  level: 'A1',
  score: 0,
  correctAnswers: 0,
  progress: 0,
  totalQuestions: 10,
  currentWord: null,
  usedWords: [],
  learnedWords: [],
  stage: 'meaning', // Anlam, yazım, telaffuz aşamaları
  speechRecognition: null,
  isRecording: false,
  isSoundEnabled: true,
  levelProgression: {
    A1: { required: 0, completed: false },
    A2: { required: 50, completed: false },
    B1: { required: 100, completed: false },
    B2: { required: 150, completed: false },
    advanced: { required: 200, completed: false }
  },
  totalLearnedCount: 0
};

// DOM Elemanları
document.addEventListener('DOMContentLoaded', function() {
  // Elementleri seç
  const startButton = document.getElementById('start-button');
  const levelButtons = document.querySelectorAll('.level-btn');
  const levelSelect = document.getElementById('level');
  const progressBar = document.querySelector('.progress-bar');
  const scoreDisplay = document.getElementById('score');
  const correctAnswersDisplay = document.getElementById('correct-answers');
  const progressDisplay = document.getElementById('progress');
  const gameScreens = document.querySelectorAll('.game-screen');
  const notebookButton = document.getElementById('notebook-button');
  const settingsButton = document.getElementById('settings-button');
  const listenWordButton = document.getElementById('listen-word');
  const optionButtons = document.querySelectorAll('.option-btn');
  const spellingInput = document.getElementById('spelling-input');
  const checkSpellingButton = document.getElementById('check-spelling');
  const spellingFeedback = document.getElementById('spelling-feedback');
  const spellingHintButton = document.getElementById('spelling-hint');
  const startRecordingButton = document.getElementById('start-recording');
  const micStatus = document.getElementById('mic-status');
  const pronunciationFeedback = document.getElementById('pronunciation-feedback');
  const pronunciationHintButton = document.getElementById('pronunciation-hint');
  const continueButton = document.getElementById('continue-button');
  const shareResultButton = document.getElementById('share-result');

  // Oyunu başlat
  startButton.addEventListener('click', startGame);

  // Seviye butonları
  levelButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (this.classList.contains('locked')) {
        showLevelLockedNotification();
        return;
      }

      // Aktif butonu değiştir
      levelButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Select'i ve oyun durumunu güncelle
      const selectedLevel = this.getAttribute('data-level');
      levelSelect.value = selectedLevel;
      gameState.level = selectedLevel;
    });
  });

  // Kelime dinleme butonu
  listenWordButton.addEventListener('click', function() {
    if (gameState.currentWord) {
      speakWord(gameState.currentWord.word);
    }
  });

  // Kelime seçenekleri
  document.querySelector('.options-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('option-btn') && !e.target.classList.contains('correct') && !e.target.classList.contains('incorrect')) {
      checkMeaningAnswer(e.target);
    }
  });

  // Yazım kontrol
  checkSpellingButton.addEventListener('click', checkSpelling);
  spellingInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkSpelling();
    }
  });

  // Gelişmiş yazma alanı iyileştirmeleri
  spellingInput.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
    // Hafif titreşim animasyonu ekle
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    // Yazım alanına odaklanınca input kutusunu hafifçe büyüt
    this.style.transform = 'scale(1.02)';

    // İpucu metnini göster
    const feedbackElement = document.getElementById('spelling-feedback');
    if (feedbackElement && feedbackElement.style.display === 'none') {
      feedbackElement.textContent = 'Kelimenin yazılışını giriniz...';
      feedbackElement.className = 'feedback hint';
      feedbackElement.style.display = 'block';
      setTimeout(() => {
        if (feedbackElement.textContent === 'Kelimenin yazılışını giriniz...') {
          feedbackElement.style.display = 'none';
        }
      }, 3000);
    }
  });

  spellingInput.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
    this.style.transform = 'scale(1)';
  });

  // Input alanına her karakter girildiğinde
  spellingInput.addEventListener('input', function() {
    // Yazılan her karakterde hafif bir vurgu ekle
    this.style.transform = 'scale(1.03)';
    setTimeout(() => {
      if (document.activeElement === this) {
        this.style.transform = 'scale(1.02)';
      } else {
        this.style.transform = 'scale(1)';
      }
    }, 100);
  });

  // Otomatik odaklanma - titreşim ve sallantı animasyonları kaldırıldı
  document.getElementById('spelling-question').addEventListener('transitionend', function(e) {
    if (e.propertyName === 'opacity' && this.classList.contains('active')) {
      // Direkt odak işlemi, titreşim olmadan
      const spellingInput = document.getElementById('spelling-input');
      if (spellingInput) {
        spellingInput.focus();
      }
    }
  });

  // İpucu butonu animasyonu
  const spellingHintBtn = document.getElementById('spelling-hint');
  if (spellingHintBtn) {
    spellingHintBtn.addEventListener('mouseover', function() {
      this.innerHTML = '<i class="fas fa-lightbulb"></i> İpucu Al';
    });

    spellingHintBtn.addEventListener('mouseout', function() {
      this.innerHTML = '<i class="fas fa-lightbulb"></i> İpucu';
    });
  }

  // İpucu butonları
  spellingHintButton.addEventListener('click', showSpellingHint);
  pronunciationHintButton.addEventListener('click', showPronunciationHint);

  // Mikrofon kayıt
  startRecordingButton.addEventListener('click', toggleRecording);

  // Sonuç ekranı butonları
  continueButton.addEventListener('click', continueLearning);
  shareResultButton.addEventListener('click', shareResult);

  // Notebook ve ayarlar butonları
  notebookButton.addEventListener('click', toggleNotebook);
  settingsButton.addEventListener('click', toggleSettings);

  // Speech Recognition kurulumu
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    gameState.speechRecognition = new SpeechRecognition();
    gameState.speechRecognition.continuous = false;
    gameState.speechRecognition.interimResults = false;
    gameState.speechRecognition.lang = 'en-US';

    gameState.speechRecognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      checkPronunciation(transcript);
    };

    gameState.speechRecognition.onend = function() {
      gameState.isRecording = false;
      startRecordingButton.classList.remove('recording');
      micStatus.textContent = 'Mikrofon kapalı';
    };

    gameState.speechRecognition.onerror = function(event) {
      console.error('Speech recognition error', event.error);
      micStatus.textContent = `Hata: ${event.error}. Lütfen mikrofon izinlerini kontrol edin.`;
      gameState.isRecording = false;
      startRecordingButton.classList.remove('recording');
    };
  } else {
    pronunciationHintButton.textContent = 'Tarayıcınız ses tanımayı desteklemiyor';
    pronunciationHintButton.disabled = true;
    startRecordingButton.disabled = true;
    micStatus.textContent = 'Ses tanıma bu tarayıcıda desteklenmiyor';
  }

  // Kelime defterini ve seviye ilerlemesini yükle
  loadLearnedWords();
  updateLevelButtons();
});

// Oyunu başlat
function startGame() {
  // Oyun durumunu sıfırla
  gameState.score = 0;
  gameState.correctAnswers = 0;
  gameState.progress = 0;
  gameState.usedWords = [];
  gameState.stage = 'meaning';

  // UI'ı güncelle
  updateUI();

  // İlk soruyu göster
  showScreen('meaning-question');
  nextQuestion();
}

// UI'ı güncelle
function updateUI() {
  // Skoru ve ilerleme durumunu güncelle fakat gösterme
  // Arka planda takip etmek için değerleri hala güncelliyoruz

  // İlerleme çubuğunu güncelle (gizlenmiş olabilir)
  const progressPercentage = (gameState.progress / gameState.totalQuestions) * 100;
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
  }
}

// Ekranları göster/gizle
function showScreen(screenId) {
  // Tüm ekranları gizle
  document.querySelectorAll('.game-screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // İstenen ekranı göster
  document.getElementById(screenId).classList.add('active');
}

// Rastgele kelime seç
function getRandomWord() {
  const availableWords = wordDatabase[gameState.level].filter(word => 
    !gameState.usedWords.includes(word.word)
  );

  if (availableWords.length === 0) {
    // Eğer tüm kelimeler kullanıldıysa, kullanılmış kelimeleri sıfırla
    gameState.usedWords = [];
    return wordDatabase[gameState.level][Math.floor(Math.random() * wordDatabase[gameState.level].length)];
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

// Bir sonraki soruyu göster
function nextQuestion() {
  if (gameState.progress >= gameState.totalQuestions) {
    showResultScreen();
    return;
  }

  // Yeni kelimeyi seç
  if (gameState.stage === 'meaning') {
    gameState.currentWord = getRandomWord();
    gameState.usedWords.push(gameState.currentWord.word);
    gameState.progress++;
    updateUI();

    // Anlamı göster
    document.getElementById('current-word').textContent = gameState.currentWord.word;

    // Yeni bir emoji seç ve göster
    const wordEmoji = document.getElementById('word-emoji');
    if (wordEmoji) {
      wordEmoji.textContent = getRandomSmileyFace();
    }

    // Seçenekleri doldur
    const optionsContainer = document.querySelector('.options-container');
    optionsContainer.innerHTML = '';

    // Seçenekleri karıştır
    const shuffledOptions = [...gameState.currentWord.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(option => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.textContent = option;
      optionsContainer.appendChild(button);
    });
  } else if (gameState.stage === 'spelling') {
    // Yazım aşaması
    document.getElementById('word-meaning-display').textContent = gameState.currentWord.meaning;
    document.getElementById('spelling-input').value = '';
    document.getElementById('spelling-feedback').style.display = 'none';
  } else if (gameState.stage === 'pronunciation') {
    // Telaffuz aşaması
    document.getElementById('pronunciation-word').textContent = gameState.currentWord.word;
    document.getElementById('pronunciation-feedback').style.display = 'none';
    document.getElementById('mic-status').textContent = 'Mikrofona konuşmak için butona tıklayın';
  }
}

// Anlam sorusunu kontrol et
function checkMeaningAnswer(button) {
  const selectedAnswer = button.textContent;
  const wordEmoji = document.getElementById('word-emoji');

  if (selectedAnswer === gameState.currentWord.meaning) {
    // Doğru cevap
    button.classList.add('correct');
    gameState.score += 10;
    gameState.correctAnswers++;
    updateUI();

    // Emoji tepkisi değiştir
    if (wordEmoji) {
      wordEmoji.textContent = '😍'; // Doğru cevap için heyecanlı emoji
      wordEmoji.style.animation = 'winkFace 0.5s 3';
    }

    // Kelimeyi öğrenilenlere ekle
    addToLearnedWords(gameState.currentWord);

    // Kısa bir süre sonra bir sonraki aşamaya geç
    setTimeout(() => {
      gameState.stage = 'spelling';
      showScreen('spelling-question');
      nextQuestion();
    }, 1000);
  } else {
    // Yanlış cevap
    button.classList.add('incorrect');

    // Emoji tepkisi değiştir
    if (wordEmoji) {
      wordEmoji.textContent = '😢'; // Yanlış cevap için üzgün emoji
    }

    // Doğru cevabı göster
    document.querySelectorAll('.option-btn').forEach(btn => {
      if (btn.textContent === gameState.currentWord.meaning) {
        btn.classList.add('correct');
      }
    });

    // Kısa bir süre sonra bir sonraki aşamaya geç
    setTimeout(() => {
      gameState.stage = 'spelling';
      showScreen('spelling-question');
      nextQuestion();
    }, 1500);
  }
}

// Yazımı kontrol et
function checkSpelling() {
  const userInput = document.getElementById('spelling-input').value.trim().toLowerCase();
  const feedback = document.getElementById('spelling-feedback');

  feedback.style.display = 'block';

  if (userInput === gameState.currentWord.word.toLowerCase()) {
    // Doğru yazım
    feedback.textContent = 'Doğru! Harika yazım.';
    feedback.className = 'feedback success';
    gameState.score += 10;
    gameState.correctAnswers++;
    updateUI();

    // Kısa bir süre sonra bir sonraki aşamaya geç
    setTimeout(() => {
      gameState.stage = 'pronunciation';
      showScreen('pronunciation-question');
      nextQuestion();
    }, 1000);
  } else {
    // Yanlış yazım
    feedback.textContent = `Yanlış. Doğru yanıt: ${gameState.currentWord.word}`;
    feedback.className = 'feedback error';

    // Kısa bir süre sonra bir sonraki aşamaya geç
    setTimeout(() => {
      gameState.stage = 'pronunciation';
      showScreen('pronunciation-question');
      nextQuestion();
    }, 1500);
  }
}

// Yazım ipucu göster
function showSpellingHint() {
  const word = gameState.currentWord.word;
  const feedback = document.getElementById('spelling-feedback');

  // İlk harfi ipucu olarak göster
  feedback.textContent = `İpucu: Kelime "${word[0]}" ile başlıyor ve ${word.length} harf içeriyor.`;
  feedback.className = 'feedback hint';
  feedback.style.display = 'block';
}

// Telaffuz kontrolü
function checkPronunciation(transcript) {
  console.log('Algılanan konuşma:', transcript);
  const word = gameState.currentWord.word.toLowerCase();
  const feedback = document.getElementById('pronunciation-feedback');
  const micStatus = document.getElementById('mic-status');

  feedback.style.display = 'block';

  // Kelime söylenen metinde var mı kontrol et
  if (transcript.includes(word)) {
    // Doğru telaffuz
    feedback.innerHTML = '<i class="fas fa-check-circle"></i> Doğru telaffuz! Harika iş.';
    feedback.className = 'feedback success';
    micStatus.textContent = 'Doğru telaffuz edildi!';
    gameState.score += 10;
    gameState.correctAnswers++;
    updateUI();

    // Kısa bir süre sonra bir sonraki soruya geç
    setTimeout(() => {
      gameState.stage = 'meaning';
      showScreen('meaning-question');
      nextQuestion();
    }, 1500);
  } else {
    // Yanlış telaffuz
    feedback.innerHTML = `<i class="fas fa-times-circle"></i> Tekrar deneyin. Söylemeye çalıştığınız kelime: <strong>"${gameState.currentWord.word}"</strong>`;
    feedback.className = 'feedback error';
    micStatus.textContent = 'Yanlış telaffuz, tekrar deneyin.';
  }
}

// Telaffuz ipucu göster
function showPronunciationHint() {
  const feedback = document.getElementById('pronunciation-feedback');

  // Kelimeyi seslendir
  speakWord(gameState.currentWord.word);

  feedback.innerHTML = '<i class="fas fa-headphones"></i> Kelimeyi dikkatle dinleyin ve aynı şekilde telaffuz etmeye çalışın.';
  feedback.className = 'feedback hint';
  feedback.style.display = 'block';

  // Dinleme efekti
  const hintButton = document.getElementById('pronunciation-hint');
  hintButton.innerHTML = '<i class="fas fa-volume-up"></i> DİNLENİYOR...';

  setTimeout(() => {
    hintButton.innerHTML = '<i class="fas fa-volume-up"></i> TEKRAR DİNLE';
  }, 2000);
}

// Mikrofon kaydını başlat/durdur
function toggleRecording() {
  if (!gameState.speechRecognition) return;

  const button = document.getElementById('start-recording');
  const micStatus = document.getElementById('mic-status');

  if (gameState.isRecording) {
    // Kaydı durdur
    gameState.speechRecognition.stop();
    gameState.isRecording = false;
    button.classList.remove('recording');
    micStatus.textContent = 'Mikrofon kapalı';
  } else {
    // Kaydı başlat
    try {
      gameState.speechRecognition.start();
      gameState.isRecording = true;
      button.classList.add('recording');
      micStatus.textContent = 'Dinleniyor...';
    } catch (error) {
      console.error('Speech recognition error', error);
      micStatus.textContent = 'Hata: Mikrofon başlatılamadı';
    }
  }
}

// Kelimeyi seslendir
function speakWord(word) {
  if (!gameState.isSoundEnabled) return;

  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  } else {
    console.log('Speech synthesis not supported');
  }
}

// Öğrenilen kelimelere ekle
function addToLearnedWords(wordObj) {
  // Eğer kelime zaten listedeyse ekleme
  if (gameState.learnedWords.some(item => item.word === wordObj.word)) {
    return;
  }

  // Kelimeyi ve bugünün tarihini kaydet
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  gameState.learnedWords.push({
    ...wordObj,
    date: dateStr,
    level: gameState.level
  });

  // Toplam öğrenilen kelime sayısını güncelle
  gameState.totalLearnedCount++;

  // Seviye ilerlemesini kontrol et
  checkLevelProgression();

  // Local storage'a kaydet
  localStorage.setItem('wordMaster_learnedWords', JSON.stringify(gameState.learnedWords));
  localStorage.setItem('wordMaster_levelProgression', JSON.stringify(gameState.levelProgression));
  localStorage.setItem('wordMaster_totalLearnedCount', gameState.totalLearnedCount.toString());
}

// Seviye ilerlemesini kontrol et
function checkLevelProgression() {
  const levels = ['A1', 'A2', 'B1', 'B2', 'advanced'];

  // Her seviye için kontrol et
  for (let i = 1; i < levels.length; i++) {
    const level = levels[i];
    const prevLevel = levels[i-1];

    // Gerekli kelime sayısına ulaşıldıysa ve önceki seviye tamamlandıysa
    if (gameState.totalLearnedCount >= gameState.levelProgression[level].required && 
        (i === 1 || gameState.levelProgression[prevLevel].completed)) {

      // Seviyeyi tamamlanmış olarak işaretle
      if (!gameState.levelProgression[prevLevel].completed) {
        gameState.levelProgression[prevLevel].completed = true;
        localStorage.setItem('wordMaster_levelProgression', JSON.stringify(gameState.levelProgression));
      }

      // Sonraki seviyeyi aç
      if (level !== 'advanced') {
        const levelButton = document.querySelector(`.level-btn[data-level="${level}"]`);
        if (levelButton && levelButton.classList.contains('locked')) {
          levelButton.classList.remove('locked');
          levelButton.innerHTML = `${level}<span class="level-desc">${getLevelDescription(level)}</span>`;
          showLevelUnlockedNotification(level);
        }
      } else {
        // Eğer advanced seviyesine geldiyse, ileri seviye içeriği göster
        if (!gameState.levelProgression.advanced.completed) {
          gameState.levelProgression.advanced.completed = true;
          localStorage.setItem('wordMaster_levelProgression', JSON.stringify(gameState.levelProgression));

          // Burada ileri seviye içeriğini gösterme işlemleri olabilir
        }
      }
    }
  }

  // Butonları güncelle
  updateLevelButtons();
}

// Seviye açıklamalarını döndür
function getLevelDescription(level) {
  switch (level) {
    case 'A1': return 'Başlangıç';
    case 'A2': return 'Temel';
    case 'B1': return 'Orta';
    case 'B2': return 'Orta-Üstü';
    default: return '';
  }
}

// Seviye butonlarını güncelle
function updateLevelButtons() {
  const levels = ['A1', 'A2', 'B1', 'B2'];

  levels.forEach(level => {
    const button = document.querySelector(`.level-btn[data-level="${level}"]`);
    if (button) {
      // Seviye açılmışsa kilidini kaldır
      if (gameState.totalLearnedCount >= gameState.levelProgression[level].required) {
        if (button.classList.contains('locked')) {
          button.classList.remove('locked');
          button.innerHTML = `${level}<span class="level-desc">${getLevelDescription(level)}</span>`;
        }
      } else {
        // Kilidi göster ve gerekli kelime sayısını belirt
        if (!button.classList.contains('locked')) {
          button.classList.add('locked');
          button.innerHTML = `${level}<i class="fas fa-lock"></i><span class="level-unlock-info">${gameState.levelProgression[level].required} kelime gerekli</span>`;
        }
      }
    }
  });
}

// Öğrenilen kelimeleri yükle
function loadLearnedWords() {
  // Öğrenilen kelimeleri yükle
  const savedWords = localStorage.getItem('wordMaster_learnedWords');
  if (savedWords) {
    gameState.learnedWords = JSON.parse(savedWords);
  }

  // Seviye ilerlemesini yükle
  const savedProgression = localStorage.getItem('wordMaster_levelProgression');
  if (savedProgression) {
    gameState.levelProgression = JSON.parse(savedProgression);
  }

  // Toplam öğrenilen kelime sayısını yükle
  const savedCount = localStorage.getItem('wordMaster_totalLearnedCount');
  if (savedCount) {
    gameState.totalLearnedCount = parseInt(savedCount, 10);
  } else {
    // Eğer kayıtlı sayı yoksa, öğrenilen kelime sayısını hesapla
    gameState.totalLearnedCount = gameState.learnedWords.length;
  }

  // Butonları güncelle
  updateLevelButtons();
}

// Kelime defterini göster
function toggleNotebook() {
  // Modal oluştur
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'notebook-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Kelime Defterim</h2>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="notebook-summary">
          <p>Toplam öğrenilen kelime sayısı: <strong>${gameState.totalLearnedCount}</strong></p>
          <div class="level-progress">
            <div class="level-progress-item">
              <span class="level-label">A2:</span> 
              <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.min(100, (gameState.totalLearnedCount / gameState.levelProgression.A2.required) * 100)}%"></div>
              </div>
              <span class="progress-text">${gameState.totalLearnedCount}/${gameState.levelProgression.A2.required}</span>
            </div>
            <div class="level-progress-item">
              <span class="level-label">B1:</span> 
              <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.min(100, (gameState.totalLearnedCount / gameState.levelProgression.B1.required) * 100)}%"></div>
              </div>
              <span class="progress-text">${gameState.totalLearnedCount}/${gameState.levelProgression.B1.required}</span>
            </div>
            <div class="level-progress-item">
              <span class="level-label">B2:</span> 
              <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.min(100, (gameState.totalLearnedCount / gameState.levelProgression.B2.required) * 100)}%"></div>
              </div>
              <span class="progress-text">${gameState.totalLearnedCount}/${gameState.levelProgression.B2.required}</span>
            </div>
          </div>
        </div>
        <div class="notebook-entries">
          ${renderNotebookEntries()}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Modal'ı göster
  setTimeout(() => {
    modal.style.display = 'block';
  }, 10);

  // Kapatma butonu
  modal.querySelector('.close-button').addEventListener('click', function() {
    modal.style.display = 'none';
    setTimeout(() => {
      modal.remove();
    }, 300);
  });

  // Modal dışına tıklanınca kapat
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  });
}

// Rastgele gülümseyen emoji yüz seç
function getRandomSmileyFace() {
  const smileys = [
    '😊', '😄', '😁', '😃', '🙂', '😀', '😉', '😍', '🤗', '😋', '🥰', '😸', '😺'
  ];
  return smileys[Math.floor(Math.random() * smileys.length)];
}

// Kelime defteri içeriğini oluştur
function renderNotebookEntries() {
  if (gameState.learnedWords.length === 0) {
    return `
      <div class="notebook-empty">
        <i class="fas fa-book-open"></i>
        <p>Henüz öğrenilen kelime yok.</p>
        <p>Oyunu oynayarak kelime defterinizi doldurun! ${getRandomSmileyFace()}</p>
      </div>
    `;
  }

  // Kelimeleri seviyelerine göre grupla
  const wordsByLevel = {};

  gameState.learnedWords.forEach(word => {
    const level = word.level || 'A1'; // Eğer seviye belirtilmemişse A1 kabul et
    if (!wordsByLevel[level]) {
      wordsByLevel[level] = [];
    }
    wordsByLevel[level].push(word);
  });

  // Her seviye için kelimeleri listele
  let html = '';

  ['A1', 'A2', 'B1', 'B2'].forEach(level => {
    if (wordsByLevel[level] && wordsByLevel[level].length > 0) {
      html += `
        <div class="notebook-level">
          <h3 class="level-title">${level} Seviyesi Kelimeler</h3>
          <div class="level-words">
            ${wordsByLevel[level].map(word => `
              <div class="notebook-entry">
                <h3>${word.word}</h3>
                <p class="meaning">${word.meaning}</p>
                <p class="date">Eklenme: ${word.date}</p>
                <span class="emoji-face">${getRandomSmileyFace()}</span>
                <button class="remove-btn" data-word="${word.word}"><i class="fas fa-times"></i></button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  return html;
}

// Ayarlar modalını göster
function toggleSettings() {
  // Modal oluştur
  const modal = document.createElement('div');
modal.className = 'modal';
  modal.id = 'settings-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Ayarlar</h2>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="settings-container">
          <div class="setting-row">
            <label for="sound-toggle">Ses</label>
            <label class="toggle-switch">
              <input type="checkbox" id="sound-toggle" ${gameState.isSoundEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <label for="difficulty-select">Zorluk Seviyesi</label>
            <select id="difficulty-select">
              <option value="easy">Kolay</option>
              <option value="medium" selected>Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>
          <div class="setting-row">
            <label>İlerleme Durumu</label>
            <button id="reset-progress" class="btn-danger">İlerlemeyi Sıfırla</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Modal'ı göster
  setTimeout(() => {
    modal.style.display = 'block';
  }, 10);

  // Ses ayarları toggle
  modal.querySelector('#sound-toggle').addEventListener('change', function() {
    gameState.isSoundEnabled = this.checked;
  });

  // İlerlemeyi sıfırla butonu
  modal.querySelector('#reset-progress').addEventListener('click', function() {
    if (confirm('Tüm ilerlemenizi sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      gameState.learnedWords = [];
      gameState.totalLearnedCount = 0;
      gameState.levelProgression = {
        A1: { required: 0, completed: false },
        A2: { required: 50, completed: false },
        B1: { required: 100, completed: false },
        B2: { required: 150, completed: false },
        advanced: { required: 200, completed: false }
      };

      // Local storage'ı temizle
      localStorage.removeItem('wordMaster_learnedWords');
      localStorage.removeItem('wordMaster_levelProgression');
      localStorage.removeItem('wordMaster_totalLearnedCount');

      // Seviye butonlarını güncelle
      updateLevelButtons();

      alert('İlerlemeniz sıfırlandı.');
      modal.style.display = 'none';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  });

  // Kapatma butonu
  modal.querySelector('.close-button').addEventListener('click', function() {
    modal.style.display = 'none';
    setTimeout(() => {
      modal.remove();
    }, 300);
  });

  // Modal dışına tıklanınca kapat
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  });
}

// Seviye kilidi bildirimini göster
function showLevelLockedNotification() {
  const notification = document.querySelector('.level-locked-notification');
  notification.classList.add('show');

  // Kilidin açılması için gereken kelime sayısını göster
  const levelButtons = document.querySelectorAll('.level-btn.locked');
  const nextLockedLevel = Array.from(levelButtons)[0];

  if (nextLockedLevel) {
    const level = nextLockedLevel.getAttribute('data-level');
    const requiredCount = gameState.levelProgression[level].required;
    const remainingCount = requiredCount - gameState.totalLearnedCount;

    notification.querySelector('p').textContent = `Bu seviyeyi açmak için ${remainingCount} kelime daha öğrenmelisiniz.`;
  }

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Seviye açıldı bildirimini göster
function showLevelUnlockedNotification(level) {
  const notification = document.querySelector('.level-unlocked-notification');
  notification.querySelector('p').textContent = `Tebrikler! ${level} seviyesini açtınız.`;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Sonuç ekranını göster
function showResultScreen() {
  document.getElementById('total-score').textContent = gameState.score;
  document.getElementById('total-correct').textContent = gameState.correctAnswers;
  document.getElementById('total-wrong').textContent = gameState.totalQuestions * 3 - gameState.correctAnswers;

  const successRate = Math.round((gameState.correctAnswers / (gameState.totalQuestions * 3)) * 100);

  // Sonuç mesajını ayarla
  let resultMessage = '';
  if (successRate >= 90) {
    resultMessage = 'Mükemmel! Harika bir performans gösterdiniz.';
  } else if (successRate >= 70) {
    resultMessage = 'Çok iyi! Kelime hazneniz gelişiyor.';
  } else if (successRate >= 50) {
    resultMessage = 'İyi! Biraz daha pratik yaparak daha da gelişebilirsiniz.';
  } else {
    resultMessage = 'Daha fazla pratik yaparak gelişebilirsiniz. Devam edin!';
  }

  // İlerleme bilgisini ekle
  resultMessage += ` Şu ana kadar toplam ${gameState.totalLearnedCount} kelime öğrendiniz.`;

  // Seviye kilidinin açılmasına ne kadar kaldığını göster
  const nextLevelNeeded = getNextLevelNeeded();
  if (nextLevelNeeded) {
    resultMessage += ` ${nextLevelNeeded.level} seviyesini açmak için ${nextLevelNeeded.remaining} kelime daha öğrenmeniz gerekiyor.`;
  } else if (gameState.totalLearnedCount >= gameState.levelProgression.B2.required) {
    resultMessage += ' Tüm seviyeleri açtınız, tebrikler!';
  }

  document.getElementById('result-message').textContent = resultMessage;

  // Sertifika seçeneğini göster
  if (successRate >= 70) {
    document.getElementById('certificate-info').style.display = 'block';
  } else {
    document.getElementById('certificate-info').style.display = 'none';
  }

  showScreen('result-screen');
}

// Bir sonraki seviyeyi açmak için gereken kelime sayısını hesapla
function getNextLevelNeeded() {
  const levels = [
    { level: 'A2', required: 50 },
    { level: 'B1', required: 100 },
    { level: 'B2', required: 150 }
  ];

  for (const levelInfo of levels) {
    if (gameState.totalLearnedCount < levelInfo.required) {
      return {
        level: levelInfo.level,
        remaining: levelInfo.required - gameState.totalLearnedCount
      };
    }
  }

  return null; // Tüm seviyeler açılmış
}

// Öğrenmeye devam et
function continueLearning() {
  // Oyunu yeniden başlat
  startGame();
}

// Sonucu paylaş
function shareResult() {
  const score = gameState.score;
  const correctAnswers = gameState.correctAnswers;
  const successRate = Math.round((correctAnswers / (gameState.totalQuestions * 3)) * 100);

  const shareText = `Word Master oyununda ${gameState.level} seviyesinde ${score} puan aldım! Başarı oranım: %${successRate}. Şimdiye kadar ${gameState.totalLearnedCount} kelime öğrendim. Siz de deneyin!`;

  // Web Share API varsa kullan
  if (navigator.share) {
    navigator.share({
      title: 'Word Master Skorumu Paylaş',
      text: shareText,
      url: window.location.href
    }).catch(console.error);
  } else {
    // Web Share API yoksa kopyala
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    alert('Sonuç kopyalandı! Şimdi istediğiniz yerde paylaşabilirsiniz.');
  }
}

// Sertifika gönder
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'send-certificate') {
    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();

    if (!email || !email.includes('@')) {
      alert('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    const userName = 'Değerli Kullanıcı';
    const score = gameState.score;
    const successRate = Math.round((gameState.correctAnswers / (gameState.totalQuestions * 3)) * 100) + '%';
    const level = gameState.level;
    const date = new Date().toLocaleDateString('tr-TR');

    // AJAX isteği ile sertifika gönder
    fetch('/send-certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName,
        userEmail: email,
        score,
        successRate,
        level,
        date
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Sertifikanız e-posta adresinize gönderildi!');
      } else {
        alert('Sertifika gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Sertifika gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  }
});

// İleri seviye ekranını göster (200 kelimeden sonra)
function showAdvancedContent() {
  // Modal oluştur
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'advanced-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>İleri Seviye İçeriği</h2>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="advanced-content">
          <h3>Tebrikler, Uzman Seviyeye Ulaştınız!</h3>
          <p>Şimdiye kadar ${gameState.totalLearnedCount} kelime öğrendiniz ve Word Master'da uzman seviyeye ulaştınız.</p>
          <p>Artık dil öğrenme yolculuğunuzda ilerlemek için şu seçeneklere sahipsiniz:</p>

          <div class="advanced-options">
            <div class="advanced-option">
              <i class="fas fa-book-reader"></i>
              <h4>Özel Kelime Çalışmaları</h4>
              <p>Kendi kelime listelerinizi oluşturabilir ve çalışabilirsiniz.</p>
              <button class="btn-advanced" id="custom-words-btn">Kelime Listesi Oluştur</button>
            </div>

            <div class="advanced-option">
              <i class="fas fa-graduation-cap"></i>
              <h4>Konuşma Pratiği</h4>
              <p>Öğrendiğiniz kelimeleri gerçek konuşmalarda kullanın.</p>
              <button class="btn-advanced" id="speaking-practice-btn">Konuşma Pratiği</button>
            </div>

            <div class="advanced-option">
              <i class="fas fa-certificate"></i>
              <h4>Dil Sertifikaları</h4>
              <p>Edindiğiniz bilgileri sertifikalarla belgelendirin.</p>
              <button class="btn-advanced" id="certificates-btn">Sertifika Programları</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Modal'ı göster
  setTimeout(() => {
    modal.style.display = 'block';
  }, 10);

  // Kapatma butonu
  modal.querySelector('.close-button').addEventListener('click', function() {
    modal.style.display = 'none';
    setTimeout(() => {
      modal.remove();
    }, 300);
  });

  // Advanced seçenekler için olay dinleyicileri
  modal.querySelector('#custom-words-btn').addEventListener('click', function() {
    alert('Özel kelime listesi oluşturma özelliği yakında eklenecek!');
  });

  modal.querySelector('#speaking-practice-btn').addEventListener('click', function() {
    alert('Konuşma pratiği modülü yakında eklenecek!');
  });

  modal.querySelector('#certificates-btn').addEventListener('click', function() {
    alert('Sertifika programları yakında erişime açılacak!');
  });

  // Modal dışına tıklanınca kapat
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  });
}

// Öğrenme hızınızı göster
function showLearningRate() {
  // Öğrenilme tarihi bilgisi olan kelimeleri filtrele
  const datedWords = gameState.learnedWords.filter(word => word.date);

  if (datedWords.length === 0) {
    return 'Henüz öğrenilen kelime yok.';
  }

  // Tarihleri analiz et
  const dateCount = {};
  datedWords.forEach(word => {
    if (!dateCount[word.date]) {
      dateCount[word.date] = 0;
    }
    dateCount[word.date]++;
  });

  // En son 7 günlük istatistikleri hesapla
  const dates = Object.keys(dateCount).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);

    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);

    return dateB - dateA; // Yeni tarih önce
  });

  const last7days = dates.slice(0, 7);
  const totalLast7days = last7days.reduce((sum, date) => sum + dateCount[date], 0);
  const averagePerDay = totalLast7days / Math.min(7, last7days.length);

  return `Son ${Math.min(7, last7days.length)} günde günde ortalama ${averagePerDay.toFixed(1)} kelime öğrendiniz.`;
}

// Sayfa yüklendiğinde, ilerleme durumunu kontrol et
document.addEventListener('DOMContentLoaded', function() {
  if (gameState.totalLearnedCount >= gameState.levelProgression.advanced.required && !gameState.levelProgression.advanced.completed) {
    // İleri seviye içeriğini göster
    setTimeout(() => {
      showAdvancedContent();
    }, 1000);

    gameState.levelProgression.advanced.completed = true;
    localStorage.setItem('wordMaster_levelProgression', JSON.stringify(gameState.levelProgression));
  }
});

// Mikrofon başlatma fonksiyonu
  document.addEventListener('DOMContentLoaded', function() {
  const startRecordingButton = document.getElementById('start-recording');
  const micStatus = document.getElementById('mic-status');

  if (startRecordingButton) {
    startRecordingButton.addEventListener('click', function() {
      if (!gameState.isRecording) {
        startSpeechRecognition();
      } else {
        // Mikrofon zaten açıksa, kapat
        if (gameState.speechRecognition) {
          gameState.speechRecognition.stop();
          gameState.isRecording = false;
          startRecordingButton.classList.remove('recording');
          micStatus.textContent = 'Mikrofon kapalı';
        }
      }
    });
  }
});