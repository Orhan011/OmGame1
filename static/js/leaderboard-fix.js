/**
 * ZekaPark - Liderlik Tablosu (Leaderboard) Modülü
 * Bu dosya, platform liderlik tablosu işlevlerini sağlar.
 */

// Sayfa yüklendiğinde liderlik tablosu verilerini al
document.addEventListener('DOMContentLoaded', function() {
  console.log('Liderlik tablosu modülü yükleniyor...');
  loadLeaderboard();
  loadLevelLeaderboard();

  // Her 60 saniyede bir skor tablosunu otomatik yenile
  setInterval(function() {
    loadLeaderboard();
    loadLevelLeaderboard();
    console.log("Skor tablosu yenilendi - " + new Date().toLocaleTimeString());
  }, 60000);
  
  // Liderlik tablosu güncelleme butonu varsa, tıklama olayını ekle
  const refreshButtons = document.querySelectorAll('.refresh-leaderboard');
  refreshButtons.forEach(button => {
    button.addEventListener('click', () => {
      updateScoreBoard();
    });
  });
});

/**
 * Kullanıcı skorlarını manuel olarak günceller
 * @param {string} gameType - Oyun tipi (isteğe bağlı)
 * @param {boolean} forceUpdate - Zorunlu güncelleme (isteğe bağlı)
 */
function updateScoreBoard(gameType = null, forceUpdate = false) {
  console.log(`Skor tablosu güncelleniyor... ${gameType ? 'Oyun: ' + gameType : ''}`);
  
  loadLeaderboard();
  loadLevelLeaderboard();
  updateProfileScores();
  
  // Başarı mesajı
  const updateMessage = document.createElement('div');
  updateMessage.className = 'update-notification';
  updateMessage.innerHTML = '<i class="fas fa-sync-alt"></i> Skor tablosu güncellendi!';
  
  document.body.appendChild(updateMessage);
  
  setTimeout(() => {
    updateMessage.classList.add('show');
    
    setTimeout(() => {
      updateMessage.classList.remove('show');
      setTimeout(() => {
        updateMessage.remove();
      }, 500);
    }, 2000);
  }, 100);
}

// Global puan tablosu yükleme fonksiyonu
function loadLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  if (!leaderboardContainer) {
    console.error('Liderlik tablosu konteyneri bulunamadı!');
    return;
  }
  
  console.log('Liderlik tablosu yükleniyor...');
  
  // Yükleniyor gösterimi
  leaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // Skorları almak için doğrudan toplam puan API'sini kullan
  console.log('Toplam puan verileri getiriliyor...');
  
  fetch('/api/scores/aggregated?nocache=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        leaderboardContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-trophy"></i>
            <p>Henüz skor kaydı bulunmuyor. Oyun oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!</p>
          </div>
        `;
        return;
      }
      
      console.log("Kullanıcı skorları alındı:", data.length);
      
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
      data.forEach((player, index) => {
        // Kullanıcının toplam puanı
        const totalScore = player.total_score || 0;
        console.log(`Oyuncu ${player.username} puanı: ${totalScore}`);
        
        // Sıralama ve stil sınıfları
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
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          if (!avatarUrl.startsWith('/')) {
            avatarUrl = '/' + avatarUrl;
          }
          
          if (avatarUrl.startsWith('/uploads/')) {
            avatarUrl = '/static' + avatarUrl;
          } else if (!avatarUrl.startsWith('/static/')) {
            if (!avatarUrl.startsWith('/static/uploads/')) {
              avatarUrl = '/static/uploads' + avatarUrl;
            }
          }
        }
        
        // Birincilik tacı
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
              <div class="score-container" style="background-color: rgba(106, 90, 224, 0.3); padding: 8px 15px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 0 10px rgba(106, 90, 224, 0.5);">
                <span class="score-value" style="color: white !important; font-size: 16px !important; font-weight: bold !important; display: inline !important;">${totalScore} puan</span>
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
      console.error('Skorlar alınırken hata oluştu:', error);
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
    console.log('Seviye tablosu konteyneri bulunamadı. Bu normal olabilir.');
    return;
  }

  // Yükleniyor gösterimi
  levelLeaderboardContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Seviye bilgileri yükleniyor...</p>
    </div>
  `;

  // Seviye verilerini API'den al
  fetch('/api/users/levels?limit=10&nocache=' + new Date().getTime())
    .then(response => response.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        levelLeaderboardContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-graduate"></i>
            <p>Henüz seviye bilgisi bulunmuyor.</p>
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

      // Her bir kullanıcıyı tabloya ekle
      data.forEach((player, index) => {
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
        
        // Avatar URL'ini kontrol et ve düzelt
        let avatarUrl = playerData.avatar_url;
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          if (!avatarUrl.startsWith('/')) {
            avatarUrl = '/' + avatarUrl;
          }
          
          if (avatarUrl.startsWith('/uploads/')) {
            avatarUrl = '/static' + avatarUrl;
          } else if (!avatarUrl.startsWith('/static/')) {
            if (!avatarUrl.startsWith('/static/uploads/')) {
              avatarUrl = '/static/uploads' + avatarUrl;
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
        
        // Seviye rozeti sınıfı
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
              <div class="score-container level-container ${levelBadgeClass}" style="background-color: rgba(106, 90, 224, 0.3); padding: 8px 15px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 0 10px rgba(106, 90, 224, 0.5);">
                <span class="score-value level-value" style="color: white !important; font-size: 16px !important; font-weight: bold !important; display: inline !important;">Seviye ${playerData.level}</span>
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

// Profil sayfasındaki puan göstergesini güncelleme
function updateProfileScores() {
  console.log("Profil puanları güncelleniyor...");
  const totalScoreElement = document.getElementById('leaderboard-total-score');
  const totalPointsElements = document.querySelectorAll('.total-points-value');
  
  if (totalScoreElement || totalPointsElements.length > 0) {
    fetch('/api/scores/aggregated?nocache=' + new Date().getTime())
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          console.log("Skor verisi bulunamadı veya boş");
          return;
        }
        
        // Mevcut kullanıcının skoru
        const currentUser = data.find(score => score.is_current_user);
        if (currentUser && currentUser.total_score) {
          console.log("Kullanıcı puanı güncelleniyor:", currentUser.total_score);
          
          // Ana puan göstergesini güncelle
          if (totalScoreElement) {
            totalScoreElement.innerHTML = currentUser.total_score;
            totalScoreElement.classList.add('score-change');
            setTimeout(() => {
              totalScoreElement.classList.remove('score-change');
            }, 1500);
          }
          
          // Tüm puan göstergelerini güncelle
          totalPointsElements.forEach(element => {
            element.textContent = currentUser.total_score;
            element.classList.add('score-change');
            setTimeout(() => {
              element.classList.remove('score-change');
            }, 1500);
          });
        }
      })
      .catch(error => {
        console.error('Profil puanları güncellenirken hata:', error);
      });
  }
}

// Global skorları kaydetme yardımcı fonksiyonu
window.saveScoreToLeaderboard = function(gameType, score, playTime, difficulty = 'medium', gameStats = {}) {
  console.log(`${gameType} oyunu için puan kaydediliyor: ${score}`);
  
  return fetch('/api/save-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game_type: gameType,
      score: score,
      playtime: playTime,
      difficulty: difficulty,
      game_stats: gameStats
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("Skor başarıyla kaydedildi:", data);
      // Liderlik tablosunu güncelle
      updateScoreBoard(gameType);
      return data;
    } else {
      console.error("Skor kaydedilirken hata oluştu:", data.message);
      throw new Error(data.message);
    }
  });
};

// Global nesne olarak dışa aktar
window.LeaderboardManager = {
  loadLeaderboard,
  loadLevelLeaderboard,
  updateScoreBoard,
  updateProfileScores,
  saveScoreToLeaderboard
};