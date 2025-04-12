
/**
 * Oyun puan sistemini entegre etmeyi kolaylaştıran yardımcı fonksiyonlar
 * @module GameIntegrationHelper
 * @version 1.0.0
 */

/**
 * Belirtilen script dosyasının yüklü olup olmadığını kontrol eder ve yüklü değilse yükler
 * @param {string} scriptUrl - Yüklenecek script dosyasının URL'si
 * @returns {Promise} Script yükleme işlemi
 */
function ensureScriptLoaded(scriptUrl) {
  return new Promise((resolve, reject) => {
    if (!scriptUrl) {
      reject('Script URL belirtilmedi!');
      return;
    }

    // Script zaten yüklü mü kontrol et
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      resolve(existingScript);
      return;
    }

    // Script yüklü değilse yükle
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => {
      resolve(script);
    };
    
    script.onerror = (error) => {
      console.error(`Script yüklenirken hata oluştu: ${scriptUrl}`, error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Bir oyun için puan sistemi entegrasyonu oluşturur ve başlatır
 * @param {string} gameType - Oyun türü (wordle, tetris, puzzle vb.)
 * @param {Object} gameInstance - Oyun örneği
 * @param {Object} options - Ek seçenekler
 * @returns {GameScoreIntegration} Puan entegrasyonu örneği
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
  
  // Eğer bir oyun örneği varsa, ona puan sistemi metodlarını ekle
  if (gameInstance) {
    gameInstance.scoreSystem = scoreIntegration;
    
    // Oyun API'si üzerinden puan sistemi fonksiyonlarına erişim sağla
    if (!gameInstance.updateScore) {
      gameInstance.updateScore = (score) => scoreIntegration.updateScore(score);
    }
    
    if (!gameInstance.saveScore) {
      gameInstance.saveScore = (callback) => scoreIntegration.saveScore(callback);
    }
    
    if (!gameInstance.endGame) {
      gameInstance.endGame = (finalScore, callback) => scoreIntegration.endGame(finalScore, callback);
    }
  }
  
  return scoreIntegration;
}

// Global erişim için window nesnesine ekle
window.ensureScriptLoaded = ensureScriptLoaded;
window.integrateGameScore = integrateGameScore;
