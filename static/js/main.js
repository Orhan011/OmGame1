// main.js - Optimize edilmiş ve hızlandırılmış sürüm

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips - Yalnızca gerekli olduğunda başlatılacak şekilde optimize edildi
  if (document.querySelectorAll('[data-bs-toggle="tooltip"]').length > 0) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Setup button loading animations - gecikmeyle yükleniyor
  setTimeout(setupButtonLoadingStates, 100);

  // Kısayol panelini kapat - dışa tıklandığında - performans için iyileştirildi
  document.addEventListener('click', function(e) {
    const shortcutPanel = document.getElementById('shortcutPanel');
    
    // Eğer panel yoksa veya zaten kapalıysa işlem yapma
    if (!shortcutPanel || shortcutPanel.style.display !== 'block') return;
    
    const profileShortcut = document.querySelector('.profile-shortcut-avatar-wrapper');
    
    if (!shortcutPanel.contains(e.target) && (!profileShortcut || !profileShortcut.contains(e.target))) {
      shortcutPanel.style.display = 'none';
    }
  });

  // Save game score - hızlandırılmış
  window.saveScore = function(gameType, score) {
    // Performans için toast oluşturma fonksiyonu ayrıldı
    function createToast(type, message) {
      const toast = document.createElement('div');
      toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(toast);

      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();

      toast.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toast);
      });
    }

    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameType, score })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
      createToast('success', 'Score saved successfully!');
    })
    .catch(error => {
      console.error('Error saving score:', error);
      createToast('danger', 'Error saving score. Please try again.');
    });
  };

  // Load leaderboard data - performans için optimize edildi
  window.loadLeaderboard = function(gameType, elementId) {
    const leaderboardElement = document.getElementById(elementId);
    if (!leaderboardElement) return;

    // Yükleniyor göstergesi ekleyelim
    leaderboardElement.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-light" role="status"></div></div>';

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

  // Helper function for timer - optimize edildi
  window.startTimer = function(durationInSeconds, displayElement, onTimeUp) {
    let timer = durationInSeconds;
    const display = document.getElementById(displayElement);
    if (!display) return null; // Eğer element yoksa işlemi iptal et

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

  // Button Loading Animation - gecikmeyle ve performans iyileştirmeleriyle
  function setupButtonLoadingStates() {
    // Yalnızca form butonları için işlem yap
    document.querySelectorAll('form .btn:not(.no-loading)').forEach(button => {
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
    });
  }
});

// Profile related code - optimize edildi ve birleştirildi
document.addEventListener('DOMContentLoaded', function() {
  // Profil ve kısayol fonksiyonlarını bir kerede başlat
  initProfileFunctions();
});

// Tüm profil ilgili fonksiyonları tek bir yerde başlat
function initProfileFunctions() {
  // Profile Modal Lazy Loading
  const profileButton = document.getElementById('profileButton');
  const profileModal = document.getElementById('profileModal');
  if (profileButton && profileModal) {
    const profileModalContent = document.getElementById('profileModalContent');
    const profileContentTemplate = document.getElementById('profileContentTemplate');
    let isContentLoaded = false;
    
    profileButton.addEventListener('click', function() {
      const modal = new bootstrap.Modal(profileModal);
      modal.show();

      if (!isContentLoaded && profileModalContent && profileContentTemplate) {
        // Delay content loading slightly to ensure smooth modal animation
        setTimeout(() => {
          profileModalContent.innerHTML = profileContentTemplate.innerHTML;
          isContentLoaded = true;
        }, 150);
      }
    });
  }
  
  // Navbar'da kullanıcı dropdown menüsünü mobil görünümde her zaman göster
  const adjustUserDropdown = function() {
    const userDropdownContainer = document.querySelector('.navbar-nav.ms-auto.d-flex');
    if (!userDropdownContainer) return;
    
    if (window.innerWidth < 992) { // Bootstrap'ın lg breakpoint değeri
      userDropdownContainer.classList.add('mobile-visible');
    } else {
      userDropdownContainer.classList.remove('mobile-visible');
    }
  };
  
  // İlk yüklemede ayarla
  adjustUserDropdown();
  
  // Ekran boyutu değiştiğinde ayarla - performans için throttle edildi
  let resizeTimeout;
  window.addEventListener('resize', function() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(adjustUserDropdown, 100);
  });
  
  // Profil Panel Event Listener
  document.addEventListener('click', function(event) {
    const profilePanel = document.getElementById('profilePanel');
    if (!profilePanel || !profilePanel.classList.contains('active')) return;
    
    const topLeftAvatar = document.getElementById('topLeftAvatar');
    if (topLeftAvatar && !topLeftAvatar.contains(event.target) && !profilePanel.contains(event.target)) {
      profilePanel.classList.remove('active');
    }
  });
  
  // Restore profile picture if needed
  const profilePicture = document.getElementById('profilePicture');
  const pictureContainer = document.getElementById('profile-picture-container');
  if (profilePicture && pictureContainer) {
    pictureContainer.appendChild(profilePicture);
  }
}

// Profil panelini aç/kapat
function toggleProfilePanel(event) {
  const panel = document.getElementById('profilePanel');
  if (!panel) return;

  // Olay yayılımını durdur
  if (event) event.stopPropagation();

  // Panel sınıfını değiştir (CSS geçişleri için)
  panel.classList.toggle('active');
}

// Kısayol panelini aç/kapat
function toggleShortcutPanel(event) {
  if (!event) return;
  event.stopPropagation();
  
  const panel = document.getElementById('shortcutPanel');
  if (!panel) return;

  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    
    // Panel dışına tıklandığında paneli kapat (tek bir event listener kullanımı için optimize edildi)
    const closeHandler = function closePanel(e) {
      if (!panel.contains(e.target) && e.target !== event.target) {
        panel.style.display = 'none';
        document.removeEventListener('click', closeHandler);
      }
    };
    
    document.addEventListener('click', closeHandler);
  }
}
