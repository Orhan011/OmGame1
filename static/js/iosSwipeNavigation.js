/**
 * OmGame - iOS Tarzı Sayfa Kaydırma Navigasyon Sistemi
 * Dokunmatik ekranlarda iOS benzeri geri kaydırma desteği sağlar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa geçmişini izlemek için bir dizi
    let pageHistory = [];
    let currentPage = null;
    
    // Dokunma değişkenleri
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;
    const threshold = 50; // kaydırma eşiği (px cinsinden)
    
    // Sayfa konteyneri ve gölge elemanı oluştur
    const pageContainer = createPageContainer();
    const shadowOverlay = createShadowOverlay();
    pageContainer.appendChild(shadowOverlay);
    
    // Mevcut içeriği ana sayfa olarak ayarla
    setupInitialPage();
    
    // Dokunmatik olay dinleyicileri ekle
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Tüm link tıklamalarını dinle (AJAX navigasyon için)
    document.addEventListener('click', handleLinkClick);
    
    /**
     * Sayfa konteyneri oluştur
     */
    function createPageContainer() {
        const existingContainer = document.getElementById('pageContainer');
        if (existingContainer) return existingContainer;
        
        const container = document.createElement('div');
        container.id = 'pageContainer';
        container.className = 'page-container';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }
    
    /**
     * Gölge kenarı oluştur
     */
    function createShadowOverlay() {
        const existingOverlay = document.getElementById('shadowOverlay');
        if (existingOverlay) return existingOverlay;
        
        const overlay = document.createElement('div');
        overlay.id = 'shadowOverlay';
        overlay.className = 'shadow-overlay';
        return overlay;
    }
    
    /**
     * İlk sayfayı ayarla
     */
    function setupInitialPage() {
        const content = document.querySelector('main');
        if (!content) return;
        
        // Ana sayfayı kopyala ve sayfa konteynerine ekle
        const clone = content.cloneNode(true);
        
        const homePage = document.createElement('div');
        homePage.id = 'homePage';
        homePage.className = 'page active';
        
        homePage.appendChild(clone);
        pageContainer.appendChild(homePage);
        
        currentPage = 'homePage';
        
        // Orijinal içeriği gizle
        content.style.display = 'none';
    }
    
    /**
     * Link tıklamalarını işle
     */
    function handleLinkClick(event) {
        const link = event.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Özel linkleri engelleme (yani, js: ile başlayan, # ile başlayan, mailto:, tel: vb.)
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || 
            href.startsWith('mailto:') || href.startsWith('tel:') || 
            link.getAttribute('target') === '_blank') {
            return;
        }
        
        // URL'nin aynı kökte olduğunu kontrol et
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) {
                return;
            }
        } catch (e) {
            return;
        }
        
        // Varsayılan davranışı engelle
        event.preventDefault();
        
        // AJAX ile sayfayı yükle
        loadPage(href);
    }
    
    /**
     * AJAX ile sayfa içeriğini yükle
     */
    function loadPage(url) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                // HTML içeriğini ayrıştır
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Yeni içeriği al
                const newContent = doc.querySelector('main');
                
                if (!newContent) {
                    console.error('Yüklenen sayfada main elementi bulunamadı!');
                    return;
                }
                
                // Yeni sayfa ID'si oluştur
                const pageId = 'page_' + Date.now();
                
                // Yeni sayfa oluştur
                const newPage = document.createElement('div');
                newPage.id = pageId;
                newPage.className = 'page';
                
                // Üst çubuk ekle
                const header = document.createElement('div');
                header.className = 'page-header';
                
                const backButton = document.createElement('div');
                backButton.className = 'back-button';
                backButton.textContent = 'Geri';
                backButton.addEventListener('click', goBack);
                
                const pageTitle = document.createElement('div');
                pageTitle.className = 'page-title';
                pageTitle.textContent = doc.title || 'Sayfa';
                
                header.appendChild(backButton);
                header.appendChild(pageTitle);
                
                newPage.appendChild(header);
                
                // Sayfa içeriğini ekle
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'page-content';
                contentWrapper.appendChild(newContent.cloneNode(true));
                newPage.appendChild(contentWrapper);
                
                // Sayfa konteynerine ekle
                pageContainer.appendChild(newPage);
                
                // Sayfaya geçiş yap
                navigateTo(pageId);
                
                // URL'yi güncelle (tarayıcı geçmişi için)
                window.history.pushState({ pageId: pageId }, '', url);
            })
            .catch(error => {
                console.error('Sayfa yüklenirken hata:', error);
                window.location.href = url; // Hata durumunda normal navigasyona dön
            });
    }
    
    /**
     * Sayfaya navigasyon yap
     */
    function navigateTo(pageId) {
        if (currentPage === pageId) return;
        
        const currentPageElem = document.getElementById(currentPage);
        const newPageElem = document.getElementById(pageId);
        
        if (!newPageElem || !currentPageElem) return;
        
        // Eski sayfayı sol tarafa yerleştir
        currentPageElem.style.transform = 'translateX(-100%)';
        currentPageElem.classList.remove('active');
        
        // Yeni sayfayı doğru konuma getir
        newPageElem.style.transform = 'translateX(0)';
        newPageElem.classList.add('active');
        
        // Geçmişi güncelle
        pageHistory.push(currentPage);
        currentPage = pageId;
    }
    
    /**
     * Geri navigasyon
     */
    function goBack() {
        if (pageHistory.length <= 0) return;
        
        const previousPage = pageHistory.pop();
        const currentPageElem = document.getElementById(currentPage);
        const prevPageElem = document.getElementById(previousPage);
        
        if (!prevPageElem || !currentPageElem) return;
        
        // Şimdiki sayfayı sağa doğru hareket ettir
        currentPageElem.style.transform = 'translateX(100%)';
        currentPageElem.classList.remove('active');
        
        // Temizlik için gecikmeli kaldırma
        setTimeout(() => {
            if (currentPageElem && currentPageElem.parentNode) {
                currentPageElem.parentNode.removeChild(currentPageElem);
            }
        }, 300); // Animasyon süresinden sonra
        
        // Önceki sayfayı görünür konuma getir
        prevPageElem.style.transform = 'translateX(0)';
        prevPageElem.classList.add('active');
        
        currentPage = previousPage;
        
        // Tarayıcı geçmişini güncelle
        window.history.back();
    }
    
    /**
     * Dokunma başlangıcını işle
     */
    function handleTouchStart(e) {
        // Sadece ekranın sol kenarına yakın dokunuşları algıla
        if (e.touches[0].clientX < 30) {
            touchStartX = e.touches[0].clientX;
            isDragging = true;
            
            // Sayfaları hazırla
            if (pageHistory.length > 0) {
                const prevPageId = pageHistory[pageHistory.length - 1];
                const prevPageElem = document.getElementById(prevPageId);
                const currentPageElem = document.getElementById(currentPage);
                
                if (prevPageElem && currentPageElem) {
                    prevPageElem.style.transform = 'translateX(-30%)';
                    prevPageElem.style.transition = 'none';
                    shadowOverlay.style.opacity = '0';
                }
            }
        }
    }
    
    /**
     * Dokunma hareketini işle
     */
    function handleTouchMove(e) {
        if (!isDragging) return;
        
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        if (deltaX > 0 && pageHistory.length > 0) {
            e.preventDefault(); // Varsayılan kaydırma davranışını engelle
            
            const prevPageId = pageHistory[pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Kaydırma esnasında sayfaları hareket ettir
                const movePercentage = Math.min(100, (deltaX / window.innerWidth) * 100);
                currentPageElem.style.transform = `translateX(${movePercentage}%)`;
                currentPageElem.style.transition = 'none';
                
                prevPageElem.style.transform = `translateX(${-30 + (movePercentage * 0.3)}%)`;
                
                // Gölge efektini güncelle
                shadowOverlay.style.opacity = (movePercentage / 100).toString();
            }
        }
    }
    
    /**
     * Dokunma sonunu işle
     */
    function handleTouchEnd(e) {
        if (!isDragging) return;
        
        const deltaX = touchMoveX - touchStartX;
        
        if (pageHistory.length > 0) {
            const prevPageId = pageHistory[pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Geçiş efektlerini geri yükle
                currentPageElem.style.transition = 'transform 0.3s ease-out';
                prevPageElem.style.transition = 'transform 0.3s ease-out';
                
                if (deltaX > threshold) {
                    // Eşik değeri aşıldı, geri dön
                    currentPageElem.style.transform = 'translateX(100%)';
                    currentPageElem.classList.remove('active');
                    
                    // Temizlik için gecikmeli kaldırma
                    setTimeout(() => {
                        if (currentPageElem && currentPageElem.parentNode) {
                            currentPageElem.parentNode.removeChild(currentPageElem);
                        }
                    }, 300); // Animasyon süresinden sonra
                    
                    prevPageElem.style.transform = 'translateX(0)';
                    prevPageElem.classList.add('active');
                    
                    currentPage = prevPageId;
                    pageHistory.pop();
                    
                    // Tarayıcı geçmişini güncelle
                    window.history.back();
                } else {
                    // Eşik değeri aşılmadı, mevcut sayfada kal
                    currentPageElem.style.transform = 'translateX(0)';
                    prevPageElem.style.transform = 'translateX(-30%)';
                }
                
                // Gölge efektini sıfırla
                shadowOverlay.style.opacity = '0';
            }
        }
        
        isDragging = false;
    }
    
    // Popstate olayını dinle (tarayıcı geri/ileri düğmesi için)
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.pageId) {
            // Belli bir sayfaya git
            navigateTo(event.state.pageId);
        } else {
            // Tarayıcı geri düğmesi tıklandı, geri git
            goBack();
        }
    });
});
