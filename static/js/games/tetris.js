/**
 * Modern Tetris Game
 * Yeniden yazılmış, profesyonel, modern tetris oyun mantığı
 */

// Sabitler
const COLS = 10;             // Oyun alanı genişliği
const ROWS = 20;             // Oyun alanı yüksekliği
const BLOCK_SIZE = 30;       // Blok boyutu (pixel)
const PREVIEW_BLOCK_SIZE = 20; // Ön izleme blok boyutu

// Tetromino renkleri - modern ve canlı
const COLORS = [
  null,
  '#FF3F3F', // I - Kırmızı
  '#3FFF7F', // O - Yeşil
  '#3F7FFF', // T - Mavi
  '#FFDF3F', // L - Sarı
  '#3FFFFF', // J - Camgöbeği
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

// Olay dinleyicileri ile kullanılacak değişkenler
let keydownHandler;
let touchstartHandler;
let touchendHandler;

// Oyun değişkenleri
let canvas, ctx;                  // Ana oyun alanı
let nextCanvas, nextCtx;          // Sonraki parça
let holdCanvas, holdCtx;          // Tutulan parça
let scoreElement;                 // Skor göstergesi
let levelElement;                 // Seviye göstergesi
let linesElement;                 // Çizgi göstergesi
let levelNotification;            // Seviye atlama bildirimi
let board;                        // Oyun tahtası
let piece;                        // Mevcut düşen parça
let nextPiece;                    // Sonraki parça
let holdPiece;                    // Tutulmuş parça
let canHold;                      // Tuş hakkı var mı
let score;                        // Oyuncunun skoru
let lines;                        // Temizlenen çizgi sayısı
let level;                        // Oyun seviyesi
let gameOver;                     // Oyun bitti mi
let paused;                       // Oyun duraklatıldı mı
let gameInterval;                 // Oyun döngüsü aralığı
let dropStart;                    // Son düşüş zamanı
let dropSpeed;                    // Düşüş hızı 
let gameStartTime;                // Oyun başlangıç zamanı
let highScore;                    // En yüksek skor
let pieces;                       // Yerleştirilen parça sayısı
let difficultyLevel;              // Zorluk seviyesi
let comboCount;                   // Combo sayısı
let lastClearTime;                // Son satır temizleme zamanı
let tetrisCount;                  // Tetris (4 satır) count

// Zorluk seviyeleri için ayarlar
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

// Oyunu başlat
function startGame() {
  // Zorluk seviyesini ayarla
  setDifficulty('medium'); // Varsayılan zorluk

  // Canvas elementlerini al
  canvas = document.getElementById('tetris-canvas');
  ctx = canvas.getContext('2d');
  
  nextCanvas = document.getElementById('next-piece-canvas');
  nextCtx = nextCanvas.getContext('2d');
  
  holdCanvas = document.getElementById('hold-piece-canvas');
  holdCtx = holdCanvas.getContext('2d');
  
  // Skorları tutan elementleri al
  scoreElement = document.getElementById('score');
  levelElement = document.getElementById('level');
  linesElement = document.getElementById('lines');
  levelNotification = document.getElementById('level-up-notification');
  
  // Canvas boyutlarını ayarla
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  
  nextCanvas.width = nextCanvas.height = PREVIEW_BLOCK_SIZE * 5;
  holdCanvas.width = holdCanvas.height = PREVIEW_BLOCK_SIZE * 5;
  
  // Oyun değişkenlerini sıfırla
  resetGame();
  
  // Oyunu başlat
  startGameLoop();
  
  // Başlangıç ekranını gizle
  document.getElementById('game-start-overlay').style.display = 'none';
  
  // Kullanıcı giriş kontrollerini ekle
  addEventListeners();
}

// Oyun değişkenlerini sıfırlama
function resetGame() {
  board = createBoard();
  piece = null;
  nextPiece = randomPiece();
  holdPiece = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  paused = false;
  gameStartTime = Date.now();
  highScore = localStorage.getItem('tetrisHighScore') || 0;
  pieces = 0;
  comboCount = 0;
  lastClearTime = 0;
  tetrisCount = 0;
  
  updateScoreDisplay();
  
  // Düşüş hızını zorluk seviyesine göre ayarla
  dropSpeed = DIFFICULTY_SETTINGS[difficultyLevel].initialSpeed;
  
  // Tutma ve sonraki parça panellerini temizle
  clearCanvas(nextCtx, nextCanvas.width, nextCanvas.height);
  clearCanvas(holdCtx, holdCanvas.width, holdCanvas.height);
  
  // Bir sonraki parçayı çiz
  drawNextPiece();
}

// Zorluk seviyesini ayarla
function setDifficulty(difficulty) {
  difficultyLevel = difficulty;
  
  // Zorluk butonlarının aktifliğini güncelle
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(`${difficulty}-btn`).classList.add('active');
  
  // Yerel depolamaya kaydet
  localStorage.setItem('tetrisDifficulty', difficulty);
  
  // Oyun açıksa hızı güncelle
  if (typeof dropSpeed !== 'undefined') {
    dropSpeed = DIFFICULTY_SETTINGS[difficulty].initialSpeed / level;
  }
}

// Yeni oyun tahtası oluştur
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

// Tetris game loop başlat
function startGameLoop() {
  // İlk parçayı oluştur
  piece = nextPiece;
  nextPiece = randomPiece();
  drawNextPiece();
  
  // Aralığı ayarla ve oyun döngüsünü başlat
  dropStart = Date.now();
  gameInterval = setInterval(gameLoop, 1000 / 60); // ~60 FPS
}

// Oyunu duraklat/devam ettir
function togglePause() {
  if (gameOver) return;
  
  paused = !paused;
  
  if (paused) {
    document.getElementById('pause-overlay').style.display = 'block';
    document.getElementById('tetris-overlay').style.display = 'flex';
  } else {
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('tetris-overlay').style.display = 'none';
    // Düşüş zamanını sıfırla
    dropStart = Date.now();
  }
}

// Oyun döngüsü
function gameLoop() {
  if (gameOver || paused) return;
  
  const now = Date.now();
  const delta = now - dropStart;
  
  if (delta > dropSpeed) {
    // Parçayı bir birim aşağı düşür
    piece.moveDown();
    // Düşüş zamanını sıfırla
    dropStart = now;
  }
  
  // Oyun alanını ve parçayı çiz
  draw();
}

// Ana çizim fonksiyonu
function draw() {
  // Önce canvası temizle
  clearCanvas(ctx, canvas.width, canvas.height);
  
  // Oyun alanındaki parçaları çiz
  drawBoard();
  
  // Gölge parçayı çiz (ghost piece)
  drawGhostPiece();
  
  // Aktif parçayı çiz
  if (piece) {
    piece.draw();
  }
}

// Oyun alanındaki sabit parçaları çiz
function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawBlock(ctx, c, r, board[r][c]);
      }
    }
  }
  
  // Izgara çizgileri (opsiyonel)
  drawGrid();
}

// Bir sonraki parçayı çiz
function drawNextPiece() {
  clearCanvas(nextCtx, nextCanvas.width, nextCanvas.height);
  
  const pieceType = nextPiece.type;
  const shape = SHAPES[pieceType];
  const color = pieceType;
  
  // Merkeze yerleştirmek için hesapla
  const offsetX = (nextCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
  const offsetY = (nextCanvas.height - shape.length * PREVIEW_BLOCK_SIZE) / 2;
  
  // Parçayı çiz
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        nextCtx.fillStyle = COLORS[color];
        nextCtx.fillRect(
          offsetX + c * PREVIEW_BLOCK_SIZE, 
          offsetY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Kenarlık çiz
        nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        nextCtx.lineWidth = 1;
        nextCtx.strokeRect(
          offsetX + c * PREVIEW_BLOCK_SIZE, 
          offsetY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Parıltı efekti
        nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        nextCtx.fillRect(
          offsetX + c * PREVIEW_BLOCK_SIZE, 
          offsetY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE / 4, 
          PREVIEW_BLOCK_SIZE / 4
        );
      }
    }
  }
}

// Tutulan parçayı çiz
function drawHoldPiece() {
  clearCanvas(holdCtx, holdCanvas.width, holdCanvas.height);
  
  if (!holdPiece) return;
  
  const pieceType = holdPiece.type;
  const shape = SHAPES[pieceType];
  const color = pieceType;
  
  // Merkeze yerleştirmek için hesapla
  const offsetX = (holdCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
  const offsetY = (holdCanvas.height - shape.length * PREVIEW_BLOCK_SIZE) / 2;
  
  // Parçayı çiz
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        // Eğer tutma kullanılamıyorsa rengi sönük göster
        holdCtx.fillStyle = canHold ? COLORS[color] : 'rgba(150, 150, 150, 0.5)';
        holdCtx.fillRect(
          offsetX + c * PREVIEW_BLOCK_SIZE, 
          offsetY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Kenarlık çiz
        holdCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        holdCtx.lineWidth = 1;
        holdCtx.strokeRect(
          offsetX + c * PREVIEW_BLOCK_SIZE, 
          offsetY + r * PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE, 
          PREVIEW_BLOCK_SIZE
        );
        
        // Parıltı efekti (eğer tutma kullanılabilirse)
        if (canHold) {
          holdCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          holdCtx.fillRect(
            offsetX + c * PREVIEW_BLOCK_SIZE, 
            offsetY + r * PREVIEW_BLOCK_SIZE, 
            PREVIEW_BLOCK_SIZE / 4, 
            PREVIEW_BLOCK_SIZE / 4
          );
        }
      }
    }
  }
}

// Gölge parçayı çiz (düşeceği yerin göstergesi)
function drawGhostPiece() {
  if (!piece) return;
  
  // Parçanın kopyasını oluştur
  const ghost = JSON.parse(JSON.stringify(piece));
  
  // Kopyayı maksimum aşağı taşı
  while (!ghost.collision(0, 1, ghost.activeTetromino)) {
    ghost.y++;
  }
  
  // Şeffaf olarak çiz
  for (let r = 0; r < ghost.activeTetromino.length; r++) {
    for (let c = 0; c < ghost.activeTetromino[r].length; c++) {
      if (ghost.activeTetromino[r][c]) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(
          (ghost.x + c) * BLOCK_SIZE, 
          (ghost.y + r) * BLOCK_SIZE, 
          BLOCK_SIZE, 
          BLOCK_SIZE
        );
        
        // Sadece kenarları belirgin göster
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

// Izgara çizgilerini çiz
function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  // Yatay çizgiler
  for (let r = 0; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK_SIZE);
    ctx.lineTo(canvas.width, r * BLOCK_SIZE);
    ctx.stroke();
  }
  
  // Dikey çizgiler
  for (let c = 0; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK_SIZE, 0);
    ctx.lineTo(c * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
}

// Tek bir blok çiz
function drawBlock(context, x, y, colorIndex) {
  const color = COLORS[colorIndex];
  
  // Ana blok
  context.fillStyle = color;
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  
  // Işık efekti (sol üst kenarda)
  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 4, BLOCK_SIZE / 4);
  
  // Kenarlık
  context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  context.lineWidth = 1;
  context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Canvas'ı temizle
function clearCanvas(context, width, height) {
  context.clearRect(0, 0, width, height);
}

// Rastgele bir parça oluştur
function randomPiece() {
  const pieceType = Math.floor(Math.random() * 7) + 1; // 1 ile 7 arası
  return new Piece(pieceType, 3, 0);
}

// Parça objesi
function Piece(type, x, y) {
  this.type = type;
  this.color = type;
  this.x = x;
  this.y = y;
  this.rotation = 0;
  this.activeTetromino = SHAPES[type];
  
  // Parçayı çiz
  this.draw = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino[r].length; c++) {
        if (!this.activeTetromino[r][c]) continue;
        
        drawBlock(ctx, this.x + c, this.y + r, this.color);
      }
    }
  };
  
  // Çarpışma kontrolü
  this.collision = function(offsetX, offsetY, tetromino = this.activeTetromino) {
    for (let r = 0; r < tetromino.length; r++) {
      for (let c = 0; c < tetromino[r].length; c++) {
        if (!tetromino[r][c]) continue;
        
        const newX = this.x + c + offsetX;
        const newY = this.y + r + offsetY;
        
        // Sınırlar dışına çıkma kontrolü
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }
        
        // Zemin kontrolü
        if (newY < 0) {
          continue;
        }
        
        // Diğer parçalara çarpma kontrolü
        if (board[newY][newX]) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Parçayı kilitle (oyun alanına yerleştir)
  this.lock = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino[r].length; c++) {
        if (!this.activeTetromino[r][c]) continue;
        
        // Oyun alanının üst sınırına çarparsa oyun biter
        if (this.y + r < 0) {
          gameOver = true;
          showGameOver();
          return;
        }
        
        // Parçayı tahta üzerine yerleştir
        board[this.y + r][this.x + c] = this.color;
      }
    }
    
    // Yerleştirilen parça sayısını artır
    pieces++;
    
    // Tamamlanan satırları kontrol et
    this.checkLines();
    
    // Yeni parça oluştur
    piece = nextPiece;
    nextPiece = randomPiece();
    drawNextPiece();
    
    // Tutma özelliğini sıfırla
    canHold = true;
    drawHoldPiece();
  };
  
  // Parçayı aşağı indir
  this.moveDown = function() {
    if (!this.collision(0, 1)) {
      this.y++;
    } else {
      // Parçayı kilitle ve yeni parça oluştur
      this.lock();
    }
  };
  
  // Parçayı sağa hareket ettir
  this.moveRight = function() {
    if (!this.collision(1, 0)) {
      this.x++;
    }
  };
  
  // Parçayı sola hareket ettir
  this.moveLeft = function() {
    if (!this.collision(-1, 0)) {
      this.x--;
    }
  };
  
  // Parçayı döndür
  this.rotate = function() {
    // Bir sonraki rotasyonu hesapla
    const nextRotation = (this.rotation + 1) % 4;
    const nextTetromino = this.getTetromino(nextRotation);
    
    // Duvar tekmesi (wall kick) - kenar çarpışmalarında parçayı doğru yere itelemek
    let wallKick = 0;
    
    // Önce rotasyonu test et
    if (this.collision(0, 0, nextTetromino)) {
      // Sağ duvara çarparsa, sola iteleme dene
      if (this.x > COLS / 2) {
        wallKick = -1;
      } else {
        // Sol duvara çarparsa, sağa iteleme dene
        wallKick = 1;
      }
    }
    
    // Duvar tekmesi ile birlikte tekrar dene
    if (!this.collision(wallKick, 0, nextTetromino)) {
      this.x += wallKick;
      this.rotation = nextRotation;
      this.activeTetromino = nextTetromino;
    }
  };
  
  // Parçayı anında düşür
  this.hardDrop = function() {
    // Maksimum düşebileceği yere kadar düşür
    while (!this.collision(0, 1)) {
      this.y++;
    }
    
    // Parçayı kilitle
    this.lock();
  };
  
  // Tamamlanan satırları kontrol et
  this.checkLines = function() {
    let linesCleared = 0;
    
    for (let r = ROWS - 1; r >= 0; r--) {
      let rowFull = true;
      
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === 0) {
          rowFull = false;
          break;
        }
      }
      
      if (rowFull) {
        // Animasyon efekti
        showLineClearAnimation(r);
        
        // Satırı kaldır ve üstündekileri aşağı kaydır
        for (let y = r; y > 0; y--) {
          for (let c = 0; c < COLS; c++) {
            board[y][c] = board[y-1][c];
          }
        }
        
        // En üst satırı temizle
        for (let c = 0; c < COLS; c++) {
          board[0][c] = 0;
        }
        
        // Silinen satır sayısını artır
        linesCleared++;
        
        // Satır sayısı arttığı için aynı indeksi tekrar kontrol et
        r++;
      }
    }
    
    // Silinen satır varsa skor hesapla
    if (linesCleared > 0) {
      // Combo sistemi
      const now = Date.now();
      const timeSinceLastClear = now - lastClearTime;
      
      // 2 saniye içinde ardışık temizleme yapıldıysa combo artar
      if (timeSinceLastClear < 2000) {
        comboCount++;
      } else {
        comboCount = 0;
      }
      
      lastClearTime = now;
      
      // Tetris kontrolü (4 satır birden temizleme)
      if (linesCleared === 4) {
        tetrisCount++;
        addScore(1200); // Tetris bonusu
        showAnimation("TETRIS!", 'tetris');
      } else {
        // Normal satır temizleme skoru
        const baseScore = linesCleared * linesCleared * 100;
        const comboBonus = comboCount > 0 ? comboCount * 50 : 0;
        
        addScore(baseScore + comboBonus);
        
        // Combo göster
        if (comboCount > 1) {
          showAnimation(`${comboCount}x COMBO!`, 'combo');
        }
      }
      
      // Toplam satır sayısını güncelle
      lines += linesCleared;
      
      // Seviye kontrolü
      checkLevelUp();
      
      // Skorları güncelle
      updateScoreDisplay();
    }
  };
  
  // Belirli bir rotasyonda tetromino'yu al
  this.getTetromino = function(rotation = this.rotation) {
    // I parçası (çubuk) için özel rotasyon
    if (this.type === 1) {
      // I parçasının 4 rotasyonu
      const I = [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]]
      ];
      return I[rotation];
    }
    
    // O parçası (kare) için rotasyon yok
    if (this.type === 2) {
      return SHAPES[this.type];
    }
    
    // Diğer parçalar için (T, L, J, S, Z)
    const pos = SHAPES[this.type];
    const result = [];
    
    // Rotasyon 0: normal
    if (rotation === 0) {
      return pos;
    }
    
    // Rotasyon 1: 90 derece saat yönünde
    if (rotation === 1) {
      for (let c = 0; c < pos[0].length; c++) {
        const row = [];
        for (let r = pos.length - 1; r >= 0; r--) {
          row.push(pos[r][c] || 0);
        }
        result.push(row);
      }
      return result;
    }
    
    // Rotasyon 2: 180 derece
    if (rotation === 2) {
      for (let r = pos.length - 1; r >= 0; r--) {
        const row = [];
        for (let c = pos[0].length - 1; c >= 0; c--) {
          row.push(pos[r][c] || 0);
        }
        result.push(row);
      }
      return result;
    }
    
    // Rotasyon 3: 270 derece (90 derece saat yönünün tersi)
    if (rotation === 3) {
      for (let c = pos[0].length - 1; c >= 0; c--) {
        const row = [];
        for (let r = 0; r < pos.length; r++) {
          row.push(pos[r][c] || 0);
        }
        result.push(row);
      }
      return result;
    }
  };
}

// Parçayı tut (hold) fonksiyonu
function holdPieceFunction() {
  if (!canHold || gameOver || paused) return;
  
  if (holdPiece === null) {
    // İlk kez parça tutuluyorsa
    holdPiece = {type: piece.type, color: piece.color};
    piece = nextPiece;
    nextPiece = randomPiece();
    drawNextPiece();
  } else {
    // Parça değişimi
    const temp = {type: piece.type, color: piece.color};
    piece = new Piece(holdPiece.type, 3, 0);
    holdPiece = temp;
  }
  
  // Tutma hakkını kullan
  canHold = false;
  
  // Tutulan parçayı çiz
  drawHoldPiece();
}

// Satır temizleme animasyonu
function showLineClearAnimation(row) {
  // Satırı parlat
  for (let c = 0; c < COLS; c++) {
    // Önce beyaz parıltı
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(c * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }
}

// Özel animasyonları göster (Tetris, Combo vb.)
function showAnimation(text, type) {
  const animationEl = document.createElement('div');
  animationEl.className = `special-animation ${type}-animation`;
  animationEl.textContent = text;
  
  // Animasyon stili
  animationEl.style.position = 'absolute';
  animationEl.style.top = '50%';
  animationEl.style.left = '50%';
  animationEl.style.transform = 'translate(-50%, -50%) scale(0)';
  animationEl.style.color = type === 'tetris' ? '#FF3F3F' : '#3FFFFF';
  animationEl.style.fontSize = type === 'tetris' ? '3rem' : '2rem';
  animationEl.style.fontWeight = 'bold';
  animationEl.style.zIndex = '100';
  animationEl.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  animationEl.style.animation = 'specialAnimation 1s forwards';
  
  // Stil ekle
  const style = document.createElement('style');
  style.textContent = `
    @keyframes specialAnimation {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  document.querySelector('.tetris-modern-game-area').appendChild(animationEl);
  
  // Animasyonu 1 saniye sonra kaldır
  setTimeout(() => {
    animationEl.remove();
  }, 1000);
}

// Seviye atlama kontrolü
function checkLevelUp() {
  // Her 10 satır temizlendiğinde seviye artar
  const newLevel = Math.floor(lines / 10) + 1;
  
  if (newLevel > level) {
    // Seviye atlama bildirimi göster
    levelNotification.classList.add('show');
    
    // Seviyeyi güncelle
    level = newLevel;
    
    // Düşüş hızını yeni seviyeye göre ayarla
    const levelFactor = DIFFICULTY_SETTINGS[difficultyLevel].levelUpFactor;
    dropSpeed = DIFFICULTY_SETTINGS[difficultyLevel].initialSpeed * Math.pow(levelFactor, level - 1);
    
    // Skoru gösteril
    updateScoreDisplay();
    
    // Bildirimi 1.5 saniye sonra kaldır
    setTimeout(() => {
      levelNotification.classList.remove('show');
    }, 1500);
  }
}

// Skor ekle ve göstergeyi güncelle
function addScore(points) {
  // Zorluk seviyesi çarpanını uygula
  const difficultyMultiplier = DIFFICULTY_SETTINGS[difficultyLevel].scoreMultiplier;
  
  // Seviye çarpanını uygula
  const levelMultiplier = 1 + ((level - 1) * 0.1); // Her seviye %10 daha fazla puan
  
  // Toplam skoru hesapla
  const totalPoints = Math.floor(points * difficultyMultiplier * levelMultiplier);
  
  // Skoru ekle
  score += totalPoints;
  
  // En yüksek skoru güncelle
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tetrisHighScore', highScore);
  }
  
  // Skor göstergesini güncelle
  updateScoreDisplay();
  
  // Skor animasyonu
  scoreElement.classList.add('score-update');
  setTimeout(() => {
    scoreElement.classList.remove('score-update');
  }, 300);
}

// Skor, seviye ve satır göstergelerini güncelle
function updateScoreDisplay() {
  scoreElement.textContent = score;
  levelElement.textContent = level;
  linesElement.textContent = lines;
}

// Oyun sonu ekranını göster
function showGameOver() {
  // İnterval'i temizle
  clearInterval(gameInterval);
  
  // Overlay'i göster
  document.getElementById('game-over-overlay').style.display = 'flex';
  document.getElementById('tetris-overlay').style.display = 'flex';
  
  // Final skorunu göster
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-level').textContent = level;
  document.getElementById('final-lines').textContent = lines;
  
  // Oyun süresini hesapla ve göster
  const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(gameDuration / 60);
  const seconds = gameDuration % 60;
  document.getElementById('game-duration').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  
  // XP bilgisini göster
  if (document.getElementById('xp-gain')) {
    const xpInfo = document.querySelector('.tetris-modern-xp-info');
    const isGuest = document.getElementById('guest-info');
    
    // Misafir kullanıcı değilse XP bilgisini göster
    if (!isGuest || isGuest.style.display === 'none') {
      xpInfo.style.display = 'block';
      
      // XP miktarını hesapla (örnek formül, gerçek XP hesaplaması API'de yapılır)
      const xpGain = Math.floor(score / 10);
      document.getElementById('xp-gain').textContent = xpGain;
      
      // XP çubuğunu doldur (örnek)
      setTimeout(() => {
        document.getElementById('level-progress-bar').style.width = '75%';
      }, 500);
    }
  }
  
  // Skoru kaydet
  saveScoreToLeaderboard(score);
}

// Skoru liderlik tablosuna kaydet
function saveScoreToLeaderboard(finalScore) {
  try {
    // Oyun istatistiklerini topla
    const gameStats = {
      lines_cleared: lines,
      level: level,
      duration_seconds: Math.floor((Date.now() - gameStartTime) / 1000),
      pieces_placed: pieces,
      tetris_count: tetrisCount
    };

    console.log(`Saving score for tetris: ${finalScore} points, difficulty: ${difficultyLevel}`);
    
    // Skor kaydetme (skor gösterimi olmadan)
    if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
      window.ScoreHandler.saveScore('tetris', finalScore, difficultyLevel, gameStats.duration_seconds, gameStats);
    } else if (typeof window.saveScoreAndDisplay === 'function') {
      window.saveScoreAndDisplay('tetris', finalScore, gameStats.duration_seconds, difficultyLevel, gameStats, function() {
        // Skor gösterimi kaldırıldı
      });
    } else {
      console.error("Skor kaydedici bulunamadı! API'ye doğrudan gönderiliyor...");
      // Alternatif olarak doğrudan API'ye gönder
      fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'tetris',
          score: finalScore,
          difficulty: difficultyLevel,
          playtime: gameStats.duration_seconds,
          game_stats: gameStats
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Score saved:", data);
        
        // XP bilgisini güncelle (varsa)
        if (data.xp_gained && document.getElementById('xp-gain')) {
          document.getElementById('xp-gain').textContent = data.xp_gained;
          document.getElementById('current-level').textContent = data.current_level;
          document.getElementById('next-level').textContent = data.next_level;
          
          // XP çubuğu
          setTimeout(() => {
            document.getElementById('level-progress-bar').style.width = data.level_progress + '%';
          }, 500);
        }
      })
      .catch(err => console.error("Skor kaydetme hatası:", err));
    }
  } catch (e) {
    console.error("Skor kaydetme işleminde hata:", e);
  }
}

// Liderlik tablosunu yükle
function loadLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboard-container');
  
  // Yükleniyor mesajı
  leaderboardContainer.innerHTML = '<div class="tetris-modern-leaderboard-loading"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';
  
  // API'den verileri al
  fetch(`/api/get-leaderboard/tetris?limit=10`)
    .then(response => response.json())
    .then(data => {
      // Liderlik tablosunu oluştur
      let html = '';
      
      if (data.length === 0) {
        html = '<div class="tetris-modern-leaderboard-empty">Henüz skor kaydedilmemiş</div>';
      } else {
        data.forEach((item, index) => {
          // Top 3 için özel sınıf ekle
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
      
      // Liderlik tablosunu güncelle
      leaderboardContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Liderlik tablosu yüklenirken hata:', error);
      leaderboardContainer.innerHTML = '<div class="tetris-modern-leaderboard-error">Liderlik tablosu yüklenemedi</div>';
    });
}

// Event Listeners ekle
function addEventListeners() {
  // Klavye kontrolleri
  keydownHandler = function(e) {
    if (gameOver) return;
    
    if (e.keyCode === 80) { // P tuşu - Duraklat
      togglePause();
      return;
    }
    
    if (paused) return;
    
    switch(e.keyCode) {
      case 37: // Sol ok
        piece.moveLeft();
        dropStart = Date.now();
        break;
      case 38: // Yukarı ok
        piece.rotate();
        dropStart = Date.now();
        break;
      case 39: // Sağ ok
        piece.moveRight();
        dropStart = Date.now();
        break;
      case 40: // Aşağı ok
        piece.moveDown();
        break;
      case 32: // Boşluk tuşu - Hard Drop
        piece.hardDrop();
        break;
      case 67: // C tuşu - Hold
        holdPieceFunction();
        break;
    }
  };
  
  document.addEventListener('keydown', keydownHandler);
  
  // Mobil dokunmatik kontroller
  if ('ontouchstart' in window) {
    // Touch kontrol butonlarını göster
    document.getElementById('touch-controls').style.display = 'block';
    
    // Touch başlangıç zamanı (uzun basma için)
    let touchStartTime = 0;
    let longTouchInterval;
    
    // Touch kontroller
    document.getElementById('touch-left').addEventListener('touchstart', function() {
      if (!gameOver && !paused) piece.moveLeft();
    });
    
    document.getElementById('touch-right').addEventListener('touchstart', function() {
      if (!gameOver && !paused) piece.moveRight();
    });
    
    document.getElementById('touch-rotate').addEventListener('touchstart', function() {
      if (!gameOver && !paused) piece.rotate();
    });
    
    document.getElementById('touch-drop').addEventListener('touchstart', function() {
      if (!gameOver && !paused) piece.hardDrop();
    });
    
    document.getElementById('touch-hold').addEventListener('touchstart', function() {
      if (!gameOver && !paused) holdPieceFunction();
    });
    
    document.getElementById('touch-down').addEventListener('touchstart', function() {
      if (gameOver || paused) return;
      
      touchStartTime = Date.now();
      piece.moveDown();
      
      // Uzun basıldığında sürekli aşağı indir
      longTouchInterval = setInterval(function() {
        if (Date.now() - touchStartTime > 200) { // 200ms'den uzun basıldığında
          piece.moveDown();
        }
      }, 100);
    });
    
    document.getElementById('touch-down').addEventListener('touchend', function() {
      clearInterval(longTouchInterval);
    });
  }
  
  // Zorluk seçimine göre oyunu güncelle
  document.getElementById('easy-btn').addEventListener('click', function() {
    setDifficulty('easy');
  });
  
  document.getElementById('medium-btn').addEventListener('click', function() {
    setDifficulty('medium');
  });
  
  document.getElementById('hard-btn').addEventListener('click', function() {
    setDifficulty('hard');
  });
  
  // Başlangıç butonu
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('start-game').addEventListener('click', startGame);
  
  // Oyunu devam ettir butonu
  document.getElementById('resume-game').addEventListener('click', function() {
    togglePause();
  });
  
  // Oyunu duraklat butonu
  document.getElementById('pause-game').addEventListener('click', function() {
    togglePause();
  });
  
  // Oyunu sıfırla butonu
  document.getElementById('reset-game').addEventListener('click', function() {
    // Önceki interval'i temizle
    clearInterval(gameInterval);
    
    // Oyunu sıfırla
    resetGame();
    
    // Overlay'leri kapat
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('tetris-overlay').style.display = 'none';
    
    // Oyunu başlat
    startGame();
  });
  
  // Tekrar oyna butonu
  document.getElementById('play-again').addEventListener('click', function() {
    // Oyunu sıfırla
    resetGame();
    
    // Overlay'i kapat
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('tetris-overlay').style.display = 'none';
    
    // Oyunu başlat
    startGame();
  });
}

// Sayfada DOMContentLoaded olduktan sonra
document.addEventListener('DOMContentLoaded', function() {
  // Liderlik tablosunu yükle
  loadLeaderboard();
  
  // Kayıtlı zorluk seviyesini kontrol et
  const savedDifficulty = localStorage.getItem('tetrisDifficulty');
  if (savedDifficulty) {
    setDifficulty(savedDifficulty);
  }
  
  // Tutulan parça canvas'ı varsa başlangıçta temizle
  if (document.getElementById('hold-piece-canvas')) {
    const holdCtx = document.getElementById('hold-piece-canvas').getContext('2d');
    clearCanvas(holdCtx, document.getElementById('hold-piece-canvas').width, document.getElementById('hold-piece-canvas').height);
  }
  
  // Profil kontrolü
  if (document.getElementById('guest-info')) {
    // Sistemi kontrol et ve misafir ise bilgi göster
    fetch('/api/get-current-user')
      .then(response => response.json())
      .then(data => {
        if (!data.user_id || data.user_id === 0) {
          document.getElementById('guest-info').style.display = 'block';
        } else {
          document.getElementById('guest-info').style.display = 'none';
        }
      })
      .catch(err => {
        console.error('Kullanıcı bilgisi alınamadı:', err);
      });
  }
});

// Sayfa kapatılırken event listener'ları temizle
window.addEventListener('beforeunload', function() {
  document.removeEventListener('keydown', keydownHandler);
  clearInterval(gameInterval);
});