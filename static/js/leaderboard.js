document.addEventListener('DOMContentLoaded', function() {
  // Tüm oyunlar ve her bir oyun için skor tablolarını tutacak değişkenler
  let allScores = {};
  const selectedGame = 'all'; // Başlangıçta tüm oyunları göster

  // Oyun sekmesi tıklama olayları
  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Aktif sekme sınıfını değiştir
      document.querySelector('.game-tab.active').classList.remove('active');
      this.classList.add('active');

      // Seçilen oyun türüne göre skorları göster
      const gameType = this.dataset.game;

      // Animasyonlu geçiş efekti
      const container = document.getElementById('leaderboardsContainer');
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';

      setTimeout(() => {
        displayScores(gameType);
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 300);
    });
  });

  // Tüm oyun skorlarını yükle
  loadAllScores();

  // Tüm oyun skorlarını yükleyen fonksiyon
  function loadAllScores() {
    // Buraya farklı oyun türlerini ekleyin
    const gameTypes = ['wordPuzzle', 'memoryMatch', 'labyrinth', 'puzzle', 'numberSequence', 'memoryCards', 'numberChain', 'audioMemory', 'nBack', 'sudoku', '2048', 'chess'];

    const loadPromises = gameTypes.map(gameType => {
      return loadScores(gameType);
    });

    Promise.all(loadPromises)
      .then(() => {
        console.log("Tüm yüklenen skorlar:", allScores);
        displayScores(selectedGame);
      })
      .catch(error => {
        console.error("Skor yükleme hatası:", error);
        document.getElementById('leaderboardsContainer').innerHTML = `
          <div class="error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }

  // Belirli bir oyun türü için skorları yükleyen fonksiyon
  function loadScores(gameType) {
    console.log("Skor yükleniyor:", gameType);
    return fetch(`/api/leaderboard/${gameType}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Skorlar alınamadı');
        }
        return response.json();
      })
      .then(data => {
        // Skor verileri geldi, bu verileri saklayalım
        const normalizedType = normalizeGameType(gameType);
        allScores[normalizedType] = data.scores || [];
      })
      .catch(error => {
        console.error("Error loading scores:", error);
        allScores[normalizeGameType(gameType)] = [];
      });
  }

  // Oyun türü adını normalize et (API'nin beklediği formata uygun olarak)
  function normalizeGameType(gameType) {
    const mappings = {
      'wordPuzzle': 'wordPuzzle',
      'memoryMatch': 'memoryMatch',
      'labyrinth': 'labyrinth',
      'puzzle': 'puzzle',
      'numberSequence': 'numberSequence',
      'memoryCards': 'memoryCards',
      'numberChain': 'numberChain',
      'audioMemory': 'audioMemory',
      'nBack': 'nBack',
      'sudoku': 'sudoku',
      '2048': '2048',
      'chess': 'chess'
    };

    return mappings[gameType] || gameType;
  }

  // Skorları görüntüleyen fonksiyon
  function displayScores(gameType) {
    const container = document.getElementById('leaderboardsContainer');
    container.innerHTML = ''; // Mevcut içeriği temizle

    // CSS için geçiş ayarı
    container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    if (gameType === 'all') {
      // Tüm oyunlar için skor tablolarını göster
      for (const type in allScores) {
        if (allScores[type] && allScores[type].length > 0) {
          container.appendChild(createLeaderboardCard(type, allScores[type]));
        }
      }

      // Hiç skor yoksa bilgi mesajı göster
      if (container.children.length === 0) {
        container.innerHTML = `
          <div class="no-scores">
            <i class="fas fa-trophy fa-3x"></i>
            <h3>Henüz Skor Yok</h3>
            <p>Oyunları oynayarak skor tablosunda yerinizi alabilirsiniz!</p>
            <a href="/games" class="play-games-btn"><i class="fas fa-gamepad"></i> Oyunları Keşfet</a>
          </div>
        `;
      }
    } else {
      // Sadece seçilen oyun türünün skor tablosunu göster
      const normalizedType = normalizeGameType(gameType);
      const scores = allScores[normalizedType] || [];

      if (scores.length > 0) {
        container.appendChild(createLeaderboardCard(normalizedType, scores));
      } else {
        container.innerHTML = `
          <div class="no-scores">
            <i class="fas fa-trophy fa-3x"></i>
            <h3>Bu Oyun İçin Skor Yok</h3>
            <p>Bu oyun için henüz skor kaydedilmemiş. İlk skoru elde eden siz olun!</p>
            <a href="/games/${gameType}" class="play-games-btn"><i class="fas fa-gamepad"></i> Hemen Oyna</a>
          </div>
        `;
      }
    }
  }

  // Skor tablosu kartı oluşturma fonksiyonu
  function createLeaderboardCard(gameType, scores) {
    const card = document.createElement('div');
    card.className = 'leaderboard-card';

    // Oyun türü adını güzelleştirme
    const gameNames = {
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
      'visualAttention': 'Görsel Dikkat'
    };

    // Oyun türüne göre ikon seçimi
    const gameIcons = {
      'wordPuzzle': 'fa-font',
      'memoryMatch': 'fa-th',
      'labyrinth': 'fa-map-signs',
      'puzzle': 'fa-puzzle-piece',
      'numberSequence': 'fa-sort-numeric-up',
      'memoryCards': 'fa-clone',
      'numberChain': 'fa-link',
      'audioMemory': 'fa-music',
      'nBack': 'fa-brain',
      'sudoku': 'fa-table',
      '2048': 'fa-cube',
      'chess': 'fa-chess',
      'visualAttention': 'fa-eye'
    };

    const gameName = gameNames[gameType] || gameType;
    const iconClass = gameIcons[gameType] || 'fa-gamepad';

    // Skorları sırala (yüksekten düşüğe)
    scores.sort((a, b) => b.score - a.score);

    // En fazla 10 skoru göster
    const topScores = scores.slice(0, 10);

    card.innerHTML = `
      <div class="card-header">
        <h3><i class="fas ${iconClass}"></i> ${gameName}</h3>
        <button class="refresh-btn" data-game="${gameType}" title="Skorları Yenile">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
      <div class="leaderboard-table-container">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Oyuncu</th>
              <th>Skor</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            ${topScores.map((score, index) => `
              <tr class="player-row ${index < 3 ? 'rank-' + (index + 1) : ''}">
                <td class="rank-cell">${index + 1}</td>
                <td class="username-cell">
                  <div class="player-info">
                    <div class="avatar-cell">
                      <div class="player-avatar">
                        <i class="fas fa-user"></i>
                      </div>
                    </div>
                    <span class="player-name">${score.username}</span>
                    <span class="player-rank">${score.rank || 'Başlangıç'}</span>
                  </div>
                </td>
                <td class="score-cell">${formatScore(score.score)}</td>
                <td class="date-cell">${formatDate(score.timestamp)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Tabloya giriş animasyonu ekle
    setTimeout(() => {
      const rows = card.querySelectorAll('.player-row');
      rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-10px)';
        row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        row.style.transitionDelay = `${index * 0.05}s`;

        setTimeout(() => {
          row.style.opacity = '1';
          row.style.transform = 'translateX(0)';
        }, 50);
      });
    }, 100);

    // Yenileme düğmesi tıklama olayı
    card.querySelector('.refresh-btn').addEventListener('click', function() {
      const btn = this;
      const gameType = this.dataset.game;

      // Yenileme animasyonu
      btn.classList.add('refreshing');
      btn.disabled = true;

      loadScores(gameType).then(() => {
        // Eski kartı kaldır
        const oldCard = btn.closest('.leaderboard-card');
        const container = oldCard.parentElement;

        // Yeni kartı oluştur
        const newCard = createLeaderboardCard(gameType, allScores[normalizeGameType(gameType)]);

        // Animasyonlu geçiş
        oldCard.style.opacity = '0';
        oldCard.style.transform = 'scale(0.95)';

        setTimeout(() => {
          container.replaceChild(newCard, oldCard);
          newCard.style.opacity = '0';
          newCard.style.transform = 'scale(0.95)';

          setTimeout(() => {
            newCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            newCard.style.opacity = '1';
            newCard.style.transform = 'scale(1)';
          }, 50);
        }, 300);
      });
    });

    return card;
  }

  // Tarih formatlama fonksiyonu
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('tr-TR', { month: 'short' });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  // Skor formatlama fonksiyonu
  function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Sayfa ilk yüklendiğinde geçiş animasyonu için
  const container = document.getElementById('leaderboardsContainer');
  container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px)';

  setTimeout(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  }, 300);
});