
/**
 * Enhanced iOS-like swipe navigation
 * Simulates iOS 16+ style edge swipe back navigation with realistic physics
 */
document.addEventListener('DOMContentLoaded', function() {
  // Ana değişkenler
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 80; // Minimum kaydırma mesafesi
  const maxSwipeTime = 300; // Maksimum kaydırma süresi (ms)
  const edgeSize = 20; // Kenar bölgesi büyüklüğü (piksel)
  let touchStartTime = 0;
  let touchEndTime = 0;
  let isSwipingBack = false;
  let initialScrollY = 0;
  let velocity = 0; // Hız değişkeni
  let lastX = 0;
  let lastTime = 0;
  
  // Önceki sayfanın ekran görüntüsünü simüle etmek için
  let fakePrevPageContent = null;
  const cachedImages = {};
  
  // Animasyon durumu
  let animationId = null;
  
  // Kapsayıcı konteynerı oluştur
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  swipeContainer.style.position = 'fixed';
  swipeContainer.style.top = '0';
  swipeContainer.style.left = '0';
  swipeContainer.style.width = '100%';
  swipeContainer.style.height = '100%';
  swipeContainer.style.pointerEvents = 'none';
  swipeContainer.style.zIndex = '9999';
  swipeContainer.style.visibility = 'hidden';
  swipeContainer.style.overflow = 'hidden';
  document.body.appendChild(swipeContainer);
  
  // Karartma overlay'ı oluştur
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
  
  // Önceki sayfa önizleme elemanı
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page-preview';
  prevPagePreview.style.position = 'absolute';
  prevPagePreview.style.top = '0';
  prevPagePreview.style.left = '-100%'; // Ekran dışından başla
  prevPagePreview.style.width = '90%'; // iOS stili genişlik
  prevPagePreview.style.height = '100%';
  prevPagePreview.style.backgroundColor = '#f8f8f8';
  prevPagePreview.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
  prevPagePreview.style.borderRadius = '0 4px 4px 0'; // Sağ kenarda hafif yuvarlama
  prevPagePreview.style.transform = 'translateX(0)';
  prevPagePreview.style.willChange = 'transform';
  
  // Kenar gölgesi oluştur (daha gerçekçi görünüm için)
  const gradient = document.createElement('div');
  gradient.style.position = 'absolute';
  gradient.style.top = '0';
  gradient.style.right = '0';
  gradient.style.width = '6px';
  gradient.style.height = '100%';
  gradient.style.background = 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.15))';
  gradient.style.pointerEvents = 'none';
  prevPagePreview.appendChild(gradient);
  
  // iOS tarzı yapışkan kısıtlama efekti için çekme bölümü
  const edgePuller = document.createElement('div');
  edgePuller.className = 'ios-edge-puller';
  edgePuller.style.position = 'absolute';
  edgePuller.style.top = '0';
  edgePuller.style.left = '-10px';
  edgePuller.style.width = '10px';
  edgePuller.style.height = '100%';
  edgePuller.style.opacity = '0';
  prevPagePreview.appendChild(edgePuller);
  
  // Geri oku simgesi
  const backArrow = document.createElement('div');
  backArrow.className = 'ios-back-arrow';
  backArrow.style.position = 'absolute';
  backArrow.style.top = '50%';
  backArrow.style.left = '15px';
  backArrow.style.width = '14px';
  backArrow.style.height = '14px';
  backArrow.style.borderTop = '2.5px solid #007aff';
  backArrow.style.borderLeft = '2.5px solid #007aff';
  backArrow.style.borderRadius = '1px';
  backArrow.style.transform = 'translateY(-50%) rotate(-45deg)';
  backArrow.style.opacity = '0';
  backArrow.style.transition = 'opacity 0.15s ease';
  prevPagePreview.appendChild(backArrow);
  
  // İçerik alanı
  const contentArea = document.createElement('div');
  contentArea.className = 'ios-content-area';
  contentArea.style.position = 'absolute';
  contentArea.style.top = '55px'; // Navbar altından başla
  contentArea.style.left = '0';
  contentArea.style.width = '100%';
  contentArea.style.height = 'calc(100% - 55px)';
  contentArea.style.overflow = 'hidden';
  contentArea.style.backgroundColor = '#f8f8f8';
  prevPagePreview.appendChild(contentArea);
  
  // Sahte önceki sayfanın içeriğini oluştur (çerçeve olarak)
  fakePrevPageContent = document.createElement('div');
  fakePrevPageContent.className = 'ios-prev-page-content';
  fakePrevPageContent.style.width = '100%';
  fakePrevPageContent.style.height = '100%';
  contentArea.appendChild(fakePrevPageContent);
  
  // Sahte header oluştur
  const fakeHeader = document.createElement('div');
  fakeHeader.className = 'ios-fake-header';
  fakeHeader.style.position = 'absolute';
  fakeHeader.style.top = '0';
  fakeHeader.style.left = '0';
  fakeHeader.style.width = '100%';
  fakeHeader.style.height = '55px';
  fakeHeader.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  fakeHeader.style.backdropFilter = 'blur(10px)';
  fakeHeader.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
  fakeHeader.style.display = 'flex';
  fakeHeader.style.alignItems = 'center';
  fakeHeader.style.padding = '0 15px';
  fakeHeader.style.zIndex = '2';
  
  // Önceki sayfa başlığı
  const prevPageTitle = document.createElement('div');
  prevPageTitle.className = 'ios-prev-page-title';
  prevPageTitle.style.color = '#000';
  prevPageTitle.style.fontSize = '17px';
  prevPageTitle.style.fontWeight = '600';
  prevPageTitle.style.textAlign = 'center';
  prevPageTitle.style.width = '100%';
  prevPageTitle.style.overflow = 'hidden';
  prevPageTitle.style.textOverflow = 'ellipsis';
  prevPageTitle.style.whiteSpace = 'nowrap';
  prevPageTitle.style.opacity = '0';
  prevPageTitle.style.transform = 'translateX(20px)';
  prevPageTitle.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  prevPageTitle.textContent = 'Önceki Sayfa';
  
  // Başlık belirlemek için önceki sayfalara bakalım
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const pathSegments = referrerUrl.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment) {
          // Dosya uzantısını kaldır ve tire/-/alt çizgilerle değiştir
          const cleanTitle = lastSegment.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          // İlk harfi büyük yap
          prevPageTitle.textContent = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        }
      }
    } catch (e) {
      console.error("URL ayrıştırma hatası:", e);
    }
  }
  
  fakeHeader.appendChild(prevPageTitle);
  prevPagePreview.appendChild(fakeHeader);
  
  swipeContainer.appendChild(prevPagePreview);
  
  // Kenar göstergesi (kullanıcıya kaydırmanın mevcut olduğunu gösterir)
  const edgeIndicator = document.createElement('div');
  edgeIndicator.className = 'ios-edge-indicator';
  edgeIndicator.style.position = 'fixed';
  edgeIndicator.style.top = '0';
  edgeIndicator.style.left = '0';
  edgeIndicator.style.width = '3px';
  edgeIndicator.style.height = '100%';
  edgeIndicator.style.background = 'linear-gradient(to right, rgba(0, 122, 255, 0.2), rgba(0, 122, 255, 0))';
  edgeIndicator.style.pointerEvents = 'none';
  edgeIndicator.style.opacity = '0';
  document.body.appendChild(edgeIndicator);
  
  // Sayfa yüklendiğinde kenar göstergesini kısa süreliğine göster
  setTimeout(() => {
    edgeIndicator.style.transition = 'opacity 0.5s ease';
    edgeIndicator.style.opacity = '1';
    
    setTimeout(() => {
      edgeIndicator.style.opacity = '0';
    }, 1500);
  }, 800);
  
  // Dokunma olayı dinleyicileri
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
  
  // Dokunma başlangıcını işle
  function handleTouchStart(event) {
    // Oyun kontrollerini etkilememek için bazı elementleri kontrol et
    const target = event.target;
    if (target.closest('.game-container, canvas, .control-btn, .simon-pad')) {
      return; // Oyun elementlerinde kaydırma özelliğini devre dışı bırak
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
    // Gelişmiş iOS görünümü için örüntüler oluştur
    generatePlaceholderContent();
    
    // Hafif bir gecikmeyle başlığı göster (iOS tarzı animasyon)
    setTimeout(() => {
      prevPageTitle.style.opacity = '1';
      prevPageTitle.style.transform = 'translateX(0)';
    }, 150);
  }
  
  // Dolgu içeriği oluştur
  function generatePlaceholderContent() {
    fakePrevPageContent.innerHTML = '';
    
    // Liste öğeleri
    const listContainer = document.createElement('div');
    listContainer.style.padding = '10px 15px';
    
    // 6-8 arası rasgele sayıda liste öğesi oluştur
    const numItems = Math.floor(Math.random() * 3) + 6;
    
    for (let i = 0; i < numItems; i++) {
      const listItem = document.createElement('div');
      listItem.style.padding = '12px 0';
      listItem.style.borderBottom = '1px solid rgba(0, 0, 0, 0.05)';
      listItem.style.display = 'flex';
      listItem.style.alignItems = 'center';
      
      // Simge alanı
      const iconPlaceholder = document.createElement('div');
      iconPlaceholder.style.width = '32px';
      iconPlaceholder.style.height = '32px';
      iconPlaceholder.style.borderRadius = '8px';
      iconPlaceholder.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 75%)`;
      iconPlaceholder.style.marginRight = '15px';
      iconPlaceholder.style.flexShrink = '0';
      
      // Metin alanı
      const textContainer = document.createElement('div');
      textContainer.style.flex = '1';
      
      // Başlık
      const title = document.createElement('div');
      title.style.height = '14px';
      title.style.borderRadius = '4px';
      title.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      title.style.width = `${40 + Math.random() * 40}%`;
      title.style.marginBottom = '6px';
      
      // Alt metin
      const subtitle = document.createElement('div');
      subtitle.style.height = '10px';
      subtitle.style.borderRadius = '4px';
      subtitle.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      subtitle.style.width = `${60 + Math.random() * 30}%`;
      
      textContainer.appendChild(title);
      textContainer.appendChild(subtitle);
      
      // Okuma göstergesi
      const chevron = document.createElement('div');
      chevron.style.width = '8px';
      chevron.style.height = '8px';
      chevron.style.borderTop = '2px solid rgba(0, 0, 0, 0.2)';
      chevron.style.borderRight = '2px solid rgba(0, 0, 0, 0.2)';
      chevron.style.transform = 'rotate(45deg)';
      chevron.style.marginLeft = '5px';
      
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
    
    // Varsayılan kaydırma davranışını önle
    event.preventDefault();
    
    const now = Date.now();
    const dt = now - lastTime;
    
    touchCurrentX = event.touches[0].clientX;
    touchCurrentY = event.touches[0].clientY;
    
    // Yatay ve dikey mesafeyi hesapla
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;
    
    // Kullanıcı dikey olarak daha fazla kaydırıyorsa, geri kaydırma hareketini iptal et
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaX) < 30) {
      handleTouchCancel();
      return;
    }
    
    // Hız hesapla (piksel/ms)
    if (dt > 0) {
      const instantVelocity = (touchCurrentX - lastX) / dt;
      // Hız hesaplamasını daha hassas yap
      velocity = instantVelocity * 0.3 + velocity * 0.7;
    }
    
    lastX = touchCurrentX;
    lastTime = now;
    
    if (deltaX > 0) {
      // Maksimum mesafeye göre 0 ile 1 arasında ilerlemeyi hesapla
      const maxDistance = window.innerWidth * 0.7; // %70 ekran genişliği maksimum mesafe
      let progress = Math.min(deltaX / maxDistance, 1);
      
      // Daha doğal görünüm için cubic-bezier eğrisi kullan
      // Easing fonksiyonu uygulaması (easeOutCubic)
      progress = 1 - Math.pow(1 - progress, 3);
      
      // Öğelere dönüşüm uygula - daha akıcı bir kayma için eğri düzeltme
      const translateX = deltaX * (1 - progress * 0.15);
      prevPagePreview.style.transform = `translateX(${translateX}px)`;
      
      // Gölge efektini güçlendir
      gradient.style.opacity = Math.min(1, progress * 1.5);
      
      // Overlay'ı daha yumuşak geçiş ile karart
      const alpha = progress * 0.35; // Maksimum opaklık azaltıldı
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;
      
      // Geri oku daha yumuşak göster
      backArrow.style.opacity = Math.min(1, progress * 2);
      
      // Başlığı hareket ettir
      prevPageTitle.style.opacity = Math.min(1, progress * 1.5);
      prevPageTitle.style.transform = `translateX(${Math.min(20, 20 - (progress * 20))}px)`;
      
      // İlerleme %85'i geçtiğinde, "yapışkanlaştır" ve hafif titreşim efekti ekle
      if (progress > 0.85) {
        const overProgress = (progress - 0.85) / 0.15;
        const springEffect = Math.sin(overProgress * Math.PI) * 3;
        const extra = overProgress * 6 + springEffect;
        prevPagePreview.style.transform = `translateX(${translateX + extra}px)`;
      }
    }
  }
  
  // Dokunma sonlandırmayı işle
  function handleTouchEnd(event) {
    if (!isSwipingBack) return;
    
    touchEndX = touchCurrentX;
    touchEndY = touchCurrentY;
    touchEndTime = Date.now();
    
    // Kaydırma verilerini hesapla
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    const swipeSpeed = swipeDistance / swipeTime;
    
    // Gezinmeyi tetiklemek için gereken kaydırma 
    // Ya mesafeye bağlı olarak veya hıza bağlı olarak (hızlı hareketler için)
    const minDistance = window.innerWidth * 0.35; // Ekran genişliğinin %35'i
    const minSpeed = 0.6; // Piksel/milisaniye
    
    // Mevcut transform pozisyonunu al
    const currentTranslateX = parseFloat(prevPagePreview.style.transform.replace(/[^0-9\-.]/g, '')) || 0;
    
    if ((swipeDistance > minDistance) || (swipeDistance > minSwipeDistance && velocity > minSpeed)) {
      // Animasyonu tamamla
      completeSwipeAnimation(currentTranslateX);
    } else {
      // Geri hareket iptal
      cancelSwipeWithAnimation(currentTranslateX);
    }
    
    isSwipingBack = false;
  }
  
  // Kaydırma animasyonunu tamamla
  function completeSwipeAnimation(currentPosition) {
    // Mevcut animasyonu iptal et
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    const targetX = window.innerWidth * 1.05; // Hedefi biraz uzat (daha pürüzsüz geçiş için)
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    const maxDuration = 300; // Daha hızlı animasyon
    
    // Hızı dikkate alarak süreyi hesapla ve hızlı hareketleri ödüllendir
    let duration = Math.abs(distance / ((velocity + 0.2) * 1000));
    duration = Math.min(maxDuration, Math.max(220, duration)); // 220-300ms arasında sınırla
    
    // Yumuşak geçiş için animasyon zamanlama fonksiyonu
    const timingFunction = bezier(0.23, 1, 0.32, 1); // cubic-bezier(0.23, 1, 0.32, 1)
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Özel bezier timing fonksiyonu uygula
      const easedProgress = timingFunction(rawProgress);
      const newX = currentPosition + (distance * easedProgress);
      
      // Öğeleri güncelle - hızlı ve akıcı animasyon
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.35 * (1 - easedProgress)})`;
      backArrow.style.opacity = Math.max(0, 1 - easedProgress * 2);
      prevPageTitle.style.opacity = Math.max(0, 1 - easedProgress * 2.5);
      
      // Gölgeyi animasyonla azalt
      gradient.style.opacity = Math.max(0, 1 - easedProgress * 1.5);
      
      if (rawProgress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animasyon tamamlandığında önceki sayfaya git
        window.history.back();
        resetSwipeElements();
      }
    }
    
    // Cubic bezier easing fonksiyonu (daha pürüzsüz iOS animasyonları için)
    function bezier(x1, y1, x2, y2) {
      return function(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        
        // Newton-Raphson iterasyonu ile t değerini hesaplama
        let x = t, t0, t1, t2, x2, d2, i;
        
        for (i = 0; i < 4; ++i) {
          t2 = x * x;
          t1 = t2 * x;
          x2 = 3 * x * (1 - x);
          
          d2 = 3 * t2 * (1 - x) - t1 + x1;
          t0 = 1 - x;
          t1 = 3 * x * t0 * t0;
          t2 = 3 * x * x * t0;
          
          x -= (t1 + t2 + t1 - x1) / (t1 + 2 * t2 + 3 * t1);
        }
        
        // Y değerini hesapla
        return 3 * x * (1 - x) * (1 - x) * y1 + 3 * x * x * (1 - x) * y2 + x * x * x;
      };
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Dokunma iptalini işle
  function handleTouchCancel() {
    if (isSwipingBack) {
      const currentTranslateX = parseFloat(prevPagePreview.style.transform.replace(/[^0-9\-.]/g, '')) || 0;
      cancelSwipeWithAnimation(currentTranslateX);
      isSwipingBack = false;
    }
  }
  
  // Kaydırmayı yay etkisiyle iptal et
  function cancelSwipeWithAnimation(currentPosition) {
    // Mevcut animasyonu iptal et
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    const targetX = 0;
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    let duration = 280; // ms - daha hızlı geri dönüş
    
    // Mesafe kısa ise daha hızlı tamamla
    if (Math.abs(currentPosition) < 100) {
      duration = 180;
    }
    
    // iOS'un yay etkisi için özel timing fonksiyonu
    const springTiming = bezierSpring(0.17, 0.67, 0.32, 0.98);
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Yay etkisi için gelişmiş eğri fonksiyonu
      const easedProgress = springTiming(progress);
      
      // Yay efekti için ek salınım (küçük overshoot)
      let newX = distance * easedProgress + currentPosition;
      
      // Yay efekti ekle
      if (progress > 0.7 && progress < 0.99) {
        const springFactor = Math.sin((progress - 0.7) * 8) * (1 - progress) * 7;
        newX += springFactor;
      }
      
      // Öğeleri güncelle
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      
      // Overlay'ı yumuşak geçişle karartma
      const alphaMultiplier = Math.max(0, 1 - easedProgress * 1.8); // Daha hızlı şeffaflaşma
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.35 * alphaMultiplier})`;
      
      // Diğer görsel öğeleri güncelle
      backArrow.style.opacity = `${Math.max(0, 1 - easedProgress * 2.2)}`;
      prevPageTitle.style.opacity = `${Math.max(0, 1 - easedProgress * 2.5)}`;
      gradient.style.opacity = `${Math.max(0, 1 - easedProgress * 2)}`;
      
      // Başlık efektini geri al
      prevPageTitle.style.transform = `translateX(${Math.min(20, easedProgress * 20)}px)`;
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animasyon tamamlandığında elemanları sıfırla
        resetSwipeElements();
      }
    }
    
    // Yay etkisi için özel bezier fonksiyonu
    function bezierSpring(x1, y1, x2, y2) {
      const bezierFn = function(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        
        let x = t, i;
        for (i = 0; i < 8; ++i) {
          const f = (3 * x * (1 - x) * (1 - x) * x1 + 3 * x * x * (1 - x) * x2 + x * x * x - t);
          const df = (3 * (1 - x) * (1 - x) * x1 + 6 * x * (1 - x) * (x2 - x1) + 3 * x * x * (1 - x2));
          if (Math.abs(f) < 1e-6) break;
          x -= f / df;
        }
        
        return 3 * x * (1 - x) * (1 - x) * y1 + 3 * x * x * (1 - x) * y2 + x * x * x;
      };
      
      return bezierFn;
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Kaydırma elemanlarını sıfırla
  function resetSwipeElements() {
    // Animasyonu temizle
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    // Geçişleri sıfırla
    prevPagePreview.style.transition = '';
    darkOverlay.style.transition = '';
    prevPageTitle.style.transition = '';
    prevPageTitle.style.opacity = '0';
    prevPageTitle.style.transform = 'translateX(20px)';
    
    // Dönüşümleri ve stilleri sıfırla
    prevPagePreview.style.transform = 'translateX(0)';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    backArrow.style.opacity = '0';
    
    // Konteyneri gizle
    swipeContainer.style.visibility = 'hidden';
    fakePrevPageContent.innerHTML = '';
  }
});
