/**
 * ZekaPark iOS Tarzı Navigasyon Sistemi
 * Sayfa Geçmişli Navigasyon: A→B→C→D şeklinde ziyaret, D→C→B→A şeklinde geri dönüş
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("==== ZekaPark Swipe Navigasyon Sistemi Başlatılıyor ====");

    // Sayfa geçmişini kontrol et ve güncelle
    let currentPath = window.location.pathname;
    let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');

    // Ana sayfada geçmişi sıfırla
    if (currentPath === '/') {
        history = ['/'];
    } 
    // Geçmişte olmayan bir sayfaya geldiyse ekle
    else if (history[history.length - 1] !== currentPath) {
        history.push(currentPath);
    }

    localStorage.setItem('siteHistory', JSON.stringify(history));
    console.log("Mevcut sayfa geçmişi:", history);

    // Dokunmatik değişkenler
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;

    // Gölge efekti
    const overlay = document.createElement('div');
    overlay.id = 'swipe-overlay';
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

    // Dokunmatik olaylar
    document.addEventListener('touchstart', function(e) {
        if (e.touches[0].clientX < 20) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            overlay.style.display = 'block';
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        touchMoveX = e.touches[0].clientX;
        const moveDistance = touchMoveX - touchStartX;

        if (moveDistance > 0) {
            e.preventDefault();
            const maxMove = window.innerWidth;
            const movePercent = Math.min((moveDistance / maxMove) * 100, 100);

            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none';
            overlay.style.opacity = movePercent / 200;
        }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;

        const moveDistance = touchMoveX - touchStartX;
        document.body.style.transition = 'transform 0.3s ease-out';

        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        const threshold = Math.max(50, window.innerWidth * 0.15);

        if (moveDistance > threshold && history.length > 1) {
            document.body.style.transform = 'translateX(100%)';
            overlay.style.opacity = '0.5';

            setTimeout(function() {
                // Son sayfayı sil ve önceki sayfaya git
                history.pop();
                localStorage.setItem('siteHistory', JSON.stringify(history));
                window.location.href = history[history.length - 1];
            }, 300);
        } else {
            document.body.style.transform = '';
        }

        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
        isDragging = false;
    });

    // Link tıklamaları
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link || link.getAttribute('data-swipe-tracked')) return;

        link.setAttribute('data-swipe-tracked', 'true');
        const originalClick = link.onclick;

        link.onclick = function(e) {
            if (originalClick) {
                const result = originalClick.call(this, e);
                if (result === false) return false;
            }

            // Sadece iç bağlantılar için geçerli
            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.href.includes('javascript:') &&
                !e.ctrlKey && !e.metaKey) {

                const targetPath = new URL(link.href).pathname;
                let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');

                // Ana sayfaya gidiyorsa geçmişi sıfırla
                if (targetPath === '/') {
                    history = ['/'];
                }
                // Değilse ve önceki ziyaretlerden farklıysa ekle
                else if (history[history.length - 1] !== targetPath) {
                    history.push(targetPath);
                }

                localStorage.setItem('siteHistory', JSON.stringify(history));
                console.log("Geçmişe eklendi:", targetPath);
            }
        };
    });

    // Geri butonları
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');

            if (history.length > 1) {
                history.pop();
                localStorage.setItem('siteHistory', JSON.stringify(history));
                window.location.href = history[history.length - 1];
            } else {
                window.location.href = '/';
            }
        });
    });

    // Tarayıcı geri butonu
    window.addEventListener('popstate', function(e) {
        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        if (history.length > 1) {
            history.pop();
            localStorage.setItem('siteHistory', JSON.stringify(history));
        }
    });
});

// Hata giderme mekanizması
window.addEventListener('error', function(e) {
    if (e.message.includes('null') || e.message.includes('undefined')) {
        console.log("Hata giderme mekanizması ile yakalandı:", e.message);
        e.preventDefault();
        return true;
    }
});