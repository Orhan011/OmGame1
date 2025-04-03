
/**
 * Gerçek iOS Kaydırma Navigasyonu - Pro Sürüm
 * Bu script, gerçek iOS cihazlardaki gibi soldan sağa kaydırarak önceki sayfaya dönme işlevselliği sağlar.
 * Versiyon: 2.0.0 - Gelişmiş Profesyonel Sürüm
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Gerçek iOS Kaydırma Navigasyonu Pro v2.0.0 başlatıldı');
  
  // Sayfa geçmişi yönetimi için gelişmiş sınıf
  class PageHistoryManager {
    constructor() {
      this.storageKey = 'zekapark_navigation_history_v2';
      this.history = [];
      this.maxHistoryLength = 30;
      this.currentPage = window.location.pathname;
      
      this.init();
    }
    
    init() {
      this.loadHistory();
      this.addCurrentPage();
      this.setupLinkTracking();
      
      // URL değişimlerini izle
      window.addEventListener('popstate', () => this.handlePopState());
    }
    
    // LocalStorage'dan geçmişi yükle
    loadHistory() {
      try {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed)) {
            this.history = parsed;
            console.log('📂 Yüklenen sayfa geçmişi:', this.history);
          }
        }
      } catch (e) {
        console.warn('⚠️ Geçmiş yüklenemedi:', e);
        this.history = [];
        localStorage.removeItem(this.storageKey);
      }
    }
    
    // Geçmişi localStorage'a kaydet
    saveHistory() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.history));
      } catch (e) {
        console.error('❌ Geçmiş kaydedilemedi:', e);
        
        // Geçmiş çok büyükse, yarısını sil ve tekrar dene
        if (this.history.length > 10) {
          this.history = this.history.slice(Math.floor(this.history.length / 2));
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
          } catch (e2) {
            console.error('❌ Geçmişi kısaltma sonrası da kaydedilemedi');
          }
        }
      }
    }
    
    // Geçmişi temizle (isteğe bağlı)
    clearHistory() {
      this.history = [this.currentPage];
      this.saveHistory();
    }
    
    // Şu anki sayfayı geçmişe ekle
    addCurrentPage() {
      if (!this.currentPage) return;
      
      console.log('➕ Geçmişe ekleniyor:', this.currentPage);
      
      // Eğer geçmiş boşsa veya son sayfa şu anki sayfadan farklıysa ekle
      if (this.history.length === 0 || this.history[this.history.length - 1] !== this.currentPage) {
        // Şu anki sayfa zaten geçmişte mi kontrol et
        const existingIndex = this.history.indexOf(this.currentPage);
        
        // Eğer zaten varsa, o indexten sonrasını temizle (ileri-geri navigasyonunda tutarlılık için)
        if (existingIndex !== -1 && existingIndex !== this.history.length - 1) {
          this.history = this.history.slice(0, existingIndex + 1);
        } else if (existingIndex === -1) {
          // Yeni sayfayı geçmişe ekle
          this.history.push(this.currentPage);
        }
        
        // Geçmiş çok uzunsa, baştan kısalt
        if (this.history.length > this.maxHistoryLength) {
          this.history = this.history.slice(this.history.length - this.maxHistoryLength);
        }
        
        this.saveHistory();
        console.log('📋 Güncellenmiş geçmiş:', this.history);
      }
    }
    
    // Link tıklamalarını takip et
    setupLinkTracking() {
      document.querySelectorAll('a').forEach(link => {
        // Zaten işleyici eklenmişse, tekrar eklemeyi önle
        if (!link._navHistoryHandlerAdded) {
          link._navHistoryHandlerAdded = true;
          
          link.addEventListener('click', (e) => {
            // Sadece site içi bağlantıları takip et
            if (link.href && 
                link.href.includes(window.location.host) && 
                !link.href.includes('#') && 
                !link.target) {
              // URL'den yolun kısmını al
              const pathname = new URL(link.href).pathname;
              console.log('🔗 Link tıklandı, mevcut sayfa:', pathname);
            }
          });
        }
      });
    }
    
    // Sayfa URL'si değiştiğinde (geri/ileri düğmesi kullanıldığında)
    handlePopState() {
      const newPath = window.location.pathname;
      if (newPath !== this.currentPage) {
        this.currentPage = newPath;
        console.log('🔄 URL değişimi algılandı:', this.currentPage);
      }
    }
    
    // Bir önceki sayfayı al
    getPreviousPage() {
      const currentIndex = this.history.indexOf(this.currentPage);
      
      // Eğer mevcut sayfa geçmişte bulunursa ve öncesinde sayfa varsa
      if (currentIndex > 0) {
        return this.history[currentIndex - 1];
      }
      
      // Eğer geçmişte en az iki öğe varsa ve son eleman şu anki sayfa değilse
      if (this.history.length >= 2 && this.history[this.history.length - 1] !== this.currentPage) {
        return this.history[this.history.length - 2];
      }
      
      // Hiçbir önceki sayfa bulunamadı
      return null;
    }
    
    // Önceki sayfaya yönlendir
    navigateToPreviousPage() {
      const previousPage = this.getPreviousPage();
      
      if (previousPage) {
        console.log('⬅️ Önceki sayfaya yönlendiriliyor:', previousPage);
        window.location.href = previousPage;
        return true;
      }
      
      return false;
    }
  }
  
  // Kaydırma animasyonu ve yönetimi için sınıf
  class SwipeGestureHandler {
    constructor(historyManager) {
      this.history = historyManager;
      this.gestureStarted = false;
      this.startX = null;
      this.startY = null;
      this.currentX = null;
      this.currentY = null;
      this.touchStartTime = null;
      this.velocity = 0;
      this.lastX = null;
      this.lastTime = null;
      this.threshold = 60; // kaydırma mesafesi eşiği
      this.screenWidth = window.innerWidth;
      this.maxDragPercent = 0.8; // Ekranın en fazla yüzde kaçı kadar sürüklenebilir
      this.swipeActive = true;
      
      // Animasyon elementleri
      this.animEls = {
        overlay: null,
        prevPagePreview: null,
        currPagePreview: null,
        shadowEl: null
      };
      
      // Sayfanın güncel tema durumu
      this.isDarkTheme = document.documentElement.classList.contains('dark');
      
      this.init();
    }
    
    init() {
      // Dokunma olaylarını dinle
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
      
      // Ekran boyutundaki değişiklikleri izle
      window.addEventListener('resize', this.handleResize.bind(this));
      
      // Tema değişiklikleri için gözlemci oluştur
      const observer = new MutationObserver(() => {
        this.isDarkTheme = document.documentElement.classList.contains('dark');
      });
      
      // HTML elementinin sınıf değişikliklerini izle
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    
    handleResize() {
      this.screenWidth = window.innerWidth;
    }
    
    handleTouchStart(e) {
      if (!this.swipeActive) return;
      
      // Sadece ekranın sol kenarından başlayan dokunuşları algıla (25px içinde)
      const touchX = e.touches[0].clientX;
      if (touchX <= 25) {
        this.gestureStarted = true;
        this.startX = touchX;
        this.startY = e.touches[0].clientY;
        this.touchStartTime = Date.now();
        this.lastX = this.startX;
        this.lastTime = this.touchStartTime;
        this.velocity = 0;
      }
    }
    
    handleTouchMove(e) {
      if (!this.gestureStarted) return;
      
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      
      // X ve Y eksenindeki değişimi hesapla
      const diffX = this.currentX - this.startX;
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Dikey kaydırma yataydan daha baskınsa, kaydırma işlemini iptal et
      if (diffY > diffX * 1.2) {
        this.cancelSwipeGesture();
        return;
      }
      
      // Yatay kaydırma mesafesi belirli bir eşikten fazlaysa
      if (diffX > 10) {
        // Diğer kaydırma olaylarını engelle
        e.preventDefault();
        
        // Hız hesaplaması
        const now = Date.now();
        const elapsed = now - this.lastTime;
        
        if (elapsed > 0) {
          this.velocity = (this.currentX - this.lastX) / elapsed;
        }
        
        this.lastX = this.currentX;
        this.lastTime = now;
        
        // İlk kez belirli bir mesafeyi aştığında animasyon öğelerini oluştur
        if (!this.animEls.overlay) {
          this.createAnimationElements();
        }
        
        // Kaydırma yüzdesini hesapla (0-1 arası)
        const maxDrag = this.screenWidth * this.maxDragPercent;
        const percent = Math.min(diffX / maxDrag, 1);
        
        // Animasyonu güncelle
        this.updateAnimation(percent);
      }
    }
    
    handleTouchEnd(e) {
      if (!this.gestureStarted) return;
      
      const diffX = (this.currentX || this.startX) - this.startX;
      const elapsed = Date.now() - this.touchStartTime;
      
      // Hızlı kaydırma testi (hız veya mesafe yeterliyse)
      const isQuickSwipe = this.velocity > 0.3 || (diffX > this.threshold && elapsed < 300);
      
      // Kullanıcı yeterince kaydırdıysa veya hızlı kaydırdıysa, geri git
      if (diffX > this.threshold || isQuickSwipe) {
        this.completeSwipeAnimation(true);
      } else {
        this.completeSwipeAnimation(false);
      }
      
      // Dokunma durumunu sıfırla
      this.gestureStarted = false;
      this.startX = null;
      this.startY = null;
      this.currentX = null;
      this.currentY = null;
      this.touchStartTime = null;
    }
    
    cancelSwipeGesture() {
      if (this.animEls.overlay) {
        this.completeSwipeAnimation(false);
      }
      
      this.gestureStarted = false;
      this.startX = null;
      this.startY = null;
    }
    
    createAnimationElements() {
      const { documentElement, body } = document;
      const bodyStyles = window.getComputedStyle(body);
      const htmlStyles = window.getComputedStyle(documentElement);
      
      // Sayfa arka plan rengini belirle
      const bgColor = this.isDarkTheme ? '#121212' : '#ffffff';
      const textColor = this.isDarkTheme ? '#ffffff' : '#000000';
      
      // Sayfa içeriğinin kopyasını oluştur
      const bodyClone = body.cloneNode(true);
      const currentPageContent = document.createElement('div');
      currentPageContent.className = 'ios-swipe-current-content';
      currentPageContent.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        overflow: auto;
      `;
      
      // Overlay - Arka plan karartma
      const overlay = document.createElement('div');
      overlay.className = 'ios-swipe-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: 99999;
        pointer-events: none;
        transition: background-color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: background-color;
      `;
      
      // Önceki sayfanın tahmini görünümü (sol taraftan görünen)
      const prevPage = document.createElement('div');
      prevPage.className = 'ios-swipe-prev-page';
      prevPage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        z-index: 99998;
        transform: translateX(-30%);
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: transform;
        overflow: hidden;
      `;
      
      // Geri simgesi içeriği
      const backIndicator = document.createElement('div');
      backIndicator.className = 'ios-swipe-back-indicator';
      backIndicator.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: ${textColor};
        opacity: 0.8;
      `;
      
      // Geri simgesi
      const backIcon = document.createElement('div');
      backIcon.innerHTML = `<i class="fas fa-chevron-left" style="font-size: 4rem; margin-bottom: 15px;"></i>`;
      
      // Geri metni
      const backText = document.createElement('div');
      backText.textContent = 'Önceki Sayfa';
      backText.style.cssText = 'font-size: 1.5rem; font-weight: 500;';
      
      backIndicator.appendChild(backIcon);
      backIndicator.appendChild(backText);
      prevPage.appendChild(backIndicator);
      
      // Mevcut sayfa önizlemesi (sağa kaydırılacak olan)
      const currPage = document.createElement('div');
      currPage.className = 'ios-swipe-curr-page';
      currPage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        z-index: 99997;
        transform: translateX(0);
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: transform;
        overflow: hidden;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      `;
      
      // Kenar gölgesi elementi
      const shadow = document.createElement('div');
      shadow.className = 'ios-swipe-shadow';
      shadow.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 15px;
        height: 100%;
        z-index: 99998;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      
      // Mevcut sayfanın içeriğini kopyalamaya çalış
      try {
        // İç içe geçmiş swipe elementlerini kaldır (varsa)
        const existingSwipeEls = bodyClone.querySelectorAll(
          '.ios-swipe-overlay, .ios-swipe-prev-page, .ios-swipe-curr-page, .ios-swipe-shadow'
        );
        existingSwipeEls.forEach(el => el.remove());
        
        // Sayfanın görünümünü koru
        currentPageContent.innerHTML = bodyClone.innerHTML;
        
        // Bazı stil sorunlarını çözmek için mevcut stil ve scriptleri koru
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        const scripts = document.querySelectorAll('script');
        
        styles.forEach(style => {
          const clone = style.cloneNode(true);
          currentPageContent.appendChild(clone);
        });
        
        currPage.appendChild(currentPageContent);
      } catch (e) {
        console.warn('⚠️ Sayfa içeriği kopyalanamadı:', e);
        currPage.innerHTML = '<div style="padding: 20px;">Sayfa içeriği kopyalanamadı</div>';
      }
      
      // DOM'a elementleri ekle
      document.body.appendChild(prevPage);
      document.body.appendChild(currPage);
      document.body.appendChild(shadow);
      document.body.appendChild(overlay);
      
      // Referansları sakla
      this.animEls = {
        overlay,
        prevPagePreview: prevPage,
        currPagePreview: currPage,
        shadowEl: shadow
      };
    }
    
    updateAnimation(percent) {
      const { overlay, prevPagePreview, currPagePreview, shadowEl } = this.animEls;
      
      if (!overlay || !prevPagePreview || !currPagePreview) return;
      
      // Arka plan karartması - iOS'taki kademeli karartma
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * percent})`;
      
      // Önceki sayfanın görünmesi (iOS'taki gibi -30% offset'ten başlar)
      prevPagePreview.style.transform = `translateX(${-30 + (30 * percent)}%)`;
      
      // Şu anki sayfanın sağa kaydırılması
      currPagePreview.style.transform = `translateX(${percent * 100}%)`;
      
      // Gölge efekti
      if (shadowEl) {
        shadowEl.style.opacity = (1 - percent).toString();
        shadowEl.style.transform = `translateX(${percent * 100}%)`;
      }
    }
    
    completeSwipeAnimation(shouldNavigate) {
      // Kaydırma sırasında başka kaydırmaları engelle
      this.swipeActive = false;
      
      const { overlay, prevPagePreview, currPagePreview, shadowEl } = this.animEls;
      
      if (!overlay || !prevPagePreview || !currPagePreview) {
        this.swipeActive = true;
        return;
      }
      
      if (shouldNavigate) {
        // Tam kaydırma animasyonu
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        prevPagePreview.style.transform = 'translateX(0)';
        currPagePreview.style.transform = 'translateX(100%)';
        
        if (shadowEl) {
          shadowEl.style.opacity = '0';
        }
        
        // Geçiş animasyonu tamamlandıktan sonra yönlendirme işlemi yap
        setTimeout(() => {
          // Önce kendi geçmiş yöneticimizi kullan
          const successfulNav = this.history.navigateToPreviousPage();
          
          // Eğer başarısız olduysa, diğer yöntemleri dene
          if (!successfulNav) {
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
        }, 300);
      } else {
        // Kaydırma iptal animasyonu
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        prevPagePreview.style.transform = 'translateX(-30%)';
        currPagePreview.style.transform = 'translateX(0)';
        
        if (shadowEl) {
          shadowEl.style.opacity = '1';
        }
      }
      
      // Animasyon tamamlandıktan sonra temizleme
      setTimeout(() => {
        // Elementleri kaldır
        if (overlay) overlay.remove();
        if (prevPagePreview) prevPagePreview.remove();
        if (currPagePreview) currPagePreview.remove();
        if (shadowEl) shadowEl.remove();
        
        // Referansları temizle
        this.animEls = {
          overlay: null,
          prevPagePreview: null,
          currPagePreview: null,
          shadowEl: null
        };
        
        // Kaydırma eventlerini tekrar etkinleştir
        this.swipeActive = true;
      }, 350);
    }
  }
  
  // Navigasyon sistemini başlat
  const pageHistory = new PageHistoryManager();
  const swipeHandler = new SwipeGestureHandler(pageHistory);
});
