/**
 * 2048 Oyunu
 * Minimalist ve modern 2048 oyunu
 * 
 * Oyuncular sayıları yukarı, aşağı, sağa ve sola kaydırarak aynı değere sahip 
 * sayıları birleştirir ve 2048'e ulaşmaya çalışır.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const gridTiles = document.getElementById('grid-tiles');
  const scoreDisplay = document.getElementById('score');
  const bestScoreDisplay = document.getElementById('best-score');
  const newGameBtn = document.getElementById('new-game-btn');
  const gameMessage = document.getElementById('game-message');
  const messageContent = gameMessage.querySelector('p');
  const retryButton = document.getElementById('retry-button');
  const keepGoingButton = document.getElementById('keep-going-button');
  const gameStatus = document.getElementById('game-status');

  // Oyun Durumu
  let gameState = {
    grid: Array(4).fill().map(() => Array(4).fill(0)),
    score: 0,
    bestScore: localStorage.getItem('2048-best-score') || 0,
    won: false,
    over: false,
    moved: false,
    // Tile pozisyonları ve değerleri
    tiles: []
  };

  // Yön sabitleri
  const DIRECTIONS = {
    UP: 'up',
    RIGHT: 'right',
    DOWN: 'down',
    LEFT: 'left'
  };

  // Oyunu başlat
  initGame();

  // Oyun İşlevleri

  /**
   * Oyunu başlatır ve tahtayı hazırlar
   */
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

  /**
   * Oyun durumunu sıfırlar
   */
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

  /**
   * Yeni boş bir konuma rastgele karo ekler (2 veya 4 değerinde)
   */
  function addRandomTile() {
    const emptyCells = [];
    
    // Boş hücreleri bul
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (gameState.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    // Boş hücre yoksa çık
    if (emptyCells.length === 0) return;
    
    // Rastgele bir boş hücre seç
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // %90 ihtimalle 2, %10 ihtimalle 4 değerini ata
    const value = Math.random() < 0.9 ? 2 : 4;
    
    // Seçilen hücreye değeri ata
    gameState.grid[cell.row][cell.col] = value;
    
    // Yeni karo oluştur
    const tile = createTile(cell.row, cell.col, value, true);
    gameState.tiles.push(tile);
  }

  /**
   * Yeni bir karo elementi oluşturur ve döndürür
   */
  function createTile(row, col, value, isNew = false) {
    const tileElement = document.createElement('div');
    tileElement.className = `tile tile-${value} ${isNew ? 'tile-new' : ''}`;
    tileElement.textContent = value;
    
    // Pozisyonu hesapla (gap: 10px hesaba katılır)
    const posX = col * 25 + (col * 10) + 10; // %
    const posY = row * 25 + (row * 10) + 10; // %
    
    tileElement.style.top = `${posY}%`;
    tileElement.style.left = `${posX}%`;
    
    // Tile'ı grid'e ekle
    gridTiles.appendChild(tileElement);
    
    return {
      row,
      col,
      value,
      element: tileElement
    };
  }

  /**
   * Oyun tahtasını tamamen yeniden çizer
   */
  function updateGrid() {
    // Tüm tile'ları temizle
    gridTiles.innerHTML = '';
    gameState.tiles = [];
    
    // Yeni tile'ları oluştur
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = gameState.grid[row][col];
        if (value !== 0) {
          const tile = createTile(row, col, value);
          gameState.tiles.push(tile);
        }
      }
    }
  }

  /**
   * Skoru günceller ve en yüksek skoru kontrol eder
   */
  function updateScore() {
    scoreDisplay.textContent = gameState.score;
    
    // En yüksek skor güncellendi mi?
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      bestScoreDisplay.textContent = gameState.bestScore;
      localStorage.setItem('2048-best-score', gameState.bestScore);
    } else {
      bestScoreDisplay.textContent = gameState.bestScore;
    }
  }

  /**
   * Event listener'ları ayarlar
   */
  function setupEventListeners() {
    // Yeni oyun butonu
    newGameBtn.addEventListener('click', () => {
      resetGameState();
      addRandomTile();
      addRandomTile();
      updateGrid();
      updateScore();
    });
    
    // Klavye kontrolleri
    document.addEventListener('keydown', handleKeyPress);
    
    // Mobil swipe desteği
    let touchStartX, touchStartY;
    
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, false);
    
    document.addEventListener('touchmove', function(e) {
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      // Minimum swipe mesafesi
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
        // Yatay swipe daha belirgin ise
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            move(DIRECTIONS.RIGHT);
          } else {
            move(DIRECTIONS.LEFT);
          }
        } 
        // Dikey swipe daha belirgin ise
        else {
          if (dy > 0) {
            move(DIRECTIONS.DOWN);
          } else {
            move(DIRECTIONS.UP);
          }
        }
        
        touchStartX = null;
        touchStartY = null;
        e.preventDefault();
      }
    }, false);
    
    // Yeniden dene ve devam et butonları
    retryButton.addEventListener('click', () => {
      resetGameState();
      addRandomTile();
      addRandomTile();
      updateGrid();
      updateScore();
    });
    
    keepGoingButton.addEventListener('click', () => {
      gameMessage.classList.remove('show');
    });
  }

  /**
   * Klavye tuşlarını işler
   */
  function handleKeyPress(e) {
    if (gameState.over) return;
    
    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        move(DIRECTIONS.UP);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        move(DIRECTIONS.RIGHT);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        move(DIRECTIONS.DOWN);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        move(DIRECTIONS.LEFT);
        e.preventDefault();
        break;
    }
  }

  /**
   * Belirtilen yönde hareket eder
   */
  function move(direction) {
    if (gameState.over) return;
    
    gameState.moved = false;
    
    // Yöne göre hareket et
    switch(direction) {
      case DIRECTIONS.UP:
        moveUp();
        break;
      case DIRECTIONS.RIGHT:
        moveRight();
        break;
      case DIRECTIONS.DOWN:
        moveDown();
        break;
      case DIRECTIONS.LEFT:
        moveLeft();
        break;
    }
    
    // Eğer geçerli bir hareket yapıldıysa
    if (gameState.moved) {
      // Yeni karo ekle
      addRandomTile();
      
      // Tahtayı güncelle
      updateGrid();
      
      // Skoru güncelle
      updateScore();
      
      // Oyun durumunu kontrol et
      checkGameStatus();
      
      // Skoru sunucuya gönder (oyun devam ederken de skor gönderilir)
      if (gameState.score > 0) {
        saveScore();
      }
    }
  }

  /**
   * Yukarı yönde hareket
   */
  function moveUp() {
    for (let col = 0; col < 4; col++) {
      // Her sütun için
      let lastMergedRow = -1; // Son birleştirilen satır
      
      for (let row = 1; row < 4; row++) {
        if (gameState.grid[row][col] !== 0) {
          let currentRow = row;
          
          // Taşıyabildiğimiz kadar yukarı taşı
          while (currentRow > 0 && gameState.grid[currentRow - 1][col] === 0) {
            gameState.grid[currentRow - 1][col] = gameState.grid[currentRow][col];
            gameState.grid[currentRow][col] = 0;
            currentRow--;
            gameState.moved = true;
          }
          
          // Yukarıdaki karo ile birleştirilebilir mi kontrol et
          if (currentRow > 0 && 
              gameState.grid[currentRow - 1][col] === gameState.grid[currentRow][col] && 
              currentRow - 1 > lastMergedRow) {
            // Birleştir
            gameState.grid[currentRow - 1][col] *= 2;
            gameState.grid[currentRow][col] = 0;
            
            // Skoru güncelle
            gameState.score += gameState.grid[currentRow - 1][col];
            
            // Bu satırı işaretle (aynı satırda tekrar birleşme olmasın)
            lastMergedRow = currentRow - 1;
            
            gameState.moved = true;
          }
        }
      }
    }
  }

  /**
   * Sağa doğru hareket
   */
  function moveRight() {
    for (let row = 0; row < 4; row++) {
      // Her satır için
      let lastMergedCol = 4; // Son birleştirilen sütun
      
      for (let col = 2; col >= 0; col--) {
        if (gameState.grid[row][col] !== 0) {
          let currentCol = col;
          
          // Taşıyabildiğimiz kadar sağa taşı
          while (currentCol < 3 && gameState.grid[row][currentCol + 1] === 0) {
            gameState.grid[row][currentCol + 1] = gameState.grid[row][currentCol];
            gameState.grid[row][currentCol] = 0;
            currentCol++;
            gameState.moved = true;
          }
          
          // Sağdaki karo ile birleştirilebilir mi kontrol et
          if (currentCol < 3 && 
              gameState.grid[row][currentCol + 1] === gameState.grid[row][currentCol] && 
              currentCol + 1 < lastMergedCol) {
            // Birleştir
            gameState.grid[row][currentCol + 1] *= 2;
            gameState.grid[row][currentCol] = 0;
            
            // Skoru güncelle
            gameState.score += gameState.grid[row][currentCol + 1];
            
            // Bu sütunu işaretle (aynı sütunda tekrar birleşme olmasın)
            lastMergedCol = currentCol + 1;
            
            gameState.moved = true;
          }
        }
      }
    }
  }

  /**
   * Aşağı doğru hareket
   */
  function moveDown() {
    for (let col = 0; col < 4; col++) {
      // Her sütun için
      let lastMergedRow = 4; // Son birleştirilen satır
      
      for (let row = 2; row >= 0; row--) {
        if (gameState.grid[row][col] !== 0) {
          let currentRow = row;
          
          // Taşıyabildiğimiz kadar aşağı taşı
          while (currentRow < 3 && gameState.grid[currentRow + 1][col] === 0) {
            gameState.grid[currentRow + 1][col] = gameState.grid[currentRow][col];
            gameState.grid[currentRow][col] = 0;
            currentRow++;
            gameState.moved = true;
          }
          
          // Aşağıdaki karo ile birleştirilebilir mi kontrol et
          if (currentRow < 3 && 
              gameState.grid[currentRow + 1][col] === gameState.grid[currentRow][col] && 
              currentRow + 1 < lastMergedRow) {
            // Birleştir
            gameState.grid[currentRow + 1][col] *= 2;
            gameState.grid[currentRow][col] = 0;
            
            // Skoru güncelle
            gameState.score += gameState.grid[currentRow + 1][col];
            
            // Bu satırı işaretle (aynı satırda tekrar birleşme olmasın)
            lastMergedRow = currentRow + 1;
            
            gameState.moved = true;
          }
        }
      }
    }
  }

  /**
   * Sola doğru hareket
   */
  function moveLeft() {
    for (let row = 0; row < 4; row++) {
      // Her satır için
      let lastMergedCol = -1; // Son birleştirilen sütun
      
      for (let col = 1; col < 4; col++) {
        if (gameState.grid[row][col] !== 0) {
          let currentCol = col;
          
          // Taşıyabildiğimiz kadar sola taşı
          while (currentCol > 0 && gameState.grid[row][currentCol - 1] === 0) {
            gameState.grid[row][currentCol - 1] = gameState.grid[row][currentCol];
            gameState.grid[row][currentCol] = 0;
            currentCol--;
            gameState.moved = true;
          }
          
          // Soldaki karo ile birleştirilebilir mi kontrol et
          if (currentCol > 0 && 
              gameState.grid[row][currentCol - 1] === gameState.grid[row][currentCol] && 
              currentCol - 1 > lastMergedCol) {
            // Birleştir
            gameState.grid[row][currentCol - 1] *= 2;
            gameState.grid[row][currentCol] = 0;
            
            // Skoru güncelle
            gameState.score += gameState.grid[row][currentCol - 1];
            
            // Bu sütunu işaretle (aynı sütunda tekrar birleşme olmasın)
            lastMergedCol = currentCol - 1;
            
            gameState.moved = true;
          }
        }
      }
    }
  }

  /**
   * Oyun durumunu kontrol eder (kazanma, kaybetme)
   */
  function checkGameStatus() {
    // 2048'e ulaşılmış mı kontrol et (ilk kez ulaşıldığında)
    if (!gameState.won) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (gameState.grid[row][col] === 2048) {
            gameState.won = true;
            showWinMessage();
            return;
          }
        }
      }
    }
    
    // Boş hücre var mı kontrol et
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (gameState.grid[row][col] === 0) {
          return; // Hala boş hücreler var, oyun devam ediyor
        }
      }
    }
    
    // Birleştirilebilir komşu karolar var mı kontrol et
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = gameState.grid[row][col];
        
        // Sağdaki karo ile kontrol
        if (col < 3 && gameState.grid[row][col + 1] === value) {
          return; // Birleştirilebilir komşu var, oyun devam ediyor
        }
        
        // Aşağıdaki karo ile kontrol
        if (row < 3 && gameState.grid[row + 1][col] === value) {
          return; // Birleştirilebilir komşu var, oyun devam ediyor
        }
      }
    }
    
    // Hiçbir hamle kalmadı, oyun bitti
    gameState.over = true;
    showGameOverMessage();
  }

  /**
   * Kazanma mesajını gösterir
   */
  function showWinMessage() {
    messageContent.textContent = 'Tebrikler! 2048\'e ulaştınız!';
    gameMessage.classList.add('show');
    keepGoingButton.style.display = 'inline-block';
    
    // Durum mesajını güncelle
    gameStatus.textContent = '2048\'e ulaştınız! Devam ederek daha yüksek skorlar elde edebilirsiniz.';
  }

  /**
   * Oyun sonu mesajını gösterir
   */
  function showGameOverMessage() {
    messageContent.textContent = 'Oyun Bitti! Daha fazla hamle kalmadı.';
    gameMessage.classList.add('show');
    keepGoingButton.style.display = 'none';
    
    // Durum mesajını güncelle
    gameStatus.textContent = 'Oyun bitti! Toplam skorunuz: ' + gameState.score;
    
    // Skoru sunucuya gönder
    saveScore();
  }

  /**
   * Skoru sunucuya kaydeder
   */
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
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }
});