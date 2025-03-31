
// Tüm skorları saklamak için global değişken
let allGameScores = {};

document.addEventListener('DOMContentLoaded', function() {
  // İlk yüklemede tüm oyunların skorlarını al
  loadAllScores();
  
  // Aktif oyun türünü URL'den al veya varsayılan olarak "word-puzzle" kullan
  const urlParams = new URLSearchParams(window.location.search);
  let activeGameType = urlParams.get('game') || 'word-puzzle';

  // Tab switching
  const tabs = document.querySelectorAll('.game-filter-btn');
  tabs.forEach(tab => {
    const gameType = tab.getAttribute('data-game');
    
    // URL'den gelen oyun türü varsa ilgili butonu aktif yap
    if (gameType === activeGameType) {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      displayScoresForGameType(gameType);
    }
    
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const gameType = tab.getAttribute('data-game');
      // URL'yi güncelle (sayfa yenilenmeden)
      window.history.replaceState({}, '', `?game=${gameType}`);
      displayScoresForGameType(gameType);
    });
  });
  
  // 30 saniyede bir skorları otomatik güncelle (10 saniye çok sık)
  setInterval(loadAllScores, 30000);
});

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
      // Kullanıcı avatarı için rastgele bir renk üret
      const avatarColors = [
        'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
        'linear-gradient(45deg, #6A5AE0, #9F8AFF)',
        'linear-gradient(45deg, #48CFAD, #6BE5C3)',
        'linear-gradient(45deg, #FFCE54, #FFD980)',
        'linear-gradient(45deg, #5D9CEC, #8CB4F5)'
      ];
      const randomColor = avatarColors[index % avatarColors.length];
      
      // Kullanıcı adının ilk harfini al (avatar için)
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
      
      // Her bir skor için HTML oluştur
      html += `
        <div class="table-row ${index < 3 ? 'top-rank top-rank-' + (index + 1) : ''}" data-rank="${index + 1}">
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
