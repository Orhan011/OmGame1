document.addEventListener('DOMContentLoaded', function() {
  loadAllScores();
});

// Tüm skorları yükleyen fonksiyon
function loadAllScores() {
  fetch('/api/leaderboard/all')
    .then(response => response.json())
    .then(data => {
      console.log("Tüm yüklenen skorlar:", data);
      processScores(data);
    })
    .catch(error => {
      console.error('Skor yükleme hatası:', error);
      document.querySelector('.loading').innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
      `;
    });
}

// Tüm skorları işleyerek toplam skorları hesaplar
function processScores(gameScores) {
  // Tüm oyunların skorlarını toplamak için kullanıcı bazlı bir harita oluştur
  const userTotals = new Map();

  // Tüm oyun türlerini döngüyle kontrol et
  Object.keys(gameScores).forEach(gameType => {
    // Her oyun için skorları kontrol et
    gameScores[gameType].forEach(score => {
      const userId = score.user_id;
      const username = score.username || 'Anonim';
      const rank = score.rank || 'Başlangıç';
      const scoreValue = parseInt(score.score);

      // Kullanıcı haritada yoksa ekle
      if (!userTotals.has(userId)) {
        userTotals.set(userId, {
          user_id: userId,
          username: username,
          rank: rank,
          total_score: 0,
          games_played: new Set(),
          last_activity: new Date(0)
        });
      }

      // Kullanıcının toplam puanını güncelle
      const userInfo = userTotals.get(userId);
      userInfo.total_score += scoreValue;
      userInfo.games_played.add(gameType);

      // Son aktivite zamanını güncelle
      const scoreDate = new Date(score.timestamp);
      if (scoreDate > userInfo.last_activity) {
        userInfo.last_activity = scoreDate;
      }
    });
  });

  // Kullanıcı haritasını diziye çevir ve toplam puana göre sırala
  const sortedUsers = Array.from(userTotals.values())
    .sort((a, b) => b.total_score - a.total_score)
    .map(user => ({
      ...user,
      games_played: user.games_played.size,
      last_activity: user.last_activity
    }));

  // Skor tablosunu oluştur
  renderLeaderboard(sortedUsers);
}

// Skor tablosunu ekrana çizen fonksiyon
function renderLeaderboard(users) {
  const container = document.getElementById('leaderboardContainer');

  if (users.length === 0) {
    container.innerHTML = `
      <div class="no-scores">
        <i class="fas fa-trophy-alt"></i>
        <h3>Henüz skor kaydedilmemiş</h3>
        <p>Oyunlar oynayarak skor tablosunda yerinizi alabilirsiniz.</p>
      </div>
    `;
    return;
  }

  // Skor tablosu oluştur
  container.innerHTML = `
    <div class="leaderboard-card total-leaderboard">
      <div class="card-header">
        <h3>Genel Sıralama</h3>
        <span class="header-divider"></span>
      </div>
      <div class="card-body">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th class="rank-header">Sıra</th>
              <th class="player-header">Oyuncu</th>
              <th class="score-header">Toplam Puan</th>
              <th class="games-header">Oynadığı Oyunlar</th>
              <th class="date-header">Son Aktivite</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((user, index) => `
              <tr class="player-row ${index < 3 ? 'top-' + (index + 1) : ''}">
                <td class="rank-cell ${index < 3 ? 'rank-' + (index + 1) : ''}">
                  <span class="rank-number">${index + 1}</span>
                </td>
                <td class="player-cell">
                  <div class="player-avatar">
                    ${user.username ? user.username.substring(0, 1).toUpperCase() : 'A'}
                  </div>
                  <div class="player-info">
                    <div class="player-name">${user.username || 'Anonim'}</div>
                    <div class="player-rank"><span>${user.rank || 'Başlangıç'}</span></div>
                  </div>
                </td>
                <td class="score-cell">
                  <span class="score-value">${user.total_score}</span>
                </td>
                <td class="games-played-cell">${user.games_played}</td>
                <td class="date-cell">${formatDate(user.last_activity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Tarihi formatlayan yardımcı fonksiyon
function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
}