// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard();
});

// Skor tablosunu yükleyen fonksiyon
function loadLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  if (!leaderboardContainer) {
    console.error('Liderlik tablosu konteyneri bulunamadı!');
    return;
  }

  // Yükleniyor gösterimi
  leaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // Toplam skorları API'den al
  Promise.all([
    fetch('/api/scores/aggregated'),
    fetch('/api/user/levels') // Seviye verilerini getirmek için yeni bir fetch çağrısı
  ])
    .then(([scoreResponse, levelResponse]) => {
      if (!scoreResponse.ok) {
        throw new Error(`Network response was not ok: ${scoreResponse.status} ${scoreResponse.statusText}`);
      }
      if (!levelResponse.ok) {
        throw new Error(`Network response was not ok: ${levelResponse.status} ${levelResponse.statusText}`);
      }
      return Promise.all([scoreResponse.json(), levelResponse.json()]);
    })
    .then(([scores, levelData]) => {
      // API yanıtı bir dizi olmalı ve en az bir eleman içermeli
      const scoreData = Array.isArray(scores) ? scores : [];

      if (scoreData.length === 0) {
        leaderboardContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-trophy"></i>
            <p>Henüz skor kaydı bulunmuyor. Oyun oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }

      // Skor tablosu oluştur
      let html = `
        <div class="leaderboard-table">
          <div class="leaderboard-header-row">
            <div class="rank-header">Sıra</div>
            <div class="player-header">Oyuncu</div>
            <div class="level-header">Seviye</div>
            <div class="score-header">Toplam Puan</div>
          </div>
          <div class="leaderboard-body">
      `;

      // Kullanıcı seviyelerini ve puanlarını eşleştirmek için map oluştur
      const userLevels = {};
      if (levelData && levelData.levels) {
        levelData.levels.forEach(item => {
          userLevels[item.user_id] = item.level;
        });
      }

      // Her kullanıcı için satır oluştur
      scoreData.forEach((score, index) => {
        // Avatar içeriği
        let avatarContent = '';

        // Kullanıcı avatar'ı varsa göster
        if (score.avatar_url) {
          avatarContent = `<img src="${score.avatar_url}" alt="${score.username}" class="player-avatar-img">`;
        } else {
          // Avatar yoksa kullanıcı adının ilk harfini göster
          avatarContent = `<span class="avatar-content">${score.username.charAt(0).toUpperCase()}</span>`;
        }

        // İlk 3 için özel sınıf
        const topClass = index < 3 ? `top-${index + 1}` : '';

        // Sıra numarası
        const rankNumber = index + 1;

        // Mevcut kullanıcı ise özel sınıf ekle
        const currentUserClass = score.is_current_user ? 'current-user' : '';

        // Kullanıcının seviyesi (yoksa 1 göster)
        const userLevel = userLevels[score.user_id] || 1;

        html += `
          <div class="player-row ${topClass} ${currentUserClass}" data-rank="${rankNumber}">
            <div class="rank-cell">
              <span class="rank-number">${rankNumber}</span>
            </div>
            <div class="player-cell">
              <div class="player-avatar">
                ${avatarContent}
              </div>
              <div class="player-info">
                <div class="player-name">${score.username}</div>
                <div class="player-rank">${score.rank || 'Oyuncu'}</div>
              </div>
            </div>
            <div class="level-cell">
              <div class="level-badge">
                <i class="fas fa-star level-icon"></i>
                <span class="level-number">${userLevel}</span>
              </div>
            </div>
            <div class="score-cell">
              <span class="score-value">${score.total_score.toLocaleString()}</span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      leaderboardContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Skor veya seviye verileri yüklenirken hata:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar veya seviyeler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onclick="loadLeaderboard()" class="retry-button">Tekrar Dene</button>
        </div>
      `;
    });
}