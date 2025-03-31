
/**
 * Remove back buttons from all game pages
 */
document.addEventListener('DOMContentLoaded', function() {
  // Find and remove all back buttons
  const backButtons = document.querySelectorAll('.back-btn, .standard-back-btn, [id^="back-to"], .back-button');
  
  backButtons.forEach(button => {
    button.style.display = 'none';
  });
});
