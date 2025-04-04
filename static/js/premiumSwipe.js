/**
 * Gelişmiş iOS 16+ Kenar Kaydırma Navigasyonu
 * Sıfır gecikme, renk buzulması yok, ultra-hızlı sayfa geçişleri
 * 
 * Geliştirici: ZekaPark Web Çözümleri
 * Sürüm: 4.0
 */

(() => {
  'use strict';
  
  // Performans optimizasyonu için yapılandırma değerleri
  const Config = {
    GESTURE_EDGE_SIZE: 30,            // Ekranın sol kenarındaki algılama bölgesi (piksel)
    TRANSITION_DURATION: 0,           // Geçiş animasyonu süresi (ms) - Anında geçiş
    THRESHOLD_TO_NAVIGATE: 0.3,       // Navigasyon için gereken eşik (ekran genişliğinin yüzdesi)
    MIN_VELOCITY: 0.3,                // Navigasyon için gereken minimum hız (px/ms)
    HISTORY_KEY: 'zeka_nav_history',  // LocalStorage anahtarı
    MAX_HISTORY: 100,                 // Maksimum geçmiş sayısı
    Z_INDEX: 9999,                    // Navigasyon panellerinin z-indeksi
    USE_SESSION_STORAGE: true,        // Session storage kullanımı (tarayıcı penceresi kapatıldığında geçmişi sıfırlar)
    PRELOAD: true                     // Performans için önceden yükleme
  };

  // DOM elementleri için kapsayıcı
  const Elements = {
    container: null,
    currentPage: null,
    previousPage: null,
    dimmer: null
  };

  // Durum yönetimi
  const State = {
    history: [],          // Gezinme geçmişi
    isActive: false,      // Jest aktif mi?
    isReady: false,       // DOM hazır mı?
    startX: 0,            // Başlangıç X pozisyonu
    startY: 0,            // Başlangıç Y pozisyonu
    currentX: 0,          // Mevcut X pozisyonu
    lastX: 0,             // Son X pozisyonu
    lastTimestamp: 0,     // Son zaman damgası
    velocities: [],       // Hız kayıtları
    direction: null,      // Kayma yönü
    preventNavigation: false, // Navigasyonu engelle
    blockAnimations: false    // Animasyonları engelle
  };

  // Gezinme geçmişi kontrolcüsü
  const HistoryManager = {
    // Geçmişi yükle
    load() {
      try {
        const storage = Config.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        const savedHistory = storage.getItem(Config.HISTORY_KEY);
        if (savedHistory) {
          State.history = JSON.parse(savedHistory);
          console.log("Gezinme geçmişi yüklendi:", State.history);
        } else {
          State.history = [];
        }
      } catch (e) {
        console.warn("Geçmiş yüklenemedi:", e);
        State.history = [];
      }
      
      // Mevcut URL geçmişte yoksa ekle
      const currentUrl = window.location.pathname;
      if (State.history.length === 0 || State.history[State.history.length - 1] !== currentUrl) {
        this.addToHistory(currentUrl);
      }
    },
    
    // Geçmişe URL ekle
    addToHistory(url) {
      // Aynı URL arka arkaya eklenmesini önle
      if (State.history.length > 0 && State.history[State.history.length - 1] === url) {
        return;
      }
      
      // Kapasiteyi aşıyorsa baştan sil
      if (State.history.length >= Config.MAX_HISTORY) {
        State.history.shift();
      }
      
      // Yeni URL'i ekle
      State.history.push(url);
      
      // Storage'a kaydet
      try {
        const storage = Config.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        storage.setItem(Config.HISTORY_KEY, JSON.stringify(State.history));
      } catch (e) {
        console.warn("Geçmiş kaydedilemedi:", e);
      }
    },
    
    // Bir önceki sayfaya git
    navigateBack() {
      if (State.history.length <= 1) {
        return false;
      }
      
      // Mevcut sayfayı geçmişten çıkar
      State.history.pop();
      
      // Bir önceki URL'i al
      const previousUrl = State.history[State.history.length - 1];
      
      // Geçmişteki değişikliği kaydet
      try {
        const storage = Config.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        storage.setItem(Config.HISTORY_KEY, JSON.stringify(State.history));
      } catch (e) {
        console.warn("Geçmiş güncellenemedi:", e);
      }
      
      // Önceki sayfaya git
      if (!previousUrl || previousUrl === window.location.pathname) {
        // Tarayıcı geçmişini kullan
        window.history.back();
        return true;
      }
      
      // Anında yükleme için location.replace kullan - daha hızlı
      const targetUrl = previousUrl.startsWith('/') ? 
                       window.location.origin + previousUrl : 
                       (previousUrl.startsWith('http') ? previousUrl : '/' + previousUrl);
      
      window.location.replace(targetUrl);
      return true;
    },
    
    // Mevcut URL'in bir önceki URL'ini döndür
    getPreviousUrl() {
      if (State.history.length < 2) {
        return null;
      }
      return State.history[State.history.length - 2];
    }
  };

  // DOM ve görsel işlemler
  const ViewManager = {
    // DOM elementlerini oluştur
    setupElements() {
      if (State.isReady) return;
      
      // Ana kapsayıcı
      Elements.container = document.createElement('div');
      Elements.container.id = 'zekapark-swipe-container';
      Elements.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: ${Config.Z_INDEX};
        visibility: hidden;
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        perspective: 1200px;
      `;
      
      // Mevcut sayfa paneli
      Elements.currentPage = document.createElement('div');
      Elements.currentPage.id = 'zekapark-current-page';
      Elements.currentPage.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(0, 0, 0);
        will-change: transform;
        z-index: ${Config.Z_INDEX + 2};
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
        opacity: 1;
        visibility: hidden;
      `;
      
      // Önceki sayfa paneli
      Elements.previousPage = document.createElement('div');
      Elements.previousPage.id = 'zekapark-previous-page';
      Elements.previousPage.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(-30px, 0, 0) scale(0.95);
        will-change: transform;
        z-index: ${Config.Z_INDEX + 1};
        visibility: hidden;
      `;
      
      // Karartma katmanı
      Elements.dimmer = document.createElement('div');
      Elements.dimmer.id = 'zekapark-dimmer';
      Elements.dimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        will-change: opacity;
        z-index: ${Config.Z_INDEX};
      `;
      
      // Elementleri birleştir
      Elements.container.appendChild(Elements.previousPage);
      Elements.container.appendChild(Elements.dimmer);
      Elements.container.appendChild(Elements.currentPage);
      document.body.appendChild(Elements.container);
      
      State.isReady = true;
    },
    
    // Görünümü kaydırma için hazırla
    prepareForSwipe() {
      // Hazır değilse oluştur
      if (!State.isReady) {
        this.setupElements();
      }
      
      // Arkaplan rengini al
      const bgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
      
      // Görünürlüğü ayarla
      Elements.container.style.visibility = 'visible';
      Elements.currentPage.style.visibility = 'visible';
      Elements.previousPage.style.visibility = 'visible';
      
      // Mevcut sayfanın içeriğini hemen sabit bir renkle hazırla
      Elements.currentPage.innerHTML = '';
      Elements.currentPage.style.transition = 'none';
      Elements.currentPage.style.backgroundColor = bgColor;
      Elements.currentPage.style.transform = 'translate3d(0, 0, 0)';
      
      // Önceki sayfanın içeriğini hazırla
      Elements.previousPage.innerHTML = '';
      Elements.previousPage.style.transition = 'none';
      Elements.previousPage.style.backgroundColor = bgColor;
      Elements.previousPage.style.transform = 'translate3d(-30px, 0, 0) scale(0.95)';
      
      // Karartma efektini resetle
      Elements.dimmer.style.transition = 'none';
      Elements.dimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    },
    
    // Kaydırma esnasında görünümü güncelle
    updateSwipeAnimation(progress) {
      if (!State.isActive) return;
      
      const screenWidth = window.innerWidth;
      
      // Mevcut sayfayı hareket ettir
      const currentTranslate = progress * screenWidth;
      Elements.currentPage.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
      
      // Önceki sayfayı paralaks efektiyle hareket ettir
      const scaleFactor = 0.95 + (progress * 0.05);
      const previousTranslate = -30 + (progress * 30);
      Elements.previousPage.style.transform = `translate3d(${previousTranslate}px, 0, 0) scale(${scaleFactor})`;
      
      // Karartma efektini ayarla
      const opacity = Math.min(0.5, progress * 0.5);
      Elements.dimmer.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    },
    
    // Kaydırma tamamlandığında
    completeSwipeAnimation() {
      if (!State.isActive) return;
      
      // Animasyon süresini 0 ms olarak ayarla (anında geçiş)
      const duration = Config.TRANSITION_DURATION;
      
      // Animasyonu ayarla
      Elements.currentPage.style.transition = `transform ${duration}ms ease`;
      Elements.previousPage.style.transition = `transform ${duration}ms ease`;
      Elements.dimmer.style.transition = `background-color ${duration}ms ease`;
      
      // Son pozisyona götür
      Elements.currentPage.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
      Elements.previousPage.style.transform = 'translate3d(0, 0, 0) scale(1)';
      Elements.dimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Sıfır gecikmeli animasyon
      setTimeout(() => {
        // Navigasyon tamamlandı, elementleri sıfırla
        Elements.container.style.visibility = 'hidden';
        Elements.currentPage.style.visibility = 'hidden';
        Elements.previousPage.style.visibility = 'hidden';
        Elements.currentPage.innerHTML = '';
        Elements.previousPage.innerHTML = '';
      }, 0);  // Anında
    },
    
    // Kaydırma iptal edildiğinde
    cancelSwipeAnimation() {
      if (!State.isActive) return;
      
      // Animasyon süresini 0 ms olarak ayarla (anında geçiş)
      const duration = Config.TRANSITION_DURATION;
      
      // Animasyonu ayarla
      Elements.currentPage.style.transition = `transform ${duration}ms ease`;
      Elements.previousPage.style.transition = `transform ${duration}ms ease`;
      Elements.dimmer.style.transition = `background-color ${duration}ms ease`;
      
      // Başlangıç pozisyonuna götür
      Elements.currentPage.style.transform = 'translate3d(0, 0, 0)';
      Elements.previousPage.style.transform = 'translate3d(-30px, 0, 0) scale(0.95)';
      Elements.dimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Sıfır gecikmeli animasyon
      setTimeout(() => {
        // Navigasyon iptal, elementleri sıfırla
        Elements.container.style.visibility = 'hidden';
        Elements.currentPage.style.visibility = 'hidden';
        Elements.previousPage.style.visibility = 'hidden';
        Elements.currentPage.innerHTML = '';
        Elements.previousPage.innerHTML = '';
      }, 0);  // Anında
    }
  };

  // Hareket kontrolcüsü
  const GestureController = {
    // Hız hesaplama
    recordVelocity(x) {
      const now = Date.now();
      const elapsed = now - State.lastTimestamp;
      
      if (elapsed > 0) {
        // Piksel/milisaniye cinsinden hız
        const velocity = (x - State.lastX) / elapsed;
        
        // Son 5 hız ölçümünü sakla
        State.velocities.push(velocity);
        if (State.velocities.length > 5) {
          State.velocities.shift();
        }
        
        State.lastX = x;
        State.lastTimestamp = now;
      }
    },
    
    // Ortalama hızı hesapla
    getAverageVelocity() {
      if (State.velocities.length === 0) return 0;
      
      let sum = 0;
      let weights = 0;
      
      // Son hızlara daha yüksek ağırlık ver
      for (let i = 0; i < State.velocities.length; i++) {
        const weight = i + 1;
        sum += State.velocities[i] * weight;
        weights += weight;
      }
      
      return sum / weights;
    },
    
    // Kaydırma sonrası ne yapılacağını belirle
    decideGestureAction() {
      // Mesafe ölçümü
      const distance = State.currentX - State.startX;
      const screenWidth = window.innerWidth;
      
      // Ekran genişliğine göre ilerleme
      const progress = distance / screenWidth;
      
      // Hız ölçümü (px/ms)
      const velocity = this.getAverageVelocity();
      
      // Eşik kontrolü
      if (velocity > Config.MIN_VELOCITY || progress > Config.THRESHOLD_TO_NAVIGATE) {
        return 'navigate';
      } else {
        return 'cancel';
      }
    }
  };

  // Olay dinleyicileri
  const EventHandler = {
    // Olayları ayarla
    setupEventListeners() {
      // Dokunma başlangıcı
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      
      // Dokunma hareketi
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      
      // Dokunma sonu
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      
      // Dokunma iptali
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
      
      // Sayfa içi tıklamalar
      document.addEventListener('click', this.handleClick.bind(this));
      
      // Gezinme değişiklikleri
      window.addEventListener('popstate', () => {
        // Geçmişi kontrol et ve güncelle
        HistoryManager.load();
      });
    },
    
    // Dokunma başlangıcı
    handleTouchStart(e) {
      // Sadece sol kenardan başlangıçları kabul et
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      if (touchX <= Config.GESTURE_EDGE_SIZE && !State.blockAnimations) {
        // Durum bilgilerini sıfırla
        State.isActive = true;
        State.startX = touchX;
        State.startY = touchY;
        State.currentX = touchX;
        State.lastX = touchX;
        State.lastTimestamp = Date.now();
        State.velocities = [];
        State.direction = null;
        State.preventNavigation = false;
        
        // Görünümü hazırla
        ViewManager.prepareForSwipe();
      }
    },
    
    // Dokunma hareketi
    handleTouchMove(e) {
      if (!State.isActive || State.blockAnimations) return;
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      // İlk hareketin yönünü belirle
      if (!State.direction) {
        const deltaX = Math.abs(touchX - State.startX);
        const deltaY = Math.abs(touchY - State.startY);
        
        // Dikey harekette kaydırmayı iptal et
        if (deltaY > deltaX * 1.5) {
          State.preventNavigation = true;
          State.direction = 'vertical';
        } else if (deltaX > 5) {
          State.direction = 'horizontal';
        }
      }
      
      // Dikey kaydırma ise işlemi iptal et
      if (State.preventNavigation) {
        State.isActive = false;
        ViewManager.cancelSwipeAnimation();
        return;
      }
      
      // Yatay hareket onaylandı
      if (State.direction === 'horizontal') {
        // Sadece sağa kaydırmayı işle
        if (touchX >= State.startX) {
          State.currentX = touchX;
          
          // Hız hesapla
          GestureController.recordVelocity(touchX);
          
          // İlerleme yüzdesini hesapla (0-1 arası)
          const screenWidth = window.innerWidth;
          const progress = Math.min(1, Math.max(0, (State.currentX - State.startX) / screenWidth));
          
          // Görünümü güncelle
          ViewManager.updateSwipeAnimation(progress);
          
          // Varsayılan davranışı engelle
          e.preventDefault();
        }
      }
    },
    
    // Dokunma sonu
    async handleTouchEnd(e) {
      if (!State.isActive || State.blockAnimations) return;
      
      // Dikey hareket ise işlem yapma
      if (State.preventNavigation) {
        State.isActive = false;
        return;
      }
      
      // Hareketi analiz et
      const action = GestureController.decideGestureAction();
      
      if (action === 'navigate') {
        // Engelleme bayrağını aç
        State.blockAnimations = true;
        
        // Animasyonu tamamla
        ViewManager.completeSwipeAnimation();
        
        // Önceki sayfaya git (navigasyon)
        HistoryManager.navigateBack();
      } else {
        // Animasyonu iptal et
        ViewManager.cancelSwipeAnimation();
      }
      
      // Durumu sıfırla
      State.isActive = false;
      State.blockAnimations = false;
    },
    
    // Dokunma iptali
    handleTouchCancel() {
      if (State.isActive) {
        // Animasyonu iptal et
        ViewManager.cancelSwipeAnimation();
        
        // Durumu sıfırla
        State.isActive = false;
        State.blockAnimations = false;
      }
    },
    
    // Sayfa içi bağlantı tıklamaları
    handleClick(e) {
      const link = e.target.closest('a');
      
      if (link && !link.target && link.href) {
        const url = new URL(link.href);
        
        // Aynı origin içindeki tıklamalar için
        if (url.origin === window.location.origin) {
          // Geçmişe ekle
          HistoryManager.addToHistory(window.location.pathname);
        }
      }
    }
  };

  // Ana kontrolcü
  const SwipeController = {
    // Başlangıç
    initialize() {
      // DOM hazırlığı
      ViewManager.setupElements();
      
      // Geçmişi yükle
      HistoryManager.load();
      
      // Olayları ayarla
      EventHandler.setupEventListeners();
      
      // Mevcut URL'i kaydet
      HistoryManager.addToHistory(window.location.pathname);
      
      // Önceden yükleme (opsiyonel)
      if (Config.PRELOAD) {
        this.preloadPreviousPage();
      }
      
      console.log("iOS kenar kaydırma navigasyonu başlatılıyor...");
    },
    
    // Önceki sayfayı önbelleğe al (performans için)
    preloadPreviousPage() {
      const previousUrl = HistoryManager.getPreviousUrl();
      
      if (previousUrl) {
        // Favicon ve CSS için ön yükleme
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = previousUrl;
        document.head.appendChild(link);
      }
    }
  };
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', () => {
    SwipeController.initialize();
    console.log("iOS kenar kaydırma navigasyonu aktif");
  });
  
  // DOMContentLoaded olayını kaçırdıysa
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    SwipeController.initialize();
    console.log("iOS kenar kaydırma navigasyonu aktif");
  }
})();
