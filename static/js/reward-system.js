/**
 * OmGame Ödül Sistemi
 * 
 * Bu modül, oyun bitimlerinde kullanıcıya gösterilecek puan, seviye ve
 * XP bilgilerini yönetir. Oyun başarıyla tamamlandığında, mevcut puanları, yeni puanları
 * ve XP kazanımlarını görsel bir şekilde sunar.
 */

class RewardSystem {
  constructor() {
    // Animasyon durumları
    this.animating = false;
    
    // Oyun listesi
    this.gameNames = {
      'wordPuzzle': 'Kelime Bulmaca',
      'memoryMatch': 'Hafıza Eşleştirme',
      '3dRotation': '3D Rotasyon',
      'numberSequence': 'Sayı Dizisi',
      'memoryCards': 'Hafıza Kartları',
      'numberChain': 'Sayı Zinciri',
      'labyrinth': '3D Labirent',
      'puzzle': 'Bulmaca',
      'audioMemory': 'Sesli Hafıza',
      'nBack': 'N-Back',
      'sudoku': 'Sudoku',
      '2048': '2048',
      'wordle': 'Wordle',
      'chess': 'Satranç',
      'tetris': 'Tetris',
      'typingSpeed': 'Yazma Hızı',
      'puzzleSlider': 'Puzzle Slider',
      'colorMatch': 'Renk Eşleştirme',
      'mathChallenge': 'Matematik Mücadelesi',
      'snakeGame': 'Yılan Oyunu',
      'simonSays': 'Simon Diyor ki',
      'iqTest': 'IQ Testi'
    };
  }

  /**
   * Skoru sunucuya kaydet ve ödül ekranını göster
   * @param {string} gameType - Oyun türü
   * @param {number} score - Oyun skoru
   * @param {string} difficulty - Oyun zorluğu (easy, medium, hard)
   * @param {number} playtime - Oyun süresi (saniye cinsinden)
   * @param {function} onComplete - İşlem tamamlandığında çağrılacak fonksiyon
   */
  saveScore(gameType, score, difficulty = 'medium', playtime = 0, onComplete = null) {
    if (this.animating) return;
    this.animating = true;
    
    // Puan verisini oluştur
    const scoreData = {
      game_type: gameType,
      score: score,
      difficulty: difficulty,
      playtime: playtime
    };
    
    // API'ye gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
      
      if (data.success) {
        // Ödül ekranını göster
        this.showRewardScreen(data, gameType);
      } else {
        // Hata durumunda
        this.showAlert(data.message || 'Puan kaydedilirken bir hata oluştu', 'error');
      }
      
      this.animating = false;
      
      // Tamamlama fonksiyonunu çağır (varsa)
      if (onComplete && typeof onComplete === 'function') {
        onComplete(data);
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
      this.showAlert('Puan kaydedilirken bir hata oluştu', 'error');
      this.animating = false;
      
      // Tamamlama fonksiyonunu çağır (varsa) - error parametresi ile
      if (onComplete && typeof onComplete === 'function') {
        onComplete(null, error);
      }
    });
  }
  
  /**
   * Ödül ekranını göster
   * @param {object} data - API'den gelen yanıt verisi
   * @param {string} gameType - Oyun türü
   */
  showRewardScreen(data, gameType) {
    // Ödül ekranı HTML'i
    const gameName = this.gameNames[gameType] || gameType;
    
    // Modal HTML oluştur
    const modalHTML = `
      <div id="rewardModal" class="reward-modal">
        <div class="reward-content">
          <div class="reward-header">
            <h2>${gameName} Tamamlandı!</h2>
            <span class="close-reward">&times;</span>
          </div>
          <div class="reward-body">
            <div class="score-section">
              <div class="score-display">
                <div class="score-label">Skor</div>
                <div class="score-value">${data.score}</div>
              </div>
            </div>
            
            <div class="points-section">
              <h3>Kazanılan Puanlar</h3>
              <div class="points-breakdown">
                <div class="point-item">
                  <div class="point-label">Temel Puan</div>
                  <div class="point-value">${data.points.base_points}</div>
                </div>
                ${data.points.streak_bonus > 0 ? `
                <div class="point-item streak-bonus">
                  <div class="point-label">Ardışık Oynama Bonusu (${data.streak_count} gün)</div>
                  <div class="point-value">+${data.points.streak_bonus}</div>
                </div>` : ''}
                ${data.points.daily_bonus > 0 ? `
                <div class="point-item daily-bonus">
                  <div class="point-label">Günlük İlk Oyun Bonusu</div>
                  <div class="point-value">+${data.points.daily_bonus}</div>
                </div>` : ''}
                <div class="point-item total-points">
                  <div class="point-label">Toplam Puan</div>
                  <div class="point-value">${data.points.total_points}</div>
                </div>
              </div>
            </div>
            
            <div class="xp-section">
              <h3>Deneyim Puanı</h3>
              <div class="xp-gain">
                <div class="xp-icon">✨</div>
                <div class="xp-value">${data.xp_gain} XP</div>
              </div>
              
              <div class="level-display">
                <div class="level-info">
                  <div class="level-number">Seviye ${data.level}</div>
                  ${data.level_up ? '<div class="level-up-badge">Seviye Atladınız!</div>' : ''}
                </div>
                <div class="level-progress-container">
                  <div class="level-progress-bar"></div>
                  <div class="level-progress-text">0%</div>
                </div>
              </div>
            </div>
            
            <div class="reward-buttons">
              <button class="reward-button play-again-btn">Tekrar Oyna</button>
              <button class="reward-button home-btn">Ana Sayfa</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Modal'ı sayfaya ekle
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Modal elementlerini seç
    const modal = document.getElementById('rewardModal');
    const closeBtn = modal.querySelector('.close-reward');
    const playAgainBtn = modal.querySelector('.play-again-btn');
    const homeBtn = modal.querySelector('.home-btn');
    const progressBar = modal.querySelector('.level-progress-bar');
    const progressText = modal.querySelector('.level-progress-text');
    
    // Modal stillerini ekle (eğer henüz eklenmemişse)
    this.injectModalStyles();
    
    // Modal'ı göster
    setTimeout(() => {
      modal.classList.add('show');
      
      // Progress bar animasyonu (0.5 saniye sonra başlat)
      setTimeout(() => {
        // XP ilerleme yüzdesini hesapla
        const currentLevelXP = this.calculateLevelXP(data.level);
        const nextLevelXP = this.calculateLevelXP(data.level + 1);
        const currentXP = data.total_xp;
        
        const progress = Math.min(100, Math.max(0, 
          ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        ));
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
      }, 500);
    }, 100);
    
    // Modal kapatma işlevleri
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    });
    
    // Tekrar oyna butonu
    playAgainBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        // Sayfayı yenile (oyunu yeniden başlat)
        location.reload();
      }, 300);
    });
    
    // Ana sayfa butonu
    homeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => {
        // Ana sayfaya yönlendir
        window.location.href = '/';
      }, 300);
    });
  }
  
  /**
   * Modül için gerekli CSS stillerini ekler
   */
  injectModalStyles() {
    // Stil zaten eklenmiş mi kontrol et
    if (document.getElementById('reward-system-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'reward-system-styles';
    style.textContent = `
      .reward-modal {
        display: none;
        position: fixed;
        z-index: 9999;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .reward-modal.show {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
      }
      
      .reward-content {
        background: linear-gradient(135deg, #1e1e32, #2a2a4a);
        color: #fff;
        width: 90%;
        max-width: 500px;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        transform: translateY(20px);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
      }
      
      .reward-modal.show .reward-content {
        transform: translateY(0);
      }
      
      .reward-header {
        background: linear-gradient(45deg, #6a5ae0, #9d6dd7);
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
      }
      
      .reward-header h2 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
        color: white;
      }
      
      .close-reward {
        font-size: 24px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.8);
        transition: color 0.2s ease;
      }
      
      .close-reward:hover {
        color: white;
      }
      
      .reward-body {
        padding: 20px;
      }
      
      .score-section {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .score-display {
        background: linear-gradient(45deg, #6a5ae0, #9d6dd7);
        border-radius: 12px;
        padding: 15px;
        display: inline-block;
        min-width: 120px;
        margin: 0 auto;
        box-shadow: 0 4px 15px rgba(106, 90, 224, 0.4);
      }
      
      .score-label {
        font-size: 0.9rem;
        font-weight: 500;
        opacity: 0.9;
        margin-bottom: 5px;
      }
      
      .score-value {
        font-size: 2.2rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .points-section, .xp-section {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
      }
      
      .points-section h3, .xp-section h3 {
        margin-top: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 15px;
      }
      
      .points-breakdown {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .point-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        transition: transform 0.2s ease, background 0.2s ease;
      }
      
      .point-item:hover {
        transform: translateX(5px);
        background: rgba(255, 255, 255, 0.1);
      }
      
      .streak-bonus {
        background: rgba(255, 193, 7, 0.15);
      }
      
      .daily-bonus {
        background: rgba(40, 167, 69, 0.15);
      }
      
      .total-points {
        background: rgba(106, 90, 224, 0.2);
        font-weight: 600;
        margin-top: 5px;
      }
      
      .point-label {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .point-value {
        font-weight: 600;
      }
      
      .xp-gain {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(106, 90, 224, 0.2);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 15px;
      }
      
      .xp-icon {
        font-size: 1.5rem;
        margin-right: 10px;
        animation: pulse 2s infinite;
      }
      
      .xp-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: #9d6dd7;
      }
      
      .level-display {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        padding: 15px;
      }
      
      .level-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .level-number {
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .level-up-badge {
        background: linear-gradient(45deg, #ff9800, #ff5722);
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 20px;
        animation: pulse 1.5s infinite;
      }
      
      .level-progress-container {
        height: 15px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }
      
      .level-progress-bar {
        height: 100%;
        width: 0;
        background: linear-gradient(45deg, #6a5ae0, #9d6dd7);
        border-radius: 10px;
        transition: width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .level-progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.7rem;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
      
      .reward-buttons {
        display: flex;
        gap: 15px;
        margin-top: 20px;
      }
      
      .reward-button {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .reward-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .play-again-btn {
        background: linear-gradient(45deg, #6a5ae0, #9d6dd7);
      }
      
      .play-again-btn:hover {
        background: linear-gradient(45deg, #5d4ed0, #8c5dc7);
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      
      /* Mobil cihazlar için uyarlama */
      @media (max-width: 480px) {
        .reward-content {
          width: 95%;
        }
        
        .reward-header h2 {
          font-size: 1.2rem;
        }
        
        .score-value {
          font-size: 1.8rem;
        }
        
        .reward-buttons {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Bildiri göster
   * @param {string} message - Bildiri mesajı
   * @param {string} type - Bildiri türü ('success', 'error', 'info')
   */
  showAlert(message, type = 'success') {
    // Uyarı zaten var mı kontrol et
    const existingAlert = document.querySelector('.game-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    // Uyarı türüne göre renk belirle
    let color = '#28a745';  // success - yeşil
    if (type === 'error') {
      color = '#dc3545';    // error - kırmızı
    } else if (type === 'info') {
      color = '#17a2b8';    // info - mavi
    }
    
    // Uyarı HTML'i
    const alertHTML = `
      <div class="game-alert" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      ">
        ${message}
      </div>
    `;
    
    // Uyarıyı sayfaya ekle
    const alertContainer = document.createElement('div');
    alertContainer.innerHTML = alertHTML;
    document.body.appendChild(alertContainer.firstElementChild);
    
    // Uyarıyı göster
    setTimeout(() => {
      document.querySelector('.game-alert').style.transform = 'translateX(0)';
      
      // 5 saniye sonra kapat
      setTimeout(() => {
        const alert = document.querySelector('.game-alert');
        if (alert) {
          alert.style.transform = 'translateX(100%)';
          setTimeout(() => {
            alert.remove();
          }, 300);
        }
      }, 5000);
    }, 100);
  }
  
  /**
   * Belirli bir seviye için gereken toplam XP'yi hesapla
   * @param {number} level - Seviye
   * @returns {number} - Gereken XP
   */
  calculateLevelXP(level) {
    return Math.floor(500 * Math.pow(level, 1.5));
  }
}

// Global bir örnek oluştur
window.rewardSystem = new RewardSystem();