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
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const roundDisplay = document.getElementById('round-display');
  const gameOverScreen = document.getElementById('game-over-screen');
  const resultMessage = document.getElementById('result-message');
  const finalScoreDisplay = document.getElementById('final-score');
  const startButton = document.getElementById('start-game');
  const restartButton = document.getElementById('restart-game');
  const hintButton = document.getElementById('hint-button');
  const hintDisplay = document.getElementById('hint-display');
  const loadingMessage = document.getElementById('loading-message');

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

    // Karakter listesi (şehirler)
    characters: [
      { name: 'İstanbul', regionId: 'istanbul', image: '/static/images/characters/istanbul.jpg', hint: 'Boğazın iki yakasını birleştiren şehir' },
      { name: 'Ankara', regionId: 'ankara', image: '/static/images/characters/ankara.jpg', hint: 'Başkent ve İç Anadolu\'nun merkezinde' },
      { name: 'İzmir', regionId: 'izmir', image: '/static/images/characters/izmir.jpg', hint: 'Ege denizinin incisi' },
      { name: 'Antalya', regionId: 'antalya', image: '/static/images/characters/antalya.jpg', hint: 'Turizm cenneti, Akdeniz\'in en güzel kıyılarından biri' },
      { name: 'Konya', regionId: 'konya', image: '/static/images/characters/konya.jpg', hint: 'Mevlana\'nın şehri, İç Anadolu\'nun geniş düzlükleri' },
      { name: 'Bursa', regionId: 'bursa', image: '/static/images/characters/bursa.jpg', hint: 'Uludağ\'ın eteğinde, Osmanlı\'nın ilk başkenti' },
      { name: 'Adana', regionId: 'adana', image: '/static/images/characters/adana.jpg', hint: 'Kebabıyla ünlü, Akdeniz\'in doğusunda' },
      { name: 'Trabzon', regionId: 'trabzon', image: '/static/images/characters/trabzon.jpg', hint: 'Karadeniz\'in incisi, yemyeşil yamaçları ile ünlü' },
      { name: 'Gaziantep', regionId: 'gaziantep', image: '/static/images/characters/gaziantep.jpg', hint: 'Mutfağıyla ünlü, Güneydoğu\'nun kültür merkezi' },
      { name: 'Samsun', regionId: 'samsun', image: '/static/images/characters/samsun.jpg', hint: 'Atatürk\'ün Kurtuluş Savaşı\'nı başlattığı şehir' }
    ]
  };

  // Ses fonksiyonları
  function playSound(soundName) {
    try {
      const sound = new Audio(`/static/sounds/${soundName}.mp3`);
      sound.volume = 0.5;
      sound.play();
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }

  // Oyunu başlat butonu
  if (startButton) {
    startButton.addEventListener('click', function() {
      if (startScreen) startScreen.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'block';

      // SVG haritasını yükle
      loadMap();

      // İlk turu başlat
      startNewRound();

      // Ses çal
      playSound('click');
    });
  }

  // İpucu butonu işlevselliği
  if (hintButton) {
    hintButton.addEventListener('click', function() {
      showHint();
    });
  }

  // İpucu gösterme fonksiyonu
  function showHint() {
    if (gameState.hintCount <= 0) {
      alert('İpucu hakkınız kalmadı!');
      return;
    }

    // İpucu sayısını azalt
    gameState.hintCount--;
    gameState.hintUsed = true;

    // İpucu butonu metnini güncelle
    if (hintButton) {
      hintButton.textContent = `İpucu (${gameState.hintCount})`;
    }

    // Mevcut karakterin ipucunu göster
    const currentCharacter = gameState.characters[gameState.round - 1];

    if (hintDisplay) {
      hintDisplay.textContent = currentCharacter.hint;
      hintDisplay.style.display = 'block';

      // İpucunu 5 saniye sonra gizle
      setTimeout(() => {
        hintDisplay.style.display = 'none';
      }, 5000);
    }

    // İpucu ses efekti
    playSound('hint');
  }

  // Yeni tur başlat
  function startNewRound() {
    gameState.round++;
    gameState.isAnswerPhase = true;
    gameState.hintUsed = false;

    // Tur göstergesini güncelle
    if (roundDisplay) {
      roundDisplay.textContent = gameState.round + '/' + gameState.maxRounds;
    }

    // Karakteri seç
    const characterIndex = gameState.round - 1;
    if (characterIndex >= gameState.characters.length) {
      endGame();
      return;
    }

    const currentCharacter = gameState.characters[characterIndex];
    gameState.correctRegion = currentCharacter.regionId;

    // Karakter görselini göster
    if (characterImage) {
      characterImage.innerHTML = `
        <img src="${currentCharacter.image}" alt="${currentCharacter.name}" onerror="this.src='/static/images/placeholder.jpg'">
        <div class="character-name">${currentCharacter.name}</div>
      `;
    }

    // Süreyi başlat
    gameState.timer = 20;
    if (timerDisplay) timerDisplay.textContent = gameState.timer;

    if (gameState.interval) {
      clearInterval(gameState.interval);
    }

    gameState.interval = setInterval(updateTimer, 1000);
  }

  // Haritayı yükle
  function loadMap() {
    if (!mapContainer) return;

    // Yükleniyor mesajını göster
    if (loadingMessage) loadingMessage.style.display = 'flex';

    // Harita SVG'sini fetch ile çekelim
    fetch('/static/images/turkey-map.svg')
      .then(response => response.text())
      .then(svgData => {
        // SVG'yi container'a ekleyelim
        mapContainer.innerHTML = svgData;

        // SVG yüklendikten sonra
        setTimeout(() => {
          // Yükleniyor mesajını gizle
          if (loadingMessage) loadingMessage.style.display = 'none';

          // Harita bölgelerine tıklama olayı ekleyelim
          const regions = document.querySelectorAll('#map-container svg path');
          regions.forEach(region => {
            region.addEventListener('click', handleRegionClick);
            region.addEventListener('mouseover', handleRegionHover);
            region.addEventListener('mouseout', handleRegionOut);

            // Görsel iyileştirme - bölgelere sınır ve stil ekle
            region.setAttribute('stroke', '#fff');
            region.setAttribute('stroke-width', '0.5');
            region.setAttribute('fill-opacity', '0.8');
          });
        }, 500);
      })
      .catch(error => {
        console.error('Harita yüklenirken hata:', error);
        if (loadingMessage) {
          loadingMessage.innerHTML = 'Harita yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.';
        }
      });
  }

  // Bölge üzerine gelince
  function handleRegionHover(event) {
    if (!gameState.isAnswerPhase) return;

    const region = event.target;
    region.style.cursor = 'pointer';
    region.style.filter = 'brightness(1.2)';

    // Bölge adını göster
    const regionId = region.getAttribute('id');
    const regionName = getRegionName(regionId);

    // Tooltip oluştur
    let tooltip = document.getElementById('map-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'map-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.padding = '5px 10px';
      tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
      tooltip.style.color = '#fff';
      tooltip.style.borderRadius = '5px';
      tooltip.style.fontSize = '14px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '1000';
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = regionName;

    // Tooltip pozisyonu
    const mapRect = mapContainer.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    tooltip.style.display = 'block';
  }

  // Bölgeden çıkınca
  function handleRegionOut(event) {
    const region = event.target;
    region.style.filter = '';

    // Tooltip'i gizle
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  // Bölge adını bul
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

  // Bölgeye tıklama olayı
  function handleRegionClick(event) {
    if (!gameState.isAnswerPhase) return;

    const region = event.target;
    const regionId = region.id || region.getAttribute('id');

    // Animasyon için seçilen bölgeyi işaretle
    const allRegions = document.querySelectorAll('#map-container svg path');
    allRegions.forEach(r => {
      r.style.filter = '';
      r.style.fillOpacity = '0.8';
    });

    region.style.filter = 'brightness(1.3)';
    region.style.fillOpacity = '1';

    // Cevap kontrolü
    checkAnswer(regionId);
  }

  // Cevap kontrolü
  function checkAnswer(selectedRegionId) {
    // Zamanlayıcıyı durdur
    clearInterval(gameState.interval);
    gameState.isAnswerPhase = false;

    const isCorrect = selectedRegionId === gameState.correctRegion;
    let pointsEarned = 0;

    // Doğru cevap animasyonu ve puanlama
    if (isCorrect) {
      // Doğru bölgeyi yeşil yap
      highlightRegion(selectedRegionId, '#4CAF50');

      // Puanlama: Kalan süre + temel puan (ipucu kullanılmadıysa bonus)
      pointsEarned = (gameState.timer * 5) + 100;
      if (!gameState.hintUsed) pointsEarned += 50;

      gameState.score += pointsEarned;
      if (scoreDisplay) scoreDisplay.textContent = gameState.score;

      // Ses efekti
      playSound('correct');

      // Doğru cevap mesajı
      showMessage(`Doğru! +${pointsEarned} puan kazandınız.`, 'success');
    } else {
      // Yanlış bölgeyi kırmızı, doğru bölgeyi yeşil yap
      highlightRegion(selectedRegionId, '#FF5252');
      highlightRegion(gameState.correctRegion, '#4CAF50');

      // Ses efekti
      playSound('wrong');

      // Yanlış cevap mesajı
      showMessage('Yanlış cevap! Doğru cevap yeşil renkte gösterildi.', 'error');
    }

    // Sonraki tura geç veya oyunu bitir
    setTimeout(() => {
      if (gameState.round < gameState.maxRounds) {
        startNewRound();
      } else {
        endGame();
      }
    }, 2000);
  }

  // Bölgeyi vurgula
  function highlightRegion(regionId, color) {
    const region = document.getElementById(regionId);
    if (region) {
      region.style.fill = color;
      region.style.fillOpacity = '0.9';

      // Vurgulama animasyonu
      const pulseEffect = document.createElement('div');
      pulseEffect.className = 'pulse-effect';
      pulseEffect.style.position = 'absolute';

      const bbox = region.getBBox();
      const svgElement = region.ownerSVGElement;

      if (svgElement) {
        const pt = svgElement.createSVGPoint();
        pt.x = bbox.x + bbox.width / 2;
        pt.y = bbox.y + bbox.height / 2;

        const screenPt = pt.matrixTransform(svgElement.getScreenCTM());

        pulseEffect.style.left = `${screenPt.x - 15}px`;
        pulseEffect.style.top = `${screenPt.y - 15}px`;
        pulseEffect.style.backgroundColor = color;

        document.body.appendChild(pulseEffect);

        setTimeout(() => {
          pulseEffect.remove();
        }, 1500);
      }
    }
  }

  // Süre güncelleme
  function updateTimer() {
    if (gameState.timer > 0) {
      gameState.timer--;
      if (timerDisplay) timerDisplay.textContent = gameState.timer;

      // Son 5 saniye için kırmızı renk
      if (gameState.timer <= 5) {
        if (timerDisplay) timerDisplay.style.color = '#FF5252';

        // Tik sesi
        if (gameState.timer > 0) {
          playSound('tick');
        }
      }
    } else {
      // Süre doldu
      clearInterval(gameState.interval);
      gameState.isAnswerPhase = false;

      // Doğru cevabı göster
      highlightRegion(gameState.correctRegion, '#4CAF50');

      // Ses efekti
      playSound('timeout');

      // Süre doldu mesajı
      showMessage('Süre doldu! Doğru cevap yeşil renkte gösterildi.', 'warning');

      // Sonraki tura geç veya oyunu bitir
      setTimeout(() => {
        if (gameState.round < gameState.maxRounds) {
          startNewRound();
        } else {
          endGame();
        }
      }, 2000);
    }
  }

  // Oyun sonu
  function endGame() {
    clearInterval(gameState.interval);

    if (gameContainer) gameContainer.style.display = 'none';
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';

      // Final skoru ve mesajı
      if (finalScoreDisplay) finalScoreDisplay.textContent = gameState.score;

      let message = '';
      if (gameState.score >= 800) {
        message = 'Tebrikler! Türkiye\'yi çok iyi tanıyorsunuz.';
      } else if (gameState.score >= 500) {
        message = 'Güzel bir performans! Türkiye\'yi iyi tanıyorsunuz.';
      } else {
        message = 'Türkiye\'yi daha iyi tanımak için tekrar oynayabilirsiniz.';
      }

      if (resultMessage) resultMessage.textContent = message;
    }

    // Skor kaydetme işlemi burada yapılabilir

    // Bitiş sesi
    playSound('gameOver');
  }

  // Yeniden başlat butonu
  if (restartButton) {
    restartButton.addEventListener('click', function() {
      // Oyun durumunu sıfırla
      gameState.score = 0;
      gameState.round = 0;
      gameState.hintCount = 3;

      // UI sıfırla
      if (scoreDisplay) scoreDisplay.textContent = '0';
      if (timerDisplay) {
        timerDisplay.textContent = '20';
        timerDisplay.style.color = '';
      }
      if (hintButton) {
        hintButton.textContent = `İpucu (${gameState.hintCount})`;
      }

      // Ekranları güncelle
      if (gameOverScreen) gameOverScreen.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'block';

      // Haritayı yeniden yükle
      loadMap();

      // İlk turu başlat
      startNewRound();

      // Ses çal
      playSound('click');
    });
  }

  // Mesaj göster
  function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;

    const message = document.createElement('div');
    message.className = `game-message ${type}`;
    message.textContent = text;

    messageContainer.appendChild(message);

    // Animasyon ile göster
    setTimeout(() => {
      message.style.opacity = '1';
      message.style.transform = 'translateY(0)';
    }, 10);

    // Mesajı kaldır
    setTimeout(() => {
      message.style.opacity = '0';
      message.style.transform = 'translateY(-20px)';

      setTimeout(() => {
        messageContainer.removeChild(message);
      }, 500);
    }, 3000);
  }
});
document.addEventListener('DOMContentLoaded', function() {
  // DOM elementleri
  const gameContainer = document.getElementById('gameContainer');
  const startScreen = document.getElementById('startScreen');
  const startButton = document.getElementById('startButton');
  const mapContainer = document.getElementById('mapContainer');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const roundDisplay = document.getElementById('round');
  const questionDisplay = document.getElementById('question');
  const hintDisplay = document.getElementById('hintText');
  const hintButton = document.getElementById('hintButton');
  const resultScreen = document.getElementById('resultScreen');
  const finalScoreDisplay = document.getElementById('finalScore');
  const restartButton = document.getElementById('restartButton');
  const nextLevelBtn = document.getElementById('nextLevel');
  const prevLevelBtn = document.getElementById('prevLevel');

  // Oyun durumu
  let gameState = {
    score: 0,
    time: 60,
    round: 0,
    totalRounds: 5,
    level: 1,
    hintCount: 3,
    hintUsed: false,
    timer: null,
    characters: []
  };

  // Level seçimi
  const levels = {
    1: { 
      name: 'Kolay', 
      characters: [
        { id: 'ankara', name: 'Ankara', hint: 'Türkiye\'nin başkenti' },
        { id: 'istanbul', name: 'İstanbul', hint: 'Boğazın iki yakasını birleştiren şehir' },
        { id: 'izmir', name: 'İzmir', hint: 'Ege\'nin incisi olarak bilinen şehir' },
        { id: 'antalya', name: 'Antalya', hint: 'Turizm cenneti olarak bilinen şehir' },
        { id: 'bursa', name: 'Bursa', hint: 'Osmanlı\'nın ilk başkenti' }
      ]
    },
    2: { 
      name: 'Orta', 
      characters: [
        { id: 'trabzon', name: 'Trabzon', hint: 'Karadeniz\'in önemli liman şehri' },
        { id: 'konya', name: 'Konya', hint: 'Mevlana\'nın şehri' },
        { id: 'kayseri', name: 'Kayseri', hint: 'İç Anadolu\'da sanayisi gelişmiş şehir' },
        { id: 'diyarbakir', name: 'Diyarbakır', hint: 'Surları ile ünlü Güneydoğu şehri' },
        { id: 'gaziantep', name: 'Gaziantep', hint: 'Baklavasıyla ünlü şehir' }
      ]
    },
    3: { 
      name: 'Zor', 
      characters: [
        { id: 'edirne', name: 'Edirne', hint: 'Osmanlı\'nın ikinci başkenti' },
        { id: 'erzurum', name: 'Erzurum', hint: 'Doğu Anadolu\'da kışın çok soğuk olan şehir' },
        { id: 'samsun', name: 'Samsun', hint: 'Atatürk\'ün Milli Mücadeleyi başlattığı şehir' },
        { id: 'van', name: 'Van', hint: 'Göl kenarında bulunan doğu şehri' },
        { id: 'hatay', name: 'Hatay', hint: 'Güneyde, Suriye sınırında bulunan şehir' }
      ]
    }
  };

  // Ses fonksiyonları
  function playSound(soundName) {
    try {
      const sound = new Audio(`/static/sounds/${soundName}.mp3`);
      sound.volume = 0.5;
      sound.play();
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }

  // Level değiştirme fonksiyonları
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', function() {
      if (gameState.level < 3) {
        gameState.level++;
        updateLevelDisplay();
        resetGame();
        playSound('click');
      }
    });
  }

  if (prevLevelBtn) {
    prevLevelBtn.addEventListener('click', function() {
      if (gameState.level > 1) {
        gameState.level--;
        updateLevelDisplay();
        resetGame();
        playSound('click');
      }
    });
  }

  function updateLevelDisplay() {
    const levelDisplay = document.getElementById('currentLevel');
    if (levelDisplay) {
      levelDisplay.textContent = `Seviye: ${levels[gameState.level].name}`;
    }
  }

  // Oyunu başlat butonu
  if (startButton) {
    startButton.addEventListener('click', function() {
      if (startScreen) startScreen.style.display = 'none';
      if (gameContainer) gameContainer.style.display = 'block';

      // SVG haritasını yükle
      loadMap();

      // İlk turu başlat
      startNewRound();

      // Ses çal
      playSound('click');
    });
  }

  // İpucu butonu işlevselliği
  if (hintButton) {
    hintButton.addEventListener('click', function() {
      showHint();
      playSound('click');
    });
  }

  // İpucu gösterme fonksiyonu
  function showHint() {
    if (gameState.hintCount <= 0) {
      alert('İpucu hakkınız kalmadı!');
      return;
    }

    // İpucu sayısını azalt
    gameState.hintCount--;
    gameState.hintUsed = true;

    // İpucu butonu metnini güncelle
    if (hintButton) {
      hintButton.textContent = `İpucu (${gameState.hintCount})`;
    }

    // Mevcut karakterin ipucunu göster
    const currentCharacter = gameState.characters[gameState.round - 1];

    if (hintDisplay) {
      hintDisplay.textContent = currentCharacter.hint;
      hintDisplay.style.display = 'block';

      // İpucunu 5 saniye sonra gizle
      setTimeout(() => {
        hintDisplay.style.display = 'none';
      }, 5000);
    }
  }

  // SVG harita yükleme
  function loadMap() {
    fetch('/static/images/turkey_map.svg')
      .then(response => response.text())
      .then(svgData => {
        mapContainer.innerHTML = svgData;
        
        // SVG yüklendikten sonra şehirlere tıklama olayları ekle
        setupCityClicks();
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        mapContainer.innerHTML = '<p class="error-message">Harita yüklenemedi. Lütfen sayfayı yenileyiniz.</p>';
      });
  }

  // Şehirlere tıklama olayları ekleme
  function setupCityClicks() {
    const cityElements = document.querySelectorAll('#mapContainer path');
    
    cityElements.forEach(city => {
      city.addEventListener('click', function() {
        const cityId = this.id;
        checkAnswer(cityId);
      });
      
      // Hover etkisi
      city.addEventListener('mouseenter', function() {
        this.style.opacity = '0.7';
        this.style.cursor = 'pointer';
      });
      
      city.addEventListener('mouseleave', function() {
        this.style.opacity = '1';
      });
    });
  }

  // Yeni tur başlatma
  function startNewRound() {
    if (gameState.round >= gameState.totalRounds) {
      endGame();
      return;
    }

    gameState.round++;
    gameState.hintUsed = false;
    gameState.time = 60;
    
    // Mevcut level için karakterleri ayarla
    gameState.characters = levels[gameState.level].characters;
    
    // Ekranı güncelle
    updateDisplay();
    
    // Zamanlayıcıyı başlat
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(updateTimer, 1000);

    // İpucu metnini temizle
    if (hintDisplay) hintDisplay.style.display = 'none';
  }

  // Ekran güncelleme
  function updateDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    if (timerDisplay) timerDisplay.textContent = gameState.time;
    if (roundDisplay) roundDisplay.textContent = `${gameState.round}/${gameState.totalRounds}`;
    
    const currentCharacter = gameState.characters[gameState.round - 1];
    if (questionDisplay && currentCharacter) {
      questionDisplay.textContent = `"${currentCharacter.name}" nerede?`;
    }
    
    // İpucu sayısını güncelle
    if (hintButton) {
      hintButton.textContent = `İpucu (${gameState.hintCount})`;
    }
  }

  // Zamanlayıcı güncellemesi
  function updateTimer() {
    gameState.time--;
    
    if (timerDisplay) timerDisplay.textContent = gameState.time;
    
    if (gameState.time <= 0) {
      clearInterval(gameState.timer);
      playSound('wrong');
      
      if (gameState.round < gameState.totalRounds) {
        startNewRound();
      } else {
        endGame();
      }
    }
  }

  // Cevap kontrolü
  function checkAnswer(selectedCityId) {
    const currentCharacter = gameState.characters[gameState.round - 1];
    
    if (selectedCityId === currentCharacter.id) {
      // Doğru cevap
      const timeBonus = Math.floor(gameState.time / 3);
      const basePoints = 100;
      const hintPenalty = gameState.hintUsed ? 30 : 0;
      
      const roundScore = basePoints + timeBonus - hintPenalty;
      gameState.score += roundScore;
      
      playSound('correct');
      
      // Şehri vurgula
      highlightCity(selectedCityId, 'correct');
      
      // Zamanlayıcıyı durdur
      clearInterval(gameState.timer);
      
      // Sonraki tura geç
      setTimeout(() => {
        if (gameState.round < gameState.totalRounds) {
          startNewRound();
        } else {
          endGame();
        }
      }, 1500);
    } else {
      // Yanlış cevap
      playSound('wrong');
      highlightCity(selectedCityId, 'wrong');
      
      // Yanlış cevaplar için zaman cezası
      gameState.time -= 5;
      if (gameState.time < 0) gameState.time = 0;
      updateDisplay();
    }
  }

  // Şehri vurgulama
  function highlightCity(cityId, result) {
    const city = document.getElementById(cityId);
    if (city) {
      city.classList.add(result);
      
      setTimeout(() => {
        city.classList.remove(result);
      }, 1000);
    }
  }

  // Oyun sonu
  function endGame() {
    clearInterval(gameState.timer);
    
    if (gameContainer) gameContainer.style.display = 'none';
    if (resultScreen) {
      resultScreen.style.display = 'flex';
      if (finalScoreDisplay) finalScoreDisplay.textContent = gameState.score;
    }
    
    // Kaydetme isteği
    saveScore('whereIsIt', gameState.score);
  }

  // Skoru kaydetme
  function saveScore(gameType, score) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: gameType,
        score: score,
        difficulty: gameState.difficulty || 'medium',
        playtime: gameState.elapsedTime || 0,
        game_stats: {
          correct_answers: gameState.correctAnswers || 0,
          total_rounds: gameState.round || 0,
          completed: gameState.gameOver || false
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved successfully:', data);
    })
    .catch(error => {
      console.log('Skor kaydedilirken hata:', error);
    });
  }

  // Oyunu sıfırla
  function resetGame() {
    gameState.score = 0;
    gameState.round = 0;
    gameState.time = 60;
    gameState.hintCount = 3;
    gameState.hintUsed = false;
    
    clearInterval(gameState.timer);
    
    if (resultScreen) resultScreen.style.display = 'none';
    if (startScreen) startScreen.style.display = 'flex';
    if (gameContainer) gameContainer.style.display = 'none';
    
    updateLevelDisplay();
  }

  // Oyunu yeniden başlatma butonu
  if (restartButton) {
    restartButton.addEventListener('click', function() {
      resetGame();
      playSound('click');
    });
  }

  // İlk yükleme
  updateLevelDisplay();
});
