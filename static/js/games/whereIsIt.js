/*
 * Kim Nerede? Oyunu
 * Türkiye haritası üzerinde belirtilen şehirleri bulma oyunu
 */

document.addEventListener('DOMContentLoaded', function() {
  // Oyun elemanları
  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const startGameBtn = document.getElementById('start-game');
  const hintButton = document.getElementById('hint-button');
  const mapContainer = document.getElementById('map-container');
  const characterImage = document.getElementById('character-image');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const roundDisplay = document.getElementById('round-display');
  const hintDisplay = document.getElementById('hint-display');

  // Zorluk seviyesi butonları
  const easyModeBtn = document.getElementById('easy-mode');
  const mediumModeBtn = document.getElementById('medium-mode');
  const hardModeBtn = document.getElementById('hard-mode');

  // Sonuç ekranı elemanları
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScore = document.getElementById('final-score');
  const correctCount = document.getElementById('correct-count');
  const wrongCount = document.getElementById('wrong-count');
  const timeBonus = document.getElementById('time-bonus');
  const locationAccuracy = document.getElementById('location-accuracy');
  const playAgainBtn = document.getElementById('play-again');

  // Oyun durumu
  const gameState = {
    isActive: false,
    isAnswerPhase: false,
    score: 0,
    round: 0,
    maxRounds: 10,
    timer: 20,
    interval: null,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeBonus: 0,
    totalDistance: 0,
    correctRegion: null,
    hintUsed: false,
    soundEnabled: true,
    difficulty: 'easy', // Varsayılan zorluk

    // Karakter listesi - Kolay mod
    easyCharacters: [
      { name: 'Fatih Sultan Mehmet', regionId: 'istanbul', image: '/static/images/characters/fatih.jpg' },
      { name: 'Mustafa Kemal Atatürk', regionId: 'ankara', image: '/static/images/characters/ataturk.jpg' },
      { name: 'Nene Hatun', regionId: 'erzurum', image: '/static/images/characters/nenehatun.jpg' },
      { name: 'Nasreddin Hoca', regionId: 'konya', image: '/static/images/characters/nasreddin.jpg' },
      { name: 'Yunus Emre', regionId: 'eskisehir', image: '/static/images/characters/yunusemre.jpg' },
      { name: 'İbrahim Çallı', regionId: 'izmir', image: '/static/images/characters/calli.jpg' },
      { name: 'Seyit Onbaşı', regionId: 'canakkale', image: '/static/images/characters/seyitonbasi.jpg' },
      { name: 'Hacı Bektaş Veli', regionId: 'nevsehir', image: '/static/images/characters/hacibektasveli.jpg' },
      { name: 'Karacaoğlan', regionId: 'adana', image: '/static/images/characters/karacaoglan.jpg' },
      { name: 'Piri Reis', regionId: 'antalya', image: '/static/images/characters/pirireis.jpg' }
    ],

    // Orta zorluk karakterleri
    mediumCharacters: [
      { name: 'Mimar Sinan', regionId: 'kayseri', image: '/static/images/characters/mimarsinan.jpg' },
      { name: 'Aşık Veysel', regionId: 'sivas', image: '/static/images/characters/asikveysel.jpg' },
      { name: 'Evliya Çelebi', regionId: 'kutahya', image: '/static/images/characters/evliyacelebi.jpg' },
      { name: 'Kâtip Çelebi', regionId: 'istanbul', image: '/static/images/characters/katipçelebi.jpg' },
      { name: 'Mevlana', regionId: 'konya', image: '/static/images/characters/mevlana.jpg' },
      { name: 'Pir Sultan Abdal', regionId: 'sivas', image: '/static/images/characters/pirsultan.jpg' },
      { name: 'Hacı Bayram Veli', regionId: 'ankara', image: '/static/images/characters/hacibayram.jpg' },
      { name: 'Hezarfen Ahmed Çelebi', regionId: 'istanbul', image: '/static/images/characters/hezarfen.jpg' },
      { name: 'Dede Korkut', regionId: 'bayburt', image: '/static/images/characters/dedekorkut.jpg' },
      { name: 'Köroğlu', regionId: 'bolu', image: '/static/images/characters/koroglu.jpg' },
      { name: 'İbni Sina', regionId: 'afyon', image: '/static/images/characters/ibnisina.jpg' },
      { name: 'Barbaros Hayrettin Paşa', regionId: 'izmir', image: '/static/images/characters/barbaros.jpg' }
    ],

    // Zor zorluk karakterleri
    hardCharacters: [
      { name: 'Cahit Arf', regionId: 'istanbul', image: '/static/images/characters/cahitarf.jpg' },
      { name: 'Aziz Sancar', regionId: 'mardin', image: '/static/images/characters/azizsancar.jpg' },
      { name: 'Âşık Mahzuni Şerif', regionId: 'kahramanmaras', image: '/static/images/characters/mahzuni.jpg' },
      { name: 'Neşet Ertaş', regionId: 'kirsehir', image: '/static/images/characters/nesettertas.jpg' },
      { name: 'Itri', regionId: 'istanbul', image: '/static/images/characters/itri.jpg' },
      { name: 'Osman Hamdi Bey', regionId: 'istanbul', image: '/static/images/characters/osmanhamdi.jpg' },
      { name: 'Âşık Sümmani', regionId: 'erzurum', image: '/static/images/characters/summani.jpg' },
      { name: 'İbn-i Kemal', regionId: 'tokat', image: '/static/images/characters/ibnikemal.jpg' },
      { name: 'Koca Ragıp Paşa', regionId: 'istanbul', image: '/static/images/characters/kocaragip.jpg' },
      { name: 'Seyyid Battal Gazi', regionId: 'eskisehir', image: '/static/images/characters/battalgazi.jpg' },
      { name: 'Ahi Evran', regionId: 'kirsehir', image: '/static/images/characters/ahievran.jpg' },
      { name: 'Matrakçı Nasuh', regionId: 'bosna', image: '/static/images/characters/matrakci.jpg' },
      { name: 'Sarı Saltuk', regionId: 'manisa', image: '/static/images/characters/sarisaltuk.jpg' },
      { name: 'Fatma Aliye Hanım', regionId: 'istanbul', image: '/static/images/characters/fatmaaliye.jpg' },
      { name: 'Halide Edip Adıvar', regionId: 'istanbul', image: '/static/images/characters/halideedip.jpg' }
    ],

    // Aktif karakter listesi (zorluk seviyesine göre değişecek)
    characters: []
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

  // Zorluk seviyesini ayarla
  function setDifficulty(level) {
    gameState.difficulty = level;

    // Aktif zorluk butonlarını güncelle
    if (easyModeBtn) easyModeBtn.classList.remove('active');
    if (mediumModeBtn) mediumModeBtn.classList.remove('active');
    if (hardModeBtn) hardModeBtn.classList.remove('active');

    switch(level) {
      case 'easy':
        if (easyModeBtn) easyModeBtn.classList.add('active');
        gameState.characters = [...gameState.easyCharacters];
        gameState.maxRounds = 10;
        break;
      case 'medium':
        if (mediumModeBtn) mediumModeBtn.classList.add('active');
        gameState.characters = [...gameState.mediumCharacters];
        gameState.maxRounds = 12;
        break;
      case 'hard':
        if (hardModeBtn) hardModeBtn.classList.add('active');
        gameState.characters = [...gameState.hardCharacters];
        gameState.maxRounds = 15;
        break;
      default:
        if (easyModeBtn) easyModeBtn.classList.add('active');
        gameState.characters = [...gameState.easyCharacters];
        gameState.maxRounds = 10;
    }

    // Karakter listesini karıştır
    shuffleArray(gameState.characters);
  }

  // Oyunu başlat
  function startGame() {
    if (startScreen) startScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';

    gameState.isActive = true;
    gameState.score = 0;
    gameState.round = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.timeBonus = 0;
    gameState.totalDistance = 0;

    // Zorluk seviyesine göre karakter listesini ayarla (eğer daha önce ayarlanmadıysa)
    if (gameState.characters.length === 0) {
      setDifficulty('easy');
    }

    // İlk turu başlat
    startNewRound();

    // Haritayı yükle
    loadMap();

    // Skor göstergesini güncelle
    updateScore();
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
      hintDisplay.textContent = currentCharacter.hint || "İpucu bulunamadı."; // Varsayılan ipucu
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

    // Harita türünü belirle (zorluk seviyesine göre farklı haritalar kullanabilirsiniz)
    let mapUrl = '/static/images/turkey-map-detailed.svg'; // Daha detaylı harita

    // SVG haritayı yükle
    fetch(mapUrl)
      .then(response => response.text())
      .then(svgData => {
        mapContainer.innerHTML = svgData;

        // SVG harita boyutunu büyüt
        const svgElement = mapContainer.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.maxHeight = '600px'; // Daha büyük harita
        }

        // Bölgelere tıklama olaylarını ekle
        const regions = document.querySelectorAll('#map-container svg path');
        regions.forEach(region => {
          region.addEventListener('click', handleRegionClick);
          region.addEventListener('mouseover', showRegionTooltip);
          region.addEventListener('mouseout', hideRegionTooltip);
        });

        // Haritada şehir etiketlerini göster (zorluk seviyesine göre)
        if (gameState.difficulty === 'easy') {
          showCityLabels(10); // Sadece büyük şehirler
        } else if (gameState.difficulty === 'medium') {
          showCityLabels(30); // Orta büyüklükteki şehirler
        } else {
          showCityLabels(81); // Tüm şehirler
        }
      })
      .catch(error => {
        console.error('Harita yüklenirken hata oluştu:', error);
        // Yedek olarak basit haritayı yükle
        fetch('/static/images/turkey-map.svg')
          .then(response => response.text())
          .then(svgData => {
            mapContainer.innerHTML = svgData;
            const regions = document.querySelectorAll('#map-container svg path');
            regions.forEach(region => {
              region.addEventListener('click', handleRegionClick);
              region.addEventListener('mouseover', showRegionTooltip);
              region.addEventListener('mouseout', hideRegionTooltip);
            });
          });
      });
  }

  // Şehir etiketlerini göster (haritada şehir isimlerini gösterir)
  function showCityLabels(count) {
    // Bu fonksiyon, haritada şehir etiketlerini gösterir
    // count parametresi, kaç şehrin etiketinin gösterileceğini belirler

    // SVG haritasına şehir etiketleri ekle
    const svgElement = mapContainer.querySelector('svg');
    if (!svgElement) return;

    // Etiket grubu oluştur
    const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labelGroup.setAttribute('id', 'city-labels');

    // Şehir bilgileri (koordinatlar örnek olarak verilmiştir, gerçek koordinatlara göre ayarlanmalıdır)
    const cities = [
      { name: 'İstanbul', x: 235, y: 75 },
      { name: 'Ankara', x: 310, y: 150 },
      { name: 'İzmir', x: 170, y: 200 },
      { name: 'Antalya', x: 220, y: 280 },
      { name: 'Bursa', x: 210, y: 120 },
      { name: 'Adana', x: 330, y: 260 },
      { name: 'Konya', x: 280, y: 220 },
      { name: 'Trabzon', x: 450, y: 130 },
      { name: 'Erzurum', x: 450, y: 170 },
      { name: 'Gaziantep', x: 370, y: 270 },
      { name: 'Samsun', x: 380, y: 120 },
      { name: 'Kayseri', x: 340, y: 190 },
      { name: 'Eskişehir', x: 260, y: 140 },
      { name: 'Diyarbakır', x: 430, y: 230 },
      { name: 'Mersin', x: 300, y: 270 },
      // Daha fazla şehir eklenebilir
    ];

    // Sadece belirtilen sayıda şehri göster
    const citiesToShow = cities.slice(0, Math.min(count, cities.length));

    // Şehir etiketlerini ekle
    citiesToShow.forEach(city => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = city.name;
      text.setAttribute('x', city.x);
      text.setAttribute('y', city.y);
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#333');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('text-anchor', 'middle');
      labelGroup.appendChild(text);
    });

    svgElement.appendChild(labelGroup);
  }

  // Bölge üzerine gelince
  function showRegionTooltip(event) {
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
  function hideRegionTooltip(event) {
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
      'erzurum': 'Erzurum',
      'eskisehir': 'Eskişehir',
      'canakkale': 'Çanakkale',
      'nevsehir': 'Nevşehir',
      'kayseri': 'Kayseri',
      'sivas': 'Sivas',
      'kutahya': 'Kütahya',
      'bayburt': 'Bayburt',
      'bolu': 'Bolu',
      'afyon': 'Afyon',
      'mardin': 'Mardin',
      'kahramanmaras': 'Kahramanmaraş',
      'kirsehir': 'Kırşehir',
      'tokat': 'Tokat',
      'manisa': 'Manisa',
      'bosna': 'Bosna' //Örnek olarak eklendi
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

    if (isCorrect) {
      // Doğru cevap
      gameState.correctAnswers++;

      // Zaman bonusu: kalan süre başına 10 puan
      const timePoints = gameState.timer * 10;
      gameState.timeBonus += timePoints;

      // 100 baz puan + zaman bonusu
      pointsEarned = 100 + timePoints;

      // İpucu kullanıldıysa, puanın %30'unu düş
      if (gameState.hintUsed) {
        pointsEarned = Math.floor(pointsEarned * 0.7);
      }

      // Zorluk seviyesine göre puan çarpanı
      if (gameState.difficulty === 'medium') {
        pointsEarned = Math.floor(pointsEarned * 1.5);
      } else if (gameState.difficulty === 'hard') {
        pointsEarned = Math.floor(pointsEarned * 2);
      }

      gameState.score += pointsEarned;

      // Doğru efekti
      mapContainer.classList.add('correct-answer');
      playSound('correct');

      // Sonraki tura otomatik geçiş için zamanlayıcı
      setTimeout(() => {
        mapContainer.classList.remove('correct-answer');

        if (gameState.round < gameState.maxRounds) {
          startNewRound();
        } else {
          endGame();
        }
      }, 2000);
    } else {
      // Yanlış cevap
      gameState.wrongAnswers++;

      // Yanlış efekti
      mapContainer.classList.add('wrong-answer');
      playSound('wrong');

      // Doğru bölgeyi göster
      highlightCorrectRegion();

      // Bir saniye sonra kırmızı ışığı söndür (istenildiği gibi)
      setTimeout(() => {
        mapContainer.classList.remove('wrong-answer');
      }, 1000);

      // İki saniye sonra bir sonraki tura geç (toplam bekleme süresini değiştirmiyoruz)
      setTimeout(() => {
        if (gameState.round < gameState.maxRounds) {
          startNewRound();
        } else {
          endGame();
        }
      }, 2000);
    }

    // Skoru güncelle
    updateScore();

    return {
      isCorrect,
      pointsEarned
    };
  }

  // Doğru bölgeyi vurgulama fonksiyonu
  function highlightCorrectRegion() {
    const correctRegion = document.getElementById(gameState.correctRegion);
    if (correctRegion) {
      correctRegion.style.fill = '#4CAF50';
      correctRegion.style.fillOpacity = '0.9';
    }
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
      highlightCorrectRegion();

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

    if (gameScreen) gameScreen.style.display = 'none';
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';

      // Final skoru ve mesajı
      if (finalScore) finalScore.textContent = gameState.score;
      if (correctCount) correctCount.textContent = gameState.correctAnswers;
      if (wrongCount) wrongCount.textContent = gameState.wrongAnswers;
      if (timeBonus) timeBonus.textContent = gameState.timeBonus;
      // locationAccuracy - Hesaplama gerekli

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
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      // Oyun durumunu sıfırla
      gameState.score = 0;
      gameState.round = 0;
      gameState.hintCount = 3;
      gameState.correctAnswers = 0;
      gameState.wrongAnswers = 0;
      gameState.timeBonus = 0;
      gameState.totalDistance = 0;

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
      if (gameScreen) gameScreen.style.display = 'block';

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

    // Rastgele karıştırma fonksiyonu
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Skor güncelleme fonksiyonu
  function updateScore() {
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
  }


  // Olay dinleyicileri
  if (startGameBtn) {
    startGameBtn.addEventListener('click', startGame);
  }

  if (hintButton) {
    hintButton.addEventListener('click', showHint);
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      if (gameOverScreen) gameOverScreen.style.display = 'none';
      startGame();
    });
  }

  // Zorluk seviyesi butonları için olay dinleyicileri
  if (easyModeBtn) {
    easyModeBtn.addEventListener('click', () => {
      setDifficulty('easy');
    });
  }

  if (mediumModeBtn) {
    mediumModeBtn.addEventListener('click', () => {
      setDifficulty('medium');
    });
  }

  if (hardModeBtn) {
    hardModeBtn.addEventListener('click', () => {
      setDifficulty('hard');
    });
  }
});