/**
 * Labirent Oyunu - v2.0
 * 
 * Kullanıcının çeşitli labirentlerde yolu bulmasını gerektiren modern 2D labirent oyunu
 * 
 * Özellikler:
 * - Dinamik olarak oluşturulan labirentler 
 * - Çoklu zorluk seviyeleri (Kolay, Orta, Zor)
 * - Gelişmiş görsel efektler ve animasyonlar
 * - Kapsamlı puanlama sistemi
 * - Responsive tasarım - tüm cihazlarda uyumlu çalışma
 * - Dokunmatik, fare ve klavye kontrolleri
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elementleri
  const canvas = document.getElementById('labyrinthCanvas');
  const ctx = canvas.getContext('2d');
  const startButton = document.getElementById('labyrinthStartButton');
  const restartButton = document.getElementById('labyrinthRestartButton');
  const timerDisplay = document.getElementById('labyrinthTimer');
  const levelDisplay = document.getElementById('labyrinthLevel');
  const scoreDisplay = document.getElementById('labyrinthScore');
  const difficultyButtons = document.querySelectorAll('.difficulty-option');
  const gameSettings = document.getElementById('labyrinthSettings');
  const gamePlay = document.getElementById('labyrinthGameplay');
  const gameOver = document.getElementById('labyrinthGameOver');
  const finalScoreDisplay = document.getElementById('labyrinthFinalScore');
  const tutorial = document.getElementById('labyrinthTutorial');
  
  // Oyun Değişkenleri
  let maze = [];
  let mazeWidth = 15;
  let mazeHeight = 15;
  let cellSize = 30;
  let cellPadding = 2;
  let playerPosition = { x: 1, y: 1 };
  let goalPosition = { x: mazeWidth - 2, y: mazeHeight - 2 };
  let currentLevel = 1;
  let totalScore = 0;
  let timer = null;
  let timeLeft = 60;
  let gameActive = false;
  let difficulty = 1; // 1: Kolay, 2: Orta, 3: Zor
  let soundEnabled = true;
  let touchStartX = 0;
  let touchStartY = 0;
  let keyState = {};
  let visitedCells = {};
  let breadcrumbs = [];
  let flashlightRadius = 200; // Görüş alanı yarıçapı
  
  // Olası yönler: Yukarı, Sağ, Aşağı, Sol
  const DIRECTIONS = [
    { x: 0, y: -1 }, // Yukarı
    { x: 1, y: 0 },  // Sağ
    { x: 0, y: 1 },  // Aşağı
    { x: -1, y: 0 }  // Sol
  ];
  
  // Hücre tipleri
  const CELL_TYPES = {
    WALL: 0,
    PATH: 1,
    START: 2,
    GOAL: 3,
    VISITED: 4,
    BREADCRUMB: 5
  };
  
  // Renkler
  const COLORS = {
    WALL: '#1a1a2e',
    PATH: '#344955',
    START: '#4caf50',
    GOAL: '#f9a825',
    VISITED: 'rgba(100, 181, 246, 0.5)',
    BREADCRUMB: 'rgba(224, 64, 251, 0.4)',
    PLAYER: '#ff5252',
    BACKGROUND: '#0a0a1a',
    TEXT: '#ffffff'
  };
  
  // Canvas boyutunu ayarlama fonksiyonu
  function resizeCanvas() {
    const containerWidth = gamePlay.clientWidth - 40; // Padding için ayarlama
    const containerHeight = window.innerHeight * 0.7; // Yükseklik ekranın %70'i
    
    // Hücre boyutunu belirle (minimum 18px, maksimum 40px)
    cellSize = Math.max(18, Math.min(40, Math.floor(Math.min(
      containerWidth / mazeWidth,
      containerHeight / mazeHeight
    ))));
    
    // Canvas boyutlarını ayarla
    canvas.width = mazeWidth * cellSize;
    canvas.height = mazeHeight * cellSize;
    
    // Tampon değer
    cellPadding = Math.max(1, Math.floor(cellSize * 0.1));
    
    // Flashlight radius ayarlaması
    flashlightRadius = Math.max(150, Math.min(300, cellSize * 6));
    
    // Maze'i yeniden çiz
    if (maze.length > 0) {
      drawMaze();
    }
  }
  
  // Oyun başlangıç fonksiyonu
  function startGame() {
    // Zorluk seviyesine göre labirent boyutunu belirle
    mazeWidth = difficultyToSize(difficulty);
    mazeHeight = difficultyToSize(difficulty);
    
    // Başlangıç konumunu ayarla
    playerPosition = { x: 1, y: 1 };
    goalPosition = { x: mazeWidth - 2, y: mazeHeight - 2 };
    
    // Zamanı ayarla (zorluk seviyesine göre)
    timeLeft = difficultyToTime(difficulty);
    
    // Skoru sıfırla ve seviyeyi ayarla
    totalScore = 0;
    currentLevel = 1;
    
    // Ziyaret edilen hücreleri sıfırla
    visitedCells = {};
    breadcrumbs = [];
    
    // Canvas boyutunu ayarla
    resizeCanvas();
    
    // Labirent oluştur
    generateMaze();
    
    // Görünümü güncelle
    gameSettings.classList.add('d-none');
    tutorial.classList.add('d-none');
    gamePlay.classList.remove('d-none');
    gameOver.classList.add('d-none');
    
    // Oyun durumunu güncelle
    gameActive = true;
    
    // Oyun zamanını başlat
    startTimer();
    
    // Kontrol dinleyicilerini ekle
    addControlListeners();
    
    // Görünümü güncelle
    updateUI();
    drawMaze();
    
    // Başlangıç hücresini işaretle
    markCellAsVisited(playerPosition.x, playerPosition.y);
  }
  
  // Labirent oluşturma fonksiyonu (Recursive Backtracking algoritması)
  function generateMaze() {
    // Labirent dizisini başlat (tüm hücreler duvar)
    maze = Array(mazeHeight).fill().map(() => Array(mazeWidth).fill(CELL_TYPES.WALL));
    
    // Başlangıç ve bitiş noktalarını ayarla
    playerPosition = { x: 1, y: 1 };
    goalPosition = { x: mazeWidth - 2, y: mazeHeight - 2 };
    
    // Recursive Backtracking ile labirent oluştur
    carvePassagesFrom(1, 1);
    
    // Başlangıç ve bitiş noktalarını işaretle
    maze[playerPosition.y][playerPosition.x] = CELL_TYPES.START;
    maze[goalPosition.y][goalPosition.x] = CELL_TYPES.GOAL;
  }
  
  // Recursive Backtracking for maze generation
  function carvePassagesFrom(x, y) {
    // Mevcut hücreyi yol yap
    maze[y][x] = CELL_TYPES.PATH;
    
    // Yönleri karıştır
    const directions = [...DIRECTIONS];
    shuffleArray(directions);
    
    // Tüm yönleri dene
    for (const dir of directions) {
      // İki hücre ötesindeki konumu hesapla (duvarları atla)
      const nx = x + dir.x * 2;
      const ny = y + dir.y * 2;
      
      // Eğer bu konum sınırlar içindeyse ve daha önce ziyaret edilmediyse
      if (nx > 0 && nx < mazeWidth && ny > 0 && ny < mazeHeight && maze[ny][nx] === CELL_TYPES.WALL) {
        // Duvarı kır (aradaki hücreyi yol yap)
        maze[y + dir.y][x + dir.x] = CELL_TYPES.PATH;
        
        // Recursive olarak devam et
        carvePassagesFrom(nx, ny);
      }
    }
  }
  
  // Labirenti çizme fonksiyonu
  function drawMaze() {
    // Canvas'ı temizle
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Yarı saydamlığı aktifleştir
    ctx.globalAlpha = 0.15;
    
    // Tam labirenti çiz (yarı saydamlıkla)
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        const cellType = maze[y][x];
        drawCell(x, y, cellType, false);
      }
    }
    
    // Yarı saydamlığı sıfırla
    ctx.globalAlpha = 1.0;
    
    // Ziyaret edilen hücreleri işaretle
    Object.keys(visitedCells).forEach(key => {
      const [x, y] = key.split(',').map(Number);
      drawCell(x, y, CELL_TYPES.VISITED, false);
    });
    
    // Breadcrumbs çiz
    breadcrumbs.forEach(crumb => {
      drawCell(crumb.x, crumb.y, CELL_TYPES.BREADCRUMB, false);
    });
    
    // Flashlight efekti ekle
    addFlashlightEffect();
    
    // Başlangıç ve bitiş noktalarını çiz
    drawCell(playerPosition.x, playerPosition.y, CELL_TYPES.START, true);
    drawCell(goalPosition.x, goalPosition.y, CELL_TYPES.GOAL, true);
    
    // Oyuncuyu çiz
    drawPlayer();
  }
  
  // Flashlight efekti
  function addFlashlightEffect() {
    const gradient = ctx.createRadialGradient(
      playerPosition.x * cellSize + cellSize / 2,
      playerPosition.y * cellSize + cellSize / 2,
      flashlightRadius * 0.2, // İç yarıçap
      playerPosition.x * cellSize + cellSize / 2,
      playerPosition.y * cellSize + cellSize / 2,
      flashlightRadius // Dış yarıçap
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Tamamen şeffaf
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.85)'); // Yarı saydam
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)'); // Neredeyse tamamen opak
    
    // Flashlight maskesi oluştur
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Hücre çizme fonksiyonu
  function drawCell(x, y, cellType, alwaysVisible = false) {
    const cellX = x * cellSize;
    const cellY = y * cellSize;
    
    // Eğer hücre görüş alanı dışındaysa ve her zaman görünür değilse çizme
    if (!alwaysVisible) {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - x, 2) + 
        Math.pow(playerPosition.y - y, 2)
      );
      
      if (distance > flashlightRadius / cellSize * 0.35) {
        return;
      }
    }
    
    // Hücre tipine göre renk belirle
    let color;
    switch(cellType) {
      case CELL_TYPES.WALL:
        color = COLORS.WALL;
        break;
      case CELL_TYPES.PATH:
        color = COLORS.PATH;
        break;
      case CELL_TYPES.START:
        color = COLORS.START;
        break;
      case CELL_TYPES.GOAL:
        color = COLORS.GOAL;
        break;
      case CELL_TYPES.VISITED:
        color = COLORS.VISITED;
        break;
      case CELL_TYPES.BREADCRUMB:
        color = COLORS.BREADCRUMB;
        break;
      default:
        color = COLORS.PATH;
    }
    
    // Hücreyi çiz
    ctx.fillStyle = color;
    ctx.fillRect(
      cellX + cellPadding,
      cellY + cellPadding,
      cellSize - cellPadding * 2,
      cellSize - cellPadding * 2
    );
    
    // Başlangıç ve bitiş noktaları için simge çiz
    if (cellType === CELL_TYPES.START || cellType === CELL_TYPES.GOAL) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(
        cellX + cellSize / 2,
        cellY + cellSize / 2,
        cellSize / 6,
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  
  // Oyuncuyu çizme fonksiyonu
  function drawPlayer() {
    const playerX = playerPosition.x * cellSize + cellSize / 2;
    const playerY = playerPosition.y * cellSize + cellSize / 2;
    const playerRadius = cellSize / 3;
    
    // Oyuncu etrafında parlama efekti
    const gradient = ctx.createRadialGradient(
      playerX, playerY, playerRadius * 0.5,
      playerX, playerY, playerRadius * 1.5
    );
    gradient.addColorStop(0, COLORS.PLAYER);
    gradient.addColorStop(1, 'rgba(255, 82, 82, 0)');
    
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Oyuncu ana daireyi çiz
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fill();
    
    // Oyuncu üzerinde pulsing ışık efekti
    const time = Date.now() * 0.0025;
    const pulseSize = Math.sin(time) * 0.2 + 0.8;
    
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius * pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  }
  
  // Oyuncu hareketini kontrol et
  function movePlayer(direction) {
    if (!gameActive) return;
    
    // Yeni konumu hesapla
    const newPosition = {
      x: playerPosition.x + direction.x,
      y: playerPosition.y + direction.y
    };
    
    // Eğer yeni konum duvar değilse hareket et
    if (
      newPosition.x >= 0 && 
      newPosition.x < mazeWidth && 
      newPosition.y >= 0 && 
      newPosition.y < mazeHeight && 
      maze[newPosition.y][newPosition.x] !== CELL_TYPES.WALL
    ) {
      // Mevcut konumu breadcrumb olarak işaretle
      breadcrumbs.push({ ...playerPosition });
      if (breadcrumbs.length > 10) {
        breadcrumbs.shift(); // Maksimum 10 izleme noktası
      }
      
      // Oyuncuyu taşı
      playerPosition = newPosition;
      
      // Hücreyi ziyaret edildi olarak işaretle
      markCellAsVisited(newPosition.x, newPosition.y);
      
      // Labirenti yeniden çiz
      drawMaze();
      
      // Bitiş noktasına ulaşıldı mı kontrol et
      checkGoal();
    }
  }
  
  // Hücreyi ziyaret edildi olarak işaretle
  function markCellAsVisited(x, y) {
    visitedCells[`${x},${y}`] = true;
  }
  
  // Bitiş noktasına ulaşılıp ulaşılmadığını kontrol et
  function checkGoal() {
    if (
      playerPosition.x === goalPosition.x &&
      playerPosition.y === goalPosition.y
    ) {
      // Oynama süresini hesapla
      const playTime = difficultyToTime(difficulty, currentLevel) - timeLeft;
      
      // Toplam hamle sayısını breadcrumbs ile hesapla
      const totalMoves = breadcrumbs.length;
      
      // Zorluk seviyesini string olarak belirle
      let difficultyName;
      switch(difficulty) {
        case 1: difficultyName = 'easy'; break;
        case 2: difficultyName = 'medium'; break;
        case 3: difficultyName = 'hard'; break;
        default: difficultyName = 'medium';
      }
      
      // Standartlaştırılmış puan hesaplama sistemini kullan
      const scoreParams = {
        gameType: 'labyrinth',
        difficulty: difficultyName,
        timeSpent: playTime,
        optimalTime: difficultyToTime(difficulty, currentLevel) * 0.6, // Optimal süre: toplam sürenin %60'ı
        totalMoves: totalMoves,
        correctMoves: totalMoves, // Labirentte tüm hamleler geçerli
        hintsUsed: 0, // Labirentte ipucu kullanımı yok
        level: currentLevel,
        maxLevel: 5, // Varsayılan maksimum seviye 5
        gameSpecificStats: {
          level: currentLevel,
          completed: true,
          visitedCells: Object.keys(visitedCells).length,
          timeLeft: timeLeft
        }
      };
      
      // Standardize edilmiş puanı hesapla
      const scoreDetails = window.ScoreCalculator.calculate(scoreParams);
      const levelPoints = scoreDetails.finalScore;
      
      // Puanı güncelle
      totalScore += levelPoints;
      
      // Başarı mesajı göster
      showLevelCompleteMessage(scoreDetails);
      
      // Zamanlayıcıyı durdur
      clearInterval(timer);
      
      // Seviyeyi yükselt ve yeni labirent oluştur
      setTimeout(() => {
        currentLevel++;
        
        // Zorluk seviyesine göre labirent boyutunu artır
        mazeWidth = difficultyToSize(difficulty, currentLevel);
        mazeHeight = difficultyToSize(difficulty, currentLevel);
        
        // Ziyaret edilen hücreleri sıfırla
        visitedCells = {};
        breadcrumbs = [];
        
        // Canvas boyutunu ayarla
        resizeCanvas();
        
        // Yeni labirent oluştur
        generateMaze();
        
        // Zamanı yenile
        timeLeft = difficultyToTime(difficulty, currentLevel);
        
        // Zamanlayıcıyı başlat
        startTimer();
        
        // Görünümü güncelle
        updateUI();
        drawMaze();
        
        // Başlangıç hücresini işaretle
        markCellAsVisited(playerPosition.x, playerPosition.y);
      }, 2000);
    }
  }
  
  // Seviye tamamlandı mesajını göster
  function showLevelCompleteMessage(scoreDetails) {
    const message = document.createElement('div');
    message.className = 'level-complete-message';
    
    // Puanlama detaylarını al
    const bd = scoreDetails.breakdown;
    const finalScore = scoreDetails.finalScore;
    
    message.innerHTML = `
      <h3>Seviye ${currentLevel} Tamamlandı!</h3>
      <div class="score-breakdown mini-breakdown">
        <div class="score-detail">
          <span class="detail-label">Temel Puan:</span>
          <span class="detail-value">+${bd.baseScore}</span>
        </div>
        <div class="score-detail">
          <span class="detail-label">Seviye Bonusu:</span>
          <span class="detail-value">+${bd.levelBonus}</span>
        </div>
        <div class="score-detail">
          <span class="detail-label">Zaman Bonusu:</span>
          <span class="detail-value">+${bd.timeBonus}</span>
        </div>
        <div class="score-detail">
          <span class="detail-label">Hamle Bonusu:</span>
          <span class="detail-value">+${bd.moveBonus}</span>
        </div>
        <div class="score-detail multiplier">
          <span class="detail-label">Zorluk Çarpanı:</span>
          <span class="detail-value">×${bd.difficultyMultiplier.toFixed(1)}</span>
        </div>
        <div class="score-detail total">
          <span class="detail-label">Toplam:</span>
          <span class="detail-value">${finalScore}</span>
        </div>
      </div>
      <div class="next-level-text">Sonraki seviye hazırlanıyor...</div>
    `;
    
    const messageContainer = document.getElementById('labyrinthMessages');
    messageContainer.innerHTML = '';
    messageContainer.appendChild(message);
    
    // Animasyon ile mesajı göster
    setTimeout(() => {
      message.classList.add('show');
    }, 100);
    
    // Mesajı belirli bir süre sonra kaldır
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => {
        messageContainer.innerHTML = '';
      }, 500);
    }, 1900);
    
    // Ses çal
    playSound('levelComplete');
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }
  
  // Oyunu sonlandır
  function endGame() {
    // Oyun durumunu güncelle
    gameActive = false;
    
    // Zamanlayıcıyı durdur
    clearInterval(timer);
    
    // Kontrol dinleyicilerini kaldır
    removeControlListeners();
    
    // Skoru arka planda kaydet, ekranda göstermeden
    saveScore();
    
    // Ses çal
    playSound('gameOver');
    
    // Oyun ekranını gizle ve ana menüye yönlendir
    gamePlay.classList.add('d-none');
    
    // Kullanıcıyı tüm oyunlar sayfasına yönlendir
    setTimeout(() => {
      window.location.href = '/all_games';
    }, 1000);
  }
  
  // Oyunu yeniden başlat
  function restartGame() {
    gameOver.classList.add('d-none');
    gameSettings.classList.remove('d-none');
  }
  
  // Kontrol dinleyicilerini ekle
  function addControlListeners() {
    // Klavye kontrolleri
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Dokunmatik kontroller
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Fare kontrolleri
    canvas.addEventListener('click', handleClick);
    
    // Hareket fonksiyonunu çağır
    requestAnimationFrame(processPlayerMovement);
  }
  
  // Kontrol dinleyicilerini kaldır
  function removeControlListeners() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('click', handleClick);
  }
  
  // Klavye olayı işleyici - tuşa basma
  function handleKeyDown(e) {
    keyState[e.key] = true;
    
    // Varsayılan davranışı engellemek için (sayfa kaydırma gibi)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }
  
  // Klavye olayı işleyici - tuşu bırakma
  function handleKeyUp(e) {
    keyState[e.key] = false;
  }
  
  // Oyuncu hareketi işleme
  function processPlayerMovement() {
    if (gameActive) {
      // Yukarı
      if (keyState['ArrowUp'] || keyState['w']) {
        movePlayer(DIRECTIONS[0]);
      }
      // Sağ
      else if (keyState['ArrowRight'] || keyState['d']) {
        movePlayer(DIRECTIONS[1]);
      }
      // Aşağı
      else if (keyState['ArrowDown'] || keyState['s']) {
        movePlayer(DIRECTIONS[2]);
      }
      // Sol
      else if (keyState['ArrowLeft'] || keyState['a']) {
        movePlayer(DIRECTIONS[3]);
      }
      
      // Animasyonu sürdür
      requestAnimationFrame(processPlayerMovement);
    }
  }
  
  // Dokunmatik başlangıç olayı
  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }
  
  // Dokunmatik hareket olayı
  function handleTouchMove(e) {
    e.preventDefault();
  }
  
  // Dokunmatik sonlanma olayı
  function handleTouchEnd(e) {
    e.preventDefault();
    
    if (!gameActive) return;
    
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Minimum hareket mesafesi (piksel olarak)
      const minSwipeDistance = 30;
      
      // Hareket yönünü belirleme
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Yatay hareket
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            // Sağa hareket
            movePlayer(DIRECTIONS[1]);
          } else {
            // Sola hareket
            movePlayer(DIRECTIONS[3]);
          }
        }
      } else {
        // Dikey hareket
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            // Aşağı hareket
            movePlayer(DIRECTIONS[2]);
          } else {
            // Yukarı hareket
            movePlayer(DIRECTIONS[0]);
          }
        }
      }
    }
  }
  
  // Fare tıklama olayı
  function handleClick(e) {
    if (!gameActive) return;
    
    // Canvas içindeki tıklama pozisyonunu hesapla
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor((e.clientX - rect.left) / cellSize);
    const clickY = Math.floor((e.clientY - rect.top) / cellSize);
    
    // Oyuncu etrafındaki hücrelere tıklama kontrolü
    const validMoves = DIRECTIONS.map(dir => ({
      x: playerPosition.x + dir.x,
      y: playerPosition.y + dir.y,
      dir: dir
    }));
    
    for (const move of validMoves) {
      if (clickX === move.x && clickY === move.y) {
        if (maze[move.y][move.x] !== CELL_TYPES.WALL) {
          movePlayer(move.dir);
          break;
        }
      }
    }
  }
  
  // Skoru kaydet
  function saveScore() {
    // Oynama süresini hesapla
    const playTime = difficultyToTime(difficulty, currentLevel) - timeLeft;
    
    // Toplam hamle sayısını breadcrumbs ile hesapla
    const totalMoves = breadcrumbs.length;
    
    // Zorluk seviyesini string olarak belirle
    let difficultyName;
    switch(difficulty) {
      case 1: difficultyName = 'easy'; break;
      case 2: difficultyName = 'medium'; break;
      case 3: difficultyName = 'hard'; break;
      default: difficultyName = 'medium';
    }
    
    // Standartlaştırılmış puan hesaplama sistemini kullan
    const scoreParams = {
      gameType: 'labyrinth',
      difficulty: difficultyName,
      timeSpent: playTime,
      optimalTime: difficultyToTime(difficulty, currentLevel) * 0.6, // Optimal süre: toplam sürenin %60'ı
      totalMoves: totalMoves,
      correctMoves: totalMoves, // Labirentte tüm hamleler geçerli
      hintsUsed: 0, // Labirentte ipucu kullanımı yok
      level: currentLevel,
      maxLevel: 5, // Varsayılan maksimum seviye 5
      gameSpecificStats: {
        level: currentLevel,
        completed: gameActive === false,
        visitedCells: Object.keys(visitedCells).length,
        timeLeft: timeLeft
      }
    };
    
    // Standardize edilmiş puanı hesapla
    const scoreDetails = window.ScoreCalculator.calculate(scoreParams);
    const finalScore = scoreDetails.finalScore;
    
    console.log(`Standardize edilmiş labirent puanı: ${finalScore}`);
    
    // Oyun tamamlandı eventi oluştur (puan hesaplayıcı için)
    const gameCompletedEvent = new CustomEvent('gameCompleted', {
      detail: {
        gameType: 'labyrinth',
        score: finalScore,
        difficulty: difficultyName,
        playtime: playTime,
        stats: {
          level: currentLevel,
          totalMoves: totalMoves,
          visitedCells: Object.keys(visitedCells).length,
          timeLeft: timeLeft,
          scoreBreakdown: scoreDetails.breakdown
        }
      }
    });
    
    // Eventi dağıt (bu, ana score-handler.js'deki kaydetme fonksiyonunu tetikleyecek)
    document.dispatchEvent(gameCompletedEvent);
    
    // Ekrandaki toplam puanı güncelle
    totalScore = finalScore;
    updateUI();
  }
  
  // UI güncellemeleri
  function updateUI() {
    levelDisplay.textContent = currentLevel;
    scoreDisplay.textContent = totalScore;
    updateTimerDisplay();
  }
  
  // Zamanlayıcı göstergesini güncelle
  function updateTimerDisplay() {
    timerDisplay.textContent = timeLeft;
    
    // Son 10 saniye için kırmızı renk
    if (timeLeft <= 10) {
      timerDisplay.classList.add('warning');
    } else {
      timerDisplay.classList.remove('warning');
    }
  }
  
  // Zorluk seviyesine göre labirent boyutu
  function difficultyToSize(diff, level = 1) {
    const baseSize = {
      1: 11, // Kolay
      2: 15, // Orta
      3: 21  // Zor
    }[diff] || 11;
    
    // Her 3 seviyede bir boyutu artır (maksimum 51)
    const levelBonus = Math.min(30, Math.floor((level - 1) / 3) * 2);
    
    return baseSize + levelBonus;
  }
  
  // Zorluk seviyesine göre zaman
  function difficultyToTime(diff, level = 1) {
    const baseTime = {
      1: 90,  // Kolay
      2: 120, // Orta
      3: 180  // Zor
    }[diff] || 90;
    
    // Her seviye için ek süre
    const levelBonus = (level - 1) * 10;
    
    return baseTime + levelBonus;
  }
  
  // Ses çalma
  function playSound(soundName) {
    if (!soundEnabled) return;
    
    const sounds = {
      move: '/static/sounds/move.mp3',
      levelComplete: '/static/sounds/level-complete.mp3',
      gameOver: '/static/sounds/game-over.mp3'
    };
    
    if (sounds[soundName]) {
      const sound = new Audio(sounds[soundName]);
      sound.volume = 0.5;
      sound.play().catch(e => console.log('Ses yüklenirken hata oluştu:', e));
    }
  }
  
  // Ses açma/kapama
  function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundButton = document.getElementById('labyrinthSoundToggle');
    
    if (soundEnabled) {
      soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundButton.classList.add('active');
    } else {
      soundButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundButton.classList.remove('active');
    }
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Pencere yeniden boyutlandırma
  window.addEventListener('resize', resizeCanvas);
  
  // Başlangıç ayarları
  function init() {
    // Zorluk seviyesi butonlarını ayarla
    difficultyButtons.forEach(button => {
      button.addEventListener('click', function() {
        difficultyButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        difficulty = parseInt(this.dataset.difficulty);
      });
    });
    
    // Varsayılan zorluk seviyesi
    document.querySelector('.difficulty-option[data-difficulty="1"]').classList.add('active');
    
    // Başlat butonu
    startButton.addEventListener('click', startGame);
    
    // Yeniden başlat butonu
    restartButton.addEventListener('click', restartGame);
    
    // Ses toggle butonu
    document.getElementById('labyrinthSoundToggle').addEventListener('click', toggleSound);
    
    // Canvas boyutunu ayarla
    resizeCanvas();
  }
  
  // Oyunu başlat
  init();
});