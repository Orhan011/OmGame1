/**
 * Homepage Customizer
 * Ana sayfa oyunları özelleştirme işlevselliği
 */

document.addEventListener('DOMContentLoaded', function() {
  // Ana sayfa özelleştirme özelliklerini başlat
  if (document.getElementById('customizeHomepageModal')) {
    initHomepageCustomization();
  }

  // Oyunları hızlıca kaldırmak için düğmelere tıklama olaylarını ekle
  document.querySelectorAll('.remove-game-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const gameType = this.getAttribute('data-game-type');
      removeGameFromHomepage(gameType);
    });
  });
});

/**
 * Ana sayfa özelleştirme özelliklerini başlat
 */
function initHomepageCustomization() {
  // Şu andaki oyunları getir
  fetchCurrentGames();
  
  // Tüm oyunları getir
  fetchAvailableGames();
  
  // Kaydet düğmesi olayı
  document.getElementById('saveHomepageChanges').addEventListener('click', saveHomepageChanges);
  
  // Modal açıldığında veriler yenilensin
  const customizeModal = document.getElementById('customizeHomepageModal');
  customizeModal.addEventListener('show.bs.modal', function() {
    fetchCurrentGames();
    fetchAvailableGames();
  });
}

/**
 * Kullanıcının mevcut ana sayfa oyunlarını getir
 */
function fetchCurrentGames() {
  fetch('/api/homepage/games')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayCurrentGames(data.games);
      } else {
        showError('Mevcut oyunlar yüklenirken bir hata oluştu.');
      }
    })
    .catch(error => {
      console.error('Oyunları getirme hatası:', error);
      showError('Oyunlar yüklenirken bir hata oluştu.');
    });
}

/**
 * Tüm mevcut oyunları getir
 */
function fetchAvailableGames() {
  // Burada öncelikle ana sayfada olmayan oyunları belirlemek için akıllı bir yaklaşım kullanacağız
  const allGames = getAllGamesFromPage();
  const currentGames = getCurrentGamesFromHomepage();
  
  // Ana sayfada olmayan oyunları filtrele
  const availableGames = allGames.filter(game => {
    return !currentGames.some(cg => cg.gameType === game.type);
  });
  
  displayAvailableGames(availableGames);
}

/**
 * HTML sayfasındaki tüm oyunları al
 */
function getAllGamesFromPage() {
  // Buradaki all_games değişkenini sayfa render edilirken Jinja ile aktarıyoruz
  // window.allGames içinde tüm oyunların detayları olmalı
  if (typeof window.allGames !== 'undefined') {
    return window.allGames;
  }
  
  // Alternatif olarak DOM'dan bilgileri alabiliriz
  const games = [];
  document.querySelectorAll('[data-game-type]').forEach(card => {
    const gameType = card.getAttribute('data-game-type');
    const gameName = card.querySelector('h3').textContent;
    const gameDescription = card.querySelector('p').textContent;
    const iconEl = card.querySelector('.game-icon i');
    const iconClass = iconEl ? iconEl.className : '';
    
    games.push({
      type: gameType,
      name: gameName,
      description: gameDescription,
      icon: iconClass
    });
  });
  
  return games;
}

/**
 * Ana sayfadaki oyunları al
 */
function getCurrentGamesFromHomepage() {
  const currentGames = [];
  document.querySelectorAll('#homepageGameGrid .game-card:not(.add-game-card)').forEach((card, index) => {
    if (card.hasAttribute('data-game-type')) {
      currentGames.push({
        gameType: card.getAttribute('data-game-type'),
        displayOrder: index + 1
      });
    }
  });
  return currentGames;
}

/**
 * Mevcut oyunları listele
 */
function displayCurrentGames(games) {
  const container = document.getElementById('currentGamesList');
  container.innerHTML = '';
  
  if (games.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">Ana sayfanızda gösterilecek herhangi bir oyun bulunmamaktadır. Aşağıdan oyun ekleyebilirsiniz.</div>';
    return;
  }
  
  const gamesList = document.createElement('div');
  gamesList.className = 'current-games-sortable';
  gamesList.setAttribute('id', 'currentGamesSortable');
  
  games.forEach(game => {
    const gameElement = createGameElement(game.game_type, true);
    if (gameElement) {
      gamesList.appendChild(gameElement);
    }
  });
  
  container.appendChild(gamesList);
  
  // Sortable.js kullanarak sürükle bırak özelliğini ekle
  if (typeof Sortable !== 'undefined') {
    new Sortable(gamesList, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: function(evt) {
        // Yeni sıralamayı güncellemek için bir kod eklenebilir
        console.log('Sıralama değişti:', evt.oldIndex, evt.newIndex);
      }
    });
  }
}

/**
 * Eklenebilecek oyunları göster
 */
function displayAvailableGames(games) {
  const container = document.getElementById('availableGamesList');
  container.innerHTML = '';
  
  if (games.length === 0) {
    container.innerHTML = '<div class="alert alert-info">Ekleyebileceğiniz tüm oyunlar zaten ana sayfanızda bulunuyor.</div>';
    return;
  }
  
  const gamesGrid = document.createElement('div');
  gamesGrid.className = 'available-games-grid';
  
  games.forEach(game => {
    const gameElement = createGameElement(game.type, false);
    if (gameElement) {
      gamesGrid.appendChild(gameElement);
    }
  });
  
  container.appendChild(gamesGrid);
}

/**
 * Oyun elementini oluştur
 */
function createGameElement(gameType, isCurrentGame) {
  // Tüm oyunları al
  const allGames = getAllGamesFromPage();
  
  // Bu oyun türüne ait oyun bilgilerini bul
  const gameInfo = allGames.find(g => g.type === gameType);
  
  if (!gameInfo) return null;
  
  const gameElement = document.createElement('div');
  gameElement.className = isCurrentGame ? 'current-game-item' : 'available-game-item';
  gameElement.setAttribute('data-game-type', gameType);
  
  // İçerik oluştur
  gameElement.innerHTML = `
    <div class="game-item-icon"><i class="${gameInfo.icon}"></i></div>
    <div class="game-item-info">
      <h6>${gameInfo.name}</h6>
      <p>${gameInfo.description}</p>
    </div>
    ${isCurrentGame ? 
      `<button type="button" class="btn btn-sm btn-icon remove-from-current" data-game-type="${gameType}">
        <i class="fas fa-times"></i>
      </button>` : 
      `<button type="button" class="btn btn-sm btn-primary add-to-homepage" data-game-type="${gameType}">
        <i class="fas fa-plus"></i> Ekle
      </button>`
    }
  `;
  
  // Olay dinleyicilerini ekle
  if (isCurrentGame) {
    const removeBtn = gameElement.querySelector('.remove-from-current');
    if (removeBtn) {
      removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const gameType = this.getAttribute('data-game-type');
        // Sadece modal içinde kaldır, henüz API'ye gönderme
        gameElement.remove();
        // Mevcut oyunlardan kaldırıldığı için kullanılabilir oyunlara ekle
        fetchAvailableGames();
      });
    }
  } else {
    const addBtn = gameElement.querySelector('.add-to-homepage');
    if (addBtn) {
      addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const gameType = this.getAttribute('data-game-type');
        // Kullanılabilir oyunlardan kaldır ve mevcut oyunlara ekle (sadece geçici olarak)
        addGameToCurrent(gameType);
        gameElement.remove();
      });
    }
  }
  
  return gameElement;
}

/**
 * Oyunu geçici olarak mevcut oyunlara ekle
 */
function addGameToCurrent(gameType) {
  const allGames = getAllGamesFromPage();
  const gameInfo = allGames.find(g => g.type === gameType);
  
  if (!gameInfo) return;
  
  // Oyunu mevcut liste yoksa oluştur
  const currentList = document.getElementById('currentGamesSortable');
  if (!currentList) {
    displayCurrentGames([{game_type: gameType, display_order: 1}]);
    return;
  }
  
  // Oyunu mevcut listeye ekle
  const gameElement = createGameElement(gameType, true);
  if (gameElement) {
    currentList.appendChild(gameElement);
    
    // Boş uyarı varsa kaldır
    const emptyAlert = document.querySelector('#currentGamesList .alert-warning');
    if (emptyAlert) {
      emptyAlert.remove();
    }
  }
}

/**
 * Ana sayfadan oyun kaldır (anında API ile)
 */
function removeGameFromHomepage(gameType) {
  if (!confirm('Bu oyunu ana sayfanızdan kaldırmak istediğinizden emin misiniz?')) {
    return;
  }
  
  fetch('/api/homepage/games/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_type: gameType
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // DOM'dan oyun kartını kaldır
      const gameCard = document.querySelector(`.game-card[data-game-type="${gameType}"]`);
      if (gameCard) {
        gameCard.remove();
      }
      showMessage('Oyun ana sayfadan kaldırıldı.');
    } else {
      showError(data.error || 'Oyun kaldırılırken bir hata oluştu.');
    }
  })
  .catch(error => {
    console.error('Oyun kaldırma hatası:', error);
    showError('Oyun kaldırılırken bir hata oluştu.');
  });
}

/**
 * Ana sayfa değişikliklerini kaydet
 */
function saveHomepageChanges() {
  // Mevcut oyunları toplam
  const currentGames = [];
  const currentGameElements = document.querySelectorAll('#currentGamesSortable .current-game-item');
  
  currentGameElements.forEach((element, index) => {
    currentGames.push({
      game_type: element.getAttribute('data-game-type'),
      display_order: index + 1
    });
  });
  
  // Önce mevcut tüm oyunları kaldır
  fetch('/api/homepage/games/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      games: currentGames
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Şimdi eksik oyunları ekle
      const promises = [];
      const existingGameTypes = getCurrentGamesFromHomepage().map(g => g.gameType);
      
      currentGames.forEach(game => {
        if (!existingGameTypes.includes(game.game_type)) {
          promises.push(
            fetch('/api/homepage/games/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                game_type: game.game_type
              })
            })
          );
        }
      });
      
      Promise.all(promises)
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(() => {
          // Tamamlandığında modalı kapat ve sayfayı yenile
          const modal = bootstrap.Modal.getInstance(document.getElementById('customizeHomepageModal'));
          if (modal) {
            modal.hide();
          }
          
          showMessage('Ana sayfa oyunları başarıyla güncellendi.');
          
          // Kısa bir gecikme ile sayfayı yenile
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
    } else {
      showError(data.error || 'Değişiklikler kaydedilirken bir hata oluştu.');
    }
  })
  .catch(error => {
    console.error('Kaydetme hatası:', error);
    showError('Değişiklikler kaydedilirken bir hata oluştu.');
  });
}

/**
 * Başarı mesajı göster
 */
function showMessage(message) {
  // Toast gösterme kodu
  if (typeof Toastify === 'function') {
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
    }).showToast();
  } else {
    alert(message);
  }
}

/**
 * Hata mesajı göster
 */
function showError(message) {
  // Toast gösterme kodu
  if (typeof Toastify === 'function') {
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }).showToast();
  } else {
    alert(message);
  }
}