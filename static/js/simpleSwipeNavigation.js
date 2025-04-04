/**
 * OmGame - Basit Geri Kaydırma Navigasyon Sistemi
 * Sadece geri gezinme için iOS benzeri kaydırma desteği sağlar
 * Mevcut sayfa yapısını bozmadan çalışır
 */

document.addEventListener('DOMContentLoaded', function() {
  // Kaydırma değişkenleri
  let touchStartX = 0;
  let touchMoveX = 0;
  let isDragging = false;
  
  // Yardımcı elemanlar
  const overlay = createOverlayElement();
  const transitionLayer = createTransitionLayer();
  
  // Geri kaydırma için dokunmatik olay dinleyicileri
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  /**
   * Gölge efekti için overlay oluştur
   */
  function createOverlayElement() {
    const element = document.createElement('div');
    element.id = 'swipeOverlay';
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      z-index: 9998;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;
    document.body.appendChild(element);
    return element;
  }
  
  /**
   * Geçiş animasyonu için katman oluştur
   */
  function createTransitionLayer() {
    const element = document.createElement('div');
    element.id = 'swipeTransition';
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: white;
      z-index: 9997;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      pointer-events: none;
    `;
    
    // Tema kontrolü
    if (document.documentElement.classList.contains('dark')) {
      element.style.backgroundColor = '#121212';
    }
    
    document.body.appendChild(element);
    return element;
  }
  
  /**
   * Dokunmatik başlangıç olayını işle
   */
  function handleTouchStart(e) {
    // Sadece ekranın sol kenarından başlayan dokunmaları algıla
    if (e.touches[0].clientX < 30) {
      touchStartX = e.touches[0].clientX;
      isDragging = true;
      overlay.style.transition = 'none';
    }
  }
  
  /**
   * Dokunmatik hareket olayını işle
   */
  function handleTouchMove(e) {
    if (!isDragging) return;
    
    touchMoveX = e.touches[0].clientX;
    const deltaX = touchMoveX - touchStartX;
    
    // Sola kaydırmayı engelle, sadece sağa kaydırmaya izin ver
    if (deltaX <= 0) {
      isDragging = false;
      resetElements();
      return;
    }
    
    // Geri düğmesi varsa kaydırmaya izin ver
    if (window.history.length > 1) {
      e.preventDefault(); // Varsayılan davranışı engelle
      
      // Kaydırma miktarına göre görsel feedback sağla
      const percentage = Math.min(1, deltaX / window.innerWidth);
      
      // Overlay şeffaflığını güncelle
      overlay.style.opacity = percentage * 0.5;
      
      // Geçiş katmanını kaydır
      transitionLayer.style.transform = `translateX(${-100 + (percentage * 100)}%)`;
    }
  }
  
  /**
   * Dokunmatik bırakma olayını işle
   */
  function handleTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const deltaX = touchMoveX - touchStartX;
    const threshold = window.innerWidth * 0.25; // Ekranın 1/4'ü kadar kaydırma
    
    if (deltaX > threshold && window.history.length > 1) {
      // Animasyonu tamamla
      overlay.style.transition = 'opacity 0.2s ease';
      overlay.style.opacity = '0.5';
      
      transitionLayer.style.transition = 'transform 0.2s ease';
      transitionLayer.style.transform = 'translateX(0)';
      
      // Kısa bir gecikme ile geri git
      setTimeout(() => {
        window.history.back();
      }, 100);
      
      // Geçiş tamamlandıktan sonra elemanları sıfırla
      setTimeout(resetElements, 300);
    } else {
      // Eşiği geçmediyse elemanları sıfırla
      resetElements();
    }
  }
  
  /**
   * Geçiş elemanlarını başlangıç durumuna döndür
   */
  function resetElements() {
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '0';
    
    transitionLayer.style.transition = 'transform 0.3s ease';
    transitionLayer.style.transform = 'translateX(-100%)';
  }
  
  /**
   * Tema değişimini izle
   */
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark');
        transitionLayer.style.backgroundColor = isDark ? '#121212' : 'white';
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
});
