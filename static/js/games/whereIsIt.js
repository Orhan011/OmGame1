
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
  const progressBar = document.getElementById('progress-bar');
  const characterName = document.getElementById('character-name');
  const hintButton = document.getElementById('hint-button');
  const hintDisplay = document.getElementById('hint-display');
  const pauseButton = document.getElementById('pause-game');
  const soundToggle = document.getElementById('sound-toggle');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  
  // Oyun durumu
  const gameState = {
    score: 0,
    round: 0,
    maxRounds: 10,
    timer: 20,
    interval: null,
    isAnswerPhase: false,
    correctRegion: null,
    hintUsed: false,
    hintCount: 3,
    soundEnabled: true,
    isPaused: false,
    difficulty: 'normal' // 'easy', 'normal', 'hard'
  };

  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    success: new Audio('/static/sounds/success.mp3'),
    timeUp: new Audio('/static/sounds/time-up.mp3')
  };

  // Ses çalma fonksiyonu
  function playSound(sound) {
    try {
      if (gameState.soundEnabled && sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play();
      }
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }

  // Şehir verileri - Bölgelere göre gruplandırılmış
  const cityData = {
    easy: [
      { name: "İstanbul", location: { x: 28.9784, y: 41.0082 }, hints: ["Boğaz'ın incisi", "Türkiye'nin en kalabalık şehri", "İki kıtayı birleştiren şehir"] },
      { name: "Ankara", location: { x: 32.8597, y: 39.9334 }, hints: ["Başkent", "Anıtkabir burada", "İç Anadolu'nun merkezi"] },
      { name: "İzmir", location: { x: 27.1428, y: 38.4237 }, hints: ["Ege'nin incisi", "Efes Antik Kenti yakınında", "Saat Kulesi meşhur"] },
      { name: "Antalya", location: { x: 30.7133, y: 36.8969 }, hints: ["Turizm cenneti", "Konyaaltı Plajı burada", "Akdeniz'in en popüler tatil bölgesi"] },
      { name: "Bursa", location: { x: 29.0610, y: 40.1885 }, hints: ["Uludağ burada", "Osmanlı'nın ilk başkenti", "İskender kebabı meşhur"] },
      { name: "Adana", location: { x: 35.3308, y: 37.0000 }, hints: ["Kebabıyla ünlü", "Seyhan Nehri burada", "Türkiye'nin beşinci büyük şehri"] },
      { name: "Konya", location: { x: 32.4847, y: 37.8715 }, hints: ["Mevlana Müzesi burada", "Sema gösterisi", "Etli ekmek meşhur"] },
      { name: "Trabzon", location: { x: 39.7255, y: 41.0027 }, hints: ["Karadeniz'in incisi", "Sümela Manastırı yakınında", "Uzungöl buraya yakın"] }
    ],
    normal: [
      { name: "Gaziantep", location: { x: 37.3826, y: 37.0662 }, hints: ["Baklavası meşhur", "Zeugma Mozaik Müzesi burada", "Türkiye'nin en eski yerleşim yerlerinden"] },
      { name: "Kayseri", location: { x: 35.4887, y: 38.7205 }, hints: ["Erciyes Dağı burada", "Mantısıyla ünlü", "Kapadokya'ya yakın"] },
      { name: "Samsun", location: { x: 36.3361, y: 41.2867 }, hints: ["19 Mayıs'ın şehri", "Karadeniz'in önemli limanı", "Atatürk'ün Kurtuluş Savaşı'nı başlattığı yer"] },
      { name: "Diyarbakır", location: { x: 40.2308, y: 37.9144 }, hints: ["Surları UNESCO listesinde", "Dicle Nehri kenarında", "Karpuzu meşhur"] },
      { name: "Şanlıurfa", location: { x: 38.7955, y: 37.1674 }, hints: ["Göbeklitepe burada", "Balıklı Göl efsanesi", "İbrahim Peygamber'in doğduğu yer sayılır"] },
      { name: "Erzurum", location: { x: 41.2658, y: 39.9055 }, hints: ["Palandöken Kayak Merkezi", "Cağ kebabı meşhur", "Doğu Anadolu'nun en büyük şehirlerinden"] },
      { name: "Eskişehir", location: { x: 30.5215, y: 39.7767 }, hints: ["Öğrenci şehri", "Porsuk Çayı geçer", "Lületaşı burada çıkarılır"] },
      { name: "Mersin", location: { x: 34.6415, y: 36.8121 }, hints: ["Akdeniz'in önemli limanı", "Kızkalesi burada", "Narenciye bahçeleriyle ünlü"] },
      { name: "Sivas", location: { x: 37.0150, y: 39.7477 }, hints: ["Kangal köpeği buradan", "Dört Eylül Kongre binası", "Gök Medrese burada"] },
      { name: "Malatya", location: { x: 38.3552, y: 38.3095 }, hints: ["Kayısısıyla ünlü", "Battalgazi ilçesi tarihi", "Aslantepe höyüğü burada"] }
    ],
    hard: [
      { name: "Çanakkale", location: { x: 26.4086, y: 40.1553 }, hints: ["Truva Antik Kenti burada", "Gelibolu Yarımadası", "Boğazıyla ünlü"] },
      { name: "Hatay", location: { x: 36.1528, y: 36.2021 }, hints: ["Künefesi meşhur", "St. Pierre Kilisesi burada", "Mozaikleriyle ünlü Hatay Arkeoloji Müzesi"] },
      { name: "Mardin", location: { x: 40.7426, y: 37.3210 }, hints: ["Taş evleriyle ünlü", "Mezopotamya Ovası manzarası", "Deyrulzafaran Manastırı burada"] },
      { name: "Edirne", location: { x: 26.5557, y: 41.6771 }, hints: ["Selimiye Camii burada", "Kırkpınar Yağlı Güreşleri", "Meriç Nehri geçer"] },
      { name: "Van", location: { x: 43.3854, y: 38.4946 }, hints: ["Van Gölü kenarında", "Van kedisi buradan", "Akdamar Adası burada"] },
      { name: "Kars", location: { x: 43.0963, y: 40.6013 }, hints: ["Ani Harabeleri burada", "Sarıkamış Kayak Merkezi", "Kaz dağları yakınında"] },
      { name: "Aydın", location: { x: 27.8361, y: 37.8466 }, hints: ["İnciri meşhur", "Afrodisias Antik Kenti", "Kuşadası buraya bağlı"] },
      { name: "Kastamonu", location: { x: 33.7776, y: 41.3887 }, hints: ["Ilgaz Dağları burada", "Tarihi konakları meşhur", "İnebolu limanı buraya bağlı"] },
      { name: "Tokat", location: { x: 36.5542, y: 40.3097 }, hints: ["Yaprağı meşhur", "Ballıca Mağarası burada", "Hıdırellez şenlikleri yapılır"] },
      { name: "Muğla", location: { x: 28.3646, y: 37.2153 }, hints: ["Bodrum, Marmaris, Fethiye ilçeleri", "Turizm cenneti", "Antik Karya bölgesi"] },
      { name: "Rize", location: { x: 40.5220, y: 41.0255 }, hints: ["Çayıyla ünlü", "Kaçkar Dağları Milli Parkı", "Ayder Yaylası burada"] },
      { name: "Kütahya", location: { x: 29.9851, y: 39.4194 }, hints: ["Çinisi meşhur", "Termal kaynakları", "Dünyanın en eski yerleşim yerlerinden Aizanoi burada"] }
    ]
  };

  // Harita türleri
  const mapTypes = {
    easy: '/static/images/whereIsIt/turkey_map_simple.svg',
    normal: '/static/images/whereIsIt/turkey_map_detailed.svg',
    hard: '/static/images/whereIsIt/turkey_map_full.svg'
  };

  // Rastgele şehir seçme fonksiyonu
  function selectRandomCity() {
    const cities = cityData[gameState.difficulty];
    const randomIndex = Math.floor(Math.random() * cities.length);
    return cities[randomIndex];
  }

  // Zorluk seviyesi butonlarına tıklama olayı
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const difficulty = this.getAttribute('data-difficulty');
      
      // Önceki aktif butondan aktif sınıfını kaldır
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      
      // Yeni seçilen butona aktif sınıfını ekle
      this.classList.add('active');
      
      // Oyun durumunda zorluk seviyesini güncelle
      gameState.difficulty = difficulty;
      
      // Ses çal
      playSound('click');
    });
  });

  // Haritayı yükleme fonksiyonu
  function loadMap() {
    // Haritayı temizle
    mapContainer.innerHTML = '';
    
    // Harita SVG'sini yükle
    fetch(mapTypes[gameState.difficulty])
      .then(response => response.text())
      .then(svgData => {
        mapContainer.innerHTML = svgData;
        
        // SVG elementini seç
        const svg = mapContainer.querySelector('svg');
        
        // SVG boyutunu ayarla
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';
        
        // Harita yüklendikten sonra tıklama olayını ekle
        mapContainer.addEventListener('click', handleMapClick);
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        mapContainer.innerHTML = '<p>Harita yüklenemedi. Lütfen sayfayı yenileyin.</p>';
      });
  }

  // Haritaya tıklama olayı
  function handleMapClick(event) {
    if (gameState.isPaused) return;
    
    const rect = mapContainer.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / rect.width * 100;
    const clickY = (event.clientY - rect.top) / rect.height * 100;
    
    checkAnswer(clickX, clickY);
  }

  // Cevabı kontrol etme fonksiyonu
  function checkAnswer(clickX, clickY) {
    // Doğru konumun koordinatları
    const correctCity = cityData[gameState.difficulty].find(city => city.name === gameState.correctCity.name);
    const correctX = correctCity.location.x;
    const correctY = correctCity.location.y;
    
    // Harita üzerinde tıklanan ve doğru noktaların pixel konumlarını hesapla
    const mapWidth = mapContainer.clientWidth;
    const mapHeight = mapContainer.clientHeight;
    
    // Harita üzerinde konum eşleştirmesi (burada basit bir yaklaşım kullanıldı)
    // Gerçek uygulamada koordinatların piksel konumlarına dönüştürülmesi gerekir
    const clickXPixel = clickX * mapWidth / 100;
    const clickYPixel = clickY * mapHeight / 100;
    
    // SVG'deki koordinatları piksel olarak dönüştür (basit yaklaşım)
    const correctXPixel = correctX * mapWidth / 100;
    const correctYPixel = correctY * mapHeight / 100;
    
    // Mesafeyi hesapla
    const distance = Math.sqrt(
      Math.pow(clickXPixel - correctXPixel, 2) + 
      Math.pow(clickYPixel - correctYPixel, 2)
    );
    
    // Doğruluk eşiği (zorluk seviyesine göre değişebilir)
    let threshold;
    switch(gameState.difficulty) {
      case 'easy': threshold = 150; break;
      case 'normal': threshold = 100; break;
      case 'hard': threshold = 70; break;
      default: threshold = 100;
    }
    
    // Doğru mu yanlış mı?
    const isCorrect = distance <= threshold;
    
    // İşaretleyici oluştur
    createMarker(clickX, clickY, isCorrect);
    
    // Doğru cevap işaretleyicisi oluştur
    if (!isCorrect) {
      setTimeout(() => {
        createMarker(correctX, correctY, true, true);
      }, 1000);
    }
    
    // Sonucu işle
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  }

  // İşaretleyici oluşturma fonksiyonu
  function createMarker(x, y, isCorrect, isCorrectLocation = false) {
    const marker = document.createElement('div');
    marker.className = `target-marker ${isCorrect ? 'correct' : 'wrong'}`;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    
    const pulse = document.createElement('div');
    pulse.className = 'marker-pulse';
    marker.appendChild(pulse);
    
    const icon = document.createElement('i');
    icon.className = `fas ${isCorrect ? 'fa-check' : 'fa-times'}`;
    marker.appendChild(icon);
    
    mapContainer.appendChild(marker);
    
    // Yanlış cevaplar için 1 saniye sonra işaretçiyi kaldır
    if (!isCorrect && !isCorrectLocation) {
      setTimeout(() => {
        marker.remove();
      }, 1000);
    }
  }

  // Doğru cevap durumunu işleme
  function handleCorrectAnswer() {
    playSound('correct');
    
    clearInterval(gameState.interval);
    
    // Puan hesaplaması
    // Kalan süreye, ipucu kullanımına ve zorluk seviyesine göre puan hesapla
    let pointMultiplier = 1;
    switch(gameState.difficulty) {
      case 'easy': pointMultiplier = 1; break;
      case 'normal': pointMultiplier = 1.5; break;
      case 'hard': pointMultiplier = 2; break;
    }
    
    const basePoints = 100;
    const timeBonus = gameState.timer * 5;
    const hintPenalty = gameState.hintUsed ? -30 : 0;
    
    gameState.score += Math.floor((basePoints + timeBonus + hintPenalty) * pointMultiplier);
    
    setTimeout(() => {
      nextRound();
    }, 1500);
  }

  // Yanlış cevap durumunu işleme
  function handleWrongAnswer() {
    playSound('wrong');
    
    // Cezayı uygula (örneğin süreyi azalt)
    gameState.timer = Math.max(0, gameState.timer - 3);
    updateProgressBar();
  }

  // İpucu gösterme fonksiyonu
  function showHint() {
    if (gameState.hintCount <= 0) return;
    
    gameState.hintCount--;
    gameState.hintUsed = true;
    
    const hints = gameState.correctCity.hints;
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    
    hintDisplay.textContent = randomHint;
    hintDisplay.style.display = 'block';
    
    // İpucu butonunu güncelle
    hintButton.textContent = `İpucu (${gameState.hintCount})`;
    
    // Ses çal
    playSound('hint');
    
    // 5 saniye sonra ipucunu gizle
    setTimeout(() => {
      hintDisplay.style.display = 'none';
    }, 5000);
  }

  // Sonraki tura geçme fonksiyonu
  function nextRound() {
    // Tüm işaretçileri temizle
    const markers = document.querySelectorAll('.target-marker');
    markers.forEach(marker => marker.remove());
    
    // İpucu göstergesini temizle
    hintDisplay.style.display = 'none';
    gameState.hintUsed = false;
    
    // Tur sayısını artır
    gameState.round++;
    
    // Oyun bitti mi kontrol et
    if (gameState.round >= gameState.maxRounds) {
      endGame();
      return;
    }
    
    // Yeni şehir seç
    gameState.correctCity = selectRandomCity();
    
    // Karakter bilgilerini güncelle
    characterName.textContent = gameState.correctCity.name;
    
    // Süreyi sıfırla ve interval'i başlat
    gameState.timer = 20;
    updateProgressBar();
    
    gameState.interval = setInterval(() => {
      gameState.timer--;
      updateProgressBar();
      
      if (gameState.timer <= 0) {
        clearInterval(gameState.interval);
        timeUp();
      }
    }, 1000);
  }

  // Süre dolduğunda çağrılacak fonksiyon
  function timeUp() {
    playSound('timeUp');
    
    // Doğru konumu göster
    const correctCity = gameState.correctCity;
    createMarker(correctCity.location.x, correctCity.location.y, true, true);
    
    setTimeout(() => {
      nextRound();
    }, 1500);
  }

  // İlerleme çubuğunu güncelleme
  function updateProgressBar() {
    const percentage = (gameState.timer / 20) * 100;
    progressBar.style.width = `${percentage}%`;
    
    // Süre azaldıkça renk değiştir
    if (percentage > 60) {
      progressBar.className = 'progress-bar bg-success';
    } else if (percentage > 30) {
      progressBar.className = 'progress-bar bg-warning';
    } else {
      progressBar.className = 'progress-bar bg-danger';
    }
  }

  // Oyunu bitirme fonksiyonu
  function endGame() {
    playSound('success');
    
    // Sonuç ekranını göster veya sonuçları API'ye gönder
    alert(`Oyun bitti! Toplam puanınız: ${gameState.score}`);
    
    // Yeni oyun başlat (veya ana ekrana dön)
    resetGame();
  }

  // Oyunu sıfırlama fonksiyonu
  function resetGame() {
    gameState.score = 0;
    gameState.round = 0;
    gameState.timer = 20;
    gameState.hintCount = 3;
    gameState.hintUsed = false;
    
    // İpucu butonunu sıfırla
    hintButton.textContent = `İpucu (${gameState.hintCount})`;
    
    // Oyunu yeniden başlat
    startGame();
  }

  // Oyunu başlatma fonksiyonu
  function startGame() {
    // Başlangıç ekranını gizle, oyun alanını göster
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Haritayı yükle
    loadMap();
    
    // İlk turu başlat
    nextRound();
  }

  // Butonları ayarlama
  if (startButton) {
    startButton.addEventListener('click', function() {
      playSound('click');
      startGame();
    });
  }

  if (hintButton) {
    hintButton.addEventListener('click', function() {
      if (gameState.hintCount > 0) {
        showHint();
      }
    });
  }

  // Ses açma/kapama
  if (soundToggle) {
    soundToggle.addEventListener('click', function() {
      gameState.soundEnabled = !gameState.soundEnabled;
      
      if (gameState.soundEnabled) {
        soundToggle.classList.add('active');
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      } else {
        soundToggle.classList.remove('active');
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
      }
    });
  }

  // Duraklat/Devam et
  if (pauseButton) {
    pauseButton.addEventListener('click', function() {
      gameState.isPaused = !gameState.isPaused;
      
      if (gameState.isPaused) {
        clearInterval(gameState.interval);
        pauseButton.innerHTML = '<i class="fas fa-play"></i>';
        mapContainer.style.pointerEvents = 'none';
      } else {
        gameState.interval = setInterval(() => {
          gameState.timer--;
          updateProgressBar();
          
          if (gameState.timer <= 0) {
            clearInterval(gameState.interval);
            timeUp();
          }
        }, 1000);
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        mapContainer.style.pointerEvents = 'auto';
      }
    });
  }
  
  // Sayfa yüklendiğinde veya oyun sıfırlandığında başlangıç ekranını göster
  if (startScreen) {
    startScreen.style.display = 'flex';
  }
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }
});
