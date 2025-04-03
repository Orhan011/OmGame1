/**
 * Swipe navigation devre dışı bırakıldı
 */
document.addEventListener('DOMContentLoaded', function() {
  // Swipe navigasyon kaldırıldı
  // Sadece geri butonlarını göstermeye devam edelim
  const backButtons = document.querySelectorAll('.back-btn, .standard-back-btn, [id^="back-to"], .back-button');

  backButtons.forEach(button => {
    button.style.display = 'block';
  });
});