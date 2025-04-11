
// Sayfa yüklendiğinde skorları getir
document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard('all');
  
  // Kategori filtreleme butonlarını işle
  const filterButtons = document.querySelectorAll('.game-filter-btn');
  if (filterButtons) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const gameType = this.dataset.game;
        
        // Aktif sınıfını kaldır ve bu butona ekle
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Seçilen oyun türüne göre liderlik tablosunu yükle
        loadLeaderboard(gameType);
      });
    });
  }
});

// Skor tablosunu yükleyen fonksiyon
function loadLeaderboard(gameType = 'all') {
  const leaderboardContainer = document.getElementById('leaderboardContainer');
  
  if (!leaderboardContainer) {
    console.error('Liderlik tablosu konteyneri bulunamadı!');
    return;
  }

  // Önbellek kontrolü (performans için)
  const cacheKey = `leaderboard_cache_${gameType}`;
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  const now = Date.now();
  const cacheData = localStorage.getItem(cacheKey);
  
  // 2 dakikadan yeni önbellek varsa kullan
  if (cacheData && cacheTime && (now - parseInt(cacheTime)) < 120000) {
    try {
      const data = JSON.parse(cacheData);
      renderLeaderboard(data, leaderboardContainer);
      console.log("Önbellekten liderlik tablosu yüklendi");
      return;
    } catch (e) {
      console.error("Önbellek okuma hatası:", e);
    }
  }
  
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
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Önbelleğe kaydet
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_time`, now.toString());
      } catch (e) {
        console.error("Önbellek yazma hatası:", e);
      }
      
      renderLeaderboard(data, leaderboardContainer);
    })
    .then(data => {
      renderLeaderboard(data, leaderboardContainer);
    })
    
/**
 * Liderlik tablosunu render eden fonksiyon
 * @param {Array} data - API'den gelen skor verileri
 * @param {HTMLElement} leaderboardContainer - Liderlik tablosu konteyneri
 */
function renderLeaderboard(data, leaderboardContainer) {
  // API yanıtı bir dizi olmalı ve en az bir eleman içermeli
  const scores = Array.isArray(data) ? data : [];
  
  // Yerel skorları da göster (eğer kullanıcı girişi yapılmadıysa ve API sonuçları boşsa)
  let localScores = [];
  const currentGameType = document.querySelector('.game-filter-btn.active')?.dataset?.game || 'all';
  
  if (scores.length === 0) {
    try {
      const savedScores = JSON.parse(localStorage.getItem('zekapark_scores') || '{}');
      
      if (currentGameType === 'all') {
        // Tüm oyunlardan en yüksek skorları al
        Object.keys(savedScores).forEach(game => {
          if (savedScores[game] && savedScores[game].length > 0) {
            // Her oyundan en yüksek skoru bul
            const highestScore = savedScores[game].reduce((prev, current) => {
              return (prev.score > current.score) ? prev : current;
            });
            
            localScores.push({
              username: 'Yerel Kullanıcı',
              game_type: game,
              score: highestScore.score,
              total_score: highestScore.score,
              timestamp: highestScore.timestamp,
              is_local: true
            });
          }
        });
      } else if (savedScores[currentGameType] && savedScores[currentGameType].length > 0) {
        // Belirli bir oyun için skorları al
        savedScores[currentGameType].forEach(score => {
          localScores.push({
            username: 'Yerel Kullanıcı',
            game_type: currentGameType,
            score: score.score,
            total_score: score.score,
            timestamp: score.timestamp,
            is_local: true
          });
        });
        
        // Puanı büyükten küçüğe sırala
        localScores.sort((a, b) => b.score - a.score);
        
        // En fazla 5 skor göster
        if (localScores.length > 5) {
          localScores = localScores.slice(0, 5);
        }
      }
    } catch (e) {
      console.error("Yerel skor okuma hatası:", e);
    }
  }
  
  // Yerel skorlar varsa ve API sonuçları boşsa, yerel skorları göster
  const allScores = scores.length > 0 ? scores : localScores;
  
  if (allScores.length === 0) {
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
  allScores.forEach((player, index) => {
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
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
      avatarUrl = '/' + avatarUrl;
    }
    
    const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';
    const scoreValue = currentGameType === 'all' ? (player.total_score || player.score) : player.score;
    const isCurrentUser = player.is_current_user || false;
    const isLocalScore = player.is_local || false;

    html += `
      <div class="player-row ${rankClass} ${isCurrentUser ? 'current-user' : ''} ${isLocalScore ? 'local-score' : ''}">
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
            ${isLocalScore ? `<div class="local-score-badge">Yerel Skor</div>` : ''}
          </div>
        </div>
        <div class="score-cell">
          <div class="score-container">
            <span class="score-value">${scoreValue || 0}</span>
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
    .catch(error => {
      console.error('Skor verileri yüklenirken hata:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onclick="loadLeaderboard('${gameType}')" class="retry-button">Tekrar Dene</button>
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
            avatar_url: score.avatar_url, // Avatar URL'i ekliyoruz
            total_score: 0,
            is_current_user: score.is_current_user || false
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
