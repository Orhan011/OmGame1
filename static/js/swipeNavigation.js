/**
 * ZekaPark - iOS Swipe Navigasyon Sistemi
 * Yeni Versiyon - Hafif ve Verimli
 */

document.addEventListener('DOMContentLoaded', function() {
    // Swipe navigasyon sistemini oluştur - Sayfanın kenarından kaydırma yapmak için
    const swipeOverlay = document.createElement('div');
    swipeOverlay.id = 'swipeOverlay';
    swipeOverlay.className = 'swipe-overlay';
    document.body.appendChild(swipeOverlay);
    
    // Shadow overlay'i de oluştur
    const shadowOverlay = document.createElement('div');
    shadowOverlay.id = 'shadowOverlay';
    shadowOverlay.className = 'shadow-overlay';
    document.body.appendChild(shadowOverlay);
    
    // Global değişkenler
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    let threshold = 50; // kaydırma eşiği (px cinsinden)
    
    // Dokunmatik olayları
    document.addEventListener('touchstart', function(e) {
        // Sadece ekranın sol kenarına yakın dokunuşları algıla
        if (e.touches[0].clientX < 30) {
            touchStartX = e.touches[0].clientX;
            isDragging = true;
            shadowOverlay.style.display = 'block';
            shadowOverlay.style.opacity = '0';
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        if (deltaX > 0) {
            // Varsayılan kaydırma davranışını engelle
            e.preventDefault();
            
            // Sayfayı kaydırma miktarı kadar hareket ettir
            const movePercentage = Math.min(100, (deltaX / window.innerWidth) * 100);
            
            // Sayfayı sağa doğru kaydır
            document.body.style.transform = `translateX(${movePercentage}%)`;
            document.body.style.transition = 'none';
            
            // Gölge efekti
            shadowOverlay.style.opacity = (movePercentage / 100 * 0.5).toString();
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        
        // Geçiş efektlerini geri yükle
        document.body.style.transition = 'transform 0.3s ease-out';
        
        if (deltaX > threshold) {
            // Eşik değeri aşıldı, geri dön
            document.body.style.transform = 'translateX(100%)';
            setTimeout(function() {
                // Sayfa geçişi için history.back() kullan
                window.history.back();
                // Stili sıfırla
                document.body.style.transform = '';
                document.body.style.transition = '';
            }, 300);
        } else {
            // Eşik değeri aşılmadı, mevcut sayfada kal
            document.body.style.transform = '';
        }
        
        // Gölge efektini sıfırla
        shadowOverlay.style.opacity = '0';
        setTimeout(function() {
            shadowOverlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Back butonlarını işlevselleştir
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    });
});
