/**
 * ZekaPark - Ultra Hafif Navigasyon
 * Minimum kod, maksimum performans
 */

document.addEventListener('DOMContentLoaded', function() {
    // Temel geçmiş yönetimi
    if (!sessionStorage.getItem('nav')) {
        sessionStorage.setItem('nav', JSON.stringify([window.location.pathname]));
    } else {
        const h = JSON.parse(sessionStorage.getItem('nav'));
        const p = window.location.pathname;
        
        // Sadece yeni sayfa ise ekle
        if (h.length === 0 || h[h.length - 1] !== p) {
            h.push(p);
            sessionStorage.setItem('nav', JSON.stringify(h));
        }
    }
    
    // Gölge efekti - JavaScript'ten CSS'e taşındı
    const overlay = document.getElementById('swipe-shadow') || document.createElement('div');
    overlay.id = 'swipe-shadow';
    if (!document.getElementById('swipe-shadow')) {
        document.body.appendChild(overlay);
    }
    
    // Temel değişkenler
    let startX, moveX, active = false;
    const LIMIT = 30; // Minimum kaydırma
    
    // Dokunma başlangıcı - sadece sol kenardan
    document.ontouchstart = e => {
        if (e.touches[0].clientX < 20) {
            startX = e.touches[0].clientX;
            moveX = startX;
            active = true;
            overlay.style.display = 'block';
        }
    };
    
    // Hareket sırasında
    document.ontouchmove = e => {
        if (!active) return;
        
        moveX = e.touches[0].clientX;
        const delta = moveX - startX;
        
        if (delta > 0) {
            e.preventDefault(); // Kaydırmayı engelle
            const move = Math.min(delta / window.innerWidth * 100, 100);
            document.body.style.transform = `translateX(${move}%)`;
            overlay.style.opacity = (move / 200).toString();
        }
    };
    
    // Dokunma bitişi
    document.ontouchend = e => {
        if (!active) return;
        
        const delta = moveX - startX;
        document.body.style.transition = 'transform 0.2s';
        
        // Geçmiş listesi
        const h = JSON.parse(sessionStorage.getItem('nav') || '[]');
        
        if (delta > LIMIT && h.length > 1) {
            // Geri gitme
            document.body.style.transform = 'translateX(100%)';
            
            // Minimal gecikme
            setTimeout(() => {
                h.pop();
                sessionStorage.setItem('nav', JSON.stringify(h));
                window.location.href = h[h.length - 1];
            }, 100);
        } else {
            // Geri alma
            document.body.style.transform = '';
        }
        
        // Temizlik
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 200);
        active = false;
    };
    
    // Geri butonları - basit
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const h = JSON.parse(sessionStorage.getItem('nav') || '[]');
            
            if (h.length > 1) {
                h.pop();
                sessionStorage.setItem('nav', JSON.stringify(h));
                window.location.href = h[h.length - 1];
            } else {
                window.location.href = '/';
            }
        });
    });
    
    // Link izleme - delegasyon modeli, daha verimli
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Sadece iç linkler için
        if (link.host === window.location.host && 
            !link.href.includes('#') && 
            !link.target &&
            !e.ctrlKey && !e.metaKey) {
            
            const path = new URL(link.href).pathname;
            const h = JSON.parse(sessionStorage.getItem('nav') || '[]');
            
            // Geçmişe ekle
            if (h.length === 0 || h[h.length - 1] !== path) {
                h.push(path);
                sessionStorage.setItem('nav', JSON.stringify(h));
            }
        }
    }, false);
});
