/**
 * Modern Tetris Oyunu
 * 
 * Yeniden yazılmış, profesyonel, modern tetris oyunu
 */

// Oyun değişkenleri
let canvas, ctx;
let nextCanvas, nextCtx;
let holdCanvas, holdCtx;
let scoreElement, levelElement, linesElement, levelUpElement;
let board = [];
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;
let isPaused = false;
let piece, nextPiece, holdPiece;
let canHold = true;
let score = 0;
let lines = 0;
let level = 1;
let pieces = 0;
let combo = 0;
let lastClearTime = 0;
let gameStartTime;
let difficultyLevel = 'medium';

// Oyun sabitleri
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK_SIZE = 20;

// Tetris parça renkleri - daha canlı ve modern
const COLORS = [
  null,
  '#FF3F3F', // I - Kırmızı
  '#3FFF7F', // O - Yeşil
  '#3F7FFF', // T - Mavi
  '#FFDF3F', // L - Sarı
  '#3FFFFF', // J - Açık Mavi
  '#FF3FFF', // S - Mor
  '#FF7F3F'  // Z - Turuncu
];

// Tetromino şekilleri
const SHAPES = [
  null,
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  [[2, 2], [2, 2]],                                         // O
  [[0, 3, 0], [3, 3, 3], [0, 0, 0]],                        // T
  [[0, 0, 4], [4, 4, 4], [0, 0, 0]],                        // L
  [[5, 0, 0], [5, 5, 5], [0, 0, 0]],                        // J
  [[0, 6, 6], [6, 6, 0], [0, 0, 0]],                        // S
  [[7, 7, 0], [0, 7, 7], [0, 0, 0]]                         // Z
];

// Zorluk seviyeleri
const DIFFICULTY_SETTINGS = {
  easy: {
    initialSpeed: 1000,
    levelUpFactor: 0.8,
    scoreMultiplier: 0.8
  },
  medium: {
    initialSpeed: 800,
    levelUpFactor: 0.75,
    scoreMultiplier: 1.0
  },
  hard: {
    initialSpeed: 500,
    levelUpFactor: 0.7,
    scoreMultiplier: 1.5
  }
};

// Event listener referansları
let keydownHandler;

// DOM yüklendikten sonra çalış
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  
  // Zorluk seviyesi düğmelerini ayarla
  document.getElementById('easy-btn').addEventListener('click', () => setDifficulty('easy'));
  document.getElementById('medium-btn').addEventListener('click', () => setDifficulty('medium'));
  document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));
  
  // Başlat düğmeleri
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('start-game').addEventListener('click', startGame);
  
  // Duraklat/devam et düğmeleri
  document.getElementById('pause-game').addEventListener('click', togglePause);
  document.getElementById('resume-game').addEventListener('click', togglePause);
  
  // Yeniden başlat düğmeleri
  document.getElementById('reset-game').addEventListener('click', resetGame);
  document.getElementById('play-again').addEventListener('click', resetGame);
  
  // Liderlik tablosunu yükle
  loadLeaderboard();
  
  // Misafir kontrolü
  checkGuestStatus();
  
  // Kayıtlı zorluğu yükle
  const savedDifficulty = localStorage.getItem('tetrisDifficulty');
  if (savedDifficulty) {
    setDifficulty(savedDifficulty);
  }
});

// Kullanıcının misafir olup olmadığını kontrol et
function checkGuestStatus() {
  if (document.getElementById('guest-info')) {
    fetch('/api/get-current-user')
      .then(response => response.json())
      .then(data => {
        if (!data.user_id || data.user_id === 0) {
          document.getElementById('guest-info').style.display = 'block';
        } else {
          document.getElementById('guest-info').style.display = 'none';
        }
      })
      .catch(() => {
        // Hata durumunda varsayılan olarak misafir kabul et
        document.getElementById('guest-info').style.display = 'block';
      });
  }
}

// Oyun başlangıç ayarları
function initGame() {
  // Canvas elementlerini al
  canvas = document.getElementById('tetris-canvas');
  ctx = canvas.getContext('2d');
  
  nextCanvas = document.getElementById('next-piece-canvas');
  nextCtx = nextCanvas.getContext('2d');
  
  holdCanvas = document.getElementById('hold-piece-canvas');
  holdCtx = holdCanvas.getContext('2d');
  
  // Skor elementlerini al
  scoreElement = document.getElementById('score');
  levelElement = document.getElementById('level');
  linesElement = document.getElementById('lines');
  levelUpElement = document.getElementById('level-up-notification');
  
  // Canvas boyutları ayarla
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  nextCanvas.width = PREVIEW_BLOCK_SIZE * 5;
  nextCanvas.height = PREVIEW_BLOCK_SIZE * 5;
  holdCanvas.width = PREVIEW_BLOCK_SIZE * 5;
  holdCanvas.height = PREVIEW_BLOCK_SIZE * 5;
  
  // Mobil dokunmatik kontroller
  setupTouchControls();
}

// Mobil dokunmatik kontroller
function setupTouchControls() {
  if ('ontouchstart' in window) {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.style.display = 'block';
      
      document.getElementById('touch-left').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) piece.moveLeft();
      });
      
      document.getElementById('touch-right').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) piece.moveRight();
      });
      
      document.getElementById('touch-rotate').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) piece.rotate();
      });
      
      document.getElementById('touch-drop').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) piece.hardDrop();
      });
      
      document.getElementById('touch-hold').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) holdCurrentPiece();
      });
      
      document.getElementById('touch-down').addEventListener('touchstart', () => {
        if (!isGameOver && !isPaused && piece) piece.moveDown();
      });
    }
  }
}

// Oyunu başlat
function startGame() {
  resetGame();
  const startOverlay = document.getElementById('game-start-overlay');
  const overlay = document.getElementById('tetris-overlay');
  const pauseButton = document.getElementById('pause-game');
  
  if (startOverlay) startOverlay.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  if (pauseButton) pauseButton.disabled = false;
  
  // Klavye kontrollerini ekle
  setupKeyboardControls();
  
  // İlk parçayı oluştur
  piece = nextPiece;
  nextPiece = createPiece();
  drawNextPiece();
  
  // Oyun döngüsünü başlat
  gameStartTime = Date.now();
  lastTime = 0;
  requestAnimationFrame(update);
}

// Oyunu yeniden başlat
function resetGame() {
  // Oyun değişkenlerini sıfırla
  board = createBoard();
  isGameOver = false;
  isPaused = false;
  score = 0;
  lines = 0;
  level = 1;
  pieces = 0;
  combo = 0;
  lastClearTime = 0;
  gameStartTime = Date.now();
  canHold = true;
  
  // Parçaları ayarla
  nextPiece = createPiece();
  holdPiece = null;
  
  // Arayüzü güncelle
  updateScore();
  
  // Overlay'leri kapat
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const overlay = document.getElementById('tetris-overlay');
  
  if (gameOverOverlay) gameOverOverlay.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  
  // Tutma panelini temizle
  clearCanvas(holdCtx, holdCanvas.width, holdCanvas.height);
  
  // Sonraki parçayı çiz
  drawNextPiece();
  
  // Düşüş hızını ayarla
  dropInterval = DIFFICULTY_SETTINGS[difficultyLevel].initialSpeed;
}

// Boş oyun tahtası oluştur
function createBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      board[r][c] = 0;
    }
  }
  return board;
}

// Rastgele parça oluştur
function createPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  return new Piece(type);
}

// Klavye kontrollerini ayarla
function setupKeyboardControls() {
  // Önceki event listener'ı temizle
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }
  
  // Yeni event listener ekle
  keydownHandler = (e) => {
    if (isGameOver) return;
    
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }
    
    if (isPaused) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        if (piece) piece.moveLeft();
        break;
      case 'ArrowRight':
        if (piece) piece.moveRight();
        break;
      case 'ArrowDown':
        if (piece) piece.moveDown();
        break;
      case 'ArrowUp':
        if (piece) piece.rotate();
        break;
      case ' ': // Boşluk tuşu
        if (piece) piece.hardDrop();
        break;
      case 'c':
      case 'C':
        if (piece) holdCurrentPiece();
        break;
    }
  };
  
  document.addEventListener('keydown', keydownHandler);
}

// Oyun duraklatma/devam ettirme
function togglePause() {
  if (isGameOver) return;
  
  isPaused = !isPaused;
  
  const pauseOverlay = document.getElementById('pause-overlay');
  const overlay = document.getElementById('tetris-overlay');
  
  if (isPaused) {
    if (pauseOverlay) pauseOverlay.style.display = 'block';
    if (overlay) overlay.style.display = 'flex';
  } else {
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    // Oyun devam ederse son zamanı güncelle
    lastTime = Date.now();
  }
}

// Zorluk seviyesini ayarla
function setDifficulty(difficulty) {
  difficultyLevel = difficulty;
  
  // Düğme stillerini güncelle
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const diffBtn = document.getElementById(`${difficulty}-btn`);
  if (diffBtn) diffBtn.classList.add('active');
  
  // Düşüş hızını güncelle
  dropInterval = DIFFICULTY_SETTINGS[difficulty].initialSpeed / level;
  
  // Ayarı kaydet
  localStorage.setItem('tetrisDifficulty', difficulty);
}

// Ana oyun döngüsü
function update(time) {
  if (isGameOver || isPaused) {
    requestAnimationFrame(update);
    return;
  }
  
  const deltaTime = time - lastTime;
  lastTime = time;
  
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    if (piece) {
      piece.moveDown();
    }
    dropCounter = 0;
  }
  
  draw();
  requestAnimationFrame(update);
}

// Oyun alanını çiz
function draw() {
  // Canvas'ı temizle
  clearCanvas(ctx, canvas.width, canvas.height);
  
  // Arkaplan ızgarasını çiz
  drawGrid();
  
  // Kilitli blokları çiz
  drawBoard();
  
  // Gölge parçayı çiz
  drawGhostPiece();
  
  // Aktif parçayı çiz
  if (piece) {
    piece.draw();
  }
}

// Oyun tahtasını çiz
function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawBlock(ctx, c, r, board[r][c]);
      }
    }
  }
}

// Izgara çiz
function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  // Yatay çizgiler
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK_SIZE);
    ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
    ctx.stroke();
  }
  
  // Dikey çizgiler
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK_SIZE, 0);
    ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    ctx.stroke();
  }
}

// Gölge parçayı çiz
function drawGhostPiece() {
  if (!piece) return;
  
  // Parçanın kopyasını oluştur
  const ghost = {
    type: piece.type,
    shape: piece.shape,
    x: piece.x,
    y: piece.y
  };
  
  // Gölgeyi mümkün olduğunca aşağı indir
  while (!checkCollision(ghost.shape, ghost.x, ghost.y + 1)) {
    ghost.y++;
  }
  
  // Şeffaf bloklar çiz
  for (let r = 0; r < ghost.shape.length; r++) {
    for (let c = 0; c < ghost.shape[r].length; c++) {
      if (ghost.shape[r][c]) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(
          (ghost.x + c) * BLOCK_SIZE, 
          (ghost.y + r) * BLOCK_SIZE, 
          BLOCK_SIZE, 
          BLOCK_SIZE
        );
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          (ghost.x + c) * BLOCK_SIZE, 
          (ghost.y + r) * BLOCK_SIZE, 
          BLOCK_SIZE, 
          BLOCK_SIZE
        );
      }
    }
  }
}

// Sonraki parçayı çiz
function drawNextPiece() {
  clearCanvas(nextCtx, nextCanvas.width, nextCanvas.height);
  
  if (!nextPiece) return;
  
  // Merkezi hesapla
  const centerX = (nextCanvas.width - nextPiece.shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
  const centerY = (nextCanvas.height - nextPiece.shape.length * PREVIEW_BLOCK_SIZE) / 2;
  
  // Parçayı çiz
  for (let r = 0; r < nextPiece.shape.length; r++) {
    for (let c = 0; c < nextPiece.shape[r].length; c++) {
      if (nextPiece.shape[r][c]) {
        // Blok rengini ayarla
        nextCtx.fillStyle = COLORS[nextPiece.type];
        nextCtx.fillRect(
          centerX + c * PREVIEW_BLOCK_SIZE, 
          centerY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Kenarlık çiz
        nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        nextCtx.lineWidth = 1;
        nextCtx.strokeRect(
          centerX + c * PREVIEW_BLOCK_SIZE, 
          centerY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Parlama efekti
        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        nextCtx.fillRect(
          centerX + c * PREVIEW_BLOCK_SIZE, 
          centerY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE / 3, 
          PREVIEW_BLOCK_SIZE / 3
        );
      }
    }
  }
}

// Tutulan parçayı çiz
function drawHoldPiece() {
  clearCanvas(holdCtx, holdCanvas.width, holdCanvas.height);
  
  if (!holdPiece) return;
  
  // Merkezi hesapla
  const centerX = (holdCanvas.width - holdPiece.shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
  const centerY = (holdCanvas.height - holdPiece.shape.length * PREVIEW_BLOCK_SIZE) / 2;
  
  // Parçayı çiz
  for (let r = 0; r < holdPiece.shape.length; r++) {
    for (let c = 0; c < holdPiece.shape[r].length; c++) {
      if (holdPiece.shape[r][c]) {
        // Blok rengini ayarla (tutma kullanılamazsa soluk göster)
        holdCtx.fillStyle = canHold ? COLORS[holdPiece.type] : 'rgba(150, 150, 150, 0.5)';
        holdCtx.fillRect(
          centerX + c * PREVIEW_BLOCK_SIZE, 
          centerY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Kenarlık çiz
        holdCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        holdCtx.lineWidth = 1;
        holdCtx.strokeRect(
          centerX + c * PREVIEW_BLOCK_SIZE, 
          centerY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Parlama efekti (tutma kullanılabilirse)
        if (canHold) {
          holdCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          holdCtx.fillRect(
            centerX + c * PREVIEW_BLOCK_SIZE, 
            centerY + r * PREVIEW_BLOCK_SIZE, 
            PREVIEW_BLOCK_SIZE / 3, 
            PREVIEW_BLOCK_SIZE / 3
          );
        }
      }
    }
  }
}

// Tek bir blok çiz
function drawBlock(context, x, y, type) {
  // Ana blok
  context.fillStyle = COLORS[type];
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  
  // Kenarlık
  context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  context.lineWidth = 1;
  context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  
  // Parlama efekti
  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 3, BLOCK_SIZE / 3);
}

// Canvas'ı temizle
function clearCanvas(context, width, height) {
  context.clearRect(0, 0, width, height);
}

// Çarpışma kontrolü
function checkCollision(shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      // Boş hücreleri atla
      if (!shape[r][c]) continue;
      
      // Oyun alanı koordinatlarını hesapla
      const boardX = x + c;
      const boardY = y + r;
      
      // Sınır kontrolleri
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
        return true;
      }
      
      // Üst sınırın üzerinde olup olmadığını kontrol et (oyun dışında)
      if (boardY < 0) continue;
      
      // Diğer parçalarla çarpışma kontrolü
      if (board[boardY][boardX]) {
        return true;
      }
    }
  }
  return false;
}

// Parçayı tut
function holdCurrentPiece() {
  if (!canHold || !piece) return;
  
  if (!holdPiece) {
    // İlk tutma
    holdPiece = {
      type: piece.type,
      shape: SHAPES[piece.type].map(row => [...row])
    };
    
    // Yeni parça oluştur
    piece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
  } else {
    // Parça değişimi
    const temp = {
      type: piece.type,
      shape: SHAPES[piece.type].map(row => [...row])
    };
    
    // Eski tutulan parçayı etkinleştir
    piece = new Piece(holdPiece.type);
    
    // Yeni parçayı tut
    holdPiece = temp;
  }
  
  // Tutma hakkını kullan
  canHold = false;
  
  // Tutulan parçayı çiz
  drawHoldPiece();
}

// Parçayı döndür
function rotatePiece(piece) {
  // I ve O parçaları için özel döndürme
  if (piece.type === 1) { // I parçası
    // I parçası için özel döndürme şekilleri
    const I_ROTATIONS = [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
      [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
    ];
    
    piece.rotation = (piece.rotation + 1) % 4;
    piece.shape = I_ROTATIONS[piece.rotation];
    return;
  }
  
  if (piece.type === 2) { // O parçası dönmez
    return;
  }
  
  // Diğer parçalar için normal döndürme
  const rotated = [];
  for (let c = 0; c < piece.shape[0].length; c++) {
    const row = [];
    for (let r = piece.shape.length - 1; r >= 0; r--) {
      row.push(piece.shape[r][c]);
    }
    rotated.push(row);
  }
  
  // Duvar tepmesi (wall kick)
  const oldShape = piece.shape;
  piece.shape = rotated;
  
  // Çarpışma var mı kontrol et
  if (checkCollision(piece.shape, piece.x, piece.y)) {
    // Sağa doğru itelemeyi dene
    if (!checkCollision(piece.shape, piece.x + 1, piece.y)) {
      piece.x += 1;
    }
    // Sola doğru itelemeyi dene
    else if (!checkCollision(piece.shape, piece.x - 1, piece.y)) {
      piece.x -= 1;
    }
    // Yukarı doğru itelemeyi dene (test için)
    else if (!checkCollision(piece.shape, piece.x, piece.y - 1)) {
      piece.y -= 1;
    }
    // Hiçbiri işe yaramazsa, döndürme
    else {
      piece.shape = oldShape;
    }
  }
}

// Tamamlanan satırları kontrol et
function checkLines() {
  let linesCleared = 0;
  
  for (let r = ROWS - 1; r >= 0; r--) {
    let rowFull = true;
    
    // Satırın dolu olup olmadığını kontrol et
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) {
        rowFull = false;
        break;
      }
    }
    
    if (rowFull) {
      // Satır temizleme efekti
      showLineClearEffect(r);
      
      // Satırı temizle ve üstündekileri aşağı indir
      for (let y = r; y > 0; y--) {
        for (let c = 0; c < COLS; c++) {
          board[y][c] = board[y-1][c];
        }
      }
      
      // En üst satırı temizle
      for (let c = 0; c < COLS; c++) {
        board[0][c] = 0;
      }
      
      // Temizlenen satır sayısını artır
      linesCleared++;
      
      // Aynı satırı tekrar kontrol et
      r++;
    }
  }
  
  // Temizlenen satır varsa skoru güncelle
  if (linesCleared > 0) {
    // Combo sistemi
    const now = Date.now();
    if (now - lastClearTime < 2000) {
      combo++;
    } else {
      combo = 0;
    }
    lastClearTime = now;
    
    // Satır sayısına göre puan ekle
    addScore(linesCleared);
    
    // Toplam satır sayısını güncelle
    lines += linesCleared;
    
    // Seviye kontrolü
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      levelUp(newLevel);
    }
    
    // Skoru güncelle
    updateScore();
    
    // Ekstra görsel efektler
    if (linesCleared >= 4) {
      showTetrisEffect();
    } else if (combo > 1) {
      showComboEffect(combo);
    }
  }
}

// Satır temizleme efekti
function showLineClearEffect(row) {
  // Satırı beyaz yap
  for (let c = 0; c < COLS; c++) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(c * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }
}

// Tetris efekti (4 satır temizlendi)
function showTetrisEffect() {
  const element = document.createElement('div');
  element.textContent = 'TETRIS!';
  element.className = 'tetris-effect';
  element.style.position = 'absolute';
  element.style.top = '50%';
  element.style.left = '50%';
  element.style.transform = 'translate(-50%, -50%) scale(0)';
  element.style.fontSize = '3rem';
  element.style.fontWeight = 'bold';
  element.style.color = '#FF3F3F';
  element.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  element.style.zIndex = '1000';
  element.style.animation = 'tetrisAnimation 1s forwards';
  
  // Animasyon stil tanımı
  const style = document.createElement('style');
  style.textContent = `
    @keyframes tetrisAnimation {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  const gameArea = document.querySelector('.tetris-modern-game-area');
  if (gameArea) gameArea.appendChild(element);
  
  setTimeout(() => {
    element.remove();
  }, 1000);
}

// Combo efekti
function showComboEffect(comboCount) {
  const element = document.createElement('div');
  element.textContent = `${comboCount}x COMBO!`;
  element.className = 'combo-effect';
  element.style.position = 'absolute';
  element.style.top = '60%';
  element.style.left = '50%';
  element.style.transform = 'translate(-50%, -50%) scale(0)';
  element.style.fontSize = '2rem';
  element.style.fontWeight = 'bold';
  element.style.color = '#3FFFFF';
  element.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  element.style.zIndex = '1000';
  element.style.animation = 'comboAnimation 0.8s forwards';
  
  // Animasyon stil tanımı
  const style = document.createElement('style');
  style.textContent = `
    @keyframes comboAnimation {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      70% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  const gameArea = document.querySelector('.tetris-modern-game-area');
  if (gameArea) gameArea.appendChild(element);
  
  setTimeout(() => {
    element.remove();
  }, 800);
}

// Seviye atlama
function levelUp(newLevel) {
  level = newLevel;
  
  // Düşüş hızını güncelle
  const factor = DIFFICULTY_SETTINGS[difficultyLevel].levelUpFactor;
  dropInterval = DIFFICULTY_SETTINGS[difficultyLevel].initialSpeed * Math.pow(factor, level - 1);
  
  // Seviye atlama efekti
  showLevelUpEffect();
}

// Seviye atlama efekti
function showLevelUpEffect() {
  if (levelUpElement) {
    levelUpElement.classList.add('show');
    
    setTimeout(() => {
      levelUpElement.classList.remove('show');
    }, 1500);
  }
}

// Skor ekleme
function addScore(linesCleared) {
  // Satır sayısına göre puan
  let points;
  switch (linesCleared) {
    case 1: points = 100; break;
    case 2: points = 300; break;
    case 3: points = 500; break;
    case 4: points = 800; break;
    default: points = linesCleared * 100;
  }
  
  // Combo bonusu
  if (combo > 1) {
    points += combo * 50;
  }
  
  // Zorluk çarpanı
  const difficultyMultiplier = DIFFICULTY_SETTINGS[difficultyLevel].scoreMultiplier;
  
  // Seviye çarpanı (her seviye %10 daha fazla puan)
  const levelMultiplier = 1 + ((level - 1) * 0.1);
  
  // Toplam puanı hesapla
  const totalPoints = Math.floor(points * difficultyMultiplier * levelMultiplier);
  
  // Puanı ekle
  score += totalPoints;
  
  // Skor animasyonu
  if (scoreElement) {
    scoreElement.classList.add('score-update');
    setTimeout(() => {
      scoreElement.classList.remove('score-update');
    }, 300);
  }
}

// Skoru güncelle
function updateScore() {
  if (scoreElement) scoreElement.textContent = score;
  if (levelElement) levelElement.textContent = level;
  if (linesElement) linesElement.textContent = lines;
}

// Oyun sonu
function gameOver() {
  isGameOver = true;
  
  // Overlay'i göster
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const overlay = document.getElementById('tetris-overlay');
  
  if (gameOverOverlay) gameOverOverlay.style.display = 'flex';
  if (overlay) overlay.style.display = 'flex';
  
  // Final skorunu göster
  const finalScoreElement = document.getElementById('final-score');
  const finalLevelElement = document.getElementById('final-level');
  const finalLinesElement = document.getElementById('final-lines');
  const gameDurationElement = document.getElementById('game-duration');
  
  if (finalScoreElement) finalScoreElement.textContent = score;
  if (finalLevelElement) finalLevelElement.textContent = level;
  if (finalLinesElement) finalLinesElement.textContent = lines;
  
  // Oyun süresini hesapla
  if (gameDurationElement) {
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(gameDuration / 60);
    const seconds = gameDuration % 60;
    gameDurationElement.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
  
  // XP bilgisi varsa göster
  const xpGainElement = document.getElementById('xp-gain');
  if (xpGainElement) {
    const xpInfo = document.querySelector('.tetris-modern-xp-info');
    const isGuest = document.getElementById('guest-info');
    
    if (xpInfo && (!isGuest || isGuest.style.display === 'none')) {
      xpInfo.style.display = 'block';
      
      // XP miktarını hesapla
      const xpGain = Math.floor(score / 10);
      xpGainElement.textContent = xpGain;
      
      // XP çubuğunu animasyonla doldur
      const progressBar = document.getElementById('level-progress-bar');
      if (progressBar) {
        setTimeout(() => {
          progressBar.style.width = '75%';
        }, 500);
      }
    }
  }
  
  // Skoru kaydet
  saveScore();
}

// Skoru kaydet
function saveScore() {
  try {
    // Oyun istatistiklerini topla
    const gameStats = {
      lines_cleared: lines,
      level: level,
      duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
      pieces_placed: pieces
    };
    
    console.log(`Saving score for tetris: ${score} points, difficulty: ${difficultyLevel}`);
    
    // API'ye skoru gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'tetris',
        score: score,
        difficulty: difficultyLevel,
        playtime: gameStats.duration_seconds,
        game_stats: gameStats
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Score saved:", data);
      
      // XP bilgisini güncelle (varsa)
      const xpGainElement = document.getElementById('xp-gain');
      const currentLevelElement = document.getElementById('current-level');
      const nextLevelElement = document.getElementById('next-level');
      const levelProgressBar = document.getElementById('level-progress-bar');
      
      if (data.xp_gained && xpGainElement) {
        xpGainElement.textContent = data.xp_gained;
        if (currentLevelElement) currentLevelElement.textContent = data.current_level || 1;
        if (nextLevelElement) nextLevelElement.textContent = data.next_level || 2;
        
        // XP çubuğu
        if (levelProgressBar) {
          setTimeout(() => {
            levelProgressBar.style.width = (data.level_progress || 0) + '%';
          }, 500);
        }
      }
    })
    .catch(err => console.error("Skor kaydetme hatası:", err));
  } catch (e) {
    console.error("Skor kaydetme işleminde hata:", e);
  }
}

// Liderlik tablosunu yükle
function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;
  
  container.innerHTML = '<div class="tetris-modern-leaderboard-loading"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';
  
  fetch('/api/get-leaderboard/tetris?limit=10')
    .then(response => response.json())
    .then(data => {
      let html = '';
      
      if (data.length === 0) {
        html = '<div class="tetris-modern-leaderboard-empty">Henüz skor kaydedilmemiş</div>';
      } else {
        data.forEach((item, index) => {
          const topClass = index < 3 ? `tetris-modern-leaderboard-top${index+1}` : '';
          
          html += `
            <div class="tetris-modern-leaderboard-item ${topClass}">
              <div class="tetris-modern-leaderboard-rank">${index + 1}</div>
              <div class="tetris-modern-leaderboard-user">${item.username || 'Misafir'}</div>
              <div class="tetris-modern-leaderboard-score">${item.score}</div>
            </div>
          `;
        });
      }
      
      container.innerHTML = html;
    })
    .catch(error => {
      console.error('Liderlik tablosu yüklenirken hata:', error);
      container.innerHTML = '<div class="tetris-modern-leaderboard-error">Liderlik tablosu yüklenemedi</div>';
    });
}

// Piece sınıfı
class Piece {
  constructor(type) {
    this.type = type;
    this.shape = SHAPES[type].map(row => [...row]); // Derin kopyalama
    this.color = type;
    this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
    this.y = 0;
    this.rotation = 0;
  }
  
  draw() {
    for (let r = 0; r < this.shape.length; r++) {
      for (let c = 0; c < this.shape[r].length; c++) {
        if (this.shape[r][c]) {
          drawBlock(ctx, this.x + c, this.y + r, this.color);
        }
      }
    }
  }
  
  moveDown() {
    if (!checkCollision(this.shape, this.x, this.y + 1)) {
      this.y++;
      return true;
    } else {
      this.lock();
      return false;
    }
  }
  
  moveRight() {
    if (!checkCollision(this.shape, this.x + 1, this.y)) {
      this.x++;
    }
  }
  
  moveLeft() {
    if (!checkCollision(this.shape, this.x - 1, this.y)) {
      this.x--;
    }
  }
  
  rotate() {
    rotatePiece(this);
  }
  
  hardDrop() {
    while (!checkCollision(this.shape, this.x, this.y + 1)) {
      this.y++;
    }
    this.lock();
  }
  
  lock() {
    for (let r = 0; r < this.shape.length; r++) {
      for (let c = 0; c < this.shape[r].length; c++) {
        if (this.shape[r][c]) {
          // Oyun alanının üstüne çıkarsa oyun biter
          if (this.y + r < 0) {
            gameOver();
            return;
          }
          
          board[this.y + r][this.x + c] = this.color;
        }
      }
    }
    
    // Yerleştirilen parça sayısını artır
    pieces++;
    
    // Tamamlanan satırları kontrol et
    checkLines();
    
    // Yeni parça oluştur
    piece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
    
    // Tutma hakkını sıfırla
    canHold = true;
    if (holdPiece) {
      drawHoldPiece();
    }
  }
}

// Kaynak temizleme
window.addEventListener('beforeunload', () => {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }
});