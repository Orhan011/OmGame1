/**
 * ZekaPark - iOS Swipe Navigasyon Sistemi
 * Özelleştirilmiş Geriye Gitme Sistemi
 * 
 * Sayfa geçiş sırası:
 * A -> B -> C -> D ilerlerken
 * D -> C -> B -> A geriye dönerken
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Swipe navigasyon sistemi yükleniyor...");
    
    // Sayfa geçmişini yerel depolamada tut
    if (!sessionStorage.getItem('pageHistory')) {
        sessionStorage.setItem('pageHistory', JSON.stringify([window.location.pathname]));
    } else {
        // Mevcut sayfayı kontrolle ekle
        const history = JSON.parse(sessionStorage.getItem('pageHistory'));
        
        // Eğer son sayfa mevcut sayfa değilse, geçmişe ekle
        if (history[history.length - 1] !== window.location.pathname) {
            history.push(window.location.pathname);
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
        }
    }
    
    console.log("Sayfa geçmişi:", JSON.parse(sessionStorage.getItem('pageHistory')));
    
    // Swipe navigasyon sistemini oluştur
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
            
            // Geçmiş kontrolü
            const history = JSON.parse(sessionStorage.getItem('pageHistory'));
            if (history.length > 1) {
                setTimeout(function() {
                    // Önceki sayfaya git (son eklenen sayfayı geçmişten çıkar)
                    history.pop(); // Mevcut sayfayı çıkar
                    const previousPage = history[history.length - 1];
                    
                    // Geçmişi güncelle
                    sessionStorage.setItem('pageHistory', JSON.stringify(history));
                    
                    // Direkt önceki sayfaya git
                    window.location.href = previousPage;
                }, 300);
            } else {
                // Tek sayfa varsa, stili geri al
                document.body.style.transform = '';
            }
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
    
    // Linkleri takip et (a etiketleri)
    document.querySelectorAll('a').forEach(function(link) {
        if (!link.getAttribute('data-nav-tracked')) {
            link.setAttribute('data-nav-tracked', 'true');
            
            link.addEventListener('click', function(e) {
                // Eğer aynı domain içinde gidiyorsa, geçmişi takip et
                if (link.host === window.location.host && 
                    !link.href.includes('javascript:') && 
                    !link.href.includes('#') &&
                    !e.ctrlKey && !e.metaKey) {
                    
                    // Harici bir link değilse ve javascript: veya # değilse
                    const pathname = new URL(link.href).pathname;
                    
                    // Geçmişi al ve güncelle
                    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                    
                    // Eğer linke tıklanan sayfaya gidilecekse ekleme
                    if (history[history.length - 1] !== pathname) {
                        history.push(pathname);
                        sessionStorage.setItem('pageHistory', JSON.stringify(history));
                    }
                }
            });
        }
    });
    
    // Tarayıcı geri butonunu yakalama (isteğe bağlı)
    window.addEventListener('popstate', function(e) {
        // Tarayıcı geri butonuna basıldığında
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        // Son sayfayı çıkart
        if (history.length > 1) {
            history.pop();
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
        }
    });
});

// Hatalardan kaçınmak için oyun sayfaları için ek kontroller
window.addEventListener('load', function() {
    try {
        // wordsList hatası için
        const wordsList = document.getElementById('wordsList');
        if (wordsList) {
            // wordsList.innerHTML değerini güncellemeden önce kontrol
            const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            const originalInnerHTML = wordsList.innerHTML;
            
            Object.defineProperty(wordsList, 'innerHTML', {
                get: function() {
                    return originalInnerHTML;
                },
                set: function(value) {
                    // Eğer değer null veya undefined ise boş string kullan
                    originalInnerHTMLDescriptor.set.call(this, value || '');
                },
                configurable: true
            });
        }
        
        // restartButton hatası için
        const buttonIds = ['restart-button', 'restart-game', 'restartButton', 'labyrinthRestartButton'];
        
        buttonIds.forEach(function(id) {
            const button = document.getElementById(id);
            if (!button) {
                // Buton yoksa, bir kukla eleman oluştur
                const dummyButton = document.createElement('button');
                dummyButton.id = id;
                dummyButton.style.display = 'none';
                document.body.appendChild(dummyButton);
                
                // Kukla butona boş bir olay dinleyici ekle
                dummyButton.addEventListener('click', function() {
                    console.log(id + ' butonuna tıklandı (kukla eleman)');
                });
            }
        });
    } catch (e) {
        console.log('Hata önleme sistemi çalışırken bir hata oluştu:', e);
    }
});
