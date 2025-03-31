
/**
 * iOS-like swipe navigation
 * Enables users to navigate back by swiping from left to right
 */
document.addEventListener('DOMContentLoaded', function() {
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 100; // Minimum distance required for a swipe
  const maxSwipeTime = 300; // Maximum time in ms for a swipe
  let touchStartTime = 0;
  let touchEndTime = 0;
  
  // Add event listeners for touch events
  document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartTime = new Date().getTime();
  }, false);
  
  document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndTime = new Date().getTime();
    handleSwipe();
  }, false);
  
  // Handle the swipe gesture
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    
    // If swiped from left to right and meets minimum distance and maximum time criteria
    if (swipeDistance > minSwipeDistance && swipeTime < maxSwipeTime && touchStartX < 50) {
      // Navigate back
      window.history.back();
    }
  }
});
