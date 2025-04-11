/**
 * Oyun puanı hesaplama yardımcı sınıfı
 * Tüm oyunlar için standart puan hesaplama metotları içerir
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
   * Standart puan hesaplama (oyunlar için)
   * @param {Object} gameData - Oyun verileri
   * @returns {Object} - Hesaplanmış puan detayları
   */
  calculate: function(gameData) {
    try {
      const { gameType, difficulty, score, timeSpent, moves, level, hintsUsed } = gameData;

      // Varsayılan değerler
      const difficultyMultiplier = this.getDifficultyMultiplier(difficulty || 'medium');
      const baseScore = 30;
      let finalScore = 0;

      // Zorluk seviyesi çarpanları
      const breakdown = {
        baseScore: baseScore,
        levelBonus: level ? Math.min(level * 2, 20) : 0,
        timeBonus: 0,
        moveBonus: 0,
        hintPenalty: hintsUsed ? Math.min(hintsUsed * 5, 30) : 0,
        difficultyMultiplier: difficultyMultiplier
      };

      // Zaman bonusu (hızlı çözüm = daha çok puan)
      if (timeSpent && timeSpent > 0) {
        // Zaman tipine göre hesapla (saniye veya milisaniye)
        const seconds = timeSpent > 1000 ? timeSpent / 1000 : timeSpent;

        if (seconds < 30) {
          breakdown.timeBonus = 40; // Çok hızlı
        } else if (seconds < 60) {
          breakdown.timeBonus = 30; // Hızlı
        } else if (seconds < 120) {
          breakdown.timeBonus = 20; // Normal
        } else if (seconds < 300) {
          breakdown.timeBonus = 10; // Yavaş
        } else {
          breakdown.timeBonus = 5; // Çok yavaş
        }
      }

      // Hamle bonusu (daha az hamle = daha çok puan)
      if (moves && moves > 0) {
        if (moves < 10) {
          breakdown.moveBonus = 20; // Çok az hamle
        } else if (moves < 20) {
          breakdown.moveBonus = 15; // Az hamle
        } else if (moves < 50) {
          breakdown.moveBonus = 10; // Normal
        } else {
          breakdown.moveBonus = 5; // Çok hamle
        }
      }

      // Toplam puanı hesapla
      let rawTotal = breakdown.baseScore + breakdown.levelBonus + 
                    breakdown.timeBonus + breakdown.moveBonus - 
                    breakdown.hintPenalty;

      // Zorluk çarpanı uygula
      rawTotal = Math.round(rawTotal * breakdown.difficultyMultiplier);

      // 10-100 arasına sınırla
      finalScore = Math.max(10, Math.min(100, rawTotal));

      // Sonuç objesi
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
    switch(difficulty) {
      case "easy": return 0.8;
      case "medium": return 1.0;
      case "hard": return 1.5;
      case "expert": return 2.0;
      default: return 1.0;
    }
  }
};