
/**
 * iOS 18+ Premium Swipe Navigation System
 * Enhanced with real Apple Safari/iOS Edge Swipe animation physics
 */
document.addEventListener('DOMContentLoaded', function() {
  // Core variables and configuration
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 70; // Minimum swipe distance
  const maxSwipeTime = 350; // Maximum swipe time (ms)
  const edgeSize = 30; // Edge area size (pixels)
  let touchStartTime = 0;
  let touchEndTime = 0;
  let isSwipingBack = false;
  let initialScrollY = 0;
  let velocity = 0; // Velocity variable
  let lastX = 0;
  let lastTime = 0;
  
  // Animation state
  let animationId = null;
  
  // Main application content reference
  const mainContent = document.querySelector('main') || document.querySelector('.container') || document.querySelector('#content') || document.body;
  
  // Animation container
  const swipeContainer = document.createElement('div');
  swipeContainer.className = 'ios-swipe-container';
  swipeContainer.style.position = 'fixed';
  swipeContainer.style.top = '0';
  swipeContainer.style.left = '0';
  swipeContainer.style.width = '100%';
  swipeContainer.style.height = '100%';
  swipeContainer.style.zIndex = '99999';
  swipeContainer.style.visibility = 'hidden';
  swipeContainer.style.overflow = 'hidden';
  swipeContainer.style.pointerEvents = 'none';
  document.body.appendChild(swipeContainer);

  // Dark overlay layer (between current and previous page)
  const darkOverlay = document.createElement('div');
  darkOverlay.className = 'ios-swipe-overlay';
  darkOverlay.style.position = 'absolute';
  darkOverlay.style.top = '0';
  darkOverlay.style.left = '0';
  darkOverlay.style.width = '100%';
  darkOverlay.style.height = '100%';
  darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
  darkOverlay.style.transition = 'none';
  swipeContainer.appendChild(darkOverlay);

  // Previous page preview panel
  const prevPagePreview = document.createElement('div');
  prevPagePreview.className = 'ios-prev-page-preview';
  prevPagePreview.style.position = 'absolute';
  prevPagePreview.style.top = '0';
  prevPagePreview.style.left = '-100%';
  prevPagePreview.style.width = '86%'; // iOS-style width
  prevPagePreview.style.height = '100%';
  prevPagePreview.style.backgroundColor = getBackgroundColor();
  prevPagePreview.style.boxShadow = '0 0 28px rgba(0, 0, 0, 0.25)';
  prevPagePreview.style.borderTopRightRadius = '13px';
  prevPagePreview.style.borderBottomRightRadius = '13px';
  prevPagePreview.style.transform = 'translateX(0)';
  prevPagePreview.style.willChange = 'transform';
  prevPagePreview.style.overflow = 'hidden';
  
  // Right edge shadow
  const gradient = document.createElement('div');
  gradient.style.position = 'absolute';
  gradient.style.top = '0';
  gradient.style.right = '0';
  gradient.style.width = '5px';
  gradient.style.height = '100%';
  gradient.style.background = 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1))';
  gradient.style.pointerEvents = 'none';
  gradient.style.opacity = '0';
  prevPagePreview.appendChild(gradient);

  // Back arrow icon
  const backArrow = document.createElement('div');
  backArrow.className = 'ios-back-arrow';
  backArrow.style.position = 'absolute';
  backArrow.style.top = '50%';
  backArrow.style.left = '15px';
  backArrow.style.width = '12px';
  backArrow.style.height = '12px';
  backArrow.style.borderTop = '2px solid #007aff';
  backArrow.style.borderLeft = '2px solid #007aff';
  backArrow.style.transform = 'translateY(-50%) rotate(-45deg) scale(1.1)';
  backArrow.style.opacity = '0';
  backArrow.style.transition = 'opacity 0.15s ease';
  backArrow.style.zIndex = '5';
  prevPagePreview.appendChild(backArrow);

  // Fake previous page header area
  const fakeHeader = document.createElement('div');
  fakeHeader.className = 'ios-fake-header';
  fakeHeader.style.position = 'absolute';
  fakeHeader.style.top = '0';
  fakeHeader.style.left = '0';
  fakeHeader.style.width = '100%';
  fakeHeader.style.height = '56px';
  fakeHeader.style.backgroundColor = isDarkMode() ? 'rgba(29, 29, 31, 0.85)' : 'rgba(248, 248, 248, 0.85)';
  fakeHeader.style.backdropFilter = 'blur(12px)';
  fakeHeader.style.WebkitBackdropFilter = 'blur(12px)';
  fakeHeader.style.borderBottom = isDarkMode() ? '0.5px solid rgba(255, 255, 255, 0.12)' : '0.5px solid rgba(0, 0, 0, 0.12)';
  fakeHeader.style.display = 'flex';
  fakeHeader.style.alignItems = 'center';
  fakeHeader.style.padding = '0 15px';
  fakeHeader.style.zIndex = '2';

  // Previous page title
  const prevPageTitle = document.createElement('div');
  prevPageTitle.className = 'ios-prev-page-title';
  prevPageTitle.style.color = isDarkMode() ? '#fff' : '#000';
  prevPageTitle.style.fontSize = '17px';
  prevPageTitle.style.fontWeight = '500';
  prevPageTitle.style.textAlign = 'center';
  prevPageTitle.style.width = '100%';
  prevPageTitle.style.overflow = 'hidden';
  prevPageTitle.style.textOverflow = 'ellipsis';
  prevPageTitle.style.whiteSpace = 'nowrap';
  prevPageTitle.style.opacity = '0';
  prevPageTitle.style.transform = 'translateX(15px)';
  prevPageTitle.style.transition = 'none';
  prevPageTitle.textContent = 'Önceki Sayfa';

  // Determine title with smart system
  const pageTitle = document.title || 'Anasayfa';
  determinePreviousPageTitle();

  fakeHeader.appendChild(prevPageTitle);
  prevPagePreview.appendChild(fakeHeader);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.className = 'ios-content-area';
  contentArea.style.position = 'absolute';
  contentArea.style.top = '56px';
  contentArea.style.left = '0';
  contentArea.style.width = '100%';
  contentArea.style.height = 'calc(100% - 56px)';
  contentArea.style.overflow = 'hidden';
  contentArea.style.backgroundColor = getBackgroundColor();
  prevPagePreview.appendChild(contentArea);

  // Fake previous page content
  const fakePrevPageContent = document.createElement('div');
  fakePrevPageContent.className = 'ios-prev-page-content';
  fakePrevPageContent.style.width = '100%';
  fakePrevPageContent.style.height = '100%';
  fakePrevPageContent.style.paddingBottom = '40px';
  contentArea.appendChild(fakePrevPageContent);

  swipeContainer.appendChild(prevPagePreview);

  // Current page snapshot for 3D effect
  const currentPageSnapshot = document.createElement('div');
  currentPageSnapshot.className = 'ios-current-page-snapshot';
  currentPageSnapshot.style.position = 'absolute';
  currentPageSnapshot.style.top = '0';
  currentPageSnapshot.style.right = '0';
  currentPageSnapshot.style.width = '100%';
  currentPageSnapshot.style.height = '100%';
  currentPageSnapshot.style.backgroundColor = getBackgroundColor();
  currentPageSnapshot.style.transform = 'translateX(0)';
  currentPageSnapshot.style.willChange = 'transform';
  currentPageSnapshot.style.zIndex = '3';
  currentPageSnapshot.style.boxShadow = '-5px 0 25px rgba(0, 0, 0, 0.1)';
  currentPageSnapshot.style.overflow = 'hidden';
  currentPageSnapshot.style.visibility = 'hidden';
  swipeContainer.appendChild(currentPageSnapshot);

  // Left edge indicator (shows user swipe is available)
  const edgeIndicator = document.createElement('div');
  edgeIndicator.className = 'ios-edge-indicator';
  edgeIndicator.style.position = 'fixed';
  edgeIndicator.style.top = '0';
  edgeIndicator.style.left = '0';
  edgeIndicator.style.width = '3px';
  edgeIndicator.style.height = '100%';
  edgeIndicator.style.background = 'linear-gradient(to right, rgba(0, 122, 255, 0.18), rgba(0, 122, 255, 0))';
  edgeIndicator.style.pointerEvents = 'none';
  edgeIndicator.style.opacity = '0';
  document.body.appendChild(edgeIndicator);

  // Show edge indicator briefly when page loads
  if (window.history.length > 1) {
    setTimeout(() => {
      edgeIndicator.style.transition = 'opacity 0.6s ease';
      edgeIndicator.style.opacity = '1';

      setTimeout(() => {
        edgeIndicator.style.opacity = '0';
      }, 1600);
    }, 800);
  }

  // Touch event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

  // Handle touch start
  function handleTouchStart(event) {
    // Don't affect game controls by checking some elements
    const target = event.target;
    if (target.closest('.game-container, canvas, .control-btn, .simon-pad, input, button, .card, audio, video, [role="button"]')) {
      return; // Disable swipe feature on interactive elements
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    lastX = touchStartX;
    lastTime = Date.now();
    touchStartTime = lastTime;
    initialScrollY = window.scrollY;
    velocity = 0;

    // Check if touch is on left edge
    if (touchStartX <= edgeSize) {
      // Only enable edge swipe if history exists
      if (window.history.length > 1) {
        isSwipingBack = true;

        // Prepare animation elements
        swipeContainer.style.visibility = 'visible';
        setupFakePreviousPage();
        
        // Create current page snapshot for 3D effect
        createCurrentPageSnapshot();

        // Prevent default behavior
        event.preventDefault();
      }
    }
  }
  
  // Create current page snapshot for realistic 3D transition
  function createCurrentPageSnapshot() {
    // Create a live snapshot of current page
    currentPageSnapshot.innerHTML = '';
    currentPageSnapshot.style.visibility = 'visible';
    
    try {
      // Clone current visible content to snapshot
      const contentClone = mainContent.cloneNode(true);
      
      // Adjust for proper positioning
      contentClone.style.position = 'absolute';
      contentClone.style.top = '0';
      contentClone.style.left = '0';
      contentClone.style.width = '100%';
      contentClone.style.height = '100%';
      contentClone.style.overflow = 'hidden';
      contentClone.style.transform = 'translateZ(0)';
      
      // Remove any interactive elements from the clone
      const interactiveElements = contentClone.querySelectorAll('button, input, select, textarea, [role="button"]');
      interactiveElements.forEach(el => {
        el.style.pointerEvents = 'none';
      });
      
      currentPageSnapshot.appendChild(contentClone);
      
      // Position the snapshot at same scroll position
      if (window.scrollY > 0) {
        contentClone.style.transform = `translateY(-${window.scrollY}px)`;
      }
    } catch (error) {
      // Fallback to basic color if cloning fails
      currentPageSnapshot.style.backgroundColor = getBackgroundColor();
    }
  }

  // Setup fake previous page
  function setupFakePreviousPage() {
    // Adjust style based on current color theme
    updateColorScheme();

    // Create previous page content
    generatePlaceholderContent();

    // Show title with slight delay (iOS-style animation)
    setTimeout(() => {
      prevPageTitle.style.opacity = '1';
      prevPageTitle.style.transform = 'translateX(0)';
    }, 120);
  }

  // Determine previous page title
  function determinePreviousPageTitle() {
    // Determine title from referrer URL or other methods
    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        const pathSegments = referrerUrl.pathname.split('/').filter(Boolean);
        
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1].replace(/\.html$/, "");
          
          if (lastSegment === 'index' || lastSegment === '') {
            prevPageTitle.textContent = 'Anasayfa';
          } else {
            // Create title from URL
            const cleanTitle = lastSegment
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
              
            prevPageTitle.textContent = cleanTitle;
          }
        } else {
          prevPageTitle.textContent = 'Anasayfa';
        }
      } else {
        // Determine title with logical assumption
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('games/')) {
          prevPageTitle.textContent = 'Oyunlar';
        } else if (currentPath.includes('profile')) {
          prevPageTitle.textContent = 'Anasayfa';
        } else {
          prevPageTitle.textContent = 'Geri';
        }
      }
    } catch (e) {
      prevPageTitle.textContent = 'Geri';
    }
  }

  // Generate placeholder content
  function generatePlaceholderContent() {
    fakePrevPageContent.innerHTML = '';

    // iOS-style list content
    const listContainer = document.createElement('div');
    listContainer.style.padding = '12px 15px';

    // Generate random number of list items
    const numItems = Math.floor(Math.random() * 4) + 5;

    for (let i = 0; i < numItems; i++) {
      const listItem = document.createElement('div');
      listItem.style.padding = '14px 0';
      listItem.style.borderBottom = isDarkMode() ? 
        '0.5px solid rgba(255, 255, 255, 0.12)' : 
        '0.5px solid rgba(0, 0, 0, 0.08)';
      listItem.style.display = 'flex';
      listItem.style.alignItems = 'center';

      // Icon area
      const iconPlaceholder = document.createElement('div');
      iconPlaceholder.style.width = '36px';
      iconPlaceholder.style.height = '36px';
      iconPlaceholder.style.borderRadius = '9px';
      iconPlaceholder.style.backgroundColor = getRandomPastelColor();
      iconPlaceholder.style.marginRight = '16px';
      iconPlaceholder.style.flexShrink = '0';

      // Text area
      const textContainer = document.createElement('div');
      textContainer.style.flex = '1';

      // Title
      const title = document.createElement('div');
      title.style.height = '14px';
      title.style.borderRadius = '4px';
      title.style.backgroundColor = isDarkMode() ? 
        'rgba(255, 255, 255, 0.15)' : 
        'rgba(0, 0, 0, 0.07)';
      title.style.width = `${40 + Math.random() * 40}%`;
      title.style.marginBottom = '8px';

      // Subtitle
      const subtitle = document.createElement('div');
      subtitle.style.height = '10px';
      subtitle.style.borderRadius = '4px';
      subtitle.style.backgroundColor = isDarkMode() ? 
        'rgba(255, 255, 255, 0.1)' : 
        'rgba(0, 0, 0, 0.05)';
      subtitle.style.width = `${60 + Math.random() * 30}%`;

      textContainer.appendChild(title);
      textContainer.appendChild(subtitle);

      // Forward chevron
      const chevron = document.createElement('div');
      chevron.style.width = '8px';
      chevron.style.height = '8px';
      chevron.style.borderTop = isDarkMode() ? 
        '1.5px solid rgba(255, 255, 255, 0.3)' : 
        '1.5px solid rgba(0, 0, 0, 0.2)';
      chevron.style.borderRight = isDarkMode() ? 
        '1.5px solid rgba(255, 255, 255, 0.3)' : 
        '1.5px solid rgba(0, 0, 0, 0.2)';
      chevron.style.transform = 'rotate(45deg)';
      chevron.style.margin = '0 5px';

      listItem.appendChild(iconPlaceholder);
      listItem.appendChild(textContainer);
      listItem.appendChild(chevron);

      listContainer.appendChild(listItem);
    }

    fakePrevPageContent.appendChild(listContainer);
  }

  // Handle touch movement
  function handleTouchMove(event) {
    if (!isSwipingBack) return;

    // Prevent default behavior
    event.preventDefault();

    const now = Date.now();
    const dt = now - lastTime;

    touchCurrentX = event.touches[0].clientX;
    touchCurrentY = event.touches[0].clientY;

    // Calculate horizontal and vertical distance
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    // Cancel if vertical swipe is much greater than horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX) * 2.2 && Math.abs(deltaX) < 40) {
      handleTouchCancel();
      return;
    }

    // Calculate velocity (pixels/ms)
    if (dt > 0) {
      const instantVelocity = (touchCurrentX - lastX) / dt;
      // Calculate velocity more smoothly
      velocity = instantVelocity * 0.6 + velocity * 0.4;
    }

    lastX = touchCurrentX;
    lastTime = now;

    if (deltaX > 0) {
      // Calculate progress based on maximum distance
      const maxDistance = window.innerWidth * 0.88;
      let progress = Math.min(deltaX / maxDistance, 1);

      // Curve adjustment
      // This curve gives the real iOS system motion feel
      progress = cubicBezier(0.25, 0.46, 0.45, 0.94, progress);

      // Apply transformations to elements
      const translateX = Math.min(deltaX, maxDistance);
      prevPagePreview.style.transform = `translateX(${translateX}px)`;
      
      // 3D perspective effect (iOS 18+ style)
      currentPageSnapshot.style.visibility = 'visible';
      currentPageSnapshot.style.transform = `translate3d(${translateX}px, 0, 0)`;
      
      // Parallax effect - current page moves slightly faster
      mainContent.style.transform = `translate3d(${translateX * 0.05}px, 0, 0)`;
      mainContent.style.transition = 'none';

      // Show shadow
      gradient.style.opacity = Math.min(1, progress * 1.4);

      // Darken overlay
      const alpha = Math.max(0, Math.min(0.4, progress * 0.4)); // 0.4 maximum opacity
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;

      // Show back arrow
      backArrow.style.opacity = Math.min(1, progress * 1.5);

      // Move title
      prevPageTitle.style.opacity = Math.min(1, progress * 1.5);
      prevPageTitle.style.transform = `translateX(${Math.max(0, 15 - progress * 15)}px)`;

      // Add slight spring effect if progress exceeds 90%
      if (progress > 0.85) {
        const overProgress = (progress - 0.85) / 0.15;
        // Gradual elastic effect
        const elasticity = Math.sin(overProgress * Math.PI / 2) * Math.min(12, overProgress * 22);
        prevPagePreview.style.transform = `translateX(${translateX + elasticity}px)`;
        currentPageSnapshot.style.transform = `translate3d(${translateX + elasticity}px, 0, 0)`;
      }
    }
  }

  // Handle touch end
  function handleTouchEnd(event) {
    if (!isSwipingBack) return;

    touchEndX = touchCurrentX;
    touchEndY = touchCurrentY;
    touchEndTime = Date.now();

    // Calculate swipe distance and time
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;
    const swipeSpeed = swipeDistance / swipeTime;

    // If swipe distance or velocity is sufficient (iOS style)
    const screenWidth = window.innerWidth;
    const minDistance = screenWidth * 0.3; // 30% of screen
    const minVelocity = 0.5; // Pixels/ms (fast movement)
    
    // Get current position
    const currentPosition = parseFloat(getComputedStyle(prevPagePreview).transform.split(',')[4]) || 0;

    if (swipeDistance > minDistance || (swipeDistance > screenWidth * 0.12 && velocity > minVelocity)) {
      // Complete back navigation animation
      completeSwipeAnimation(currentPosition);
    } else {
      // Cancel back navigation
      cancelSwipeWithAnimation(currentPosition);
    }

    isSwipingBack = false;
  }

  // Complete swipe animation
  function completeSwipeAnimation(currentPosition) {
    // Cancel current animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    const targetX = window.innerWidth + 20; // Slightly extend
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    let duration;
    
    // Adjust duration based on movement intensity
    if (velocity > 1.8) {
      // Fast movement - complete much faster
      duration = 180;
    } else if (velocity > 0.9) {
      // Medium speed movement
      duration = 230;
    } else {
      // Slow movement
      duration = 280;
    }

    // Realistic bezier timing function for iOS spring effect
    function animate() {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // iOS curve - accelerates at start, then decelerates
      const easedProgress = cubicBezier(0.22, 0.84, 0.38, 0.96, rawProgress);
      
      const newX = currentPosition + (distance * easedProgress);

      // Update elements
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      currentPageSnapshot.style.transform = `translate3d(${newX}px, 0, 0)`;
      mainContent.style.transform = `translate3d(${newX * 0.05}px, 0, 0)`;
      
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * (1 - easedProgress)})`;
      gradient.style.opacity = Math.max(0, 1 - easedProgress * 1.5);
      
      backArrow.style.opacity = Math.max(0, 1 - easedProgress * 1.5);
      prevPageTitle.style.opacity = Math.max(0, 1 - easedProgress * 1.8);

      if (rawProgress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animation completed, go to previous page
        window.history.back();
        resetSwipeElements();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // Handle touch cancel
  function handleTouchCancel() {
    if (isSwipingBack) {
      const currentPosition = parseFloat(getComputedStyle(prevPagePreview).transform.split(',')[4]) || 0;
      cancelSwipeWithAnimation(currentPosition);
      isSwipingBack = false;
    }
  }

  // Cancel swipe and show back animation
  function cancelSwipeWithAnimation(currentPosition) {
    // Cancel current animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    const targetX = 0;
    const distance = targetX - currentPosition;
    const startTime = Date.now();
    let duration = 260; // ms

    // Speed up animation if distance is very short
    if (Math.abs(currentPosition) < 60) {
      duration = 160;
    }

    // Realistic timing function for iOS retraction animation
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Advanced return curve for real iOS motion feel
      const easedProgress = cubicBezier(0.25, 0.74, 0.22, 0.99, progress);
      
      let newX = currentPosition * (1 - easedProgress);
      
      // Add advanced elastic effect (between 0.7-0.95 progress)
      if (progress > 0.7 && progress < 0.95) {
        const springEffect = Math.sin((progress - 0.7) * 8) * 5 * (1 - progress);
        newX += springEffect;
      }

      // Update all positions
      prevPagePreview.style.transform = `translateX(${newX}px)`;
      currentPageSnapshot.style.transform = `translate3d(${newX}px, 0, 0)`;
      mainContent.style.transform = `translate3d(${newX * 0.05}px, 0, 0)`;
      
      // Remove background darkening
      const alphaProgress = cubicBezier(0.4, 0, 0.2, 1, easedProgress);
      darkOverlay.style.backgroundColor = `rgba(0, 0, 0, ${0.4 * (1 - alphaProgress)})`;
      
      // Update other elements
      backArrow.style.opacity = Math.max(0, 1 - easedProgress * 1.8);
      prevPageTitle.style.opacity = Math.max(0, 1 - easedProgress * 2);
      prevPageTitle.style.transform = `translateX(${(easedProgress * 15)}px)`;
      gradient.style.opacity = Math.max(0, 1 - easedProgress * 1.5);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Animation completed
        resetSwipeElements();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // Reset swipe elements
  function resetSwipeElements() {
    // Clear animation
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Return all elements to default positions
    prevPagePreview.style.transform = 'translateX(0)';
    prevPagePreview.style.transition = 'none';
    currentPageSnapshot.style.transform = 'translate3d(0, 0, 0)';
    currentPageSnapshot.style.visibility = 'hidden';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    darkOverlay.style.transition = 'none';
    
    mainContent.style.transform = 'translate3d(0, 0, 0)';
    mainContent.style.transition = 'none';
    
    backArrow.style.opacity = '0';
    prevPageTitle.style.opacity = '0';
    prevPageTitle.style.transform = 'translateX(15px)';
    gradient.style.opacity = '0';
    
    // Hide container
    swipeContainer.style.visibility = 'hidden';
    
    // Clear content
    fakePrevPageContent.innerHTML = '';
    currentPageSnapshot.innerHTML = '';
  }

  // Helper functions
  function getRandomPastelColor() {
    // Darker colors for dark mode, pastel for light mode
    if (isDarkMode()) {
      // More vibrant colors for dark mode
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 65%, 35%)`;
    } else {
      // Pastel colors for light mode
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 70%, 80%)`;
    }
  }

  // Dark mode detection
  function isDarkMode() {
    // Check user preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Check if page background color is dark
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg) {
      const rgb = bodyBg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        // If average of RGB values is less than 128, it's dark mode
        const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
        return brightness < 128;
      }
    }
    
    // Check if page has .dark-theme class
    if (document.documentElement.classList.contains('dark-theme') || 
        document.body.classList.contains('dark-theme')) {
      return true;
    }
    
    return false;
  }

  // Determine background color
  function getBackgroundColor() {
    if (isDarkMode()) {
      return '#1c1c1e'; // iOS dark mode background
    } else {
      return '#f2f2f7'; // iOS light mode background
    }
  }

  // Update color scheme
  function updateColorScheme() {
    const isDark = isDarkMode();
    
    prevPagePreview.style.backgroundColor = isDark ? '#1c1c1e' : '#f2f2f7';
    contentArea.style.backgroundColor = isDark ? '#1c1c1e' : '#f2f2f7';
    fakeHeader.style.backgroundColor = isDark ? 'rgba(29, 29, 31, 0.85)' : 'rgba(248, 248, 248, 0.85)';
    fakeHeader.style.borderBottom = isDark ? '0.5px solid rgba(255, 255, 255, 0.12)' : '0.5px solid rgba(0, 0, 0, 0.12)';
    prevPageTitle.style.color = isDark ? '#fff' : '#000';
    
    backArrow.style.borderColor = '#007aff'; // Keep iOS blue
  }

  // Cubic bezier easing function
  function cubicBezier(x1, y1, x2, y2, t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    
    // Calculate t value using Newton-Raphson iteration method
    // This mathematical algorithm mimics iOS animation curves
    let x = t, i;
    const epsilon = 1e-6;
    
    for (i = 0; i < 8; i++) {
      const currentT = getCubicBezierPoint(x1, x2, x);
      const derivative = getCubicBezierDerivative(x1, x2, x);
      
      if (Math.abs(currentT - t) < epsilon) break;
      
      x = x - (currentT - t) / derivative;
      
      if (x <= 0) x = 0;
      if (x >= 1) x = 1;
    }
    
    return getCubicBezierPoint(y1, y2, x);
  }
  
  function getCubicBezierPoint(p1, p2, t) {
    return 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  }
  
  function getCubicBezierDerivative(p1, p2, t) {
    return 3 * (1 - t) * (1 - t) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (1 - p2);
  }
});
