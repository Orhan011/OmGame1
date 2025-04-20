/**
 * İcatlar ve İsimler: Tarihin Dehaları
 * --------------------------------------
 * Tarih boyunca önemli icatları ve mucitlerini eşleştirmeye dayalı eğitici bir oyun.
 * 
 * @version 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elemanları
  const introScreen = document.getElementById('introScreen');
  const gameScreen = document.getElementById('gameScreen');
  const resultScreen = document.getElementById('resultScreen');
  
  const startGameBtn = document.getElementById('startGameBtn');
  const modeButtons = document.querySelectorAll('.mode-button');
  const categorySelect = document.getElementById('categorySelect');
  const difficultyButtons = document.querySelectorAll('[data-difficulty]');
  
  const scoreValue = document.getElementById('scoreValue');
  const currentQuestion = document.getElementById('currentQuestion');
  const totalQuestions = document.getElementById('totalQuestions');
  const timeValue = document.getElementById('timeValue');
  const livesValue = document.getElementById('livesValue');
  const progressBar = document.getElementById('progressBar');
  
  const questionText = document.getElementById('questionText');
  const inventionImage = document.getElementById('inventionImage');
  const answersContainer = document.getElementById('answersContainer');
  const hintButton = document.getElementById('hintButton');
  const nextButton = document.getElementById('nextButton');
  const hintContainer = document.getElementById('hintContainer');
  const hintText = document.getElementById('hintText');
  
  const timeContainer = document.getElementById('timeContainer');
  const livesContainer = document.getElementById('livesContainer');
  
  const finalScore = document.getElementById('finalScore');
  const correctAnswers = document.getElementById('correctAnswers');
  const timeSpent = document.getElementById('timeSpent');
  const knowledgeList = document.getElementById('knowledgeList');
  const playAgainButton = document.getElementById('playAgainButton');

  // Oyun Ayarları
  const settings = {
    gameMode: 'time', // 'time', 'survival', 'category'
    category: 'all', // 'all', 'science', 'technology', 'medicine', 'communication', 'transportation'
    difficulty: 'easy', // 'easy', 'medium', 'hard'
    score: 0,
    currentQuestionIndex: 0,
    selectedAnswerIndex: null,
    isAnswerSelected: false,
    timeRemaining: 60,
    lives: 3,
    totalCorrect: 0,
    hintsUsed: 0,
    startTime: null,
    endTime: null,
    timerInterval: null,
    questions: [],
    learnedFacts: []
  };

  // Bilgi Veri Tabanı - Gerçek ve doğrulanabilir bilgiler
  const inventionsDatabase = [
    // Teknoloji
    {
      id: 1,
      question: "Transistör kimler tarafından icat edilmiştir?",
      invention: "Transistör",
      inventor: "John Bardeen, Walter Brattain ve William Shockley",
      year: 1947,
      category: "technology",
      image: "transistor.svg",
      options: [
        "Thomas Edison",
        "John Bardeen, Walter Brattain ve William Shockley",
        "Alexander Graham Bell",
        "Nikola Tesla"
      ],
      hint: "Bell Laboratuvarları'nda çalışan bu üç bilim insanı, icatları için 1956'da Nobel Fizik Ödülü'nü kazandılar.",
      fact: "Transistör, modern elektronik cihazların temel yapı taşıdır ve icat edilmesi bilgisayar çağının başlangıcı olarak kabul edilir."
    },
    {
      id: 2,
      question: "Mikroişlemciyi (microprocessor) kim icat etmiştir?",
      invention: "Mikroişlemci",
      inventor: "Ted Hoff, Federico Faggin ve Stan Mazor",
      year: 1971,
      category: "technology",
      image: "microprocessor.svg",
      options: [
        "Ted Hoff, Federico Faggin ve Stan Mazor",
        "Steve Jobs ve Steve Wozniak",
        "Bill Gates ve Paul Allen",
        "Jack Kilby ve Robert Noyce"
      ],
      hint: "Intel şirketi için çalışan bu ekip, ilk ticari mikroişlemci olan 4004'ü geliştirdi.",
      fact: "İlk mikroişlemci olan Intel 4004, günümüzdeki modern bilgisayar çiplerinden yaklaşık 80.000 kat daha az transistöre sahipti."
    },
    {
      id: 3,
      question: "Dünya Çapında Ağ'ı (World Wide Web) kim geliştirmiştir?",
      invention: "World Wide Web",
      inventor: "Tim Berners-Lee",
      year: 1989,
      category: "technology",
      image: "www.svg",
      options: [
        "Bill Gates",
        "Tim Berners-Lee",
        "Vint Cerf",
        "Steve Jobs"
      ],
      hint: "CERN'de çalışırken HTML ve HTTP protokollerini geliştiren bu bilim insanı, web tarayıcısının da mucididir.",
      fact: "Berners-Lee, WWW'yi herkesin kullanabilmesi için patent almayı reddetti ve icat ettiği teknolojileri ücretsiz olarak paylaştı."
    },
    {
      id: 4,
      question: "Dizel motoru kim icat etmiştir?",
      invention: "Dizel Motoru",
      inventor: "Rudolf Diesel",
      year: 1893,
      category: "technology",
      image: "diesel_engine.svg",
      options: [
        "Henry Ford",
        "Rudolf Diesel",
        "Gottlieb Daimler",
        "Karl Benz"
      ],
      hint: "Bu Alman mühendis, kendi adını taşıyan daha verimli bir motor tipi geliştirdi.",
      fact: "Rudolf Diesel, icadının çalışma prensibini termodinamik teorisine dayandırmıştır ve modern dizel motorlar hala onun temel tasarımını kullanır."
    },
    // Bilim
    {
      id: 5,
      question: "Periyodik tabloyu kim icat etmiştir?",
      invention: "Periyodik Tablo",
      inventor: "Dmitri Mendeleev",
      year: 1869,
      category: "science",
      image: "periodic_table.svg",
      options: [
        "Antoine Lavoisier",
        "Marie Curie",
        "Dmitri Mendeleev",
        "John Dalton"
      ],
      hint: "Bu Rus kimyager, elementleri atomik ağırlıklarına göre düzenleyerek henüz keşfedilmemiş elementlerin özelliklerini tahmin etmiştir.",
      fact: "Mendeleev, tablosunda keşfedilmemiş elementler için boşluklar bıraktı ve bu elementlerin özelliklerini doğru bir şekilde tahmin etti."
    },
    {
      id: 6,
      question: "Röntgen ışınlarını kim keşfetmiştir?",
      invention: "X-Ray (Röntgen Işınları)",
      inventor: "Wilhelm Conrad Röntgen",
      year: 1895,
      category: "science",
      image: "xray.svg",
      options: [
        "Marie Curie",
        "Wilhelm Conrad Röntgen",
        "Albert Einstein",
        "Max Planck"
      ],
      hint: "Bu Alman fizikçi, yeni keşfettiği ve X-ışınları olarak adlandırdığı bu ışınlarla eşinin el iskeletinin fotoğrafını çekmiştir.",
      fact: "Röntgen, X-ışınlarıyla ilgili çalışmaları için 1901'de ilk Nobel Fizik Ödülü'nü kazanmıştır."
    },
    {
      id: 7,
      question: "Radyoaktivite kavramını kim keşfetmiştir?",
      invention: "Radyoaktivite",
      inventor: "Henri Becquerel",
      year: 1896,
      category: "science",
      image: "radioactivity.svg",
      options: [
        "Henri Becquerel",
        "Marie Curie",
        "Ernest Rutherford",
        "Niels Bohr"
      ],
      hint: "Bu Fransız fizikçi, uranyum tuzlarının fotoğraf plakalarını ışıktan izole edildiklerinde bile etkilediklerini fark etmiştir.",
      fact: "Becquerel, radyoaktiviteyi keşfettiğinde aslında fosforesans üzerine çalışıyordu ve keşfi büyük ölçüde tesadüf eseriydi."
    },
    // Tıp
    {
      id: 8,
      question: "Penisilin antibiyotiğini kim keşfetmiştir?",
      invention: "Penisilin",
      inventor: "Alexander Fleming",
      year: 1928,
      category: "medicine",
      image: "penicillin.svg",
      options: [
        "Louis Pasteur",
        "Alexander Fleming",
        "Joseph Lister",
        "Robert Koch"
      ],
      hint: "Bu İskoç bilim insanı, laboratuvarında bakteri kültürlerini incelerken, küf mantarının bakterileri öldürdüğünü fark etmiştir.",
      fact: "Fleming'in keşfi tesadüfen gerçekleşti; laboratuvarını dağınık bıraktığı için küf kolonisi gelişti ve bu sayede penisilin keşfedildi."
    },
    {
      id: 9,
      question: "İnsan Genom Projesi'nin liderlerinden biri kimdir?",
      invention: "İnsan Genom Projesi",
      inventor: "Francis Collins ve Craig Venter",
      year: 1990,
      category: "medicine",
      image: "genome.svg",
      options: [
        "James Watson ve Francis Crick",
        "Rosalind Franklin",
        "Francis Collins ve Craig Venter",
        "Barbara McClintock"
      ],
      hint: "ABD Ulusal İnsan Genomu Araştırma Enstitüsü direktörü ve özel bir şirketin kurucusu olan bu iki bilim insanı, insan DNA dizilimini çözme yarışındaydı.",
      fact: "İnsan Genom Projesi ilk olarak 13 yılda tamamlanması planlanmıştı, ancak yeni teknolojiler sayesinde sadece 10 yılda tamamlandı."
    },
    // İletişim
    {
      id: 10,
      question: "Telefonu kim icat etmiştir?",
      invention: "Telefon",
      inventor: "Alexander Graham Bell",
      year: 1876,
      category: "communication",
      image: "telephone.svg",
      options: [
        "Thomas Edison",
        "Alexander Graham Bell",
        "Guglielmo Marconi",
        "Nikola Tesla"
      ],
      hint: "Bu İskoç bilim insanının ilk telefon sözleri: 'Bay Watson, lütfen buraya gelin, sizi görmek istiyorum.'",
      fact: "Bell'in patent başvurusu, Elisha Gray'in benzer bir cihaz için başvurusundan sadece birkaç saat önce yapılmıştır."
    },
    {
      id: 11,
      question: "Radyoyu kim icat etmiştir?",
      invention: "Radyo",
      inventor: "Guglielmo Marconi",
      year: 1895,
      category: "communication",
      image: "radio.svg",
      options: [
        "Nikola Tesla",
        "Thomas Edison",
        "Guglielmo Marconi",
        "Alexander Graham Bell"
      ],
      hint: "Bu İtalyan mucit, 1909'da telsiz telgrafın geliştirilmesindeki katkıları için Nobel Fizik Ödülü'nü kazanmıştır.",
      fact: "Marconi'nin ilk uzun mesafeli radyo iletimi 1901'de Atlantik Okyanusu'nu geçmiştir ve Morse koduyla 'S' harfi iletilmiştir."
    },
    // Ulaşım
    {
      id: 12,
      question: "İlk pratik otomobili kim icat etmiştir?",
      invention: "Otomobil",
      inventor: "Karl Benz",
      year: 1885,
      category: "transportation",
      image: "automobile.svg",
      options: [
        "Henry Ford",
        "Karl Benz",
        "Gottlieb Daimler",
        "Rudolf Diesel"
      ],
      hint: "Bu Alman mühendis, ilk benzinli içten yanmalı motorla çalışan üç tekerlekli aracı geliştirmiştir.",
      fact: "Karl Benz'in eşi Bertha, ilk uzun mesafeli otomobil yolculuğunu yaparak arabanın pratik kullanımını kanıtlamış ve bu yolculuk sırasında birçok mekanik sorunu kendisi çözmüştür."
    },
    {
      id: 13,
      question: "Modern bilgisayarın babası olarak bilinen kişi kimdir?",
      invention: "Modern Bilgisayar",
      inventor: "Alan Turing",
      year: 1936,
      category: "technology",
      image: "computer.svg",
      options: [
        "Alan Turing",
        "John von Neumann",
        "Charles Babbage",
        "Ada Lovelace"
      ],
      hint: "Bu İngiliz matematikçi, II. Dünya Savaşı sırasında Nazi Almanya'sının Enigma şifrelerini kırmada önemli rol oynamıştır.",
      fact: "Turing, 'makinelerin düşünüp düşünemeyeceğini' test etmek için Turing Testi olarak bilinen metodu önermiştir."
    },
    {
      id: 14,
      question: "İlk elektrik ampulünü kim icat etmiştir?",
      invention: "Elektrik Ampulü",
      inventor: "Thomas Edison",
      year: 1879,
      category: "technology",
      image: "lightbulb.svg",
      options: [
        "Nikola Tesla",
        "Thomas Edison",
        "Alexander Graham Bell",
        "James Watt"
      ],
      hint: "Bu Amerikalı mucit, 1000'den fazla başarısız denemeden sonra karbonize bambu filament kullanarak pratik bir ampul geliştirmiştir.",
      fact: "Edison aslında ilk ampulü icat etmemiştir; ondan önce Joseph Swan gibi mucitler de ampuller geliştirmişti, ancak Edison'un tasarımı daha pratik ve uzun ömürlüydü."
    },
    {
      id: 15,
      question: "Buharlı motoru kim geliştirmiştir?",
      invention: "Modern Buharlı Motor",
      inventor: "James Watt",
      year: 1769,
      category: "technology",
      image: "steam_engine.svg",
      options: [
        "James Watt",
        "Thomas Newcomen",
        "Robert Fulton",
        "George Stephenson"
      ],
      hint: "Bu İskoç mühendis, daha önceki tasarımları önemli ölçüde geliştirerek Sanayi Devrimi'nin başlamasında kritik rol oynamıştır.",
      fact: "Güç birimi 'watt' James Watt'ın anısına adlandırılmıştır ve 1 watt, 1 joule enerjinin 1 saniyede harcanması olarak tanımlanır."
    }
  ];

  // Skor hesaplayıcı sistemini başlat
  let scoreSystem = null;
  if (typeof GameScoreHelper !== 'undefined') {
    scoreSystem = new GameScoreHelper('inventions-quiz', {
      maxScore: 100,
      metrics: {
        correct: { weight: 10, description: 'Doğru cevap' },
        time: { weight: 5, description: 'Hızlı cevaplama' },
        hints: { weight: -2, description: 'İpucu kullanımı' }
      }
    });
  }

  // Oyun modunu değiştir
  function changeGameMode(mode) {
    settings.gameMode = mode;
    modeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });

    if (mode === 'category') {
      document.querySelector('.category-selector').style.display = 'block';
    } else {
      document.querySelector('.category-selector').style.display = 'none';
    }

    // Oyun moduna göre açıklama güncelleme yapılabilir
  }

  // Kategori seçimi
  function changeCategory(category) {
    settings.category = category;
  }

  // Zorluk seviyesi seçimi
  function changeDifficulty(difficulty) {
    settings.difficulty = difficulty;
    difficultyButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.difficulty === difficulty);
    });
  }

  // Oyun sorularını hazırla
  function prepareQuestions() {
    let availableQuestions = [...inventionsDatabase];
    
    // Kategori filtresi
    if (settings.category !== 'all') {
      availableQuestions = availableQuestions.filter(q => q.category === settings.category);
    }
    
    // Zorluk seviyesine göre ayarlar
    let questionCount = 10;  // Varsayılan soru sayısı
    
    if (settings.difficulty === 'easy') {
      questionCount = 5;
    } else if (settings.difficulty === 'medium') {
      questionCount = 10;
    } else if (settings.difficulty === 'hard') {
      questionCount = 15;
    }
    
    // Soruları karıştır ve istenen sayıda soru seç
    availableQuestions = shuffle(availableQuestions);
    settings.questions = availableQuestions.slice(0, questionCount);
    
    // Toplam soru sayısını güncelle
    totalQuestions.textContent = settings.questions.length;
  }

  // Soru yükle
  function loadQuestion() {
    if (settings.currentQuestionIndex >= settings.questions.length) {
      endGame();
      return;
    }
    
    // İlerleme çubuğunu güncelle
    const progress = (settings.currentQuestionIndex / settings.questions.length) * 100;
    progressBar.style.width = progress + '%';
    
    // Mevcut soru numarasını güncelle
    currentQuestion.textContent = settings.currentQuestionIndex + 1;
    
    const currentQuestion = settings.questions[settings.currentQuestionIndex];
    
    // Soru metnini ayarla
    questionText.textContent = currentQuestion.question;
    
    // Resmi ayarla - şu anki durumda basit bir SVG kullanıyoruz
    inventionImage.src = '/static/img/games/inventions/placeholder.svg';
    inventionImage.alt = currentQuestion.invention;
    
    // Cevap seçeneklerini temizle ve yeniden oluştur
    answersContainer.innerHTML = '';
    let shuffledOptions = shuffle([...currentQuestion.options]);
    
    shuffledOptions.forEach((option, index) => {
      const answerOption = document.createElement('div');
      answerOption.className = 'answer-option';
      answerOption.dataset.index = index;
      
      const answerText = document.createElement('div');
      answerText.className = 'answer-text';
      answerText.textContent = option;
      
      const correctMark = document.createElement('div');
      correctMark.className = 'correct-mark';
      correctMark.innerHTML = '<i class="fas fa-check"></i>';
      
      const incorrectMark = document.createElement('div');
      incorrectMark.className = 'incorrect-mark';
      incorrectMark.innerHTML = '<i class="fas fa-times"></i>';
      
      answerOption.appendChild(answerText);
      answerOption.appendChild(correctMark);
      answerOption.appendChild(incorrectMark);
      
      answerOption.addEventListener('click', () => selectAnswer(index, option));
      answersContainer.appendChild(answerOption);
    });
    
    // İpucu konteynerini sıfırla
    hintContainer.style.display = 'none';
    hintText.textContent = '';
    
    // Butonları sıfırla
    nextButton.disabled = true;
    settings.isAnswerSelected = false;
    settings.selectedAnswerIndex = null;
  }

  // Cevap seç
  function selectAnswer(index, selectedOption) {
    if (settings.isAnswerSelected) return;
    
    settings.isAnswerSelected = true;
    settings.selectedAnswerIndex = index;
    
    const currentQuestion = settings.questions[settings.currentQuestionIndex];
    const correctAnswer = currentQuestion.inventor;
    const isCorrect = selectedOption === correctAnswer;
    
    // Tüm seçenekleri devre dışı bırak ve doğru cevabı göster
    const options = answersContainer.querySelectorAll('.answer-option');
    options.forEach(option => {
      const optionText = option.querySelector('.answer-text').textContent;
      
      if (optionText === correctAnswer) {
        option.classList.add('correct');
      }
      
      if (option.dataset.index == index && !isCorrect) {
        option.classList.add('selected', 'incorrect');
      } else if (option.dataset.index == index) {
        option.classList.add('selected');
      }
    });
    
    // Skor güncelle
    if (isCorrect) {
      settings.score += 10;
      settings.totalCorrect++;
      
      if (scoreSystem) {
        scoreSystem.incrementCorrect();
      }
      
      // Öğrenilen bilgiyi kaydet
      settings.learnedFacts.push({
        invention: currentQuestion.invention,
        inventor: currentQuestion.inventor,
        year: currentQuestion.year,
        fact: currentQuestion.fact
      });
    } else {
      // Hayatta kalma modunda can düşür
      if (settings.gameMode === 'survival') {
        settings.lives--;
        livesValue.textContent = settings.lives;
        
        if (settings.lives <= 0) {
          setTimeout(endGame, 1500);
          return;
        }
      }
    }
    
    // Skor göstergesini güncelle
    scoreValue.textContent = settings.score;
    
    // İleri butonunu aktif et
    nextButton.disabled = false;
  }

  // İpucu göster
  function showHint() {
    const currentQuestion = settings.questions[settings.currentQuestionIndex];
    hintContainer.style.display = 'block';
    hintText.textContent = currentQuestion.hint;
    
    // İpucu kullanımı için ceza
    settings.score = Math.max(0, settings.score - 2);
    scoreValue.textContent = settings.score;
    settings.hintsUsed++;
    
    if (scoreSystem) {
      scoreSystem.incrementHints();
    }
    
    // İpucu butonunu devre dışı bırak
    hintButton.disabled = true;
  }

  // Sonraki soruya geç
  function nextQuestion() {
    settings.currentQuestionIndex++;
    
    // İpucu butonunu aktif et
    hintButton.disabled = false;
    
    // Yeni soru yükle
    loadQuestion();
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    if (settings.gameMode !== 'time') return;
    
    settings.timerInterval = setInterval(() => {
      settings.timeRemaining--;
      timeValue.textContent = settings.timeRemaining;
      
      if (settings.timeRemaining <= 0) {
        clearInterval(settings.timerInterval);
        endGame();
      }
    }, 1000);
  }

  // Oyunu başlat
  function startGame() {
    // Oyun ayarlarını sıfırla
    settings.score = 0;
    settings.currentQuestionIndex = 0;
    settings.totalCorrect = 0;
    settings.hintsUsed = 0;
    settings.learnedFacts = [];
    settings.startTime = new Date();
    
    // Zamanlayıcı veya can sistemine göre düzenle
    if (settings.gameMode === 'time') {
      settings.timeRemaining = 60;
      timeValue.textContent = settings.timeRemaining;
      timeContainer.style.display = 'block';
      livesContainer.style.display = 'none';
    } else if (settings.gameMode === 'survival') {
      settings.lives = 3;
      livesValue.textContent = settings.lives;
      timeContainer.style.display = 'none';
      livesContainer.style.display = 'block';
    } else {
      timeContainer.style.display = 'none';
      livesContainer.style.display = 'none';
    }
    
    // Arayüzü güncelle
    scoreValue.textContent = settings.score;
    
    // Soruları hazırla
    prepareQuestions();
    
    // İlk soruyu yükle
    loadQuestion();
    
    // Zamanlayıcıyı başlat (eğer zaman modundaysa)
    if (settings.gameMode === 'time') {
      startTimer();
    }
    
    // Ekranları göster/gizle
    introScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    resultScreen.style.display = 'none';
    
    // Skor sistemini başlat
    if (scoreSystem) {
      scoreSystem.resetMetrics();
    }
  }

  // Oyunu bitir
  function endGame() {
    settings.endTime = new Date();
    clearInterval(settings.timerInterval);
    
    // Oyun sonuç ekranını hazırla
    finalScore.textContent = settings.score;
    correctAnswers.textContent = settings.totalCorrect;
    
    // Geçen süreyi hesapla
    const totalSeconds = Math.floor((settings.endTime - settings.startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeSpent.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    
    // Öğrenilen bilgileri listele
    knowledgeList.innerHTML = '';
    settings.learnedFacts.forEach(fact => {
      const listItem = document.createElement('li');
      listItem.className = 'knowledge-item';
      listItem.innerHTML = '<i class="fas fa-lightbulb"></i> <strong>' + fact.invention + 
                           '</strong> - ' + fact.inventor + ' (' + fact.year + '): ' + fact.fact;
      knowledgeList.appendChild(listItem);
    });
    
    // Eğer hiçbir bilgi öğrenilmediyse
    if (settings.learnedFacts.length === 0) {
      const listItem = document.createElement('li');
      listItem.className = 'knowledge-item';
      listItem.innerHTML = '<i class="fas fa-info-circle"></i> Bu oyunda yeni bilgiler öğrenmek için doğru cevaplar vermelisiniz.';
      knowledgeList.appendChild(listItem);
    }
    
    // Ekranları göster/gizle
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    
    // Skor sistemine sonuçları kaydet
    if (scoreSystem) {
      // Zorluğa göre skor çarpanı
      let difficultyMultiplier = 1.0;
      if (settings.difficulty === 'easy') difficultyMultiplier = 0.8;
      if (settings.difficulty === 'hard') difficultyMultiplier = 1.2;
      
      // Oyun moduna göre skor çarpanı
      let modeMultiplier = 1.0;
      if (settings.gameMode === 'survival') modeMultiplier = 1.1;
      if (settings.gameMode === 'category') modeMultiplier = 0.9;
      
      // Final skoru hesapla
      const finalCalculatedScore = Math.floor(settings.score * difficultyMultiplier * modeMultiplier);
      
      // Skor sistemine kaydet
      scoreSystem.setRawScore(finalCalculatedScore);
      scoreSystem.setCompletionData({
        mode: settings.gameMode,
        difficulty: settings.difficulty,
        category: settings.category,
        questionsAnswered: settings.currentQuestionIndex,
        correctAnswers: settings.totalCorrect,
        timeSpent: totalSeconds,
        hintsUsed: settings.hintsUsed
      });
      
      // Otomatik olarak skoru kaydet
      setTimeout(() => {
        scoreSystem.saveScore();
      }, 1000);
    }
  }

  // Yardımcı fonksiyonlar
  function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Event Listeners
  startGameBtn.addEventListener('click', startGame);
  
  // Oyun modu seçimi
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      changeGameMode(button.dataset.mode);
    });
  });
  
  // Kategori seçimi
  categorySelect.addEventListener('change', () => {
    changeCategory(categorySelect.value);
  });
  
  // Zorluk seviyesi seçimi
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      changeDifficulty(button.dataset.difficulty);
    });
  });
  
  // İpucu butonu
  hintButton.addEventListener('click', showHint);
  
  // Sonraki soru butonu
  nextButton.addEventListener('click', nextQuestion);
  
  // Tekrar oyna butonu
  playAgainButton.addEventListener('click', () => {
    resultScreen.style.display = 'none';
    introScreen.style.display = 'block';
  });
});