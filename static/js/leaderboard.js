document.addEventListener('DOMContentLoaded', function() {
  // Oyun türü sekmelerini yönet
  const gameTabs = document.querySelectorAll('.game-tab');
  let allScoresData = {};
  let currentTab = 'all'; // Varsayılan sekme

  // Tüm oyun türleri ve eşleşen API yolları
  const gameTypes = {
    'all': 'all',
    'wordPuzzle': 'word-puzzle',
    'memoryMatch': 'memory-match',
    'labyrinth': 'labyrinth',
    'puzzle': 'puzzle',
    'numberSequence': 'number-sequence',
    'memoryCards': 'memory-cards',
    'numberChain': 'number-chain',
    'audioMemory': 'audio-memory',
    'nBack': 'n-back',
    'sudoku': 'sudoku',
    '2048': '2048',
    'chess': 'chess',
    'logicPuzzles': 'logic-puzzles',
    'tangram': 'tangram',
    'rubikCube': 'rubik-cube',
    '3dRotation': '3d-rotation'
  };

  // Oyun türlerine karşılık gelen Türkçe isimler
  const gameNames = {
    'all': 'Tüm Oyunlar',
    'wordPuzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Eşleştirme',
    'labyrinth': 'Labirent',
    'puzzle': 'Puzzle',
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
    'rubikCube': 'Rubik Küp',
    '3dRotation': '3D Döndürme'
  };

  // Sayfa yüklendiğinde tüm skorları al
  fetchAllScores();

  // Sekme tıklama olayını dinle
  gameTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const gameType = this.getAttribute('data-game');

      // Aktif sekmeyi güncelle
      gameTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Seçilen oyun türüne göre skorları göster
      displayScores(gameType);
      currentTab = gameType;
    });
  });

  // Tüm oyun skorlarını getir
  function fetchAllScores() {
    // Yükleme göstergesi
    const container = document.getElementById('leaderboardsContainer');
    container.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Tüm skorlar yükleniyor...</p>
      </div>
    `;

    // Her oyun türü için skor verilerini al
    const promises = Object.keys(gameTypes).map(key => {
      if (key === 'all') return Promise.resolve(); // 'all' için API çağrısı yapmıyoruz
      return fetchScores(key);
    });

    // Tüm veri işlemleri tamamlandığında
    Promise.all(promises)
      .then(() => {
        console.log("Tüm yüklenen skorlar:", allScoresData);
        displayScores('all'); // Başlangıçta tüm skorları göster
      })
      .catch(error => {
        console.error("Skorlar yüklenirken hata oluştu:", error);
        container.innerHTML = `
          <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }

  // Belirli bir oyun türü için skorları getir
  function fetchScores(gameType) {
    console.log("Skor yükleniyor:", gameTypes[gameType]);

    return fetch(`/api/leaderboard/${gameTypes[gameType]}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Verileri saklayın
        allScoresData[gameType] = data;
      })
      .catch(error => {
        console.error("Error loading scores:", error);
        allScoresData[gameType] = [];
      });
  }

  // Skorları tabloda göster
  function displayScores(gameType) {
    const container = document.getElementById('leaderboardsContainer');
    container.innerHTML = ''; // Konteyneri temizle

    // 'all' türü için tüm oyun skorlarından kartlar oluştur
    if (gameType === 'all') {
      const allGames = Object.keys(gameTypes).filter(key => key !== 'all');

      // Her oyun türü için kart oluştur
      allGames.forEach(game => {
        const scores = allScoresData[game] || [];

        // Oyun kartını oluştur
        const card = document.createElement('div');
        card.className = 'leaderboard-card active';
        card.innerHTML = `
          <div class="card-header">
            <h3>${gameNames[game]}</h3>
            <button class="refresh-btn" data-game="${game}">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <div class="table-container">
            ${createScoreTable(scores, 5)} <!-- Sadece ilk 5 skoru göster -->
          </div>
        `;
        container.appendChild(card);

        // Yenileme butonunu etkinleştir
        const refreshBtn = card.querySelector('.refresh-btn');
        refreshBtn.addEventListener('click', function() {
          const gameType = this.getAttribute('data-game');
          refreshScores(gameType, this);
        });
      });
    } else {
      // Belirli bir oyun türü için tam tablo göster
      const scores = allScoresData[gameType] || [];

      // Oyun kartını oluştur
      const card = document.createElement('div');
      card.className = 'leaderboard-card active';
      card.innerHTML = `
        <div class="card-header">
          <h3>${gameNames[gameType]}</h3>
          <button class="refresh-btn" data-game="${gameType}">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        <div class="table-container">
          ${createScoreTable(scores)}
        </div>
      `;
      container.appendChild(card);

      // Yenileme butonunu etkinleştir
      const refreshBtn = card.querySelector('.refresh-btn');
      refreshBtn.addEventListener('click', function() {
        const gameType = this.getAttribute('data-game');
        refreshScores(gameType, this);
      });
    }
  }

  // Oyun skorlarını yenile
  function refreshScores(gameType, button) {
    // Yenileme animasyonu
    button.classList.add('rotating');

    // Skorları yeniden yükle
    fetchScores(gameType)
      .then(() => {
        // Mevcut aktif sekmeyi güncelle
        displayScores(currentTab);
      })
      .catch(error => {
        console.error("Skorlar yenilenirken hata oluştu:", error);
      })
      .finally(() => {
        // Animasyonu durdur
        setTimeout(() => {
          button.classList.remove('rotating');
        }, 1000);
      });
  }

  // Skor tablosu HTML'ini oluştur
  function createScoreTable(scores, limit = null) {
    // Limit varsa skorları sınırla
    const displayScores = limit ? scores.slice(0, limit) : scores;

    // Skorlar yoksa bilgi mesajı göster
    if (!displayScores || displayScores.length === 0) {
      return `
        <div class="no-scores">
          <i class="fas fa-trophy"></i>
          <p>Henüz skor kaydedilmemiş. İlk skoru kaydedenlerden biri olun!</p>
        </div>
      `;
    }

    // Skor tablosunu oluştur
    let tableHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Kullanıcı</th>
            <th>Skor</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Her skor için satır oluştur
    displayScores.forEach((score, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';

      // İlk harfleri al (avatar için)
      const initials = score.username
        ? score.username.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?';

      // Zaman biçimini formatla
      const date = new Date(score.timestamp);
      const formattedDate = formatDate(date);

      tableHTML += `
        <tr data-rank="${rank}">
          <td class="rank-cell ${rankClass}">${rank}</td>
          <td class="user-cell">
            <div class="user-avatar">${initials}</div>
            <div>
              <span class="username">${score.username || 'İsimsiz'}</span>
              <span class="rank-info">${score.rank || 'Başlangıç'}</span>
            </div>
          </td>
          <td class="score-cell">${score.score}</td>
          <td class="date-cell">${formattedDate}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    return tableHTML;
  }

  // Tarihi formatla
  function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Bugün';
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
});