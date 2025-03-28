document.addEventListener('DOMContentLoaded', function() {
  // Load leaderboards for each game type
  window.loadLeaderboard('wordPuzzle', 'word-puzzle-leaderboard');
  window.loadLeaderboard('memoryMatch', 'memory-match-leaderboard');
  window.loadLeaderboard('numberSequence', 'number-sequence-leaderboard');
  window.loadLeaderboard('puzzle', 'pattern-recognition-leaderboard'); // 'patternRecognition' -> 'puzzle' olarak değiştirildi
  window.loadLeaderboard('3dRotation', 'rotation-3d-leaderboard');
  
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.leaderboard-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('show', 'active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-bs-target');
      document.querySelector(tabId).classList.add('show', 'active');
    });
  });
});
