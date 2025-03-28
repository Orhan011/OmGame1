
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

  fetch(`/api/get-scores/${gameType}`)
    .then(response => response.json())
    .then(scores => {
      if (scores.length === 0) {
        container.innerHTML = '<div class="no-scores">Henüz skor kaydedilmemiş</div>';
        return;
      }

      container.innerHTML = scores.map((score, index) => `
        <div class="table-row ${index < 3 ? 'top-rank' : ''}">
          <div class="rank-cell">${index + 1}</div>
          <div class="username-cell">${score.username}</div>
          <div class="score-cell">${score.score}</div>
          <div class="date-cell">${new Date(score.timestamp).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
      `).join('');
    })
    .catch(error => {
      container.innerHTML = '<div class="error">Skorlar yüklenirken bir hata oluştu</div>';
      console.error('Error loading scores:', error);
    });
}
