/**
 * iOS Tarzı Sağa Kaydırma ile Navigasyon Sistemi
 * Özel ZekaPark Uygulaması için geliştirilmiştir.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Yeni iOS navigasyon sistemi yükleniyor...");
    
    // Temel HTML yapısı
    const pageContainerId = 'pageContainer';
    let pageContainer = document.getElementById(pageContainerId);
    
    // Eğer pageContainer yoksa, oluştur ve body'nin ilk çocuğu olarak ekle
    if (!pageContainer) {
        pageContainer = document.createElement('div');
        pageContainer.id = pageContainerId;
        pageContainer.className = 'page-container';
        
        // Mevcut body içeriğini kopyala
        const bodyContent = document.body.innerHTML;
        
        // İlk sayfa olarak ekle
        document.body.innerHTML = '';
        document.body.appendChild(pageContainer);
        
        const homePage = document.createElement('div');
        homePage.id = 'page-home';
        homePage.className = 'page active';
        homePage.innerHTML = bodyContent;
        pageContainer.appendChild(homePage);
        
        // Gölge overlay ekle
        const shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'shadowOverlay';
        shadowOverlay.className = 'shadow-overlay';
        pageContainer.appendChild(shadowOverlay);
    }
    
    // Sayfa geçmişini takip et - Session kullanımına geç
    if (!sessionStorage.getItem('pageHistory')) {
        // Ana sayfadaysak, geçmişi sıfırla
        const initialHistory = JSON.stringify([{
            id: 'page-home',
            url: window.location.pathname,
            title: document.title
        }]);
        sessionStorage.setItem('pageHistory', initialHistory);
        sessionStorage.setItem('currentPageId', 'page-home');
    } else {
        // Durumu kontrol et - mevcut sayfa geçmişte var mı?
        const history = JSON.parse(sessionStorage.getItem('pageHistory'));
        const currentUrl = window.location.pathname;
        
        // Eğer son sayfa mevcut URL değilse (yeni bir sayfaya geldik)
        if (history.length > 0 && history[history.length - 1].url !== currentUrl) {
            // URL adresini kontrol et ve yeni bir sayfa olarak ekle
            const newPageId = 'page-' + Math.random().toString(36).substr(2, 9);
            const newPage = {
                id: newPageId,
                url: currentUrl,
                title: document.title
            };
            
            history.push(newPage);
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
            sessionStorage.setItem('currentPageId', newPageId);
            
            console.log("Yeni sayfa geçmişe eklendi:", newPage);
        }
    }
    
    // Log for debugging
    console.log("Sayfa geçmişi (JSON):", sessionStorage.getItem('pageHistory'));
    
    // Swipe için değişkenler
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const threshold = 50; // px cinsinden eşik değeri
    
    // Dokunmatik olayları
    document.addEventListener('touchstart', function(e) {
        // Sadece ekranın sol kenarında başlayan dokunuşları algıla (20px)
        if (e.touches[0].clientX < 20) {
            touchStartX = e.touches[0].clientX;
            isDragging = true;
            
            // Gölge efekti göster
            const shadowOverlay = document.getElementById('shadowOverlay');
            if (shadowOverlay) {
                shadowOverlay.style.display = 'block';
                shadowOverlay.style.opacity = '0';
            }
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        if (deltaX > 0) {
            // Varsayılan kaydırma davranışını engelle
            e.preventDefault();
            
            // Animasyon ile sayfayı sağa kaydır
            const movePercentage = Math.min(100, (deltaX / window.innerWidth) * 100);
            document.body.style.transform = `translateX(${movePercentage}%)`;
            document.body.style.transition = 'none';
            
            // Gölge efekti
            const shadowOverlay = document.getElementById('shadowOverlay');
            if (shadowOverlay) {
                shadowOverlay.style.opacity = (movePercentage / 100 * 0.5).toString();
            }
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        
        // Geçiş animasyonunu geri yükle
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmişi al
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        if (deltaX > threshold && history.length > 1) {
            // Kaydırma eşiği aşıldı ve geçmişte sayfa var - geri dön
            document.body.style.transform = 'translateX(100%)';
            
            setTimeout(function() {
                // Geçmişten son sayfayı çıkar (şu anki sayfa)
                history.pop();
                const previousPage = history[history.length - 1];
                
                // Geçmişi güncelle
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                sessionStorage.setItem('currentPageId', previousPage.id);
                
                // Önceki sayfaya git 
                window.location.href = previousPage.url;
            }, 300);
        } else {
            // Eşik değeri aşılmadı veya geçmişte sayfa yok - aynı sayfada kal
            document.body.style.transform = '';
        }
        
        // Gölge efektini sıfırla
        const shadowOverlay = document.getElementById('shadowOverlay');
        if (shadowOverlay) {
            shadowOverlay.style.opacity = '0';
            setTimeout(() => { shadowOverlay.style.display = 'none'; }, 300);
        }
        
        isDragging = false;
    });
    
    // Tüm linkleri izle ve eğer iç link ise geçmişi güncelle
    document.addEventListener('click', function(e) {
        const closestLink = e.target.closest('a');
        
        if (closestLink && !closestLink.getAttribute('data-swipe-tracked')) {
            closestLink.setAttribute('data-swipe-tracked', 'true');
            
            const originalClickHandler = closestLink.onclick;
            
            closestLink.onclick = function(e) {
                // Orijinal click işleyicisi varsa çalıştır
                if (originalClickHandler) {
                    const result = originalClickHandler.call(this, e);
                    if (result === false) return false;
                }
                
                // Aynı origin içerisindeki linkler için
                if (closestLink.origin === window.location.origin &&
                    !closestLink.href.includes('#') &&
                    !closestLink.href.includes('javascript:') &&
                    !e.ctrlKey && !e.metaKey) {
                    
                    // Geçmişi al
                    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                    
                    // URL farklıysa geçmişe ekle
                    const targetUrl = new URL(closestLink.href).pathname;
                    if (history.length === 0 || history[history.length - 1].url !== targetUrl) {
                        const newPageId = 'page-' + Math.random().toString(36).substr(2, 9);
                        history.push({
                            id: newPageId,
                            url: targetUrl,
                            title: closestLink.textContent.trim() || document.title
                        });
                        
                        sessionStorage.setItem('pageHistory', JSON.stringify(history));
                        sessionStorage.setItem('currentPageId', newPageId);
                        
                        console.log("Link tıklaması ile geçmişe eklendi:", targetUrl);
                    }
                }
            };
        }
    });
    
    // Geriye gitme butonları için destek
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(function(button) {
        if (!button.getAttribute('data-back-tracked')) {
            button.setAttribute('data-back-tracked', 'true');
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Geçmişi al
                const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                
                if (history.length > 1) {
                    // Şu anki sayfayı çıkar
                    history.pop();
                    const previousPage = history[history.length - 1];
                    
                    // Geçmişi güncelle
                    sessionStorage.setItem('pageHistory', JSON.stringify(history));
                    sessionStorage.setItem('currentPageId', previousPage.id);
                    
                    // Önceki sayfaya git
                    window.location.href = previousPage.url;
                }
            });
        }
    });
    
    // Sayfanın ilk yüklenişinde stil ekle
    const style = document.createElement('style');
    style.textContent = `
        body {
            overflow-x: hidden;
            position: relative;
            min-height: 100vh;
            will-change: transform;
            transition: transform 0.3s ease-out;
        }
        
        .page-container {
            position: relative;
            min-height: 100vh;
            width: 100%;
            overflow-x: hidden;
        }
        
        .page {
            width: 100%;
            min-height: 100vh;
            position: relative;
        }
        
        .shadow-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            pointer-events: none;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});

// Sayfalar arası iyileştirilmiş geçiş
window.addEventListener('pageshow', function(event) {
    // Önceki sayfadan geri döndüğümüzde (tarayıcı geri butonu)
    if (event.persisted) {
        // Geçmişi güncelle
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        if (history.length > 1) {
            // Son sayfayı çıkar (çünkü geri geliyoruz)
            history.pop();
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
            sessionStorage.setItem('currentPageId', history[history.length - 1].id);
        }
    }
});

// Hata önleme için genel hata yakalama
window.addEventListener('error', function(e) {
    // Kritik olmayan hatalarla baş et
    if (e.message.includes('null') && 
        (e.message.includes('addEventListener') || 
         e.message.includes('innerHTML'))) {
        console.warn('Önlenen hata:', e.message);
        e.preventDefault();
        return true;
    }
});
