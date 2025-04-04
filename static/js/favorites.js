/**
 * ZekaPark - Favori Oyunlar Yönetimi
 * Kullanıcıların en sevdikleri oyunları favorilere ekleyip kaldırabilecekleri sistem
 */

document.addEventListener('DOMContentLoaded', function() {
    // Favori toggle butonlarını ekle
    addFavoriteButtons();
    
    // Favori oyunları göster
    loadUserFavorites();
    
    // Favori butonları için event listener ekle
    setupFavoriteToggleHandlers();
});

/**
 * Oyun kartlarına favori butonları ekler
 */
function addFavoriteButtons() {
    // Tüm oyun kartlarını seç
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        // Kart içindeki başlık ve açıklama bilgilerini al
        const titleElement = card.querySelector('h3');
        const descElement = card.querySelector('p');
        const iconElement = card.querySelector('.game-icon i');
        
        if (!titleElement || !descElement || !iconElement) return;
        
        // Oyun bilgilerini al
        const gameTitle = titleElement.textContent.trim();
        const gameDesc = descElement.textContent.trim();
        const iconClasses = iconElement.className.split(' ');
        const faIconClass = iconClasses.find(cls => cls.startsWith('fa-'));
        
        // Oyun türünü belirle
        const gameTypeMap = {
            'Kelime Bulmaca': 'wordPuzzle',
            'Hafıza Kartları': 'memoryMatch',
            'Labirent': 'labyrinth',
            'Yapboz': 'puzzle',
            'Sayı Dizisi': 'numberSequence',
            'Sayı Zinciri': 'numberChain',
            'Sesli Hafıza': 'audioMemory',
            'N-Back Test': 'nBack',
            'Satranç': 'chess',
            'Sudoku': 'sudoku',
            '3D Döndürme': 'threeDRotation'
        };
        
        const gameType = gameTypeMap[gameTitle] || 'unknown';
        
        // Favori toggle butonu oluştur
        if (!card.querySelector('.favorite-toggle')) {
            const favoriteToggle = document.createElement('div');
            favoriteToggle.className = 'favorite-toggle';
            favoriteToggle.setAttribute('data-game-type', gameType);
            favoriteToggle.setAttribute('data-game-name', gameTitle);
            favoriteToggle.setAttribute('data-game-icon', faIconClass || 'fa-gamepad');
            favoriteToggle.setAttribute('data-game-desc', gameDesc);
            
            const icon = document.createElement('i');
            icon.className = 'far fa-star'; // Boş yıldız ikonu
            
            favoriteToggle.appendChild(icon);
            card.appendChild(favoriteToggle);
        }
    });
}

/**
 * Favori butonlarına tıklama olaylarını ekler
 */
function setupFavoriteToggleHandlers() {
    // Delegasyon yaklaşımıyla tüm tıklamaları yakalayıp sadece favori butonlarını işle
    document.addEventListener('click', function(e) {
        const toggle = e.target.closest('.favorite-toggle');
        if (!toggle) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const gameType = toggle.getAttribute('data-game-type');
        const gameName = toggle.getAttribute('data-game-name');
        const gameIcon = toggle.getAttribute('data-game-icon');
        const gameDesc = toggle.getAttribute('data-game-desc');
        
        const icon = toggle.querySelector('i');
        const isFavorite = icon.classList.contains('fas'); // fas = dolu yıldız
        
        // Kullanıcının giriş yapıp yapmadığını kontrol et
        fetch('/get_current_user')
            .then(response => response.json())
            .then(data => {
                if (!data.user_id) {
                    // Giriş yapmamış kullanıcı için
                    Swal.fire({
                        title: 'Giriş Yapın',
                        text: 'Oyunları favorilere eklemek için giriş yapmanız gerekiyor.',
                        icon: 'info',
                        confirmButtonText: 'Giriş Yap',
                        showCancelButton: true,
                        cancelButtonText: 'İptal'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/login';
                        }
                    });
                    return;
                }
                
                if (isFavorite) {
                    // Favorilerden çıkar
                    removeFavorite(gameType, toggle);
                } else {
                    // Favorilere ekle, önce favori sayısını kontrol et
                    checkFavoriteLimit().then(canAdd => {
                        if (canAdd) {
                            addFavorite(gameType, gameName, gameIcon, gameDesc, toggle);
                        } else {
                            Swal.fire({
                                title: 'Favori Limiti',
                                text: 'En fazla 4 oyunu favorilere ekleyebilirsiniz. Başka bir oyunu çıkarıp tekrar deneyin.',
                                icon: 'warning',
                                confirmButtonText: 'Tamam'
                            });
                        }
                    });
                }
            });
    });
}

/**
 * Favorilere yeni bir oyun ekler
 */
function addFavorite(gameType, gameName, gameIcon, gameDesc, toggleElement) {
    fetch('/add_favorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game_type: gameType,
            game_name: gameName,
            game_icon: gameIcon,
            game_description: gameDesc
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Görsel geri bildirim
            const icon = toggleElement.querySelector('i');
            icon.className = 'fas fa-star'; // Dolu yıldız ikonu
            
            // Bildirim göster
            Swal.fire({
                title: 'Favorilere Eklendi',
                text: `${gameName} oyunu favorilerinize eklendi.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Favori listeyi güncelle
            loadUserFavorites();
        } else {
            Swal.fire({
                title: 'Hata',
                text: data.message || 'Bir hata oluştu',
                icon: 'error',
                confirmButtonText: 'Tamam'
            });
        }
    })
    .catch(error => {
        console.error('Favori ekleme hatası:', error);
    });
}

/**
 * Favorilerden bir oyunu çıkarır
 */
function removeFavorite(gameType, toggleElement) {
    fetch('/remove_favorite', {
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
            // Görsel geri bildirim
            const icon = toggleElement.querySelector('i');
            icon.className = 'far fa-star'; // Boş yıldız ikonu
            
            // Bildirim göster
            Swal.fire({
                title: 'Favorilerden Çıkarıldı',
                icon: 'info',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Favori listeyi güncelle
            loadUserFavorites();
        } else {
            Swal.fire({
                title: 'Hata',
                text: data.message || 'Bir hata oluştu',
                icon: 'error',
                confirmButtonText: 'Tamam'
            });
        }
    })
    .catch(error => {
        console.error('Favori silme hatası:', error);
    });
}

/**
 * Kullanıcının favori oyunlarını yükler ve gösterir
 */
function loadUserFavorites() {
    fetch('/get_favorites')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateFavoritesDisplay(data.favorites);
                updateFavoriteButtons(data.favorites);
            }
        })
        .catch(error => {
            console.error('Favorileri yükleme hatası:', error);
        });
}

/**
 * Favori oyunları ekranda gösterir
 */
function updateFavoritesDisplay(favorites) {
    const favoritesGrid = document.getElementById('favoritesGrid');
    if (!favoritesGrid) return;
    
    // Favori grid'i temizle
    favoritesGrid.innerHTML = '';
    
    if (favorites.length === 0) {
        const noFavoritesMessage = document.createElement('div');
        noFavoritesMessage.className = 'text-center w-100 py-4';
        noFavoritesMessage.innerHTML = '<p class="text-muted">Henüz favori oyun eklemediniz.</p>';
        favoritesGrid.appendChild(noFavoritesMessage);
        return;
    }
    
    // Her favori için kart oluştur
    favorites.forEach(fav => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        // Oyun türüne göre URL belirle
        const gameUrl = getGameUrl(fav.game_type);
        
        gameCard.innerHTML = `
            <div class="game-icon"><i class="fas ${fav.game_icon}"></i></div>
            <div class="game-info">
                <h3>${fav.game_name}</h3>
                <p>${fav.game_description}</p>
            </div>
            <a href="${gameUrl}" class="game-btn">Oyna</a>
            <div class="favorite-toggle" data-game-type="${fav.game_type}" data-game-name="${fav.game_name}" 
                 data-game-icon="${fav.game_icon}" data-game-desc="${fav.game_description}">
                <i class="fas fa-star"></i>
            </div>
        `;
        
        favoritesGrid.appendChild(gameCard);
    });
}

/**
 * Oyun türüne göre URL döndürür
 */
function getGameUrl(gameType) {
    const urlMap = {
        'wordPuzzle': '/games/word-puzzle',
        'memoryMatch': '/games/memory-match',
        'labyrinth': '/games/labyrinth',
        'puzzle': '/games/puzzle',
        'numberSequence': '/games/number-sequence',
        'numberChain': '/games/number-chain',
        'audioMemory': '/games/audio-memory',
        'nBack': '/games/n-back',
        'chess': '/games/chess',
        'sudoku': '/games/sudoku',
        'threeDRotation': '/games/3d-rotation'
    };
    
    return urlMap[gameType] || '/';
}

/**
 * Oyun kartlarındaki favori butonlarını günceller
 */
function updateFavoriteButtons(favorites) {
    // Mevcut tüm favori butonları boş yıldız yap
    document.querySelectorAll('.favorite-toggle i').forEach(icon => {
        icon.className = 'far fa-star';
    });
    
    // Favori olan oyunların butonlarını dolu yıldız yap
    favorites.forEach(fav => {
        const buttons = document.querySelectorAll(`.favorite-toggle[data-game-type="${fav.game_type}"]`);
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fas fa-star';
        });
    });
}

/**
 * Kullanıcının daha fazla favori ekleyip ekleyemeyeceğini kontrol eder
 * @returns {Promise<boolean>} - Yeni favori eklenebilirse true, aksi halde false
 */
function checkFavoriteLimit() {
    return fetch('/get_favorites')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.favorites.length < 4; // Maksimum 4 favori
            }
            return true; // Hata durumunda eklemeye izin ver
        })
        .catch(error => {
            console.error('Favori limiti kontrol hatası:', error);
            return true; // Hata durumunda eklemeye izin ver
        });
}
