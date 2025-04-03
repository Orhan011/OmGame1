
/**
 * iOS 16+ kaydırma navigasyon sistemi
 * Apple'ın Native Safari/iOS Edge Swipe geri animasyonu
 */
document.addEventListener('DOMContentLoaded', function() {
  // Ana değişkenler ve yapılandırma
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 80; // Minimum kaydırma mesafesi
  const maxSwipeTime = 300; // Maksimum kaydırma süresi (ms)
  const edgeSize = 25; // Kenar bölgesi büyüklüğü (piksel)
  let touchStartTime = 0;
  let touchEndTime = 0;
  let isSwipingBack = false;
  let initialScrollY = 0;
  let velocity = 0; // Hız değişkeni
  let lastX = 0;
  let lastTime = 0;
  
  // Animasyon durumu
  let animationId = null;
  
  // Animasyon kapsayıcısı
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  swipeContainer.style.position = 'fixed';
  swipeContainer.style.top = '0';
  swipeContainer.style.left = '0';
  swipeContainer.style.width = '100%';
  swipeContainer.style.height = '100%';
  swipeContainer.style.zIndex = '99999';
  swipeContainer.style.visibility = 'hidden';
  swipeContainer.style.overflow = 'hidden';
  swipeContainer.style.pointerEvents = 'none';
  document.body.appendChild(swipeContainer);

  // Arka plan karartma katmanı
  const darkOverlay = document.createElement('div');
  darkOverlay.className = 'ios-swipe-overlay';
  darkOverlay.style.position = 'absolute';
  darkOverlay.style.top = '0';
  darkOverlay.style.left = '0';
  darkOverlay.style.width = '100%';
  darkOverlay.style.height = '100%';
  darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  darkOverlay.style.transition = 'none';
  swipeContainer.appendChild(darkOverlay);

  // Önceki sayfa önizleme paneli
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page-preview';
  prevPagePreview.style.position = 'absolute';
  prevPagePreview.style.top = '0';
  prevPagePreview.style.left = '-100%';
  prevPagePreview.style.width = '88%'; // iOS tarzı genişlik
  prevPagePreview.style.height = '100%';
  prevPagePreview.style.backgroundColor = getBackgroundColor();
  prevPagePreview.style.boxShadow = '0 0 25px rgba(0, 0, 0, 0.22)';
  prevPagePreview.style.borderTopRightRadius = '10px';
  prevPagePreview.style.borderBottomRightRadius = '10px';
  prevPagePreview.style.transform = 'translateX(0)';
  prevPagePreview.style.willChange = 'transform';
  prevPagePreview.style.overflow = 'hidden';
  
  // Sağ kenar gölgesi
  const gradient = document.createElement('div');
  gradient.style.position = 'absolute';
  gradient.style.top = '0';
  gradient.style.right = '0';
  gradient.style.width = '5px';
  gradient.style.height = '100%';
  gradient.style.background = 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1))';
  gradient.style.pointerEvents = 'none';
  gradient.style.opacity = '0';
  prevPagePreview.appendChild(gradient);

  // Geri oku simgesi
  const backArrow = document.createElement('div');
  backArrow.className = 'ios-back-arrow';
  backArrow.style.position = 'absolute';
  backArrow.style.top = '50%';
  backArrow.style.left = '15px';
  backArrow.style.width = '12px';
  backArrow.style.height = '12px';
  backArrow.style.borderTop = '2px solid #007aff';
  backArrow.style.borderLeft = '2px solid #007aff';
  backArrow.style.transform = 'translateY(-50%) rotate(-45deg)';
  backArrow.style.opacity = '0';
  backArrow.style.transition = 'opacity 0.15s ease';
  backArrow.style.zIndex = '5';
  prevPagePreview.appendChild(backArrow);

  // Sahte önceki sayfa başlığı alanı
  const fakeHeader = document.createElement('div');
  fakeHeader.className = 'ios-fake-header';
  fakeHeader.style.position = 'absolute';
  fakeHeader.style.top = '0';
  fakeHeader.style.left = '0';
  fakeHeader.style.width = '100%';
  fakeHeader.style.height = '54px';
  fakeHeader.style.backgroundColor = isDarkMode() ? 'rgba(29, 29, 31, 0.8)' : 'rgba(248, 248, 248, 0.8)';
  fakeHeader.style.backdropFilter = 'blur(10px)';
  fakeHeader.style.WebkitBackdropFilter = 'blur(10px)';
  fakeHeader.style.borderBottom = isDarkMode() ? '0.5px solid rgba(255, 255, 255, 0.1)' : '0.5px solid rgba(0, 0, 0, 0.1)';
  fakeHeader.style.display = 'flex';
  fakeHeader.style.alignItems = 'center';
  fakeHeader.style.padding = '0 15px';
  fakeHeader.style.zIndex = '2';

  // Önceki sayfa başlığı 
  const prevPageTitle = document.createElement('div');
  prevPageTitle.className = 'ios-prev-page-title';
  prevPageTitle.style.color = isDarkMode() ? '#fff' : '#000';
  prevPageTitle.style.fontSize = '17px';
  prevPageTitle.style.fontWeight = '500';
  prevPageTitle.style.textAlign = 'center';
  prevPageTitle.style.width = '100%';
  prevPageTitle.style.overflow = 'hidden';
  prevPageTitle.style.textOverflow = 'ellipsis';
  prevPageTitle.style.whiteSpace = 'nowrap';
  prevPageTitle.style.opacity = '0';
  prevPageTitle.style.transform = 'translateX(15px)';
  prevPageTitle.style.transition = 'none';
  prevPageTitle.textContent = 'Önceki Sayfa';

  // Başlık belirlemek için akıllı sistem
  const pageTitle = document.title || 'Anasayfa';
  determinePreviousPageTitle();

  fakeHeader.appendChild(prevPageTitle);
  prevPagePreview.appendChild(fakeHeader);

  // İçerik alanı
  const contentArea = document.createElement('div');
  contentArea.className = 'ios-content-area';
  contentArea.style.position = 'absolute';
  contentArea.style.top = '54px';
  contentArea.style.left = '0';
  contentArea.style.width = '100%';
  contentArea.style.height = 'calc(100% - 54px)';
  contentArea.style.overflow = 'hidden';
  contentArea.style.backgroundColor = getBackgroundColor();
  prevPagePreview.appendChild(contentArea);

  // Sahte önceki sayfa içeriği
  const fakePrevPageContent = document.createElement('div');
  fakePrevPageContent.className = 'ios-prev-page-content';
  fakePrevPageContent.style.width = '100%';
  fakePrevPageContent.style.height = '100%';
  fakePrevPageContent.style.paddingBottom = '40px';
  contentArea.appendChild(fakePrevPageContent);

  swipeContainer.appendChild(prevPagePreview);

  // Soldan kenar göstergesi (kullanıcıya kaydırmanın mevcut olduğunu gösterir)
  const edgeIndicator = document.createElement('div');
  edgeIndicator.className = 'ios-edge-indicator';
  edgeIndicator.style.position = 'fixed';
  edgeIndicator.style.top = '0';
  edgeIndicator.style.left = '0';
  edgeIndicator.style.width = '2.5px';
  edgeIndicator.style.height = '100%';
  edgeIndicator.style.background = 'linear-gradient(to right, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0))';
  edgeIndicator.style.pointerEvents = 'none';
  edgeIndicator.style.opacity = '0';
  document.body.appendChild(edgeIndicator);

  // Sayfa yüklendiğinde kenar göstergesini kısa süreliğine göster
  if (window.history.length > 1) {
    setTimeout(() => {
      edgeIndicator.style.transition = 'opacity 0.5s ease';
      edgeIndicator.style.opacity = '1';

      setTimeout(() => {
        edgeIndicator.style.opacity = '0';
      }, 1500);
    }, 800);
  }

  // Dokunma olayı dinleyicileri
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Dokunma başlangıcını işle
  function handleTouchStart(event) {
    // Oyun kontrollerini etkilememek için bazı elementleri kontrol et
    const target = event.target;
    if (target.closest('.game-container, canvas, .control-btn, .simon-pad, input, button, .card, audio, video, [role="button"]')) {
      return; // Etkileşimli elementlerde kaydırma özelliğini devre dışı bırak
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    lastX = touchStartX;
    lastTime = Date.now();
    touchStartTime = lastTime;
    initialScrollY = window.scrollY;
    velocity = 0;

    // Dokunma sol kenarda mı kontrol et
    if (touchStartX <= edgeSize) {
      // Sadece geçmiş varsa kenar kaydırmayı etkinleştir
      if (window.history.length > 1) {
        isSwipingBack = true;

        // Animasyon elementlerini hazırla
        swipeContainer.style.visibility = 'visible';
        setupFakePreviousPage();

        // Varsayılan davranışı önle
        event.preventDefault();
      }
    }
  }

  // Sahte önceki sayfayı kur
  function setupFakePreviousPage() {
    // Geçerli renk temasına göre stili ayarla
    updateColorScheme();

    // Önceki sayfa içeriği oluştur
    generatePlaceholderContent();

    // Hafif bir gecikmeyle başlığı göster (iOS tarzı animasyon)
    setTimeout(() => {
      prevPageTitle.style.opacity = '1';
      prevPageTitle.style.transform = 'translateX(0)';
    }, 120);
  }

  // Önceki sayfa başlığını belirle
  function determinePreviousPageTitle() {
    // Referrer URL'den veya diğer yöntemlerle başlık belirleme
    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        const pathSegments = referrerUrl.pathname.split('/').filter(Boolean);
        
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1].replace(/\.html$/, "");
          
          if (lastSegment === 'index' || lastSegment === '') {
            prevPageTitle.textContent = 'Anasayfa';
          } else {
            // URL'den başlık oluşturma
            const cleanTitle = lastSegment
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, l => l.toUpperCase()); // Her kelimenin ilk harfini büyüt
              
            prevPageTitle.textContent = cleanTitle;
          }
        } else {
          prevPageTitle.textContent = 'Anasayfa';
        }
      } else {
        // Tahmini mantıkla başlığı belirle
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('games/')) {
          prevPageTitle.textContent = 'Oyunlar';
        } else if (currentPath.includes('profile')) {
          prevPageTitle.textContent = 'Anasayfa';
        } else {
          prevPageTitle.textContent = 'Anasayfa';
        }
      }
    } catch (e) {
      prevPageTitle.textContent = 'Geri';
    }
  }

  // Dolgu içeriği oluştur
  function generatePlaceholderContent() {
    fakePrevPageContent.innerHTML = '';

    // iOS tarzı liste içeriği
    const listContainer = document.createElement('div');
    listContainer.style.padding = '10px 15px';

    // Rastgele sayıda liste öğesi oluştur
    const numItems = Math.floor(Math.random() * 3) + 6;

    for (let i = 0; i < numItems; i++) {
      const listItem = document.createElement('div');
      listItem.style.padding = '12px 0';
      listItem.style.borderBottom = isDarkMode() ? 
        '0.5px solid rgba(255, 255, 255, 0.1)' : 
        '0.5px solid rgba(0, 0, 0, 0.05)';
      listItem.style.display = 'flex';
      listItem.style.alignItems = 'center';

      // İkon alanı
      const iconPlaceholder = document.createElement('div');
      iconPlaceholder.style.width = '32px';
      iconPlaceholder.style.height = '32px';
      iconPlaceholder.style.borderRadius = '8px';
      iconPlaceholder.style.backgroundColor = getRandomPastelColor();
      iconPlaceholder.style.marginRight = '15px';
      iconPlaceholder.style.flexShrink = '0';

      // Metin alanı
      const textContainer = document.createElement('div');
      textContainer.style.flex = '1';

      // Başlık
      const title = document.createElement('div');
      title.style.height = '14px';
      title.style.borderRadius = '4px';
      title.style.backgroundColor = isDarkMode() ? 
        'rgba(255, 255, 255, 0.12)' : 
        'rgba(0, 0, 0, 0.08)';
      title.style.width = `${40 + Math.random() * 40}%`;
      title.style.marginBottom = '6px';

      // Alt metin
      const subtitle = document.createElement('div');
      subtitle.style.height = '10px';
      subtitle.style.borderRadius = '4px';
      subtitle.style.backgroundColor = isDarkMode() ? 
        'rgba(255, 255, 255, 0.08)' : 
        'rgba(0, 0, 0, 0.05)';
      subtitle.style.width = `${60 + Math.random() * 30}%`;

      textContainer.appendChild(title);
      textContainer.appendChild(subtitle);

      // İleri oku
      const chevron = document.createElement('div');
      chevron.style.width = '7px';
      chevron.style.height = '7px';
      chevron.style.borderTop = isDarkMode() ? 
        '1.5px solid rgba(255, 255, 255, 0.3)' : 
        '1.5px solid rgba(0, 0, 0, 0.2)';
      chevron.style.borderRight = isDarkMode() ? 
        '1.5px solid rgba(255, 255, 255, 0.3)' : 
        '1.5px solid rgba(0, 0, 0, 0.2)';
      chevron.style.transform = 'rotate(45deg)';
      chevron.style.margin = '0 5px';

      listItem.appendChild(iconPlaceholder);
      listItem.appendChild(textContainer);
      listItem.appendChild(chevron);

      listContainer.appendChild(listItem);
    }

    fakePrevPageContent.appendChild(listContainer);
  }

  // Dokunma hareketini işle
  function handleTouchMove(event) {
    if (!isSwipingBack) return;

    // Varsayılan davranışı önle
    event.preventDefault();

    const now = Date.now();
    const dt = now - lastTime;

    touchCurrentX = event.touches[0].clientX;
    touchCurrentY = event.touches[0].clientY;

    // Yatay ve dikey mesafeyi hesapla
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    // Dikey kaydırma, yataydan çok daha fazlaysa iptal et
    if (Math.abs(deltaY) > Math.abs(deltaX) * 2 && Math.abs(deltaX) < 30) {
      handleTouchCancel();
      return;
    }

    // Hız hesapla (piksel/ms)
    if (dt > 0) {
      const instantVelocity = (touchCurrentX - lastX) / dt;
      // Hızı daha pürüzsüz hesapla
      velocity = instantVelocity * 0.5 + velocity * 0.5;
    }

    lastX = touchCurrentX;
    lastTime = now;

    if (deltaX > 0) {
      // Maksimum mesafeye göre ilerlemeyi hesapla
      const maxDistance = window.innerWidth * 0.85;
      let progress = Math.min(deltaX / maxDistance, 1);

      // Eğri düzeltme
      // Bu eğri, iOS sistemindeki gerçek hareket hissini verir
      progress = cubicBezier(0.25, 0.46, 0.45, 0.94, progress);

      // Öğelere dönüşüm uygula
      const translateX = Math.min(deltaX, maxDistance);
      prevPagePreview.style.transform = `translateX(${translateX}px)`;

      // Gölgeyi göster
      gradient.style.opacity = Math.min(1, progress * 1.3);

      // Overlay'ı karart
      const alpha = Math.max(0, Math.min(0.4, progress * 0.4)); // 0.4 maksimum opaklık
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;

      // Geri oku göster
      backArrow.style.opacity = Math.min(1, progress * 1.5);

      // Başlığı hareket ettir
      prevPageTitle.style.opacity = Math.min(1, progress * 1.5);
      prevPageTitle.style.transform = `translateX(${Math.max(0, 15 - progress * 15)}px)`;

      // İlerleme %90'ı aşarsa hafif yay efekti ekle
      if (progress > 0.85) {
        const overProgress = (progress - 0.85) / 0.15;
        // Kademeli elastik efekt
        const elasticity = Math.sin(overProgress * Math.PI / 2) * Math.min(10, overProgress * 20);
        prevPagePreview.style.transform = `translateX(${translateX + elasticity}px)`;
      }
    }
  }

  // Dokunma sonlandırmayı işle
  function handleTouchEnd(event) {
    if (!isSwipingBack) return;

    touchEndX = touchCurrentX;
    touchEndY = touchCurrentY;
    touchEndTime = Date.now();

    // Kaydırma mesafesi ve süresini hesapla
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    const swipeSpeed = swipeDistance / swipeTime;

    // Kaydırma mesafesi veya hızı yeterli ise (iOS tarzı)
    const screenWidth = window.innerWidth;
    const minDistance = screenWidth * 0.35; // Ekranın %35'i
    const minVelocity = 0.5; // Piksel/ms (hızlı hareket)
    
    // Mevcut pozisyonu al
    const currentPosition = parseFloat(getComputedStyle(prevPagePreview).transform.split(',')[4]) || 0;

    if (swipeDistance > minDistance || (swipeDistance > screenWidth * 0.15 && velocity > minVelocity)) {
      // Geri gitme animasyonunu tamamla
      completeSwipeAnimation(currentPosition);
    } else {
      // Geri gitmeyi iptal et
      cancelSwipeWithAnimation(currentPosition);
    }

    isSwipingBack = false;
  }

  // Kaydırma animasyonunu tamamla
  function completeSwipeAnimation(currentPosition) {
    // Mevcut animasyonu iptal et
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    const targetX = window.innerWidth + 20; // Biraz fazla uzat
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    let duration;
    
    // Hareketin şiddetine göre süreyi ayarla
    if (velocity > 1.5) {
      // Hızlı hareket - çok daha hızlı tamamla
      duration = 220;
    } else if (velocity > 0.8) {
      // Orta hızlı hareket
      duration = 260;
    } else {
      // Yavaş hareket
      duration = 300;
    }

    // iOS'un yay efekti için gerçekçi bezier zamanlama fonksiyonu
    function animate() {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // iOS eğrisi - hızlanarak başlar, sonra yavaşlar
      const easedProgress = cubicBezier(0.32, 0.72, 0, 1, rawProgress);
      
      const newX = currentPosition + (distance * easedProgress);

      // Öğeleri güncelle
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * (1 - easedProgress)})`;
      gradient.style.opacity = Math.max(0, 1 - easedProgress * 1.5);
      
      backArrow.style.opacity = Math.max(0, 1 - easedProgress * 1.5);
      prevPageTitle.style.opacity = Math.max(0, 1 - easedProgress * 1.8);

      if (rawProgress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animasyon tamamlandı, önceki sayfaya git
        window.history.back();
        resetSwipeElements();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // Dokunma iptalini işle
  function handleTouchCancel() {
    if (isSwipingBack) {
      const currentPosition = parseFloat(getComputedStyle(prevPagePreview).transform.split(',')[4]) || 0;
      cancelSwipeWithAnimation(currentPosition);
      isSwipingBack = false;
    }
  }

  // Kaydırmayı iptal et ve geri animasyonu göster
  function cancelSwipeWithAnimation(currentPosition) {
    // Mevcut animasyonu iptal et
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    const targetX = 0;
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    let duration = 280; // ms

    // Mesafe çok kısaysa animasyonu hızlandır
    if (Math.abs(currentPosition) < 60) {
      duration = 180;
    }

    // iOS'un geri çekilme animasyonu için gerçekçi zamanlama fonksiyonu
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // iOS'un gerçek hareket hissi için gelişmiş geri dönüş eğrisi
      const easedProgress = cubicBezier(0.25, 0.74, 0.22, 0.99, progress);
      
      let newX = currentPosition * (1 - easedProgress);
      
      // İleri seviye elastik efekti ekle (0.7-0.95 aralığında)
      if (progress > 0.7 && progress < 0.95) {
        const springEffect = Math.sin((progress - 0.7) * 8) * 5 * (1 - progress);
        newX += springEffect;
      }

      // Tüm pozisyonları güncelle
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      
      // Arkaplanı karartmayı kaldır
      const alphaProgress = cubicBezier(0.4, 0, 0.2, 1, easedProgress);
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * (1 - alphaProgress)})`;
      
      // Diğer elementleri güncelle
      backArrow.style.opacity = Math.max(0, 1 - easedProgress * 1.8);
      prevPageTitle.style.opacity = Math.max(0, 1 - easedProgress * 2);
      prevPageTitle.style.transform = `translateX(${(easedProgress * 15)}px)`;
      gradient.style.opacity = Math.max(0, 1 - easedProgress * 1.5);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animasyon tamamlandı
        resetSwipeElements();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // Kaydırma elementlerini sıfırla
  function resetSwipeElements() {
    // Animasyonu temizle
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Tüm elementleri varsayılan konumlarına getir
    prevPagePreview.style.transform = 'translateX(0)';
    prevPagePreview.style.transition = 'none';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    darkOverlay.style.transition = 'none';
    
    backArrow.style.opacity = '0';
    prevPageTitle.style.opacity = '0';
    prevPageTitle.style.transform = 'translateX(15px)';
    gradient.style.opacity = '0';
    
    // Konteyneri gizle
    swipeContainer.style.visibility = 'hidden';
    
    // İçeriği temizle
    fakePrevPageContent.innerHTML = '';
  }

  // Yardımcı fonksiyonlar
  function getRandomPastelColor() {
    // Koyu mod için daha koyu, açık mod için pastel renkler
    if (isDarkMode()) {
      // Koyu mod için daha canlı renkler
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 65%, 35%)`;
    } else {
      // Açık mod için pastel renkler
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 70%, 80%)`;
    }
  }

  // Koyu mod tespiti
  function isDarkMode() {
    // Kullanıcının tercihini kontrol et
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Sayfanın arkaplan rengi koyu mu kontrol et
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg) {
      const rgb = bodyBg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        // RGB değerlerinin ortalaması 128'den küçükse koyu mod
        const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
        return brightness < 128;
      }
    }
    
    // Sayfada .dark-theme sınıfı var mı kontrol et
    if (document.documentElement.classList.contains('dark-theme') || 
        document.body.classList.contains('dark-theme')) {
      return true;
    }
    
    return false;
  }

  // Arkaplan rengini belirle
  function getBackgroundColor() {
    if (isDarkMode()) {
      return '#1c1c1e'; // iOS koyu mod arka planı
    } else {
      return '#f2f2f7'; // iOS açık mod arka planı
    }
  }

  // Renk şemasını güncelle
  function updateColorScheme() {
    const isDark = isDarkMode();
    
    prevPagePreview.style.backgroundColor = isDark ? '#1c1c1e' : '#f2f2f7';
    contentArea.style.backgroundColor = isDark ? '#1c1c1e' : '#f2f2f7';
    fakeHeader.style.backgroundColor = isDark ? 'rgba(29, 29, 31, 0.8)' : 'rgba(248, 248, 248, 0.8)';
    fakeHeader.style.borderBottom = isDark ? '0.5px solid rgba(255, 255, 255, 0.1)' : '0.5px solid rgba(0, 0, 0, 0.1)';
    prevPageTitle.style.color = isDark ? '#fff' : '#000';
    
    backArrow.style.borderColor = '#007aff'; // iOS mavi korunsun
  }

  // Cubic bezier easing fonksiyonu
  function cubicBezier(x1, y1, x2, y2, t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    
    // Newton-Raphson iterasyon yöntemiyle t değeri hesaplama
    // Bu matematiksel algoritma, iOS'un animasyon eğrilerini taklit eder
    let x = t, i;
    const epsilon = 1e-6;
    
    for (i = 0; i < 8; i++) {
      const currentT = getCubicBezierPoint(x1, x2, x);
      const derivative = getCubicBezierDerivative(x1, x2, x);
      
      if (Math.abs(currentT - t) < epsilon) break;
      
      x = x - (currentT - t) / derivative;
      
      if (x <= 0) x = 0;
      if (x >= 1) x = 1;
    }
    
    return getCubicBezierPoint(y1, y2, x);
  }
  
  function getCubicBezierPoint(p1, p2, t) {
    return 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  }
  
  function getCubicBezierDerivative(p1, p2, t) {
    return 3 * (1 - t) * (1 - t) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (1 - p2);
  }
});
