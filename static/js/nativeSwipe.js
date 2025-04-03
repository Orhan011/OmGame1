/**
 * iOS Native Edge Swipe Navigation (UIScreenEdgePanGestureRecognizer)
 * Gerçek iOS cihazlarında kullanılan sistemin web uygulaması
 * 
 * Geliştirici: ZekaPark Web Çözümleri
 * Sürüm: 3.0 (iOS 16+ implementasyonu)
 */

(() => {
  'use strict';
  
  // iOS Swift implementasyonuna benzer biçimde yapılandırma değerlerini tanımla
  const SwipeConfig = {
    EDGE_REGION_WIDTH: 20,                        // Ekranın kenarından başlama bölgesi (piksel)
    VELOCITY_THRESHOLD: 0.3,                      // Hız eşiği (px/ms): iOS'taki 300 points/second
    CRITICAL_THRESHOLD: 0.39,                     // Kritik mesafe eşiği (ekran genişliğinin yüzdesi)
    ANIMATION_DURATION: 15,                       // Navigasyon animasyonu süresi (ms): iOS'taki 0.25s'den daha kısa
    SPRING_ANIMATION_MASS: 0.6,                   // Fizik tabanlı yay kütlesi
    SPRING_ANIMATION_STIFFNESS: 350,              // Yay sertliği
    SPRING_ANIMATION_DAMPING: 15,                 // Sönümleme değeri
    HISTORY_KEY: 'zeka_park_navigation_history',  // LocalStorage anahtarı
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.15)',          // Gölge rengi: iOS'taki standart gölge
    Z_INDEX: 10000                                // z-indeks değeri
  };

  // DOM element referansları
  const NativeDOM = {
    container: null,
    currentView: null,
    previousView: null,
    screenDimmer: null
  };

  // Durum yönetimi - Swift implementasyonuna benzer şekilde
  const SwipeState = {
    navigationHistory: [],
    isGestureActive: false,
    isAnimating: false,
    isPanning: false,
    touchStartX: 0,
    touchStartY: 0,
    currentX: 0,
    lastPosition: 0,
    panVelocity: 0,
    velocityRecords: [],
    velocityTimestamp: 0,
    domReady: false,
    startTimestamp: 0
  };

  // Native iOS animasyon kontrolcüsü
  const CADisplayLink = {
    requestId: null,
    lastTimestamp: 0,
    
    // Animasyon döngüsünü başlat (iOS'taki CADisplayLink gibi)
    start(callback) {
      const animate = (timestamp) => {
        // İlk çalıştırmada zaman farkını hesaplama
        if (this.lastTimestamp === 0) {
          this.lastTimestamp = timestamp;
          this.requestId = requestAnimationFrame(animate);
          return;
        }
        
        // Performans için zaman farkını hesapla
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Callback fonksiyonunu çağır
        callback(deltaTime);
        
        // Sonraki kareyi iste
        this.requestId = requestAnimationFrame(animate);
      };
      
      this.requestId = requestAnimationFrame(animate);
    },
    
    // Animasyon döngüsünü durdur
    stop() {
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        this.lastTimestamp = 0;
      }
    }
  };

  // Gezinme geçmişi yönetimi (UINavigationController benzeri)
  const NavigationController = {
    // Geçmişi yükle
    loadNavigationStack() {
      try {
        const history = localStorage.getItem(SwipeConfig.HISTORY_KEY);
        if (history) {
          SwipeState.navigationHistory = JSON.parse(history);
        }
      } catch (e) {
        console.warn("Navigasyon geçmişi yüklenemedi:", e);
        SwipeState.navigationHistory = [];
      }
      
      // Geçmiş boşsa mevcut URL'yi ekle
      if (SwipeState.navigationHistory.length === 0) {
        this.pushViewToHistory(window.location.pathname);
      }
    },
    
    // Yeni sayfayı geçmişe ekle
    pushViewToHistory(url) {
      // Zaten aynı URL varsa ekleme
      if (SwipeState.navigationHistory.length > 0 && 
          SwipeState.navigationHistory[SwipeState.navigationHistory.length - 1] === url) {
        return;
      }
      
      // Maksimum 30 sayfa tut
      if (SwipeState.navigationHistory.length >= 30) {
        SwipeState.navigationHistory.shift();
      }
      
      // Yeni URL'i ekle
      SwipeState.navigationHistory.push(url);
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem(SwipeConfig.HISTORY_KEY, JSON.stringify(SwipeState.navigationHistory));
      } catch (e) {
        console.warn("Gezinme geçmişi kaydedilemedi:", e);
      }
    },
    
    // Önceki sayfaya git
    popToLastView() {
      if (SwipeState.navigationHistory.length > 1) {
        // Mevcut sayfayı çıkar
        SwipeState.navigationHistory.pop();
        
        // Önceki sayfa
        const previousView = SwipeState.navigationHistory[SwipeState.navigationHistory.length - 1];
        
        // Geçmişi güncelle
        try {
          localStorage.setItem(SwipeConfig.HISTORY_KEY, JSON.stringify(SwipeState.navigationHistory));
        } catch (e) {
          console.warn("Gezinme geçmişi güncellenemedi:", e);
        }
        
        // Sayfaya git - replace kullanarak daha hızlı yükleme sağla
        const isFullUrl = previousView.startsWith('http');
        const targetUrl = isFullUrl ? previousView : 
                         (previousView.startsWith('/') ? 
                          previousView : `/${previousView}`);
        
        window.location.replace(isFullUrl ? targetUrl : window.location.origin + targetUrl);
        return true;
      } else {
        // Geçmiş yoksa tarayıcı geçmişini kullan
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

  // DOM ve UI yönetimi (UIView benzeri)
  const UIViewController = {
    // DOM elementlerini oluştur
    setupViews() {
      if (SwipeState.domReady) return;
      
      // Bellek optimizasyonu için DocumentFragment kullan
      const fragment = document.createDocumentFragment();
      
      // Ana kapsayıcı
      NativeDOM.container = document.createElement('div');
      NativeDOM.container.id = 'ios-native-swipe-container';
      NativeDOM.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: ${SwipeConfig.Z_INDEX};
        visibility: hidden;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        perspective: 1200px;
        -webkit-perspective: 1200px;
      `;
      
      // Mevcut görünüm (snapshot)
      NativeDOM.currentView = document.createElement('div');
      NativeDOM.currentView.id = 'ios-current-view';
      NativeDOM.currentView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color, white);
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
        transition: transform ${SwipeConfig.ANIMATION_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1);
        box-shadow: 0 0 10px ${SwipeConfig.SHADOW_COLOR};
        will-change: transform;
        overflow: hidden;
        z-index: ${SwipeConfig.Z_INDEX + 1};
        visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Önceki görünüm
      NativeDOM.previousView = document.createElement('div');
      NativeDOM.previousView.id = 'ios-previous-view';
      NativeDOM.previousView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color, white);
        transform: translate3d(-30px, 0, 0) scale(0.95);
        -webkit-transform: translate3d(-30px, 0, 0) scale(0.95);
        transition: transform ${SwipeConfig.ANIMATION_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1);
        will-change: transform;
        z-index: ${SwipeConfig.Z_INDEX - 1};
        visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      `;
      
      // Ekran karartıcı
      NativeDOM.screenDimmer = document.createElement('div');
      NativeDOM.screenDimmer.id = 'ios-screen-dimmer';
      NativeDOM.screenDimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        transition: background-color ${SwipeConfig.ANIMATION_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1);
        z-index: ${SwipeConfig.Z_INDEX - 2};
      `;
      
      // Elementleri ekle
      NativeDOM.container.appendChild(NativeDOM.previousView);
      NativeDOM.container.appendChild(NativeDOM.screenDimmer);
      NativeDOM.container.appendChild(NativeDOM.currentView);
      fragment.appendChild(NativeDOM.container);
      
      // Tek seferde DOM'a ekle
      document.body.appendChild(fragment);
      
      SwipeState.domReady = true;
    },
    
    // Kaydırma işlemi için hazırlık
    prepareForGesture() {
      if (!SwipeState.domReady) {
        this.setupViews();
      }

      // Arka plan rengini al
      const bgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
      
      // Görünürlük ayarla
      NativeDOM.container.style.visibility = 'visible';
      NativeDOM.currentView.style.visibility = 'visible';
      NativeDOM.previousView.style.visibility = 'visible';
      
      // View'ları hazırla
      NativeDOM.currentView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
        transition: none;
        box-shadow: 0 0 10px ${SwipeConfig.SHADOW_COLOR};
        will-change: transform;
        overflow: hidden;
        z-index: ${SwipeConfig.Z_INDEX + 1};
        visibility: visible;
      `;
      
      NativeDOM.previousView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        transform: translate3d(-30px, 0, 0) scale(0.95);
        -webkit-transform: translate3d(-30px, 0, 0) scale(0.95);
        transition: none;
        will-change: transform;
        z-index: ${SwipeConfig.Z_INDEX - 1};
        visibility: visible;
      `;
      
      NativeDOM.screenDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Içerikleri oluştur
      NativeDOM.currentView.innerHTML = '';
      NativeDOM.previousView.innerHTML = '';
      
      // Basit arkaplan içerikler (renk buzulmasını engellemek için snapshot almadan)
      const currentViewContent = document.createElement('div');
      currentViewContent.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
      `;
      
      const previousViewContent = document.createElement('div');
      previousViewContent.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
      `;
      
      NativeDOM.currentView.appendChild(currentViewContent);
      NativeDOM.previousView.appendChild(previousViewContent);
    },
    
    // Kaydırma sırasında görünümü güncelle
    updateGestureTransition(progress) {
      if (!SwipeState.domReady || !SwipeState.isGestureActive) return;
      
      // iOS springy-tracking davranışı için kübik eğri
      const cubic = this.springCurve(progress);
      
      // View pozisyonlarını güncelle
      const screenWidth = window.innerWidth;
      
      // Mevcut görünümü kaydır
      NativeDOM.currentView.style.transform = `translate3d(${progress * screenWidth}px, 0, 0)`;
      NativeDOM.currentView.style.webkitTransform = `translate3d(${progress * screenWidth}px, 0, 0)`;
      
      // Önceki görünümü güncelle - iOS'taki kademeli hareket
      const previousViewOffset = -30 + (30 * cubic);
      const previousViewScale = 0.95 + (0.05 * cubic);
      
      NativeDOM.previousView.style.transform = `translate3d(${previousViewOffset}px, 0, 0) scale(${previousViewScale})`;
      NativeDOM.previousView.style.webkitTransform = `translate3d(${previousViewOffset}px, 0, 0) scale(${previousViewScale})`;
      
      // Karartma efekti
      const dimmerOpacity = Math.min(0.2, cubic * 0.3);
      NativeDOM.screenDimmer.style.backgroundColor = `rgba(0, 0, 0, ${dimmerOpacity})`;
    },
    
    // Kaydırma işlemini tamamla
    completeGestureTransition() {
      // iOS'taki animasyon eğrisini kullan
      const cubicBezier = 'cubic-bezier(0.32, 0.72, 0, 1)';
      
      // Mevcut görünümü dışarı kaydır
      NativeDOM.currentView.style.transition = `transform ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.currentView.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
      NativeDOM.currentView.style.webkitTransform = `translate3d(${window.innerWidth}px, 0, 0)`;
      
      // Önceki görünümü tam pozisyona getir
      NativeDOM.previousView.style.transition = `transform ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.previousView.style.transform = `translate3d(0, 0, 0) scale(1)`;
      NativeDOM.previousView.style.webkitTransform = `translate3d(0, 0, 0) scale(1)`;
      
      // Karartma efektini kaldır
      NativeDOM.screenDimmer.style.transition = `background-color ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.screenDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Animasyon süresi kadar bekleyip sayfaya git
      return new Promise(resolve => setTimeout(resolve, SwipeConfig.ANIMATION_DURATION));
    },
    
    // Kaydırma işlemini iptal et
    cancelGestureTransition() {
      // iOS'taki iptal animasyon eğrisini kullan
      const cubicBezier = 'cubic-bezier(0.32, 0.72, 0, 1)';
      
      // Mevcut görünümü başlangıç konumuna getir
      NativeDOM.currentView.style.transition = `transform ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.currentView.style.transform = 'translate3d(0, 0, 0)';
      NativeDOM.currentView.style.webkitTransform = 'translate3d(0, 0, 0)';
      
      // Önceki görünümü başlangıç konumuna getir
      NativeDOM.previousView.style.transition = `transform ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.previousView.style.transform = 'translate3d(-30px, 0, 0) scale(0.95)';
      NativeDOM.previousView.style.webkitTransform = 'translate3d(-30px, 0, 0) scale(0.95)';
      
      // Karartma efektini kaldır
      NativeDOM.screenDimmer.style.transition = `background-color ${SwipeConfig.ANIMATION_DURATION}ms ${cubicBezier}`;
      NativeDOM.screenDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Bekletme süresi sonunda görünürlüğü kapat
      return new Promise(resolve => {
        setTimeout(() => {
          NativeDOM.container.style.visibility = 'hidden';
          NativeDOM.currentView.style.visibility = 'hidden';
          NativeDOM.previousView.style.visibility = 'hidden';
          
          // Boş içerik
          NativeDOM.currentView.innerHTML = '';
          NativeDOM.previousView.innerHTML = '';
          
          resolve();
        }, SwipeConfig.ANIMATION_DURATION);
      });
    },
    
    // iOS yay efekti benzeri yumuşatma fonksiyonu
    springCurve(progress) {
      // iOS'taki spring davranışını simüle eden fonksiyon
      return 0.5 - Math.cos(progress * Math.PI) / 2;
    }
  };

  // Hareket/fizik gereksinimleri (UIPanGestureRecognizer benzeri)
  const PanGestureRecognizer = {
    // Hız hesaplama
    recordVelocity(position) {
      const now = Date.now();
      const elapsed = now - SwipeState.velocityTimestamp;
      
      if (elapsed > 0) {
        // Anlık hız (px/ms)
        const velocity = (position - SwipeState.lastPosition) / elapsed;
        
        // Son 5 hız ölçümünü sakla
        SwipeState.velocityRecords.push(velocity);
        if (SwipeState.velocityRecords.length > 5) {
          SwipeState.velocityRecords.shift();
        }
        
        SwipeState.lastPosition = position;
        SwipeState.velocityTimestamp = now;
      }
    },
    
    // Ağırlıklı ortalama hız hesapla (iOS'taki hız hesaplamasına benzer)
    getAverageVelocity() {
      if (SwipeState.velocityRecords.length === 0) return 0;
      
      // Son hızlara daha fazla ağırlık ver
      let totalWeight = 0;
      let weightedVelocity = 0;
      
      for (let i = 0; i < SwipeState.velocityRecords.length; i++) {
        // Yeni ölçümlere daha yüksek ağırlık ver
        const weight = i + 1;
        weightedVelocity += SwipeState.velocityRecords[i] * weight;
        totalWeight += weight;
      }
      
      return weightedVelocity / totalWeight;
    },
    
    // Kaydırma sonrası ne olacağını belirle
    decideNextAction() {
      // Kaydırma süresi
      const gestureTime = Date.now() - SwipeState.startTimestamp;
      
      // Kaydırma mesafesi
      const distance = SwipeState.currentX - SwipeState.touchStartX;
      
      // Ekran genişliğine oranı hesapla
      const screenWidth = window.innerWidth;
      const progressRatio = distance / screenWidth;
      
      // Ortalama hız
      const velocity = this.getAverageVelocity();
      
      // Hız veya mesafe kritik eşikleri geçerse, hareketi tamamla
      if (
        velocity > SwipeConfig.VELOCITY_THRESHOLD || 
        progressRatio > SwipeConfig.CRITICAL_THRESHOLD
      ) {
        return {
          action: 'complete',
          velocity: velocity
        };
      } else {
        return {
          action: 'cancel',
          velocity: velocity
        };
      }
    }
  };

  // Ana Kontrolcü
  const NativeGestureController = {
    // Başlangıç
    initialize() {
      // Görünümleri oluştur
      UIViewController.setupViews();
      
      // Navigasyon geçmişini yükle
      NavigationController.loadNavigationStack();
      
      // Mevcut sayfayı kaydet
      NavigationController.pushViewToHistory(window.location.pathname);
      
      // Dokunma olaylarını dinle
      this.setupGestureRecognizers();
    },
    
    // Olay dinleyicilerini ekle
    setupGestureRecognizers() {
      // Dokunma başlangıcı
      document.addEventListener('touchstart', (e) => {
        // Sadece sol kenardan başlayan kaydırmalar için
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        if (touchX <= SwipeConfig.EDGE_REGION_WIDTH && !SwipeState.isAnimating) {
          // Durum bilgilerini sıfırla ve başlat
          SwipeState.touchStartX = touchX;
          SwipeState.touchStartY = touchY;
          SwipeState.currentX = touchX;
          SwipeState.lastPosition = touchX;
          SwipeState.startTimestamp = Date.now();
          SwipeState.velocityRecords = [];
          SwipeState.velocityTimestamp = Date.now();
          SwipeState.isGestureActive = true;
          
          // Görünümleri hazırla
          UIViewController.prepareForGesture();
        }
      }, { passive: false });
      
      // Dokunma hareketi
      document.addEventListener('touchmove', (e) => {
        if (SwipeState.isGestureActive && !SwipeState.isAnimating) {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          
          // İlk hareketi yatay/dikey olarak değerlendir
          if (!SwipeState.isPanning) {
            const deltaX = touchX - SwipeState.touchStartX;
            const deltaY = touchY - SwipeState.touchStartY;
            
            // Dikey kaydırma tespiti - UIKit'tekine benzer
            if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
              // Dikey kaydırma için jesti iptal et
              SwipeState.isGestureActive = false;
              UIViewController.cancelGestureTransition();
              return;
            }
            
            // Yatay kaydırma onaylandı
            SwipeState.isPanning = true;
          }
          
          // Minimum X değeri 0, maksimum ekran genişliği
          const limitedX = Math.max(0, Math.min(touchX, window.innerWidth));
          SwipeState.currentX = limitedX;
          
          // Hız hesapla
          PanGestureRecognizer.recordVelocity(SwipeState.currentX);
          
          // İlerleme oranını hesapla (0-1 arası)
          const progress = Math.max(0, (SwipeState.currentX - SwipeState.touchStartX) / window.innerWidth);
          
          // Arayüzü güncelle
          UIViewController.updateGestureTransition(progress);
          
          // Kaydırmayı durdur
          e.preventDefault();
        }
      }, { passive: false });
      
      // Dokunma sonu
      document.addEventListener('touchend', async (e) => {
        if (SwipeState.isGestureActive && !SwipeState.isAnimating) {
          SwipeState.isAnimating = true;
          
          // Sonraki eylemi belirle
          const { action } = PanGestureRecognizer.decideNextAction();
          
          if (action === 'complete') {
            // Animasyonu tamamla
            await UIViewController.completeGestureTransition();
            
            // Önceki sayfaya git
            NavigationController.popToLastView();
          } else {
            // Kaydırmayı iptal et
            await UIViewController.cancelGestureTransition();
            
            // Durumu sıfırla
            SwipeState.isGestureActive = false;
            SwipeState.isPanning = false;
            SwipeState.isAnimating = false;
          }
        }
      }, { passive: false });
      
      // Dokunma iptali
      document.addEventListener('touchcancel', async () => {
        if (SwipeState.isGestureActive) {
          // Kaydırmayı iptal et
          await UIViewController.cancelGestureTransition();
          
          // Durumu sıfırla
          SwipeState.isGestureActive = false;
          SwipeState.isPanning = false;
          SwipeState.isAnimating = false;
        }
      }, { passive: false });
      
      // Sayfa içi bağlantı tıklamaları için olay
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        if (link && !link.target && link.href) {
          const url = new URL(link.href);
          
          // Aynı site içi tıklamalar için
          if (url.origin === window.location.origin) {
            // Mevcut sayfayı geçmişe ekle
            NavigationController.pushViewToHistory(window.location.pathname);
          }
        }
      });
    }
  };
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', () => {
    console.log("Native iOS Swipe sistemi başlatılıyor...");
    NativeGestureController.initialize();
    console.log("Native iOS Swipe sistemi aktif.");
  });
  
  // DOMContentLoaded olayını kaçırdıysa
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log("Native iOS Swipe sistemi başlatılıyor...");
    NativeGestureController.initialize();
    console.log("Native iOS Swipe sistemi aktif.");
  }
})();
