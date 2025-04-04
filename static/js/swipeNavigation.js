/**
 * ZekaPark iOS Tarzı Navigasyon Sistemi
 * Sayfa Geçmişli Navigasyon: A→B→C→D şeklinde ziyaret, D→C→B→A şeklinde geri dönüş
 */

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', function() {
    console.log("==== ZekaPark Swipe Navigasyon Sistemi Başlatılıyor ====");
    
    // Sayfa geçmişini saklamak için localStorage kullan (kalıcı olması için)
    // Bu şekilde sayfalar arasında geçiş yapınca kaybolmaz
    if (!localStorage.getItem('siteHistory')) {
        // İlk ziyarette boş bir dizi oluştur
        localStorage.setItem('siteHistory', JSON.stringify([window.location.pathname]));
        console.log("Yeni sayfa geçmişi oluşturuldu:", [window.location.pathname]);
    } else {
        // Mevcut geçmişi al
        let history = JSON.parse(localStorage.getItem('siteHistory'));
        
        // Eğer sayfayı ilk kez ziyaret ediyorsak, geçmişe ekle
        const currentPath = window.location.pathname;
        
        // Son ziyaret edilen sayfa mevcut sayfa değilse, geçmişe ekle
        if (history[history.length - 1] !== currentPath) {
            history.push(currentPath);
            localStorage.setItem('siteHistory', JSON.stringify(history));
            console.log("Geçmişe eklendi:", currentPath);
        }
    }
    
    console.log("Mevcut sayfa geçmişi:", JSON.parse(localStorage.getItem('siteHistory')));
    
    // Dokunmatik kaydırma için değişkenler
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    
    // Gölge efekti için element oluştur
    const overlay = document.createElement('div');
    overlay.id = 'swipe-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        opacity: 0;
        display: none;
        transition: opacity 0.3s ease-out;
        pointer-events: none;
    `;
    document.body.appendChild(overlay);
    
    // Dokunmatik olayları
    document.addEventListener('touchstart', function(e) {
        // Sadece sol kenardan başlayan kaydırmaları algıla (20px genişliğinde)
        if (e.touches[0].clientX < 20) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            
            // Gölge efektini göster
            overlay.style.display = 'block';
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const moveDistance = touchMoveX - touchStartX;
        
        // Sadece sağa doğru kaydırmalarda işlem yap
        if (moveDistance > 0) {
            // Doküman varsayılan davranışını engelle
            e.preventDefault();
            
            // Sayfayı kaydırma miktarıyla hareket ettir (en fazla sayfa genişliği kadar)
            const maxMove = window.innerWidth;
            const movePercent = Math.min((moveDistance / maxMove) * 100, 100);
            
            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none'; // Anlık hareket için
            
            // Gölge efektini güncelle
            overlay.style.opacity = movePercent / 200; // 0.5'e kadar gider
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const moveDistance = touchMoveX - touchStartX;
        
        // Sağa doğru geçişleri geri yükle
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmişi al
        let history = JSON.parse(localStorage.getItem('siteHistory'));
        
        // Yeterince kaydırıldı mı? (50px veya ekran genişliğinin %15'i)
        const threshold = Math.max(50, window.innerWidth * 0.15);
        
        if (moveDistance > threshold && history.length > 1) {
            // Yeterince kaydırıldı ve geçmişte gezilecek sayfa var
            // Sayfa tamamen sağa kaydırılsın
            document.body.style.transform = 'translateX(100%)';
            
            // Gölge artırılsın
            overlay.style.opacity = '0.5';
            
            // Geçmişteki bir önceki sayfaya git (son sayfayı çıkar)
            setTimeout(function() {
                // Son sayfayı geçmişten çıkar
                history.pop();
                
                // Geçmişi güncelle
                localStorage.setItem('siteHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                window.location.href = history[history.length - 1]; 
            }, 300); // Animasyon süresi kadar bekle
        } else {
            // Yeterli değil, sayfayı eski konumuna getir
            document.body.style.transform = '';
        }
        
        // Gölgeyi kapat
        overlay.style.opacity = '0';
        setTimeout(function() {
            overlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Link tıklamalarını yakalayıp geçmişe ekle
    document.addEventListener('click', function(e) {
        // Tıklanan elemanı bul
        const link = e.target.closest('a');
        
        // Eğer link değilse veya zaten işlenmişse atla
        if (!link || link.getAttribute('data-swipe-tracked')) return;
        
        // Linki işaretleyelim
        link.setAttribute('data-swipe-tracked', 'true');
        
        // Orijinal click fonksiyonunu sakla
        const originalClick = link.onclick;
        
        // Yeni click fonksiyonu
        link.onclick = function(e) {
            // Orijinal fonksiyon varsa çalıştır
            if (originalClick) {
                const result = originalClick.call(this, e);
                if (result === false) return false;
            }
            
            // Sadece iç bağlantılar için
            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.href.includes('javascript:') &&
                !e.ctrlKey && !e.metaKey) {
                
                // Yeni ziyaret edilecek sayfayı geçmişe ekle
                const targetPath = new URL(link.href).pathname;
                let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
                
                // Önceki ziyaretlerden farklıysa ekle
                if (history[history.length - 1] !== targetPath) {
                    history.push(targetPath);
                    localStorage.setItem('siteHistory', JSON.stringify(history));
                    console.log("Link tıklamasıyla geçmişe eklendi:", targetPath);
                }
            }
        };
    });
    
    // Geri butonları için
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Geçmişi al
            let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
            
            if (history.length > 1) {
                // Son sayfayı sil
                history.pop();
                
                // Geçmişi güncelle
                localStorage.setItem('siteHistory', JSON.stringify(history));
                
                // Bir önceki sayfaya git
                window.location.href = history[history.length - 1];
            } else {
                // Geçmişte sayfa yoksa ana sayfaya git
                window.location.href = '/';
            }
        });
    });
    
    // Tarayıcının geri butonu için
    window.addEventListener('popstate', function(e) {
        // Tarayıcı geri tuşuna basıldığında
        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        
        if (history.length > 1) {
            // Son sayfayı geçmişten çıkar
            history.pop();
            localStorage.setItem('siteHistory', JSON.stringify(history));
        }
    });
    
    // Form gönderimlerini takip et
    document.querySelectorAll('form').forEach(function(form) {
        if (!form.getAttribute('data-swipe-tracked')) {
            form.setAttribute('data-swipe-tracked', 'true');
            
            // Orijinal submit fonksiyonunu sakla
            const originalSubmit = form.onsubmit;
            
            // Form gönderimini yakalayıp hedef sayfasını geçmişe ekle
            form.addEventListener('submit', function(e) {
                // Orijinal submit fonksiyonu varsa çalıştır
                if (originalSubmit) {
                    const result = originalSubmit.call(this, e);
                    if (result === false) return false;
                }
                
                // Sadece GET metodu için url'yi analiz et
                if (form.method.toLowerCase() === 'get') {
                    const formAction = form.action || window.location.href;
                    const targetUrl = new URL(formAction);
                    const targetPath = targetUrl.pathname;
                    
                    // Geçmişi al ve güncelle
                    let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
                    
                    if (history[history.length - 1] !== targetPath) {
                        history.push(targetPath);
                        localStorage.setItem('siteHistory', JSON.stringify(history));
                        console.log("Form gönderimi ile geçmişe eklendi:", targetPath);
                    }
                }
            });
        }
    });
    
    // Hata giderme mekanizması
    window.addEventListener('error', function(e) {
        if (e.message.includes('null') || e.message.includes('undefined')) {
            console.log("Hata giderme mekanizması ile yakalandı:", e.message);
            e.preventDefault();
            return true;
        }
    });
});
