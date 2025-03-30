
// Kim Nerede? (Where Is It?) Oyunu
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const startGameBtn = document.getElementById('start-game');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const startScreen = document.getElementById('start-screen');
  const gameContainer = document.getElementById('game-container');
  const characterName = document.getElementById('character-name');
  const characterImage = document.getElementById('character-image');
  const progressBar = document.getElementById('progress-bar');
  const mapContainer = document.getElementById('map-container');
  const pauseBtn = document.getElementById('pause-game');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const hintButton = document.getElementById('hint-button');
  const hintDisplay = document.getElementById('hint-display');
  
  // Oyun Durumu
  let gameActive = false;
  let gamePaused = false;
  let soundEnabled = true;
  let currentDifficulty = 'EASY'; // Default zorluk
  let timeLeft = 60; 
  let timerInterval = null;
  let score = 0;
  let hintsLeft = 3;
  let currentCharacter = null;
  let wrongAnswerMarker = null;

  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    gameover: new Audio('/static/sounds/gameover.mp3')
  };

  // Ses çalma yardımcı fonksiyonu
  function playSound(soundName) {
    if (soundEnabled) {
      try {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
      } catch (error) {
        console.log('Sound play error:', error);
      }
    }
  }

  // Türkiye şehirleri ve konumları (daha geniş ve detaylı)
  const cities = [
    { name: 'İstanbul', x: 43, y: 25, population: 15462000, hints: ['Boğaziçi Köprüsü buradadır', 'İki kıtada yer alan tek şehir', 'Türkiye\'nin en kalabalık şehri'] },
    { name: 'Ankara', x: 60, y: 42, population: 5663000, hints: ['Türkiye\'nin başkenti', 'Anıtkabir burada bulunur', 'İç Anadolu Bölgesi\'nde yer alır'] },
    { name: 'İzmir', x: 25, y: 50, population: 4367000, hints: ['Ege denizi kıyısında', 'Saat Kulesi simgesidir', '9 Eylül\'de kurtuluşu kutlanır'] },
    { name: 'Bursa', x: 39, y: 35, population: 3101000, hints: ['Uludağ eteğinde', 'İskender kebap meşhurdur', 'Osmanlı\'nın ilk başkenti'] },
    { name: 'Antalya', x: 40, y: 70, population: 2511000, hints: ['Türkiye\'nin turizm başkenti', 'Kaleiçi tarihi mekanı', 'Akdeniz kıyısında'] },
    { name: 'Adana', x: 60, y: 75, population: 2258000, hints: ['Kebabı meşhurdur', 'Seyhan nehri geçer', 'Çukurova\'nın merkezi'] },
    { name: 'Konya', x: 55, y: 55, population: 2250000, hints: ['Mevlana Müzesi buradadır', 'Türkiye\'nin yüzölçümü en büyük ili', 'Selçuklu başkenti'] },
    { name: 'Gaziantep', x: 75, y: 70, population: 2069000, hints: ['Baklavası meşhur', 'Zeugma Müzesi var', 'Güneydoğu\'nun en büyük şehri'] },
    { name: 'Şanlıurfa', x: 85, y: 65, population: 2073000, hints: ['Balıklı Göl buradadır', 'Göbeklitepe yakınında', 'Peygamberler şehri olarak bilinir'] },
    { name: 'Kocaeli', x: 45, y: 30, population: 1997000, hints: ['İzmit körfezi kıyısında', 'Otomotiv sanayi gelişmiş', 'Marmara Bölgesi\'nde'] },
    { name: 'Mersin', x: 50, y: 75, population: 1868000, hints: ['Akdeniz\'de liman şehri', 'Kız Kalesi simgesidir', 'Narenciye üretimi ile ünlü'] },
    { name: 'Diyarbakır', x: 90, y: 60, population: 1756000, hints: ['Surları UNESCO listesinde', 'Dicle nehri kenarında', 'Karpuzu meşhur'] },
    { name: 'Hatay', x: 70, y: 80, population: 1659000, hints: ['Türkiye\'nin en güney şehri', 'Künefesi meşhur', 'Mozaik müzesi var'] },
    { name: 'Manisa', x: 25, y: 45, population: 1450000, hints: ['Spil Dağı eteklerinde', 'Mesir macunu festivali', 'İzmir\'e komşu'] },
    { name: 'Kayseri', x: 65, y: 50, population: 1400000, hints: ['Erciyes Dağı eteğinde', 'Mantısı meşhur', 'İç Anadolu\'da tarihi şehir'] },
    { name: 'Samsun', x: 70, y: 25, population: 1350000, hints: ['19 Mayıs 1919\'da Atatürk çıktı', 'Karadeniz\'in büyük limanı', 'Bandırma vapuru müzesi var'] },
    { name: 'Eskişehir', x: 50, y: 35, population: 887000, hints: ['Porsuk çayı geçer', 'Öğrenci şehri olarak bilinir', 'Lületaşı burada çıkar'] },
    { name: 'Trabzon', x: 90, y: 20, population: 808000, hints: ['Karadeniz\'in incisi', 'Sümela Manastırı yakınında', 'Hamsi ve mısır ekmeği meşhur'] },
    { name: 'Malatya', x: 77, y: 52, population: 800000, hints: ['Kayısısı meşhur', 'Doğu Anadolu\'da', 'Battalgazi ilçesi tarihidir'] },
    { name: 'Van', x: 95, y: 45, population: 1136000, hints: ['Türkiye\'nin en büyük gölü', 'Kahvaltısı meşhur', 'Van kedisi buradan'] },
    { name: 'Erzurum', x: 90, y: 35, population: 762000, hints: ['Palandöken Dağı kayak merkezi', 'Cağ kebabı meşhur', 'Doğu Anadolu\'nun büyük şehri'] },
    { name: 'Mardin', x: 90, y: 70, population: 838000, hints: ['Taş evleri meşhur', 'Mezopotamya\'ya bakan teraslı şehir', 'Deyrulzafaran Manastırı var'] },
    { name: 'Tekirdağ', x: 30, y: 20, population: 1030000, hints: ['Marmara\'da sahil şehri', 'Köftesi meşhur', 'Rakısı ile bilinir'] },
    { name: 'Muğla', x: 20, y: 60, population: 967000, hints: ['Bodrum ve Marmaris ilçeleri', 'Ege kıyısında turizm merkezi', 'Beyaz evleri ile ünlü'] }
  ];

  // Zorluk seviyeleri
  const DIFFICULTY_SETTINGS = {
    EASY: {
      timeLimit: 60,
      cities: cities.filter(city => city.population > 1500000), // Büyük şehirler
      scoreMultiplier: 1
    },
    MEDIUM: {
      timeLimit: 45,
      cities: cities.filter(city => city.population > 800000), // Orta ve büyük şehirler
      scoreMultiplier: 2
    },
    HARD: {
      timeLimit: 30,
      cities: cities, // Tüm şehirler
      scoreMultiplier: 3
    }
  };

  // Oyun Başlangıç Fonksiyonu
  function startGame() {
    playSound('click');
    
    // Zorluk ayarlarını al
    timeLeft = DIFFICULTY_SETTINGS[currentDifficulty].timeLimit;
    score = 0;
    hintsLeft = 3;
    
    // Başlangıç ekranını gizle, oyun ekranını göster
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Haritayı yükle
    loadMap();
    
    // Yeni karakter seç
    selectNewCharacter();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Oyun aktif
    gameActive = true;
    gamePaused = false;
    
    // İpucu butonunu güncelle
    updateHintButton();
  }
  
  // Harita yükleme fonksiyonu
  function loadMap() {
    // Harita container'ı temizle
    mapContainer.innerHTML = '';
    
    // Türkiye haritası SVG'sini ekle
    const mapImage = document.createElement('img');
    mapImage.src = '/static/images/turkey_detailed_map.svg'; // Daha detaylı harita
    mapImage.alt = 'Türkiye Haritası';
    mapImage.className = 'map-image';
    mapContainer.appendChild(mapImage);
    
    // Haritaya tıklama olay dinleyicisi ekle
    mapContainer.addEventListener('click', handleMapClick);
  }
  
  // Karakter seçme fonksiyonu
  function selectNewCharacter() {
    // Mevcut zorluk seviyesine göre şehirleri filtrele
    const availableCities = DIFFICULTY_SETTINGS[currentDifficulty].cities;
    
    // Rastgele bir şehir seç
    currentCharacter = availableCities[Math.floor(Math.random() * availableCities.length)];
    
    // UI güncelle
    characterName.textContent = currentCharacter.name;
    
    // Karakter resmini güncelle (isteğe bağlı)
    const characterIndex = Math.floor(Math.random() * 5) + 1;
    characterImage.src = `/static/images/whereIsIt/char${characterIndex}.png`;
  }
  
  // Zamanlayıcı fonksiyonu
  function startTimer() {
    // Önce varsa mevcut zamanlayıcıyı temizle
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // İlerleme çubuğunu güncelle
    updateProgressBar();
    
    // Yeni zamanlayıcı başlat
    timerInterval = setInterval(function() {
      timeLeft--;
      updateProgressBar();
      
      // Süre bittiyse
      if (timeLeft <= 0) {
        endGame(false);
      }
    }, 1000);
  }
  
  // İlerleme çubuğunu güncelleme
  function updateProgressBar() {
    const maxTime = DIFFICULTY_SETTINGS[currentDifficulty].timeLimit;
    const percentage = (timeLeft / maxTime) * 100;
    
    // İlerleme çubuğunu güncelle
    progressBar.style.width = percentage + '%';
    
    // Renk değişimi (isteğe bağlı)
    if (percentage > 60) {
      progressBar.className = 'progress-bar bg-success';
    } else if (percentage > 30) {
      progressBar.className = 'progress-bar bg-warning';
    } else {
      progressBar.className = 'progress-bar bg-danger';
    }
  }
  
  // Harita tıklama işleyicisi
  function handleMapClick(event) {
    if (!gameActive || gamePaused) return;
    
    // Tıklama koordinatlarını al
    const rect = mapContainer.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Doğru şehre tıklanıp tıklanmadığını kontrol et
    const distance = calculateDistance(clickX, clickY, currentCharacter.x, currentCharacter.y);
    const maxDistance = currentDifficulty === 'EASY' ? 15 : 
                        currentDifficulty === 'MEDIUM' ? 10 : 5;
    
    // Tıklanan konumu işaretle
    if (distance <= maxDistance) {
      // Doğru cevap
      markLocation(clickX, clickY, true);
      playSound('correct');
      
      // Skoru güncelle
      const timeBonus = Math.round(timeLeft / 2);
      const difficultyMultiplier = DIFFICULTY_SETTINGS[currentDifficulty].scoreMultiplier;
      score += (100 + timeBonus) * difficultyMultiplier;
      
      // Kısa bir beklemeden sonra bir sonraki şehire geç
      setTimeout(() => {
        selectNewCharacter();
        
        // İpucu panelini temizle
        hintDisplay.textContent = '';
        
        // Ekstra süre ekle (isteğe bağlı)
        const bonusTime = currentDifficulty === 'EASY' ? 15 : 
                         currentDifficulty === 'MEDIUM' ? 10 : 5;
        timeLeft += bonusTime;
        if (timeLeft > DIFFICULTY_SETTINGS[currentDifficulty].timeLimit) {
          timeLeft = DIFFICULTY_SETTINGS[currentDifficulty].timeLimit;
        }
        updateProgressBar();
      }, 1000);
    } else {
      // Yanlış cevap
      markLocation(clickX, clickY, false);
      playSound('wrong');
      
      // Zaman cezası
      const penalty = currentDifficulty === 'EASY' ? 5 : 
                     currentDifficulty === 'MEDIUM' ? 8 : 10;
      timeLeft -= penalty;
      if (timeLeft < 0) timeLeft = 0;
      updateProgressBar();
      
      // 1 saniye sonra yanlış işareti kaldır
      setTimeout(() => {
        if (wrongAnswerMarker) {
          wrongAnswerMarker.remove();
          wrongAnswerMarker = null;
        }
      }, 1000);
    }
  }
  
  // İki nokta arasındaki mesafeyi hesaplama
  function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // Konumu işaretleme
  function markLocation(x, y, isCorrect) {
    // Önceki yanlış marker'ı kaldır
    if (wrongAnswerMarker) {
      wrongAnswerMarker.remove();
    }
    
    // Yeni marker oluştur
    const marker = document.createElement('div');
    marker.className = `target-marker ${isCorrect ? 'correct' : 'wrong'}`;
    marker.style.left = x + '%';
    marker.style.top = y + '%';
    
    // İkon ekle
    const icon = document.createElement('i');
    icon.className = `fas ${isCorrect ? 'fa-check' : 'fa-times'}`;
    marker.appendChild(icon);
    
    // Haritaya ekle
    mapContainer.appendChild(marker);
    
    // Yanlış marker'ı kaydet (sonra kaldırabilmek için)
    if (!isCorrect) {
      wrongAnswerMarker = marker;
    }
  }
  
  // Oyun sonu
  function endGame(completed) {
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Oyun durumunu güncelle
    gameActive = false;
    
    // Uygun ses çal
    playSound(completed ? 'success' : 'gameover');
    
    // Sonuç mesajı
    const resultMessage = completed ? 
      `Tebrikler! Oyunu tamamladınız!` : 
      `Süre doldu! Oyun bitti.`;
    
    // Skoru gönder ve sonuç ekranını göster
    saveScore(score).then(() => {
      showGameOverScreen(resultMessage, score);
    });
  }
  
  // Sonuç ekranını gösterme
  function showGameOverScreen(message, finalScore) {
    // Basit bir alert yerine daha iyi bir UI (örnek)
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over-screen';
    gameOverDiv.innerHTML = `
      <h2>${message}</h2>
      <p>Skorunuz: <strong>${finalScore}</strong></p>
      <button id="play-again" class="btn btn-primary">Tekrar Oyna</button>
      <button id="return-menu" class="btn btn-secondary">Menüye Dön</button>
    `;
    
    // Oyun container'ına ekle
    gameContainer.appendChild(gameOverDiv);
    
    // Buton olaylarını dinle
    document.getElementById('play-again').addEventListener('click', () => {
      gameOverDiv.remove();
      startGame();
    });
    
    document.getElementById('return-menu').addEventListener('click', () => {
      gameOverDiv.remove();
      gameContainer.style.display = 'none';
      startScreen.style.display = 'flex';
    });
  }
  
  // Skoru kaydetme
  function saveScore(score) {
    return fetch('/save_score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'whereIsIt',
        score: score
      })
    })
    .then(response => response.json())
    .catch(error => console.error('Error saving score:', error));
  }
  
  // İpucu gösterme
  function showHint() {
    if (hintsLeft <= 0 || !gameActive || !currentCharacter) return;
    
    // Rasgele bir ipucu seç
    const randomHint = currentCharacter.hints[Math.floor(Math.random() * currentCharacter.hints.length)];
    
    // İpucunu göster
    hintDisplay.textContent = randomHint;
    hintDisplay.style.display = 'block';
    
    // İpucu hakkını azalt
    hintsLeft--;
    updateHintButton();
    
    // İpucu kullanımı için küçük bir ceza
    timeLeft -= 3;
    if (timeLeft < 0) timeLeft = 0;
    updateProgressBar();
    
    // İpucu sesi çal
    playSound('click');
  }
  
  // İpucu butonunu güncelleme
  function updateHintButton() {
    hintButton.textContent = `İpucu (${hintsLeft})`;
    hintButton.disabled = hintsLeft <= 0;
  }
  
  // Duraklatma/devam ettirme
  function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      // Oyunu duraklat
      clearInterval(timerInterval);
      pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      
      // Duraklatma ekranı göster
      const pauseScreen = document.createElement('div');
      pauseScreen.id = 'pause-screen';
      pauseScreen.className = 'pause-screen';
      pauseScreen.innerHTML = '<h2>Oyun Duraklatıldı</h2><p>Devam etmek için duraklatma düğmesine basın</p>';
      gameContainer.appendChild(pauseScreen);
    } else {
      // Oyuna devam et
      startTimer();
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      
      // Duraklatma ekranını kaldır
      const pauseScreen = document.getElementById('pause-screen');
      if (pauseScreen) pauseScreen.remove();
    }
    
    playSound('click');
  }
  
  // Ses açma/kapatma
  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggleBtn.innerHTML = soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    
    if (soundEnabled) {
      soundToggleBtn.classList.add('active');
    } else {
      soundToggleBtn.classList.remove('active');
    }
  }
  
  // Zorluk seviyesi seçimi
  function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Tüm zorluk düğmelerinin aktif sınıfını kaldır
    difficultyButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Seçilen düğmeye aktif sınıfı ekle
    event.target.classList.add('active');
    
    playSound('click');
  }
  
  // Olay Dinleyicileri
  // Başlat düğmesi
  if (startGameBtn) {
    startGameBtn.addEventListener('click', startGame);
  }
  
  // Zorluk seviyesi düğmeleri
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      const difficulty = this.getAttribute('data-difficulty');
      selectDifficulty(difficulty);
    });
  });
  
  // Duraklatma düğmesi
  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }
  
  // Ses düğmesi
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
  }
  
  // İpucu düğmesi
  if (hintButton) {
    hintButton.addEventListener('click', showHint);
  }
});
