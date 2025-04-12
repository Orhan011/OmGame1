
/**
 * Oyun sonu skorlarını gösteren modül
 * Standartlaştırılmış puan sistemine göre oyun sonunda gösterilecek sonuçları oluşturur
 */

/**
 * Oyun adını formatlar
 * @param {string} gameType - Oyun tipi
 * @return {string} Formatlanmış oyun adı
 */
function formatGameName(gameType) {
  const gameNames = {
    'wordPuzzle': 'Kelime Bulmaca',
    'word_puzzle': 'Kelime Bulmaca',
    'memoryMatch': 'Hafıza Eşleştirme',
    'memory_match': 'Hafıza Eşleştirme',
    'numberSequence': 'Sayı Dizisi',
    'number_sequence': 'Sayı Dizisi',
    'memoryCards': 'Hafıza Kartları',
    'memory_cards': 'Hafıza Kartları',
    'numberChain': 'Sayı Zinciri',
    'number_chain': 'Sayı Zinciri',
    'labyrinth': '3D Labirent',
    'puzzle': 'Bulmaca',
    'audioMemory': 'Sesli Hafıza',
    'audio_memory': 'Sesli Hafıza',
    'nBack': 'N-Back',
    'n_back': 'N-Back',
    '2048': '2048',
    'wordle': 'Wordle',
    'chess': 'Satranç',
    'snake_game': 'Yılan Oyunu',
    'snake': 'Yılan Oyunu',
    'puzzle_slider': 'Resim Bulmaca',
    'puzzleSlider': 'Resim Bulmaca',
    'minesweeper': 'Mayın Tarlası',
    'hangman': 'Adam Asmaca',
    'color_match': 'Renk Eşleştirme',
    'colorMatch': 'Renk Eşleştirme',
    'math_challenge': 'Matematik Mücadelesi',
    'mathChallenge': 'Matematik Mücadelesi',
    'typing_speed': 'Yazma Hızı',
    'typingSpeed': 'Yazma Hızı',
    'iq_test': 'IQ Test',
    'iqTest': 'IQ Test',
    'tetris': 'Tetris',
    'simon_says': 'Simon Diyor ki',
    'simonSays': 'Simon Diyor ki',
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
 * Oyun tipine göre ikon döndürür
 * @param {string} gameType - Oyun tipi
 * @return {string} - Font Awesome ikon kodu
 */
function getGameIcon(gameType) {
  const gameIcons = {
    'puzzle': 'puzzle-piece',
    'wordle': 'spell-check',
    'memory_match': 'clone',
    'memoryMatch': 'clone',
    'memoryCards': 'clone',
    'memory_cards': 'clone',
    'chess': 'chess',
    'snake_game': 'snake',
    'snake': 'snake',
    'tetris': 'th-large',
    'sudoku': 'table',
    'minesweeper': 'bomb',
    'hangman': 'user-slash',
    'color_match': 'palette',
    'colorMatch': 'palette',
    'math_challenge': 'calculator',
    'mathChallenge': 'calculator',
    'typing_speed': 'keyboard',
    'typingSpeed': 'keyboard',
    'iq_test': 'brain',
    'iqTest': 'brain',
    'labyrinth': 'dungeon',
    'numberChain': 'link',
    'number_chain': 'link',
    'numberSequence': 'sort-numeric-down',
    'number_sequence': 'sort-numeric-down',
    'wordPuzzle': 'font',
    'word_puzzle': 'font',
    'audio_memory': 'music',
    'audioMemory': 'music',
    'nBack': 'memory',
    'n_back': 'memory',
    'puzzle_slider': 'th',
    'puzzleSlider': 'th',
    'simon_says': 'gamepad',
    'simonSays': 'gamepad',
    'tangram': 'shapes',
    'crossword': 'table',
    'solitaire': 'cards'
  };

  return gameIcons[gameType] || 'gamepad';
}

/**
 * Standartlaştırılmış puan sistemine göre oyun sonunda gösterilecek sonuçları oluşturur
 * @param {object} scoreData - API'den dönen puan verileri
 * @return {string} HTML içeriği
 */
function createScoreDisplay(scoreData) {
  console.log("Skor verileri:", scoreData);

  // Misafir kullanıcı için özel mesaj
  if (!scoreData || !scoreData.success) {
    if (scoreData && scoreData.guest) {
      // Misafir kullanıcı için zorluk bilgisi
      const scoreInfo = scoreData.score_info || {};
      const gameType = scoreInfo.game_type || '';
      const gameName = formatGameName(gameType);
      const gameIcon = getGameIcon(gameType);
      const difficulty = scoreInfo.difficulty || 'medium';
      const difficultyText = formatDifficulty(difficulty);
      const difficultyClass = difficulty.toLowerCase();
      
      // Puan hesaplaması
      let calculatedScore = 0;
      
      // API yanıtından puan bilgisini çek
      if (scoreData.points && scoreData.points.total) {
        calculatedScore = scoreData.points.total;
      }

      // Misafir kullanıcı için giriş mesajı (zorluk ve puan bilgisiyle)
      return `
        <div class="game-result-overlay">
          <div class="game-result-container animated-result guest-result">
            <div class="result-header">
              <h2>Oyun Bitti!</h2>
              <div class="game-info">
                <div class="game-name"><i class="fas fa-${gameIcon}"></i> ${gameName}</div>
                <div class="difficulty-badge difficulty-${difficultyClass}"><i class="fas fa-${difficulty === 'easy' ? 'baby' : (difficulty === 'hard' ? 'fire' : (difficulty === 'expert' ? 'crown' : 'check'))}"></i> ${difficultyText}</div>
              </div>
            </div>
            
            <div class="score-display">
              <div class="score-circle">
                <span class="score-value">${calculatedScore}</span>
                <span class="score-label">PUAN</span>
              </div>
            </div>

            <div class="guest-message">
              <i class="fas fa-user-lock"></i>
              <h3>Misafir Kullanıcı</h3>
              <p class="guest-notice">${scoreData.message || "Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın."}</p>
              <div class="guest-actions">
                <a href="/login" class="action-button btn-primary"><i class="fas fa-sign-in-alt"></i> Giriş Yap</a>
                <a href="/register" class="action-button btn-secondary"><i class="fas fa-user-plus"></i> Üye Ol</a>
              </div>
            </div>

            <div class="result-actions" style="margin-top: 20px;">
              <button class="action-button btn-secondary close-result"><i class="fas fa-times"></i> Kapat</button>
              <button class="action-button btn-primary replay-game"><i class="fas fa-redo"></i> Tekrar Oyna</button>
            </div>
          </div>
        </div>
      `;
    }
    return ''; // Hata durumunda boş döndür
  }

  // Giriş yapmış kullanıcı için puanlama bilgileri
  const xp = scoreData.xp || {};
  const scoreInfo = scoreData.score_info || {};
  const gameType = scoreInfo.game_type || '';
  const gameName = formatGameName(gameType);
  const gameIcon = getGameIcon(gameType);
  const difficulty = scoreInfo.difficulty || 'medium';
  const difficultyText = formatDifficulty(difficulty);
  const difficultyClass = difficulty.toLowerCase();
  
  // Puan hesaplaması
  let calculatedScore = 0;
  let xpGained = 0;
  
  // API yanıtından puan ve XP bilgisini çek
  if (scoreData.points && scoreData.points.total) {
    calculatedScore = scoreData.points.total;
  }
  
  if (xp && xp.gain) {
    xpGained = xp.gain;
  }
  
  // Seviye yükseltme durumunda bildirim
  if (xp.level_up) {
    return `
      <div class="game-result-overlay">
        <div class="game-result-container animated-result level-up">
          <div class="level-up-notice">
            <i class="fas fa-award"></i>
            <span>Seviye Atladınız! Yeni Seviyeniz: ${xp.level}</span>
          </div>

          <div class="result-header">
            <h2>Tebrikler!</h2>
            <div class="game-info">
              <div class="game-name"><i class="fas fa-${gameIcon}"></i> ${gameName}</div>
              <div class="difficulty-badge difficulty-${difficultyClass}"><i class="fas fa-${difficulty === 'easy' ? 'baby' : (difficulty === 'hard' ? 'fire' : (difficulty === 'expert' ? 'crown' : 'check'))}"></i> ${difficultyText}</div>
            </div>
          </div>
          
          <div class="score-display">
            <div class="score-circle">
              <span class="score-value">${calculatedScore}</span>
              <span class="score-label">PUAN</span>
            </div>
            
            <div class="score-details">
              <div class="score-detail">
                <i class="fas fa-star"></i>
                <span>Kazanılan XP: +${xpGained}</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="action-button btn-secondary close-result"><i class="fas fa-times"></i> Kapat</button>
            <button class="action-button btn-primary replay-game"><i class="fas fa-redo"></i> Tekrar Oyna</button>
          </div>
        </div>
      </div>
    `;
  }

  // Normal oyun bitimi gösterimi (seviye atlanmadıysa)
  return `
    <div class="game-result-overlay">
      <div class="game-result-container animated-result">
        <div class="result-header">
          <h2>Oyun Bitti!</h2>
          <div class="game-info">
            <div class="game-name"><i class="fas fa-${gameIcon}"></i> ${gameName}</div>
            <div class="difficulty-badge difficulty-${difficultyClass}"><i class="fas fa-${difficulty === 'easy' ? 'baby' : (difficulty === 'hard' ? 'fire' : (difficulty === 'expert' ? 'crown' : 'check'))}"></i> ${difficultyText}</div>
          </div>
        </div>
        
        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">${calculatedScore}</span>
            <span class="score-label">PUAN</span>
          </div>
          
          <div class="score-details">
            <div class="score-detail">
              <i class="fas fa-star"></i>
              <span>Kazanılan XP: +${xpGained}</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="action-button btn-secondary close-result"><i class="fas fa-times"></i> Kapat</button>
          <button class="action-button btn-primary replay-game"><i class="fas fa-redo"></i> Tekrar Oyna</button>
        </div>
      </div>
    </div>
  `;
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
  // Parametreleri kontrol et ve standardize et
  if (typeof score !== 'number') {
    score = parseInt(score) || 0;
  }

  // Puanı 10-100 arasında sınırla
  score = Math.max(10, Math.min(100, score));

  // Zorluk seviyesini standardize et
  if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
    difficulty = 'medium';
  }

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
      console.error('Geçersiz skor verisi:', scoreData);

      if (typeof callback === 'function') {
        callback(''); // Boş içerik döndür
      }
      return;
    }

    console.log(`Kullanıcı profiline puan kaydediliyor: ${gameType}: ${score} puan, zorluk: ${difficulty}`);

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
        console.error(`Server responded with status: ${response.status}`);
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
      console.log("Skor kaydedildi ve kullanıcı hesabına eklendi:", {
        score: score,
        gameType: gameType,
        adjustedScore: data.points?.total || score,
        xpGained: data.xp?.gain || 0
      });

      if (typeof callback === 'function') {
        callback(scoreHtml, data);
      }

      // Olay dinleyicileri ekle (kapat ve tekrar oyna butonları için)
      setTimeout(() => {
        // Kapat butonları
        document.querySelectorAll('.close-result').forEach(button => {
          button.addEventListener('click', () => {
            document.querySelector('.game-result-overlay').remove();
          });
        });

        // Tekrar oyna butonları
        document.querySelectorAll('.replay-game').forEach(button => {
          button.addEventListener('click', () => {
            document.querySelector('.game-result-overlay').remove();
            // Özel restart fonksiyonu varsa çağır
            if (typeof window.restartGame === 'function') {
              window.restartGame();
            } else {
              // Profil veya liderlik tablosu sayfasındaysa puanları yenile
              if (window.location.pathname.includes('/profile') || window.location.pathname.includes('/leaderboard')) {
                // Profil puanlarını güncelle
                if (typeof updateProfileScores === 'function') {
                  updateProfileScores();
                }
                // Liderlik tablosu puanlarını güncelle
                if (typeof loadLeaderboard === 'function') {
                  loadLeaderboard();
                }
              } else {
                // Yoksa sayfayı yenile
                window.location.reload();
              }
            }
          });
        });
      }, 100);
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

/**
 * Skor ekranını doğrudan HTML içeriğini kullanarak göster
 * @param {string} htmlContent - Gösterilecek HTML içeriği
 */
function showScoreScreen(htmlContent) {
  // Daha önce açık bir skor ekranı varsa kaldır
  const existingOverlay = document.querySelector('.game-result-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // HTML içeriğini ekle
  if (htmlContent) {
    document.body.insertAdjacentHTML('beforeend', htmlContent);

    // Olay dinleyicilerini ekle
    setTimeout(() => {
      // Kapat butonları
      document.querySelectorAll('.close-result').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelector('.game-result-overlay').remove();
        });
      });

      // Tekrar oyna butonları
      document.querySelectorAll('.replay-game').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelector('.game-result-overlay').remove();
          // Özel restart fonksiyonu varsa çağır
          if (typeof window.restartGame === 'function') {
            window.restartGame();
          } else {
            // Profil veya liderlik tablosu sayfasındaysa puanları yenile
            if (window.location.pathname.includes('/profile') || window.location.pathname.includes('/leaderboard')) {
              // Profil puanlarını güncelle
              if (typeof updateProfileScores === 'function') {
                updateProfileScores();
              }
              // Liderlik tablosu puanlarını güncelle
              if (typeof loadLeaderboard === 'function') {
                loadLeaderboard();
              }
            } else {
              // Yoksa sayfayı yenile
              window.location.reload();
            }
          }
        });
      });
    }, 100);
  }
}

/**
 * ScoreCalculator temelli puanı standartlaştır ve göster
 * @param {Object} scoreParams - Puan parametreleri
 * @param {function} callback - Sonuç HTML'i ile çağrılacak fonksiyon
 */
function calculateAndDisplayScore(scoreParams, callback) {
  try {
    console.log("Puan hesaplanıyor:", scoreParams);

    // Gerekli parametreleri kontrol et
    if (!scoreParams || !scoreParams.gameType) {
      console.error("Geçersiz oyun parametreleri:", scoreParams);
      throw new Error("Geçersiz oyun parametreleri");
    }

    // ScoreCalculator modülü var mı kontrol et
    if (typeof window.ScoreCalculator === 'undefined' || !window.ScoreCalculator) {
      console.warn('ScoreCalculator modülü bulunamadı! Manuel hesaplama kullanılıyor.');

      // Manuel hesaplama - Basit algoritma
      let baseScore = 50;

      // Oyun tipine göre temel puanı ayarla
      if (scoreParams.rawScore && scoreParams.maxPossibleScore) {
        const ratio = scoreParams.rawScore / scoreParams.maxPossibleScore;
        baseScore = Math.round(ratio * 80);
      } 
      else if (scoreParams.accuracy !== undefined) {
        baseScore = Math.round(scoreParams.accuracy * 80);
      }
      else if (scoreParams.score !== undefined) {
        baseScore = Math.min(Math.max(scoreParams.score, 10), 100);
      }

      // Zorluk çarpanını belirle
      const difficultyMultiplier = 
        scoreParams.difficulty === 'easy' ? 0.8 : 
        scoreParams.difficulty === 'hard' ? 1.5 : 
        scoreParams.difficulty === 'expert' ? 2.0 : 1.0;

      // İpucu cezası
      const hintPenalty = scoreParams.hintsUsed ? Math.min(scoreParams.hintsUsed * 5, 30) : 0;
      
      // Zaman cezası/bonusu
      let timeBonus = 0;
      if (scoreParams.timeSpent && scoreParams.optimalTime) {
        const timeRatio = scoreParams.optimalTime / scoreParams.timeSpent;
        timeBonus = Math.round((timeRatio - 1) * 20); // -20 ile +20 arası bonus
      }
      
      // Hamle verimliliği bonusu
      let moveBonus = 0;
      if (scoreParams.totalMoves && scoreParams.optimalMoves) {
        const moveRatio = scoreParams.optimalMoves / scoreParams.totalMoves;
        moveBonus = Math.round((moveRatio - 1) * 15); // -15 ile +15 arası bonus
      }

      // Final puanı hesapla ve sınırlandır
      const finalScore = Math.max(10, Math.min(100, Math.round(baseScore * difficultyMultiplier) + timeBonus + moveBonus - hintPenalty));

      console.log("Manuel hesaplanmış puan:", finalScore);

      // API'ye kaydet
      saveScoreAndDisplay(
        scoreParams.gameType,
        finalScore,
        scoreParams.timeSpent || 60,
        scoreParams.difficulty || 'medium',
        {
          ...scoreParams,
          manualCalculation: true,
          baseScore: baseScore,
          difficultyMultiplier: difficultyMultiplier,
          hintPenalty: hintPenalty,
          timeBonus: timeBonus,
          moveBonus: moveBonus
        },
        callback
      );

      return;
    }

    // ScoreCalculator ile hesapla
    try {
      const scoreDetails = window.ScoreCalculator.calculate(scoreParams);
      console.log("ScoreCalculator ile hesaplanan puan:", scoreDetails);

      if (!scoreDetails || !scoreDetails.finalScore) {
        throw new Error("Geçersiz puan hesaplaması");
      }

      // API'ye kaydet
      saveScoreAndDisplay(
        scoreParams.gameType,
        scoreDetails.finalScore,
        scoreParams.timeSpent || 60,
        scoreParams.difficulty || 'medium',
        {
          ...scoreParams,
          calculatedScore: true,
          scoreBreakdown: scoreDetails.breakdown
        },
        callback
      );
    } catch (calculationError) {
      console.error("ScoreCalculator hatası:", calculationError);
      throw calculationError; // Yeniden fırlat
    }
  } catch (error) {
    console.error('Kritik puan hesaplama hatası:', error);

    // Hatadan kurtarma - basit bir puan ata
    try {
      // En basit puan hesaplama yöntemi
      let emergencyScore = 50; // Varsayılan

      if (scoreParams) {
        // Zorluk seviyesini dikkate al
        const diffFactor = 
          scoreParams.difficulty === 'easy' ? 0.8 : 
          scoreParams.difficulty === 'hard' ? 1.2 : 
          scoreParams.difficulty === 'expert' ? 1.5 : 1.0;

        emergencyScore = Math.round(emergencyScore * diffFactor);

        // Sınırlandır
        emergencyScore = Math.max(10, Math.min(100, emergencyScore));
      }

      console.warn("Acil durum puanı kullanılıyor:", emergencyScore);

      // Skoru kaydet
      saveScoreAndDisplay(
        (scoreParams && scoreParams.gameType) ? scoreParams.gameType : 'unknown_game',
        emergencyScore,
        (scoreParams && scoreParams.timeSpent) ? scoreParams.timeSpent : 60,
        (scoreParams && scoreParams.difficulty) ? scoreParams.difficulty : 'medium',
        {
          ...(scoreParams || {}),
          emergencyScore: true,
          errorMessage: error.message
        },
        callback
      );
    } catch (finalError) {
      console.error("Kritik kurtarma hatası:", finalError);
      if (typeof callback === 'function') {
        callback(''); // Boş dön
      }
    }
  }
}

// Global olarak erişilebilir fonksiyonları dışa aktar
window.saveScoreAndDisplay = saveScoreAndDisplay;
window.showScoreScreen = showScoreScreen;
window.calculateAndDisplayScore = calculateAndDisplayScore;
window.createScoreDisplay = createScoreDisplay;
