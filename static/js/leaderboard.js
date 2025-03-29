document.addEventListener('DOMContentLoaded', function() {
  // Load initial scores for word puzzle (default tab)
  loadScores('word-puzzle');

  // Tab switching
  const tabs = document.querySelectorAll('.game-filter-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const gameType = tab.getAttribute('data-game');
      loadScores(gameType);
    });
  });
});

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