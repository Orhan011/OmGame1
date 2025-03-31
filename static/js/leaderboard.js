
// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', () => {
  // Aktif oyun türünü takip etmek için
  let activeGameType = 'word-puzzle';

  // Tüm skorları depolamak için
  let allGameScores = {};

  // İlk yükleme
  loadAllScores();

  // Sayfa ilk yüklendiğinde kelime bulmaca filtresini aktif yap
  document.querySelector('[data-game="word-puzzle"]').classList.add('active');

  // Oyun filtre butonlarına tıklama olayı ekle
  document.querySelectorAll('.game-filter-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Aktif sınıfını tüm butonlardan kaldır
      document.querySelectorAll('.game-filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Tıklanan butona aktif sınıf ekle
      this.classList.add('active');

      // Aktif oyun türünü güncelle
      activeGameType = this.getAttribute('data-game');

      // Skorları görüntüle
      displayScoresForGameType(activeGameType);
    });
  });

  // Yenile butonuna tıklama olayı ekle
  document.querySelector('.refresh-btn').addEventListener('click', function() {
    loadAllScores();
  });

  // Tüm oyun türleri için skorları yükler
  function loadAllScores() {
    // Yükleme animasyonunu göster
    const container = document.getElementById('scores-container');
    container.innerHTML = `
      <div class="loading-scores">
        <div class="spinner"></div>
        <p>Skorlar yükleniyor...</p>
      </div>
    `;

    fetch('/api/get-scores/all')
      .then(response => {
        if (!response.ok) {
          throw new Error('Skorlar alınamadı');
        }
        return response.json();
      })
      .then(data => {
        allGameScores = data;
        console.log("Tüm yüklenen skorlar:", allGameScores);
        
        // Şu anki aktif oyun tipinin skorlarını göster
        displayScoresForGameType(activeGameType);
      })
      .catch(error => {
        console.log("Error loading scores:", error);
        container.innerHTML = `
          <div class="no-scores error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skor verisi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
          </div>
        `;
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
    
    // Oyun türüne göre skorları al
    const scores = allGameScores[internalGameType] || [];
    
    if (scores.length > 0) {
      // Skorları görüntüle
      let html = '';
      
      scores.forEach((score, index) => {
        const isTopRank = index < 3; // İlk 3 skor için özel sınıf
        const rank = index + 1;
        
        html += `
          <div class="table-row ${isTopRank ? 'top-rank' : ''}" style="opacity: 0;">
            <div class="rank-cell">
              <span class="rank-badge ${getRankClass(rank)}">${rank}</span>
            </div>
            <div class="username-cell">
              <div class="user-info">
                <span class="username">${score.username || 'Anonim'}</span>
                ${score.rank ? `<span class="user-rank">${score.rank}</span>` : ''}
              </div>
            </div>
            <div class="score-cell">
              <span class="score-badge">${score.score.toLocaleString()}</span>
            </div>
            <div class="date-cell">
              <span class="date">${formatDate(score.timestamp)}</span>
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
          <p>Bu oyun için henüz skor kaydedilmemiş. İlk olmak için hemen oyna!</p>
        </div>
      `;
    }
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
