/**
 * Yeni Liderlik Tablosu JavaScript
 */

// DOM yüklendikten sonra çalıştır
document.addEventListener('DOMContentLoaded', function() {
  console.log("Liderlik tablosu modülü yükleniyor...");
  
  // Gerekli DOM elementleri
  const refreshButton = document.getElementById('refreshBtn');
  const leaderboardRows = document.getElementById('leaderboardRows');
  
  // Sayfa yüklendiğinde liderlik tablosunu çek
  loadLeaderboard();
  
  // Yenile butonuna tıklandığında tabloyu güncelle
  refreshButton.addEventListener('click', function() {
    refreshButton.disabled = true;
    refreshButton.classList.add('refreshing');
    loadLeaderboard().finally(() => {
      refreshButton.disabled = false;
      refreshButton.classList.remove('refreshing');
      
      // Güncellenme zamanını göster
      const now = new Date();
      const time = now.getHours().toString().padStart(2, '0') + ":" + 
                   now.getMinutes().toString().padStart(2, '0') + ":" + 
                   now.getSeconds().toString().padStart(2, '0');
      console.log("Skor tablosu yenilendi - " + time);
    });
  });
  
  // 60 saniyede bir otomatik yenile
  setInterval(loadLeaderboard, 60 * 1000);
  
  /**
   * API'den liderlik tablosu verilerini yükler ve gösterir
   * @returns {Promise} Yükleme işlemi tamamlandığında dönen Promise
   */
  function loadLeaderboard() {
    console.log("Liderlik tablosu yükleniyor...");
    
    // Yükleme göstergesini göster
    leaderboardRows.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Liderlik tablosu yükleniyor...</p>
      </div>
    `;
    
    // Verileri API'den çek
    return fetch('/api/scores/aggregated')
      .then(response => response.json())
      .then(data => {
        console.log("API yanıtı alındı", data);
        displayLeaderboard(data);
      })
      .catch(error => {
        console.error("Liderlik tablosu yüklenirken hata oluştu:", error);
        leaderboardRows.innerHTML = `
          <div class="error-state">
            <p>Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }
  
  /**
   * Liderlik tablosu verilerini gösterir
   * @param {Array} users - Kullanıcı verileri
   */
  function displayLeaderboard(users) {
    // Verilerin olup olmadığını kontrol et
    if (!users || users.length === 0) {
      leaderboardRows.innerHTML = `
        <div class="empty-state">
          <p>Henüz hiç skor kaydedilmemiş.</p>
        </div>
      `;
      return;
    }
    
    console.log("Kullanıcı skorları alındı:", users.length);
    
    // En fazla 10 kullanıcı göster
    const topUsers = users.slice(0, 10);
    
    // HTML oluştur
    let html = '';
    
    // Her kullanıcı için tablo satırı oluştur
    topUsers.forEach((user, index) => {
      const rank = index + 1;
      console.log(`Kullanıcı eklenıyor: ${user.username}, Puan: ${user.total_score}`);
      
      // Kullanıcının sırası için CSS sınıfı (ilk 3 için özel stil)
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      
      // Profil avatarı
      let avatarHtml = '';
      if (user.avatar_url) {
        const fixedAvatarUrl = fixAvatarUrl(user.avatar_url);
        avatarHtml = `
          <img src="${fixedAvatarUrl}" alt="${user.username}" 
               onerror="this.style.display='none'; this.parentNode.innerHTML='${user.username.charAt(0).toUpperCase()}';" />
        `;
      } else {
        avatarHtml = user.username.charAt(0).toUpperCase();
      }
      
      // Mevcut kullanıcı kontrolü
      const isCurrentUser = user.is_current_user ? 'current-user' : '';
      
      // Satır HTML'i
      html += `
        <div class="player-row ${rankClass} ${isCurrentUser}">
          <div class="player-rank">${rank}</div>
          <div class="player-info">
            <div class="player-avatar">${avatarHtml}</div>
            <div class="player-name">${user.username}</div>
          </div>
          <div class="player-score">${formatNumber(user.total_score)}</div>
        </div>
      `;
      
      // Seviye takibi için loglama
      console.log(`Seviye tablosuna eklenen kullanıcı: ${user.username}`);
    });
    
    // Oluşturulan HTML'i DOM'a ekle
    leaderboardRows.innerHTML = html;
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
});