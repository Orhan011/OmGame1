
// Modern Merge Puzzle (X2 Blocks) - 2048 Game
document.addEventListener('DOMContentLoaded', function() {
  console.log('X2 Blocks oyunu başlatılıyor...');
  
  // Eski yükleniyor mesajını temizle
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.remove();
  }
  
  // Oyun sınıfını başlat
  const game = new ModernMergePuzzle();
});

class ModernMergePuzzle {
    constructor() {
        this.columns = Array(5).fill().map(() => []);  // 5 columns
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.level = parseInt(localStorage.getItem('level')) || 1;
        this.moveHistory = [];
        this.gameOver = false;
        this.won = false;
        this.draggingBlock = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.blockSize = 60;
        this.gap = 10;
        this.maxBlocksPerColumn = 6;  // Maximum blocks visible in a column
        this.nextBlockValue = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') === 'false' ? false : true;
        this.themeMode = localStorage.getItem('themeMode') || 'light';

        // Ses efektleri
        this.sounds = {};

        // Sesleri yükle
        this.loadSounds = () => {
            // Ses desteğini tamamen kapatıyoruz, çünkü hata oluşturuyor
            this.soundEnabled = false;
            document.getElementById('toggle-sound').textContent = '🔇';

            // Ses çalma işlevlerini boş fonksiyonlara dönüştür
            this.playSound = () => {};
        };

        // Sesleri yükle
        this.loadSounds();

        this.setupGame();
        this.generateNextBlock();
        this.setupEventListeners();
        this.applyTheme();
    }

    setupGame() {
        // Get DOM elements
        this.columnsGridElement = document.querySelector('.columns-grid');
        this.blockSourceElement = document.querySelector('.block-source');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.finalScoreElement = document.querySelector('.final-score');
        this.bestScoreElement.textContent = this.bestScore;

        // Clear existing grid
        this.columnsGridElement.innerHTML = '';

        // Create columns
        for (let i = 0; i < 5; i++) {
            const column = document.createElement('div');
            column.className = 'column';
            column.dataset.index = i;
            this.columnsGridElement.appendChild(column);
        }
    }

    generateNextBlock() {
        // Clear the source block container
        this.blockSourceElement.innerHTML = '';

        // Add the next-label back
        const nextLabel = document.createElement('div');
        nextLabel.className = 'next-label';
        nextLabel.textContent = 'SONRAKI BLOK';
        this.blockSourceElement.appendChild(nextLabel);

        // Tablodaki en yüksek taş değerini bul
        let highestValue = 0;
        this.columns.forEach(column => {
            column.forEach(value => {
                highestValue = Math.max(highestValue, value);
            });
        });

        // Yüksek değere göre minimum taş değeri belirle
        let minBlockValue = 2;

        if (highestValue >= 4096) {
            minBlockValue = 32;
        } else if (highestValue >= 2048) {
            minBlockValue = 16;
        } else if (highestValue >= 1024) {
            minBlockValue = 8;
        } else if (highestValue >= 512) {
            minBlockValue = 4;
        }

        // Minimum taş değerine göre değer havuzu oluştur
        let possibleValues = [];
        let baseValue = minBlockValue;

        // Değer havuzuna 4 farklı değer ekle (minimum ve 3 üst seviye)
        for (let i = 0; i < 4; i++) {
            possibleValues.push(baseValue * Math.pow(2, i));
        }

        // Olasılık dağılımını ayarla (düşük değerler daha sık gelsin)
        const rand = Math.random();
        let selectedIndex;

        if (rand < 0.5) {
            selectedIndex = 0; // %50 olasılıkla en küçük değer
        } else if (rand < 0.8) {
            selectedIndex = 1; // %30 olasılıkla ikinci değer
        } else if (rand < 0.95) {
            selectedIndex = 2; // %15 olasılıkla üçüncü değer
        } else {
            selectedIndex = 3; // %5 olasılıkla en büyük değer
        }

        // Seçilen değeri ata
        this.nextBlockValue = possibleValues[selectedIndex];

        // Create the block element
        const block = document.createElement('div');
        block.className = 'block';
        block.dataset.value = this.nextBlockValue;
        block.textContent = this.nextBlockValue;

        // Style the block
        block.style.width = `${this.blockSize}px`;
        block.style.height = `${this.blockSize}px`;

        // Add to DOM
        this.blockSourceElement.appendChild(block);

        // Setup dragging
        this.setupBlockDrag(block);
    }

    setupBlockDrag(block) {
        // Touch events for mobile
        block.addEventListener('touchstart', (e) => {
            if (this.gameOver || this.won) return;
            e.preventDefault();

            const touch = e.touches[0];
            this.startDragging(block, touch.clientX, touch.clientY);
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.draggingBlock) return;
            e.preventDefault();

            const touch = e.touches[0];
            this.updateDragging(touch.clientX, touch.clientY);
        });

        document.addEventListener('touchend', () => {
            if (!this.draggingBlock) return;
            this.endDragging();
        });

        // Mouse events for desktop
        block.addEventListener('mousedown', (e) => {
            if (this.gameOver || this.won) return;
            e.preventDefault();

            this.startDragging(block, e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.draggingBlock) return;
            this.updateDragging(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            if (!this.draggingBlock) return;
            this.endDragging();
        });
    }

    startDragging(block, clientX, clientY) {
        // Create a clone of the block for dragging
        this.draggingBlock = block.cloneNode(true);
        this.draggingBlock.classList.add('dragging');
        document.body.appendChild(this.draggingBlock);

        // Store starting position for calculating offset
        const rect = block.getBoundingClientRect();
        this.dragStartPos = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        // Track current position
        this.lastDragPos = {
            x: clientX,
            y: clientY
        };

        // Position the dragging block
        this.draggingBlock.style.position = 'fixed';
        this.draggingBlock.style.width = `${this.blockSize}px`;
        this.draggingBlock.style.height = `${this.blockSize}px`;
        this.draggingBlock.style.left = `${clientX - this.dragStartPos.x}px`;
        this.draggingBlock.style.top = `${clientY - this.dragStartPos.y}px`;

        // Highlight columns to show where block can be placed
        document.querySelectorAll('.column').forEach(col => {
            col.classList.add('highlight');
        });
    }

    updateDragging(clientX, clientY) {
        // Update position of dragging block
        this.draggingBlock.style.left = `${clientX - this.dragStartPos.x}px`;
        this.draggingBlock.style.top = `${clientY - this.dragStartPos.y}px`;

        // Track current position
        this.lastDragPos = { x: clientX, y: clientY };
    }

    endDragging() {
        // Find which column the block was dropped on
        const columnIndex = this.getColumnFromPosition(this.lastDragPos);

        if (columnIndex !== -1) {
            // Save current state for undo
            this.saveGameState();

            // Add block to column
            this.placeBlockInColumn(columnIndex, this.nextBlockValue);
        }

        // Clean up
        if (this.draggingBlock && this.draggingBlock.parentElement) {
            this.draggingBlock.remove();
        }
        this.draggingBlock = null;

        // Remove column highlights
        document.querySelectorAll('.column').forEach(col => {
            col.classList.remove('highlight');
        });
    }

    getColumnFromPosition(pos) {
        // Get the column where the block was dropped
        const gridRect = this.columnsGridElement.getBoundingClientRect();

        // Check if position is over the grid
        if (pos.x < gridRect.left || pos.x > gridRect.right || 
            pos.y < gridRect.top || pos.y > gridRect.bottom) {
            return -1;
        }

        // Calculate column index based on x-position
        const relativeX = pos.x - gridRect.left;
        const columnWidth = gridRect.width / 5;
        const columnIndex = Math.floor(relativeX / columnWidth);

        return Math.max(0, Math.min(columnIndex, 4));
    }

    placeBlockInColumn(columnIndex, value) {
        // If column is full, return
        if (this.columns[columnIndex].length >= this.maxBlocksPerColumn) {
            this.checkGameOver();
            return;
        }

        // Add block to column data structure (at the end for visual placement at top)
        this.columns[columnIndex].push(value);

        // Blok pozisyonu (en üstte)
        const blockPosition = this.columns[columnIndex].length - 1;

        // Önce bloğu havada oluştur
        const block = this.renderBlockWithAnimation(columnIndex, blockPosition, value);

        // Check for merges
        this.checkForMerges(columnIndex);

        // Generate next block after rendering and merging
        this.generateNextBlock();

        // Check game state
        this.checkGameState();
    }

    renderBlock(columnIndex, position, value) {
        const column = document.querySelectorAll('.column')[columnIndex];
        if (!column) return null; // Safety check

        const block = document.createElement('div');

        block.className = 'block';
        block.dataset.value = value;
        block.dataset.column = columnIndex;
        block.dataset.position = position;
        block.textContent = value;

        // Calculate position
        const columnRect = column.getBoundingClientRect();
        const blockWidth = Math.max(30, Math.floor(columnRect.width - 10));
        const blockHeight = blockWidth;

        block.style.width = `${blockWidth}px`;
        block.style.height = `${blockHeight}px`;

        // Position within column (top-down) - hassas hesaplama
        const topOffset = 5;  // Top padding
        const gap = 10; // Bloklar arası boşluk
        const topPosition = Math.floor((position * (blockHeight + gap)) + topOffset);

        // Merkezi hizalama için sol pozisyonu hesaplama (tam sayı değerleri)
        const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

        // Doğrudan son pozisyona yerleştir (animasyon yok)
        block.style.left = `${leftOffset}px`;
        block.style.top = `${topPosition}px`;

        column.appendChild(block);

        return block;
    }

    renderBlockWithAnimation(columnIndex, position, value) {
        const column = document.querySelectorAll('.column')[columnIndex];
        if (!column) return null; // Safety check

        const block = document.createElement('div');

        // Animasyon sınıfını başlangıçta ekleme, daha sonra ekleyeceğiz
        block.className = 'block';
        block.dataset.value = value;
        block.dataset.column = columnIndex;
        block.dataset.position = position;
        block.textContent = value;

        // Calculate position
        const columnRect = column.getBoundingClientRect();
        const blockWidth = Math.max(30, Math.floor(columnRect.width - 10));
        const blockHeight = blockWidth;

        block.style.width = `${blockWidth}px`;
        block.style.height = `${blockHeight}px`;

        // Position within column (top-down)
        const topOffset = 5;  // Top padding
        const gap = 10; // Bloklar arası boşluk

        // Bloğun hedef konumu
        const targetTopPosition = Math.floor((position * (blockHeight + gap)) + topOffset);

        // Başlangıç pozisyonu (sütunun ALTINDA) - Alttan yukarıya kayma animasyonu için
        const columnHeight = column.clientHeight;
        const startTopPosition = columnHeight;

        // Merkezi hizalama için sol pozisyonu hesaplama
        const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

        // Başlangıç pozisyonuna yerleştir (sütunun altına)
        block.style.left = `${leftOffset}px`;
        block.style.top = `${startTopPosition}px`;

        // Bloğu DOM'a ekle
        column.appendChild(block);

        // Alttan kayarak gelmesi için animasyon sınıfı ekle
        block.classList.add('sliding-up');

        // Biraz gecikme ile hedef pozisyona hareket et
        setTimeout(() => {
            block.style.top = `${targetTopPosition}px`;
        }, 10);

        return block;
    }

    checkForMerges(columnIndex) {
        const column = this.columns[columnIndex];
        const mergedIndices = [];
        let mergeOccurred = false;

        // Start from the bottom and check for consecutive blocks with same value
        for (let i = column.length - 1; i > 0; i--) {
            // Skip if the block was already merged in this pass
            if (mergedIndices.includes(i)) continue;

            const currentValue = column[i];
            const aboveValue = column[i - 1];

            // If blocks have the same value, merge them
            if (currentValue === aboveValue) {
                // Double the value of the current block
                column[i] = currentValue * 2;
                
                // Remove the block above (it's merged)
                column.splice(i - 1, 1);
                
                // Update score
                this.addScore(column[i]);
                
                // Mark merge occurred
                mergeOccurred = true;
                
                // Keep track of this index as merged
                mergedIndices.push(i);
                
                // Check for 2048 block
                if (column[i] === 2048) {
                    this.showGameWon();
                }
            }
        }

        // If merges occurred, re-render the column
        if (mergeOccurred) {
            this.renderColumn(columnIndex, true);
        }
    }

    renderColumn(columnIndex, withAnimation = false) {
        const column = document.querySelectorAll('.column')[columnIndex];
        if (!column) return; // Safety check

        // Clear column
        column.innerHTML = '';

        // Render each block in the column
        this.columns[columnIndex].forEach((value, position) => {
            if (withAnimation) {
                this.renderBlock(columnIndex, position, value).classList.add('merged');
            } else {
                this.renderBlock(columnIndex, position, value);
            }
        });
    }

    addScore(value) {
        this.score += value;
        this.scoreElement.textContent = this.score;
        
        // Update best score if needed
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    checkGameState() {
        // Check if game is over
        this.checkGameOver();
        
        // Check level progression
        this.checkLevelProgression();
    }

    checkGameOver() {
        // If there are any columns not full, game is not over
        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].length < this.maxBlocksPerColumn) {
                return false;
            }
        }
        
        // Game is over
        this.gameOver = true;
        this.showGameOver();
        return true;
    }

    checkLevelProgression() {
        // Calculate new level based on score
        const newLevel = Math.floor(this.score / 1000) + 1;
        
        // Check if level increased
        if (newLevel > this.level) {
            this.level = newLevel;
            document.getElementById('level-value').textContent = this.level;
            localStorage.setItem('level', this.level);
        }
    }

    showGameOver() {
        const gameOverEl = document.getElementById('game-over');
        const finalScoreEl = document.querySelector('.final-score');
        
        finalScoreEl.textContent = this.score;
        gameOverEl.classList.remove('hidden');
        
        // Save the score to server
        this.saveScoreToServer();
    }

    showGameWon() {
        // Only show won message once
        if (this.won) return;
        
        this.won = true;
        const gameWonEl = document.getElementById('game-won');
        gameWonEl.classList.remove('hidden');
        
        // Save the score to server
        this.saveScoreToServer();
    }

    saveScoreToServer() {
        // Check if API is available
        if (!window.fetch) return;
        
        // Prepare data
        const scoreData = {
            game_type: '2048',
            score: this.score
        };
        
        // Send to server
        fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Score saved:', data);
        })
        .catch(error => {
            console.error('Error saving score:', error);
        });
    }

    saveGameState() {
        // Create a deep copy of the current game state
        const gameState = {
            columns: JSON.parse(JSON.stringify(this.columns)),
            score: this.score,
            nextBlockValue: this.nextBlockValue
        };
        
        // Add to history
        this.moveHistory.push(gameState);
        
        // Limit history to 20 moves to save memory
        if (this.moveHistory.length > 20) {
            this.moveHistory.shift();
        }
    }

    undoMove() {
        // Check if there are moves to undo
        if (this.moveHistory.length === 0) return;
        
        // Get the last state
        const lastState = this.moveHistory.pop();
        
        // Restore state
        this.columns = lastState.columns;
        this.score = lastState.score;
        this.scoreElement.textContent = this.score;
        
        // Re-render all columns
        for (let i = 0; i < this.columns.length; i++) {
            this.renderColumn(i);
        }
        
        // Game is not over if we can undo
        this.gameOver = false;
        document.getElementById('game-over').classList.add('hidden');
        
        // Game is not won if we undo beyond the winning move
        let has2048 = false;
        for (let i = 0; i < this.columns.length; i++) {
            for (let j = 0; j < this.columns[i].length; j++) {
                if (this.columns[i][j] === 2048) {
                    has2048 = true;
                    break;
                }
            }
            if (has2048) break;
        }
        
        if (!has2048) {
            this.won = false;
            document.getElementById('game-won').classList.add('hidden');
        }
    }

    startNewGame() {
        // Reset game state
        this.columns = Array(5).fill().map(() => []);
        this.score = 0;
        this.scoreElement.textContent = 0;
        this.moveHistory = [];
        this.gameOver = false;
        this.won = false;
        
        // Hide overlays
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-won').classList.add('hidden');
        
        // Clear columns
        document.querySelectorAll('.column').forEach(col => {
            col.innerHTML = '';
        });
        
        // Generate next block
        this.generateNextBlock();
    }

    continueGame() {
        // Hide won overlay and continue playing
        document.getElementById('game-won').classList.add('hidden');
    }

    applyTheme() {
        if (this.themeMode === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            document.getElementById('toggle-theme').textContent = '☀️';
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            document.getElementById('toggle-theme').textContent = '🌙';
        }
    }

    toggleTheme() {
        this.themeMode = this.themeMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', this.themeMode);
        this.applyTheme();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled);
        document.getElementById('toggle-sound').textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    // Güçlendirme: Sütun Temizleme
    clearColumn() {
        // Hangi sütunları temizleyebileceğimizi kontrol et
        const availableColumns = [];
        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].length > 0) {
                availableColumns.push(i);
            }
        }
        
        if (availableColumns.length === 0) return;
        
        // Rastgele bir sütun seç
        const randomIndex = Math.floor(Math.random() * availableColumns.length);
        const columnIndex = availableColumns[randomIndex];
        
        // Mevcut durumu kaydet
        this.saveGameState();
        
        // Sütunu temizle
        this.columns[columnIndex] = [];
        this.renderColumn(columnIndex);
    }

    // Güçlendirme: Değeri İkile
    doubleValue() {
        // En yüksek değerli taşı bul
        let highestValue = 0;
        let highestValueColumn = -1;
        let highestValuePosition = -1;
        
        for (let i = 0; i < this.columns.length; i++) {
            for (let j = 0; j < this.columns[i].length; j++) {
                if (this.columns[i][j] > highestValue) {
                    highestValue = this.columns[i][j];
                    highestValueColumn = i;
                    highestValuePosition = j;
                }
            }
        }
        
        if (highestValueColumn === -1) return;
        
        // Mevcut durumu kaydet
        this.saveGameState();
        
        // Değeri ikile
        this.columns[highestValueColumn][highestValuePosition] *= 2;
        
        // Sütunu yeniden oluştur
        this.renderColumn(highestValueColumn, true);
        
        // 2048 kontrolü
        if (this.columns[highestValueColumn][highestValuePosition] === 2048) {
            this.showGameWon();
        }
        
        // Skoru güncelle
        this.addScore(this.columns[highestValueColumn][highestValuePosition]);
    }

    // Güçlendirme: Ekstra Hamle
    extraMove() {
        // Rastgele bir değer seç
        const values = [2, 4, 8, 16];
        const randomIndex = Math.floor(Math.random() * values.length);
        const value = values[randomIndex];
        
        // Rastgele bir sütun seç
        const availableColumns = [];
        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].length < this.maxBlocksPerColumn) {
                availableColumns.push(i);
            }
        }
        
        if (availableColumns.length === 0) return;
        
        const randomColumnIndex = Math.floor(Math.random() * availableColumns.length);
        const columnIndex = availableColumns[randomColumnIndex];
        
        // Mevcut durumu kaydet
        this.saveGameState();
        
        // Bloğu yerleştir
        this.placeBlockInColumn(columnIndex, value);
    }

    setupEventListeners() {
        // Button events
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('undo').addEventListener('click', () => this.undoMove());
        document.getElementById('retry').addEventListener('click', () => this.startNewGame());
        document.getElementById('continue').addEventListener('click', () => this.continueGame());
        document.getElementById('toggle-theme').addEventListener('click', () => this.toggleTheme());
        document.getElementById('toggle-sound').addEventListener('click', () => this.toggleSound());
        
        // Power-up events
        document.getElementById('clear-column').addEventListener('click', () => this.clearColumn());
        document.getElementById('double-value').addEventListener('click', () => this.doubleValue());
        document.getElementById('extra-move').addEventListener('click', () => this.extraMove());
    }
}
