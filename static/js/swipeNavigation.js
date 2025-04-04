/**
 * ZekaPark - Gelişmiş iOS Tarzı Swipe Back Navigasyon
 * 
 * Gelişmiş Özellikleri:
 * - Sol kenardan kaydırma ile geri dönüş
 * - Sayfalarda doğru sırada gezinme (A, B, C, D sırasıyla gezinme, D, C, B, A sırasıyla dönüş)
 * - Gösterişli kaydırma animasyonları
 * - Dokunmatik alanı ve görselleştirme
 * - Duyarlı geri kaydırma işlemleri
 */

(function() {
    // DOM yüklendiğinde çalıştır
    window.addEventListener('DOMContentLoaded', function() {
        console.log("📱 Gelişmiş Swipe Navigasyon başlatılıyor...");
        
        // Sayfanın başlangıç durumunu kaydet
        initializeNavigation();
        
        // Navigasyon görsellerini ekle
        addSwipeIndicator();
        
        // Ana olayları bağla
        setupEvents();
    });
    
    // Sayfa geçmişini başlat
    function initializeNavigation() {
        // localStorage yerine daha güvenli olan sessionStorage kullan
        if (!sessionStorage.getItem('zekaParkHistory')) {
            // İlk kez çalıştırılıyorsa, ilk sayfa olarak mevcut sayfayı ekle
            const initialHistory = [{
                path: window.location.pathname,
                title: document.title,
                timestamp: Date.now()
            }];
            
            sessionStorage.setItem('zekaParkHistory', JSON.stringify(initialHistory));
            console.log("✅ Navigasyon geçmişi oluşturuldu:", initialHistory);
        } else {
            // Mevcut geçmişi kontrol et
            let history = JSON.parse(sessionStorage.getItem('zekaParkHistory') || '[]');
            const currentPath = window.location.pathname;
            
            // Son sayfa bu değilse (yeni bir sayfaya geldik), geçmişe ekle
            if (history.length === 0 || history[history.length - 1].path !== currentPath) {
                // Geçmişe ekle
                history.push({
                    path: currentPath,
                    title: document.title,
                    timestamp: Date.now()
                });
                
                // Güncellenen geçmişi kaydet
                sessionStorage.setItem('zekaParkHistory', JSON.stringify(history));
                console.log("✅ Navigasyon geçmişi güncellendi:", history);
            }
        }
    }
    
    // İşaretçi/gösterge öğelerini ekle
    function addSwipeIndicator() {
        // Gölge elementi
        const shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'swipe-shadow';
        shadowOverlay.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999; 
            opacity: 0; 
            display: none;
            pointer-events: none;
            transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(shadowOverlay);
        
        // Kaydırma işaretçisi/göstergesi
        const swipeIndicator = document.createElement('div');
        swipeIndicator.id = 'swipe-indicator';
        swipeIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 12px;
            width: 6px;
            height: 50px;
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 3px;
            transform: translateY(-50%);
            opacity: 0;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.2s ease;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(swipeIndicator);
        
        // Sol kenar dokunmatik alanı
        const swipeArea = document.createElement('div');
        swipeArea.id = 'swipe-area';
        swipeArea.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 20px;
            height: 100%;
            z-index: 9998;
            cursor: w-resize;
        `;
        document.body.appendChild(swipeArea);
    }
    
    // Tüm olayları kur
    function setupEvents() {
        // Dokunmatik değişkenler
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        // Kaydırma başladığında
        document.addEventListener('touchstart', function(e) {
            // Sol kenara yakın dokunuşları algıla (20px)
            if (e.touches[0].clientX <= 20) {
                // Başlangıç konumunu kaydet
                startX = e.touches[0].clientX;
                isDragging = true;
                
                // Gölge ve göstergeyi hazırla
                const shadowOverlay = document.getElementById('swipe-shadow');
                const swipeIndicator = document.getElementById('swipe-indicator');
                
                if (shadowOverlay && swipeIndicator) {
                    // Göster
                    shadowOverlay.style.display = 'block';
                    swipeIndicator.style.opacity = '1';
                }
            }
        }, { passive: true });
        
        // Kaydırma sırasında
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Sağa doğru kaydırma (geri dönüş hareketi)
            if (deltaX > 0) {
                // Yüzde olarak hareket miktarı (maksimum %100)
                const movePercent = Math.min(100, (deltaX / window.innerWidth) * 100);
                
                // Sayfayı sağa kaydır
                document.body.style.transform = `translateX(${movePercent}%)`;
                document.body.style.transition = 'none';
                
                // Gölge ve gösterge efektlerini güncelle
                const shadowOverlay = document.getElementById('swipe-shadow');
                const swipeIndicator = document.getElementById('swipe-indicator');
                
                if (shadowOverlay) {
                    shadowOverlay.style.opacity = (movePercent / 200).toString();
                }
                
                if (swipeIndicator) {
                    // İşaretçiyi hareketle uyumlu hale getir
                    swipeIndicator.style.opacity = Math.min(1, movePercent / 30).toString();
                    swipeIndicator.style.left = Math.min(20, 12 + (movePercent / 10)) + 'px';
                }
                
                // Varsayılan kaydırma davranışını engelle
                e.preventDefault();
            }
        }, { passive: false });
        
        // Kaydırma bittiğinde
        document.addEventListener('touchend', function() {
            if (!isDragging) return;
            
            // Kaydırma mesafesi
            const deltaX = currentX - startX;
            
            // Geçiş animasyonunu etkinleştir
            document.body.style.transition = 'transform 0.3s ease-out';
            
            // Geçmiş
            const history = JSON.parse(sessionStorage.getItem('zekaParkHistory') || '[]');
            
            // Yeterince kaydırıldı mı ve geçmişte gezinebilir miyiz?
            if (deltaX > 50 && history.length > 1) {
                // Geçiş animasyonu - Sağa doğru kaydır
                document.body.style.transform = 'translateX(100%)';
                
                // Animasyon için bir gecikme ve sonra önceki sayfaya git
                setTimeout(function() {
                    // Son sayfayı çıkar
                    history.pop();
                    const previousPage = history[history.length - 1];
                    
                    // Güncellenmiş geçmişi kaydet
                    sessionStorage.setItem('zekaParkHistory', JSON.stringify(history));
                    
                    // Önceki sayfaya git
                    window.location.href = previousPage.path;
                }, 250);
            } else {
                // Yeterince kaydırılmadıysa geri al
                document.body.style.transform = '';
            }
            
            // Gölge ve gösterge efektlerini kapat
            const shadowOverlay = document.getElementById('swipe-shadow');
            const swipeIndicator = document.getElementById('swipe-indicator');
            
            if (shadowOverlay) {
                shadowOverlay.style.opacity = '0';
                setTimeout(function() {
                    shadowOverlay.style.display = 'none';
                }, 300);
            }
            
            if (swipeIndicator) {
                swipeIndicator.style.opacity = '0';
                swipeIndicator.style.left = '12px';
            }
            
            isDragging = false;
        });
        
        // Sayfadaki tüm linkleri işle (sayfa geçişlerini takip et)
        setupLinkTracking();
        
        // Geriye gitme olaylarını yakala
        handleHistoryEvents();
    }
    
    // Link tıklamalarını izle
    function setupLinkTracking() {
        document.querySelectorAll('a').forEach(function(link) {
            // Eğer link zaten işaretlenmişse atla
            if (link.getAttribute('data-nav-tracked')) return;
            
            // Sadece aynı site içindeki linkleri işle
            if (link.hostname === window.location.hostname && 
                !link.href.includes('javascript:') && 
                !link.href.includes('#')) {
                
                // İşlendi olarak işaretle
                link.setAttribute('data-nav-tracked', 'true');
                
                // Orijinal click olayını yedekle
                const originalOnClick = link.onclick;
                
                // Yeni click olayını ekle
                link.addEventListener('click', function(e) {
                    // Ctrl/Cmd tuşuyla tıklanmışsa (yeni sekme açılacak demektir) pas geç
                    if (e.ctrlKey || e.metaKey) return;
                    
                    // Orijinal event çalıştır
                    if (typeof originalOnClick === 'function') {
                        const result = originalOnClick.call(this, e);
                        if (result === false) return false;
                    }
                    
                    // Geçmişi al
                    const history = JSON.parse(sessionStorage.getItem('zekaParkHistory') || '[]');
                    const targetPath = new URL(link.href).pathname;
                    
                    // Son sayfa bu değilse geçmişe ekle
                    if (history.length === 0 || history[history.length - 1].path !== targetPath) {
                        history.push({
                            path: targetPath,
                            title: link.textContent.trim() || link.title || document.title,
                            timestamp: Date.now()
                        });
                        
                        // Güncellenen geçmişi kaydet
                        sessionStorage.setItem('zekaParkHistory', JSON.stringify(history));
                        console.log("✓ Link tıklamasıyla geçmiş güncellendi:", targetPath);
                    }
                });
            }
        });
    }
    
    // Tarayıcı geçmişi olaylarını işle
    function handleHistoryEvents() {
        // Geri düğmesine basılınca
        window.addEventListener('popstate', function() {
            const history = JSON.parse(sessionStorage.getItem('zekaParkHistory') || '[]');
            
            if (history.length > 1) {
                // Son sayfayı çıkar
                history.pop();
                sessionStorage.setItem('zekaParkHistory', JSON.stringify(history));
            }
        });
    }
    
    // Genel animasyon stilleri
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                overflow-x: hidden;
                position: relative;
                width: 100%;
                min-height: 100vh;
                will-change: transform;
                transition: transform 0.3s ease-out;
                touch-action: pan-y;
            }
            
            @media (max-width: 768px) {
                #swipe-area {
                    width: 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Sayfa yükleme animasyonları için
    window.addEventListener('load', function() {
        // Stil ekle
        addStyles();
        
        // Dinamik içerikler yüklendiğinde linkleri kontrol et
        setInterval(setupLinkTracking, 2000);
    });
})();

// Hata önleme sistemi
document.addEventListener('DOMContentLoaded', function() {
    // Oyun sayfalarındaki sorunları önlemek için
    try {
        // Genel hata yakalama
        window.addEventListener('error', function(e) {
            // Belirli hataları sessizce yönet
            if (e.message && 
                (e.message.includes('null is not an object') || 
                 e.message.includes('undefined is not an object'))) {
                
                // Hataları işle ve log yap
                console.warn('⚠️ Hata yakalandı ve ele alındı:', e.message);
                
                // Hatayı ele aldık, daha fazla işleme yok
                e.preventDefault();
                return true;
            }
        });
    } catch(e) {
        console.log('Hata önleme sisteminde hata:', e);
    }
});
