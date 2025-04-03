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
          console.warn("Gezinme geçmişi kaydedilirken hata oluştu:", e);
        }
      }
    },

    /**
     * Önceki sayfaya navigasyon yap
     */
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
  };

  const DOMManager = {
    /**
     * DOM elemanlarını oluştur (kapsayıcı, önceki sayfa ve overlay)
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
      
      // DOM elemanları hazır
      STATE.domNodesReady = true;
    },

    /**
     * Kaydırma animasyonu için sayfayı hazırla
     */
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
    updateSwipeAnimation(progress) {
      if (!STATE.domNodesReady || !STATE.isSwipeActive) return;
      
      // Daha hızlı, daha akıcı bir ease fonksiyonu kullan
      const easedProgress = Math.min(1, progress * 1.05);
      
      // Daha optimize edilmiş transform (3 boyutlu ve GPU hızlandırmalı)
      // translateZ(0) ekleyerek GPU'yu zorunlu kullanıma al
      DOM.pageClone.style.transform = `translate3d(${progress * window.innerWidth}px, 0, 0) translateZ(0)`;
      
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
    
    // Cubic ease-out fonksiyonu - daha doğal hareket eğrisi
    easeOutCubic(x) {
      return 1 - Math.pow(1 - x, 3);
    },
    
    /**
     * Kaydırma animasyonunu tamamla (önceki sayfaya git)
     */
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
  };

  // iOS benzeri kaydırma fiziği için gelişmiş hesaplamaları yöneten bileşen
  const PhysicsManager = {
    // Hızı yakalama ve analiz etme
    recordVelocity(currentX) {
      const now = Date.now();
      const elapsed = now - STATE.lastVelocityRecord;
      
      if (elapsed > 0) {
        // Anlık hızı hesapla (piksel/ms)
        const instantVelocity = (currentX - STATE.lastX) / elapsed;
        
        // Son 5 hız değerini tut
        STATE.velocities.push(instantVelocity);
        if (STATE.velocities.length > 5) {
          STATE.velocities.shift();
        }
        
        STATE.lastX = currentX;
        STATE.lastVelocityRecord = now;
      }
    },

    // Son ölçülen ortalama hızı hesapla
    getAverageVelocity() {
      if (STATE.velocities.length === 0) return 0;
      
      // Hızların ağırlıklı ortalamasını hesapla (en son ölçümlere daha fazla ağırlık ver)
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (let i = 0; i < STATE.velocities.length; i++) {
        const weight = i + 1;  // Daha yeni ölçümler daha yüksek ağırlığa sahip
        weightedSum += STATE.velocities[i] * weight;
        totalWeight += weight;
      }
      
      return weightedSum / totalWeight;
    },

    // Kaydırma hareketi tamamlandığında sonraki eylemi belirle
    determineAction() {
      // Kaydırma/hareket süresi
      const swipeDuration = Date.now() - STATE.startTime;
      
      // Kaydırma mesafesi ve yönü
      const swipeDistance = STATE.currentX - STATE.touchStartX;
      
      // Ortalama hız (px/ms)
      const averageVelocity = this.getAverageVelocity();
      
      console.log(`Kaydırma mesafesi: ${swipeDistance}px, Süre: ${swipeDuration}ms, Hız: ${averageVelocity.toFixed(3)}px/ms`);
      
      const screenWidth = window.innerWidth;
      const progress = Math.max(0, swipeDistance / screenWidth);
      
      // Hız veya mesafe kritik eşiği geçerse kaydırmayı tamamla
      if (
        (averageVelocity > CONFIG.CRITICAL_VELOCITY) || 
        (progress > 0.39) // Yaklaşık 1/3 kaydırma eşiği
      ) {
        return {
          action: 'complete',
          velocity: averageVelocity
        };
      } else {
        return {
          action: 'cancel',
          velocity: averageVelocity
        };
      }
    }
  };

  /**
   * Ana Kontrol Bileşeni
   * Dokunma olayları, gezinme ve animasyon kontrolü
   */
  const EdgeSwipeController = {
    init() {
      console.log("iOS kenar kaydırma navigasyonu başlatılıyor...");
      
      // DOM elemanlarını ve geçmişi yükle
      DOMManager.createElements();
      HistoryManager.loadHistory();
      
      // Mevcut sayfayı kaydet
      HistoryManager.saveCurrentPage();
      
      // Dokunma olaylarını dinlemeye başla
      this.setupEventListeners();
      
      // Debug butonu ekle (opsiyonel)
      this.addDebugButton();
      
      console.log("iOS kenar kaydırma navigasyonu aktif");
    },

    setupEventListeners() {
      // Touchstart olayı
      document.addEventListener('touchstart', (e) => {
        // Yalnızca sol kenardan yapılan kaydırmalar için
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        if (touchX <= CONFIG.EDGE_THRESHOLD && !STATE.isAnimating) {
          STATE.touchStartX = touchX;
          STATE.touchStartY = touchY;
          STATE.currentX = touchX;
          STATE.lastX = touchX;
          STATE.startTime = Date.now();
          STATE.velocities = [];
          
          // Durum bilgilerini sıfırla
          STATE.isSwipeActive = true;
          
          // Kaydırma için sayfayı hazırla
          DOMManager.prepareForSwipe();
        }
      }, { passive: false });

      // Touchmove olayı
      document.addEventListener('touchmove', (e) => {
        if (STATE.isSwipeActive && !STATE.isAnimating) {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          
          // Yatay/dikey hareketi ölç ve açıyı belirle
          const deltaX = touchX - STATE.touchStartX;
          const deltaY = touchY - STATE.touchStartY;
          
          // Mesafe > 20px ve açı > 45 derece ise, dikey kaydırma olarak kabul et
          if (
            Math.abs(deltaY) > 20 && 
            Math.abs(deltaY) > Math.abs(deltaX) * 1.3
          ) {
            // Dikey kaydırmaya izin ver, yatay kaydırmayı iptal et
            STATE.isSwipeActive = false;
            DOMManager.resetSwipeAnimation();
            return;
          }
          
          // Sayfanın sağa doğru fazla çekilmesini engelle
          const restrictedX = Math.min(touchX, window.innerWidth * 0.95);
          
          STATE.currentX = restrictedX;
          
          // Yeni konum için hız hesapla
          PhysicsManager.recordVelocity(STATE.currentX);
          
          // İlerlemeyi hesapla (0-1 arası)
          const progress = Math.max(0, (STATE.currentX - STATE.touchStartX) / window.innerWidth);
          
          // DOM animasyonunu güncelle
          DOMManager.updateSwipeAnimation(progress);
          
          // Varsayılan davranışı engelle (önemli, sayfanın kaymasını durdurur)
          e.preventDefault();
        }
      }, { passive: false });

      // Touchend olayı
      document.addEventListener('touchend', async (e) => {
        if (STATE.isSwipeActive && !STATE.isAnimating) {
          STATE.isAnimating = true;
          
          // Sonraki adımı belirle
          const { action, velocity } = PhysicsManager.determineAction();
          
          // Hıza göre animasyon süresini belirle
          const averageVelocity = Math.abs(velocity);
          const speedBasedDuration = averageVelocity > CONFIG.CRITICAL_VELOCITY 
            ? CONFIG.ANIMATION_DURATION_MIN 
            : CONFIG.ANIMATION_DURATION_MAX - (Math.abs(averageVelocity) * 500);
            
          // Animasyonu tamamla
          await DOMManager.completeSwipeAnimation(speedBasedDuration);
          
          if (action === 'complete') {
            // Önceki sayfaya git
            HistoryManager.navigateBack();
          } else {
            // Kaydırmayı iptal et ve geri dön
            await DOMManager.resetSwipeAnimation();
            
            // Kaydırmayı deaktive et
            STATE.isSwipeActive = false;
            STATE.isAnimating = false;
          }
        }
      }, { passive: false });

      // Touchcancel olayı
      document.addEventListener('touchcancel', async () => {
        if (STATE.isSwipeActive) {
          await DOMManager.resetSwipeAnimation();
          
          STATE.isSwipeActive = false;
          STATE.isAnimating = false;
        }
      }, { passive: false });
      
      // Hızlı navigasyon bağlantıları için click olayı
      document.addEventListener('click', (e) => {
        // A etiketlerini kontrol et
        const link = e.target.closest('a');
        if (link && !link.target && link.href) {
          // Sayfa içi tıklamalarda geçmişi takip et
          const url = new URL(link.href);
          
          // Aynı origin'deki bağlantılar için
          if (url.origin === window.location.origin) {
            e.preventDefault(); // Varsayılan tıklama davranışını engelle
            
            // Mevcut sayfayı önce geçmişe ekle
            HistoryManager.saveCurrentPage();
            
            // Tıklanan sayfaya git
            window.location.href = link.href;
          }
        }
      });
    },
    
    // Debug butonu ekleme (opsiyonel, geliştirici modu için)
    addDebugButton() {
      if (document.getElementById('debug-back-button')) return;
      
      const debugButton = document.createElement('button');
      debugButton.id = 'debug-back-button';
      debugButton.innerText = 'Geri';
      debugButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10000;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        font-size: 16px;
      `;
      
      debugButton.addEventListener('click', () => {
        HistoryManager.navigateBack();
      });
      
      document.body.appendChild(debugButton);
    }
  };

  // İnit sadece bir kez çalışsın, çoklu yüklemeleri önle
  let isInitialized = false;
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', () => {
    if (!isInitialized) {
      EdgeSwipeController.init();
      isInitialized = true;
    }
  });
  
  // İlk yükleme kaçırıldıysa, şimdi hemen yükle
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    if (!isInitialized) {
      EdgeSwipeController.init();
      isInitialized = true;
    }
  }
})();
