
document.addEventListener('DOMContentLoaded', function() {
  // Load initial scores
  loadAllScores();
  
  // Tab switching
  const tabs = document.querySelectorAll('.game-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and cards
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.leaderboard-card').forEach(card => card.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding card
      tab.classList.add('active');
      const gameType = tab.getAttribute('data-game');
      document.getElementById(`${gameType}-board`).classList.add('active');
      
      // Reload scores for the selected game
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

function loadAllScores() {
  const gameTypes = ['word-puzzle', 'memory-match', 'number-sequence', 'puzzle', '3d-rotation'];
  gameTypes.forEach(type => loadScores(type));
}

function loadScores(gameType) {
  const container = document.getElementById(`${gameType}-scores`);
  container.innerHTML = '<div class="loading">Yükleniyor...</div>';
  
  fetch(`/api/get-scores/${gameType}`)
    .then(response => response.json())
    .then(scores => {
      container.innerHTML = scores.map((score, index) => `
        <div class="table-row">
          <div class="rank">${index + 1}</div>
          <div class="player">${score.username}</div>
          <div class="score">${score.score}</div>
          <div class="date">${formatDate(score.timestamp)}</div>
        </div>
      `).join('');
    })
    .catch(error => {
      container.innerHTML = '<div class="error">Skorlar yüklenirken bir hata oluştu.</div>';
      console.error('Error loading scores:', error);
    });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
