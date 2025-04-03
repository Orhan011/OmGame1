
/**
 * Gelişmiş iOS tarzı kaydırarak geri gitme özelliği
 * Bu script, gerçek iOS'ta olduğu gibi soldan sağa kaydırarak önceki sayfaya dönme işlevselliği sağlar.
 * Versiyon: 1.0.2 - Profesyonel Sürüm
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 iOS Swipe Navigation Pro v1.0.2 initialized');
  
  // Sayfa geçmişi yönetimi için özel sınıf
  class NavigationHistory {
    constructor() {
      this.storage_key = 'zekapark_navigation_history';
      this.history = [];
      this.maxHistoryLength = 20;
      this.loadHistory();
      this.addCurrentPage();
    }
    
    // LocalStorage'dan geçmişi yükle
    loadHistory() {
      try {
        const savedHistory = localStorage.getItem(this.storage_key);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            this.history = parsed;
            console.log('📂 Geçmiş yüklendi:', this.history);
          } else {
            throw new Error('Geçerli bir dizi değil');
          }
        }
      } catch (e) {
        console.warn('⚠️ Geçmiş yüklenemedi:', e);
        this.history = [];
        localStorage.removeItem(this.storage_key);
      }
    }
    
    // Geçmişi kaydet
    saveHistory() {
      try {
        localStorage.setItem(this.storage_key, JSON.stringify(this.history));
      } catch (e) {
        console.error('❌ Geçmiş kaydedilemedi:', e);
      }
    }
    
    // Şu anki sayfayı geçmişe ekle
    addCurrentPage() {
      if (!window.location.pathname) return;
      
      // Çok sık kaydetmeyi önlemek için son eklenen sayfayla aynıysa ekleme
      if (this.history.length > 0 && this.history[this.history.length - 1] === window.location.pathname) {
        return;
      }
      
      // Mevcut sayfa zaten geçmişte varsa, oradan sonrasını temizle
      const existingIndex = this.history.indexOf(window.location.pathname);
      if (existingIndex !== -1) {
        this.history = this.history.slice(0, existingIndex);
      }
      
      // Yeni sayfayı ekle
      this.history.push(window.location.pathname);
      
      // Geçmiş çok uzunsa, baştan kısalt
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(this.history.length - this.maxHistoryLength);
      }
      
      this.saveHistory();
      console.log('➕ Geçmişe eklendi:', window.location.pathname);
      console.log('📋 Güncel geçmiş:', this.history);
    }
    
    // Bir önceki sayfayı al
    getPreviousPage() {
      if (this.history.length < 2) return null;
      
      // Şu anki sayfanın indeksini bul
      const currentIndex = this.history.indexOf(window.location.pathname);
      
      // Eğer şu anki sayfa geçmişte bulunursa ve öncesinde sayfa varsa
      if (currentIndex > 0) {
        return this.history[currentIndex - 1];
      } 
      
      // Şu anki sayfa geçmişte yoksa (nadiren olur), en sondaki sayfadan bir öncekini dön
      return this.history[this.history.length - 2];
    }
    
    // Bir önceki sayfaya git ve geçmişi güncelle
    navigateToPreviousPage() {
      const previousPage = this.getPreviousPage();
      
      if (previousPage) {
        console.log('⬅️ Önceki sayfaya gidiliyor:', previousPage);
        window.location.href = previousPage;
        return true;
      }
      
      console.warn('⚠️ Önceki sayfa bulunamadı, tarayıcı geçmişi kullanılacak');
      return false;
    }
  }
  
  // Swipe yönetimi için sınıf
  class SwipeNavigationManager {
    constructor(navigationHistory) {
      this.navHistory = navigationHistory;
      this.threshold = 70;
      this.pageWidth = window.innerWidth;
      this.startX = null;
      this.startY = null;
      this.currentX = null;
      this.currentY = null;
      this.isDragging = false;
      this.velocity = 0;
      this.lastX = null;
      this.lastTime = null;
      this.swipeEnabled = true;
      this.animationElements = {
        overlay: null,
        previousPagePreview: null,
        currentPagePreview: null
      };
      
      this.attachEventListeners();
    }
    
    attachEventListeners() {
      // Dokunma başlangıcı
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      
      // Dokunma hareketi
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      
      // Dokunma bitişi
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      
      // Pencere boyutu değişikliği
      window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleTouchStart(e) {
      if (!this.swipeEnabled) return;
      
      // Sadece ekranın sol kenarından başlayan dokunuşları algıla (20px içinde)
      if (e.touches[0].clientX <= 20) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.lastX = this.startX;
        this.lastTime = Date.now();
        this.isDragging = true;
        
        // Hızı sıfırla
        this.velocity = 0;
        
        // Animasyon elementlerini oluştur
        this.createSwipeElements();
      }
    }
    
    handleTouchMove(e) {
      if (!this.isDragging) return;
      
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      
      // X ve Y eksenindeki değişimleri hesapla
      const diffX = this.currentX - this.startX;
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Eğer dikey kaydırma yataydan fazlaysa, kaydırmayı iptal et
      if (diffY > diffX * 1.2) {
        this.completeSwipeAnimation(false);
        this.isDragging = false;
        return;
      }
      
      // Yatay kaydırma mesafesi 10px'den fazlaysa ve y ekseni kaydırması çok değilse
      if (diffX > 10 && diffY < diffX * 0.8) {
        e.preventDefault();
        
        // Hız hesaplama
        const now = Date.now();
        const elapsed = now - this.lastTime;
        
        if (elapsed > 0) {
          this.velocity = (this.currentX - this.lastX) / elapsed;
        }
        
        this.lastX = this.currentX;
        this.lastTime = now;
        
        // Kaydırma yüzdesini hesapla (0-1 arası)
        const percent = Math.min(diffX / (this.pageWidth * 0.6), 1);
        
        // Animasyonu güncelle
        this.updateSwipeAnimation(percent);
      }
    }
    
    handleTouchEnd(e) {
      if (!this.isDragging) return;
      
      const diffX = (this.currentX || this.startX) - this.startX;
      
      // Hızlı kaydırma testi (iOS'ta hafif bir dokunuşla geri dönülebilir)
      const isQuickSwipe = this.velocity * 300 > this.threshold;
      
      // Eğer kullanıcı yeterince kaydırdıysa veya hızlı kaydırdıysa, geri git
      if (diffX > this.threshold || isQuickSwipe) {
        this.completeSwipeAnimation(true);
        
        // Geçiş animasyonu tamamlandıktan sonra yönlendirme işlemi yap
        setTimeout(() => {
          // Önce kendi geçmiş yöneticimizi kullan
          const successfulNavigation = this.navHistory.navigateToPreviousPage();
          
          // Eğer başarısızsa, tarayıcı özelliklerini dene
          if (!successfulNavigation) {
            if (window.history.length > 2) {
              console.log('🔄 Tarayıcı geçmişi kullanılıyor');
              window.history.back();
            } else if (document.referrer && document.referrer.includes(window.location.host)) {
              console.log('🔄 Referrer kullanılıyor:', document.referrer);
              window.location.href = document.referrer;
            } else {
              console.log('🏠 Ana sayfaya yönlendiriliyor (son çare)');
              window.location.href = '/';
            }
          }
        }, 200);
      } else {
        // Yetersiz kaydırma, animasyonu geri al
        this.completeSwipeAnimation(false);
      }
      
      // Dokunma durumunu sıfırla
      this.startX = null;
      this.startY = null;
      this.currentX = null;
      this.currentY = null;
      this.isDragging = false;
      this.lastX = null;
      this.lastTime = null;
    }
    
    handleResize() {
      this.pageWidth = window.innerWidth;
    }
    
    createSwipeElements() {
      const { documentElement } = document;
      const isDarkMode = documentElement.classList.contains('dark');
      
      // Overlay - iOS'taki karanlık arka plan efekti
      const overlay = document.createElement('div');
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
        will-change: opacity;
      `;
      
      // Şu an görünen sayfa önizlemesi (sağa kaydırılacak olan)
      const currentPagePreview = document.createElement('div');
      currentPagePreview.className = 'ios-current-page';
      currentPagePreview.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${isDarkMode ? '#1a1a2e' : '#fff'};
        z-index: 9997;
        transform: translateX(0);
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        pointer-events: none;
        transition: transform 0.25s ease;
        will-change: transform;
        overflow: hidden;
      `;

      // Önceki sayfa önizlemesi (soldan gelecek olan)
      const previousPagePreview = document.createElement('div');
      previousPagePreview.className = 'ios-previous-page';
      previousPagePreview.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${isDarkMode ? '#1a1a2e' : '#fff'};
        z-index: 9996;
        transform: translateX(-30%);
        pointer-events: none;
        transition: transform 0.25s ease;
        will-change: transform;
        overflow: hidden;
        box-shadow: 5px 0 15px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.1'});
      `;
      
      // Önceki sayfa içeriği - fallback geri butonu
      const prevContent = document.createElement('div');
      prevContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: ${isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};
      `;
      
      // Geri simgesi
      const backIcon = document.createElement('div');
      backIcon.innerHTML = `<i class="fas fa-arrow-left" style="font-size: 3rem; margin-bottom: 15px; color: ${isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};"></i>`;
      
      // Geri metni
      const backText = document.createElement('div');
      backText.textContent = 'Önceki Sayfa';
      backText.style.cssText = 'font-size: 1.5rem; font-weight: 500;';
      
      prevContent.appendChild(backIcon);
      prevContent.appendChild(backText);
      previousPagePreview.appendChild(prevContent);
      
      // Mevcut sayfanın içeriğini kopyala
      try {
        currentPagePreview.innerHTML = document.body.innerHTML;
        
        // İç içe overlay oluşmasını önle
        const innerOverlays = currentPagePreview.querySelectorAll('.ios-swipe-overlay, .ios-current-page, .ios-previous-page');
        innerOverlays.forEach(el => el.remove());
      } catch (e) {
        console.warn('⚠️ Sayfa içeriği kopyalanamadı:', e);
      }
      
      // HTML'e ekle
      document.body.appendChild(previousPagePreview);
      document.body.appendChild(currentPagePreview);
      document.body.appendChild(overlay);
      
      // Animasyon nesnelerini kaydet
      this.animationElements = {
        overlay,
        previousPagePreview,
        currentPagePreview
      };
    }
    
    updateSwipeAnimation(percent) {
      const { overlay, previousPagePreview, currentPagePreview } = this.animationElements;
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
    
    completeSwipeAnimation(shouldNavigate) {
      const { overlay, previousPagePreview, currentPagePreview } = this.animationElements;
      if (!overlay || !previousPagePreview || !currentPagePreview) return;
      
      // Kaydırma sırasında başka kaydırmaları engelle
      this.swipeEnabled = false;
      
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
        }
        this.animationElements = {
          overlay: null,
          previousPagePreview: null,
          currentPagePreview: null
        };
        this.swipeEnabled = true;
      }, 300);
    }
  }
  
  // Navigasyon yönetimini başlat
  const navigationHistory = new NavigationHistory();
  
  // Kaydırma yönetimini başlat
  const swipeManager = new SwipeNavigationManager(navigationHistory);
  
  // Tüm linklerin tıklanmasını izle (geçmiş kaydetmek için)
  document.querySelectorAll('a').forEach(link => {
    if (!link._swipeNavHandlerAdded) { // Olay dinleyiciyi tekrar eklemeyi önle
      link._swipeNavHandlerAdded = true;
      
      link.addEventListener('click', function(e) {
        // Dış linkleri atla, sadece site içi navigasyonu kaydet
        if (this.href && this.href.includes(window.location.host) && 
            !this.href.includes('#') && !this.target) {
          // Tıklandığında geçmişi güncelle
          console.log('🔗 Link tıklandı:', this.pathname || this.href);
        }
      });
    }
  });
});
