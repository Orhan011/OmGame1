
// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard();
  loadLevelLeaderboard();
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
  fetch('/api/scores/aggregated')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // API yanıtı bir dizi olmalı ve en az bir eleman içermeli
      const scores = Array.isArray(data) ? data : [];

      if (scores.length === 0) {
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
            <div class="score-header">Toplam Puan</div>
          </div>
          <div class="leaderboard-body">
      `;

      // Her bir skoru tabloya ekle
      scores.forEach((player, index) => {
        const rankClass = index < 3 ? `top-${index + 1}` : '';
        const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';

        // Kullanıcı adı renk sınıfı
        let userNameColorClass = '';
        if (index === 0) userNameColorClass = 'first-place';
        else if (index === 1) userNameColorClass = 'second-place';
        else if (index === 2) userNameColorClass = 'third-place';
        else if (index < 10) userNameColorClass = 'top-ten';

        // Avatar URL'ini kontrol et ve düzelt
        let avatarUrl = player.avatar_url || '';
        if (avatarUrl) {
          // HTTP veya HTTPS ile başlamıyorsa
          if (!avatarUrl.startsWith('http')) {
            // Eğer / ile başlamıyorsa başına / ekle
            if (!avatarUrl.startsWith('/')) {
              avatarUrl = '/' + avatarUrl;
            }
            
            // Farklı formatlardaki avatar url'lerini düzelt
            if (avatarUrl.startsWith('/uploads/')) {
              avatarUrl = '/static' + avatarUrl;
            } else if (!avatarUrl.startsWith('/static/')) {
              // Static içinde değilse ve uploads içinde değilse, 
              // muhtemelen bir dosya adıdır, static/uploads/ dizinine ekle
              if (!avatarUrl.startsWith('/static/uploads/')) {
                avatarUrl = '/static/uploads' + avatarUrl;
              }
            }
          }
        }

        const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';
        const isCurrentUser = player.is_current_user || false;

        html += `
          <div class="player-row ${rankClass} ${isCurrentUser ? 'current-user' : ''}">
            <div class="rank-cell">
              <div class="rank-number">${index + 1}</div>
            </div>
            <div class="player-cell">
              <div class="player-avatar">
                ${crownHTML}
                ${avatarUrl ? 
                  `<img src="${avatarUrl}" alt="${player.username}" class="avatar-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="player-info">
                <div class="player-name ${userNameColorClass}">${player.username || 'İsimsiz Oyuncu'}</div>
                ${player.rank ? `<div class="player-rank">${player.rank}</div>` : ''}
              </div>
            </div>
            <div class="score-cell">
              <div class="score-container">
                <span class="score-value">${player.total_score || 0}</span>
              </div>
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
      console.error('Skor verileri yüklenirken hata:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onclick="loadLeaderboard()" class="retry-button">Tekrar Dene</button>
        </div>
      `;
    });
}

// Seviye tablosunu yükleyen fonksiyon
function loadLevelLeaderboard() {
  const levelLeaderboardContainer = document.getElementById('levelLeaderboardContainer');

  if (!levelLeaderboardContainer) {
    console.error('Seviye tablosu konteyneri bulunamadı!');
    return;
  }

  // Yükleniyor gösterimi
  levelLeaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Seviye bilgileri yükleniyor...</p>
    </div>
  `;

  // Seviye verilerini API'den al - birden fazla endpoint deneme
  fetch('/api/users/levels')
    .then(response => {
      if (!response.ok) {
        // Eğer birincil API başarısız olursa alternatif API'yi dene
        console.log('İlk API başarısız, alternatif API deneniyor...');
        return fetch('/api/scores/top-users').then(altResponse => {
          if (!altResponse.ok) {
            console.log('Alternatif API de başarısız oldu, son bir endpoint deneniyor...');
            // Son bir deneme daha yap
            return fetch('/api/users/leaderboard?sort=level').then(lastResponse => {
              if (!lastResponse.ok) {
                throw new Error(`Hiçbir API yanıt vermedi: ${lastResponse.status}`);
              }
              return lastResponse.json();
            });
          }
          return altResponse.json();
        });
      }
      return response.json();
    })
    .then(data => {
      // API yanıtı bir dizi olmalı
      const users = Array.isArray(data) ? data : [];

      if (users.length === 0) {
        levelLeaderboardContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-graduate"></i>
            <p>Henüz seviye bilgisi bulunmuyor.</p>
          </div>
        `;
        return;
      }

      // Kullanıcıları seviyelerine göre sırala (en yüksek seviye en üstte)
      const sortedUsers = [...users].sort((a, b) => {
        // Önce seviyeye göre sırala
        const levelA = a.level || 1;
        const levelB = b.level || 1;
        if (levelB !== levelA) return levelB - levelA;
        
        // Seviyeler eşitse, XP'ye göre sırala
        const xpA = a.total_xp || a.experience_points || 0;
        const xpB = b.total_xp || b.experience_points || 0;
        return xpB - xpA;
      });

      // Seviye tablosu oluştur
      let html = `
        <div class="leaderboard-table">
          <div class="leaderboard-header-row">
            <div class="rank-header">Sıra</div>
            <div class="player-header">Oyuncu</div>
            <div class="score-header">Seviye</div>
          </div>
          <div class="leaderboard-body">
      `;

      // Her bir kullanıcıyı tabloya ekle
      sortedUsers.forEach((player, index) => {
        // Hata kontrolü - gerekli alanlar yoksa varsayılan değerler ata
        const playerData = {
          username: player.username || 'İsimsiz Oyuncu',
          avatar_url: player.avatar_url || '',
          level: player.level || 1,
          total_xp: player.total_xp || player.experience_points || 0,
          games_played: player.games_played || player.total_games_played || 0,
          progress_percent: player.progress_percent || 0,
          is_current_user: player.is_current_user || false,
          rank: player.rank || ''
        };

        const rankClass = index < 3 ? `top-${index + 1}` : '';
        const initial = playerData.username.charAt(0).toUpperCase();

        // Kullanıcı adı renk sınıfı
        let userNameColorClass = '';
        if (index === 0) userNameColorClass = 'first-place';
        else if (index === 1) userNameColorClass = 'second-place';
        else if (index === 2) userNameColorClass = 'third-place';
        else if (index < 10) userNameColorClass = 'top-ten';

        // Avatar URL'ini kontrol et ve düzelt
        let avatarUrl = playerData.avatar_url;
        if (avatarUrl) {
          // HTTP veya HTTPS ile başlamıyorsa
          if (!avatarUrl.startsWith('http')) {
            // Eğer / ile başlamıyorsa başına / ekle
            if (!avatarUrl.startsWith('/')) {
              avatarUrl = '/' + avatarUrl;
            }
            
            // Farklı formatlardaki avatar url'lerini düzelt
            if (avatarUrl.startsWith('/uploads/')) {
              avatarUrl = '/static' + avatarUrl;
            } else if (!avatarUrl.startsWith('/static/')) {
              // Static içinde değilse ve uploads içinde değilse, 
              // muhtemelen bir dosya adıdır, static/uploads/ dizinine ekle
              if (!avatarUrl.startsWith('/static/uploads/')) {
                avatarUrl = '/static/uploads' + avatarUrl;
              }
            }
          }
        }

        const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';

        // Seviye ilerleme çubuğu
        const progressPercent = playerData.progress_percent || 0;
        const progressBarHTML = `
          <div class="level-progress">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
            <span class="progress-text">${progressPercent}%</span>
          </div>
        `;

        // Seviye rozeti ve başarı ikon renkleri
        let levelBadgeClass = '';
        if (playerData.level >= 10) levelBadgeClass = 'level-elite';
        else if (playerData.level >= 7) levelBadgeClass = 'level-master';
        else if (playerData.level >= 5) levelBadgeClass = 'level-expert';
        else if (playerData.level >= 3) levelBadgeClass = 'level-advanced';

        html += `
          <div class="player-row ${rankClass} ${playerData.is_current_user ? 'current-user' : ''}">
            <div class="rank-cell">
              <div class="rank-number">${index + 1}</div>
            </div>
            <div class="player-cell">
              <div class="player-avatar">
                ${crownHTML}
                ${avatarUrl ? 
                  `<img src="${avatarUrl}" alt="${playerData.username}" class="avatar-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="player-info">
                <div class="player-name ${userNameColorClass}">${playerData.username}</div>
                <div class="player-stats">
                  <span class="level-badge">XP: ${playerData.total_xp}</span>
                  ${playerData.games_played ? `<span class="games-badge"><i class="fas fa-gamepad"></i> ${playerData.games_played}</span>` : ''}
                  ${playerData.rank ? `<span class="rank-badge"><i class="fas fa-medal"></i> ${playerData.rank}</span>` : ''}
                </div>
                ${progressBarHTML}
              </div>
            </div>
            <div class="score-cell">
              <div class="score-container level-container ${levelBadgeClass}">
                <span class="score-value level-value">Seviye ${playerData.level}</span>
                <div class="score-sparkles"></div>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      levelLeaderboardContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Seviye verileri yüklenirken hata:', error);
      levelLeaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Seviye bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onclick="loadLevelLeaderboard()" class="retry-button">Tekrar Dene</button>
        </div>
      `;
    });
}
