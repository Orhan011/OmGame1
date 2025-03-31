// Skor tablosunun yüklenmesi için JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Aktif oyun türünü takip etmek için değişken
  let activeGameType = 'word-puzzle'; // Varsayılan olarak kelime bulmaca oyunu seçili

  // İlk yüklemede tüm skorları getir
  loadAllScores();

  // Oyun filtre butonlarına tıklama olaylarını ekle
  document.querySelectorAll('.game-filter-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Tüm butonlardan active sınıfını kaldır
      document.querySelectorAll('.game-filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Tıklanan butona active sınıfını ekle
      this.classList.add('active');

      // Seçilen oyun türünü al ve görüntüle
      activeGameType = this.getAttribute('data-game');
      loadScores(activeGameType);
    });
  });

  // Yenileme butonuna tıklama olayını ekle
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      // Aktif oyun türü için skorları yeniden yükle
      loadScores(activeGameType);
    });
  }
});

// Tüm oyunların skorlarını yükle
function loadAllScores() {
  // Skorlar yüklenirken yükleniyor animasyonunu göster
  const scoresContainer = document.getElementById('scores-container');
  if (scoresContainer) {
    scoresContainer.innerHTML = `
      <div class="loading-scores">
        <div class="spinner"></div>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;
  }

  // API'den tüm skorları çek
  fetch('/api/get-scores/all')
    .then(response => {
      if (!response.ok) {
        throw new Error('Skorlar yüklenirken bir hata oluştu');
      }
      return response.json();
    })
    .then(allScores => {
      console.log("Tüm yüklenen skorlar:", allScores);

      // İlk olarak kelime bulmaca skorlarını görüntüle (varsayılan)
      displayScores('wordPuzzle', allScores.wordPuzzle || []);

      // İlk butona aktif sınıfını ekle
      const firstButton = document.querySelector('.game-filter-btn');
      if (firstButton) {
        firstButton.classList.add('active');
      }
    })
    .catch(error => {
      console.error("Error loading scores:", error);
      if (scoresContainer) {
        scoresContainer.innerHTML = `
          <div class="error">
            <p><i class="fas fa-exclamation-triangle"></i></p>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      }
    });
}

// Belirli bir oyun için skorları yükle
function loadScores(gameType) {
  console.log("Skor yükleniyor:", gameType);
  // Skorlar yüklenirken yükleniyor animasyonunu göster
  const scoresContainer = document.getElementById('scores-container');
  if (scoresContainer) {
    scoresContainer.innerHTML = `
      <div class="loading-scores">
        <div class="spinner"></div>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;
  }

  // Oyun türü eşleşmelerini tanımla
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

  // API endpoint için oyun tipini çevir
  const apiGameType = gameTypeMap[gameType] || gameType;

  // API'den skorları çek
  fetch(`/api/get-scores/${apiGameType}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Skorlar yüklenirken bir hata oluştu');
      }
      return response.json();
    })
    .then(scores => {
      displayScores(apiGameType, scores);
    })
    .catch(error => {
      console.error("Error loading scores:", error);
      if (scoresContainer) {
        scoresContainer.innerHTML = `
          <div class="error">
            <p><i class="fas fa-exclamation-triangle"></i></p>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      }
    });
}

// Skorları tabloda görüntüle
function displayScores(gameType, scores) {
  const scoresContainer = document.getElementById('scores-container');
  if (!scoresContainer) return;

  // Eğer skor yoksa boş tablo göster
  if (!scores || scores.length === 0) {
    scoresContainer.innerHTML = `
      <div class="no-scores">
        <p><i class="fas fa-trophy empty-trophy"></i></p>
        <p>Bu oyun için henüz skor kaydedilmemiş.</p>
        <p class="sub-text">İlk skoru kaydetmek için hemen oynamaya başlayın!</p>
      </div>
    `;
    return;
  }

  // Skor tablosunu oluştur
  let tableContent = '';

  // Skorları listele
  scores.forEach((score, index) => {
    // Top 3 için özel sınıf ekle
    const isTopRank = index < 3 ? 'top-rank' : '';

    // Skor tarihini formatlama
    const scoreDate = new Date(score.timestamp);
    const formattedDate = scoreDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Sıra için özel stillemeler
    let rankIcon = '';
    if (index === 0) {
      rankIcon = '<i class="fas fa-trophy" style="color: gold;"></i> ';
    } else if (index === 1) {
      rankIcon = '<i class="fas fa-trophy" style="color: silver;"></i> ';
    } else if (index === 2) {
      rankIcon = '<i class="fas fa-trophy" style="color: #cd7f32;"></i> ';
    }

    // Skor satırını ekle
    tableContent += `
      <div class="table-row ${isTopRank}">
        <div class="rank-cell">${rankIcon}${index + 1}</div>
        <div class="username-cell">${score.username}</div>
        <div class="score-cell"><span class="score-value">${score.score}</span></div>
        <div class="date-cell">${formattedDate}</div>
      </div>
    `;
  });

  // Tabloyu DOM'a ekle
  scoresContainer.innerHTML = tableContent;
}

// Sıralama için sınıf al
function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

// Tarih formatla
function formatDate(dateString) {
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
        return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Dün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      console.error('Tarih biçimlendirme hatası:', e);
      return dateString;
    }
}
});