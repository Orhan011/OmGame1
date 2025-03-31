// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  // Genel skorları yükle
  loadAllScores();
});

// Toplam skorları hesaplamak için yeni fonksiyon
function calculateTotalScores(allScores) {
  const players = {};

  // Tüm oyun türlerinden gelen puanları oyuncu bazında birleştir
  for (const gameType in allScores) {
    if (allScores.hasOwnProperty(gameType) && Array.isArray(allScores[gameType])) {
      allScores[gameType].forEach(playerScore => {
        if (!players[playerScore.user_id]) {
          players[playerScore.user_id] = {
            user_id: playerScore.user_id,
            username: playerScore.username,
            rank: playerScore.rank,
            avatar_url: playerScore.avatar_url || '/static/images/avatars/avatar1.svg',
            scores: {},
            total_score: 0
          };
        }

        // Her bir oyun türü için en yüksek skoru kaydet
        if (!players[playerScore.user_id].scores[gameType] || 
            playerScore.score > players[playerScore.user_id].scores[gameType]) {
          players[playerScore.user_id].scores[gameType] = playerScore.score;
          players[playerScore.user_id].total_score += playerScore.score;
        }
      });
    }
  }

  // Oyuncuları toplam puanlarına göre sırala
  return Object.values(players).sort((a, b) => b.total_score - a.total_score);
}

// Tüm skorları yükleme fonksiyonu
function loadAllScores() {
  fetch('/api/get-scores/all')
    .then(response => response.json())
    .then(data => {
      console.log("Tüm yüklenen skorlar:", data);
      // Profil güncellemesini zorla (yeni puanları almak için)
      fetch('/api/aggregated_scores')
        .then(response => response.json())
        .then(aggregatedData => {
          // Hem tüm oyun skorlarını hem de toplu skorları göster
          displayLeaderboard(data, aggregatedData);
        })
        .catch(error => {
          console.error('Toplam skorlar yüklenirken hata oluştu:', error);
          // Hata durumunda yine de mevcut skorları göster
          displayLeaderboard(data);
        });
    })
    .catch(error => {
      console.error('Skorlar yüklenirken hata oluştu:', error);
    });
}


// Skor tablosu görüntüleme fonksiyonu
function displayLeaderboard(scores, aggregatedScores = []) {
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  leaderboardContainer.innerHTML = ''; // Mevcut içeriği temizle

  // Önce toplam skor tablosunu göster
  let html = `
    <div class="leaderboard-table">
      <div class="leaderboard-title">Toplam Skor Tablosu</div>
      <div class="leaderboard-header-row">
        <div class="rank-header">Sıra</div>
        <div class="player-header">Oyuncu</div>
        <div class="score-header">Toplam Puan</div>
      </div>
      <div class="leaderboard-body">
  `;

  // Eğer aggregatedScores mevcutsa bu verileri kullan, yoksa scores'dan hesapla
  const totalScores = aggregatedScores.length > 0 ? 
                       aggregatedScores : 
                       calculateTotalScores(scores);

  // En fazla 25 oyuncu göster
  totalScores.slice(0, 25).forEach((player, index) => {
    const rankClass = index < 3 ? `top-${index + 1}` : '';
    const userNameColorClass = index === 0 ? 'gold-text' : 
                              index === 1 ? 'silver-text' : 
                              index === 2 ? 'bronze-text' : '';

    // Avatar kontrolü
    const avatarUrl = player.avatar_url || '/static/images/avatars/avatar1.svg';
    const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';

    html += `
      <div class="player-row ${rankClass}">
        <div class="rank-cell ${userNameColorClass}">${index + 1}</div>
        <div class="player-cell">
          <div class="player-avatar-container">
            ${crownHTML}
            <div class="player-avatar" style="background-image: url('${avatarUrl}')">
              <span class="avatar-content">${player.username.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div class="player-info">
            <div class="player-name ${userNameColorClass}">${player.username}</div>
          </div>
        </div>
        <div class="score-value">${player.total_score}</div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  leaderboardContainer.innerHTML = html;
}

// Skor tablosunu yükleyen fonksiyon (bu fonksiyon artık kullanılmıyor)
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

// Toplam skorları hesapla (bu fonksiyon artık kullanılmıyor)
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