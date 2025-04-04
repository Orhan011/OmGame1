/**
 * OmGame - Ana Sayfa Oyun Kartları Yöneticisi
 * Ana sayfa için en fazla 4 adet oyun kartı eklenip çıkarılabilir
 */

// Sabit değişkenler
const MAX_PINNED_GAMES = 4;

// Ana sayfa oyun kartları yönetim sınıfı
class GamesManager {
    constructor() {
        this.initialize();
    }
    
    // İlk yükleme
    initialize() {
        // DOM elementleri
        this.pinnedGamesContainer = document.getElementById('pinnedGamesContainer');
        this.allGamesContainer = document.getElementById('allGamesContainer');
        
        // Varsayılan oyun listesi
        this.defaultGames = [
            {
                id: 'word-puzzle',
                name: 'Kelime Bulmaca',
                icon: 'fas fa-spell-check',
                url: '/games/word-puzzle',
                color: 'primary',
                description: 'Kelimelerle hafızanızı geliştirin'
            },
            {
                id: 'memory-match',
                name: 'Hafıza Kartları',
                icon: 'fas fa-clone',
                url: '/memory-match',
                color: 'info',
                description: 'Hafıza gücünüzü test edin'
            },
            {
                id: 'labyrinth',
                name: 'Labirent',
                icon: 'fas fa-route',
                url: '/labyrinth',
                color: 'success',
                description: 'Yol bulma yeteneğinizi geliştirin'
            },
            {
                id: 'puzzle',
                name: 'Yapboz',
                icon: 'fas fa-puzzle-piece',
                url: '/puzzle',
                color: 'danger',
                description: 'Parçaları birleştirin'
            },
            {
                id: 'number-sequence',
                name: 'Sayı Dizisi',
                icon: 'fas fa-sort-numeric-up',
                url: '/number-sequence',
                color: 'warning',
                description: 'Sayı ve desen tanıma'
            },
            {
                id: 'memory-cards',
                name: 'Hafıza Kartları',
                icon: 'fas fa-th',
                url: '/memory-cards',
                color: 'purple',
                description: 'Eşleştirme yeteneğinizi test edin'
            },
            {
                id: 'number-chain',
                name: 'Sayı Zinciri',
                icon: 'fas fa-link',
                url: '/number-chain',
                color: 'orange',
                description: 'Sayı zincirlerini tamamlayın'
            },
            {
                id: 'audio-memory',
                name: 'Sesli Hafıza',
                icon: 'fas fa-music',
                url: '/audio-memory',
                color: 'teal',
                description: 'İşitsel hafızanızı geliştirin'
            }
        ];
        
        // Kullanıcının sabitlenmiş oyunlarını al
        this.loadPinnedGames();
        
        // Butonların işlevlerini ayarla
        document.addEventListener('click', (e) => {
            // Oyun ekle butonları
            if (e.target.closest('.pin-game-btn')) {
                const btn = e.target.closest('.pin-game-btn');
                const gameId = btn.getAttribute('data-game-id');
                this.pinGame(gameId);
            }
            
            // Oyun çıkar butonları
            if (e.target.closest('.unpin-game-btn')) {
                const btn = e.target.closest('.unpin-game-btn');
                const gameId = btn.getAttribute('data-game-id');
                this.unpinGame(gameId);
            }
        });
    }
    
    // Kullanıcının sabitlenmiş oyunlarını yükle
    loadPinnedGames() {
        fetch('/api/pinned-games')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.pinnedGames = data.games || [];
                    this.renderPinnedGames();
                    this.renderAllGames();
                } else {
                    console.error('Oyun listesi alınamadı:', data.message);
                }
            })
            .catch(error => {
                console.error('Oyun listesi yüklenirken hata:', error);
                this.pinnedGames = [];
                this.renderPinnedGames();
                this.renderAllGames();
            });
    }
    
    // Ana sayfada sabitlenmiş oyunları göster
    renderPinnedGames() {
        if (!this.pinnedGamesContainer) return;
        
        // Konteyner temizlenir
        this.pinnedGamesContainer.innerHTML = '';
        
        // Sabitlenmiş oyun yoksa mesaj göster
        if (!this.pinnedGames || this.pinnedGames.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12 text-center py-4';
            emptyMessage.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gamepad fa-3x mb-3 text-muted"></i>
                    <h5>Henüz oyun eklemediniz</h5>
                    <p class="text-muted">Aşağıdaki "Tüm Oyunlar" bölümünden ana sayfanıza oyun ekleyebilirsiniz.</p>
                </div>
            `;
            this.pinnedGamesContainer.appendChild(emptyMessage);
            return;
        }
        
        // Her oyun için kart oluştur
        this.pinnedGames.forEach(gameId => {
            const game = this.findGameById(gameId);
            if (!game) return;
            
            const gameCard = this.createGameCard(game, true);
            this.pinnedGamesContainer.appendChild(gameCard);
        });
    }
    
    // Tüm oyunları listele
    renderAllGames() {
        if (!this.allGamesContainer) return;
        
        // Konteyner temizlenir
        this.allGamesContainer.innerHTML = '';
        
        // Her oyun için kart oluştur
        this.defaultGames.forEach(game => {
            // Oyun zaten sabitlenmişse gösterme
            if (this.pinnedGames && this.pinnedGames.includes(game.id)) return;
            
            const gameCard = this.createGameCard(game, false);
            this.allGamesContainer.appendChild(gameCard);
        });
    }
    
    // Oyun kartı oluştur
    createGameCard(game, isPinned) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-3 mb-4';
        
        const buttonText = isPinned ? 
            '<i class="fas fa-thumbtack fa-rotate-270"></i> Kaldır' : 
            '<i class="fas fa-thumbtack"></i> Ekle';
        
        const buttonClass = isPinned ? 
            `unpin-game-btn btn-sm btn-outline-danger` : 
            `pin-game-btn btn-sm btn-outline-success`;
        
        const buttonDisabled = (!isPinned && this.pinnedGames && this.pinnedGames.length >= MAX_PINNED_GAMES) ? 
            'disabled' : '';
        
        col.innerHTML = `
            <div class="card game-card h-100">
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="${game.icon} me-2 text-${game.color}"></i>
                        ${game.name}
                    </h5>
                    <p class="card-text">${game.description}</p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                    <a href="${game.url}" class="btn btn-primary btn-sm">Oyna</a>
                    <button class="${buttonClass}" data-game-id="${game.id}" ${buttonDisabled}>
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
        
        return col;
    }
    
    // ID'ye göre oyun bulma
    findGameById(gameId) {
        return this.defaultGames.find(game => game.id === gameId);
    }
    
    // Oyun sabitle
    pinGame(gameId) {
        if (this.pinnedGames && this.pinnedGames.length >= MAX_PINNED_GAMES) {
            Swal.fire({
                title: 'Limit Aşıldı!',
                text: `En fazla ${MAX_PINNED_GAMES} oyun ekleyebilirsiniz. Önce bir oyunu kaldırın.`,
                icon: 'warning',
                confirmButtonText: 'Tamam'
            });
            return;
        }
        
        fetch('/api/pin-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId: gameId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.pinnedGames = data.games;
                this.renderPinnedGames();
                this.renderAllGames();
                
                Swal.fire({
                    title: 'Oyun Eklendi!',
                    text: 'Oyun ana sayfanıza eklendi.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    title: 'Hata!',
                    text: data.message || 'Oyun eklenirken bir hata oluştu.',
                    icon: 'error',
                    confirmButtonText: 'Tamam'
                });
            }
        })
        .catch(error => {
            console.error('Oyun eklenirken hata:', error);
            Swal.fire({
                title: 'Hata!',
                text: 'Oyun eklenirken bir hata oluştu.',
                icon: 'error',
                confirmButtonText: 'Tamam'
            });
        });
    }
    
    // Oyun kaldır
    unpinGame(gameId) {
        fetch('/api/unpin-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId: gameId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.pinnedGames = data.games;
                this.renderPinnedGames();
                this.renderAllGames();
                
                Swal.fire({
                    title: 'Oyun Kaldırıldı!',
                    text: 'Oyun ana sayfanızdan kaldırıldı.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    title: 'Hata!',
                    text: data.message || 'Oyun kaldırılırken bir hata oluştu.',
                    icon: 'error',
                    confirmButtonText: 'Tamam'
                });
            }
        })
        .catch(error => {
            console.error('Oyun kaldırılırken hata:', error);
            Swal.fire({
                title: 'Hata!',
                text: 'Oyun kaldırılırken bir hata oluştu.',
                icon: 'error',
                confirmButtonText: 'Tamam'
            });
        });
    }
}

// Sayfa yüklendiğinde oyun yöneticisini başlat
document.addEventListener('DOMContentLoaded', function() {
    const gamesManager = new GamesManager();
    window.gamesManager = gamesManager; // Global erişim için
});
