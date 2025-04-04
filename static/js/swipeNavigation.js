// ZekaPark - iOS Tarzı Swipe Back Navigasyon Sistemi
// Sayfa geçmişini izlemek için bir dizi
let pageHistory = []; // İlk sayfa ID'si otomatik olarak eklenecek
let currentPage = null;   // İlk sayfa otomatik olarak ayarlanacak
let touchStartX = 0;
let touchMoveX = 0;
let isDragging = false;
const threshold = 50; // kaydırma eşiği (px cinsinden)
let shadowOverlay = null;

document.addEventListener('DOMContentLoaded', function() {
    // Sayfa konteyneri
    const pageContainer = document.getElementById('pageContainer');
    
    // Gölge katmanını oluştur
    shadowOverlay = document.getElementById('shadowOverlay');
    if (!shadowOverlay) {
        shadowOverlay = document.createElement('div');
        shadowOverlay.id = 'shadowOverlay';
        shadowOverlay.className = 'shadow-overlay';
        pageContainer.appendChild(shadowOverlay);
    }
    
    // Mevcut sayfayı belirle
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        currentPage = activePage.id;
        // Başlangıç sayfasını geçmişe ekle
        pageHistory = [currentPage];
    }
    
    // Sayfaları başlangıç konumlarına yerleştir
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (!page.classList.contains('active')) {
            page.style.transform = 'translateX(100%)';
        } else {
            page.style.transform = 'translateX(0)';
        }
    });
    
    // Dokunmatik olayları ekle
    initTouchEvents();
});

// Sayfa navigasyonu için fonksiyon
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

// Geri fonksiyonu
function goBack() {
    if (pageHistory.length <= 1) return;
    
    const previousPage = pageHistory.pop();
    const currentPageElem = document.getElementById(currentPage);
    const prevPageElem = document.getElementById(previousPage);
    
    if (!prevPageElem || !currentPageElem) return;
    
    // Şimdiki sayfayı sağa doğru hareket ettir
    currentPageElem.style.transform = 'translateX(100%)';
    currentPageElem.classList.remove('active');
    
    // Önceki sayfayı görünür konuma getir
    prevPageElem.style.transform = 'translateX(0)';
    prevPageElem.classList.add('active');
    
    currentPage = previousPage;
}

function initTouchEvents() {
    // Dokunmatik olayları
    document.addEventListener('touchstart', function(e) {
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
    });
    
    document.addEventListener('touchmove', function(e) {
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
    });
    
    document.addEventListener('touchend', function(e) {
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
                    
                    prevPageElem.style.transform = 'translateX(0)';
                    prevPageElem.classList.add('active');
                    
                    currentPage = prevPageId;
                    pageHistory.pop();
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
    });
}
