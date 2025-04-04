/**
 * ZekaPark - iOS Tarzı Hiyerarşik Navigasyon Sistemi
 * Sayfa Geçmişi: A→B→C→D ziyaret edilen sayfalar D→C→B→A sırayla geri döner
 */

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', function() {
    console.log("=== ZekaPark Hiyerarşik Navigasyon Sistemi Başlatılıyor ===");
    
    // Geçmiş verisi - indexler yerine tam URL'ler kullanıyoruz
    // Örnek: ['/anasayfa', '/oyunlar', '/oyunlar/kelime-bulmaca']
    if (!sessionStorage.getItem('visitedPages')) {
        // İlk ziyarette tek elemanlı bir dizi oluştur
        sessionStorage.setItem('visitedPages', JSON.stringify([window.location.pathname]));
    } else {
        // Geçmiş dizisini al
        let history = JSON.parse(sessionStorage.getItem('visitedPages'));
        let currentPath = window.location.pathname;
        
        // Eğer direkt bir URL'e gelindiyse (sayfa yenileme veya direkt link), o adresi geçmişte kontrol et
        if (!document.referrer || new URL(document.referrer).pathname === currentPath) {
            // Sayfa yenilemeden geliyorsak geçmişi koruyoruz
            console.log("Sayfa yenilemesi tespit edildi, geçmiş korunuyor");
        } else if (history[history.length - 1] !== currentPath) {
            // Yeni bir sayfaya geldiyse, geçmişe ekle
            history.push(currentPath);
            sessionStorage.setItem('visitedPages', JSON.stringify(history));
            console.log("Yeni sayfa geçmişe eklendi:", currentPath);
        }
    }
    
    console.log("Mevcut gezinti geçmişi:", JSON.parse(sessionStorage.getItem('visitedPages')));
    
    // Kaydırma algılama bileşenleri
    // Shadow overlay (gölge efekti) oluştur
    let overlay = document.getElementById('swipe-shadow');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'swipe-shadow';
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
    }
    
    // Swipe algılama için dokunmatik değişkenler
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const THRESHOLD = 70; // Kaydırma eşiği (px cinsinden)
    
    // Dokunmatik hareket başlangıcı
    document.addEventListener('touchstart', function(e) {
        // Sadece sol kenardan başlayan kaydırmaları algıla (25px)
        if (e.touches[0].clientX < 25) {
            touchStartX = e.touches[0].clientX;
            touchMoveX = touchStartX;
            isDragging = true;
            
            // Gölge overlay göster
            overlay.style.display = 'block';
            overlay.style.opacity = '0';
        }
    }, { passive: true });
    
    // Dokunmatik hareket devam ediyor
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        let deltaX = touchMoveX - touchStartX;
        
        // Sadece sağa doğru hareketler için (geriye gitme)
        if (deltaX > 0) {
            // Varsayılan kaydırma davranışını engelle
            e.preventDefault();
            
            // Geçmiş kontrolü - geriye gidebilir miyiz?
            let history = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
            if (history.length <= 1) return; // Gidecek yer yoksa işlem yapma
            
            // Sayfayı kaydırma miktarı kadar hareket ettir (max %100)
            const movePercent = Math.min(deltaX / window.innerWidth * 100, 100);
            
            // Kaydırma efektini uygula
            document.body.style.transform = `translateX(${movePercent}%)`;
            document.body.style.transition = 'none'; // Anında tepki için
            
            // Gölge efektini güncelle (daha gerçekçi görünüm için)
            overlay.style.opacity = movePercent / 200; // Max 0.5 opaklık
        }
    }, { passive: false });
    
    // Dokunmatik hareket bittiğinde
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        
        // Hareketin yumuşak olması için geçiş efektini geri yükle
        document.body.style.transition = 'transform 0.3s ease-out';
        
        // Geçmiş listesi
        let history = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
        
        // Yeteri kadar kaydırılmış mı ve geriye gidecek bir sayfa var mı?
        if (deltaX > THRESHOLD && history.length > 1) {
            // Eşik değer aşıldı, bir önceki sayfaya dön
            document.body.style.transform = 'translateX(100%)'; // Sayfayı tam sağa kaydır
            
            // Geçişin tamamlanması için biraz bekle
            setTimeout(function() {
                // Şu anki sayfayı geçmişten çıkar (en sondaki)
                const currentPage = history.pop();
                
                // Geçmişi güncelle
                sessionStorage.setItem('visitedPages', JSON.stringify(history));
                console.log("Geri gidiş, geçmiş güncellendi:", history);
                
                // Bir önceki sayfaya git
                const previousPage = history[history.length - 1];
                window.location.href = previousPage;
            }, 250); // Animasyon süresinden biraz kısa olsun
        } else {
            // Yeterince kaydırılmadı, mevcut sayfaya geri dön
            document.body.style.transform = ''; // Transform'u sıfırla
        }
        
        // Gölge efektini kapat
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        
        isDragging = false;
    });
    
    // Link tıklamalarını işle ve geçmişe ekle
    document.addEventListener('click', function(e) {
        // Tıklanan elemanın link olup olmadığını kontrol et
        const link = e.target.closest('a');
        if (!link) return; // Link değilse işleme
        
        // Link işlendi mi?
        if (link.getAttribute('data-nav-handled')) return;
        link.setAttribute('data-nav-handled', 'true');
        
        // Orijinal click olay işleyicisini sakla
        const originalClickHandler = link.onclick;
        
        // Yeni click olay işleyicisi tanımla
        link.onclick = function(e) {
            // Orijinal işleyici varsa çalıştır
            if (originalClickHandler) {
                const result = originalClickHandler.call(this, e);
                if (result === false) return false;
            }
            
            // Sadece iç sayfalar için
            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.href.includes('javascript:') &&
                !e.ctrlKey && !e.metaKey) {
                
                // Ziyaret edilecek sayfanın yolunu al
                const targetPath = new URL(link.href).pathname;
                
                // Geçmişi al
                let history = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
                
                // Son sayfa ziyaret edilecek sayfa değilse ekle
                if (history[history.length - 1] !== targetPath) {
                    history.push(targetPath);
                    sessionStorage.setItem('visitedPages', JSON.stringify(history));
                    console.log("Link tıklaması ile geçmişe eklenen sayfa:", targetPath);
                }
            }
        };
    });
    
    // Geri butonlarının işlevselliği - sayfada varsa
    document.querySelectorAll('.back-button').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Geçmişi kontrol et
            let history = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
            
            if (history.length > 1) {
                // Şu anki sayfayı geçmişten çıkar
                history.pop();
                
                // Geçmişi güncelle
                sessionStorage.setItem('visitedPages', JSON.stringify(history));
                
                // Bir önceki sayfaya git
                window.location.href = history[history.length - 1];
            }
        });
    });
    
    // Form gönderimlerini izle
    document.querySelectorAll('form').forEach(function(form) {
        if (form.getAttribute('data-nav-handled')) return;
        form.setAttribute('data-nav-handled', 'true');
        
        // Orijinal gönderim olayını sakla
        const originalSubmitHandler = form.onsubmit;
        
        // Form gönderildiğinde çalışacak
        form.addEventListener('submit', function(e) {
            // Orijinal gönderim olayını çalıştır
            if (originalSubmitHandler) {
                const result = originalSubmitHandler.call(this, e);
                if (result === false) return false;
            }
            
            // POST formları için bir şey yapmıyoruz (ajax olmadığı sürece)
            if (form.method.toLowerCase() !== 'get') return;
            
            // Form hedef URL'ini al
            const formAction = form.action || window.location.href;
            const targetUrl = new URL(formAction);
            const targetPath = targetUrl.pathname;
            
            // Geçmişi al
            let history = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
            
            // Yeni sayfayı geçmişe ekle
            if (history[history.length - 1] !== targetPath) {
                history.push(targetPath);
                sessionStorage.setItem('visitedPages', JSON.stringify(history));
                console.log("Form gönderimi ile geçmişe eklenen sayfa:", targetPath);
            }
        });
    });
    
    // Hatalarla başa çıkma - sayfanın çökmesini engelle
    window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('null') || e.message.includes('undefined'))) {
            console.log("Hata giderildi:", e.message);
            // Kritik olmayan hataları engelle
            e.preventDefault();
            return true;
        }
    });
});
