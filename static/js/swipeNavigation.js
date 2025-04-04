/**
 * ZekaPark iOS Tarzı Navigasyon Sistemi
 * Sayfa Geçmişli Navigasyon: A→B→C→D şeklinde ziyaret, D→C→B→A şeklinde geri dönüş
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("==== ZekaPark Swipe Navigasyon Sistemi Başlatılıyor ====");

    // Sayfa geçmişi yönetimi
    class NavigationHistory {
        constructor() {
            this.history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
            this.currentPath = window.location.pathname;
            this.maxHistoryLength = 50;
        }

        init() {
            if (!this.hasPath(this.currentPath)) {
                this.add(this.currentPath);
                this.save();
            }
            console.log("Mevcut sayfa geçmişi:", this.history);
        }

        hasPath(path) {
            return this.history.includes(path);
        }

        add(path) {
            if (path === '/') return;

            // Aynı sayfaya tekrar gidilirse, önceki kaydı sil
            const existingIndex = this.history.indexOf(path);
            if (existingIndex !== -1) {
                this.history.splice(existingIndex, 1);
            }

            if (this.history.length >= this.maxHistoryLength) {
                this.history.shift();
            }
            this.history.push(path);
        }

        removeLast() {
            if (this.history.length <= 1) return '/';
            return this.history.pop();
        }

        clear() {
            this.history = [];
        }

        getPrevious() {
            if (this.history.length <= 1) return '/';
            const prevPath = this.history[this.history.length - 2];
            return prevPath || '/';
        }

        save() {
            localStorage.setItem('siteHistory', JSON.stringify(this.history));
        }
    }

    const navHistory = new NavigationHistory();
    navHistory.init();

    // Dokunmatik yönetimi
    class TouchHandler {
        constructor() {
            this.startX = 0;
            this.moveX = 0;
            this.isDragging = false;
            this.threshold = Math.max(50, window.innerWidth * 0.15);
            this.setupOverlay();
        }

        setupOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.id = 'swipe-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.3));
                z-index: 9999;
                opacity: 0;
                display: none;
                transition: opacity 0.3s ease-out;
                pointer-events: none;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
            `;
            document.body.appendChild(this.overlay);
        }

        handleStart(e) {
            if (e.touches[0].clientX < 20) {
                this.startX = this.moveX = e.touches[0].clientX;
                this.isDragging = true;
                this.overlay.style.display = 'block';
                document.body.style.transition = 'none';
            }
        }

        handleMove(e) {
            if (!this.isDragging) return;

            this.moveX = e.touches[0].clientX;
            const moveDistance = this.moveX - this.startX;

            if (moveDistance > 0) {
                e.preventDefault();
                const movePercent = Math.min((moveDistance / window.innerWidth) * 100, 100);
                document.body.style.transform = `translateX(${movePercent}%)`;
                this.overlay.style.opacity = movePercent / 200;
            }
        }

        handleEnd() {
            if (!this.isDragging) return;

            const moveDistance = this.moveX - this.startX;
            document.body.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            if (moveDistance > this.threshold && navHistory.history.length > 1) {
                this.navigateBack();
            } else {
                this.resetPosition();
            }

            this.isDragging = false;
        }

        navigateBack() {
            document.body.style.transform = 'translateX(100%)';
            this.overlay.style.opacity = '0.5';

            setTimeout(() => {
                navHistory.removeLast();
                navHistory.save();
                window.location.href = navHistory.getPrevious();
            }, 300);
        }

        resetPosition() {
            document.body.style.transform = '';
            this.overlay.style.opacity = '0';
            setTimeout(() => this.overlay.style.display = 'none', 300);
        }
    }

    const touchHandler = new TouchHandler();

    // Event Listeners
    document.addEventListener('touchstart', e => touchHandler.handleStart(e), { passive: true });
    document.addEventListener('touchmove', e => touchHandler.handleMove(e), { passive: false });
    document.addEventListener('touchend', () => touchHandler.handleEnd());

    // Link tıklama yönetimi
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link || link.getAttribute('data-swipe-tracked')) return;

        link.setAttribute('data-swipe-tracked', 'true');
        const originalClick = link.onclick;

        link.onclick = function(e) {
            if (originalClick && originalClick.call(this, e) === false) return false;

            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.href.includes('javascript:') &&
                !e.ctrlKey && !e.metaKey) {

                const targetPath = new URL(link.href).pathname;
                if (targetPath === '/') {
                    navHistory.clear();
                } else if (!navHistory.hasPath(targetPath)) {
                    navHistory.add(targetPath);
                }
                navHistory.save();
                console.log("Geçmişe eklendi:", targetPath);
            }
        };
    });

    // Geri butonları
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (navHistory.history.length > 1) {
                navHistory.removeLast();
                navHistory.save();
                window.location.href = navHistory.getPrevious();
            } else {
                window.location.href = '/';
            }
        });
    });

    // Tarayıcı geri butonu
    window.addEventListener('popstate', function() {
        if (navHistory.history.length > 1) {
            navHistory.removeLast();
            navHistory.save();
        }
    });
});

// Hata yönetimi
window.addEventListener('error', function(e) {
    console.log("Hata giderme mekanizması ile yakalandı:", e.message);
    if (e.message.includes('null') || e.message.includes('undefined')) {
        e.preventDefault();
        return true;
    }
});