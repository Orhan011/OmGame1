
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
  let isEnabled = true; // Kaydırma etkin mi

  // Minimum kaydırma mesafesi ve süresi
  const minSwipeDistance = 30; // Minimum kaydırma mesafesi (piksel)
  const maxSwipeTime = 300; // Maksimum kaydırma süresi (ms)

  // Sayfanın genişliğinin yarısı (otomatik tamamlama için)
  const halfPageWidth = window.innerWidth / 2;

  // Sayfanın mevcut renk temasını al
  const htmlStyle = window.getComputedStyle(document.documentElement);
  const bodyStyle = window.getComputedStyle(document.body);
  const htmlBgColor = htmlStyle.backgroundColor;
  const bodyBgColor = bodyStyle.backgroundColor || htmlBgColor || '#0a0a18';

  // Animasyon katmanlarını oluştur - tüm transformları hardware-accelerated hale getir
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
    transform: translate3d(0, 0, 0);
    transition: background-color 0.25s linear;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  `;

  const pageClone = document.createElement('div');
  pageClone.id = 'page-clone';
  pageClone.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translate3d(0, 0, 0);
    opacity: 1;
    overflow: hidden;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.25);
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    perspective: 1000;
    -webkit-perspective: 1000;
  `;

  // Önceki sayfa görüntüsünü oluştur
  const previousPagePreview = document.createElement('div');
  previousPagePreview.id = 'previous-page-preview';
  previousPagePreview.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translate3d(-20%, 0, 0);
    opacity: 0;
    z-index: 9997;
    background-color: ${bodyBgColor};
    color: var(--bs-body-color, #fff);
    overflow: hidden;
    will-change: transform, opacity;
    pointer-events: none;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-style: preserve-3d;
    transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(pageClone);
  document.body.appendChild(previousPagePreview);

  // Gecikmeyi azaltmak için arka plan rengini sabitlemek için gizli bir div
  const backgroundFixer = document.createElement('div');
  backgroundFixer.id = 'background-fixer';
  backgroundFixer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${bodyBgColor};
    opacity: 0;
    z-index: -1;
    pointer-events: none;
  `;
  document.body.appendChild(backgroundFixer);

  // Konsol bilgilendirmesi kaldırıldı

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

      // Geçmişi güncelle
      if (window.location.href !== navigationHistory[navigationHistory.length - 1]) {
        // Mevcut sayfayı geçmişe ekle
        addToHistory(window.location.href);
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
        // Hata durumunda sessizce devam et
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
        // Hata durumunda sessizce devam et
      }

      window.location.href = previousPage;
      return true;
    } else {
      // Geçmişte sayfa yoksa ana sayfaya dön
      window.location.href = '/';
      return false;
    }
  }

  // Renk buzlanmasını önlemek için arka plan rengini önceden hazırla
  function prepareBackgroundColor() {
    // Root elemanların renklerini al
    const html = document.documentElement;
    const htmlBgColor = window.getComputedStyle(html).backgroundColor;
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyBgColor = bodyStyle.backgroundColor || htmlBgColor;
    
    // Arkaplan rengini hemen güncelle
    backgroundFixer.style.backgroundColor = bodyBgColor;
    previousPagePreview.style.backgroundColor = bodyBgColor;
  }

  // Önceki sayfanın görüntüsünü yükle - performans için optimize edildi
  function loadPreviousPagePreview() {
    if (navigationHistory.length > 1) {
      // Arka plan rengini önceden hazırla
      prepareBackgroundColor();
      
      // Site teması renklerini algıla ve kullan
      const html = document.documentElement;
      const htmlBgColor = window.getComputedStyle(html).backgroundColor;
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyBgColor = bodyStyle.backgroundColor || htmlBgColor;
      
      // Önceki sayfa önizlemesini oluştur - sadece arka plan rengiyle
      previousPagePreview.innerHTML = `
        <div class="previous-page-content" style="height: 100%; width: 100%; background-color: ${bodyBgColor}; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
      `;

      return true;
    }
    return false;
  }

  // Dokunma başladığında
  function handleTouchStart(e) {
    if (!isEnabled) return;
    
    // Sadece ekranın sol kenarından başlayan dokunmaları kabul et (30px içinde)
    if (e.touches[0].clientX < 30) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      currentX = touchStartX;
      startTime = new Date().getTime();

      // Arka plan rengi hazırlığı - renk buzlanmasını önlemek için
      prepareBackgroundColor();

      // Geçerli sayfanın anlık görüntüsünü al
      const pageSnapshot = document.documentElement.cloneNode(true);

      // Clone içeriğini temizle ve sayfa görüntüsünü ekle
      pageClone.innerHTML = '';
      pageClone.appendChild(pageSnapshot);

      // Clone'u göster
      pageClone.style.transform = 'translate3d(0, 0, 0)';
      pageClone.style.transition = 'none';

      // Önceki sayfa için önbellek başlat
      if (navigationHistory.length > 1) {
        loadPreviousPagePreview();
      }
    }
  }

  // Dokunma hareket ettiğinde - tamamen optimize edilmiş
  function handleTouchMove(e) {
    if (touchStartX > 0 && !isAnimating && isEnabled) {
      // Şu anki X pozisyonu
      currentX = e.touches[0].clientX;

      // X eksenindeki değişim miktarı
      const deltaX = currentX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Yatay kaydırma miktarı dikey kaydırmadan fazlaysa
      if (deltaX > 0 && deltaX > deltaY) {
        // Kaydırma animasyonunu GPU hızlandırmalı şekilde uygula
        pageClone.style.transform = `translate3d(${deltaX}px, 0, 0)`;
        
        // Kaydırma ilerlemesini hesapla
        const progress = Math.min(1, deltaX / (window.innerWidth * 0.7));
        
        // Önceki sayfayı göster - hardware accelerated
        const prevPageTranslate = -10 + (progress * 10);
        
        // Arka plan rengi geçişlerini düzenle - buzlanmayı önle
        if (progress > 0.05) {
          backgroundFixer.style.opacity = progress * 0.5;
        }
        
        // Opaklık ve transformu güncelle - daha akıcı hareket için tek seferde
        previousPagePreview.style.opacity = Math.min(1, progress * 2);
        previousPagePreview.style.transform = `translate3d(${prevPageTranslate}%, 0, 0) scale(${0.98 + (progress * 0.02)})`;
        
        // Hafif gölgelendirme
        const opacity = Math.min(0.15, progress * 0.2);
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;

        // Sayfa kaydırma davranışını engelle
        e.preventDefault();
      }
    }
  }

  // Dokunma bittiğinde - ultra optimize edilmiş
  function handleTouchEnd(e) {
    if (touchStartX > 0 && !isAnimating && isEnabled) {
      // Dokunmayı devre dışı bırak
      isEnabled = false;
      
      // Bitiş zamanı ve pozisyonu
      const endTime = new Date().getTime();
      const touchEndX = e.changedTouches[0].clientX;

      // Dokunma süresi ve mesafesi
      const touchDuration = endTime - startTime;
      const touchDistance = touchEndX - touchStartX;
      const swipeSpeed = touchDistance / touchDuration;

      // Yeterli mesafe veya hız varsa geri dön, yoksa animasyonu resetle
      if ((touchDistance > minSwipeDistance && touchDuration < maxSwipeTime) || 
          touchEndX > halfPageWidth || swipeSpeed > 1.2) {
        // Geri dönüş animasyonu
        isAnimating = true;

        // Animasyon süresini optimize et
        const animDuration = Math.max(100, Math.min(200, 350 / (swipeSpeed + 1)));

        // Sayfa geçişi için arkaplan rengini sabitle
        document.body.style.backgroundColor = bodyBgColor;
        document.documentElement.style.backgroundColor = bodyBgColor;
        backgroundFixer.style.opacity = 1;

        // Geçiş animasyonlarını senkronize et
        pageClone.style.transition = `transform ${animDuration}ms cubic-bezier(0.2, 0, 0.1, 1)`;
        overlay.style.transition = `all ${animDuration}ms cubic-bezier(0.2, 0, 0.1, 1)`;
        previousPagePreview.style.transition = `all ${animDuration}ms cubic-bezier(0.2, 0, 0.1, 1)`;
        
        // Animasyon karesini güncelle
        requestAnimationFrame(() => {
          // Mevcut sayfayı ekrandan çıkar
          pageClone.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
          
          // Önceki sayfayı tam pozisyona getir
          previousPagePreview.style.opacity = 1;
          previousPagePreview.style.transform = 'translate3d(0, 0, 0) scale(1)';
          
          // Gölge efekti
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';

          // Prefetch işlemi
          if (navigationHistory.length > 1) {
            const previousUrl = navigationHistory[navigationHistory.length - 2];
            fetch(previousUrl, { method: 'HEAD', cache: 'force-cache' });
          }

          // Sayfayı yönlendir - animasyonu beklemeden
          setTimeout(() => {
            goBack();
            isAnimating = false;
            isEnabled = true; // Dokunmayı yeniden etkinleştir
          }, Math.floor(animDuration * 0.4));
        });
      } else {
        // Animasyonu resetle
        isAnimating = true;

        // Anında geri dönüş için kısa süre
        const returnDuration = 150;

        // Tüm animasyonları senkronize et
        pageClone.style.transition = `transform ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
        overlay.style.transition = `all ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
        previousPagePreview.style.transition = `all ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;

        // Bir animasyon karesi güncelle
        requestAnimationFrame(() => {
          // Mevcut sayfayı geri pozisyona getir
          pageClone.style.transform = 'translate3d(0, 0, 0)';
          
          // Önceki sayfayı gizle
          previousPagePreview.style.opacity = 0;
          previousPagePreview.style.transform = 'translate3d(-10%, 0, 0) scale(0.98)';
          
          // Gölgelendirmeyi kaldır
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          
          // Arka plan fikseri gizle
          backgroundFixer.style.opacity = 0;
        });

        // Reset durumunu temizle
        setTimeout(() => {
          isAnimating = false;
          touchStartX = 0;
          touchStartY = 0;
          currentX = 0;
          isEnabled = true; // Dokunmayı yeniden etkinleştir
        }, returnDuration);
      }
    }
  }

  // Dokunma iptal
  function handleTouchCancel() {
    if (touchStartX > 0 && !isAnimating && isEnabled) {
      // Dokunmayı devre dışı bırak
      isEnabled = false;
      
      // Animasyonu resetle
      isAnimating = true;

      // Daha hızlı geri dönüş
      const returnDuration = 100;

      // Tüm animasyonları senkronize et
      pageClone.style.transition = `transform ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
      overlay.style.transition = `all ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;
      previousPagePreview.style.transition = `all ${returnDuration}ms cubic-bezier(0.1, 0, 0.1, 1)`;

      // Animasyon karesini güncelle
      requestAnimationFrame(() => {
        // Mevcut sayfayı geri pozisyona getir
        pageClone.style.transform = 'translate3d(0, 0, 0)';
        
        // Önceki sayfayı gizle
        previousPagePreview.style.opacity = 0;
        previousPagePreview.style.transform = 'translate3d(-10%, 0, 0) scale(0.98)';
        
        // Gölgelendirmeyi kaldır
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        
        // Arka plan fikseri gizle
        backgroundFixer.style.opacity = 0;
      });

      // Reset durumunu temizle
      setTimeout(() => {
        isAnimating = false;
        touchStartX = 0;
        touchStartY = 0;
        currentX = 0;
        isEnabled = true; // Dokunmayı yeniden etkinleştir
      }, returnDuration);
    }
  }

  // Dokunma event listenerlarını ekle - passive özelliği optimize edildi
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Geçmiş otomatik güncelleme
  initializeHistory();

  // Tüm URL'leri tarayıcının geçmişinden izle
  window.addEventListener('popstate', function(e) {
    // Mevcut durumu geçmişe ekle
    if (window.location.href) {
      addToHistory(window.location.href);
    }
  });

  // Dokunmasız cihazlarda geri butonu ekle ve normal browser geçmişini kullan  
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
      }, 150);
    });

    document.body.appendChild(backButton);
  }
  
  // Performans iyileştirmesi: Sayfa yüklendikten sonra kaydırma hazırlığı
  window.addEventListener('load', function() {
    // Sayfa arkaplan rengini hazırla
    prepareBackgroundColor();
    
    // Kaydırma hazır durumuna getir
    setTimeout(() => {
      isEnabled = true;
    }, 300);
  });
});
