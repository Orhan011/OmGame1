
/**
 * Skor hesaplama ve kaydetme için yardımcı fonksiyonlar
 * Bu modül, oyun skorlarını hesaplama ve API'ye gönderme işlevselliği sağlar
 */

// Bu modül, oyun skorlarını hesaplamak ve kaydetmek için kullanılır
const ScoreCalculator = {
  // Farklı zorluk seviyelerine göre çarpanlar
  difficultyMultipliers: {
    easy: 1.0,
    medium: 1.5,
    hard: 2.5,
    expert: 4.0
  },

  // Farklı oyun tiplerine göre baz puanlar
  basePoints: {
    memoryCards: 70,
    wordPuzzle: 60,
    numberSequence: 80,
    tetris: 40,
    wordle: 100,
    puzzleSlider: 60,
    chess: 120,
    simonSays: 50,
    typingSpeed: 40,
    snakeGame: 30,
    audioMemory: 65,
    nBack: 85,
    game2048: 45,
    labyrinth: 80,
    puzzle: 60,
    colorMatch: 55,
    mathChallenge: 70,
    iqTest: 90,
    numberChain: 75,
    minesweeper: 90,
    memoryMatch: 60
  },

  // Zorluk seviyesine göre çarpanı hesapla
  getDifficultyMultiplier: function(difficulty) {
    return this.difficultyMultipliers[difficulty] || 1.0;
  },

  // Oyun tipine göre baz puanı hesapla
  getBasePoints: function(gameType) {
    // Eğer oyun tipi tanımlı değilse, varsayılan 50 puan döndür
    return this.basePoints[gameType] || 50;
  },

  // Skor hesaplama
  calculateScore: function(score, gameType, difficulty, playTime, gameStats) {
    // Oyun istatistikleri verilmemişse, boş bir nesne oluştur
    gameStats = gameStats || {};
    
    // Oyun tipi için baz puanı al
    const basePoints = this.getBasePoints(gameType);
    
    // Zorluk çarpanını al
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    
    // Oyun skoruna dayalı puan (bu genellikle oyunun kendi puanlama sistemidir)
    // Oyun tipine göre özel bir çarpan kullanabiliriz, burada basit bir formül kullanıyoruz
    const scorePoints = score * 0.5;
    
    // Oyun süresine dayalı puan (dakika cinsinden)
    const playTimeMinutes = playTime / 60;
    const timePoints = Math.min(20, playTimeMinutes * 2);
    
    // Toplam puanı hesapla
    let totalPoints = (basePoints * difficultyMultiplier) + scorePoints + timePoints;
    
    // Eğer oyun istatistikleri varsa, daha sofistike bir hesaplama yap
    if (Object.keys(gameStats).length > 0) {
      // Burada gameStats nesnesindeki verilere göre puanı ayarlayabiliriz
      // Örneğin: ipucu kullanımı, hata sayısı, tamamlama süresi vs.
      
      // İpucu kullanımına göre ceza puanı
      const hintPenalty = gameStats.hintCount ? Math.min(30, gameStats.hintCount * 5) : 0;
      
      // Doğruluk oranına göre bonus
      const accuracyBonus = gameStats.accuracy ? (gameStats.accuracy / 100) * 20 : 0;
      
      // Hamle sayısına göre verimlilik bonusu
      // Optimal hamle sayısı oyun tipine göre değişebilir
      const moveEfficiencyBonus = gameStats.moveCount && gameStats.optimalMoves ? 
        Math.max(0, 15 * (1 - (gameStats.moveCount / gameStats.optimalMoves))) : 0;
        
      // Puanı ayarla
      totalPoints += accuracyBonus + moveEfficiencyBonus - hintPenalty;
    }
    
    // Minumum 10, maksimum 1000 puan sınırlaması
    return Math.max(10, Math.min(1000, Math.round(totalPoints)));
  },
  
  // Skor kaydetme
  saveScore: function(score, gameType, difficulty, playTime, gameStats) {
    // Eğer skor veya oyun tipi belirtilmemişse, hata fırlat
    if (score === undefined || !gameType) {
      console.error("Skor veya oyun tipi belirtilmedi!");
      return Promise.reject("Skor veya oyun tipi belirtilmedi!");
    }
    
    // Varsayılan değerler
    difficulty = difficulty || "medium";
    playTime = playTime || 60; // Varsayılan 60 saniye
    gameStats = gameStats || {};
    
    // API'ye gönderilecek veriyi hazırla
    const data = {
      game_type: gameType,
      score: score,
      difficulty: difficulty,
      playtime: playTime,
      game_stats: gameStats
    };
    
    // API'ye POST isteği gönder
    return fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Skor kaydedilemedi: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Skor başarıyla kaydedildi:', data);
      return data;
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
      throw error;
    });
  }
};

/**
 * Oyun skorunu hesaplayıp kaydeder ve sonuç modalını gösterir
 * @param {number} score - Oyun skoru
 * @param {string} gameType - Oyun tipi (wordPuzzle, memoryMatch, vb.)
 * @param {string} difficulty - Zorluk seviyesi (easy, medium, hard, expert)
 * @param {number} playTime - Oyun süresi (saniye)
 * @param {object} gameStats - Oyun istatistikleri (opsiyonel)
 */
function saveScoreAndDisplay(score, gameType, difficulty, playTime, gameStats) {
  // Skoru kaydet
  ScoreCalculator.saveScore(score, gameType, difficulty, playTime, gameStats)
    .then(data => {
      // Başarılı kayıt durumunda
      if (data.success) {
        // Oyun sonuç modalını göster
        showGameResultModal({
          score: score, 
          adjustedScore: data.points.total, 
          xpGain: data.xp.gain,
          difficultyName: getDifficultyName(difficulty),
          isGuest: data.guest === true,
          rewards: data.points.rewards,
          levelUp: data.xp.level_up === true,
          newLevel: data.xp.level,
          oldLevel: data.xp.old_level
        });
      } else if (data.guest === true) {
        // Misafir kullanıcı durumunda
        showGameResultModal({
          score: score, 
          adjustedScore: data.points.total, 
          xpGain: data.xp.gain,
          difficultyName: getDifficultyName(difficulty),
          isGuest: true,
          rewards: data.points.rewards
        });
      } else {
        // Başarısız kayıt durumunda
        showSimpleResultModal({
          title: "Hata!",
          message: data.message || "Skor kaydedilirken bir hata oluştu.",
          type: "error"
        });
      }
    })
    .catch(error => {
      // Hata durumunda
      console.error('Skor kaydetme hatası:', error);
      showSimpleResultModal({
        title: "Hata!",
        message: "Skor kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        type: "error"
      });
    });
}

// Zorluk seviyesini Türkçe olarak döndür
function getDifficultyName(difficulty) {
  const difficultyNames = {
    'easy': 'Kolay',
    'medium': 'Orta',
    'hard': 'Zor',
    'expert': 'Uzman'
  };
  
  return difficultyNames[difficulty] || 'Orta';
}

/**
 * Basit bir sonuç modalı gösterir
 * @param {object} options - Modal seçenekleri
 */
function showSimpleResultModal(options) {
  // Varsayılan değerler
  const defaults = {
    title: "Oyun Bitti",
    message: "Tebrikler! Oyunu tamamladınız.",
    type: "success", // success, error, warning, info
    showHome: true,
    showReplay: true
  };
  
  // Seçenekleri birleştir
  const settings = Object.assign({}, defaults, options);
  
  // Modal HTML'i
  let modalHTML = `
    <div class="modal-content">
      <div class="modal-header ${settings.type}">
        <h2>${settings.title}</h2>
        <button type="button" class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p>${settings.message}</p>
      </div>
      <div class="modal-footer">
  `;
  
  // Yeniden oyna butonu
  if (settings.showReplay) {
    modalHTML += `<button type="button" class="btn btn-secondary modal-replay">Yeniden Oyna</button>`;
  }
  
  // Ana sayfa butonu
  if (settings.showHome) {
    modalHTML += `<button type="button" class="btn btn-primary modal-home">Ana Sayfa</button>`;
  }
  
  modalHTML += `
      </div>
    </div>
  `;
  
  // Modal konteynerini oluştur
  const modalContainer = document.createElement('div');
  modalContainer.className = 'game-result-modal';
  modalContainer.innerHTML = modalHTML;
  
  // Modalı sayfaya ekle
  document.body.appendChild(modalContainer);
  
  // Modal kapanış butonu
  const closeButton = modalContainer.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      document.body.removeChild(modalContainer);
    });
  }
  
  // Yeniden oyna butonu
  const replayButton = modalContainer.querySelector('.modal-replay');
  if (replayButton) {
    replayButton.addEventListener('click', function() {
      document.body.removeChild(modalContainer);
      window.location.reload();
    });
  }
  
  // Ana sayfa butonu
  const homeButton = modalContainer.querySelector('.modal-home');
  if (homeButton) {
    homeButton.addEventListener('click', function() {
      window.location.href = '/';
    });
  }
  
  // Modalı aç
  setTimeout(function() {
    modalContainer.classList.add('show');
  }, 100);
}

/**
 * Oyun sonuç modalını gösterir
 * @param {object} options - Modal seçenekleri
 */
function showGameResultModal(options) {
  // Varsayılan değerler
  const defaults = {
    score: 0,
    adjustedScore: 0,
    xpGain: 0,
    difficultyName: 'Orta',
    isGuest: false,
    rewards: {},
    levelUp: false,
    newLevel: 1,
    oldLevel: 1
  };
  
  // Seçenekleri birleştir
  const settings = Object.assign({}, defaults, options);
  
  // Seviye atladı mı?
  const levelUpClass = settings.levelUp ? 'level-up' : '';
  
  // Modal HTML'i
  let modalHTML = `
    <div class="modal-content game-result">
      <div class="modal-header">
        <h2>Oyun Tamamlandı!</h2>
        <button type="button" class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="result-section score-section">
          <div class="result-item">
            <div class="result-label">Ham Skor</div>
            <div class="result-value">${settings.score}</div>
          </div>
          <div class="result-item highlight">
            <div class="result-label">Toplam Puan</div>
            <div class="result-value">${settings.adjustedScore}</div>
          </div>
          <div class="result-details">
            <p class="difficulty">Zorluk: <span>${settings.difficultyName}</span></p>
            <p class="multiplier">Zorluk Çarpanı: <span>x${settings.rewards.difficulty_multiplier?.toFixed(1) || '1.0'}</span></p>
          </div>
        </div>
  `;
  
  // Misafir kullanıcı için uyarı
  if (settings.isGuest) {
    modalHTML += `
      <div class="guest-warning">
        <p><i class="fas fa-exclamation-triangle"></i> Giriş yapmadığınız için skorunuz kaydedilmedi!</p>
        <div class="guest-actions">
          <a href="/login" class="btn btn-outline">Giriş Yap</a>
          <a href="/register" class="btn btn-primary">Kayıt Ol</a>
        </div>
      </div>
    `;
  } else {
    // Kullanıcı için XP göster
    modalHTML += `
      <div class="result-section xp-section ${levelUpClass}">
        <div class="result-item">
          <div class="result-label">Kazanılan XP</div>
          <div class="result-value xp-gain">${settings.xpGain}</div>
        </div>
    `;
    
    // Seviye atladı mı?
    if (settings.levelUp) {
      modalHTML += `
        <div class="level-up-notification">
          <i class="fas fa-arrow-up"></i>
          <div class="level-up-text">
            <h3>Seviye Atladınız!</h3>
            <p>Seviye ${settings.oldLevel} → Seviye ${settings.newLevel}</p>
          </div>
        </div>
      `;
    }
    
    modalHTML += `
      </div>
    `;
  }
  
  // Modal altı butonları
  modalHTML += `
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-replay">Yeniden Oyna</button>
        <button type="button" class="btn btn-primary modal-home">Ana Sayfa</button>
      </div>
    </div>
  `;
  
  // Modal konteynerini oluştur
  const modalContainer = document.createElement('div');
  modalContainer.className = 'game-result-modal';
  modalContainer.innerHTML = modalHTML;
  
  // Modalı sayfaya ekle
  document.body.appendChild(modalContainer);
  
  // Modal kapanış butonu
  const closeButton = modalContainer.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      document.body.removeChild(modalContainer);
    });
  }
  
  // Yeniden oyna butonu
  const replayButton = modalContainer.querySelector('.modal-replay');
  if (replayButton) {
    replayButton.addEventListener('click', function() {
      document.body.removeChild(modalContainer);
      window.location.reload();
    });
  }
  
  // Ana sayfa butonu
  const homeButton = modalContainer.querySelector('.modal-home');
  if (homeButton) {
    homeButton.addEventListener('click', function() {
      window.location.href = '/';
    });
  }
  
  // Seviye atlama durumunda ses çal
  if (settings.levelUp) {
    try {
      const levelUpSound = new Audio('/static/sounds/level-up.mp3');
      levelUpSound.play();
    } catch (e) {
      console.error('Ses çalınamadı:', e);
    }
  }
  
  // Modalı aç
  setTimeout(function() {
    modalContainer.classList.add('show');
  }, 100);
}

// Module'u global scope'a ekle
window.ScoreCalculator = ScoreCalculator;
window.saveScoreAndDisplay = saveScoreAndDisplay;
