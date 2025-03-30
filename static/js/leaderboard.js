// Tüm skorları saklamak için global değişken
let allGameScores = {};

document.addEventListener('DOMContentLoaded', function() {
  // İlk yüklemede tüm oyunların skorlarını al
  loadAllScores();

  // Tab switching
  const tabs = document.querySelectorAll('.game-filter-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const gameType = tab.getAttribute('data-game');
      displayScoresForGameType(gameType);
    });
  });
  
  // 10 saniyede bir skorları otomatik güncelle
  setInterval(loadAllScores, 10000);
});

// Tüm oyunların skorlarını tek bir API çağrısıyla alır
function loadAllScores() {
  const container = document.getElementById('scores-container');
  
  // İlk yüklemede loading göster, otomatik yenilemelerde mevcut içeriği koru
  if (!allGameScores || Object.keys(allGameScores).length === 0) {
    container.innerHTML = '<div class="loading">Tüm skorlar yükleniyor...</div>';
  }
  
  fetch('/api/get-scores/all')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(allScores => {
      console.log('Tüm yüklenen skorlar:', allScores);
      
      // Tüm skorları global değişkene kaydet
      allGameScores = allScores;
      
      // İlk sekme aktif olduğu için word-puzzle skorlarını göster
      const activeTab = document.querySelector('.game-filter-btn.active');
      const activeGameType = activeTab ? activeTab.getAttribute('data-game') : 'word-puzzle';
      
      displayScoresForGameType(activeGameType);
    })
    .catch(error => {
      // Eğer daha önce skorlar yüklenmişse, hata nedeniyle mevcut verileri koruyalım
      if (!allGameScores || Object.keys(allGameScores).length === 0) {
        container.innerHTML = '<div class="error">Skorlar yüklenirken bir hata oluştu</div>';
      }
      console.error('Error loading scores:', error);
    });
}

// Belirli bir oyun türü için skorları görüntüler (yerel cache'den)
function displayScoresForGameType(gameType) {
  const container = document.getElementById('scores-container');
  
  // Oyun türünü dahili formata dönüştür
  const gameTypeMap = {
    'word-puzzle': 'wordPuzzle',
    'memory-match': 'memoryMatch',
    'labyrinth': 'labyrinth',
    'puzzle': 'puzzle',
    'number-sequence': 'numberSequence',
    '3d-rotation': '3dRotation'
  };
  
  const internalGameType = gameTypeMap[gameType];
  
  // Cache'de skorlar varsa, onları göster
  if (allGameScores && allGameScores[internalGameType]) {
    const scores = allGameScores[internalGameType];
    
    if (scores.length === 0) {
      container.innerHTML = '<div class="no-scores">Henüz skor kaydedilmemiş</div>';
      return;
    }
    
    container.innerHTML = scores.map((score, index) => `
      <div class="table-row ${index < 3 ? 'top-rank' : ''}">
        <div class="rank-cell">${index + 1}</div>
        <div class="username-cell">
          <div class="player-info">
            <span class="username">${score.username || 'Anonim'}</span>
          </div>
        </div>
        <div class="score-cell">${score.score}</div>
        <div class="date-cell">${new Date(score.timestamp).toLocaleString('tr-TR')}</div>
      </div>
    `).join('');
  } else {
    // Cache'de yoksa doğrudan API'den al (yedek yöntem)
    loadScores(gameType);
  }
}

// Yedek yöntem - doğrudan API'den tek bir oyun türü için skorları alır
function loadScores(gameType) {
  const container = document.getElementById('scores-container');
  container.innerHTML = '<div class="loading">Yükleniyor...</div>';

  // Debug için
  console.log('Skor yükleniyor:', gameType);
  
  fetch(`/api/get-scores/${gameType}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(scores => {
      console.log('Yüklenen skorlar:', scores);
      
      if (!scores || scores.length === 0) {
        container.innerHTML = '<div class="no-scores">Henüz skor kaydedilmemiş</div>';
        return;
      }

      container.innerHTML = scores.map((score, index) => `
        <div class="table-row ${index < 3 ? 'top-rank' : ''}">
          <div class="rank-cell">${index + 1}</div>
          <div class="username-cell">
            <div class="player-info">
              <span class="username">${score.username || 'Anonim'}</span>
            </div>
          </div>
          <div class="score-cell">${score.score}</div>
          <div class="date-cell">${new Date(score.timestamp).toLocaleString('tr-TR')}</div>
        </div>
      `).join('');
    })
    .catch(error => {
      container.innerHTML = '<div class="error">Skorlar yüklenirken bir hata oluştu</div>';
      console.error('Error loading scores:', error);
    });
}