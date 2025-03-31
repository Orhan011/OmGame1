/**
 * 2048 Oyunu 
 * Modern ve profesyonel tasarım
 */

document.addEventListener('DOMContentLoaded', function() {
  // HTML elementleri
  const gridContainer = document.getElementById('grid-container');
  const tileContainer = document.getElementById('tile-container');
  const scoreDisplay = document.getElementById('score');
  const bestScoreDisplay = document.getElementById('best-score');
  const messageContainer = document.getElementById('game-message');
  const messageContent = messageContainer.querySelector('p');
  const retryButton = document.getElementById('retry-button');
  const keepPlayingButton = document.getElementById('keep-playing-button');
  const restartButton = document.getElementById('restart-button');

  // Game state
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
  let gameWon = false;
  let gameOver = false;
  let keepPlaying = false;

  // Sabitleri tanımla
  const GRID_SIZE = 4;
  const TILE_MARGIN = 15;
  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    RIGHT: { x: 1, y: 0 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 }
  };

  // En iyi skoru ayarla
  bestScoreDisplay.textContent = bestScore;

  // Oyunu başlat
  initGame();

  // Yön tuşları ve restart olaylarını ekle
  window.addEventListener('keydown', handleKeyPress);
  restartButton.addEventListener('click', restartGame);
  retryButton.addEventListener('click', restartGame);
  keepPlayingButton.addEventListener('click', continueGame);

  // Dokunmatik cihazlar için kaydırma desteği ekle
  setupTouchEvents();

  // Oyunu başlatıp grid'i sıfırla
  function initGame() {
    setupGrid();
    addRandomTile();
    addRandomTile();
    updateGridDisplay();
  }

  // Grid yapısını oluştur
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

  // Grid'i göster
  function updateGridDisplay() {
    // Önce tüm mevcut kareleri temizle
    while (tileContainer.firstChild) {
      tileContainer.removeChild(tileContainer.firstChild);
    }

    // Her bir kareyi ekrana çiz
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const value = grid[y][x];
        if (value) {
          const tile = document.createElement('div');
          tile.className = `tile tile-${value.value} ${value.merged ? 'tile-merged' : value.isNew ? 'tile-new' : ''}`;
          tile.textContent = value.value;

          // Döşeme pozisyonunu hesapla
          const cellSize = (100 - TILE_MARGIN * 2) / GRID_SIZE;
          const position = {
            x: x * (cellSize + TILE_MARGIN / GRID_SIZE) + TILE_MARGIN,
            y: y * (cellSize + TILE_MARGIN / GRID_SIZE) + TILE_MARGIN
          };

          // Döşemeyi doğru konuma yerleştir
          tile.style.left = position.x + '%';
          tile.style.top = position.y + '%';

          tileContainer.appendChild(tile);
        }
      }
    }
  }

  // Rastgele bir "2" veya "4" karesi ekle
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

  // Klavye olaylarını yönet
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
        return; // Diğer tuşlar için hiçbir şey yapma
    }

    // Yönlü hareket et
    event.preventDefault();
    if (moveGrid(direction)) {
      // Başarılı bir hareket sonrası yeni bir kare ekle
      setTimeout(() => {
        // Karoları yeni ve birleştirilmiş durumdan çıkar
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x]) {
              grid[y][x].isNew = false;
              grid[y][x].merged = false;
            }
          }
        }

        addRandomTile();
        updateGridDisplay();

        if (!canMove()) {
          gameOver = true;
          showGameOverMessage();
        }
      }, 150);
    }
  }

  // Tahtayı belirli bir yönde hareket ettir
  function moveGrid(direction) {
    let moved = false;

    // İlerleme yönünü ayarla
    const traversals = getTraversalOrder(direction);

    // Her hücreyi tarayarak hareket ettir
    traversals.y.forEach(y => {
      traversals.x.forEach(x => {
        const cell = { x, y };
        const tile = grid[y][x];

        if (tile) {
          const positions = findFarthestPosition(cell, direction);
          const next = grid[positions.next.y][positions.next.x];

          // Birleştirme mantığı
          if (next && next.value === tile.value && !next.merged) {
            // İki karo birleşecek
            const mergedValue = tile.value * 2;
            grid[positions.next.y][positions.next.x] = {
              value: mergedValue,
              merged: true,
              isNew: false
            };
            grid[y][x] = null;

            // Skoru güncelle
            score += mergedValue;
            updateScore();

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

  // Yön kontrolü için tarama sırasını belirle
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

  // Verilen hücre için gidilebilecek en uzak pozisyonu bul
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

  // Verilen pozisyonun grid sınırları içinde olup olmadığını kontrol et
  function isWithinBounds(position) {
    return position.x >= 0 && position.x < GRID_SIZE && 
           position.y >= 0 && position.y < GRID_SIZE;
  }

  // Hala hareket edebilir miyiz?
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
            // Komşu karo aynı değere sahip mi?
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

  // Skor göstergesini güncelle
  function updateScore() {
    scoreDisplay.textContent = score;

    // En iyi skoru güncelle
    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.textContent = bestScore;
      localStorage.setItem('2048-best-score', bestScore);
    }

    // Skor animasyonu ekle
    const addition = document.createElement('div');
    addition.className = 'score-addition';
    addition.textContent = '+' + (score - parseInt(scoreDisplay.textContent) + score);
    scoreDisplay.appendChild(addition);

    // Animasyon bitiminde temizle
    setTimeout(() => {
      addition.remove();
    }, 600);
  }

  // Oyunu yeniden başlat
  function restartGame() {
    // Tüm oyun değişkenlerini sıfırla
    grid = [];
    score = 0;
    gameWon = false;
    gameOver = false;
    keepPlaying = false;

    // UI'ı güncelle
    scoreDisplay.textContent = '0';
    messageContainer.style.display = 'none';

    // Yeni oyun başlat
    initGame();
  }

  // "Oynamaya Devam Et" seçeneği
  function continueGame() {
    keepPlaying = true;
    messageContainer.style.display = 'none';
  }

  // Oyun kazanıldı mesajını göster
  function showGameWonMessage() {
    messageContent.textContent = 'Tebrikler! 2048\'e ulaştın!';
    messageContainer.className = 'game-message game-won';
    keepPlayingButton.style.display = 'inline-block';
    messageContainer.style.display = 'flex';
  }

  // Oyun bitti mesajını göster
  function showGameOverMessage() {
    messageContent.textContent = 'Oyun Bitti!';
    messageContainer.className = 'game-message game-over';
    keepPlayingButton.style.display = 'none';
    messageContainer.style.display = 'flex';

    // Sunucuya skoru kaydet
    saveScore();
  }

  // Dokunmatik cihazlar için kaydırma desteği
  function setupTouchEvents() {
    let touchStartX, touchStartY;
    let touchEndX, touchEndY;

    document.addEventListener('touchstart', function(event) {
      if (event.touches.length > 1) return; // Çoklu dokunuşları görmezden gel

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      event.preventDefault();
    }, false);

    document.addEventListener('touchend', function(event) {
      if (!touchStartX || !touchStartY) return;

      touchEndX = event.changedTouches[0].clientX;
      touchEndY = event.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      // Yatay ve dikey kaydırma mesafelerini karşılaştır
      if (Math.abs(dx) > Math.abs(dy)) {
        // Yatay kaydırma
        if (dx > 0) {
          // Sağa kaydırma
          handleKeyPress({ key: 'ArrowRight', preventDefault: () => {} });
        } else {
          // Sola kaydırma
          handleKeyPress({ key: 'ArrowLeft', preventDefault: () => {} });
        }
      } else {
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
    }, false);
  }

  // Skoru sunucuya kaydeden fonksiyon
  function saveScore() {
    // API endpoint ve veriler
    const url = '/api/save_score';
    const data = {
      game_id: '2048',
      score: score,
      difficulty: 'standard'
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

      // Seviye atlama veya yüksek skor durumunda bildirim göster
      if (data.is_level_up || data.is_high_score) {
        const achievementMessage = document.createElement('div');
        achievementMessage.className = 'achievement-message';
        achievementMessage.innerHTML = `
          <div class="achievement-content">
            <i class="fas ${data.is_level_up ? 'fa-level-up-alt' : 'fa-trophy'}"></i>
            <p>${data.is_level_up ? 'Seviye Atladın!' : 'Yeni Yüksek Skor!'}</p>
            <span>${data.is_level_up ? `Yeni Seviye: ${data.level}` : `Skor: ${score}`}</span>
          </div>
        `;

        document.body.appendChild(achievementMessage);

        // 3 saniye sonra bildirim kaybolsun
        setTimeout(() => {
          achievementMessage.style.opacity = '0';
          setTimeout(() => {
            achievementMessage.remove();
          }, 500);
        }, 3000);
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
});