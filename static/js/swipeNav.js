/**
 * ZekaPark - Advanced iOS 16+ Style Edge Swipe Navigation
 * Ultra-fast (0ms), no color distortion, smooth transitions
 * 
 * Version: 5.0
 */

(() => {
  'use strict';
  
  // Configuration for maximum performance
  const SwipeConfig = {
    DETECTION_EDGE: 40,              // Screen edge size in pixels for detection
    COLOR_DISTORTION_FIX: true,      // Fix color rendering issues (buzulma)
    ZERO_DELAY: true,                // Use 0ms transitions for instant page changes
    VELOCITY_THRESHOLD: 0.3,         // Min velocity for swipe detection (px/ms)
    PROGRESS_THRESHOLD: 0.25,        // Min screen width percentage to trigger navigation
    PRELOAD_PREVIOUS: true,          // Preload previous page for better performance
    NAVIGATION_KEY: 'zp_nav_history', // Storage key for navigation history
    HARDWARE_ACCELERATION: true,     // Use GPU acceleration
    USE_SESSION_STORAGE: true,       // Use session storage instead of localStorage
    MAX_HISTORY_ITEMS: 50,           // Max number of history items to store
    DEBUG: false                     // Enable/disable debug logs
  };

  // DOM elements container
  const UI = {
    container: null,      // Main container
    currentView: null,    // Current page element
    previousView: null,   // Previous page element
    dimOverlay: null,     // Background dimmer
    initialized: false    // DOM initialization state
  };

  // Navigation state management
  const State = {
    history: [],          // Navigation history stack
    isActive: false,      // Is gesture currently active
    blockNavigation: false, // Block navigation during transitions
    startX: 0,            // Starting X position of touch
    startY: 0,            // Starting Y position of touch
    currentX: 0,          // Current X position
    velocityTracker: {    // Velocity calculation helper
      lastX: 0,
      lastTimestamp: 0,
      records: []
    },
    direction: null,      // Detected direction of swipe
    verticalScrollDetected: false // Track vertical scrolling
  };

  // History management
  const NavigationManager = {
    // Load navigation history from storage
    loadHistory() {
      try {
        const storage = SwipeConfig.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        const saved = storage.getItem(SwipeConfig.NAVIGATION_KEY);
        
        if (saved) {
          State.history = JSON.parse(saved);
          if (SwipeConfig.DEBUG) console.log("Loaded navigation history:", State.history);
        } else {
          State.history = [];
        }
      } catch (e) {
        console.warn("Failed to load navigation history:", e);
        State.history = [];
      }
      
      // Add current URL if history is empty
      if (State.history.length === 0) {
        this.saveCurrentPage();
      }
    },
    
    // Save current page to history
    saveCurrentPage() {
      const currentPath = window.location.pathname;
      
      // Avoid duplicate entries
      if (State.history.length > 0 && State.history[State.history.length - 1] === currentPath) {
        return;
      }
      
      // Limit history size
      if (State.history.length >= SwipeConfig.MAX_HISTORY_ITEMS) {
        State.history.shift();
      }
      
      // Add current path
      State.history.push(currentPath);
      
      // Save to storage
      try {
        const storage = SwipeConfig.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        storage.setItem(SwipeConfig.NAVIGATION_KEY, JSON.stringify(State.history));
      } catch (e) {
        console.warn("Failed to save navigation history:", e);
      }
    },
    
    // Get previous page from history
    getPreviousPage() {
      if (State.history.length < 2) {
        return null;
      }
      return State.history[State.history.length - 2];
    },
    
    // Navigate to previous page
    goBack() {
      // Ensure we have history to go back to
      if (State.history.length <= 1) {
        if (window.history.length > 1) {
          window.history.back();
          return true;
        }
        return false;
      }
      
      // Remove current page from history
      State.history.pop();
      
      // Get previous page
      const previousPath = State.history[State.history.length - 1];
      
      // Update storage
      try {
        const storage = SwipeConfig.USE_SESSION_STORAGE ? sessionStorage : localStorage;
        storage.setItem(SwipeConfig.NAVIGATION_KEY, JSON.stringify(State.history));
      } catch (e) {
        console.warn("Failed to update navigation history:", e);
      }
      
      // Navigate to previous page - use replace for faster loading
      if (previousPath) {
        const fullUrl = previousPath.startsWith('/') ? 
                       window.location.origin + previousPath : 
                       (previousPath.startsWith('http') ? previousPath : '/' + previousPath);
        
        window.location.replace(fullUrl);
        return true;
      } else {
        // Fallback to browser history
        window.history.back();
        return true;
      }
    }
  };

  // DOM manipulation and animations
  const ViewController = {
    // Initialize DOM elements
    setupDOM() {
      if (UI.initialized) return;
      
      // Create container using DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      
      // Main container
      UI.container = document.createElement('div');
      UI.container.id = 'zp-swipe-container';
      UI.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 9999;
        visibility: hidden;
        ${SwipeConfig.HARDWARE_ACCELERATION ? 'transform: translateZ(0); will-change: transform;' : ''}
        ${SwipeConfig.HARDWARE_ACCELERATION ? '-webkit-transform: translateZ(0);' : ''}
        ${SwipeConfig.HARDWARE_ACCELERATION ? 'backface-visibility: hidden; -webkit-backface-visibility: hidden;' : ''}
      `;
      
      // Previous view (behind current)
      UI.previousView = document.createElement('div');
      UI.previousView.id = 'zp-previous-view';
      UI.previousView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(-30px, 0, 0) scale(0.95);
        ${SwipeConfig.HARDWARE_ACCELERATION ? 'will-change: transform;' : ''}
        z-index: 9998;
        visibility: hidden;
      `;
      
      // Background dimmer
      UI.dimOverlay = document.createElement('div');
      UI.dimOverlay.id = 'zp-dim-overlay';
      UI.dimOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0);
        z-index: 9997;
      `;
      
      // Current view (top layer)
      UI.currentView = document.createElement('div');
      UI.currentView.id = 'zp-current-view';
      UI.currentView.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        transform: translate3d(0, 0, 0);
        ${SwipeConfig.HARDWARE_ACCELERATION ? 'will-change: transform;' : ''}
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        visibility: hidden;
      `;
      
      // Assemble DOM structure
      UI.container.appendChild(UI.previousView);
      UI.container.appendChild(UI.dimOverlay);
      UI.container.appendChild(UI.currentView);
      fragment.appendChild(UI.container);
      
      // Add to document
      document.body.appendChild(fragment);
      
      UI.initialized = true;
    },
    
    // Prepare for swipe gesture
    prepareSwipeTransition() {
      if (!UI.initialized) {
        this.setupDOM();
      }
      
      // Get background color for consistent rendering
      const bgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
      
      // Reset views for new swipe
      UI.container.style.visibility = 'visible';
      UI.currentView.style.visibility = 'visible';
      UI.previousView.style.visibility = 'visible';
      
      // Reset current view
      UI.currentView.innerHTML = '';
      UI.currentView.style.transition = 'none';
      UI.currentView.style.backgroundColor = bgColor;
      UI.currentView.style.transform = 'translate3d(0, 0, 0)';
      
      // Reset previous view
      UI.previousView.innerHTML = '';
      UI.previousView.style.transition = 'none';
      UI.previousView.style.backgroundColor = bgColor;
      UI.previousView.style.transform = 'translate3d(-30px, 0, 0) scale(0.95)';
      
      // Reset overlay
      UI.dimOverlay.style.transition = 'none';
      UI.dimOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      if (SwipeConfig.COLOR_DISTORTION_FIX) {
        // Create solid color blocks instead of page snapshots
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
        
        UI.currentView.appendChild(currentViewBlock);
        UI.previousView.appendChild(previousViewBlock);
      }
    },
    
    // Update transition during swipe
    updateTransition(progress) {
      if (!State.isActive) return;
      
      const screenWidth = window.innerWidth;
      
      // Move current view
      const currentOffset = progress * screenWidth;
      UI.currentView.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
      
      // Scale and move previous view with smooth spring physics
      const scaleValue = 0.95 + (0.05 * progress);
      const previousOffset = -30 + (30 * progress);
      UI.previousView.style.transform = `translate3d(${previousOffset}px, 0, 0) scale(${scaleValue})`;
      
      // Update dimmer
      const opacity = Math.max(0, Math.min(0.3, progress * 0.3));
      UI.dimOverlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    },
    
    // Complete transition and navigate
    completeTransition() {
      if (!State.isActive) return;
      
      // Set transition duration (0ms for instant switch)
      const duration = SwipeConfig.ZERO_DELAY ? 0 : 150;
      
      // Configure transitions
      UI.currentView.style.transition = `transform ${duration}ms ease-out`;
      UI.previousView.style.transition = `transform ${duration}ms ease-out`;
      UI.dimOverlay.style.transition = `background-color ${duration}ms ease-out`;
      
      // Move to final positions
      UI.currentView.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
      UI.previousView.style.transform = 'translate3d(0, 0, 0) scale(1)';
      UI.dimOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Reset after animation
      setTimeout(() => {
        this.resetViews();
      }, duration);
    },
    
    // Cancel transition
    cancelTransition() {
      if (!State.isActive) return;
      
      // Set transition duration (0ms for instant reset)
      const duration = SwipeConfig.ZERO_DELAY ? 0 : 150;
      
      // Configure transitions
      UI.currentView.style.transition = `transform ${duration}ms ease-out`;
      UI.previousView.style.transition = `transform ${duration}ms ease-out`;
      UI.dimOverlay.style.transition = `background-color ${duration}ms ease-out`;
      
      // Return to starting positions
      UI.currentView.style.transform = 'translate3d(0, 0, 0)';
      UI.previousView.style.transform = 'translate3d(-30px, 0, 0) scale(0.95)';
      UI.dimOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // Reset after animation
      setTimeout(() => {
        this.resetViews();
      }, duration);
    },
    
    // Reset view state
    resetViews() {
      // Hide container and views
      UI.container.style.visibility = 'hidden';
      UI.currentView.style.visibility = 'hidden';
      UI.previousView.style.visibility = 'hidden';
      
      // Clear contents to free memory
      UI.currentView.innerHTML = '';
      UI.previousView.innerHTML = '';
    }
  };

  // Physics calculations
  const PhysicsHelper = {
    // Record velocity for swipe
    recordVelocity(x) {
      const now = Date.now();
      const elapsed = now - State.velocityTracker.lastTimestamp;
      
      if (elapsed > 0) {
        // Calculate velocity in px/ms
        const velocity = (x - State.velocityTracker.lastX) / elapsed;
        
        // Keep last 5 velocity records for smoother calculation
        State.velocityTracker.records.push(velocity);
        if (State.velocityTracker.records.length > 5) {
          State.velocityTracker.records.shift();
        }
        
        // Update tracking values
        State.velocityTracker.lastX = x;
        State.velocityTracker.lastTimestamp = now;
      }
    },
    
    // Calculate weighted average velocity
    getAverageVelocity() {
      if (State.velocityTracker.records.length === 0) return 0;
      
      let weightSum = 0;
      let velocitySum = 0;
      
      // Weight newer velocities more heavily
      for (let i = 0; i < State.velocityTracker.records.length; i++) {
        const weight = i + 1;
        velocitySum += State.velocityTracker.records[i] * weight;
        weightSum += weight;
      }
      
      return velocitySum / weightSum;
    },
    
    // Determine if swipe should complete or cancel
    evaluateSwipe() {
      // Calculate displacement
      const displacement = State.currentX - State.startX;
      const screenWidth = window.innerWidth;
      
      // Calculate progress ratio
      const progressRatio = displacement / screenWidth;
      
      // Get final velocity
      const velocity = this.getAverageVelocity();
      
      // Decide based on velocity and displacement thresholds
      if (velocity > SwipeConfig.VELOCITY_THRESHOLD || progressRatio > SwipeConfig.PROGRESS_THRESHOLD) {
        return 'complete';
      } else {
        return 'cancel';
      }
    }
  };

  // Event handling
  const EventHandler = {
    // Set up all event listeners
    attachEventListeners() {
      // Touch events
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
      
      // Handle link clicks to record page visits
      document.addEventListener('click', this.handleLinkClick.bind(this));
      
      // Handle navigation events
      window.addEventListener('popstate', () => {
        NavigationManager.loadHistory();
      });
    },
    
    // Handle touch start
    handleTouchStart(e) {
      // Only process edge touches
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      if (touchX <= SwipeConfig.DETECTION_EDGE && !State.blockNavigation) {
        // Reset state for new gesture
        State.isActive = true;
        State.startX = touchX;
        State.startY = touchY;
        State.currentX = touchX;
        State.velocityTracker.lastX = touchX;
        State.velocityTracker.lastTimestamp = Date.now();
        State.velocityTracker.records = [];
        State.direction = null;
        State.verticalScrollDetected = false;
        
        // Prepare UI for transition
        ViewController.prepareSwipeTransition();
      }
    },
    
    // Handle touch move
    handleTouchMove(e) {
      if (!State.isActive || State.blockNavigation) return;
      
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Determine direction if not already set
      if (!State.direction) {
        const deltaX = Math.abs(touchX - State.startX);
        const deltaY = Math.abs(touchY - State.startY);
        
        // If more vertical than horizontal, cancel swipe
        if (deltaY > deltaX * 1.2) {
          State.verticalScrollDetected = true;
          State.direction = 'vertical';
        } else if (deltaX > 5) {
          State.direction = 'horizontal';
        }
      }
      
      // Handle vertical scrolling
      if (State.verticalScrollDetected) {
        // Reset swipe state and cancel animation
        State.isActive = false;
        ViewController.cancelTransition();
        return;
      }
      
      // Handle horizontal swipe
      if (State.direction === 'horizontal') {
        // Only handle rightward swipes
        if (touchX >= State.startX) {
          State.currentX = touchX;
          
          // Track velocity
          PhysicsHelper.recordVelocity(touchX);
          
          // Calculate progress (0-1)
          const screenWidth = window.innerWidth;
          const progress = Math.min(1, Math.max(0, (touchX - State.startX) / screenWidth));
          
          // Update transition based on progress
          ViewController.updateTransition(progress);
          
          // Prevent default behavior
          e.preventDefault();
        }
      }
    },
    
    // Handle touch end
    async handleTouchEnd(e) {
      if (!State.isActive || State.blockNavigation) return;
      
      // Skip if vertical scroll detected
      if (State.verticalScrollDetected) {
        State.isActive = false;
        return;
      }
      
      // Evaluate swipe outcome
      const action = PhysicsHelper.evaluateSwipe();
      
      if (action === 'complete') {
        // Prevent double-navigation
        State.blockNavigation = true;
        
        // Complete transition animation
        ViewController.completeTransition();
        
        // Navigate to previous page
        NavigationManager.goBack();
      } else {
        // Cancel transition animation
        ViewController.cancelTransition();
      }
      
      // Reset state
      State.isActive = false;
      State.blockNavigation = false;
    },
    
    // Handle touch cancel
    handleTouchCancel() {
      if (State.isActive) {
        // Cancel any active transition
        ViewController.cancelTransition();
        
        // Reset state
        State.isActive = false;
        State.blockNavigation = false;
      }
    },
    
    // Handle link clicks
    handleLinkClick(e) {
      const link = e.target.closest('a');
      
      // Check if it's a normal navigation link
      if (link && !link.target && link.href) {
        const url = new URL(link.href);
        
        // Only track same-origin navigation
        if (url.origin === window.location.origin) {
          NavigationManager.saveCurrentPage();
        }
      }
    }
  };

  // Main controller
  const SwipeNavigationController = {
    // Initialize the system
    initialize() {
      // Set up DOM
      ViewController.setupDOM();
      
      // Load navigation history
      NavigationManager.loadHistory();
      
      // Attach event listeners
      EventHandler.attachEventListeners();
      
      // Save current page
      NavigationManager.saveCurrentPage();
      
      // Preload if enabled
      if (SwipeConfig.PRELOAD_PREVIOUS) {
        this.preloadPreviousPage();
      }
      
      console.log("iOS kenar kaydırma navigasyonu başlatılıyor...");
    },
    
    // Preload previous page for better performance
    preloadPreviousPage() {
      const previousPage = NavigationManager.getPreviousPage();
      
      if (previousPage) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = previousPage;
        document.head.appendChild(link);
      }
    }
  };
  
  // Start on page load
  document.addEventListener('DOMContentLoaded', () => {
    SwipeNavigationController.initialize();
    console.log("iOS kenar kaydırma navigasyonu aktif");
  });
  
  // Handle case where DOMContentLoaded already fired
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    SwipeNavigationController.initialize();
    console.log("iOS kenar kaydırma navigasyonu aktif");
  }
})();
