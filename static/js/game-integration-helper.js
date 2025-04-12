
/**
 * Oyun puan entegrasyonu için yardımcı fonksiyonlar
 * Bu modül, oyunlara puan sistemini kolayca entegre etmek için yardımcı fonksiyonlar sağlar
 * @version 1.0.0
 */

/**
 * Oyuna puan sistemi entegrasyonu ekler
 * @param {string} gameType - Oyun tipi (wordle, puzzle, memoryCards vb.)
 * @param {Object} gameInstance - Oyun örneği veya oyun verilerini içeren nesne
 * @param {Object} options - Ek seçenekler
 * @returns {Object} GameScoreIntegration örneği
 */
function integrateGameScore(gameType, gameInstance = {}, options = {}) {
  // Gerekli script dosyalarını kontrol et ve yükle
  ensureScriptLoaded('static/js/scoreCalculator.js');
  ensureScriptLoaded('static/js/score-handler.js');
  ensureScriptLoaded('static/js/score-display.js');
  ensureScriptLoaded('static/js/game-score-integration.js');

  // Zorluk seviyesini al (HTML'de varsa)
  const difficultySelector = document.querySelector('.difficulty-selector .selected');
  const difficulty = difficultySelector ? 
                    difficultySelector.getAttribute('data-difficulty') : 
                    (options.difficulty || 'medium');

  // Oyun tipi, zorluk ve diğer parametrelerle bir puan entegrasyonu oluştur
  const scoreIntegration = new GameScoreIntegration({
    gameType: gameType,
    difficulty: difficulty,
    maxScore: options.maxScore || 100,
    optimalMoves: options.optimalMoves || null,
    optimalTime: options.optimalTime || null,
    expectedTime: options.expectedTime || null
  });

  // GameScore örneğini oyun nesnesine bağla
  if (gameInstance) {
    gameInstance.scoreIntegration = scoreIntegration;
    
    // Oyunun restart metodu varsa, onu genişlet
    if (typeof gameInstance.restart === 'function') {
      const originalRestart = gameInstance.restart;
      gameInstance.restart = function(...args) {
        // Önce orijinal restart fonksiyonunu çağır
        originalRestart.apply(this, args);
        // Sonra puan entegrasyonunu da yeniden başlat
        this.scoreIntegration.restart();
      };
    }
  }

  return scoreIntegration;
}

/**
 * Script dosyasının yüklü olduğundan emin olur
 * @param {string} src - Script dosyasının yolu
 */
function ensureScriptLoaded(src) {
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }
}

/**
 * Doğruluk oranını hesaplar
 * @param {number} correct - Doğru sayısı
 * @param {number} total - Toplam sayı
 * @returns {number} Doğruluk oranı (0-1 arası)
 */
function calculateAccuracy(correct, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(1, correct / total));
}

/**
 * Zorluk seviyesini izler ve değişikliklerini takip eder
 * @param {Object} scoreIntegration - GameScoreIntegration örneği
 */
function setupDifficultyListener(scoreIntegration) {
  if (!scoreIntegration) return;
  
  const difficultyButtons = document.querySelectorAll('.difficulty-selector .difficulty-option');
  
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const difficulty = this.getAttribute('data-difficulty');
      if (difficulty) {
        scoreIntegration.setDifficulty(difficulty);
      }
    });
  });
}

// Global erişim için window nesnesine ekle
window.integrateGameScore = integrateGameScore;
window.setupDifficultyListener = setupDifficultyListener;
window.calculateAccuracy = calculateAccuracy;
