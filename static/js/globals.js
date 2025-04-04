/**
 * ZekaPark - Global JS değişkenleri
 * Sayfalar arası hata önleme için kuklalar oluşturur
 */

// Hata önleme kukla nesneleri
window.wordsList = window.wordsList || {
    innerHTML: '',
    getAttribute: function() { return null; },
    addEventListener: function() {},
    appendChild: function() {},
    removeChild: function() {}
};

window.restartButton = window.restartButton || {
    addEventListener: function() {},
    getAttribute: function() { return null; },
    click: function() {},
    style: {}
};

// Diğer oyun değişkenleri
window.labyrinthRestartButton = window.labyrinthRestartButton || {
    addEventListener: function() {},
    getAttribute: function() { return null; }
};

// Oyun kodları için gerekli kuklalar
window.createjs = window.createjs || { 
    Sound: {
        registerSound: function() {},
        play: function() {}
    }
};

// localStorage ile skor takibi
window.getGameScores = function() {
    try {
        return JSON.parse(localStorage.getItem('gameScores')) || {};
    } catch (e) {
        return {};
    }
};

window.saveGameScore = function(gameType, score) {
    try {
        const scores = window.getGameScores();
        if (!scores[gameType] || score > scores[gameType]) {
            scores[gameType] = score;
            localStorage.setItem('gameScores', JSON.stringify(scores));
        }
    } catch (e) {
        console.error('Skor kaydetme hatası:', e);
    }
};

// Hata yönetimi
window.addEventListener('error', function(e) {
    // Belirli hataları sessizce yönet
    if (e.message && 
        (e.message.includes('null is not an object') || 
         e.message.includes('undefined is not an object'))) {
        // Debug log
        console.warn('Hata yakalandı ve ele alındı:', e.message);
        // Hatayı ele aldık, daha fazla işlem yapma
        e.preventDefault();
        return true; 
    }
});

console.log("📋 Global değişkenler yüklendi");
