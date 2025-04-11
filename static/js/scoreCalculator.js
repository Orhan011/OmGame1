
/**
 * Standardize Score Calculator Module
 * 
 * Bu modül, tüm oyunlar için 10-100 arası standart puan hesaplaması yapar.
 * Oyun süresi, doğru/yanlış hamle sayısı, ipucu kullanımı gibi faktörlere dayalı
 * tutarlı bir puanlama sistemi sağlar.
 */

// ScoreCalculator nesnesini oluşturmadan önce varlığını kontrol et
if (!window.ScoreCalculator) {
  window.ScoreCalculator = {
    /**
     * Tüm oyunlar için standart puan hesaplama fonksiyonu
     * 
     * @param {Object} params - Hesaplama parametreleri
     * @param {string} params.gameType - Oyun türü
     * @param {string} params.difficulty - Zorluk seviyesi ('easy', 'medium', 'hard')
     * @param {number} params.timeSpent - Oyunda geçirilen süre (saniye)
     * @param {number} params.optimalTime - Optimal tamamlama süresi (saniye)
     * @param {number} params.totalMoves - Toplam hamle sayısı
     * @param {number} params.correctMoves - Doğru hamle sayısı (default: totalMoves)
     * @param {number} params.hintsUsed - Kullanılan ipucu sayısı
     * @param {number} params.level - Oyun seviyesi (default: 1)
     * @param {number} params.maxLevel - Maximum seviye (default: 1)
     * @param {Object} params.gameSpecificStats - Oyuna özel istatistikler
     * @returns {Object} - Hesaplanan puan detayları
     */
    calculate: function(params) {
      // Varsayılan parametreleri ayarla
      const gameType = params.gameType || 'unknown';
      const difficulty = params.difficulty || 'medium';
      const timeSpent = Math.max(1, params.timeSpent || 0);
      const optimalTime = Math.max(1, params.optimalTime || 60);
      const totalMoves = Math.max(1, params.totalMoves || 0);
      const correctMoves = params.correctMoves !== undefined ? params.correctMoves : totalMoves;
      const hintsUsed = params.hintsUsed || 0;
      const level = params.level || 1;
      const maxLevel = params.maxLevel || 1;
      const gameSpecificStats = params.gameSpecificStats || {};
      
      // Zorluk seviyesi çarpanları
      const difficultyMultipliers = {
        'easy': 0.8,
        'medium': 1.0,
        'hard': 1.2
      };
      
      // Varsayılan çarpan
      const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;
      
      // Temel Puan (30 - 50 arası)
      let baseScore = 30 + (difficulty === 'easy' ? 0 : (difficulty === 'medium' ? 10 : 20));
      
      // Seviye Bonusu (0 - 10 arası)
      const levelRatio = maxLevel > 1 ? (level / maxLevel) : 1;
      const levelBonus = Math.min(10, Math.round(10 * levelRatio));
      
      // Zaman Verimliliği (0 - 20 arası)
      let timeEfficiency = 1;
      if (timeSpent > 0 && optimalTime > 0) {
        timeEfficiency = Math.min(2, optimalTime / timeSpent);
      }
      const timeBonus = Math.round(20 * timeEfficiency);
      
      // Hamle Verimliliği (0 - 20 arası)
      let moveEfficiency = 1;
      if (totalMoves > 0) {
        moveEfficiency = Math.min(1, correctMoves / totalMoves);
      }
      const moveBonus = Math.round(20 * moveEfficiency);
      
      // İpucu Cezası (0 - 10 arası)
      const hintPenalty = Math.min(10, hintsUsed * 2);
      
      // Toplan Puan Hesaplama
      let finalScore = baseScore + levelBonus + timeBonus + moveBonus - hintPenalty;
      
      // Zorluk çarpanı uygula
      finalScore = Math.round(finalScore * difficultyMultiplier);
      
      // 10-100 aralığına sınırla
      finalScore = Math.max(10, Math.min(100, finalScore));
      
      // Puan detaylarını döndür
      return {
        finalScore: finalScore,
        breakdown: {
          baseScore: baseScore,
          levelBonus: levelBonus,
          timeBonus: timeBonus,
          moveBonus: moveBonus,
          hintPenalty: hintPenalty,
          difficultyMultiplier: difficultyMultiplier
        }
      };
    },
    
    /**
     * Puan detaylarını HTML formatında döndürür (gösterge panelleri için)
     * 
     * @param {Object} scoreDetails - calculate() fonksiyonundan dönen değer
     * @returns {string} HTML formatında puan detayları
     */
    getScoreBreakdownHTML: function(scoreDetails) {
      if (!scoreDetails || !scoreDetails.breakdown) {
        return '<div class="score-detail">Puan detayları hesaplanamadı.</div>';
      }
      
      const bd = scoreDetails.breakdown;
      
      return `
        <div class="score-breakdown">
          <div class="score-detail">
            <span class="detail-label">Temel Puan:</span>
            <span class="detail-value">+${bd.baseScore}</span>
          </div>
          <div class="score-detail">
            <span class="detail-label">Seviye Bonusu:</span>
            <span class="detail-value">+${bd.levelBonus}</span>
          </div>
          <div class="score-detail">
            <span class="detail-label">Zaman Bonusu:</span>
            <span class="detail-value">+${bd.timeBonus}</span>
          </div>
          <div class="score-detail">
            <span class="detail-label">Hamle Bonusu:</span>
            <span class="detail-value">+${bd.moveBonus}</span>
          </div>
          ${bd.hintPenalty > 0 ? `
          <div class="score-detail penalty">
            <span class="detail-label">İpucu Cezası:</span>
            <span class="detail-value">-${bd.hintPenalty}</span>
          </div>
          ` : ''}
          <div class="score-detail multiplier">
            <span class="detail-label">Zorluk Çarpanı:</span>
            <span class="detail-value">×${bd.difficultyMultiplier.toFixed(1)}</span>
          </div>
          <div class="score-detail total">
            <span class="detail-label">Toplam Puan:</span>
            <span class="detail-value">${scoreDetails.finalScore}</span>
          </div>
        </div>
      `;
    }
  };
}
