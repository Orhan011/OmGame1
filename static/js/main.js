document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Save game score
  window.saveScore = function(gameType, score) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: gameType,
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            Score saved successfully!
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(toast);
      
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
      
      // Auto-remove toast after it's hidden
      toast.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toast);
      });
    })
    .catch(error => {
      console.error('Error saving score:', error);
      
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            Error saving score. Please try again.
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(toast);
      
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
      
      // Auto-remove toast after it's hidden
      toast.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toast);
      });
    });
  };
  
  // Load leaderboard data
  window.loadLeaderboard = function(gameType, elementId) {
    const leaderboardElement = document.getElementById(elementId);
    if (!leaderboardElement) return;
    
    fetch(`/api/get-scores/${gameType}`)
      .then(response => response.json())
      .then(data => {
        let html = `
          <table class="table table-dark leaderboard-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Username</th>
                <th scope="col">Score</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        if (data.length === 0) {
          html += `
            <tr>
              <td colspan="4" class="text-center">No scores yet. Be the first to play!</td>
            </tr>
          `;
        } else {
          data.forEach((score, index) => {
            html += `
              <tr>
                <th scope="row">${index + 1}</th>
                <td>${score.username}</td>
                <td>${score.score}</td>
                <td>${score.timestamp}</td>
              </tr>
            `;
          });
        }
        
        html += `
            </tbody>
          </table>
        `;
        
        leaderboardElement.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading leaderboard:', error);
        leaderboardElement.innerHTML = `
          <div class="alert alert-danger" role="alert">
            Error loading leaderboard. Please try again later.
          </div>
        `;
      });
  };
  
  // Helper function for timer
  window.startTimer = function(durationInSeconds, displayElement, onTimeUp) {
    let timer = durationInSeconds;
    const display = document.getElementById(displayElement);
    if (!display) return;
    
    display.textContent = formatTime(timer);
    
    const interval = setInterval(function() {
      timer--;
      
      if (timer < 0) {
        clearInterval(interval);
        if (typeof onTimeUp === 'function') {
          onTimeUp();
        }
        return;
      }
      
      display.textContent = formatTime(timer);
    }, 1000);
    
    return {
      stop: function() {
        clearInterval(interval);
      },
      getTimeLeft: function() {
        return timer;
      }
    };
  };
  
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
});
