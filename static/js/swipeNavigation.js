/**
 * ZekaPark - iOS Swipe Navigasyon Sistemi
 * Yeni Versiyon - Geliştirilmiş Sürüm
 */

document.addEventListener('DOMContentLoaded', function() {
    // Ziyaret edilen sayfaları takip et
    if (!window.visitedPages) {
        window.visitedPages = [window.location.pathname];
    }

    // Sayfa yüklendiğinde geçmiş kaydını güncelle
    if (!window.visitedPages.includes(window.location.pathname)) {
        window.visitedPages.push(window.location.pathname);
    }

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
                // Özel navigasyon fonksiyonumuzu kullan
                goToPreviousPage();
                
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
            goToPreviousPage();
        });
    });
    
    // Özel navigasyon fonksiyonu
    function goToPreviousPage() {
        if (window.visitedPages.length > 1) {
            // Son ziyaret edilen sayfayı sil
            window.visitedPages.pop();
            
            // Bir önceki sayfaya git
            const previousPage = window.visitedPages[window.visitedPages.length - 1];
            
            // Tarayıcı geçmişini de güncelle
            window.location.href = previousPage;
        } else {
            // Geçmişte sayfa yoksa ana sayfaya git
            window.location.href = '/';
        }
    }
    
    // Sayfa bağlantılarını takip et
    document.querySelectorAll('a').forEach(function(link) {
        // Eğer link zaten bir olay dinleyicisi varsa ekleme
        if (link.getAttribute('data-navigation-handled')) return;
        
        const originalClick = link.onclick;
        
        link.addEventListener('click', function(e) {
            // Orijinal tıklama olayını çalıştır
            if (originalClick) {
                const result = originalClick.call(this, e);
                if (result === false) return false;
            }
            
            // Eğer link dış bağlantı değilse
            if (link.hostname === window.location.hostname && 
                !link.href.startsWith('javascript:') && 
                !link.href.startsWith('#') && 
                !e.ctrlKey && !e.metaKey) {
                
                // Yeni sayfayı geçmişe ekle
                if (!window.visitedPages.includes(link.pathname)) {
                    window.visitedPages.push(link.pathname);
                }
            }
        });
        
        // Bu linkin işlendiğini işaretle
        link.setAttribute('data-navigation-handled', 'true');
    });
});

// Hata ayıklama - Buton hataları için
document.addEventListener('DOMContentLoaded', function() {
    // Oyun sayfalarındaki hataları düzeltmek için
    // Olmayan elemanların kontrol edilmesi
    const errorPreventionHandler = function() {
        // restartButton hatası için
        const buttons = [
            'restart-button', 'restart-game', 'restartButton', 
            'labyrinthRestartButton'
        ];
        
        buttons.forEach(function(buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                if (!button.getAttribute('data-handler-attached')) {
                    button.setAttribute('data-handler-attached', 'true');
                }
            }
        });
        
        // wordsList hatası için
        const wordsList = document.getElementById('wordsList');
        if (wordsList) {
            if (!wordsList.getAttribute('data-handler-attached')) {
                wordsList.setAttribute('data-handler-attached', 'true');
            }
        }
    };
    
    // Sayfa yüklendiğinde ve dinamik içerik eklendiğinde çağır
    errorPreventionHandler();
    
    // MutationObserver ile DOM değişikliklerini izle
    const observer = new MutationObserver(function(mutations) {
        errorPreventionHandler();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
});
