/**
 * Modern Leaderboard Manager - 2025 Edition
 * 
 * Bu modül, liderlik tablosu verilerini yönetir ve görüntüler.
 * API'den veri alır, işler ve kullanıcı arayüzünde gösterir.
 * 
 * Özellikler:
 * - Toplam puan liderlik tablosu
 * - Seviye liderlik tablosu
 * - Oyun bazlı liderlik tablosu
 * - Podium görünümü (ilk 3 oyuncu)
 * - Otomatik yenileme
 * - Filtreler ve sıralama
 */

// Leaderboard Manager Modülü
class LeaderboardManager {
  constructor() {
    this.scoreData = [];
    this.levelData = [];
    this.gameData = {};
    this.stats = {
      totalPlayers: 0,
      totalScore: 0
    };
    this.currentUserId = null;
    this.refreshInterval = 60000; // 60 saniye
    this.isLoading = false;
    this.initialized = false;
    
    // Default ayarlar
    this.settings = {
      maxPlayersShown: 20,
      animationEnabled: true,
      showEmptyRows: false,
      filterPeriod: 'all' // 'weekly', 'monthly', 'all'
    };
  }

  /**
   * Modülü başlatır ve ilk verileri yükler
   */
  init() {
    if (this.initialized) return;
    
    console.log('Liderlik tablosu modülü yükleniyor...');
    
    // Mevcut kullanıcı bilgilerini al
    this.getCurrentUser();
    
    // İlk verileri yükle
    this.loadLeaderboards();
    
    // Otomatik yenileme
    this.startAutoRefresh();
    
    this.initialized = true;
  }
  
  /**
   * Mevcut kullanıcının kimliğini almak için API isteği yapar
   */
  getCurrentUser() {
    fetch('/api/current-user')
      .then(response => response.json())
      .catch(error => {
        console.error('Kullanıcı bilgisi alınamadı:', error);
        this.currentUserId = null;
      });
  }
  
  /**
   * Tüm liderlik tablolarını yükler
   */
  loadLeaderboards() {
    this.loadTotalScores();
    this.loadLevelLeaderboard();
    
    // Podium'u güncelle
    this.updatePodium();
  }
  
  /**
   * Toplam puanlara göre liderlik tablosunu yükler
   */
  loadTotalScores() {
    this.isLoading = true;
    const container = document.getElementById('leaderboardContainer');
    
    if (!container) {
      console.log('Liderlik tablosu konteyneri bulunamadı');
      return;
    }
    
    // Yükleniyor göstergesini göster
    container.innerHTML = this.getLoadingHTML('Liderlik tablosu yükleniyor...');
    
    // API'den verileri al
    console.log('Liderlik tablosu yükleniyor...');
    fetch('/api/scores/aggregated?limit=100&nocache=' + new Date().getTime())
      .then(response => {
        if (!response.ok) {
          throw new Error('API yanıtı başarısız: ' + response.status);
        }
        console.log('API yanıtı alındı');
        return response.json();
      })
      .then(data => {
        this.handleScoreData(data, container);
      })
      .catch(error => {
        console.error('Skorlar alınırken hata oluştu:', error);
        container.innerHTML = this.getErrorHTML('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
  
  /**
   * API'den alınan skor verilerini işler ve görüntüler
   * @param {Array} data - API'den alınan skorlar
   * @param {HTMLElement} container - Sonuçların gösterileceği konteyner
   */
  handleScoreData(data, container) {
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = this.getEmptyStateHTML(
        'Henüz skor kaydı bulunmuyor',
        'Oyun oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!'
      );
      return;
    }
    
    console.log("Kullanıcı skorları alındı:", data.length);
    this.scoreData = data;
    
    // İstatistikleri hesapla
    this.calculateStats(data);
    
    // İstatistik sayaçlarını güncelle
    this.updateStatCounters();
    
    // Skorları puanlarına göre sırala (en yüksekten en düşüğe)
    data.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    
    // HTML oluştur
    let html = '';
    
    // Her oyuncu için satır oluştur
    data.forEach((player, index) => {
      if (index >= this.settings.maxPlayersShown) return;
      
      const totalScore = player.total_score || 0;
      const username = player.username || 'İsimsiz Oyuncu';
      const avatarUrl = this.fixAvatarUrl(player.avatar_url);
      const isCurrentUser = player.is_current_user || player.user_id === this.currentUserId;
      const rank = player.rank || '';
      
      console.log(`Kullanıcı eklenıyor: ${username}, Puan: ${totalScore}`);
      
      html += this.createPlayerRowHTML(index + 1, username, totalScore, avatarUrl, isCurrentUser, rank);
    });
    
    // Sonuçları konteyner'a ekle
    container.innerHTML = html;
    
    // Animasyonları etkinleştir
    if (this.settings.animationEnabled) {
      this.animateRows();
    }
  }
  
  /**
   * Seviye liderlik tablosunu yükler
   */
  loadLevelLeaderboard() {
    const container = document.getElementById('levelLeaderboardContainer');
    
    if (!container) {
      return;
    }
    
    container.innerHTML = this.getLoadingHTML('Seviye bilgileri yükleniyor...');
    
    // API'den verileri al
    fetch('/api/users/levels?limit=20&nocache=' + new Date().getTime())
      .then(response => {
        if (!response.ok) {
          // Alternatif API'yi dene
          return fetch('/api/scores/top-users?limit=20');
        }
        return response;
      })
      .then(response => response.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = this.getEmptyStateHTML(
            'Henüz seviye bilgisi bulunmuyor',
            'Oyun oynayarak seviye kazanabilirsiniz!'
          );
          return;
        }
        
        // Seviye verilerini sakla
        this.levelData = data;
        
        // HTML oluştur
        let html = '';
        
        // Her oyuncu için satır oluştur
        data.forEach((player, index) => {
          const username = player.username || 'İsimsiz Oyuncu';
          console.log(`Seviye tablosuna eklenen kullanıcı: ${username}`);
          
          const level = player.level || 1;
          const totalXp = player.total_xp || player.experience_points || 0;
          const progressPercent = player.progress_percent || 0;
          const avatarUrl = this.fixAvatarUrl(player.avatar_url);
          const isCurrentUser = player.is_current_user || player.user_id === this.currentUserId;
          const rank = player.rank || '';
          
          html += this.createLevelRowHTML(index + 1, username, level, totalXp, progressPercent, avatarUrl, isCurrentUser, rank);
        });
        
        // Sonuçları konteyner'a ekle
        container.innerHTML = html;
        
        // Animasyonları etkinleştir
        if (this.settings.animationEnabled) {
          this.animateRows();
        }
      })
      .catch(error => {
        console.error('Seviye verileri yüklenirken hata:', error);
        container.innerHTML = this.getErrorHTML('Seviye bilgileri yüklenirken bir hata oluştu.');
      });
  }
  
  /**
   * Belirli bir oyun için liderlik tablosunu yükler
   * @param {string} gameType - Oyun türü
   */
  loadGameLeaderboard(gameType = 'all') {
    const container = document.getElementById('gameLeaderboardContainer');
    
    if (!container) {
      return;
    }
    
    container.innerHTML = this.getLoadingHTML(`${gameType === 'all' ? 'Tüm oyunlar' : gameType} için skorlar yükleniyor...`);
    
    // API URL'ini belirle
    const apiUrl = gameType === 'all' 
      ? '/api/scores/aggregated?limit=20' 
      : `/api/leaderboard/${gameType}?limit=20`;
    
    // API'den verileri al
    fetch(apiUrl + '&nocache=' + new Date().getTime())
      .then(response => {
        if (!response.ok) {
          throw new Error('API yanıtı başarısız: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = this.getEmptyStateHTML(
            'Henüz oyun skoru bulunmuyor',
            `${gameType === 'all' ? 'Herhangi bir oyun' : gameType} oynayarak liderlik tablosuna girmeye hak kazanabilirsiniz!`
          );
          return;
        }
        
        // Oyun verilerini sakla
        this.gameData[gameType] = data;
        
        // HTML oluştur
        let html = '';
        
        // Her oyuncu için satır oluştur
        data.forEach((player, index) => {
          const username = player.username || 'İsimsiz Oyuncu';
          const score = player.score || player.total_score || 0;
          const avatarUrl = this.fixAvatarUrl(player.avatar_url);
          const isCurrentUser = player.is_current_user || player.user_id === this.currentUserId;
          const gameSpecificInfo = player.game_info || {};
          
          html += this.createGameRowHTML(index + 1, username, score, avatarUrl, isCurrentUser, gameSpecificInfo, gameType);
        });
        
        // Sonuçları konteyner'a ekle
        container.innerHTML = html;
        
        // Animasyonları etkinleştir
        if (this.settings.animationEnabled) {
          this.animateRows();
        }
      })
      .catch(error => {
        console.error(`${gameType} oyunu için skorlar yüklenirken hata:`, error);
        container.innerHTML = this.getErrorHTML('Oyun skorları yüklenirken bir hata oluştu.');
      });
  }
  
  /**
   * Podium bölümünü günceller (ilk 3 oyuncu)
   */
  updatePodium() {
    const container = document.getElementById('podiumContainer');
    
    if (!container) {
      return;
    }
    
    // Eğer veri henüz yüklenmediyse, tekrar kontrol et
    if (this.scoreData.length === 0) {
      setTimeout(() => this.updatePodium(), 500);
      return;
    }
    
    // İlk 3 oyuncuyu al
    const topPlayers = this.scoreData.slice(0, 3);
    
    // HTML oluştur
    let html = '';
    
    // Podium'u sırala: 2. (sol) - 1. (orta) - 3. (sağ)
    const podiumOrder = [1, 0, 2]; // indeks değerleri
    
    podiumOrder.forEach(index => {
      if (index < topPlayers.length) {
        const player = topPlayers[index];
        const rank = index + 1;
        const username = player.username || 'İsimsiz Oyuncu';
        const totalScore = player.total_score || 0;
        const avatarUrl = this.fixAvatarUrl(player.avatar_url);
        const playerRank = player.rank || '';
        
        html += this.createPodiumPlayerHTML(rank, username, totalScore, avatarUrl, playerRank);
      }
    });
    
    // Eğer hiç oyuncu yoksa
    if (topPlayers.length === 0) {
      html = this.getEmptyStateHTML(
        'Henüz üst sırada oyuncu yok',
        'İlk oyuncu siz olabilirsiniz!'
      );
    }
    
    // Sonuçları konteyner'a ekle
    container.innerHTML = html;
  }
  
  /**
   * Otomatik yenileme zamanlayıcısını başlatır
   */
  startAutoRefresh() {
    setInterval(() => {
      if (!this.isLoading) {
        this.loadLeaderboards();
        console.log("Skor tablosu yenilendi - " + new Date().toLocaleTimeString());
      }
    }, this.refreshInterval);
  }
  
  /**
   * İstatistik sayaçlarını günceller
   */
  updateStatCounters() {
    // Toplam oyuncu sayısı
    const playerCountElement = document.getElementById('totalPlayerCount');
    if (playerCountElement) {
      playerCountElement.textContent = this.stats.totalPlayers;
    }
    
    // Toplam puan
    const scoreCountElement = document.getElementById('totalScoreCount');
    if (scoreCountElement) {
      scoreCountElement.textContent = this.formatNumber(this.stats.totalScore);
    }
  }
  
  /**
   * Satırları animasyonlu şekilde gösterir
   */
  animateRows() {
    const rows = document.querySelectorAll('.player-row');
    
    rows.forEach((row, index) => {
      setTimeout(() => {
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }
  
  /**
   * API'den alınan verilerden istatistikleri hesaplar
   * @param {Array} data - API'den alınan skorlar
   */
  calculateStats(data) {
    this.stats.totalPlayers = data.length;
    this.stats.totalScore = data.reduce((total, player) => total + (player.total_score || 0), 0);
  }
  
  /**
   * Avatar URL'lerini düzeltir
   * @param {string} url - Avatar URL'si
   * @returns {string} Düzeltilmiş URL
   */
  fixAvatarUrl(url) {
    if (!url) return '';
    
    if (!url.startsWith('http')) {
      // Göreceli URL'leri düzelt
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      
      if (url.startsWith('/uploads/')) {
        url = '/static' + url;
      } else if (!url.startsWith('/static/')) {
        if (!url.startsWith('/static/uploads/')) {
          url = '/static/uploads/' + url;
        }
      }
    }
    
    return url;
  }
  
  /**
   * Sayıları biçimlendirir (1000 -> 1,000)
   * @param {number} num - Biçimlendirilecek sayı
   * @returns {string} Biçimlendirilmiş sayı
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  /**
   * Yükleniyor HTML'i oluşturur
   * @param {string} message - Gösterilecek mesaj
   * @returns {string} HTML
   */
  getLoadingHTML(message) {
    return `
      <div class="leaderboard-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">${message}</p>
      </div>
    `;
  }
  
  /**
   * Hata HTML'i oluşturur
   * @param {string} message - Gösterilecek hata mesajı
   * @returns {string} HTML
   */
  getErrorHTML(message) {
    return `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
        <button class="btn-retry" onclick="window.leaderboardManager.loadLeaderboards()">
          <i class="fas fa-redo-alt"></i> Tekrar Dene
        </button>
      </div>
    `;
  }
  
  /**
   * Boş durum HTML'i oluşturur
   * @param {string} title - Başlık
   * @param {string} message - Gösterilecek mesaj
   * @returns {string} HTML
   */
  getEmptyStateHTML(title, message) {
    return `
      <div class="empty-state">
        <i class="fas fa-trophy"></i>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Oyuncu satırı HTML'i oluşturur
   * @param {number} rank - Sıralama
   * @param {string} username - Kullanıcı adı
   * @param {number} score - Puan
   * @param {string} avatarUrl - Avatar URL'si
   * @param {boolean} isCurrentUser - Mevcut kullanıcı mı?
   * @param {string} playerRank - Oyuncu rütbesi
   * @returns {string} HTML
   */
  createPlayerRowHTML(rank, username, score, avatarUrl, isCurrentUser, playerRank) {
    const initial = username.charAt(0).toUpperCase();
    const currentUserClass = isCurrentUser ? 'current-user' : '';
    
    return `
      <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
        <div class="rank-column">${rank}</div>
        <div class="player-column">
          <div class="player-avatar">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
               <span class="avatar-fallback" style="display:none">${initial}</span>` : 
              `<span class="avatar-fallback">${initial}</span>`
            }
          </div>
          <div class="player-info">
            <div class="player-name">${username}</div>
            <div class="player-badges">
              ${playerRank ? `<span class="player-badge">${playerRank}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="score-column">
          <div class="score-box">${this.formatNumber(score)}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * Seviye satırı HTML'i oluşturur
   * @param {number} rank - Sıralama
   * @param {string} username - Kullanıcı adı
   * @param {number} level - Seviye
   * @param {number} totalXp - Toplam XP
   * @param {number} progressPercent - İlerleme yüzdesi
   * @param {string} avatarUrl - Avatar URL'si
   * @param {boolean} isCurrentUser - Mevcut kullanıcı mı?
   * @param {string} playerRank - Oyuncu rütbesi
   * @returns {string} HTML
   */
  createLevelRowHTML(rank, username, level, totalXp, progressPercent, avatarUrl, isCurrentUser, playerRank) {
    const initial = username.charAt(0).toUpperCase();
    const currentUserClass = isCurrentUser ? 'current-user' : '';
    
    // Level için badge sınıfı
    let levelBadgeClass = '';
    if (level >= 10) levelBadgeClass = 'level-elite';
    else if (level >= 7) levelBadgeClass = 'level-master';
    else if (level >= 5) levelBadgeClass = 'level-expert';
    else if (level >= 3) levelBadgeClass = 'level-advanced';
    
    return `
      <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
        <div class="rank-column">${rank}</div>
        <div class="player-column">
          <div class="player-avatar">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
               <span class="avatar-fallback" style="display:none">${initial}</span>` : 
              `<span class="avatar-fallback">${initial}</span>`
            }
          </div>
          <div class="player-info">
            <div class="player-name">${username}</div>
            <div class="player-badges">
              <span class="player-badge level-badge">XP: ${this.formatNumber(totalXp)}</span>
              ${playerRank ? `<span class="player-badge">${playerRank}</span>` : ''}
            </div>
            <div class="level-progress">
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
              <span class="progress-text">${progressPercent}%</span>
            </div>
          </div>
        </div>
        <div class="score-column">
          <div class="score-box ${levelBadgeClass}">Seviye ${level}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * Oyun satırı HTML'i oluşturur
   * @param {number} rank - Sıralama
   * @param {string} username - Kullanıcı adı
   * @param {number} score - Puan
   * @param {string} avatarUrl - Avatar URL'si
   * @param {boolean} isCurrentUser - Mevcut kullanıcı mı?
   * @param {Object} gameInfo - Oyun bilgileri
   * @param {string} gameType - Oyun türü
   * @returns {string} HTML
   */
  createGameRowHTML(rank, username, score, avatarUrl, isCurrentUser, gameInfo, gameType) {
    const initial = username.charAt(0).toUpperCase();
    const currentUserClass = isCurrentUser ? 'current-user' : '';
    
    // Oyun bilgilerinden badge'ler oluştur
    let gameBadges = '';
    
    if (gameInfo.difficulty) {
      const difficultyClass = gameInfo.difficulty === 'hard' ? 'difficulty-hard' : 
                             gameInfo.difficulty === 'medium' ? 'difficulty-medium' : 
                             'difficulty-easy';
      
      gameBadges += `<span class="player-badge ${difficultyClass}">${gameInfo.difficulty}</span>`;
    }
    
    if (gameInfo.level) {
      gameBadges += `<span class="player-badge">Seviye ${gameInfo.level}</span>`;
    }
    
    return `
      <div class="player-row ${currentUserClass}" data-rank="${rank}" style="opacity: 0; transform: translateY(20px);">
        <div class="rank-column">${rank}</div>
        <div class="player-column">
          <div class="player-avatar">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
               <span class="avatar-fallback" style="display:none">${initial}</span>` : 
              `<span class="avatar-fallback">${initial}</span>`
            }
          </div>
          <div class="player-info">
            <div class="player-name">${username}</div>
            <div class="player-badges">
              <span class="player-badge games-badge">${gameType === 'all' ? 'Tüm Oyunlar' : gameType}</span>
              ${gameBadges}
            </div>
          </div>
        </div>
        <div class="score-column">
          <div class="score-box">${this.formatNumber(score)}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * Podium oyuncu kartı HTML'i oluşturur
   * @param {number} rank - Sıralama
   * @param {string} username - Kullanıcı adı
   * @param {number} score - Puan
   * @param {string} avatarUrl - Avatar URL'si
   * @param {string} playerRank - Oyuncu rütbesi
   * @returns {string} HTML
   */
  createPodiumPlayerHTML(rank, username, score, avatarUrl, playerRank) {
    const initial = username.charAt(0).toUpperCase();
    
    // Sıralamaya göre sınıflar
    const rankClass = `rank-${rank}`;
    const usernameClass = `username-${rank}`;
    
    // Madalya emojileri
    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    
    return `
      <div class="podium-player ${rank === 1 ? 'first-place' : ''}" data-rank="${rank}">
        <div class="podium-rank ${rankClass}">${medalEmoji}</div>
        <div class="podium-avatar">
          ${avatarUrl ? 
            `<img src="${avatarUrl}" alt="${username}" class="avatar-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
             <span class="avatar-fallback" style="display:none">${initial}</span>` : 
            `<span class="avatar-fallback">${initial}</span>`
          }
        </div>
        <div class="podium-username ${usernameClass}">${username}</div>
        <div class="podium-score">${this.formatNumber(score)}</div>
        ${playerRank ? `<div class="podium-badge">${playerRank}</div>` : ''}
      </div>
    `;
  }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', function() {
  // LeaderboardManager'ı oluştur ve başlat
  window.leaderboardManager = new LeaderboardManager();
  window.leaderboardManager.init();
  
  // Global fonksiyonu tanımla
  window.updateScoreBoard = function(gameType = null) {
    if (window.leaderboardManager) {
      window.leaderboardManager.loadLeaderboards();
      
      if (gameType) {
        window.leaderboardManager.loadGameLeaderboard(gameType);
      }
      
      // Bildirim göster
      if (typeof showNotification === 'function') {
        showNotification('Liderlik tablosu güncellendi!');
      }
    }
  };
  
  // LeaderboardManager'ı global olarak dışa aktar
  window.LeaderboardManager = {
    loadLeaderboard: function() {
      window.leaderboardManager.loadTotalScores();
    },
    loadLevelLeaderboard: function() {
      window.leaderboardManager.loadLevelLeaderboard();
    },
    loadGameLeaderboard: function(gameType) {
      window.leaderboardManager.loadGameLeaderboard(gameType);
    },
    updateScoreBoard: window.updateScoreBoard
  };
});