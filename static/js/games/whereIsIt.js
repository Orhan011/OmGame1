/*
 * Kim Nerede? Oyunu
 * Türkiye haritası üzerinde belirtilen şehirleri bulma oyunu
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const mapContainer = document.getElementById('map-container');
  const characterImage = document.getElementById('character-image');
  const characterName = document.getElementById('character-name');
  const progressBar = document.getElementById('progress-bar');
  const hintButton = document.getElementById('hint-button');
  const hintDisplay = document.getElementById('hint-display');
  const pauseGameBtn = document.getElementById('pause-game');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const startButton = document.getElementById('start-game');

  // Zorluk Seçimi Butonları
  const easyModeBtn = document.getElementById('easy-mode');
  const mediumModeBtn = document.getElementById('medium-mode');
  const hardModeBtn = document.getElementById('hard-mode');

  // Ses Efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    gameover: new Audio('/static/sounds/gameover.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    tick: new Audio('/static/sounds/tick.mp3'),
    hint: new Audio('/static/sounds/hint.mp3')
  };

  // Ses çalma fonksiyonu
  function playSound(sound) {
    try {
      if (gameState.soundEnabled) {
        sounds[sound].currentTime = 0;
        sounds[sound].play();
      }
    } catch (err) {
      console.log("Sound play error:", err);
    }
  }

  // Oyun durumu
  const gameState = {
    score: 0,
    round: 0,
    maxRounds: 10,
    timeRemaining: 30,
    timerInterval: null,
    isGameActive: false,
    isGamePaused: false,
    soundEnabled: true,
    hintCount: 3,
    currentCity: null,
    difficulty: 'easy',  // default zorluk: kolay
    cities: [] // yüklenecek şehirler
  };

  // Zorluğa göre şehirler ve süre
  const difficultySettings = {
    easy: {
      cities: [
        { name: "İstanbul", x: 290, y: 80, hints: ["Boğaziçi'nin incisi", "İki kıtayı birleştiren şehir", "Türkiye'nin en kalabalık şehri"] },
        { name: "Ankara", x: 345, y: 170, hints: ["Başkent", "Türkiye'nin ikinci büyük şehri", "Anıtkabir bu şehirde"] },
        { name: "İzmir", x: 170, y: 220, hints: ["Ege'nin incisi", "Saat Kulesi'nin şehri", "Türkiye'nin üçüncü büyük şehri"] },
        { name: "Antalya", x: 230, y: 330, hints: ["Turizm cenneti", "Konyaaltı ve Lara plajlarının şehri", "Dünyanın en popüler tatil destinasyonlarından"] },
        { name: "Bursa", x: 250, y: 120, hints: ["Osmanlı'nın ilk başkenti", "Uludağ'ın eteklerinde", "Yeşil Bursa olarak bilinir"] },
        { name: "Konya", x: 290, y: 250, hints: ["Mevlana'nın şehri", "Selçuklu Başkenti", "Türkiye'nin yüzölçümü en büyük ili"] },
        { name: "Adana", x: 325, y: 310, hints: ["Kebabıyla ünlü", "Seyhan Nehri'nin geçtiği şehir", "Şalgam suyunun memleketi"] },
        { name: "Trabzon", x: 540, y: 100, hints: ["Karadeniz'in incisi", "Sümela Manastırı'nın bulunduğu il", "Hamsi ve mısır ekmeği ile ünlü"] }
      ],
      timeLimit: 30
    },
    medium: {
      cities: [
        { name: "İstanbul", x: 290, y: 80, hints: ["Boğaziçi'nin incisi", "İki kıtayı birleştiren şehir", "Türkiye'nin en kalabalık şehri"] },
        { name: "Ankara", x: 345, y: 170, hints: ["Başkent", "Türkiye'nin ikinci büyük şehri", "Anıtkabir bu şehirde"] },
        { name: "İzmir", x: 170, y: 220, hints: ["Ege'nin incisi", "Saat Kulesi'nin şehri", "Türkiye'nin üçüncü büyük şehri"] },
        { name: "Antalya", x: 230, y: 330, hints: ["Turizm cenneti", "Konyaaltı ve Lara plajlarının şehri", "Dünyanın en popüler tatil destinasyonlarından"] },
        { name: "Bursa", x: 250, y: 120, hints: ["Osmanlı'nın ilk başkenti", "Uludağ'ın eteklerinde", "Yeşil Bursa olarak bilinir"] },
        { name: "Konya", x: 290, y: 250, hints: ["Mevlana'nın şehri", "Selçuklu Başkenti", "Türkiye'nin yüzölçümü en büyük ili"] },
        { name: "Adana", x: 325, y: 310, hints: ["Kebabıyla ünlü", "Seyhan Nehri'nin geçtiği şehir", "Şalgam suyunun memleketi"] },
        { name: "Trabzon", x: 540, y: 100, hints: ["Karadeniz'in incisi", "Sümela Manastırı'nın bulunduğu il", "Hamsi ve mısır ekmeği ile ünlü"] },
        { name: "Eskişehir", x: 280, y: 145, hints: ["Öğrenci şehri", "Porsuk Çayı'nın geçtiği şehir", "Lületaşı ile ünlü"] },
        { name: "Gaziantep", x: 390, y: 300, hints: ["Baklava ve fıstık şehri", "Zeugma Müzesi burada", "Gastronomi şehri olarak UNESCO listesinde"] },
        { name: "Samsun", x: 450, y: 115, hints: ["19 Mayıs şehri", "Atatürk'ün Kurtuluş Savaşı'nı başlattığı yer", "Karadeniz'in en büyük limanı"] },
        { name: "Diyarbakır", x: 480, y: 260, hints: ["Surları ile ünlü", "Dicle Nehri kıyısında", "Karpuzuyla meşhur"] }
      ],
      timeLimit: 25
    },
    hard: {
      cities: [
        { name: "İstanbul", x: 290, y: 80, hints: ["Boğaziçi'nin incisi", "İki kıtayı birleştiren şehir", "Türkiye'nin en kalabalık şehri"] },
        { name: "Ankara", x: 345, y: 170, hints: ["Başkent", "Türkiye'nin ikinci büyük şehri", "Anıtkabir bu şehirde"] },
        { name: "İzmir", x: 170, y: 220, hints: ["Ege'nin incisi", "Saat Kulesi'nin şehri", "Türkiye'nin üçüncü büyük şehri"] },
        { name: "Antalya", x: 230, y: 330, hints: ["Turizm cenneti", "Konyaaltı ve Lara plajlarının şehri", "Dünyanın en popüler tatil destinasyonlarından"] },
        { name: "Bursa", x: 250, y: 120, hints: ["Osmanlı'nın ilk başkenti", "Uludağ'ın eteklerinde", "Yeşil Bursa olarak bilinir"] },
        { name: "Konya", x: 290, y: 250, hints: ["Mevlana'nın şehri", "Selçuklu Başkenti", "Türkiye'nin yüzölçümü en büyük ili"] },
        { name: "Adana", x: 325, y: 310, hints: ["Kebabıyla ünlü", "Seyhan Nehri'nin geçtiği şehir", "Şalgam suyunun memleketi"] },
        { name: "Trabzon", x: 540, y: 100, hints: ["Karadeniz'in incisi", "Sümela Manastırı'nın bulunduğu il", "Hamsi ve mısır ekmeği ile ünlü"] },
        { name: "Eskişehir", x: 280, y: 145, hints: ["Öğrenci şehri", "Porsuk Çayı'nın geçtiği şehir", "Lületaşı ile ünlü"] },
        { name: "Gaziantep", x: 390, y: 300, hints: ["Baklava ve fıstık şehri", "Zeugma Müzesi burada", "Gastronomi şehri olarak UNESCO listesinde"] },
        { name: "Samsun", x: 450, y: 115, hints: ["19 Mayıs şehri", "Atatürk'ün Kurtuluş Savaşı'nı başlattığı yer", "Karadeniz'in en büyük limanı"] },
        { name: "Diyarbakır", x: 480, y: 260, hints: ["Surları ile ünlü", "Dicle Nehri kıyısında", "Karpuzuyla meşhur"] },
        { name: "Edirne", x: 215, y: 45, hints: ["Selimiye Camii'nin şehri", "Trakya'nın incisi", "Kırkpınar Yağlı Güreşleri burada yapılır"] },
        { name: "Erzurum", x: 525, y: 180, hints: ["Palandöken Dağı'nın şehri", "Kış turizmiyle ünlü", "Doğu Anadolu'nun en büyük şehri"] },
        { name: "Şanlıurfa", x: 435, y: 285, hints: ["Balıklı Göl'ün şehri", "Göbeklitepe buradadır", "Hz. İbrahim'in doğduğu yer olarak bilinir"] },
        { name: "Çanakkale", x: 180, y: 95, hints: ["Boğazı ile ünlü", "Troya antik kenti burada", "Şehitler diyarı olarak bilinir"] },
        { name: "Kayseri", x: 380, y: 215, hints: ["Erciyes Dağı'nın eteğinde", "Mantısı ile meşhur", "Selçuklu eserleriyle dolu tarihi şehir"] },
        { name: "Rize", x: 570, y: 90, hints: ["Çay bahçeleriyle ünlü", "Karadeniz'in yağmurlu şehri", "Ayder Yaylası buradadır"] },
        { name: "Van", x: 600, y: 240, hints: ["Gölüyle ünlü", "Kedisi meşhur", "Doğu Anadolu'nun tarihi şehri"] },
        { name: "Mersin", x: 280, y: 350, hints: ["Akdeniz'in liman şehri", "Narenciye bahçeleriyle ünlü", "Kızkalesi burada bulunur"] }
      ],
      timeLimit: 20
    }
  };

  // Harita yükleme
  function loadMap() {
    fetch('/static/images/turkey_map.svg')
      .then(response => response.text())
      .then(svgData => {
        mapContainer.innerHTML = svgData;

        // Harita yüklendikten sonra tıklama olaylarını ekle
        const mapSvg = mapContainer.querySelector('svg');
        mapSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        mapSvg.style.width = '100%';
        mapSvg.style.height = '400px';

        mapContainer.addEventListener('click', function(e) {
          if (!gameState.isGameActive || gameState.isGamePaused) return;

          const rect = mapContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          checkLocation(x, y);
        });
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        mapContainer.innerHTML = '<div class="alert alert-danger">Harita yüklenemedi. Lütfen sayfayı yenileyin.</div>';
      });
  }

  // Şehir seçme
  function selectCity() {
    const availableCities = gameState.cities.filter(city => !city.found);
    if (availableCities.length === 0) {
      endGame(true);
      return null;
    }
    const randomIndex = Math.floor(Math.random() * availableCities.length);
    return availableCities[randomIndex];
  }

  // Oyunu başlat
  function startGame() {
    // Zorluk seviyesine göre şehirleri ayarla
    gameState.cities = JSON.parse(JSON.stringify(difficultySettings[gameState.difficulty].cities));
    gameState.timeRemaining = difficultySettings[gameState.difficulty].timeLimit;

    gameState.score = 0;
    gameState.round = 0;
    gameState.hintCount = 3;
    gameState.isGameActive = true;
    gameState.isGamePaused = false;

    // Arayüzü güncelle
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    hintButton.textContent = `İpucu (${gameState.hintCount})`;
    hintDisplay.textContent = '';

    // Haritayı yükle
    loadMap();

    // İlk şehri seç
    nextRound();
  }

  // Sonraki tura geç
  function nextRound() {
    gameState.round++;
    clearInterval(gameState.timerInterval);

    // Haritadaki işaretleri temizle
    const markers = document.querySelectorAll('.target-marker');
    markers.forEach(marker => marker.remove());

    gameState.currentCity = selectCity();
    if (!gameState.currentCity) return;

    // Karakter bilgilerini güncelle
    characterName.textContent = gameState.currentCity.name;

    // Zamanlayıcıyı başlat
    gameState.timeRemaining = difficultySettings[gameState.difficulty].timeLimit;
    updateTimerDisplay();

    gameState.timerInterval = setInterval(() => {
      gameState.timeRemaining--;
      updateTimerDisplay();

      if (gameState.timeRemaining <= 0) {
        clearInterval(gameState.timerInterval);
        playSound('wrong');
        markLocation(gameState.currentCity.x, gameState.currentCity.y, false);

        setTimeout(() => {
          if (gameState.round >= gameState.maxRounds) {
            endGame(false);
          } else {
            nextRound();
          }
        }, 2000);
      }
    }, 1000);
  }

  // Zamanlayıcıyı güncelle
  function updateTimerDisplay() {
    const percentage = (gameState.timeRemaining / difficultySettings[gameState.difficulty].timeLimit) * 100;
    progressBar.style.width = `${percentage}%`;

    if (percentage < 30) {
      progressBar.className = 'progress-bar bg-danger';
    } else if (percentage < 60) {
      progressBar.className = 'progress-bar bg-warning';
    } else {
      progressBar.className = 'progress-bar bg-success';
    }
  }

  // Konumu kontrol et
  function checkLocation(x, y) {
    const targetX = gameState.currentCity.x;
    const targetY = gameState.currentCity.y;

    // İki nokta arasındaki mesafeyi hesapla (Pisagor teoremi)
    const distance = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    const tolerance = 40; // Doğru kabul edilecek mesafe toleransı (piksel)

    if (distance <= tolerance) {
      // Doğru cevap
      playSound('correct');
      gameState.score += Math.ceil(gameState.timeRemaining * (gameState.difficulty === 'easy' ? 1 : gameState.difficulty === 'medium' ? 1.5 : 2));
      gameState.currentCity.found = true;
      markLocation(x, y, true);

      clearInterval(gameState.timerInterval);

      setTimeout(() => {
        if (gameState.round >= gameState.maxRounds) {
          endGame(true);
        } else {
          nextRound();
        }
      }, 1500);
    } else {
      // Yanlış cevap
      playSound('wrong');
      markLocation(x, y, false);
      gameState.timeRemaining = Math.max(1, gameState.timeRemaining - 3); // 3 saniye ceza

      // Yanlış işareti 1 saniye sonra kaldır
      setTimeout(() => {
        const wrongMarkers = document.querySelectorAll('.target-marker.wrong');
        wrongMarkers.forEach(marker => marker.remove());
      }, 1000);
    }
  }

  // Seçilen konumu işaretle
  function markLocation(x, y, isCorrect) {
    const marker = document.createElement('div');
    marker.className = `target-marker ${isCorrect ? 'correct' : 'wrong'}`;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;

    const icon = document.createElement('i');
    icon.className = `fas ${isCorrect ? 'fa-check' : 'fa-times'}`;
    marker.appendChild(icon);

    mapContainer.appendChild(marker);

    if (isCorrect) {
      // Doğru lokasyonu da göster
      const correctMarker = document.createElement('div');
      correctMarker.className = 'target-marker correct';
      correctMarker.style.left = `${gameState.currentCity.x}px`;
      correctMarker.style.top = `${gameState.currentCity.y}px`;

      const correctIcon = document.createElement('i');
      correctIcon.className = 'fas fa-check';
      correctMarker.appendChild(correctIcon);

      mapContainer.appendChild(correctMarker);
    }
  }

  // İpucu göster
  function showHint() {
    if (gameState.hintCount <= 0 || !gameState.isGameActive || !gameState.currentCity) return;

    gameState.hintCount--;
    playSound('hint');

    const randomHintIndex = Math.floor(Math.random() * gameState.currentCity.hints.length);
    const hint = gameState.currentCity.hints[randomHintIndex];

    hintDisplay.textContent = hint;
    hintButton.textContent = `İpucu (${gameState.hintCount})`;

    // İpucu bir süre sonra kaybolsun
    setTimeout(() => {
      hintDisplay.textContent = '';
    }, 5000);
  }

  // Oyunu bitir
  function endGame(isSuccess) {
    gameState.isGameActive = false;
    clearInterval(gameState.timerInterval);

    if (isSuccess) {
      playSound('success');
    } else {
      playSound('gameover');
    }

    // Sonuç ekranını göster
    const gameOverHTML = `
      <div class="game-over-screen">
        <h2>${isSuccess ? 'Tebrikler!' : 'Oyun Bitti!'}</h2>
        <div class="final-score">
          <span>Skor:</span>
          <h3>${gameState.score}</h3>
        </div>
        <div class="game-over-buttons">
          <button id="play-again" class="btn btn-primary">Tekrar Oyna</button>
          <a href="/games" class="btn btn-secondary">Oyunlar</a>
        </div>
      </div>
    `;

    gameContainer.innerHTML = gameOverHTML;

    document.getElementById('play-again').addEventListener('click', function() {
      window.location.reload();
    });
  }

  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (!gameState.isGameActive) return;

    gameState.isGamePaused = !gameState.isGamePaused;

    if (gameState.isGamePaused) {
      clearInterval(gameState.timerInterval);
      pauseGameBtn.innerHTML = '<i class="fas fa-play"></i>';
      mapContainer.classList.add('paused');
    } else {
      gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();

        if (gameState.timeRemaining <= 0) {
          clearInterval(gameState.timerInterval);
          playSound('wrong');
          markLocation(gameState.currentCity.x, gameState.currentCity.y, false);

          setTimeout(() => {
            if (gameState.round >= gameState.maxRounds) {
              endGame(false);
            } else {
              nextRound();
            }
          }, 2000);
        }
      }, 1000);
      pauseGameBtn.innerHTML = '<i class="fas fa-pause"></i>';
      mapContainer.classList.remove('paused');
    }
  }

  // Sesi aç/kapat
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggleBtn.innerHTML = gameState.soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    soundToggleBtn.classList.toggle('active', gameState.soundEnabled);
  }

  // Zorluk seviyesi değiştirme
  function setDifficulty(level) {
    gameState.difficulty = level;

    // Aktif zorluk butonunu güncelle
    [easyModeBtn, mediumModeBtn, hardModeBtn].forEach(btn => {
      btn.classList.remove('active');
    });

    if (level === 'easy') easyModeBtn.classList.add('active');
    else if (level === 'medium') mediumModeBtn.classList.add('active');
    else if (level === 'hard') hardModeBtn.classList.add('active');
  }

  // Olay dinleyicileri
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  if (hintButton) {
    hintButton.addEventListener('click', showHint);
  }

  if (pauseGameBtn) {
    pauseGameBtn.addEventListener('click', togglePause);
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
  }

  // Zorluk seviyesi butonları
  if (easyModeBtn) {
    easyModeBtn.addEventListener('click', function() {
      setDifficulty('easy');
    });
  }

  if (mediumModeBtn) {
    mediumModeBtn.addEventListener('click', function() {
      setDifficulty('medium');
    });
  }

  if (hardModeBtn) {
    hardModeBtn.addEventListener('click', function() {
      setDifficulty('hard');
    });
  }

  // Bölge adını bul (from original code)
  function getRegionName(regionId) {
    const regionNames = {
      'istanbul': 'İstanbul',
      'ankara': 'Ankara',
      'izmir': 'İzmir',
      'antalya': 'Antalya',
      'konya': 'Konya',
      'adana': 'Adana',
      'trabzon': 'Trabzon',
      'bursa': 'Bursa',
      'gaziantep': 'Gaziantep',
      'samsun': 'Samsun',
      // Diğer bölgeler...
    };

    return regionNames[regionId] || regionId;
  }
});