
// Satranç tahtası ve oyun durumu
let board = [];
let selectedPiece = null;
let currentTurn = 'white'; // 'white' veya 'black'
let moveCount = 1;
let moveHistory = [];
let isBoardFlipped = false;
let soundEnabled = true;
let lastMove = null;
let gameStartTime = null;
let gameTimer = null;
let whiteTimeSpent = 0;
let blackTimeSpent = 0;
let gameEndType = null; // 'checkmate', 'stalemate', 'resignation', 'time'
let capturedPieces = { white: [], black: [] };

// Ses efektleri
const sounds = {
  move: new Audio('/static/sounds/click.mp3'),
  capture: new Audio('/static/sounds/correct.mp3'),
  check: new Audio('/static/sounds/number.mp3'),
  illegal: new Audio('/static/sounds/wrong.mp3'),
  gameEnd: new Audio('/static/sounds/game-over.mp3')
};

// DOM referansları
const chessBoard = document.getElementById('chess-board');
const gameStatus = document.getElementById('game-status');
const moveCounter = document.getElementById('move-counter');
const currentTurnEl = document.getElementById('current-turn');
const moveHistoryEl = document.getElementById('move-history');
const newGameBtn = document.getElementById('new-game-btn');
const undoMoveBtn = document.getElementById('undo-move');
const flipBoardBtn = document.getElementById('flip-board');
const soundToggle = document.getElementById('sound-toggle');

// Taş türleri ve değerleri
const PIECES = {
  'white-pawn': { type: 'pawn', color: 'white', value: 1, symbol: '♙' },
  'white-rook': { type: 'rook', color: 'white', value: 5, symbol: '♖' },
  'white-knight': { type: 'knight', color: 'white', value: 3, symbol: '♘' },
  'white-bishop': { type: 'bishop', color: 'white', value: 3, symbol: '♗' },
  'white-queen': { type: 'queen', color: 'white', value: 9, symbol: '♕' },
  'white-king': { type: 'king', color: 'white', value: 0, symbol: '♔' },
  'black-pawn': { type: 'pawn', color: 'black', value: 1, symbol: '♟' },
  'black-rook': { type: 'rook', color: 'black', value: 5, symbol: '♜' },
  'black-knight': { type: 'knight', color: 'black', value: 3, symbol: '♞' },
  'black-bishop': { type: 'bishop', color: 'black', value: 3, symbol: '♝' },
  'black-queen': { type: 'queen', color: 'black', value: 9, symbol: '♛' },
  'black-king': { type: 'king', color: 'black', value: 0, symbol: '♚' },
};

// Oyunu başlat
function initGame() {
  createBoard();
  setupPieces();
  renderBoard();

  // Event Listeners
  newGameBtn.addEventListener('click', resetGame);
  undoMoveBtn.addEventListener('click', undoMove);
  flipBoardBtn.addEventListener('click', flipBoard);
  soundToggle.addEventListener('click', toggleSound);
}

// Tahtayı oluştur
function createBoard() {
  chessBoard.innerHTML = '';
  board = [];
  
  const boardColors = isBoardFlipped ? ['black-square', 'white-square'] : ['white-square', 'black-square'];
  
  for (let row = 0; row < 8; row++) {
    const boardRow = [];
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = `chess-square ${(row + col) % 2 === 0 ? boardColors[0] : boardColors[1]}`;
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener('click', handleSquareClick);
      chessBoard.appendChild(square);
      
      boardRow.push({ piece: null, row, col });
    }
    board.push(boardRow);
  }
}

// Taşları diziliş pozisyonuna yerleştir
function setupPieces() {
  // Piyonları yerleştir
  for (let col = 0; col < 8; col++) {
    placePiece(1, col, 'black-pawn');
    placePiece(6, col, 'white-pawn');
  }
  
  // Kaleleri yerleştir
  placePiece(0, 0, 'black-rook');
  placePiece(0, 7, 'black-rook');
  placePiece(7, 0, 'white-rook');
  placePiece(7, 7, 'white-rook');
  
  // Atları yerleştir
  placePiece(0, 1, 'black-knight');
  placePiece(0, 6, 'black-knight');
  placePiece(7, 1, 'white-knight');
  placePiece(7, 6, 'white-knight');
  
  // Filleri yerleştir
  placePiece(0, 2, 'black-bishop');
  placePiece(0, 5, 'black-bishop');
  placePiece(7, 2, 'white-bishop');
  placePiece(7, 5, 'white-bishop');
  
  // Veziri yerleştir
  placePiece(0, 3, 'black-queen');
  placePiece(7, 3, 'white-queen');
  
  // Şahı yerleştir
  placePiece(0, 4, 'black-king');
  placePiece(7, 4, 'white-king');
}

// Bir taşı belirli bir konuma yerleştir
function placePiece(row, col, pieceType) {
  board[row][col].piece = pieceType;
}

// Tahtayı güncelle ve render et
function renderBoard() {
  const squares = document.querySelectorAll('.chess-square');
  squares.forEach(square => {
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    // Tüm vurgu sınıflarını temizle
    square.classList.remove('last-move-from', 'last-move-to', 'check-highlight');
    
    // Mevcut içeriği temizle
    square.innerHTML = '';
    
    // Son hamleyi vurgula
    if (lastMove) {
      if (row === lastMove.fromRow && col === lastMove.fromCol) {
        square.classList.add('last-move-from');
      }
      if (row === lastMove.toRow && col === lastMove.toCol) {
        square.classList.add('last-move-to');
      }
    }
    
    // Eğer şah mat veya şah durumu varsa, şahı vurgula
    if (isKingInCheck(currentTurn)) {
      // Şahın konumunu bul
      let kingRow = -1;
      let kingCol = -1;
      
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c].piece === `${currentTurn}-king`) {
            kingRow = r;
            kingCol = c;
            break;
          }
        }
        if (kingRow !== -1) break;
      }
      
      if (row === kingRow && col === kingCol) {
        square.classList.add('check-highlight');
      }
    }
    
    // Taşı render et
    const pieceType = board[row][col].piece;
    if (pieceType) {
      const pieceEl = document.createElement('div');
      pieceEl.className = 'chess-piece';
      pieceEl.textContent = PIECES[pieceType].symbol;
      pieceEl.style.color = PIECES[pieceType].color === 'white' ? '#FFF' : '#000';
      
      // Taş animasyonu
      if (lastMove && row === lastMove.toRow && col === lastMove.toCol) {
        pieceEl.classList.add('piece-animated');
      }
      
      square.appendChild(pieceEl);
    }
  });
  
  // Hamle sayacını güncelle
  moveCounter.textContent = Math.ceil(moveCount / 2);
  
  // Sıra bilgisini güncelle
  currentTurnEl.textContent = currentTurn === 'white' ? 'Beyaz' : 'Siyah';
  
  // Oyun durumunu güncelle
  if (gameEndType === 'checkmate') {
    gameStatus.textContent = `Şah Mat! ${currentTurn === 'white' ? 'Siyah' : 'Beyaz'} oyuncu kazandı`;
    gameStatus.className = 'chess-indicator winner';
  } else if (gameEndType === 'stalemate') {
    gameStatus.textContent = `Pat! Oyun berabere bitti`;
    gameStatus.className = 'chess-indicator draw';
  } else if (isKingInCheck(currentTurn)) {
    gameStatus.textContent = `Şah! ${currentTurn === 'white' ? 'Beyaz' : 'Siyah'} oyuncu tehdit altında`;
    gameStatus.className = 'chess-indicator check';
  } else {
    gameStatus.textContent = `Hamle ${moveCount}: ${currentTurn === 'white' ? 'Beyaz' : 'Siyah'} oyuncunun sırası`;
    gameStatus.className = 'chess-indicator';
  }
  
  // Zaman bilgisini güncelle
  if (document.getElementById('white-time') && document.getElementById('black-time')) {
    document.getElementById('white-time').textContent = formatTime(whiteTimeSpent);
    document.getElementById('black-time').textContent = formatTime(blackTimeSpent);
  }
}

// Kare tıklandığında
function handleSquareClick(event) {
  const square = event.currentTarget;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  
  // Seçili taş yoksa ve tıklanan karede bir taş varsa
  if (!selectedPiece && board[row][col].piece) {
    // Sadece sırası gelen oyuncu kendi taşlarını hareket ettirebilir
    const piece = PIECES[board[row][col].piece];
    if (piece.color !== currentTurn) {
      playSound('illegal');
      return;
    }
    
    selectedPiece = { row, col };
    square.classList.add('selected');
    
    // Olası hareketleri göster
    showPossibleMoves(row, col, board[row][col].piece);
  } 
  // Seçili taş varsa ve başka bir kareye tıklandıysa (hareket et)
  else if (selectedPiece) {
    // Seçili taşı kaldır
    const selectedSquare = document.querySelector(`.chess-square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`);
    selectedSquare.classList.remove('selected');
    
    // Highlight'ları temizle
    clearHighlights();
    
    // Aynı kareye tıklandıysa seçimi iptal et
    if (selectedPiece.row === row && selectedPiece.col === col) {
      selectedPiece = null;
      return;
    }
    
    // Hareket geçerli mi kontrol et (şimdilik basit bir kontrol)
    const piece = PIECES[board[selectedPiece.row][selectedPiece.col].piece];
    
    // Basit hareket kontrolü (tam kurallara göre değil)
    if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
      // Eğer varsa karşı taşı al
      const isCapture = board[row][col].piece !== null;
      
      // Hareket bilgisini kaydet
      const moveInfo = {
        piece: board[selectedPiece.row][selectedPiece.col].piece,
        fromRow: selectedPiece.row,
        fromCol: selectedPiece.col,
        toRow: row, 
        toCol: col,
        capturedPiece: board[row][col].piece,
        moveNumber: moveCount
      };
      
      // Taşı hareket ettir
      // Eğer karşı taşı alıyorsa, yakalanan taşlar listesine ekle
      if (isCapture) {
        capturedPieces[currentTurn].push(board[row][col].piece);
        updateCapturedPieces();
      }
      
      // Hareket animasyonu için son hamleyi kaydet
      lastMove = {fromRow: selectedPiece.row, fromCol: selectedPiece.col, toRow: row, toCol: col};
      
      // Taşı hareket ettir
      board[row][col].piece = board[selectedPiece.row][selectedPiece.col].piece;
      board[selectedPiece.row][selectedPiece.col].piece = null;
      
      // Hamle geçmişine ekle
      moveHistory.push(moveInfo);
      
      // Hamle geçmişini güncelle
      updateMoveHistory(moveInfo);
      
      // Şahın tehdit altında olup olmadığını kontrol et
      const isCheck = isKingInCheck(currentTurn === 'white' ? 'black' : 'white');
      
      // Şah mat kontrolü
      const isCheckmate = isCheck && isCheckMate(currentTurn === 'white' ? 'black' : 'white');
      
      // Beraberlik (pat) kontrolü
      const isStalemate = !isCheck && isInStalemate(currentTurn === 'white' ? 'black' : 'white');
      
      // Ses çal
      if (isCheckmate) {
        playSound('gameEnd');
        gameEndType = 'checkmate';
      } else if (isStalemate) {
        playSound('gameEnd');
        gameEndType = 'stalemate';
      } else if (isCheck) {
        playSound('check');
      } else if (isCapture) {
        playSound('capture');
      } else {
        playSound('move');
      }
      
      // Hamle sayısını artır ve sırayı değiştir
      moveCount++;
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      
      // Tahtayı güncelle
      renderBoard();
    } else {
      playSound('illegal');
    }
    
    selectedPiece = null;
  }
}

// Olası hareketleri göster
function showPossibleMoves(row, col, pieceType) {
  const piece = PIECES[pieceType];
  
  // Taş türüne göre olası hareketleri hesapla (basitleştirilmiş)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(row, col, r, c)) {
        const targetSquare = document.querySelector(`.chess-square[data-row="${r}"][data-col="${c}"]`);
        targetSquare.classList.add('highlight');
      }
    }
  }
}

// Geçerli bir hareket mi kontrol et (basitleştirilmiş)
function isValidMove(fromRow, fromCol, toRow, toCol) {
  // Aynı konuma hareket edilemez
  if (fromRow === toRow && fromCol === toCol) return false;
  
  const piece = PIECES[board[fromRow][fromCol].piece];
  const targetPiece = board[toRow][toCol].piece ? PIECES[board[toRow][toCol].piece] : null;
  
  // Kendi taşlarının üzerine hareket edilemez
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  // Taş türüne göre hareket kontrolü
  switch (piece.type) {
    case 'pawn':
      return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
    case 'rook':
      return isValidRookMove(fromRow, fromCol, toRow, toCol);
    case 'knight':
      return isValidKnightMove(fromRow, fromCol, toRow, toCol);
    case 'bishop':
      return isValidBishopMove(fromRow, fromCol, toRow, toCol);
    case 'queen':
      return isValidQueenMove(fromRow, fromCol, toRow, toCol);
    case 'king':
      return isValidKingMove(fromRow, fromCol, toRow, toCol);
    default:
      return false;
  }
}

// Piyon hareketi kontrolü
function isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
  const direction = color === 'white' ? -1 : 1; // Beyaz yukarı, siyah aşağı hareket eder
  const startRow = color === 'white' ? 6 : 1;
  
  // Hedef karede karşı renkte taş var mı?
  const isCapture = board[toRow][toCol].piece !== null;
  
  // Düz hareket
  if (fromCol === toCol && !isCapture) {
    // Bir kare ileri
    if (toRow === fromRow + direction) {
      return true;
    }
    // İlk harekette iki kare ileri
    if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol].piece) {
      return true;
    }
  }
  
  // Çapraz yeme hareketi
  if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && isCapture) {
    return true;
  }
  
  return false;
}

// Kale hareketi kontrolü
function isValidRookMove(fromRow, fromCol, toRow, toCol) {
  // Kale sadece yatay veya dikey hareket edebilir
  if (fromRow !== toRow && fromCol !== toCol) return false;
  
  // Yol üzerinde taş var mı kontrol et
  if (fromRow === toRow) {
    // Yatay hareket
    const start = Math.min(fromCol, toCol) + 1;
    const end = Math.max(fromCol, toCol);
    for (let c = start; c < end; c++) {
      if (board[fromRow][c].piece) return false;
    }
  } else {
    // Dikey hareket
    const start = Math.min(fromRow, toRow) + 1;
    const end = Math.max(fromRow, toRow);
    for (let r = start; r < end; r++) {
      if (board[r][fromCol].piece) return false;
    }
  }
  
  return true;
}

// At hareketi kontrolü
function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
  // At L şeklinde hareket eder
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Fil hareketi kontrolü
function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
  // Fil sadece çapraz hareket edebilir
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  if (rowDiff !== colDiff) return false;
  
  // Yol üzerinde taş var mı kontrol et
  const rowDir = toRow > fromRow ? 1 : -1;
  const colDir = toCol > fromCol ? 1 : -1;
  
  for (let i = 1; i < rowDiff; i++) {
    if (board[fromRow + i * rowDir][fromCol + i * colDir].piece) return false;
  }
  
  return true;
}

// Vezir hareketi kontrolü
function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
  // Vezir kale veya fil gibi hareket edebilir
  return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

// Şah hareketi kontrolü
function isValidKingMove(fromRow, fromCol, toRow, toCol) {
  // Şah her yöne bir kare hareket edebilir
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  
  return rowDiff <= 1 && colDiff <= 1;
}

// Şah tehdit altında mı kontrol et (basitleştirilmiş)
function isKingInCheck(color) {
  // Şahın konumunu bul
  let kingRow = -1;
  let kingCol = -1;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c].piece === `${color}-king`) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }
  
  // Tüm karşı taşlar şahı tehdit ediyor mu kontrol et
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c].piece;
      if (piece && PIECES[piece].color === opponentColor) {
        if (isValidMove(r, c, kingRow, kingCol)) {
          return true;
        }

// Yakalanan taşları güncelle
function updateCapturedPieces() {
  const whiteCapturedEl = document.getElementById('white-captured');
  const blackCapturedEl = document.getElementById('black-captured');
  
  if (!whiteCapturedEl || !blackCapturedEl) return;
  
  whiteCapturedEl.innerHTML = '';
  blackCapturedEl.innerHTML = '';
  
  // Beyaz tarafından yakalanan taşlar
  capturedPieces.white.forEach(piece => {
    const pieceEl = document.createElement('span');
    pieceEl.className = 'captured-piece';
    pieceEl.textContent = PIECES[piece].symbol;
    pieceEl.style.color = '#000';
    whiteCapturedEl.appendChild(pieceEl);
  });
  
  // Siyah tarafından yakalanan taşlar
  capturedPieces.black.forEach(piece => {
    const pieceEl = document.createElement('span');
    pieceEl.className = 'captured-piece';
    pieceEl.textContent = PIECES[piece].symbol;
    pieceEl.style.color = '#FFF';
    blackCapturedEl.appendChild(pieceEl);
  });
}

// Şah mat durumunu kontrol et
function isCheckMate(color) {
  // Eğer şah tehdit altında değilse, şah mat değildir
  if (!isKingInCheck(color)) return false;
  
  // Oyuncunun tüm taşlarını bul
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c].piece;
      if (piece && PIECES[piece].color === color) {
        // Bu taşın yapabileceği tüm hamleleri kontrol et
        for (let toR = 0; toR < 8; toR++) {
          for (let toC = 0; toC < 8; toC++) {
            if (isValidMove(r, c, toR, toC)) {
              // Hamleyi geçici olarak yap
              const tempTarget = board[toR][toC].piece;
              board[toR][toC].piece = board[r][c].piece;
              board[r][c].piece = null;
              
              // Hamleden sonra şah tehdit altında mı kontrol et
              const stillInCheck = isKingInCheck(color);
              
              // Hamleyi geri al
              board[r][c].piece = board[toR][toC].piece;
              board[toR][toC].piece = tempTarget;
              
              // Eğer bir hamle şahı tehditten kurtarıyorsa, şah mat değildir
              if (!stillInCheck) return false;
            }
          }
        }
      }
    }
  }
  
  // Hiçbir hamle şahı tehditten kurtaramıyorsa, şah mattır
  return true;
}

// Pat (Beraberlik) durumunu kontrol et
function isInStalemate(color) {
  // Eğer şah tehdit altındaysa, pat değildir
  if (isKingInCheck(color)) return false;
  
  // Oyuncunun tüm taşlarını bul
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c].piece;
      if (piece && PIECES[piece].color === color) {
        // Bu taşın yapabileceği tüm hamleleri kontrol et
        for (let toR = 0; toR < 8; toR++) {
          for (let toC = 0; toC < 8; toC++) {
            if (isValidMove(r, c, toR, toC)) {
              // Hamleyi geçici olarak yap
              const tempTarget = board[toR][toC].piece;
              board[toR][toC].piece = board[r][c].piece;
              board[r][c].piece = null;
              
              // Hamleden sonra şah tehdit altında mı kontrol et
              const putsInCheck = isKingInCheck(color);
              
              // Hamleyi geri al
              board[r][c].piece = board[toR][toC].piece;
              board[toR][toC].piece = tempTarget;
              
              // Eğer legal bir hamle varsa, pat değildir
              if (!putsInCheck) return false;
            }
          }
        }
      }
    }
  }
  
  // Hiçbir legal hamle yoksa, pattır
  return true;
}

// Zamanı formatlama
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Oyun zamanlayıcısını başlat
function startGameTimer() {
  if (gameTimer) clearInterval(gameTimer);
  
  gameStartTime = Date.now();
  
  gameTimer = setInterval(() => {
    const currentTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Sıraya göre zamanı güncelle
    if (currentTurn === 'white') {
      whiteTimeSpent = currentTime - blackTimeSpent;
    } else {
      blackTimeSpent = currentTime - whiteTimeSpent;
    }
    
    // Zamanlayıcıyı güncelle
    renderBoard();
  }, 1000);
}

// Oyunu teslim et (resign)
function resignGame() {
  gameEndType = 'resignation';
  playSound('gameEnd');
  gameStatus.textContent = `${currentTurn === 'white' ? 'Beyaz' : 'Siyah'} oyuncu teslim oldu. ${currentTurn === 'white' ? 'Siyah' : 'Beyaz'} kazandı!`;
  gameStatus.className = 'chess-indicator winner';
  if (gameTimer) clearInterval(gameTimer);
}

// Teslim ol butonunu ayarla
if (document.getElementById('resign-btn')) {
  document.getElementById('resign-btn').addEventListener('click', resignGame);
}

      }
    }
  }
  
  return false;
}

// Hamle geçmişini güncelle
function updateMoveHistory(moveInfo) {
  const piece = PIECES[moveInfo.piece];
  const isWhiteMove = moveInfo.moveNumber % 2 === 1;
  const moveNumber = Math.ceil(moveInfo.moveNumber / 2);
  
  // Hamle notasyonu
  const toRow = 8 - moveInfo.toRow;
  const toCol = String.fromCharCode(97 + moveInfo.toCol); // a-h
  
  let notation = '';
  if (piece.type === 'pawn') {
    if (moveInfo.capturedPiece) {
      notation = `${String.fromCharCode(97 + moveInfo.fromCol)}x${toCol}${toRow}`;
    } else {
      notation = `${toCol}${toRow}`;
    }
  } else {
    notation = `${piece.symbol}${moveInfo.capturedPiece ? 'x' : ''}${toCol}${toRow}`;
  }
  
  // DOM'a ekle
  const moveItem = document.createElement('span');
  moveItem.className = `move-item ${piece.color}`;
  
  if (isWhiteMove) {
    moveItem.textContent = `${moveNumber}. ${notation} `;
  } else {
    moveItem.textContent = `${notation} `;
  }
  
  moveHistoryEl.appendChild(moveItem);
  moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
}

// Highlight'ları temizle
function clearHighlights() {
  const squares = document.querySelectorAll('.chess-square.highlight');
  squares.forEach(square => {
    square.classList.remove('highlight');
  });
}

// Hamleyi geri al
function undoMove() {
  if (moveHistory.length === 0) return;
  
  const lastMove = moveHistory.pop();
  
  // Taşı eski yerine taşı
  board[lastMove.fromRow][lastMove.fromCol].piece = lastMove.piece;
  board[lastMove.toRow][lastMove.toCol].piece = lastMove.capturedPiece;
  
  // Hamle sayısını ve sırayı güncelle
  moveCount--;
  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  
  // Hamle geçmişindeki son öğeyi kaldır
  if (moveHistoryEl.lastChild) {
    moveHistoryEl.removeChild(moveHistoryEl.lastChild);
  }
  
  // Tahtayı güncelle
  renderBoard();
  
  playSound('move');
}

// Tahtayı çevir
function flipBoard() {
  isBoardFlipped = !isBoardFlipped;
  
  // Tahtayı yeniden oluştur
  createBoard();
  renderBoard();
  
  playSound('move');
}

// Sesi aç/kapat
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
}

// Ses çalma
function playSound(type) {
  if (!soundEnabled) return;
  
  sounds[type].currentTime = 0;
  sounds[type].play().catch(e => console.log("Ses çalınamadı:", e));
}

// Oyunu sıfırla
function resetGame() {
  // Oyun durumunu sıfırla
  selectedPiece = null;
  currentTurn = 'white';
  moveCount = 1;
  moveHistory = [];
  moveHistoryEl.innerHTML = '';
  lastMove = null;
  gameEndType = null;
  whiteTimeSpent = 0;
  blackTimeSpent = 0;
  capturedPieces = { white: [], black: [] };
  
  // Zamanlayıcıyı temizle ve yeniden başlat
  if (gameTimer) clearInterval(gameTimer);
  
  // Tahtayı kurulum haline getir
  setupPieces();
  
  // Yakalanan taşları güncelle
  updateCapturedPieces();
  
  // Tahtayı güncelle
  renderBoard();
  
  // Ses efekti
  playSound('move');
  
  // Oyun durumunu güncelle
  gameStatus.textContent = 'Oyun başladı - Beyaz oyuncunun sırası';
  gameStatus.className = 'chess-indicator';
  
  // Oyun zamanlayıcısını başlat
  startGameTimer();
}

// Oyunu başlat
window.addEventListener('DOMContentLoaded', () => {
  initGame();
  startGameTimer();
});
