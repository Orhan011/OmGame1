
/**
 * Bu script, kullanıcılar kaydırarak geri gitme özelliğini kullandığı için
 * bazı durumlarda ekstra geri butonlarını kaldırmak veya değiştirmek için kullanılabilir.
 * Şu anda devre dışı bırakılmıştır, ama özelleştirilebilir.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Not: Geri butonu kaldırma işlevi devre dışı bırakıldı
  // iOS tarzı kaydırma navigasyonu tercih edildiği için
  
  // Eğer özel geri butonlarını değiştirmek isterseniz, 
  // aşağıdaki kod bloğunu etkinleştirebilirsiniz:
  
  /*
  const backButtons = document.querySelectorAll('.back-button, .return-button, .go-back');
  
  backButtons.forEach(btn => {
    // Butonların görünümünü değiştir (tamamen kaldırmak yerine)
    btn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    btn.title = "Geri dönmek için ekranın solundan sağa kaydırın";
    
    // Orijinal işlevi koru
    const originalClick = btn.onclick;
    
    // Yeni tıklama olayı ekle
    btn.onclick = function(e) {
      e.preventDefault();
      
      // Kullanıcıya ipucu göster
      showSwipeHint();
      
      // İsteğe bağlı olarak, orijinal tıklama işlevini de çağırabilirsiniz
      // if (originalClick) originalClick.call(this, e);
      
      return false;
    };
  });
  
  function showSwipeHint() {
    const hint = document.createElement('div');
    hint.className = 'swipe-hint';
    hint.innerHTML = `
      <div class="swipe-hint-inner">
        <i class="fas fa-hand-point-right"></i>
        <span>Geri dönmek için ekranın solundan sağa kaydırın</span>
      </div>
    `;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
      hint.classList.add('visible');
      
      setTimeout(() => {
        hint.classList.remove('visible');
        setTimeout(() => hint.remove(), 500);
      }, 2500);
    }, 100);
  }
  */
  
  console.log('Back button modification script has been initialized');
});
