document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Setup button loading animations
  setupButtonLoadingStates();
  
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
  
  // Button Loading Animation Functionality
  function setupButtonLoadingStates() {
    document.querySelectorAll('.btn').forEach(button => {
      if (!button.classList.contains('no-loading')) {
        button.addEventListener('click', function(e) {
          // Skip special buttons or those that should navigate immediately
          if (this.classList.contains('no-loading') || 
              this.getAttribute('type') === 'button' || 
              this.getAttribute('type') === 'reset' ||
              this.hasAttribute('data-bs-toggle') ||
              this.hasAttribute('data-bs-dismiss')) {
            return;
          }
          
          // Don't add loading to buttons that are links with href
          if (this.tagName === 'A' && this.hasAttribute('href') && 
              !this.href.includes('javascript:void')) {
            return;
          }
          
          // Store the original content if not already stored
          if (!this.dataset.originalHtml) {
            this.dataset.originalHtml = this.innerHTML;
          }
          
          // Add loading spinner
          this.classList.add('btn-loading');
          const originalHtml = this.dataset.originalHtml;
          
          // Create spinner and text wrapper
          this.innerHTML = `
            <span class="btn-spinner"></span>
            <span class="btn-text">${originalHtml}</span>
          `;
          
          // Return to original state after some time (failsafe)
          setTimeout(() => {
            if (this.classList.contains('btn-loading')) {
              this.classList.remove('btn-loading');
              this.innerHTML = originalHtml;
            }
          }, 3000); // 3 second timeout as fallback
        });
      }
    });
  }
});
// Profile Modal Lazy Loading
document.addEventListener('DOMContentLoaded', function() {
  const profileButton = document.getElementById('profileButton');
  const profileModal = document.getElementById('profileModal');
  const profileModalContent = document.getElementById('profileModalContent');
  const profileContentTemplate = document.getElementById('profileContentTemplate');
  let isContentLoaded = false;

  if (profileButton && profileModal) {
    profileButton.addEventListener('click', function() {
      const modal = new bootstrap.Modal(profileModal);
      modal.show();
      
      if (!isContentLoaded) {
        // Delay content loading slightly to ensure smooth modal animation
        setTimeout(() => {
          profileModalContent.innerHTML = profileContentTemplate.innerHTML;
          isContentLoaded = true;
        }, 150);
      }
    });
  }
});
// Mini profil ve dropdown işlevselliği
document.addEventListener('DOMContentLoaded', function() {
  const userProfileMini = document.getElementById('userProfileMini');
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  
  if (userProfileMini && userProfileDropdown) {
    userProfileMini.addEventListener('click', function(event) {
      event.stopPropagation();
      userProfileDropdown.classList.toggle('show');
    });
    
    // Sayfa herhangi bir yerine tıklandığında menüyü kapat
    document.addEventListener('click', function(event) {
      if (userProfileDropdown.classList.contains('show') && 
          !userProfileMini.contains(event.target) && 
          !userProfileDropdown.contains(event.target)) {
        userProfileDropdown.classList.remove('show');
      }
    });
  }
});
