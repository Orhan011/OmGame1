
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
      console.log(`Script başarıyla yüklendi: ${scriptUrl}`);
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
  console.log(`${gameType} oyunu için puan entegrasyonu başlatılıyor...`);
  
  // Gerekli script dosyalarını sıralı şekilde yükle
  const loadScripts = async () => {
    try {
      await ensureScriptLoaded('static/js/scoreCalculator.js');
      await ensureScriptLoaded('static/js/score-handler.js');
      await ensureScriptLoaded('static/js/score-display.js');
      await ensureScriptLoaded('static/js/game-score-integration.js');
      console.log('Tüm puan sistemi scriptleri başarıyla yüklendi');
      return true;
    } catch (error) {
      console.error('Puan sistemi scriptleri yüklenirken hata oluştu:', error);
      return false;
    }
  };

  // Zorluk seviyesini al (HTML'de varsa)
  const difficultySelector = document.querySelector('.difficulty-selector .selected');
  const difficulty = difficultySelector ? 
                    difficultySelector.getAttribute('data-difficulty') : 
                    (options.difficulty || 'medium');
  
  loadScripts().then(scriptsLoaded => {
    if (scriptsLoaded && typeof window.GameScoreIntegration === 'function') {
      console.log('GameScoreIntegration yüklendi, entegrasyon başlatılıyor');
      
      // Oyun tipi, zorluk ve diğer parametrelerle bir puan entegrasyonu oluştur
      const scoreIntegration = new window.GameScoreIntegration({
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
      
      console.log(`${gameType} oyunu için puan entegrasyonu tamamlandı`);
      return scoreIntegration;
    } else {
      console.error('Puan sistemi entegrasyonu başarısız: GameScoreIntegration yüklenemedi');
    }
  });
}

// Global erişim için window nesnesine ekle
window.ensureScriptLoaded = ensureScriptLoaded;
window.integrateGameScore = integrateGameScore;

// Sayfa yüklendiğinde gerekli script'leri yükle
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sayfa yüklendi, puan sistemi script dosyaları yükleniyor...');
  
  // Puan sistemi script dosyalarını sıralı yükle
  ensureScriptLoaded('static/js/scoreCalculator.js')
    .then(() => ensureScriptLoaded('static/js/score-handler.js'))
    .then(() => ensureScriptLoaded('static/js/score-display.js'))
    .then(() => ensureScriptLoaded('static/js/game-score-integration.js'))
    .then(() => {
      console.log('Puan sistemi script dosyaları başarıyla yüklendi.');
      
      // GameScoreIntegration dosyası başarıyla yüklendiğinde bunu bildir
      const event = new CustomEvent('score-system-ready');
      document.dispatchEvent(event);
    })
    .catch(error => {
      console.error('Puan sistemi script dosyaları yüklenirken hata oluştu:', error);
    });
});
