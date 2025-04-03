
/**
 * iOS-style swipe back navigation
 * Simulates the natural iOS gesture for going back in browser history
 */
document.addEventListener('DOMContentLoaded', function() {
  // Don't initialize on pages where swiping might interfere with game mechanics
  const gameContainers = document.querySelectorAll('.game-container, .puzzle-container, #gameBoard');
  if (gameContainers.length > 0) return;

  let startX, startY;
  let currentX;
  let swipeStarted = false;
  let threshold = 50; // Minimum distance to trigger back navigation
  let animationFrame;
  
  // Create overlay elements for visual feedback
  const overlay = document.createElement('div');
  overlay.className = 'swipe-overlay';
  overlay.style.display = 'none';
  
  const contentShadow = document.createElement('div');
  contentShadow.className = 'content-shadow';
  contentShadow.style.display = 'none';
  
  const previousPagePreview = document.createElement('div');
  previousPagePreview.className = 'previous-page-preview';
  
  document.body.appendChild(overlay);
  document.body.appendChild(contentShadow);
  document.body.appendChild(previousPagePreview);
  
  // Touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  function handleTouchStart(e) {
    // Only trigger for touches starting from left edge (30px margin)
    if (e.touches[0].clientX > 30) return;
    
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = startX;
    swipeStarted = true;
  }
  
  function handleTouchMove(e) {
    if (!swipeStarted) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // Vertical scrolling check - abort swipe if vertical movement is dominant
    if (!overlay.style.display || overlay.style.display === 'none') {
      const verticalDiff = Math.abs(touchY - startY);
      const horizontalDiff = Math.abs(touchX - startX);
      
      if (verticalDiff > horizontalDiff && verticalDiff > 10) {
        swipeStarted = false;
        resetSwipeState();
        return;
      }
    }
    
    // Only prevent default if this is a confirmed horizontal swipe
    if (touchX > startX + 10) {
      e.preventDefault();
    }
    
    currentX = touchX;
    const swipeDistance = currentX - startX;
    
    // Start showing swipe effect only if swiping right
    if (swipeDistance > 10) {
      if (overlay.style.display === 'none') {
        overlay.style.display = 'block';
        contentShadow.style.display = 'block';
        previousPagePreview.style.display = 'block';
      }
      
      // Calculate progress percentage (max at 75% of screen width)
      const maxSwipe = window.innerWidth * 0.75;
      const progress = Math.min(swipeDistance / maxSwipe, 1);
      
      // Update the swipe animation
      updateSwipeAnimation(progress);
    }
  }
  
  function handleTouchEnd(e) {
    if (!swipeStarted) return;
    swipeStarted = false;
    
    const swipeDistance = currentX - startX;
    
    // If we swiped far enough, navigate back
    if (swipeDistance > threshold) {
      completeSwipeAnimation(() => {
        window.history.back();
      });
    } else {
      // Otherwise, reset the swipe state with animation
      cancelSwipeAnimation();
    }
  }
  
  function updateSwipeAnimation(progress) {
    // Cancel any previous animation frame
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    animationFrame = requestAnimationFrame(() => {
      // Move page content
      document.body.style.transform = `translateX(${progress * window.innerWidth * 0.75}px)`;
      
      // Fade overlay
      overlay.style.opacity = 0.3 * progress;
      
      // Add shadow to current page
      contentShadow.style.opacity = 0.5 * progress;
      
      // Show previous page preview
      previousPagePreview.style.transform = `translateX(${-window.innerWidth * 0.2 * (1 - progress)}px)`;
      previousPagePreview.style.opacity = progress;
    });
  }
  
  function completeSwipeAnimation(callback) {
    // Animate to fully swiped state
    const duration = 300; // ms
    const startTime = performance.now();
    const startTransform = parseFloat(document.body.style.transform.replace('translateX(', '').replace('px)', '')) || 0;
    const targetTransform = window.innerWidth;
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);
      
      document.body.style.transform = `translateX(${startTransform + (targetTransform - startTransform) * eased}px)`;
      overlay.style.opacity = 0.3 + 0.7 * eased;
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        resetSwipeState();
        if (callback) callback();
      }
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function cancelSwipeAnimation() {
    const duration = 300; // ms
    const startTime = performance.now();
    const startTransform = parseFloat(document.body.style.transform.replace('translateX(', '').replace('px)', '')) || 0;
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);
      
      document.body.style.transform = `translateX(${startTransform * (1 - eased)}px)`;
      overlay.style.opacity = 0.3 * (1 - eased);
      contentShadow.style.opacity = 0.5 * (1 - eased);
      previousPagePreview.style.transform = `translateX(${-window.innerWidth * 0.2 * eased}px)`;
      previousPagePreview.style.opacity = 1 - eased;
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        resetSwipeState();
      }
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function resetSwipeState() {
    document.body.style.transform = '';
    overlay.style.display = 'none';
    contentShadow.style.display = 'none';
    previousPagePreview.style.display = 'none';
    overlay.style.opacity = 0;
    contentShadow.style.opacity = 0;
    previousPagePreview.style.opacity = 0;
    previousPagePreview.style.transform = '';
  }
  
  // Easing function for smooth animation
  function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
  }
});
