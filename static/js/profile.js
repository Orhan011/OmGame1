// Profil sayfası JavaScript işlemleri
document.addEventListener('DOMContentLoaded', function() {
  // Avatar seçim işlemleri
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const selectedAvatarInput = document.getElementById('selectedAvatar');

  // Profil resmi yükleme hatası kontrolü
  document.querySelectorAll('.profile-avatar, .avatar-preview').forEach(img => {
    if (img.tagName === 'IMG') {
      img.onerror = function() {
        // Resim yüklenemezse varsayılan avatar veya placeholder göster
        if (this.parentNode) {
          const placeholder = document.createElement('div');
          placeholder.className = img.className.replace('profile-avatar', 'profile-avatar-placeholder');
          placeholder.textContent = document.querySelector('.profile-name')?.textContent?.charAt(0).toUpperCase() || '?';
          this.parentNode.replaceChild(placeholder, this);
        }
      };
    }
  });

  // Dosya yükleme
  if (avatarInput) {
    avatarInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
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
});