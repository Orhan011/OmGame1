/**
 * Liderlik tablosu işlevleri
 * Bu modül, liderlik tablolarını yükleme ve görüntüleme işlemlerini yönetir
 */

// Liderlik tablosu yükleme fonksiyonu
function loadLeaderboard() {
  console.log('Liderlik tablosu yükleniyor...');

  const leaderboardContainer = document.getElementById('leaderboard-container');
  if (!leaderboardContainer) {
    console.error('Liderlik tablosu konteyneri bulunamadı!');
    return;
  }

  // Yükleniyor mesajı göster
  leaderboardContainer.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Sıralama yükleniyor...</p>
    </div>
  `;

  // Skorları almak için API çağrısı
  fetch('/api/scores/aggregated?limit=1000&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // API yanıtı bir dizi olmalı
      const scores = Array.isArray(data) ? data : [];
      console.log("Skorlar alındı:", scores.length);

      if (scores.length === 0) {
        leaderboardContainer.innerHTML = `
          <div class="empty-leaderboard">
            <i class="fas fa-trophy"></i>
            <h3>Henüz hiç skor yok</h3>
            <p>İlk skoru kaydetmek için bir oyun oynayın.</p>
          </div>
        `;
        return;
      }

      // Sıralama renk sınıfları
      const rankClasses = ['gold-rank', 'silver-rank', 'bronze-rank'];

      // HTML oluştur
      let html = `
        <div class="leaderboard-header">
          <div class="rank-cell header-cell">Sıra</div>
          <div class="user-cell header-cell">Kullanıcı</div>
          <div class="score-cell header-cell">Puan</div>
        </div>
      `;

      // Her oyuncu için satır ekle
      scores.forEach((player, index) => {
        // Sıralama sınıfı (ilk 3 için özel renk)
        const rankClass = index < 3 ? rankClasses[index] : '';

        // Taç HTML'i (sadece birinci için)
        const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';
        const isCurrentUser = player.is_current_user || false;

        // Puanı doğru şekilde göster - farklı API yanıt formatlarını kontrol et
        let totalScore = 0;

        // Farklı puan alanlarını kontrol et
        if (player.total_score !== undefined && player.total_score !== null) {
          totalScore = player.total_score;
        } else if (player.score !== undefined && player.score !== null) {
          totalScore = player.score;
        } else if (player.points !== undefined && player.points !== null) {
          totalScore = typeof player.points === 'object' ? player.points.total || 0 : player.points;
        } else if (player.adjusted_score !== undefined && player.adjusted_score !== null) {
          totalScore = player.adjusted_score;
        }

        // Sayısal olmayan değerleri kontrol et ve varsayılan değere ayarla
        if (isNaN(totalScore) || totalScore === null) {
          totalScore = 0;
        }

        html += `
          <div class="player-row ${rankClass} ${isCurrentUser ? 'current-user' : ''}">
            <div class="rank-cell">
              ${crownHTML}
              <span class="rank-number">${index + 1}</span>
            </div>
            <div class="user-cell">
              <div class="user-avatar">
                <img src="${player.avatar_url || '/static/images/avatars/default.svg'}" alt="Avatar" onerror="this.src='/static/images/avatars/default.svg'">
              </div>
              <div class="user-info">
                <span class="username">${player.username || 'Anonim'}</span>
              </div>
            </div>
            <div class="score-cell">
              <div class="score-container">
                <span class="score-value">${totalScore}</span>
              </div>
            </div>
          </div>
        `;
      });

      // Liderlik tablosunu güncelle
      leaderboardContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Skorlar alınırken hata oluştu:', error);
      leaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Skorlar yüklenemedi</h3>
          <p>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <button class="retry-btn" onclick="loadLeaderboard()">Tekrar Dene</button>
        </div>
      `;
    });
}

// Belirli bir oyun için liderlik tablosu yükleme
function loadGameLeaderboard(gameType) {
  console.log(`${gameType} oyunu için liderlik tablosu yükleniyor...`);

  const gameLeaderboardContainer = document.getElementById('game-leaderboard-container');
  if (!gameLeaderboardContainer) {
    console.error('Oyun liderlik tablosu konteyneri bulunamadı!');
    return;
  }

  // Yükleniyor mesajı göster
  gameLeaderboardContainer.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>En yüksek skorlar yükleniyor...</p>
    </div>
  `;

  // Belirli oyun için en iyi skorları al
  fetch(`/api/scores/game/${gameType}?nocache=${new Date().getTime()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Ağ yanıtı başarısız: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      const scores = Array.isArray(data) ? data : [];

      if (scores.length === 0) {
        gameLeaderboardContainer.innerHTML = `
          <div class="empty-leaderboard">
            <i class="fas fa-trophy"></i>
            <h3>Henüz skor yok</h3>
            <p>Bu oyun için ilk skoru kaydedin!</p>
          </div>
        `;
        return;
      }

      // Sıralama renk sınıfları
      const rankClasses = ['gold-rank', 'silver-rank', 'bronze-rank'];

      // HTML oluştur
      let html = `
        <div class="leaderboard-header">
          <div class="rank-cell header-cell">Sıra</div>
          <div class="user-cell header-cell">Kullanıcı</div>
          <div class="score-cell header-cell">Puan</div>
        </div>
      `;

      // Her oyuncu için satır ekle
      scores.forEach((player, index) => {
        // Sıralama sınıfı (ilk 3 için özel renk)
        const rankClass = index < 3 ? rankClasses[index] : '';

        // Taç HTML'i (sadece birinci için)
        const crownHTML = index === 0 ? '<div class="crown"><i class="fas fa-crown"></i></div>' : '';
        const isCurrentUser = player.is_current_user || false;

        // Doğru puan değerini kullan
        let scoreValue = 0;

        if (player.adjusted_score !== undefined && player.adjusted_score !== null) {
          scoreValue = player.adjusted_score;
        } else if (player.score !== undefined && player.score !== null) {
          scoreValue = player.score;
        }

        // Sayısal olmayan değerleri kontrol et
        if (isNaN(scoreValue) || scoreValue === null) {
          scoreValue = 0;
        }

        html += `
          <div class="player-row ${rankClass} ${isCurrentUser ? 'current-user' : ''}">
            <div class="rank-cell">
              ${crownHTML}
              <span class="rank-number">${index + 1}</span>
            </div>
            <div class="user-cell">
              <div class="user-avatar">
                <img src="${player.avatar_url || '/static/images/avatars/default.svg'}" alt="Avatar" onerror="this.src='/static/images/avatars/default.svg'">
              </div>
              <div class="user-info">
                <span class="username">${player.username || 'Anonim'}</span>
              </div>
            </div>
            <div class="score-cell">
              <div class="score-container">
                <span class="score-value">${scoreValue}</span>
              </div>
            </div>
          </div>
        `;
      });

      // Liderlik tablosunu güncelle
      gameLeaderboardContainer.innerHTML = html;
    })
    .catch(error => {
      console.error(`${gameType} için skorlar alınırken hata:`, error);
      gameLeaderboardContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Skorlar yüklenemedi</h3>
          <p>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <button class="retry-btn" onclick="loadGameLeaderboard('${gameType}')">Tekrar Dene</button>
        </div>
      `;
    });
}

// Otomatik olarak sayfa yüklendiğinde liderlik tablosunu yükle
document.addEventListener('DOMContentLoaded', function() {
  // Genel liderlik tablosu varsa yükle
  const leaderboardContainer = document.getElementById('leaderboard-container');
  if (leaderboardContainer) {
    loadLeaderboard();
  }

  // Oyun liderlik tablosu varsa ve oyun tipi belirtilmişse yükle
  const gameLeaderboardContainer = document.getElementById('game-leaderboard-container');
  if (gameLeaderboardContainer) {
    const gameType = gameLeaderboardContainer.getAttribute('data-game-type');
    if (gameType) {
      loadGameLeaderboard(gameType);
    }
  }
});

// Global olarak erişim için dışa aktar
window.loadLeaderboard = loadLeaderboard;
window.loadGameLeaderboard = loadGameLeaderboard;


// Sayfa yüklendiğinde ve belirli aralıklarla skorları getir
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

document.addEventListener('DOMContentLoaded', function() {
  console.log('Liderlik tablosu modülü yükleniyor...');
  // Her 60 saniyede bir skor tablosunu otomatik yenile
  setInterval(function() {
    loadLeaderboard();
    loadLevelLeaderboard();
    console.log("Skor tablosu yenilendi - " + new Date().toLocaleTimeString());
  }, 60000);
  
  // Global güncelleme fonksiyonunu dışa aktar
  window.updateScoreBoard = updateScoreBoard;
  
  // Liderlik tablosu güncelleme butonu varsa, tıklama olayını ekle
  const refreshButtons = document.querySelectorAll('.refresh-leaderboard');
  refreshButtons.forEach(button => {
    button.addEventListener('click', () => {
      updateScoreBoard();
    });
  });
});

// Skor tablosunu yükleyen fonksiyon - Bu fonksiyon artık kullanılmıyor.
// function loadLeaderboard() { ... }


// Ana sayfadaki liderlik tablosu güncellendikten sonra çağrılır
function updateProfileScores() {
    console.log("Profil puanları güncelleniyor...");
    // Profil sayfasında toplam puan göstergesi varsa güncelle
    const totalScoreElement = document.getElementById('leaderboard-total-score');
    const totalPointsElements = document.querySelectorAll('.total-points-value');

    if (totalScoreElement || totalPointsElements.length > 0) {
      fetch('/api/leaderboard/all?nocache=' + new Date().getTime())
        .then(response => {
          if (!response.ok) {
            throw new Error(`Sunucu yanıtı hatalı: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Mevcut kullanıcının skorunu bul
          const currentUser = data.find(score => score.is_current_user);

          if (currentUser && currentUser.total_score) {
            console.log("Profil sayfası toplam puanı güncelleniyor:", currentUser.total_score);
            
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
          
          // Hata durumunda alternatif API'yi dene
          fetch('/api/scores/aggregated?nocache=' + new Date().getTime())
            .then(response => response.json())
            .then(scores => {
              // Mevcut kullanıcının puanını bul
              const currentUser = scores.find(score => score.is_current_user);
              
              if (currentUser && currentUser.total_score) {
                console.log("Alternatif API'den puan güncelleniyor:", currentUser.total_score);
                
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
            .catch(altError => {
              console.error('Alternatif API de başarısız:', altError);
            });
        });
    }
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

  // Seviye verilerini API'den al - Cache önleme ve tüm kullanıcıları getirmek için parametreler
  fetch('/api/users/levels?limit=1000&nocache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        // Eğer birincil API başarısız olursa alternatif API'yi dene
        console.log('İlk API başarısız, alternatif API deneniyor...');
        return fetch('/api/scores/top-users?limit=1000').then(altResponse => {
          if (!altResponse.ok) {
            console.log('Alternatif API de başarısız oldu, son bir endpoint deneniyor...');
            // Son bir deneme daha yap
            return fetch('/api/users/leaderboard?sort=level&limit=1000').then(lastResponse => {
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
      // Profil puanlarını da güncelle
      updateProfileScores();
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