/**
 * Gerçekçi iOS tarzı soldan sağa kaydırma navigasyonu
 * 
 * Web sitesinde parmakla soldan sağa kaydırma ile önceki sayfaya dönme işlevi
 * Tam iOS animasyonu, fiziksel tepki ve dokunma hassasiyeti ile
 */

document.addEventListener('DOMContentLoaded', function() {
  // Değişkenler
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoveX = 0;
  let touchMoveY = 0;
  let startTime = 0;
  let isSwipeActive = false;
  let isAnimating = false;
  let previousPageUrl = null;
  let previousPageContent = null;
  let currentPageSnapshot = null;
  
  // Ayarlar
  const swipeThreshold = 100;     // px cinsinden eşik değeri
  const edgeThreshold = 35;       // Ekranın kenarından başlama mesafesi (px)
  const timeThreshold = 300;      // Maksimum kaydırma süresi (ms)
  const transitionDuration = 300; // Geçiş animasyonu süresi (ms)
  
  // Konteynerler için
  let pageContainer = null;
  let sceneContainer = null;
  let shadowOverlay = null;
  
  // Ziyaret edilen sayfaları takip eden localStorage anahtarı
  const NAVIGATION_HISTORY_KEY = 'zeka_park_navigation_history';
  const CURRENT_PAGE_SNAPSHOT_KEY = 'zeka_park_current_page_snapshot';
  
  // Konteyner elementlerini oluştur
  createContainers();
  
  // Önceki sayfanın URL'sini almak için fonksiyonlar
  function saveCurrentPageToHistory() {
    try {
      // Geçmiş verisini al veya boş bir dizi oluştur
      let navigationHistory = JSON.parse(localStorage.getItem(NAVIGATION_HISTORY_KEY) || '[]');
      
      // Mevcut sayfa URL'sini ekle
      const currentUrl = window.location.pathname;
      
      // Aynı sayfaya tekrar tekrar eklemeyi önle
      if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== currentUrl) {
        // Geçmişi maksimum 20 sayfa ile sınırla
        if (navigationHistory.length >= 20) {
          navigationHistory.shift(); // En eski sayfayı çıkar
        }
        
        // Yeni sayfayı ekle
        navigationHistory.push(currentUrl);
        localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(navigationHistory));
      }
      
      // Anlık sayfa görüntüsünü kaydet
      try {
        currentPageSnapshot = document.documentElement.innerHTML;
        localStorage.setItem(CURRENT_PAGE_SNAPSHOT_KEY, currentPageSnapshot);
      } catch (snapshotError) {
        console.warn('Sayfa görüntüsü kaydedilemedi:', snapshotError);
      }
      
    } catch (e) {
      console.error('Navigasyon geçmişi kaydedilemedi:', e);
    }
  }
  
  function getPreviousPage() {
    try {
      let navigationHistory = JSON.parse(localStorage.getItem(NAVIGATION_HISTORY_KEY) || '[]');
      
      // Geçmişte en az 2 sayfa olmalı
      if (navigationHistory.length >= 2) {
        // Son girişi kaldır (mevcut sayfa)
        navigationHistory.pop();
        
        // Şimdi en son sayfa, önceki sayfa olur
        const previousPage = navigationHistory.pop();
        
        // Güncellenen geçmişi kaydet
        localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(navigationHistory));
        
        return previousPage;
      }
    } catch (e) {
      console.error('Önceki sayfa alınamadı:', e);
    }
    
    // Hiçbir şey bulunamadıysa ana sayfaya git
    return '/';
  }
  
  // Sayfa yüklendiğinde geçmişe ekle
  saveCurrentPageToHistory();
  
  // Konteyner elementlerini oluştur
  function createContainers() {
    // Mevcut sayfayı kapsayan konteyner
    pageContainer = document.createElement('div');
    pageContainer.id = 'ios-swipe-page-container';
    pageContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: -1;
      pointer-events: none;
      perspective: 1200px;
    `;
    
    // 3D sahne konteynerı
    sceneContainer = document.createElement('div');
    sceneContainer.id = 'ios-swipe-scene-container';
    sceneContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.3s ease;
    `;
    
    // Gölge overlay
    shadowOverlay = document.createElement('div');
    shadowOverlay.id = 'ios-swipe-shadow-overlay';
    shadowOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0);
      pointer-events: none;
      z-index: 10000;
      transition: background-color 0.3s ease;
    `;
    
    // Geri butonu için ok simgesi
    const backIndicator = document.createElement('div');
    backIndicator.id = 'ios-swipe-back-indicator';
    backIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 20px;
      transform: translateY(-50%) scale(0);
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background-color: rgba(255,255,255,0.9);
      box-shadow: 0 1px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      z-index: 10001;
    `;
    
    // Ok içindeki simge
    backIndicator.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;
    
    shadowOverlay.appendChild(backIndicator);
    document.body.appendChild(shadowOverlay);
    pageContainer.appendChild(sceneContainer);
    document.body.appendChild(pageContainer);
  }
  
  // Sayfa yükleme ve içerik değiştirme fonksiyonları
  function preloadPreviousPage() {
    previousPageUrl = getPreviousPage();
    
    if (previousPageUrl === window.location.pathname) {
      previousPageUrl = '/'; // Eğer aynı sayfaya dönecekse ana sayfaya git
    }
    
    // Önceki sayfayı yükle
    if (previousPageUrl) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', previousPageUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
          previousPageContent = htmlDoc.documentElement.innerHTML;
        }
      };
      xhr.send();
    }
  }
  
  // Sayfa geçiş animasyonu
  function animatePageTransition(progress) {
    if (!sceneContainer) return;
    
    // Sayfayı kaydır
    const translateX = Math.min(progress * window.innerWidth * 0.8, window.innerWidth * 0.8);
    const scale = 0.95 + (progress * 0.05);
    const opacity = Math.min(progress * 0.7, 0.7);
    
    // 3D efekti
    const rotateY = progress * -10;
    
    document.body.style.overflow = 'hidden';
    sceneContainer.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`;
    shadowOverlay.style.backgroundColor = `rgba(0,0,0,${opacity})`;
    
    // Geri butonu göster
    const backIndicator = document.getElementById('ios-swipe-back-indicator');
    if (backIndicator) {
      backIndicator.style.transform = `translateY(-50%) scale(${progress > 0.1 ? 1 : 0})`;
    }
  }
  
  // Geçiş tamamlandığında sayfayı yükle
  function completeTransition() {
    if (previousPageUrl) {
      isAnimating = true;
      
      // Tam sayfa geçiş efekti
      sceneContainer.style.transition = `transform ${transitionDuration}ms ease-out`;
      shadowOverlay.style.transition = `background-color ${transitionDuration}ms ease-out`;
      
      // Animasyonu tamamla
      sceneContainer.style.transform = `translateX(${window.innerWidth}px) scale(1) rotateY(-10deg)`;
      shadowOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      
      // Animasyon tamamlandığında sayfayı yükle
      setTimeout(() => {
        window.location.href = previousPageUrl;
      }, transitionDuration * 0.7);
    }
  }
  
  // Geçişi iptal et - sayfayı eski haline getir
  function cancelTransition() {
    if (!sceneContainer) return;
    
    sceneContainer.style.transition = `transform ${transitionDuration}ms ease-out`;
    shadowOverlay.style.transition = `background-color ${transitionDuration}ms ease-out`;
    
    // Animasyonu sıfırla
    sceneContainer.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
    shadowOverlay.style.backgroundColor = 'rgba(0,0,0,0)';
    
    // Geri butonu gizle
    const backIndicator = document.getElementById('ios-swipe-back-indicator');
    if (backIndicator) {
      backIndicator.style.transform = 'translateY(-50%) scale(0)';
    }
    
    setTimeout(() => {
      document.body.style.overflow = '';
      isAnimating = false;
    }, transitionDuration);
  }
  
  // Sayfa içeriğini hazırla
  function preparePageForAnimation() {
    if (!sceneContainer) return;
    
    sceneContainer.style.zIndex = '10000';
    sceneContainer.innerHTML = document.documentElement.innerHTML;
    document.body.style.overflow = 'hidden';
    pageContainer.style.zIndex = '9999';
    pageContainer.style.pointerEvents = 'auto';
  }
  
  // Dokunma başlangıcı
  document.addEventListener('touchstart', function(e) {
    if (isAnimating) return;
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    startTime = Date.now();
    
    // Sadece ekranın sol kenarından başlayan dokunmaları izle
    isSwipeActive = touchStartX <= edgeThreshold;
    
    if (isSwipeActive) {
      // Önceki sayfayı yükle
      preloadPreviousPage();
      
      // Sayfayı animasyon için hazırla
      preparePageForAnimation();
    }
  }, false);
  
  // Dokunma hareketi
  document.addEventListener('touchmove', function(e) {
    if (!isSwipeActive || isAnimating) return;
    
    const touch = e.touches[0];
    touchMoveX = touch.clientX;
    touchMoveY = touch.clientY;
    
    // Yatay kaydırma dikey kaydırmadan önemli ölçüde büyükse sayfanın kaymasını engelle
    const deltaX = touchMoveX - touchStartX;
    const deltaY = Math.abs(touchMoveY - touchStartY);
    
    // Görsel geri bildirim
    if (deltaX > 5 && deltaX > deltaY * 1.2) {
      // Sayfanın kaymasını engelle
      e.preventDefault();
      
      // Kaydırma ilerlemesi (0-1 arası)
      const progress = Math.min(deltaX / (window.innerWidth * 0.8), 1);
      
      // Sayfa geçiş animasyonu
      animatePageTransition(progress);
    }
  }, { passive: false });
  
  // Dokunma sonu
  document.addEventListener('touchend', function(e) {
    if (!isSwipeActive || isAnimating) return;
    
    const deltaX = touchMoveX - touchStartX;
    const deltaY = Math.abs(touchMoveY - touchStartY);
    const swipeTime = Date.now() - startTime;
    
    // Yatay kaydırma, dikey kaydırmadan daha belirginse ve eşik değerini aşıyorsa
    const isHorizontalSwipe = deltaX > deltaY * 1.2;
    const isQuickSwipe = swipeTime < timeThreshold && deltaX > swipeThreshold * 0.5;
    const isLongSwipe = deltaX > window.innerWidth * 0.3; // Ekranın %30'u kadar kaydırma
    
    if ((isHorizontalSwipe && (isQuickSwipe || isLongSwipe)) && deltaX > 0) {
      // Önceki sayfaya geçiş animasyonunu tamamla
      completeTransition();
    } else {
      // Geçişi iptal et, sayfayı eski haline getir
      cancelTransition();
    }
    
    // Sıfırla
    isSwipeActive = false;
  }, false);
  
  // Dokunma iptali
  document.addEventListener('touchcancel', function() {
    if (isSwipeActive && !isAnimating) {
      // Geçişi iptal et
      cancelTransition();
    }
    
    // Sıfırla
    isSwipeActive = false;
  }, false);
  
  console.log('Gerçekçi iOS tarzı kaydırma navigasyonu aktif');
});