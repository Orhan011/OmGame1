/**
 * ZekaPark - Profesyonel iOS Swipe Navigasyon Sistemi
 * v4.0.0 - Ultra Premium Pro Sürüm
 * 
 * Gerçek iOS cihazlarındaki kaydırma deneyimini birebir taklit eder
 * Özellikler:
 * - Gerçekçi geçiş animasyonları
 * - Hassas ve doğru sayfa geçmişi yönetimi
 * - Hassas dokunma algılama ve takibi
 * - Optimum performans için GPU hızlandırması
 * - Paralaks ve derinlik efektleri
 * - Akıllı tema adaptasyonu
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🌟 ZekaPark iOS Pro Navigasyon v4.0.0 başlatıldı');
  
  // Sayfa geçmişi yönetimi için gelişmiş sınıf
  class NavigationHistoryManager {
    constructor() {
      this.storageKey = 'zekapark_navigation_history_v4';
      this.history = [];
      this.maxHistoryLength = 50;
      this.currentPage = window.location.pathname;
      this.isProcessingNavigation = false; // Çoklu navigasyon önleme
      this.lastNavigationTime = 0; // Son navigasyon zamanı
      
      this.init();
    }
    
    init() {
      this.loadHistory();
      this.addCurrentPage();
      this.setupLinkTracking();
      this.setupFormTracking();
      
      // Sayfa değişiklikleri izleme
      window.addEventListener('popstate', () => this.handlePopState());
      
      // Hash değişikliklerini yoksay (tek sayfa uygulamaları için)
      window.addEventListener('hashchange', (e) => {
        console.log('📌 Hash değişikliği algılandı, yoksayılıyor');
      });
    }
    
    // LocalStorage'dan geçmişi yükle
    loadHistory() {
      try {
        const savedData = localStorage.getItem(this.storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed)) {
            // Boş olmayan yolları filtrele
            this.history = parsed.filter(path => path && typeof path === 'string');
            console.log('📂 Navigasyon geçmişi yüklendi:', this.history);
          }
        }
      } catch (e) {
        console.warn('⚠️ Geçmiş yüklenemedi:', e);
        this.history = [];
        localStorage.removeItem(this.storageKey);
      }
      
      // Geçmiş boşsa başlangıç değeri ekle
      if (!this.history.length) {
        this.history = [this.currentPage];
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
      
      // Kontroller
      if (this.currentPage.includes('#')) {
        this.currentPage = this.currentPage.split('#')[0]; // Hash'i kaldır
      }
      
      // Aynı sayfa art arda eklenmesin
      if (this.history.length > 0 && this.history[this.history.length - 1] === this.currentPage) {
        return;
      }
      
      // Yeni sayfayı geçmişe ekle
      this.history.push(this.currentPage);
      
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
      // Tüm mevcut bağlantıları izle
      this.trackLinks(document);
      
      // DOM değişikliklerinde yeni bağlantıları izlemek için gözlemci ekle
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // ELEMENT_NODE
                this.trackLinks(node);
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    // Belirli bir element altındaki tüm bağlantıları izle
    trackLinks(element) {
      const links = element.querySelectorAll ? element.querySelectorAll('a') : 
                    (element.tagName === 'A' ? [element] : []);
      
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
          
          try {
            const targetPath = new URL(link.href).pathname;
            
            // Eğer aynı sayfaya gidiyorsa, işlemi engelle
            if (targetPath === this.currentPage) {
              e.preventDefault();
              return;
            }
            
            // Tıklama davranışını kaydet (normal davranışı sürdür)
            console.log('🔗 Navigasyon başlatıldı:', targetPath);
            
            // Ana sayfaya değil, hedef sayfaya doğru gitmek için dinamik geçmiş güncelleme
            if (targetPath !== '/') {
              // Mevcut sayfayı geçmişe ekle (çift ekleme kontrolü yapılacak)
              this.addCurrentPage();
            }
          } catch (err) {
            console.warn('⚠️ Bağlantı URL'si işlenirken hata:', err);
          }
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
    
    // Bir önceki sayfayı al (geliştirilmiş algoritma)
    getPreviousPage() {
      // Geçmiş boşsa ana sayfaya dön
      if (!this.history.length) {
        return '/';
      }
      
      // Mevcut sayfa geçmişin son sayfası değilse, son sayfayı döndür
      if (this.currentPage !== this.history[this.history.length - 1]) {
        return this.history[this.history.length - 1];
      }
      
      // Geçmişte en az iki öğe varsa bir önceki sayfayı döndür
      if (this.history.length >= 2) {
        return this.history[this.history.length - 2];
      }
      
      // Tarayıcı geçmişi desteği
      if (window.history.length > 1) {
        console.log('🔍 Tarayıcı geçmişi kullanılacak');
        return null; // null özel bir değer, browser geçmişini kullanacağız
      }
      
      // Son çare olarak ana sayfaya git
      return '/';
    }
    
    // Önceki sayfaya git (yeniden düzenlenmiş algoritma)
    navigateToPreviousPage() {
      // Aşırı hızlı navigasyonları engelle
      const now = Date.now();
      if (now - this.lastNavigationTime < 500) {
        console.log('⏱️ Navigasyon çok hızlı, engelleniyor');
        return false;
      }
      
      // İşlem zaten devam ediyorsa engelle
      if (this.isProcessingNavigation) {
        console.log('⚠️ Navigasyon zaten devam ediyor, engelleniyor');
        return false;
      }
      
      this.isProcessingNavigation = true;
      this.lastNavigationTime = now;
      
      const previousPage = this.getPreviousPage();
      console.log('🔍 Önceki sayfa tespit edildi:', previousPage);
      
      // Geçmiş durumunu güncelle
      if (this.history.length > 0 && this.currentPage === this.history[this.history.length - 1]) {
        this.history.pop(); // Mevcut sayfayı geçmişten çıkar
        this.saveHistory();
      }
      
      // Devam eden gezinme işlemini bir süre sonra sıfırla
      setTimeout(() => {
        this.isProcessingNavigation = false;
      }, 1000);
      
      if (previousPage === null) {
        // Tarayıcı geçmişini kullan
        console.log('🔙 Tarayıcı geçmişi kullanılıyor');
        window.history.back();
        return true;
      } else if (previousPage) {
        // Kendi geçmişimizdeki önceki sayfaya git
        console.log('⬅️ Önceki sayfaya yönlendiriliyor:', previousPage);
        window.location.href = previousPage;
        return true;
      }
      
      // Son çare - ana sayfaya git (Genelde buraya düşmemeli)
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
      this.isAnimating = false;            // Animasyon devam ediyor mu
      
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
      this.isDarkTheme = document.documentElement.classList.contains('dark') ||
                         document.body.classList.contains('dark');
      
      this.init();
    }
    
    init() {
      // Dokunma olayları
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
      
      // Fare olayları (gelişmiş destek)
      if (window.innerWidth > 768) {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
      }
      
      // Ekran yeniden boyutlandırma
      window.addEventListener('resize', () => {
        this.screenWidth = window.innerWidth;
      });
      
      // Tema değişiklikleri için gözlemci
      const htmlObserver = new MutationObserver(() => {
        this.updateThemeDetection();
      });
      
      const bodyObserver = new MutationObserver(() => {
        this.updateThemeDetection();
      });
      
      // html ve body elementlerinin class değişikliklerini izle
      htmlObserver.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
      
      bodyObserver.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
      
      // Kenar ipucu alanı oluştur
      this.createEdgeHint();
    }
    
    // Tema algılamayı güncelle
    updateThemeDetection() {
      this.isDarkTheme = document.documentElement.classList.contains('dark') ||
                         document.body.classList.contains('dark');
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
    
    // FARE DESTEĞİ (DESKTOP TARAYICILARDA TEST İÇİN)
    handleMouseDown(e) {
      if (!this.swipeActive || this.isAnimating) return;
      
      // Sadece ekranın sol kenarındaki fare tıklamalarını dinle (ilk 20px)
      if (e.clientX <= 20) {
        this.gestureStarted = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.lastX = e.clientX;
        this.touchStartTime = Date.now();
        this.lastTime = this.touchStartTime;
        this.velocity = 0;
        
        // Sayfa içeriğinin seçilmesini engelle
        e.preventDefault();
      }
    }
    
    handleMouseMove(e) {
      if (!this.gestureStarted) return;
      
      this.currentX = e.clientX;
      this.currentY = e.clientY;
      
      // X ve Y eksenlerindeki değişimi hesapla
      const diffX = this.currentX - this.startX;
      const diffY = Math.abs(this.currentY - this.startY);
      
      // Dikey hareket yataydan çok daha fazlaysa, kaydırma işlemini iptal et
      if (diffY > diffX * 1.5 && diffY > 30) {
        this.cancelSwipe();
        return;
      }
      
      // Yatay kaydırma eşiği
      if (diffX > 10) {
        // Diğer olayları engelle
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
    
    handleMouseUp(e) {
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
    
    handleMouseLeave(e) {
      if (this.gestureInProgress) {
        this.completeAnimation(false);
      }
      
      this.gestureStarted = false;
      this.gestureInProgress = false;
    }
    
    // DOKUNMA DESTEĞİ (MOBİL CİHAZLAR İÇİN)
    handleTouchStart(e) {
      // Kaydırma devre dışıysa veya animasyon devam ediyorsa işlemi durdur
      if (!this.swipeActive || this.isAnimating) return;
      
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
      if (diffY > diffX * 1.5 && diffY > 30) {
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
    
    // Sayfa içeriğinden anlık ekran görüntüsü oluşturma
    captureScreenshot() {
      try {
        // Sayfa içeriğini klonla
        const body = document.body;
        const clone = body.cloneNode(true);
        
        // Swipe navigasyon elementlerini temizle
        const swipeElements = clone.querySelectorAll('.ios-swipe-overlay, .ios-swipe-prev-page, .ios-swipe-curr-page, .ios-swipe-shadow, .ios-edge-hint');
        swipeElements.forEach(el => el.remove());
        
        return clone;
      } catch (e) {
        console.error('📷 Ekran görüntüsü oluşturulamadı:', e);
        return document.createElement('div');
      }
    }
    
    // Mevcut sayfa türünü tespit et
    detectPageType() {
      const classList = document.body.classList;
      const path = window.location.pathname;
      
      if (classList.contains('game-page') || path.includes('/games/')) {
        return 'game';
      } else if (classList.contains('profile-page') || path.includes('/profile')) {
        return 'profile';
      } else if (classList.contains('article-page') || path.includes('/articles') || path.includes('/tips')) {
        return 'article';
      } else if (classList.contains('auth-page') || path.includes('/login') || path.includes('/register')) {
        return 'auth';
      }
      
      return 'default';
    }
    
    // Mevcut tema için renk şeması oluştur
    getThemeColors() {
      const isDark = this.isDarkTheme;
      const pageType = this.detectPageType();
      
      // Temel tema renkleri
      let bgColor, textColor, overlayColor, shadowColor;
      
      // Tema ve sayfa türüne göre renk ayarları
      switch (pageType) {
        case 'game':
          bgColor = isDark ? '#0f0f1a' : '#f0f8ff';
          textColor = isDark ? '#ffffff' : '#000000';
          overlayColor = 'rgba(0, 0, 0, 0.5)';
          shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)';
          break;
        case 'profile':
          bgColor = isDark ? '#131326' : '#f5f5f7';
          textColor = isDark ? '#ffffff' : '#000000';
          overlayColor = 'rgba(0, 0, 0, 0.4)';
          shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';
          break;
        case 'article':
          bgColor = isDark ? '#1a1a2e' : '#ffffff';
          textColor = isDark ? '#e6e6e6' : '#121212';
          overlayColor = 'rgba(0, 0, 0, 0.3)';
          shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
          break;
        case 'auth':
          bgColor = isDark ? '#161625' : '#f9f9f9';
          textColor = isDark ? '#ffffff' : '#000000';
          overlayColor = 'rgba(0, 0, 0, 0.4)';
          shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';
          break;
        default:
          bgColor = isDark ? '#121212' : '#ffffff';
          textColor = isDark ? '#ffffff' : '#000000';
          overlayColor = 'rgba(0, 0, 0, 0.35)';
          shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
      }
      
      return { bgColor, textColor, overlayColor, shadowColor };
    }
    
    createAnimationElements() {
      // Mevcut tema ve renkler
      const { bgColor, textColor, overlayColor, shadowColor } = this.getThemeColors();
      
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
        -webkit-backdrop-filter: blur(0px);
        backdrop-filter: blur(0px);
      `;
      
      // 2. Önceki sayfa önizlemesi
      const prevPage = document.createElement('div');
      prevPage.className = 'ios-swipe-prev-page';
      
      // Sayfa türü sınıfları ekle
      const pageType = this.detectPageType();
      prevPage.classList.add(`${pageType}-page`);
      
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
      
      // 3. Mevcut sayfa önizlemesi
      const currPage = document.createElement('div');
      currPage.className = 'ios-swipe-curr-page';
      currPage.classList.add(`${pageType}-page`);
      
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
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: hidden;
        box-shadow: -5px 0 15px ${shadowColor};
      `;
      
      // Mevcut sayfa içeriği
      const currentContent = document.createElement('div');
      currentContent.className = 'ios-swipe-content-wrapper';
      currentContent.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        overflow: hidden;
        transform-origin: left center;
      `;
      
      // Sayfa içeriğini klonla
      const pageClone = this.captureScreenshot();
      currentContent.appendChild(pageClone);
      currPage.appendChild(currentContent);
      
      // 4. Kenar gölgesi
      const shadow = document.createElement('div');
      shadow.className = 'ios-swipe-shadow';
      shadow.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 15px;
        height: 100%;
        z-index: 99996;
        background: linear-gradient(to right, ${shadowColor}, transparent);
        opacity: 1;
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      
      // Tüm elementleri sayfaya ekle
      document.body.appendChild(overlay);
      document.body.appendChild(prevPage);
      document.body.appendChild(currPage);
      document.body.appendChild(shadow);
      
      // Kaydırma sırasında sayfanın kaydırılmasını engelle
      document.body.style.overflow = 'hidden';
      document.body.classList.add('ios-swiping');
      
      // Animasyon elementlerini sakla
      this.animElements = {
        overlay: overlay,
        prevPagePreview: prevPage,
        currPagePreview: currPage,
        shadow: shadow
      };
    }
    
    updateAnimation(percent) {
      if (!this.animElements.overlay) return;
      
      const { overlay, prevPagePreview, currPagePreview, shadow } = this.animElements;
      const { overlayColor } = this.getThemeColors();
      
      // Karartma rengini hesapla
      const opacity = 0.35 * percent;
      const parsedOverlayColor = overlayColor.replace(/[\d.]+\)$/g, `${opacity})`);
      
      // Kaydırma oranına göre transformları ayarla
      if (overlay) {
        overlay.style.backgroundColor = parsedOverlayColor;
        overlay.style.backdropFilter = `blur(${percent * 2}px)`;
        overlay.style.webkitBackdropFilter = `blur(${percent * 2}px)`;
      }
      
      if (prevPagePreview) {
        // Önceki sayfanın -30% ile 0% arasında hareketi (easing ile)
        const prevTransform = -30 * Math.pow(1 - percent, 1.2);
        prevPagePreview.style.transform = `translateX(${prevTransform}%)`;
        
        // Önceki sayfanın içerik göstergesi
        const backIndicator = prevPagePreview.querySelector('.ios-swipe-back-indicator');
        if (backIndicator) {
          backIndicator.style.opacity = percent;
        }
      }
      
      if (currPagePreview) {
        // Mevcut sayfanın ilerlemesi (cubic-bezier eğrisi taklit ediliyor)
        const easedPercent = percent * (1 + percent * 0.25); // Hafif ivme
        
        // Paralaks efekti - Ölçeklendirme ve perspektif
        const scale = 1 - (0.04 * percent);
        const perspective = 1000;
        const rotateY = percent * 5; // Hafif 3D döndürme
        
        currPagePreview.style.transformOrigin = 'left center';
        currPagePreview.style.transform = `
          translateX(${easedPercent * 100}%) 
          scale(${scale}) 
          perspective(${perspective}px) 
          rotateY(${rotateY}deg)
        `;
        
        // Ek derinlik efekti
        const contentWrapper = currPagePreview.querySelector('.ios-swipe-content-wrapper');
        if (contentWrapper) {
          contentWrapper.style.filter = `brightness(${1 - 0.1 * percent})`;
        }
      }
      
      if (shadow) {
        shadow.style.opacity = (1 - percent).toString();
        shadow.style.transform = `translateX(${percent * 100}%)`;
      }
    }
    
    completeAnimation(isSuccess) {
      // Animasyon zaten işlemde ise engelleyelim
      if (this.isAnimating) return;
      this.isAnimating = true;
      
      const { overlay, prevPagePreview, currPagePreview, shadow } = this.animElements;
      const { overlayColor } = this.getThemeColors();
      
      // Animasyon tamamlama efekti
      if (isSuccess) {
        // Başarılı tamamlama animasyonu
        const parsedColor = overlayColor.replace(/[\d.]+\)$/g, '0.35)');
        
        if (overlay) {
          overlay.style.backgroundColor = parsedColor;
          overlay.style.backdropFilter = 'blur(2px)';
          overlay.style.webkitBackdropFilter = 'blur(2px)';
        }
        
        if (prevPagePreview) {
          prevPagePreview.style.transform = 'translateX(0)';
        }
        
        if (currPagePreview) {
          // Animasyon daha düzgün olsun
          currPagePreview.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.3s ease';
          currPagePreview.style.transform = 'translateX(100%) scale(0.96) perspective(1000px) rotateY(5deg)';
          
          const contentWrapper = currPagePreview.querySelector('.ios-swipe-content-wrapper');
          if (contentWrapper) {
            contentWrapper.style.filter = 'brightness(0.9)';
          }
        }
        
        if (shadow) {
          shadow.style.opacity = '0';
        }
        
        // Animasyon bitince yönlendirme yap (geçiş animasyonu tamamlanana kadar bekle)
        setTimeout(() => {
          // Scroll'u tekrar etkinleştir
          document.body.style.overflow = '';
          document.body.classList.remove('ios-swiping');
          
          // Reflow için zorla
          document.body.offsetHeight;
          
          // Navigasyon yöneticisini kullan
          this.history.navigateToPreviousPage();
          
          // Temizleme
          setTimeout(() => {
            this.cleanupAnimationElements();
          }, 100);
        }, 300);
      } else {
        // İptal animasyonu (daha hızlı)
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        overlay.style.backdropFilter = 'blur(0px)';
        overlay.style.webkitBackdropFilter = 'blur(0px)';
        
        if (prevPagePreview) {
          prevPagePreview.style.transform = 'translateX(-30%)';
          
          // Önceki sayfa göstergesi
          const backIndicator = prevPagePreview.querySelector('.ios-swipe-back-indicator');
          if (backIndicator) {
            backIndicator.style.opacity = '0';
          }
        }
        
        if (currPagePreview) {
          // Daha hızlı geri dönüş
          currPagePreview.style.transition = 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          currPagePreview.style.transform = 'translateX(0) scale(1) perspective(1000px) rotateY(0deg)';
          
          const contentWrapper = currPagePreview.querySelector('.ios-swipe-content-wrapper');
          if (contentWrapper) {
            contentWrapper.style.filter = 'brightness(1)';
          }
        }
        
        if (shadow) {
          shadow.style.opacity = '1';
        }
        
        // Animasyon bittikten sonra temizle
        setTimeout(() => {
          // Scroll'u tekrar etkinleştir
          document.body.style.overflow = '';
          document.body.classList.remove('ios-swiping');
          
          // Temizleme
          this.cleanupAnimationElements();
        }, 300);
      }
    }
    
    // Animasyon elemanlarını temizle
    cleanupAnimationElements() {
      const { overlay, prevPagePreview, currPagePreview, shadow } = this.animElements;
      
      // Elementleri temizle
      if (overlay) overlay.remove();
      if (prevPagePreview) prevPagePreview.remove();
      if (currPagePreview) currPagePreview.remove();
      if (shadow) shadow.remove();
      
      // Animasyon referanslarını temizle
      this.animElements = {
        overlay: null,
        prevPagePreview: null,
        currPagePreview: null,
        shadow: null
      };
      
      // Animasyon durumunu temizle
      this.isAnimating = false;
    }
  }
  
  // Geçmiş yöneticisini ve kaydırma yöneticisini oluştur
  const historyManager = new NavigationHistoryManager();
  const swipeHandler = new SwipeGestureHandler(historyManager);
});