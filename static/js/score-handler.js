
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
    
    // Liderlik tablosunu ve profil puanlarını güncelle
    updateDisplays();
    
    return data;
  })
  .catch(error => {
    console.error('Skor kaydetme başarısız:', error);
    throw error;
  });
}

/**
 * Kullanıcı ara yüzlerini günceller (liderlik tablosu, profil)
 */
function updateDisplays() {
  try {
    // Profil puanlarını güncelle (mevcutsa)
    if (typeof updateProfileScores === 'function') {
      console.log('Profil puanları güncelleniyor...');
      updateProfileScores();
    }
    
    // Liderlik tablosunu güncelle (mevcutsa)
    if (typeof loadLeaderboard === 'function') {
      console.log('Liderlik tablosu güncelleniyor...');
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
