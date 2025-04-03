
/**
 * Enhanced iOS-like swipe navigation
 * Provides fluid, realistic edge-swipe back navigation with iOS-like animation
 */
document.addEventListener('DOMContentLoaded', function() {
  // Main variables
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 80; // Minimum distance required for a swipe
  const maxSwipeTime = 300; // Maximum time in ms for a swipe
  const edgeSize = 20; // Size of the edge area in pixels (smaller for more precise edge detection)
  let touchStartTime = 0;
  let touchEndTime = 0;
  let isSwipingBack = false;
  let initialScrollY = 0;
  
  // Create overlay container (will contain both the dark overlay and the screenshot)
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  swipeContainer.style.position = 'fixed';
  swipeContainer.style.top = '0';
  swipeContainer.style.left = '0';
  swipeContainer.style.width = '100%';
  swipeContainer.style.height = '100%';
  swipeContainer.style.pointerEvents = 'none';
  swipeContainer.style.zIndex = '9999';
  swipeContainer.style.visibility = 'hidden';
  document.body.appendChild(swipeContainer);
  
  // Create dark overlay (mimics iOS darkening effect during swipe)
  const darkOverlay = document.createElement('div');
  darkOverlay.className = 'ios-swipe-overlay';
  darkOverlay.style.position = 'absolute';
  darkOverlay.style.top = '0';
  darkOverlay.style.left = '0';
  darkOverlay.style.width = '100%';
  darkOverlay.style.height = '100%';
  darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  darkOverlay.style.transition = 'background-color 0.1s ease';
  swipeContainer.appendChild(darkOverlay);
  
  // Create "previous page" preview element (mimics iOS page preview)
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page-preview';
  prevPagePreview.style.position = 'absolute';
  prevPagePreview.style.top = '0';
  prevPagePreview.style.left = '-100%'; // Start off-screen
  prevPagePreview.style.width = '85%'; // iOS style - doesn't take full width
  prevPagePreview.style.height = '100%';
  prevPagePreview.style.backgroundColor = '#f8f8f8';
  prevPagePreview.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
  prevPagePreview.style.borderRadius = '0 3px 3px 0'; // Slight rounding on right edge
  prevPagePreview.style.transform = 'translateX(0)';
  prevPagePreview.style.willChange = 'transform';
  
  // Add subtle gradient to edge
  const gradient = document.createElement('div');
  gradient.style.position = 'absolute';
  gradient.style.top = '0';
  gradient.style.right = '0';
  gradient.style.width = '6px';
  gradient.style.height = '100%';
  gradient.style.background = 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1))';
  prevPagePreview.appendChild(gradient);
  
  // Create back arrow indicator
  const backArrow = document.createElement('div');
  backArrow.className = 'ios-back-arrow';
  backArrow.style.position = 'absolute';
  backArrow.style.top = '50%';
  backArrow.style.left = '12px';
  backArrow.style.width = '12px';
  backArrow.style.height = '12px';
  backArrow.style.borderTop = '2px solid #007aff';
  backArrow.style.borderLeft = '2px solid #007aff';
  backArrow.style.transform = 'translateY(-50%) rotate(-45deg)';
  backArrow.style.opacity = '0';
  backArrow.style.transition = 'opacity 0.2s ease';
  prevPagePreview.appendChild(backArrow);
  
  swipeContainer.appendChild(prevPagePreview);
  
  // Create subtle edge indicator to show user swipe is available
  const edgeIndicator = document.createElement('div');
  edgeIndicator.className = 'ios-edge-indicator';
  edgeIndicator.style.position = 'fixed';
  edgeIndicator.style.top = '0';
  edgeIndicator.style.left = '0';
  edgeIndicator.style.width = '3px';
  edgeIndicator.style.height = '100%';
  edgeIndicator.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
  edgeIndicator.style.pointerEvents = 'none';
  edgeIndicator.style.opacity = '0';
  document.body.appendChild(edgeIndicator);
  
  // Show edge indicator briefly on page load
  setTimeout(() => {
    edgeIndicator.style.transition = 'opacity 0.5s ease';
    edgeIndicator.style.opacity = '1';
    
    setTimeout(() => {
      edgeIndicator.style.opacity = '0';
    }, 2000);
  }, 1000);
  
  // Add event listeners for touch events
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
  
  // Handle touch start
  function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    touchStartTime = new Date().getTime();
    initialScrollY = window.scrollY;
    
    // Check if touch started from left edge
    if (touchStartX <= edgeSize) {
      // Only enable edge swipe if we have browser history to go back to
      if (window.history.length > 1) {
        isSwipingBack = true;
        
        // Prepare animation elements
        swipeContainer.style.visibility = 'visible';
        
        // Show back arrow
        backArrow.style.opacity = '0.8';
        
        // Prevent default to avoid scrolling while swiping from edge
        event.preventDefault();
      }
    }
  }
  
  // Handle touch move
  function handleTouchMove(event) {
    if (!isSwipingBack) return;
    
    // Prevent default scrolling behavior when swiping from edge
    event.preventDefault();
    
    touchCurrentX = event.touches[0].clientX;
    touchCurrentY = event.touches[0].clientY;
    
    // Calculate horizontal and vertical distance
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;
    
    // If user starts swiping more vertically than horizontally, cancel the back gesture
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaX) < 30) {
      handleTouchCancel();
      return;
    }
    
    if (deltaX > 0) {
      // Calculate progress from 0 to 1 based on swipe distance
      const maxDistance = window.innerWidth * 0.6; // Max distance for 100% progress
      const progress = Math.min(deltaX / maxDistance, 1);
      
      // Apply transform to preview element (multiplied by width to convert to actual pixels)
      const translateX = deltaX * (1 - progress * 0.4); // Slow down as we swipe further
      prevPagePreview.style.transform = `translateX(${translateX}px)`;
      
      // Darken the overlay based on progress
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${progress * 0.4})`;
      
      // Animate back arrow opacity based on progress
      backArrow.style.opacity = Math.min(0.8, progress * 2);
    }
  }
  
  // Handle touch end
  function handleTouchEnd(event) {
    if (!isSwipingBack) return;
    
    touchEndX = touchCurrentX;
    touchEndY = touchCurrentY;
    touchEndTime = new Date().getTime();
    
    // Calculate swipe data
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    const swipeSpeed = swipeDistance / swipeTime;
    
    // Determine if swipe should trigger navigation
    // Either by distance or by speed (for quick flicks)
    const minDistance = window.innerWidth * 0.3; // 30% of screen width
    const minSpeed = 0.5; // Pixels per millisecond
    
    if ((swipeDistance > minDistance) || (swipeDistance > minSwipeDistance && swipeSpeed > minSpeed)) {
      // Complete the animation with a transition
      prevPagePreview.style.transition = 'transform 0.25s ease-out';
      prevPagePreview.style.transform = `translateX(${window.innerWidth * 0.85}px)`;
      
      darkOverlay.style.transition = 'background-color 0.25s ease-out';
      darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      
      // Navigate back after animation completes
      setTimeout(() => {
        window.history.back();
        resetSwipeElements();
      }, 250);
    } else {
      // Cancel the back action with a springy animation
      cancelSwipeWithAnimation();
    }
    
    isSwipingBack = false;
  }
  
  // Handle touch cancel
  function handleTouchCancel() {
    if (isSwipingBack) {
      cancelSwipeWithAnimation();
      isSwipingBack = false;
    }
  }
  
  // Animate the cancellation of swipe with a springy effect
  function cancelSwipeWithAnimation() {
    prevPagePreview.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    prevPagePreview.style.transform = 'translateX(0)';
    
    darkOverlay.style.transition = 'background-color 0.3s ease';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    
    backArrow.style.opacity = '0';
    
    // Hide elements after animation
    setTimeout(resetSwipeElements, 300);
  }
  
  // Reset swipe elements to their initial state
  function resetSwipeElements() {
    // Reset transitions
    prevPagePreview.style.transition = '';
    darkOverlay.style.transition = '';
    
    // Reset transforms and styles
    prevPagePreview.style.transform = 'translateX(0)';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    backArrow.style.opacity = '0';
    
    // Hide container
    swipeContainer.style.visibility = 'hidden';
  }
});
