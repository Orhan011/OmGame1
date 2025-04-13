/**
 * Liderlik Tablosu Yöneticisi
 * Bu script, liderlik tablosundaki verileri yüklemek ve görüntülemek için kullanılır.
 */

// Sayfa yüklendiğinde çalıştırılacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
  console.log('Liderlik tablosu modülü yükleniyor...');

  // Skorları yükle
  loadLeaderboard();

  // Seviye tablosunu yükle
  loadLevelLeaderboard();

  // Yenileme butonunu tanımla
  document.querySelectorAll('.refresh-leaderboard').forEach(function(button) {
    button.addEventListener('click', function() {
      this.classList.add('spin-animation');
      loadLeaderboard();
      loadLevelLeaderboard();
      updatePodium();

      setTimeout(() => {
        this.classList.remove('spin-animation');
        showNotification('Liderlik tablosu güncellendi!');
      }, 1000);
    });
  });

  // Tab değiştirme işlemleri
  const tabButtons = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');

      // Aktif sekmeyi güncelle
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // İçeriği göster/gizle
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Oyun filtresi
  const applyFilterBtn = document.getElementById('applyGameFilter');
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', function() {
      const gameType = document.getElementById('gameTypeSelect').value;
      loadGameLeaderboard(gameType);
    });
  }

  // Her 60 saniyede bir skorları otomatik yenile
  setInterval(function() {
    loadLeaderboard();
    loadLevelLeaderboard();
    console.log("Skor tablosu yenilendi - " + new Date().toLocaleTimeString());
  }, 60000);
});

// Genel skor tablosunu yükle
function loadLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;

  console.log('Liderlik tablosu yükleniyor...');

  // Yükleniyor göstergesini göster
  container.innerHTML = `
    <div class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">Liderlik tablosu yükleniyor...</p>
    </div>
  `;

  // Sunucudan verileri al - sadece ilk 10 kişiyi iste
  fetch('/api/scores/aggregated?limit=10&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        throw new Error('API yanıtı başarısız: ' + response.status);
      }
      console.log('API yanıtı alındı');
      return response.json();
    })
    .then(data => {
      console.log('Kullanıcı skorları alındı:', data.length);

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

      // İstatistikleri güncelle
      updateStats(data);

      // Skorları sırala
      data.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

      // Podium'u güncelle
      updatePodium(data);

      // Tablo HTML'ini oluştur
      let html = `
        <h2 class="leaderboard-title">En İyi Oyuncular</h2>
        <div class="leaderboard-table">
          <div class="table-header">
            <div class="column-sira">Sıra</div>
            <div class="column-isim">İsim</div>
            <div class="column-puan">Puan</div>
          </div>
      `;

      // Sadece ilk 10 oyuncu için satır oluştur
      const playersToShow = data.slice(0, 10);

      playersToShow.forEach((player, index) => {
        const totalScore = player.total_score || 0;
        const username = player.username || 'İsimsiz Oyuncu';
        const avatarUrl = fixAvatarUrl(player.avatar_url);
        const rank = index + 1;

        console.log(`Kullanıcı eklenıyor: ${username}, Puan: ${totalScore}`);

        // Yeni tasarıma göre oyuncu satırı ekle
        html += `
          <div class="player-row ${player.is_current_user ? 'current-user' : ''}" data-rank="${rank}">
            <div class="column-sira">${rank}</div>
            <div class="column-isim">
              ${avatarUrl ? `<img src="${avatarUrl}" alt="${username}" class="player-avatar">` : ''}
              <span>${username}</span>
            </div>
            <div class="column-puan"><span class="score-badge">${formatNumber(totalScore)}</span></div>
          </div>
          <div class="divider"></div>
        `;
      });

      // Toplam puan butonu ekle
      html += `
        </div>
        <div class="total-score-btn">
          <i class="fas fa-trophy"></i> Toplam Puan
        </div>
      `;

      container.innerHTML = html;

      // Satırları animasyonlu göster
      animateRows();
    })
    .catch(error => {
      console.error('Skorlar alınırken hata oluştu:', error);
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onclick="loadLeaderboard()" class="btn-retry">
            <i class="fas fa-redo-alt"></i> Tekrar Dene
          </button>
        </div>
      `;
    });
}

// Seviye tablosunu yükle
function loadLevelLeaderboard() {
  const container = document.getElementById('levelLeaderboardContainer');
  if (!container) return;

  // Yükleniyor göstergesini göster
  container.innerHTML = `
    <div class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">Seviye bilgileri yükleniyor...</p>
    </div>
  `;

  // Sunucudan verileri al - sadece ilk 10 kullanıcı
  fetch('/api/users/levels?limit=10&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        // Alternatif API'yi dene
        return fetch('/api/scores/top-users?limit=10');
      }
      return response;
    })
    .then(response => response.json())
    .then(data => {
      // Veri yoksa bilgi mesajı göster
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-star"></i>
            <h3>Henüz seviye bilgisi bulunmuyor</h3>
            <p>Oyun oynayarak seviye kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }

      // Tablo HTML'ini oluştur
      let html = `
        <h2 class="leaderboard-title">En İyi Seviyeler</h2>
        <div class="leaderboard-table">
          <div class="table-header">
            <div class="column-sira">Sıra</div>
            <div class="column-isim">İsim</div>
            <div class="column-puan">Seviye</div>
          </div>
      `;

      // Sadece ilk 10 kullanıcı için satır oluştur
      const playersToShow = data.slice(0, 10);

      // Her kullanıcı için bir satır oluştur
      playersToShow.forEach((player, index) => {
        const username = player.username || 'İsimsiz Oyuncu';
        console.log(`Seviye tablosuna eklenen kullanıcı: ${username}`);

        const level = player.level || 1;
        const totalXp = player.total_xp || player.experience_points || 0;
        const progressPercent = player.progress_percent || 0;
        const avatarUrl = fixAvatarUrl(player.avatar_url);
        const rank = index + 1;

        // Yeni tasarıma göre seviye satırı ekle
        html += `
          <div class="player-row ${player.is_current_user ? 'current-user' : ''}" data-rank="${rank}">
            <div class="column-sira">${rank}</div>
            <div class="column-isim">
              ${avatarUrl ? `<img src="${avatarUrl}" alt="${username}" class="player-avatar">` : ''}
              <span>${username}</span>
            </div>
            <div class="column-puan"><span class="score-badge">Seviye ${level}</span></div>
          </div>
          <div class="divider"></div>
        `;
      });

      // Toplam seviye butonu ekle
      html += `
        </div>
        <div class="total-score-btn">
          <i class="fas fa-star"></i> Toplam Seviye
        </div>
      `;

      container.innerHTML = html;

      // Satırları animasyonlu göster
      animateRows();
    })
    .catch(error => {
      console.error('Seviye verileri yüklenirken hata:', error);
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Seviye bilgileri yüklenirken bir hata oluştu.</p>
          <button onclick="loadLevelLeaderboard()" class="btn-retry">
            <i class="fas fa-redo-alt"></i> Tekrar Dene
          </button>
        </div>
      `;
    });
}

// Oyun bazlı skor tablosunu yükle
function loadGameLeaderboard(gameType) {
  const container = document.getElementById('gameLeaderboardContainer');
  if (!container) return;

  // Yükleniyor göstergesini göster
  container.innerHTML = `
    <div class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">${gameType === 'all' ? 'Tüm oyunlar' : gameType} için skorlar yükleniyor...</p>
    </div>
  `;

  // API URL'ini belirle - sadece ilk 10 kullanıcı
  const apiUrl = gameType === 'all' 
    ? '/api/scores/aggregated?limit=10' 
    : `/api/leaderboard/${gameType}?limit=10`;

  // Sunucudan verileri al
  fetch(apiUrl + '&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        throw new Error('API yanıtı başarısız: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Veri yoksa bilgi mesajı göster
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-gamepad"></i>
            <h3>Henüz oyun skoru bulunmuyor</h3>
            <p>${gameType === 'all' ? 'Herhangi bir oyun' : gameType} oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }

      // Tablo HTML'ini oluştur
      let html = `
        <h2 class="leaderboard-title">${gameType === 'all' ? 'Tüm Oyunlar' : gameType} Puan Sıralaması</h2>
        <div class="leaderboard-table">
          <div class="table-header">
            <div class="column-sira">Sıra</div>
            <div class="column-isim">İsim</div>
            <div class="column-puan">Puan</div>
          </div>
      `;

      // Sadece ilk 10 oyuncu için satır oluştur
      const playersToShow = data.slice(0, 10);

      // Her kullanıcı için bir satır oluştur
      playersToShow.forEach((player, index) => {
        const username = player.username || 'İsimsiz Oyuncu';
        const score = player.score || player.total_score || 0;
        const avatarUrl = fixAvatarUrl(player.avatar_url);
        const rank = index + 1;

        // Yeni tasarıma göre oyun puanı satırı ekle
        html += `
          <div class="player-row ${player.is_current_user ? 'current-user' : ''}" data-rank="${rank}">
            <div class="column-sira">${rank}</div>
            <div class="column-isim">
              ${avatarUrl ? `<img src="${avatarUrl}" alt="${username}" class="player-avatar">` : ''}
              <span>${username}</span>
            </div>
            <div class="column-puan"><span class="score-badge">${formatNumber(score)}</span></div>
          </div>
          <div class="divider"></div>
        `;
      });

      html += `
        </div>
        <div class="total-score-btn">
          <i class="fas fa-gamepad"></i> ${gameType === 'all' ? 'Tüm Oyunlar' : gameType}
        </div>
      `;

      container.innerHTML = html;

      // Satırları animasyonlu göster
      animateRows();
    })
    .catch(error => {
      console.error(`${gameType} oyunu için skorlar yüklenirken hata:`, error);
      container.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Oyun skorları yüklenirken bir hata oluştu.</p>
          <button onclick="loadGameLeaderboard('${gameType}')" class="btn-retry">
            <i class="fas fa-redo-alt"></i> Tekrar Dene
          </button>
        </div>
      `;
    });
}

// İlk üç oyuncuyu podium'a yerleştir
function updatePodium(data) {
  const container = document.getElementById('podiumContainer');
  if (!container) return;

  // Eğer data parametresi verilmediyse, skorları al
  if (!data) {
    fetch('/api/scores/aggregated?limit=3')
      .then(response => response.json())
      .then(result => {
        renderPodium(result, container);
      })
      .catch(error => {
        console.error('Podium verileri yüklenirken hata:', error);
      });
  } else {
    // Verilen datayı kullan
    renderPodium(data.slice(0, 3), container);
  }
}

// Podium HTML'ini oluştur ve göster
function renderPodium(topPlayers, container) {
  // HTML oluştur
  let html = '';

  // Özel sıralama: 2. (sol) - 1. (orta) - 3. (sağ)
  const podiumOrder = [1, 0, 2];

  podiumOrder.forEach(index => {
    if (index < topPlayers.length) {
      const player = topPlayers[index];
      const rank = index + 1;
      const username = player.username || 'İsimsiz Oyuncu';
      const totalScore = player.total_score || 0;
      const avatarUrl = fixAvatarUrl(player.avatar_url);
      const playerRank = player.rank || '';

      // Medal emoji
      const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

      html += `
        <div class="podium-player ${rank === 1 ? 'first-place' : ''}" data-rank="${rank}">
          <div class="podium-rank rank-${rank}">${medalEmoji}</div>
          <div class="podium-avatar">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${username}" class="avatar-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
               <span class="avatar-fallback" style="display:none">${username.charAt(0).toUpperCase()}</span>` : 
              `<span class="avatar-fallback">${username.charAt(0).toUpperCase()}</span>`
            }
          </div>
          <div class="podium-username username-${rank}">${username}</div>
          <div class="podium-score">${formatNumber(totalScore)}</div>
          ${playerRank ? `<div class="podium-badge">${playerRank}</div>` : ''}
        </div>
      `;
    }
  });

  // Eğer hiç oyuncu yoksa
  if (topPlayers.length === 0) {
    html = `
      <div class="empty-state">
        <i class="fas fa-trophy"></i>
        <h3>Henüz üst sırada oyuncu yok</h3>
        <p>İlk oyuncu siz olabilirsiniz!</p>
      </div>
    `;
  }

  // Sonuçları konteyner'a ekle
  container.innerHTML = html;
}

// İstatistik sayaçlarını güncelle
function updateStats(data) {
  // Toplam oyuncu sayısı
  const playerCount = document.getElementById('totalPlayerCount');
  if (playerCount) {
    playerCount.textContent = data.length;
  }

  // Toplam puan
  const scoreCount = document.getElementById('totalScoreCount');
  if (scoreCount) {
    const totalScore = data.reduce((sum, player) => sum + (player.total_score || 0), 0);
    scoreCount.textContent = formatNumber(totalScore);
  }
}

// Animasyonlu satır gösterimi
function animateRows() {
  const rows = document.querySelectorAll('.player-row');

  rows.forEach((row, index) => {
    setTimeout(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

// Oyuncu satırı HTML'i oluştur - Basitleştirilmiş tek satır format
function createPlayerRow(rank, username, score, avatarUrl, isCurrentUser, playerRank) {
  const currentUserClass = isCurrentUser ? 'current-user' : '';

  return `
    <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
      <div class="simple-rank">${rank}</div>
      <div class="simple-name">${username}</div>
      <div class="simple-score">${formatNumber(score)}</div>
    </div>
  `;
}

// Seviye satırı HTML'i oluştur - Basitleştirilmiş tek satır format
function createLevelRow(rank, username, level, totalXp, progressPercent, avatarUrl, isCurrentUser, playerRank) {
  const currentUserClass = isCurrentUser ? 'current-user' : '';

  return `
    <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
      <div class="simple-rank">${rank}</div>
      <div class="simple-name">${username}</div>
      <div class="simple-score">Seviye ${level}</div>
    </div>
  `;
}

// Oyun satırı HTML'i oluştur - Basitleştirilmiş tek satır format
function createGameRow(rank, username, score, avatarUrl, isCurrentUser, gameInfo, gameType) {
  const currentUserClass = isCurrentUser ? 'current-user' : '';

  return `
    <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
      <div class="simple-rank">${rank}</div>
      <div class="simple-name">${username}</div>
      <div class="simple-score">${formatNumber(score)}</div>
    </div>
  `;
}

// Avatar URL'lerini düzelt
function fixAvatarUrl(url) {
  if (!url) return '';

  if (!url.startsWith('http')) {
    // Göreceli URL'leri düzelt
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

// Bildirim gösterme
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
  loadLevelLeaderboard: loadLevelLeaderboard,
  loadGameLeaderboard: loadGameLeaderboard,
  updateScoreBoard: function() {
    loadLeaderboard();
    loadLevelLeaderboard();
  }
};

// Global fonksiyon
window.updateScoreBoard = function(gameType = null) {
  loadLeaderboard();
  loadLevelLeaderboard();

  if (gameType) {
    loadGameLeaderboard(gameType);
  }

  // Bildirim göster
  showNotification('Liderlik tablosu güncellendi!');
};