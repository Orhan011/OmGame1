/**
 * 2048 Game
 * =========
 * Modern implementation of the classic 2048 game.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Game class
  class Game2048 {
    constructor() {
      // Game grid size (4x4)
      this.size = 4;
      
      // DOM elements
      this.gridContainer = document.getElementById('grid-container');
      this.tileContainer = document.getElementById('tile-container');
      this.scoreElement = document.getElementById('current-score');
      this.bestScoreElement = document.getElementById('best-score');
      this.messageContainer = document.getElementById('game-message');
      
      // Buttons
      this.newGameButton = document.getElementById('new-game-btn');
      this.undoButton = document.getElementById('undo-btn');
      this.keepGoingButton = document.getElementById('keep-going-btn');
      this.tryAgainButton = document.getElementById('try-again-btn');
      
      // Mobile control buttons
      this.controlUp = document.getElementById('control-up');
      this.controlDown = document.getElementById('control-down');
      this.controlLeft = document.getElementById('control-left');
      this.controlRight = document.getElementById('control-right');
      
      // Game state
      this.grid = [];
      this.score = 0;
      this.bestScore = localStorage.getItem('2048_bestScore') ? parseInt(localStorage.getItem('2048_bestScore')) : 0;
      this.won = false;
      this.over = false;
      this.gameHistory = [];
      
      // Set up the game
      this.setup();
    }
    
    // Set up game board and event listeners
    setup() {
      // Initialize grid
      this.createGrid();
      
      // Set up event handlers
      this.setupEventListeners();
      
      // Update the display with initial best score
      this.updateBestScore();
      
      // Start a new game
      this.newGame();
    }
    
    // Create the grid cells
    createGrid() {
      // Clear grid container
      this.gridContainer.innerHTML = '';
      
      // Create grid cells
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          const gridCell = document.createElement('div');
          gridCell.className = 'grid-cell';
          gridCell.id = `cell-${row}-${col}`;
          this.gridContainer.appendChild(gridCell);
        }
      }
    }
    
    // Set up event listeners
    setupEventListeners() {
      // Keyboard events
      document.addEventListener('keydown', (event) => {
        if (!this.over) {
          switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
              event.preventDefault();
              this.move('up');
              break;
            case 'ArrowDown':
            case 's':
            case 'S':
              event.preventDefault();
              this.move('down');
              break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
              event.preventDefault();
              this.move('left');
              break;
            case 'ArrowRight':
            case 'd':
            case 'D':
              event.preventDefault();
              this.move('right');
              break;
          }
        }
      });
      
      // Button events
      this.newGameButton.addEventListener('click', () => this.newGame());
      this.undoButton.addEventListener('click', () => this.undo());
      this.keepGoingButton.addEventListener('click', () => this.keepGoing());
      this.tryAgainButton.addEventListener('click', () => this.newGame());
      
      // Mobile control buttons
      this.controlUp.addEventListener('click', () => this.move('up'));
      this.controlDown.addEventListener('click', () => this.move('down'));
      this.controlLeft.addEventListener('click', () => this.move('left'));
      this.controlRight.addEventListener('click', () => this.move('right'));
      
      // Touch events for swiping
      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;
      let touchEndY = 0;
      
      const gameContainer = document.getElementById('game-board-container');
      
      gameContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });
      
      gameContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        this.handleSwipe();
      });
      
      // Handle swipe direction
      this.handleSwipe = () => {
        const xDiff = touchStartX - touchEndX;
        const yDiff = touchStartY - touchEndY;
        
        // Determine the direction of the swipe
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
          // Horizontal swipe
          if (xDiff > 10) {
            this.move('left');
          } else if (xDiff < -10) {
            this.move('right');
          }
        } else {
          // Vertical swipe
          if (yDiff > 10) {
            this.move('up');
          } else if (yDiff < -10) {
            this.move('down');
          }
        }
      };
    }
    
    // Start a new game
    newGame() {
      // Reset game state
      this.grid = this.createEmptyGrid();
      this.score = 0;
      this.won = false;
      this.over = false;
      this.gameHistory = [];
      
      // Clear the board
      this.tileContainer.innerHTML = '';
      
      // Hide any messages
      this.messageContainer.classList.add('hidden');
      this.messageContainer.classList.remove('game-won', 'game-over');
      
      // Add initial tiles
      this.addRandomTile();
      this.addRandomTile();
      
      // Update the UI
      this.updateScore();
      
      // Save current state to history
      this.saveHistory();
    }
    
    // Create an empty grid
    createEmptyGrid() {
      const grid = [];
      
      for (let row = 0; row < this.size; row++) {
        grid[row] = [];
        for (let col = 0; col < this.size; col++) {
          grid[row][col] = 0;
        }
      }
      
      return grid;
    }
    
    // Add a random tile to the grid
    addRandomTile() {
      if (this.availableCells().length > 0) {
        // Get a random empty cell
        const cell = this.randomAvailableCell();
        
        // Set the value (90% chance for 2, 10% chance for 4)
        const value = Math.random() < 0.9 ? 2 : 4;
        
        // Update grid
        this.grid[cell.row][cell.col] = value;
        
        // Create and add the tile to the UI
        this.addTile({ row: cell.row, col: cell.col, value: value });
      }
    }
    
    // Get all empty cells
    availableCells() {
      const cells = [];
      
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.grid[row][col] === 0) {
            cells.push({ row: row, col: col });
          }
        }
      }
      
      return cells;
    }
    
    // Get a random empty cell
    randomAvailableCell() {
      const cells = this.availableCells();
      
      if (cells.length > 0) {
        return cells[Math.floor(Math.random() * cells.length)];
      }
      
      return null;
    }
    
    // Add a tile to the UI
    addTile(tile) {
      const tileElement = document.createElement('div');
      
      // Set class and position
      tileElement.className = `tile tile-${tile.value} new`;
      tileElement.textContent = tile.value;
      tileElement.id = `tile-${tile.row}-${tile.col}`;
      
      // Position the tile
      const position = this.calculateTilePosition(tile);
      tileElement.style.top = `${position.top}px`;
      tileElement.style.left = `${position.left}px`;
      
      // Add to DOM
      this.tileContainer.appendChild(tileElement);
    }
    
    // Calculate the position of a tile
    calculateTilePosition(tile) {
      const cellSize = 100 / this.size;
      const gap = 10;
      
      // Calculate position in percentage
      const left = tile.col * cellSize;
      const top = tile.row * cellSize;
      
      // Convert to pixels based on container size
      const containerWidth = this.tileContainer.offsetWidth;
      const containerHeight = this.tileContainer.offsetHeight;
      
      return {
        left: (left * containerWidth) / 100,
        top: (top * containerHeight) / 100
      };
    }
    
    // Update the score display
    updateScore() {
      this.scoreElement.textContent = this.score;
      
      // Update best score if necessary
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('2048_bestScore', this.bestScore);
        this.updateBestScore();
      }
    }
    
    // Update the best score display
    updateBestScore() {
      this.bestScoreElement.textContent = this.bestScore;
    }
    
    // Move tiles in the specified direction
    move(direction) {
      // Don't do anything if the game is over
      if (this.over) return;
      
      // Save current state for undo
      this.saveHistory();
      
      let moved = false;
      
      // Process the grid based on direction
      switch (direction) {
        case 'up':
          moved = this.moveUp();
          break;
        case 'down':
          moved = this.moveDown();
          break;
        case 'left':
          moved = this.moveLeft();
          break;
        case 'right':
          moved = this.moveRight();
          break;
      }
      
      // Only add a new tile if a move was made
      if (moved) {
        this.updateScore();
        
        // Wait for animations to finish before adding a new tile
        setTimeout(() => {
          this.addRandomTile();
          
          // Check if the game is over
          if (!this.movesAvailable()) {
            this.over = true;
            this.showMessage('game-over', 'Oyun Bitti!');
            this.saveScoreToServer();
          }
        }, 150);
      }
    }
    
    // Move tiles up
    moveUp() {
      return this.moveTiles({
        rowStart: 1,
        rowEnd: this.size,
        rowStep: 1,
        colStart: 0,
        colEnd: this.size,
        colStep: 1,
        direction: 'up'
      });
    }
    
    // Move tiles down
    moveDown() {
      return this.moveTiles({
        rowStart: this.size - 2,
        rowEnd: -1,
        rowStep: -1,
        colStart: 0,
        colEnd: this.size,
        colStep: 1,
        direction: 'down'
      });
    }
    
    // Move tiles left
    moveLeft() {
      return this.moveTiles({
        rowStart: 0,
        rowEnd: this.size,
        rowStep: 1,
        colStart: 1,
        colEnd: this.size,
        colStep: 1,
        direction: 'left'
      });
    }
    
    // Move tiles right
    moveRight() {
      return this.moveTiles({
        rowStart: 0,
        rowEnd: this.size,
        rowStep: 1,
        colStart: this.size - 2,
        colEnd: -1,
        colStep: -1,
        direction: 'right'
      });
    }
    
    // Generic function to move tiles in any direction
    moveTiles(params) {
      let moved = false;
      
      // Clone the current grid to check for changes
      const previousGrid = JSON.parse(JSON.stringify(this.grid));
      
      // Create a new grid to track merges
      const mergedTiles = this.createEmptyGrid();
      
      // Process each tile
      for (let col = params.colStart; col !== params.colEnd; col += params.colStep) {
        for (let row = params.rowStart; row !== params.rowEnd; row += params.rowStep) {
          // Skip empty cells
          if (this.grid[row][col] === 0) continue;
          
          // Find the farthest position
          const farthest = this.findFarthestPosition(row, col, params.direction);
          const next = this.getNextTilePosition(farthest.row, farthest.col, params.direction);
          
          // Check if we can merge with the next tile
          if (next && 
              this.grid[next.row][next.col] === this.grid[row][col] && 
              !mergedTiles[next.row][next.col]) {
            // Merge the tiles
            const mergedValue = this.grid[row][col] * 2;
            this.grid[next.row][next.col] = mergedValue;
            this.grid[row][col] = 0;
            
            // Mark as merged to prevent double merges
            mergedTiles[next.row][next.col] = 1;
            
            // Update score
            this.score += mergedValue;
            
            // Move the tile in the UI
            this.moveTileInUI(row, col, next.row, next.col, true);
            
            // Check if we've won (reached 2048)
            if (mergedValue === 2048 && !this.won) {
              this.won = true;
              this.showMessage('game-won', 'Tebrikler, Kazandınız!');
              this.saveScoreToServer();
            }
            
            moved = true;
          } else if (farthest.row !== row || farthest.col !== col) {
            // Move to the farthest position
            this.grid[farthest.row][farthest.col] = this.grid[row][col];
            this.grid[row][col] = 0;
            
            // Move the tile in the UI
            this.moveTileInUI(row, col, farthest.row, farthest.col, false);
            
            moved = true;
          }
        }
      }
      
      return moved;
    }
    
    // Find the farthest position a tile can move in a given direction
    findFarthestPosition(row, col, direction) {
      let farthestRow = row;
      let farthestCol = col;
      let next;
      
      // Iterate until we hit an obstacle
      do {
        // Save current position
        row = farthestRow;
        col = farthestCol;
        
        // Get next position
        next = this.getNextPosition(row, col, direction);
        
        // Update farthest position if valid and empty
        if (next && this.grid[next.row][next.col] === 0) {
          farthestRow = next.row;
          farthestCol = next.col;
        }
      } while (next && this.grid[next.row][next.col] === 0);
      
      return { row: farthestRow, col: farthestCol };
    }
    
    // Get the next position in a given direction
    getNextPosition(row, col, direction) {
      const positions = {
        'up': { row: row - 1, col: col },
        'down': { row: row + 1, col: col },
        'left': { row: row, col: col - 1 },
        'right': { row: row, col: col + 1 }
      };
      
      const next = positions[direction];
      
      // Check if the next position is within bounds
      if (next.row >= 0 && next.row < this.size && 
          next.col >= 0 && next.col < this.size) {
        return next;
      }
      
      return null;
    }
    
    // Get the position of the next tile in a given direction
    getNextTilePosition(row, col, direction) {
      let next = this.getNextPosition(row, col, direction);
      
      // Keep moving until we find a tile or reach the edge
      while (next && this.grid[next.row][next.col] === 0) {
        row = next.row;
        col = next.col;
        next = this.getNextPosition(row, col, direction);
      }
      
      return next;
    }
    
    // Move a tile in the UI
    moveTileInUI(fromRow, fromCol, toRow, toCol, merged) {
      const fromId = `tile-${fromRow}-${fromCol}`;
      const tileElement = document.getElementById(fromId);
      
      if (!tileElement) return;
      
      // Update the tile's ID and position
      tileElement.id = `tile-${toRow}-${toCol}`;
      
      // Calculate the new position
      const position = this.calculateTilePosition({ row: toRow, col: toCol });
      tileElement.style.top = `${position.top}px`;
      tileElement.style.left = `${position.left}px`;
      
      // Handle merging
      if (merged) {
        tileElement.classList.add('merged');
        
        // Update the tile's value
        const newValue = this.grid[toRow][toCol];
        setTimeout(() => {
          tileElement.className = `tile tile-${newValue}`;
          tileElement.textContent = newValue;
        }, 100);
      }
    }
    
    // Check if there are any valid moves left
    movesAvailable() {
      // Check if there are empty cells
      if (this.availableCells().length > 0) {
        return true;
      }
      
      // Check if there are any possible merges
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          const value = this.grid[row][col];
          
          // Check adjacent cells
          const directions = ['up', 'down', 'left', 'right'];
          
          for (const direction of directions) {
            const next = this.getNextPosition(row, col, direction);
            
            if (next && this.grid[next.row][next.col] === value) {
              return true;
            }
          }
        }
      }
      
      // No moves available
      return false;
    }
    
    // Save the current game state to history
    saveHistory() {
      this.gameHistory.push({
        grid: JSON.parse(JSON.stringify(this.grid)),
        score: this.score
      });
      
      // Limit history size
      if (this.gameHistory.length > 20) {
        this.gameHistory.shift();
      }
    }
    
    // Undo the last move
    undo() {
      if (this.gameHistory.length > 1) {
        // Remove the current state
        this.gameHistory.pop();
        
        // Get the previous state
        const previousState = this.gameHistory[this.gameHistory.length - 1];
        
        // Restore the grid and score
        this.grid = JSON.parse(JSON.stringify(previousState.grid));
        this.score = previousState.score;
        
        // Update the UI
        this.updateScore();
        this.renderGrid();
        
        // If the game was over or won, it's not anymore
        if (this.over || this.won) {
          this.over = false;
          this.won = false;
          this.messageContainer.classList.add('hidden');
        }
      }
    }
    
    // Render the entire grid
    renderGrid() {
      // Clear the tile container
      this.tileContainer.innerHTML = '';
      
      // Add tiles for all non-zero values
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.grid[row][col] !== 0) {
            this.addTile({
              row: row,
              col: col,
              value: this.grid[row][col]
            });
          }
        }
      }
    }
    
    // Show a message (game over or won)
    showMessage(type, message) {
      // Set the message text
      this.messageContainer.querySelector('p').textContent = message;
      
      // Show the message
      this.messageContainer.classList.remove('hidden');
      this.messageContainer.classList.add(type);
    }
    
    // Continue playing after winning
    keepGoing() {
      this.messageContainer.classList.add('hidden');
    }
    
    // Save the score to the server
    saveScoreToServer() {
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_type: '2048',
          score: this.score
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Score saved:', data);
      })
      .catch(error => {
        console.error('Error saving score:', error);
      });
    }
  }
  
  // Initialize the game
  const game = new Game2048();
});