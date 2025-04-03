
/**
 * Gelişmiş iOS tarzı kaydırarak geri gitme özelliği
 * Bu script, gerçek iOS'ta olduğu gibi soldan sağa kaydırarak geriye gitme işlevselliği ekler.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced iOS Swipe Back Navigation initialized');
  
  // Kaydırma efekti için gerekli değişkenler
  let startX = null;
  let startY = null;
  let currentX = null;
  let currentY = null;
  let threshold = 70; // Minimum kaydırma mesafesi (iOS'ta daha duyarlı)
  let pageWidth = window.innerWidth;
  let isDragging = false;
  let velocity = 0;
  let lastX = null;
  let lastTime = null;
  let animationFrame = null;
  let overlay = null;
  let previousPagePreview = null;
  let currentPagePreview = null;
  let swipeEnabled = true;

  // Overlay ve önizleme elementleri oluşturma
  function createElements() {
    // Overlay oluşturma - iOS'taki karanlık arka plan efekti
    overlay = document.createElement('div');
    overlay.className = 'ios-swipe-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      z-index: 9998;
      pointer-events: none;
      transition: background 0.25s ease;
    `;
    
    // Şu an görünen sayfa önizlemesi (sağa kaydırılacak olan)
    currentPagePreview = document.createElement('div');
    currentPagePreview.className = 'ios-current-page';
    currentPagePreview.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #fff;
      z-index: 9997;
      transform: translateX(0);
      box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
      pointer-events: none;
      transition: transform 0.25s ease;
      will-change: transform;
    `;

    // Önceki sayfa önizlemesi (soldan gelecek olan)
    previousPagePreview = document.createElement('div');
    previousPagePreview.className = 'ios-previous-page';
    previousPagePreview.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(30, 30, 30, 0.95);
      z-index: 9996;
      transform: translateX(-30%);
      pointer-events: none;
      transition: transform 0.25s ease;
      will-change: transform;
    `;
    
    // Önceki sayfa içeriği - gerçek sayfa içeriğini gösterme girişimi
  try {
    // Son sayfadaki içeriği almaya çalış
    if (document.referrer && document.referrer.includes(window.location.host)) {
      // previousPagePreview'in içeriğini boşalt
      previousPagePreview.innerHTML = '';
      
      // Önceki sayfanın stilini ayarla
      previousPagePreview.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        z-index: 9996;
        transform: translateX(-30%);
        pointer-events: none;
        transition: transform 0.25s ease;
        will-change: transform;
        overflow: hidden;
      `;
      
      // Dark mode desteği
      if (document.documentElement.classList.contains('dark')) {
        previousPagePreview.style.backgroundColor = '#1a1a2e';
      }
    } else {
      // Fallback içerik - referrer yoksa
      const prevContent = document.createElement('div');
      prevContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
      `;
      
      // Geri simgesi
      const backIcon = document.createElement('div');
      backIcon.innerHTML = '<i class="fas fa-arrow-left" style="font-size: 3rem; margin-bottom: 15px; color: #fff;"></i>';
      
      // Geri metni
      const backText = document.createElement('div');
      backText.textContent = 'Önceki Sayfa';
      backText.style.cssText = 'font-size: 1.5rem; font-weight: 500;';
      
      prevContent.appendChild(backIcon);
      prevContent.appendChild(backText);
      previousPagePreview.appendChild(prevContent);
    }
  } catch (e) {
    console.log('Önceki sayfa gösterimi hatası:', e);
    
    // Hata durumunda fallback göster
    const prevContent = document.createElement('div');
    prevContent.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
    `;
    
    // Geri simgesi
    const backIcon = document.createElement('div');
    backIcon.innerHTML = '<i class="fas fa-arrow-left" style="font-size: 3rem; margin-bottom: 15px; color: #fff;"></i>';
    
    // Geri metni
    const backText = document.createElement('div');
    backText.textContent = 'Önceki Sayfa';
    backText.style.cssText = 'font-size: 1.5rem; font-weight: 500;';
    
    prevContent.appendChild(backIcon);
    prevContent.appendChild(backText);
    previousPagePreview.appendChild(prevContent);
  }
    
    // HTML'e ekle
    document.body.appendChild(previousPagePreview);
    document.body.appendChild(currentPagePreview);
    document.body.appendChild(overlay);
    
    // Mevcut sayfanın içeriğini kopyala
    try {
      currentPagePreview.innerHTML = document.body.innerHTML;
      
      // İç içe overlay oluşmasını önle
      const innerOverlays = currentPagePreview.querySelectorAll('.ios-swipe-overlay, .ios-current-page, .ios-previous-page');
      innerOverlays.forEach(el => el.remove());
    } catch (e) {
      console.log('Page content copy error:', e);
    }
  }
  
  // Sayfanın sol kenarından başlayan dokunuşları yakalayalım
  document.addEventListener('touchstart', function(e) {
    if (!swipeEnabled) return;
    
    // Sadece ekranın sol kenarından başlayan dokunuşları algıla (20px içinde)
    if (e.touches[0].clientX <= 20) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      lastX = startX;
      lastTime = Date.now();
      isDragging = true;
      
      // Hızı sıfırla
      velocity = 0;
      
      // Overlay ve önizleme oluştur
      createElements();
      
      // Animasyon çerçevesini iptal et
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }
  }, { passive: false });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    
    // X ve Y eksenindeki değişimleri hesapla
    const diffX = currentX - startX;
    const diffY = Math.abs(currentY - startY);
    
    // Eğer dikey kaydırma yataydan fazlaysa, kaydırmayı iptal et
    if (diffY > diffX * 1.2) {
      completeSwipeAnimation(false);
      isDragging = false;
      return;
    }
    
    // Yatay kaydırma mesafesi 10px'den fazlaysa ve y ekseni kaydırması çok değilse
    if (diffX > 10 && diffY < diffX * 0.8) {
      e.preventDefault();
      
      // Hız hesaplama
      const now = Date.now();
      const elapsed = now - lastTime;
      
      if (elapsed > 0) {
        velocity = (currentX - lastX) / elapsed;
      }
      
      lastX = currentX;
      lastTime = now;
      
      // Kaydırma yüzdesini hesapla (0-1 arası)
      const percent = Math.min(diffX / (pageWidth * 0.6), 1);
      
      // Animasyonu güncelle
      updateSwipeAnimation(percent);
    }
  }, { passive: false });
  
  document.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    
    const diffX = (currentX || startX) - startX;
    
    // Hızlı kaydırma testi (iOS'ta hafif bir dokunuşla geri dönülebilir)
    const isQuickSwipe = velocity * 300 > threshold;
    
    // Eğer kullanıcı yeterince kaydırdıysa veya hızlı kaydırdıysa, geri git
    if (diffX > threshold || isQuickSwipe) {
      completeSwipeAnimation(true);
      
      // Geçmiş kaydına geri dön, but don't go directly to index if we have history
      setTimeout(() => {
        if (window.history.length > 2) {
          window.history.back();
        } else if (document.referrer && document.referrer.includes(window.location.host)) {
          // Referrer'a yönlendir (farklı domain'den gelmediyse)
          window.location.href = document.referrer;
        } else {
          // Fallback olarak ana sayfaya git
          window.location.href = '/';
        }
      }, 150);
    } else {
      // Yetersiz kaydırma, animasyonu geri al
      completeSwipeAnimation(false);
    }
    
    // Dokunma durumunu sıfırla
    startX = null;
    startY = null;
    currentX = null;
    currentY = null;
    isDragging = false;
    lastX = null;
    lastTime = null;
  }, { passive: false });
  
  // Pencerenin boyutu değiştiğinde sayfanın genişliğini güncelle
  window.addEventListener('resize', function() {
    pageWidth = window.innerWidth;
  });
  
  // Swipe animasyonunu güncelleme
  function updateSwipeAnimation(percent) {
    if (!overlay || !previousPagePreview || !currentPagePreview) return;
    
    // iOS'taki kademeli karartma efekti
    overlay.style.background = `rgba(0, 0, 0, ${0.4 * percent})`;
    
    // Önceki sayfanın görünmesi (iOS'taki gibi 30% offset ile başlar)
    previousPagePreview.style.transform = `translateX(${-30 + (30 * percent)}%)`;
    
    // Mevcut sayfanın sağa doğru itilmesi
    currentPagePreview.style.transform = `translateX(${percent * 100}%)`;
    
    // 3D efekti için perspektif ve gölge
    const shadowOpacity = 0.2 * percent;
    currentPagePreview.style.boxShadow = `-5px 0 15px rgba(0, 0, 0, ${shadowOpacity})`;
  }
  
  // Kaydırma animasyonunu tamamlama
  function completeSwipeAnimation(shouldNavigate) {
    if (!overlay || !previousPagePreview || !currentPagePreview) return;
    
    // Kaydırma sırasında başka kaydırmaları engelle
    swipeEnabled = false;
    
    if (shouldNavigate) {
      // Tam kaydırma animasyonu
      overlay.style.background = 'rgba(0, 0, 0, 0.4)';
      previousPagePreview.style.transform = 'translateX(0)';
      currentPagePreview.style.transform = 'translateX(100%)';
    } else {
      // Kaydırma iptal animasyonu
      overlay.style.background = 'rgba(0, 0, 0, 0)';
      previousPagePreview.style.transform = 'translateX(-30%)';
      currentPagePreview.style.transform = 'translateX(0)';
    }
    
    // Animasyon tamamlandıktan sonra temizleme
    setTimeout(() => {
      if (overlay && previousPagePreview && currentPagePreview) {
        overlay.remove();
        previousPagePreview.remove();
        currentPagePreview.remove();
        overlay = null;
        previousPagePreview = null;
        currentPagePreview = null;
      }
      swipeEnabled = true;
    }, 300);
  }
});
