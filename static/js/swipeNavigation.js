// ZekaPark - Swipe Back Navigasyon Sistemi
// Sayfalar arasında iOS tarzı geriye gitme (sağa kaydırarak)

(function() {
    // Sayfa yüklendiğinde çalış
    window.addEventListener('DOMContentLoaded', function() {
        console.log("📱 Swipe Back sistemi başlatılıyor");
        setupSwipeBack();
    });
    
    // Ana kurulum fonksiyonu
    function setupSwipeBack() {
        // Sayfayı localStorage'da kaydetme
        if (!localStorage.getItem('pageHistory')) {
            // İlk sayfa
            localStorage.setItem('pageHistory', JSON.stringify([window.location.pathname]));
        } else {
            const history = JSON.parse(localStorage.getItem('pageHistory'));
            const currentPath = window.location.pathname;
            
            // Eğer yeni bir sayfadaysak ve son sayfa bu değilse, geçmişe ekle
            if (history.length === 0 || history[history.length - 1] !== currentPath) {
                // Aynı sayfaya tekrar tekrar eklemeyi önle
                if (!history.includes(currentPath)) {
                    history.push(currentPath);
                    localStorage.setItem('pageHistory', JSON.stringify(history));
                }
            }
        }
        
        // Geçiş durumu değişkenler
        let startX = 0;
        let moveX = 0;
        let isDragging = false;
        
        // Gölge elementi ekle
        const shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'swipe-shadow';
        shadowOverlay.style.cssText = `
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.5); 
            z-index: 9999; 
            display: none; 
            opacity: 0; 
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        document.body.appendChild(shadowOverlay);
        
        // Touch olaylarını ekle
        document.addEventListener('touchstart', function(e) {
            // Sadece ekranın sol kenarından kaydırmaları algıla (20px)
            if (e.touches[0].clientX <= 20) {
                startX = e.touches[0].clientX;
                isDragging = true;
                shadowOverlay.style.display = 'block';
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            moveX = e.touches[0].clientX;
            const delta = moveX - startX;
            
            // Sadece sağa kaydırma işlemlerini ele al (0'dan büyük delta)
            if (delta > 0) {
                // Kaydırma etkisi
                const movePercent = Math.min(100, delta / window.innerWidth * 100);
                
                // Body'yi sağa kaydır
                document.body.style.transform = `translateX(${movePercent}%)`;
                document.body.style.transition = 'none';
                
                // Gölge efekti göster
                shadowOverlay.style.opacity = movePercent / 200;
                
                // Varsayılan kaydırma davranışını engelle
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
            if (!isDragging) return;
            
            // Kaydırma mesafesi
            const delta = moveX - startX;
            
            // Geçiş animasyonunu etkinleştir
            document.body.style.transition = 'transform 0.3s ease-out';
            
            // Geçmiş
            const history = JSON.parse(localStorage.getItem('pageHistory') || '[]');
            
            // Yeterince kaydırıldı mı ve geçmişte gezinebilir miyiz?
            if (delta > 50 && history.length > 1) {
                // Geçiş animasyonu
                document.body.style.transform = 'translateX(100%)';
                
                // Animasyon için bir gecikme ve sonra önceki sayfaya git
                setTimeout(function() {
                    // Son sayfayı çıkar
                    history.pop();
                    const previousPage = history[history.length - 1];
                    
                    // Güncellenmiş geçmişi kaydet
                    localStorage.setItem('pageHistory', JSON.stringify(history));
                    
                    // Önceki sayfaya git
                    window.location.href = previousPage;
                }, 250);
            } else {
                // Yeterince kaydırılmadıysa geri al
                document.body.style.transform = '';
            }
            
            // Gölge efektini kapat
            shadowOverlay.style.opacity = '0';
            setTimeout(function() {
                shadowOverlay.style.display = 'none';
            }, 300);
            
            isDragging = false;
        });
        
        // Sayfadaki tüm linkleri izle
        document.querySelectorAll('a').forEach(function(link) {
            // Sadece aynı domain içindeki linkleri izle
            if (link.hostname === window.location.hostname && 
                !link.getAttribute('data-swipe-tracked') &&
                !link.href.includes('javascript:') && 
                !link.href.includes('#')) {
                
                link.setAttribute('data-swipe-tracked', 'true');
                
                // Tıklama olayı
                link.addEventListener('click', function(e) {
                    // Ctrl veya Command tuşuyla tıklama, yeni sekmede açılıyor demektir
                    if (e.ctrlKey || e.metaKey) return;
                    
                    // Linklerin varsayılan davranışını koru
                    const history = JSON.parse(localStorage.getItem('pageHistory') || '[]');
                    const targetPath = new URL(link.href).pathname;
                    
                    // Geçmişi güncelle, aynı yolu tekrar tekrar ekleme
                    if (!history.includes(targetPath)) {
                        history.push(targetPath);
                        localStorage.setItem('pageHistory', JSON.stringify(history));
                    }
                });
            }
        });
    }
    
    // Geriye dönüş için window.history.back olayını yakalama
    window.addEventListener('popstate', function() {
        const history = JSON.parse(localStorage.getItem('pageHistory') || '[]');
        
        if (history.length > 0) {
            // Son sayfayı çıkar 
            history.pop();
            localStorage.setItem('pageHistory', JSON.stringify(history));
        }
    });
    
    // URL değişikliklerini izleme
    let lastUrl = window.location.href;
    const urlWatcher = function() {
        const url = window.location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            const history = JSON.parse(localStorage.getItem('pageHistory') || '[]');
            const currentPath = window.location.pathname;
            
            // URL değiştiğinde geçmişi güncelle
            if (history.length === 0 || history[history.length - 1] !== currentPath) {
                if (!history.includes(currentPath)) {
                    history.push(currentPath);
                    localStorage.setItem('pageHistory', JSON.stringify(history));
                }
            }
        }
        
        // Sürekli kontrol et
        setTimeout(urlWatcher, 500);
    };
    
    // Başlat
    setTimeout(urlWatcher, 500);
})();

// Oyun sayfalarındaki hataları önlemek için güvenlik kodu
window.addEventListener('DOMContentLoaded', function() {
    // Hata yakalama
    try {
        // Oyun elementleri
        if (typeof wordsList === 'undefined' || wordsList === null) {
            window.wordsList = {
                innerHTML: '',
                getAttribute: function() { return false; },
                addEventListener: function() {}
            };
        }
        
        if (typeof restartButton === 'undefined' || restartButton === null) {
            window.restartButton = {
                addEventListener: function() {},
                getAttribute: function() { return false; }
            };
        }
    } catch (e) {
        console.log('Hata önleme hatası:', e);
    }
});

// Sayfa stili için gerekli CSS
document.addEventListener('DOMContentLoaded', function() {
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
    `;
    document.head.appendChild(style);
});
