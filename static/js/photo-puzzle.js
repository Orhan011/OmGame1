/**
 * Fotoğraf Yapboz Oyunu (Photo Puzzle)
 * --------------------------------------
 * Kullanıcının bir resmi parçalara ayırıp birleştirerek yapboz oluşturmasını sağlar.
 * Görsel dikkat ve mekânsal becerileri geliştirmeye yardımcı olan interaktif bir oyun.
 * 
 * @version 2.0
 */

document.addEventListener('DOMContentLoaded', function() {
  // Yapboz ayarları
  const settings = {
    container: document.getElementById('puzzleContainer'),
    difficulty: 'easy',
    difficultyMap: {
      'easy': 3,     // 3x3 (9 parça)
      'medium': 4,   // 4x4 (16 parça) 
      'hard': 5      // 5x5 (25 parça)
    },
    currentImage: null,
    pieces: [],
    correctPositions: [],
    isPlaying: false,
    startTime: null,
    timerInterval: null,
    moves: 0,
    hintsUsed: 0,
    activePiece: null,
    canMove: true
  };

  // UI Elementleri
  const elements = {
    timer: document.getElementById('timer'),
    moveCounter: document.getElementById('moveCounter'),
    btnNewGame: document.getElementById('btnNewGame'),
    btnHint: document.getElementById('btnHint'),
    btnShuffle: document.getElementById('btnShuffle'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    successOverlay: document.getElementById('successOverlay'),
    confettiContainer: document.getElementById('confettiContainer'),
    puzzleHint: document.getElementById('puzzleHint'),
    imageGallery: document.getElementById('imageGallery'),
    difficultyBtns: document.querySelectorAll('.btn-difficulty'),
    statTime: document.getElementById('statTime'),
    statMoves: document.getElementById('statMoves')
  };

  // Resim galerisi (kamu malı resimleri)
  const galleryImages = [
    {
      name: 'Dağ Manzarası',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&h=600&auto=format&fit=crop',
      attribution: 'Unsplash'
    },
    {
      name: 'Şelale',
      url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=600&h=600&auto=format&fit=crop',
      attribution: 'Unsplash'
    },
    {
      name: 'Kelebek',
      url: 'https://images.unsplash.com/photo-1590599145012-2801cc958ca7?q=80&w=600&h=600&auto=format&fit=crop',
      attribution: 'Unsplash'
    },
    {
      name: 'Galileo Galilei',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Galileo_Galilei_by_Leoni.jpg/600px-Galileo_Galilei_by_Leoni.jpg',
      attribution: 'Wikimedia Commons'
    },
    {
      name: 'Van Gogh',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vincent_van_Gogh_-_Self-Portrait_%281889%29.jpg/600px-Vincent_van_Gogh_-_Self-Portrait_%281889%29.jpg',
      attribution: 'Wikimedia Commons'
    },
    {
      name: 'Marie Curie',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marie_Curie_c1920.jpg/600px-Marie_Curie_c1920.jpg',
      attribution: 'Wikimedia Commons'
    },
    {
      name: 'Albert Einstein',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/600px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg',
      attribution: 'Wikimedia Commons'
    },
    {
      name: 'Mona Lisa',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
      attribution: 'Wikimedia Commons'
    }
  ];

  // Skoru entegre edecek yapı
  let scoreSystem;

  /**
   * Oyunu başlat
   */
  function init() {
    // Event dinleyicileri
    bindEvents();
    
    // Resim galerisini oluştur
    createGallery();
    
    // Varsayılan ilk resmi ayarla
    if (galleryImages.length > 0) {
      selectImage(galleryImages[0].url);
    }
    
    // Skor entegrasyonu kur (game-integration-helper.js'den)
    if (typeof integrateGameScore === 'function') {
      scoreSystem = integrateGameScore('photo-puzzle', window.photoPuzzleGame, {
        maxScore: 100,
        optimalMoves: 20,
        expectedTime: 180 // saniye
      });
    }
  }

  /**
   * Event dinleyicilerini atar
   */
  function bindEvents() {
    // Yeni oyun başlat
    elements.btnNewGame.addEventListener('click', startNewGame);
    elements.btnPlayAgain.addEventListener('click', () => {
      elements.successOverlay.classList.remove('show');
      setTimeout(startNewGame, 300);
    });
    
    // İpucu göster/gizle
    elements.btnHint.addEventListener('click', toggleHint);
    
    // Parçaları karıştır
    elements.btnShuffle.addEventListener('click', shufflePieces);
    
    // Zorluk seçimi
    elements.difficultyBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const difficulty = this.dataset.difficulty;
        if (difficulty) {
          setDifficulty(difficulty);
        }
      });
    });
    
    // Sürükleme olayları (Touch ve Mouse desteği)
    settings.container.addEventListener('pointerdown', onPiecePointerDown);
    document.addEventListener('pointermove', onDocumentPointerMove);
    document.addEventListener('pointerup', onDocumentPointerUp);
    document.addEventListener('pointercancel', onDocumentPointerUp);
  }

  /**
   * Resim galerisini oluşturur
   */
  function createGallery() {
    elements.imageGallery.innerHTML = '';
    
    galleryImages.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = index;
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.name;
      img.loading = 'lazy'; // Yükleme optimizasyonu
      
      item.appendChild(img);
      elements.imageGallery.appendChild(item);
      
      // Resim seçme olayı
      item.addEventListener('click', function() {
        document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        selectImage(image.url);
      });
    });
    
    // İlk resmi seçili olarak işaretle
    const firstItem = elements.imageGallery.querySelector('.gallery-item');
    if (firstItem) {
      firstItem.classList.add('active');
    }
  }

  /**
   * Seçilen resmi yapboz olarak belirler
   */
  function selectImage(imageUrl) {
    settings.currentImage = imageUrl;
    
    if (settings.isPlaying) {
      startNewGame();
    } else {
      // Resmi arka plana yerleştir
      elements.puzzleHint.style.backgroundImage = `url(${imageUrl})`;
    }
  }

  /**
   * Zorluk seviyesini değiştirir
   */
  function setDifficulty(difficulty) {
    if (settings.difficultyMap[difficulty]) {
      settings.difficulty = difficulty;
      
      // UI güncelle
      elements.difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
      });
      
      if (settings.isPlaying) {
        startNewGame();
      }
    }
  }

  /**
   * Yeni bir oyun başlatır
   */
  function startNewGame() {
    // Önceki oyunu temizle
    clearGame();
    
    // Oyunu başlat
    settings.isPlaying = true;
    settings.startTime = new Date();
    settings.moves = 0;
    settings.hintsUsed = 0;
    settings.canMove = true;
    
    // UI'yı güncelle
    updateUI();
    
    // Zamanlayıcıyı başlat
    startTimer();
    
    // Resmi kare sayısına böl
    const gridSize = settings.difficultyMap[settings.difficulty];
    createPuzzlePieces(gridSize);
    
    // Skoru sıfırla
    if (scoreSystem) {
      scoreSystem.resetScore();
      scoreSystem.updateSettings({
        difficultyMultiplier: getDifficultyMultiplier(settings.difficulty)
      });
    }
  }

  /**
   * Oyunu temizler
   */
  function clearGame() {
    // Önceki parçaları temizle
    settings.pieces.forEach(piece => {
      if (piece.element && piece.element.parentNode) {
        piece.element.parentNode.removeChild(piece.element);
      }
    });
    
    settings.pieces = [];
    settings.correctPositions = [];
    
    // Zamanlayıcıyı durdur
    if (settings.timerInterval) {
      clearInterval(settings.timerInterval);
      settings.timerInterval = null;
    }
    
    // Başarı katmanını gizle
    elements.successOverlay.classList.remove('show');
    
    // Konfeti temizle
    elements.confettiContainer.innerHTML = '';
    
    // İpucunu gizle
    elements.puzzleHint.style.display = 'none';
  }

  /**
   * Yapboz parçalarını oluşturur
   */
  function createPuzzlePieces(gridSize) {
    const containerWidth = settings.container.offsetWidth;
    const containerHeight = settings.container.offsetHeight;
    
    // Parça boyutlarını hesapla
    const pieceWidth = Math.floor(containerWidth / gridSize);
    const pieceHeight = Math.floor(containerHeight / gridSize);
    
    // Her bir parça için
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Doğru konumu kaydet
        const correctX = col * pieceWidth;
        const correctY = row * pieceHeight;
        
        settings.correctPositions.push({
          row,
          col,
          x: correctX,
          y: correctY
        });
        
        // Parça elementi oluştur
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.style.width = `${pieceWidth}px`;
        pieceElement.style.height = `${pieceHeight}px`;
        
        // Rastgele bir başlangıç pozisyonu
        let randomX = Math.random() * (containerWidth - pieceWidth);
        let randomY = Math.random() * (containerHeight - pieceHeight);
        
        // Parçayı konumlandır
        pieceElement.style.left = `${randomX}px`;
        pieceElement.style.top = `${randomY}px`;
        
        // Parça arka planını hesapla (tam resmin bir kısmını gösterecek)
        pieceElement.style.backgroundImage = `url(${settings.currentImage})`;
        pieceElement.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
        pieceElement.style.backgroundPosition = `-${correctX}px -${correctY}px`;
        
        // Veri özniteliklerini ekle
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;
        
        // Parça numarasını ekle (debug için)
        const pieceNumber = row * gridSize + col + 1;
        pieceElement.textContent = pieceNumber;
        
        // Parçayı konteyner'a ekle
        settings.container.appendChild(pieceElement);
        
        // Parça bilgilerini kaydet
        settings.pieces.push({
          element: pieceElement,
          currentX: randomX,
          currentY: randomY,
          correctX,
          correctY,
          row,
          col,
          isCorrect: false,
          pieceNumber
        });
      }
    }
    
    // İpucu resmini ayarla
    elements.puzzleHint.style.backgroundImage = 'url(' + settings.currentImage + ')';
  }

  /**
   * Parçaları yeniden karıştırır
   */
  function shufflePieces() {
    if (!settings.isPlaying) return;
    
    // Konteyner boyutları
    const containerWidth = settings.container.offsetWidth;
    const containerHeight = settings.container.offsetHeight;
    
    // Tüm parçaları karıştır
    settings.pieces.forEach(piece => {
      // Eğer parça doğru konumda değilse
      if (!piece.isCorrect) {
        const pieceWidth = parseFloat(piece.element.style.width);
        const pieceHeight = parseFloat(piece.element.style.height);
        
        // Rastgele yeni pozisyon
        let randomX = Math.random() * (containerWidth - pieceWidth);
        let randomY = Math.random() * (containerHeight - pieceHeight);
        
        // Parçayı hareket ettir
        piece.currentX = randomX;
        piece.currentY = randomY;
        piece.element.style.left = randomX + 'px';
        piece.element.style.top = randomY + 'px';
      }
    });
  }

  /**
   * Sürükleme başlatma olayı
   */
  function onPiecePointerDown(e) {
    if (!settings.isPlaying || !settings.canMove) return;
    
    const pieceElement = e.target.closest('.puzzle-piece');
    if (!pieceElement) return;
    
    // Sürüklemeyi başlat
    settings.activePiece = settings.pieces.find(p => p.element === pieceElement);
    
    if (settings.activePiece) {
      // Z-index sıralama için sınıf ekle
      pieceElement.classList.add('dragging');
      
      // Tıklama pozisyonunu kaydet (parça içindeki offset)
      const containerRect = settings.container.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left - settings.activePiece.currentX;
      const offsetY = e.clientY - containerRect.top - settings.activePiece.currentY;
      
      settings.activePiece.offsetX = offsetX;
      settings.activePiece.offsetY = offsetY;
      
      e.preventDefault();
    }
  }

  /**
   * Sürükleme hareketi olayı
   */
  function onDocumentPointerMove(e) {
    if (!settings.activePiece || !settings.isPlaying || !settings.canMove) return;
    
    // Konteyner sınırlarını hesapla
    const containerRect = settings.container.getBoundingClientRect();
    
    // Yeni pozisyonu hesapla (konteyner içindeki koordinatlara çevir)
    const newX = e.clientX - containerRect.left - settings.activePiece.offsetX;
    const newY = e.clientY - containerRect.top - settings.activePiece.offsetY;
    
    // Sınırlar içinde tutma
    const pieceWidth = parseFloat(settings.activePiece.element.style.width);
    const pieceHeight = parseFloat(settings.activePiece.element.style.height);
    
    const minX = 0;
    const minY = 0;
    const maxX = containerRect.width - pieceWidth;
    const maxY = containerRect.height - pieceHeight;
    
    const boundedX = Math.max(minX, Math.min(maxX, newX));
    const boundedY = Math.max(minY, Math.min(maxY, newY));
    
    // Parçayı hareket ettir
    settings.activePiece.currentX = boundedX;
    settings.activePiece.currentY = boundedY;
    settings.activePiece.element.style.left = boundedX + 'px';
    settings.activePiece.element.style.top = boundedY + 'px';
    
    e.preventDefault();
  }

  /**
   * Sürükleme bitirme olayı
   */
  function onDocumentPointerUp(e) {
    if (!settings.activePiece || !settings.isPlaying || !settings.canMove) return;
    
    // Z-index sınıfını kaldır
    settings.activePiece.element.classList.remove('dragging');
    
    // Doğru yere geldi mi kontrol et
    const pieceIndex = settings.pieces.indexOf(settings.activePiece);
    const correctPos = settings.correctPositions[pieceIndex];
    
    // Doğru pozisyona yakın mı? (Tolerans: parça boyutunun %30'u)
    const pieceWidth = parseFloat(settings.activePiece.element.style.width);
    const pieceHeight = parseFloat(settings.activePiece.element.style.height);
    
    const tolerance = Math.min(pieceWidth, pieceHeight) * 0.3;
    
    const isCloseToCorrectX = Math.abs(settings.activePiece.currentX - correctPos.x) < tolerance;
    const isCloseToCorrectY = Math.abs(settings.activePiece.currentY - correctPos.y) < tolerance;
    
    // Hamle sayısını artır
    settings.moves++;
    updateUI();
    
    // Parça doğru konuma geldi mi?
    if (isCloseToCorrectX && isCloseToCorrectY) {
      // Parçayı tam yerine yerleştir
      settings.activePiece.currentX = correctPos.x;
      settings.activePiece.currentY = correctPos.y;
      settings.activePiece.element.style.left = correctPos.x + 'px';
      settings.activePiece.element.style.top = correctPos.y + 'px';
      
      // Doğru pozisyon olarak işaretle
      settings.activePiece.isCorrect = true;
      settings.activePiece.element.classList.add('correct');
      
      // Doğru yerleştirme animasyonu
      animateCorrectPlacement(settings.activePiece.element);
      
      // Hamleyi skora ekle
      if (scoreSystem) {
        scoreSystem.incrementMoves(1, true); // Doğru hamle
      }
      
      // Tüm parçalar doğru yerleştirildi mi?
      checkCompletion();
    } else {
      // Hamleyi skora ekle
      if (scoreSystem) {
        scoreSystem.incrementMoves();
      }
    }
    
    // Aktif parçayı sıfırla
    settings.activePiece = null;
    
    e.preventDefault();
  }

  /**
   * Doğru yerleştirme animasyonu
   */
  function animateCorrectPlacement(element) {
    element.animate([
      { transform: 'scale(1.1)', boxShadow: '0 0 15px rgba(40, 167, 69, 0.7)' },
      { transform: 'scale(1)', boxShadow: '0 0 10px rgba(40, 167, 69, 0.5)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  }

  /**
   * Yapbozun tamamlanıp tamamlanmadığını kontrol eder
   */
  function checkCompletion() {
    const allCorrect = settings.pieces.every(piece => piece.isCorrect);
    
    if (allCorrect) {
      // Oyun tamamlandı
      settings.isPlaying = false;
      settings.canMove = false;
      
      // Zamanlayıcıyı durdur
      if (settings.timerInterval) {
        clearInterval(settings.timerInterval);
        settings.timerInterval = null;
      }
      
      // Tamamlanma istatistiklerini hesapla
      const endTime = new Date();
      const timeTaken = Math.floor((endTime - settings.startTime) / 1000); // saniye
      
      const minutes = Math.floor(timeTaken / 60);
      const seconds = timeTaken % 60;
      const timeFormatted = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      
      // İstatistikleri güncelle
      elements.statTime.textContent = timeFormatted;
      elements.statMoves.textContent = settings.moves.toString();
      
      // Başarı mesajını göster
      setTimeout(() => {
        elements.successOverlay.classList.add('show');
        createConfetti();
      }, 500);
      
      // Skoru hesapla ve kaydet
      if (scoreSystem) {
        // Skor hesaplama
        const baseScore = 100;
        const difficultyMultiplier = getDifficultyMultiplier(settings.difficulty);
        
        // Ne kadar hızlı, az hamle ve az ipucu kullanımı o kadar iyi skor
        const movesPenalty = Math.min(0.5, (settings.moves / 50) * 0.5); // Hamle cezası (max %50)
        const hintsPenalty = settings.hintsUsed * 0.1; // Her ipucu %10 ceza
        const timePenalty = Math.min(0.3, (timeTaken / 300) * 0.3); // Zaman cezası (max %30)
        
        const totalPenalty = movesPenalty + hintsPenalty + timePenalty;
        const finalScore = Math.max(10, Math.floor(baseScore * difficultyMultiplier * (1 - totalPenalty)));
        
        // Skoru güncelle
        scoreSystem.setRawScore(finalScore);
        scoreSystem.setCompletionData({
          time: timeTaken,
          moves: settings.moves,
          hintsUsed: settings.hintsUsed,
          difficulty: settings.difficulty
        });
        
        // Otomatik olarak skoru kaydet
        setTimeout(() => {
          scoreSystem.saveScore();
        }, 1000);
      }
    }
  }

  /**
   * Konfeti animasyonu oluşturur
   */
  function createConfetti() {
    // Konfeti parçacıkları renklerini tanımla
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    // Konfeti konteynerini kontrol et ve temizle
    if (!elements.confettiContainer) {
      console.error('Konfeti konteyneri bulunamadı!');
      return;
    }
    
    elements.confettiContainer.innerHTML = '';
    
    // 50 konfeti parçası oluştur
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      
      // Rastgele özellikler belirle
      const size = Math.random() * 10 + 5; // 5-15px arası
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100; // %0-%100 arası
      const delay = Math.random() * 3; // 0-3s arası gecikme
      const duration = Math.random() * 3 + 2; // 2-5s arası süre
      const rotation = Math.random() * 360; // 0-360 derece arası
      
      // Konfeti stilini ayarla (template literal kullanımını kaldırarak)
      piece.style.width = size + 'px';
      piece.style.height = (size * 1.5) + 'px';
      piece.style.backgroundColor = color;
      piece.style.left = left + '%';
      piece.style.animation = 'confetti ' + duration + 's ease-in ' + delay + 's forwards';
      piece.style.transform = 'rotate(' + rotation + 'deg)';
      
      // Konteynere ekle
      elements.confettiContainer.appendChild(piece);
    }
  }

  /**
   * Zorluk seviyesine göre çarpan değerini döndürür
   */
  function getDifficultyMultiplier(difficulty) {
    switch (difficulty) {
      case 'easy': return 0.8;
      case 'medium': return 1.0;
      case 'hard': return 1.2;
      default: return 1.0;
    }
  }

  /**
   * Zamanlayıcıyı başlatır
   */
  function startTimer() {
    if (settings.timerInterval) {
      clearInterval(settings.timerInterval);
    }
    
    settings.timerInterval = setInterval(() => {
      if (!settings.isPlaying) return;
      
      const currentTime = new Date();
      const elapsedSeconds = Math.floor((currentTime - settings.startTime) / 1000);
      
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      
      // Template literal yerine string birleştirme kullanma
      elements.timer.textContent = 
          (minutes < 10 ? '0' : '') + minutes + 
          ':' + 
          (seconds < 10 ? '0' : '') + seconds;
    }, 1000);
  }

  /**
   * İpucu gösterme/gizleme
   */
  function toggleHint() {
    if (!settings.isPlaying) return;
    
    const isVisible = elements.puzzleHint.style.display === 'block';
    
    if (!isVisible) {
      // İpucunu göster
      elements.puzzleHint.style.display = 'block';
      
      // 3 saniye sonra gizle
      setTimeout(() => {
        elements.puzzleHint.style.display = 'none';
      }, 3000);
      
      // İpucu sayısını artır
      settings.hintsUsed++;
      
      // Skora yansıt
      if (scoreSystem) {
        scoreSystem.incrementHints();
      }
    }
  }

  /**
   * Arayüzü günceller
   */
  function updateUI() {
    elements.moveCounter.textContent = settings.moves;
  }

  // Oyunu başlat
  init();

  // Global erişim için oyun nesnesi
  window.photoPuzzleGame = {
    startNewGame,
    setDifficulty,
    toggleHint,
    shufflePieces,
    getDifficultyMultiplier,
    getSettings: () => ({ ...settings })
  };
});