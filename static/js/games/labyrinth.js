/**
 * Labirent Oyunu
 * =============
 * Rastgele labirent oluşturup içinde yol bulma oyunu.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Labirent sınıfı
  class Labyrinth {
    constructor() {
      // Oyun durumu
      this.state = {
        maze: [],
        mazeSize: 8, // Varsayılan: Kolay (8x8)
        playerPosition: {row: 0, col: 0},
        startPosition: {row: 0, col: 0},
        endPosition: {row: 0, col: 0},
        moves: 0,
        score: 0,
        level: 1,
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        isGameActive: false,
        visitedCells: [],
        totalGameTime: 0,
        totalMoves: 0,
        totalScore: 0
      };
      
      // DOM elementleri
      this.elements = {
        mazeContainer: document.getElementById('maze-container'),
        levelElement: document.getElementById('level'),
        timerElement: document.getElementById('timer'),
        movesElement: document.getElementById('moves'),
        scoreElement: document.getElementById('score'),
        
        // Zorluk düğmeleri
        easyButton: document.getElementById('easy-btn'),
        mediumButton: document.getElementById('medium-btn'),
        hardButton: document.getElementById('hard-btn'),
        
        // Yön düğmeleri
        upButton: document.getElementById('up-btn'),
        downButton: document.getElementById('down-btn'),
        leftButton: document.getElementById('left-btn'),
        rightButton: document.getElementById('right-btn'),
        
        // Diğer düğmeler
        newGameButton: document.getElementById('new-game-btn'),
        
        // Overlay'ler
        levelCompleteOverlay: document.getElementById('level-complete'),
        gameCompleteOverlay: document.getElementById('game-complete'),
        
        // Seviye tamamlandı istatistikleri
        levelTimeElement: document.getElementById('level-time'),
        levelMovesElement: document.getElementById('level-moves'),
        levelScoreElement: document.getElementById('level-score'),
        
        // Seviye düğmeleri
        nextLevelButton: document.getElementById('next-level-btn'),
        restartLevelButton: document.getElementById('restart-level-btn'),
        
        // Oyun sonu istatistikleri
        finalLevelElement: document.getElementById('final-level'),
        finalTimeElement: document.getElementById('final-time'),
        finalMovesElement: document.getElementById('final-moves'),
        finalScoreElement: document.getElementById('final-score'),
        
        // Tekrar oyna düğmesi
        playAgainButton: document.getElementById('play-again-btn')
      };
      
      // Oyunu başlat
      this.init();
    }
    
    // Oyunu başlat
    init() {
      // Event listener'ları ekle
      this.setupEventListeners();
      
      // Yeni oyun başlat
      this.newGame();
    }
    
    // Event listener'ları ekle
    setupEventListeners() {
      // Yön tuşları
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));
      
      // Yön düğmeleri
      this.elements.upButton.addEventListener('click', () => this.movePlayer('up'));
      this.elements.downButton.addEventListener('click', () => this.movePlayer('down'));
      this.elements.leftButton.addEventListener('click', () => this.movePlayer('left'));
      this.elements.rightButton.addEventListener('click', () => this.movePlayer('right'));
      
      // Zorluk düğmeleri
      this.elements.easyButton.addEventListener('click', () => this.changeDifficulty('easy'));
      this.elements.mediumButton.addEventListener('click', () => this.changeDifficulty('medium'));
      this.elements.hardButton.addEventListener('click', () => this.changeDifficulty('hard'));
      
      // Diğer düğmeler
      this.elements.newGameButton.addEventListener('click', () => this.newGame());
      this.elements.nextLevelButton.addEventListener('click', () => this.nextLevel());
      this.elements.restartLevelButton.addEventListener('click', () => this.restartLevel());
      this.elements.playAgainButton.addEventListener('click', () => this.newGame());
    }
    
    // Klavye tuşları ile oyuncu hareketini kontrol et
    handleKeyPress(e) {
      if (!this.state.isGameActive) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.movePlayer('right');
          break;
      }
    }
    
    // Zorluk seviyesini değiştir
    changeDifficulty(difficulty) {
      // Zorluk seviyesine göre labirent boyutunu ayarla
      const sizes = {
        'easy': 8,
        'medium': 12,
        'hard': 16
      };
      
      this.state.mazeSize = sizes[difficulty];
      
      // UI'daki aktif düğmeyi güncelle
      this.elements.easyButton.classList.remove('active');
      this.elements.mediumButton.classList.remove('active');
      this.elements.hardButton.classList.remove('active');
      
      switch (difficulty) {
        case 'easy':
          this.elements.easyButton.classList.add('active');
          break;
        case 'medium':
          this.elements.mediumButton.classList.add('active');
          break;
        case 'hard':
          this.elements.hardButton.classList.add('active');
          break;
      }
      
      // Aktif bir oyun varsa, o seviyeyi yeniden başlat
      if (this.state.isGameActive) {
        this.newGame();
      }
    }
    
    // Yeni oyun başlat
    newGame() {
      // Oyun durumunu sıfırla
      this.state.level = 1;
      this.state.totalGameTime = 0;
      this.state.totalMoves = 0;
      this.state.totalScore = 0;
      
      // Seviyeyi başlat
      this.startLevel();
      
      // Overlay'leri gizle
      this.elements.gameCompleteOverlay.classList.add('hidden');
    }
    
    // Seviyeyi başlat
    startLevel() {
      // Seviye durumunu sıfırla
      this.state.moves = 0;
      this.state.score = 0;
      this.state.elapsedTime = 0;
      this.state.visitedCells = [];
      
      // Zamanlayıcıyı durdur
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
      }
      
      // UI'ı güncelle
      this.elements.levelElement.textContent = this.state.level;
      this.elements.movesElement.textContent = '0';
      this.elements.timerElement.textContent = '00:00';
      this.elements.scoreElement.textContent = '0';
      
      // Labirenti oluştur
      this.generateMaze();
      
      // Overlay'i gizle
      this.elements.levelCompleteOverlay.classList.add('hidden');
      
      // Oyunu aktif et
      this.state.isGameActive = true;
      
      // Zamanlayıcıyı başlat
      this.state.startTime = Date.now();
      this.state.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
    
    // Sonraki seviyeye geç
    nextLevel() {
      // Seviyeyi artır
      this.state.level++;
      
      // UI'ı güncelle
      this.elements.levelElement.textContent = this.state.level;
      
      // Yeni seviyeyi başlat
      this.startLevel();
    }
    
    // Mevcut seviyeyi yeniden başlat
    restartLevel() {
      this.startLevel();
    }
    
    // Zamanlayıcıyı güncelle
    updateTimer() {
      this.state.elapsedTime = Math.floor((Date.now() - this.state.startTime) / 1000);
      this.elements.timerElement.textContent = this.formatTime(this.state.elapsedTime);
    }
    
    // Zamanı biçimlendir (saniye -> mm:ss)
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    
    // Labirent oluştur
    generateMaze() {
      const size = this.state.mazeSize;
      
      // Boş labirent oluştur (tüm hücreler duvar)
      this.state.maze = Array(size).fill().map(() => Array(size).fill(1));
      
      // Labirent oluşturmak için Derinlik Öncelikli Arama (DFS) kullan
      // Rastgele bir başlangıç noktası seç (çift indeksler)
      const startRow = Math.floor(Math.random() * Math.floor(size / 2)) * 2;
      const startCol = Math.floor(Math.random() * Math.floor(size / 2)) * 2;
      
      // Başlangıç noktasını yol olarak işaretle
      this.state.maze[startRow][startCol] = 0;
      
      // Labirenti oluştur
      this.carvePassages(startRow, startCol);
      
      // Başlangıç ve bitiş konumlarını belirle
      this.setStartAndEnd();
      
      // Oyuncuyu başlangıç noktasına koy
      this.state.playerPosition = {...this.state.startPosition};
      
      // Labirenti render et
      this.renderMaze();
    }
    
    // Recursive DFS ile labirent oluştur
    carvePassages(row, col) {
      // 4 yön (yukarı, sağ, aşağı, sol)
      const directions = [
        {row: -2, col: 0},
        {row: 0, col: 2},
        {row: 2, col: 0},
        {row: 0, col: -2}
      ];
      
      // Yönleri karıştır
      this.shuffleArray(directions);
      
      // Her yönü dene
      for (const dir of directions) {
        const newRow = row + dir.row;
        const newCol = col + dir.col;
        
        // Labirent sınırları içinde mi?
        if (newRow >= 0 && newRow < this.state.mazeSize && 
            newCol >= 0 && newCol < this.state.mazeSize && 
            this.state.maze[newRow][newCol] === 1) {
          
          // Aradaki duvarı yıkarak yol aç
          this.state.maze[row + dir.row/2][col + dir.col/2] = 0;
          
          // Yeni hücreyi yol olarak işaretle
          this.state.maze[newRow][newCol] = 0;
          
          // Recursive olarak devam et
          this.carvePassages(newRow, newCol);
        }
      }
    }
    
    // Diziyi karıştır
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    // Başlangıç ve bitiş noktalarını belirle
    setStartAndEnd() {
      const size = this.state.mazeSize;
      
      // Tüm yol hücrelerini bul
      const pathCells = [];
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (this.state.maze[row][col] === 0) {
            pathCells.push({row, col});
          }
        }
      }
      
      // Hücreleri karıştır
      this.shuffleArray(pathCells);
      
      // Başlangıç ve bitiş için minimum uzaklık
      const minDistance = Math.floor(size * 1.5);
      
      // Başlangıç noktası için ilk hücreyi seç
      this.state.startPosition = pathCells[0];
      
      // Bitiş noktası için, başlangıçtan yeterince uzak bir hücre bul
      for (let i = 1; i < pathCells.length; i++) {
        const cell = pathCells[i];
        const distance = Math.abs(cell.row - this.state.startPosition.row) + 
                         Math.abs(cell.col - this.state.startPosition.col);
        
        if (distance >= minDistance) {
          this.state.endPosition = cell;
          break;
        }
      }
      
      // Eğer yeterince uzak bir hücre bulunamadıysa, en son hücreyi seç
      if (!this.state.endPosition.row && !this.state.endPosition.col) {
        this.state.endPosition = pathCells[pathCells.length - 1];
      }
    }
    
    // Labirenti render et
    renderMaze() {
      // Maze container'ı temizle
      this.elements.mazeContainer.innerHTML = '';
      
      // Labirent div'ini oluştur
      const mazeElement = document.createElement('div');
      mazeElement.classList.add('maze');
      mazeElement.style.gridTemplateColumns = `repeat(${this.state.mazeSize}, 1fr)`;
      mazeElement.style.gridTemplateRows = `repeat(${this.state.mazeSize}, 1fr)`;
      
      // Hücreleri oluştur
      for (let row = 0; row < this.state.mazeSize; row++) {
        for (let col = 0; col < this.state.mazeSize; col++) {
          const cell = document.createElement('div');
          cell.classList.add('maze-cell');
          cell.dataset.row = row;
          cell.dataset.col = col;
          
          // Hücre tipini belirle
          if (this.state.maze[row][col] === 1) {
            cell.classList.add('wall');
          } else {
            // Başlangıç, bitiş veya normal yol
            if (row === this.state.startPosition.row && col === this.state.startPosition.col) {
              cell.classList.add('start');
            } else if (row === this.state.endPosition.row && col === this.state.endPosition.col) {
              cell.classList.add('end');
            }
            
            // Ziyaret edilmiş hücre mi?
            if (this.state.visitedCells.some(pos => pos.row === row && pos.col === col)) {
              const marker = document.createElement('div');
              marker.classList.add('path-marker');
              cell.appendChild(marker);
            }
          }
          
          // Oyuncu bu hücrede mi?
          if (row === this.state.playerPosition.row && col === this.state.playerPosition.col) {
            const player = document.createElement('div');
            player.classList.add('player');
            cell.appendChild(player);
          }
          
          mazeElement.appendChild(cell);
        }
      }
      
      // Labirenti DOM'a ekle
      this.elements.mazeContainer.appendChild(mazeElement);
    }
    
    // Oyuncuyu hareket ettir
    movePlayer(direction) {
      if (!this.state.isGameActive) return;
      
      // Yeni pozisyonu hesapla
      let newRow = this.state.playerPosition.row;
      let newCol = this.state.playerPosition.col;
      
      switch (direction) {
        case 'up':
          newRow--;
          break;
        case 'down':
          newRow++;
          break;
        case 'left':
          newCol--;
          break;
        case 'right':
          newCol++;
          break;
      }
      
      // Yeni pozisyon geçerli mi?
      if (newRow >= 0 && newRow < this.state.mazeSize && 
          newCol >= 0 && newCol < this.state.mazeSize && 
          this.state.maze[newRow][newCol] === 0) {
        
        // Oyuncuyu hareket ettir
        this.state.playerPosition = {row: newRow, col: newCol};
        
        // Ziyaret edilen hücre olarak işaretle
        if (!this.state.visitedCells.some(pos => pos.row === newRow && pos.col === newCol) &&
            !(newRow === this.state.startPosition.row && newCol === this.state.startPosition.col) &&
            !(newRow === this.state.endPosition.row && newCol === this.state.endPosition.col)) {
          this.state.visitedCells.push({row: newRow, col: newCol});
        }
        
        // Hamle sayısını artır
        this.state.moves++;
        this.elements.movesElement.textContent = this.state.moves;
        
        // Bitiş noktasına ulaşıldı mı?
        if (newRow === this.state.endPosition.row && newCol === this.state.endPosition.col) {
          this.levelComplete();
        } else {
          // Labirenti güncelle
          this.renderMaze();
        }
      }
    }
    
    // Seviye tamamlandı
    levelComplete() {
      // Zamanlayıcıyı durdur
      clearInterval(this.state.timerInterval);
      
      // Seviye skorunu hesapla
      const baseScore = 1000;
      const timeMultiplier = Math.max(0.2, 1 - (this.state.elapsedTime / (this.state.mazeSize * 5)));
      const moveMultiplier = Math.max(0.2, 1 - (this.state.moves / (this.state.mazeSize * 5)));
      const difficultyMultiplier = this.state.mazeSize / 8;
      
      const levelScore = Math.floor(baseScore * timeMultiplier * moveMultiplier * difficultyMultiplier);
      
      this.state.score = levelScore;
      this.elements.scoreElement.textContent = levelScore;
      
      // Toplam değerleri güncelle
      this.state.totalGameTime += this.state.elapsedTime;
      this.state.totalMoves += this.state.moves;
      this.state.totalScore += levelScore;
      
      // Seviye sonuç ekranını güncelle
      this.elements.levelTimeElement.textContent = this.formatTime(this.state.elapsedTime);
      this.elements.levelMovesElement.textContent = this.state.moves;
      this.elements.levelScoreElement.textContent = levelScore;
      
      // Skoru sunucuya gönder
      this.saveScoreToServer();
      
      // Son seviye mi?
      const maxLevel = 5;
      if (this.state.level >= maxLevel) {
        // Oyun tamamlandı
        this.gameComplete();
      } else {
        // Seviye tamamlandı overlay'ini göster
        this.elements.levelCompleteOverlay.classList.remove('hidden');
      }
      
      // Oyunu durdur
      this.state.isGameActive = false;
    }
    
    // Oyun tamamlandı
    gameComplete() {
      // Oyun sonuç ekranını güncelle
      this.elements.finalLevelElement.textContent = this.state.level;
      this.elements.finalTimeElement.textContent = this.formatTime(this.state.totalGameTime);
      this.elements.finalMovesElement.textContent = this.state.totalMoves;
      this.elements.finalScoreElement.textContent = this.state.totalScore;
      
      // Oyun sonu overlay'ini göster
      this.elements.gameCompleteOverlay.classList.remove('hidden');
    }
    
    // Skoru sunucuya kaydet
    saveScoreToServer() {
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_type: 'labyrinth',
          score: this.state.score
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
  }
  
  // Oyunu başlat
  const game = new Labyrinth();
});