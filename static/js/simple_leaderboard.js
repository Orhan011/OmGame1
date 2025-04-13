/**
 * Basit Liderlik Tablosu JavaScript
 * Kullanıcıları sıralar ve gösterir
 */

document.addEventListener('DOMContentLoaded', function() {
  // Liderlik tablosunu yükle
  loadLeaderboard();
  
  // Yenile butonunu ayarla
  const refreshButton = document.getElementById('refreshLeaderboard');
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      this.classList.add('refreshing');
      const icon = this.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      
      loadLeaderboard().then(() => {
        setTimeout(() => {
          this.classList.remove('refreshing');
          if (icon) icon.classList.remove('fa-spin');
        }, 500);
      });
    });
  }
});

/**
 * API'den liderlik tablosu verilerini yükler ve gösterir
 * @returns {Promise} Yükleme işlemi tamamlandığında dönen Promise
 */
function loadLeaderboard() {
  const container = document.getElementById('leaderboardRows');
  if (!container) return Promise.resolve();
  
  // Yükleniyor göster
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Liderlik tablosu yükleniyor...</p>
    </div>
  `;
  
  // API'den verileri al
  return fetch('/api/scores/aggregated')
    .then(response => response.json())
    .then(data => {
      console.log('API yanıtı alındı', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = `
          <div class="loading-state">
            <p>Henüz skor kaydı bulunmuyor</p>
          </div>
        `;
        return;
      }
      
      console.log('Kullanıcı skorları alındı:', data.length);
      
      // Skorları sırala (en yüksekten en düşüğe)
      data.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
      
      // Sadece ilk 10 oyuncuyu al
      const topPlayers = data.slice(0, 10);
      
      // HTML çıktısını oluştur
      let html = '';
      
      // Her kullanıcı için bir satır ekle
      topPlayers.forEach((player, index) => {
        const rank = index + 1;
        const username = player.username || 'İsimsiz Oyuncu';
        const score = player.total_score || 0;
        const avatarUrl = player.avatar_url || '';
        
        console.log(`Kullanıcı eklenıyor: ${username}, Puan: ${score}`);
        
        // Mevcut kullanıcının kendi skorunu kontrol et
        const isCurrentUser = player.is_current_user || false;
        
        html += createPlayerRow(rank, username, score, avatarUrl, isCurrentUser);
      });
      
      // HTML içeriğini tabloya ekle
      container.innerHTML = html;
    })
    .catch(error => {
      console.error('Liderlik tablosu yüklenirken hata oluştu:', error);
      container.innerHTML = `
        <div class="loading-state">
          <p>Liderlik tablosu yüklenirken bir hata oluştu</p>
        </div>
      `;
    });
}

/**
 * Oyuncu satırı HTML'ini oluşturur
 * @param {number} rank - Sıralama numarası
 * @param {string} username - Kullanıcı adı
 * @param {number} score - Toplam puan
 * @param {string} avatarUrl - Profil resmi URL'i
 * @param {boolean} isCurrentUser - Mevcut kullanıcı mı?
 * @returns {string} HTML kodu
 */
function createPlayerRow(rank, username, score, avatarUrl, isCurrentUser) {
  const initial = username.charAt(0).toUpperCase();
  const currentUserClass = isCurrentUser ? 'current-user' : '';
  
  // Avatarı hazırla
  let avatarHtml = '';
  if (avatarUrl) {
    avatarHtml = `
      <img src="${fixAvatarUrl(avatarUrl)}" alt="${username}" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <span class="avatar-fallback" style="display:none">${initial}</span>
    `;
  } else {
    avatarHtml = `<span class="avatar-fallback">${initial}</span>`;
  }
  
  return `
    <div class="player-row ${currentUserClass}">
      <div class="player-rank">${rank}</div>
      <div class="player-info">
        <div class="player-avatar">
          ${avatarHtml}
        </div>
        <div class="player-name">${username}</div>
      </div>
      <div class="player-score">${formatNumber(score)}</div>
    </div>
  `;
}

/**
 * Avatar URL'ini düzeltir
 * @param {string} url - Avatar URL'i
 * @returns {string} Düzeltilmiş URL
 */
function fixAvatarUrl(url) {
  if (!url) return '';
  
  if (!url.startsWith('http')) {
    // Göreceli URL'leri düzelt
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    
    if (url.startsWith('/uploads/')) {
      url = '/static' + url;
    } else if (!url.startsWith('/static/')) {
      url = '/static/uploads/' + url;
    }
  }
  
  return url;
}

/**
 * Sayıları biçimlendirir (1000 -> 1,000)
 * @param {number} num - Biçimlendirilecek sayı
 * @returns {string} Biçimlendirilmiş sayı
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}