
/**
 * Liderlik Tablosu Yöneticisi
 * Modern, camsı tasarım için geliştirilmiş JS
 */

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
  console.log('Liderlik tablosu modülü yükleniyor...');

  // Liderlik tablosunu yükle
  loadLeaderboard();

  // Yenileme butonunu tanımla
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      this.querySelector('i').classList.add('spin-animation');
      const buttonText = this.innerHTML;
      this.innerHTML = '<i class="fas fa-sync-alt spin-animation"></i> Yenileniyor...';
      
      loadLeaderboard().then(() => {
        setTimeout(() => {
          this.innerHTML = buttonText;
          this.querySelector('i').classList.remove('spin-animation');
        }, 800);
      });
    });
  }

  // Her 60 saniyede bir liderlik tablosunu yenile
  setInterval(function() {
    loadLeaderboard();
    console.log("Skor tablosu yenilendi - " + new Date().toLocaleTimeString());
  }, 60000);
});

// Liderlik tablosunu yükle - Promise döndürür
function loadLeaderboard() {
  const container = document.getElementById('leaderboardRows');
  if (!container) return Promise.resolve();

  console.log('Liderlik tablosu yükleniyor...');

  // Yükleniyor göstergesini göster
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Liderlik tablosu yükleniyor...</p>
    </div>
  `;

  // API'den verileri al - sadece ilk 10 kullanıcı
  return fetch('/api/scores/aggregated?limit=10&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        throw new Error('API yanıtı başarısız: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log('API yanıtı alındı');

      // Veri yoksa bilgi mesajı göster
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-trophy"></i>
            <h3>Henüz skor kaydı bulunmuyor</h3>
            <p>Oyun oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }

      console.log('Kullanıcı skorları alındı:', data.length);

      // Skorları sırala
      data.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

      // HTML çıktısını oluştur
      let html = '';

      // İlk 10 kullanıcı için satır ekle
      const playersToShow = data.slice(0, 10);

      playersToShow.forEach((player, index) => {
        const rank = index + 1;
        const username = player.username || 'İsimsiz Oyuncu';
        const totalScore = player.total_score || 0;
        const avatarUrl = fixAvatarUrl(player.avatar_url);

        console.log(`Kullanıcı eklenıyor: ${username}, Puan: ${totalScore}`);
        
        // Rank ikonlarını oluştur
        let rankIcon = '';
        if (rank === 1) {
          rankIcon = '<i class="fas fa-crown" style="color: var(--gold); margin-right: 5px;"></i>';
        } else if (rank === 2) {
          rankIcon = '<i class="fas fa-medal" style="color: var(--silver); margin-right: 5px;"></i>';
        } else if (rank === 3) {
          rankIcon = '<i class="fas fa-award" style="color: var(--bronze); margin-right: 5px;"></i>';
        }

        // Satır HTML'i
        html += `
          <div class="player-row" data-rank="${rank}">
            <div class="rank">${rankIcon}${rank}</div>
            <div class="player">
              <div class="player-avatar">
                <img src="${avatarUrl || '/static/images/avatars/default.svg'}" alt="${username}" 
                     onerror="this.src='/static/images/avatars/default.svg'">
              </div>
              <div class="player-name">${username}</div>
            </div>
            <div class="score">${formatNumber(totalScore)}</div>
          </div>
        `;
        
        // Her oyuncu satırı eklendikten sonra eklemek için log
        console.log(`Seviye tablosuna eklenen kullanıcı: ${username}`);
      });

      // HTML'i konteyner'a ekle
      container.innerHTML = html;

      // Satır animasyonlarını başlat
      animateRows();
    })
    .catch(error => {
      console.error('Skorlar alınırken hata oluştu:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Bir hata oluştu</h3>
          <p>Liderlik tablosu verilerine erişilemiyor. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}

// Avatar URL'i düzelt
function fixAvatarUrl(url) {
  if (!url) return '';

  if (!url.startsWith('http')) {
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    if (url.startsWith('/uploads/')) {
      url = '/static' + url;
    } else if (!url.startsWith('/static/')) {
      if (!url.startsWith('/static/uploads/')) {
        url = '/static/uploads/' + url;
      }
    }
  }

  return url;
}

// Sayıları biçimlendir (1000 -> 1,000)
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Satırları animasyonlu göster
function animateRows() {
  const rows = document.querySelectorAll('.player-row');

  rows.forEach((row, index) => {
    setTimeout(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// Bildirim gösterme (from original code)
function showNotification(message, duration = 3000) {
  const toast = document.getElementById('notificationToast');
  if (!toast) return;

  const messageElement = toast.querySelector('.notification-message');
  if (messageElement) {
    messageElement.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

// Global API
window.LeaderboardManager = {
  loadLeaderboard: loadLeaderboard,
  updateScoreBoard: function() {
    loadLeaderboard();
  }
};

// Global fonksiyon
window.updateScoreBoard = function() {
  loadLeaderboard();
  showNotification('Liderlik tablosu güncellendi!');
};
