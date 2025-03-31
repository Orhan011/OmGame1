document.addEventListener('DOMContentLoaded', function() {
  loadLeaderboard('all');

  // Sayfa yenilendiğinde veya veri yüklendiğinde göstermek için yükleme animasyonu
  function showLoading() {
    const container = document.getElementById('leaderboardContainer');
    container.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;
  }

  // Skoru alma işlemini gerçekleştiren fonksiyon
  function loadLeaderboard(gameType) {
    showLoading();

    console.log('Skor yükleniyor:', gameType);

    fetch(`/api/leaderboard/${gameType}`)
      .then(response => response.json())
      .then(data => {
        console.log('Tüm yüklenen skorlar:', data);
        displayLeaderboard(data, gameType);
      })
      .catch(error => {
        console.log('Error loading scores:', error);
        document.getElementById('leaderboardContainer').innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skor tablosu yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }

  // Tablo oluşturma fonksiyonu
  function displayLeaderboard(data, gameType) {
    const container = document.getElementById('leaderboardContainer');
    container.innerHTML = '';

    // Tüm oyunlar için toplam skoru hesapla
    const allScores = [];

    if (gameType === 'all') {
      // Her kullanıcı için tüm oyunlardan topladığı puanı hesapla
      const userScores = {};

      // Tüm oyun türlerini döngüye al
      Object.keys(data).forEach(gt => {
        if (!Array.isArray(data[gt])) return;

        // Her oyun türündeki skorları döngüye al
        data[gt].forEach(score => {
          const userId = score.user_id;
          const username = score.username;
          const scoreValue = parseInt(score.score);

          // Kullanıcı henüz dizide yoksa ekle
          if (!userScores[userId]) {
            userScores[userId] = {
              user_id: userId,
              username: username,
              total_score: 0,
              games_played: 0
            };
          }

          // Kullanıcının toplam skorunu güncelle
          userScores[userId].total_score += scoreValue;
          userScores[userId].games_played += 1;
        });
      });

      // Objeyi diziye çevir ve puanlarına göre sırala
      Object.values(userScores).forEach(user => {
        allScores.push({
          user_id: user.user_id,
          username: user.username,
          score: user.total_score,
          games_played: user.games_played
        });
      });

      // Puanlara göre sırala (yüksekten düşüğe)
      allScores.sort((a, b) => b.score - a.score);
    } else {
      // Belirli bir oyun türü için skorları al ve sırala
      const scores = Array.isArray(data) ? data : [];
      scores.sort((a, b) => b.score - a.score);
      allScores.push(...scores);
    }

    if (allScores.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>Henüz skor bulunmuyor. İlk skorunu kaydetmek için oyun oynamaya başla!</p>
        </div>
      `;
      return;
    }

    // Tablo oluştur
    const leaderboardCard = document.createElement('div');
    leaderboardCard.className = 'leaderboard-card';
    leaderboardCard.style.display = 'block';

    const tableTitle = document.createElement('h2');
    tableTitle.className = 'leaderboard-title';
    tableTitle.textContent = 'Genel Sıralama';
    leaderboardCard.appendChild(tableTitle);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'leaderboard-table-container';

    const table = document.createElement('table');
    table.className = 'leaderboard-table';

    // Tablo başlığı - tek satır görünümü için başlık gerekmeyebilir
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Tek başlık kullanıyoruz
    const th = document.createElement('th');
    th.textContent = 'Skor Tablosu';
    th.colSpan = 3;
    headerRow.appendChild(th);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Tablo gövdesi
    const tbody = document.createElement('tbody');

    allScores.forEach((score, index) => {
      const row = document.createElement('tr');
      row.className = 'player-row';
      row.dataset.rank = index + 1;

      // Tek satırda sıralama, profil resmi, kullanıcı adı ve puanı gösteren tek hücre
      const fullRow = document.createElement('td');
      fullRow.className = 'full-row-cell';

      // İçerik konteyneri
      const rowContent = document.createElement('div');
      rowContent.className = 'row-content';

      // Sıralama bloğu
      const rankBlock = document.createElement('div');
      rankBlock.className = 'rank-block';
      if (index < 3) {
        rankBlock.classList.add(`rank-${index + 1}`);
      }
      rankBlock.innerHTML = `<div class="rank-number">${index + 1}</div>`;

      // Profil avatarı
      const playerAvatar = document.createElement('div');
      playerAvatar.className = 'player-avatar';

      // Top ranklara özel efektler
      if (index < 3) {
        playerAvatar.classList.add(`rank-${index + 1}-avatar`);
      }

      // Avatar içeriği
      const avatarContent = document.createElement('div');
      avatarContent.className = 'avatar-content';
      avatarContent.textContent = score.username.charAt(0).toUpperCase();

      // Glow efekti
      const avatarGlow = document.createElement('div');
      avatarGlow.className = 'avatar-glow';

      playerAvatar.appendChild(avatarGlow);
      playerAvatar.appendChild(avatarContent);
      rowContent.appendChild(playerAvatar);


      // Kullanıcı bilgisi bloğu
      const playerInfo = document.createElement('div');
      playerInfo.className = 'player-info';

      const playerName = document.createElement('div');
      playerName.className = 'player-name';
      playerName.textContent = score.username;

      playerInfo.appendChild(playerName);
      rowContent.appendChild(playerInfo);


      // Puan bloğu
      const scoreBlock = document.createElement('div');
      scoreBlock.className = 'score-block';
      scoreBlock.innerHTML = `
        <div class="score-container">
          <span class="score-value">${score.score}</span>
          <div class="score-sparkles"></div>
        </div>
      `;
      rowContent.appendChild(scoreBlock);


      fullRow.appendChild(rowContent);
      row.appendChild(fullRow);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    leaderboardCard.appendChild(tableContainer);
    container.appendChild(leaderboardCard);
  }
});