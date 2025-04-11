/**
 * @file rating-handler.js
 * @description Oyunlar için derecelendirme sistemi
 * 
 * Bu modül, kullanıcıların oyunları 1-5 yıldız arasında derecelendirmelerini sağlar
 * - Oyun sonuçları ekranında derecelendirme bileşeni oluşturur
 * - Kullanıcının önceki derecelendirmesini kontrol eder ve gösterir
 * - Derecelendirme gönderimini ve güncellemesini yönetir
 * - İstatistikler ve yorumları göstermek için fonksiyonlar içerir
 */

// IIFE ile global namespace'i kirletmemek için modülü kapsülleme
const RatingHandler = (function() {
  'use strict';
  
  // Özel değişkenler
  let currentRating = 0;
  let currentGameType = '';
  let commentEnabled = true;
  let alreadyRated = false;
  
  /**
   * Oyunu derecelendir
   * @param {string} gameType - Oyun türü (örn. "wordle", "tetris", "chess", vb.)
   * @param {number} rating - Derecelendirme (1-5 arası)
   * @param {string} comment - Kullanıcı yorumu (opsiyonel)
   * @returns {Promise} - API yanıtını içeren Promise nesnesi
   */
  function rateGame(gameType, rating, comment = '') {
    return fetch('/api/rate-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        game_type: gameType,
        rating: rating,
        comment: comment
      })
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Derecelendirme gönderilirken hata oluştu:', error);
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' };
    });
  }
  
  /**
   * Oyun derecelendirmelerini çek
   * @param {string} gameType - Oyun türü
   * @returns {Promise} - API yanıtını içeren Promise nesnesi (derecelendirmeler)
   */
  function getGameRatings(gameType) {
    return fetch(`/api/get-game-ratings/${gameType}`)
      .then(response => response.json())
      .catch(error => {
        console.error('Derecelendirmeler alınırken hata oluştu:', error);
        return { success: false };
      });
  }
  
  /**
   * Kullanıcının derecelendirmesini çek
   * @param {string} gameType - Oyun türü
   * @returns {Promise} - API yanıtını içeren Promise nesnesi (kullanıcı derecelendirmesi)
   */
  function getUserRating(gameType) {
    return fetch(`/api/get-user-rating/${gameType}`)
      .then(response => response.json())
      .catch(error => {
        console.error('Kullanıcı derecelendirmesi alınırken hata oluştu:', error);
        return { success: false };
      });
  }
  
  /**
   * Yıldız HTML'i oluştur
   * @param {number} index - Yıldız indeksi (1-5 arası)
   * @returns {string} - Yıldız HTML'i
   */
  function createStarHtml(index) {
    return `<span class="rating-star" data-rating="${index}">★</span>`;
  }
  
  /**
   * Derecelendirme durumunu göster
   * @param {string} message - Gösterilecek mesaj
   * @param {string} type - Mesaj türü (success, error, info, warning)
   * @param {Element} container - Mesajın ekleneceği konteyner
   */
  function showStatus(message, type, container) {
    // Varsa önceki durum mesajını temizle
    const existingStatus = container.querySelector('.rating-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    // Yeni durum mesajı oluştur
    const statusElement = document.createElement('div');
    statusElement.className = `rating-status ${type}`;
    statusElement.textContent = message;
    
    // Konteyner'a ekle
    container.appendChild(statusElement);
    
    // 3 saniye sonra otomatik kaldır (success ve info için)
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        statusElement.remove();
      }, 3000);
    }
  }
  
  /**
   * Yıldızları önizleme (hover) durumunu güncelle
   * @param {number} rating - Vurgulanacak yıldız sayısı
   * @param {Element} starsContainer - Yıldızları içeren konteyner
   */
  function updateStarsPreview(rating, starsContainer) {
    const stars = starsContainer.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('preview');
      } else {
        star.classList.remove('preview');
      }
    });
  }
  
  /**
   * Yıldızların aktif durumunu güncelle
   * @param {number} rating - Aktif yıldız sayısı
   * @param {Element} starsContainer - Yıldızları içeren konteyner
   */
  function updateStarsActive(rating, starsContainer) {
    const stars = starsContainer.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
      // Preview sınıfını kaldır
      star.classList.remove('preview');
    });
  }
  
  /**
   * Derecelendirme bileşenini oluştur ve konteyner'a ekle
   * @param {string} gameType - Oyun türü
   * @param {string} containerId - Derecelendirme bileşeninin ekleneceği konteyner ID'si
   * @param {Object} options - Opsiyonel ayarlar
   * @param {boolean} options.showComment - Yorum giriş alanını göster/gizle
   * @param {string} options.title - Başlık metni
   */
  function createRatingComponent(gameType, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`'${containerId}' ID'li konteyner bulunamadı.`);
      return;
    }
    
    // Ayarları varsayılanlarla birleştir
    const settings = {
      showComment: options.showComment !== undefined ? options.showComment : true,
      title: options.title || 'Bu oyunu değerlendirin'
    };
    
    // Oyun tipini sakla
    currentGameType = gameType;
    commentEnabled = settings.showComment;
    
    // Temizle
    container.innerHTML = '';
    container.className = 'rating-container';
    
    // İçeriği oluştur
    const titleElement = document.createElement('div');
    titleElement.className = 'rating-title';
    titleElement.textContent = settings.title;
    container.appendChild(titleElement);
    
    // Yıldızlar
    const starsContainer = document.createElement('div');
    starsContainer.className = 'rating-stars';
    for (let i = 1; i <= 5; i++) {
      starsContainer.innerHTML += createStarHtml(i);
    }
    container.appendChild(starsContainer);
    
    // Yorum alanı (opsiyonel)
    let commentElement = null;
    if (settings.showComment) {
      const commentContainer = document.createElement('div');
      commentContainer.className = 'rating-comment';
      
      commentElement = document.createElement('textarea');
      commentElement.placeholder = 'Oyun hakkında düşünceleriniz (opsiyonel)';
      commentElement.maxLength = 500;
      
      commentContainer.appendChild(commentElement);
      container.appendChild(commentContainer);
    }
    
    // Gönder butonu
    const submitContainer = document.createElement('div');
    submitContainer.className = 'rating-submit';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'rating-btn';
    submitButton.textContent = 'Gönder';
    submitButton.disabled = true;
    
    submitContainer.appendChild(submitButton);
    container.appendChild(submitContainer);
    
    // Yıldız tıklama olayları
    const stars = starsContainer.querySelectorAll('.rating-star');
    stars.forEach(star => {
      star.addEventListener('click', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        currentRating = rating;
        updateStarsActive(rating, starsContainer);
        submitButton.disabled = false;
      });
      
      star.addEventListener('mouseenter', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        updateStarsPreview(rating, starsContainer);
      });
    });
    
    // Yıldızlar konteynerden çıkış
    starsContainer.addEventListener('mouseleave', function() {
      updateStarsPreview(0, starsContainer);
      updateStarsActive(currentRating, starsContainer);
    });
    
    // Gönder butonu tıklama
    submitButton.addEventListener('click', function() {
      if (currentRating === 0) {
        showStatus('Lütfen bir derecelendirme seçin', 'warning', container);
        return;
      }
      
      const comment = commentElement ? commentElement.value.trim() : '';
      submitButton.disabled = true;
      
      rateGame(gameType, currentRating, comment)
        .then(response => {
          if (response.success) {
            showStatus(`Değerlendirmeniz ${response.message}`, 'success', container);
            alreadyRated = true;
          } else {
            if (response.login_required) {
              showLoginRequired(container);
            } else {
              showStatus(response.message || 'Bir hata oluştu', 'error', container);
              submitButton.disabled = false;
            }
          }
        });
    });
    
    // Kullanıcının mevcut derecelendirmesini kontrol et
    getUserRating(gameType)
      .then(data => {
        if (data.success) {
          if (data.has_rated) {
            // Kullanıcı daha önce derecelendirme yapmış
            currentRating = data.rating;
            updateStarsActive(data.rating, starsContainer);
            
            if (commentElement && data.comment) {
              commentElement.value = data.comment;
            }
            
            submitButton.textContent = 'Güncelle';
            submitButton.disabled = false;
            alreadyRated = true;
            
            // Kullanıcıya bildirim göster
            showStatus('Önceki derecelendirmeniz yüklendi', 'info', container);
          } else if (data.guest) {
            // Misafir kullanıcı
            showLoginRequired(container);
          }
        }
      });
  }
  
  /**
   * Giriş gerekli mesajını göster
   * @param {Element} container - Mesajın ekleneceği konteyner
   */
  function showLoginRequired(container) {
    // Temizle
    container.innerHTML = '';
    
    // Giriş mesajı oluştur
    const loginMessage = document.createElement('div');
    loginMessage.className = 'login-rating-message';
    
    const messageText = document.createElement('p');
    messageText.textContent = 'Oyunu derecelendirmek için giriş yapmalısınız';
    
    const loginButton = document.createElement('a');
    loginButton.href = '/login';
    loginButton.className = 'login-btn';
    loginButton.textContent = 'Giriş Yap';
    
    loginMessage.appendChild(messageText);
    loginMessage.appendChild(loginButton);
    container.appendChild(loginMessage);
  }
  
  /**
   * Oyun sonuç ekranı için derecelendirme bileşeni oluştur
   * @param {string} gameType - Oyun türü
   * @param {string} containerId - Derecelendirme bileşeninin ekleneceği konteyner ID'si
   */
  function createGameResultRating(gameType, containerId) {
    createRatingComponent(gameType, containerId, {
      title: 'Bu oyunu nasıl buldunuz?',
      showComment: true
    });
  }
  
  /**
   * Derecelendirme istatistiklerini göster
   * @param {string} gameType - Oyun türü
   * @param {string} containerId - İstatistiklerin ekleneceği konteyner ID'si
   */
  function showRatingStatistics(gameType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`'${containerId}' ID'li konteyner bulunamadı.`);
      return;
    }
    
    // Veri yükleniyor mesajı
    container.innerHTML = '<div class="loading">Değerlendirmeler yükleniyor...</div>';
    
    // Derecelendirmeleri çek
    getGameRatings(gameType)
      .then(data => {
        // Temizle
        container.innerHTML = '';
        
        if (!data.success) {
          container.innerHTML = '<div class="error">Değerlendirmeler yüklenirken bir hata oluştu</div>';
          return;
        }
        
        // İstatistik yoksa bildir
        if (data.rating_count === 0) {
          container.innerHTML = '<div class="info">Henüz değerlendirme yok</div>';
          return;
        }
        
        // İstatistikler
        const statsElement = document.createElement('div');
        statsElement.className = 'rating-statistics';
        
        // Başlık ve ortalama
        const statsHeader = document.createElement('div');
        statsHeader.className = 'rating-statistics-header';
        
        const avgRating = document.createElement('div');
        avgRating.className = 'avg-rating';
        avgRating.textContent = data.avg_rating;
        
        const ratingCount = document.createElement('div');
        ratingCount.className = 'rating-count';
        ratingCount.textContent = `${data.rating_count} değerlendirme`;
        
        statsHeader.appendChild(avgRating);
        statsHeader.appendChild(ratingCount);
        statsElement.appendChild(statsHeader);
        
        // Derecelendirme çubukları
        for (let i = 5; i >= 1; i--) {
          const barContainer = document.createElement('div');
          barContainer.className = 'rating-bar';
          
          const barLabel = document.createElement('div');
          barLabel.className = 'rating-label';
          barLabel.innerHTML = `${i} <span class="rating-star-icon">★</span>`;
          
          const barBg = document.createElement('div');
          barBg.className = 'rating-bar-bg';
          
          const barFill = document.createElement('div');
          barFill.className = 'rating-bar-fill';
          
          // Çubuk genişliği
          const count = data.distribution[i] || 0;
          const percentage = data.rating_count > 0 ? (count / data.rating_count * 100) : 0;
          barFill.style.width = `${percentage}%`;
          
          // Değer
          const barValue = document.createElement('div');
          barValue.className = 'rating-bar-value';
          barValue.textContent = count;
          
          barBg.appendChild(barFill);
          barContainer.appendChild(barLabel);
          barContainer.appendChild(barBg);
          barContainer.appendChild(barValue);
          
          statsElement.appendChild(barContainer);
        }
        
        container.appendChild(statsElement);
        
        // Son yorumlar
        if (data.latest_comments && data.latest_comments.length > 0) {
          const reviewsContainer = document.createElement('div');
          reviewsContainer.className = 'latest-reviews';
          
          const reviewsHeader = document.createElement('div');
          reviewsHeader.className = 'latest-reviews-header';
          reviewsHeader.textContent = 'Son Değerlendirmeler';
          reviewsContainer.appendChild(reviewsHeader);
          
          data.latest_comments.forEach(comment => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            const reviewHeader = document.createElement('div');
            reviewHeader.className = 'review-header';
            
            const username = document.createElement('div');
            username.className = 'review-username';
            username.textContent = comment.username;
            
            const ratingValue = document.createElement('div');
            ratingValue.className = 'review-rating';
            ratingValue.textContent = '★'.repeat(comment.rating);
            
            reviewHeader.appendChild(username);
            reviewHeader.appendChild(ratingValue);
            
            const reviewContent = document.createElement('div');
            reviewContent.className = 'review-content';
            reviewContent.textContent = comment.comment;
            
            const reviewDate = document.createElement('div');
            reviewDate.className = 'review-date';
            reviewDate.textContent = comment.timestamp;
            
            reviewItem.appendChild(reviewHeader);
            reviewItem.appendChild(reviewContent);
            reviewItem.appendChild(reviewDate);
            
            reviewsContainer.appendChild(reviewItem);
          });
          
          container.appendChild(reviewsContainer);
        }
      });
  }
  
  // Public API
  return {
    createRatingComponent,
    createGameResultRating,
    showRatingStatistics,
    getUserRating,
    getGameRatings
  };
})();

// Global namespace'e ekle
window.RatingHandler = RatingHandler;