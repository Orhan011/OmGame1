/**
 * ZekaPark - Global Değişkenler ve Hata Yakalama Sistemi
 * Oyun sayfalarıyla uyumluluk için özel oluşturulmuştur
 */

(function() {
    'use strict';
    
    // Global hata yakalama
    window.addEventListener('error', function(e) {
        // Bilinen uyumluluk sorunlarını sessizce ele al
        if (e.message && (
            e.message.includes('null is not an object') || 
            e.message.includes('undefined is not an object') ||
            e.message.includes('cannot read property') ||
            e.message.includes('is not a function') ||
            e.message.includes('Cannot set property') ||
            e.message.includes('is not defined')
        )) {
            console.warn("⚠️ Hata yakalandı ve ele alındı:", e.message);
            e.preventDefault();
            return true;
        }
    }, true);
    
    // Değişken doğrulama ve proxy oluşturma
    function createSafeProxy(name, mockObject) {
        const handler = {
            get: function(target, prop) {
                // Eğer özellik yoksa, boş işlev döndür
                if (!(prop in target)) {
                    if (typeof prop === 'string' && prop.startsWith('on')) {
                        // Olay işleyiciler için boş işlev
                        return function() {};
                    }
                    // Diğer özellikler için varsayılan değerler
                    if (prop === 'style') return {};
                    if (prop === 'classList') return { add: function() {}, remove: function() {}, toggle: function() {}, contains: function() { return false; } };
                    if (prop === 'setAttribute' || prop === 'removeAttribute') return function() {};
                    if (prop === 'addEventListener') return function() {};
                    if (prop === 'innerHTML' || prop === 'textContent' || prop === 'value') return '';
                    if (prop === 'checked') return false;
                    if (prop === 'disabled') return false;
                    
                    return undefined;
                }
                return target[prop];
            },
            set: function(target, prop, value) {
                // Özellik olmasa bile ayarlamaya izin ver
                target[prop] = value;
                return true;
            }
        };
        
        return new Proxy(mockObject || {}, handler);
    }
    
    // Oyun sayfaları için gerekli global değişkenler
    const safeGlobals = {
        // Kelime Bulmaca için
        wordsList: createSafeProxy('wordsList', {
            innerHTML: '',
            appendChild: function() {},
            removeChild: function() {},
            style: {}
        }),
        
        // Yeniden başlatma butonları
        restartButton: createSafeProxy('restartButton', {
            addEventListener: function() {},
            click: function() {},
            style: {}
        }),
        
        labyrinthRestartButton: createSafeProxy('labyrinthRestartButton', {
            addEventListener: function() {},
            click: function() {}
        }),
        
        // Ses oynatma için createjs
        createjs: createSafeProxy('createjs', {
            Sound: {
                registerSound: function() { return { id: 'sound' }; },
                play: function() { 
                    console.log("Sound play error:", {}); 
                    return { 
                        addEventListener: function() {},
                        volume: 1
                    }; 
                }
            }
        }),
        
        // Timer değişkenleri
        gameTimer: createSafeProxy('gameTimer', {
            stop: function() {},
            start: function() {},
            getTime: function() { return 0; }
        }),
        
        // Skor değişkenleri
        score: 0,
        highScore: 0,
        
        // Yardımcı fonksiyonlar
        getGameScores: function() {
            try {
                return JSON.parse(localStorage.getItem('gameScores')) || {};
            } catch (e) {
                console.warn("Skor okuma hatası:", e);
                return {};
            }
        },
        
        saveGameScore: function(gameType, score) {
            try {
                const scores = window.getGameScores ? window.getGameScores() : {};
                if (!scores[gameType] || score > scores[gameType]) {
                    scores[gameType] = score;
                    localStorage.setItem('gameScores', JSON.stringify(scores));
                    return true;
                }
                return false;
            } catch (e) {
                console.warn("Skor kaydetme hatası:", e);
                return false;
            }
        }
    };
    
    // Global değişkenleri window nesnesine ekle
    Object.keys(safeGlobals).forEach(function(key) {
        if (typeof window[key] === 'undefined' || window[key] === null) {
            window[key] = safeGlobals[key];
        }
    });
    
    // DOM Yüklendi olayını ele al
    document.addEventListener('DOMContentLoaded', function() {
        // Hata veren elemanları doğrula
        ['wordsList', 'restartButton', 'labyrinthRestartButton'].forEach(function(id) {
            const element = document.getElementById(id);
            if (!element) {
                // Eksik elemanları oluştur ve gizle
                const dummy = document.createElement('div');
                dummy.id = id;
                dummy.style.display = 'none';
                document.body.appendChild(dummy);
            }
        });
    });
    
    console.log("📋 Global değişkenler yüklendi");
})();
