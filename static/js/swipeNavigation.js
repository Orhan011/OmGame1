
/**
 * Modern iOS 17 style swipe navigation
 * Professional implementation with physics-based animations and depth effects
 * Goes back to previous page in history instead of home page
 */
document.addEventListener('DOMContentLoaded', function() {
  // Create overlay container
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  document.body.appendChild(swipeContainer);
  
  // Create previous page preview element
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page';
  swipeContainer.appendChild(prevPagePreview);
  
  // Create edge shadow for depth effect
  const edgeShadow = document.createElement('div');
  edgeShadow.className = 'ios-edge-shadow';
  swipeContainer.appendChild(edgeShadow);
  
  // Create subtle overlay for darkening current page
  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'ios-dim-overlay';
  swipeContainer.appendChild(dimOverlay);
  
  // Variables for tracking touch interaction
  let startX = 0;
  let currentX = 0;
  let startY = 0;
  let currentY = 0;
  let startTime = 0;
  let isActive = false;
  let isVerticalScroll = false;
  let initialBodyOverflow = '';
  
  // Configuration
  const edgeThreshold = 30; // Area from left edge that triggers swipe (px)
  const minSwipeDistance = 50; // Minimum distance to register swipe
  const completionThreshold = window.innerWidth * 0.4; // Auto-complete threshold
  const velocityThreshold = 0.5; // Velocity to trigger completion (px/ms)
  
  // Touch start handler
  document.addEventListener('touchstart', function(e) {
    // Only detect touches starting from left edge
    if (e.touches[0].clientX > edgeThreshold) return;
    
    // Only activate if we have history to go back to
    if (window.history.length <= 1) return;
    
    // Store initial touch position and time
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    currentY = startY;
    startTime = Date.now();
    
    // Prepare visual elements
    swipeContainer.style.display = 'block';
    prevPagePreview.style.transform = 'translateX(-20%)';
    prevPagePreview.style.opacity = '1';
    
    // Take a "screenshot" of previous page (simulated with gradient)
    // In real iOS, this would be a snapshot of the previous page
    const bodyBgColor = getComputedStyle(document.body).backgroundColor || '#ffffff';
    const isDarkMode = bodyBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/) ? 
                       parseInt(bodyBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/)[1]) < 100 : false;
    
    if (isDarkMode) {
      // Dark mode colors
      prevPagePreview.style.background = 'linear-gradient(to right, #131314, #1c1c1e)';
    } else {
      // Light mode colors
      prevPagePreview.style.background = 'linear-gradient(to right, #f5f5f7, #ffffff)';
    }
    
    // Store original body overflow to restore later
    initialBodyOverflow = document.body.style.overflow;
    
    isActive = true;
  }, { passive: true });
  
  // Touch move handler
  document.addEventListener('touchmove', function(e) {
    if (!isActive) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    
    // Detect vertical scrolling to cancel swipe
    const verticalDistance = Math.abs(currentY - startY);
    const horizontalDistance = currentX - startX;
    
    // Cancel swipe if clearly scrolling vertically
    if (verticalDistance > horizontalDistance * 1.3 && horizontalDistance < 40) {
      isVerticalScroll = true;
      cancelSwipe();
      return;
    }
    
    // Only process horizontal movement to the right
    if (horizontalDistance > 0) {
      e.preventDefault(); // Prevent scrolling while swiping
      
      // Calculate progress (0-1)
      const maxDistance = window.innerWidth;
      const progress = Math.min(horizontalDistance / maxDistance, 1);
      
      // Apply cubic easing for natural feel
      const easedProgress = easeOutCubic(progress);
      
      // Move current page
      document.body.style.transform = `translateX(${horizontalDistance}px)`;
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Move previous page preview with subtle parallax effect (iOS style)
      prevPagePreview.style.transform = `translateX(${-20 + (easedProgress * 20)}%)`;
      
      // Update shadow and dim overlay with iOS-style depth effect
      edgeShadow.style.opacity = Math.min(easedProgress * 0.15, 0.15).toString();
      edgeShadow.style.left = `${horizontalDistance}px`;
      dimOverlay.style.opacity = Math.min(easedProgress * 0.1, 0.1).toString();
    }
  }, { passive: false });
  
  // Touch end handler
  document.addEventListener('touchend', function() {
    if (!isActive) return;
    
    const endTime = Date.now();
    const timeElapsed = endTime - startTime;
    const distance = currentX - startX;
    const velocity = distance / timeElapsed; // px/ms
    
    // Determine if swipe should complete based on distance or velocity (iOS behavior)
    const shouldComplete = (distance > completionThreshold) || 
                          (distance > minSwipeDistance && velocity > velocityThreshold);
    
    if (shouldComplete && !isVerticalScroll) {
      completeSwipe();
    } else {
      cancelSwipe();
    }
    
    // Reset state
    isActive = false;
    isVerticalScroll = false;
  });
  
  // Touch cancel handler
  document.addEventListener('touchcancel', function() {
    if (isActive) {
      cancelSwipe();
      isActive = false;
      isVerticalScroll = false;
    }
  });
  
  // Complete swipe animation and navigation
  function completeSwipe() {
    // Set transition for smooth animation (iOS spring effect)
    document.body.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    prevPagePreview.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    dimOverlay.style.transition = 'opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    edgeShadow.style.transition = 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
    
    // Animate to final state
    document.body.style.transform = `translateX(${window.innerWidth}px)`;
    prevPagePreview.style.transform = 'translateX(0)';
    dimOverlay.style.opacity = '0.1';
    edgeShadow.style.opacity = '0.15';
    edgeShadow.style.left = `${window.innerWidth}px`;
    
    // Wait for animation to complete before navigation
    setTimeout(function() {
      // Go back to previous page in history instead of home
      window.history.back();
      resetSwipeElements();
    }, 350);
  }
  
  // Cancel swipe with spring-back effect (iOS bounce)
  function cancelSwipe() {
    // Set transition for spring-back effect with iOS physics
    document.body.style.transition = 'transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    prevPagePreview.style.transition = 'transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    dimOverlay.style.transition = 'opacity 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    edgeShadow.style.transition = 'all 0.3s cubic-bezier(0.36, 0.66, 0.04, 1.12)';
    
    // Animate back to initial state
    document.body.style.transform = 'translateX(0)';
    prevPagePreview.style.transform = 'translateX(-20%)';
    dimOverlay.style.opacity = '0';
    edgeShadow.style.opacity = '0';
    
    // Reset elements after animation
    setTimeout(resetSwipeElements, 300);
  }
  
  // Reset all elements to initial state
  function resetSwipeElements() {
    document.body.style.transition = '';
    document.body.style.transform = '';
    document.body.style.overflow = initialBodyOverflow;
    
    swipeContainer.style.display = 'none';
    prevPagePreview.style.transition = '';
    edgeShadow.style.transition = '';
    dimOverlay.style.transition = '';
  }
  
  // Cubic easing function for smooth animations (iOS style)
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    completionThreshold = window.innerWidth * 0.4;
  });
});
