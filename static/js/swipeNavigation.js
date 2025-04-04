
/**
 * ZekaPark - Profesyonel iOS Swipe Navigasyon Sistemi
 * v3.0.0 - Ultra Premium Sürüm
 * 
 * Gerçek iOS cihazlarındaki kaydırma deneyimini birebir taklit eder
 * Özellikler:
 * - Gerçekçi geçiş animasyonları
 * - Akıllı sayfa geçmişi yönetimi
 * - Hassas dokunma algılama
 * - Optimum performans sağlamak için GPU hızlandırması
 * - Paralaks efektleri
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🌟 ZekaPark iOS Pro Navigasyon v3.0.0 başlatıldı');
  
  // Sayfa geçmişi yönetimi için gelişmiş sınıf
  class NavigationHistoryManager {
    constructor() {
      this.storageKey = 'zekapark_navigation_history_v3';
      this.history = [];
      this.maxHistoryLength = 50;
      this.currentPage = window.location.pathname;
      this.isProcessingNavigation = false; // Çoklu navigasyon önleme
      
      this.init();
    }
    
    init() {
      this.loadHistory();
      this.addCurrentPage();
      this.setupLinkTracking();
      this.setupFormTracking();
      
      // Sayfa değişiklikleri izleme
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
            console.log('📂 Navigasyon geçmişi yüklendi:', this.history);
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
        
        // Geçmiş çok büyükse, yarısını sil
        if (this.history.length > 15) {
          this.history = this.history.slice(Math.floor(this.history.length / 2));
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
          } catch (e2) {
            console.error('❌ Geçmiş kısaltma sonrası da kaydedilemedi');
            this.history = [this.currentPage]; // Son çare
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
          }
        }
      }
    }
    
    // Şu anki sayfayı geçmişe ekle
    addCurrentPage() {
      if (!this.currentPage) return;
      
      // Ana sayfayı her zaman geçmişe ekle (bazı durumlarda referans olarak gerekebilir)
      if (this.currentPage === '/' && this.history.indexOf('/') === -1) {
        this.history.push('/');
        this.saveHistory();
        return;
      }
      
      // Şu anki sayfanın zaten geçmişte olup olmadığını kontrol et
      const existingIndex = this.history.indexOf(this.currentPage);
      
      // Eğer sayfa zaten geçmişin son elemanıysa bir şey yapma
      if (existingIndex === this.history.length - 1) return;
      
      // Eğer sayfa geçmişte varsa, o konumdan sonrasını temizle
      if (existingIndex !== -1) {
        this.history = this.history.slice(0, existingIndex + 1);
      } else {
        // Yeni sayfayı geçmişe ekle
        this.history.push(this.currentPage);
      }
      
      // Geçmiş çok uzunsa, baştan kısalt
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(this.history.length - this.maxHistoryLength);
      }
      
      this.saveHistory();
      console.log('➕ Sayfa geçmişe eklendi:', this.currentPage);
      console.log('📋 Güncel geçmiş:', this.history);
    }
    
    // Link tıklamalarını izle
    setupLinkTracking() {
      const links = document.querySelectorAll('a');
      
      links.forEach(link => {
        // Zaten işlendiyse tekrar işleme
        if (link.dataset.swipeHandled) return;
        
        link.dataset.swipeHandled = 'true';
        
        link.addEventListener('click', (e) => {
          // Dış bağlantıları veya özel bağlantıları atla
          if (!link.href || 
              link.href.includes('#') || 
              link.target === '_blank' ||
              link.hasAttribute('download') ||
              !link.href.includes(window.location.host)) {
            return;
          }
          
          const targetPath = new URL(link.href).pathname;
          
          // Eğer aynı sayfaya gidiyorsa, işlemi engelle
          if (targetPath === this.currentPage) {
            e.preventDefault();
            return;
          }
          
          // Tıklama davranışını kaydet (normal davranışı sürdür)
          console.log('🔗 Navigasyon başlatıldı:', targetPath);
        });
      });
    }
    
    // Form gönderimlerini izle
    setupFormTracking() {
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        if (form.dataset.swipeHandled) return;
        
        form.dataset.swipeHandled = 'true';
        
        // Form gönderiminde geçerli sayfayı kaydet
        form.addEventListener('submit', () => {
          console.log('📝 Form gönderildi, mevcut sayfa geçmişe ekleniyor');
          this.addCurrentPage();
        });
      });
    }
    
    // Sayfa değişimi algılandığında
    handlePopState() {
      const newPath = window.location.pathname;
      if (newPath !== this.currentPage) {
        this.currentPage = newPath;
        console.log('🔄 URL değişimi algılandı:', this.currentPage);
        this.addCurrentPage();
      }
    }
    
    // Bir önceki sayfayı al
    getPreviousPage() {
      const currentIndex = this.history.indexOf(this.currentPage);
      
      // Geçmişte mevcut sayfadan bir önceki sayfa
      if (currentIndex > 0) {
        return this.history[currentIndex - 1];
      }
      
      // Geçmişte en az iki öğe varsa ve son eleman şu anki sayfa değilse
      if (this.history.length >= 2 && this.history[this.history.length - 1] !== this.currentPage) {
        return this.history[this.history.length - 2];
      }
      
      // Hiçbir önceki sayfa bulunamadıysa tarayıcı geçmişinden dene
      if (window.history.length > 1) {
        return null; // Özel bir değer, browser geçmişini kullanacağız
      }
      
      // Son çare olarak ana sayfaya git
      return '/';
    }
    
    // Önceki sayfaya git
    navigateToPreviousPage() {
      // İşlem zaten devam ediyorsa engelle
      if (this.isProcessingNavigation) return false;
      
      this.isProcessingNavigation = true;
      
      const previousPage = this.getPreviousPage();
      
      // Devam eden gezinme işlemini bir süre sonra sıfırla
      setTimeout(() => {
        this.isProcessingNavigation = false;
      }, 1000);
      
      if (previousPage) {
        if (previousPage === null) {
          // Tarayıcı geçmişini kullan
          console.log('🔙 Tarayıcı geçmişi kullanılıyor');
          window.history.back();
        } else {
          // Kendi geçmişimizdeki önceki sayfaya git
          console.log('⬅️ Önceki sayfaya yönlendiriliyor:', previousPage);
          window.location.href = previousPage;
        }
        return true;
      }
      
      // Son çare - ana sayfaya git
      console.log('🏠 Hiçbir önceki sayfa bulunamadı, ana sayfaya yönlendiriliyor');
      window.location.href = '/';
      return true;
    }
  }
  
  // Dokunma ve kaydırma yönetimi
  class SwipeGestureHandler {
    constructor(historyManager) {
      this.history = historyManager;
      
      // Kaydırma durumu
      this.swipeActive = true;             // Kaydırma etkin mi
      this.gestureStarted = false;         // Kaydırma başladı mı
      this.gestureInProgress = false;      // Kaydırma devam ediyor mu
      
      // Pozisyon verileri
      this.startX = null;                  // Başlangıç X koordinatı
      this.startY = null;                  // Başlangıç Y koordinatı
      this.currentX = null;                // Mevcut X koordinatı
      this.currentY = null;                // Mevcut Y koordinatı
      this.lastX = null;                   // Son X koordinatı
      this.touchStartTime = null;          // Dokunma başlangıç zamanı
      this.lastTime = null;                // Son ölçüm zamanı
      
      // Kaydırma hesaplama değişkenleri
      this.velocity = 0;                   // Kaydırma hızı
      this.threshold = 50;                 // Eşik değeri (px)
      this.screenWidth = window.innerWidth; // Ekran genişliği
      this.maxDragPercent = 0.85;          // Maksimum sürükleme oranı
      
      // Animasyon referansları
      this.animElements = {
        overlay: null,          // Arka plan karartma
        prevPagePreview: null,  // Önceki sayfa önizlemesi
        currPagePreview: null,  // Mevcut sayfa önizlemesi
        shadow: null            // Gölge efekti
      };
      
      // Tema algılama
      this.isDarkTheme = document.documentElement.classList.contains('dark');
      
      this.init();
    }
    
    init() {
      // Dokunma olayları
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
      
      // Ekran yeniden boyutlandırma
      window.addEventListener('resize', () => {
        this.screenWidth = window.innerWidth;
      });
      
      // Tema değişiklikleri için gözlemci
      const observer = new MutationObserver(() => {
        this.isDarkTheme = document.documentElement.classList.contains('dark');
      });
      
      // html elementinin class değişikliklerini izle
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
      
      // Kenar ipucu alanı oluştur
      this.createEdgeHint();
    }
    
    // Sol kenar ipucu oluştur
    createEdgeHint() {
      // Sadece mobil cihazlarda göster ve daha önce gösterilmediyse
      if (window.innerWidth <= 768 && !sessionStorage.getItem('edge_hint_shown')) {
        const hint = document.createElement('div');
        hint.className = 'ios-edge-hint';
        hint.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.2), transparent);
          z-index: 9999;
          pointer-events: none;
          animation: pulseHint 2s infinite;
        `;
        
        // Animasyon stil ekle
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulseHint {
            0% { opacity: 0; }
            50% { opacity: 0.7; }
            100% { opacity: 0; }
          }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(hint);
        
        // 5 saniye sonra kaldır
        setTimeout(() => {
          hint.remove();
          sessionStorage.setItem('edge_hint_shown', 'true');
        }, 5000);
      }
    }
    
    handleTouchStart(e) {
      // Kaydırma devre dışıysa veya geri gitmek için geçerli bir sayfa yoksa işlemi durdur
      if (!this.swipeActive) return;
      
      // Ekranın sol kenarından başlayan dokunuşları algıla (ilk 25px içinde)
      const touchX = e.touches[0].clientX;
      
      if (touchX <= 25) {
        this.gestureStarted = true;
        this.startX = touchX;
        this.startY = e.touches[0].clientY;
        this.lastX = touchX;
        this.touchStartTime = Date.now();
        this.lastTime = this.touchStartTime;
        this.velocity = 0;
      }
    }
    
    handleTouchMove(e) {
      if (!this.gestureStarted) return;
      
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      
      // X ve Y eksenlerindeki değişimi hesapla
      const diffX = this.currentX - this.startX;
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Dikey kaydırma yataydan çok daha fazlaysa, kaydırma işlemini iptal et
      if (diffY > diffX * 1.5) {
        this.cancelSwipe();
        return;
      }
      
      // Yatay kaydırma eşiği
      if (diffX > 10) {
        // Diğer kaydırma olaylarını engelle
        e.preventDefault();
        
        // Kaydırma işlemi devam ediyor olarak işaretle
        this.gestureInProgress = true;
        
        // Hız hesaplaması
        const now = Date.now();
        const elapsed = now - this.lastTime;
        
        if (elapsed > 0) {
          this.velocity = (this.currentX - this.lastX) / elapsed;
        }
        
        this.lastX = this.currentX;
        this.lastTime = now;
        
        // İlk kez belirli bir mesafeyi aştığında animasyon öğelerini oluştur
        if (!this.animElements.overlay) {
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
      
      // Hızlı kaydırma algılama (hız veya mesafe)
      const isQuickSwipe = (this.velocity > 0.3) || (diffX > this.threshold && elapsed < 300);
      
      // Kullanıcı yeterince kaydırdıysa veya hızlı kaydırdıysa
      if (diffX > this.threshold || isQuickSwipe) {
        this.completeAnimation(true);
      } else {
        this.completeAnimation(false);
      }
      
      // Kaydırma durumunu sıfırla
      this.gestureStarted = false;
      this.gestureInProgress = false;
    }
    
    handleTouchCancel() {
      if (this.gestureInProgress) {
        this.completeAnimation(false);
      }
      
      this.gestureStarted = false;
      this.gestureInProgress = false;
    }
    
    cancelSwipe() {
      if (this.animElements.overlay) {
        this.completeAnimation(false);
      }
      
      this.gestureStarted = false;
      this.gestureInProgress = false;
    }
    
    createAnimationElements() {
      // Mevcut tema ve sayfanın durumunu al
      const isDarkMode = this.isDarkTheme;
      const bodyClasses = document.body.classList;
      
      // Arka plan ve metin rengi belirleme (tema tabanlı)
      const bgColor = isDarkMode ? '#121212' : '#ffffff';
      const textColor = isDarkMode ? '#ffffff' : '#000000';
      
      // 1. Overlay (arka plan karartma)
      const overlay = document.createElement('div');
      overlay.className = 'ios-swipe-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        z-index: 99999;
        pointer-events: none;
        will-change: background-color;
        transition: background-color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      
      // 2. Önceki sayfa önizlemesi
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
        will-change: transform;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: hidden;
      `;
      
      // Önceki sayfa içeriği (geri simgesi)
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
        transition: opacity 0.3s ease;
      `;
      
      // Geri oku
      const backIcon = document.createElement('div');
      backIcon.innerHTML = `<i class="fas fa-chevron-left" style="font-size: 4rem; margin-bottom: 15px;"></i>`;
      
      // Geri yazısı
      const backText = document.createElement('div');
      backText.textContent = 'Önceki Sayfa';
      backText.style.cssText = 'font-size: 1.5rem; font-weight: 500;';
      
      backIndicator.appendChild(backIcon);
      backIndicator.appendChild(backText);
      prevPage.appendChild(backIndicator);
      
      // 3. Mevcut sayfa önizlemesi (kaydıracağımız eleman)
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
        will-change: transform;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: hidden;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
      `;
      
      // Sayfa içeriğini kopyala
      try {
        // DOM'u klonlayarak mevcut içeriği kopyala
        const clone = document.documentElement.cloneNode(true);
        
        // Gereksiz elementleri temizle
        const elementsToRemove = clone.querySelectorAll('.ios-swipe-overlay, .ios-swipe-prev-page, .ios-swipe-curr-page, .ios-swipe-shadow, script');
        elementsToRemove.forEach(el => el.remove());
        
        // Sadece body içeriğini al
        const bodyClone = clone.querySelector('body');
        
        if (bodyClone) {
          // Scroll pozisyonunu koru
          const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
          
          // Sayfa içeriğini hazırla
          const contentWrapper = document.createElement('div');
          contentWrapper.className = 'ios-swipe-content-wrapper';
          contentWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: absolute;
            top: 0;
            left: 0;
          `;
          
          contentWrapper.innerHTML = bodyClone.innerHTML;
          currPage.appendChild(contentWrapper);
          
          // Scroll pozisyonunu ayarla
          setTimeout(() => {
            if (contentWrapper.querySelector('main')) {
              contentWrapper.querySelector('main').scrollTop = scrollTop;
            }
          }, 10);
        }
      } catch (e) {
        console.warn('⚠️ İçerik kopyalama hatası:', e);
        currPage.innerHTML = '<div style="padding: 20px;">İçerik yüklenemedi</div>';
      }
      
      // 4. Kenar gölgesi
      const shadow = document.createElement('div');
      shadow.className = 'ios-swipe-shadow';
      shadow.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent);
        opacity: 0;
        z-index: 99996;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;
      
      // Dom'a ekle
      document.body.appendChild(prevPage);
      document.body.appendChild(currPage);
      document.body.appendChild(shadow);
      document.body.appendChild(overlay);
      
      // Scroll engelleme
      document.body.style.overflow = 'hidden';
      
      // Referansları kaydet
      this.animElements = {
        overlay,
        prevPagePreview: prevPage,
        currPagePreview: currPage,
        shadow
      };
    }
    
    updateAnimation(percent) {
      const { overlay, prevPagePreview, currPagePreview, shadow } = this.animElements;
      
      if (!overlay || !prevPagePreview || !currPagePreview) return;
      
      // Arka plan karartma (iOS stili): 0 -> 0.4 arasında
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * percent})`;
      
      // Önceki sayfa animasyonu: -30% -> 0%
      prevPagePreview.style.transform = `translateX(${(-30 + (30 * percent))}%)`;
      
      // Mevcut sayfa kaydırma: 0% -> 100%
      currPagePreview.style.transform = `translateX(${percent * 100}%)`;
      
      // Paralaks gölge efekti
      if (shadow) {
        shadow.style.opacity = (1 - percent).toString();
        shadow.style.transform = `translateX(${percent * 100}%)`;
      }
    }
    
    completeAnimation(shouldNavigate) {
      this.swipeActive = false; // Diğer kaydırmaları geçici olarak engelle
      
      const { overlay, prevPagePreview, currPagePreview, shadow } = this.animElements;
      
      if (!overlay || !prevPagePreview || !currPagePreview) {
        this.swipeActive = true;
        return;
      }
      
      if (shouldNavigate) {
        // Tam kaydırma animasyonu
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        prevPagePreview.style.transform = 'translateX(0)';
        currPagePreview.style.transform = 'translateX(100%)';
        
        if (shadow) {
          shadow.style.opacity = '0';
        }
        
        // Animasyon bitince yönlendirme yap (geçiş animasyonu tamamlanana kadar bekle)
        setTimeout(() => {
          // Navigasyon yöneticisini kullan
          this.history.navigateToPreviousPage();
        }, 300);
      } else {
        // İptal animasyonu
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        prevPagePreview.style.transform = 'translateX(-30%)';
        currPagePreview.style.transform = 'translateX(0)';
        
        if (shadow) {
          shadow.style.opacity = '1';
        }
      }
      
      // Animasyon bittikten sonra temizleme
      setTimeout(() => {
        if (overlay) overlay.remove();
        if (prevPagePreview) prevPagePreview.remove();
        if (currPagePreview) currPagePreview.remove();
        if (shadow) shadow.remove();
        
        // Scroll'u tekrar etkinleştir
        document.body.style.overflow = '';
        
        // Animasyon referanslarını temizle
        this.animElements = {
          overlay: null,
          prevPagePreview: null,
          currPagePreview: null,
          shadow: null
        };
        
        // Kaydırmayı tekrar aktif et
        this.swipeActive = true;
      }, 350);
    }
  }
  
  // Navigasyon API'sini global değişken olarak kaydet (debug için)
  const historyManager = new NavigationHistoryManager();
  const swipeHandler = new SwipeGestureHandler(historyManager);
  
  // Global erişim (isteğe bağlı)
  window.ZekaParkNav = {
    history: historyManager,
    swipe: swipeHandler
  };
});
