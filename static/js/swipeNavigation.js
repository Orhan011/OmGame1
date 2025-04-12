
/**
 * ZekaPark - Gelişmiş iOS tarzı swipe navigasyon sistemi
 * Daha akıcı animasyonlar ve dokunuş hissi ile profesyonel deneyim
 */

document.addEventListener('DOMContentLoaded', function() {
    // ==================== GEÇMİŞ YÖNETİMİ ====================
    
    // Özel geçmiş sistemimizi başlat
    initializeHistory();
    
    // ==================== SWIPE ARAYÜZÜ ====================
    
    // Gerekli DOM elementleri oluştur
    createSwipeInterface();
    
    // Dokunma değişkenleri
    let touchVars = {
        startX: 0,
        currentX: 0,
        startY: 0,
        currentY: 0,
        active: false,
        timerId: null,
        animationFrame: null,
        swipeType: null // yatay/dikey swipe ayrımı için
    };
    
    // Dokunma olaylarını yakalama
    setupTouchListeners(touchVars);
    
    // ==================== LİNK VE BUTON YÖNETİMİ ====================
    
    // İç link tıklamalarını yönet
    setupLinkHandlers();
    
    // Geri butonlarına event listener ekle
    setupBackButtons();
    
    // ==================== YARDIMCI FONKSİYONLAR ====================
    
    /**
     * Geçmiş yönetimini başlatır
     */
    function initializeHistory() {
        if (!localStorage.getItem('siteHistory')) {
            // İlk ziyarette, geçmişi başlat
            localStorage.setItem('siteHistory', JSON.stringify([{
                url: window.location.pathname,
                title: document.title,
                timestamp: Date.now()
            }]));
        } else {
            // Mevcut geçmişi kontrol et ve güncelle
            let history = JSON.parse(localStorage.getItem('siteHistory'));
            const currentPath = window.location.pathname;
            
            // Son sayfa bu sayfa değilse, yeni sayfa demektir - ekle
            const lastVisitedPage = history[history.length - 1];
            if (lastVisitedPage.url !== currentPath) {
                // Geçmişte bu sayfa var mı?
                const existingPageIndex = history.findIndex(page => page.url === currentPath);
                
                if (existingPageIndex === -1) {
                    // Yeni sayfa ziyareti
                    history.push({
                        url: currentPath,
                        title: document.title,
                        timestamp: Date.now()
                    });
                } else {
                    // Geçmişte olan bir sayfaya dönüş - o noktaya kadar kes
                    history = history.slice(0, existingPageIndex + 1);
                    // Zaman damgasını güncelle
                    history[existingPageIndex].timestamp = Date.now();
                }
                
                // Geçmişi kaydet
                localStorage.setItem('siteHistory', JSON.stringify(history));
            }
        }
    }
    
    /**
     * Swipe arayüzü için gerekli DOM elementlerini oluşturur
     */
    function createSwipeInterface() {
        // Ana overlay - sayfa kenarı gölgesi
        let overlay = document.createElement('div');
        overlay.className = 'swipe-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.12);
            backdrop-filter: blur(2px);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1);
            display: none;
        `;
        document.body.appendChild(overlay);
        
        // Kenar gölgesi efekti
        let edgeShadow = document.createElement('div');
        edgeShadow.className = 'edge-shadow';
        edgeShadow.style.cssText = `
            position: fixed;
            top: 0;
            left: -10px;
            width: 10px;
            height: 100%;
            box-shadow: 5px 0 15px rgba(0,0,0,0.4);
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1);
        `;
        document.body.appendChild(edgeShadow);
        
        // Önceki sayfa önizleme görseli
        let prevPagePreview = document.createElement('div');
        prevPagePreview.className = 'prev-page-preview';
        prevPagePreview.style.cssText = `
            position: fixed;
            top: 0;
            left: -50px; 
            width: 50px;
            height: 100%;
            background: linear-gradient(to right, rgba(0,0,0,0.1), transparent);
            z-index: 9998;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
        `;
        document.body.appendChild(prevPagePreview);

        // Haptik geri bildirim için (iOS dokunma hissi)
        let hapticFeedbackSupported = 'vibrate' in navigator;
        
        // Swipe ipucu animasyonu (ilk ziyaretçiler için)
        if (!localStorage.getItem('swipeHintShown')) {
            // İpucu animasyonunu göster
            showSwipeHint();
            localStorage.setItem('swipeHintShown', 'true');
        }
    }
    
    /**
     * Swipe ipucu animasyonunu gösterir
     */
    function showSwipeHint() {
        let hintElement = document.createElement('div');
        hintElement.className = 'swipe-hint';
        hintElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background-color: rgba(255,255,255,0.7);
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            animation: hintPulse 1.5s ease-in-out infinite;
        `;
        
        // İpucu içeriği - ok işareti
        hintElement.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        // Animasyon için CSS
        let styleTag = document.createElement('style');
        styleTag.textContent = `
            @keyframes hintPulse {
                0% { opacity: 0; transform: translateY(-50%) translateX(0); }
                50% { opacity: 1; transform: translateY(-50%) translateX(10px); }
                100% { opacity: 0; transform: translateY(-50%) translateX(0); }
            }
        `;
        
        document.head.appendChild(styleTag);
        document.body.appendChild(hintElement);
        
        // 5 saniye sonra ipucu elementini kaldır
        setTimeout(() => {
            if (hintElement.parentNode === document.body) {
                document.body.removeChild(hintElement);
            }
        }, 5000);
    }
    
    /**
     * Dokunma olaylarını ayarlar
     */
    function setupTouchListeners(touchVars) {
        const overlay = document.querySelector('.swipe-overlay');
        const edgeShadow = document.querySelector('.edge-shadow');
        const prevPagePreview = document.querySelector('.prev-page-preview');
        const edgeThreshold = 30; // Ekranın kenarından kaç piksel içeri
        const minSwipeDistance = window.innerWidth * 0.15; // Min swipe mesafesi
        const swipeCompletionThreshold = window.innerWidth * 0.3; // Tamamlama eşiği
        
        // Haptik geri bildirim için
        const hapticFeedbackSupported = 'vibrate' in navigator;
        
        // Dokunma başladığında
        document.addEventListener('touchstart', function(e) {
            // Sadece ekranın sol kenarından başlayan swipe hareketleri için
            if (e.touches[0].clientX < edgeThreshold) {
                // Geçmiş kontrolü - geri gidecek sayfa var mı?
                let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
                if (history.length <= 1) return; // Geçmişte sayfa yoksa işlem yapma
                
                // Dokunma koordinatlarını kaydet
                touchVars.startX = e.touches[0].clientX;
                touchVars.startY = e.touches[0].clientY;
                touchVars.currentX = touchVars.startX;
                touchVars.currentY = touchVars.startY;
                touchVars.active = true;
                touchVars.swipeType = null; // Henüz belirlenmiş bir swipe yönü yok
                
                // Animasyon geçişini kapat
                document.body.style.transition = 'none';
                
                // Overlay ve gölge efektlerini göster
                if (overlay) overlay.style.display = 'block';
                if (edgeShadow) edgeShadow.style.opacity = '0';
                if (prevPagePreview) prevPagePreview.style.opacity = '0.6';
                
                // Performans için eğer varsa önceki animasyon frame'i iptal et
                if (touchVars.animationFrame) {
                    cancelAnimationFrame(touchVars.animationFrame);
                }
                
                // Belirli bir süre sonra yanıt vermezse iptal et (timeout)
                touchVars.timerId = setTimeout(() => {
                    if (touchVars.active && Math.abs(touchVars.currentX - touchVars.startX) < minSwipeDistance) {
                        resetSwipeState();
                    }
                }, 300);
            }
        }, {passive: true});
        
        // Dokunma hareketi devam ediyor
        document.addEventListener('touchmove', function(e) {
            if (!touchVars.active) return;
            
            // Mevcut konumu güncelle
            touchVars.currentX = e.touches[0].clientX;
            touchVars.currentY = e.touches[0].clientY;
            
            // Henüz swipe yönü belirlenmemişse, yatay mı dikey mi belirle
            if (touchVars.swipeType === null) {
                const deltaX = Math.abs(touchVars.currentX - touchVars.startX);
                const deltaY = Math.abs(touchVars.currentY - touchVars.startY);
                
                // Belirgin bir fark oluşmuşsa yönü belirle
                if (deltaX > 10 || deltaY > 10) {
                    touchVars.swipeType = deltaX > deltaY ? 'horizontal' : 'vertical';
                    
                    // Eğer dikey swipe ise, yakalamayı bırak ve sayfanın normal scroll etmesine izin ver
                    if (touchVars.swipeType === 'vertical') {
                        resetSwipeState();
                        return;
                    }
                }
            }
            
            // Yatay swipe ise ve aktifse devam et
            if (touchVars.swipeType === 'horizontal') {
                // Sağa doğru swipe mesafesi
                let delta = touchVars.currentX - touchVars.startX;
                
                // Sağa doğru swipe yapıldığında
                if (delta > 0) {
                    // Varsayılan scroll davranışını engelle
                    e.preventDefault();
                    
                    // Ekran boyutu üzerinden yüzde hesapla - daha pürüzsüz animasyon için
                    const percent = (delta / window.innerWidth) * 100;
                    const easedPercent = easeOutCubic(percent / 100) * 100; // Easing fonksiyonu
                    
                    // Animasyonu requestAnimationFrame ile daha pürüzsüz yap
                    touchVars.animationFrame = requestAnimationFrame(() => {
                        // Sayfa pozisyonunu güncelle
                        document.body.style.transform = `translateX(${easedPercent}%)`;
                        
                        // Overlay opaklığını ayarla - daha yumuşak geçiş
                        if (overlay) overlay.style.opacity = easedPercent / 300;
                        
                        // Kenar gölgesi efektini göster - daha gerçekçi iOS benzeri
                        if (edgeShadow) {
                            edgeShadow.style.opacity = Math.min(1, easedPercent / 15);
                            edgeShadow.style.left = `${easedPercent - 10}px`;
                        }
                        
                        // Önceki sayfa önizlemesi
                        if (prevPagePreview) {
                            prevPagePreview.style.opacity = Math.min(0.7, easedPercent / 50);
                            prevPagePreview.style.left = `${easedPercent - 50}px`;
                        }
                    });
                }
            }
        }, {passive: false});
        
        // Dokunma bitti
        document.addEventListener('touchend', function(e) {
            if (!touchVars.active) return;
            
            // Timeout'u temizle
            if (touchVars.timerId) {
                clearTimeout(touchVars.timerId);
                touchVars.timerId = null;
            }
            
            // Animasyon frame'i iptal et
            if (touchVars.animationFrame) {
                cancelAnimationFrame(touchVars.animationFrame);
                touchVars.animationFrame = null;
            }
            
            // Swipe mesafesi
            const delta = touchVars.currentX - touchVars.startX;
            
            // Animasyonu aç
            document.body.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.85, 0.4, 1)';
            
            // Geçmiş kontrolü
            let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
            
            // Yeterli swipe mesafesi var mı ve geçmişte sayfa var mı?
            if (touchVars.swipeType === 'horizontal' && delta > swipeCompletionThreshold && history.length > 1) {
                // Haptik geri bildirim (mümkünse)
                if (hapticFeedbackSupported) {
                    navigator.vibrate(8); // Hafif titreşim
                }
                
                // Sayfayı sağa doğru kaydırma animasyonu tamamla
                document.body.style.transform = 'translateX(100%)';
                
                // Overlay animasyonu
                if (overlay) overlay.style.opacity = '0.3';
                
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
                // Yetersiz swipe, geri al
                document.body.style.transform = '';
                
                // Diğer elemanların animasyonları
                if (overlay) overlay.style.opacity = '0';
                if (edgeShadow) edgeShadow.style.opacity = '0';
                if (prevPagePreview) prevPagePreview.style.opacity = '0';
                
                // Overlay'i 300ms sonra gizle
                setTimeout(function() {
                    if (overlay) overlay.style.display = 'none';
                }, 300);
            }
            
            // Aktif durumu sıfırla
            touchVars.active = false;
        });
        
        // Dokunma iptal
        document.addEventListener('touchcancel', function() {
            resetSwipeState();
        });
        
        /**
         * Swipe durumunu sıfırlar
         */
        function resetSwipeState() {
            // Timeout'u temizle
            if (touchVars.timerId) {
                clearTimeout(touchVars.timerId);
                touchVars.timerId = null;
            }
            
            // Animasyon frame'i iptal et
            if (touchVars.animationFrame) {
                cancelAnimationFrame(touchVars.animationFrame);
                touchVars.animationFrame = null;
            }
            
            // Durumu sıfırla
            touchVars.active = false;
            document.body.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.85, 0.4, 1)';
            document.body.style.transform = '';
            
            // Diğer elemanları sıfırla
            const overlay = document.querySelector('.swipe-overlay');
            const edgeShadow = document.querySelector('.edge-shadow');
            const prevPagePreview = document.querySelector('.prev-page-preview');
            
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 300);
            }
            
            if (edgeShadow) edgeShadow.style.opacity = '0';
            if (prevPagePreview) prevPagePreview.style.opacity = '0';
        }
        
        /**
         * Kübik easing out fonksiyonu - daha doğal animasyonlar için
         * @param {number} t - 0 ile 1 arasında bir değer
         * @return {number} - ease edilmiş değer (0-1 arasında)
         */
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
    }
    
    /**
     * Bağlantı tıklamalarını yönetir
     */
    function setupLinkHandlers() {
        // Tüm linkleri yakala (Event Delegation)
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            // Sadece site içi bağlantılar için
            if (link.host === window.location.host && 
                !link.href.includes('#') && 
                !link.target &&
                !e.ctrlKey && !e.metaKey) {
                
                // Sayfayı geçmişe ekle
                let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
                const targetPath = new URL(link.href).pathname;
                
                // Aynı sayfaya gidiyorsa işlem yapma
                if (history.length > 0 && history[history.length - 1].url === targetPath) return;
                
                // Geçmişte bu sayfa var mı?
                const existingIndex = history.findIndex(page => page.url === targetPath);
                
                if (existingIndex !== -1) {
                    // Varolan bir sayfaya geri dönüş, döngüsel durumu temizle
                    history = history.slice(0, existingIndex + 1);
                    history[existingIndex].timestamp = Date.now(); // zaman damgasını güncelle
                } else {
                    // Yeni sayfa ziyareti
                    history.push({
                        url: targetPath,
                        title: link.textContent.trim() || link.getAttribute('title') || document.title,
                        timestamp: Date.now()
                    });
                }
                
                // Geçmişi güncelle
                localStorage.setItem('siteHistory', JSON.stringify(history));
                
                // Sayfa geçişi animasyonu - opsiyonel
                animateLinkTransition(link);
            }
        });
    }
    
    /**
     * Sayfa geçişi animasyonunu oluşturur
     */
    function animateLinkTransition(link) {
        // Mevcut sayfa pozisyonunu kaydet
        const scrollPos = window.scrollY;
        
        // Tıklama animasyonu için ripple efekti
        const ripple = document.createElement('div');
        ripple.className = 'link-ripple';
        
        // Link konum bilgilerini al
        const rect = link.getBoundingClientRect();
        
        // Ripple stilini ayarla
        ripple.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            animation: linkRipple 0.6s ease-out;
        `;
        
        // Animasyon için CSS ekle
        if (!document.querySelector('#ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes linkRipple {
                    to {
                        width: 50px;
                        height: 50px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Ripple'ı ekle ve kaldır
        document.body.appendChild(ripple);
        setTimeout(() => {
            if (ripple.parentNode === document.body) {
                document.body.removeChild(ripple);
            }
        }, 600);
    }
    
    /**
     * Geri butonlarını ayarlar
     */
    function setupBackButtons() {
        // Tüm geri butonlarına olay dinleyici ekle
        document.querySelectorAll('.back-button').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                goBack();
            });
        });
    }
    
    /**
     * Geri gitme işlemini gerçekleştirir
     */
    function goBack() {
        let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
        
        if (history.length > 1) {
            // Haptik geri bildirim (mümkünse)
            if ('vibrate' in navigator) {
                navigator.vibrate(8); // hafif titreşim
            }
            
            // Animasyon uygula
            document.body.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.85, 0.4, 1)';
            document.body.style.transform = 'translateX(100%)';
            
            // Edge shadow efekti
            const edgeShadow = document.querySelector('.edge-shadow');
            if (edgeShadow) {
                edgeShadow.style.opacity = '1';
                edgeShadow.style.left = '95%';
            }
            
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
