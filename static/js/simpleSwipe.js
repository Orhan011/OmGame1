/**
 * Basit iOS tarzı soldan sağa kaydırma navigasyonu
 * 
 * Web sitesinde parmakla soldan sağa kaydırma ile önceki sayfaya dönme işlevi
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
    
    if (deltaX > 30 && deltaX > deltaY * 2) {
      e.preventDefault();
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
    
    if ((isHorizontalSwipe && (isQuickSwipe || isLongSwipe)) && deltaX > 0) {
      // Önceki sayfaya dön
      window.history.back();
    }
    
    // Sıfırla
    isSwipeActive = false;
  }, false);
  
  // Dokunma iptali
  document.addEventListener('touchcancel', function() {
    isSwipeActive = false;
  }, false);
  
  console.log('Basit iOS tarzı kaydırma navigasyonu aktif');
});