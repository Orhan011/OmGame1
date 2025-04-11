
/**
 * Standart Puan Hesaplama Modülü
 * Tüm oyunlar için standartlaştırılmış puan hesaplama sistemi
 */
window.ScoreCalculator = {
  /**
   * Oyun puanlarını 10-100 arasında normalleştir
   * @param {number} rawScore - Ham puan
   * @param {number} minScore - Minimum olası puan
   * @param {number} maxScore - Maksimum olası puan
   * @param {number} scaleMin - Ölçeklendirilmiş min değer (varsayılan: 10)
   * @param {number} scaleMax - Ölçeklendirilmiş max değer (varsayılan: 100)
   * @returns {number} - 10-100 arasında ölçeklendirilmiş puan
   */
  normalize: function(rawScore, minScore, maxScore, scaleMin = 10, scaleMax = 100) {
    // Sıfıra bölme hatası kontrolü
    if (maxScore === minScore) return scaleMin;

    // Negatif puan kontrolü
    if (rawScore < minScore) rawScore = minScore;
    if (rawScore > maxScore) rawScore = maxScore;

    // Doğrusal ölçekleme formülü
    const normalized = ((rawScore - minScore) / (maxScore - minScore)) * (scaleMax - scaleMin) + scaleMin;

    // Tam sayıya yuvarla
    return Math.round(normalized);
  },

  /**
   * Standart puan hesaplama (tüm oyunlar için ortak)
   * @param {Object} gameData - Oyun verileri
   * @returns {Object} - Hesaplanmış puan detayları
   */
  calculate: function(gameData) {
    try {
      const { 
        gameType,         // Oyun tipi (örn. 'puzzle', 'wordle', 'tetris', vb.)
        difficulty = 'medium', // Zorluk seviyesi (easy, medium, hard, expert)
        score = 0,        // Oyun içi ham skor (varsa)
        timeSpent = 0,    // Oyun süresi (saniye)
        moves = 0,        // Oyundaki hamle sayısı
        level = 1,        // Oyundaki seviye (varsa)
        hintsUsed = 0,    // Kullanılan ipucu sayısı (varsa)
        maxPossibleScore = 100 // Oyunun maksimum olası puanı (varsayılan: 100)
      } = gameData;

      // Zorluk seviyesi çarpanı
      const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
      
      // Temel puan bileşenleri
      const baseScore = 30; // Her oyun için sabit temel puan
      
      // Bonus ve ceza hesaplamaları
      const levelBonus = level ? Math.min(level * 2, 20) : 0;
      const hintPenalty = hintsUsed ? Math.min(hintsUsed * 5, 30) : 0;
      
      // Zaman bonusu (daha hızlı çözüm = daha yüksek puan)
      let timeBonus = 0;
      if (timeSpent > 0) {
        // Zaman tipine göre hesapla (saniye veya milisaniye)
        const seconds = timeSpent > 1000 ? timeSpent / 1000 : timeSpent;
        
        if (seconds < 30) {
          timeBonus = 40; // Çok hızlı
        } else if (seconds < 60) {
          timeBonus = 30; // Hızlı
        } else if (seconds < 120) {
          timeBonus = 20; // Normal
        } else if (seconds < 300) {
          timeBonus = 10; // Yavaş
        } else {
          timeBonus = 5;  // Çok yavaş
        }
      }
      
      // Hamle bonusu (daha az hamle = daha yüksek puan)
      let moveBonus = 0;
      if (moves > 0) {
        if (moves < 10) {
          moveBonus = 20; // Çok az hamle
        } else if (moves < 20) {
          moveBonus = 15; // Az hamle
        } else if (moves < 50) {
          moveBonus = 10; // Normal hamle sayısı
        } else {
          moveBonus = 5;  // Çok hamle
        }
      }
      
      // Toplam ham puanı hesapla
      let rawTotal = baseScore + levelBonus + timeBonus + moveBonus - hintPenalty;
      
      // Zorluk çarpanını uygula
      rawTotal = Math.round(rawTotal * difficultyMultiplier);
      
      // 10-100 arasına sınırla (tüm oyunlar için standart aralık)
      const finalScore = Math.max(10, Math.min(100, rawTotal));
      
      // Puan detaylarını oluştur
      const breakdown = {
        baseScore: baseScore,
        levelBonus: levelBonus,
        timeBonus: timeBonus,
        moveBonus: moveBonus,
        hintPenalty: hintPenalty,
        difficultyMultiplier: difficultyMultiplier,
        difficulty: difficulty,
        rawTotal: rawTotal,
        normalizedScore: finalScore
      };
      
      console.log(`Standartlaştırılmış ${gameType} puanı:`, {finalScore, breakdown});
      
      return {
        finalScore: finalScore,
        breakdown: breakdown
      };
    } catch (e) {
      console.error("ScoreCalculator hatası:", e);
      // Hata durumunda varsayılan puan döndür
      return {
        finalScore: 50,
        breakdown: {
          baseScore: 30,
          difficultyMultiplier: 1.0,
          difficulty: 'medium',
          error: true
        }
      };
    }
  },

  /**
   * Zorluk seviyesine göre puan çarpanı döndürür
   * @param {string} difficulty - Zorluk seviyesi
   * @return {number} - Puan çarpanı
   */
  getDifficultyMultiplier: function(difficulty) {
    const multipliers = {
      "easy": 0.8,    // %20 daha az puan
      "medium": 1.0,  // Normal puan
      "hard": 1.5,    // %50 bonus
      "expert": 2.0   // %100 bonus
    };
    
    return multipliers[difficulty] || 1.0;
  }
};
