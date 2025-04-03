
/**
 * iOS-style swipe navigation
 * Advanced implementation with visual preview of previous page
 */
document.addEventListener('DOMContentLoaded', function() {
  // Create container for previous page preview
  const pageContainer = document.createElement('div');
  pageContainer.className = 'ios-page-container';
  
  // Create overlay for dimming current page
  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'ios-dim-overlay';
  
  // Create shadow element for depth effect
  const edgeShadow = document.createElement('div');
  edgeShadow.className = 'ios-edge-shadow';
  
  // Variables for touch tracking
  let touchStartX = 0;
  let touchCurrentX = 0;
  let touchStartTime = 0;
  let isSwipingBack = false;
  let swipeThreshold = 100; // Minimum distance to trigger navigation
  let autoCompleteThreshold = window.innerWidth * 0.3; // Auto-complete threshold
  let maxTime = 300; // Maximum time for swipe in ms
  let lastPageURL = document.referrer; // Store the previous page URL
  
  // Append elements to body
  document.body.appendChild(dimOverlay);
  document.body.appendChild(pageContainer);
  document.body.appendChild(edgeShadow);
  
  // Touch start - initialize swipe
  document.addEventListener('touchstart', function(e) {
    // Only detect swipes starting from left edge (40px)
    if (e.touches[0].clientX > 40) return;
    
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    touchStartTime = new Date().getTime();
    isSwipingBack = true;
    
    // Check if we have a previous page to return to
    if (window.history.length > 1) {
      // Prepare the page container for animation
      pageContainer.style.display = 'block';
      dimOverlay.style.display = 'block';
      edgeShadow.style.display = 'block';
      
      // Initialize positions
      pageContainer.style.transform = 'translateX(-30%)';
      dimOverlay.style.opacity = '0';
      edgeShadow.style.opacity = '0';
      
      // Prevent scrolling while swiping
      document.body.style.overflow = 'hidden';
      e.preventDefault();
    } else {
      isSwipingBack = false;
    }
  }, { passive: false });
  
  // Touch move - update animation based on finger position
  document.addEventListener('touchmove', function(e) {
    if (!isSwipingBack) return;
    
    touchCurrentX = e.touches[0].clientX;
    let swipeDistance = touchCurrentX - touchStartX;
    
    // Calculate how far we've swiped as a percentage of screen width
    let percentComplete = Math.min(swipeDistance / window.innerWidth, 1);
    
    if (percentComplete > 0) {
      // Update current page position (slide right)
      document.body.style.transform = `translateX(${swipeDistance}px)`;
      
      // Update previous page position (sliding in from left)
      pageContainer.style.transform = `translateX(${-30 + (percentComplete * 30)}%)`;
      
      // Update overlay opacity for dimming effect
      dimOverlay.style.opacity = (0.4 * percentComplete).toString();
      
      // Update shadow for depth effect
      edgeShadow.style.opacity = (0.3 * percentComplete).toString();
      edgeShadow.style.left = `${swipeDistance}px`;
      
      e.preventDefault();
    }
  }, { passive: false });
  
  // Touch end - finalize the animation
  document.addEventListener('touchend', function(e) {
    if (!isSwipingBack) return;
    
    let touchEndTime = new Date().getTime();
    let swipeTime = touchEndTime - touchStartTime;
    let swipeDistance = touchCurrentX - touchStartX;
    let swipeSpeed = swipeDistance / swipeTime;
    
    // Logic to determine if we should complete the navigation
    let shouldNavigateBack = 
      (swipeDistance > swipeThreshold && swipeTime < maxTime) || // Fast swipe
      (swipeDistance > autoCompleteThreshold) || // Dragged past threshold
      (swipeDistance > 60 && swipeSpeed > 0.5); // Quick flick
    
    if (shouldNavigateBack) {
      // Complete the animation
      completeSwipeAnimation(true);
      
      // Navigate after animation completes
      setTimeout(() => {
        window.history.back();
      }, 300);
    } else {
      // Cancel the animation
      completeSwipeAnimation(false);
    }
    
    isSwipingBack = false;
  });
  
  // Touch cancel - reset everything
  document.addEventListener('touchcancel', function() {
    if (isSwipingBack) {
      completeSwipeAnimation(false);
      isSwipingBack = false;
    }
  });
  
  // Function to complete or cancel swipe animation
  function completeSwipeAnimation(complete) {
    if (complete) {
      // Animate to completed state
      document.body.style.transform = `translateX(${window.innerWidth}px)`;
      pageContainer.style.transform = 'translateX(0)';
      dimOverlay.style.opacity = '0.4';
      edgeShadow.style.opacity = '0.3';
      edgeShadow.style.left = `${window.innerWidth}px`;
    } else {
      // Animate back to starting position
      document.body.style.transform = 'translateX(0)';
      pageContainer.style.transform = 'translateX(-30%)';
      dimOverlay.style.opacity = '0';
      edgeShadow.style.opacity = '0';
    }
    
    // Reset after animation completes
    setTimeout(() => {
      if (!isSwipingBack) {
        document.body.style.transform = '';
        document.body.style.overflow = '';
        pageContainer.style.display = 'none';
        dimOverlay.style.display = 'none';
        edgeShadow.style.display = 'none';
      }
    }, 300);
  }
  
  // Handle orientation changes
  window.addEventListener('resize', function() {
    autoCompleteThreshold = window.innerWidth * 0.3;
  });
  
  // Snapshot the current page when navigating to have it for "back" animation
  window.addEventListener('beforeunload', function() {
    try {
      // Store the current URL as the previous page for any next page
      sessionStorage.setItem('previousPageURL', window.location.href);
    } catch (e) {
      // Handle potential sessionStorage errors
      console.warn('Could not store previous page URL', e);
    }
  });
});
