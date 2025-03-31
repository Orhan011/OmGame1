// Oyun türü adını Türkçe'ye çevir
function getGameTypeDisplayName(gameType) {
  const gameTypeMap = {
    'wordPuzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Kartları',
    'memoryCards': 'Hafıza Kartları',
    'numberSequence': 'Sayı Dizisi',
    '3dRotation': '3D Rotasyon',
    'puzzle': 'Puzzle',
    'labyrinth': 'Labirent',
    'visualAttention': 'Görsel Dikkat',
    'audioMemory': 'İşitsel Hafıza',
    'nBack': 'N-Back',
    'numberChain': 'Sayı Zinciri',
    'sudoku': 'Sudoku',
    '2048': '2048',
    'chess': 'Satranç',
    'logicPuzzles': 'Mantık Bulmacaları',
    'tangram': 'Tangram',
    'rubikCube': 'Rubik Küpü'
  };

  return gameTypeMap[gameType] || gameType;
}

// Skor tablosu yükleme fonksiyonu
function loadLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  // Yükleniyor göstergesi
  leaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // Tüm skorları getir
  fetch('/get_leaderboard/all')
    .then(response => response.json())
    .then(data => {
      console.log("Tüm yüklenen skorlar:", data);

      // Tüm oyun türlerinden gelen skorları birleştir
      let allScores = [];
      for (const gameType in data) {
        // Her oyun türünden gelen skorları birleştir
        if (data[gameType] && data[gameType].length > 0) {
          data[gameType].forEach(score => {
            // Oyun türünü tutmak için ekleme yap
            score.gameTypeDisplayName = getGameTypeDisplayName(score.game_type);
            allScores.push(score);
          });
        }
      }

      // Puana göre sırala (yüksekten düşüğe)
      allScores.sort((a, b) => b.score - a.score);

      // Skorları göster
      displayScores(allScores);
    })
    .catch(error => {
      console.error('Skorlar yüklenirken hata oluştu:', error);
      leaderboardContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
    });
}

// Skorları görüntüleme fonksiyonu
function displayScores(scores) {
  const leaderboardContainer = document.getElementById('leaderboardContainer');

  // Skor tablosu içeriğini hazırla
  if (scores.length === 0) {
    leaderboardContainer.innerHTML = `
      <div class="no-scores">
        <i class="fas fa-trophy"></i>
        <p>Henüz bu kategoride skor bulunmuyor. İlk skorları kaydetmek için oyun oynayın!</p>
      </div>
    `;
    return;
  }

  // Skor tablosunu oluştur
  let leaderboardHTML = `
    <div class="leaderboard-card">
      <div class="leaderboard-title">Genel Sıralama</div>
      <div class="leaderboard-table-container">
        <table class="leaderboard-table" width="100%">
          <tr>
            <td class="full-row-cell">
  `;

  // İlk 20 skoru göster (ya da daha az varsa hepsini)
  const displayScores = scores.slice(0, 50);

  displayScores.forEach((score, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';

    leaderboardHTML += `
      <div class="row-content">
        <div class="player-info">
          <div class="rank-block ${rankClass}">
            <span class="rank-number">${rank}</span>
          </div>
          <div class="player-avatar">
            <div class="avatar-content">${score.username.charAt(0).toUpperCase()}</div>
          </div>
          <div class="player-details">
            <div class="player-name">${score.username}</div>
            <div class="player-game-type">${score.gameTypeDisplayName || getGameTypeDisplayName(score.game_type)}</div>
          </div>
        </div>
        <div class="score-block">
          <div class="score-container">
            <span class="score-value">${score.score}</span>
            <span class="score-label">puan</span>
          </div>
        </div>
      </div>
    `;

    // Son skor değilse ayırıcı çizgi ekle
    if (index < displayScores.length - 1) {
      leaderboardHTML += '<div class="row-divider"></div>';
    }
  });

  leaderboardHTML += `
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  leaderboardContainer.innerHTML = leaderboardHTML;
}

// Sayfa yüklendiğinde skor tablosunu yükle
document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard();
});