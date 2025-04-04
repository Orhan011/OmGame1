/**
 * Basitleştirilmiş iOS Tarzı Swipe Navigasyon 
 * ZekaPark için özel olarak geliştirilmiştir
 */

document.addEventListener('DOMContentLoaded', function() {
    // Basit bir geçmiş tutma sistemi
    if (!sessionStorage.getItem('pageHistory')) {
        // İlk sayfa için geçmişi oluştur
        sessionStorage.setItem('pageHistory', JSON.stringify([window.location.pathname]));
    } else {
        // Mevcut durumu kontrol et
        const history = JSON.parse(sessionStorage.getItem('pageHistory'));
        const currentPath = window.location.pathname;
        
        // Eğer farklı bir sayfadaysak ve son sayfa bu sayfa değilse ekle
        if (history[history.length - 1] !== currentPath) {
            history.push(currentPath);
            sessionStorage.setItem('pageHistory', JSON.stringify(history));
        }
    }
    
    // Kaydırma algılama için shadow overlay ekle
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
        // Sadece sol kenardan başlayan kaydırmaları algıla (15px)
        if (e.touches[0].clientX <= 15) {
            startX = e.touches[0].clientX;
            isDragging = true;
            
            // Gölgeyi hazırla
            shadowElement.style.display = 'block';
            
            // Tarayıcı varsayılan davranışını engelle
            e.preventDefault();
        }
    }, {passive: false});
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Sağa doğru kaydırıldıysa
        if (deltaX > 0) {
            // Sayfayı hareket ettir
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none';
            
            // Gölge efekti
            shadowElement.style.opacity = movePercent / 200;
            
            // Tarayıcı varsayılan davranışını engelle
            e.preventDefault();
        }
    }, {passive: false});
    
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        // Kaydırma mesafesini hesapla
        const deltaX = currentX - startX;
        
        // Geçiş animasyonunu geri yükle
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmişi al
        const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
        
        // Yeterince kaydırıldı mı? (50px)
        if (deltaX > 50 && history.length > 1) {
            // Geri dönüş animasyonu
            document.body.style.transform = 'translateX(100%)';
            
            // 300ms sonra önceki sayfaya git
            setTimeout(() => {
                // Son sayfayı çıkar ve önceki sayfaya git
                history.pop();
                const previousPage = history[history.length - 1];
                
                // Geçmişi güncelle
                sessionStorage.setItem('pageHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                window.location.href = previousPage;
            }, 300);
        } else {
            // Yeterli değilse geri al
            document.body.style.transform = '';
        }
        
        // Gölgeyi kapat
        shadowElement.style.opacity = '0';
        setTimeout(() => {
            shadowElement.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Sayfa bağlantılarını işle
    document.querySelectorAll('a').forEach(link => {
        // Sadece aynı domain içindeki ve işlenmemiş bağlantılar
        if (link.hostname === window.location.hostname && 
            !link.getAttribute('data-tracked')) {
            
            link.setAttribute('data-tracked', 'true');
            
            // Orijinal click işleyiciyi sakla
            const originalClick = link.onclick;
            
            // Yeni click işleyici
            link.addEventListener('click', function(e) {
                // Eğer orijinal click işleyici varsa çalıştır
                if (originalClick) {
                    const result = originalClick.call(this, e);
                    if (result === false) return false;
                }
                
                // Özel durumları kontrol et
                if (!link.href.includes('javascript:') && 
                    !link.href.includes('#') && 
                    !e.ctrlKey && !e.metaKey) {
                    
                    // Yeni sayfa için geçmişi güncelle
                    const history = JSON.parse(sessionStorage.getItem('pageHistory') || '[]');
                    const targetPath = new URL(link.href).pathname;
                    
                    // Eğer son sayfa bu değilse ekle
                    if (history[history.length - 1] !== targetPath) {
                        history.push(targetPath);
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
