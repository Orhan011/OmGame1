
// Oyun İsimlerini Türkçeye Çeviren Fonksiyon
function getGameDisplayName(gameType) {
    const gameNames = {
        'wordPuzzle': 'Kelime Bulmaca',
        'memoryMatch': 'Hafıza Eşleştirme',
        'labyrinth': 'Labirent',
        'puzzle': 'Puzzle',
        'numberSequence': 'Sayı Dizisi',
        'memoryCards': 'Hafıza Kartları',
        'numberChain': 'Sayı Zinciri',
        'audioMemory': 'Sesli Hafıza',
        'nBack': 'N-Back',
        'visualAttention': 'Görsel Dikkat',
        'sudoku': 'Sudoku',
        '2048': '2048',
        'chess': 'Satranç',
        'rubikCube': 'Rubik Küpü',
        'logicPuzzles': 'Mantık Bulmacaları',
        'tangram': 'Tangram'
    };
    
    return gameNames[gameType] || gameType;
}

// Oyun Türü İkonlarını Getiren Fonksiyon
function getGameIcon(gameType) {
    const gameIcons = {
        'wordPuzzle': 'fas fa-font',
        'memoryMatch': 'fas fa-th',
        'labyrinth': 'fas fa-map-signs',
        'puzzle': 'fas fa-puzzle-piece',
        'numberSequence': 'fas fa-sort-numeric-up',
        'memoryCards': 'fas fa-clone',
        'numberChain': 'fas fa-link',
        'audioMemory': 'fas fa-music',
        'nBack': 'fas fa-brain',
        'visualAttention': 'fas fa-eye',
        'sudoku': 'fas fa-table',
        '2048': 'fas fa-cubes',
        'chess': 'fas fa-chess',
        'rubikCube': 'fas fa-cube',
        'logicPuzzles': 'fas fa-cogs',
        'tangram': 'fas fa-shapes'
    };
    
    return gameIcons[gameType] || 'fas fa-gamepad';
}

// Tarihi Formatlayan Fonksiyon
function formatDate(dateString) {
    const date = new Date(dateString.replace(' ', 'T'));
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Skor Tablosunu Oluşturan Fonksiyon
function createLeaderboardTable(scores, gameType) {
    if (!scores || scores.length === 0) {
        return `
            <div class="no-scores">
                <i class="fas fa-trophy fa-2x mb-3"></i>
                <p>Henüz bu oyun için skor kaydı bulunmuyor. İlk sırada yer almak için hemen oynamaya başlayın!</p>
            </div>
        `;
    }

    // Maksimum 10 skor göster ve sıralama numarası ekle
    const topScores = scores.slice(0, 10).map((score, index) => {
        return { ...score, ranking: index + 1 };
    });

    // Tablo başlığı ve satırları oluştur
    let tableHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Sıra</th>
                    <th>Oyuncu</th>
                    <th>Puan</th>
                    <th>Tarih</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Her skor için bir satır oluştur
    topScores.forEach(score => {
        tableHTML += `
            <tr data-rank="${score.ranking}">
                <td class="rank-cell rank-${score.ranking}">${score.ranking}</td>
                <td class="user-cell">
                    <img src="/static/${score.avatar_url || 'images/default-avatar.png'}" alt="${score.username}" class="user-avatar">
                    <div class="user-info">
                        <span class="username">${score.username}</span>
                        <span class="user-rank">${score.rank}</span>
                    </div>
                </td>
                <td class="score-cell">${score.score.toLocaleString()}</td>
                <td class="date-cell">${formatDate(score.timestamp)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}

// Oyun Sekmesi Oluşturan Fonksiyon
function createGameCard(gameType, scores, isAll = false) {
    const displayName = isAll ? 'Tüm Oyunlar' : getGameDisplayName(gameType);
    const iconClass = isAll ? 'fas fa-trophy' : getGameIcon(gameType);
    
    return `
        <div class="leaderboard-card" id="${gameType}-card">
            <div class="card-header">
                <h3><i class="${iconClass}"></i> ${displayName}</h3>
                <button class="refresh-btn" data-game="${gameType}">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
            <div class="card-body">
                ${createLeaderboardTable(scores, gameType)}
            </div>
        </div>
    `;
}

// Tüm Oyunlar İçin Kartları Oluşturan Fonksiyon
function createAllGamesCards(allScores) {
    let cardsHTML = '';
    
    // Her oyun türü için bir kart oluştur
    Object.keys(allScores).forEach(gameType => {
        if (allScores[gameType].length > 0) {
            cardsHTML += createGameCard(gameType, allScores[gameType]);
        }
    });
    
    // Eğer hiç skor yoksa bilgi mesajı göster
    if (cardsHTML === '') {
        cardsHTML = `
            <div class="no-scores">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <p>Henüz hiçbir oyun için skor kaydı bulunmuyor. Oyunları oynayarak skor tablosunda yerinizi alın!</p>
            </div>
        `;
    }
    
    return cardsHTML;
}

// Skor Tablosunu Yükleyen Fonksiyon
function loadLeaderboard(gameType = 'all') {
    const container = document.getElementById('leaderboardsContainer');
    
    // Yükleniyor mesajını göster
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Skorlar yükleniyor...</p>
        </div>
    `;
    
    // API'dan skorları getir
    fetch(`/api/get-scores/${gameType}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Skorlar yüklenirken bir hata oluştu');
            }
            return response.json();
        })
        .then(data => {
            console.log('Tüm yüklenen skorlar:', data);
            
            // Tüm oyunları gösteriyorsak
            if (gameType === 'all') {
                container.innerHTML = createAllGamesCards(data);
            } 
            // Tek bir oyun gösteriyorsak
            else {
                container.innerHTML = createGameCard(gameType, data, false);
            }
            
            // Yenileme butonlarına tıklama olayı ekle
            document.querySelectorAll('.refresh-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const refreshGameType = btn.getAttribute('data-game');
                    loadLeaderboard(refreshGameType);
                });
            });
        })
        .catch(error => {
            console.error('Error loading scores:', error);
            container.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
                </div>
            `;
        });
}

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // İlk yüklemede tüm oyunları göster
    loadLeaderboard('all');
    
    // Oyun sekmesi tıklamaları
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif sekme sınıfını güncelle
            document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Seçili oyun için skor tablosunu yükle
            const gameType = tab.getAttribute('data-game');
            console.log('Skor yükleniyor:', gameType);
            loadLeaderboard(gameType);
        });
    });
});
