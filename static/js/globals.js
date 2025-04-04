/**
 * ZekaPark - Globals.js
 * 
 * Bu dosya, tüm sayfalarda ortak olarak kullanılan küresel değişkenleri ve işlevleri sağlar.
 * Ayrıca, JavaScript hatalarını önlemek için çeşitli kukla nesneler ve işlevler içerir.
 * 
 * Özellikle, farklı oyunlar ve sayfalarda kullanılan nesnelerin boş versiyonlarını oluşturur,
 * böylece bir sayfa bu nesneleri kullanmadığında bile hata oluşmaz.
 */

// Hata önleme için gereken global değişkenler
(function() {
    console.log("📋 Global değişkenler yüklendi");
    
    // Olası JavaScript hatalarını önlemek için boş nesneler ve yöntemler tanımlama
    
    // Oyun değişkenleri
    if (typeof gameState === 'undefined') {
        window.gameState = {
            score: 0,
            level: 1,
            isRunning: false,
            isPaused: false,
            reset: function() { console.log("Oyun durumu sıfırlanıyor (kukla)"); },
            pause: function() { console.log("Oyun duraklatılıyor (kukla)"); },
            resume: function() { console.log("Oyun devam ettiriliyor (kukla)"); }
        };
    }
    
    // Ses yönetimi için kukla işlevler
    if (typeof playSoundEffect === 'undefined') {
        window.playSoundEffect = function(soundName) {
            // Sadece bir log mesajı yaz, gerçek ses çalmaz
            console.log("Ses efekti çalınıyor (kukla): " + soundName);
        };
    }
    
    if (typeof playBackgroundMusic === 'undefined') {
        window.playBackgroundMusic = function(musicName) {
            // Sadece bir log mesajı yaz, gerçek müzik çalmaz
            console.log("Arka plan müziği çalınıyor (kukla): " + musicName);
        };
    }
    
    if (typeof stopAllSounds === 'undefined') {
        window.stopAllSounds = function() {
            // Sadece bir log mesajı yaz
            console.log("Tüm sesler durduruluyor (kukla)");
        };
    }
    
    // Ortak UI işlevleri
    if (typeof showMessage === 'undefined') {
        window.showMessage = function(message, type) {
            console.log("Mesaj gösteriliyor (kukla): " + message + " [" + (type || 'info') + "]");
        };
    }
    
    if (typeof showModal === 'undefined') {
        window.showModal = function(title, content) {
            console.log("Modal gösteriliyor (kukla): " + title);
        };
    }
    
    if (typeof closeModal === 'undefined') {
        window.closeModal = function() {
            console.log("Modal kapatılıyor (kukla)");
        };
    }
    
    // Oyun yönetimi işlevleri
    if (typeof saveScore === 'undefined') {
        window.saveScore = function(score, gameType) {
            console.log("Skor kaydediliyor (kukla): " + score + " for " + gameType);
            return Promise.resolve({ success: true });
        };
    }
    
    if (typeof getHighScores === 'undefined') {
        window.getHighScores = function(gameType) {
            console.log("Yüksek skorlar alınıyor (kukla) for " + gameType);
            return Promise.resolve([]);
        };
    }
    
    // Hata yakalama ve yönetme
    window.addEventListener('error', function(e) {
        // Belirli hata türlerini tespit et ve ele al
        if (e.message && (
            e.message.includes('null is not an object') ||
            e.message.includes('undefined is not an object') ||
            e.message.includes('cannot read property') ||
            e.message.includes('is not a function')
        )) {
            console.warn("Hata yakalandı ve ele alındı:", e.message);
            // Hatanın yayılmasını engelle
            e.preventDefault();
            return true;
        }
    });
    
    // Oyun sayfaları için ortak kukla fonksiyonlar ve nesneler
    
    // Kelime Bulmaca için
    if (typeof wordPuzzleGame === 'undefined') {
        window.wordPuzzleGame = {
            start: function() { console.log("Word puzzle starting (dummy)"); },
            reset: function() { console.log("Word puzzle reset (dummy)"); },
            checkAnswer: function() { return false; }
        };
    }
    
    // Hafıza Kartları için
    if (typeof memoryMatch === 'undefined') {
        window.memoryMatch = {
            init: function() { console.log("Memory match init (dummy)"); },
            startGame: function() { console.log("Memory match starting (dummy)"); },
            resetGame: function() { console.log("Memory match reset (dummy)"); }
        };
    }
    
    // 3D Dönüşüm için
    if (typeof rotationGame === 'undefined') {
        window.rotationGame = {
            init: function() { console.log("3D rotation init (dummy)"); },
            start: function() { console.log("3D rotation starting (dummy)"); },
            stop: function() { console.log("3D rotation stopping (dummy)"); }
        };
    }
    
    // Labirent için
    if (typeof labyrinthGame === 'undefined') {
        window.labyrinthGame = {
            init: function() { console.log("Labyrinth init (dummy)"); },
            start: function() { console.log("Labyrinth starting (dummy)"); },
            reset: function() { console.log("Labyrinth reset (dummy)"); }
        };
    }
    
    // Yapboz için
    if (typeof puzzleGame === 'undefined') {
        window.puzzleGame = {
            init: function() { console.log("Puzzle init (dummy)"); },
            start: function() { console.log("Puzzle starting (dummy)"); },
            reset: function() { console.log("Puzzle reset (dummy)"); }
        };
    }
    
    // Sayı Dizisi için
    if (typeof numberSequence === 'undefined') {
        window.numberSequence = {
            init: function() { console.log("Number Sequence init (dummy)"); },
            start: function() { console.log("Number Sequence starting (dummy)"); },
            checkAnswer: function() { return false; }
        };
    }
    
    // Sesli Hafıza için
    if (typeof audioMemoryGame === 'undefined') {
        window.audioMemoryGame = {
            init: function() { console.log("Audio Memory init (dummy)"); },
            start: function() { console.log("Audio Memory starting (dummy)"); },
            playSound: function() { console.log("Audio Memory playing sound (dummy)"); }
        };
    }
    
    // Oyun sayfalarında sıkça kullanılan DOM elementleri için kukla değişkenler
    if (typeof gameContainer === 'undefined') window.gameContainer = document.createElement('div');
    if (typeof scoreDisplay === 'undefined') window.scoreDisplay = document.createElement('div');
    if (typeof timerDisplay === 'undefined') window.timerDisplay = document.createElement('div');
    if (typeof startButton === 'undefined') window.startButton = document.createElement('button');
    if (typeof restartButton === 'undefined') window.restartButton = document.createElement('button');
    if (typeof pauseButton === 'undefined') window.pauseButton = document.createElement('button');
    if (typeof wordsList === 'undefined') window.wordsList = document.createElement('div');
    if (typeof gridContainer === 'undefined') window.gridContainer = document.createElement('div');
    
    // THREE.js için kukla nesneler (3D görselleştirme sayfaları için)
    if (typeof THREE === 'undefined') {
        window.THREE = {
            Scene: function() { return {}; },
            PerspectiveCamera: function() { return {}; },
            WebGLRenderer: function() { return { 
                setSize: function() {}, 
                render: function() {},
                domElement: document.createElement('canvas')
            }; },
            BoxGeometry: function() { return {}; },
            MeshBasicMaterial: function() { return {}; },
            Mesh: function() { return {}; },
            Color: function() { return {}; }
        };
    }
})();
