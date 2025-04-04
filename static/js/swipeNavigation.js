/**
 * ZekaPark - iOS Tarzı Sayfa Navigasyon Sistemi
 * Tam iOS benzeri kaydırma hareketi ve sayfa geçişleri
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("iOS tarzı navigasyon sistemi başlatıldı");
    
    // Navigasyon için gerekli değişkenler
    let pageHistory = [];
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const THRESHOLD = 50; // Kaydırma eşiği (px)
    
    // Sayfa konteynerı ve gölge element
    const mainContainer = document.querySelector('main.container');
    
    // Gölge overlay elementi oluştur
    let shadowOverlay = document.getElementById('shadowOverlay');
    if (!shadowOverlay) {
        shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'shadowOverlay';
        shadowOverlay.classList.add('shadow-overlay');
        document.body.appendChild(shadowOverlay);
    }
    
    // Sayfa geçmişini başlat
    if (!sessionStorage.getItem('pageHistory')) {
        sessionStorage.setItem('pageHistory', JSON.stringify([window.location.pathname]));
    } else {
        // Mevcut sayfayı kontrol et ve geçmişe ekle
        const history = JSON.parse(sessionStorage.getItem('pageHistory'));
        const currentPath = window.location.pathname;
        
        // Sayfa yenileme durumunu kontrol et
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
            history.push(currentPath);
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
        }
    }
    
    // Dokunmatik başlangıç - sol kenardan kaydırma algılama
    document.addEventListener('touchstart', function(e) {
        if (e.touches[0].clientX < 30) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            
            // Gölge efektini hazırla
            shadowOverlay.style.display = 'block';
            shadowOverlay.style.opacity = '0';
            
            // Geçmiş kontrolü
            const history = JSON.parse(sessionStorage.getItem('pageHistory'));
            if (history.length > 1) {
                // Animasyonu hazırla
                document.body.style.transition = 'none';
            }
        }
    }, {passive: true});
    
    // Dokunmatik hareket takibi
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        // Sadece sağa doğru kaydırma için işlem yap
        if (deltaX > 0) {
            e.preventDefault(); // Sayfanın yatay kaydırmasını engelle
            
            // Geçmiş kontrolü
            const history = JSON.parse(sessionStorage.getItem('pageHistory'));
            if (history.length <= 1) return;
            
            // Sayfayı kaydırma miktarına göre hareket ettir
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            
            // Sayfa kayma animasyonu
            document.body.style.transform = `translateX(${movePercent}%)`;
            
            // Gölge efekti - iOS'taki gibi gölge göster
            const opacity = movePercent / 200;  // 0.5'e kadar opaklık
            shadowOverlay.style.opacity = opacity.toString();
        }
    }, {passive: false});
    
    // Dokunmatik bitiş - kaydırma tamamlandı
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        // Geçiş animasyonlarını yeniden etkinleştir
        document.body.style.transition = 'transform 0.3s ease-out';
        
        if (deltaX > THRESHOLD && history.length > 1) {
            // Eşik değer aşıldı, geri git
            document.body.style.transform = 'translateX(100%)';  // Sayfayı sağa kaydır
            
            // Sayfa geçişi için kısa bir gecikme
            setTimeout(function() {
                // Son sayfayı geçmişten çıkar
                history.pop();
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                window.location.href = history[history.length - 1];
            }, 250);
        } else {
            // Eşik değer aşılmadı, geri alma
            document.body.style.transform = '';
        }
        
        // Gölge efektini temizle
        shadowOverlay.style.opacity = '0';
        setTimeout(() => {
            shadowOverlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Geri butonları için destek
    document.querySelectorAll('.back-button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
            
            if (history.length > 1) {
                // Geri gitmeden önce sayfayı sağa kaydır
                document.body.style.transition = 'transform 0.2s ease-out';
                document.body.style.transform = 'translateX(100%)';
                
                setTimeout(function() {
                    // Son sayfayı çıkar
                    history.pop();
                    sessionStorage.setItem('pageHistory', JSON.stringify(history));
                    
                    // Önceki sayfaya git
                    window.location.href = history[history.length - 1];
                }, 150);
            }
        });
    });
    
    // Linkleri izle ve geçmişe ekle
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Sadece iç sayfalar için
        if (link.host === window.location.host && 
            !link.href.includes('#') && 
            !link.target && 
            !e.ctrlKey && !e.metaKey) {
            
            // Tıklanan sayfayı geçmişe ekle
            const path = new URL(link.href).pathname;
            const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
            
            // Son sayfa ziyaret edilecek sayfa değilse ekle
            if (history.length === 0 || history[history.length - 1] !== path) {
                history.push(path);
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
            }
        }
    });
});
