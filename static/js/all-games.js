document.addEventListener('DOMContentLoaded', function() {
  // Tüm favorilere ekleme butonlarını seç
  const favoriteButtons = document.querySelectorAll('.favorite-toggle-btn');
  
  // Her buton için olay dinleyicisi ekle
  favoriteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Oyun bilgilerini al
      const gameType = this.getAttribute('data-game-type');
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // Favoriyi kaldır
        fetch('/remove-favorite-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_type: gameType })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Butonu güncelle
            this.classList.remove('active');
            showToast('Favorilerden kaldırıldı', 'info');
          } else {
            showToast(data.error || 'Bir hata oluştu', 'error');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showToast('Bağlantı hatası', 'error');
        });
      } else {
        // Favoriye ekle
        fetch('/add-favorite-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_type: gameType })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Butonu güncelle
            this.classList.add('active');
            showToast('Favorilere eklendi', 'success');
          } else {
            // Hata durumunda
            if (data.error && data.error.includes('En fazla')) {
              showLimitWarning();
            } else {
              showToast(data.error || 'Bir hata oluştu', 'error');
            }
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showToast('Bağlantı hatası', 'error');
        });
      }
    });
  });
  
  // Toast bildirim göster
  function showToast(message, type) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'),
      title: message,
      showConfirmButton: false,
      timer: 3000
    });
  }
  
  // Limit uyarısı göster
  function showLimitWarning() {
    Swal.fire({
      title: 'Favori Sınırı',
      text: 'Ana sayfada en fazla 4 favori oyun gösterebilirsiniz. Başka bir oyunu kaldırmak ister misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, yönet',
      cancelButtonText: 'Hayır'
    }).then((result) => {
      if (result.isConfirmed) {
        // Ana sayfaya yönlendir
        window.location.href = '/';
      }
    });
  }
});
