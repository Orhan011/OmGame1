/**
 * Puan sistemi tamamen kaldırıldı
 * Bu dosya referans amaçlı korunuyor ama hiçbir işlevi yok
 */

/**
 * Boş puan gösterimi
 */
function createScoreDisplay(scoreData) {
    // Puan gösterimi kaldırıldığı için boş değer dönüyor
    return '';
}

/**
 * Pasif puan kaydetme işlevi - hiçbir şey yapmıyor
 */
function saveScoreAndDisplay(gameType, score, playtime, difficulty = 'medium', gameStats = {}, callback) {
    console.log('Puan sistemi kaldırıldı - skorlar kaydedilmiyor');
    
    // Callback'i hemen çağır
    if (typeof callback === 'function') {
        callback('', { success: false, message: 'Puan sistemi kaldırıldı' });
    }
}