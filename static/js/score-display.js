/**
 * Standartlaştırılmış puan sistemine göre oyun sonunda gösterilecek sonuçları oluşturur
 * @param {object} scoreData - API'den dönen puan verileri
 * @return {string} HTML içeriği
 */
function createScoreDisplay(scoreData) {
    // Misafir kullanıcı için özel mesaj
    if (!scoreData || !scoreData.success) {
        if (scoreData && scoreData.guest) {
            // Misafir kullanıcı için zorluk bilgisi
            const scoreInfo = scoreData.score_info || {};
            const gameType = scoreInfo.game_type || '';
            const gameName = formatGameName(gameType);
            const totalScore = scoreInfo.total_score || (scoreData.points ? scoreData.points.total : 0);
            const difficulty = scoreInfo.difficulty || 'medium';
            const difficultyText = formatDifficulty(difficulty);
            const difficultyClass = difficulty.toLowerCase();

            // Kullanıcıya ayrıntılı puan bilgisi göster
            let scoreBreakdownHTML = '';

            // Ödül detaylarından puan dökümü oluştur
            if (scoreData.points && scoreData.points.rewards) {
                const rewards = scoreData.points.rewards;

                scoreBreakdownHTML = `
                    <div class="score-breakdown">
                        <h4 class="breakdown-title">Puan Detayları</h4>
                        <div class="score-detail">
                            <span class="detail-label">Temel Puan:</span>
                            <span class="detail-value">+${rewards.base_points}</span>
                        </div>
                        <div class="score-detail">
                            <span class="detail-label">Skor Puanı:</span>
                            <span class="detail-value">+${rewards.score_points}</span>
                        </div>
                        ${rewards.daily_bonus > 0 ? `
                        <div class="score-detail">
                            <span class="detail-label">Günlük Bonus:</span>
                            <span class="detail-value">+${rewards.daily_bonus}</span>
                        </div>
                        ` : ''}
                        ${rewards.streak_bonus > 0 ? `
                        <div class="score-detail">
                            <span class="detail-label">Seri Bonusu:</span>
                            <span class="detail-value">+${rewards.streak_bonus}</span>
                        </div>
                        ` : ''}
                        <div class="score-detail multiplier">
                            <span class="detail-label">Zorluk Çarpanı:</span>
                            <span class="detail-value">×${rewards.difficulty_multiplier.toFixed(1)}</span>
                        </div>
                        <div class="score-detail total">
                            <span class="detail-label">Toplam Puan:</span>
                            <span class="detail-value">${totalScore}</span>
                        </div>
                    </div>
                `;
            }

            // Misafir kullanıcı için giriş mesajı (zorluk bilgisiyle ve puan detaylarıyla)
            return `
                <div class="score-result guest-result">
                    <div class="guest-message">
                        <i class="fas fa-user-lock"></i>
                        <h3>Misafir Kullanıcı</h3>
                        <div class="score-summary">
                            <div class="game-info">
                                <span class="game-name">${gameName}</span>
                                <span class="difficulty-badge difficulty-${difficultyClass}">${difficultyText}</span>
                            </div>
                            <div class="final-score">
                                <span class="score-value">${totalScore}</span>
                                <span class="score-label">puan</span>
                            </div>
                        </div>
                        ${scoreBreakdownHTML}
                        <p class="guest-notice">${scoreData.message || "Skorunuz kaydedilmedi! Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın."}</p>
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

    // Giriş yapmış kullanıcı için puanlama bilgileri
    const xp = scoreData.xp || {};
    const points = scoreData.points || {};
    const scoreInfo = scoreData.score_info || {};
    const gameType = scoreInfo.game_type || '';
    const gameName = formatGameName(gameType);
    const totalScore = scoreInfo.total_score || (points.total ? points.total : 0);
    const difficulty = scoreInfo.difficulty || 'medium';
    const difficultyText = formatDifficulty(difficulty);
    const difficultyClass = difficulty.toLowerCase();

    // Ayrıntılı puan dökümü oluştur
    let scoreBreakdownHTML = '';

    // Ödül detaylarından puan dökümü oluştur
    if (points.rewards) {
        const rewards = points.rewards;

        scoreBreakdownHTML = `
            <div class="score-breakdown">
                <h4 class="breakdown-title">Puan Detayları</h4>
                <div class="score-detail">
                    <span class="detail-label">Temel Puan:</span>
                    <span class="detail-value">+${rewards.base_points}</span>
                </div>
                <div class="score-detail">
                    <span class="detail-label">Skor Puanı:</span>
                    <span class="detail-value">+${rewards.score_points}</span>
                </div>
                ${rewards.daily_bonus > 0 ? `
                <div class="score-detail">
                    <span class="detail-label">Günlük Bonus:</span>
                    <span class="detail-value">+${rewards.daily_bonus}</span>
                </div>
                ` : ''}
                ${rewards.streak_bonus > 0 ? `
                <div class="score-detail">
                    <span class="detail-label">Seri Bonusu:</span>
                    <span class="detail-value">+${rewards.streak_bonus}</span>
                </div>
                ` : ''}
                <div class="score-detail multiplier">
                    <span class="detail-label">Zorluk Çarpanı:</span>
                    <span class="detail-value">×${rewards.difficulty_multiplier.toFixed(1)}</span>
                </div>
                <div class="score-detail total">
                    <span class="detail-label">Toplam Puan:</span>
                    <span class="detail-value">${totalScore}</span>
                </div>
            </div>
        `;
    }

    // Seviye yükseltme durumunda bildirim
    if (xp.level_up) {
        return `
            <div class="score-result level-up">
                <div class="level-up-notice">
                    <i class="fas fa-award"></i>
                    <span>Seviye Atladınız! Yeni Seviyeniz: ${xp.level}</span>
                </div>
                <div class="score-summary">
                    <div class="game-info">
                        <span class="game-name">${gameName}</span>
                        <span class="difficulty-badge difficulty-${difficultyClass}">${difficultyText}</span>
                    </div>
                    <div class="final-score">
                        <span class="score-value">${totalScore}</span>
                        <span class="score-label">puan</span>
                    </div>
                </div>
                ${scoreBreakdownHTML}
                <div class="xp-info">
                    <span class="xp-label">Kazanılan XP:</span>
                    <span class="xp-value">+${xp.gain || 0}</span>
                </div>
            </div>
        `;
    }

    // Normal puan gösterimi (seviye atlanmadıysa)
    return `
        <div class="score-result">
            <div class="score-summary">
                <div class="game-info">
                    <span class="game-name">${gameName}</span>
                    <span class="difficulty-badge difficulty-${difficultyClass}">${difficultyText}</span>
                </div>
                <div class="final-score">
                    <span class="score-value">${totalScore}</span>
                    <span class="score-label">puan</span>
                </div>
            </div>
            ${scoreBreakdownHTML}
            <div class="xp-info">
                <span class="xp-label">Kazanılan XP:</span>
                <span class="xp-value">+${xp.gain || 0}</span>
            </div>
        </div>
    `;
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
        'hangman': 'Adam Asmaca',
        'color_match': 'Renk Eşleştirme',
        'math_challenge': 'Matematik Mücadelesi',
        'typing_speed': 'Yazma Hızı',
        'iq_test': 'IQ Test',
        'tetris': 'Tetris',
        'simon_says': 'Simon Diyor ki',
        'sudoku': 'Sudoku',
        'tangram': 'Tangram',
        'crossword': 'Bulmaca',
        'solitaire': 'Solitaire'
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
        'hard': 'Zor',
        'expert': 'Uzman'
    };

    return difficultyNames[difficulty] || difficulty;
}

/**
 * Zorluk seviyesine göre çarpanı döndürür
 * @param {string} difficulty - Zorluk seviyesi
 * @return {number} Zorluk çarpanı
 */
function getDifficultyMultiplier(difficulty) {
    const multipliers = {
        'easy': 1.0,   // Temel değer
        'medium': 1.5, // %50 bonus
        'hard': 2.5,   // %150 bonus
        'expert': 4.0  // %300 bonus
    };

    return multipliers[difficulty] || 1.0;
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

// Oyun puanını göster
function showGamePoints(gameScore, details) {
  // Puanı her zaman 10-100 arasında sınırlandır
  const normalizedScore = Math.max(10, Math.min(100, gameScore || 0));
  document.getElementById('gamePoints').textContent = normalizedScore;

  if (details) {
    const detailsElement = document.getElementById('scoreDetails');
    if (detailsElement) {
      detailsElement.innerHTML = '';

      // Puan detaylarını göster
      if (details.basePoints) {
        const basePointsElement = document.createElement('div');
        basePointsElement.className = 'score-detail';
        basePointsElement.innerHTML = `<span>Temel Puan:</span><span>${details.basePoints}</span>`;
        detailsElement.appendChild(basePointsElement);
      }

      // Diğer detayları da gösterebilirsiniz
      if (details.bonusPoints) {
        const bonusPointsElement = document.createElement('div');
        bonusPointsElement.className = 'score-detail';
        bonusPointsElement.innerHTML = `<span>Bonus:</span><span>+${details.bonusPoints}</span>`;
        detailsElement.appendChild(bonusPointsElement);
      }

      if (details.difficultyMultiplier) {
        const difficultyElement = document.createElement('div');
        difficultyElement.className = 'score-detail';
        difficultyElement.innerHTML = `<span>Zorluk Çarpanı:</span><span>x${details.difficultyMultiplier}</span>`;
        detailsElement.appendChild(difficultyElement);
      }

      if (details.timePenalty) {
        const timePenaltyElement = document.createElement('div');
        timePenaltyElement.className = 'score-detail penalty';
        timePenaltyElement.innerHTML = `<span>Zaman Cezası:</span><span>-${details.timePenalty}</span>`;
        detailsElement.appendChild(timePenaltyElement);
      }

      // Normalizasyon açıklaması (isteğe bağlı)
      if (gameScore !== normalizedScore) {
        const normalizationElement = document.createElement('div');
        normalizationElement.className = 'score-detail normalization';
        normalizationElement.innerHTML = `<span>Standarlaştırılmış Puan:</span><span>${normalizedScore}</span>`;
        detailsElement.appendChild(normalizationElement);
      }
    }
  }
}