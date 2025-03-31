// Tüm skorları saklamak için global değişken
let allGameScores = {};
let leaderboardStats = {};
let currentUserId = null;

document.addEventListener('DOMContentLoaded', function() {
  // İlk yüklemede tüm oyunların skorlarını al
  loadAllScores();
  
  // Mevcut kullanıcı kimliğini al (oturumdan)
  getCurrentUserId();
  
  // Aktif oyun türünü URL'den al veya varsayılan olarak "word-puzzle" kullan
  const urlParams = new URLSearchParams(window.location.search);
  let activeGameType = urlParams.get('game') || 'word-puzzle';
  let activeCategory = urlParams.get('category') || 'all';
  
  // Kategori sekmelerini ayarla
  setupCategoryTabs(activeCategory);
  
  // Oyun filtrelerini ayarla
  setupGameFilters(activeGameType, activeCategory);
  
  // 30 saniyede bir skorları otomatik güncelle
  setInterval(loadAllScores, 30000);
});

// Mevcut kullanıcı kimliğini al
function getCurrentUserId() {
  fetch('/api/get-current-user')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user_id) {
        currentUserId = data.user_id;
      }
    })
    .catch(error => {
      console.error("Error getting current user:", error);
    });
}

// Kategori sekmelerini ayarla
function setupCategoryTabs(activeCategory) {
  const categoryBtns = document.querySelectorAll('.category-btn');
  
  // İlk yüklemede aktif kategoriyi ayarla
  categoryBtns.forEach(btn => {
    const category = btn.getAttribute('data-category');
    if (category === activeCategory) {
      activateCategory(btn);
    }
    
    // Kategori tıklama işlevini ekle
    btn.addEventListener('click', function() {
      activateCategory(this);
      
      // URL'yi güncelle
      const gameType = document.querySelector('.game-filter[data-filter-category="' + this.dataset.category + '"] .game-filter-btn.active')?.dataset.game || 'word-puzzle';
      window.history.replaceState({}, '', `?category=${this.dataset.category}&game=${gameType}`);
    });
  });
}

// Kategoriyi etkinleştir
function activateCategory(categoryBtn) {
  // Tüm kategori butonlarını pasif yap
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Tüm oyun filtrelerini gizle
  document.querySelectorAll('.game-filter').forEach(filter => {
    filter.style.display = 'none';
  });
  
  // Seçilen kategoriyi aktif yap
  categoryBtn.classList.add('active');
  
  // İlgili filtre grubunu göster
  const filterCategory = categoryBtn.getAttribute('data-category');
  const filterGroup = document.querySelector(`.game-filter[data-filter-category="${filterCategory}"]`);
  
  if (filterGroup) {
    filterGroup.style.display = 'flex';
    
    // Bu kategorideki aktif oyun butonunu bul
    const activeGameBtn = filterGroup.querySelector('.game-filter-btn.active');
    
    if (activeGameBtn) {
      // Zaten aktif bir oyun butonu varsa onun skorlarını göster
      displayScoresForGameType(activeGameBtn.getAttribute('data-game'));
    } else {
      // Yoksa ilk oyun butonunu aktif yap
      const firstGameBtn = filterGroup.querySelector('.game-filter-btn');
      if (firstGameBtn) {
        firstGameBtn.classList.add('active');
        displayScoresForGameType(firstGameBtn.getAttribute('data-game'));
      }
    }
    
    // "Tüm Oyunlar" kategorisi için tüm oyun butonlarını kopyala
    if (filterCategory === 'all') {
      populateAllGamesFilter();
    }
  }
}

// "Tüm Oyunlar" kategorisi için tüm oyun butonlarını birleştir
function populateAllGamesFilter() {
  const allGamesFilter = document.querySelector('.game-filter[data-filter-category="all"]');
  allGamesFilter.innerHTML = '';
  
  // Her kategoriden oyunları topla
  const categories = ['basic', 'memory', 'puzzle', 'iq'];
  
  categories.forEach(category => {
    const categoryFilter = document.querySelector(`.game-filter[data-filter-category="${category}"]`);
    if (categoryFilter) {
      // Kategori başlığı ekle
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'filter-category-header';
      
      let categoryTitle = '';
      switch(category) {
        case 'basic': categoryTitle = 'Temel Oyunlar'; break;
        case 'memory': categoryTitle = 'Hafıza Oyunları'; break;
        case 'puzzle': categoryTitle = 'Bulmaca Oyunları'; break;
        case 'iq': categoryTitle = 'IQ Geliştirme'; break;
      }
      
      categoryHeader.textContent = categoryTitle;
      allGamesFilter.appendChild(categoryHeader);
      
      // Bu kategorideki oyun butonlarını klonla ve ekle
      const gameButtons = categoryFilter.querySelectorAll('.game-filter-btn');
      gameButtons.forEach(btn => {
        const clonedBtn = btn.cloneNode(true);
        // Aktif durumu temizle
        clonedBtn.classList.remove('active');
        
        // Tıklama işlevi ekle
        clonedBtn.addEventListener('click', function() {
          activateGameButton(this);
        });
        
        allGamesFilter.appendChild(clonedBtn);
      });
    }
  });
  
  // İlk oyun butonunu varsayılan olarak etkinleştir
  const firstGameBtn = allGamesFilter.querySelector('.game-filter-btn');
  if (firstGameBtn) {
    firstGameBtn.classList.add('active');
  }
}

// Oyun filtrelerini ayarla
function setupGameFilters(activeGameType, activeCategory) {
  const allGameBtns = document.querySelectorAll('.game-filter-btn');
  
  allGameBtns.forEach(btn => {
    const gameType = btn.getAttribute('data-game');
    const parentFilter = btn.closest('.game-filter');
    const category = parentFilter ? parentFilter.getAttribute('data-filter-category') : null;
    
    // URL'den gelen oyun türü ve kategori ile eşleşenler aktif olsun
    if (gameType === activeGameType && (category === activeCategory || activeCategory === 'all')) {
      activateGameButton(btn);
    }
    
    // Tıklama işlevi ekle
    btn.addEventListener('click', function() {
      activateGameButton(this);
    });
  });
}

// Oyun butonunu etkinleştir
function activateGameButton(gameBtn) {
  // Aynı filtrede tüm butonları pasif yap
  const parentFilter = gameBtn.closest('.game-filter');
  if (parentFilter) {
    parentFilter.querySelectorAll('.game-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  
  // Seçilen butonu aktif yap
  gameBtn.classList.add('active');
  
  // Oyun türünü al ve skorları göster
  const gameType = gameBtn.getAttribute('data-game');
  
  // URL'yi güncelle
  const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  window.history.replaceState({}, '', `?category=${activeCategory}&game=${gameType}`);
  
  // Oyun adını ve simgesini güncelle
  updateGameHeader(gameBtn);
  
  // Skorları görüntüle
  displayScoresForGameType(gameType);
}

// Oyun başlığını ve simgesini güncelle
function updateGameHeader(gameBtn) {
  const gameIcon = document.querySelector('.game-icon i');
  const gameName = document.querySelector('.game-name');
  
  if (gameIcon && gameName) {
    const btnIcon = gameBtn.querySelector('i').className;
    const btnName = gameBtn.querySelector('span').textContent;
    
    gameIcon.className = btnIcon;
    gameName.textContent = btnName;
  }
}

// Tüm oyunların skorlarını tek bir API çağrısıyla yükle
function loadAllScores() {
  fetch('/api/get-scores/all')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Alınan verileri global değişkene kaydet
      allGameScores = data;
      console.log("Tüm yüklenen skorlar:", allGameScores);
      
      // Leaderboard istatistiklerini hesapla
      calculateLeaderboardStats();
      
      // Aktif sekmenin oyun türünü bul
      const activeTab = document.querySelector('.game-filter-btn.active');
      if (activeTab) {
        const gameType = activeTab.getAttribute('data-game');
        displayScoresForGameType(gameType);
      }
    })
    .catch(error => {
      console.error("Error loading scores:", error);
    });
}

// Leaderboard istatistiklerini hesapla
function calculateLeaderboardStats() {
  // İlk kez initiate ediyoruz
  if (!leaderboardStats) {
    leaderboardStats = {
      totalGames: 0,
      highestScores: {},
      totalPlayers: new Set(),
      playerRanks: {}
    };
  } else {
    // Mevcut değerleri sıfırla
    leaderboardStats.totalGames = 0;
    leaderboardStats.highestScores = {};
    leaderboardStats.totalPlayers.clear();
    leaderboardStats.playerRanks = {};
  }
  
  // Tüm oyun türleri için istatistikleri hesapla
  for (const gameType in allGameScores) {
    const scores = allGameScores[gameType];
    if (!scores || !Array.isArray(scores)) continue;
    
    // Toplam oyun sayısını artır
    leaderboardStats.totalGames += scores.length;
    
    // Bu oyun türündeki en yüksek skoru bul
    if (scores.length > 0) {
      leaderboardStats.highestScores[gameType] = scores[0].score;
    } else {
      leaderboardStats.highestScores[gameType] = 0;
    }
    
    // Toplam benzersiz oyuncu sayısı
    scores.forEach(score => {
      if (score.user_id) {
        leaderboardStats.totalPlayers.add(score.user_id);
      }
      
      // Kullanıcının sıralamasını kaydet
      if (currentUserId && score.user_id === currentUserId) {
        leaderboardStats.playerRanks[gameType] = scores.indexOf(score) + 1;
      }
    });
  }
}

// Belirli bir oyun türü için skorları görüntüler (yerel cache'den)
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
    '3d-rotation': '3dRotation',
    
    // Hafıza Güçlendirme Oyunları
    'memory-cards': 'memoryCards',
    'number-chain': 'numberChain',
    'audio-memory': 'audioMemory',
    'n-back': 'nBack',
    
    // IQ Geliştirme Oyunları
    'sudoku': 'sudoku',
    '2048': '2048',
    'chess': 'chess',
    'logic-puzzles': 'logicPuzzles',
    'tangram': 'tangram',
    'rubik-cube': 'rubikCube'
  };
  
  const internalGameType = gameTypeMap[gameType];
  
  // İstatistikleri güncelle
  updateLeaderboardStats(internalGameType);
  
  // Geliştirme aşamasında olan oyunlar için uyarı göster
  const developmentGames = ['audioMemory', 'rubikCube'];
  if (developmentGames.includes(internalGameType)) {
    container.innerHTML = `
      <div class="no-scores warning-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Bu oyun şu anda geliştirme aşamasındadır ve yakında yenilenmiş haliyle kullanıma sunulacaktır.</p>
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
  
  // Cache'de skorlar varsa, onları göster
  if (allGameScores && allGameScores[internalGameType]) {
    const scores = allGameScores[internalGameType];
    
    if (scores.length === 0) {
      container.innerHTML = `
        <div class="no-scores">
          <i class="fas fa-trophy empty-trophy"></i>
          <p>Bu oyun için henüz skor kaydedilmemiş</p>
          <p class="sub-text">İlk yüksek skoru sen kaydet!</p>
        </div>
      `;
      return;
    }
    
    // Skor tablosunu oluştur
    let html = '';
    
    scores.forEach((score, index) => {
      // Kullanıcı avatar renkleri
      const avatarColors = [
        'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
        'linear-gradient(45deg, #6A5AE0, #9F8AFF)',
        'linear-gradient(45deg, #48CFAD, #6BE5C3)',
        'linear-gradient(45deg, #FFCE54, #FFD980)',
        'linear-gradient(45deg, #5D9CEC, #8CB4F5)'
      ];
      const randomColor = avatarColors[index % avatarColors.length];
      
      // Avatar için kullanıcı adının ilk harfi
      const initial = (score.username || 'Anonim').charAt(0).toUpperCase();
      
      // Tarih ve saat formatla
      const scoreDate = new Date(score.timestamp);
      const formattedDate = new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(scoreDate);
      
      const formattedTime = new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(scoreDate);
      
      // Mevcut kullanıcının skoru mu kontrol et
      const isCurrentUser = currentUserId && score.user_id === currentUserId;
      
      // Her bir skor için HTML oluştur
      html += `
        <div class="table-row ${index < 3 ? 'top-rank top-rank-' + (index + 1) : ''} ${isCurrentUser ? 'current-user-score' : ''}" data-rank="${index + 1}">
          <div class="rank-cell">
            ${index < 3 ? 
              `<div class="rank-trophy rank-${index + 1}">
                 <i class="fas fa-trophy"></i>
               </div>` : 
              `<div class="rank-number">${index + 1}</div>`
            }
          </div>
          
          <div class="username-cell">
            <div class="player-info">
              <div class="avatar" style="background: ${randomColor}">
                ${initial}
              </div>
              <div class="player-details">
                <span class="username">${score.username || 'Anonim'}</span>
                ${score.rank ? `<span class="player-rank">${score.rank}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="score-cell">
            <div class="score-badge">
              <span>${score.score}</span>
              <div class="score-spark"></div>
            </div>
          </div>
          
          <div class="date-cell">
            <div class="date-time">
              <span class="date">${formattedDate}</span>
              <span class="time">${formattedTime}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
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
      
      // Kullanıcının kendi skorunu vurgula
      const currentUserScore = document.querySelector('.current-user-score');
      if (currentUserScore) {
        currentUserScore.classList.add('highlight-user');
      }
    }, 100);
  } else {
    // Oyun türü için skor bulunamadıysa
    container.innerHTML = `
      <div class="no-scores">
        <i class="fas fa-trophy empty-trophy"></i>
        <p>Bu oyun için henüz skor kaydedilmemiş</p>
        <p class="sub-text">İlk yüksek skoru sen kaydet!</p>
      </div>
    `;
  }
}

// Leaderboard istatistiklerini güncelle
function updateLeaderboardStats(gameType) {
  // leaderboardStats henüz tanımlanmadıysa işlemi atla
  if (!leaderboardStats) {
    // İlk başlangıçta leaderboardStats'i tanımla ve boş değerlerle doldur
    calculateLeaderboardStats();
  }
  
  // Toplam oyun sayısı
  const totalGamesElement = document.getElementById('total-games');
  if (totalGamesElement) {
    totalGamesElement.textContent = leaderboardStats.totalGames || 0;
  }
  
  // Bu oyun türü için en yüksek skor (eğer yoksa 0 göster)
  const highestScoreElement = document.getElementById('highest-score');
  if (highestScoreElement) {
    // Güvenlik kontrolü: gameType undefined olabilir veya highestScores'da bu oyun olmayabilir
    const highestScore = gameType && leaderboardStats.highestScores && 
                        leaderboardStats.highestScores[gameType] !== undefined ? 
                        leaderboardStats.highestScores[gameType] : 0;
    highestScoreElement.textContent = highestScore;
  }
  
  // Toplam oyuncu sayısı
  const totalPlayersElement = document.getElementById('total-players');
  if (totalPlayersElement) {
    // Güvenlik kontrolü: totalPlayers henüz Set olarak tanımlanmamış olabilir
    const playerCount = leaderboardStats.totalPlayers && leaderboardStats.totalPlayers.size ? 
                       leaderboardStats.totalPlayers.size : 0;
    totalPlayersElement.textContent = playerCount;
  }
  
  // Kullanıcının sıralaması
  const yourRankElement = document.getElementById('your-rank');
  if (yourRankElement) {
    // Güvenlik kontrolü: playerRanks tanımlanmamış veya gameType olmayabilir
    const yourRank = gameType && leaderboardStats.playerRanks && 
                    leaderboardStats.playerRanks[gameType] !== undefined ? 
                    leaderboardStats.playerRanks[gameType] : '-';
    yourRankElement.textContent = yourRank;
  }
}

// Sayfa gizlendiğinde veya kapatıldığında otomatik güncellemeyi durdur
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Görünmeyen sayfada güncellemeleri durdur
    clearInterval(window.scoreUpdateInterval);
  } else {
    // Sayfa görünür olduğunda güncellemeleri yeniden başlat
    loadAllScores();
    window.scoreUpdateInterval = setInterval(loadAllScores, 30000);
  }
});
// Global variables
let allScores = {};
let currentUserId = null;
let activeGameType = 'word-puzzle';
let activeCategory = 'all';

// Initialize the page when loaded
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  getCurrentUser();
  loadAllScores();
});

// Set up event listeners for all interactive elements
function setupEventListeners() {
  // Category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const category = this.dataset.category;
      setActiveCategory(category);
    });
  });

  // Game filter buttons
  document.querySelectorAll('.game-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const gameType = this.dataset.game;
      setActiveGame(gameType);
    });
  });

  // Refresh button
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      loadAllScores();
    });
  }
}

// Set active category and show appropriate game filters
function setActiveCategory(category) {
  // Update active state of category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  activeCategory = category;
  
  // Show/hide appropriate game filters
  document.querySelectorAll('.game-filter').forEach(filter => {
    if (filter.dataset.filterCategory === category) {
      filter.style.display = 'flex';
    } else {
      filter.style.display = 'none';
    }
  });
  
  // Select first game filter button in the category
  const firstGameButton = document.querySelector(`.game-filter[data-filter-category="${category}"] .game-filter-btn`);
  if (firstGameButton) {
    setActiveGame(firstGameButton.dataset.game);
  }
}

// Set active game and display scores
function setActiveGame(gameType) {
  // Update active state of game filter buttons
  document.querySelectorAll('.game-filter-btn').forEach(btn => {
    if (btn.dataset.game === gameType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  activeGameType = gameType;
  
  // Update game icon and name in header
  updateGameDisplay(gameType);
  
  // Display scores for selected game
  displayScores(gameType);
}

// Update game icon and name in the header
function updateGameDisplay(gameType) {
  const gameIconContainer = document.querySelector('.game-icon-container');
  const gameIcon = gameIconContainer.querySelector('.game-icon i');
  const gameName = gameIconContainer.querySelector('.game-name');
  
  // Define game display information
  const gameInfo = {
    'word-puzzle': { icon: 'font', name: 'Kelime Bulmaca' },
    'memory-match': { icon: 'brain', name: 'Hafıza Kartları' },
    'labyrinth': { icon: 'route', name: 'Labirent' },
    'puzzle': { icon: 'puzzle-piece', name: 'Yapboz' },
    'number-sequence': { icon: 'sort-numeric-up', name: 'Sayı Dizisi' },
    'memory-cards': { icon: 'clone', name: 'Kart Eşleştirme' },
    'number-chain': { icon: 'link', name: 'Sayı Zinciri' },
    'audio-memory': { icon: 'music', name: 'Sesli Hafıza' },
    'n-back': { icon: 'braille', name: 'N-Back Testi' },
    'sudoku': { icon: 'th', name: 'Sudoku' },
    '2048': { icon: 'cubes', name: '2048' },
    'chess': { icon: 'chess', name: 'Satranç' },
    'logic-puzzles': { icon: 'project-diagram', name: 'Mantık Bulmacaları' },
    'tangram': { icon: 'shapes', name: 'Tangram' },
    '3d-rotation': { icon: 'cube', name: '3D Döndürme' },
    'rubik-cube': { icon: 'dice', name: 'Rubik Küpü' }
  };
  
  // Set icon and name based on selected game
  const info = gameInfo[gameType] || { icon: 'gamepad', name: 'Oyun' };
  gameIcon.className = `fas fa-${info.icon}`;
  gameName.textContent = info.name;
}

// Get current user ID
function getCurrentUser() {
  fetch('/api/get-current-user')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user_id) {
        currentUserId = data.user_id;
      }
    })
    .catch(error => {
      console.error('Error fetching current user:', error);
    });
}

// Load all scores for all game types
function loadAllScores() {
  fetch('/api/get-scores/all')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Tüm yüklenen skorlar:', data);
      allScores = data;
      displayScores(activeGameType);
      updateStatistics();
    })
    .catch(error => {
      console.error('Error loading all scores:', error);
      displayError();
    });
}

// Display scores for a specific game type
function displayScores(gameType) {
  console.log('Skor yükleniyor:', gameType);
  const scoresContainer = document.getElementById('scores-container');
  const gameTypeKey = convertGameTypeToKey(gameType);
  
  // Get scores for the specific game type
  const scores = allScores[gameTypeKey] || [];
  
  // Clear existing content
  scoresContainer.innerHTML = '';
  
  if (scores.length === 0) {
    scoresContainer.innerHTML = `
      <div class="no-scores">
        <i class="fas fa-trophy-alt"></i>
        <p>Bu oyun için henüz skor kaydedilmemiş.</p>
        <p>İlk sırada yer almak için hemen oynamaya başlayın!</p>
      </div>
    `;
    return;
  }
  
  // Create score rows
  scores.forEach((score, index) => {
    const isCurrentUser = currentUserId && score.user_id === currentUserId;
    const row = document.createElement('div');
    row.className = `table-row ${index < 3 ? 'top-rank' : ''} ${isCurrentUser ? 'current-user-score' : ''}`;
    
    // Create rank cell with trophy for top 3
    let rankHTML = '';
    if (index === 0) {
      rankHTML = '<div class="rank-trophy gold"><i class="fas fa-trophy"></i></div>';
    } else if (index === 1) {
      rankHTML = '<div class="rank-trophy silver"><i class="fas fa-trophy"></i></div>';
    } else if (index === 2) {
      rankHTML = '<div class="rank-trophy bronze"><i class="fas fa-trophy"></i></div>';
    } else {
      rankHTML = `<div class="rank-cell">${index + 1}</div>`;
    }
    
    // Format date
    const date = new Date(score.timestamp);
    const formattedDate = date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Create row HTML
    row.innerHTML = `
      ${rankHTML}
      <div class="username-cell">
        <div class="user-info">
          <div class="avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="username">${score.username || 'Anonim'}</div>
        </div>
      </div>
      <div class="score-cell">${score.score}</div>
      <div class="date-cell">${formattedDate}</div>
    `;
    
    scoresContainer.appendChild(row);
  });
}

// Convert game type from URL format to API key format
function convertGameTypeToKey(gameType) {
  const map = {
    'word-puzzle': 'wordPuzzle',
    'memory-match': 'memoryMatch',
    'labyrinth': 'labyrinth',
    'puzzle': 'puzzle',
    'number-sequence': 'numberSequence',
    'memory-cards': 'memoryCards',
    'number-chain': 'numberChain',
    'audio-memory': 'audioMemory',
    'n-back': 'nBack',
    'sudoku': 'sudoku',
    '2048': '2048',
    'chess': 'chess',
    'logic-puzzles': 'logicPuzzles',
    'tangram': 'tangram',
    '3d-rotation': '3dRotation',
    'rubik-cube': 'rubikCube'
  };
  return map[gameType] || gameType;
}

// Update statistics in the leaderboard card
function updateStatistics() {
  const totalGamesElement = document.getElementById('total-games');
  const highestScoreElement = document.getElementById('highest-score');
  const totalPlayersElement = document.getElementById('total-players');
  const yourRankElement = document.getElementById('your-rank');
  
  // Calculate total games, unique players, and highest score
  let totalGames = 0;
  let uniquePlayers = new Set();
  let highestScore = 0;
  
  Object.values(allScores).forEach(gameScores => {
    totalGames += gameScores.length;
    
    gameScores.forEach(score => {
      uniquePlayers.add(score.user_id);
      if (score.score > highestScore) {
        highestScore = score.score;
      }
    });
  });
  
  // Find user's rank
  let userRank = 'Sıralamada yok';
  if (currentUserId) {
    const gameTypeKey = convertGameTypeToKey(activeGameType);
    const gameScores = allScores[gameTypeKey] || [];
    
    const userIndex = gameScores.findIndex(score => score.user_id === currentUserId);
    if (userIndex !== -1) {
      userRank = `${userIndex + 1}. sırada`;
    }
  }
  
  // Update stats display
  totalGamesElement.textContent = totalGames;
  highestScoreElement.textContent = highestScore;
  totalPlayersElement.textContent = uniquePlayers.size;
  yourRankElement.textContent = userRank;
}

// Display error message when loading scores fails
function displayError() {
  const scoresContainer = document.getElementById('scores-container');
  scoresContainer.innerHTML = `
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Skorlar yüklenirken bir hata oluştu.</p>
      <p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
    </div>
  `;
}
