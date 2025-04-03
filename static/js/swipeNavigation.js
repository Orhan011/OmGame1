
/**
 * Advanced iOS-style swipe navigation
 * Professionally implemented with physics-based animations and previous page preview
 */
document.addEventListener('DOMContentLoaded', function() {
  // Create container for previous page preview
  const pagePreview = document.createElement('div');
  pagePreview.className = 'ios-page-preview';
  
  // Create shadow element for depth effect
  const edgeShadow = document.createElement('div');
  edgeShadow.className = 'ios-edge-shadow';
  
  // Create overlay for current page dimming
  const dimOverlay = document.createElement('div');
  dimOverlay.className = 'ios-dim-overlay';
  
  // Variables for touch tracking
  let touchStartX = 0;
  let touchCurrentX = 0;
  let touchStartY = 0;
  let touchCurrentY = 0;
  let touchStartTime = 0;
  let isSwipingBack = false;
  let isScrollingVertically = false;
  
  // Configuration
  const edgeTriggerSize = 30; // px from left edge that triggers swipe
  const minSwipeDistance = 50; // Minimum distance to register swipe
  const autoCompleteThreshold = window.innerWidth * 0.35; // Auto-complete threshold
  const springBackSpeed = 0.3; // Speed for spring-back animation (seconds)
  const completeSwipeSpeed = 0.35; // Speed for completed swipe animation (seconds)
  
  // Append elements to body
  document.body.appendChild(pagePreview);
  document.body.appendChild(edgeShadow);
  document.body.appendChild(dimOverlay);
  
  // Touch start - initialize swipe
  document.addEventListener('touchstart', function(e) {
    // Only detect swipes starting from left edge
    if (e.touches[0].clientX > edgeTriggerSize) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    touchStartTime = new Date().getTime();
    
    // Check if we have a previous page to return to
    if (window.history.length > 1) {
      isSwipingBack = true;
      
      // Prepare the animation elements
      pagePreview.style.display = 'block';
      edgeShadow.style.display = 'block';
      dimOverlay.style.display = 'block';
      
      // Initialize positions
      pagePreview.style.transform = 'translateX(-30%)';
      pagePreview.style.opacity = '1';
      dimOverlay.style.opacity = '0';
      edgeShadow.style.opacity = '0';
      
      // Take a "screenshot" of current and previous page
      // (In a real iOS implementation, this would be a snapshot of the previous page)
      // Here we create a placeholder with a subtle gradient
      let bgColorStart = getComputedStyle(document.body).backgroundColor;
      let bgColorEnd = bgColorStart;
      
      // Adjust if using RGB format
      if (bgColorStart.startsWith('rgb')) {
        const rgb = bgColorStart.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          // Create a slightly darker/lighter version for the gradient
          const darken = Math.max(parseInt(rgb[0]) - 15, 0);
          const lighten = Math.min(parseInt(rgb[1]) + 10, 255);
          bgColorEnd = `rgb(${darken}, ${lighten}, ${rgb[2]})`;
        }
      }
      
      pagePreview.style.background = `linear-gradient(to right, ${bgColorEnd}, ${bgColorStart})`;
    }
  }, { passive: true });
  
  // Touch move - update animation based on finger position
  document.addEventListener('touchmove', function(e) {
    if (!isSwipingBack) return;
    
    touchCurrentX = e.touches[0].clientX;
    touchCurrentY = e.touches[0].clientY;
    
    // Calculate vertical movement to detect scrolling
    const verticalDistance = Math.abs(touchCurrentY - touchStartY);
    const horizontalDistance = touchCurrentX - touchStartX;
    
    // If vertical movement is significantly more than horizontal, cancel swipe
    if (verticalDistance > horizontalDistance * 1.2 && horizontalDistance < 30) {
      isScrollingVertically = true;
      resetSwipeAnimation();
      isSwipingBack = false;
      return;
    }
    
    if (horizontalDistance > 0) {
      // Calculate progress as a percentage (0-1)
      const progress = Math.min(horizontalDistance / window.innerWidth, 1);
      
      // Apply non-linear easing for more natural feel
      const easedProgress = easeOutCubic(progress);
      
      // Transform current page (slide right)
      document.body.style.transform = `translateX(${horizontalDistance}px)`;
      
      // Transform previous page preview (slide from left)
      pagePreview.style.transform = `translateX(${-30 + (easedProgress * 30)}%)`;
      
      // Update shadow opacity and position
      edgeShadow.style.opacity = (0.2 * easedProgress).toString();
      edgeShadow.style.left = `${horizontalDistance}px`;
      
      // Update dim overlay for subtle darkening effect
      dimOverlay.style.opacity = (0.3 * easedProgress).toString();
      
      // Prevent scrolling while swiping
      if (horizontalDistance > 10) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  // Touch end - finalize the animation
  document.addEventListener('touchend', function(e) {
    if (!isSwipingBack || isScrollingVertically) {
      isSwipingBack = false;
      isScrollingVertically = false;
      return;
    }
    
    const touchEndTime = new Date().getTime();
    const swipeTime = touchEndTime - touchStartTime;
    const swipeDistance = touchCurrentX - touchStartX;
    const swipeVelocity = swipeDistance / swipeTime; // pixels per ms
    
    // Determine if swipe should complete based on distance and velocity
    const shouldComplete = 
      (swipeDistance > autoCompleteThreshold) || // Dragged past threshold
      (swipeDistance > minSwipeDistance && swipeVelocity > 0.5); // Quick flick
    
    if (shouldComplete) {
      // Complete the transition with physics-based animation
      completeSwipeAnimation();
      
      // Wait for animation to complete before navigating
      setTimeout(() => {
        window.history.back();
      }, completeSwipeSpeed * 1000);
    } else {
      // Cancel the transition with spring-back effect
      cancelSwipeAnimation();
    }
    
    isSwipingBack = false;
    isScrollingVertically = false;
  });
  
  // Touch cancel - reset everything
  document.addEventListener('touchcancel', function() {
    if (isSwipingBack) {
      resetSwipeAnimation();
      isSwipingBack = false;
      isScrollingVertically = false;
    }
  });
  
  // Function to complete swipe animation
  function completeSwipeAnimation() {
    // Update transition property for smooth animation
    document.body.style.transition = `transform ${completeSwipeSpeed}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
    pagePreview.style.transition = `transform ${completeSwipeSpeed}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
    dimOverlay.style.transition = `opacity ${completeSwipeSpeed}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
    edgeShadow.style.transition = `all ${completeSwipeSpeed}s cubic-bezier(0.2, 0.8, 0.2, 1)`;
    
    // Animate to completed state
    document.body.style.transform = `translateX(${window.innerWidth}px)`;
    pagePreview.style.transform = 'translateX(0)';
    dimOverlay.style.opacity = '0.3';
    edgeShadow.style.opacity = '0.2';
    edgeShadow.style.left = `${window.innerWidth}px`;
  }
  
  // Function to cancel swipe animation with spring-back effect
  function cancelSwipeAnimation() {
    // Update transition property for spring-back effect
    document.body.style.transition = `transform ${springBackSpeed}s cubic-bezier(0.3, 0.8, 0.4, 1.2)`;
    pagePreview.style.transition = `transform ${springBackSpeed}s cubic-bezier(0.3, 0.8, 0.4, 1.2)`;
    dimOverlay.style.transition = `opacity ${springBackSpeed}s cubic-bezier(0.3, 0.8, 0.4, 1.2)`;
    edgeShadow.style.transition = `all ${springBackSpeed}s cubic-bezier(0.3, 0.8, 0.4, 1.2)`;
    
    // Animate back to starting position
    document.body.style.transform = 'translateX(0)';
    pagePreview.style.transform = 'translateX(-30%)';
    dimOverlay.style.opacity = '0';
    edgeShadow.style.opacity = '0';
    
    // Reset after animation completes
    setTimeout(resetSwipeAnimation, springBackSpeed * 1000);
  }
  
  // Function to reset animation states
  function resetSwipeAnimation() {
    // Reset transitions and transforms
    document.body.style.transition = '';
    document.body.style.transform = '';
    
    pagePreview.style.transition = '';
    pagePreview.style.display = 'none';
    
    dimOverlay.style.transition = '';
    dimOverlay.style.display = 'none';
    
    edgeShadow.style.transition = '';
    edgeShadow.style.display = 'none';
  }
  
  // Easing function for smoother animations (cubic ease-out)
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }
  
  // Update threshold on orientation/resize changes
  window.addEventListener('resize', function() {
    autoCompleteThreshold = window.innerWidth * 0.35;
  });
});
