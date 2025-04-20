document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Setup button loading animations
  setupButtonLoadingStates();

  // Kısayol panelini kapat - dışa tıklandığında
  document.addEventListener('click', function(e) {
    const shortcutPanel = document.getElementById('shortcutPanel');
    const profileShortcut = document.querySelector('.profile-shortcut-avatar-wrapper');

    if (shortcutPanel && 
        shortcutPanel.style.display === 'block' && 
        !shortcutPanel.contains(e.target) && 
        profileShortcut && 
        !profileShortcut.contains(e.target)) {
      shortcutPanel.style.display = 'none';
    }
  });

  // Puan sisteminin çalıştığından emin olmak için kontrol
  if (typeof window.ScoreCalculator === 'undefined') {
    console.error("ScoreCalculator modülü yüklenemedi!");
    // Basit yedek ScoreCalculator modülü oluştur
    window.ScoreCalculator = {
      calculate: function(params) {
        const score = params.score || 50;
        const difficulty = params.difficulty || 'medium';

        // Zorluk çarpanı
        let difficultyMultiplier = 1.0;
        if (difficulty === 'easy') difficultyMultiplier = 0.8;
        if (difficulty === 'medium') difficultyMultiplier = 1.0;
        if (difficulty === 'hard') difficultyMultiplier = 1.5;
        if (difficulty === 'expert') difficultyMultiplier = 2.0;

        // Skor hesaplama - 10-100 arasında sınırlı
        const finalScore = Math.max(10, Math.min(100, score * difficultyMultiplier));

        return {
          finalScore: Math.round(finalScore),
          breakdown: {
            baseScore: score,
            difficultyMultiplier: difficultyMultiplier,
            difficulty: difficulty
          }
        };
      },

      normalize: function(rawScore, minScore, maxScore, scaleMin = 10, scaleMax = 100) {
        if (maxScore === minScore) return scaleMin;

        const normalized = ((rawScore - minScore) / (maxScore - minScore)) * (scaleMax - scaleMin) + scaleMin;
        return Math.round(normalized);
      }
    };
  }

  // Puan kaydetme fonksiyonu kontrol
  if (typeof window.saveScoreAndDisplay === 'undefined') {
    console.error("saveScoreAndDisplay fonksiyonu yüklenemedi!");
    // Basit yedek fonksiyon oluştur
    window.saveScoreAndDisplay = function(gameType, score, playtime, difficulty, gameStats, callback) {
      console.log(`Puan kaydediliyor: ${gameType}, ${score}, ${difficulty}`);

      // Puanı API'ye gönder
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_type: gameType,
          score: Math.max(10, Math.min(100, score)),
          playtime: playtime || 60,
          difficulty: difficulty || 'medium',
          game_stats: gameStats || {}
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Skor kaydedildi:", data);

        // Callback varsa çağır
        if (typeof callback === 'function') {
          let scoreHtml = '';

          // Basit bir puan gösterimi
          if (data.success) {
            scoreHtml = `
              <div class="game-result-overlay">
                <div class="game-result-container">
                  <h2>Oyun Tamamlandı!</h2>
                  <div class="score-value">${data.points?.total || score} puan</div>
                  <button class="close-button">Kapat</button>
                </div>
              </div>
            `;
          }

          callback(scoreHtml, data);
        }
      })
      .catch(error => {
        console.error("Skor kaydetme hatası:", error);
        if (typeof callback === 'function') {
          callback('', { success: false, error: error.message });
        }
      });
    };
  }

  // Test puanı gönder - sadece geliştirme ortamında kullanılır
  window.testScoreSystem = function(gameType = 'puzzle', score = 75, difficulty = 'medium') {
    console.log(`Test puanı gönderiliyor: ${gameType}, ${score}, ${difficulty}`);
    window.saveScoreAndDisplay(gameType, score, 60, difficulty, {}, function(html, data) {
      console.log("Test sonucu:", data);
      if (html) {
        document.body.insertAdjacentHTML('beforeend', html);
      }
    });
  };

  // Oyun puanlarının kullanıcı profiline yansıtılmasını sağla
  window.updateUserProfile = function() {
    const profileStats = document.querySelector('.profile-stats');
    if (profileStats) {
      fetch('/api/user/stats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Kullanıcı istatistiklerini güncelle
          const statsHTML = `
            <div class="stat">
              <i class="fas fa-gamepad"></i>
              <span>${data.total_games || 0}</span>
              <label>Oynanan Oyun</label>
            </div>
            <div class="stat">
              <i class="fas fa-star"></i>
              <span>${data.experience_points || 0}</span>
              <label>XP</label>
            </div>
            <div class="stat">
              <i class="fas fa-trophy"></i>
              <span>${data.highest_score || 0}</span>
              <label>En Yüksek Puan</label>
            </div>
          `;

          profileStats.innerHTML = statsHTML;
        }
      })
      .catch(error => {
        console.error("Profil güncelleme hatası:", error);
      });
    }
  };

  // Sayfa yüklendiğinde profil verilerini güncelle
  if (window.location.pathname.includes('/profile')) {
    window.updateUserProfile();
  }

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

  // Hamburger menü toggle
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarMenu = document.querySelector('#navbarNav');

  if (navbarToggler && navbarMenu) {
    navbarToggler.addEventListener('click', function() {
      navbarMenu.classList.toggle('show');
    });
  }

  // Çerezleri kabul et
  const cookieBanner = document.getElementById('cookie-consent-banner');
  const acceptCookies = document.getElementById('accept-cookies');

  if (cookieBanner && acceptCookies) {
    if (!getCookie('cookie_consent')) {
      cookieBanner.style.display = 'block';
    }

    acceptCookies.addEventListener('click', function() {
      setCookie('cookie_consent', 'true', 365);
      cookieBanner.style.display = 'none';
    });
  }

  // Tüm butonları modernize et
  modernizeButtons();

  // Çerez ayarlama fonksiyonu
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  // Çerez okuma fonksiyonu
  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Butonları modernize etme fonksiyonu
  function modernizeButtons() {
    // Standart butonlar
    document.querySelectorAll('.btn:not(.navbar-toggler):not(.close):not(.btn-sm):not(.btn-link)').forEach(button => {
      // Eğer yeni modern sınıf zaten eklenmemişse
      if (!button.classList.contains('modern-btn')) {
        button.classList.add('modern-btn');

        // Buton türlerine göre modern sınıflar ekle
        if (button.classList.contains('btn-primary')) {
          button.classList.add('modern-btn-primary');
        } else if (button.classList.contains('btn-secondary')) {
          button.classList.add('modern-btn-secondary');
        } else if (button.classList.contains('btn-success')) {
          button.classList.add('modern-btn-success');
        } else if (button.classList.contains('btn-danger')) {
          button.classList.add('modern-btn-danger');
        } else if (button.classList.contains('btn-warning')) {
          button.classList.add('modern-btn-warning');
        } else if (button.classList.contains('btn-info')) {
          button.classList.add('modern-btn-info');
        } else if (button.classList.contains('btn-outline-primary')) {
          button.classList.add('modern-btn-outline', 'modern-btn-outline-primary');
        }

        // Buton boyutuna göre sınıflar
        if (button.classList.contains('btn-lg')) {
          button.classList.add('modern-btn-lg');
        }
      }
    });

    // Oyun butonları
    document.querySelectorAll('.btn-game').forEach(button => {
      if (!button.classList.contains('modern-btn')) {
        button.classList.add('modern-btn', 'modern-btn-primary');
      }
    });

    // Standart başlat butonları
    document.querySelectorAll('.standard-start-btn').forEach(button => {
      if (!button.classList.contains('modern-btn')) {
        button.classList.add('modern-btn', 'modern-btn-primary');
      }
    });

    // Standart geri butonları
    document.querySelectorAll('.standard-back-btn').forEach(button => {
      if (!button.classList.contains('modern-btn')) {
        button.classList.add('modern-btn', 'modern-btn-secondary');
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

  // Navbar'da kullanıcı dropdown menüsünü mobil görünümde her zaman göster
  const adjustUserDropdown = function() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const userDropdownContainer = document.querySelector('.navbar-nav.ms-auto.d-flex');

    // Null kontrolü ekleyelim
    if (!userDropdownContainer) return;

    if (window.innerWidth < 992) { // Bootstrap'ın lg breakpoint değeri
      userDropdownContainer.classList.add('mobile-visible');
    } else {
      userDropdownContainer.classList.remove('mobile-visible');
    }
  };

  // İlk yüklemede ayarla
  setTimeout(adjustUserDropdown, 100); // DOMContentLoaded olayından sonra bir gecikme ekleyelim

  // Ekran boyutu değiştiğinde ayarla
  window.addEventListener('resize', adjustUserDropdown);

  // Hamburger menü butonuna tıklandığında avatarların konumunu koru
  const navbarToggler = document.querySelector('.navbar-toggler');
  if (navbarToggler) {
    navbarToggler.addEventListener('click', function() {
      // Avatar konumunu sabitlemek için bir şey yapmaya gerek yok,
      // CSS'de position: fixed ile halledildi
    });
  }
});

// Yeni profil paneli işlevselliği
document.addEventListener('DOMContentLoaded', function() {
  // Tıklama dışında profil menüsünü kapatma işlevi için global event listener
  document.addEventListener('click', function(event) {
    const topLeftAvatar = document.getElementById('topLeftAvatar');
    const profilePanel = document.getElementById('profilePanel');

    if (profilePanel && profilePanel.classList.contains('active') && 
        topLeftAvatar && !topLeftAvatar.contains(event.target) && 
        !profilePanel.contains(event.target)) {
      profilePanel.classList.remove('active');
    }
  });
});

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
  event.stopPropagation();
  const panel = document.getElementById('shortcutPanel');
  if (!panel) return;

  if (panel.style.display === 'block') {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';

    // Panel dışına tıklandığında paneli kapat
    document.addEventListener('click', function closePanel(e) {
      if (!panel.contains(e.target) && e.target !== event.target) {
        panel.style.display = 'none';
        document.removeEventListener('click', closePanel);
      }
    });
  }
}

// Added to restore profile picture
document.addEventListener('DOMContentLoaded', function() {
  const profilePicture = document.getElementById('profilePicture');
  if (profilePicture && document.getElementById('profile-picture-container')) {
    document.getElementById('profile-picture-container').appendChild(profilePicture);
  }

  // Tema değiştirme özelliği kaldırıldı - Varsayılan temayı kullan
  document.documentElement.className = 'dark';
});

// Avatar ve resim yükleme hatası için alternatif gösterimi
document.addEventListener('DOMContentLoaded', function() {
  // Kullanılabilir avatarlar listesi - yükleme hatası durumunda rastgele kullanılacak
  const availableAvatars = [
    '/static/images/avatars/default.svg',
    '/static/avatars/bots/avatar_male_1.svg',
    '/static/avatars/bots/avatar_male_2.svg',
    '/static/avatars/bots/avatar_male_3.svg',
    '/static/avatars/bots/avatar_female_1.svg',
    '/static/avatars/bots/avatar_female_2.svg',
    '/static/avatars/avatar1.svg',
    '/static/avatars/avatar2.svg',
    '/static/avatars/avatar3.svg',
    '/static/avatars/avatar4.svg',
    '/static/avatars/avatar5.svg',
    '/static/avatars/avatar6.svg',
    '/static/avatars/avatar7.svg',
    '/static/avatars/avatar8.svg',
    '/static/avatars/avatar9.svg',
    '/static/avatars/avatar10.svg'
  ];

  // Rasgele bir avatar seç
  function getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    return availableAvatars[randomIndex];
  }

  // Profil resimleri için hata kontrolü
  document.querySelectorAll('img.profile-avatar, img.navbar-avatar, img.comment-avatar, img.leaderboard-avatar, img.navbar-corner-avatar').forEach(img => {
    img.onerror = function() {
      // Resim yüklenemezse, varsayılan avatar veya placeholder göster
      console.log('Avatar yüklenemedi:', this.src);

      // Placeholder div oluştur (kullanıcı adının ilk harfi)
      if (this.getAttribute('data-username')) {
        const username = this.getAttribute('data-username');
        const placeholder = document.createElement('div');

        // Orijinal resim elementinin sınıflarını koru, ancak avatar sınıfını placeholder ile değiştir
        placeholder.className = this.className.replace('profile-avatar', 'profile-avatar-placeholder')
                                             .replace('navbar-avatar', 'navbar-avatar-placeholder')
                                             .replace('comment-avatar', 'comment-avatar-placeholder')
                                             .replace('leaderboard-avatar', 'leaderboard-avatar-placeholder');

        placeholder.textContent = username.charAt(0).toUpperCase();

        // Elementi değiştir
        if (this.parentNode) {
          this.parentNode.replaceChild(placeholder, this);
        }
      } else {
        // Rasgele bir avatar seç
        this.src = getRandomAvatar();
      }
    };
  });
});