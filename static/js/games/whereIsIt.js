// Kim Nerede? (Türkiye İlleri) oyunu için JavaScript

document.addEventListener("DOMContentLoaded", function() {
  // Oyun değişkenleri
  let score = 0;
  let level = 1;
  let timeLeft = 30; // Başlangıç süresi (saniye)
  let correctAnswers = 0;
  let totalCorrectAnswers = 0;
  let timer;
  let currentProvince = "";
  let provinces = [];
  let svgDocument = null;
  let isGameActive = false;
  let hintCount = 3;
  let usedProvinces = [];

  // Ses efektleri
  const correctSound = new Audio('/static/sounds/correct.mp3');
  const wrongSound = new Audio('/static/sounds/wrong.mp3');
  const levelCompleteSound = new Audio('/static/sounds/level-complete.mp3');
  const gameOverSound = new Audio('/static/sounds/game-over.mp3');

  // Ses çalma fonksiyonu (hataları yakala)
  function playSound(sound) {
    try {
      if (sound && sound.play) {
        sound.currentTime = 0;
        sound.play().catch(err => {
          console.log("Sound play error:", err);
        });
      }
    } catch (err) {
      console.log("Sound play error:", err);
    }
  }

  // DOM öğeleri
  const startGameBtn = document.getElementById('start-game-btn');
  const introSection = document.getElementById('intro-section');
  const gameArea = document.getElementById('game-area');
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const levelDisplay = document.getElementById('level-display');
  const correctDisplay = document.getElementById('correct-display');
  const currentProvinceDisplay = document.getElementById('current-province');
  const turkeyMap = document.getElementById('turkey-map');
  const levelCompleteModal = document.getElementById('level-complete-modal');
  const gameOverModal = document.getElementById('game-over-modal');
  const nextLevelBtn = document.getElementById('next-level-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');
  const hintBtn = document.getElementById('hint-btn');
  const hintCountDisplay = document.getElementById('hint-count');
  const provinceTooltip = document.getElementById('province-tooltip');
  const tooltipText = document.getElementById('tooltip-text');

  // Seviye tamamlama modal içeriği
  const levelCorrectCount = document.getElementById('level-correct-count');
  const levelPointsDisplay = document.getElementById('level-points');
  const timeBonusDisplay = document.getElementById('time-bonus');
  const totalScoreDisplay = document.getElementById('total-score');

  // Oyun sonu modal içeriği
  const finalLevelDisplay = document.getElementById('final-level');
  const finalCorrectDisplay = document.getElementById('final-correct');
  const finalScoreDisplay = document.getElementById('final-score');

  // SVG yükleme
  if (turkeyMap) {
    turkeyMap.addEventListener('load', function() {
      svgDocument = turkeyMap.contentDocument;
      setupProvinces();
    });
  }

  // Başlangıç butonuna tıklama
  if (startGameBtn) {
    startGameBtn.addEventListener('click', startGame);
  }

  // Sonraki seviye butonuna tıklama
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', function() {
      if (levelCompleteModal) {
        levelCompleteModal.style.display = 'none';
      }
      startNextLevel();
    });
  }

  // Tekrar oyna butonuna tıklama
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', function() {
      if (gameOverModal) {
        gameOverModal.style.display = 'none';
      }
      resetGame();
      startGame();
    });
  }

  // Ana menüye dön butonuna tıklama
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', function() {
      if (gameOverModal) {
        gameOverModal.style.display = 'none';
      }
      resetGame();
      if (gameArea && introSection) {
        gameArea.style.display = 'none';
        introSection.style.display = 'block';
      }
    });
  }

  // İpucu butonuna tıklama
  if (hintBtn) {
    hintBtn.addEventListener('click', giveHint);
  }

  // İlleri ayarla
  function setupProvinces() {
    if (!svgDocument) return;

    // Tüm il elemanlarını seç
    const provinceElements = svgDocument.querySelectorAll('.province');

    provinces = Array.from(provinceElements).map(el => {
      const name = el.getAttribute('data-name');
      return {
        element: el,
        name: name
      };
    });

    // Her il için event listener ekle
    provinces.forEach(province => {
      // Hover efektleri
      province.element.addEventListener('mouseover', function(e) {
        if (!isGameActive) return;

        this.style.fill = '#e0e0e0';
        showTooltip(province.name, e);
      });

      province.element.addEventListener('mouseout', function() {
        if (!isGameActive) return;

        this.style.fill = '';
        hideTooltip();
      });

      province.element.addEventListener('mousemove', function(e) {
        if (!isGameActive) return;

        updateTooltipPosition(e);
      });

      // Tıklama olayı
      province.element.addEventListener('click', function() {
        if (!isGameActive) return;

        checkAnswer(province.name);
      });
    });
  }

  // Oyunu başlat
  function startGame() {
    isGameActive = true;
    if (introSection && gameArea) {
      introSection.style.display = 'none';
      gameArea.style.display = 'block';
    }

    // Değerleri sıfırla
    score = 0;
    level = 1;
    correctAnswers = 0;
    totalCorrectAnswers = 0;
    usedProvinces = [];
    timeLeft = 30 + (level - 1) * 5; // Her seviye için +5 saniye
    hintCount = 3;

    // Ekranı güncelle
    updateDisplay();

    // İlk soruyu seç
    selectRandomProvince();

    // Zamanlayıcıyı başlat
    startTimer();
  }

  // Zamanlayıcıyı başlat
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function() {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timer);
        endLevel();
      }
    }, 1000);
  }

  // Zamanlayıcıyı güncelle
  function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Son 10 saniye kırmızı yanıp sönsün
    if (timeLeft <= 10) {
      timerDisplay.classList.add('time-warning');
    } else {
      timerDisplay.classList.remove('time-warning');
    }
  }

  // Rastgele il seç
  function selectRandomProvince() {
    if (!provinces.length) return;

    let availableProvinces = provinces.filter(p => !usedProvinces.includes(p.name));

    // Eğer tüm iller kullanıldıysa, listeyi sıfırla
    if (availableProvinces.length === 0) {
      usedProvinces = [];
      availableProvinces = provinces;
    }

    // Rastgele bir il seç
    const randomIndex = Math.floor(Math.random() * availableProvinces.length);
    currentProvince = availableProvinces[randomIndex].name;

    // Kullanılan iller listesine ekle
    usedProvinces.push(currentProvince);

    // Ekranı güncelle
    if (currentProvinceDisplay) {
      currentProvinceDisplay.textContent = currentProvince;
    }
  }

  // Cevabı kontrol et
  function checkAnswer(selectedProvince) {
    if (selectedProvince === currentProvince) {
      // Doğru cevap
      playSound(correctSound);

      // İl elemanını geçici olarak yeşile boyayalım
      const provinceElement = provinces.find(p => p.name === selectedProvince).element;
      const originalFill = provinceElement.style.fill;
      provinceElement.style.fill = '#4CAF50';

      // Puanı artır
      const pointsEarned = 100 * level;
      score += pointsEarned;

      // Doğru sayısını artır
      correctAnswers++;
      totalCorrectAnswers++;

      // Puan animasyonu göster
      showPointsAnimation(pointsEarned);

      // Ekranı güncelle
      updateDisplay();

      // 1 saniye sonra rengi normale döndürüp yeni soruya geç
      setTimeout(function() {
        provinceElement.style.fill = originalFill;

        // Seviye tamamlandı mı kontrol et
        if (correctAnswers >= 5) { // Her seviyede 5 doğru cevap gerekiyor
          endLevel();
        } else {
          selectRandomProvince();
        }
      }, 800);
    } else {
      // Yanlış cevap
      playSound(wrongSound);

      // İl elemanını geçici olarak kırmızıya boyayalım
      const provinceElement = provinces.find(p => p.name === selectedProvince).element;
      const originalFill = provinceElement.style.fill;
      provinceElement.style.fill = '#F44336';

      // Yanlış cevap için puan düşürme
      score = Math.max(0, score - 25);
      updateDisplay();

      // 1 saniye sonra rengi normale döndür
      setTimeout(function() {
        provinceElement.style.fill = originalFill;
      }, 500);
    }
  }

  // Ekranı güncelle
  function updateDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (levelDisplay) levelDisplay.textContent = level;
    if (correctDisplay) correctDisplay.textContent = totalCorrectAnswers;
    if (hintCountDisplay) hintCountDisplay.textContent = hintCount;

    // İpucu butonu aktif/pasif durumunu güncelle
    if (hintBtn) {
      if (hintCount <= 0) {
        hintBtn.classList.add('disabled');
      } else {
        hintBtn.classList.remove('disabled');
      }
    }
  }

  // Seviyeyi bitir
  function endLevel() {
    clearInterval(timer);
    isGameActive = false;

    // Zaman bonusu (kalan her saniye için +10 puan)
    const timeBonus = timeLeft * 10;
    score += timeBonus;

    // Seviye tamamlandı modalını göster
    if (levelCorrectCount) levelCorrectCount.textContent = correctAnswers;
    if (levelPointsDisplay) levelPointsDisplay.textContent = score - timeBonus;
    if (timeBonusDisplay) timeBonusDisplay.textContent = timeBonus;
    if (totalScoreDisplay) totalScoreDisplay.textContent = score;

    if (correctAnswers >= 5) {
      // Seviye tamamlandı
      playSound(levelCompleteSound);
      if (levelCompleteModal) levelCompleteModal.style.display = 'flex';
    } else {
      // Oyun bitti
      playSound(gameOverSound);
      if (finalLevelDisplay) finalLevelDisplay.textContent = level;
      if (finalCorrectDisplay) finalCorrectDisplay.textContent = totalCorrectAnswers;
      if (finalScoreDisplay) finalScoreDisplay.textContent = score;
      if (gameOverModal) gameOverModal.style.display = 'flex';

      // Skoru kaydet
      saveScore();
    }
  }

  // Sonraki seviyeye geç
  function startNextLevel() {
    level++;
    correctAnswers = 0;
    timeLeft = 30 + (level - 1) * 5; // Her seviye için +5 saniye

    // İlave ipucu
    if (level % 2 === 0) {
      hintCount += 1;
    }

    updateDisplay();
    updateTimerDisplay();

    // Yeni soruyu seç
    selectRandomProvince();

    // Zamanlayıcıyı başlat
    isGameActive = true;
    startTimer();
  }

  // Oyunu sıfırla
  function resetGame() {
    clearInterval(timer);
    score = 0;
    level = 1;
    correctAnswers = 0;
    totalCorrectAnswers = 0;
    timeLeft = 30;
    hintCount = 3;
    usedProvinces = [];

    updateDisplay();
    updateTimerDisplay();
  }

  // İpucu ver
  function giveHint() {
    if (hintCount <= 0 || !isGameActive) return;

    hintCount--;
    updateDisplay();

    // Doğru ili vurgula
    const provinceElement = provinces.find(p => p.name === currentProvince).element;
    if (!provinceElement) return;

    const originalFill = provinceElement.style.fill;
    provinceElement.style.fill = '#FFD700'; // Altın rengi

    // 2 saniye sonra vurguyu kaldır
    setTimeout(function() {
      provinceElement.style.fill = originalFill;
    }, 2000);
  }

  // Tooltip göster
  function showTooltip(text, event) {
    if (!provinceTooltip || !tooltipText) return;

    tooltipText.textContent = text;
    provinceTooltip.style.display = 'block';
    updateTooltipPosition(event);
  }

  // Tooltip'i gizle
  function hideTooltip() {
    if (provinceTooltip) {
      provinceTooltip.style.display = 'none';
    }
  }

  // Tooltip pozisyonunu güncelle
  function updateTooltipPosition(event) {
    if (!provinceTooltip || !turkeyMap) return;

    const mapRect = turkeyMap.getBoundingClientRect();
    const x = event.clientX - mapRect.left;
    const y = event.clientY - mapRect.top;

    provinceTooltip.style.left = (x + 10) + 'px';
    provinceTooltip.style.top = (y + 10) + 'px';
  }

  // Puan animasyonu göster
  function showPointsAnimation(points) {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;

    const pointsElement = document.createElement('div');
    pointsElement.className = 'points-animation';
    pointsElement.textContent = '+' + points;

    // Map container içine ekle
    mapContainer.appendChild(pointsElement);

    // Animasyon bittikten sonra elementi kaldır
    setTimeout(() => {
      mapContainer.removeChild(pointsElement);
    }, 1500);
  }

  // Skor kaydetme
  function saveScore() {
    if (score <= 0) return;

    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: 'whereIsIt',
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Skor başarıyla kaydedildi:', data);

        // XP kazanımı mesajı
        if (data.xp_gained) {
          showXpNotification(data.xp_gained, data.is_level_up);
        }
      } else {
        console.log('Skor kaydedilemedi:', data.message);
      }
    })
    .catch(err => {
      console.log('Skor kaydedilirken hata:', err);
    });
  }

  // XP kazanımı bildirimini göster
  function showXpNotification(xp, isLevelUp) {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';

    if (isLevelUp) {
      notification.textContent = `+${xp} XP Kazandınız! Seviye Atladınız!`;
      notification.classList.add('level-up');
    } else {
      notification.textContent = `+${xp} XP Kazandınız!`;
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
});