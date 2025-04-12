
/**
 * ZekaPark - Gelişmiş iOS Tarzı Swipe Back Navigasyon
 * 
 * Özellikler:
 * - Profesyonel sayfalar arası geçiş animasyonları
 * - iOS benzeri fizik tabanlı hareket
 * - Arka plan görünürlüğü ve paralaks efekti
 * - Dokunmatik optimizasyonu
 * - Sayfa geçmişi yönetimi
 */

document.addEventListener('DOMContentLoaded', function() {
  // Geçmiş yönetimi sistemi
  initializeNavigationHistory();
  
  // Swipe back ve sayfa geçişleri
  initializeSwipeBackSystem();
  
  // Tüm linkleri kontrol et
  initializeLinkInterception();
  
  // Geri butonlarını bağla
  bindBackButtons();
});

// Geçmiş yönetim sistemini başlat
function initializeNavigationHistory() {
  if (!localStorage.getItem('siteHistory')) {
    // İlk ziyarette geçmişi başlat
    localStorage.setItem('siteHistory', JSON.stringify([{
      url: window.location.pathname,
      title: document.title,
      timestamp: Date.now()
    }]));
  } else {
    // Mevcut geçmişi kontrol et ve güncelle
    let history = JSON.parse(localStorage.getItem('siteHistory'));
    const currentPath = window.location.pathname;
    
    // Son sayfa bu sayfa değilse, yeni sayfa olarak ekle
    const lastVisitedPage = history[history.length - 1];
    if (lastVisitedPage.url !== currentPath) {
      // Geçmişte bu sayfa daha önce ziyaret edilmiş mi kontrol et
      const existingPageIndex = history.findIndex(page => page.url === currentPath);
      
      if (existingPageIndex === -1) {
        // Yeni bir sayfa ise, geçmişe ekle
        history.push({
          url: currentPath,
          title: document.title,
          timestamp: Date.now()
        });
      } else {
        // Varolan bir sayfaya geri dönüş ise, o sayfadan sonraki tüm sayfaları kaldır
        history = history.slice(0, existingPageIndex + 1);
        // Ziyaret zamanını güncelle
        history[existingPageIndex].timestamp = Date.now();
      }
      
      // Geçmiş boyutunu kontrol et, çok büyükse eski girişleri kaldır
      if (history.length > 50) {
        history = history.slice(history.length - 50);
      }
      
      // Geçmişi kaydet
      localStorage.setItem('siteHistory', JSON.stringify(history));
    }
  }
}

// Swipe back sistemini başlat
function initializeSwipeBackSystem() {
  // Gerekli stil elementlerini oluştur
  createSwipeStyles();
  
  // Ana katmanları oluştur
  const pageContainer = document.createElement('div');
  pageContainer.className = 'swipe-page-container';
  
  // Mevcut body içeriğini container'a taşı
  while (document.body.firstChild) {
    pageContainer.appendChild(document.body.firstChild);
  }
  
  // Konteyner'ı body'e ekle
  document.body.appendChild(pageContainer);
  
  // Gölge ve overlay katmanları oluştur
  const shadowOverlay = document.createElement('div');
  shadowOverlay.className = 'swipe-shadow-overlay';
  document.body.appendChild(shadowOverlay);
  
  const backgroundOverlay = document.createElement('div');
  backgroundOverlay.className = 'swipe-background-overlay';
  document.body.appendChild(backgroundOverlay);
  
  // Önceki sayfa önizlemesi
  const previousPagePreview = document.createElement('div');
  previousPagePreview.className = 'previous-page-preview';
  document.body.insertBefore(previousPagePreview, pageContainer);
  
  // Geçmişteki önceki sayfayı kontrol et ve önizleme oluştur
  updatePreviousPagePreview(previousPagePreview);
  
  // Dokunma değişkenleri
  let startX = 0;
  let currentX = 0;
  let startY = 0;
  let currentY = 0;
  let active = false;
  let isSwiping = false;
  let initialScrollPos = 0;
  let swipeThreshold = 0;
  let touchStartTime = 0;
  
  // Dokunma başlangıcı
  document.addEventListener('touchstart', function(e) {
    // Sadece ekranın sol kenarından başlayan dokunmaları işle (30px)
    if (e.touches[0].clientX <= 30) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      currentY = startY;
      touchStartTime = Date.now();
      initialScrollPos = window.scrollY;
      active = true;
      
      // Tarayıcı geçmişinde geri gidebilir miyiz kontrol et
      const history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
      if (history.length <= 1) {
        active = false;
        return;
      }
      
      swipeThreshold = window.innerWidth * 0.3; // Ekran genişliğinin %30'u kadar sürükleme eşiği
      
      // Önizlemeyi güncelle
      updatePreviousPagePreview(previousPagePreview);
      previousPagePreview.style.display = 'block';
      
      // Zemin ve kenar gölgesini göster
      shadowOverlay.style.display = 'block';
      backgroundOverlay.style.display = 'block';
    }
  }, {passive: true});
  
  // Dokunma hareketi
  document.addEventListener('touchmove', function(e) {
    if (!active) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    
    // Yatay kaydırma varsa dikey kaydırmayı engelle
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // İlk hareket başladığında kaydırma yönünü belirle
    if (!isSwiping && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      // Yatay hareket dikey hareketten fazlaysa swipe back olarak işle
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwiping = true;
        e.preventDefault();
      } else {
        // Dikey kaydırma fazlaysa swipe işlemini iptal et
        active = false;
        resetSwipeState();
        return;
      }
    }
    
    if (isSwiping) {
      // Varsayılan davranışı engelle
      e.preventDefault();
      
      if (deltaX > 0) {
        // Sayfa konteynırını sürükleme oranında hareket ettir (kademeli yavaşlayan fizik)
        const dampenedX = Math.pow(deltaX, 0.85); // Fiziksel yavaşlama efekti
        const percent = Math.min(100, (dampenedX / window.innerWidth) * 100);
        
        pageContainer.style.transform = `translateX(${percent}%)`;
        
        // Önceki sayfa önizlemesini paralaks etkisiyle hareket ettir
        previousPagePreview.style.transform = `translateX(calc(-30% + ${percent * 0.3}%))`;
        
        // Gölge opaklığını ayarla
        shadowOverlay.style.opacity = (percent / 100) * 0.5;
        backgroundOverlay.style.opacity = (percent / 100) * 0.1;
      }
    }
  }, {passive: false});
  
  // Dokunma sonu
  document.addEventListener('touchend', function(e) {
    if (!active || !isSwiping) {
      active = false;
      isSwiping = false;
      resetSwipeState();
      return;
    }
    
    const deltaX = currentX - startX;
    const touchDuration = Date.now() - touchStartTime;
    const velocity = deltaX / touchDuration; // Hız: piksel/ms
    
    // Hem eşik değeri hem de hız kontrolü yap
    // Hızlı bir hareket (0.8 piksel/ms'den hızlı) veya yeterli kaydırma mesafesi
    const shouldNavigateBack = deltaX > swipeThreshold || (deltaX > 60 && velocity > 0.8);
    
    // Animasyon özelliklerini ayarla
    pageContainer.style.transition = `transform ${shouldNavigateBack ? 300 : 400}ms cubic-bezier(0.2, 0.85, 0.4, 1)`;
    previousPagePreview.style.transition = `transform ${shouldNavigateBack ? 300 : 400}ms cubic-bezier(0.2, 0.85, 0.4, 1)`;
    shadowOverlay.style.transition = `opacity ${shouldNavigateBack ? 300 : 400}ms cubic-bezier(0.2, 0.85, 0.4, 1)`;
    backgroundOverlay.style.transition = `opacity ${shouldNavigateBack ? 300 : 400}ms cubic-bezier(0.2, 0.85, 0.4, 1)`;
    
    if (shouldNavigateBack) {
      // Geri gitme animasyonu
      pageContainer.style.transform = 'translateX(100%)';
      previousPagePreview.style.transform = 'translateX(0)';
      shadowOverlay.style.opacity = '0';
      backgroundOverlay.style.opacity = '0';
      
      // Animasyon bittikten sonra sayfayı değiştir
      setTimeout(function() {
        navigateBack();
      }, 280);
    } else {
      // Geri çekme animasyonu
      pageContainer.style.transform = '';
      previousPagePreview.style.transform = 'translateX(-30%)';
      shadowOverlay.style.opacity = '0';
      backgroundOverlay.style.opacity = '0';
      
      // Animasyon bittikten sonra durumu sıfırla
      setTimeout(resetSwipeState, 400);
    }
    
    active = false;
    isSwiping = false;
  });
  
  // Durumu sıfırlama fonksiyonu
  function resetSwipeState() {
    pageContainer.style.transition = '';
    pageContainer.style.transform = '';
    previousPagePreview.style.transition = '';
    previousPagePreview.style.transform = '';
    previousPagePreview.style.display = 'none';
    shadowOverlay.style.transition = '';
    shadowOverlay.style.opacity = '0';
    shadowOverlay.style.display = 'none';
    backgroundOverlay.style.transition = '';
    backgroundOverlay.style.opacity = '0';
    backgroundOverlay.style.display = 'none';
  }
  
  // Geçmişteki önceki sayfa önizlemesini güncelleme
  function updatePreviousPagePreview(previewElement) {
    const history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
    if (history.length > 1) {
      const previousPage = history[history.length - 2];
      previewElement.innerHTML = `
        <div class="preview-header">
          <div class="back-indicator">
            <svg width="12" height="21" viewBox="0 0 12 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L2 10.5L10 19" stroke="#007AFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="preview-title">${previousPage.title || 'Önceki Sayfa'}</div>
        </div>
        <div class="preview-content"></div>
      `;
    }
  }
}

// Link tıklamalarını yakalama
function initializeLinkInterception() {
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    // Sadece site içi bağlantılar için
    if (link.host === window.location.host && 
        !link.href.includes('#') && 
        !link.target &&
        !e.ctrlKey && !e.metaKey) {
      
      // Sayfayı geçmişe kaydet
      let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
      const targetPath = new URL(link.href).pathname;
      
      // Aynı sayfaya gidiyorsa işlem yapma
      if (history.length > 0 && history[history.length - 1].url === targetPath) return;
      
      // Geçmişte bu sayfa var mı?
      const existingIndex = history.findIndex(page => page.url === targetPath);
      
      if (existingIndex !== -1) {
        // Varolan bir sayfaya geri dönüş - döngüsel durumu temizle
        history = history.slice(0, existingIndex + 1);
      } else {
        // Yeni sayfa ziyareti
        history.push({
          url: targetPath,
          title: link.getAttribute('data-page-title') || link.textContent.trim() || document.title,
          timestamp: Date.now()
        });
      }
      
      // Geçmişi güncelle
      localStorage.setItem('siteHistory', JSON.stringify(history));
      
      // İleri sayfaya giderken bir önceki sayfayı hafızada tut
      sessionStorage.setItem('previousUrl', window.location.pathname);
    }
  });
}

// Geri butonlarını bağla
function bindBackButtons() {
  document.querySelectorAll('.back-button').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      navigateBack();
    });
  });
}

// Geri gitme fonksiyonu
function navigateBack() {
  let history = JSON.parse(localStorage.getItem('siteHistory') || '[]');
  
  if (history.length > 1) {
    // Son sayfayı geçmişten çıkar
    history.pop();
    localStorage.setItem('siteHistory', JSON.stringify(history));
    
    // Bir önceki sayfaya git
    window.location.href = history[history.length - 1].url;
  } else if (history.length === 1) {
    // Tek sayfa kalmış, ana sayfaya dön
    window.location.href = '/';
  }
}

// Stil elementlerini oluştur
function createSwipeStyles() {
  // Stil elementi oluştur
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      position: relative;
      width: 100%;
      height: 100%;
      background-color: #f2f2f7; /* iOS arka plan rengi */
    }
    
    .swipe-page-container {
      position: relative;
      width: 100%;
      min-height: 100vh;
      z-index: 10;
      background-color: inherit;
      transform: translateX(0);
      transition: transform 0.3s;
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .swipe-shadow-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 10px;
      height: 100%;
      z-index: 15;
      box-shadow: inset 8px 0 15px -8px rgba(0, 0, 0, 0.7);
      opacity: 0;
      display: none;
      pointer-events: none;
    }
    
    .swipe-background-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.1);
      z-index: 5;
      opacity: 0;
      display: none;
      pointer-events: none;
    }
    
    .previous-page-preview {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: inherit;
      transform: translateX(-30%);
      z-index: 1;
      display: none;
      overflow: hidden;
    }
    
    .preview-header {
      display: flex;
      align-items: center;
      padding: 15px;
      height: 50px;
      background: rgba(248, 248, 248, 0.9);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .back-indicator {
      margin-right: 8px;
    }
    
    .preview-title {
      font-size: 17px;
      font-weight: 500;
      color: #007AFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .preview-content {
      background-color: rgba(250, 250, 250, 0.7);
      height: calc(100% - 50px);
      opacity: 0.7;
    }
    
    .back-button {
      display: inline-flex;
      align-items: center;
      color: #007aff;
      font-weight: normal;
      cursor: pointer;
      padding: 8px 12px;
      font-size: 17px;
      user-select: none;
    }
    
    .back-button:before {
      content: '';
      display: inline-block;
      width: 10px;
      height: 10px;
      border-top: 2px solid currentColor;
      border-left: 2px solid currentColor;
      transform: rotate(-45deg);
      margin-right: 6px;
      position: relative;
      top: 1px;
    }
    
    .back-button:active {
      opacity: 0.7;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .swipe-page-container,
      .previous-page-preview,
      .swipe-shadow-overlay,
      .swipe-background-overlay {
        transition-duration: 0.1s !important;
      }
    }
  `;
  
  // Baş elemana ekle
  document.head.appendChild(style);
}
