
/**
 * Önceki sayfaya geri dönmek için iOS tarzı kaydırma navigasyonu
 */
document.addEventListener('DOMContentLoaded', function() {
  // Kaydırma container'ını oluştur
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  document.body.appendChild(swipeContainer);
  
  // Önceki sayfa önizlemesi
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page';
  swipeContainer.appendChild(prevPagePreview);
  
  // Karartma katmanı
  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'ios-dim-overlay';
  swipeContainer.appendChild(dimOverlay);
  
  // Kenar gölgesi
  const edgeShadow = document.createElement('div');
  edgeShadow.className = 'ios-edge-shadow';
  swipeContainer.appendChild(edgeShadow);
  
  // iOS durum çubuğu efekti
  const statusBar = document.createElement('div');
  statusBar.className = 'ios-status-bar';
  swipeContainer.appendChild(statusBar);
  
  // Değişkenler
  let startX, currentX, startTime;
  const minSwipeDistance = 40; // Minimum kaydırma mesafesi
  const completionThreshold = window.innerWidth * 0.4; // Tamamlama eşiği
  const velocityThreshold = 0.5; // Minimum hız eşiği (px/ms)
  let isDragging = false;
  
  // Olay dinleyicileri
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Dokunmatik başlangıç olayı
  function handleTouchStart(e) {
    // Sadece ekranın sol kenarından başlayan kaydırmalar için
    const touchX = e.touches[0].clientX;
    if (touchX > 30) return; // Sol kenara yakın değilse işlemi sonlandır
    
    startX = touchX;
    currentX = startX;
    startTime = Date.now();
    
    // Kaydırma başlatma
    isDragging = true;
    swipeContainer.style.display = 'block';
    document.body.style.transition = '';
    prevPagePreview.style.transition = '';
    dimOverlay.style.transition = '';
    edgeShadow.style.transition = '';
    
    // Tarayıcı geri kaydırma engelini kaldırma için 
    if (touchX < 20) {
      e.preventDefault();
    }
  }
  
  // Dokunmatik hareket olayı
  function handleTouchMove(e) {
    if (!isDragging) return;
    
    currentX = e.touches[0].clientX;
    e.preventDefault(); // Tarayıcı kaydırmayı engelle
    
    const horizontalDistance = Math.max(0, currentX - startX);
    const progress = Math.min(horizontalDistance / window.innerWidth, 1);
    const easedProgress = easeOutCubic(progress);
    
    if (horizontalDistance > 0) {
      // Ana içeriği kaydır
      document.body.style.transform = `translateX(${horizontalDistance}px)`;
      document.body.style.overflow = 'hidden'; // Kaydırmayı engelle
      
      // Önceki sayfa önizlemesini hareket ettir (iOS benzeri hafif paralaks efekti)
      prevPagePreview.style.transform = `translateX(${-20 + (easedProgress * 20)}%)`;
      
      // Gölge ve karartma katmanı güncelleme
      edgeShadow.style.opacity = Math.min(easedProgress * 0.15, 0.15).toString();
      edgeShadow.style.left = `${horizontalDistance}px`;
      dimOverlay.style.opacity = Math.min(easedProgress * 0.1, 0.1).toString();
    }
  }
  
  // Dokunmatik sonlanma olayı
  function handleTouchEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    const timeElapsed = Date.now() - startTime;
    const distance = currentX - startX;
    const velocity = distance / timeElapsed; // px/ms
    
    // Kaydırmanın tamamlanıp tamamlanmayacağını belirle (iOS davranışı)
    const shouldComplete = (distance > completionThreshold) || 
                          (distance > minSwipeDistance && velocity > velocityThreshold);
    
    if (shouldComplete) {
      completeSwipe();
    } else {
      cancelSwipe();
    }
  }
  
  // Kaydırma animasyonunu tamamla ve navigasyon
  function completeSwipe() {
    // Yumuşak animasyon için geçiş ayarla (iOS yay efekti)
    document.body.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    prevPagePreview.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    dimOverlay.style.transition = 'opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    edgeShadow.style.transition = 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    
    // Son duruma animasyon
    document.body.style.transform = `translateX(${window.innerWidth}px)`;
    prevPagePreview.style.transform = 'translateX(0)';
    dimOverlay.style.opacity = '0';
    edgeShadow.style.opacity = '0';
    
    // Animasyon tamamlanmadan önce bekle
    setTimeout(function() {
      // Ana sayfaya değil, önceki sayfaya geri dön
      window.history.back();
      resetSwipeElements();
    }, 350);
  }
  
  // İptal edilmiş kaydırma için yay-geri efekti
  function cancelSwipe() {
    // Yay-geri efekti için geçiş ayarla
    document.body.style.transition = 'transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    prevPagePreview.style.transition = 'transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    dimOverlay.style.transition = 'opacity 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    edgeShadow.style.transition = 'all 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    
    // Başlangıç durumuna geri animasyon
    document.body.style.transform = 'translateX(0)';
    prevPagePreview.style.transform = 'translateX(-20%)';
    dimOverlay.style.opacity = '0';
    edgeShadow.style.opacity = '0';
    
    // Animasyondan sonra elementleri temizle
    setTimeout(resetSwipeElements, 300);
  }
  
  // Kaydırma elementlerini sıfırla
  function resetSwipeElements() {
    document.body.style.transform = '';
    document.body.style.transition = '';
    document.body.style.overflow = '';
    swipeContainer.style.display = 'none';
    
    prevPagePreview.style.transform = 'translateX(-20%)';
    prevPagePreview.style.transition = '';
    
    edgeShadow.style.opacity = '0';
    edgeShadow.style.left = '0';
    edgeShadow.style.transition = '';
    
    dimOverlay.style.opacity = '0';
    dimOverlay.style.transition = '';
  }
  
  // Yumuşak animasyonlar için kubik hafifletme fonksiyonu (iOS tarzı)
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  
  // Geri düğmelerini göster
  const backButtons = document.querySelectorAll('.back-btn, .standard-back-btn, [id^="back-to"], .back-button');
  backButtons.forEach(button => {
    button.style.display = 'block';
  });
});
