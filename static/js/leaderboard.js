
// Oyun adları için görüntüleme metinleri
const gameDisplayNames = {
    'wordPuzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Eşleştirme',
    'labyrinth': 'Labirent',
    'puzzle': 'Puzzle',
    'visualAttention': 'Görsel Dikkat',
    'numberSequence': 'Sayı Dizisi',
    'memoryCards': 'Hafıza Kartları',
    'numberChain': 'Sayı Zinciri',
    'audioMemory': 'Sesli Hafıza',
    'nBack': 'N-Back',
    'sudoku': 'Sudoku',
    '2048': '2048',
    'chess': 'Satranç',
    'logicPuzzles': 'Mantık Bulmacaları',
    'tangram': 'Tangram',
    'rubikCube': 'Rubik Küpü',
    'all': 'Tüm Oyunlar'
};

// Oyun ikonları
const gameIcons = {
    'wordPuzzle': 'fas fa-font',
    'memoryMatch': 'fas fa-th',
    'labyrinth': 'fas fa-map-signs',
    'puzzle': 'fas fa-puzzle-piece',
    'visualAttention': 'fas fa-eye',
    'numberSequence': 'fas fa-sort-numeric-up',
    'memoryCards': 'fas fa-clone',
    'numberChain': 'fas fa-link',
    'audioMemory': 'fas fa-music',
    'nBack': 'fas fa-brain',
    'sudoku': 'fas fa-table',
    '2048': 'fas fa-cubes',
    'chess': 'fas fa-chess',
    'logicPuzzles': 'fas fa-lightbulb',
    'tangram': 'fas fa-shapes',
    'rubikCube': 'fas fa-cube',
    'all': 'fas fa-trophy'
};

// Oyun adlarını dönüştürmek için yardımcı fonksiyonlar
function getGameDisplayName(gameType) {
    return gameDisplayNames[gameType] || gameType;
}

function getGameIcon(gameType) {
    return gameIcons[gameType] || 'fas fa-gamepad';
}

// API yol dönüştürücüsü
function getApiGameType(tabGameType) {
    const apiTypeMap = {
        'wordPuzzle': 'word-puzzle',
        'memoryMatch': 'memory-match',
        'labyrinth': 'labyrinth',
        'puzzle': 'puzzle',
        'visualAttention': 'visual-attention',
        'numberSequence': 'number-sequence',
        'memoryCards': 'memory-cards',
        'numberChain': 'number-chain',
        'audioMemory': 'audio-memory',
        'nBack': 'n-back',
        'sudoku': 'sudoku',
        '2048': '2048',
        'chess': 'chess',
        'logicPuzzles': 'logic-puzzles',
        'tangram': 'tangram',
        'rubikCube': 'rubik-cube'
    };
    
    return apiTypeMap[tabGameType] || tabGameType;
}

// API'den oyun türüne göre skorları getiren fonksiyon
async function getScores(gameType) {
    try {
        console.log("Skor yükleniyor:", gameType);
        
        let apiURL;
        if (gameType === 'all') {
            apiURL = '/api/get-scores/all';
        } else {
            apiURL = `/api/get-scores/${gameType}`;
        }
        
        const response = await fetch(apiURL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (gameType === 'all') {
            console.log("Tüm yüklenen skorlar:", data);
        }
        
        return data;
    } catch (error) {
        console.log("Error loading scores:", error);
        return gameType === 'all' ? {} : [];
    }
}

// Skor tablosu oluşturan fonksiyon
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

    // Her skor için bir satır ekle
    topScores.forEach(score => {
        const isTopRank = score.ranking <= 3;
        const rankClass = isTopRank ? 'top-rank' : '';
        
        const dateObj = new Date(score.timestamp);
        const formattedDate = `${dateObj.toLocaleDateString('tr-TR')} ${dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        
        tableHTML += `
            <tr class="${rankClass}">
                <td class="rank-cell">${score.ranking}</td>
                <td class="username-cell">${score.username || 'Anonim'}</td>
                <td class="score-cell">${score.score.toLocaleString('tr-TR')}</td>
                <td class="date-cell">${formattedDate}</td>
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
        if (allScores[gameType] && allScores[gameType].length > 0) {
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

// Aktif Sekmeyi Değiştiren Fonksiyon
function changeActiveTab(gameType) {
    // Tüm sekmelerin 'active' sınıfını kaldır
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Seçilen sekmeye 'active' sınıfını ekle
    const selectedTab = document.querySelector(`.game-tab[data-game="${gameType}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Tüm kart bileşenlerini gizle
    document.querySelectorAll('.leaderboard-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Seçilen oyunun kart bileşenini göster
    const selectedCard = document.getElementById(`${gameType}-card`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
}

// Sayfa Yüklendiğinde Çalışan Ana Fonksiyon
document.addEventListener('DOMContentLoaded', async function() {
    const leaderboardsContainer = document.getElementById('leaderboardsContainer');
    
    // Yükleme göstergesini göster
    leaderboardsContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Skorlar yükleniyor...</p>
        </div>
    `;
    
    try {
        // Önce tüm oyunlar için skorları getir
        const allScores = await getScores('all');
        
        // Tüm oyunlar için kartları oluştur
        let containerHTML = '';
        
        // Önce 'Tüm Oyunlar' kartını oluştur
        containerHTML += `
            <div class="leaderboard-card active" id="all-card">
                <div class="card-header">
                    <h3><i class="fas fa-trophy"></i> Tüm Oyunlar</h3>
                    <button class="refresh-btn" data-game="all">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="card-body">
                    ${createAllGamesCards(allScores)}
                </div>
            </div>
        `;
        
        // Diğer oyun türleri için kartları oluştur
        const gameTypes = [
            'wordPuzzle', 'memoryMatch', 'labyrinth', 'puzzle', 'numberSequence',
            'memoryCards', 'numberChain', 'audioMemory', 'nBack', 'sudoku'
        ];
        
        for (const gameType of gameTypes) {
            const apiGameType = getApiGameType(gameType);
            let scores;
            
            if (allScores[gameType]) {
                // Eğer tüm skorlar içinde bu oyun türü varsa, doğrudan kullan
                scores = allScores[gameType];
            } else {
                // Yoksa API'den ayrıca çek
                scores = await getScores(apiGameType);
            }
            
            containerHTML += createGameCard(gameType, scores);
        }
        
        // İçeriği DOM'a ekle
        leaderboardsContainer.innerHTML = containerHTML;
        
        // Tab değiştirme işlevini ekle
        document.querySelectorAll('.game-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                changeActiveTab(gameType);
            });
        });
        
        // Yenileme butonlarına işlev ekle
        document.querySelectorAll('.refresh-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const gameType = this.getAttribute('data-game');
                const cardBody = this.closest('.leaderboard-card').querySelector('.card-body');
                
                // Yenileme efekti
                this.querySelector('i').classList.add('fa-spin');
                cardBody.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Skorlar yenileniyor...</p>
                    </div>
                `;
                
                try {
                    if (gameType === 'all') {
                        const allScores = await getScores('all');
                        cardBody.innerHTML = createAllGamesCards(allScores);
                    } else {
                        const apiGameType = getApiGameType(gameType);
                        const scores = await getScores(apiGameType);
                        cardBody.innerHTML = createLeaderboardTable(scores, gameType);
                    }
                } catch (error) {
                    cardBody.innerHTML = `
                        <div class="error">
                            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                            <p>Skorlar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
                        </div>
                    `;
                    console.error('Error refreshing scores:', error);
                }
                
                // Yenileme efektini kaldır
                this.querySelector('i').classList.remove('fa-spin');
            });
        });
        
    } catch (error) {
        leaderboardsContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p>Skorlar yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
                <p class="mt-2 text-muted small">Hata detayı: ${error.message}</p>
            </div>
        `;
        console.error('Error initializing leaderboard:', error);
    }
});
