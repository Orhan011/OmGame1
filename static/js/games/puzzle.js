/**
 * Yapboz Oyunu - 1.0
 * 
 * Modern ve profesyonel bir yapboz oyunu uygulaması.
 * Oyuncular bir görseli parçalara ayırıp karıştırarak doğru şekilde yeniden birleştirmeye çalışırlar.
 * 
 * Özellikler:
 * - Görsellerin parçalara ayrılması ve yeniden birleştirilmesi
 * - Sürükle-Bırak arayüzü
 * - Zorluk seviyeleri (Kolay, Orta, Zor)
 * - Puan sistemi
 * - Süre takibi ve hamle sayacı
 * - Ses efektleri
 * - Yıldız derecelendirme sistemi
 * - Başarımlar
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const referenceImage = document.getElementById('reference-image');
  const startGameButton = document.getElementById('start-game');
  const pauseButton = document.getElementById('pause-game');
  const resumeButton = document.getElementById('resume-game');
  const restartButton = document.getElementById('restart-game');
  const shuffleButton = document.getElementById('shuffle-puzzle');
  const pauseOverlay = document.getElementById('pause-overlay');
  const soundToggle = document.getElementById('sound-toggle');
  const playAgainButton = document.getElementById('play-again');
  const copyScoreButton = document.getElementById('copy-score');
  const shareScoreButton = document.getElementById('share-score');
  const levelButtons = document.querySelectorAll('.level-btn');

  // Skore ve zaman göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const levelDisplay = document.getElementById('level-display');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalMoves = document.getElementById('final-moves');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const alertContainer = document.getElementById('alert-container');

  // Oyun durumu
  let gameState = {
    isPlaying: false,
    isPaused: false,
    difficulty: 'EASY',
    level: 1,
    score: 0,
    moves: 0,
    timeRemaining: 300, // 5 dakika
    timerInterval: null,
    soundEnabled: true,
    grid: {
      rows: 3,
      cols: 3
    },
    puzzlePieces: [],
    selectedPiece: null,
    correctPlacements: 0,
    bonusPoints: 0,
    achievements: []
  };

  // Seslerin ön yüklemesi
  const sounds = {
    pickup: new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAD+/wMA+v8IAA8ABgAIABkA9v/o//v/AgAFABQA/P/P/+3/AsAPAAQAyf+h/7T/2//9//H/vf+Z/7P/2P8DAA0A+/+9/8L/x//z/+//zv+//+7/8v/R/7r/qf/E/9X/AwAQAPL/xP/V/+z/6P/1//z/9//f/+X/7v8QAAEA7P/c/9f/vP/R//L/5/++/9D//f8hAAUA0f/a/9X/CQAMAPz/4//X/9//AQD2/x0A9v/3/wMAxf/n/wcAFgACAPP//P8GAAcAAgAHAAEADgAQAAwA+v/5/+L/8/8DABcA+P/6/+X/5P/s/+P/2P/P//j/7f/e/9H/5//1//P/7/8IAAQA+f8QAAwAKQAEAO//9f/l/wMA4//1/wAA3//0//D/BQAUAOv/8v/4/w4ABwAJABIA9v/6/+f/8v/t//n/6f8CAOv/9P/X/9//8//9/+v/4//n//n//f8aAAgABwADAAUA7v/O/9v/8f/2//j/7P/0//3/6//8/wsACgADAPL/6//4/+7/8v/r/+v/+f/5//b//v/9//7/AgACAAAA9v/t//f//v8GAPH/8P/0//T/+P/5//n//f8BAAIA/f/5//j/+f/7//3//v///wEA///9//z//f8AAAMAAQAAAP7//v8AAAEAAQAAAP7//v///wEAAQABAAAA//8AAAAAAAAAAAAAAAAAAAEAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    place: new Audio('data:audio/wav;base64,UklGRrQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YaADAAD/////Gxz//9fXra3t7UlJoJ/Q0CMj/v6Dg8/P5eUvLykpmpkoKP//MjIzMysrIyOVlYWF1tYQED09y8vi4jMzGBg3N1BQ7e2np62tpaWtrb29vb21ta2tra2Rkbm5n5+Hh7m5wcGvr5+fqalYWDIyHh4YGDAwEBDw8Nra2trh4e/v+fnu7vHx/f0GBg8PEREKChUVGhoYGBISGRkYGBMTDw8NDQ0NCQkLCwcHBwcEBAcHBQUDAwICAgIBAfz8+fn39/X19PTz8/Pz8/Py8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vI='),
    complete: new Audio('data:audio/wav;base64,UklGRiQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAAD////////+//////7//v/////////+/////v////////////7////+//////////////7////9////+//5//j/+v/7//v//P/+//7///8AAP////8AAAAA/v///wAAAAD//wAA//8AAP//AQD+/wAAAAACAP//AQD9/wAA//8DAP//AgD8/wEA/v8DAP//AwD7/wEA/f8FAAIABAACAAEA/f8CAAUABQAFAPz/AAD//wMAAwAHAP//AgDy/wIAAQAHAAAA//8OAAoADgAHAAUAEgD//xIACwADAPD/AAD4//H/CAAEABIA7v/x/wYA7//7//X/7f/z/wcA8v/P//T/y/8cAP//LQAaAA0AFgAEAP//z/8MAPL/HQAdACwAEQD7/wQA4P8iAN//EAAtAAQAUQA0AP//8//u//r/5P/z/+j/3//H//b/6v8kAPD/8P8KAOf/FgD3/wEADQDu//j/3//3/w8A6f8PAOv/3v8YAOv/FwD9/wIAAwDv//H/7f8MAAAADwAfAAcAJgA5APj/KwAcAPL/CQASAOf/NQACAPb/9/8CAPL/AwD//xMATABBAEYAKwAWAP3/9P8FAOz/AgDm/wQA5v/W/9z/zf/p//7//v8IAAEABgAEAP7///8GAAQABgAEAP7/AAAGAP//AQAAAP7/AAABAP//AgD//wEAAAD+/wAAAQD//wEA//8BAP//AgAAAP//AAABAP7/AQAAAP//AgAAAP//AAABAP//AwD+/wEA/v8BAP//AgD//wEA//8BAP//AgD//wEAAAD//wEAAAD//wEA//8CAP//AgD//wEA//8BAAAA//8BAAAA//8BAP//AQD//wEA//8BAAAAAAD//wEA//8BAP//AQAAAP//AQAAAP//AQD//wEA//8BAAAAAAAAAAAAAQD//wEA/////wAA//8BAAAAAAD//wAAAAAAAAEA/////wAA//8=')
  };

  // Örnek görseller (SVG)
  const puzzleImages = [
    // Geometrik desenler
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#1a1a2e"/>
      <circle cx="150" cy="150" r="100" fill="#4d3ee3"/>
      <rect x="100" y="100" width="100" height="100" fill="#f72585"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2d3436"/>
      <polygon points="150,50 250,150 150,250 50,150" fill="#00b894"/>
      <circle cx="150" cy="150" r="50" fill="#fd79a8"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#130f40"/>
      <rect x="50" y="50" width="200" height="200" fill="#e056fd" transform="rotate(45 150 150)"/>
      <circle cx="150" cy="150" r="70" fill="#7bed9f"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2c3e50"/>
      <circle cx="100" cy="100" r="60" fill="#e74c3c"/>
      <circle cx="200" cy="200" r="60" fill="#3498db"/>
      <circle cx="150" cy="150" r="40" fill="#2ecc71"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#192a56"/>
      <path d="M150 50 L250 150 L150 250 L50 150 Z" fill="#ffa502"/>
      <circle cx="150" cy="150" r="50" fill="#ff6348"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#1a1a2e"/>
      <rect x="25" y="25" width="250" height="250" fill="#38184c" rx="20"/>
      <circle cx="100" cy="100" r="40" fill="#f72585"/>
      <circle cx="200" cy="100" r="40" fill="#7209b7"/>
      <circle cx="100" cy="200" r="40" fill="#4cc9f0"/>
      <circle cx="200" cy="200" r="40" fill="#4d3ee3"/>
    </svg>`
  ];

  // Başarımlar
  const achievements = [
    { id: 'quick_solver', name: 'Hızlı Çözücü', condition: (state) => state.timeRemaining > 180 && state.difficulty === 'EASY' },
    { id: 'perfect_puzzle', name: 'Mükemmel Yapboz', condition: (state) => state.moves < state.grid.rows * state.grid.cols * 2 },
    { id: 'master_puzzler', name: 'Yapboz Ustası', condition: (state) => state.difficulty === 'HARD' && state.correctPlacements === state.grid.rows * state.grid.cols }
  ];

  // Oyunu başlat
  startGameButton.addEventListener('click', startGame);
  playAgainButton.addEventListener('click', resetGame);

  // Zorluk seviyesi ayarları
  levelButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Aktif sınıfı kaldır
      levelButtons.forEach(btn => btn.classList.remove('active'));
      // Seçilen düğmeye aktif sınıfı ekle
      button.classList.add('active');
      // Zorluğu ayarla
      gameState.difficulty = button.dataset.level;

      // Zorluk seviyesine göre ızgara boyutları ayarla
      // Cihaz genişliğini kontrol et
      const isMobile = window.innerWidth < 576;

      if (gameState.difficulty === 'EASY') {
        gameState.grid.rows = 3;
        gameState.grid.cols = 3;
      } else if (gameState.difficulty === 'MEDIUM') {
        gameState.grid.rows = 4;
        gameState.grid.cols = 4;
      } else if (gameState.difficulty === 'HARD') {
        // Mobil cihazlar için en zor seviyeyi azalt
        if (isMobile) {
          gameState.grid.rows = 4;
          gameState.grid.cols = 4;
        } else {
          gameState.grid.rows = 5;
          gameState.grid.cols = 5;
        }
      }
    });
  });

  // Ses ayarları
  soundToggle.addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggle.innerHTML = gameState.soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    soundToggle.classList.toggle('active', gameState.soundEnabled);
  });

  // Duraklatma işlemleri
  pauseButton.addEventListener('click', togglePause);
  resumeButton.addEventListener('click', resumeGame);
  restartButton.addEventListener('click', resetGame);

  // Yapbozu karıştır
  shuffleButton.addEventListener('click', () => {
    if (!gameState.isPaused && gameState.isPlaying) {
      shufflePuzzle();
      gameState.moves += 3; // Karıştırma hamle sayısını artırır
      updateMovesDisplay();
    }
  });

  // Paylaşım butonları
  copyScoreButton.addEventListener('click', copyScore);
  shareScoreButton.addEventListener('click', shareScore);

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Giriş ekranını gizle, oyun ekranını göster
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';

    // Oyun durumunu ayarla
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.moves = 0;
    gameState.correctPlacements = 0;
    gameState.bonusPoints = 0;
    gameState.achievements = [];

    // Cihaz genişliğini kontrol et
    const isMobile = window.innerWidth < 576;

    // Zorluğa göre ızgara boyutlarını ve süreyi ayarla
    if (gameState.difficulty === 'EASY') {
      gameState.grid.rows = 3;
      gameState.grid.cols = 3;
      gameState.timeRemaining = 300; // 5 dakika
    } else if (gameState.difficulty === 'MEDIUM') {
      gameState.grid.rows = 4;
      gameState.grid.cols = 4;
      gameState.timeRemaining = 450; // 7.5 dakika
      gameState.level = 2;
    } else if (gameState.difficulty === 'HARD') {
      // Mobil cihazlar için en zor seviyeyi azalt
      if (isMobile) {
        gameState.grid.rows = 4;
        gameState.grid.cols = 4;
      } else {
        gameState.grid.rows = 5;
        gameState.grid.cols = 5;
      }
      gameState.timeRemaining = 600; // 10 dakika
      gameState.level = 3;
    }

    updateLevelDisplay();
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();

    // Yapbozu oluştur
    createPuzzle();

    // Zamanlayıcıyı başlat
    startTimer();
  }

  /**
   * Zamanlayıcıyı başlatır
   */
  function startTimer() {
    clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
      if (!gameState.isPaused && gameState.isPlaying) {
        gameState.timeRemaining--;
        updateTimerDisplay();

        if (gameState.timeRemaining <= 0) {
          endGame(false);
        }
      }
    }, 1000);
  }

  /**
   * Yapbozu oluşturur
   */
  function createPuzzle() {
    // Rastgele bir görsel seç
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    const selectedImage = puzzleImages[randomIndex];

    // Referans görseli göster
    referenceImage.innerHTML = selectedImage;

    // Izgara boyutlarını ayarla - cihaz boyutuna göre optimize et
    puzzleGrid.style.gridTemplateRows = `repeat(${gameState.grid.rows}, 1fr)`;
    puzzleGrid.style.gridTemplateColumns = `repeat(${gameState.grid.cols}, 1fr)`;

    // Izgara içeriğini temizle
    puzzleGrid.innerHTML = '';

    // Yapboz parçalarını oluştur
    gameState.puzzlePieces = [];

    for (let i = 0; i < gameState.grid.rows; i++) {
      for (let j = 0; j < gameState.grid.cols; j++) {
        const piece = {
          id: i * gameState.grid.cols + j,
          correctRow: i,
          correctCol: j,
          currentRow: i,
          currentCol: j,
          isCorrect: false
        };

        gameState.puzzlePieces.push(piece);

        // Parça elementi oluştur
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.dataset.id = piece.id;

        // SVG'yi kırparak her parçaya uygun görseli yerleştir
        const svgClone = selectedImage.replace('<svg', `<svg data-id="${piece.id}"`);

        // Her bir parça için görünüm stilleri ekle
        const viewBox = `${j * 300 / gameState.grid.cols} ${i * 300 / gameState.grid.rows} ${300 / gameState.grid.cols} ${300 / gameState.grid.rows}`;
        pieceElement.innerHTML = svgClone.replace('viewBox="0 0 300 300"', `viewBox="${viewBox}"`);

        // SVG kenar çizgisini hafiflet
        const svgElement = pieceElement.querySelector('svg');
        if (svgElement) {
          svgElement.style.strokeWidth = '0.8'; // Daha ince kenar çizgisi
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
        }

        // Dokunmatik ve fare olaylarını ekle
        // Fare olayları
        pieceElement.draggable = true;
        pieceElement.addEventListener('dragstart', dragStart);
        pieceElement.addEventListener('dragover', dragOver);
        pieceElement.addEventListener('drop', drop);
        pieceElement.addEventListener('dragend', dragEnd);
        pieceElement.addEventListener('click', selectPiece);

        // Dokunmatik olaylar
        pieceElement.addEventListener('touchstart', dragStart);
        pieceElement.addEventListener('touchmove', function(e) {
          e.preventDefault(); // Sayfanın sürüklenmesini engelle
        });
        pieceElement.addEventListener('touchend', drop);

        puzzleGrid.appendChild(pieceElement);
      }
    }

    // Mobil cihazlar için grid boyutunu düşürme işlemi 
    // (Bu işlem zaten zorluk seçildiğinde yapılıyor, 
    // burada tekrar edilmesine gerek yok)

    // Parçaları karıştır
    shufflePuzzle();
  }

  /**
   * Yapboz parçalarını karıştırır
   */
  function shufflePuzzle() {
    const pieces = [...gameState.puzzlePieces];

    // Fisher-Yates algoritması ile karıştır
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Parçaların pozisyonunu değiştir
      [pieces[i].currentRow, pieces[j].currentRow] = [pieces[j].currentRow, pieces[i].currentRow];
      [pieces[i].currentCol, pieces[j].currentCol] = [pieces[j].currentCol, pieces[i].currentCol];
    }

    updatePuzzleDisplay();

    // Tüm parçalar için doğru yerleşim kontrolü
    pieces.forEach(piece => {
      piece.isCorrect = (piece.currentRow === piece.correctRow && piece.currentCol === piece.correctCol);
    });

    gameState.correctPlacements = pieces.filter(p => p.isCorrect).length;
  }

  /**
   * Sürükleme işlemi başlangıcı
   */
  function dragStart(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    // Dokunmatik cihazlar için kontrol
    const isTouchEvent = e.type === 'touchstart';
    const target = isTouchEvent ? 
      document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : 
      e.target;

    const pieceElement = target.closest('.puzzle-piece');
    if (!pieceElement) return;

    const pieceId = parseInt(pieceElement.dataset.id);
    gameState.selectedPiece = gameState.puzzlePieces.find(p => p.id === pieceId);

    // Seçilen parçaya stil ekle
    pieceElement.classList.add('selected');

    // Ses çal
    playSound('pickup');

    if (!isTouchEvent) {
      // Sürüklenen veriyi ayarla (mouse için)
      e.dataTransfer.setData('text/plain', pieceId);
      e.dataTransfer.effectAllowed = 'move';
    }

    // İçerik menüsünü engelle
    e.preventDefault();
  }

  /**
   * Sürükleme hedefi üzerinde olayı
   */
  function dragOver(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Parçayı bırakma olayı
   */
  function drop(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    e.preventDefault();

    // Dokunmatik cihazlar için kontrol
    let sourceId, targetElement;

    const isTouchEvent = e.type === 'touchend';

    if (isTouchEvent) {
      // Dokunmatik olayı: selectedPiece değerini kullan
      if (!gameState.selectedPiece) return;
      sourceId = gameState.selectedPiece.id;

      const touch = e.changedTouches[0];
      targetElement = document.elementFromPoint(touch.clientX, touch.clientY).closest('.puzzle-piece');
    } else {
      // Mouse olayı: dataTransfer'dan al
      sourceId = parseInt(e.dataTransfer.getData('text/plain'));
      targetElement = e.target.closest('.puzzle-piece');
    }

    if (!targetElement) return;

    const targetId = parseInt(targetElement.dataset.id);

    // Aynı parça değilse değiştir
    if (sourceId !== targetId) {
      swapPieces(sourceId, targetId);
      gameState.moves++;
      updateMovesDisplay();

      // Ses çal
      playSound('place');
    }
  }

  /**
   * Sürükleme işlemi sonu
   */
  function dragEnd(e) {
    // Seçili stil sınıfını kaldır
    document.querySelectorAll('.puzzle-piece').forEach(el => {
      el.classList.remove('selected');
    });

    gameState.selectedPiece = null;
  }

  /**
   * Tıklama ile parça seçimi
   */
  function selectPiece(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    // Dokunmatik cihazlar için kontrol
    const isTouchEvent = e.type.startsWith('touch');
    const target = isTouchEvent ? 
      document.elementFromPoint(
        e.touches ? e.touches[0].clientX : e.changedTouches[0].clientX, 
        e.touches ? e.touches[0].clientY : e.changedTouches[0].clientY
      ) : 
      e.target;

    const pieceElement = target.closest('.puzzle-piece');
    if (!pieceElement) return;

    const pieceId = parseInt(pieceElement.dataset.id);

    // Eğer zaten seçili bir parça varsa
    if (gameState.selectedPiece !== null) {
      const selectedId = gameState.selectedPiece.id;

      // Farklı bir parçaya tıklandıysa değiştir
      if (selectedId !== pieceId) {
        swapPieces(selectedId, pieceId);
        gameState.moves++;
        updateMovesDisplay();

        // Ses çal
        playSound('place');
      }

      // Seçimleri temizle
      document.querySelectorAll('.puzzle-piece').forEach(el => {
        el.classList.remove('selected');
      });

      gameState.selectedPiece = null;
    } else {
      // İlk seçim
      gameState.selectedPiece = gameState.puzzlePieces.find(p => p.id === pieceId);
      pieceElement.classList.add('selected');

      // Ses çal
      playSound('pickup');
    }

    // İçerik menüsünü engelle
    e.preventDefault();
  }

  /**
   * İki parçanın yerini değiştirir
   */
  function swapPieces(sourceId, targetId) {
    const sourcePiece = gameState.puzzlePieces.find(p => p.id === sourceId);
    const targetPiece = gameState.puzzlePieces.find(p => p.id === targetId);

    // Geçici değişkenler ile değiştir
    const tempRow = sourcePiece.currentRow;
    const tempCol = sourcePiece.currentCol;

    sourcePiece.currentRow = targetPiece.currentRow;
    sourcePiece.currentCol = targetPiece.currentCol;

    targetPiece.currentRow = tempRow;
    targetPiece.currentCol = tempCol;

    // Doğru yerleşim kontrolü
    sourcePiece.isCorrect = (sourcePiece.currentRow === sourcePiece.correctRow && sourcePiece.currentCol === sourcePiece.correctCol);
    targetPiece.isCorrect = (targetPiece.currentRow === targetPiece.correctRow && targetPiece.currentCol === targetPiece.correctCol);

    // Doğru yerleşim sayısını güncelle
    gameState.correctPlacements = gameState.puzzlePieces.filter(p => p.isCorrect).length;

    // Puan ekle
    if (sourcePiece.isCorrect) {
      gameState.score += 10;
      gameState.bonusPoints += 5;
    }

    if (targetPiece.isCorrect) {
      gameState.score += 10;
      gameState.bonusPoints += 5;
    }

    updateScoreDisplay();
    updatePuzzleDisplay();

    // Yapboz tamamlandı mı kontrol et
    if (gameState.correctPlacements === gameState.grid.rows * gameState.grid.cols) {
      // Kısa bir gecikme ile oyunu bitir
      setTimeout(() => {
        endGame(true);
      }, 300);
    }
  }

  /**
   * Yapboz görünümünü günceller
   */
  function updatePuzzleDisplay() {
    const pieces = document.querySelectorAll('.puzzle-piece');

    gameState.puzzlePieces.forEach(piece => {
      const pieceElement = document.querySelector(`.puzzle-piece[data-id="${piece.id}"]`);

      if (pieceElement) {
        // Grid pozisyonunu ayarla
        pieceElement.style.gridRow = piece.currentRow + 1;
        pieceElement.style.gridColumn = piece.currentCol + 1;

        // Doğru yerleşim durumuna göre stil ekle/kaldır
        pieceElement.classList.toggle('correct', piece.isCorrect);
      }
    });
  }

  /**
   * Puan göstergesini günceller
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }

  /**
   * Hamle göstergesini günceller
   */
  function updateMovesDisplay() {
    movesDisplay.textContent = gameState.moves;
  }

  /**
   * Seviye göstergesini günceller
   */
  function updateLevelDisplay() {
    levelDisplay.textContent = gameState.level;
  }

  /**
   * Zamanlayıcı göstergesini günceller
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Oyunu duraklatır veya devam ettirir
   */
  function togglePause() {
    if (!gameState.isPlaying) return;

    gameState.isPaused = !gameState.isPaused;
    pauseOverlay.style.display = gameState.isPaused ? 'flex' : 'none';
  }

  /**
   * Oyunu devam ettirir
   */
  function resumeGame() {
    if (!gameState.isPlaying) return;

    gameState.isPaused = false;
    pauseOverlay.style.display = 'none';
  }

  /**
   * Oyunu sıfırlar
   */
  function resetGame() {
    // Öncelikle zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);

    // Ekranları sıfırla
    introSection.style.display = 'block';
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';

    // Oyun durumunu sıfırla
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.moves = 0;
    gameState.timeRemaining = 300;
    gameState.correctPlacements = 0;
    gameState.bonusPoints = 0;
    gameState.achievements = [];

    // Görünümü güncelle
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();
  }

  /**
   * Oyunu sonlandırır
   */
  function endGame(completed) {
    // Zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);

    // Oyun durumunu güncelle
    gameState.isPlaying = false;

    // Son puan hesaplama
    if (completed) {
      // Kalan süre bonusu
      const timeBonus = Math.floor(gameState.timeRemaining / 10);
      gameState.score += timeBonus;

      // Hamle verimliliği bonusu
      const efficiencyBonus = Math.max(0, 100 - Math.floor(gameState.moves / (gameState.grid.rows * gameState.grid.cols) * 10));
      gameState.score += efficiencyBonus;

      // Zorluk seviyesi bonusu
      if (gameState.difficulty === 'MEDIUM') {
        gameState.score = Math.floor(gameState.score * 1.5);
      } else if (gameState.difficulty === 'HARD') {
        gameState.score = Math.floor(gameState.score * 2);
      }

      // Başarımları kontrol et
      checkAchievements();

      // Başarım tamamlanmasını ses ile bildir
      playSound('complete');
    }

    // Sonuç ekranını güncelle
    finalScore.textContent = gameState.score;

    const minutes = Math.floor((300 - gameState.timeRemaining) / 60);
    const seconds = (300 - gameState.timeRemaining) % 60;
    finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    finalMoves.textContent = gameState.moves;

    // Derecelendirmeyi hesapla
    const rating = calculateRating();
    updateRatingDisplay(rating);

    // Başarım varsa göster
    if (gameState.achievements.length > 0) {
      const achievement = gameState.achievements[0];
      document.getElementById('puzzle-achievement').style.display = 'flex';
      document.getElementById('achievement-name').textContent = achievement.name;
    } else {
      document.getElementById('puzzle-achievement').style.display = 'none';
    }

    // Oyun sonucu ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';

    // Skoru API'ye kaydet
    if (completed) {
      saveScore(gameState.score);
    }
  }

  /**
   * Oyun puanını hesaplar ve API'ye kaydeder
   */
  function saveScore(score) {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'puzzle',
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Score saved successfully!');

        // Display XP gain if applicable
        if (data.xp_gained) {
          showXPGain(data.xp_gained);

          // If player leveled up, show celebration
          if (data.is_level_up) {
            showLevelUp(data.level);
          }
        }
      } else {
        console.log('Failed to save score:', data.message);

        // If login is required, show login modal
        if (data.message === 'Login required' && data.redirect) {
          if (confirm('Skorunuzu kaydetmek için giriş yapmanız gerekiyor. Giriş sayfasına yönlendirilmek ister misiniz?')) {
            window.location.href = data.redirect;
          }
        }
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }

  /**
   * Oyun performansını derecelendirir
   */
  function calculateRating() {
    // Tamamlanan oyunlar için
    if (gameState.correctPlacements === gameState.grid.rows * gameState.grid.cols) {
      // Zorluğa ve hamle verimliliğine göre derecelendirme
      const totalPieces = gameState.grid.rows * gameState.grid.cols;
      const optimalMoves = totalPieces * 1.5; // Optimal hamle sayısı tahmini

      if (gameState.moves <= optimalMoves) {
        return 5; // Mükemmel
      } else if (gameState.moves <= optimalMoves * 1.5) {
        return 4; // Çok iyi
      } else if (gameState.moves <= optimalMoves * 2) {
        return 3; // İyi
      } else {
        return 2; // Ortalama
      }
    }

    // Tamamlanmayan oyunlar için
    return Math.max(1, Math.floor(gameState.correctPlacements / (gameState.grid.rows * gameState.grid.cols) * 5));
  }

  /**
   * Derecelendirme göstergesini günceller
   */
  function updateRatingDisplay(rating) {
    // Yıldız simgelerini güncelle
    const stars = ratingStars.querySelectorAll('i');

    for (let i = 0; i < stars.length; i++) {
      if (i < rating) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }

    // Derecelendirme metnini güncelle
    const ratingTexts = ['Zayıf', 'Normal', 'İyi', 'Çok İyi', 'Harika!'];
    ratingText.textContent = ratingTexts[Math.max(0, rating - 1)];
  }

  /**
   * Başarımları kontrol eder
   */
  function checkAchievements() {
    achievements.forEach(achievement => {
      if (achievement.condition(gameState)) {
        gameState.achievements.push(achievement);
      }
    });
  }

  /**
   * Skoru panoya kopyalar
   */
  function copyScore() {
    const scoreText = `Yapboz Oyunu: ${gameState.score} puan, ${gameState.moves} hamle, Zorluk: ${gameState.difficulty} 🧩`;

    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showAlert('Skor kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
        showAlert('Kopyalama başarısız!', 'error');
      });
  }

  /**
   * Skoru paylaşır (Web Share API)
   */
  function shareScore() {
    const scoreText = `Yapboz Oyunu: ${gameState.score} puan, ${gameState.moves} hamle, Zorluk: ${gameState.difficulty} 🧩`;

    if (navigator.share) {
      navigator.share({
        title: 'Beyin Geliştirme Oyunu Skorum',
        text: scoreText,
        url: window.location.href
      })
      .then(() => console.log('Paylaşım başarılı'))
      .catch(error => console.log('Paylaşım hatası:', error));
    } else {
      copyScore();
    }
  }

  /**
   * Bildirim gösterir
   */
  function showAlert(message, type = 'info') {
    alertContainer.innerHTML = `
      <div class="alert-message ${type}">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    alertContainer.style.display = 'block';

    // 3 saniye sonra gizle
    setTimeout(() => {
      alertContainer.style.display = 'none';
    }, 3000);
  }

  /**
   * Ses çalar
   */
  function playSound(soundName) {
    if (gameState.soundEnabled) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play();
    }
  }
  // Placeholder functions for XP and level up
  function showXPGain(xpGained) {
    console.log("XP Gained:", xpGained);
    // Add your XP gain display logic here
  }
  function showLevelUp(level) {
    console.log("Level Up:", level);
    // Add your level up display logic here
  }
});