/**
 * Basitleştirilmiş iOS Tarzı Swipe Navigasyon 
 * ZekaPark için özel olarak geliştirilmiştir
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa geçmişi yönetimi
    const initPageHistory = () => {
        if (!sessionStorage.getItem('pageHistory')) {
            sessionStorage.setItem('pageHistory', JSON.stringify([{
                url: window.location.pathname,
                title: document.title
            }]));
        } else {
            const history = JSON.parse(sessionStorage.getItem('pageHistory'));
            const currentPage = {
                url: window.location.pathname,
                title: document.title
            };

            if (history[history.length - 1].url !== currentPage.url) {
                history.push(currentPage);
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
            }
        }
    };

    initPageHistory();

    // Kaydırma algılama için shadow overlay
    const shadowElement = document.createElement('div');
    shadowElement.id = 'swipe-shadow';
    shadowElement.style.cssText = `
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
        transition: opacity 0.3s;
    `;
    document.body.appendChild(shadowElement);

    // Dokunmatik değişkenler
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Dokunmatik olaylar
    document.addEventListener('touchstart', function(e) {
        if (e.touches[0].clientX <= 15) {
            startX = e.touches[0].clientX;
            isDragging = true;
            shadowElement.style.display = 'block';
            e.preventDefault();
        }
    }, {passive: false});

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        if (deltaX > 0) {
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none';
            shadowElement.style.opacity = movePercent / 200;
            e.preventDefault();
        }
    }, {passive: false});

    document.addEventListener('touchend', function() {
        if (!isDragging) return;

        const deltaX = currentX - startX;
        document.body.style.transition = 'transform 0.3s ease-out';

        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');

        if (deltaX > 50 && history.length > 1) {
            document.body.style.transform = 'translateX(100%)';

            setTimeout(() => {
                history.pop();
                const previousPage = history[history.length - 1];
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                window.location.href = previousPage.url;
            }, 300);
        } else {
            document.body.style.transform = '';
        }

        shadowElement.style.opacity = '0';
        setTimeout(() => {
            shadowElement.style.display = 'none';
        }, 300);

        isDragging = false;
    });

    // Sayfa bağlantılarını işle
    document.querySelectorAll('a').forEach(link => {
        if (link.hostname === window.location.hostname && 
            !link.getAttribute('data-tracked')) {

            link.setAttribute('data-tracked', 'true');
            const originalClick = link.onclick;

            link.addEventListener('click', function(e) {
                if (originalClick) {
                    const result = originalClick.call(this, e);
                    if (result === false) return false;
                }

                if (!link.href.includes('javascript:') && 
                    !link.href.includes('#') && 
                    !e.ctrlKey && !e.metaKey) {

                    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                    const targetPage = {
                        url: new URL(link.href).pathname,
                        title: link.title || document.title
                    };

                    if (history[history.length - 1].url !== targetPage.url) {
                        history.push(targetPage);
                        sessionStorage.setItem('pageHistory', JSON.stringify(history));
                    }
                }
            });
        }
    });

    // Saf CSS ekle
    const style = document.createElement('style');
    style.textContent = `
        body {
            overflow-x: hidden;
            position: relative;
            width: 100%;
            will-change: transform;
            transition: transform 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});