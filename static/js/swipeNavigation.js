/**
 * Basit sayfa navigasyonu
 */
document.addEventListener('DOMContentLoaded', function() {
  // Geri düğmelerini göster
  const backButtons = document.querySelectorAll('.back-btn, .standard-back-btn, [id^="back-to"], .back-button');
  backButtons.forEach(button => {
    button.style.display = 'block';
  });
});