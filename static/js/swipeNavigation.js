/**
 * ZekaPark - Gelişmiş iOS Tarzı Navigasyon
 * Tam ve eksiksiz sayfa geçmişi yönetimi
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa geçmişi kontrolü
    initPageHistory();
    
    // Dokunmatik olaylarını hemen ayarla
    setupTouchEvents();
    
    // Bağlantıları ve butonları izle
    setupClickHandlers();
    
    // Form gönderimlerini izle
    setupFormTracking();
});

/**
 * Sayfa geçmişini başlat/kontrol et 
 */
function initPageHistory() {
    // Sayfa ilk yüklendiğinde
    if (!sessionStorage.getItem('navigation_history')) {
        // İlk geçmiş oluştur
        sessionStorage.setItem('navigation_history', JSON.stringify([{
            path: window.location.pathname,
            title: document.title
        }]));
        console.log("Navigasyon geçmişi başlatıldı:", window.location.pathname);
    } else {
        // Mevcut geçmişi al
        const history = JSON.parse(sessionStorage.getItem('navigation_history'));
        const currentPath = window.location.pathname;
        
        // Sayfa değişti mi kontrol et
        const lastPage = history[history.length - 1];
        
        // Geçmişte bu sayfa var mı?
        const existingIndex = history.findIndex(page => page.path === currentPath);
        
        if (lastPage.path !== currentPath) {
            // Geçmişte aynı sayfa varsa, duruma göre önceki kayıtları kaldır
            if (existingIndex !== -1) {
                console.log("Geçmişte var olan bir sayfaya dönüldü:", currentPath);
                
                // Döngüsel dönüşleri kontrol et, gerekirse geçmişi temizle
                if (existingIndex < history.length - 1) {
                    history.splice(existingIndex + 1);
                }
            }
            
            // Yeni sayfayı geçmişe ekle
            history.push({
                path: currentPath,
                title: document.title
            });
            
            sessionStorage.setItem('navigation_history', JSON.stringify(history));
            console.log("Sayfa geçmişe eklendi:", currentPath);
        }
    }
    
    // Mevcut geçmişi konsola yazdır
    const history = JSON.parse(sessionStorage.getItem('navigation_history'));
    console.log("Güncel Navigasyon Geçmişi:", history.map(p => p.path).join(' -> '));
}

/**
 * Dokunmatik olaylar
 */
function setupTouchEvents() {
    // Gölge overlay elementi oluştur
    let shadowOverlay = document.getElementById('shadowOverlay');
    if (!shadowOverlay) {
        shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'shadowOverlay';
        shadowOverlay.classList.add('shadow-overlay');
        document.body.appendChild(shadowOverlay);
    }
    
    // Dokunma değişkenleri
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const THRESHOLD = 50; // Kaydırma eşiği
    
    // Dokunmatik başlangıç
    document.addEventListener('touchstart', function(e) {
        // Sadece sol kenardan başlayan kaydırmaları al (30px)
        if (e.touches[0].clientX < 30) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            
            // Gölge efekti
            shadowOverlay.style.display = 'block';
            shadowOverlay.style.opacity = '0';
            
            // Animasyonları hazırla
            document.body.style.transition = 'none';
        }
    }, {passive: true});
    
    // Dokunmatik hareket
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        // Sağa doğru kaydırma kontrolü
        if (deltaX > 0) {
            e.preventDefault(); // Sayfanın kaymasını engelle
            
            // Geçmiş kontrolü
            const history = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
            if (history.length <= 1) return; // Geçmişte sayfa yoksa işlem yapma
            
            // Hareket yüzdesi
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            
            // Sayfayı hareket ettir
            document.body.style.transform = `translateX(${movePercent}%)`;
            
            // Gölge opaklığı
            shadowOverlay.style.opacity = (movePercent / 200).toString();
        }
    }, {passive: false});
    
    // Dokunmatik bitiş
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        document.body.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.85, 0.4, 1)';
        
        // Geçmiş kontrolü
        const history = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
        
        // Yeterince kaydırıldı mı?
        if (deltaX > THRESHOLD && history.length > 1) {
            // Sayfayı kaydır ve git
            document.body.style.transform = 'translateX(100%)';
            
            // Animasyon süresi ile uyumlu gecikme
            setTimeout(function() {
                // Son sayfayı çıkar
                history.pop();
                sessionStorage.setItem('navigation_history', JSON.stringify(history));
                
                // Bir önceki sayfaya git
                const previousPage = history[history.length - 1];
                window.location.href = previousPage.path;
            }, 250);
        } else {
            // Geri dön
            document.body.style.transform = '';
        }
        
        // Efekti kapat
        shadowOverlay.style.opacity = '0';
        setTimeout(() => {
            shadowOverlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
}

/**
 * Bağlantı ve butonları izle
 */
function setupClickHandlers() {
    // Tüm bağlantıları izle (Event delegation)
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Sadece site içi bağlantılar için
        if (link.host === window.location.host && 
            !link.href.includes('#') && 
            !link.target && 
            !e.ctrlKey && !e.metaKey) {
            
            // Tıklanan bağlantının yolunu al
            const path = new URL(link.href).pathname;
            trackPageNavigation(path, link.textContent.trim());
        }
    });
    
    // Geri butonlarını izle
    document.querySelectorAll('.back-button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    });
}

/**
 * Form gönderimlerini izle
 */
function setupFormTracking() {
    document.querySelectorAll('form').forEach(function(form) {
        // Form zaten işlendi mi?
        if (form.getAttribute('data-nav-tracked')) return;
        form.setAttribute('data-nav-tracked', 'true');
        
        // Form gönderim olayını izle
        form.addEventListener('submit', function(e) {
            // Form metodu GET ise navigasyonu kaydet
            if (form.method.toLowerCase() === 'get') {
                const formAction = form.action || window.location.href;
                const targetUrl = new URL(formAction);
                
                // Geçmişe ekle
                trackPageNavigation(targetUrl.pathname, document.title);
            }
        });
    });
}

/**
 * Sayfayı geçmişe ekle
 */
function trackPageNavigation(path, title) {
    // Geçmişi al
    const history = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
    
    // Son sayfa bu değilse ekle
    if (history.length === 0 || history[history.length - 1].path !== path) {
        history.push({
            path: path,
            title: title || document.title
        });
        sessionStorage.setItem('navigation_history', JSON.stringify(history));
    }
}

/**
 * Geri dönüş için animasyonlu geçiş
 */
function goBack() {
    const history = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
    
    if (history.length > 1) {
        // Animasyonu başlat
        document.body.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.85, 0.4, 1)';
        document.body.style.transform = 'translateX(100%)';
        
        // Animasyon tamamlanınca git
        setTimeout(function() {
            // Son sayfayı çıkar
            history.pop();
            sessionStorage.setItem('navigation_history', JSON.stringify(history));
            
            // Önceki sayfaya git
            window.location.href = history[history.length - 1].path;
        }, 250);
    }
}
