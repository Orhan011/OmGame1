
/**
 * Remove back buttons from all game pages since we have swipe back gesture
 * Keeps critical back buttons where needed
 */
document.addEventListener('DOMContentLoaded', function() {
  // Swipe geri özelliğinin aktif olup olmadığını kontrol et
  const isSwipeEnabled = !document.querySelector('.game-container, .puzzle-container, #gameBoard, .memory-game, [data-disable-swipe="true"]');
  
  // Eğer swipe aktifse ve mobil cihazsa geri tuşlarını kaldır
  const isMobile = window.innerWidth <= 991;
  
  if (isSwipeEnabled && isMobile) {
    // Find and remove all back buttons except critical ones
    const backButtons = document.querySelectorAll('.back-btn, .standard-back-btn, [id^="back-to"], .back-button');
    
    backButtons.forEach(button => {
      // Kritik geri tuşlarını atla (data-critical-back-button özelliği ile işaretlenmiş)
      if (!button.hasAttribute('data-critical-back-button')) {
        button.style.display = 'none';
      }
    });
  }
});
