/**
 * ZekaPark - iOS Swipe Navigasyon Sistemi
 * Yeni Versiyon
 */

document.addEventListener('DOMContentLoaded', function() {
    // Page Container'ı kontrol et veya oluştur
    let pageContainer = document.getElementById('pageContainer');
    if (!pageContainer) {
        console.log("Page Container bulunamadı, oluşturuluyor...");
        // Page Container'ı oluştur
        pageContainer = document.createElement('div');
        pageContainer.id = 'pageContainer';
        pageContainer.className = 'page-container';
        
        // Shadow overlay oluştur
        const shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'shadowOverlay';
        shadowOverlay.className = 'shadow-overlay';
        pageContainer.appendChild(shadowOverlay);
        
        // Body içeriğini sakla
        const bodyContent = document.body.innerHTML;
        
        // Body içeriğini temizle
        document.body.innerHTML = '';
        
        // Page Container'ı body'ye ekle
        document.body.appendChild(pageContainer);
        
        // İlk sayfayı oluştur
        const firstPage = document.createElement('div');
        firstPage.id = 'sayfa1';
        firstPage.className = 'page active';
        firstPage.innerHTML = bodyContent;
        pageContainer.appendChild(firstPage);
    }
    
    // Sayfa geçmişini izlemek için bir dizi
    window.pageHistory = ['sayfa1']; // İlk sayfa ID'nizi buraya yazın
    window.currentPage = 'sayfa1';   // İlk sayfa ID'nizi buraya yazın
    window.touchStartX = 0;
    window.touchMoveX = 0;
    window.isDragging = false;
    window.threshold = 50; // kaydırma eşiği (px cinsinden)
    
    // Dokunmatik olayları
    document.addEventListener('touchstart', function(e) {
        // Sadece ekranın sol kenarına yakın dokunuşları algıla
        if (e.touches[0].clientX < 30) {
            window.touchStartX = e.touches[0].clientX;
            window.isDragging = true;
            
            // Sayfaları hazırla
            if (window.pageHistory.length > 0) {
                const prevPageId = window.pageHistory[window.pageHistory.length - 1];
                const prevPageElem = document.getElementById(prevPageId);
                const currentPageElem = document.getElementById(window.currentPage);
                
                if (prevPageElem && currentPageElem) {
                    prevPageElem.style.transform = 'translateX(-30%)';
                    prevPageElem.style.transition = 'none';
                    document.getElementById('shadowOverlay').style.opacity = '0';
                }
            }
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!window.isDragging) return;
        
        window.touchMoveX = e.touches[0].clientX;
        const deltaX = window.touchMoveX - window.touchStartX;
        
        if (deltaX > 0 && window.pageHistory.length > 0) {
            e.preventDefault(); // Varsayılan kaydırma davranışını engelle
            
            const prevPageId = window.pageHistory[window.pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(window.currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Kaydırma esnasında sayfaları hareket ettir
                const movePercentage = Math.min(100, (deltaX / window.innerWidth) * 100);
                currentPageElem.style.transform = `translateX(${movePercentage}%)`;
                currentPageElem.style.transition = 'none';
                
                prevPageElem.style.transform = `translateX(${-30 + (movePercentage * 0.3)}%)`;
                
                // Gölge efektini güncelle
                document.getElementById('shadowOverlay').style.opacity = (movePercentage / 100).toString();
            }
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (!window.isDragging) return;
        
        const deltaX = window.touchMoveX - window.touchStartX;
        
        if (window.pageHistory.length > 0) {
            const prevPageId = window.pageHistory[window.pageHistory.length - 1];
            const prevPageElem = document.getElementById(prevPageId);
            const currentPageElem = document.getElementById(window.currentPage);
            
            if (prevPageElem && currentPageElem) {
                // Geçiş efektlerini geri yükle
                currentPageElem.style.transition = 'transform 0.3s ease-out';
                prevPageElem.style.transition = 'transform 0.3s ease-out';
                
                if (deltaX > window.threshold) {
                    // Eşik değeri aşıldı, geri dön
                    currentPageElem.style.transform = 'translateX(100%)';
                    currentPageElem.classList.remove('active');
                    
                    prevPageElem.style.transform = 'translateX(0)';
                    prevPageElem.classList.add('active');
                    
                    window.currentPage = prevPageId;
                    window.pageHistory.pop();
                } else {
                    // Eşik değeri aşılmadı, mevcut sayfada kal
                    currentPageElem.style.transform = 'translateX(0)';
                    prevPageElem.style.transform = 'translateX(-30%)';
                }
                
                // Gölge efektini sıfırla
                document.getElementById('shadowOverlay').style.opacity = '0';
            }
        }
        
        window.isDragging = false;
    });
    
    // Sayfa navigasyon fonksiyonunu global olarak tanımla
    window.navigateTo = function(pageId) {
        if (window.currentPage === pageId) return;
        
        const currentPageElem = document.getElementById(window.currentPage);
        const newPageElem = document.getElementById(pageId);
        
        if (!newPageElem) return;
        
        // Eski sayfayı sol tarafa yerleştir
        currentPageElem.style.transform = 'translateX(-100%)';
        currentPageElem.classList.remove('active');
        
        // Yeni sayfayı doğru konuma getir
        newPageElem.style.transform = 'translateX(0)';
        newPageElem.classList.add('active');
        
        // Geçmişi güncelle
        window.pageHistory.push(window.currentPage);
        window.currentPage = pageId;
    };
    
    // Geri fonksiyonunu global olarak tanımla
    window.goBack = function() {
        if (window.pageHistory.length <= 1) return;
        
        const previousPage = window.pageHistory.pop();
        const currentPageElem = document.getElementById(window.currentPage);
        const prevPageElem = document.getElementById(previousPage);
        
        if (!prevPageElem) return;
        
        // Şimdiki sayfayı sağa doğru hareket ettir
        currentPageElem.style.transform = 'translateX(100%)';
        currentPageElem.classList.remove('active');
        
        // Önceki sayfayı görünür konuma getir
        prevPageElem.style.transform = 'translateX(0)';
        prevPageElem.classList.add('active');
        
        window.currentPage = previousPage;
    };
    
    // Sayfaları başlangıç konumlarına yerleştir
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (!page.classList.contains('active')) {
            page.style.transform = 'translateX(100%)';
        }
    });
});
