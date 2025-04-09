/**
 * Yeni puan sistemine göre oyun sonunda gösterilecek sonuçları oluşturur
 * @param {object} scoreData - API'den dönen puan verileri
 * @return {string} HTML içeriği
 */
function createScoreDisplay(scoreData) {
    // Eğer veri yoksa
    if (!scoreData) {
        return `<div class="score-display">
            <h3>Puan verisi alınamadı!</h3>
            <p>Lütfen tekrar deneyin veya yöneticiyle iletişime geçin.</p>
        </div>`;
    }

    // Kullanıcı giriş yapmamışsa
    if (scoreData.guest) {
        return `<div class="score-display guest-score">
            <h3>Skorunuz Kaydedilmedi!</h3>
            <p>Puan: <strong>${scoreData.points.total}</strong></p>
            <div class="score-breakdown">
                <p>Taban Puan: ${scoreData.points.rewards.base_points}</p>
                <p>Oyun Puanı: ${scoreData.points.rewards.score_points}</p>
                <p>Zorluk Çarpanı: ${scoreData.points.rewards.difficulty_multiplier}x</p>
            </div>
            <p class="login-message">Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın veya kayıt olun.</p>
        </div>`;
    }

    // Kullanıcı giriş yapmış
    return `<div class="score-display user-score">
        <h3>Tebrikler!</h3>
        <p class="total-score">Puan: <strong>${scoreData.points.total}</strong></p>
        
        <div class="score-breakdown">
            <p>Taban Puan: ${scoreData.points.rewards.base_points}</p>
            <p>Oyun Puanı: ${scoreData.points.rewards.score_points}</p>
            ${scoreData.points.rewards.daily_bonus > 0 ? 
                `<p>Günlük Bonus: +${scoreData.points.rewards.daily_bonus}</p>` : ''}
            ${scoreData.points.rewards.streak_bonus > 0 ? 
                `<p>Streak Bonus: +${scoreData.points.rewards.streak_bonus}</p>` : ''}
            <p>Zorluk Çarpanı: ${scoreData.points.rewards.difficulty_multiplier}x</p>
        </div>
        
        <div class="xp-display">
            <p>Kazanılan XP: <strong>+${scoreData.xp.gain}</strong></p>
            <p>Seviye: ${scoreData.xp.level}</p>
            <div class="xp-progress-container">
                <div class="xp-progress-bar" style="width: ${scoreData.xp.progress_percent}%;"></div>
            </div>
            <p class="xp-progress-text">${scoreData.xp.progress}/${scoreData.xp.needed} XP</p>
        </div>
    </div>`;
}

/**
 * Puanları API'ye kaydeder
 * @param {string} gameType - Oyun tipi 
 * @param {number} score - Oyun skoru
 * @param {number} playtime - Oyun süresi (saniye)
 * @param {string} difficulty - Zorluk seviyesi
 * @param {object} gameStats - Oyunla ilgili istatistikler
 * @param {function} callback - Sonuç HTML'i ile çağrılacak fonksiyon
 */
function saveScoreAndDisplay(gameType, score, playtime, difficulty = 'medium', gameStats = {}, callback) {
    const scoreData = {
        game_type: gameType,
        score: score,
        playtime: playtime,
        difficulty: difficulty,
        game_stats: gameStats
    };

    // Skoru API'ye gönder
    fetch('/api/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Score saved:', data);
        const scoreHtml = createScoreDisplay(data);
        
        if (typeof callback === 'function') {
            callback(scoreHtml, data);
        }
    })
    .catch(error => {
        console.error('Error saving score:', error);
        const errorHtml = `<div class="score-display error">
            <h3>Hata!</h3>
            <p>Skor kaydedilirken bir hata oluştu.</p>
        </div>`;
        
        if (typeof callback === 'function') {
            callback(errorHtml);
        }
    });
}