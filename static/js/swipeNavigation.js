
/**
 * iOS tarzı kaydırarak geri gitme özelliği
 * Bu script, iOS'ta olduğu gibi soldan sağa kaydırarak geriye gitme işlevselliği ekler.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('iOS Swipe Back Navigation initialized');
  
  // Kaydırma efekti için gerekli değişkenler
  let startX = null;
  let startY = null;
  let currentX = null;
  let threshold = 100; // Minimum kaydırma mesafesi
  let pageWidth = window.innerWidth;
  let isDragging = false;
  let overlay = null;
  let previousPagePreview = null;
  
  // Sayfanın sol kenarından başlayan dokunuşları yakalayalım
  document.addEventListener('touchstart', function(e) {
    // Sadece ekranın sol kenarından başlayan dokunuşları algıla (30px içinde)
    if (e.touches[0].clientX <= 30) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      
      // Overlay ve önceki sayfa önizlemesi oluşturma
      createOverlayAndPreview();
    }
  }, { passive: false });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    
    currentX = e.touches[0].clientX;
    let diffX = currentX - startX;
    
    // Yatay kaydırma mesafesi en az 10px olmalı ve dikey kaydırmadan büyük olmalı
    if (diffX > 10 && Math.abs(e.touches[0].clientY - startY) < Math.abs(diffX) / 2) {
      e.preventDefault();
      
      // Kaydırma yüzdesini hesapla (0-1 arası)
      let percent = Math.min(diffX / (pageWidth * 0.7), 1);
      
      // Overlay ve önizleme pozisyonunu güncelle
      updateSwipeAnimation(percent);
    }
  }, { passive: false });
  
  document.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    
    let diffX = (currentX || startX) - startX;
    
    // Eğer kullanıcı yeterince kaydırdıysa, geri git
    if (diffX > threshold) {
      completeSwipeAnimation(true);
      
      // Geçmiş kaydına geri dön
      setTimeout(() => {
        window.history.back();
      }, 200);
    } else {
      // Yetersiz kaydırma, animasyonu geri al
      completeSwipeAnimation(false);
    }
    
    // Dokunma durumunu sıfırla
    startX = null;
    startY = null;
    currentX = null;
    isDragging = false;
  }, { passive: false });
  
  // Pencerenin boyutu değiştiğinde sayfanın genişliğini güncelle
  window.addEventListener('resize', function() {
    pageWidth = window.innerWidth;
  });
  
  // Overlay ve önceki sayfa önizlemesi oluşturma
  function createOverlayAndPreview() {
    // Overlay oluşturma
    overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      z-index: 9998;
      pointer-events: none;
      transition: background 0.3s ease;
    `;
    
    // Önceki sayfa önizlemesi oluşturma
    previousPagePreview = document.createElement('div');
    previousPagePreview.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 85%;
      height: 100%;
      background: rgba(20, 20, 40, 0.9);
      z-index: 9999;
      transform: translateX(-100%);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      border-right: 1px solid rgba(106, 90, 224, 0.2);
    `;
    
    // Önceki sayfa önizlemesi içeriği oluşturma
    let previewContent = document.createElement('div');
    previewContent.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #fff;
      text-align: center;
      padding: 20px;
    `;
    
    // Geri simgesi
    let backIcon = document.createElement('i');
    backIcon.className = 'fas fa-arrow-left';
    backIcon.style.cssText = `
      font-size: 3rem;
      margin-bottom: 15px;
      color: rgba(106, 90, 224, 1);
    `;
    
    // Geri metni
    let backText = document.createElement('span');
    backText.textContent = 'Geri Dön';
    backText.style.cssText = `
      font-size: 1.5rem;
      font-weight: 500;
    `;
    
    // Önizleme içeriğini oluşturma
    previewContent.appendChild(backIcon);
    previewContent.appendChild(backText);
    previousPagePreview.appendChild(previewContent);
    
    // Belgeye ekleme
    document.body.appendChild(overlay);
    document.body.appendChild(previousPagePreview);
  }
  
  // Kaydırma animasyonunu güncelleme
  function updateSwipeAnimation(percent) {
    if (!overlay || !previousPagePreview) return;
    
    // Overlay arka planını güncelle
    overlay.style.background = `rgba(0, 0, 0, ${0.5 * percent})`;
    
    // Önizlemeyi güncelle
    previousPagePreview.style.transform = `translateX(${-100 + (100 * percent)}%)`;
  }
  
  // Kaydırma animasyonunu tamamlama
  function completeSwipeAnimation(shouldNavigate) {
    if (!overlay || !previousPagePreview) return;
    
    if (shouldNavigate) {
      // Tam kaydırma animasyonu
      overlay.style.background = 'rgba(0, 0, 0, 0.5)';
      previousPagePreview.style.transform = 'translateX(0)';
    } else {
      // Kaydırma iptal animasyonu
      overlay.style.background = 'rgba(0, 0, 0, 0)';
      previousPagePreview.style.transform = 'translateX(-100%)';
    }
    
    // Animasyon tamamlandıktan sonra overlay ve önizlemeyi kaldır
    setTimeout(() => {
      if (overlay && previousPagePreview) {
        overlay.remove();
        previousPagePreview.remove();
        overlay = null;
        previousPagePreview = null;
      }
    }, 300);
  }
});
