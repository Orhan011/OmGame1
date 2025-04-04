/**
 * OmGame - Sayfa Kaydırma Navigasyon Sistemi
 * iOS benzeri sayfa geçişi ve geri kaydırma desteği
 */

class PageNavigationSystem {
    constructor() {
        // Sayfa geçmişini izlemek için bir dizi
        this.pageHistory = [];
        this.currentPage = null;
        
        // Dokunma olayı değişkenleri
        this.touchStartX = 0;
        this.touchMoveX = 0;
        this.isDragging = false;
        this.threshold = 50; // kaydırma eşiği (px cinsinden)
        
        // DOM elementleri
        this.pageContainer = document.getElementById('pageContainer');
        this.shadowOverlay = document.getElementById('shadowOverlay');
        
        if (!this.pageContainer) {
            console.log('Page Container bulunamadı, oluşturuluyor...');
            this.initializePageContainer();
        }
        
        // Sayfa içeriklerini hazırla
        this.setupPages();
        
        // Event listener'ları ekle
        this.setupEventListeners();
    }
    
    initializePageContainer() {
        // Sayfa konteynerini oluştur
        this.pageContainer = document.createElement('div');
        this.pageContainer.className = 'page-container';
        this.pageContainer.id = 'pageContainer';
        
        // Gölge öğesini oluştur
        this.shadowOverlay = document.createElement('div');
        this.shadowOverlay.className = 'shadow-overlay';
        this.shadowOverlay.id = 'shadowOverlay';
        
        // Sayfa konteynerine gölge öğesini ekle
        this.pageContainer.appendChild(this.shadowOverlay);
        
        // Body'nin en başına ekle
        document.body.insertBefore(this.pageContainer, document.body.firstChild);
    }
    
    setupPages() {
        // Mevcut içeriği ana sayfa olarak ayarla
        const mainContent = document.querySelector('main');
        
        if (mainContent) {
            // Orijinal içeriği sakla
            const originalContent = mainContent.cloneNode(true);
            
            // İlk sayfayı oluştur
            const homePage = document.createElement('div');
            homePage.id = 'homePage';
            homePage.className = 'page active';
            homePage.appendChild(originalContent);
            
            // Sayfa konteynerine ekle
            this.pageContainer.appendChild(homePage);
            
            // Mevcut sayfayı ayarla
            this.currentPage = 'homePage';
        } else {
            console.error('Ana içerik (main) bulunamadı!');
        }
    }
    
    setupEventListeners() {
        // Dokunmatik olayları
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Tüm link tıklamalarını dinle
        document.addEventListener('click', this.handleLinkClick.bind(this));
    }
    
    handleLinkClick(event) {
        // Tıklanan öğe bir link mi?
        const linkElement = event.target.closest('a');
        
        if (!linkElement) return;
        
        // href özelliği var mı ve geçerli bir URL mi?
        const href = linkElement.getAttribute('href');
        
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || 
            href.startsWith('mailto:') || href.startsWith('tel:') || 
            linkElement.getAttribute('target') === '_blank') {
            // Özel link türleri için normal davranışa izin ver
            return;
        }
        
        // URL aynı origin'de mi kontrol et
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) {
                // Harici URL'lere izin ver
                return;
            }
        } catch (e) {
            // Hatalı URL'leri yoksay
            return;
        }
        
        // Varsayılan davranışı engelle
        event.preventDefault();
        
        // AJAX ile sayfa içeriğini yükle
        this.loadPage(href);
    }
    
    loadPage(url) {
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
                newPage.appendChild(newContent.cloneNode(true));
                
                // Geri butonu ekle
                this.addBackButton(newPage);
                
                // Sayfa konteynerine ekle
                this.pageContainer.appendChild(newPage);
                
                // Sayfa geçişini yap
                this.navigateTo(pageId);
                
                // URL'yi güncelle (tarayıcı geçmişi için)
                window.history.pushState({ pageId: pageId }, '', url);
            })
            .catch(error => {
                console.error('Sayfa yüklenirken hata:', error);
                window.location.href = url; // Hata durumunda normal navigasyona dön
            });
    }
    
    addBackButton(pageElement) {
        // Geri butonu header'ı oluştur
        const header = document.createElement('div');
        header.className = 'page-header';
        
        const backButton = document.createElement('div');
        backButton.className = 'page-back-button';
        backButton.textContent = 'Geri';
        backButton.addEventListener('click', () => this.goBack());
        
        header.appendChild(backButton);
        
        // Sayfa başına ekle
        pageElement.insertBefore(header, pageElement.firstChild);
    }
    
    // Sayfa navigasyonu için fonksiyon
    navigateTo(pageId) {
        if (this.currentPage === pageId) return;
        
        const currentPageElem = document.getElementById(this.currentPage);
        const newPageElem = document.getElementById(pageId);
        
        if (!newPageElem || !currentPageElem) return;
        
        // Eski sayfayı sol tarafa yerleştir
        currentPageElem.style.transform = 'translateX(-100%)';
        currentPageElem.classList.remove('active');
        
        // Yeni sayfayı doğru konuma getir
        newPageElem.style.transform = 'translateX(0)';
        newPageElem.classList.add('active');
        
        // Geçmişi güncelle
        this.pageHistory.push(this.currentPage);
        this.currentPage = pageId;
    }
    
    // Geri fonksiyonu
    goBack() {
        if (this.pageHistory.length <= 0) return;
        
        const previousPage = this.pageHistory.pop();
        const currentPageElem = document.getElementById(this.currentPage);
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
        
        this.currentPage = previousPage;
        
        // Tarayıcı geçmişini güncelle
        window.history.back();
    }
    
    handleTouchStart(e) {
        // Sadece ekranın sol kenarına yakın dokunuşları algıla
        if (e.touches[0].clientX < 30) {
            this.touchStartX = e.touches[0].clientX;
            this.isDragging = true;
            
            // Sayfaları hazırla
            if (this.pageHistory.length > 0) {
                const prevPageId = this.pageHistory[this.pageHistory.length - 1];
                const prevPageElem = document.getElementById(prevPageId);
                const currentPageElem = document.getElementById(this.currentPage);
                
                if (prevPageElem && currentPageElem) {
                    prevPageElem.style.transform = 'translateX(-30%)';
                    prevPageElem.style.transition = 'none';
                    this.shadowOverlay.style.opacity = '0';
                }
            }
        }
    }
    
    handleTouchMove(e) {
        if (!this.isDragging) return;
        
        this.touchMoveX = e.touches[0].clientX;
        const deltaX = this.touchMoveX - this.touchStartX;
        
        if (deltaX > 0 && this.pageHistory.length > 0) {
            e.preventDefault(); // Varsayılan kaydırma davranışını engelle
            
            const prevPageId = this.pageHistory[this.pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(this.currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Kaydırma esnasında sayfaları hareket ettir
                const movePercentage = Math.min(100, (deltaX / window.innerWidth) * 100);
                currentPageElem.style.transform = `translateX(${movePercentage}%)`;
                currentPageElem.style.transition = 'none';
                
                prevPageElem.style.transform = `translateX(${-30 + (movePercentage * 0.3)}%)`;
                
                // Gölge efektini güncelle
                this.shadowOverlay.style.opacity = (movePercentage / 100).toString();
            }
        }
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        const deltaX = this.touchMoveX - this.touchStartX;
        
        if (this.pageHistory.length > 0) {
            const prevPageId = this.pageHistory[this.pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(this.currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Geçiş efektlerini geri yükle
                currentPageElem.style.transition = 'transform 0.3s ease-out';
                prevPageElem.style.transition = 'transform 0.3s ease-out';
                
                if (deltaX > this.threshold) {
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
                    
                    this.currentPage = prevPageId;
                    this.pageHistory.pop();
                    
                    // Tarayıcı geçmişini güncelle
                    window.history.back();
                } else {
                    // Eşik değeri aşılmadı, mevcut sayfada kal
                    currentPageElem.style.transform = 'translateX(0)';
                    prevPageElem.style.transform = 'translateX(-30%)';
                }
                
                // Gölge efektini sıfırla
                this.shadowOverlay.style.opacity = '0';
            }
        }
        
        this.isDragging = false;
    }
}

// Tarayıcı geçmişi olayını dinle
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.pageId) {
        // PageNavigationSystem örneğine referans al
        const navInstance = window.pageNavigation;
        
        if (navInstance) {
            navInstance.goBack();
        }
    }
});

// Sayfa yüklendiğinde navigasyon sistemini başlat
document.addEventListener('DOMContentLoaded', function() {
    // Navigasyon sistemini global olarak erişilebilir yap
    window.pageNavigation = new PageNavigationSystem();
});
