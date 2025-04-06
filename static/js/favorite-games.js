document.addEventListener('DOMContentLoaded', function() {
  // Favori düzenleme modunu kontrol eden değişken
  let editingMode = false;
  
  // Favori düzenleme butonunu bul
  const editFavoritesBtn = document.getElementById('editFavoritesBtn');
  
  // Ana sayfadaki favori oyunlar listesi
  const favoriteGameList = document.getElementById('favoriteGameList');
  
  // Tüm favori oyun kartları
  const favoriteCards = document.querySelectorAll('.game-card');
  
  // Tüm oyunları saklayan nesne, önceden dolduracağız
  const allGames = {
    'word_puzzle': {
      name: 'Kelime Bulmaca',
      description: 'Kelimeleri bul, sözcük hazineni genişlet.',
      icon: 'fas fa-font',
      route: 'word_puzzle'
    },
    'memory_cards': {
      name: 'Hafıza Kartları',
      description: 'Eşleşen kartları bul ve hafızanı test et.',
      icon: 'fas fa-clone',
      route: 'memory_cards'
    },
    'labyrinth': {
      name: 'Labirent',
      description: 'Çıkış yolunu bul ve stratejik düşün.',
      icon: 'fas fa-route',
      route: 'labyrinth'
    },
    'puzzle': {
      name: 'Yapboz',
      description: 'Parçaları birleştir ve görsel zekânı geliştir.',
      icon: 'fas fa-puzzle-piece',
      route: 'puzzle'
    },
    'number_sequence': {
      name: 'Sayı Dizisi',
      description: 'Sayı örüntülerini keşfet ve analitik düşün.',
      icon: 'fas fa-sort-numeric-up',
      route: 'number_sequence'
    },
    'number_chain': {
      name: 'Sayı Zinciri',
      description: 'Gördüğün sayıları doğru sırayla hatırla.',
      icon: 'fas fa-link',
      route: 'number_chain'
    },
    'audio_memory': {
      name: 'Sesli Hafıza',
      description: 'Duyduğun ses sıralamasını doğru tekrarla.',
      icon: 'fas fa-volume-up',
      route: 'audio_memory'
    },
    'n_back': {
      name: 'N-Back Test',
      description: 'Çalışma belleğini ve odaklanma gücünü test et.',
      icon: 'fas fa-brain',
      route: 'n_back'
    },
    'chess': {
      name: 'Satranç',
      description: 'Stratejik düşünme ve planlama becerilerini geliştir.',
      icon: 'fas fa-chess',
      route: 'chess'
    },
    'sudoku': {
      name: 'Sudoku',
      description: 'Her satır, sütun ve bölgede 1-9 arası rakamları yerleştir.',
      icon: 'fas fa-th',
      route: 'sudoku'
    },
    'game_2048': {
      name: '2048',
      description: 'Sayıları kaydırarak aynı değere sahip kareleri birleştir.',
      icon: 'fas fa-cubes',
      route: 'game_2048'
    },
    'wordle': {
      name: 'Wordle',
      description: '5 harfli gizli kelimeyi 6 denemede bulmaya çalış!',
      icon: 'fas fa-keyboard',
      route: 'wordle'
    },
    'three_d_rotation': {
      name: '3D Döndürme',
      description: 'Şekilleri doğru açılarla döndürerek uzamsal algı yeteneklerini geliştir.',
      icon: 'fas fa-cube',
      route: 'three_d_rotation'
    }
  };

  // "Tüm Oyunlar" sayfasındaki favori butonlarını başlat
  initFavoriteButtons();
  
  // Favorilerden kaldırma butonlarını başlat
  initRemoveButtons();
  
  // Düzenleme butonuna tıklandığında
  if (editFavoritesBtn) {
    editFavoritesBtn.addEventListener('click', function() {
      // Düzenleme modunu değiştir
      editingMode = !editingMode;
      
      // Buton metnini güncelle
      if (editingMode) {
        editFavoritesBtn.innerHTML = '<i class="fas fa-check"></i> Tamamla';
        editFavoritesBtn.classList.remove('btn-outline-primary');
        editFavoritesBtn.classList.add('btn-success');
        
        // Favori oyun kartlarına kaldırma butonu ekle
        favoriteCards.forEach(card => {
          if (!card.querySelector('.remove-favorite-btn')) {
            const gameType = card.dataset.gameType;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-favorite-btn';
            removeBtn.dataset.gameType = gameType;
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              removeFavoriteGame(gameType);
            });
            card.appendChild(removeBtn);
          }
        });
      } else {
        editFavoritesBtn.innerHTML = '<i class="fas fa-edit"></i> Düzenle';
        editFavoritesBtn.classList.remove('btn-success');
        editFavoritesBtn.classList.add('btn-outline-primary');
        
        // Kaldırma butonlarını gizle
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
          btn.style.display = 'none';
        });
      }
    });
  }
  
  // Favorilere ekle butonları için işlevsellik
  function initFavoriteButtons() {
    const addFavoriteButtons = document.querySelectorAll('.add-favorite-btn');
    addFavoriteButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavoriteStatus(btn);
      });
    });
  }
  
  // Favorilere ekle/kaldır butonu tıklanınca
  function toggleFavoriteStatus(btn) {
    const gameCard = btn.closest('.game-card');
    const gameType = gameCard.dataset.gameType;
    const isFavorite = btn.classList.contains('is-favorite');
    
    if (isFavorite) {
      // Favorilerden kaldır
      removeFavoriteGame(gameType);
      btn.classList.remove('is-favorite');
      btn.innerHTML = '<i class="far fa-heart"></i>';
    } else {
      // Favori sayısını kontrol et
      fetch('/add-favorite-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ game_type: gameType }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Favorilere ekle
          btn.classList.add('is-favorite');
          btn.innerHTML = '<i class="fas fa-heart"></i>';
          showMessage('Oyun favorilere eklendi!', 'success');
        } else {
          // Eğer limit aşılmışsa uyarı göster
          if (data.error.includes('En fazla')) {
            showFavoriteLimitWarning(btn);
          } else {
            showMessage(data.error, 'error');
          }
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showMessage('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      });
    }
  }
  
  // Favori limit uyarısı göster
  function showFavoriteLimitWarning(btn) {
    Swal.fire({
      title: 'Favori Sınırı',
      text: 'Ana sayfada en fazla 4 favori oyun gösterebilirsiniz. Başka bir oyunu kaldırmak ister misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, yönet',
      cancelButtonText: 'Hayır'
    }).then((result) => {
      if (result.isConfirmed) {
        // Kullanıcıyı ana sayfaya yönlendir
        window.location.href = '/';
      }
    });
  }
  
  // Favorilere oyun ekle
  function addFavoriteGame(gameType, gameName, gameIcon, gameRoute) {
    fetch('/add-favorite-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ game_type: gameType }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Başarılı ekleme, sayfayı yenileme veya UI güncelleme
        showMessage('Oyun favorilere eklendi!', 'success');
        
        // Ana sayfadaysak, favori oyun listesine ekle
        if (favoriteGameList) {
          const gameInfo = allGames[gameType];
          if (gameInfo) {
            // Boş mesaj varsa kaldır
            const emptyMessage = favoriteGameList.querySelector('.empty-favorites-message');
            if (emptyMessage) {
              emptyMessage.remove();
            }
            
            // Yeni kart oluştur
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.dataset.gameType = gameType;
            
            gameCard.innerHTML = `
              <div class="game-icon"><i class="${gameInfo.icon}"></i></div>
              <div class="game-info">
                <h3>${gameInfo.name}</h3>
                <p>${gameInfo.description}</p>
              </div>
              <a href="/${gameInfo.route}" class="game-btn">Oyna</a>
            `;
            
            // Eğer düzenleme modundaysak, kaldırma butonu ekle
            if (editingMode) {
              const removeBtn = document.createElement('button');
              removeBtn.className = 'remove-favorite-btn';
              removeBtn.dataset.gameType = gameType;
              removeBtn.innerHTML = '<i class="fas fa-times"></i>';
              removeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeFavoriteGame(gameType);
              });
              gameCard.appendChild(removeBtn);
            }
            
            favoriteGameList.appendChild(gameCard);
          }
        }
      } else {
        // Hata durumu
        if (data.error.includes('En fazla')) {
          showFavoriteLimitWarning();
        } else {
          showMessage(data.error, 'error');
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showMessage('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    });
  }
  
  // Favorilerden oyun kaldır
  function removeFavoriteGame(gameType) {
    fetch('/remove-favorite-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ game_type: gameType }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Başarılı kaldırma
        showMessage('Oyun favorilerden kaldırıldı.', 'success');
        
        // Ana sayfadaysak, kartı kaldır
        if (favoriteGameList) {
          const card = favoriteGameList.querySelector(`.game-card[data-game-type="${gameType}"]`);
          if (card) {
            card.classList.add('removing');
            setTimeout(() => {
              card.remove();
              
              // Eğer hiç favori kalmadıysa, boş mesajı göster
              if (favoriteGameList.querySelectorAll('.game-card').length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-favorites-message';
                emptyMessage.innerHTML = `
                  <p>Henüz favori oyunlarınız yok. Tüm oyunlar sayfasından ekleyebilirsiniz.</p>
                  <a href="/all-games" class="btn btn-primary mt-2">Oyunları Keşfet</a>
                `;
                favoriteGameList.appendChild(emptyMessage);
              }
            }, 300);
          }
        }
        
        // Tüm oyunlar sayfasındaysak, favori butonunu güncelle
        const favoriteBtn = document.querySelector(`.add-favorite-btn[data-game-type="${gameType}"]`);
        if (favoriteBtn) {
          favoriteBtn.classList.remove('is-favorite');
          favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        }
      } else {
        // Hata durumu
        showMessage(data.error, 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showMessage('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    });
  }
  
  // Mesaj gösterme fonksiyonu
  function showMessage(text, type = 'info') {
    // SweetAlert2 kullan
    const iconType = type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info');
    Swal.fire({
      title: type === 'error' ? 'Hata' : (type === 'success' ? 'Başarılı' : 'Bilgi'),
      text: text,
      icon: iconType,
      toast: true,
      position: 'top-end',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  }
  
  // Favorilerden kaldırma butonları için işlevsellik
  function initRemoveButtons() {
    document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const gameType = this.dataset.gameType;
        removeFavoriteGame(gameType);
      });
    });
  }
});
