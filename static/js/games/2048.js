
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const gridTiles = document.getElementById('grid-tiles');
  const scoreDisplay = document.getElementById('score');
  const bestScoreDisplay = document.getElementById('best-score');
  const newGameButton = document.getElementById('new-game-btn');
  const gameMessage = document.getElementById('game-message');
  const messageContent = document.getElementById('message-content');
  const retryButton = document.getElementById('retry-button');
  const keepGoingButton = document.getElementById('keep-going-button');
  const gameStatus = document.getElementById('game-status');

  // Game State
  const gameState = {
    grid: Array(4).fill().map(() => Array(4).fill(0)),
    score: 0,
    bestScore: localStorage.getItem('2048-best-score') || 0,
    won: false,
    over: false,
    tiles: []
  };

  // Tile positions
  const positions = {
    0: { x: 0, y: 0 },
    1: { x: 0, y: 1 },
    2: { x: 0, y: 2 },
    3: { x: 0, y: 3 },
    4: { x: 1, y: 0 },
    5: { x: 1, y: 1 },
    6: { x: 1, y: 2 },
    7: { x: 1, y: 3 },
    8: { x: 2, y: 0 },
    9: { x: 2, y: 1 },
    10: { x: 2, y: 2 },
    11: { x: 2, y: 3 },
    12: { x: 3, y: 0 },
    13: { x: 3, y: 1 },
    14: { x: 3, y: 2 },
    15: { x: 3, y: 3 }
  };

  // Oyun İşlevleri
  function initGame() {
    // Oyun durumunu sıfırla
    resetGameState();
    
    // Tahta üzerine rastgele 2 kare yerleştir
    addRandomTile();
    addRandomTile();
    
    // Tahtayı görsel olarak güncelle
    updateGrid();
    
    // Skor göstergelerini güncelle
    updateScore();
    
    // Event listener'ları ayarla
    setupEventListeners();
  }

  function resetGameState() {
    gameState.grid = Array(4).fill().map(() => Array(4).fill(0));
    gameState.score = 0;
    gameState.bestScore = localStorage.getItem('2048-best-score') || 0;
    gameState.won = false;
    gameState.over = false;
    gameState.tiles = [];
    
    // DOM elementlerini temizle
    gridTiles.innerHTML = '';
    
    // Mesajı gizle
    gameMessage.classList.remove('show');
    
    // Durum mesajını güncelle
    gameStatus.textContent = 'Tuş takımı ok tuşları veya W, A, S, D ile kontrol edin. Aynı sayıları birleştirerek 2048\'e ulaşın!';
  }

  function updateScore() {
    scoreDisplay.textContent = gameState.score;
    bestScoreDisplay.textContent = gameState.bestScore;
  }

  function setupEventListeners() {
    // Klavye olay dinleyicileri
    document.addEventListener('keydown', handleKeyPress);
    
    // Dokunmatik destek
    let touchStartX, touchStartY, touchEndX, touchEndY;
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, {passive: true});
    
    document.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      
      handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      // Yatay veya dikey hareket belirle
      if (Math.abs(dx) > Math.abs(dy)) {
        // Yatay hareket
        if (dx > 20) {
          // Sağa
          move('right');
        } else if (dx < -20) {
          // Sola
          move('left');
        }
      } else {
        // Dikey hareket
        if (dy > 20) {
          // Aşağı
          move('down');
        } else if (dy < -20) {
          // Yukarı
          move('up');
        }
      }
    }
    
    // Buton olay dinleyicileri
    newGameButton.addEventListener('click', initGame);
    retryButton.addEventListener('click', initGame);
    keepGoingButton.addEventListener('click', function() {
      gameMessage.classList.remove('show');
    });
  }

  function handleKeyPress(e) {
    if (gameState.over) return;
    
    const key = e.key.toLowerCase();
    
    // Tuşa göre hareket yönünü belirle
    switch (key) {
      case 'arrowup':
      case 'w':
        e.preventDefault();
        move('up');
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        move('down');
        break;
      case 'arrowleft':
      case 'a':
        e.preventDefault();
        move('left');
        break;
      case 'arrowright':
      case 'd':
        e.preventDefault();
        move('right');
        break;
    }
  }

  function move(direction) {
    if (gameState.over) return;
    
    // Hareket öncesi grid'in kopyasını al
    const previousGrid = JSON.parse(JSON.stringify(gameState.grid));
    
    let moved = false;
    
    // Yön işleme
    switch (direction) {
      case 'up':
        moved = moveUp();
        break;
      case 'down':
        moved = moveDown();
        break;
      case 'left':
        moved = moveLeft();
        break;
      case 'right':
        moved = moveRight();
        break;
    }
    
    // Eğer gerçek bir hareket yapıldıysa
    if (moved) {
      // Rastgele bir kare ekle
      addRandomTile();
      
      // Görsel güncelleme
      updateGrid();
      
      // Skor güncelleme
      updateScore();
      
      // Oyunun bitip bitmediğini kontrol et
      checkGameOver();
    }
  }

  function moveLeft() {
    let moved = false;
    
    for (let row = 0; row < 4; row++) {
      // Mevcut satırı al
      const currentRow = gameState.grid[row].filter(tile => tile !== 0);
      const resultRow = [];
      
      // Birleştirmeleri işle
      for (let i = 0; i < currentRow.length; i++) {
        if (currentRow[i] === currentRow[i + 1]) {
          const merged = currentRow[i] * 2;
          resultRow.push(merged);
          gameState.score += merged;
          if (merged === 2048 && !gameState.won) {
            gameState.won = true;
            showWinMessage();
          }
          i++; // Birleştirilen kareyi atla
          moved = true;
        } else {
          resultRow.push(currentRow[i]);
        }
      }
      
      // Sonuç satırını 0'larla doldur
      while (resultRow.length < 4) {
        resultRow.push(0);
      }
      
      // Eğer satır değiştiyse
      if (JSON.stringify(gameState.grid[row]) !== JSON.stringify(resultRow)) {
        moved = true;
      }
      
      // Grid'i güncelle
      gameState.grid[row] = resultRow;
    }
    
    return moved;
  }

  function moveRight() {
    let moved = false;
    
    for (let row = 0; row < 4; row++) {
      // Mevcut satırı al ve ters çevir
      const currentRow = gameState.grid[row].filter(tile => tile !== 0).reverse();
      const resultRow = [];
      
      // Birleştirmeleri işle
      for (let i = 0; i < currentRow.length; i++) {
        if (currentRow[i] === currentRow[i + 1]) {
          const merged = currentRow[i] * 2;
          resultRow.push(merged);
          gameState.score += merged;
          if (merged === 2048 && !gameState.won) {
            gameState.won = true;
            showWinMessage();
          }
          i++; // Birleştirilen kareyi atla
          moved = true;
        } else {
          resultRow.push(currentRow[i]);
        }
      }
      
      // Sonuç satırını 0'larla doldur
      while (resultRow.length < 4) {
        resultRow.push(0);
      }
      
      // Sonucu ters çevir ve grid'i güncelle
      resultRow.reverse();
      
      // Eğer satır değiştiyse
      if (JSON.stringify(gameState.grid[row]) !== JSON.stringify(resultRow)) {
        moved = true;
      }
      
      // Grid'i güncelle
      gameState.grid[row] = resultRow;
    }
    
    return moved;
  }

  function moveUp() {
    let moved = false;
    
    for (let col = 0; col < 4; col++) {
      // Mevcut sütunu al
      const currentCol = [];
      for (let row = 0; row < 4; row++) {
        if (gameState.grid[row][col] !== 0) {
          currentCol.push(gameState.grid[row][col]);
        }
      }
      
      const resultCol = [];
      
      // Birleştirmeleri işle
      for (let i = 0; i < currentCol.length; i++) {
        if (currentCol[i] === currentCol[i + 1]) {
          const merged = currentCol[i] * 2;
          resultCol.push(merged);
          gameState.score += merged;
          if (merged === 2048 && !gameState.won) {
            gameState.won = true;
            showWinMessage();
          }
          i++; // Birleştirilen kareyi atla
          moved = true;
        } else {
          resultCol.push(currentCol[i]);
        }
      }
      
      // Sonuç sütununu 0'larla doldur
      while (resultCol.length < 4) {
        resultCol.push(0);
      }
      
      // Önceki sütunun değerlerini sakla
      const previousCol = [];
      for (let row = 0; row < 4; row++) {
        previousCol.push(gameState.grid[row][col]);
      }
      
      // Eğer sütun değiştiyse
      if (JSON.stringify(previousCol) !== JSON.stringify(resultCol)) {
        moved = true;
      }
      
      // Grid'i güncelle
      for (let row = 0; row < 4; row++) {
        gameState.grid[row][col] = resultCol[row];
      }
    }
    
    return moved;
  }

  function moveDown() {
    let moved = false;
    
    for (let col = 0; col < 4; col++) {
      // Mevcut sütunu al
      const currentCol = [];
      for (let row = 0; row < 4; row++) {
        if (gameState.grid[row][col] !== 0) {
          currentCol.push(gameState.grid[row][col]);
        }
      }
      
      currentCol.reverse();
      const resultCol = [];
      
      // Birleştirmeleri işle
      for (let i = 0; i < currentCol.length; i++) {
        if (currentCol[i] === currentCol[i + 1]) {
          const merged = currentCol[i] * 2;
          resultCol.push(merged);
          gameState.score += merged;
          if (merged === 2048 && !gameState.won) {
            gameState.won = true;
            showWinMessage();
          }
          i++; // Birleştirilen kareyi atla
          moved = true;
        } else {
          resultCol.push(currentCol[i]);
        }
      }
      
      // Sonuç sütununu 0'larla doldur
      while (resultCol.length < 4) {
        resultCol.push(0);
      }
      
      // Sonucu ters çevir
      resultCol.reverse();
      
      // Önceki sütunun değerlerini sakla
      const previousCol = [];
      for (let row = 0; row < 4; row++) {
        previousCol.push(gameState.grid[row][col]);
      }
      
      // Eğer sütun değiştiyse
      if (JSON.stringify(previousCol) !== JSON.stringify(resultCol)) {
        moved = true;
      }
      
      // Grid'i güncelle
      for (let row = 0; row < 4; row++) {
        gameState.grid[row][col] = resultCol[3 - row];
      }
    }
    
    return moved;
  }

  function addRandomTile() {
    // Boş hücreleri bul
    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (gameState.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    // Rastgele bir boş hücre seç
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // %90 ihtimalle 2, %10 ihtimalle 4 değerini ata
    const value = Math.random() < 0.9 ? 2 : 4;
    
    // Grid'i güncelle
    gameState.grid[randomCell.row][randomCell.col] = value;
  }

  function updateGrid() {
    // Mevcut kareleri temizle
    gridTiles.innerHTML = '';
    
    // Her hücre için
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = gameState.grid[row][col];
        
        if (value !== 0) {
          // Kare için HTML oluştur
          const tile = document.createElement('div');
          tile.classList.add('tile', `tile-${value}`);
          tile.textContent = value;
          
          // Pozisyonu ayarla
          const position = getPosition(row, col);
          tile.style.top = `${position.top}px`;
          tile.style.left = `${position.left}px`;
          
          // Yeni eklenen kareye animasyon ekle
          if (isNewTile(row, col)) {
            tile.classList.add('tile-new');
          }
          
          // DOM'a ekle
          gridTiles.appendChild(tile);
        }
      }
    }
    
    // En yüksek skoru güncelle
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      localStorage.setItem('2048-best-score', gameState.bestScore);
    }
  }

  function getPosition(row, col) {
    const cellSize = 107.5; // Kare boyutu + kenar boşluğu
    const gridPadding = 15; // Grid kenar dolgusu
    
    return {
      top: gridPadding + row * cellSize,
      left: gridPadding + col * cellSize
    };
  }

  function isNewTile(row, col) {
    // Önceki durumda bu hücrede değer yoksa yeni eklenmiştir
    return true; // Basitleştirme için her zaman true dönüyoruz
  }

  function checkGameOver() {
    // En yüksek skoru güncelle
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      localStorage.setItem('2048-best-score', gameState.bestScore);
    }
    
    // Boş hücre varsa oyun devam eder
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (gameState.grid[row][col] === 0) {
          return;
        }
      }
    }
    
    // Komşu hücrelerde aynı değer var mı kontrol et
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = gameState.grid[row][col];
        
        // Sağdaki hücre
        if (col < 3 && gameState.grid[row][col + 1] === value) {
          return; // Birleştirilebilir komşu var, oyun devam ediyor
        }
        
        // Aşağıdaki hücre
        if (row < 3 && gameState.grid[row + 1][col] === value) {
          return; // Birleştirilebilir komşu var, oyun devam ediyor
        }
      }
    }
    
    // Hiçbir hamle kalmadı, oyun bitti
    gameState.over = true;
    showGameOverMessage();
  }

  function showWinMessage() {
    messageContent.textContent = 'Tebrikler! 2048\'e ulaştınız!';
    gameMessage.classList.add('show');
    keepGoingButton.style.display = 'inline-block';
    
    // Durum mesajını güncelle
    gameStatus.textContent = '2048\'e ulaştınız! Devam ederek daha yüksek skorlar elde edebilirsiniz.';
  }

  function showGameOverMessage() {
    messageContent.textContent = 'Oyun Bitti! Daha fazla hamle kalmadı.';
    gameMessage.classList.add('show');
    keepGoingButton.style.display = 'none';
    
    // Durum mesajını güncelle
    gameStatus.textContent = 'Oyun bitti! Toplam skorunuz: ' + gameState.score;
    
    // Skoru sunucuya gönder
    saveScore();
  }

  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: '2048',
        score: gameState.score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Skor kaydedildi:', data);
    })
    .catch(error => {
      console.error('Skor kaydetme hatası:', error);
    });
  }

  // Oyunu başlat
  initGame();
});
