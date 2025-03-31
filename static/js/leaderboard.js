document.addEventListener('DOMContentLoaded', function() {
  // Kategori düğmelerini işle
  const categoryButtons = document.querySelectorAll('.category-btn');
  const gameFilters = document.querySelectorAll('.game-filter');

  // Varsayılan oyun türü
  let currentGameType = 'word-puzzle';
  // Skorları saklamak için global değişken
  let allScores = {};

  // Kullanıcı ID'sini alın (varsa)
  const currentUserId = document.querySelector('meta[name="user-id"]')?.content || null;

  // Kategori düğmesi tıklamaları
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.category;

      // Aktif düğmeyi güncelle
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // İlgili oyun filtrelerini göster
      gameFilters.forEach(filter => {
        if (filter.dataset.filterCategory === category) {
          filter.style.display = 'flex';

          // Kategori değiştiğinde, mevcut kategoride ilk oyunu seç
          const firstGameBtn = filter.querySelector('.game-filter-btn');
          if (firstGameBtn) {
            // Tüm oyun filtre düğmelerini deaktive et
            document.querySelectorAll('.game-filter-btn').forEach(btn => {
              btn.classList.remove('active');
            });

            // İlk oyunu aktifleştir ve skorları yükle
            firstGameBtn.classList.add('active');
            currentGameType = firstGameBtn.dataset.game;
            loadScores(currentGameType);
            updateGameIcon(currentGameType);
          }
        } else {
          filter.style.display = 'none';
        }
      });
    });
  });

  // Oyun filtre düğmesi tıklamaları
  const gameFilterButtons = document.querySelectorAll('.game-filter-btn');
  gameFilterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Aktif düğmeyi güncelle
      gameFilterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Seçilen oyun tipini güncelle ve skorları yükle
      currentGameType = this.dataset.game;
      loadScores(currentGameType);
      updateGameIcon(currentGameType);
    });
  });

  // Yenileme düğmesi tıklaması
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      loadScores(currentGameType);
      this.classList.add('rotating');
      setTimeout(() => {
        this.classList.remove('rotating');
      }, 1000);
    });
  }

  // Oyun ikonunu güncelle
  function updateGameIcon(gameType) {
    const gameIcons = {
      'word-puzzle': 'fa-font',
      'memory-match': 'fa-brain',
      'labyrinth': 'fa-route',
      'puzzle': 'fa-puzzle-piece',
      'number-sequence': 'fa-sort-numeric-up',
      'memory-cards': 'fa-clone',
      'number-chain': 'fa-link',
      'audio-memory': 'fa-music',
      'n-back': 'fa-braille',
      'sudoku': 'fa-th',
      '2048': 'fa-cubes',
      'chess': 'fa-chess',
      'logic-puzzles': 'fa-project-diagram',
      'tangram': 'fa-shapes',
      '3d-rotation': 'fa-cube',
      'rubik-cube': 'fa-dice'
    };

    const gameNames = {
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
      'rubik-cube': 'Rubik Küpü'
    };

    const iconElement = document.querySelector('.game-icon i');
    const nameElement = document.querySelector('.game-name');

    if (iconElement && gameIcons[gameType]) {
      // Mevcut tüm sınıfları kaldır
      iconElement.className = '';
      // Yeni ikon sınıfını ekle
      iconElement.classList.add('fas', gameIcons[gameType]);
    }

    if (nameElement && gameNames[gameType]) {
      nameElement.textContent = gameNames[gameType];
    }
  }

  // API'den skorları yükle
  async function loadScores(gameType) {
    try {
      console.log("Skor yükleniyor:", gameType);

      const scoresContainer = document.getElementById('scores-container');

      // Yükleme göstergesini ekle
      scoresContainer.innerHTML = `
        <div class="loading-scores">
          <div class="spinner"></div>
          <p>Skorlar yükleniyor...</p>
        </div>
      `;

      // Mevcut skorları kontrol et
      if (allScores[gameType]) {
        // Zaten yüklendiyse, mevcut skorları kullan
        renderScores(allScores[gameType]);
        updateStats(allScores[gameType]);
        return;
      }

      // API'den skorları yükle
      const response = await fetch(`/api/scores/${gameType}`);

      if (!response.ok) {
        throw new Error('Skorlar yüklenirken bir hata oluştu.');
      }

      const scores = await response.json();

      // Tüm skorları global değişkene kaydet
      if (!allScores[gameType]) {
        allScores[gameType] = scores;
      }

      console.log("Tüm yüklenen skorlar:", allScores);

      // Skorları render et
      renderScores(scores);

      // İstatistikleri güncelle
      updateStats(scores);

    } catch (error) {
      console.log("Error loading scores:", error);

      const scoresContainer = document.getElementById('scores-container');
      scoresContainer.innerHTML = `
        <div class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
    }
  }

  // Skorları tabloya yerleştir
  function renderScores(scores) {
    const scoresContainer = document.getElementById('scores-container');
    scoresContainer.innerHTML = '';

    if (!scores || scores.length === 0) {
      scoresContainer.innerHTML = `
        <div class="no-scores">
          <i class="fas fa-trophy"></i>
          <p>Henüz skor bulunmuyor. İlk skoru kazanmak için oyunu oynayın!</p>
        </div>
      `;
      return;
    }

    // Skorları en yüksekten en düşüğe sırala
    scores.sort((a, b) => b.score - a.score);

    // En fazla 10 skor göster
    const topScores = scores.slice(0, 10);

    topScores.forEach((score, index) => {
      // Tarih formatını düzenle
      const scoreDate = new Date(score.timestamp);
      const formattedDate = scoreDate.toLocaleDateString('tr-TR');

      // Sıralama için özel stil
      let rankClass = '';
      let rankIcon = '';

      if (index === 0) {
        rankClass = 'rank-gold';
        rankIcon = '<i class="fas fa-trophy gold"></i>';
      } else if (index === 1) {
        rankClass = 'rank-silver';
        rankIcon = '<i class="fas fa-trophy silver"></i>';
      } else if (index === 2) {
        rankClass = 'rank-bronze';
        rankIcon = '<i class="fas fa-trophy bronze"></i>';
      }

      // Kullanıcı kendisiyse özel stil
      const isCurrentUser = currentUserId && score.user_id === parseInt(currentUserId);
      const rowClass = isCurrentUser ? 'current-user' : '';

      // Yeni satır oluştur
      const row = document.createElement('div');
      row.className = `table-row ${rowClass}`;
      row.innerHTML = `
        <div class="rank-cell">
          ${rankIcon || `<span class="rank-number">${index + 1}</span>`}
        </div>
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

  // İstatistikleri güncelle
  function updateStats(scores) {
    if (!scores) return;

    const totalGamesEl = document.getElementById('total-games');
    const highestScoreEl = document.getElementById('highest-score');
    const totalPlayersEl = document.getElementById('total-players');
    const yourRankEl = document.getElementById('your-rank');

    // Toplam oyun sayısı
    if (totalGamesEl) {
      totalGamesEl.textContent = scores.length;
    }

    // En yüksek skor
    if (highestScoreEl && scores.length > 0) {
      const maxScore = Math.max(...scores.map(s => s.score));
      highestScoreEl.textContent = maxScore;
    } else if (highestScoreEl) {
      highestScoreEl.textContent = '0';
    }

    // Toplam oyuncu sayısı (tekil kullanıcı_id'lerini say)
    if (totalPlayersEl) {
      const uniquePlayerIds = new Set(scores.map(s => s.user_id));
      totalPlayersEl.textContent = uniquePlayerIds.size;
    }

    // Kullanıcının sıralaması
    if (yourRankEl && currentUserId) {
      // Skorları puanlara göre sırala
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);

      // Kullanıcının sıralamasını bul
      const userRank = sortedScores.findIndex(s => s.user_id === parseInt(currentUserId)) + 1;

      if (userRank > 0) {
        yourRankEl.textContent = userRank;
      } else {
        yourRankEl.textContent = '-';
      }
    } else if (yourRankEl) {
      yourRankEl.textContent = '-';
    }
  }

  // Sayfa yüklendiğinde varsayılan oyun skorlarını yükle
  loadScores(currentGameType);
  updateGameIcon(currentGameType);

  // "Tüm Oyunlar" kategorisini otomatik olarak doldurmak için
  const allCategoryFilter = document.querySelector('.game-filter[data-filter-category="all"]');
  if (allCategoryFilter) {
    // Diğer kategorilerden oyun filtrelerini kopyala
    const otherFilters = document.querySelectorAll('.game-filter:not([data-filter-category="all"]) .game-filter-btn');
    otherFilters.forEach(btn => {
      const cloneBtn = btn.cloneNode(true);
      allCategoryFilter.appendChild(cloneBtn);

      // Klonlanmış düğmeye olay dinleyici ekle
      cloneBtn.addEventListener('click', function() {
        // Aktif düğmeyi güncelle
        document.querySelectorAll('.game-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');

        // Seçilen oyun tipini güncelle ve skorları yükle
        currentGameType = this.dataset.game;
        loadScores(currentGameType);
        updateGameIcon(currentGameType);
      });
    });
  }

  // Mevcut kullanıcı kimliğini al (oturumdan) - from original code
  getCurrentUserId();

  // 30 saniyede bir skorları otomatik güncelle - from original code
  setInterval(loadAllScores, 30000);

  // Mevcut kullanıcı kimliğini al - from original code
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

  // Tüm oyunların skorlarını tek bir API çağrısıyla yükle - from original code
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
        allScores = data;
        console.log("Tüm yüklenen skorlar:", allScores);

        // Aktif sekmenin oyun türünü bul
        const activeTab = document.querySelector('.game-filter-btn.active');
        if (activeTab) {
          const gameType = activeTab.getAttribute('data-game');
          loadScores(gameType); // Use the new loadScores function
          updateGameIcon(gameType); // Use the new updateGameIcon function
        }
      })
      .catch(error => {
        console.error("Error loading scores:", error);
      });
  }

  // Sayfa gizlendiğinde veya kapatıldığında otomatik güncellemeyi durdur - from original code
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
});