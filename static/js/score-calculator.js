
/**
 * Skor hesaplama ve gösterme için yardımcı fonksiyonlar
 * 
 * Bu modül, oyun skorlarını hesaplamak, kaydetmek ve göstermek için gerekli fonksiyonları sağlar.
 */

const ScoreCalculator = {
  /**
   * Oyun sonrası puanları hesapla ve göster
   * @param {Object} gameStats - Oyun istatistikleri (skor, süre, zorluk, vb.)
   * @param {Function} onSuccess - Başarılı skor kaydedildiğinde çağrılacak fonksiyon
   * @param {Function} onError - Hata oluştuğunda çağrılacak fonksiyon (opsiyonel)
   */
  saveScoreAndDisplay: function(gameStats, onSuccess, onError = null) {
    if (!gameStats || typeof gameStats !== 'object') {
      console.error('Geçersiz oyun istatistikleri!');
      if (onError) onError('Geçersiz oyun istatistikleri!');
      return;
    }

    // API'ye gönderilecek isteği hazırla
    const requestData = {
      game_type: gameStats.gameType || 'unknown',
      score: gameStats.score || 0,
      difficulty: gameStats.difficulty || 'medium',
      playtime: gameStats.duration || 60,
      game_stats: {
        move_count: gameStats.moves || 0,
        hint_count: gameStats.hints || 0,
        accuracy: gameStats.accuracy || 0,
        completed: gameStats.completed || false,
        duration_seconds: gameStats.duration || 60
      }
    };

    // Skoru API'ye gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Başarılı yanıt - skorları göster
        this.displayResults(data, gameStats);
        
        // Başarı callback'i çağır
        if (onSuccess) onSuccess(data);
      } else {
        // Başarısız yanıt - hata mesajını göster
        console.warn('Skor kaydedilemedi:', data.message);
        
        // Misafir kullanıcı için bilgilendirme
        if (data.guest) {
          this.displayGuestResults(data, gameStats);
        }
        
        // Hata callback'i çağır
        if (onError) onError(data.message);
      }
    })
    .catch(error => {
      console.error('Skor gönderme hatası:', error);
      if (onError) onError('Bir ağ hatası oluştu. Lütfen daha sonra tekrar deneyin.');
    });
  },

  /**
   * Sonuçları görüntüle
   * @param {Object} data - API yanıtı
   * @param {Object} gameStats - Oyun istatistikleri
   */
  displayResults: function(data, gameStats) {
    // Sonuçları göstermek için gerekli DOM elementlerini bulunuz
    const resultElement = document.getElementById('game-result');
    if (!resultElement) {
      console.error('Sonuç gösterme elementi bulunamadı!');
      return;
    }

    // Seviye atlama kontrolü
    if (data.xp && data.xp.level_up) {
      this.showLevelUpMessage(data.xp.old_level, data.xp.level);
    }

    // Sonuçları oluştur
    let resultHTML = `
      <div class="result-header">
        <i class="fas fa-trophy result-icon"></i>
        <h2>Tebrikler!</h2>
        <p>Oyunu başarıyla tamamladınız.</p>
      </div>
      
      <div class="final-score-container">
        <div class="final-score">
          <div class="score-label">Oyun Skoru</div>
          <div class="score-value">${gameStats.score}</div>
        </div>
        <div class="final-score">
          <div class="score-label">Toplam Puan</div>
          <div class="score-value">${data.points ? data.points.total : gameStats.score}</div>
        </div>
        <div class="final-score">
          <div class="score-label">Kazanılan XP</div>
          <div class="score-value">${data.xp ? data.xp.gain : '0'}</div>
        </div>
      </div>
    `;

    // Eğer oyun hakkında detaylı istatistikler varsa
    if (gameStats.moves !== undefined || gameStats.duration !== undefined) {
      resultHTML += `
        <div class="game-details">
          <h3>Oyun Detayları</h3>
          <div class="details-grid">
      `;

      if (gameStats.moves !== undefined) {
        resultHTML += `
          <div class="detail-item">
            <div class="detail-label">Hamle Sayısı</div>
            <div class="detail-value">${gameStats.moves}</div>
          </div>
        `;
      }

      if (gameStats.duration !== undefined) {
        // Süreyi dakika:saniye formatına çevir
        const minutes = Math.floor(gameStats.duration / 60);
        const seconds = gameStats.duration % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        resultHTML += `
          <div class="detail-item">
            <div class="detail-label">Süre</div>
            <div class="detail-value">${formattedTime}</div>
          </div>
        `;
      }

      if (gameStats.hints !== undefined) {
        resultHTML += `
          <div class="detail-item">
            <div class="detail-label">İpucu Kullanımı</div>
            <div class="detail-value">${gameStats.hints}</div>
          </div>
        `;
      }

      if (gameStats.accuracy !== undefined) {
        resultHTML += `
          <div class="detail-item">
            <div class="detail-label">Doğruluk</div>
            <div class="detail-value">%${Math.round(gameStats.accuracy)}</div>
          </div>
        `;
      }

      resultHTML += `
          </div>
        </div>
      `;
    }

    // XP ve seviye bilgisi
    if (data.xp) {
      resultHTML += `
        <div class="xp-progress-container">
          <div class="xp-label">Seviye ${data.xp.level} - İlerleme</div>
          <div class="xp-progress-bar">
            <div class="xp-progress" style="width: ${data.xp.progress_percent}%"></div>
          </div>
          <div class="xp-progress-text">
            ${data.xp.progress_percent}% (${data.xp.gain} XP kazandınız)
          </div>
        </div>
      `;
    }

    // Sonuç elementine HTML'i ekle
    resultElement.innerHTML = resultHTML;

    // Sonuç elementini göster
    resultElement.style.display = 'block';
  },

  /**
   * Misafir kullanıcılar için sonuçları görüntüle
   * @param {Object} data - API yanıtı
   * @param {Object} gameStats - Oyun istatistikleri
   */
  displayGuestResults: function(data, gameStats) {
    // Sonuçları göstermek için gerekli DOM elementlerini bulunuz
    const resultElement = document.getElementById('game-result');
    if (!resultElement) {
      console.error('Sonuç gösterme elementi bulunamadı!');
      return;
    }

    // Sonuçları oluştur
    let resultHTML = `
      <div class="result-header">
        <i class="fas fa-trophy result-icon"></i>
        <h2>Tebrikler!</h2>
        <p>Oyunu başarıyla tamamladınız.</p>
      </div>
      
      <div class="final-score-container">
        <div class="final-score">
          <div class="score-label">Oyun Skoru</div>
          <div class="score-value">${gameStats.score}</div>
        </div>
      </div>
      
      <div class="guest-message">
        <p><i class="fas fa-info-circle"></i> ${data.message || 'Skorunuzu kaydetmek ve XP kazanmak için giriş yapın.'}</p>
        <div class="guest-actions">
          <a href="/login?redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">
            <i class="fas fa-sign-in-alt"></i> Giriş Yap
          </a>
          <a href="/register" class="btn btn-outline-light">
            <i class="fas fa-user-plus"></i> Kayıt Ol
          </a>
        </div>
      </div>
    `;

    // Sonuç elementine HTML'i ekle
    resultElement.innerHTML = resultHTML;

    // Sonuç elementini göster
    resultElement.style.display = 'block';
  },

  /**
   * Seviye atlama mesajını göster
   * @param {number} oldLevel - Eski seviye
   * @param {number} newLevel - Yeni seviye
   */
  showLevelUpMessage: function(oldLevel, newLevel) {
    // Seviye atlama bildirimi elementi var mı kontrol et
    let levelUpNotification = document.getElementById('level-up-notification');
    
    // Element yoksa oluştur
    if (!levelUpNotification) {
      levelUpNotification = document.createElement('div');
      levelUpNotification.id = 'level-up-notification';
      levelUpNotification.className = 'level-up-notification';
      document.body.appendChild(levelUpNotification);
    }
    
    // Seviye atlama içeriğini oluştur
    levelUpNotification.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-icon">
          <i class="fas fa-arrow-up"></i>
        </div>
        <h3>Seviye Atladınız!</h3>
        <p>Seviye ${oldLevel} → Seviye ${newLevel}</p>
      </div>
    `;
    
    // Gösterme animasyonu
    levelUpNotification.classList.add('show');
    
    // 5 saniye sonra gizle
    setTimeout(() => {
      levelUpNotification.classList.remove('show');
    }, 5000);
  }
};

// Eğer bir modül sistemi kullanılıyorsa, modülü dışa aktar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreCalculator;
}
