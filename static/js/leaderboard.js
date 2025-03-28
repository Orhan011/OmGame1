document.addEventListener('DOMContentLoaded', function() {
  // Load initial scores for word puzzle (default tab)
  loadScores('word-puzzle');

  // Tab switching
  const tabs = document.querySelectorAll('.game-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.leaderboard-card').forEach(card => card.classList.remove('active'));

      tab.classList.add('active');
      const gameType = tab.getAttribute('data-game');
      const board = document.getElementById(`${gameType}-board`);
      board.classList.add('active');

      loadScores(gameType);
    });
  });

  // Refresh button functionality
  document.querySelectorAll('.refresh-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.leaderboard-card');
      const gameType = card.id.replace('-board', '');
      loadScores(gameType);
      
      // Add rotation animation
      btn.style.transform = 'rotate(360deg)';
      setTimeout(() => btn.style.transform = '', 500);
    });
  });
});

function loadScores(gameType) {
  const container = document.querySelector(`#${gameType}-board .table-body`);
  if (!container) return;

  container.innerHTML = '<div class="loading">Yükleniyor...</div>';

  fetch(`/api/get-scores/${gameType}`)
    .then(response => response.json())
    .then(scores => {
      container.innerHTML = scores.map((score, index) => `
        <div class="table-row ${index < 3 ? 'top-rank' : ''}">
          <div class="rank">${index + 1}</div>
          <div class="player">${score.username}</div>
          <div class="score">${score.score}</div>
          <div class="date">${new Date(score.timestamp).toLocaleString()}</div>
        </div>
      `).join('');
    })
    .catch(error => {
      container.innerHTML = '<div class="error">Hata: Skorlar yüklenemedi</div>';
    });
}