/**
 * ZekaPark iOS-Tarzı Swipe Navigasyon
 * Profesyonel Sürüm v2.0
 * 
 * Özellikler:
 * - A→B→C→D gezmesi ile D→C→B→A geriye dönüş
 * - Gelişmiş dokunma algılama ve kaydırma fiziği
 * - Sessiz hata yönetimi ve uyumluluk katmanı
 * - Animasyonlu geçişler ve görsel geri bildirim
 */

(function() {
    'use strict';
    
    // Yapılandırma
    const CONFIG = {
        touchThreshold: 15,        // Sol kenardan kaydırma algılaması için piksel
        swipeThreshold: 50,        // Kaydırma eşik değeri (piksel)
        transitionSpeed: 300,      // Geçiş animasyonu süresi (ms)
        historyStorageKey: 'zekapark_nav_history',  // localStorage key
        debug: false               // Debug modunu aktifleştir/deaktif et
    };
    
    // Temel sayfa geçmişi nesnesi
    function createHistoryItem() {
        return {
            path: window.location.pathname,
            title: document.title,
            timestamp: Date.now()
        };
    }
    
    // Başlatma fonksiyonu
    function initializeSwipeBack() {
        try {
            let history = getNavigationHistory();
            const currentPage = createHistoryItem();
            
            // İlk sayfa veya yeni sayfa
            if (history.length === 0) {
                // İlk ziyaret - geçmişi başlat
                history = [currentPage];
                setNavigationHistory(history);
                debugLog("✅ Navigasyon geçmişi oluşturuldu:", history);
            } else {
                // Geçmişteki son sayfa bu sayfa değilse ve zaten eklenmemişse
                const lastPage = history[history.length - 1];
                
                if (lastPage.path !== currentPage.path) {
                    history.push(currentPage);
                    setNavigationHistory(history);
                    debugLog("✅ Sayfaya geçiş kaydedildi:", currentPage.path);
                }
            }
            
            // Kaydırma gölgesi elementi
            setupSwipeShadow();
            
            // Dokunmatik olayları
            setupTouchEvents();
            
            // Tüm link'leri sayfa geçmişi için izlemeye al
            trackPageLinks();
            
            // Popstate olayını dinle (tarayıcı geri butonu)
            monitorBrowserNavigation();
            
            debugLog("📱 Geliştirilmiş Swipe Navigasyon sistemi başlatıldı");
        } catch (e) {
            console.error("Swipe navigasyon başlatma hatası:", e);
        }
    }
    
    // Gölge elementi oluştur
    function setupSwipeShadow() {
        // Varsa mevcut elementi kaldır
        const existingShadow = document.getElementById('swipe-shadow');
        if (existingShadow) {
            existingShadow.remove();
        }
        
        const shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'swipe-shadow';
        shadowOverlay.className = 'swipe-shadow-overlay';
        shadowOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.35);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            display: none;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(shadowOverlay);
        
        // Mobil gezinti göstergesi
        const swipeIndicator = document.createElement('div');
        swipeIndicator.id = 'swipe-indicator';
        swipeIndicator.className = 'swipe-indicator';
        swipeIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 10px;
            width: 5px;
            height: 50px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 5px;
            transform: translateY(-50%);
            opacity: 0;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(swipeIndicator);
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
                if (delta > CONFIG.swipeThreshold && history.length > 1) {
                    // Geçiş animasyonu
                    document.body.style.transform = 'translateX(100%)';
                    
                    // Gölge efektini artır
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.opacity = '0.8';
                    }
                    
                    // Kısa gecikme ve sonra önceki sayfaya git
                    setTimeout(function() {
                        // Son sayfayı çıkar
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
            const history = localStorage.getItem(CONFIG.historyStorageKey);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.warn('Navigasyon geçmişi okuma hatası:', e);
            return [];
        }
    }
    
    function setNavigationHistory(history) {
        try {
            localStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(history));
        } catch (e) {
            console.warn('Navigasyon geçmişi yazma hatası:', e);
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
                    
                    // Orijinal tıklama işleyicisini sakla
                    const originalClick = link.onclick;
                    
                    // Yeni click işleyici
                    link.addEventListener('click', function(e) {
                        // Orijinal click varsa çalıştır
                        if (originalClick) {
                            const result = originalClick.call(this, e);
                            if (result === false) return false;
                        }
                        
                        // Özel durumları es geç (ctrl/cmd+click gibi)
                        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                        
                        try {
                            // Navigasyon geçmişini güncelle
                            const history = getNavigationHistory();
                            const targetPath = new URL(link.href).pathname;
                            
                            // Geçmişte yoksa ekle
                            const newItem = {
                                path: targetPath,
                                title: link.textContent.trim() || document.title,
                                timestamp: Date.now()
                            };
                            
                            history.push(newItem);
                            setNavigationHistory(history);
                            debugLog("✓ Link tıklamasıyla geçmiş güncellendi:", targetPath);
                        } catch (err) {
                            console.warn('Link izleme hatası:', err);
                        }
                    });
                }
            });
        } catch (e) {
            console.warn('Link izleme kurulumu hatası:', e);
        }
    }
    
    // Tarayıcı geçmişi olaylarını izle
    function monitorBrowserNavigation() {
        // Tarayıcı geri butonu
        window.addEventListener('popstate', function() {
            try {
                const history = getNavigationHistory();
                if (history.length > 0) {
                    // Geçmişten son sayfayı çıkar
                    history.pop();
                    setNavigationHistory(history);
                    debugLog("⬅️ Tarayıcı geri butonu algılandı, geçmiş güncellendi");
                }
            } catch (e) {
                console.warn('Popstate işleme hatası:', e);
            }
        });
    }
    
    // Debug fonksiyonu
    function debugLog(...args) {
        if (CONFIG.debug) {
            console.log(...args);
        }
    }
    
    // Sayfa yüklendiğinde başlat
    document.addEventListener('DOMContentLoaded', function() {
        debugLog("📱 Gelişmiş Swipe Navigasyon başlatılıyor...");
        initializeSwipeBack();
    });
    
    // Sayfa stili
    const style = document.createElement('style');
    style.textContent = `
        body {
            overflow-x: hidden;
            position: relative;
            width: 100%;
            min-height: 100vh;
            will-change: transform;
            transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
            touch-action: pan-y;
        }
        
        .swipe-shadow-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.35);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            display: none;
            transition: opacity 0.3s ease;
        }
        
        .swipe-indicator {
            position: fixed;
            top: 50%;
            left: 10px;
            width: 5px;
            height: 50px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 5px;
            transform: translateY(-50%);
            opacity: 0;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        
        @media (prefers-reduced-motion) {
            body, .swipe-shadow-overlay, .swipe-indicator {
                transition: none!important;
            }
        }
    `;
    document.head.appendChild(style);
})();
