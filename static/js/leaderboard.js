document.addEventListener('DOMContentLoaded', function() {
  // Oyun filtreleme butonları için event listener ekle
  const gameButtons = document.querySelectorAll('.game-tab');
  gameButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Aktif butonu güncelle
      document.querySelector('.game-tab.active').classList.remove('active');
      this.classList.add('active');

      // Seçilen oyun türünü al
      const gameType = this.getAttribute('data-game');
      loadScores(gameType);
    });
  });

  // Sayfa yüklendiğinde tüm oyunları yükle
  loadScores('all');
});

// Skorları yükleyen fonksiyon
function loadScores(gameType) {
  const container = document.getElementById('leaderboardsContainer');
  container.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  console.log("Skor yükleniyor:", gameType);

  // Skorları API'den getir
  fetch(`/api/get-scores/${gameType}`)
    .then(response => response.json())
    .then(data => {
      console.log("Tüm yüklenen skorlar:", data);
      container.innerHTML = ''; // Loading mesajını temizle

      if (gameType === 'all') {
        // Tüm oyunların toplamını hesaplayarak tek bir toplam skor tablosu oluştur
        const combinedScores = {};

        // Her oyundaki skorları topla
        for (const [game, scores] of Object.entries(data)) {
          scores.forEach(score => {
            if (!combinedScores[score.user_id]) {
              combinedScores[score.user_id] = {
                user_id: score.user_id,
                username: score.username,
                rank: score.rank,
                total_score: 0,
                games_played: 0,
                latest_timestamp: new Date(0)
              };
            }

            combinedScores[score.user_id].total_score += score.score;
            combinedScores[score.user_id].games_played += 1;

            // En son oynadığı tarihi güncelle
            const scoreDate = new Date(score.timestamp);
            if (scoreDate > new Date(combinedScores[score.user_id].latest_timestamp)) {
              combinedScores[score.user_id].latest_timestamp = score.timestamp;
            }
          });
        }

        // Toplam skor tablosunu oluştur
        const totalScoreArray = Object.values(combinedScores);

        // Puanı büyükten küçüğe sırala
        totalScoreArray.sort((a, b) => b.total_score - a.total_score);

        if (totalScoreArray.length > 0) {
          container.appendChild(createTotalScoreLeaderboard(totalScoreArray));
        } else {
          container.innerHTML = `
            <div class="no-scores">
              <i class="fas fa-exclamation-circle"></i>
              <p>Henüz hiç skor kaydedilmemiş. Oyunları oynayarak ilk skorları siz elde edin!</p>
            </div>
          `;
        }
      } else {
        // Belirli bir oyun türü seçilmişse
        if (Array.isArray(data) && data.length > 0) {
          container.appendChild(createLeaderboardCard(gameType, data));
        } else {
          container.innerHTML = `
            <div class="no-scores">
              <i class="fas fa-exclamation-circle"></i>
              <p>Bu oyun türünde henüz hiç skor kaydedilmemiş. İlk skoru siz elde edin!</p>
            </div>
          `;
        }
      }
    })
    .catch(error => {
      console.error("Error loading scores:", error);
      container.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}

// Toplam skor tablosunu oluşturan fonksiyon
function createTotalScoreLeaderboard(combinedScores) {
  const card = document.createElement('div');
  card.className = 'leaderboard-card total-leaderboard';

  card.innerHTML = `
    <div class="card-header">
      <h3>Genel Puan Tablosu</h3>
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
          ${combinedScores.map((score, index) => `
            <tr class="player-row ${index < 3 ? 'top-' + (index + 1) : ''}">
              <td class="rank-cell ${index < 3 ? 'rank-' + (index + 1) : ''}">
                <span class="rank-number">${index + 1}</span>
              </td>
              <td class="player-cell">
                <div class="player-avatar">
                  ${score.username ? score.username.substring(0, 1).toUpperCase() : 'A'}
                </div>
                <div class="player-info">
                  <div class="player-name">${score.username || 'Anonim'}</div>
                  <div class="player-rank"><span>${score.rank || 'Başlangıç'}</span></div>
                </div>
              </td>
              <td class="score-cell">${score.total_score}</td>
              <td class="games-played-cell">${score.games_played}</td>
              <td class="date-cell">${new Date(score.latest_timestamp).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return card;
}

// Oyun türü adlarını Türkçe'ye çeviren yardımcı fonksiyon
function getGameNameInTurkish(gameType) {
  const gameNames = {
    'wordPuzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Eşleştirme',
    'labyrinth': 'Labirent',
    'puzzle': 'Puzzle',
    'visualAttention': 'Görsel Dikkat',
    'numberSequence': 'Sayı Dizisi',
    'memoryCards': 'Hafıza Kartları',
    'numberChain': 'Sayı Zinciri',
    'audioMemory': 'Sesli Hafıza',
    'nBack': 'N-Back',
    'sudoku': 'Sudoku',
    '2048': '2048',
    'chess': 'Satranç',
    'logicPuzzles': 'Mantık Bulmacaları',
    'tangram': 'Tangram',
    'rubikCube': 'Rubik Küpü',
    '3dRotation': '3D Döndürme'
  };

  return gameNames[gameType] || gameType;
}

// Skor bilgisini görselleştiren kart oluşturma
function createLeaderboardCard(gameType, scores) {
  const card = document.createElement('div');
  card.className = 'leaderboard-card';

  // Oyun adını Türkçeleştir
  const gameName = getGameNameInTurkish(gameType);

  card.innerHTML = `
    <div class="card-header">
      <h3>${gameName}</h3>
      <span class="header-divider"></span>
    </div>
    <div class="card-body">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th class="rank-header">Sıra</th>
            <th class="player-header">Oyuncu</th>
            <th class="score-header">Puan</th>
            <th class="date-header">Tarih</th>
          </tr>
        </thead>
        <tbody>
          ${scores.map((score, index) => `
            <tr class="player-row ${index < 3 ? 'top-' + (index + 1) : ''}">
              <td class="rank-cell ${index < 3 ? 'rank-' + (index + 1) : ''}">
                <span class="rank-number">${index + 1}</span>
              </td>
              <td class="player-cell">
                <div class="player-avatar">
                  ${score.username ? score.username.substring(0, 1).toUpperCase() : 'A'}
                </div>
                <div class="player-info">
                  <div class="player-name">${score.username || 'Anonim'}</div>
                  <div class="player-rank"><span>${score.rank || 'Başlangıç'}</span></div>
                </div>
              </td>
              <td class="score-cell">${score.score}</td>
              <td class="date-cell">${new Date(score.timestamp).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return card;
}