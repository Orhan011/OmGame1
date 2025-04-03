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
  
  // Sayfaya geldiğinizde geçmişe eklemeyi sağla
  // Bu, sayfa ziyaret edildiğinde history'nin doğru çalışmasına yardımcı olur
  // Buradaki state null olarak ayarlanmıştır, bu yeni bir giriş eklemez, sadece mevcut sayfayı günceller
  // Bu şekilde, aynı sayfayı birden fazla kez history'ye eklemekten kaçınırız
  window.history.replaceState(null, document.title, window.location.href);
  
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
      // Geçmiş uzunluğunu kontrol et, 1'den büyükse (yani geri gidecek bir sayfa varsa) geri git
      if (window.history.length > 1) {
        console.log('Önceki sayfaya dönülüyor...');
        window.history.back();
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
  }, false);
  
  // Önbellekteki link'leri de (nav çubuğu gibi) düzgün history oluşturmaya ayarla
  const navLinks = document.querySelectorAll('a:not([href^="#"]):not([href^="javascript"]):not([target="_blank"])');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Bu linkin yeni bir sayfa yükleyeceğini işaretle, böylece history düzgün çalışır
      // replaceState ile geçerli sayfayı güncelle, böylece tıklandıktan sonra yeni bir geçmiş durumu oluşur
      window.history.replaceState({navigatedFrom: window.location.href}, document.title, window.location.href);
    });
  });
  
  console.log('Basit iOS tarzı kaydırma navigasyonu aktif');
});