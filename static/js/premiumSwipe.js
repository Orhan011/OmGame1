/**
 * Premium iOS-style Edge Swipe Navigation
 * Modern implentasyon - yüksek performans, gerçekçi fizik ve iOS ile aynı hissiyat
 * 
 * Geliştirici: ZekaPark Web Çözümleri
 * Sürüm: 2.0
 */

(() => {
  // Modern modül yapısı ile kod kapsülleme - performans için
  'use strict';

  // Yapılandırma sabitlerini bir nesne içinde toplayarak kod yönetimini kolaylaştırma
  const CONFIG = {
    EDGE_THRESHOLD: 20,                      // Ekranın kenarından başlama eşiği (piksel)
    MIN_SWIPE_THRESHOLD: 40,                 // Minimum kaydırma mesafesi (piksel) - azaltıldı
    MAX_SWIPE_TIME: 300,                     // Maksimum kaydırma süresi (ms)
    SPRING_TENSION: 0.85,                    // Yay gerginliği (0-1 arası)
    CRITICAL_VELOCITY: 0.3,                  // Kritik hız eşiği (px/ms) - azaltıldı
    ANIMATION_DURATION_MIN: 10,              // Minimum animasyon süresi (ms) - istenen 20ms hız
    ANIMATION_DURATION_MAX: 20,              // Maksimum animasyon süresi (ms) - daha da hızlandırıldı
    TRANSITION_BASE_CURVE: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // Daha hızlı animasyon eğrisi
    STORAGE_KEY: 'zeka_park_navigation_history',
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.15)',     // Daha hafif gölge rengi
    Z_INDEX_BASE: 10000                      // z-index temel değeri
  };

  // DOM referanslarını bir arada tutarak bellek yönetimini iyileştirme
  const DOM = {
    pageContainer: null,
    previousPagePreview: null,
    overlay: null,
    pageClone: null
  };

  // Durum yönetimi için ayrı bir nesne kullanarak kodu modüler hale getirme
  const STATE = {
    touchStartX: 0,
    touchStartY: 0,
    currentX: 0,
    lastX: 0,
    velocityX: 0,
    startTime: 0,
    isAnimating: false,
    isSwipeActive: false,
    navigationHistory: [],
    lastVelocityRecord: Date.now(),
    velocities: [],
    domNodesReady: false
  };

  // Bir önceki karenin zaman damgasını tutarak pürüzsüz animasyonlar sağlama
  let lastFrameTimestamp = 0;

  // İşlevleri mantıksal gruplara ayırarak kod organizasyonunu geliştirme
  const HistoryManager = {
    /**
     * Gezinme geçmişini localStorage'dan yükle
     */
    loadHistory() {
      try {
        const storedHistory = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (storedHistory) {
          STATE.navigationHistory = JSON.parse(storedHistory);
          console.log("Gezinme geçmişi yüklendi:", STATE.navigationHistory);
        }
      } catch (e) {
        console.warn("Gezinme geçmişi yüklenirken hata oluştu:", e);
        STATE.navigationHistory = [];
      }
    },

    /**
     * Mevcut URL'yi gezinme geçmişine ekle
     */
    saveCurrentPage() {
      // Tam sayfa URL'sini kullan (pathname yerine)
      const currentUrl = window.location.pathname || '/';
      
      // Mevcut geçmiş durumunu logla
      console.log("Mevcut geçmiş durumu:", [...STATE.navigationHistory]);
      
      // Önceki sayfayla aynı sayfaya eklemeyi önle
      if (STATE.navigationHistory.length === 0 || 
          STATE.navigationHistory[STATE.navigationHistory.length - 1] !== currentUrl) {
        
        // Geçmiş çok uzunsa en eski öğeyi çıkar
        if (STATE.navigationHistory.length >= 30) {
          STATE.navigationHistory.shift();
        }
        
        // Mevcut sayfayı geçmişe ekle
        STATE.navigationHistory.push(currentUrl);
        console.log("Geçmişe yeni URL eklendi:", currentUrl);
        console.log("Güncellenmiş geçmiş:", [...STATE.navigationHistory]);
        
        // localStorage'a kaydet
        try {
          localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(STATE.navigationHistory));
        } catch (e) {
          console.warn("Gezinme geçmişi saklanırken hata oluştu:", e);
          
          // LocalStorage hatası durumunda tarayıcı geçmişine güven
          if (window.history.length > 1) {
            return true;
          }
        }
      } else {
        console.log("URL zaten geçmişte var, eklenmedi:", currentUrl);
      }
      
      // En az 2 sayfa varsa navigasyon yapılabilir
      return STATE.navigationHistory.length > 1;
    },

    /**
     * Önceki sayfaya git
     */
  };
    navigateBack() {
      if (STATE.navigationHistory.length > 1) {
        // Son sayfayı mevcut geçmişten çıkar (mevcut sayfa)
        const currentUrl = STATE.navigationHistory.pop();
        console.log("Çıkarılan mevcut URL:", currentUrl);
        
        // Önceki sayfaya git
        const previousUrl = STATE.navigationHistory[STATE.navigationHistory.length - 1];
        console.log("Gidilecek önceki URL:", previousUrl);
        
        // Performans için geçmişi arka planda kaydet
        setTimeout(() => {
          try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(STATE.navigationHistory));
          } catch (e) {
            console.warn("Gezinme geçmişi güncellenirken hata:", e);
          }
        }, 0);
        
        // Önceki URL'e hızlı geçiş için location.replace kullan
        // (location.href yerine, bu daha hızlı çalışır)
        if (previousUrl.startsWith('http')) {
          window.location.replace(previousUrl);
        } else {
          // Relative URL'leri düzgün şekilde işle
          const baseUrl = window.location.origin;
          const fullUrl = previousUrl.startsWith('/') ? 
            baseUrl + previousUrl : 
            baseUrl + '/' + previousUrl;
          
          // Daha hızlı yükleme için replace kullan
          window.location.replace(fullUrl);
        }
        return true;
      } else {
        // Geçmiş yoksa tarayıcı geçmişini kullan (daha hızlı)
        if (window.history.length > 1) {
          window.history.back();
          return true;
        } else {
          // Ana sayfaya dön
          window.location.replace('/');
          return false;
        }
      }
    }

  // DOM ile ilgili tüm işlemleri bir araya toplama
  const DOMManager = {
    /**
     * Tüm DOM elementlerini oluştur
     */
      
    createElements() {
      if (STATE.domNodesReady) return;
      
      // Document Fragment kullan - daha hızlı DOM işlemi için
      const fragment = document.createDocumentFragment();
      
      // Ana kapsayıcı
      DOM.pageContainer = document.createElement('div');
      DOM.pageContainer.id = 'ios-edge-swipe-container';
      DOM.pageContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: ${CONFIG.Z_INDEX_BASE};
        display: grid;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000;
      `;
      
      // Önceki sayfa önizlemesi - daha optimize edilmiş stil
      DOM.previousPagePreview = document.createElement('div');
      DOM.previousPagePreview.id = 'ios-previous-page';
      DOM.previousPagePreview.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: translate3d(-5%, 0, 0) scale(0.98) translateZ(0);
        opacity: 0;
        z-index: ${CONFIG.Z_INDEX_BASE - 1};
        background-color: var(--bg-color, var(--bs-body-bg, #f8f9fa));
        color: var(--text-color, var(--bs-body-color, #212529));
        transition: transform 0.20s ${CONFIG.TRANSITION_BASE_CURVE}, opacity 0.20s ease-out;
        overflow-x: hidden;
        pointer-events: none;
        will-change: transform, opacity;
        visibility: hidden;
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Gölge efekti için overlay - daha hafif ve daha hızlı
      DOM.overlay = document.createElement('div');
      DOM.overlay.id = 'ios-edge-swipe-overlay';
      DOM.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        pointer-events: none;
        transition: opacity 0.20s ease;
        z-index: ${CONFIG.Z_INDEX_BASE - 2};
        transform: translateZ(0);
        will-change: opacity;
      `;
      
      // Mevcut sayfa kopyası (kaydırma animasyonu için) - daha optimize CSS
      DOM.pageClone = document.createElement('div');
      DOM.pageClone.id = 'ios-current-page-clone';
      DOM.pageClone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: translate3d(0, 0, 0) translateZ(0);
        background-color: var(--bg-color, var(--bs-body-bg, #f8f9fa));
        color: var(--text-color, var(--bs-body-color, #212529));
        transition: transform 0.20s ${CONFIG.TRANSITION_BASE_CURVE};
        overflow: hidden;
        z-index: ${CONFIG.Z_INDEX_BASE};
        pointer-events: none;
        box-shadow: 0 0 10px rgba(0,0,0,0.12);
        will-change: transform;
        visibility: hidden;
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Document Fragment'a elementleri ekle
      fragment.appendChild(DOM.previousPagePreview);
      fragment.appendChild(DOM.overlay);
      fragment.appendChild(DOM.pageClone);
      fragment.appendChild(DOM.pageContainer);
      
      // Tek seferde DOM'a ekle (daha hızlı)
      document.body.appendChild(fragment);
      STATE.domNodesReady = true;
    },
    
    /**
     * Kaydırma animasyonu için sayfayı hazırla
     */
      DOM.previousPagePreview.style.opacity = '1';
      DOM.previousPagePreview.appendChild(previousPageContent);
    prepareForSwipe() {
      if (!STATE.domNodesReady) {
        this.createElements();
      }
      
      // Mevcut sayfayı en verimli şekilde kopyalama (20ms hedefi için optimize)
      // HTML içeriğini doğrudan kopyalamak yerine, sadece gerekli stilleri uygula
      
      // Stil bilgilerini hızlı şekilde al
      const bgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
      const textColor = getComputedStyle(document.body).color || '#212529';
      
      // Mevcut sayfa klonu - 20ms hız için optimize edilmiş CSS
      DOM.pageClone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: translate3d(0, 0, 0) translateZ(0);
        background-color: ${bgColor};
        color: ${textColor};
        transition: transform 10ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: hidden;
        z-index: ${CONFIG.Z_INDEX_BASE};
        pointer-events: none;
        box-shadow: 0 0 10px rgba(0,0,0,0.15);
        will-change: transform;
        visibility: visible;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Önceki sayfa önizlemesi - daha hızlı render için basitleştirilmiş
      DOM.previousPagePreview.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: translate3d(-5%, 0, 0) scale(0.98) translateZ(0);
        opacity: 0;
        z-index: ${CONFIG.Z_INDEX_BASE - 1};
        background-color: ${bgColor};
        color: ${textColor};
        transition: transform 10ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 10ms ease-out;
        overflow-x: hidden;
        pointer-events: none;
        will-change: transform, opacity;
        visibility: visible;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Sayfa içeriği kopyalama yöntemini değiştir - daha hızlı ve daha az renk buzulması için
      // Üst düzey div'in stilleri ve arkaplan rengi yeterli
      DOM.pageClone.innerHTML = '';
      
      // Mevcut sayfanın temsilini oluştur, ancak ağır DOM klonlama yapmadan
      const pageSnapshot = document.createElement('div');
      pageSnapshot.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        position: relative;
        overflow: hidden;
      `;
      
      
      // Sayfa snapshot'ını ekle
      DOM.pageClone.appendChild(pageSnapshot);
      
      // Önceki sayfa için de basitleştirilmiş içerik
      DOM.previousPagePreview.innerHTML = '';
      const previousPageContent = document.createElement('div');
      previousPageContent.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Önceki sayfanın içeriğini ekle
      DOM.previousPagePreview.appendChild(previousPageContent);
      
      // Ön plandaki sayfa içeriğini hemen göster
      DOM.previousPagePreview.style.opacity = '1';
      DOM.previousPagePreview.style.transform = 'translate3d(-5%, 0, 0) scale(0.98)';
    },
    
    /**
     * Gerçek zamanlı kaydırma animasyonunu güncelle
     */
      // Daha hafif gölge efekti, renk bulanıklığı riskini azalt
      const shadowOpacity = Math.min(0.15, easedProgress * 0.18);
      DOM.overlay.style.backgroundColor = `rgba(0, 0, 0, ${shadowOpacity})`;
      
      // Önceki sayfa animasyonu (daha az görsel efekt, daha fazla hız)
      const prevPageTranslate = -5 + (easedProgress * 5);
      const prevPageScale = 0.98 + (easedProgress * 0.02);
      
      // Tek bir transform işlemi (daha verimli render)
      DOM.previousPagePreview.style.transform = `translate3d(${prevPageTranslate}%, 0, 0) scale(${prevPageScale}) translateZ(0)`;
      DOM.previousPagePreview.style.opacity = Math.min(1, easedProgress * 3); // Daha hızlı görünüm
    },
    
     * Cubic easing fonksiyonu - daha pürüzsüz animasyonlar için
     */
    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },
    
    /**
     * Kaydırma animasyonunu tamamla
     */
    resetSwipeAnimation(duration = 180) {
        transition: transform ${duration}ms ${CONFIG.TRANSITION_BASE_CURVE};
    completeSwipeAnimation(duration = CONFIG.ANIMATION_DURATION_MIN) {
      // Süreyi sabit 20ms olarak ayarla (kullanıcı isteği)
      const animDuration = 20; // Kesin olarak 20ms
      
      // Animasyon tamamlama için optimize edilmiş stil
      // GPU hızlandırma için transform ve süre optimize edildi
      DOM.pageClone.style.transform = `translate3d(${window.innerWidth}px, 0, 0) translateZ(0)`;
      // Transition süresini 20ms olarak ayarla
      DOM.pageClone.style.transition = `transform ${animDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      
      // Önceki sayfa öğesini hedef konumuna yerleştir (daha hızlı)
      DOM.previousPagePreview.style.transform = 'translate3d(0%, 0, 0) scale(1) translateZ(0)';
      DOM.previousPagePreview.style.opacity = '1';
      DOM.previousPagePreview.style.transition = `transform ${animDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${animDuration}ms linear`;
      
      // Önceki sayfayı paralel olarak önceden yükle (navigasyon performansını artırır)
      if (STATE.navigationHistory.length >= 2) {
        const previousUrl = STATE.navigationHistory[STATE.navigationHistory.length - 2] || '/';
        try {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'document';
          link.href = previousUrl;
          document.head.appendChild(link);
          
          // Ek performans için DNS önceden çözümleme
          const dnsPrefetch = document.createElement('link');
          dnsPrefetch.rel = 'dns-prefetch';
          dnsPrefetch.href = new URL(previousUrl, window.location.origin).origin;
          document.head.appendChild(dnsPrefetch);
        } catch (e) {
          // Sessizce başarısızlık - yükleme işlemi engellemez
        }
      }
      
      // Sabit süre sonra gerçek navigasyonu başlat
      return new Promise(resolve => setTimeout(resolve, animDuration));
    },
    
          DOM.previousPagePreview.style.visibility = 'hidden';
    resetSwipeAnimation(duration = 20) {
      // Ultra hızlı sıfırlama - 20ms hedefi için optimize
      const resetDuration = 20; // Kesin olarak 20ms
      
      // Optimum style sıfırlama - minimum CSS özellikleri kullanarak
      DOM.pageClone.style.transform = 'translate3d(0, 0, 0) translateZ(0)';
      DOM.pageClone.style.transition = `transform ${resetDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      
      // Gölge efekti hemen kaldır (daha hızlı)
      DOM.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Önceki sayfa görselini başlangıç konumuna getir
      DOM.previousPagePreview.style.transform = 'translate3d(-5%, 0, 0) scale(0.98) translateZ(0)';
      DOM.previousPagePreview.style.opacity = '0';
      DOM.previousPagePreview.style.transition = `transform ${resetDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${resetDuration}ms linear`;
      
      // Görünürlük değişimi hemen uygula (animasyon bekleme yok)
      // Bu, ek 20ms performans kazandırır
      setTimeout(() => {
        DOM.pageClone.style.visibility = 'hidden';
        DOM.previousPagePreview.style.visibility = 'hidden';
        
        // İçeriği temizleyerek daha fazla performans kazanımı
        DOM.pageClone.innerHTML = '';
        DOM.previousPagePreview.innerHTML = '';
      }, 0);
      
      // İşlem gecikmeden tamamlandı olarak işaretle
      return Promise.resolve();
    }
          resolve();
        }, duration);
      });
    }
  };

  // Dokunma ve kaydırma ile ilgili tüm işlemleri bir araya toplama
  const TouchManager = {
    /**
     * Dokunma başlangıcı
     */
    handleTouchStart(e) {
      // Edge bölgesinde mi kontrol et
      if (e.touches[0].clientX > CONFIG.EDGE_THRESHOLD) return;
      
      // Geçmiş kontrolü
      const hasHistory = HistoryManager.saveCurrentPage();
      if (!hasHistory) return;
      
      // Dokunma durumunu kaydet
      STATE.touchStartX = e.touches[0].clientX;
      STATE.touchStartY = e.touches[0].clientY;
      STATE.currentX = STATE.touchStartX;
      STATE.lastX = STATE.touchStartX;
      STATE.startTime = Date.now();
      STATE.isSwipeActive = true;
      STATE.velocities = [];
      
      // DOM'u hazırla
      DOMManager.prepareForSwipe();
    },
    
    /**
     * Dokunma hareketi - pürüzsüz kaydırma
     */
    handleTouchMove(e) {
      if (!STATE.isSwipeActive || STATE.isAnimating) return;
      
      // Mevcut pozisyonu güncelle
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      // Hareket yönü kontrolü
      const deltaX = currentX - STATE.touchStartX;
      const deltaY = Math.abs(currentY - STATE.touchStartY);
      
      // Hızı hesapla ve kaydet (her 10ms'de bir kaydet)
      const now = Date.now();
      if (now - STATE.lastVelocityRecord > 10) {
        const instantVelocity = (currentX - STATE.lastX) / (now - STATE.lastVelocityRecord);
        STATE.velocities.push(instantVelocity);
        
        // En fazla son 5 hız kaydını tut
        if (STATE.velocities.length > 5) {
          STATE.velocities.shift();
        }
        
        STATE.lastX = currentX;
        STATE.lastVelocityRecord = now;
      }
      
      // Yatay kaydırma kontrolü
      if (deltaX > 0 && deltaX > deltaY * 1.2) {
        STATE.currentX = currentX;
        
        // Kaydırma ilerlemesini hesapla (0-1 arası)
        const maxWidth = window.innerWidth * 0.9; // Maksimum kaydırma mesafesi
        const rawProgress = deltaX / maxWidth;
        const progress = Math.min(0.999, rawProgress);
        
        // Kaydırma animasyonunu güncelle
        DOMManager.updateSwipeAnimation(progress);
        
        // Sayfa kaydırmayı engelle
        e.preventDefault();
      }
    },
    
    /**
     * Dokunma bitişi - animasyonu tamamla veya iptal et
     */
    async handleTouchEnd(e) {
      if (!STATE.isSwipeActive || STATE.isAnimating) return;
      
      STATE.isAnimating = true;
      
      // Son pozisyon ve süre
      const touchEndX = e.changedTouches[0].clientX;
      const touchDuration = Date.now() - STATE.startTime;
      const touchDistance = touchEndX - STATE.touchStartX;
      
      // Ortalama hızı hesapla
      let averageVelocity = 0;
      if (STATE.velocities.length > 0) {
        const sum = STATE.velocities.reduce((acc, vel) => acc + vel, 0);
        averageVelocity = sum / STATE.velocities.length;
      }
      
      // Kaydırma tamamlama kriteri
      const isFastSwipe = touchDuration < CONFIG.MAX_SWIPE_TIME && 
                          touchDistance > CONFIG.MIN_SWIPE_THRESHOLD;
      const isFarSwipe = touchDistance > window.innerWidth * 0.4;
      const isHighVelocity = averageVelocity > CONFIG.CRITICAL_VELOCITY;
      
      // Kaydırma işlemi tamamlanmalı mı?
      if (isFastSwipe || isFarSwipe || isHighVelocity) {
        // Hıza dayalı bir animasyon süresi hesapla - daha hızlı kaydırma = daha hızlı animasyon
        const speedBasedDuration = isHighVelocity 
          ? CONFIG.ANIMATION_DURATION_MIN 
          : CONFIG.ANIMATION_DURATION_MAX - (Math.abs(averageVelocity) * 500);
          
        // Animasyonu tamamla
        await DOMManager.completeSwipeAnimation(speedBasedDuration);
        
        // Sayfaya git
        HistoryManager.navigateBack();
      } else {
        // Animasyonu iptal et
        await DOMManager.resetSwipeAnimation();
      }
      
      // Durumu sıfırla
      STATE.isSwipeActive = false;
      STATE.isAnimating = false;
      STATE.touchStartX = 0;
      STATE.touchStartY = 0;
      STATE.currentX = 0;
    },
    
    /**
     * Dokunma iptali
     */
    async handleTouchCancel() {
      if (!STATE.isSwipeActive) return;
      
      STATE.isAnimating = true;
      
      // Animasyonu sıfırla
      await DOMManager.resetSwipeAnimation();
      
      // Durumu sıfırla
      STATE.isSwipeActive = false;
      STATE.isAnimating = false;
      STATE.touchStartX = 0;
      STATE.touchStartY = 0;
      STATE.currentX = 0;
    }
  };

  // EventListener kurulumu ve başlangıç işlemleri
  const SwipeNavigation = {
    /**
     * Navigasyon sistemini başlat
     */
    initialize() {
      // Geçmişi yükle
      HistoryManager.loadHistory();
      
      // DOM elementlerini oluştur
      DOMManager.createElements();
      
      // Event dinleyicileri ekle
      this.setupEventListeners();
      
      // Mevcut sayfayı geçmişe ekle
      HistoryManager.saveCurrentPage();
      
      // Dokunmasız cihazlar için geri butonu ekle
      this.setupBackButtonForDesktop();
      
      console.log("ZekaPark Premium iOS Navigation aktif");
    },
    
    /**
     * Event dinleyicileri
     */
    setupEventListeners() {
      // Dokunma olayları
      document.addEventListener('touchstart', TouchManager.handleTouchStart.bind(TouchManager), { passive: true });
      document.addEventListener('touchmove', TouchManager.handleTouchMove.bind(TouchManager), { passive: false });
      document.addEventListener('touchend', TouchManager.handleTouchEnd.bind(TouchManager), { passive: true });
      document.addEventListener('touchcancel', TouchManager.handleTouchCancel.bind(TouchManager), { passive: true });
      
      // Bağlantı tıklamalarını izle ve geçmişi güncelle
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && !link.target && !link.hasAttribute('download')) {
          // Mevcut sayfayı gezinme geçmişine ekle
          const url = window.location.pathname;
          const clickedUrl = link.pathname;
          
          console.log("Tıklanan bağlantı:", clickedUrl);
          
          // Aynı sayfaya gidilmiyorsa geçmişe ekle
          if (url !== clickedUrl) {
            HistoryManager.saveCurrentPage();
          } else {
            console.log("Aynı sayfaya tıklandı, geçmişe eklenmedi");
          }
        }
      });
      
      // Tarayıcı tarihçesi değişiklikleri
      window.addEventListener('popstate', () => {
        console.log("Tarayıcı geçmişi değişti (popstate)");
        HistoryManager.saveCurrentPage();
      });
    },
    
    /**
     * Masaüstü cihazlar için geri butonu
     */
    setupBackButtonForDesktop() {
      if ('ontouchstart' in window) return;
      
      const backButton = document.createElement('div');
      backButton.id = 'zp-ios-back-button';
      backButton.setAttribute('aria-label', 'Geri dön');
      backButton.setAttribute('role', 'button');
      backButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background-color: rgba(24, 24, 28, 0.7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease, background-color 0.2s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      `;
      
      backButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      `;
      
      backButton.addEventListener('mouseenter', () => {
        backButton.style.backgroundColor = 'rgba(40, 40, 48, 0.85)';
      });
      
      backButton.addEventListener('mouseleave', () => {
        backButton.style.backgroundColor = 'rgba(24, 24, 28, 0.7)';
      });
      
      backButton.addEventListener('click', () => {
        backButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
          backButton.style.transform = 'scale(1)';
          HistoryManager.navigateBack();
        }, 140);
      });
      
      document.body.appendChild(backButton);
    }
  };

  // Web sayfası yüklendiğinde sistemi başlat
  document.addEventListener('DOMContentLoaded', () => {
    SwipeNavigation.initialize();
  });
})();