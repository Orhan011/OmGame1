/**
 * ZekaPark - Ultra basit ve güvenilir iOS swipe back
 * Basit ama çok güvenilir
 */

// Sayfa yüklendiğinde tüm navigasyon sistemini başlat
document.addEventListener('DOMContentLoaded', function() {
    // KISIM 1: GEÇMİŞ YÖNETİMİ
    
    // Tarayıcı geçmişini değil, kendi özel geçmiş sistemimizi kullanıyoruz
    if (!localStorage.getItem('siteHistory')) {
        // İlk ziyarette, geçmişi başlat
        localStorage.setItem('siteHistory', JSON.stringify([{
            url: window.location.pathname,
            title: document.title
        }]));
    } else {
        // Sayfa geçmişini kontrol et ve güncelle
        let history = JSON.parse(localStorage.getItem('siteHistory'));
        const currentPath = window.location.pathname;
        
        // Son sayfa bu sayfa değilse, yeni sayfa demektir - ekle
        const lastVisitedPage = history[history.length - 1];
        if (lastVisitedPage.url !== currentPath) {
            // Ancak geçmişte bu sayfa daha önce ziyaret edilmiş mi kontrol et
            const existingPageIndex = history.findIndex(page => page.url === currentPath);
            
            // Yeni bir sayfa ise, geçmişe ekle
            if (existingPageIndex === -1) {
                history.push({
                    url: currentPath,
                    title: document.title
                });
            } else {
                // Varolan bir sayfaya geri dönüş ise, 
                // o sayfadan sonraki tüm sayfaları kaldır (döngü önleme)
                history = history.slice(0, existingPageIndex + 1);
            }
            
            // Geçmişi kaydet
            localStorage.setItem('siteHistory', JSON.stringify(history));
        }
    }

    // KISIM 2: SWIPE BACK HAREKETİ
    
    // Gerekli DOM elementleri
    let overlay = document.createElement('div');
    overlay.className = 'swipe-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.2);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.25s;
        display: none;
    `;
    document.body.appendChild(overlay);
    
    // Dokunma değişkenleri
    let startX = 0;
    let currentX = 0;
    let active = false;
    
    // Dokunma başladığında
    document.addEventListener('touchstart', function(e) {
        // Sadece ekranın sol kenarından başlayan kaydırmaları al (20px)
        if (e.touches[0].clientX < 20) {
            startX = e.touches[0].clientX;
            currentX = startX;
            active = true;
            
            // Animasyon geçişini kapat
            document.body.style.transition = 'none';
            
            // Overlay'i göster
            overlay.style.display = 'block';
        }
    }, {passive: true});
    
    // Dokunma hareketi devam ediyor
    document.addEventListener('touchmove', function(e) {
        if (!active) return;
        
        currentX = e.touches[0].clientX;
        let delta = currentX - startX;
        
        // Sağa doğru kaydırma kontrolü
        if (delta > 0) {
            // Sayfayı kaydırma yaparken varsayılan scrollu engelle
            e.preventDefault();
            
            // Ne kadar kaydırıldı?
            let percent = (delta / window.innerWidth) * 100;
            
            // Sayfayı kaydırıldığı oranda hareket ettir
            document.body.style.transform = `translateX(${percent}%)`;
            
            // Arka plan overlay opaklığını ayarla
            overlay.style.opacity = percent / 200; // max 0.5 opacity
        }
    }, {passive: false});
    
    // Dokunma bitti
    document.addEventListener('touchend', function(e) {
        if (!active) return;
        
        // Ne kadar kaydırıldı
        let delta = currentX - startX;
        let threshold = 80; // Kaydırma eşiği
        
        // Animasyonu aç
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmiş kontrolü
        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        
        // Yeterli kaydırma ve geçmişte sayfa var mı?
        if (delta > threshold && history.length > 1) {
            // Sayfayı sağa doğru kaydırma animasyonu
            document.body.style.transform = 'translateX(100%)';
            
            // Animasyon bitince sayfayı değiştir
            setTimeout(function() {
                // Son sayfayı (şu anki sayfayı) geçmişten çıkar
                history.pop();
                
                // Geçmişi güncelle
                localStorage.setItem('siteHistory', JSON.stringify(history));
                
                // Önceki sayfaya git
                const previousPage = history[history.length - 1];
                window.location.href = previousPage.url;
            }, 250);
        } else {
            // Yetersiz kaydırma, geri al
            document.body.style.transform = '';
        }
        
        // Overlay'i kapat
        overlay.style.opacity = '0';
        setTimeout(function() {
            overlay.style.display = 'none';
        }, 300);
        
        active = false;
    });
    
    // KISIM 3: BAĞLANTI VE BUTON YÖNETİMİ
    
    // Tüm linkleri yakala (Event Delegation yöntemi)
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Sadece site içi bağlantılar için
        if (link.host === window.location.host && 
            !link.href.includes('#') && 
            !link.target &&
            !e.ctrlKey && !e.metaKey) {
            
            // Sayfayı ziyaret edildi olarak işaretle - geçmişe önceden ekle
            let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
            const targetPath = new URL(link.href).pathname;
            
            // Aynı sayfaya gidiyorsa işlem yapma
            if (history.length > 0 && history[history.length - 1].url === targetPath) return;
            
            // Geçmişte bu sayfa var mı?
            const existingIndex = history.findIndex(page => page.url === targetPath);
            
            if (existingIndex !== -1) {
                // Varolan bir sayfaya geri dönüş, döngüsel durumu temizle
                history = history.slice(0, existingIndex + 1);
            } else {
                // Yeni sayfa ziyareti
                history.push({
                    url: targetPath,
                    title: link.textContent.trim() || document.title
                });
            }
            
            // Geçmişi güncelle
            localStorage.setItem('siteHistory', JSON.stringify(history));
        }
    });
    
    // Geri butonları
    document.querySelectorAll('.back-button').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            goBack();
        });
    });
    
    // KISIM 4: YARDIMCI FONKSİYONLAR
    
    // Geri gitme fonksiyonu
    function goBack() {
        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        
        if (history.length > 1) {
            // Animasyon uygula
            document.body.style.transition = 'transform 0.3s ease-out';
            document.body.style.transform = 'translateX(100%)';
            
            setTimeout(function() {
                // Son sayfayı geçmişten çıkar
                history.pop();
                localStorage.setItem('siteHistory', JSON.stringify(history));
                
                // Bir önceki sayfaya git
                window.location.href = history[history.length - 1].url;
            }, 250);
        } else if (history.length === 1) {
            // Tek sayfa kalmış, ana sayfaya dön
            window.location.href = '/';
        }
    }
});
