// Puanları formatlamak için yardımcı fonksiyon
function formatScore(score) {
  // 1000'den büyük puanları formatlı göster (örn: 1,234)
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Rasgele madalya arka plan rengi
function getRandomMedalGradient(type) {
  const gradients = {
    gold: [
      'linear-gradient(135deg, #ffd700, #ffcc00, #ffb700)',
      'linear-gradient(135deg, #ffe661, #ffcc00, #ffb700)',
      'linear-gradient(135deg, #ffb700, #ffd700, #ffe661)'
    ],
    silver: [
      'linear-gradient(135deg, #c0c0c0, #e6e6e6, #a9a9a9)',
      'linear-gradient(135deg, #d9d9d9, #bfbfbf, #a6a6a6)',
      'linear-gradient(135deg, #a9a9a9, #e6e6e6, #c0c0c0)'
    ],
    bronze: [
      'linear-gradient(135deg, #cd7f32, #b87333, #a45e2a)',
      'linear-gradient(135deg, #b87333, #cd7f32, #daa520)',
      'linear-gradient(135deg, #a45e2a, #cd7f32, #b87333)'
    ]
  };
  
  const index = Math.floor(Math.random() * gradients[type].length);
  return gradients[type][index];
}

// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard('all');
  
  // Animasyonlu başlangıç
  const header = document.querySelector('.leaderboard-main-header h1');
  if (header) {
    setTimeout(() => {
      header.classList.add('animated');
    }, 300);
  }
});

// Skor tablosunu yükleyen fonksiyon
function loadLeaderboard(gameType = 'all') {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  // Yükleniyor gösterimi
  leaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // API endpoint'i belirleme
  const apiUrl = gameType === 'all' ? '/api/scores/aggregated' : `/api/scores/${gameType}`;

  // Skorları API'den al
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(scores => {
      if (!scores || scores.length === 0) {
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

      // Üst sıradakileri ayır ve özel stil ekle
      const topPlayers = scores.slice(0, 3);
      const otherPlayers = scores.slice(3);

      // İlk 3 oyuncu için özel madalya blokları oluştur
      html += `<div class="top-players-section">`;
      
      // Top 3 Players Container
      if (topPlayers.length > 0) {
        html += `
          <div class="medal-podium">
        `;
        
        // İlk 2 ve 3. oyuncu (sırasıyla Sol ve Sağ)
        for (let i = 1; i < Math.min(topPlayers.length, 3); i++) {
          const player = topPlayers[i];
          const position = i + 1;
          const medalType = position === 2 ? 'silver' : 'bronze';
          const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
          const avatarUrl = player.avatar_url || '';
          const scoreValue = gameType === 'all' ? player.total_score : player.score;
          
          html += `
            <div class="podium-player podium-${position}">
              <div class="medal medal-${medalType}" style="background: ${getRandomMedalGradient(medalType)}">
                <span>${position}</span>
              </div>
              <div class="podium-avatar">
                ${avatarUrl ? 
                  `<img src="/${avatarUrl}" alt="${player.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="podium-player-name">${player.username}</div>
              <div class="podium-score">${formatScore(scoreValue)}</div>
            </div>
          `;
        }
        
        // 1. oyuncu (Orta)
        if (topPlayers.length > 0) {
          const player = topPlayers[0];
          const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
          const avatarUrl = player.avatar_url || '';
          const scoreValue = gameType === 'all' ? player.total_score : player.score;
          
          html += `
            <div class="podium-player podium-1">
              <div class="crown-icon">
                <i class="fas fa-crown"></i>
              </div>
              <div class="medal medal-gold" style="background: ${getRandomMedalGradient('gold')}">
                <span>1</span>
              </div>
              <div class="podium-avatar">
                ${avatarUrl ? 
                  `<img src="/${avatarUrl}" alt="${player.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <span class="avatar-content" style="display:none">${initial}</span>` : 
                  `<span class="avatar-content">${initial}</span>`
                }
              </div>
              <div class="podium-player-name">${player.username}</div>
              <div class="podium-score">${formatScore(scoreValue)}</div>
            </div>
          `;
        }
        
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
        const scoreValue = gameType === 'all' ? player.total_score : player.score;

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
                ${player.rank ? `<div class="player-rank">${player.rank}</div>` : ''}
              </div>
            </div>
            <div class="score-cell">
              <div class="score-container">
                <span class="score-value">${formatScore(scoreValue)}</span>
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
      
      // Sıralamaların görsel efektlerini etkinleştir
      setTimeout(() => {
        const rows = document.querySelectorAll('.player-row');
        rows.forEach((row, index) => {
          setTimeout(() => {
            row.classList.add('animated');
          }, index * 100);
        });
        
        const podiumPlayers = document.querySelectorAll('.podium-player');
        podiumPlayers.forEach((player, index) => {
          setTimeout(() => {
            player.classList.add('animated');
          }, index * 200);
        });
      }, 300);
    })
    .catch(error => {
      console.error('Skor verileri yüklenirken hata:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}

// Toplam skorları hesapla
function calculateTotalScores(scoresData) {
  const players = {};

  // Tüm oyun kategorilerini döngüye alarak oyuncuların toplam puanlarını hesapla
  Object.values(scoresData).forEach(gameScores => {
    if (Array.isArray(gameScores)) {
      gameScores.forEach(score => {
        const playerId = score.user_id;
        if (!players[playerId]) {
          players[playerId] = {
            user_id: playerId,
            username: score.username,
            rank: score.rank,
            avatar_url: score.avatar_url,
            total_score: 0
          };
        }

        // Skor değeri kontrol ediliyor ve toplama ekleniyor
        const scoreValue = parseInt(score.score) || 0;
        players[playerId].total_score += scoreValue;
      });
    }
  });

  // Oyuncuları diziye dönüştür ve puana göre sırala
  return Object.values(players).sort((a, b) => b.total_score - a.total_score);
}

// Her 60 saniyede bir tabloyu otomatik güncelle
setInterval(loadLeaderboard, 60000);