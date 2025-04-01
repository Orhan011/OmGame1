
// 2048 oyun kodu
document.addEventListener('DOMContentLoaded', function() {
  console.log('2048 oyunu için yeni kod bekleniyor...');
  
  // Oyun yükleniyor mesajını güncelle
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = 'Oyun kodu güncelleniyor, lütfen bekleyin.';
  }
});
