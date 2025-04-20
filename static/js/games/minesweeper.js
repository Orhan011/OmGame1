/**
 * Mayın Tarlası Oyunu - Gelişmiş Versiyon
 * Mantıksal düşünme becerilerini geliştirmeye yönelik klasik bulmaca oyunu
 * 
 * Özellikler:
 * - Çoklu zorluk seviyeleri (Kolay, Orta, Uzman ve Özel)
 * - Gelişmiş ipuçları ve yardımlar
 * - Otomatik bayrak koyma ve güvenli kare tespiti
 * - Dokunmatik cihazlar için bayrak modu
 * - Sezgisel arayüz ve görsel geri bildirimler
 */

document.addEventListener('DOMContentLoaded', function() {
  /**
   * Mayın Tarlası Oyun Sınıfı
   * Tüm oyun mantığını ve veri yapılarını içerir
   */
  class MinesweeperGame {
    constructor() {
      // Oyun durumu ve değişkenleri
      this.width = 9;
      this.height = 9;
      this.mines = 10;
      this.board = [];
      this.revealed = [];
      this.flagged = [];
      this.mineLocations = [];
      this.firstClick = true;
      this.gameActive = false;
      this.gameOver = false;
      this.flagCount = 0;
      this.revealedCount = 0;
      this.startTime = null;
      this.timer = 0;
      this.timerInterval = null;
      this.difficulty = 'beginner';
      this.hintsUsed = 0;
      this.flagMode = false;
      
      // DOM elementleri
      this.elements = {
        mineField: document.getElementById('mine-field'),
        minesLeft: document.getElementById('mines-left'),
        timer: document.getElementById('timer'),
        flagsUsed: document.getElementById('flags-used'),
        difficultySelect: document.getElementById('difficulty-select'),
        firstClickSafe: document.getElementById('first-click-safe'),
        highlightSuggestions: document.getElementById('highlight-suggestions'),
        autoFlag: document.getElementById('auto-flag'),
        newGameBtn: document.getElementById('new-game-btn'),
        newGameModalBtn: document.getElementById('new-game-modal'),
        hintBtn: document.getElementById('hint-btn'),
        showHintBtn: document.getElementById('show-hint-btn'),
        helpBtn: document.getElementById('help-btn'),
        closeHelpBtn: document.getElementById('close-help-btn'),
        helpPanel: document.getElementById('help-panel'),
        gameStatusBtn: document.getElementById('game-status-btn'),
        flagModeBtn: document.getElementById('flag-mode-btn')
      };
      
      // Modal elementleri
      this.modals = {
        resultModal: new bootstrap.Modal(document.getElementById('result-modal')),
        hintModal: new bootstrap.Modal(document.getElementById('hint-modal')),
        customDifficultyModal: new bootstrap.Modal(document.getElementById('custom-difficulty-modal'))
      };
      
      // Sonuç elementleri
      this.resultElements = {
        winMessage: document.getElementById('win-message'),
        loseMessage: document.getElementById('lose-message'),
        resultTime: document.getElementById('result-time'),
        resultDifficulty: document.getElementById('result-difficulty'),
        resultMines: document.getElementById('result-mines'),
        resultBoardSize: document.getElementById('result-board-size')
      };
      
      // Özel zorluk ayarları
      this.customSettings = {
        width: document.getElementById('custom-width'),
        height: document.getElementById('custom-height'),
        mines: document.getElementById('custom-mines'),
        applyBtn: document.getElementById('apply-custom-difficulty')
      };
      
      // Olay dinleyicilerini ayarla
      this.setupEventListeners();
      
      // Oyunu başlat
      this.initializeGame();
    }
    
    /**
     * Olay dinleyicilerini ayarlar
     */
    setupEventListeners() {
      // Yeni oyun butonları
      this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
      this.elements.newGameModalBtn.addEventListener('click', () => {
        this.modals.resultModal.hide();
        this.startNewGame();
      });
      
      // Zorluk seçimi değişimi
      this.elements.difficultySelect.addEventListener('change', () => {
        const difficulty = this.elements.difficultySelect.value;
        if (difficulty === 'custom') {
          this.showCustomDifficultyModal();
        } else {
          this.difficulty = difficulty;
        }
      });
      
      // Özel zorluk modal butonu
      if (this.customSettings.applyBtn) {
        this.customSettings.applyBtn.addEventListener('click', () => {
          this.applyCustomDifficulty();
          this.modals.customDifficultyModal.hide();
          this.startNewGame();
        });
      }
      
      // İpucu butonları
      this.elements.hintBtn.addEventListener('click', () => this.showHint());
      this.elements.showHintBtn.addEventListener('click', () => {
        this.useHint();
        this.modals.hintModal.hide();
      });
      
      // Yardım butonu
      this.elements.helpBtn.addEventListener('click', () => {
        this.elements.helpPanel.classList.remove('hidden');
      });
      
      this.elements.closeHelpBtn.addEventListener('click', () => {
        this.elements.helpPanel.classList.add('hidden');
      });
      
      // Durum butonu (yüz) - Yeni oyun başlatmak için
      this.elements.gameStatusBtn.addEventListener('click', () => this.startNewGame());
      
      // Bayrak modu butonu
      this.elements.flagModeBtn.addEventListener('click', () => this.toggleFlagMode());
    }
    
    /**
     * Oyunu başlatır veya sıfırlar
     */
    initializeGame() {
      // Zorluk seviyesine göre tahta boyutlarını ayarla
      this.setDifficultySettings();
      
      // Oyun değişkenlerini sıfırla
      this.board = Array(this.height).fill().map(() => Array(this.width).fill(0));
      this.revealed = Array(this.height).fill().map(() => Array(this.width).fill(false));
      this.flagged = Array(this.height).fill().map(() => Array(this.width).fill(false));
      this.mineLocations = [];
      this.firstClick = true;
      this.gameActive = true;
      this.gameOver = false;
      this.flagCount = 0;
      this.revealedCount = 0;
      this.hintsUsed = 0;
      
      // Zamanlayıcıyı sıfırla
      clearInterval(this.timerInterval);
      this.timer = 0;
      this.elements.timer.textContent = '00:00';
      
      // Mayın ve bayrak sayacını güncelle
      this.elements.minesLeft.textContent = this.mines;
      this.elements.flagsUsed.textContent = '0';
      
      // Durum butonunu sıfırla
      this.updateGameStatusButton('playing');
      
      // Tahtayı oluştur
      this.renderBoard();
    }
    
    /**
     * Zorluk seviyesine göre ayarları yapar
     */
    setDifficultySettings() {
      switch (this.difficulty) {
        case 'beginner':
          this.width = 9;
          this.height = 9;
          this.mines = 10;
          break;
        case 'intermediate':
          this.width = 16;
          this.height = 16;
          this.mines = 40;
          break;
        case 'expert':
          this.width = 30;
          this.height = 16;
          this.mines = 99;
          break;
        case 'custom':
          // Özel ayarlar zaten ayarlanmış olmalı
          break;
        default:
          this.width = 9;
          this.height = 9;
          this.mines = 10;
          this.difficulty = 'beginner';
      }
    }
    
    /**
     * Yeni bir oyun başlatır
     */
    startNewGame() {
      this.initializeGame();
    }
    
    /**
     * Özel zorluk modalını gösterir
     */
    showCustomDifficultyModal() {
      // Mevcut değerleri göster
      if (this.customSettings.width) {
        this.customSettings.width.value = this.width;
        this.customSettings.height.value = this.height;
        this.customSettings.mines.value = this.mines;
        
        // Modalı göster
        this.modals.customDifficultyModal.show();
      }
    }
    
    /**
     * Özel zorluk ayarlarını uygular
     */
    applyCustomDifficulty() {
      if (!this.customSettings.width) return;
      
      // Değerleri al ve doğrula
      let width = parseInt(this.customSettings.width.value) || 16;
      let height = parseInt(this.customSettings.height.value) || 16;
      let mines = parseInt(this.customSettings.mines.value) || 40;
      
      // Minimum ve maksimum değerler
      width = Math.max(5, Math.min(50, width));
      height = Math.max(5, Math.min(50, height));
      
      // Mayın sayısı, toplam hücre sayısının %40'ından fazla olmamalı
      // ve en az 9 hücre boş kalmalı (ilk tıklama için)
      const maxMines = Math.floor((width * height) * 0.4);
      const minMines = 1;
      mines = Math.max(minMines, Math.min(maxMines, mines));
      
      // Değerleri ayarla
      this.width = width;
      this.height = height;
      this.mines = mines;
      this.difficulty = 'custom';
    }
    
    /**
     * Mayın tarlasını render eder
     */
    renderBoard() {
      const mineField = this.elements.mineField;
      mineField.innerHTML = '';
      mineField.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
      
      // Oyun alanı genişliğini ayarla (maksimum 500px)
      const cellSize = Math.min(28, Math.floor(500 / this.width));
      
      // Hücreleri oluştur
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const cell = document.createElement('div');
          cell.className = 'mine-cell';
          cell.dataset.x = x;
          cell.dataset.y = y;
          
          // Hücre boyutunu ayarla
          cell.style.width = `${cellSize}px`;
          cell.style.height = `${cellSize}px`;
          cell.style.fontSize = `${Math.max(12, cellSize * 0.6)}px`;
          
          // Hücre durumunu ayarla
          if (this.revealed[y][x]) {
            cell.classList.add('revealed');
            
            // Mayın
            if (this.board[y][x] === -1) {
              cell.classList.add('mine');
              cell.innerHTML = '<i class="fas fa-bomb"></i>';
              
              // Patlamış mayın
              if (this.gameOver && !this.flagged[y][x] && this.isLastClickedMine(x, y)) {
                cell.classList.add('exploded');
              }
            } 
            // Sayı
            else if (this.board[y][x] > 0) {
              cell.classList.add(`adjacent-${this.board[y][x]}`);
              cell.textContent = this.board[y][x];
            }
          } else if (this.flagged[y][x]) {
            cell.classList.add('flagged');
            cell.innerHTML = '<i class="fas fa-flag"></i>';
            
            // Yanlış bayrak (oyun bittiğinde)
            if (this.gameOver && this.board[y][x] !== -1) {
              cell.classList.add('wrong-flag');
              cell.innerHTML = '<i class="fas fa-times"></i>';
            }
          }
          
          // Hücreye tıklama olaylarını ekle
          if (!this.gameOver) {
            // Sol tıklama
            cell.addEventListener('click', (e) => {
              if (this.flagMode) {
                this.toggleFlag(x, y);
              } else {
                this.handleCellClick(x, y);
              }
            });
            
            // Sağ tıklama (bayrak)
            cell.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              this.toggleFlag(x, y);
            });
            
            // Çift tıklama (chord)
            cell.addEventListener('dblclick', () => {
              this.handleChordClick(x, y);
            });
            
            // Orta tıklama (chord)
            cell.addEventListener('mouseup', (e) => {
              if (e.button === 1) { // Orta tıklama
                e.preventDefault();
                this.handleChordClick(x, y);
              }
            });
            
            // İpuçları için hover
            if (this.revealed[y][x] && this.board[y][x] > 0) {
              cell.addEventListener('mouseenter', () => {
                if (this.elements.highlightSuggestions.checked) {
                  this.highlightAdjacentCells(x, y);
                }
              });
              
              cell.addEventListener('mouseleave', () => {
                if (this.elements.highlightSuggestions.checked) {
                  this.clearHighlights();
                }
              });
            }
          }
          
          mineField.appendChild(cell);
        }
      }
    }
    
    /**
     * Hücreye tıklandığında çalışan fonksiyon
     */
    handleCellClick(x, y) {
      // Oyun bitmiş veya bayraklı hücre ise işlem yapma
      if (this.gameOver || this.flagged[y][x]) return;
      
      // İlk tıklama ise mayınları yerleştir
      if (this.firstClick) {
        this.firstClick = false;
        this.placeMines(x, y);
        this.startTimer();
      }
      
      // Hücreyi aç
      this.revealCell(x, y);
      
      // Otomatik bayraklama etkinse ve bu bir ipucu değilse, kesin mayınları bul ve işaretle
      if (this.elements.autoFlag && this.elements.autoFlag.checked && !this.firstClick && !this.gameOver) {
        this.autoFlagMines();
      }
    }
    
    /**
     * Hücreyi açar ve gerekirse yayılır
     */
    revealCell(x, y) {
      // Sınır ve durum kontrolü
      if (x < 0 || x >= this.width || y < 0 || y >= this.height || 
          this.revealed[y][x] || this.flagged[y][x] || this.gameOver) {
        return false;
      }
      
      // Hücreyi aç
      this.revealed[y][x] = true;
      this.revealedCount++;
      
      // Mayına basıldıysa
      if (this.board[y][x] === -1) {
        // İlk tıklama güvenli özelliği açıksa ve bu ilk açılan hücre ise
        if (this.elements.firstClickSafe && this.elements.firstClickSafe.checked && this.revealedCount === 1) {
          // Mayını başka yere taşı
          this.moveMine(x, y);
        } else {
          // Oyun kaybedildi
          this.lastClickedMine = {x, y};
          this.endGame(false);
          return true;
        }
      }
      
      // 0 değerli hücre ise (boş hücre), etrafındaki tüm hücreleri aç
      if (this.board[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            this.revealCell(x + dx, y + dy);
          }
        }
      }
      
      // Tahtayı güncelle
      this.renderBoard();
      
      // Kazanma durumunu kontrol et
      this.checkWin();
      
      return true;
    }
    
    /**
     * Bayrak ekler veya kaldırır
     */
    toggleFlag(x, y) {
      // Oyun bitmiş veya hücre açılmışsa işlem yapma
      if (this.gameOver || this.revealed[y][x]) return;
      
      // Bayrak durumunu değiştir
      this.flagged[y][x] = !this.flagged[y][x];
      
      // Bayrak sayısını güncelle
      if (this.flagged[y][x]) {
        this.flagCount++;
      } else {
        this.flagCount--;
      }
      
      // Bayrak göstergelerini güncelle
      this.elements.minesLeft.textContent = Math.max(0, this.mines - this.flagCount);
      this.elements.flagsUsed.textContent = this.flagCount;
      
      // Tahtayı güncelle
      this.renderBoard();
      
      // Kazanma durumunu kontrol et
      this.checkWin();
    }
    
    /**
     * Chord (çift tıklama) işlemini yapar
     */
    handleChordClick(x, y) {
      // Oyun bitmiş veya hücre açılmamışsa işlem yapma
      if (this.gameOver || !this.revealed[y][x] || this.board[y][x] <= 0) return;
      
      // Etrafındaki bayrakların sayısını kontrol et
      let flagCount = 0;
      let unopenedCells = [];
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (this.isValidCell(nx, ny)) {
            if (this.flagged[ny][nx]) {
              flagCount++;
            } else if (!this.revealed[ny][nx]) {
              unopenedCells.push({x: nx, y: ny});
            }
          }
        }
      }
      
      // Bayrak sayısı, hücredeki sayıya eşitse çevresi açılabilir
      if (flagCount === this.board[y][x] && unopenedCells.length > 0) {
        let revealedAny = false;
        
        // Tüm işaretlenmemiş kapalı hücreleri aç
        for (const cell of unopenedCells) {
          if (this.revealCell(cell.x, cell.y)) {
            revealedAny = true;
          }
        }
        
        if (revealedAny) {
          this.renderBoard();
        }
      }
    }
    
    /**
     * Mayınları yerleştirir
     */
    placeMines(safeX, safeY) {
      // Güvenli bölge (ilk tıklama etrafı)
      const safeZone = [];
      
      // İlk tıklama güvenli özelliği açıksa, 3x3 güvenli alan oluştur
      if (this.elements.firstClickSafe && this.elements.firstClickSafe.checked) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = safeX + dx;
            const ny = safeY + dy;
            
            if (this.isValidCell(nx, ny)) {
              safeZone.push({x: nx, y: ny});
            }
          }
        }
      } else {
        // Sadece tıklanan hücre güvenli
        safeZone.push({x: safeX, y: safeY});
      }
      
      // Olası mayın pozisyonlarını oluştur
      const possiblePositions = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Güvenli bölgede değilse, listeye ekle
          if (!safeZone.some(pos => pos.x === x && pos.y === y)) {
            possiblePositions.push({x, y});
          }
        }
      }
      
      // Mayın sayısından fazla pozisyon varsa, rastgele mayınları yerleştir
      if (possiblePositions.length >= this.mines) {
        // Pozisyonları karıştır
        this.shuffleArray(possiblePositions);
        
        // Mayınları yerleştir
        this.mineLocations = [];
        for (let i = 0; i < this.mines; i++) {
          const pos = possiblePositions[i];
          this.board[pos.y][pos.x] = -1; // -1 = mayın
          this.mineLocations.push({x: pos.x, y: pos.y});
        }
      } else {
        // Yeterli mayın pozisyonu yoksa zorluk seviyesini düşür
        this.mines = Math.max(1, possiblePositions.length - 1);
        this.elements.minesLeft.textContent = this.mines;
        this.placeMines(safeX, safeY);
        return;
      }
      
      // Sayıları hesapla (her hücrenin etrafındaki mayın sayısı)
      this.calculateNumbers();
    }
    
    /**
     * Mayını başka bir yere taşır
     */
    moveMine(avoidX, avoidY) {
      // Boş ve mayınsız bir hücre bul
      const emptyPositions = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if ((x !== avoidX || y !== avoidY) && 
              this.board[y][x] !== -1 && 
              !this.revealed[y][x]) {
            emptyPositions.push({x, y});
          }
        }
      }
      
      if (emptyPositions.length > 0) {
        // Rastgele bir boş pozisyon seç
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        const pos = emptyPositions[randomIndex];
        
        // Mayını yeni konuma taşı
        this.board[avoidY][avoidX] = 0;
        this.board[pos.y][pos.x] = -1;
        
        // Mayın konumlarını güncelle
        const mineIndex = this.mineLocations.findIndex(mine => mine.x === avoidX && mine.y === avoidY);
        if (mineIndex !== -1) {
          this.mineLocations[mineIndex] = {x: pos.x, y: pos.y};
        }
        
        // Sayıları yeniden hesapla
        this.calculateNumbers();
      }
    }
    
    /**
     * Her hücrenin etrafındaki mayın sayısını hesaplar
     */
    calculateNumbers() {
      // Önce tüm sayıları sıfırla
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.board[y][x] !== -1) {
            this.board[y][x] = 0;
          }
        }
      }
      
      // Her mayının etrafındaki hücrelerin sayacını artır
      for (const mine of this.mineLocations) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = mine.x + dx;
            const ny = mine.y + dy;
            
            if (this.isValidCell(nx, ny) && this.board[ny][nx] !== -1) {
              this.board[ny][nx]++;
            }
          }
        }
      }
    }
    
    /**
     * İpucu gösterme fonksiyonu
     */
    showHint() {
      if (this.gameOver) return;
      
      // Henüz oyuna başlanmadıysa ipucu gösterme
      if (this.firstClick) {
        document.getElementById('hint-text').textContent = 'Önce oyuna başlamalısınız. Herhangi bir kareye tıklayın.';
        this.modals.hintModal.show();
        return;
      }
      
      // İpuçlarını hesapla
      const hints = this.calculateHints();
      
      if (hints.length > 0) {
        document.getElementById('hint-text').textContent = 'Bir ipucu almak istediğinizden emin misiniz? Bu puan hesaplamanızı etkileyecektir.';
        this.modals.hintModal.show();
      } else {
        document.getElementById('hint-text').textContent = 'Üzgünüm, şu anda verebileceğim bir ipucu bulamadım. Mantıksal bir çözüm bulunamıyor.';
        this.modals.hintModal.show();
      }
    }
    
    /**
     * İpucu kullanma fonksiyonu
     */
    useHint() {
      if (this.gameOver || this.firstClick) return false;
      
      // İpucu sayısını artır
      this.hintsUsed++;
      
      // İpuçlarını hesapla
      const hints = this.calculateHints();
      
      if (hints.length > 0) {
        // Rastgele bir ipucu seç
        const randomIndex = Math.floor(Math.random() * hints.length);
        const hint = hints[randomIndex];
        
        // İpucu türüne göre işlem yap
        let hintText = '';
        
        if (hint.type === 'safe') {
          // Güvenli bir hücre
          hintText = `(${hint.x+1}, ${hint.y+1}) konumundaki hücre güvenlidir. Tıklayabilirsiniz.`;
          
          // Hücreyi vurgula
          this.highlightCell(hint.x, hint.y, 'hint');
          
          // 3 saniye sonra vurguyu kaldır
          setTimeout(() => {
            this.clearHighlights();
          }, 3000);
          
        } else if (hint.type === 'mine') {
          // Mayın olan bir hücre
          hintText = `(${hint.x+1}, ${hint.y+1}) konumunda bir mayın var. İşaretlendi.`;
          
          // Otomatik bayrak koy
          if (!this.flagged[hint.y][hint.x]) {
            this.toggleFlag(hint.x, hint.y);
          }
        }
        
        // İpucu metnini göster
        document.getElementById('hint-text').textContent = hintText;
        
        return true;
      }
      
      return false;
    }
    
    /**
     * Kazanılabilir ipuçlarını hesaplar
     */
    calculateHints() {
      const hints = [];
      
      // 1. Güvenli hücreleri bul
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Zaten açılmış veya işaretlenmiş hücreleri atla
          if (this.revealed[y][x] || this.flagged[y][x]) continue;
          
          // Açık hücrelerin etrafındaki güvenli hücreleri kontrol et
          let isSafe = false;
          let definitelyMine = false;
          
          // Çevredeki açık hücreleri kontrol et
          for (let dy = -1; dy <= 1 && !isSafe && !definitelyMine; dy++) {
            for (let dx = -1; dx <= 1 && !isSafe && !definitelyMine; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const nx = x + dx;
              const ny = y + dy;
              
              if (this.isValidCell(nx, ny) && this.revealed[ny][nx] && this.board[ny][nx] > 0) {
                // Komşu hücre etrafındaki bayrakları ve açılmamış hücreleri say
                const {flagCount, unopenedCount} = this.countSurroundingCells(nx, ny);
                
                // Eğer bayrak sayısı, komşu mayın sayısına eşitse ve hala açılmamış hücreler varsa
                if (flagCount === this.board[ny][nx] && unopenedCount > 0) {
                  isSafe = true;
                }
                
                // Eğer (bayrak + açılmamış) sayısı tam olarak mayın sayısına eşitse
                // ve bu hücre açılmamış ve bayrak değilse, bu bir mayındır
                if (flagCount + unopenedCount === this.board[ny][nx] && 
                    !this.revealed[y][x] && !this.flagged[y][x]) {
                  definitelyMine = true;
                }
              }
            }
          }
          
          if (isSafe && this.board[y][x] !== -1) {
            hints.push({
              type: 'safe',
              x: x,
              y: y
            });
          }
          
          if (definitelyMine && this.board[y][x] === -1) {
            hints.push({
              type: 'mine',
              x: x,
              y: y
            });
          }
        }
      }
      
      // 2. Mayın olan hücreleri bul (daha kesin olan yöntemi kullanarak)
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Zaten açılmış veya işaretlenmiş hücreleri atla
          if (this.revealed[y][x] || this.flagged[y][x]) continue;
          
          // Mayın olan ama işaretlenmemiş hücreleri bul
          if (this.board[y][x] === -1) {
            hints.push({
              type: 'mine',
              x: x,
              y: y
            });
          }
        }
      }
      
      // Eğer kesin ipuçları bulunamadıysa, mayınsız bir hücreyi güvenli olarak işaretle
      if (hints.length === 0) {
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            if (!this.revealed[y][x] && !this.flagged[y][x] && this.board[y][x] !== -1) {
              hints.push({
                type: 'safe',
                x: x,
                y: y
              });
              return hints;
            }
          }
        }
      }
      
      return hints;
    }
    
    /**
     * Otomatik olarak kesin mayınları bayraklar
     */
    autoFlagMines() {
      let flaggedAny = false;
      
      // Açık sayıların etrafındaki kesin mayınları bul
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.revealed[y][x] && this.board[y][x] > 0) {
            // Komşu hücreleri say
            const {flagCount, unopenedCount} = this.countSurroundingCells(x, y);
            
            // Eğer (bayrak + açılmamış) sayısı tam olarak mayın sayısına eşitse
            // ve hala işaretlenmemiş mayınlar varsa
            if (flagCount + unopenedCount === this.board[y][x] && unopenedCount > 0) {
              // Etraftaki tüm açılmamış hücreleri bayrakla
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  
                  const nx = x + dx;
                  const ny = y + dy;
                  
                  if (this.isValidCell(nx, ny) && !this.revealed[ny][nx] && !this.flagged[ny][nx]) {
                    this.toggleFlag(nx, ny);
                    flaggedAny = true;
                  }
                }
              }
            }
          }
        }
      }
      
      return flaggedAny;
    }
    
    /**
     * Bir hücrenin etrafındaki bayrak ve açılmamış hücre sayısını hesaplar
     */
    countSurroundingCells(x, y) {
      let flagCount = 0;
      let unopenedCount = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (this.isValidCell(nx, ny)) {
            if (this.flagged[ny][nx]) {
              flagCount++;
            } else if (!this.revealed[ny][nx]) {
              unopenedCount++;
            }
          }
        }
      }
      
      return {flagCount, unopenedCount};
    }
    
    /**
     * Komşu hücreleri geçici olarak vurgular
     */
    highlightAdjacentCells(x, y) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          
          if (this.isValidCell(nx, ny) && !this.revealed[ny][nx] && !this.flagged[ny][nx]) {
            this.highlightCell(nx, ny, 'highlight');
          }
        }
      }
    }
    
    /**
     * Belirli bir hücreyi vurgular
     */
    highlightCell(x, y, className) {
      const cell = this.elements.mineField.querySelector(`.mine-cell[data-x="${x}"][data-y="${y}"]`);
      if (cell) {
        cell.classList.add(className);
      }
    }
    
    /**
     * Tüm vurgulamaları temizler
     */
    clearHighlights() {
      const cells = this.elements.mineField.querySelectorAll('.mine-cell');
      cells.forEach(cell => {
        cell.classList.remove('highlight', 'hint');
      });
    }
    
    /**
     * Bayrak modunu açar/kapatır
     */
    toggleFlagMode() {
      this.flagMode = !this.flagMode;
      this.elements.flagModeBtn.classList.toggle('active', this.flagMode);
    }
    
    /**
     * Oyun durum butonunu günceller
     */
    updateGameStatusButton(status) {
      const btn = this.elements.gameStatusBtn;
      if (!btn) return;
      
      // Tüm sınıfları kaldır
      btn.classList.remove('playing', 'win', 'lose', 'scared');
      
      // Yeni durumu ekle
      btn.classList.add(status);
      
      // İkonu güncelle
      let icon = '';
      switch (status) {
        case 'playing':
          icon = '<i class="fas fa-smile"></i>';
          break;
        case 'win':
          icon = '<i class="fas fa-grin-stars"></i>';
          break;
        case 'lose':
          icon = '<i class="fas fa-dizzy"></i>';
          break;
        case 'scared':
          icon = '<i class="fas fa-grimace"></i>';
          break;
      }
      
      btn.innerHTML = icon;
    }
    
    /**
     * Zamanlayıcıyı başlatır
     */
    startTimer() {
      this.startTime = Date.now();
      this.timer = 0;
      
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.timer++;
        
        // Dakika ve saniye formatında göster
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        
        this.elements.timer.textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }, 1000);
    }
    
    /**
     * Kazanma durumunu kontrol eder
     */
    checkWin() {
      if (this.gameOver) return false;
      
      // Tüm güvenli hücreler açıldıysa veya tüm mayınlar doğru işaretlendiyse oyun kazanılır
      const totalSafeCells = this.width * this.height - this.mines;
      const allSafeCellsRevealed = this.revealedCount >= totalSafeCells;
      
      // Tüm mayınlar doğru bir şekilde işaretlendiyse
      let allMinesFlagged = this.flagCount === this.mines;
      if (allMinesFlagged) {
        for (const mine of this.mineLocations) {
          if (!this.flagged[mine.y][mine.x]) {
            allMinesFlagged = false;
            break;
          }
        }
      }
      
      if (allSafeCellsRevealed || allMinesFlagged) {
        this.endGame(true);
        return true;
      }
      
      return false;
    }
    
    /**
     * Oyun sonu işlemlerini yapar
     */
    endGame(isWin) {
      this.gameOver = true;
      clearInterval(this.timerInterval);
      
      // Durum butonunu güncelle
      this.updateGameStatusButton(isWin ? 'win' : 'lose');
      
      // Tüm mayınları göster
      if (!isWin) {
        for (const mine of this.mineLocations) {
          if (!this.flagged[mine.y][mine.x]) {
            this.revealed[mine.y][mine.x] = true;
          }
        }
      }
      
      // Tahtayı güncelle
      this.renderBoard();
      
      // Sonuç bilgilerini göster
      this.resultElements.winMessage.style.display = isWin ? 'block' : 'none';
      this.resultElements.loseMessage.style.display = isWin ? 'none' : 'block';
      
      this.resultElements.resultTime.textContent = this.elements.timer.textContent;
      this.resultElements.resultDifficulty.textContent = this.getDifficultyText();
      this.resultElements.resultMines.textContent = this.mines;
      this.resultElements.resultBoardSize.textContent = `${this.width}x${this.height}`;
      
      // Sonuç modalını göster
      this.modals.resultModal.show();
    }
    
    /**
     * Geçerli bir hücre konumu olup olmadığını kontrol eder
     */
    isValidCell(x, y) {
      return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Son tıklanan hücre mayın mı kontrol eder
     */
    isLastClickedMine(x, y) {
      return this.lastClickedMine && 
             this.lastClickedMine.x === x && 
             this.lastClickedMine.y === y;
    }
    
    /**
     * Zorluk seviyesi metnini döndürür
     */
    getDifficultyText() {
      switch (this.difficulty) {
        case 'beginner': return 'Kolay';
        case 'intermediate': return 'Orta';
        case 'expert': return 'Uzman';
        case 'custom': return 'Özel';
        default: return 'Kolay';
      }
    }
    
    /**
     * Diziyi karıştırır (Fisher-Yates algoritması)
     */
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }
  
  // Oyunu başlat
  window.minesweeperGame = new MinesweeperGame();
});