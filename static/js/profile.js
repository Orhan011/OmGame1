// Profil sayfası JavaScript işlemleri

// Bildirim gösterme fonksiyonu
function showNotification(message, type = 'success') {
  // Önceki bildirimleri temizle
  const existingNotifications = document.querySelectorAll('.profile-notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });
  
  // Yeni bildirim oluştur
  const notification = document.createElement('div');
  notification.className = `profile-notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Sayfaya ekle
  document.body.appendChild(notification);
  
  // Görünürlük animasyonu
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Zamanlayıcı ile kaldır
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Avatar seçim işlemleri
  const avatarInput = document.getElementById('avatarInput') || document.getElementById('avatarUpload');
  const avatarPreview = document.getElementById('avatarPreview');
  const selectedAvatarInput = document.getElementById('selectedAvatar');
  const removeAvatarBtn = document.getElementById('removeAvatar');

  // Avatar yükleme hatası kontrolü (Improved)
  document.querySelectorAll('.preset-avatar img, .profile-avatar, .avatar-preview').forEach(img => {
    if (img.tagName === 'IMG') {
      img.onerror = function() {
        this.onerror = null;
        this.src = '/static/images/avatars/default.svg';
      };
    }
  });
  
  // Avatar silme işlemi
  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (confirm('Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?')) {
        fetch('/profile/remove-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Kullanıcı arayüzünü güncelle
            const imgElement = document.querySelector('.current-avatar img') || document.querySelector('.profile-avatar');
            if (imgElement) {
              imgElement.src = '/static/images/avatars/default.svg';
            }
            
            // Bildirim göster
            showNotification('Profil fotoğrafı kaldırıldı!', 'success');
            
            // Butonları güncelle - silme butonunu gizle
            removeAvatarBtn.style.display = 'none';
            
            // Sayfayı yenile (isteğe bağlı)
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            showNotification(data.message || 'İşlem sırasında bir hata oluştu!', 'error');
          }
        })
        .catch(error => {
          console.error('Avatar silme hatası:', error);
          showNotification('İşlem sırasında bir hata oluştu! Lütfen tekrar deneyin.', 'error');
        });
      }
    });
  }

  // Dosya yükleme
  if (avatarInput) {
    avatarInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        console.log("Dosya seçildi:", file.name, "Boyut:", file.size, "Tip:", file.type);
        
        if (!file.type.match('image.*')) {
          alert('Lütfen geçerli bir resim dosyası seçin (JPEG, PNG, GIF, vb.)');
          return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB kontrol
          alert('Dosya boyutu çok büyük. Lütfen 5MB\'dan küçük bir resim seçin.');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          if (avatarPreview) {
            if (avatarPreview.tagName === 'IMG') {
              avatarPreview.src = e.target.result;
              avatarPreview.classList.add('updated');
            } else {
              // Placeholder div'i resim ile değiştir
              const img = document.createElement('img');
              img.src = e.target.result;
              img.classList.add('avatar-preview', 'updated');
              img.id = 'avatarPreview';
              avatarPreview.parentNode.replaceChild(img, avatarPreview);
            }

            // Hazır avatar seçimini temizle
            if (selectedAvatarInput) selectedAvatarInput.value = '';
            document.querySelectorAll('.preset-avatar').forEach(el => {
              el.classList.remove('selected');
            });

            // Anında animasyon efekti ekleme
            setTimeout(() => {
              document.querySelector('.updated')?.classList.remove('updated');
            }, 1000);
          }
          
          // Yüklenen resim bilgisini göster
          showNotification('Resim önizleme için hazır! Kaydetmek için "Fotoğrafı Güncelle" butonuna tıklayın.', 'info');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form onSubmit kontrolü
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('is-invalid');

          // Hata mesajı ekle
          const feedback = document.createElement('div');
          feedback.className = 'invalid-feedback';
          feedback.textContent = 'Bu alan zorunludur';

          if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
            field.parentNode.insertBefore(feedback, field.nextElementSibling);
          }
        } else {
          field.classList.remove('is-invalid');
          const nextEl = field.nextElementSibling;
          if (nextEl && nextEl.classList.contains('invalid-feedback')) {
            nextEl.remove();
          }
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });
  });

  // Tab işlevselliği
  const modernTabs = document.querySelectorAll('.modern-tab');
  const tabIndicator = document.querySelector('.tab-indicator');

  function positionTabIndicator(activeTab) {
    if (!tabIndicator || !activeTab) return;

    const tabRect = activeTab.getBoundingClientRect();
    const tabContainerRect = activeTab.parentNode.getBoundingClientRect();

    tabIndicator.style.width = `${tabRect.width}px`;
    tabIndicator.style.left = `${tabRect.left - tabContainerRect.left}px`;
  }

  // İlk yüklemede tab göstergesini konumlandır
  setTimeout(() => {
    const activeTab = document.querySelector('.modern-tab.active');
    positionTabIndicator(activeTab);
  }, 100);

  modernTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      modernTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      positionTabIndicator(this);
    });
  });

  // Hazır avatar seçimi
  document.querySelectorAll('.preset-avatar').forEach(avatar => {
    avatar.addEventListener('click', function() {
      // Animasyon efekti ekle
      this.classList.add('pulse-animation');

      // Görsel önizlemeyi güncelle
      const avatarUrl = this.getAttribute('data-avatar');
      const img = document.getElementById('avatarPreview');
      const previewContainer = document.querySelector('.current-avatar');

      // Önizleme geçiş animasyonu
      if (previewContainer) {
        previewContainer.classList.add('avatar-transition');
        setTimeout(() => previewContainer.classList.remove('avatar-transition'), 500);
      }

      if (img && img.tagName === 'IMG') {
        // Fade out-fade in animasyonu
        img.style.opacity = '0';
        setTimeout(() => {
          img.src = avatarUrl;
          img.classList.add('updated');
          img.style.opacity = '1';
        }, 300);
      } else if (document.getElementById('avatarPreview')) {
        // Placeholder div'i resimle değiştir
        const newImg = document.createElement('img');
        newImg.src = avatarUrl;
        newImg.id = 'avatarPreview';
        newImg.classList.add('avatar-preview', 'updated');
        newImg.style.opacity = '0';
        document.getElementById('avatarPreview').parentNode.replaceChild(newImg, document.getElementById('avatarPreview'));
        setTimeout(() => {
          newImg.style.opacity = '1';
        }, 50);
      }

      // Dosya seçimini temizle
      if (document.getElementById('avatarInput')) {
        document.getElementById('avatarInput').value = '';
      }

      // Seçilen avatarı vurgulamak için sınıf ekle/çıkar
      document.querySelectorAll('.preset-avatar').forEach(el => {
        el.classList.remove('selected');
        el.classList.remove('pulse-animation');
      });

      this.classList.add('selected');

      // Gizli input'a avatar değerini ata
      if (document.getElementById('selectedAvatar')) {
        document.getElementById('selectedAvatar').value = avatarUrl;
        console.log("Seçilen avatar URL'si:", avatarUrl);
      }

      // Bildirim göster
      const notification = document.createElement('div');
      notification.className = 'avatar-notification';
      notification.textContent = 'Avatar seçildi!';
      document.querySelector('.profile-edit-content').appendChild(notification);

      setTimeout(() => {
        notification.classList.add('show');
        document.querySelector('.updated')?.classList.remove('updated');
      }, 100);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    });
  });
});