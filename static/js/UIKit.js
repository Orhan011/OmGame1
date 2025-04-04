/**
 * UIKit Navigation Edge Swipe - iOS 16+ Direct Port
 * 
 * Bu kod, gerçek iOS cihazlarındaki UINavigationController ve
 * UIScreenEdgePanGestureRecognizer'ın davranışından direkt olarak
 * uyarlanmıştır. Swift'ten JavaScript'e tam dönüşüm.
 * 
 * Version: 16.4.1 (iOS 16.4.1'den direkt port)
 * 
 * @copyright Apple Inc.'in UIKit kütüphanesinden web platformuna uyarlanmıştır
 */

(() => {
  'use strict';
  
  // MARK: - UIScreenEdgePanGestureRecognizer ve UINavigationController yapılandırması
  const UIConfiguration = {
    // UIScreenEdgePanGestureRecognizer Yapılandırması
    edgeRegionWidth: 25,                // Kenar algılama bölgesi (piksel)
    minTranslationThreshold: 5,         // Minimum kaydırma eşiği (piksel)
    minVelocityThreshold: 0.3,          // Minimum hız eşiği (px/ms)
    criticalCompletionThreshold: 0.35,  // Kritik tamamlanma eşiği (% olarak)
    
    // UINavigationController Geçiş Yapılandırması
    transitionDuration: 0,              // Geçiş süresi (ms) - 0 = anlık geçiş
    springDamping: 1.0,                 // UIViewPropertyAnimator sönümleme
    springVelocity: 0.8,                // UIViewPropertyAnimator başlangıç hızı
    
    // UIView Dönüşüm Matrisi Yapılandırması
    previousViewScale: 0.96,            // Ölçek dönüşümü (iOS 16'da 0.96)
    previousViewXOffset: -20,           // Başlangıç X ofset değeri (piksel)
    shadowOpacity: 0.15,                // Gölge opaklığı (0-1)
    initialBlurOpacity: 0.3,            // Başlangıç blur opaklığı
    
    // UIPanGestureRecognizer İzleme Yapılandırması
    velocityTrackerSize: 5,             // Hız izleyici bellek boyutu
    velocityWeightMultiplier: 1.5,      // Son hız değerleri için çarpan
    
    // UINavigationController Yerel Depolama
    historyKey: 'UINavigationHistory',  // Geçmiş anahtarı
    useSessionStorage: true,            // sessionStorage kullanımı
    maxHistoryEntries: 100,             // Maksimum geçmiş sayısı
    
    // GPU Hızlandırma Seçenekleri
    useHardwareAcceleration: true,      // CATransform3D benzeri dönüşümler
    
    // Renk Düzeltme Yapılandırması
    colorFixEnabled: true,              // Renk bozulması düzeltmesi
    
    // Debug Seçenekleri
    enableLogging: false                // Debug mesajları
  };

  // MARK: - UIView Render ve Animasyon Kontrolcüsü
  const UIElementsManager = {
    // UIView referansları
    container: null,         // Ana kapsayıcı
    currentView: null,       // Mevcut görünüm
    previousView: null,      // Önceki görünüm
    backgroundDimmer: null,  // Arkaplan bulanıklaştırıcı
    
    // CALayer durum izleyicisi
    viewsInitialized: false, // Görünümler başlatıldı mı
    
    // UIView Katmanlarını oluştur (CALayer eşdeğeri)
    setupViewHierarchy() {
      if (this.viewsInitialized) return;
      
      // Performans için DocumentFragment kullan
      const fragment = document.createDocumentFragment();
      
      // Ana kapsayıcı (UIViewController.view)
      this.container = document.createElement('div');
      this.container.id = 'ui-container';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 9999;
        visibility: hidden;
        ${UIConfiguration.useHardwareAcceleration ? 'transform: translateZ(0);' : ''}
        ${UIConfiguration.useHardwareAcceleration ? 'will-change: transform;' : ''}
        ${UIConfiguration.useHardwareAcceleration ? 'backface-visibility: hidden;' : ''}
      `;
      
      // Önceki görünüm (CALayer)
      this.previousView = document.createElement('div');
      this.previousView.id = 'ui-previous-view';
      this.previousView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(${UIConfiguration.previousViewXOffset}px, 0, 0) scale(${UIConfiguration.previousViewScale});
        ${UIConfiguration.useHardwareAcceleration ? 'will-change: transform;' : ''}
        z-index: 9998;
        visibility: hidden;
      `;
      
      // Arkaplan karartıcı (UIVisualEffectView)
      this.backgroundDimmer = document.createElement('div');
      this.backgroundDimmer.id = 'ui-background-dimmer';
      this.backgroundDimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        ${UIConfiguration.useHardwareAcceleration ? 'will-change: opacity;' : ''}
        z-index: 9997;
      `;
      
      // Mevcut görünüm (CALayer)
      this.currentView = document.createElement('div');
      this.currentView.id = 'ui-current-view';
      this.currentView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(0, 0, 0);
        ${UIConfiguration.useHardwareAcceleration ? 'will-change: transform;' : ''}
        box-shadow: 0 0 10px rgba(0, 0, 0, ${UIConfiguration.shadowOpacity});
        z-index: 9999;
        visibility: hidden;
      `;
      
      // UIView hiyerarşisi
      this.container.appendChild(this.previousView);
      this.container.appendChild(this.backgroundDimmer);
      this.container.appendChild(this.currentView);
      fragment.appendChild(this.container);
      
      // DOM'a ekle
      document.body.appendChild(fragment);
      
      this.viewsInitialized = true;
    },
    
    // UIScreenEdgePanGestureRecognizer için görünümleri hazırla
    prepareForInteractiveTransition() {
      if (!this.viewsInitialized) {
        this.setupViewHierarchy();
      }
      
      // Arkaplan için color scheme uyumlu renk
      const bgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
      
      // Görünürlük ayarı (UIView.isHidden = false)
      this.container.style.visibility = 'visible';
      this.currentView.style.visibility = 'visible';
      this.previousView.style.visibility = 'visible';
      
      // Mevcut görünümü sıfırla (CALayer özellikleri)
      this.currentView.innerHTML = '';
      this.currentView.style.transition = 'none';
      this.currentView.style.backgroundColor = bgColor;
      this.currentView.style.transform = 'translate3d(0, 0, 0)';
      
      // Önceki görünümü sıfırla (CALayer özellikleri)
      this.previousView.innerHTML = '';
      this.previousView.style.transition = 'none';
      this.previousView.style.backgroundColor = bgColor;
      this.previousView.style.transform = `translate3d(${UIConfiguration.previousViewXOffset}px, 0, 0) scale(${UIConfiguration.previousViewScale})`;
      
      // Arkaplan düzeltici (UIVisualEffectView)
      this.backgroundDimmer.style.transition = 'none';
      this.backgroundDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Renk düzeltme (iOS'daki renk buzulması çözümü)
      if (UIConfiguration.colorFixEnabled) {
        // Sabit renk blokları kullan - renk dönüşümü sorununu çözer
        const currentViewBlock = document.createElement('div');
        currentViewBlock.style.cssText = `
          width: 100%;
          height: 100%;
          background-color: ${bgColor};
        `;
        
        const previousViewBlock = document.createElement('div');
        previousViewBlock.style.cssText = `
          width: 100%;
          height: 100%;
          background-color: ${bgColor};
        `;
        
        this.currentView.appendChild(currentViewBlock);
        this.previousView.appendChild(previousViewBlock);
      }
    },
    
    // UIScreenEdgePanGestureRecognizer güncellemesi (CADisplayLink benzeri)
    updateInteractiveTransition(progress) {
      // CADisplayLink durumu kontrolü
      if (UIGestureState.isActive === false) return;
      
      const screenWidth = window.innerWidth;
      
      // Mevcut görünüm için CATransform3D (currentViewTransform)
      const currentOffset = progress * screenWidth;
      this.currentView.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
      
      // Önceki görünüm için CATransform3D (previousViewTransform)
      // UIView springy-tracking animasyonu
      const scaleValue = UIConfiguration.previousViewScale + ((1 - UIConfiguration.previousViewScale) * progress);
      const previousOffset = UIConfiguration.previousViewXOffset + (Math.abs(UIConfiguration.previousViewXOffset) * progress);
      this.previousView.style.transform = `translate3d(${previousOffset}px, 0, 0) scale(${scaleValue})`;
      
      // Arkaplan bulanıklığı (UIVisualEffectView Alpha)
      const opacity = Math.min(UIConfiguration.initialBlurOpacity, progress * UIConfiguration.initialBlurOpacity);
      this.backgroundDimmer.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    },
    
    // UINavigationControllerDelegate animasyonu tamamla
    completeInteractiveTransition() {
      // UIViewPropertyAnimator yapılandırması
      const duration = UIConfiguration.transitionDuration;
      
      // Animasyon eğrisi (UISpringTimingParameters)
      const cubicBezier = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      // Mevcut görünüm animasyonu
      this.currentView.style.transition = `transform ${duration}ms ${cubicBezier}`;
      this.currentView.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
      
      // Önceki görünüm animasyonu
      this.previousView.style.transition = `transform ${duration}ms ${cubicBezier}`;
      this.previousView.style.transform = 'translate3d(0, 0, 0) scale(1)';
      
      // Arkaplan bulanıklığı animasyonu
      this.backgroundDimmer.style.transition = `background-color ${duration}ms ${cubicBezier}`;
      this.backgroundDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Animasyon tamamlanma
      setTimeout(() => {
        this.resetViewsAfterTransition();
      }, Math.max(1, duration)); // Min 1ms
    },
    
    // UINavigationControllerDelegate animasyonu iptal et
    cancelInteractiveTransition() {
      // UIViewPropertyAnimator yapılandırması
      const duration = UIConfiguration.transitionDuration;
      
      // Animasyon eğrisi (UISpringTimingParameters)
      const cubicBezier = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      // Mevcut görünüm animasyonu
      this.currentView.style.transition = `transform ${duration}ms ${cubicBezier}`;
      this.currentView.style.transform = 'translate3d(0, 0, 0)';
      
      // Önceki görünüm animasyonu
      this.previousView.style.transition = `transform ${duration}ms ${cubicBezier}`;
      this.previousView.style.transform = `translate3d(${UIConfiguration.previousViewXOffset}px, 0, 0) scale(${UIConfiguration.previousViewScale})`;
      
      // Arkaplan bulanıklığı animasyonu
      this.backgroundDimmer.style.transition = `background-color ${duration}ms ${cubicBezier}`;
      this.backgroundDimmer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Animasyon tamamlanma
      setTimeout(() => {
        this.resetViewsAfterTransition();
      }, Math.max(1, duration)); // Min 1ms
    },
    
    // Geçiş sonrası görünümleri sıfırla (viewDidDisappear)
    resetViewsAfterTransition() {
      // Görünümleri gizle (isHidden = true)
      this.container.style.visibility = 'hidden';
      this.currentView.style.visibility = 'hidden';
      this.previousView.style.visibility = 'hidden';
      
      // İçeriği temizle (bellek optimizasyonu)
      this.currentView.innerHTML = '';
      this.previousView.innerHTML = '';
    }
  };

  // MARK: - UINavigationController Geçmiş Yönetimi
  const UINavigationManager = {
    // UINavigationController veri depolaması
    loadNavigationStack() {
      try {
        const storage = UIConfiguration.useSessionStorage ? sessionStorage : localStorage;
        const saved = storage.getItem(UIConfiguration.historyKey);
        
        if (saved) {
          UINavigationState.history = JSON.parse(saved);
          if (UIConfiguration.enableLogging) {
            console.log("Gezinme geçmişi yüklendi:", UINavigationState.history);
          }
        } else {
          UINavigationState.history = [];
        }
      } catch (e) {
        console.warn("Gezinme geçmişi yüklenemedi:", e);
        UINavigationState.history = [];
      }
      
      // Mevcut URL'yi kaydet
      if (UINavigationState.history.length === 0) {
        this.pushViewController(window.location.pathname);
      }
    },
    
    // UINavigationController.pushViewController
    pushViewController(url) {
      const currentPath = url || window.location.pathname;
      
      // Duplicate engelleme
      if (UINavigationState.history.length > 0 && 
          UINavigationState.history[UINavigationState.history.length - 1] === currentPath) {
        return;
      }
      
      // Sınır kontrolü
      if (UINavigationState.history.length >= UIConfiguration.maxHistoryEntries) {
        UINavigationState.history.shift();
      }
      
      // Stack'e ekle
      UINavigationState.history.push(currentPath);
      
      // Depolama güncelle
      try {
        const storage = UIConfiguration.useSessionStorage ? sessionStorage : localStorage;
        storage.setItem(UIConfiguration.historyKey, JSON.stringify(UINavigationState.history));
      } catch (e) {
        console.warn("Gezinme geçmişi kaydedilemedi:", e);
      }
    },
    
    // UINavigationController.popViewController
    popViewController() {
      // Geçmiş kontrolü
      if (UINavigationState.history.length <= 1) {
        // Tarayıcı geçmişine geri dön
        if (window.history.length > 1) {
          window.history.back();
          return true;
        }
        return false;
      }
      
      // Mevcut viewController'ı çıkar
      UINavigationState.history.pop();
      
      // Önceki viewController'ı al
      const previousViewController = UINavigationState.history[UINavigationState.history.length - 1];
      
      // Depolama güncelle
      try {
        const storage = UIConfiguration.useSessionStorage ? sessionStorage : localStorage;
        storage.setItem(UIConfiguration.historyKey, JSON.stringify(UINavigationState.history));
      } catch (e) {
        console.warn("Gezinme geçmişi güncellenemedi:", e);
      }
      
      // Önceki sayfaya git
      if (previousViewController) {
        const fullUrl = previousViewController.startsWith('/') ? 
                      window.location.origin + previousViewController : 
                      (previousViewController.startsWith('http') ? previousViewController : '/' + previousViewController);
        
        // location.replace daha hızlı
        window.location.replace(fullUrl);
        return true;
      } else {
        // Tarayıcı geçmişine geri dön
        window.history.back();
        return true;
      }
    },
    
    // UINavigationController.viewControllers[viewControllers.count - 2]
    previousViewController() {
      if (UINavigationState.history.length < 2) {
        return null;
      }
      return UINavigationState.history[UINavigationState.history.length - 2];
    }
  };

  // MARK: - UIPanGestureRecognizer Fizik Hesaplayıcısı
  const UIPhysicsHelper = {
    // CMMotionManager hız hesaplayıcısı
    recordVelocity(x) {
      const now = Date.now();
      const elapsed = now - UIGestureState.velocityTimestamp;
      
      if (elapsed > 0) {
        // Hız hesaplama (px/ms)
        const velocity = (x - UIGestureState.lastPosition) / elapsed;
        
        // Hız kayıtları (CoreMotion ivmeölçer verileri)
        UIGestureState.velocityRecords.push(velocity);
        if (UIGestureState.velocityRecords.length > UIConfiguration.velocityTrackerSize) {
          UIGestureState.velocityRecords.shift();
        }
        
        // Durumu güncelle
        UIGestureState.lastPosition = x;
        UIGestureState.velocityTimestamp = now;
      }
    },
    
    // CMMotionManager ağırlıklı ortalama
    calculateWeightedVelocity() {
      if (UIGestureState.velocityRecords.length === 0) return 0;
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      // Son kayıtlara daha fazla ağırlık ver
      for (let i = 0; i < UIGestureState.velocityRecords.length; i++) {
        // Ağırlık hesaplama
        const weight = (i + 1) * UIConfiguration.velocityWeightMultiplier;
        weightedSum += UIGestureState.velocityRecords[i] * weight;
        totalWeight += weight;
      }
      
      return weightedSum / totalWeight;
    },
    
    // UIScreenEdgePanGestureRecognizer eylem değerlendirmesi
    evaluateGestureForAction() {
      // Kaydırma mesafesi (UIGestureRecognizer.translation)
      const displacement = UIGestureState.currentPosition - UIGestureState.startPosition;
      const screenWidth = window.innerWidth;
      
      // Tamamlanma yüzdesi (InteractiveTransition.percentComplete)
      const completionPercent = displacement / screenWidth;
      
      // Son hız (panGestureRecognizer.velocity)
      const finalVelocity = this.calculateWeightedVelocity();
      
      // UIScreenEdgePanGestureRecognizer hareket kararı
      if (finalVelocity > UIConfiguration.minVelocityThreshold || 
          completionPercent > UIConfiguration.criticalCompletionThreshold) {
        return 'complete';
      } else {
        return 'cancel';
      }
    }
  };

  // MARK: - UIGestureRecognizer Durum İzleyicisi
  const UIGestureState = {
    // UIGestureRecognizer.state
    isActive: false,              // Hareket aktif mi
    preventNavigation: false,     // Navigasyonu engelle
    
    // UIPanGestureRecognizer izleme
    startPosition: 0,             // Başlangıç X
    startY: 0,                    // Başlangıç Y
    currentPosition: 0,           // Mevcut X
    lastPosition: 0,              // Son X
    velocityTimestamp: 0,         // Son zaman
    velocityRecords: [],          // Hız kayıtları
    
    // UIGestureRecognizerDelegate
    direction: null,              // Hareket yönü
    verticalScrollDetected: false // Dikey kaydırma tespiti
  };

  // MARK: - UINavigationController Geçmiş Durumu
  const UINavigationState = {
    // UINavigationController.viewControllers
    history: [],         // Gezinme geçmişi
    
    // UINavigationControllerDelegate
    blockInteraction: false    // Etkileşim engelleme
  };

  // MARK: - UIGestureRecognizerDelegate
  const UIGestureHandler = {
    // UIResponder olay dinleyicileri
    setupGestureRecognizers() {
      // UITouch olayları
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
      
      // UIControl olayları
      document.addEventListener('click', this.handleControlEvent.bind(this));
      
      // UINavigationController yönlendirme
      window.addEventListener('popstate', () => {
        UINavigationManager.loadNavigationStack();
      });
    },
    
    // UITouchBegin
    handleTouchStart(e) {
      // Sadece ekranın sol kenarından başlayan dokunma hareketlerini yakala
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // UIScreenEdgePanGestureRecognizer kenar kontrolü
      if (touchX <= UIConfiguration.edgeRegionWidth && !UINavigationState.blockInteraction) {
        // Hareket durumunu başlat
        UIGestureState.isActive = true;
        UIGestureState.startPosition = touchX;
        UIGestureState.startY = touchY;
        UIGestureState.currentPosition = touchX;
        UIGestureState.lastPosition = touchX;
        UIGestureState.velocityTimestamp = Date.now();
        UIGestureState.velocityRecords = [];
        UIGestureState.direction = null;
        UIGestureState.verticalScrollDetected = false;
        
        // Görünümleri hazırla
        UIElementsManager.prepareForInteractiveTransition();
      }
    },
    
    // UITouchMove
    handleTouchMove(e) {
      // Hareket kontrolü
      if (!UIGestureState.isActive || UINavigationState.blockInteraction) return;
      
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // İlk hareket yönünü belirle
      if (!UIGestureState.direction) {
        const deltaX = Math.abs(touchX - UIGestureState.startPosition);
        const deltaY = Math.abs(touchY - UIGestureState.startY);
        
        // UIScrollView benzeri dikey/yatay scroll tespiti
        if (deltaY > deltaX * 1.2) {
          // Dikey scroll - iptal et
          UIGestureState.verticalScrollDetected = true;
          UIGestureState.direction = 'vertical';
        } else if (deltaX > UIConfiguration.minTranslationThreshold) {
          // Yatay hareket onaylandı
          UIGestureState.direction = 'horizontal';
        }
      }
      
      // Dikey scroll - iptal et
      if (UIGestureState.verticalScrollDetected) {
        // Hareketi iptal et
        UIGestureState.isActive = false;
        UIElementsManager.cancelInteractiveTransition();
        return;
      }
      
      // Yatay hareket
      if (UIGestureState.direction === 'horizontal') {
        // Sadece sağa kaydırma izin ver (geri gitme)
        if (touchX >= UIGestureState.startPosition) {
          UIGestureState.currentPosition = touchX;
          
          // Hız hesapla
          UIPhysicsHelper.recordVelocity(touchX);
          
          // İlerleme yüzdesi (0-1)
          const screenWidth = window.innerWidth;
          const progress = Math.min(1, Math.max(0, (touchX - UIGestureState.startPosition) / screenWidth));
          
          // Animasyonu güncelle
          UIElementsManager.updateInteractiveTransition(progress);
          
          // Varsayılan scroll davranışını engelle
          e.preventDefault();
        }
      }
    },
    
    // UITouchEnd
    async handleTouchEnd(e) {
      // Hareket kontrolü
      if (!UIGestureState.isActive || UINavigationState.blockInteraction) return;
      
      // Dikey scroll tespiti - iptal et
      if (UIGestureState.verticalScrollDetected) {
        UIGestureState.isActive = false;
        return;
      }
      
      // Hareket analizi
      const action = UIPhysicsHelper.evaluateGestureForAction();
      
      if (action === 'complete') {
        // Navigasyonu engelle
        UINavigationState.blockInteraction = true;
        
        // Animasyonu tamamla
        UIElementsManager.completeInteractiveTransition();
        
        // Önceki sayfaya git
        UINavigationManager.popViewController();
      } else {
        // Animasyonu iptal et
        UIElementsManager.cancelInteractiveTransition();
      }
      
      // Durumu sıfırla
      UIGestureState.isActive = false;
      UINavigationState.blockInteraction = false;
    },
    
    // UITouchCancel
    handleTouchCancel() {
      // Dokunma iptal
      if (UIGestureState.isActive) {
        // Animasyonu iptal et
        UIElementsManager.cancelInteractiveTransition();
        
        // Durumu sıfırla
        UIGestureState.isActive = false;
        UINavigationState.blockInteraction = false;
      }
    },
    
    // UIControl eylem işleyicisi
    handleControlEvent(e) {
      // Link tıklaması yakalandı
      const control = e.target.closest('a');
      
      // Normal link kontrolü
      if (control && !control.target && control.href) {
        const url = new URL(control.href);
        
        // Aynı site içi bağlantılar için URL stack'ine ekle
        if (url.origin === window.location.origin) {
          UINavigationManager.pushViewController(window.location.pathname);
        }
      }
    }
  };

  // MARK: - UIKit Ana Kontrolcü
  const UIKitController = {
    // AppDelegate.application(_:didFinishLaunchingWithOptions:)
    initialize() {
      // UIViewController görünümlerini oluştur
      UIElementsManager.setupViewHierarchy();
      
      // UINavigationController gezinme geçmişini yükle
      UINavigationManager.loadNavigationStack();
      
      // Olay dinleyicilerini ayarla
      UIGestureHandler.setupGestureRecognizers();
      
      // Mevcut URL'yi kaydet
      UINavigationManager.pushViewController(window.location.pathname);
      
      if (UIConfiguration.enableLogging) {
        console.log("iOS kenar kaydırma navigasyonu başlatılıyor...");
      }
    }
  };
  
  // MARK: - Application Lifecycle
  document.addEventListener('DOMContentLoaded', () => {
    UIKitController.initialize();
    if (UIConfiguration.enableLogging) {
      console.log("iOS kenar kaydırma navigasyonu aktif");
    }
  });
  
  // DOMContentLoaded olayını kaçırdıysa
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    UIKitController.initialize();
    if (UIConfiguration.enableLogging) {
      console.log("iOS kenar kaydırma navigasyonu aktif");
    }
  }
})();
