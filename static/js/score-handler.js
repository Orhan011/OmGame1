
/**
 * Oyun skorlarını işleyen ve API'ye gönderen modül
 * @version 2.0.0
 */

// Ana puan kaydetme fonksiyonu
function saveScore(gameType, score, playtime, difficulty = 'medium', gameStats = {}) {
  // Giriş parametrelerini doğrula
  if (!gameType || score === undefined || score === null) {
    console.error('Geçersiz skor verisi:', { gameType, score, playtime, difficulty });
    return Promise.reject('Geçersiz skor verisi');
  }

  // Puanı sayısal değere çevir
  score = Number(score);
  if (isNaN(score)) {
    console.warn('Geçersiz puan formatı, varsayılan 50 kullanılıyor');
    score = 50;
  }

  // Puanı 0-100 arasında sınırla
  score = Math.max(0, Math.min(100, score));

  // Zorluk seviyesini standardize et
  difficulty = validateDifficulty(difficulty);

  // Oyun istatistiklerini temizle ve düzenle
  const cleanedStats = cleanGameStats(gameStats);

  // Gönderilecek veriyi hazırla
  const scoreData = {
    game_type: gameType,
    score: score,
    playtime: playtime || 60,
    difficulty: difficulty,
    game_stats: cleanedStats,
    timestamp: new Date().toISOString(),
    client_version: '2.0.0'
  };

  console.log(`Puanlar kaydediliyor: ${gameType}: ${score} puan, zorluk: ${difficulty}`);

  // API'ye POST isteği
  return fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoreData),
    credentials: 'include' // Çerezlerin gönderilmesi için gerekli
  })
  .then(response => {
    if (!response.ok) {
      console.error(`Skor kaydetme hatası ${response.status}: ${response.statusText}`);
      throw new Error(`Sunucu yanıtı: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Puan başarıyla kaydedildi:', data);
    
    // Liderlik tablosunu ve profil puanlarını API yanıtı ile güncelle
    updateDisplays(data);
    
    return data;
  })
  .catch(error => {
    console.error('Skor kaydetme başarısız:', error);
    throw error;
  });
}

/**
 * Kullanıcı ara yüzlerini günceller (liderlik tablosu, profil)
 * @param {Object} responseData - API yanıtı (isteğe bağlı)
 */
function updateDisplays(responseData = null) {
  try {
    // Kullanıcı verileri varsa bunları güncelle
    if (responseData && responseData.xp) {
      updateUserDataDisplay(responseData);
    }
    
    // Profil puanlarını güncelle (LeaderboardManager veya global fonksiyon ile)
    if (typeof window.LeaderboardManager !== 'undefined' && typeof window.LeaderboardManager.updateProfileScores === 'function') {
      console.log('Profil puanları güncelleniyor... (LeaderboardManager ile)');
      window.LeaderboardManager.updateProfileScores();
    } else if (typeof updateProfileScores === 'function') {
      console.log('Profil puanları güncelleniyor... (global fonksiyon ile)');
      updateProfileScores();
    }
    
    // Liderlik tablosunu güncelle (LeaderboardManager veya global fonksiyon ile)
    if (typeof window.LeaderboardManager !== 'undefined' && typeof window.LeaderboardManager.loadLeaderboard === 'function') {
      console.log('Liderlik tablosu güncelleniyor... (LeaderboardManager ile)');
      window.LeaderboardManager.loadLeaderboard();
    } else if (typeof loadLeaderboard === 'function') {
      console.log('Liderlik tablosu güncelleniyor... (global fonksiyon ile)');
      loadLeaderboard();
    }
    
    // Oyun içi gösterge tablosunu güncelle (mevcutsa)
    if (typeof updateGameDashboard === 'function') {
      console.log('Oyun içi gösterge tablosu güncelleniyor...');
      updateGameDashboard();
    }
  } catch (error) {
    console.error('Görünüm güncellemeleri sırasında hata:', error);
  }
}

/**
 * Arayüzdeki kullanıcı verilerini günceller
 * @param {Object} data - API yanıtı
 */
function updateUserDataDisplay(data) {
  console.log('Kullanıcı verileri güncelleniyor:', data);
  
  try {
    // XP seviyesi ve ilerleme çubuğu
    const xpElements = document.querySelectorAll('.user-xp, .user-level, .xp-text');
    const xpBars = document.querySelectorAll('.xp-progress, .xp-bar');
    
    if (data.xp) {
      // XP metni güncelleme
      xpElements.forEach(el => {
        if (el.classList.contains('user-level')) {
          el.textContent = data.xp.level || 1;
        } else if (el.classList.contains('xp-text')) {
          el.textContent = `${data.xp.progress || 0}/${data.xp.needed || 100} XP`;
        } else {
          el.textContent = data.xp.total || 0;
        }
      });
      
      // XP barı güncelleme
      xpBars.forEach(bar => {
        const percent = data.xp.progress_percent || 0;
        bar.style.width = `${percent}%`;
        
        // Özel veri özniteliği varsa güncelle
        if (bar.dataset.percent !== undefined) {
          bar.dataset.percent = percent;
        }
      });
      
      // Seviye atlama durumunda özel gösterim
      if (data.xp.level_up) {
        showLevelUpNotification(data.xp.level, data.xp.old_level);
      }
    }
    
    // Toplam skor güncelleme
    if (data.points && data.points.total) {
      const scoreElements = document.querySelectorAll('.user-score, .total-points');
      scoreElements.forEach(el => {
        el.textContent = data.points.total;
      });
    }
    
    console.log('Kullanıcı verileri başarıyla güncellendi');
  } catch (error) {
    console.error('Kullanıcı verileri güncellenirken hata:', error);
  }
}

/**
 * Seviye atlama bildirimi gösterir
 * @param {number} newLevel - Yeni seviye
 * @param {number} oldLevel - Eski seviye
 */
function showLevelUpNotification(newLevel, oldLevel) {
  // Ses efekti çal
  try {
    const levelUpSound = new Audio('/static/sounds/level-up.mp3');
    levelUpSound.play();
  } catch (e) {
    console.warn('Ses efekti oynatılamadı:', e);
  }
  
  // Bildirim oluştur
  const notification = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.innerHTML = `
    <div class="level-up-content">
      <h3>Seviye Atladın!</h3>
      <div class="level-badges">
        <span class="old-level">${oldLevel}</span>
        <span class="level-arrow">→</span>
        <span class="new-level">${newLevel}</span>
      </div>
      <p>Tebrikler! Daha fazla beceri ve ödek açtın.</p>
    </div>
  `;
  
  // DOM'a ekle
  document.body.appendChild(notification);
  
  // Animasyon için küçük bir gecikme
  setTimeout(() => {
    notification.classList.add('show');
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }, 100);
}

/**
 * Oyun istatistiklerini temizler ve düzenler
 * @param {Object} gameStats - Temizlenecek oyun istatistikleri
 * @returns {Object} Temizlenmiş ve düzenlenmiş istatistikler
 */
function cleanGameStats(gameStats) {
  if (!gameStats || typeof gameStats !== 'object') {
    return {};
  }
  
  // Temizlenmiş objeyi oluştur
  const cleaned = {};
  
  // İstatistikleri kopyala ve temizle
  for (const [key, value] of Object.entries(gameStats)) {
    // Fonksiyonları, null değerleri ve undefined'ları kaldır
    if (value !== null && value !== undefined && typeof value !== 'function') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // İç içe objeleri de temizle
        cleaned[key] = cleanGameStats(value);
      } else {
        // Diğer değerleri doğrudan kopyala
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Zorluk seviyesini doğrulama
 * @param {string} difficulty - Doğrulanacak zorluk seviyesi
 * @returns {string} Geçerli zorluk seviyesi
 */
function validateDifficulty(difficulty) {
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  
  if (!validDifficulties.includes(difficulty)) {
    console.warn(`Geçersiz zorluk: ${difficulty}, "medium" kullanılıyor`);
    return 'medium';
  }
  
  return difficulty;
}

/**
 * Puan değerini doğrulama
 * @param {number|string} score - Doğrulanacak puan
 * @returns {number} Geçerli puan değeri (0-100 arası)
 */
function validateScore(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    score = parseInt(score) || 50;
    console.warn(`Geçersiz puan değeri, dönüştürüldü: ${score}`);
  }
  
  // Puanı 0-100 arasında sınırla
  return Math.max(0, Math.min(100, score));
}

/**
 * ScoreCalculator ile oyun verilerinden standartlaştırılmış puan hesaplar
 * @param {Object} gameData - Oyun verileri
 * @returns {Object} Hesaplanan puan ve detayları
 */
function calculateStandardizedScore(gameData) {
  try {
    // ScoreCalculator modülü var mı kontrol et
    if (typeof window.ScoreCalculator === 'undefined' || !window.ScoreCalculator) {
      console.error('ScoreCalculator modülü bulunamadı!');
      throw new Error('ScoreCalculator modülü bulunamadı');
    }
    
    console.log('Standartlaştırılmış puan hesaplanıyor:', gameData);
    
    // ScoreCalculator ile puanı hesapla
    const scoreDetails = window.ScoreCalculator.calculate(gameData);
    
    if (!scoreDetails || typeof scoreDetails.finalScore !== 'number') {
      throw new Error('Geçersiz puan hesaplaması');
    }
    
    console.log(`Standartlaştırılmış ${gameData.gameType} puanı hesaplandı:`, scoreDetails);
    
    return scoreDetails;
  } catch (error) {
    console.error('Puan hesaplama hatası:', error);
    
    // Acil durum değeri döndür
    return {
      finalScore: 50,
      breakdown: {
        baseScore: 50,
        error: true,
        errorMessage: error.message
      }
    };
  }
}

/**
 * Oyun verilerinden puan hesaplar ve API'ye kaydeder
 * @param {Object} gameData - Oyun verileri
 * @returns {Promise} Kaydetme işleminin sonucu
 */
function calculateAndSaveScore(gameData) {
  try {
    if (!gameData || !gameData.gameType) {
      console.error('Geçersiz oyun verisi:', gameData);
      return Promise.reject('Geçersiz oyun verisi');
    }
    
    // Puanı hesapla
    const scoreDetails = calculateStandardizedScore(gameData);
    
    // Zorluk seviyesini doğrula
    const difficulty = validateDifficulty(gameData.difficulty || 'medium');
    
    // Oynama süresini belirle
    const playtime = gameData.timeSpent || gameData.playtime || 60;
    
    console.log(`Saving score for ${gameData.gameType}: ${scoreDetails.finalScore} points, difficulty: ${difficulty}`);
    
    // Puanı kaydet
    return saveScore(
      gameData.gameType,
      scoreDetails.finalScore,
      playtime,
      difficulty,
      {
        ...gameData,
        calculatedScore: true,
        scoreBreakdown: scoreDetails.breakdown
      }
    );
  } catch (error) {
    console.error('Puan hesaplama ve kaydetme hatası:', error);
    return Promise.reject(error);
  }
}

/**
 * API bağlantısını test eder
 * @returns {Promise} Test sonucu
 */
function testScoreAPI() {
  const testData = {
    game_type: 'test',
    score: 75,
    playtime: 60,
    difficulty: 'medium',
    game_stats: { test: true, version: '2.0.0' }
  };

  return fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData),
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    console.log('API test sonucu:', data);
    return data;
  })
  .catch(error => {
    console.error('API testi başarısız:', error);
    throw error;
  });
}

// Dışa aktarılan fonksiyonlar
window.saveScore = saveScore;
window.validateDifficulty = validateDifficulty;
window.validateScore = validateScore;
window.testScoreAPI = testScoreAPI;
window.calculateStandardizedScore = calculateStandardizedScore;
window.calculateAndSaveScore = calculateAndSaveScore;

// ScoreHandler nesnesi - tüm operasyonlar için daha modern bir API
window.ScoreHandler = {
  saveScore,
  updateDisplays,
  validateDifficulty,
  validateScore,
  testScoreAPI,
  calculateStandardizedScore,
  calculateAndSaveScore,
  updateProfileScores: function() {
    if (typeof window.LeaderboardManager !== 'undefined' && typeof window.LeaderboardManager.updateProfileScores === 'function') {
      window.LeaderboardManager.updateProfileScores();
    } else if (typeof updateProfileScores === 'function') {
      updateProfileScores();
    }
  }
};
