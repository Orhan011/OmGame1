/**
 * X2 Blocks: 2048 Number Puzzle
 * Modern minimalist ve interaktif tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const gridContainer = document.getElementById('grid-container');
  const tileContainer = document.getElementById('tile-container');
  const scoreDisplay = document.getElementById('score');
  const bestScoreDisplay = document.getElementById('best-score');
  const gameStatusDisplay = document.getElementById('game-status');
  const messageContainer = document.getElementById('game-message');
  const messageText = document.getElementById('message-text');
  const retryButton = document.getElementById('retry-button');
  const keepPlayingButton = document.getElementById('keep-playing-button');
  const restartButton = document.getElementById('restart-button');
  const undoButton = document.getElementById('undo-button');

  // Oyun Durumu
  let grid = [];
  let previousGrids = []; // Geri alma için önceki durumları saklar
  let previousScores = []; // Geri alma için önceki skorları saklar
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('x2blocks-best-score')) || 0;
  let moveCount = 0;
  let gameWon = false;
  let gameOver = false;
  let keepPlaying = false;
  let gameStartTime = Date.now();

  // Sabitler
  const GRID_SIZE = 4;
  const GRID_GAP = 12; // CSS'teki --x2-grid-gap değeriyle aynı olmalı
  const ANIMATION_SPEED = 150; // milisaniye
  const MAX_UNDO_STEPS = 5; // Geri alma için maksimum adım sayısı
  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    RIGHT: { x: 1, y: 0 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 }
  };

  // En iyi skoru göster
  bestScoreDisplay.textContent = bestScore;

  // Oyunu başlat
  initGame();
  updateStatusMessage();

  // Olay dinleyicileri
  window.addEventListener('keydown', handleKeyPress);
  restartButton.addEventListener('click', restartGame);
  retryButton.addEventListener('click', restartGame);
  keepPlayingButton.addEventListener('click', continueGame);
  undoButton.addEventListener('click', undoMove);

  // Dokunmatik cihazlar için kaydırma desteği
  setupTouchEvents();

  /**
   * Oyunu başlatır ve başlangıç durumunu ayarlar
   */
  function initGame() {
    // Grid'i oluştur
    setupGrid();
    
    // Başlangıç karelerini ekle
    addRandomTile();
    addRandomTile();
    
    // UI'ı güncelle
    updateGridDisplay();
    
    // Oyun başlangıç zamanını kaydet
    gameStartTime = Date.now();
    
    // Geri alma butonunu devre dışı bırak
    undoButton.disabled = true;
  }

  /**
   * Grid yapısını oluşturur
   */
  function setupGrid() {
    grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(null);
      }
      grid.push(row);
    }
  }

  /**
   * Grid'in görsel temsili güncellenir
   */
  function updateGridDisplay() {
    // Önce tüm kareleri temizle
    while (tileContainer.firstChild) {
      tileContainer.removeChild(tileContainer.firstChild);
    }

    // Her kareyi ekrana çiz
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const value = grid[y][x];
        if (value) {
          const tile = document.createElement('div');
          tile.className = `tile tile-${value.value} ${value.merged ? 'tile-merged' : value.isNew ? 'tile-new' : ''}`;
          tile.textContent = value.value;

          // Kare pozisyonunu hesapla
          const cellSize = (100 - GRID_GAP * 5) / GRID_SIZE; // Yüzde olarak
          const position = {
            x: x * (cellSize + GRID_GAP) + GRID_GAP,
            y: y * (cellSize + GRID_GAP) + GRID_GAP
          };

          // Kareyi doğru konuma yerleştir
          tile.style.left = position.x + '%';
          tile.style.top = position.y + '%';
          tile.style.width = cellSize + '%';
          tile.style.height = cellSize + '%';

          tileContainer.appendChild(tile);
        }
      }
    }
  }

  /**
   * Rastgele bir "2" veya "4" karesi ekle
   */
  function addRandomTile() {
    const emptyCells = [];

    // Boş hücreleri bul
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!grid[y][x]) {
          emptyCells.push({ x, y });
        }
      }
    }

    // Boş hücre yoksa geri dön
    if (emptyCells.length === 0) return;

    // Rastgele bir boş hücre seç
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    // Hücreye %90 ihtimalle "2", %10 ihtimalle "4" yerleştir
    grid[cell.y][cell.x] = {
      value: Math.random() < 0.9 ? 2 : 4,
      isNew: true,
      merged: false
    };
  }

  /**
   * Durum mesajını günceller
   */
  function updateStatusMessage() {
    if (gameOver) {
      gameStatusDisplay.innerHTML = 'Oyun bitti! Tekrar denemek için "Yeni Oyun" butonuna tıklayın.';
    } else if (gameWon && !keepPlaying) {
      gameStatusDisplay.innerHTML = 'Tebrikler! <strong>2048</strong>\'e ulaştınız! Devam edebilir veya yeni oyun başlatabilirsiniz.';
    } else if (gameWon && keepPlaying) {
      gameStatusDisplay.innerHTML = 'Daha yüksek skorlar için oynamaya devam edin! Şimdiden <strong>2048</strong>\'e ulaştınız!';
    } else {
      gameStatusDisplay.innerHTML = 'Aynı sayıları birleştirerek <strong>2048</strong> sayısına ulaşmaya çalışın!';
    }
  }

  /**
   * Klavye olaylarını yönetir
   */
  function handleKeyPress(event) {
    if (gameOver && !keepPlaying) return;

    // Hareket yönünü belirle
    let direction;
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = DIRECTIONS.UP;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = DIRECTIONS.RIGHT;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = DIRECTIONS.DOWN;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = DIRECTIONS.LEFT;
        break;
      default:
        return; // Diğer tuşlarda hiçbir şey yapma
    }

    // Mevcut durumu geri alma için kaydet
    saveGameState();

    // Yönlü hareket et
    event.preventDefault();
    if (moveGrid(direction)) {
      // Başarılı bir hareket sonrası
      moveCount++;
      
      // Yeni kare eklemeden önce kısa bir animasyon süresi
      setTimeout(() => {
        // Karelerin durumunu sıfırla
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x]) {
              grid[y][x].isNew = false;
              grid[y][x].merged = false;
            }
          }
        }

        // Yeni kare ekle ve görüntüyü güncelle
        addRandomTile();
        updateGridDisplay();

        // Hareket kaldı mı kontrol et
        if (!canMove()) {
          gameOver = true;
          showGameOverMessage();
        }
        
        // Durumu güncelle
        updateStatusMessage();
        
        // Geri alma butonunu etkinleştir
        undoButton.disabled = previousGrids.length === 0;
      }, ANIMATION_SPEED);
    }
  }
  
  /**
   * Mevcut oyun durumunu geri alma için kaydeder
   */
  function saveGameState() {
    // Grid'in derin kopyasını oluştur
    const gridCopy = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x]) {
          row.push({
            value: grid[y][x].value,
            isNew: false,
            merged: false
          });
        } else {
          row.push(null);
        }
      }
      gridCopy.push(row);
    }
    
    // Durumu kaydet
    previousGrids.push(gridCopy);
    previousScores.push(score);
    
    // Maksimum geri alma adımını aşmayalım
    if (previousGrids.length > MAX_UNDO_STEPS) {
      previousGrids.shift();
      previousScores.shift();
    }
  }
  
  /**
   * Son hareketi geri alır
   */
  function undoMove() {
    if (previousGrids.length === 0) return;
    
    // Son kaydedilen durumu al
    grid = previousGrids.pop();
    score = previousScores.pop();
    
    // UI'ı güncelle
    updateGridDisplay();
    scoreDisplay.textContent = score;
    
    // Geri al butonu durumunu güncelle
    undoButton.disabled = previousGrids.length === 0;
    
    // Oyun durumunu güncelle
    gameOver = false;
    updateStatusMessage();
  }

  /**
   * Grid'i belirli bir yönde hareket ettirir
   */
  function moveGrid(direction) {
    let moved = false;

    // Hareket sırasını belirle
    const traversals = getTraversalOrder(direction);

    // Her hücreyi tarayarak hareket ettir
    traversals.y.forEach(y => {
      traversals.x.forEach(x => {
        const cell = { x, y };
        const tile = grid[y][x];

        if (tile) {
          const positions = findFarthestPosition(cell, direction);
          const next = positions.next ? grid[positions.next.y][positions.next.x] : null;

          // Birleştirme mantığı
          if (next && next.value === tile.value && !next.merged) {
            // İki kare birleşecek
            const mergedValue = tile.value * 2;
            grid[positions.next.y][positions.next.x] = {
              value: mergedValue,
              merged: true,
              isNew: false
            };
            grid[y][x] = null;

            // Skoru güncelle
            score += mergedValue;
            updateScore(mergedValue);

            // 2048'e ulaşıldı mı kontrol et
            if (mergedValue === 2048 && !gameWon && !keepPlaying) {
              gameWon = true;
              showGameWonMessage();
            }

            moved = true;
          } else {
            // Sadece hareket, birleştirme yok
            grid[positions.farthest.y][positions.farthest.x] = tile;
            if (x !== positions.farthest.x || y !== positions.farthest.y) {
              grid[y][x] = null;
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      updateGridDisplay();
    }

    return moved;
  }

  /**
   * Yön kontrolü için tarama sırasını belirler
   */
  function getTraversalOrder(direction) {
    const traversals = {
      x: [],
      y: []
    };

    // X ve Y eksenleri için 0-3 arasında diziler oluştur
    for (let i = 0; i < GRID_SIZE; i++) {
      traversals.x.push(i);
      traversals.y.push(i);
    }

    // Sağdan veya aşağıdan hareket ediyorsak dizileri ters çevir
    if (direction.x === 1) traversals.x = traversals.x.reverse();
    if (direction.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }

  /**
   * Verilen hücre için gidilebilecek en uzak pozisyonu bulur
   */
  function findFarthestPosition(cell, direction) {
    let previous;
    let current = { x: cell.x, y: cell.y };

    // Yönde ilerleyebildiğin kadar ilerle
    do {
      previous = { x: current.x, y: current.y };
      current = {
        x: previous.x + direction.x,
        y: previous.y + direction.y
      };
    } while (isWithinBounds(current) && !grid[current.y][current.x]);

    // En uzak noktayı ve sonrasındaki hücreyi döndür
    return {
      farthest: previous,
      next: isWithinBounds(current) ? current : null
    };
  }

  /**
   * Verilen pozisyonun grid sınırları içinde olup olmadığını kontrol eder
   */
  function isWithinBounds(position) {
    return position.x >= 0 && position.x < GRID_SIZE && 
           position.y >= 0 && position.y < GRID_SIZE;
  }

  /**
   * Hala hareket edilebilir mi kontrol eder
   */
  function canMove() {
    // Boş hücre var mı?
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!grid[y][x]) return true;
      }
    }

    // Birleştirilebilecek komşu hücreler var mı?
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y][x];

        // Her yöne komşuları kontrol et
        for (const direction of Object.values(DIRECTIONS)) {
          const neighbor = {
            x: x + direction.x,
            y: y + direction.y
          };

          // Komşu geçerli mi?
          if (isWithinBounds(neighbor)) {
            const neighborTile = grid[neighbor.y][neighbor.x];
            // Komşu kare aynı değere sahip mi?
            if (neighborTile && neighborTile.value === tile.value) {
              return true;
            }
          }
        }
      }
    }

    // Ne boş hücre ne de birleştirilebilir komşu var
    return false;
  }

  /**
   * Skor göstergesini günceller ve animasyon ekler
   */
  function updateScore(addition = 0) {
    scoreDisplay.textContent = score;

    // En iyi skoru güncelle
    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.textContent = bestScore;
      localStorage.setItem('x2blocks-best-score', bestScore);
    }

    // Skor ekleme animasyonu göster
    if (addition > 0) {
      const scoreAddition = document.createElement('div');
      scoreAddition.className = 'score-addition';
      scoreAddition.textContent = '+' + addition;
      
      // Rastgele hafif bir ofset ile göster
      scoreAddition.style.top = (-20 - Math.random() * 10) + 'px';
      scoreAddition.style.right = (Math.random() * 10) + 'px';
      
      scoreDisplay.appendChild(scoreAddition);

      // Animasyon bitiminde temizle
      setTimeout(() => {
        scoreAddition.remove();
      }, 600);
    }
  }

  /**
   * Oyunu yeniden başlatır
   */
  function restartGame() {
    // Tüm oyun değişkenlerini sıfırla
    grid = [];
    previousGrids = [];
    previousScores = [];
    score = 0;
    moveCount = 0;
    gameWon = false;
    gameOver = false;
    keepPlaying = false;

    // UI'ı güncelle
    scoreDisplay.textContent = '0';
    messageContainer.style.display = 'none';
    undoButton.disabled = true;

    // Yeni oyun başlat
    initGame();
    updateStatusMessage();
  }

  /**
   * "Oynamaya Devam Et" seçeneği
   */
  function continueGame() {
    keepPlaying = true;
    messageContainer.style.display = 'none';
    updateStatusMessage();
  }

  /**
   * Oyun kazanıldı mesajını gösterir
   */
  function showGameWonMessage() {
    messageText.textContent = 'Tebrikler! 2048\'e ulaştınız!';
    messageContainer.classList.add('game-won');
    keepPlayingButton.style.display = 'block';
    messageContainer.style.display = 'flex';
    
    // Durumu güncelle
    updateStatusMessage();
    
    // Sunucuya skoru kaydet
    saveScore('win');
  }

  /**
   * Oyun bitti mesajını gösterir
   */
  function showGameOverMessage() {
    messageText.textContent = 'Oyun Bitti!';
    messageContainer.classList.add('game-over');
    keepPlayingButton.style.display = 'none';
    messageContainer.style.display = 'flex';
    
    // Durumu güncelle
    updateStatusMessage();
    
    // Sunucuya skoru kaydet
    saveScore('lose');
  }

  /**
   * Dokunmatik cihazlar için kaydırma desteği ekler
   */
  function setupTouchEvents() {
    let touchStartX, touchStartY;
    let touchEndX, touchEndY;
    
    // Dokunma olaylarını eklemek için grid içeren kapsayıcıyı seç
    const gameContainer = document.querySelector('.x2blocks-game-container');

    gameContainer.addEventListener('touchstart', function(event) {
      if (event.touches.length > 1) return; // Çoklu dokunuşları görmezden gel

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      event.preventDefault();
    }, { passive: false });

    gameContainer.addEventListener('touchend', function(event) {
      if (!touchStartX || !touchStartY) return;

      touchEndX = event.changedTouches[0].clientX;
      touchEndY = event.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      // Minimum kaydırma eşiği (çok küçük hareketleri görmezden gel)
      const MIN_SWIPE = 10;

      // Yatay ve dikey kaydırma mesafelerini karşılaştır
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > MIN_SWIPE) {
        // Yatay kaydırma
        if (dx > 0) {
          // Sağa kaydırma
          handleKeyPress({ key: 'ArrowRight', preventDefault: () => {} });
        } else {
          // Sola kaydırma
          handleKeyPress({ key: 'ArrowLeft', preventDefault: () => {} });
        }
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > MIN_SWIPE) {
        // Dikey kaydırma
        if (dy > 0) {
          // Aşağı kaydırma
          handleKeyPress({ key: 'ArrowDown', preventDefault: () => {} });
        } else {
          // Yukarı kaydırma
          handleKeyPress({ key: 'ArrowUp', preventDefault: () => {} });
        }
      }

      // Değerleri sıfırla
      touchStartX = null;
      touchStartY = null;
      event.preventDefault();
    }, { passive: false });
  }

  /**
   * Skoru sunucuya kaydeder
   */
  function saveScore(result = 'play') {
    // Oynama süresini hesapla (saniye)
    const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // API endpoint ve veriler
    const url = '/api/save_score';
    const data = {
      game_type: 'game_2048',
      score: score,
      game_data: {
        moves: moveCount,
        playTime: playTime,
        result: result,
        highestTile: getHighestTile()
      }
    };

    // Fetch API ile POST isteği
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
  
  /**
   * Grid'deki en yüksek kare değerini bulur
   */
  function getHighestTile() {
    let highest = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] && grid[y][x].value > highest) {
          highest = grid[y][x].value;
        }
      }
    }
    
    return highest;
  }
});