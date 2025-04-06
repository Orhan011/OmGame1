/**
 * Swipe (kaydırma) yöntemiyle navigasyon için yardımcı fonksiyonlar
 * Kullanıcının ekran kenarından başlayarak kaydırma yapması durumunda
 * önceki sayfaya geri dönüş sağlar.
 */

document.addEventListener('DOMContentLoaded', function() {
    initSwipeNavigation();
});

/**
 * Swipe navigasyon fonksiyonunu başlatır
 */
function initSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 100; // Minimum kaydırma mesafesi (px cinsinden)
    const maxInitialOffset = 50; // Kenardan başlatma için maksimum mesafe
    
    // Dokunma başlangıcını izle
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    // Dokunma bitişini izle
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        checkSwipeGesture();
    }, { passive: true });
    
    /**
     * Kaydırma hareketini kontrol eder
     */
    function checkSwipeGesture() {
        // Sağdan sola kaydırma gerekmez (ileriye gitme)
        
        // Soldan sağa kaydırma (geri gitme)
        if (touchEndX - touchStartX > minSwipeDistance && touchStartX < maxInitialOffset) {
            // Kaydırma animasyonu göster
            showSwipeAnimation('right');
            
            // Geçmiş varsa geri git
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Ana sayfaya dön
                window.location.href = '/';
            }
        }
    }
    
    /**
     * Kaydırma animasyonunu gösterir
     */
    function showSwipeAnimation(direction) {
        // Animasyon elementi oluştur
        const animationEl = document.createElement('div');
        animationEl.className = `swipe-animation ${direction}`;
        document.body.appendChild(animationEl);
        
        // Animasyonu göster ve sonra kaldır
        setTimeout(() => {
            animationEl.classList.add('animate');
            
            setTimeout(() => {
                document.body.removeChild(animationEl);
            }, 300); // Animasyon süresi
        }, 10);
    }
}
