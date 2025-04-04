/**
 * ZekaPark iOS-Tarzı Swipe Navigasyon
 * Profesyonel Sürüm v2.2
 * 
 * Özellikler:
 * - A→B→C→D gezmesi ile D→C→B→A geriye dönüş
 * - Gelişmiş dokunma algılama ve kaydırma fiziği
 * - Hata yakalama ve uyumluluk katmanı
 * - Animasyonlu geçişler ve görsel geri bildirim
 */

(function() {
    'use strict';
    
    // Yapılandırma
    const CONFIG = {
        touchThreshold: 15,        // Sol kenardan kaydırma algılaması için piksel
        swipeThreshold: 50,        // Kaydırma eşik değeri (piksel)
        transitionSpeed: 300,      // Geçiş animasyonu süresi (ms)
        historyStorageKey: 'zekapark_nav_history',  // sessionStorage key
        debug: true                // Debug modunu etkinleştir
    };
    
    // Temel sayfa geçmişi nesnesi
    function createHistoryItem() {
        return {
            path: window.location.pathname,
            title: document.title,
            timestamp: Date.now()
        };
    }
    
    // Konsol Hata Ayıklama
    function debugLog(...args) {
        if (CONFIG.debug) {
            console.log(...args);
        }
    }
    
    // Başlatma fonksiyonu
    function initializeSwipeBack() {
        try {
            debugLog("📱 iOS Tarzı Swipe Navigasyon başlatılıyor...");
            
            // Sayfa ilk yüklendiğinde geçmiş başlat veya güncelle
            updateNavigationHistory();
            
            // Kaydırma gölgesi elementi
            setupSwipeShadow();
            
            // Dokunmatik olayları
            setupTouchEvents();
            
            // Tüm link'leri sayfa geçmişi için izlemeye al
            trackPageLinks();
            
            // Popstate olayını dinle (tarayıcı geri butonu)
            monitorBrowserNavigation();
            
            // Geri butonu elementi
            addBackButton();
            
            debugLog("📱 Swipe Navigasyon hazır");
        } catch (e) {
            console.warn("Swipe navigasyon başlatma hatası:", e);
        }
    }
    
    // Sayfa geçmişini başlat veya güncelle
    function updateNavigationHistory() {
        try {
            let history = getNavigationHistory();
            const currentPage = createHistoryItem();
            
            // İlk ziyaret
            if (!history || history.length === 0) {
                history = [currentPage];
                setNavigationHistory(history);
                debugLog("🏠 Geçmiş başlatıldı - İlk sayfa:", currentPage.path);
                return;
            }
            
            // Son ziyaret edilen sayfa bu sayfa mı?
            const lastPage = history[history.length - 1];
            if (lastPage.path !== currentPage.path) {
                // Farklı sayfa, geçmişe ekle
                history.push(currentPage);
                setNavigationHistory(history);
                debugLog("➕ Geçmişe yeni sayfa eklendi:", currentPage.path);
                debugLog("📜 Güncel geçmiş:", history.map(h => h.path).join(' → '));
            } else {
                debugLog("ℹ️ Aynı sayfa tekrar ziyaret edildi, geçmiş güncellenmedi");
            }
        } catch (err) {
            console.warn("Geçmiş güncelleme hatası:", err);
        }
    }
    
    // Gölge elementi oluştur
    function setupSwipeShadow() {
        try {
            // Varsa mevcut elementi kaldır
            const existingShadow = document.getElementById('swipe-shadow');
            if (existingShadow) {
                existingShadow.remove();
            }
            
            const shadowOverlay = document.createElement('div');
            shadowOverlay.id = 'swipe-shadow';
            shadowOverlay.className = 'swipe-shadow-overlay';
            document.body.appendChild(shadowOverlay);
            
            // Mobil gezinti göstergesi
            const swipeIndicator = document.createElement('div');
            swipeIndicator.id = 'swipe-indicator';
            swipeIndicator.className = 'swipe-indicator';
            document.body.appendChild(swipeIndicator);
        } catch (e) {
            console.warn("Swipe gölgesi oluşturma hatası:", e);
        }
    }
    
    // Dokunmatik olayları kur
    function setupTouchEvents() {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        // Dokunma başlangıcı
        document.addEventListener('touchstart', function(e) {
            try {
                // Sol kenarda mıyız?
                if (e.touches[0].clientX <= CONFIG.touchThreshold) {
                    startX = e.touches[0].clientX;
                    isDragging = true;
                    
                    // Göstergeleri hazırla
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.display = 'block';
                    }
                    
                    const indicator = document.getElementById('swipe-indicator');
                    if (indicator) {
                        indicator.style.opacity = '0.7';
                    }
                }
            } catch (err) {
                console.warn('Dokunma başlangıç hatası:', err);
            }
        }, { passive: true });
        
        // Dokunma hareketi
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            try {
                currentX = e.touches[0].clientX;
                const delta = currentX - startX;
                
                // Sağa doğru kaydırma
                if (delta > 0) {
                    // Sayfayı hareket ettir
                    const movePercent = Math.min(100, (delta / window.innerWidth) * 100);
                    
                    // Fizik kanunlarına uygun kaydırma
                    // Hareket giderek yavaşlar
                    const easedMove = Math.pow(movePercent / 100, 0.7) * 100;
                    
                    document.body.style.transform = `translateX(${easedMove}%)`;
                    document.body.style.transition = 'none';
                    
                    // Gölge efekti
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.opacity = (easedMove / 100 * 0.8).toString();
                    }
                    
                    // Varsayılan kaydırmayı engelle
                    e.preventDefault();
                }
            } catch (err) {
                console.warn('Dokunma hareketi hatası:', err);
            }
        }, { passive: false });
        
        // Dokunma bitişi
        document.addEventListener('touchend', function() {
            if (!isDragging) return;
            
            try {
                const delta = currentX - startX;
                
                // Geçiş animasyonunu etkinleştir
                document.body.style.transition = `transform ${CONFIG.transitionSpeed/1000}s cubic-bezier(0.165, 0.84, 0.44, 1)`;
                
                // Navigasyon geçmişini al
                const history = getNavigationHistory();
                
                // Yeterince kaydırıldı mı ve geçmişte en az 2 sayfa var mı?
                if (delta > CONFIG.swipeThreshold && history && history.length > 1) {
                    // Geçiş animasyonu
                    document.body.style.transform = 'translateX(100%)';
                    
                    // Gölge efektini artır
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.opacity = '0.8';
                    }
                    
                    // Kısa gecikme ve sonra önceki sayfaya git
                    setTimeout(function() {
                        // Son sayfayı çıkar (mevcut sayfa)
                        history.pop();
                        const previousPage = history[history.length - 1];
                        
                        // Güncellenmiş geçmişi kaydet
                        setNavigationHistory(history);
                        
                        // Önceki sayfaya git
                        debugLog("⬅️ Önceki sayfaya dönülüyor:", previousPage.path);
                        window.location.href = previousPage.path;
                    }, CONFIG.transitionSpeed - 50); // Animasyondan biraz önce
                } else {
                    // Yeterince kaydırılmadı - geri al
                    document.body.style.transform = '';
                }
                
                // Gölge efektini kapat
                const shadowOverlay = document.getElementById('swipe-shadow');
                if (shadowOverlay) {
                    shadowOverlay.style.opacity = '0';
                    setTimeout(function() {
                        shadowOverlay.style.display = 'none';
                    }, CONFIG.transitionSpeed);
                }
                
                // Göstergeyi gizle
                const indicator = document.getElementById('swipe-indicator');
                if (indicator) {
                    indicator.style.opacity = '0';
                }
                
                isDragging = false;
            } catch (err) {
                console.warn('Dokunma bitişi hatası:', err);
                // Stili sıfırla
                document.body.style.transform = '';
                document.body.style.transition = '';
            }
        });
    }
    
    // Geçmiş işlevleri
    function getNavigationHistory() {
        try {
            const historyData = sessionStorage.getItem(CONFIG.historyStorageKey);
            return historyData ? JSON.parse(historyData) : [];
        } catch (e) {
            console.warn('Navigasyon geçmişi okuma hatası:', e);
            return [];
        }
    }
    
    function setNavigationHistory(history) {
        try {
            sessionStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(history));
            debugLog("💾 Navigasyon geçmişi kaydedildi:", history.map(h => h.path).join(' → '));
        } catch (e) {
            console.warn('Navigasyon geçmişi yazma hatası:', e);
        }
    }
    
    // Geri butonu ekle
    function addBackButton() {
        try {
            const history = getNavigationHistory();
            
            // Eğer geçmişte en az 2 sayfa varsa (geri dönülebilir) geri butonunu göster
            if (history && history.length > 1) {
                // Mevcut butonu kaldır
                const existingButton = document.getElementById('swipe-back-button');
                if (existingButton) {
                    existingButton.remove();
                }
                
                // Yeni butonu ekle
                const backButton = document.createElement('div');
                backButton.id = 'swipe-back-button';
                backButton.className = 'swipe-back-button';
                backButton.setAttribute('aria-label', 'Geri git');
                backButton.setAttribute('role', 'button');
                
                backButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Geçmişten son sayfayı çıkar (mevcut sayfa)
                    history.pop();
                    const previousPage = history[history.length - 1];
                    
                    // Güncellenmiş geçmişi kaydet
                    setNavigationHistory(history);
                    
                    // Önceki sayfaya git
                    debugLog("⬅️ Geri butonuna tıklandı, önceki sayfaya dönülüyor:", previousPage.path);
                    window.location.href = previousPage.path;
                });
                
                document.body.appendChild(backButton);
                debugLog("🔄 Geri butonu eklendi, mevcut geçmiş:", history.map(h => h.path).join(' → '));
            } else {
                debugLog("ℹ️ Geçmişte yeterli sayfa yok, geri butonu eklenmedi:", history ? history.length : 0);
            }
        } catch (e) {
            console.warn('Geri butonu ekleme hatası:', e);
        }
    }
    
    // Tüm sayfadaki linkleri izle
    function trackPageLinks() {
        try {
            document.querySelectorAll('a').forEach(function(link) {
                // Sadece aynı domain ve işlenmemiş linkler
                if (link.hostname === window.location.hostname && 
                    !link.getAttribute('data-swipe-tracked') &&
                    !link.getAttribute('href').includes('javascript:') && 
                    !link.getAttribute('href').includes('#')) {
                    
                    link.setAttribute('data-swipe-tracked', 'true');
                    
                    // Link tıklama olayı
                    link.addEventListener('click', function(e) {
                        // Özel durumları es geç (ctrl/cmd+click gibi)
                        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                        
                        try {
                            const targetPath = new URL(link.href).pathname;
                            debugLog("✅ Link tıklandı:", targetPath);
                            
                            // Özel durum: Aynı sayfa linki (ör. anasayfaya geri dönme)
                            if (targetPath === window.location.pathname) {
                                debugLog("ℹ️ Aynı sayfa linki tıklandı, geçmiş güncellenmedi");
                                return;
                            }
                            
                            // Orijinal geçmişi koru ve yeni hedefi ekle (link tıklaması öncesinde)
                            const history = getNavigationHistory();
                            const currentPage = createHistoryItem();
                            
                            // Son eklenen sayfa mevcut sayfa değilse, mevcut sayfayı ekle
                            if (history.length === 0 || history[history.length - 1].path !== currentPage.path) {
                                history.push(currentPage);
                            }
                            
                            setNavigationHistory(history);
                            debugLog("🔖 Link tıklaması öncesi geçmiş güncellendi:", history.map(h => h.path).join(' → '));
                        } catch (err) {
                            console.warn('Link tıklama izleme hatası:', err);
                        }
                    });
                }
            });
            debugLog("🔗 Sayfa linkleri takip ediliyor");
        } catch (e) {
            console.warn('Link izleme kurulumu hatası:', e);
        }
    }
    
    // Tarayıcı geçmişi olaylarını izle
    function monitorBrowserNavigation() {
        // Tarayıcı geri butonu
        window.addEventListener('popstate', function(e) {
            try {
                debugLog("⬅️ Tarayıcı geri/ileri butonu algılandı");
                
                // Geçmişi güncelle
                const history = getNavigationHistory();
                if (history && history.length > 0) {
                    // Son sayfayı çıkar
                    history.pop();
                    setNavigationHistory(history);
                    debugLog("🔄 Tarayıcı geri tuşu sonrası geçmiş güncellendi:", history.map(h => h.path).join(' → '));
                }
            } catch (e) {
                console.warn('Popstate işleme hatası:', e);
            }
        });
    }
    
    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSwipeBack);
    } else {
        // Sayfa zaten yüklendiyse
        initializeSwipeBack();
    }
    
    // Global hata yakalama
    window.addEventListener('error', function(event) {
        // Belirli hataları sessiz şekilde ele al (swipe navigasyon ile ilgili olmayan hatalar)
        if (event.error && typeof event.error.message === 'string' && 
            (event.error.message.includes('null is not an object') || 
             event.error.message.includes('Cannot read property') ||
             event.error.message.includes('undefined is not an object'))) {
            console.warn("⚠️ Hata ele alındı:", event.error.message);
            event.preventDefault();
        }
    }, true);
})();
