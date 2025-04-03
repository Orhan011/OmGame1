
/**
 * iOS-style swipe back navigation - Enhanced Version
 * Simulates the natural iOS gesture for going back in browser history
 */
document.addEventListener('DOMContentLoaded', function() {
  // Don't initialize on pages where swiping might interfere with game mechanics
  const gameContainers = document.querySelectorAll('.game-container, .puzzle-container, #gameBoard, .memory-game, [data-disable-swipe="true"]');
  if (gameContainers.length > 0) return;

  let startX, startY;
  let currentX;
  let swipeStarted = false;
  let threshold = 50; // Minimum distance to trigger back navigation
  let animationFrame;
  let hasHistory = window.history.length > 1;

  // Don't initialize if there's no history to go back to
  if (!hasHistory) return;

  // Create overlay elements for visual feedback if they don't exist
  let overlay = document.querySelector('.swipe-overlay');
  let contentShadow = document.querySelector('.content-shadow');
  let previousPagePreview = document.querySelector('.previous-page-preview');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'swipe-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
  }

  if (!contentShadow) {
    contentShadow = document.createElement('div');
    contentShadow.className = 'content-shadow';
    contentShadow.style.display = 'none';
    document.body.appendChild(contentShadow);
  }

  if (!previousPagePreview) {
    previousPagePreview = document.createElement('div');
    previousPagePreview.className = 'previous-page-preview';
    document.body.appendChild(previousPagePreview);
  }

  // Touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

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
        document.body.classList.add('swipe-active');
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
      // Apply 3D transform for better performance
      document.body.style.transform = `translate3d(${progress * window.innerWidth * 0.75}px, 0, 0)`;

      // Fade overlay
      overlay.style.opacity = 0.3 * progress;

      // Add shadow to current page
      contentShadow.style.opacity = 0.5 * progress;

      // Show previous page preview
      previousPagePreview.style.transform = `translate3d(${-window.innerWidth * 0.2 * (1 - progress)}px, 0, 0)`;
      previousPagePreview.style.opacity = progress;
    });
  }

  function completeSwipeAnimation(callback) {
    // Animate to fully swiped state
    const duration = 300; // ms
    const startTime = performance.now();
    const startTransform = parseFloat(document.body.style.transform.replace('translate3d(', '').replace('px, 0, 0)', '')) || 0;
    const targetTransform = window.innerWidth;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);

      document.body.style.transform = `translate3d(${startTransform + (targetTransform - startTransform) * eased}px, 0, 0)`;
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
    const startTransform = parseFloat(document.body.style.transform.replace('translate3d(', '').replace('px, 0, 0)', '')) || 0;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);

      document.body.style.transform = `translate3d(${startTransform * (1 - eased)}px, 0, 0)`;
      overlay.style.opacity = 0.3 * (1 - eased);
      contentShadow.style.opacity = 0.5 * (1 - eased);
      previousPagePreview.style.transform = `translate3d(${-window.innerWidth * 0.2 * eased}px, 0, 0)`;
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
    document.body.classList.remove('swipe-active');
  }

  // Easing functions
  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  // Debug info - check if the swipe navigation is initialized
  console.log('iOS Swipe Back Navigation initialized');
});
