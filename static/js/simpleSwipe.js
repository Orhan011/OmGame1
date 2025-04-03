/**
 * iOS-benzeri kaydırma navigasyonu
 * Kullanıcıya parmağıyla ekranı soldan sağa doğru kaydırarak önceki sayfaya dönme imkanı sağlar
 */
document.addEventListener('DOMContentLoaded', function() {
  // Durum değişkenleri
  let touchStartX = 0;
  let touchStartY = 0;
  let currentX = 0;
  let startTime = 0;
  let isAnimating = false;

  // Minimum kaydırma mesafesi ve süresi
  const minSwipeDistance = 30; // Minimum kaydırma mesafesi (piksel)
  const maxSwipeTime = 300; // Maksimum kaydırma süresi (ms)

  // Sayfanın genişliğinin yarısı (otomatik tamamlama için)
  const halfPageWidth = window.innerWidth / 2;

  // Sayfa arka planını ön belleğe al
  const cachedBgColor = document.documentElement.style.backgroundColor || 
                         getComputedStyle(document.documentElement).backgroundColor || 
                         getComputedStyle(document.body).backgroundColor || 
                         '#0a0a18';

  // Görünüm bileşenleri oluştur - yalnızca bir kez
  const overlay = document.createElement('div');
  overlay.id = 'swipe-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0);
    pointer-events: none;
    z-index: 9998;
    will-change: background-color;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  `;

  const pageClone = document.createElement('div');
  pageClone.id = 'page-clone';
  pageClone.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(0);
    opacity: 1;
    overflow: hidden;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.25);
    background-color: ${cachedBgColor};
    will-change: transform;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  `;

  // Önceki sayfa için konteyner
  const previousPagePreview = document.createElement('div');
  previousPagePreview.id = 'previous-page-preview';
  previousPagePreview.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-15%);
    opacity: 0;
    z-index: 9997;
    background-color: ${cachedBgColor};
    overflow: hidden;
    pointer-events: none;
    will-change: transform, opacity;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  `;

  // Arkaplan rengini belirle ve sabit tut
  document.body.style.backgroundColor = cachedBgColor;
  document.documentElement.style.backgroundColor = cachedBgColor;

  // DOM'a ekle
  document.body.appendChild(overlay);
  document.body.appendChild(pageClone);
  document.body.appendChild(previousPagePreview);

  // Navigasyon geçmişi
  let navigationHistory = [];

  function initializeHistory() {
    try {
      const storedHistory = localStorage.getItem('navigationHistory');
      if (storedHistory) {
        navigationHistory = JSON.parse(storedHistory);
      }
    } catch (e) {
      console.error("Gezinme geçmişi yüklenirken hata:", e);
      navigationHistory = [];
    }

    // Link tıklamalarını dinle
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href && !link.getAttribute('target')) {
        addToHistory(link.href);
      }
    });

    // Sayfa yüklendiğinde referrer'ı ekle
    if (document.referrer) {
      addToHistory(document.referrer);
    }
  }

  // Geçmişe URL ekle
  function addToHistory(url) {
    if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== url) {
      navigationHistory.push(url);
      try {
        localStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
      } catch (e) {
        console.error("Gezinme geçmişi saklanırken hata:", e);
      }
    }
  }

  // Önceki sayfaya git
  function goBack() {
    if (navigationHistory.length > 1) {
      navigationHistory.pop();
      const previousPage = navigationHistory[navigationHistory.length - 1];

      try {
        localStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
      } catch (e) {
        console.error("Gezinme geçmişi güncellenirken hata:", e);
      }

      // Animasyon yerine hemen git
      window.location.href = previousPage;
      return true;
    } else {
      window.location.href = '/';
      return false;
    }
  }

  // Dokunma başladığında
  function handleTouchStart(e) {
    // Sadece ekranın sol kenarından başlayan dokunmaları kabul et (30px içinde)
    if (e.touches[0].clientX < 30) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      currentX = touchStartX;
      startTime = new Date().getTime();

      // Geçişleri kaldır
      overlay.style.transition = 'none';
      pageClone.style.transition = 'none';
      previousPagePreview.style.transition = 'none';

      // Mevcut sayfa rengini al
      const currentPageColor = cachedBgColor;

      // Görünümlere uygula
      pageClone.style.backgroundColor = currentPageColor;
      previousPagePreview.style.backgroundColor = currentPageColor;

      // Sayfa snapshot'ı al
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // HTML kopyalama yerine background renk kullan - daha hafif
      pageClone.innerHTML = '';
      pageClone.style.transform = 'translate3d(0, 0, 0)';

      // Önceki sayfa hazırlığı
      previousPagePreview.style.transform = 'translate3d(-15%, 0, 0)';
      previousPagePreview.style.opacity = '0';
    }
  }

  // Dokunma hareket ettiğinde - optimizasyon için basitleştirildi
  function handleTouchMove(e) {
    if (touchStartX > 0 && !isAnimating) {
      currentX = e.touches[0].clientX;
      const deltaX = currentX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Yatay kaydırma miktarı dikey kaydırmadan fazlaysa
      if (deltaX > 0 && deltaX > deltaY) {
        e.preventDefault();

        // Sınırlı çeviri - daha az DOM işlemi
        const translateX = Math.min(deltaX, window.innerWidth);

        // Hardware acceleration için translate3d kullan
        pageClone.style.transform = `translate3d(${translateX}px, 0, 0)`;

        // Basit lineer ilerleme - daha az hesaplama
        const progress = Math.min(1, translateX / window.innerWidth);

        // Arka plan opaklığı - minimal stil değişikliği
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${progress * 0.2})`;

        // Önceki sayfa - daha basit hareket (ilk karede ayarla)
        previousPagePreview.style.transform = `translate3d(${-15 + (progress * 15)}%, 0, 0)`;
        previousPagePreview.style.opacity = `${progress}`;
      }
    }
  }

  // Dokunma bittiğinde - basitleştirildi
  function handleTouchEnd(e) {
    if (touchStartX > 0 && !isAnimating) {
      const endTime = new Date().getTime();
      const touchEndX = e.changedTouches[0].clientX;
      const touchDuration = endTime - startTime;
      const touchDistance = touchEndX - touchStartX;
      const swipeSpeed = touchDistance / touchDuration;

      // Hızlı karar - doğrudan geri dön veya sıfırla
      if ((touchDistance > minSwipeDistance && touchDuration < maxSwipeTime) || 
          touchEndX > halfPageWidth || swipeSpeed > 1.0) {
        isAnimating = true;
        goBack();
      } else {
        resetSwipeAnimation();
      }
    }
  }

  // Animasyonları sıfırla
  function resetSwipeAnimation() {
    isAnimating = true;

    // Minimal animasyon
    overlay.style.transition = 'all 150ms ease-out';
    pageClone.style.transition = 'all 150ms ease-out';
    previousPagePreview.style.transition = 'all 150ms ease-out';

    // Pozisyonları sıfırla
    pageClone.style.transform = 'translate3d(0, 0, 0)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    previousPagePreview.style.transform = 'translate3d(-15%, 0, 0)';
    previousPagePreview.style.opacity = '0';

    // Durumu temizle
    setTimeout(() => {
      isAnimating = false;
      touchStartX = 0;
      touchStartY = 0;
      currentX = 0;
    }, 150);
  }

  // Dokunma iptal
  function handleTouchCancel() {
    if (touchStartX > 0) {
      resetSwipeAnimation();
    }
  }

  // Event listenerları ekle - passive kullan
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Geçmiş başlat
  initializeHistory();

  // PopState olayını izle
  window.addEventListener('popstate', function() {
    if (window.location.href) {
      addToHistory(window.location.href);
    }
  });

  // Dokunmasız cihazlarda geri butonu ekle
  if (!('ontouchstart' in window)) {
    const backButton = document.createElement('div');
    backButton.id = 'ios-back-button';
    backButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 25px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      transform: translateZ(0);
    `;

    backButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;

    backButton.addEventListener('click', function() {
      history.back();
    });

    document.body.appendChild(backButton);
  }
});