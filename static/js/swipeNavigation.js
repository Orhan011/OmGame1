
/**
 * iOS-like swipe navigation
 * Enables users to navigate back by swiping from left to right
 * with visual feedback and better edge detection
 */
document.addEventListener('DOMContentLoaded', function() {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchCurrentX = 0;
  const minSwipeDistance = 100; // Minimum distance required for a swipe
  const maxSwipeTime = 300; // Maximum time in ms for a swipe
  const edgeSize = 50; // Size of the edge area in pixels
  let touchStartTime = 0;
  let touchEndTime = 0;
  let isSwipingBack = false;
  
  // Create visual indicator element for swipe
  const swipeIndicator = document.createElement('div');
  swipeIndicator.style.position = 'fixed';
  swipeIndicator.style.top = '0';
  swipeIndicator.style.left = '0';
  swipeIndicator.style.width = '100%';
  swipeIndicator.style.height = '100%';
  swipeIndicator.style.backgroundColor = 'rgba(106, 90, 224, 0.15)';
  swipeIndicator.style.zIndex = '9999';
  swipeIndicator.style.opacity = '0';
  swipeIndicator.style.transition = 'opacity 0.3s';
  swipeIndicator.style.pointerEvents = 'none';
  document.body.appendChild(swipeIndicator);
  
  // Add event listeners for touch events
  document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchCurrentX = touchStartX;
    touchStartTime = new Date().getTime();
    
    // Check if touch started from left edge
    if (touchStartX < edgeSize) {
      isSwipingBack = true;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', function(event) {
    if (!isSwipingBack) return;
    
    touchCurrentX = event.changedTouches[0].screenX;
    const swipeDistance = touchCurrentX - touchStartX;
    
    // Show visual feedback based on swipe distance
    if (swipeDistance > 0) {
      const opacity = Math.min(swipeDistance / (minSwipeDistance * 2), 0.5);
      swipeIndicator.style.opacity = opacity.toString();
      swipeIndicator.style.transform = `translateX(${swipeDistance / 3}px)`;
    }
  }, { passive: true });
  
  document.addEventListener('touchend', function(event) {
    if (!isSwipingBack) return;
    
    touchEndX = event.changedTouches[0].screenX;
    touchEndTime = new Date().getTime();
    
    // Reset visual indicator
    swipeIndicator.style.opacity = '0';
    swipeIndicator.style.transform = 'translateX(0)';
    
    // Process the swipe
    handleSwipe();
    isSwipingBack = false;
  }, { passive: true });
  
  document.addEventListener('touchcancel', function() {
    // Reset visual indicator
    swipeIndicator.style.opacity = '0';
    swipeIndicator.style.transform = 'translateX(0)';
    isSwipingBack = false;
  }, { passive: true });
  
  // Handle the swipe gesture
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    
    // If swiped from left to right and meets minimum distance and maximum time criteria
    if (swipeDistance > minSwipeDistance && swipeTime < maxSwipeTime && touchStartX < edgeSize) {
      // Navigate back
      window.history.back();
    }
  }
});
