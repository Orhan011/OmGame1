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

  // Animasyon katmanlarını oluştur
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
    transition: background-color 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 9998;
    will-change: background-color;
    transform: translateZ(0);
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
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    perspective: 1000px;
    -webkit-perspective: 1000px;
    transform-style: preserve-3d;
    transform: translateZ(0);
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(pageClone);

  // Kullanıcı arayüzünü bilgilendir
  console.log("iOS kaydırma navigasyonu aktif");

  // Navigasyon geçmişini takip et
  let navigationHistory = [];

  // Sayfanın daha önce ziyaret edilip edilmediğini kontrol et
  function initializeHistory() {
    // localStorage'dan geçmişi yükle
    try {
      const storedHistory = localStorage.getItem('navigationHistory');
      if (storedHistory) {
        navigationHistory = JSON.parse(storedHistory);
        console.log("Kaydedilmiş gezinme geçmişi yüklendi:", navigationHistory);
      }
    } catch (e) {
      console.error("Gezinme geçmişi yüklenirken hata:", e);
      navigationHistory = [];
    }

    console.log("Başlangıç geçmişi:", navigationHistory);

    // Link tıklamalarını dinle
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href && !link.getAttribute('target')) {
        console.log("Bağlantı tıklanması algılandı, geçmiş otomatik güncellenecek");
        // Sayfanın URL'sini geçmişe ekle
        addToHistory(link.href);
      }
    });

    // Sayfa yüklendiğinde mevcut URL'yi geçmişe ekle
    window.addEventListener('pageshow', function(e) {
      // Mevcut URL'yi geçmişe ekle
      if (document.referrer) {
        console.log("Referrer geçmişe eklendi:", document.referrer);
        addToHistory(document.referrer);
      }

      // Geçmişi güncelle
      if (window.location.href !== navigationHistory[navigationHistory.length - 1]) {
        console.log("Sayfa yüklendi, geçmiş güncellendi:", navigationHistory);
      }
    });
  }

  // Geçmişe URL ekle
  function addToHistory(url) {
    console.log("Bağlantı tıklanması ile geçmişe eklendi:", url);
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
      console.log("Önceki sayfaya gidiliyor:", previousPage);

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
      console.log("Geçmişte önceki sayfa yok, ana sayfaya dönülüyor");
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

      // Geçerli sayfanın anlık görüntüsünü al
      const pageSnapshot = document.documentElement.cloneNode(true);

      // Clone içeriğini temizle ve sayfa görüntüsünü ekle
      pageClone.innerHTML = '';
      pageClone.appendChild(pageSnapshot);

      // Clone'u göster
      pageClone.style.transform = 'translateX(0)';
      pageClone.style.transition = 'none';

      // Önceki sayfa için önbellek başlat
      if (navigationHistory.length > 1) {
        loadPreviousPagePreview();
      }

      console.log("iOS kaydırma navigasyonu başlatıldı");
    }
  }

  // Önceki sayfa görüntüsünü oluştur - site temasına uygun arkaplan rengiyle
  let previousPagePreview = document.createElement('div');
  previousPagePreview.id = 'previous-page-preview';
  // Sitenin mevcut arkaplan rengini algıla
  const computedBodyStyle = window.getComputedStyle(document.body);
  const bodyBgColor = computedBodyStyle.backgroundColor || '#0a0a18'; // Varsayılan koyu tema rengi
  
  previousPagePreview.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-20%);
    opacity: 0;
    z-index: 9997;
    background-color: ${bodyBgColor};
    color: var(--bs-body-color, #fff);
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease;
    overflow: hidden;
    will-change: transform, opacity;
    pointer-events: none;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-style: preserve-3d;
    perspective: 1000px;
    -webkit-perspective: 1000px;
  `;
  document.body.appendChild(previousPagePreview);

  // Önceki sayfanın görüntüsünü yükle - önbellek kullanarak performansı iyileştir
  const pageCache = new Map(); // Sayfa önbelleklemesi için hafıza

  async function loadPreviousPagePreview() {
    if (navigationHistory.length > 1) {
      const previousUrl = navigationHistory[navigationHistory.length - 2];
      try {
        // Sayfanın gerçek arkaplan rengini kullan
        const html = document.documentElement;
        const htmlBgColor = window.getComputedStyle(html).backgroundColor;
        // Sayfa rengini koruyarak önceki sayfa önizlemesini göster
        previousPagePreview.innerHTML = `
          <div class="previous-page-content" style="height: 100%; width: 100%; background-color: ${bodyBgColor}; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        `;

        // Sayfa içeriğini hemen göster, yükleme animasyonu olmadan
        previousPagePreview.style.opacity = '1';
        previousPagePreview.style.transform = 'translate3d(-15%, 0, 0) scale(0.98)';

        // Sayfanın rengini dinamik olarak güncelle
        previousPagePreview.style.backgroundColor = bodyBgColor;

        console.log("Önceki sayfa:", previousUrl);
        return true;
      } catch (e) {
        console.error("Önceki sayfa yüklenirken hata:", e);
        return false;
      }
    }
    return false;
  }

  // Dokunma hareket ettiğinde - daha akıcı ve hızlı animasyon
  function handleTouchMove(e) {
    if (touchStartX > 0 && !isAnimating) {
      // Şu anki X pozisyonu
      currentX = e.touches[0].clientX;

      // X eksenindeki değişim miktarı
      const deltaX = currentX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Yatay kaydırma miktarı dikey kaydırmadan fazlaysa
      if (deltaX > 0 && deltaX > deltaY) {
        // Kaydırma animasyonunu GPU hızlandırmalı şekilde uygula
        // requestAnimationFrame yerine doğrudan stil değiştirme - daha düşük gecikme
        // Daha doğal bir ivme ile kaydırma için eğriyi ayarla
        const dampenedDelta = Math.pow(deltaX, 0.92); // Daha lineer hareket için azaltıldı
        pageClone.style.transform = `translate3d(${dampenedDelta}px, 0, 0)`;

        // iOS tarzında ilerlemeli arka plan efektleri - en düşük opacity değişimi
        const progress = deltaX / window.innerWidth;
        const opacity = Math.min(0.2, progress * 0.3); // Daha da hafif gölgelendirme
        overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;

        // Arka planda hiçbir filtre efekti kullanma (performans için)
        overlay.style.backdropFilter = 'none';
        overlay.style.webkitBackdropFilter = 'none';

        // Önceki sayfayı daha akıcı ve hızlı şekilde göster
        const prevPageTranslate = -10 + (progress * 10); // -10% başlangıç, çok daha yakın
        previousPagePreview.style.opacity = Math.min(1, progress * 3); // Çok daha hızlı görünür olsun
        previousPagePreview.style.transform = `translate3d(${prevPageTranslate}%, 0, 0) scale(${0.99 + (progress * 0.01)})`;

        // Sayfa kaydırma davranışını engelle
        e.preventDefault();
      }
    }
  }

  // Dokunma bittiğinde - ultra hızlı geçişler ve geliştirilmiş sayfa geçişi
  function handleTouchEnd(e) {
    if (touchStartX > 0 && !isAnimating) {
      // Bitiş zamanı ve pozisyonu
      const endTime = new Date().getTime();
      const touchEndX = e.changedTouches[0].clientX;

      // Dokunma süresi ve mesafesi
      const touchDuration = endTime - startTime;
      const touchDistance = touchEndX - touchStartX;
      const swipeSpeed = touchDistance / touchDuration; // Swipe hızı

      // Yeterli mesafe veya hız varsa geri dön, yoksa animasyonu resetle
      if ((touchDistance > minSwipeDistance && touchDuration < maxSwipeTime) || 
          touchEndX > halfPageWidth || swipeSpeed > 1.2) { // Daha hassas hız algılama

        // Geri dönüş animasyonu - kullanıcının swipe hızına göre süreyi ayarla
        isAnimating = true;

        // Hemen hemen anında animasyon süresi - ultra hızlı geçiş
        const baseSpeed = Math.max(2.5, swipeSpeed);
        // 15-30ms aralığında süper hızlı animasyon
        const animDuration = Math.max(15, Math.min(30, 150 / baseSpeed)); 

        // En hızlı ve en doğal animasyon eğrisi
        const animationCurve = 'cubic-bezier(0.1, 0, 0.1, 1)'; // Daha da hızlı iOS eğrisi

        // Animasyondan önce önceki sayfanın arkaplan rengini kaydet
        const computedBodyStyle = window.getComputedStyle(document.body);
        const bodyBgColor = computedBodyStyle.backgroundColor || '#0a0a18';
        
        // Geçiş animasyonlarını senkronize et - daha kısa sürede
        pageClone.style.transition = `transform ${animDuration}ms ${animationCurve}`;
        overlay.style.transition = `all ${animDuration}ms ${animationCurve}`;
        previousPagePreview.style.transition = `all ${animDuration}ms ${animationCurve}`;
        
        // Önceki sayfanın arka plan rengini güncelle
        previousPagePreview.style.backgroundColor = bodyBgColor;
        document.body.style.backgroundColor = bodyBgColor;

        // Yeni sayfaya geçmeden önce önceki sayfayı hazırla - bu animasyon framelerini beklemez
        // Mevcut sayfayı ekrandan hızlıca çıkar
        pageClone.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;

        // Önceki sayfayı anında tam pozisyona getir
        previousPagePreview.style.opacity = '1';
        previousPagePreview.style.transform = 'translate3d(0, 0, 0) scale(1)';

        // Gölge efekti - performans için minimize edildi
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';

        // Animasyonun bitmesini beklemeden önce bir pre-fetch işlemi başlat
        if (navigationHistory.length > 1) {
          const previousUrl = navigationHistory[navigationHistory.length - 2];
          // Prefetch için link elementi yerine daha basit bir yaklaşım - gereksiz DOM işlemleri yok
          fetch(previousUrl, { method: 'HEAD', cache: 'force-cache' });
        }

        // Gecikmeyi en aza indiren anında sayfa geçişi
        // Animasyon süresinin yarısında geçiş başlat - animasyon tamamlanmasını bekleme
        setTimeout(() => {
          goBack();
          isAnimating = false;
        }, Math.floor(animDuration * 0.5)); // Animasyonun yarısında git
      } else {
        // Animasyonu resetle - anında geri dönüş
        isAnimating = true;

        // Anında geri dönüş için minimum süre
        const returnDuration = 20; // 50ms'den 20ms'ye düşürüldü

        // Tüm animasyonları senkronize et
        pageClone.style.transition = `transform ${returnDuration}ms cubic-bezier(0, 0, 0.1, 1)`;
        overlay.style.transition = `all ${returnDuration}ms cubic-bezier(0, 0, 0.1, 1)`;
        previousPagePreview.style.transition = `all ${returnDuration}ms cubic-bezier(0, 0, 0.1, 1)`;

        // Mevcut sayfayı geri pozisyona getir
        pageClone.style.transform = 'translate3d(0, 0, 0)';

        // Önceki sayfayı gizle
        previousPagePreview.style.opacity = '0';
        previousPagePreview.style.transform = 'translate3d(-10%, 0, 0) scale(0.99)';

        // Gölgelendirmeyi tamamen kaldır
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        overlay.style.backdropFilter = 'none';
        overlay.style.webkitBackdropFilter = 'none';

        // Çok daha kısa sürede animasyon durumunu sıfırla
        setTimeout(() => {
          isAnimating = false;
          touchStartX = 0;
          touchStartY = 0;
          currentX = 0;
        }, 10); // 10ms'de bile yeterli olabilir
      }
    }
  }

  // Dokunma iptal
  function handleTouchCancel() {
    if (touchStartX > 0 && !isAnimating) {
      // Animasyonu resetle - daha hızlı geri dönüş
      isAnimating = true;

      // Daha hızlı geri dönüş
      const returnDuration = 50; // 150ms'den 50ms'ye düşürüldü

      // Tüm animasyonları senkronize et
      pageClone.style.transition = `transform ${returnDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      overlay.style.transition = `all ${returnDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      previousPagePreview.style.transition = `all ${returnDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;

      requestAnimationFrame(() => {
        // Mevcut sayfayı geri pozisyona getir
        pageClone.style.transform = 'translate3d(0, 0, 0)';

        // Önceki sayfayı gizle
        previousPagePreview.style.opacity = '0';
        previousPagePreview.style.transform = 'translate3d(-15%, 0, 0) scale(0.98)';

        // Gölgelendirmeyi kaldır
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      });

      // Çok kısa bir süre sonra animasyon durumunu sıfırla
      setTimeout(() => {
        isAnimating = false;
        touchStartX = 0;
        touchStartY = 0;
        currentX = 0;
      }, returnDuration);
    }
  }

  // Dokunma event listenerlarını ekle
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Geçmiş otomatik güncelleme
  initializeHistory();

  // Tüm URL'leri tarayıcının geçmişinden izle
  window.addEventListener('popstate', function(e) {
    console.log("PopState olayı algılandı, geçmiş durumu güncellendi");

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
});