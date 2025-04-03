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

  // Sayfa ve tema renklerini algıla - renk buzlanmasını önle
  const documentStyle = window.getComputedStyle(document.documentElement);
  const bodyStyle = window.getComputedStyle(document.body);

  // Renk buzulmasını önlemek için başlangıçta arka plan rengini kaydet
  const documentBgColor = documentStyle.backgroundColor || '#0a0a18';
  const bodyBgColor = bodyStyle.backgroundColor || documentBgColor;
  const pageBgColor = (bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') ? bodyBgColor : documentBgColor;

  // GPU hızlandırmalı stil tanımları
  const gpuStyles = `
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    perspective: 1000;
    -webkit-perspective: 1000;
    transform-style: preserve-3d;
    will-change: transform, opacity;
  `;

  // Animasyon katmanlarını oluştur - GPU hızlandırma için optimize edildi
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
    ${gpuStyles}
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
    background-color: ${pageBgColor};
    ${gpuStyles}
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
    transform: translateX(-20%);
    opacity: 0;
    z-index: 9997;
    background-color: ${pageBgColor};
    color: var(--bs-body-color, #fff);
    overflow: hidden;
    pointer-events: none;
    ${gpuStyles}
  `;

  // Renk/tema tutarlılığı için arka plan ayarları
  document.body.style.backgroundColor = pageBgColor;
  document.documentElement.style.backgroundColor = pageBgColor;

  // Elementleri DOM'a ekle
  document.body.appendChild(overlay);
  document.body.appendChild(pageClone);
  document.body.appendChild(previousPagePreview);

  // Navigasyon geçmişini takip et
  let navigationHistory = [];

  // Sayfanın daha önce ziyaret edilip edilmediğini kontrol et
  function initializeHistory() {
    // localStorage'dan geçmişi yükle
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
        // Sayfanın URL'sini geçmişe ekle
        addToHistory(link.href);
      }
    });

    // Sayfa yüklendiğinde mevcut URL'yi geçmişe ekle
    window.addEventListener('pageshow', function(e) {
      // Mevcut URL'yi geçmişe ekle
      if (document.referrer) {
        addToHistory(document.referrer);
      }
    });
  }

  // Geçmişe URL ekle
  function addToHistory(url) {
    // Eğer geçmişte son URL ile aynı değilse ekle
    if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== url) {
      navigationHistory.push(url);

      // Geçmişi sakla
      try {
        localStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
      } catch (e) {
        console.error("Gezinme geçmişi saklanırken hata:", e);
      }
    }
  }

  // Geçmişteki önceki sayfaya git
  function goBack() {
    if (navigationHistory.length > 1) {
      // Mevcut sayfayı geçmişten çıkar
      navigationHistory.pop();

      // Önceki sayfaya git
      const previousPage = navigationHistory[navigationHistory.length - 1];

      // Geçmişi güncelle
      try {
        localStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
      } catch (e) {
        console.error("Gezinme geçmişi güncellenirken hata:", e);
      }

      window.location.href = previousPage;
      return true;
    } else {
      // Geçmişte sayfa yoksa ana sayfaya dön
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

      // Tüm varsayılan animasyon geçişlerini kaldır
      overlay.style.transition = 'none';
      pageClone.style.transition = 'none';
      previousPagePreview.style.transition = 'none';

      // Sayfanın mevcut arka plan rengini kaydet ve uygula
      const currentBgColor = detectPageBackgroundColor();
      pageClone.style.backgroundColor = currentBgColor;
      document.body.style.backgroundColor = currentBgColor;
      document.documentElement.style.backgroundColor = currentBgColor;

      // Geçerli sayfanın anlık görüntüsünü al
      const pageSnapshot = document.documentElement.cloneNode(true);

      // Clone içeriğini temizle ve sayfa görüntüsünü ekle
      pageClone.innerHTML = '';
      pageClone.appendChild(pageSnapshot);

      // Görüntüyü hazırla
      pageClone.style.transform = 'translate3d(0, 0, 0)';

      // Önceki sayfa için önbellek başlat
      if (navigationHistory.length > 1) {
        preparePreviousPagePreview(currentBgColor);
      }
    }
  }

  // Sayfanın arka plan rengini algıla
  function detectPageBackgroundColor() {
    const html = document.documentElement;
    const htmlStyle = window.getComputedStyle(html);
    const htmlBgColor = htmlStyle.backgroundColor;

    const body = document.body;
    const bodyStyle = window.getComputedStyle(body);
    const bodyBgColor = bodyStyle.backgroundColor;

    // Arkaplan rengini belirle - body'den başla, şeffafsa html'e geç
    let pageBgColor;

    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
      pageBgColor = bodyBgColor;
    } else if (htmlBgColor && htmlBgColor !== 'rgba(0, 0, 0, 0)' && htmlBgColor !== 'transparent') {
      pageBgColor = htmlBgColor;
    } else {
      // Varsayılan koyu tema rengi
      pageBgColor = '#0a0a18';
    }

    return pageBgColor;
  }

  // Önceki sayfa görüntüsünü hazırla
  function preparePreviousPagePreview(currentBgColor) {
    // Renkleri mevcut sayfadan türetilen değerlerden güvenli şekilde ayarla
    const safeColor = currentBgColor || detectPageBackgroundColor();

    // Önceki sayfa için DOM içeriğini minimal tut - sadece arkaplan göster
    previousPagePreview.innerHTML = `
      <div style="width:100%; height:100%; background-color:${safeColor}"></div>
    `;

    // Arkaplan rengini ayarla - bu en önemli adımdır
    previousPagePreview.style.backgroundColor = safeColor;

    // Önceki sayfa konumunu ayarla
    previousPagePreview.style.transform = 'translate3d(-15%, 0, 0)';
    previousPagePreview.style.opacity = '0';
  }

  // Dokunma hareket ettiğinde - Ultra optimize edilmiş ve buzulma önleyici
  function handleTouchMove(e) {
    if (touchStartX > 0 && !isAnimating) {
      // Şu anki X pozisyonu
      currentX = e.touches[0].clientX;

      // X eksenindeki değişim miktarı
      const deltaX = currentX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Yatay kaydırma miktarı dikey kaydırmadan fazlaysa
      if (deltaX > 0 && deltaX > deltaY) {
        e.preventDefault(); // Sayfa kaydırma davranışını engelle

        // GPU Hızlandırmalı Transform - Minimal CSS özellikleri
        const translateX = Math.min(deltaX, window.innerWidth); // Sınırla
        pageClone.style.transform = `translate3d(${translateX}px, 0, 0)`;

        // İlerleme hesapla - lineer ve basitleştirilmiş
        const progress = Math.min(1, translateX / window.innerWidth);

        // Arka planı karartma - sadece opaklık değişimi
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${progress * 0.2})`;

        // Önceki sayfayı göster - minimum stil değişikliği
        const prevPageTranslate = -15 + (progress * 15);
        previousPagePreview.style.transform = `translate3d(${prevPageTranslate}%, 0, 0)`;
        previousPagePreview.style.opacity = `${progress}`;
      }
    }
  }

  // Dokunma bittiğinde - Ultra optimize edilmiş ve buzulma önleyici
  function handleTouchEnd(e) {
    if (touchStartX > 0 && !isAnimating) {
      // Bitiş zamanı ve pozisyonu
      const endTime = new Date().getTime();
      const touchEndX = e.changedTouches[0].clientX;

      // Dokunma süresi ve mesafesi
      const touchDuration = endTime - startTime;
      const touchDistance = touchEndX - touchStartX;
      const swipeSpeed = touchDistance / touchDuration;

      // Yeterli mesafe veya hız varsa geri dön
      if ((touchDistance > minSwipeDistance && touchDuration < maxSwipeTime) || 
          touchEndX > halfPageWidth || swipeSpeed > 1.0) {

        // Animasyon durumunu ayarla
        isAnimating = true;

        // Önceki sayfaya anında geçiş
        goBack();

      } else {
        // Geri dönüş iptal - anında sıfırla
        resetSwipeAnimation();
      }
    }
  }

  // Tüm animasyonları sıfırla ve varsayılan duruma geri dön
  function resetSwipeAnimation() {
    isAnimating = true;

    // Tüm animasyon geçişlerini ayarla - en kısa süre
    const resetDuration = 10; // ms, çok kısa
    const easing = 'linear';

    // Tek seferde tüm animasyonları ayarla
    [pageClone, overlay, previousPagePreview].forEach(el => {
      el.style.transition = `all ${resetDuration}ms ${easing}`;
    });

    // Pozisyonları sıfırla
    pageClone.style.transform = 'translate3d(0, 0, 0)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    previousPagePreview.style.transform = 'translate3d(-15%, 0, 0)';
    previousPagePreview.style.opacity = '0';

    // Durumu sıfırla
    setTimeout(() => {
      isAnimating = false;
      touchStartX = 0;
      touchStartY = 0;
      currentX = 0;
    }, resetDuration);
  }

  // Dokunma iptal
  function handleTouchCancel() {
    if (touchStartX > 0) {
      resetSwipeAnimation();
    }
  }

  // Dokunma event listenerlarını ekle
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Geçmiş otomatik güncelleme
  initializeHistory();

  // PopState olayını izle
  window.addEventListener('popstate', function() {
    // Mevcut durumu geçmişe ekle
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
      transition: transform 0.2s ease, opacity 0.2s ease;
    `;

    backButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;

    backButton.addEventListener('click', function() {
      backButton.style.transform = 'scale(0.95)';
      setTimeout(() => {
        history.back();
      }, 100);
    });

    document.body.appendChild(backButton);
  }

  // Sayfanın arka plan rengini dinamik olarak izle ve buzulmaları önle
  const documentObserver = new MutationObserver(() => {
    // Sadece arka plan rengi değişimini izle
    const newDocumentBgColor = window.getComputedStyle(document.documentElement).backgroundColor;
    const newBodyBgColor = window.getComputedStyle(document.body).backgroundColor;

    // Arka plan rengi değiştiyse güncelle
    if (newDocumentBgColor !== documentBgColor || newBodyBgColor !== bodyBgColor) {
      const newPageBgColor = (newBodyBgColor !== 'rgba(0, 0, 0, 0)' && newBodyBgColor !== 'transparent') ? 
                            newBodyBgColor : newDocumentBgColor;

      // Tüm arka plan renklerini senkronize et
      previousPagePreview.style.backgroundColor = newPageBgColor;
      pageClone.style.backgroundColor = newPageBgColor;
    }
  });

  // Sadece özellik değişikliklerini izle - performans için optimize
  documentObserver.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['style', 'class'] 
  });

  documentObserver.observe(document.body, { 
    attributes: true,
    attributeFilter: ['style', 'class'] 
  });
});