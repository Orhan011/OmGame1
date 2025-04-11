
/**
 * Mayın Tarlası Oyunu
 * Modern ve tamamen işlevsel Mayın Tarlası oyunu
 */

document.addEventListener('DOMContentLoaded', function() {
  // Oyun durumu
  let gameState = {
    width: 9,
    height: 9,
    mines: 10,
    board: [],
    firstClick: true,
    gameOver: false,
    minesMarked: 0,
    cellsRevealed: 0,
    timer: 0,
    timerInterval: null,
    difficulty: 'beginner',
    hintUsed: false,
    hints: []
  };
  
  // DOM elementleri
  const mineField = document.getElementById('mine-field');
  const minesLeftDisplay = document.getElementById('mines-left');
  const timerDisplay = document.getElementById('timer');
  const difficultySelect = document.getElementById('difficulty-select');
  const firstClickSafe = document.getElementById('first-click-safe');
  const highlightSuggestions = document.getElementById('highlight-suggestions');
  const newGameBtn = document.getElementById('new-game-btn');
  const helpBtn = document.getElementById('help-btn');
  const hintBtn = document.getElementById('hint-btn');
  const helpPanel = document.getElementById('help-panel');
  const closeHelpBtn = document.getElementById('close-help-btn');
  
  // Modal elementleri
  const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
  const modalTitle = document.getElementById('modal-title');
  const winMessage = document.getElementById('win-message');
  const loseMessage = document.getElementById('lose-message');
  const resultTime = document.getElementById('result-time');
  const resultDifficulty = document.getElementById('result-difficulty');
  const resultMines = document.getElementById('result-mines');
  const newGameModalBtn = document.getElementById('new-game-modal');
  
  // İpucu modal elementleri
  const hintModal = new bootstrap.Modal(document.getElementById('hint-modal'));
  const hintText = document.getElementById('hint-text');
  const showHintBtn = document.getElementById('show-hint-btn');
  
  // Yeni oyun başlat
  function initGame() {
    // Zorluk seviyesine göre ayarlamaları yap
    setDifficultySettings();
    
    // Tahtayı sıfırla
    gameState.board = [];
    gameState.firstClick = true;
    gameState.gameOver = false;
    gameState.minesMarked = 0;
    gameState.cellsRevealed = 0;
    gameState.hintUsed = false;
    gameState.hints = [];
    
    // Zamanlayıcıyı sıfırla
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    gameState.timer = 0;
    updateTimerDisplay();
    
    // Mayın sayacını güncelle
    updateMineCounter();
    
    // Oyun tahtasını oluştur
    createBoard();
  }
  
  // Zorluk ayarlarını belirle
  function setDifficultySettings() {
    gameState.difficulty = difficultySelect.value;
    
    switch (gameState.difficulty) {
      case 'beginner':
        gameState.width = 9;
        gameState.height = 9;
        gameState.mines = 10;
        break;
      case 'intermediate':
        gameState.width = 16;
        gameState.height = 16;
        gameState.mines = 40;
        break;
      case 'expert':
        gameState.width = 30;
        gameState.height = 16;
        gameState.mines = 99;
        break;
    }
    
    // Grid kolonlarını ayarla
    mineField.style.gridTemplateColumns = `repeat(${gameState.width}, 1fr)`;
  }
  
  // Tahtayı oluştur
  function createBoard() {
    mineField.innerHTML = '';
    
    // Boş tahtayı oluştur
    for (let y = 0; y < gameState.height; y++) {
      let row = [];
      for (let x = 0; x < gameState.width; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Sol tıklama - hücreyi aç
        cell.addEventListener('click', (e) => {
          if (gameState.gameOver) return;
          revealCell(x, y);
        });
        
        // Sağ tıklama - bayrak işaretle
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (gameState.gameOver) return;
          toggleFlag(x, y);
        });
        
        // Çift tıklama - etraftaki hücreleri aç
        cell.addEventListener('dblclick', (e) => {
          if (gameState.gameOver) return;
          chordCells(x, y);
        });
        
        // Mobil cihazlar için uzun basma - bayrak işaretle
        let pressTimer;
        cell.addEventListener('touchstart', (e) => {
          if (gameState.gameOver) return;
          
          pressTimer = setTimeout(() => {
            toggleFlag(x, y);
          }, 500);
        });
        
        cell.addEventListener('touchend', () => {
          clearTimeout(pressTimer);
        });
        
        mineField.appendChild(cell);
        
        // Hücre durumu: { isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 }
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          isQuestion: false,
          neighborMines: 0
        });
      }
      gameState.board.push(row);
    }
  }
  
  // Mayınları yerleştir
  function placeMines(clickX, clickY) {
    let minesPlaced = 0;
    
    // İlk tıklanan hücre ve komşuları için güvenli alan oluştur
    const safeArea = [];
    if (firstClickSafe.checked) {
      for (let y = Math.max(0, clickY - 1); y <= Math.min(gameState.height - 1, clickY + 1); y++) {
        for (let x = Math.max(0, clickX - 1); x <= Math.min(gameState.width - 1, clickX + 1); x++) {
          safeArea.push({x, y});
        }
      }
    } else {
      safeArea.push({x: clickX, y: clickY});
    }
    
    // Mayınları rastgele yerleştir
    while (minesPlaced < gameState.mines) {
      const x = Math.floor(Math.random() * gameState.width);
      const y = Math.floor(Math.random() * gameState.height);
      
      // Güvenli alanda mayın olmamalı
      if (safeArea.some(pos => pos.x === x && pos.y === y)) {
        continue;
      }
      
      // Bu konumda zaten mayın var mı kontrol et
      if (!gameState.board[y][x].isMine) {
        gameState.board[y][x].isMine = true;
        minesPlaced++;
      }
    }
    
    // Komşu mayın sayılarını hesapla
    calculateNeighborMines();
  }
  
  // Hücrenin komşu mayın sayısını hesapla
  function calculateNeighborMines() {
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        if (gameState.board[y][x].isMine) continue;
        
        let count = 0;
        
        // Etraftaki 8 hücreyi kontrol et
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < gameState.width && ny >= 0 && ny < gameState.height) {
              if (gameState.board[ny][nx].isMine) {
                count++;
              }
            }
          }
        }
        
        gameState.board[y][x].neighborMines = count;
      }
    }
  }
  
  // Hücreyi aç
  function revealCell(x, y) {
    // Bayrak işaretli ise açma
    if (gameState.board[y][x].isFlagged || gameState.board[y][x].isQuestion) {
      return;
    }
    
    // Zaten açılmış ise bir şey yapma
    if (gameState.board[y][x].isRevealed) {
      return;
    }
    
    // İlk tıklama ise mayınları yerleştir ve zamanlayıcıyı başlat
    if (gameState.firstClick) {
      placeMines(x, y);
      gameState.firstClick = false;
      startTimer();
    }
    
    // Mayın ise oyun biter
    if (gameState.board[y][x].isMine) {
      gameOver(false);
      
      // Tıklanan mayını patlayan mayın olarak göster
      const cell = getCellElement(x, y);
      cell.classList.add('revealed', 'mine-exploded');
      cell.innerHTML = '<i class="fas fa-bomb"></i>';
      
      return;
    }
    
    // Hücreyi aç
    gameState.board[y][x].isRevealed = true;
    gameState.cellsRevealed++;
    
    const cell = getCellElement(x, y);
    cell.classList.add('revealed');
    
    // Komşu mayın sayısını göster
    const neighborMines = gameState.board[y][x].neighborMines;
    if (neighborMines > 0) {
      cell.textContent = neighborMines;
      cell.dataset.mines = neighborMines;
    }
    
    // Komşu mayını olmayan hücrelerin komşularını otomatik aç
    if (neighborMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < gameState.width && ny >= 0 && ny < gameState.height) {
            revealCell(nx, ny);
          }
        }
      }
    }
    
    // Öneriler varsa vurgula
    if (highlightSuggestions.checked && !gameState.firstClick) {
      highlightSafeCells();
    }
    
    // Kazanma durumunu kontrol et
    checkWinCondition();
  }
  
  // Kazanma durumunu kontrol et
  function checkWinCondition() {
    const totalNonMineCells = gameState.width * gameState.height - gameState.mines;
    
    if (gameState.cellsRevealed === totalNonMineCells) {
      gameOver(true);
    }
  }
  
  // Bayrak işaretini aç/kapat
  function toggleFlag(x, y) {
    // Açılmış hücrelere bayrak koyulamaz
    if (gameState.board[y][x].isRevealed) {
      return;
    }
    
    const cell = getCellElement(x, y);
    
    if (!gameState.board[y][x].isFlagged && !gameState.board[y][x].isQuestion) {
      // Bayrak koy
      gameState.board[y][x].isFlagged = true;
      cell.classList.add('flagged');
      cell.innerHTML = '<i class="fas fa-flag"></i>';
      gameState.minesMarked++;
    } else if (gameState.board[y][x].isFlagged) {
      // Soru işareti koy
      gameState.board[y][x].isFlagged = false;
      gameState.board[y][x].isQuestion = true;
      cell.classList.remove('flagged');
      cell.classList.add('question');
      cell.innerHTML = '<i class="fas fa-question"></i>';
      gameState.minesMarked--;
    } else {
      // İşareti kaldır
      gameState.board[y][x].isQuestion = false;
      cell.classList.remove('question');
      cell.innerHTML = '';
    }
    
    updateMineCounter();
    
    // Öneriler varsa vurgula
    if (highlightSuggestions.checked && !gameState.firstClick) {
      highlightSafeCells();
    }
  }
  
  // Güvenli hücreleri vurgula
  function highlightSafeCells() {
    // Önce tüm vurgulamaları temizle
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => {
      cell.classList.remove('highlight-safe', 'highlight-mine');
    });
    
    // Açık hücrelerde, çevrelerindeki bayrak sayısı komşu mayın sayısına eşitse
    // kalan kapalı hücrelerin güvenli olduğunu vurgula
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        if (!gameState.board[y][x].isRevealed || gameState.board[y][x].neighborMines === 0) continue;
        
        let flaggedCount = 0;
        let unknownCells = [];
        
        // Etraftaki bayrak ve bilinmeyen hücreleri say
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < gameState.width && ny >= 0 && ny < gameState.height) {
              if (gameState.board[ny][nx].isFlagged) {
                flaggedCount++;
              } else if (!gameState.board[ny][nx].isRevealed) {
                unknownCells.push({x: nx, y: ny});
              }
            }
          }
        }
        
        // Bayraklar sayıya eşitse, kalan bilinmeyen hücreler güvenlidir
        if (flaggedCount === gameState.board[y][x].neighborMines && unknownCells.length > 0) {
          unknownCells.forEach(pos => {
            const cell = getCellElement(pos.x, pos.y);
            cell.classList.add('highlight-safe');
            
            // İpucu için potansiyel hamle ekle
            if (!gameState.hints.some(hint => hint.x === pos.x && hint.y === pos.y)) {
              gameState.hints.push({
                x: pos.x,
                y: pos.y,
                type: 'safe',
                message: `(${pos.x+1},${pos.y+1}) pozisyonundaki hücre güvenlidir, açabilirsiniz.`
              });
            }
          });
        }
        
        // Bilinmeyen sayısı, kalan mayın sayısına eşitse, hepsi mayındır
        const remainingMines = gameState.board[y][x].neighborMines - flaggedCount;
        if (remainingMines > 0 && unknownCells.length === remainingMines) {
          unknownCells.forEach(pos => {
            const cell = getCellElement(pos.x, pos.y);
            cell.classList.add('highlight-mine');
            
            // İpucu için potansiyel hamle ekle
            if (!gameState.hints.some(hint => hint.x === pos.x && hint.y === pos.y)) {
              gameState.hints.push({
                x: pos.x,
                y: pos.y,
                type: 'mine',
                message: `(${pos.x+1},${pos.y+1}) pozisyonundaki hücre mayındır, bayrakla işaretleyebilirsiniz.`
              });
            }
          });
        }
      }
    }
  }
  
  // Bir sayının etrafındaki hücreleri aç (çift tıklama)
  function chordCells(x, y) {
    // Hücrenin açılmış ve sayı olması gerekiyor
    if (!gameState.board[y][x].isRevealed || gameState.board[y][x].neighborMines === 0) {
      return;
    }
    
    // Etraftaki bayrak sayısını hesapla
    let flaggedCount = 0;
    let cellsToReveal = [];
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < gameState.width && ny >= 0 && ny < gameState.height) {
          if (gameState.board[ny][nx].isFlagged) {
            flaggedCount++;
          } else if (!gameState.board[ny][nx].isRevealed) {
            cellsToReveal.push({x: nx, y: ny});
          }
        }
      }
    }
    
    // Bayraklar sayıya eşitse etraftaki hücreleri aç
    if (flaggedCount === gameState.board[y][x].neighborMines) {
      cellsToReveal.forEach(pos => {
        revealCell(pos.x, pos.y);
      });
    }
  }
  
  // İpucu göster
  function showHint() {
    if (gameState.firstClick) {
      hintText.textContent = "Oyuna başlamak için herhangi bir hücreye tıklayın.";
      hintModal.show();
      return;
    }
    
    if (gameState.hints.length === 0) {
      hintText.textContent = "Şu anda verebileceğim bir ipucu yok. Biraz daha ilerlemeyi deneyin.";
      hintModal.show();
      return;
    }
    
    // Rastgele bir ipucu seç
    const randomHint = gameState.hints[Math.floor(Math.random() * gameState.hints.length)];
    hintText.textContent = randomHint.message;
    
    // İpucunu göster butonu
    showHintBtn.onclick = function() {
      const cell = getCellElement(randomHint.x, randomHint.y);
      cell.classList.add('highlight-hint');
      
      // 3 saniye sonra vurgulamayı kaldır
      setTimeout(() => {
        cell.classList.remove('highlight-hint');
      }, 3000);
      
      hintModal.hide();
    };
    
    hintModal.show();
    gameState.hintUsed = true;
  }
  
  // Oyun sonu
  function gameOver(isWin) {
    gameState.gameOver = true;
    clearInterval(gameState.timerInterval);
    
    // Tüm mayınları ve yanlış bayrakları göster
    if (!isWin) {
      for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
          const cell = getCellElement(x, y);
          
          if (gameState.board[y][x].isMine && !gameState.board[y][x].isFlagged) {
            // Açılmamış mayınları göster
            cell.classList.add('revealed');
            cell.innerHTML = '<i class="fas fa-bomb"></i>';
          } else if (gameState.board[y][x].isFlagged && !gameState.board[y][x].isMine) {
            // Yanlış bayrakları göster
            cell.classList.add('revealed');
            cell.innerHTML = '<i class="fas fa-times text-danger"></i>';
          }
        }
      }
    } else {
      // Kazandıysa tüm mayınlara bayrak koy
      
      // Skorları zorluk seviyesine göre hesapla ve kaydet
      let score = 0;
      let difficultyName = '';
      
      // Zorluk seviyesine göre puan ve isim belirle
      switch (gameState.difficulty) {
        case 'beginner':
          score = Math.max(500, Math.floor(1000 - (gameState.timer * 2)));
          difficultyName = 'easy';
          break;
        case 'intermediate':
          score = Math.max(1000, Math.floor(2000 - (gameState.timer * 2)));
          difficultyName = 'medium';
          break;
        case 'expert':
          score = Math.max(1500, Math.floor(3000 - (gameState.timer * 1.5)));
          difficultyName = 'hard';
          break;
      }
      
      // Skor kaydetme sistemini kullan
      saveScoreAndDisplay('minesweeper', score, gameState.timer, difficultyName, {
        mines: gameState.mines,
        flags: gameState.minesMarked,
        board_size: `${gameState.width}x${gameState.height}`,
        hint_used: gameState.hintUsed
      }, function(scoreDisplayHtml, data) {
        // Skor sonucunu ekrana yerleştir
        document.getElementById('score-display-container').innerHTML = scoreDisplayHtml;
      });
      for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
          if (gameState.board[y][x].isMine && !gameState.board[y][x].isFlagged) {
            const cell = getCellElement(x, y);
            cell.classList.add('flagged');
            cell.innerHTML = '<i class="fas fa-flag"></i>';
          }
        }
      }
      gameState.minesMarked = gameState.mines;
      updateMineCounter();
    }
    
    // Sonuç ekranını göster
    modalTitle.textContent = isWin ? 'Tebrikler!' : 'Oyun Bitti!';
    winMessage.style.display = isWin ? 'block' : 'none';
    loseMessage.style.display = isWin ? 'none' : 'block';
    
    // Sonuç istatistiklerini göster (puan bilgileri gizlendi)
    resultTime.textContent = formatTime(gameState.timer);
    
    switch (gameState.difficulty) {
      case 'beginner':
        resultDifficulty.textContent = 'Kolay';
        break;
      case 'intermediate':
        resultDifficulty.textContent = 'Orta';
        break;
      case 'expert':
        resultDifficulty.textContent = 'Uzman';
        break;
    }
    
    resultMines.textContent = gameState.mines;
    
    // Kazanma durumunda işlemlere devam et
    // Eski skor kaydı kodu kaldırıldı, score-display.js kullanılıyor
    
    // Modalı göster
    resultModal.show();
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    gameState.timerInterval = setInterval(() => {
      gameState.timer++;
      updateTimerDisplay();
    }, 1000);
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(gameState.timer);
  }
  
  // Mayın sayacını güncelle
  function updateMineCounter() {
    const minesLeft = gameState.mines - gameState.minesMarked;
    minesLeftDisplay.textContent = minesLeft;
  }
  
  // Zamanı formatla
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Hücre elementini bul
  function getCellElement(x, y) {
    return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  }
  
  // Yardım panelini aç/kapat
  function toggleHelpPanel() {
    helpPanel.classList.toggle('hidden');
  }
  
  // Event Listeners
  newGameBtn.addEventListener('click', initGame);
  newGameModalBtn.addEventListener('click', () => {
    resultModal.hide();
    initGame();
  });
  
  difficultySelect.addEventListener('change', initGame);
  
  helpBtn.addEventListener('click', toggleHelpPanel);
  closeHelpBtn.addEventListener('click', toggleHelpPanel);
  
  highlightSuggestions.addEventListener('change', () => {
    if (highlightSuggestions.checked && !gameState.firstClick) {
      highlightSafeCells();
    } else {
      // Vurgulamaları kaldır
      const allCells = document.querySelectorAll('.cell');
      allCells.forEach(cell => {
        cell.classList.remove('highlight-safe', 'highlight-mine');
      });
    }
  });
  
  hintBtn.addEventListener('click', showHint);
  
  // İlk yükleme
  initGame();
});
