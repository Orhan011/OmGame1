/**
 * Profesyonel iOS tarzı soldan sağa kaydırma navigasyonu
 * 
 * Web sitesinde parmakla soldan sağa kaydırma ile önceki sayfaya dönme işlevi
 * Referrer-based Navigation - tarayıcı geçmişinden bağımsız çalışır
 */

document.addEventListener('DOMContentLoaded', function() {
  // Değişkenler
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoveX = 0;
  let touchMoveY = 0;
  let startTime = 0;
  let isSwipeActive = false;
  
  // Ayarlar
  const swipeThreshold = 100; // px cinsinden eşik değeri
  const edgeThreshold = 30;   // Ekranın kenarından başlama mesafesi (px)
  const timeThreshold = 300;  // Maksimum kaydırma süresi (ms)
  const maxVisualOffset = 150; // Maksimum görsel feedback uzaklığı (px)
  
  // Görsel elemanlar için
  let swipeOverlay = null;
  let arrowElement = null;
  
  // Ziyaret edilen sayfaları takip eden localStorage anahtarı
  const NAVIGATION_HISTORY_KEY = 'zeka_park_navigation_history';
  
  // Görsel elementi oluştur
  createSwipeElements();
  
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
  
  // Görsel geribildirim öğelerini oluştur
  function createSwipeElements() {
    // Zaten oluşturulmuşsa atla
    if (document.getElementById('swipeOverlay')) return;
    
    // Kaydırma için overlay
    swipeOverlay = document.createElement('div');
    swipeOverlay.id = 'swipeOverlay';
    swipeOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.1);
      pointer-events: none;
      opacity: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      transition: opacity 0.2s ease;
    `;
    
    // Ok simgesi
    arrowElement = document.createElement('div');
    arrowElement.id = 'swipeArrow';
    arrowElement.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: rgba(255,255,255,0.9);
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 20px;
      transform: translateX(-100px);
      transition: transform 0.2s ease;
    `;
    
    // Ok içine simge
    arrowElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;
    
    swipeOverlay.appendChild(arrowElement);
    document.body.appendChild(swipeOverlay);
  }
  
  // Dokunma başlangıcı
  document.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    startTime = Date.now();
    
    // Sadece ekranın sol kenarından başlayan dokunmaları izle
    isSwipeActive = touchStartX <= edgeThreshold;
  }, false);
  
  // Dokunma hareketi
  document.addEventListener('touchmove', function(e) {
    if (!isSwipeActive) return;
    
    const touch = e.touches[0];
    touchMoveX = touch.clientX;
    touchMoveY = touch.clientY;
    
    // Yatay kaydırma dikey kaydırmadan önemli ölçüde büyükse sayfanın kaymasını engelle
    const deltaX = touchMoveX - touchStartX;
    const deltaY = Math.abs(touchMoveY - touchStartY);
    
    // Görsel geri bildirim
    if (deltaX > 10 && deltaX > deltaY * 1.5) {
      // Sayfanın kaymasını engelle
      e.preventDefault();
      
      // Görsel geri bildirim göster
      const opacity = Math.min(deltaX / 150, 0.3);
      const arrowOffset = Math.min(deltaX * 0.5, maxVisualOffset);
      
      if (swipeOverlay && arrowElement) {
        swipeOverlay.style.opacity = opacity;
        arrowElement.style.transform = `translateX(${arrowOffset - 100}px)`;
      }
    }
  }, { passive: false });
  
  // Dokunma sonu
  document.addEventListener('touchend', function(e) {
    if (!isSwipeActive) return;
    
    const deltaX = touchMoveX - touchStartX;
    const deltaY = Math.abs(touchMoveY - touchStartY);
    const swipeTime = Date.now() - startTime;
    
    // Yatay kaydırma, dikey kaydırmadan daha belirginse ve eşik değerini aşıyorsa
    const isHorizontalSwipe = deltaX > deltaY * 1.5;
    const isQuickSwipe = swipeTime < timeThreshold && deltaX > swipeThreshold * 0.5;
    const isLongSwipe = deltaX > swipeThreshold;
    
    // Geri bildirim efektini sıfırla
    if (swipeOverlay && arrowElement) {
      swipeOverlay.style.opacity = '0';
      arrowElement.style.transform = 'translateX(-100px)';
    }
    
    if ((isHorizontalSwipe && (isQuickSwipe || isLongSwipe)) && deltaX > 0) {
      // Önceki sayfaya dön
      const previousPage = getPreviousPage();
      
      if (previousPage) {
        console.log('Önceki sayfaya dönülüyor:', previousPage);
        window.location.href = previousPage;
      } else {
        console.log('Geçmiş boş, geri gidilecek sayfa yok');
      }
    }
    
    // Sıfırla
    isSwipeActive = false;
  }, false);
  
  // Dokunma iptali
  document.addEventListener('touchcancel', function() {
    isSwipeActive = false;
    // Geri bildirim efektini sıfırla
    if (swipeOverlay && arrowElement) {
      swipeOverlay.style.opacity = '0';
      arrowElement.style.transform = 'translateX(-100px)';
    }
  }, false);
  
  console.log('Profesyonel iOS tarzı kaydırma navigasyonu aktif');
});