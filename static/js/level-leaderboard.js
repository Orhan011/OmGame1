// Rasgele seviye rozet renkleri
function getLevelColor(level) {
  // Seviye yükseldikçe daha etkileyici renkler
  if (level >= 50) return 'linear-gradient(135deg, #ff0844, #ffb199)'; // Kırmızı-Turuncu
  if (level >= 40) return 'linear-gradient(135deg, #4e54c8, #8f94fb)'; // Mor-Mavi
  if (level >= 30) return 'linear-gradient(135deg, #11998e, #38ef7d)'; // Yeşil
  if (level >= 20) return 'linear-gradient(135deg, #f953c6, #b91d73)'; // Pembe
  if (level >= 10) return 'linear-gradient(135deg, #fc4a1a, #f7b733)'; // Turuncu
  
  // Temel seviyeler
  return 'linear-gradient(135deg, #6a5ae0, #9f8aff)'; // Varsayılan mor
}

// Sayfa yüklendiğinde seviye tablosunu getir
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('levelLeaderboardContainer')) {
    loadLevelLeaderboard();

    // Her 60 saniyede bir tabloyu otomatik güncelle
    setInterval(loadLevelLeaderboard, 60000);
  }
});

// Seviye tablosunu yükleyen fonksiyon
function loadLevelLeaderboard() {
  const levelLeaderboardContainer = document.getElementById('levelLeaderboardContainer');

  // Yükleniyor gösterimi
  levelLeaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Seviye bilgileri yükleniyor...</p>
    </div>
  `;

  // Seviye verilerini API'den al
  fetch('/api/users/levels')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(users => {
      if (!users || users.length === 0) {
        levelLeaderboardContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-graduate"></i>
            <p>Henüz seviye bilgisi bulunmuyor. Oyun oynayarak seviye kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }

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

      // Üst sıradakileri ayır ve özel stil ekle
      const topPlayers = users.slice(0, 3);
      const otherPlayers = users.slice(3);

      // İlk 3 oyuncu için özel seviye kart blokları oluştur
      html += `<div class="top-players-section top-level-players">`;
      
      // Top 3 Level Leaders
      if (topPlayers.length > 0) {
        html += `
          <div class="level-leaders">
        `;
        
        topPlayers.forEach((player, index) => {
          const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
          const avatarUrl = player.avatar_url || '';
          const position = index + 1;
          const levelBadgeColor = getLevelColor(player.level || 1);
          const crownHTML = position === 1 ? '<div class="crown-icon"><i class="fas fa-crown"></i></div>' : '';
          const medalClass = position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze';
          
          html += `
            <div class="level-leader level-position-${position}">
              ${crownHTML}
              <div class="position-badge position-${medalClass}">${position}</div>
              <div class="leader-avatar">
                ${avatarUrl ? 
                  `<img src="/${avatarUrl}" alt="${player.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="leader-name">${player.username}</div>
              <div class="leader-level-container">
                <div class="leader-level-badge" style="background: ${levelBadgeColor}">
                  <i class="fas fa-star"></i>
                  <span>Seviye ${player.level || 1}</span>
                </div>
              </div>
              <div class="leader-stats">
                <div class="games-badge"><i class="fas fa-gamepad"></i> ${player.games_played || 0} oyun</div>
                <div class="xp-badge"><i class="fas fa-bolt"></i> ${player.total_xp || 0} XP</div>
              </div>
            </div>
          `;
        });
        
        html += `
          </div>
        `;
      }
      
      html += `</div>`;

      // Diğer oyuncular için standart sıralama
      otherPlayers.forEach((player, index) => {
        const realIndex = index + 3; // 4. sıradan başlar
        const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
        const avatarUrl = player.avatar_url || '';
        const levelBadgeColor = getLevelColor(player.level || 1);

        html += `
          <div class="player-row ${player.is_current_user ? 'current-user' : ''}" data-rank="${realIndex + 1}">
            <div class="rank-cell">
              <div class="rank-number">${realIndex + 1}</div>
            </div>
            <div class="player-cell">
              <div class="player-avatar">
                ${avatarUrl ? 
                  `<img src="/${avatarUrl}" alt="${player.username}" class="avatar-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-stats">
                  <div class="games-badge"><i class="fas fa-gamepad"></i> ${player.games_played || 0} oyun</div>
                  <div class="xp-badge"><i class="fas fa-bolt"></i> ${player.total_xp || 0} XP</div>
                </div>
              </div>
            </div>
            <div class="score-cell">
              <div class="level-badge" style="background: ${levelBadgeColor}">
                <span>${player.level || 1}</span>
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
      
      // Sıralamaların görsel efektlerini etkinleştir
      setTimeout(() => {
        const rows = document.querySelectorAll('.player-row');
        rows.forEach((row, index) => {
          setTimeout(() => {
            row.classList.add('animated');
          }, index * 100);
        });
        
        const leaders = document.querySelectorAll('.level-leader');
        leaders.forEach((leader, index) => {
          setTimeout(() => {
            leader.classList.add('animated');
          }, index * 200);
        });
      }, 300);
    })
    .catch(error => {
      console.error('Seviye verileri yüklenirken hata:', error);
      levelLeaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Seviye bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}