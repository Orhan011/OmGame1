// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  // Genel skorları yükle
  loadLeaderboard();
});

// Skor tablosunu yükleyen fonksiyon
function loadLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  // Yükleniyor gösterim
  leaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // Tüm skorları API'den al
  fetch('/api/aggregated_scores')
    .then(response => response.json())
    .then(data => {
      console.log("Toplam skorlar:", data);
      displayLeaderboard(data);
    })
    .catch(error => {
      console.error('Skorlar yüklenirken hata oluştu:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}

// Skorları tabloya dönüştüren fonksiyon
function displayLeaderboard(scores) {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

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

  // Her bir skoru tabloya ekle
  scores.slice(0, 25).forEach((player, index) => {
    const rankClass = index < 3 ? `top-${index + 1}` : '';
    const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
    
    // Sıralamaya göre kullanıcı adı renk sınıfı belirleme
    let userNameColorClass = '';
    if (index === 0) {
      userNameColorClass = 'first-place'; // Altın renk
    } else if (index === 1) {
      userNameColorClass = 'second-place'; // Gümüş renk
    } else if (index === 2) {
      userNameColorClass = 'third-place'; // Bronz renk
    } else if (index < 10) {
      userNameColorClass = 'top-ten'; // Top 10
    }
    
    // Avatar URL kontrolü ve taç eklemesi
    const avatarUrl = player.avatar_url ? player.avatar_url : null;
    const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';

    html += `
      <div class="player-row ${rankClass}">
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
            <div class="player-name ${userNameColorClass}">${player.username}</div>
            <div class="player-rank">${player.rank || ''}</div>
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
              avatar_url: score.avatar_url, // Avatar URL'i ekliyoruz
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