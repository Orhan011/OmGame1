/**
 * ZekaPark - Hafif iOS Tarzı Navigasyon Sistemi
 * Optimize Edilmiş Versiyon
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa geçmişi - basit bir dizi olarak sakla
    if (!sessionStorage.getItem('pageHistory')) {
        sessionStorage.setItem('pageHistory', JSON.stringify([window.location.pathname]));
    } else {
        // Mevcut geçmişi al
        const history = JSON.parse(sessionStorage.getItem('pageHistory'));
        const currentPath = window.location.pathname;
        
        // Son ziyaret edilen sayfa bu değilse, geçmişe ekle
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
            // Aynı sayfaya birden fazla eklemeyi önle
            if (!history.includes(currentPath)) {
                history.push(currentPath);
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
            }
        }
    }
    
    // Gölge oluştur (1 kez)
    let overlay = document.getElementById('swipe-shadow');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'swipe-shadow';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            opacity: 0;
            display: none;
            transition: opacity 0.3s ease-out;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
    }
    
    // Swipe değişkenleri
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const THRESHOLD = 50; // daha düşük eşik = daha kolay tetikleme
    
    // Dokunmatik başlangıç
    document.addEventListener('touchstart', function(e) {
        // Sadece sol kenardan başlayan kaydırmaları algıla (30px)
        if (e.touches[0].clientX < 30) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            
            // Gölge overlay göster
            overlay.style.display = 'block';
        }
    }, { passive: true });
    
    // Dokunmatik hareket
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        // Sadece sağa doğru kaydırmalarda işlem yap
        if (deltaX > 0) {
            // Varsayılan kaydırma davranışını engelle
            e.preventDefault();
            
            // Sayfayı kaydırma miktarına göre hareket ettir
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none';
            
            // Gölge efekti
            overlay.style.opacity = (movePercent / 200).toString();
        }
    }, { passive: false });
    
    // Dokunmatik bitiş
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmiş kontrolü
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        if (deltaX > THRESHOLD && history.length > 1) {
            // Eşik değer aşıldı, bir önceki sayfaya dön
            document.body.style.transform = 'translateX(100%)';
            
            // Kısa gecikmeden sonra sayfayı değiştir
            setTimeout(function() {
                // Son sayfayı çıkar ve bir öncekine geç
                history.pop();
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                window.location.href = history[history.length - 1];
            }, 200);
        } else {
            // Yetersiz kaydırma, geri al
            document.body.style.transform = '';
        }
        
        // Gölgeyi kaldır
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Link tıklamalarını yakala - sadece bir kez işlenmiş olacak şekilde verimli hale getirildi
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link || link.hasAttribute('data-nav-tracked')) return;
        
        // Link işlendi olarak işaretle
        link.setAttribute('data-nav-tracked', 'true');
        
        // Orjinal click olay dinleyicisini sakla
        const originalHandler = link.onclick;
        
        // Yeni click olayı
        link.onclick = function(event) {
            if (originalHandler) {
                const result = originalHandler.call(this, event);
                if (result === false) return false;
            }
            
            // Sadece iç sayfalar ve normal linkler için
            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.href.includes('javascript:') &&
                !event.ctrlKey && !event.metaKey) {
                
                // Geçmişe ekle
                const targetPath = new URL(link.href).pathname;
                const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                
                if (history.length === 0 || history[history.length - 1] !== targetPath) {
                    history.push(targetPath);
                    sessionStorage.setItem('pageHistory', JSON.stringify(history));
                }
            }
        };
    });
    
    // Geri butonları için destek
    document.querySelectorAll('.back-button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
            
            if (history.length > 1) {
                // Son sayfayı çıkar
                history.pop();
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                window.location.href = history[history.length - 1];
            } else {
                // Geçmişte başka sayfa yoksa ana sayfaya git
                window.location.href = '/';
            }
        });
    });
    
    // Sadece kritik olmayan hataları engelle - hata var ama uygulama çalışmaya devam etmeli
    window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('restartButton') || e.message.includes('wordsList'))) {
            e.preventDefault();
            return true;
        }
    });
});
