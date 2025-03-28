document.addEventListener('DOMContentLoaded', function() {
  // Load initial scores
  loadScores('word-puzzle');

  // Setup game filter buttons
  const filterButtons = document.querySelectorAll('.game-filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Load scores for selected game
      const gameType = button.getAttribute('data-game');
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
      container.innerHTML = scores.map((score, index) => `
        <div class="table-row ${index < 3 ? 'top-rank' : ''}">
          <div class="rank-cell">${index + 1}</div>
          <div class="username-cell">${score.username}</div>
          <div class="score-cell">${score.score}</div>
          <div class="date-cell">${new Date(score.timestamp).toLocaleString('tr-TR')}</div>
        </div>
      `).join('');
    })
    .catch(error => {
      container.innerHTML = '<div class="error">Skorlar yüklenirken bir hata oluştu.</div>';
      console.error('Error:', error);
    });
}