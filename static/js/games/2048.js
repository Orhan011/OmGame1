class ModernMergePuzzle {
    constructor() {
        // Oyun değişkenleri
        this.columns = Array(5).fill().map(() => []);
        this.score = 0;
        this.highScore = localStorage.getItem('2048_high_score') || 0;
        this.isGameOver = false;
        this.moveHistory = [];
        this.isAuto = false;
        this.autoIntervalId = null;
        this.gameMode = 'normal'; // normal, time, zen
        this.timeLeft = 120; // 2 dakikalık zaman modu
        this.timerInterval = null;
        this.powerUps = {
            'column_clear': 0, // Bir sütunu temizleme
            'block_destroy': 0, // Bir bloğu yok etme
            'block_number': 0   // Bir bloğun sayısını değiştirme
        };
        this.nextBlockValue = this.getRandomBlockValue();
        this.currentTheme = localStorage.getItem('2048_theme') || 'modern';

        // İlk bloğu rastgele bir sütuna yerleştir
        this.placeNewBlock();

        // Oyun alanını oluştur
        this.initializeGameArea();
        this.updateUI();

        // Tema düğmesi
        const toggleThemeBtn = document.getElementById('toggle-theme');
        if (toggleThemeBtn) {
            toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Yeni oyun düğmesi
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.startNewGame());
        }

        // Geri al düğmesi
        const undoBtn = document.getElementById('undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoMove());
        }

        // Swipe olayları
        this.setupSwipeEvents();

        // Tuş olayları
        this.setupKeyEvents();

        // İlk olarak skoru güncelle
        this.updateScore();
    }

    // Tema değiştirme
    toggleTheme() {
        const body = document.body;
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            document.getElementById('toggle-theme').textContent = '🌙';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            document.getElementById('toggle-theme').textContent = '☀️';
        }
    }

    // Sürükleme olaylarını yakala
    setupSwipeEvents() {
        const gameContainer = document.querySelector('.columns-grid');
        if (!gameContainer) return;

        let touchStartX = 0;
        let touchStartY = 0;
        const swipeThreshold = 50;

        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        gameContainer.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Yatay swipe'lar için sayfanın kaydırılmasını engelle
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                e.preventDefault();
            }
        }, { passive: false });

        gameContainer.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    // Sağa swipe - Bir sonraki bloğu en sağdaki sütuna yerleştir
                    this.handleColumnClick(4);
                } else {
                    // Sola swipe - Bir sonraki bloğu en soldaki sütuna yerleştir
                    this.handleColumnClick(0);
                }
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
                if (deltaY > 0) {
                    // Aşağı swipe - Bir sonraki bloğu orta sütuna yerleştir
                    this.handleColumnClick(2);
                } else {
                    // Yukarı swipe - Hareket yok veya özel bir işlev
                }
            }

            touchStartX = 0;
            touchStartY = 0;
        });
    }

    // Tuş olaylarını yakala
    setupKeyEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;

            switch (e.key) {
                case '1':
                case 'End':
                    this.handleColumnClick(0);
                    break;
                case '2':
                case 'ArrowDown':
                    this.handleColumnClick(1);
                    break;
                case '3':
                case 'PageDown':
                    this.handleColumnClick(2);
                    break;
                case '4':
                case 'ArrowLeft':
                    this.handleColumnClick(3);
                    break;
                case '5':
                case 'Clear': // Numpad 5
                    this.handleColumnClick(4);
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) {
                        this.undoMove();
                    }
                    break;
            }
        });
    }

    undoMove() {
        if (this.moveHistory.length > 0) {
            const lastState = this.moveHistory.pop();
            this.columns = lastState.columns;
            this.score = lastState.score;
            this.updateUI();
            this.updateScore();
        }
    }

    initializeGameArea() {
        const columnsGrid = document.querySelector('.columns-grid');
        if (!columnsGrid) return;
        
        columnsGrid.innerHTML = '';

        // Sütunları oluştur
        for (let i = 0; i < 5; i++) {
            const column = document.createElement('div');
            column.className = 'column';
            column.setAttribute('data-index', i);
            column.addEventListener('click', () => this.handleColumnClick(i));
            columnsGrid.appendChild(column);
        }

        // Sonraki blok göstergesini güncelle
        const blockSource = document.querySelector('.block-source');
        if (blockSource) {
            // Eğer zaten bir blok varsa, kaldır
            const existingBlock = blockSource.querySelector('.next-block');
            if (existingBlock) {
                existingBlock.remove();
            }

            // Yeni blok oluştur
            const nextBlock = document.createElement('div');
            nextBlock.className = `next-block block-${this.nextBlockValue}`;
            nextBlock.textContent = this.nextBlockValue;
            blockSource.appendChild(nextBlock);
        }
    }

    getRandomBlockValue() {
        // İlk seviyelerde daha düşük sayılar çıkar, ilerleme sağlandıkça daha büyük sayılar mümkün olur
        const maxRange = Math.min(5, 2 + Math.floor(this.score / 500));
        const possibleValues = [2, 4, 8, 16, 32].slice(0, maxRange);
        
        const randomIndex = Math.floor(Math.random() * possibleValues.length);
        return possibleValues[randomIndex];
    }

    updateUI() {
        if (this.isGameOver) return;

        const columns = document.querySelectorAll('.column');
        if (!columns.length) return;

        columns.forEach((column, colIndex) => {
            // Clear column
            column.innerHTML = '';
            
            // Add blocks
            this.columns[colIndex].forEach((value) => {
                const block = document.createElement('div');
                block.className = `block block-${value}`;
                block.textContent = value;
                column.appendChild(block);
            });
        });

        // Update next block
        const nextBlockEl = document.querySelector('.next-block');
        if (nextBlockEl) {
            nextBlockEl.className = `next-block block-${this.nextBlockValue}`;
            nextBlockEl.textContent = this.nextBlockValue;
        }

        // Update score
        this.updateScore();
    }

    handleColumnClick(colIndex) {
        if (this.isGameOver) return;

        // Save current state
        this.saveGameState();

        // Check if column is full
        if (this.columns[colIndex].length >= 8) {
            // Column is full - play error sound or animation
            const column = document.querySelector(`.column[data-index="${colIndex}"]`);
            if (column) {
                column.classList.add('column-full');
                setTimeout(() => column.classList.remove('column-full'), 300);
            }
            return;
        }

        // Add block to column
        this.columns[colIndex].push(this.nextBlockValue);
        
        // Check for matches
        this.checkMatches(colIndex);

        // Prepare next block
        this.nextBlockValue = this.getRandomBlockValue();
        
        // Update UI
        this.updateUI();

        // Check game over
        if (this.isGameOver) {
            this.saveScore();
            return;
        }

        this.checkGameOver();
    }

    checkGameOver() {
        // Count full columns
        let fullColumns = 0;
        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].length >= 8) {
                fullColumns++;
            }
        }

        // If all columns are full, game over
        if (fullColumns === this.columns.length) {
            this.gameOver('full');
            this.saveScore();
        }
    }

    saveGameState() {
        // Save current state for undo
        this.moveHistory.push({
            columns: JSON.parse(JSON.stringify(this.columns)),
            score: this.score
        });

        // Only keep last 10 states
        if (this.moveHistory.length > 10) {
            this.moveHistory.shift();
        }
    }

    updateScore() {
        // Update score display
        const finalScoreEl = document.querySelector('.final-score');
        if (finalScoreEl) {
            finalScoreEl.textContent = this.score;
        }

        // Add score indicator to header
        const headerEl = document.querySelector('header');
        if (headerEl) {
            let scoreEl = headerEl.querySelector('.score-display');
            if (!scoreEl) {
                scoreEl = document.createElement('div');
                scoreEl.className = 'score-display';
                headerEl.appendChild(scoreEl);
            }
            scoreEl.innerHTML = `<span>Skor: ${this.score}</span><span>En Yüksek: ${this.highScore}</span>`;
        }
    }

    startNewGame() {
        // Save score before resetting
        if (this.score > 0) {
            this.saveScore();
        }
        
        // Reset game state
        this.columns = Array(5).fill().map(() => []);
        this.score = 0;
        this.isGameOver = false;
        this.moveHistory = [];
        this.nextBlockValue = this.getRandomBlockValue();
        
        // Hide game over/won overlays
        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach(overlay => overlay.classList.add('hidden'));
        
        // Reset and update UI
        this.initializeGameArea();
        this.updateUI();
        
        // Place first block
        this.placeNewBlock();
    }

    placeNewBlock() {
        // Place first block in middle column
        const middleColumn = Math.floor(this.columns.length / 2);
        this.columns[middleColumn].push(this.nextBlockValue);
        
        // Prepare next block
        this.nextBlockValue = this.getRandomBlockValue();
        
        // Update UI
        this.updateUI();
    }

    checkMatches(colIndex) {
        const column = this.columns[colIndex];
        if (!column || column.length < 3) return false;
        
        let matchFound = false;
        
        // Check for 3 or more consecutive same values
        for (let i = column.length - 1; i >= 2; i--) {
            if (column[i] === column[i-1] && column[i] === column[i-2]) {
                // Match found, determine streak length
                let streakLength = 3;
                for (let j = i-3; j >= 0; j--) {
                    if (column[j] === column[i]) {
                        streakLength++;
                    } else {
                        break;
                    }
                }
                
                // Get match value
                const matchValue = parseInt(column[i]);
                
                // Remove matched blocks
                column.splice(i-streakLength+1, streakLength);
                
                // Add merged block
                const newValue = matchValue * 2;
                column.push(newValue);
                
                // Add score
                const basePoints = matchValue * streakLength;
                const streakBonus = Math.pow(2, streakLength - 3);
                this.addScore(basePoints * streakBonus);
                
                // Flash animation for column
                const columnEl = document.querySelector(`.column[data-index="${colIndex}"]`);
                if (columnEl) {
                    columnEl.classList.add('column-match');
                    setTimeout(() => columnEl.classList.remove('column-match'), 300);
                }
                
                // Check for 2048 block
                if (newValue >= 2048) {
                    this.showWinScreen();
                }
                
                matchFound = true;
                
                // Recursive check (for cascade effect)
                this.checkMatches(colIndex);
                break;
            }
        }
        
        return matchFound;
    }

    addScore(points) {
        this.score += points;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('2048_high_score', this.highScore);
        }
        
        // Update score display
        this.updateScore();
    }

    showWinScreen() {
        const gameWonOverlay = document.getElementById('game-won');
        if (gameWonOverlay) {
            gameWonOverlay.classList.remove('hidden');
            
            // Continue button
            const continueBtn = document.getElementById('continue');
            if (continueBtn) {
                continueBtn.addEventListener('click', () => {
                    gameWonOverlay.classList.add('hidden');
                });
            }
        }
    }

    gameOver(reason) {
        this.isGameOver = true;
        
        // Show game over screen
        const gameOverOverlay = document.getElementById('game-over');
        if (gameOverOverlay) {
            const finalScoreEl = gameOverOverlay.querySelector('.final-score');
            if (finalScoreEl) {
                finalScoreEl.textContent = this.score;
            }
            gameOverOverlay.classList.remove('hidden');
            
            // Retry button
            const retryBtn = document.getElementById('retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.startNewGame();
                });
            }
        }
        
        // Save score
        this.saveScore();
    }

    saveScore() {
        // Check if score is valid
        if (!this.score) {
            console.log('No score to save');
            return;
        }
        
        console.log(`Sending score: ${this.score}`);
        
        // Send score to backend
        fetch('/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_type: '2048',
                score: this.score
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Score sending failed');
            }
            return response.json();
        })
        .then(data => {
            console.log('Score successfully saved:', data);
        })
        .catch(error => {
            console.error('Error saving score:', error);
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ModernMergePuzzle();
    window.game = game; // For debugging
});

// Back button functionality
document.addEventListener('DOMContentLoaded', function() {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = '/all-games';
        });
    }
});

// Add goBack function for swipe-navigation compatibility
function goBack() {
    window.location.href = '/all-games';
}
