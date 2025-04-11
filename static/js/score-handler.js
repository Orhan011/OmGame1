
/**
 * Oyun skorlarını API'ye gönderen ve işleyen modül
 */

// Puan kaydetme fonksiyonu - Ana fonksiyon
function saveScore(gameType, score, playtime, difficulty = 'medium', gameStats = {}) {
  // Oyun verilerini doğrula
  if (!gameType || score === undefined || score === null) {
    console.error('Geçersiz skor verisi:', { gameType, score, playtime, difficulty });
    return Promise.reject('Geçersiz skor verisi');
  }

  // Puanı sayısal değere çevir ve sınırlandır (10-100 arası)
  score = Number(score);
  if (isNaN(score)) {
    score = 50; // Varsayılan değer
    console.warn('Geçersiz puan formatı, varsayılan 50 kullanılıyor');
  }
  score = Math.max(10, Math.min(100, score));

  // Zorluk seviyesini standardize et
  if (!difficulty || !['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
    difficulty = 'medium';
    console.warn('Geçersiz zorluk seviyesi, varsayılan "medium" kullanılıyor');
  }

  // Gönderilecek veriyi hazırla
  const scoreData = {
    game_type: gameType,
    score: score,
    playtime: playtime || 60,
    difficulty: difficulty,
    game_stats: gameStats
  };

  console.log(`Puanlar kaydediliyor: ${gameType}: ${score} puan, zorluk: ${difficulty}`);

  // API'ye POST isteği
  return fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoreData)
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
    try {
      if (typeof updateProfileScores === 'function') {
        console.log('Profil puanları güncelleniyor...');
        updateProfileScores();
      }
      
      if (typeof loadLeaderboard === 'function') {
        console.log('Liderlik tablosu güncelleniyor...');
        loadLeaderboard();
      }
    } catch (error) {
      console.error('Güncellemeler sırasında hata:', error);
    }
    
    return data;
  })
  .catch(error => {
    console.error('Skor kaydetme başarısız:', error);
    throw error;
  });
}

// Zorluk seviyesi doğrulayıcı
function validateDifficulty(difficulty) {
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  if (!validDifficulties.includes(difficulty)) {
    console.warn(`Geçersiz zorluk: ${difficulty}, "medium" kullanılıyor`);
    return 'medium';
  }
  return difficulty;
}

// Puan doğrulayıcı
function validateScore(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    score = parseInt(score) || 50;
    console.warn(`Geçersiz puan değeri, dönüştürüldü: ${score}`);
  }
  
  // Puanı 10-100 arasında sınırla
  return Math.max(10, Math.min(100, score));
}

// Test fonksiyonu - API bağlantısını test eder
function testScoreAPI() {
  const testData = {
    game_type: 'test',
    score: 75,
    playtime: 60,
    difficulty: 'medium',
    game_stats: { test: true }
  };

  return fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
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
