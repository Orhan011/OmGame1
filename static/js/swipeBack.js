/**
 * ZekaPark iOS-Tarzı Swipe Geri Navigasyon
 * v3.0 - Profesyonel sürüm
 * 
 * Özellikler:
 * - Doğrusal A→B→C→D gezmesi ve D→C→B→A geri dönüş
 * - Geliştirilmiş dokunma algılama ve kaydırma fiziği
 * - iOS tarzı animasyonlu kaydırma
 * - Navigasyon modülü (navigationHistory.js) ile entegrasyon
 */

(function() {
    'use strict';
    
    // Yapılandırma
    const CONFIG = {
        touchThreshold: 15,        // Sol kenardan kaydırma algılaması için piksel
        swipeThreshold: 50,        // Kaydırma eşik değeri (piksel)
        transitionSpeed: 300,      // Geçiş animasyonu süresi (ms)
        debug: true                // Debug modunu etkinleştir
    };
    
    // Debug log
    function log(...args) {
        if (CONFIG.debug) {
            console.log(...args);
        }
    }
    
    // Başlatma
    function initializeSwipeBack() {
        try {
            log("📱 iOS Tarzı Swipe Geri özelliği başlatılıyor...");
            
            // Kaydırma gölgesi ve göstergeleri oluştur
            setupSwipeElements();
            
            // Dokunmatik olayları ayarla
            setupTouchEvents();
            
            // Geri butonu ekle
            addBackButton();
            
            log("📱 Swipe Geri başlatıldı");
        } catch (e) {
            console.warn("Swipe başlatma hatası:", e);
        }
    }
    
    // Kaydırma UI elementlerini oluştur
    function setupSwipeElements() {
        try {
            // Varsa önceki elementleri temizle
            removeElement('swipe-shadow');
            removeElement('swipe-indicator');
            
            // Gölge overlay
            const shadowOverlay = document.createElement('div');
            shadowOverlay.id = 'swipe-shadow';
            shadowOverlay.className = 'swipe-shadow-overlay';
            document.body.appendChild(shadowOverlay);
            
            // Kaydırma göstergesi
            const indicator = document.createElement('div');
            indicator.id = 'swipe-indicator';
            indicator.className = 'swipe-indicator';
            document.body.appendChild(indicator);
        } catch (e) {
            console.warn("Swipe elementleri oluşturma hatası:", e);
        }
    }
    
    // Eleman kaldır
    function removeElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }
    
    // Dokunmatik olayları
    function setupTouchEvents() {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        // Dokunma başlangıcı
        document.addEventListener('touchstart', function(e) {
            try {
                // Sol kenarda mı?
                if (e.touches[0].clientX <= CONFIG.touchThreshold) {
                    startX = e.touches[0].clientX;
                    isDragging = true;
                    
                    // Göstergeleri göster
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
                    // Sayfayı sürükle
                    const movePercent = Math.min(100, (delta / window.innerWidth) * 100);
                    
                    // Fizik kanunlarına uygun kaydırma - yavaşlayan hareket
                    const easedMove = Math.pow(movePercent / 100, 0.7) * 100;
                    
                    document.body.style.transform = `translateX(${easedMove}%)`;
                    document.body.style.transition = 'none';
                    
                    // Gölge efekti
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.opacity = (easedMove / 100 * 0.7).toString();
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
                
                // Geçiş animasyonu
                document.body.style.transition = `transform ${CONFIG.transitionSpeed/1000}s cubic-bezier(0.165, 0.84, 0.44, 1)`;
                
                // Yeterince kaydırıldı mı?
                if (delta > CONFIG.swipeThreshold) {
                    // Animasyonu uygula
                    document.body.style.transform = 'translateX(100%)';
                    
                    // Gölge artır
                    const shadowOverlay = document.getElementById('swipe-shadow');
                    if (shadowOverlay) {
                        shadowOverlay.style.opacity = '0.8';
                    }
                    
                    // Geçiş sonrası geri git
                    setTimeout(function() {
                        // NavigationHistory API ile entegrasyon
                        if (typeof NavigationHistory !== 'undefined' && NavigationHistory.goBack) {
                            NavigationHistory.goBack();
                        } else {
                            // Fallback: Tarayıcı geçmişine git
                            window.history.back();
                        }
                    }, CONFIG.transitionSpeed - 50);
                } else {
                    // Yetersiz kaydırma - geri al
                    document.body.style.transform = '';
                }
                
                // Göstergeleri gizle
                const shadowOverlay = document.getElementById('swipe-shadow');
                if (shadowOverlay) {
                    shadowOverlay.style.opacity = '0';
                    setTimeout(function() {
                        shadowOverlay.style.display = 'none';
                    }, CONFIG.transitionSpeed);
                }
                
                const indicator = document.getElementById('swipe-indicator');
                if (indicator) {
                    indicator.style.opacity = '0';
                }
                
                isDragging = false;
            } catch (err) {
                console.warn('Dokunma bitişi hatası:', err);
                // Stil sıfırla
                document.body.style.transform = '';
                document.body.style.transition = '';
            }
        });
    }
    
    // Geri butonu ekle
    function addBackButton() {
        try {
            // Eğer NavigationHistory varsa ve geçmişte en az 2 sayfa varsa
            if (typeof NavigationHistory === 'undefined' || !NavigationHistory.getHistory) {
                log('⚠️ NavigationHistory API bulunamadı, geri butonu eklenmedi');
                return;
            }
            
            const history = NavigationHistory.getHistory();
            
            if (history.length <= 1) {
                log('ℹ️ Geçmişte yeterli sayfa yok, geri butonu eklenmedi');
                return;
            }
            
            // Varsa mevcut butonu kaldır
            removeElement('swipe-back-button');
            
            // Yeni buton ekle
            const backButton = document.createElement('div');
            backButton.id = 'swipe-back-button';
            backButton.className = 'swipe-back-button';
            backButton.setAttribute('aria-label', 'Geri git');
            backButton.setAttribute('role', 'button');
            
            backButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // NavigationHistory ile geri git
                NavigationHistory.goBack();
            });
            
            document.body.appendChild(backButton);
            log('✅ Geri butonu eklendi');
        } catch (e) {
            console.warn('Geri butonu ekleme hatası:', e);
        }
    }
    
    // Sayfa yüklendiğinde başlat
    document.addEventListener('DOMContentLoaded', function() {
        // NavigationHistory modülünün yüklenmesini bekle
        if (typeof NavigationHistory !== 'undefined') {
            initializeSwipeBack();
        } else {
            // NavigationHistory modülünü bekle
            log('⏳ NavigationHistory bekleniyor...');
            let checkCount = 0;
            const checkInterval = setInterval(function() {
                if (typeof NavigationHistory !== 'undefined') {
                    clearInterval(checkInterval);
                    initializeSwipeBack();
                } else if (checkCount++ > 5) {
                    clearInterval(checkInterval);
                    console.warn('NavigationHistory bulunamadı, alternatif mod başlatıldı');
                    initializeSwipeBack();
                }
            }, 100);
        }
    });
    
    // Doğrudan başlat (DOMContentLoaded'ı beklememek için)
    if (document.readyState !== 'loading') {
        // NavigationHistory modülünün yüklenmesini bekle
        setTimeout(function() {
            if (typeof NavigationHistory !== 'undefined') {
                initializeSwipeBack();
            }
        }, 100);
    }
})();
