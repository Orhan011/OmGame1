
document.addEventListener('DOMContentLoaded', function() {
  // Kullanıcı ID'sini al
  const userMetaTag = document.querySelector('meta[name="user-id"]');
  let currentUserId = null;
  
  if (userMetaTag) {
    currentUserId = parseInt(userMetaTag.getAttribute('content'));
  }
  
  // DOM elementi referansları
  const scoresContainer = document.getElementById('scores-container');
  const totalGamesElement = document.getElementById('total-games');
  const highestScoreElement = document.getElementById('highest-score');
  const totalPlayersElement = document.getElementById('total-players');
  const yourRankElement = document.getElementById('your-rank');
  const performanceGraph = document.getElementById('performance-graph');
  const refreshBtn = document.querySelector('.refresh-btn');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const gameFilterBtns = document.querySelectorAll('.game-filter-btn');
  const gameFilters = document.querySelectorAll('.game-filter');
  const gameNameElement = document.querySelector('.game-name');
  const gameIconElement = document.querySelector('.game-icon i');
  
  // En son seçilen oyun kategorisi ve oyunu
  let currentCategory = 'all';
  let currentGame = 'word-puzzle';
  let allGames = {};
  let loadedScores = {};
  
  // Oyunların ikonları
  const gameIcons = {
    'word-puzzle': 'fas fa-font',
    'memory-match': 'fas fa-brain',
    'labyrinth': 'fas fa-route',
    'puzzle': 'fas fa-puzzle-piece',
    'number-sequence': 'fas fa-sort-numeric-up',
    'memory-cards': 'fas fa-clone',
    'number-chain': 'fas fa-link',
    'audio-memory': 'fas fa-music',
    'n-back': 'fas fa-braille',
    'sudoku': 'fas fa-th',
    '2048': 'fas fa-cubes',
    'chess': 'fas fa-chess',
    'logic-puzzles': 'fas fa-project-diagram',
    'tangram': 'fas fa-shapes',
    '3d-rotation': 'fas fa-cube',
    'rubik-cube': 'fas fa-dice'
  };
  
  // Oyun-kategori eşleştirme
  const gameCategories = {
    'word-puzzle': 'basic',
    'memory-match': 'basic',
    'labyrinth': 'basic',
    'puzzle': 'basic',
    'number-sequence': 'basic',
    'memory-cards': 'memory',
    'number-chain': 'memory',
    'audio-memory': 'memory',
    'n-back': 'memory',
    'sudoku': 'iq',
    '2048': 'iq',
    'chess': 'iq',
    'logic-puzzles': 'iq',
    'tangram': 'iq',
    '3d-rotation': 'puzzle',
    'rubik-cube': 'puzzle'
  };
  
  // Oyun tipi adları
  const gameTypeNames = {
    'word-puzzle': 'Kelime Bulmaca',
    'memory-match': 'Hafıza Kartları',
    'labyrinth': 'Labirent',
    'puzzle': 'Yapboz',
    'number-sequence': 'Sayı Dizisi',
    'memory-cards': 'Kart Eşleştirme',
    'number-chain': 'Sayı Zinciri',
    'audio-memory': 'Sesli Hafıza',
    'n-back': 'N-Back Testi',
    'sudoku': 'Sudoku',
    '2048': '2048',
    'chess': 'Satranç',
    'logic-puzzles': 'Mantık Bulmacaları',
    'tangram': 'Tangram',
    '3d-rotation': '3D Döndürme',
    'rubik-cube': 'Rubik Küpü',
    'visualAttention': 'Görsel Dikkat'
  };
  
  // Oyun API Eşleştirmesi
  const gameApiMapping = {
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
  
  // Aktif kategoriye geçiş
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Diğer kategori butonlarından active sınıfını kaldır
      categoryBtns.forEach(b => b.classList.remove('active'));
      // Bu butona active sınıfını ekle
      this.classList.add('active');
      
      // Kategoriyi güncelle
      currentCategory = this.getAttribute('data-category');
      
      // Filtre alanlarını göster/gizle
      gameFilters.forEach(filter => {
        const filterCategory = filter.getAttribute('data-filter-category');
        if (currentCategory === 'all' || filterCategory === currentCategory) {
          filter.style.display = 'flex';
        } else {
          filter.style.display = 'none';
        }
      });
      
      // 'all' kategorisi seçildiğinde tüm oyunları filtre kısmına ekle
      if (currentCategory === 'all') {
        populateAllGamesFilter();
      }
      
      // İçeriği güncelle
      if (currentCategory === 'all') {
        // Tüm kategoriler gösterildiğinde varsayılan oyunu seç
        updateGameSelection('word-puzzle');
      } else {
        // İlgili kategorideki ilk oyunu seç
        const firstGameBtn = document.querySelector(`.game-filter[data-filter-category="${currentCategory}"] .game-filter-btn`);
        if (firstGameBtn) {
          const gameType = firstGameBtn.getAttribute('data-game');
          updateGameSelection(gameType);
        }
      }
    });
  });
  
  // Oyun butonları için olay dinleyicileri
  gameFilterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Tüm oyun filtre butonlarından active sınıfını kaldır
      gameFilterBtns.forEach(b => b.classList.remove('active'));
      // Bu butona active sınıfını ekle
      this.classList.add('active');
      
      // Oyunu güncelle
      const gameType = this.getAttribute('data-game');
      updateGameSelection(gameType);
    });
  });
  
  // Yenile butonu için olay dinleyici
  refreshBtn.addEventListener('click', function() {
    this.classList.add('rotating');
    loadScores(currentGame);
    
    setTimeout(() => {
      this.classList.remove('rotating');
    }, 1000);
  });
  
  // "Tüm Oyunlar" filtresini doldur
  function populateAllGamesFilter() {
    const allGamesFilter = document.querySelector('.game-filter[data-filter-category="all"]');
    allGamesFilter.innerHTML = '';
    
    // Tüm oyunları ekle
    Object.keys(gameTypeNames).forEach(gameType => {
      if (gameType === 'visualAttention') return; // Bu oyunu atlayın
      
      const button = document.createElement('button');
      button.className = 'game-filter-btn';
      button.setAttribute('data-game', gameType);
      
      if (gameType === currentGame) {
        button.classList.add('active');
      }
      
      button.innerHTML = `
        <i class="${gameIcons[gameType] || 'fas fa-gamepad'}"></i>
        <span>${gameTypeNames[gameType]}</span>
      `;
      
      button.addEventListener('click', function() {
        gameFilterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updateGameSelection(gameType);
      });
      
      allGamesFilter.appendChild(button);
    });
  }
  
  // Oyun seçimini güncelle
  function updateGameSelection(gameType) {
    currentGame = gameType;
    
    // Oyun adı ve ikonunu güncelle
    gameNameElement.textContent = gameTypeNames[gameType] || gameType;
    gameIconElement.className = gameIcons[gameType] || 'fas fa-gamepad';
    
    // Skorları yükle
    loadScores(gameType);
  }
  
  // Skorları yükle
  function loadScores(gameType) {
    // Yükleniyor göstergesini göster
    scoresContainer.innerHTML = `
      <div class="loading-scores">
        <div class="spinner"></div>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;
    
    console.log("Skor yükleniyor:", gameType);
    
    // API'den skorları getir
    fetch(`/api/scores?game=${gameApiMapping[gameType] || gameType}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Skorlar yüklenirken bir hata oluştu');
        }
        return response.json();
      })
      .then(data => {
        // Skorları işle ve göster
        displayScores(data, gameType);
        
        // Tüm skorları ön bellekte sakla
        loadedScores[gameType] = data;
        
        // Tüm skorları bir kez yükle (ilk yüklemede)
        if (Object.keys(loadedScores).length === 1) {
          loadAllScores();
        }
      })
      .catch(error => {
        console.error("Error loading scores:", error);
        
        // Hata mesajını göster
        scoresContainer.innerHTML = `
          <div class="error-container">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }
  
  // Tüm oyunların skorlarını ön belleğe al
  function loadAllScores() {
    Promise.all(
      Object.keys(gameApiMapping).map(gameType => 
        fetch(`/api/scores?game=${gameApiMapping[gameType]}`)
          .then(response => {
            if (!response.ok) {
              return [];
            }
            return response.json();
          })
          .then(data => {
            loadedScores[gameType] = data;
            return data;
          })
          .catch(error => {
            console.error("Error loading all scores:", error);
            return [];
          })
      )
    ).then(allData => {
      console.log("Tüm yüklenen skorlar:", loadedScores);
      updatePerformanceGraph();
    });
  }
  
  // Skorları görüntüle
  function displayScores(scores, gameType) {
    if (!Array.isArray(scores) || scores.length === 0) {
      // Skor yoksa mesaj göster
      scoresContainer.innerHTML = `
        <div class="no-scores">
          <i class="fas fa-trophy"></i>
          <p>Henüz bu oyun için skor kaydedilmemiş.</p>
          <p>İlk sırada yer almak için hemen oynamaya başlayın!</p>
        </div>
      `;
      
      // İstatistikleri sıfırla
      totalGamesElement.textContent = '0';
      highestScoreElement.textContent = '0';
      totalPlayersElement.textContent = '0';
      yourRankElement.textContent = '-';
      
      // Podyumu sıfırla
      resetPodium();
      
      return;
    }
    
    // Skorları tarihe göre sırala (en yeniden en eskiye)
    scores.sort((a, b) => {
      return b.score - a.score;
    });
    
    // İstatistikleri güncelle
    totalGamesElement.textContent = scores.length;
    highestScoreElement.textContent = scores[0]?.score || '0';
    
    // Benzersiz oyuncuları say
    const uniquePlayers = new Set(scores.map(score => score.user_id));
    totalPlayersElement.textContent = uniquePlayers.size;
    
    // Kullanıcının sırasını bul
    let userRank = '-';
    if (currentUserId) {
      const userScoreIndex = scores.findIndex(score => score.user_id === currentUserId);
      if (userScoreIndex !== -1) {
        userRank = (userScoreIndex + 1).toString();
      }
    }
    yourRankElement.textContent = userRank;
    
    // Skorları göster
    scoresContainer.innerHTML = '';
    
    // En iyi 3 skoru podyuma yerleştir
    updatePodium(scores.slice(0, 3));
    
    // Tüm skorları tabloya ekle
    scores.forEach((score, index) => {
      const isCurrentUser = score.user_id === currentUserId;
      const isTopRank = index < 3;
      
      const row = document.createElement('div');
      row.className = `table-row ${isCurrentUser ? 'current-user' : ''} ${isTopRank ? `top-rank-${index + 1}` : ''}`;
      
      // Avatar için baş harfi al
      const initial = score.username ? score.username.charAt(0).toUpperCase() : '?';
      
      // Skor değişimi (rastgele örnek veri)
      const scoreChange = Math.random() > 0.5 ? 
        `<span class="score-change score-increase"><i class="fas fa-caret-up"></i> ${Math.floor(Math.random() * 50)}</span>` : 
        `<span class="score-change score-decrease"><i class="fas fa-caret-down"></i> ${Math.floor(Math.random() * 30)}</span>`;
      
      row.innerHTML = `
        <div class="rank-cell">
          <div class="rank-number">${index + 1}</div>
        </div>
        <div class="username-cell">
          <div class="user-avatar">${initial}</div>
          <div class="user-info">
            <div class="username">${score.username || 'Anonim'}</div>
            <div class="user-rank">${score.rank || 'Başlangıç'}</div>
          </div>
        </div>
        <div class="score-cell">
          ${score.score}
          ${Math.random() > 0.7 ? scoreChange : ''}
        </div>
        <div class="date-cell">${formatDate(score.timestamp)}</div>
      `;
      
      scoresContainer.appendChild(row);
    });
    
    // Performans grafiğini güncelle
    updatePerformanceGraph();
  }
  
  // Podyumu güncelle
  function updatePodium(topScores) {
    const podiumItems = document.querySelectorAll('.podium-item');
    
    // Podyumu sıfırla
    resetPodium();
    
    // En iyi 3 skoru podyuma yerleştir
    topScores.forEach((score, index) => {
      if (index < 3) {
        const podiumItem = podiumItems[index === 0 ? 1 : (index === 1 ? 0 : 2)]; // 1. merkez, 2. sol, 3. sağ
        const avatarElement = podiumItem.querySelector('.podium-avatar');
        const nameElement = podiumItem.querySelector('.podium-name');
        const scoreElement = podiumItem.querySelector('.podium-score');
        
        // Avatar için baş harfi al
        const initial = score.username ? score.username.charAt(0).toUpperCase() : '?';
        
        avatarElement.textContent = initial;
        nameElement.textContent = score.username || 'Anonim';
        scoreElement.textContent = score.score;
        
        // Animasyon efekti ekle
        podiumItem.classList.add('animate-in');
        setTimeout(() => podiumItem.classList.remove('animate-in'), 1000);
      }
    });
  }
  
  // Podyumu sıfırla
  function resetPodium() {
    const podiumItems = document.querySelectorAll('.podium-item');
    
    podiumItems.forEach((item, index) => {
      const position = index === 0 ? 2 : (index === 1 ? 1 : 3);
      const avatarElement = item.querySelector('.podium-avatar');
      const nameElement = item.querySelector('.podium-name');
      const scoreElement = item.querySelector('.podium-score');
      
      avatarElement.textContent = position;
      nameElement.textContent = '-';
      scoreElement.textContent = '0';
    });
  }
  
  // Performans grafiğini güncelle
  function updatePerformanceGraph() {
    if (!performanceGraph) return;
    
    performanceGraph.innerHTML = '';
    
    // Grafikte gösterilecek kategorileri belirle
    const categoriesToShow = ['basic', 'memory', 'puzzle', 'iq'];
    
    // Her kategori için skoru hesapla
    const categoryScores = {};
    
    categoriesToShow.forEach(category => {
      categoryScores[category] = {
        totalScore: 0,
        gameCount: 0
      };
    });
    
    // Tüm oyunların skorlarını kategorilere göre topla
    Object.keys(loadedScores).forEach(gameType => {
      const category = gameCategories[gameType];
      if (category && categoriesToShow.includes(category)) {
        const scores = loadedScores[gameType];
        if (Array.isArray(scores) && scores.length > 0) {
          // En yüksek skoru al
          const highestScore = Math.max(...scores.map(s => s.score));
          categoryScores[category].totalScore += highestScore;
          categoryScores[category].gameCount++;
        }
      }
    });
    
    // En yüksek kategori skorunu bul (oranlamak için)
    let maxCategoryScore = 0;
    categoriesToShow.forEach(category => {
      const avgScore = categoryScores[category].gameCount > 0 ? 
                      categoryScores[category].totalScore / categoryScores[category].gameCount : 0;
      
      if (avgScore > maxCategoryScore) {
        maxCategoryScore = avgScore;
      }
    });
    
    if (maxCategoryScore === 0) maxCategoryScore = 100; // Sıfıra bölünmeyi önle
    
    // Kategori renklerini tanımla
    const categoryColors = {
      'basic': 'linear-gradient(to top, #6a5ae0, #9f8aff)',
      'memory': 'linear-gradient(to top, #ff6b6b, #ff9a9e)',
      'puzzle': 'linear-gradient(to top, #26c6da, #4dd0e1)',
      'iq': 'linear-gradient(to top, #66bb6a, #81c784)'
    };
    
    // Kategori isimlerini tanımla
    const categoryNames = {
      'basic': 'Temel',
      'memory': 'Hafıza',
      'puzzle': 'Bulmaca',
      'iq': 'IQ'
    };
    
    // Her kategori için çubuk oluştur
    categoriesToShow.forEach(category => {
      const avgScore = categoryScores[category].gameCount > 0 ? 
                      categoryScores[category].totalScore / categoryScores[category].gameCount : 0;
      
      // Yüksekliği 10% ile 90% arasında ölçekle
      let height = Math.max(10, Math.min(90, (avgScore / maxCategoryScore * 80) + 10));
      
      if (categoryScores[category].gameCount === 0) {
        height = 10; // Veri yoksa en düşük yükseklik
      }
      
      const bar = document.createElement('div');
      bar.className = 'graph-bar';
      bar.style.height = `${height}%`;
      bar.style.background = categoryColors[category] || '#6a5ae0';
      
      const label = document.createElement('div');
      label.className = 'graph-bar-label';
      label.textContent = categoryNames[category] || category;
      
      // Araç ipucu ekle
      bar.setAttribute('title', `${categoryNames[category]}: ${Math.round(avgScore)} puan`);
      
      bar.appendChild(label);
      performanceGraph.appendChild(bar);
    });
  }
  
  // Tarih formatla
  function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString.replace(/-/g, '/'));
    
    if (isNaN(date.getTime())) {
      return dateString; // Geçersiz tarih ise orjinalini göster
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Bugün
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `Bugün ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      // Dün
      return 'Dün';
    } else if (diffDays < 7) {
      // Son bir hafta
      return `${diffDays} gün önce`;
    } else {
      // Daha eski
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  }
  
  // Uygulama başlangıcında çalıştır
  populateAllGamesFilter();
  loadScores(currentGame);
  
  // Animasyonlar için CSS sınıfı ekle
  document.body.classList.add('has-animations');
});
