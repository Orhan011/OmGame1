/**
 * Yeni puan sistemine göre oyun sonunda gösterilecek sonuçları oluşturur
 * @param {object} scoreData - API'den dönen puan verileri
 * @return {string} HTML içeriği
 */
function createScoreDisplay(scoreData) {
    // Rastgele puan gösterimini kaldırdık, sadece seviye yükseltme durumunda bildirim göster
    if (!scoreData || !scoreData.success) {
        if (scoreData && scoreData.guest) {
            // Misafir kullanıcı için giriş mesajı
            return `
                <div class="score-result guest-result">
                    <div class="guest-message">
                        <i class="fas fa-user-lock"></i>
                        <h3>Misafir Kullanıcı</h3>
                        <p>${scoreData.message || "Skorunuz kaydedilmedi! Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın."}</p>
                        <div class="guest-actions">
                            <a href="/login" class="btn btn-primary">Giriş Yap</a>
                            <a href="/register" class="btn btn-outline-primary">Üye Ol</a>
                        </div>
                    </div>
                </div>
            `;
        }
        return ''; // Hata durumunda boş döndür
    }

    // Skor verilerini al
    const xp = scoreData.xp || {};
    
    // Sadece seviye yükseltme durumunda bildirim göster, diğer durumlarda hiçbir şey gösterme
    if (xp.level_up) {
        return `
            <div class="score-result level-up-only">
                <div class="level-up-notice">
                    <i class="fas fa-award"></i>
                    <span>Seviye Atladınız! Yeni Seviyeniz: ${xp.level}</span>
                </div>
            </div>
        `;
    }
    
    // Seviye yükseltme yoksa hiçbir şey gösterme
    return '';
}

/**
 * Oyun adını formatlar
 * @param {string} gameType - Oyun tipi
 * @return {string} Formatlanmış oyun adı
 */
function formatGameName(gameType) {
    const gameNames = {
        'wordPuzzle': 'Kelime Bulmaca',
        'memoryMatch': 'Hafıza Eşleştirme',
        'numberSequence': 'Sayı Dizisi',
        'memoryCards': 'Hafıza Kartları',
        'numberChain': 'Sayı Zinciri',
        'labyrinth': '3D Labirent',
        'puzzle': 'Bulmaca',
        'audioMemory': 'Sesli Hafıza',
        'nBack': 'N-Back',
        '2048': '2048',
        'wordle': 'Wordle',
        'chess': 'Satranç',
        'snake_game': 'Yılan Oyunu',
        'puzzle_slider': 'Resim Bulmaca',
        'minesweeper': 'Mayın Tarlası',
        'hangman': 'Adam Asmaca'
    };
    
    return gameNames[gameType] || gameType;
}

/**
 * Zorluk seviyesini formatlar
 * @param {string} difficulty - Zorluk seviyesi 
 * @return {string} Formatlanmış zorluk seviyesi
 */
function formatDifficulty(difficulty) {
    const difficultyNames = {
        'easy': 'Kolay',
        'medium': 'Orta',
        'hard': 'Zor'
    };
    
    return difficultyNames[difficulty] || difficulty;
}

/**
 * Sayıyı formatlar
 * @param {number} num - Formatlanacak sayı
 * @return {string} Formatlanmış sayı
 */
function formatNumber(num) {
    return new Intl.NumberFormat('tr-TR').format(num);
}

/**
 * Puanları API'ye kaydeder
 * @param {string} gameType - Oyun tipi 
 * @param {number} score - Oyun skoru
 * @param {number} playtime - Oyun süresi (saniye)
 * @param {string} difficulty - Zorluk seviyesi
 * @param {object} gameStats - Oyunla ilgili istatistikler
 * @param {function} callback - Sonuç HTML'i ile çağrılacak fonksiyon
 *                            - İlk parametre oluşturulan HTML, ikinci parametre API yanıtı, 
 *                            - üçüncü parametre ise opsiyonel bir onay callback'i
 */
function saveScoreAndDisplay(gameType, score, playtime, difficulty = 'medium', gameStats = {}, callback) {
    // Giriş yapılmış mı kontrol et
    fetch('/api/get-current-user')
    .then(response => response.json())
    .then(userData => {
        // Skor verilerini hazırla
        const scoreData = {
            game_type: gameType,
            score: score,
            playtime: playtime,
            difficulty: difficulty,
            game_stats: gameStats
        };

        // Skor verisinde sorun olup olmadığını kontrol et
        if (!gameType || score === undefined || score === null) {
            console.error('Invalid score data:', scoreData);
            
            if (typeof callback === 'function') {
                callback(''); // Boş içerik döndür
            }
            return;
        }

        console.log(`Saving score for ${gameType}: ${score} points, difficulty: ${difficulty}`);

        // Skoru API'ye gönder
        fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Score saved:', data);
            
            // Kullanıcı giriş yapmamışsa ve API başarılı olduysa ziyaretçi olarak işlem yap
            if ((!userData.loggedIn || !userData.id) && data.success) {
                data.guest = true;
            }
            
            // Seviye yükseltme kontrolü
            if (data.xp && data.xp.level_up) {
                console.log(`Seviye yükseltme! Eski seviye: ${data.xp.old_level}, Yeni seviye: ${data.xp.level}`);
                
                // Seviye yükseltme olduğunda oyun sayfasından çıkarken anasayfaya seviye parametreleriyle yönlendir
                if (data.redirect_params) {
                    // Mevcut sayfayı kaydet
                    const currentPage = window.location.pathname;
                    
                    // Ana sayfa olmadığımızdan emin olalım
                    if (currentPage !== '/' && currentPage !== '/index') {
                        // Oyun bitimini işle
                        const scoreHtml = createScoreDisplay(data);
                        if (typeof callback === 'function') {
                            callback(scoreHtml, data, () => {
                                // Callback tamamlandıktan sonra anasayfaya yönlendir (seviye bilgisiyle)
                                window.location.href = `/?levelUp=true&newLevel=${data.xp.level}`;
                            });
                        } else {
                            // Anasayfaya yönlendir (seviye bilgisiyle)
                            window.location.href = `/?levelUp=true&newLevel=${data.xp.level}`;
                        }
                        return; // Yönlendirme başladı, işlemi sonlandır
                    }
                }
            }
            
            // Normal durum (seviye yükseltme yoksa)
            const scoreHtml = createScoreDisplay(data);
            if (typeof callback === 'function') {
                callback(scoreHtml, data);
            }
        })
        .catch(error => {
            console.error('Error saving score:', error);
            
            if (typeof callback === 'function') {
                callback(''); // Boş içerik döndür
            }
        });
    })
    .catch(error => {
        console.error('Error checking user status:', error);
        
        if (typeof callback === 'function') {
            callback(''); // Boş içerik döndür
        }
    });
}