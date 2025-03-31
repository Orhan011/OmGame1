// Tüm skorları saklamak için global değişken
let allGameScores = {};

// Skor tablosu işlevselliği
document.addEventListener('DOMContentLoaded', function() {
  // Oyun filtreleme butonlarının işlevselliği
  const filterButtons = document.querySelectorAll('.game-filter-btn');

  // Aktif oyun tipini sakla
  let activeGameType = 'word-puzzle'; // Varsayılan olarak kelime bulmaca

  // İlk yüklemede tüm skorları getir
  loadAllScores();

  // Filtre butonlarına tıklama olayları ekle
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Aktif sınıfı tüm butonlardan kaldır
      filterButtons.forEach(btn => btn.classList.remove('active'));

      // Tıklanan butona aktif sınıf ekle
      this.classList.add('active');

      // Seçilen oyun tipini al
      activeGameType = this.getAttribute('data-game');

      // Skorları yükle
      loadScores(activeGameType);
    });
  });

  // Sayfa yüklendiğinde ilk seçeneği aktif et
  if (filterButtons.length > 0) {
    filterButtons[0].classList.add('active');
  }

  // 30 saniyede bir skorları otomatik güncelle (10 saniye çok sık)
  setInterval(loadAllScores, 30000);
});

// Tüm oyunlar için skorları yükle ve varsayılan oyun tipini göster
function loadAllScores() {
  const scoresContainer = document.getElementById('scores-container');

  // Yükleme animasyonu göster
  scoresContainer.innerHTML = `
    <div class="loading-scores">
      <div class="spinner"></div>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // Tüm skorları API'den getir
  fetch('/api/get-scores/all')
    .then(response => {
      if (!response.ok) {
        throw new Error('Skorları yüklerken bir hata oluştu.');
      }
      return response.json();
    })
    .then(allScores => {
      console.log("Tüm yüklenen skorlar:", allScores);

      // Varsayılan olarak ilk sekmedeki oyun için skorları göster
      // Burada aktif butonun oyun tipini al
      const activeButton = document.querySelector('.game-filter-btn.active');
      if (activeButton) {
        const gameType = activeButton.getAttribute('data-game');
        loadScores(gameType);
      } else {
        // Aktif buton yoksa ilk oyun için skorları göster
        loadScores('word-puzzle');
      }
    })
    .catch(error => {
      console.error("Error loading scores:", error);
      scoresContainer.innerHTML = `
        <div class="error">
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <button onclick="loadAllScores()" class="refresh-btn">
            <i class="fas fa-sync-alt"></i> Tekrar Dene
          </button>
        </div>
      `;
    });
}

// Belirli bir oyun için skorları yükle
function loadScores(gameType) {
  console.log("Skor yükleniyor:", gameType);
  const scoresContainer = document.getElementById('scores-container');

  // Yükleme animasyonu göster
  scoresContainer.innerHTML = `
    <div class="loading-scores">
      <div class="spinner"></div>
      <p>Skorlar yükleniyor...</p>
    </div>
  `;

  // API'den skorları getir
  fetch(`/api/get-scores/${gameType}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Skorları yüklerken bir hata oluştu.');
      }
      return response.json();
    })
    .then(scores => {
      if (!scores || scores.length === 0) {
        // Skorlar boşsa uygun mesaj göster
        scoresContainer.innerHTML = `
          <div class="no-scores">
            <p>Bu oyun için henüz skor bulunmuyor.</p>
            <p>İlk skoru kaydetmek için hemen oynamaya başlayın!</p>
          </div>
        `;
        return;
      }

      // Skorları göster
      let html = '';

      scores.forEach((score, index) => {
        // İlk 3 sıradakiler için özel sınıf ekle
        const isTopRank = index < 3 ? 'top-rank' : '';

        html += `
          <div class="table-row ${isTopRank}">
            <div class="rank-cell">${index + 1}</div>
            <div class="username-cell">${score.username}</div>
            <div class="score-cell">${score.score}</div>
            <div class="date-cell">${score.timestamp}</div>
          </div>
        `;
      });

      scoresContainer.innerHTML = html;
    })
    .catch(error => {
      console.error("Error loading scores:", error);
      scoresContainer.innerHTML = `
        <div class="error">
          <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <button onclick="loadScores('${gameType}')" class="refresh-btn">
            <i class="fas fa-sync-alt"></i> Tekrar Dene
          </button>
        </div>
      `;
    });
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