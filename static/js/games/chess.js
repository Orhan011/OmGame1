
document.addEventListener('DOMContentLoaded', function() {
  const chessBoard = document.getElementById('chessBoard');
  const turnIndicator = document.getElementById('turnIndicator');
  const gameStatus = document.getElementById('gameStatus');
  const moveList = document.getElementById('moveList');
  const startBtn = document.getElementById('startBtn');
  const undoBtn = document.getElementById('undoBtn');
  const flipBtn = document.getElementById('flipBtn');
  const restartBtn = document.getElementById('restartBtn');
  const whiteTime = document.getElementById('whiteTime');
  const blackTime = document.getElementById('blackTime');
  const promotionModal = document.getElementById('promotionModal');
  const gameOverModal = document.getElementById('gameOverModal');
  const gameOverMessage = document.getElementById('gameOverMessage');
  const totalMoves = document.getElementById('totalMoves');
  const gameTime = document.getElementById('gameTime');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const analysisBtn = document.getElementById('analysisBtn');

  // Oyun durumu
  let board = [];
  let currentPlayer = 'white';
  let selectedPiece = null;
  let gameStarted = false;
  let boardFlipped = false;
  let moves = [];
  let gameTimer = null;
  let gameSeconds = 0;
  let whiteClock = 600; // 10 dakika
  let blackClock = 600; // 10 dakika
  let clockTimer = null;
  
  // Taş değerleri
  const pieces = {
    'white': {
      'pawn': '♙',
      'rook': '♖',
      'knight': '♘',
      'bishop': '♗',
      'queen': '♕',
      'king': '♔'
    },
    'black': {
      'pawn': '♟',
      'rook': '♜',
      'knight': '♞',
      'bishop': '♝',
      'queen': '♛',
      'king': '♚'
    }
  };
  
  // Tahtayı oluştur
  function initializeBoard() {
    board = [];
    chessBoard.innerHTML = '';

    // 8x8 tahta oluştur
    for (let row = 0; row < 8; row++) {
      const boardRow = [];
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.classList.add('chess-square');
        
        // Siyah/beyaz kareleri belirle
        if ((row + col) % 2 === 0) {
          square.classList.add('white-square');
        } else {
          square.classList.add('black-square');
        }
        
        // Koordinatları ekle
        square.dataset.row = row;
        square.dataset.col = col;
        
        // Tıklama olayını ekle
        square.addEventListener('click', handleSquareClick);
        
        chessBoard.appendChild(square);
        
        // Dizide kareyi sakla
        boardRow.push({
          element: square,
          piece: null,
          color: null,
          pieceType: null
        });
      }
      board.push(boardRow);
    }
  }
  
  // Taşları başlangıç pozisyonlarına yerleştir
  function setupPieces() {
    // Piyonlar
    for (let col = 0; col < 8; col++) {
      placePiece(1, col, 'black', 'pawn');
      placePiece(6, col, 'white', 'pawn');
    }
    
    // Kaleler
    placePiece(0, 0, 'black', 'rook');
    placePiece(0, 7, 'black', 'rook');
    placePiece(7, 0, 'white', 'rook');
    placePiece(7, 7, 'white', 'rook');
    
    // Atlar
    placePiece(0, 1, 'black', 'knight');
    placePiece(0, 6, 'black', 'knight');
    placePiece(7, 1, 'white', 'knight');
    placePiece(7, 6, 'white', 'knight');
    
    // Filler
    placePiece(0, 2, 'black', 'bishop');
    placePiece(0, 5, 'black', 'bishop');
    placePiece(7, 2, 'white', 'bishop');
    placePiece(7, 5, 'white', 'bishop');
    
    // Vezirler
    placePiece(0, 3, 'black', 'queen');
    placePiece(7, 3, 'white', 'queen');
    
    // Şahlar
    placePiece(0, 4, 'black', 'king');
    placePiece(7, 4, 'white', 'king');
  }
  
  // Taş yerleştirme
  function placePiece(row, col, color, pieceType) {
    const square = board[row][col];
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('chess-piece');
    pieceElement.textContent = pieces[color][pieceType];
    pieceElement.dataset.pieceType = pieceType;
    pieceElement.dataset.color = color;
    
    square.element.appendChild(pieceElement);
    square.piece = pieceElement;
    square.color = color;
    square.pieceType = pieceType;
  }
  
  // Kare tıklama işleyicisi
  function handleSquareClick(event) {
    if (!gameStarted) return;
    
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    // Tahta çevrilmişse, koordinatları ters çevir
    let actualRow = row;
    let actualCol = col;
    if (boardFlipped) {
      actualRow = 7 - row;
      actualCol = 7 - col;
    }
    
    // Seçili taş yoksa ve boş kareye tıklandıysa
    if (!selectedPiece && !board[actualRow][actualCol].piece) {
      return;
    }
    
    // Seçili taş yoksa ve tıklanan karede taş varsa
    if (!selectedPiece && board[actualRow][actualCol].piece) {
      // Sadece kendi rengindeki taşları seçebilirsin
      if (board[actualRow][actualCol].color !== currentPlayer) {
        return;
      }
      
      selectedPiece = {
        row: actualRow,
        col: actualCol,
        element: board[actualRow][actualCol].element
      };
      
      // Seçili kareyi vurgula
      board[actualRow][actualCol].element.classList.add('selected');
      
      // Olası hamleleri göster
      highlightPossibleMoves(actualRow, actualCol);
      
      return;
    }
    
    // Seçili taş varsa ve farklı bir kareye tıklandıysa
    if (selectedPiece) {
      // Tıklanan kare, seçili karenin aynısıysa seçimi kaldır
      if (selectedPiece.row === actualRow && selectedPiece.col === actualCol) {
        clearSelection();
        return;
      }
      
      // Eğer tıklanan karede kendi taşın varsa, seçimi değiştir
      if (board[actualRow][actualCol].piece && board[actualRow][actualCol].color === currentPlayer) {
        clearSelection();
        selectedPiece = {
          row: actualRow,
          col: actualCol,
          element: board[actualRow][actualCol].element
        };
        
        // Yeni seçilen kareyi vurgula
        board[actualRow][actualCol].element.classList.add('selected');
        
        // Olası hamleleri göster
        highlightPossibleMoves(actualRow, actualCol);
        
        return;
      }
      
      // Hamleyi yap (Burada gerçek satranç kuralları uygulanacak)
      if (isValidMove(selectedPiece.row, selectedPiece.col, actualRow, actualCol)) {
        movePiece(selectedPiece.row, selectedPiece.col, actualRow, actualCol);
        clearSelection();
        
        // Sırayı değiştir
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        updateTurnIndicator();
      }
    }
  }
  
  // Seçimi temizle
  function clearSelection() {
    if (selectedPiece) {
      board[selectedPiece.row][selectedPiece.col].element.classList.remove('selected');
      selectedPiece = null;
      
      // Tüm vurgulamaları kaldır
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          board[row][col].element.classList.remove('highlight');
        }
      }
    }
  }
  
  // Olası hamleleri vurgula (basit versiyon)
  function highlightPossibleMoves(row, col) {
    const piece = board[row][col];
    
    // Burada gerçek satranç kurallarına göre olası hamleler hesaplanmalı
    // Şimdilik basit bir örnek:
    if (piece.pieceType === 'pawn') {
      // Beyaz piyon
      if (piece.color === 'white') {
        // İleri hamle
        if (row > 0 && !board[row-1][col].piece) {
          highlightSquare(row-1, col);
          
          // İlk hamlede 2 kare ilerleyebilir
          if (row === 6 && !board[row-2][col].piece) {
            highlightSquare(row-2, col);
          }
        }
        
        // Çapraz ataklar
        if (row > 0 && col > 0 && board[row-1][col-1].piece && board[row-1][col-1].color !== piece.color) {
          highlightSquare(row-1, col-1);
        }
        
        if (row > 0 && col < 7 && board[row-1][col+1].piece && board[row-1][col+1].color !== piece.color) {
          highlightSquare(row-1, col+1);
        }
      } 
      // Siyah piyon
      else {
        // İleri hamle
        if (row < 7 && !board[row+1][col].piece) {
          highlightSquare(row+1, col);
          
          // İlk hamlede 2 kare ilerleyebilir
          if (row === 1 && !board[row+2][col].piece) {
            highlightSquare(row+2, col);
          }
        }
        
        // Çapraz ataklar
        if (row < 7 && col > 0 && board[row+1][col-1].piece && board[row+1][col-1].color !== piece.color) {
          highlightSquare(row+1, col-1);
        }
        
        if (row < 7 && col < 7 && board[row+1][col+1].piece && board[row+1][col+1].color !== piece.color) {
          highlightSquare(row+1, col+1);
        }
      }
    }
    
    // Diğer taşlar için kurallar eklenecek
  }
  
  // Kareyi vurgula
  function highlightSquare(row, col) {
    if (boardFlipped) {
      board[7-row][7-col].element.classList.add('highlight');
    } else {
      board[row][col].element.classList.add('highlight');
    }
  }
  
  // Hamle geçerliliği kontrolü (basit versiyon)
  function isValidMove(fromRow, fromCol, toRow, toCol) {
    // Şu anda vurgulanan kareler geçerli hamlelerdir, bu nedenle
    // sadece hedef karenin vurgulanıp vurgulanmadığını kontrol ediyoruz
    const targetElement = boardFlipped ? 
      board[7-toRow][7-toCol].element : 
      board[toRow][toCol].element;
    
    return targetElement.classList.contains('highlight');
  }
  
  // Taşı hareket ettir
  function movePiece(fromRow, fromCol, toRow, toCol) {
    const sourcePiece = board[fromRow][fromCol];
    const targetSquare = board[toRow][toCol];
    
    // Hamle kaydını tut
    const moveRecord = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: sourcePiece.pieceType,
      color: sourcePiece.color,
      captured: targetSquare.piece ? {
        piece: targetSquare.pieceType,
        color: targetSquare.color
      } : null
    };
    
    moves.push(moveRecord);
    
    // Hedef karede taş varsa, onu kaldır
    if (targetSquare.piece) {
      targetSquare.element.removeChild(targetSquare.piece);
    }
    
    // Taşı yeni konuma taşı
    const pieceElement = sourcePiece.piece;
    sourcePiece.element.removeChild(pieceElement);
    targetSquare.element.appendChild(pieceElement);
    
    // Hedef kareyi güncelle
    targetSquare.piece = pieceElement;
    targetSquare.color = sourcePiece.color;
    targetSquare.pieceType = sourcePiece.pieceType;
    
    // Kaynak kareyi temizle
    sourcePiece.piece = null;
    sourcePiece.color = null;
    sourcePiece.pieceType = null;
    
    // Animasyon ekle
    pieceElement.classList.add('piece-animated');
    setTimeout(() => {
      pieceElement.classList.remove('piece-animated');
    }, 300);
    
    // Hamle geçmişini güncelle
    updateMoveHistory();
    
    // Geri al düğmesini etkinleştir
    undoBtn.disabled = false;
  }
  
  // Hamle geçmişini güncelle
  function updateMoveHistory() {
    moveList.innerHTML = '';
    
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = i + 1 < moves.length ? moves[i + 1] : null;
      
      const numberElement = document.createElement('div');
      numberElement.classList.add('move-number');
      numberElement.textContent = moveNumber + '.';
      
      const whiteMoveElement = document.createElement('div');
      whiteMoveElement.classList.add('white-move');
      whiteMoveElement.textContent = formatMove(whiteMove);
      
      if (i === moves.length - 1) {
        whiteMoveElement.classList.add('last-move');
      }
      
      moveList.appendChild(numberElement);
      moveList.appendChild(whiteMoveElement);
      
      if (blackMove) {
        const blackMoveElement = document.createElement('div');
        blackMoveElement.classList.add('black-move');
        blackMoveElement.textContent = formatMove(blackMove);
        
        if (i + 1 === moves.length - 1) {
          blackMoveElement.classList.add('last-move');
        }
        
        moveList.appendChild(blackMoveElement);
      } else {
        const emptyElement = document.createElement('div');
        moveList.appendChild(emptyElement);
      }
    }
    
    // Otomatik olarak son hamleye kaydır
    moveList.scrollTop = moveList.scrollHeight;
  }
  
  // Hamleyi formatla
  function formatMove(move) {
    if (!move) return '';
    
    const pieceSymbols = {
      'king': 'K',
      'queen': 'V',
      'rook': 'K',
      'bishop': 'F',
      'knight': 'A',
      'pawn': ''
    };
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const fromFile = files[move.from.col];
    const fromRank = ranks[move.from.row];
    const toFile = files[move.to.col];
    const toRank = ranks[move.to.row];
    
    const pieceSymbol = pieceSymbols[move.piece];
    const captureSymbol = move.captured ? 'x' : '';
    
    // Basit hamle notasyonu
    return `${pieceSymbol}${fromFile}${fromRank}${captureSymbol}${toFile}${toRank}`;
  }
  
  // Dönüş göstergesini güncelle
  function updateTurnIndicator() {
    turnIndicator.textContent = currentPlayer === 'white' ? 
      'Beyaz Oyuncunun Sırası' : 
      'Siyah Oyuncunun Sırası';
    
    // Animasyon efekti için sınıfı güncelle
    turnIndicator.classList.remove('white-turn', 'black-turn');
    turnIndicator.classList.add(currentPlayer === 'white' ? 'white-turn' : 'black-turn');
  }
  
  // Saati güncelle
  function updateClock() {
    if (!gameStarted) return;
    
    if (currentPlayer === 'white') {
      whiteClock--;
    } else {
      blackClock--;
    }
    
    // Saat formatını güncelle
    whiteTime.textContent = formatTime(whiteClock);
    blackTime.textContent = formatTime(blackClock);
    
    // Süre doldu mu kontrolü
    if (whiteClock <= 0 || blackClock <= 0) {
      endGame(whiteClock <= 0 ? 'black' : 'white', 'timeout');
    }
    
    // Oyun süresi sayacını güncelle
    gameSeconds++;
    gameTime.textContent = formatTime(gameSeconds);
  }
  
  // Zamanı biçimlendir
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Oyunu başlat
  function startGame() {
    gameStarted = true;
    currentPlayer = 'white';
    moves = [];
    gameSeconds = 0;
    whiteClock = 600; // 10 dakika
    blackClock = 600; // 10 dakika
    
    // Tahtayı ayarla
    initializeBoard();
    setupPieces();
    
    // UI'ı güncelle
    updateTurnIndicator();
    whiteTime.textContent = formatTime(whiteClock);
    blackTime.textContent = formatTime(blackClock);
    moveList.innerHTML = '';
    gameStatus.textContent = 'Oyun başladı! Beyaz oyuncu başlar.';
    
    // Süreölçeri başlat
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 1000);
    
    // Düğme durumlarını güncelle
    startBtn.textContent = 'Oyun Devam Ediyor';
    startBtn.disabled = true;
    undoBtn.disabled = true;
    
    // Modalları kapat
    promotionModal.style.display = 'none';
    gameOverModal.style.display = 'none';
  }
  
  // Oyunu sonlandır
  function endGame(winner, reason) {
    gameStarted = false;
    
    // Süreölçeri durdur
    if (clockTimer) {
      clearInterval(clockTimer);
    }
    
    // Oyun sonu mesajını hazırla
    let message = '';
    if (reason === 'checkmate') {
      message = `${winner === 'white' ? 'Beyaz' : 'Siyah'} oyuncu şah mat yaptı!`;
    } else if (reason === 'timeout') {
      message = `${winner === 'white' ? 'Beyaz' : 'Siyah'} oyuncu zaman aşımı nedeniyle kazandı!`;
    } else if (reason === 'resign') {
      message = `${winner === 'white' ? 'Siyah' : 'Beyaz'} oyuncu terk etti, ${winner === 'white' ? 'Beyaz' : 'Siyah'} kazandı!`;
    } else if (reason === 'draw') {
      message = 'Oyun berabere bitti!';
    }
    
    // Oyun istatistiklerini güncelle
    totalMoves.textContent = moves.length;
    gameTime.textContent = formatTime(gameSeconds);
    
    // Oyun sonu modalını göster
    gameOverMessage.textContent = message;
    gameOverModal.style.display = 'flex';
    
    // Düğme durumlarını güncelle
    startBtn.textContent = 'Oyunu Başlat';
    startBtn.disabled = false;
  }
  
  // Tahtayı çevir
  function flipBoard() {
    boardFlipped = !boardFlipped;
    
    // Tahtadaki tüm kareleri yeniden düzenle
    const squares = [...chessBoard.children];
    chessBoard.innerHTML = '';
    
    for (let i = squares.length - 1; i >= 0; i--) {
      chessBoard.appendChild(squares[i]);
    }
  }
  
  // Olay dinleyicileri
  startBtn.addEventListener('click', startGame);
  
  flipBtn.addEventListener('click', function() {
    flipBoard();
    clearSelection();
  });
  
  restartBtn.addEventListener('click', function() {
    if (confirm('Oyunu yeniden başlatmak istediğinizden emin misiniz?')) {
      startGame();
    }
  });
  
  undoBtn.addEventListener('click', function() {
    if (!gameStarted || moves.length === 0) return;
    
    // Son hamleyi al
    const lastMove = moves.pop();
    
    // Hamleyi geri al
    const fromRow = lastMove.to.row;
    const fromCol = lastMove.to.col;
    const toRow = lastMove.from.row;
    const toCol = lastMove.from.col;
    
    const sourcePiece = board[fromRow][fromCol];
    const targetSquare = board[toRow][toCol];
    
    // Taşı geri taşı
    const pieceElement = sourcePiece.piece;
    sourcePiece.element.removeChild(pieceElement);
    targetSquare.element.appendChild(pieceElement);
    
    // Taşları güncelle
    targetSquare.piece = pieceElement;
    targetSquare.color = lastMove.color;
    targetSquare.pieceType = lastMove.piece;
    
    // Eğer bir taş alındıysa, onu geri getir
    if (lastMove.captured) {
      const capturedPieceElement = document.createElement('div');
      capturedPieceElement.classList.add('chess-piece');
      capturedPieceElement.textContent = pieces[lastMove.captured.color][lastMove.captured.piece];
      capturedPieceElement.dataset.pieceType = lastMove.captured.piece;
      capturedPieceElement.dataset.color = lastMove.captured.color;
      
      sourcePiece.element.appendChild(capturedPieceElement);
      sourcePiece.piece = capturedPieceElement;
      sourcePiece.color = lastMove.captured.color;
      sourcePiece.pieceType = lastMove.captured.piece;
    } else {
      // Kaynak kareyi temizle
      sourcePiece.piece = null;
      sourcePiece.color = null;
      sourcePiece.pieceType = null;
    }
    
    // Sırayı değiştir
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    updateTurnIndicator();
    
    // Hamle geçmişini güncelle
    updateMoveHistory();
    
    // Düğme durumunu güncelle
    if (moves.length === 0) {
      undoBtn.disabled = true;
    }
  });
  
  playAgainBtn.addEventListener('click', function() {
    gameOverModal.style.display = 'none';
    startGame();
  });
  
  analysisBtn.addEventListener('click', function() {
    gameOverModal.style.display = 'none';
    // Burada analiz özelliği eklenebilir
    alert('Analiz özelliği yakında eklenecek!');
  });
  
  // Yardım butonu için olayı ekleyin
  document.getElementById('helpBtn').addEventListener('click', function() {
    alert('Satranç Oyun Kuralları:\n\n' +
          '1. Beyaz oyuncu başlar.\n' +
          '2. Taşlar belirli kurallara göre hareket eder.\n' +
          '3. Amaç, rakibin şahını mat etmektir.\n\n' +
          'Oynama Şekli:\n' +
          '- Hareket ettirmek istediğiniz taşa tıklayın.\n' +
          '- Ardından, taşı götürmek istediğiniz kareye tıklayın.\n' +
          '- Seçimi iptal etmek için aynı taşa tekrar tıklayın.');
  });
  
  // Ayarlar butonu için olay
  document.getElementById('settingsBtn').addEventListener('click', function() {
    alert('Ayarlar özelliği yakında eklenecek!');
  });
  
  // Tahtayı başlangıçta oluştur
  initializeBoard();
  setupPieces();
});
