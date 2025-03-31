
// Premium Skor Tablosu - JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Durum değişkenleri
  let activeGameType = 'word-puzzle'; // Aktif oyun türü
  let activeTimeFilter = 'all'; // Aktif zaman filtresi
  let allGameScores = {}; // Tüm skorlar
  let currentPage = 1; // Mevcut sayfa
  let itemsPerPage = 10; // Sayfa başına öğe sayısı
  let totalPages = 1; // Toplam sayfa sayısı
  let playerTooltip = null; // Oyuncu bilgi balonunu referansı
  let tooltipTimeout = null; // Tooltip zamanlaması
  
  // Oyun adlarını Türkçe karşılıkları
  const gameNameMap = {
    'word-puzzle': 'Kelime Bulmaca',
    'memory-match': 'Hafıza Kartları',
    'labyrinth': 'Labirent',
    'puzzle': 'Yapboz',
    'number-sequence': 'Sayı Dizisi',
    'memory-cards': 'Kart Eşleştirme',
    'number-chain': 'Sayı Zinciri',
    'audio-memory': 'Sesli Hafıza',
    'n-back': 'N-Back Testi',
    'sudoku': 'Sudoku'
  };

  // Oyun açıklamaları
  const gameDescriptionMap = {
    'word-puzzle': 'Kelime ve kavramlarla çalışarak dil becerilerinizi test edin',
    'memory-match': 'Kartların yerlerini belleğinizde tutarak eşleştirme yapın',
    'labyrinth': 'Karmaşık labirentlerde doğru yolu bularak çıkışa ulaşın',
    'puzzle': 'Parçaları doğru yerleştirerek görsel algı ve uzamsal zeka geliştirin',
    'number-sequence': 'Sayı dizilerindeki mantıksal örüntüleri keşfedin',
    'memory-cards': 'Kapalı kartları doğru sırada açarak görsel hafızanızı güçlendirin',
    'number-chain': 'Beliren sayıları doğru sırayla hatırlama yeteneğinizi test edin',
    'audio-memory': 'İşitsel hafızanızı geliştirerek ses kalıplarını tekrar edin',
    'n-back': 'Çalışan bellek ve odaklanmanızı güçlendirin',
    'sudoku': 'Mantıksal akıl yürütme ile sayıları doğru kutulara yerleştirin'
  };
  
  // Sayfa ilk yüklendiğinde
  initializePage();
  
  // Başlangıç ayarları
  function initializePage() {
    // Oyun filtrelerini ayarla
    setupGameFilters();
    
    // Zaman filtrelerini ayarla
    setupTimeFilters();
    
    // Sayfalama kontrollerini ayarla
    setupPagination();
    
    // Oyuncu bilgi balonunu ayarla
    setupTooltip();
    
    // Verileri yükle
    loadAllScores();
    
    // Güncellenme zamanını ayarla
    document.getElementById('update-time').textContent = 'Şimdi güncellendi';
  }
  
  // Oyun filtrelerini ayarla
  function setupGameFilters() {
    document.querySelectorAll('.game-filter-btn').forEach(button => {
      button.addEventListener('click', function() {
        // Aktif sınıfını kaldır
        document.querySelectorAll('.game-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Tıklanan butona aktif sınıfı ekle
        this.classList.add('active');
        
        // Aktif oyun türünü güncelle
        activeGameType = this.getAttribute('data-game');
        
        // Sayfa bilgisini sıfırla
        currentPage = 1;
        
        // Başlığı güncelle
        updateGameTitle(activeGameType);
        
        // Skorları görüntüle
        displayScoresForGameType(activeGameType);
        
        // Lider panelini güncelle
        updateLeaderSpotlight(activeGameType);
      });
    });
  }
  
  // Oyun başlığını güncelle
  function updateGameTitle(gameType) {
    const titleElement = document.getElementById('active-game-title');
    const subtitleElement = document.getElementById('active-game-subtitle');
    
    titleElement.textContent = gameNameMap[gameType] || 'Skor Tablosu';
    subtitleElement.textContent = gameDescriptionMap[gameType] || 'En iyi oyuncular';
  }
  
  // Zaman filtrelerini ayarla
  function setupTimeFilters() {
    document.querySelectorAll('.time-filter-btn').forEach(button => {
      button.addEventListener('click', function() {
        // Aktif sınıfını kaldır
        document.querySelectorAll('.time-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Tıklanan butona aktif sınıf ekle
        this.classList.add('active');
        
        // Aktif zaman filtresini güncelle
        activeTimeFilter = this.getAttribute('data-time');
        
        // Skorları filtrele ve görüntüle
        filterScoresByTime(activeGameType, activeTimeFilter);
      });
    });
  }
  
  // Sayfalama kontrollerini ayarla
  function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        displayScoresForGameType(activeGameType);
      }
    });
    
    document.getElementById('next-page').addEventListener('click', function() {
      if (currentPage < totalPages) {
        currentPage++;
        displayScoresForGameType(activeGameType);
      }
    });
  }
  
  // Oyuncu bilgi balonunu ayarla
  function setupTooltip() {
    playerTooltip = document.getElementById('player-tooltip');
    
    // Tooltip dışına tıklama olayı
    document.addEventListener('click', function() {
      hidePlayerTooltip();
    });
  }
  
  // Tüm skorları yükle
  function loadAllScores() {
    // Yükleme animasyonunu göster
    const container = document.getElementById('scores-container');
    container.innerHTML = `
      <div class="loading-scores">
        <div class="spinner"></div>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;
    
    // Lider panelini de yükleme durumuna getir
    const leaderPanel = document.getElementById('leader-spotlight');
    leaderPanel.innerHTML = `
      <div class="loading-spotlight">
        <div class="spinner small-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    `;
    
    // İstatistik verilerini temizle
    document.getElementById('total-players').textContent = '--';
    document.getElementById('total-games').textContent = '--';
    document.getElementById('highest-score').textContent = '--';
    
    // Cache'i temizleyerek yeni bir GET isteği gönderelim
    const timestamp = new Date().getTime();
    fetch(`/api/get-scores/all?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Skorlar alınamadı: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Veri kontrolü yap
        if (!data || typeof data !== 'object') {
          throw new Error('Geçersiz veri formatı');
        }
        
        // Verileri sakla
        allGameScores = data;
        console.log("Tüm yüklenen skorlar:", allGameScores);
        
        // Başlığı güncelle
        updateGameTitle(activeGameType);
        
        // Şu anki aktif oyun tipinin skorlarını göster
        displayScoresForGameType(activeGameType);
        
        // Lider panelini güncelle
        updateLeaderSpotlight(activeGameType);
        
        // İstatistik verilerini güncelle
        updateStatistics(data);
        
        // Güncellenme zamanını ayarla
        document.getElementById('update-time').textContent = 'Şimdi güncellendi';
      })
      .catch(error => {
        console.log("Error loading scores:", error);
        container.innerHTML = `
          <div class="no-scores error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skor verisi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
            <small class="text-muted">Hata: ${error.message}</small>
          </div>
        `;
        
        // Lider panelini de hata durumuna getir
        leaderPanel.innerHTML = `
          <div class="no-scores error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Veri yüklenemedi</p>
          </div>
        `;
      });
  }
  
  // İstatistik verilerini güncelle
  function updateStatistics(data) {
    let totalPlayers = new Set();
    let totalGames = 0;
    let highestScore = 0;
    
    // Tüm oyun türlerini döngüyle gez
    for (const gameType in data) {
      const scores = data[gameType];
      if (!scores || !Array.isArray(scores)) continue;
      
      // Toplam oyun sayısını güncelle
      totalGames += scores.length;
      
      // Benzersiz oyuncuları ekle
      scores.forEach(score => {
        if (score.username) {
          totalPlayers.add(score.username);
        }
        
        // En yüksek skoru bul
        if (score.score > highestScore) {
          highestScore = score.score;
        }
      });
    }
    
    // İstatistik verilerini DOM'a yansıt
    document.getElementById('total-players').textContent = totalPlayers.size || 0;
    document.getElementById('total-games').textContent = totalGames || 0;
    document.getElementById('highest-score').textContent = highestScore.toLocaleString() || 0;
  }
  
  // Belirli bir oyun türü için skorları görüntüle
  function displayScoresForGameType(gameType) {
    console.log("Skor yükleniyor:", gameType);
    const container = document.getElementById('scores-container');
    
    // Oyun türünü dahili formata dönüştür
    const gameTypeMap = {
      'word-puzzle': 'wordPuzzle',
      'memory-match': 'memoryMatch',
      'labyrinth': 'labyrinth',
      'puzzle': 'puzzle',
      'number-sequence': 'numberSequence',
      
      // Hafıza Güçlendirme Oyunları
      'memory-cards': 'memoryCards',
      'number-chain': 'numberChain',
      'audio-memory': 'audioMemory',
      'n-back': 'nBack',
      
      // Sudoku ve diğer oyunlar
      'sudoku': 'sudoku'
    };
    
    const internalGameType = gameTypeMap[gameType];
    
    // Eğer oyun AudioMemory ise ve skor tablosu gizlendiyse kullanıcıya bilgi ver
    if (internalGameType === 'audioMemory') {
      container.innerHTML = `
        <div class="no-scores warning-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Sesli Hafıza Oyunu şu anda geliştirme aşamasındadır ve yakında yenilenmiş haliyle geri dönecektir.</p>
        </div>
      `;
      console.log("Sesli Hafıza Oyunu kaldırılmıştır.");
      
      // Lider panelini de özelleştir
      document.getElementById('leader-spotlight').innerHTML = `
        <div class="no-scores warning-message">
          <i class="fas fa-tools"></i>
          <p>Geliştirme aşamasında</p>
        </div>
      `;
      
      return;
    }
    
    // API'den veri henüz yüklenmediyse yükleme ekranı göster
    if (!allGameScores || Object.keys(allGameScores).length === 0) {
      container.innerHTML = `
        <div class="loading-scores">
          <div class="spinner"></div>
          <p>Skorlar yükleniyor...</p>
        </div>
      `;
      return;
    }
    
    // Oyun türüne göre skorları al
    let scores = allGameScores[internalGameType] || [];
    
    // Zaman filtresi uygula
    scores = filterByTimeRange(scores, activeTimeFilter);
    
    // Toplam sayfa sayısını hesapla
    totalPages = Math.max(1, Math.ceil(scores.length / itemsPerPage));
    
    // Sayfa numarasını sınırlar içinde tut
    currentPage = Math.min(currentPage, totalPages);
    
    // Sayfalama bilgilerini güncelle
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
    
    // Sayfalama uygula
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, scores.length);
    const paginatedScores = scores.slice(startIndex, endIndex);
    
    if (paginatedScores.length > 0) {
      // Skorları görüntüle
      let html = '';
      
      paginatedScores.forEach((score, index) => {
        const isTopRank = (startIndex + index) < 3; // İlk 3 skor için özel sınıf
        const rank = startIndex + index + 1;
        
        // Trend değeri (rastgele - gerçek veride hesaplanabilir)
        const trendValue = Math.floor(Math.random() * 20) - 10;
        const trendClass = trendValue > 0 ? 'trend-up' : (trendValue < 0 ? 'trend-down' : '');
        const trendIcon = trendValue > 0 ? '↑' : (trendValue < 0 ? '↓' : '');
        
        // Performans değeri (rastgele - gerçek veride hesaplanabilir)
        const performancePercent = Math.floor(Math.random() * 100) + 1;
        
        // Avatar URL
        const avatarUrl = score.avatar_url || '/static/images/avatars/avatar1.svg';
        
        html += `
          <div class="table-row ${isTopRank ? 'top-rank' : ''}" style="opacity: 0;" data-username="${score.username || 'Anonim'}">
            <div class="rank-cell">
              <span class="rank-badge ${getRankClass(rank)}">${rank}</span>
            </div>
            <div class="player-cell" onmouseover="showPlayerTooltipEvent(event, '${score.username || 'Anonim'}', '${score.rank || 'Başlangıç'}')">
              <div class="player-avatar">
                <img src="${avatarUrl}" alt="Avatar" onerror="this.src='/static/images/avatars/avatar1.svg'">
              </div>
              <div class="player-info">
                <div class="player-name">${score.username || 'Anonim'}</div>
                <div class="player-rank">${score.rank || 'Başlangıç'}</div>
              </div>
            </div>
            <div class="score-cell">
              <span class="score-badge">${score.score.toLocaleString()}</span>
            </div>
            <div class="trend-cell ${trendClass}">
              ${trendValue !== 0 ? `${trendIcon} ${Math.abs(trendValue)}` : '-'}
            </div>
            <div class="performance-cell">
              <div class="performance-bar">
                <div class="performance-value" style="width: ${performancePercent}%"></div>
              </div>
            </div>
            <div class="date-cell">
              <span class="date">${formatDate(score.timestamp)}</span>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // JavaScript fonksiyonu tanımla
      window.showPlayerTooltipEvent = function(event, username, rank) {
        showPlayerTooltip(event, username, rank);
      };
      
      // Animasyonları ekle - sayfa yüklendikten sonra
      setTimeout(() => {
        document.querySelectorAll('.table-row').forEach((row, index) => {
          row.style.animation = `fadeInUp 0.3s ease forwards ${index * 0.05}s`;
        });
        
        // En yüksek 3 skora parıltı efekti ekle
        document.querySelectorAll('.top-rank').forEach(row => {
          const scoreElement = row.querySelector('.score-badge');
          if (scoreElement) {
            scoreElement.classList.add('highlight-score');
          }
        });
      }, 100);
    } else {
      // Oyun türü için skor bulunamadıysa
      container.innerHTML = `
        <div class="no-scores">
          <i class="fas fa-trophy empty-trophy"></i>
          <p>Bu oyun için henüz skor kaydedilmemiş. İlk olmak için hemen oyna!</p>
        </div>
      `;
    }
  }
  
  // Zaman aralığına göre skorları filtrele
  function filterByTimeRange(scores, timeRange) {
    if (timeRange === 'all') return scores;
    
    const now = new Date();
    let startDate;
    
    if (timeRange === 'monthly') {
      // Bu ay
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'weekly') {
      // Bu hafta (Pazartesi başlangıçlı)
      const day = now.getDay() || 7; // Pazar 0 yerine 7 olsun
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day + 1); // Pazartesi
      startDate.setHours(0, 0, 0, 0);
    }
    
    return scores.filter(score => {
      const scoreDate = new Date(score.timestamp);
      return scoreDate >= startDate;
    });
  }
  
  // Belirli zaman aralığına göre skorları filtrele ve görüntüle
  function filterScoresByTime(gameType, timeFilter) {
    displayScoresForGameType(gameType);
  }
  
  // Lider panelini güncelle
  function updateLeaderSpotlight(gameType) {
    const leaderPanel = document.getElementById('leader-spotlight');
    
    // Oyun türünü dahili formata dönüştür
    const gameTypeMap = {
      'word-puzzle': 'wordPuzzle',
      'memory-match': 'memoryMatch',
      'labyrinth': 'labyrinth',
      'puzzle': 'puzzle',
      'number-sequence': 'numberSequence',
      'memory-cards': 'memoryCards',
      'number-chain': 'numberChain',
      'audio-memory': 'audioMemory',
      'n-back': 'nBack',
      'sudoku': 'sudoku'
    };
    
    const internalGameType = gameTypeMap[gameType];
    
    // Eğer oyun AudioMemory ise özel mesaj
    if (internalGameType === 'audioMemory') {
      leaderPanel.innerHTML = `
        <div class="no-scores warning-message">
          <i class="fas fa-tools"></i>
          <p>Geliştirme aşamasında</p>
        </div>
      `;
      return;
    }
    
    // Verileri kontrol et
    if (!allGameScores || !allGameScores[internalGameType] || !allGameScores[internalGameType].length) {
      leaderPanel.innerHTML = `
        <div class="no-scores">
          <i class="fas fa-trophy empty-trophy"></i>
          <p>Henüz bir lider yok</p>
        </div>
      `;
      return;
    }
    
    // İlk sıradaki oyuncuyu al
    const leader = allGameScores[internalGameType][0];
    
    // Avatar URL
    const avatarUrl = leader.avatar_url || '/static/images/avatars/avatar1.svg';
    
    // Lider panelini güncelle
    leaderPanel.innerHTML = `
      <div class="leader-card">
        <div class="leader-avatar">
          <img src="${avatarUrl}" alt="Avatar" onerror="this.src='/static/images/avatars/avatar1.svg'">
        </div>
        <div class="leader-info">
          <div class="leader-name">${leader.username || 'Anonim'}</div>
          <div class="leader-rank">${leader.rank || 'Başlangıç'}</div>
          <div class="leader-stats">
            <div class="leader-stat">
              <div class="leader-stat-label">Toplam Oyun</div>
              <div class="leader-stat-value">${Math.floor(Math.random() * 50) + 10}</div>
            </div>
            <div class="leader-stat">
              <div class="leader-stat-label">Son Aktivite</div>
              <div class="leader-stat-value">${formatDate(leader.timestamp, true)}</div>
            </div>
          </div>
        </div>
        <div class="leader-score">
          <div class="leader-score-value">${leader.score.toLocaleString()}</div>
          <div class="leader-score-label">puan</div>
        </div>
      </div>
    `;
  }
  
  // Oyuncu bilgi balonunu göster
  function showPlayerTooltip(event, username, rank) {
    // Önceki zamanlayıcıyı temizle
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    // Tooltip'i hemen gizle
    playerTooltip.style.display = 'none';
    playerTooltip.style.opacity = '0';
    
    // Tooltip bilgilerini güncelle
    document.getElementById('tooltip-username').textContent = username;
    document.getElementById('tooltip-rank').textContent = rank;
    document.getElementById('tooltip-avatar').src = '/static/images/avatars/avatar1.svg'; // Varsayılan
    document.getElementById('tooltip-total-score').textContent = Math.floor(Math.random() * 10000).toLocaleString();
    document.getElementById('tooltip-games-played').textContent = Math.floor(Math.random() * 100);
    document.getElementById('tooltip-favorite-game').textContent = Object.values(gameNameMap)[Math.floor(Math.random() * Object.values(gameNameMap).length)];
    
    // Tooltip'i göster
    playerTooltip.style.display = 'block';
    
    // Tooltip pozisyonunu ayarla
    const targetRect = event.currentTarget.getBoundingClientRect();
    const tooltipRect = playerTooltip.getBoundingClientRect();
    
    const containerRect = document.querySelector('.premium-leaderboard-container').getBoundingClientRect();
    
    // Dikey pozisyon (hedefin alt kenarının üzerinde)
    let topPos = targetRect.top - tooltipRect.height - 10;
    
    // Eğer ekranın üstünde kalıyorsa, hedefin altına yerleştir
    if (topPos < containerRect.top) {
      topPos = targetRect.bottom + 10;
    }
    
    // Yatay pozisyon (hedefin solu hizalı)
    let leftPos = targetRect.left;
    
    // Sağa taşmasını önle
    const rightEdge = leftPos + tooltipRect.width;
    if (rightEdge > containerRect.right) {
      leftPos = containerRect.right - tooltipRect.width - 10;
    }
    
    // Pozisyonu uygula
    playerTooltip.style.top = `${topPos}px`;
    playerTooltip.style.left = `${leftPos}px`;
    
    // Animasyon için gecikmeli göster
    tooltipTimeout = setTimeout(() => {
      playerTooltip.style.opacity = '1';
      playerTooltip.style.transform = 'translateY(0)';
    }, 50);
    
    // Tooltip'i gizlemek için zamanlayıcı ayarla
    tooltipTimeout = setTimeout(() => {
      hidePlayerTooltip();
    }, 3000);
    
    // Olay yayılmasını durdur
    event.stopPropagation();
  }
  
  // Oyuncu bilgi balonunu gizle
  function hidePlayerTooltip() {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    playerTooltip.style.opacity = '0';
    playerTooltip.style.transform = 'translateY(10px)';
    
    // Gecikmeli olarak görünümü kaldır
    tooltipTimeout = setTimeout(() => {
      playerTooltip.style.display = 'none';
    }, 300);
  }
  
  // Sıralama için sınıf al
  function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  }
  
  // Tarih formatla
  function formatDate(dateString, short = false) {
    if (!dateString) return 'Bilinmeyen tarih';
    
    try {
      const date = new Date(dateString);
      
      // Geçerli bir tarih mi kontrol et
      if (isNaN(date.getTime())) {
        return dateString; // Geçersizse orijinal string'i döndür
      }
      
      // Bugün veya dün mü kontrol et
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return short ? 'Bugün' : `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return short ? 'Dün' : `Dün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: short ? undefined : 'numeric' 
        });
      }
    } catch (e) {
      console.error('Tarih biçimlendirme hatası:', e);
      return dateString;
    }
  }
});
