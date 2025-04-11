document.addEventListener('DOMContentLoaded', () => {
  // Initialize game
  const game = new Chess();

  // Status messages
  const statusEl = document.getElementById('status');
  const fenEl = document.getElementById('fen');
  const pgnEl = document.getElementById('pgn');
  const whiteTimerEl = document.getElementById('whiteTimerDisplay');
  const blackTimerEl = document.getElementById('blackTimerDisplay');

  // Game state variables
  let aiDifficulty = 'easy';
  let userColor = 'w';
  let isAiThinking = false;
  let selectedSquare = null;
  let gameStarted = false;

  // Timer variables
  const INITIAL_TIME = 5 * 60; // 5 minutes in seconds
  let whiteTimeRemaining = INITIAL_TIME;
  let blackTimeRemaining = INITIAL_TIME;
  let activeTimer = null;
  let lastTimerUpdate = 0;
  let timerInterval = null;

  // Board configuration
  const config = {
    position: 'start',
    pieceTheme: 'https://lichess1.org/assets/piece/cburnett/{piece}.svg',
    draggable: false // Use click-based movement
  };

  // Initialize board
  const board = Chessboard('board', config);

  // Disable board interaction until game starts
  disableBoardInteraction();

  // Timer functions
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function updateTimerDisplay() {
    whiteTimerEl.textContent = formatTime(whiteTimeRemaining);
    blackTimerEl.textContent = formatTime(blackTimeRemaining);
  }

  function startTimer(color) {
    stopTimer();

    // Set active timer based on current turn
    activeTimer = color;
    lastTimerUpdate = Date.now();

    // Update timer every second
    timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaTime = Math.floor((now - lastTimerUpdate) / 1000);
      lastTimerUpdate = now;

      if (activeTimer === 'w') {
        whiteTimeRemaining = Math.max(0, whiteTimeRemaining - deltaTime);
        if (whiteTimeRemaining === 0) {
          timeUp('w');
        }
      } else {
        blackTimeRemaining = Math.max(0, blackTimeRemaining - deltaTime);
        if (blackTimeRemaining === 0) {
          timeUp('b');
        }
      }

      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimers() {
    whiteTimeRemaining = INITIAL_TIME;
    blackTimeRemaining = INITIAL_TIME;
    updateTimerDisplay();
    stopTimer();
  }

  function timeUp(color) {
    stopTimer();
    const winner = color === 'w' ? 'Siyah' : 'Beyaz';
    statusEl.textContent = `SÜRE DOLDU! ${winner} oyuncusu kazandı!`;
    endGame();
  }

  // Set AI difficulty level
  document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      aiDifficulty = e.target.value;
    });
  });

  // Button handlers
  document.getElementById('startBtn').addEventListener('click', () => {
    game.reset();
    board.position('start');
    userColor = 'w'; // Player always starts as white
    selectedSquare = null;
    removeHighlights();
    gameStarted = true;

    // Reset and start timers
    resetTimers();
    startTimer('w'); // Start white's timer

    // Enable board interaction
    enableBoardInteraction();

    // Get the current difficulty selection
    const difficultyOptions = document.querySelectorAll('input[name="difficulty"]');
    difficultyOptions.forEach(option => {
      if (option.checked) {
        aiDifficulty = option.value;
      }
    });

    // Disable difficulty selection during game
    difficultyOptions.forEach(option => {
      option.disabled = true;
    });

    statusEl.textContent = 'Oyun başladı! Sıra Beyazda';

    // Reinitialize click handlers after board reset
    initializeClickHandlers();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    // Undo both AI and player moves
    if (game.history().length >= 2) {
      game.undo();
      game.undo();
      board.position(game.fen());
      selectedSquare = null;
      removeHighlights();
      updateStatus();
    } else if (game.history().length === 1) {
      game.undo();
      board.position(game.fen());
      selectedSquare = null;
      removeHighlights();
      updateStatus();
    }
  });

  // Initialize click handlers for squares
  function initializeClickHandlers() {
    setTimeout(() => {
      const squares = document.querySelectorAll('.square-55d63');
      squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
      });
    }, 100); // Small delay to ensure board is rendered
  }

  // Handle square click
  function handleSquareClick(event) {
    // Don't allow moves if game hasn't started, is over, or AI is thinking
    if (!gameStarted || game.game_over() || isAiThinking) return;

    // Don't allow moves if it's AI's turn
    if (game.turn() !== userColor) return;

    const clickedSquare = event.target.closest('.square-55d63').getAttribute('data-square');

    // If clicking on a piece that can be moved
    const piece = game.get(clickedSquare);
    if (piece && piece.color === game.turn()) {
      // If already selected, deselect
      if (selectedSquare === clickedSquare) {
        selectedSquare = null;
        removeHighlights();
        return;
      }

      // Select the square
      selectedSquare = clickedSquare;
      removeHighlights();
      highlightSquare(clickedSquare, 'selected-square');

      // Highlight possible moves
      const moves = game.moves({ 
        square: clickedSquare, 
        verbose: true 
      });

      moves.forEach(move => {
        highlightSquare(move.to, 'highlighted-square');
      });

      return;
    }

    // If a piece is already selected and clicking on a destination
    if (selectedSquare !== null) {
      const move = makeMove(selectedSquare, clickedSquare);
      if (move) {
        selectedSquare = null;
        removeHighlights();
        updateStatus();

        // Make AI move after player's move
        if (!game.game_over()) {
          setTimeout(makeAiMove, 250);
        }
      }
    }
  }

  // Make a move if legal
  function makeMove(from, to) {
    // Check if the move is a pawn promotion
    let moveObj = {
      from: from,
      to: to
    };

    // Check if it's a pawn promotion move
    const piece = game.get(from);
    if (piece && piece.type === 'p') {
      // If pawn is moving to the last rank
      if ((piece.color === 'w' && to.charAt(1) === '8') || 
          (piece.color === 'b' && to.charAt(1) === '1')) {
        // Always promote to queen for simplicity
        moveObj.promotion = 'q';
      }
    }

    const move = game.move(moveObj);

    // If illegal move
    if (move === null) return null;

    // Update board with animation
    board.position(game.fen());

    // Switch timer on successful move
    stopTimer(); // Önce mevcut zamanlayıcıyı durdur
    
    if (move.color === 'w') {
      startTimer('b'); // Switch to black's timer
    } else {
      startTimer('w'); // Switch to white's timer
    }

    return move;
  }

  // Highlight a square with a specific class
  function highlightSquare(square, className) {
    const squareElements = document.querySelectorAll(`.square-${square}`);
    squareElements.forEach(el => {
      el.classList.add(className);
    });
  }

  // Remove all highlights
  function removeHighlights() {
    document.querySelectorAll('.highlighted-square, .selected-square').forEach(el => {
      el.classList.remove('highlighted-square', 'selected-square');
    });
  }

  // AI move function
  function makeAiMove() {
    isAiThinking = true;
    statusEl.textContent = 'Yapay Zeka düşünüyor...';

    // Her durumda siyahın zamanlayıcısının çalışmaya devam etmesini sağla
    // Önceki zamanlayıcıyı durdurma, sadece kontrol et ve gerekirse yeniden başlat
    if (!timerInterval || activeTimer !== 'b') {
      startTimer('b');
    }

    // Use setTimeout to give a visual effect of "thinking"
    setTimeout(() => {
      const move = getBestMove(game, aiDifficulty);
      game.move(move);
      board.position(game.fen());
      isAiThinking = false;

      // Switch timer only after AI makes its move
      if (!game.game_over()) {
        // Sırası beyaza geçtiği için zamanlayıcıyı değiştir
        stopTimer(); // Önce durdur
        startTimer('w'); // Sonra beyazınkini başlat
      } else {
        stopTimer(); // Stop timer if game is over
      }

      updateStatus();
    }, getDifficultyThinkTime());
  }

  // Get thinking time based on difficulty
  function getDifficultyThinkTime() {
    switch (aiDifficulty) {
      case 'easy': return 500;
      case 'medium': return 1200;
      case 'hard': return 2500; // Longer thinking time for hard mode
      default: return 1000;
    }
  }

  // Get best move for AI based on difficulty
  function getBestMove(game, difficulty) {
    const possibleMoves = game.moves();

    // If the game is over, return null
    if (possibleMoves.length === 0) return null;

    // Minimax search depth based on difficulty
    let depth = 1;
    switch (difficulty) {
      case 'easy': depth = 1; break;
      case 'medium': depth = 2; break;
      case 'hard': depth = 4; break; // Increased depth for hard mode
      default: depth = 2;
    }

    // For easy difficulty, sometimes make random moves
    if (difficulty === 'easy' && Math.random() < 0.5) {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    // For all difficulty levels, evaluate all possible moves
    const evaluatedMoves = possibleMoves.map(move => {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);

      // If it's an easy capture, boost the score
      const captureBonus = move.includes('x') ? 0.5 : 0;
      // Add bonus for check moves in hard mode
      const checkBonus = difficulty === 'hard' && gameCopy.in_check() ? 0.3 : 0;

      let score;
      if (difficulty === 'hard') {
        // For hard difficulty, use minimax algorithm with alpha-beta pruning
        score = -minimax(gameCopy, depth - 1, -Infinity, Infinity, false, userColor);
      } else {
        // For other difficulties, use simple board evaluation
        score = evaluateBoard(gameCopy);
      }

      return { 
        move, 
        score: score + captureBonus + checkBonus 
      };
    }).sort((a, b) => b.score - a.score);

    // Pick a move based on difficulty
    let moveIndex = 0;

    switch (difficulty) {
      case 'easy':
        // Choose randomly from top 70% moves
        moveIndex = Math.floor(Math.random() * Math.max(1, Math.ceil(evaluatedMoves.length * 0.7)));
        break;

      case 'medium':
        // Choose randomly from top 40% moves
        moveIndex = Math.floor(Math.random() * Math.max(1, Math.ceil(evaluatedMoves.length * 0.4)));
        break;

      case 'hard':
        // Almost always choose the best move for hard difficulty
        if (Math.random() < 0.9 || evaluatedMoves.length === 1) {
          moveIndex = 0; // Best move
        } else {
          moveIndex = Math.floor(Math.random() * Math.min(2, evaluatedMoves.length - 1)) + 1;
        }
        break;

      default:
        moveIndex = 0; // Default to best move
    }

    return evaluatedMoves[moveIndex].move;
  }

  // Minimax algorithm with alpha-beta pruning for more efficient search
  function minimax(chess, depth, alpha, beta, isMaximizingPlayer, playerColor) {
    // Base case: if we've reached the maximum depth or the game is over
    if (depth === 0 || chess.game_over()) {
      return evaluateBoard(chess);
    }

    const possibleMoves = chess.moves();

    // Move ordering for better alpha-beta pruning (checks and captures first)
    possibleMoves.sort((a, b) => {
      const aHasCapture = a.includes('x');
      const bHasCapture = b.includes('x');
      const aHasCheck = a.includes('+');
      const bHasCheck = b.includes('+');

      if (aHasCheck && !bHasCheck) return -1;
      if (bHasCheck && !aHasCheck) return 1;
      if (aHasCapture && !bHasCapture) return -1;
      if (bHasCapture && !aHasCapture) return 1;
      return 0;
    });

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of possibleMoves) {
        const gameCopy = new Chess(chess.fen());
        gameCopy.move(move);
        const evaluation = minimax(gameCopy, depth - 1, alpha, beta, false, playerColor);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of possibleMoves) {
        const gameCopy = new Chess(chess.fen());
        gameCopy.move(move);
        const evaluation = minimax(gameCopy, depth - 1, alpha, beta, true, playerColor);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  // Enhanced board evaluation function (positive is good for AI)
  function evaluateBoard(chess) {
    let totalEvaluation = 0;

    // If checkmate, return a high score
    if (chess.in_checkmate()) {
      return chess.turn() === userColor ? 9999 : -9999;
    }

    // If draw, return 0
    if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition() || chess.insufficient_material()) {
      return 0;
    }

    // Material value
    const pieceValues = {
      'p': 100,
      'n': 320,
      'b': 330,
      'r': 500,
      'q': 900,
      'k': 20000
    };

    // Piece position tables for improved evaluation (professional level)
    const pawnTable = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [15, 15, 25, 35, 35, 25, 15, 15],
      [5,  5, 15, 30, 30, 15,  5,  5],
      [0,  0,  5, 25, 25,  5,  0,  0],
      [5, -5,-10,  5,  5,-10, -5,  5],
      [5, 10, 15,-20,-20, 15, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ];

    const knightTable = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ];

    const bishopTable = [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5,  5,  5,  5,  5,-10],
      [-10,  0,  5,  0,  0,  5,  0,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ];

    const rookTable = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [0,  0,  0,  5,  5,  0,  0,  0]
    ];

    const queenTable = [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [-5,  0,  5,  5,  5,  5,  0, -5],
      [0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20]
    ];

    const kingMiddleTable = [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20, 20,  0,  0,  0,  0, 20, 20],
      [20, 30, 10,  0,  0, 10, 30, 20]
    ];

    const kingEndTable = [
      [-50,-40,-30,-20,-20,-30,-40,-50],
      [-30,-20,-10,  0,  0,-10,-20,-30],
      [-30,-10, 20, 30, 30, 20,-10,-30],
      [-30,-10, 30, 40, 40, 30,-10,-30],
      [-30,-10, 30, 40, 40, 30,-10,-30],
      [-30,-10, 20, 30, 30, 20,-10,-30],
      [-30,-30,  0,  0,  0,  0,-30,-30],
      [-50,-30,-30,-30,-30,-30,-30,-50]
    ];

    // Get board representation
    const board = chess.board();

    // Count material to determine game phase
    let materialCount = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = board[i][j];
        if (square && square.type !== 'k' && square.type !== 'p') {
          materialCount += pieceValues[square.type];
        }
      }
    }

    // Determine if we're in endgame (less than a queen and a rook worth of material)
    const isEndgame = materialCount < 1500;

    // Loop through all squares
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = board[i][j];
        if (square) {
          const isPlayerPiece = square.color === userColor;
          const pieceValue = pieceValues[square.type];

          // Add or subtract base piece values
          totalEvaluation += pieceValue * (isPlayerPiece ? -1 : 1);

          // Add position-based evaluation based on piece type
          let positionValue = 0;

          switch (square.type) {
            case 'p':
              positionValue = pawnTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              break;
            case 'n':
              positionValue = knightTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              break;
            case 'b':
              positionValue = bishopTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              break;
            case 'r':
              positionValue = rookTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              break;
            case 'q':
              positionValue = queenTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              break;
            case 'k':
              if (isEndgame) {
                positionValue = kingEndTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              } else {
                positionValue = kingMiddleTable[isPlayerPiece ? i : 7 - i][isPlayerPiece ? j : 7 - j];
              }
              break;
          }

          totalEvaluation += positionValue * (isPlayerPiece ? -1 : 1);
        }
      }
    }

    // Mobility bonus (number of legal moves)
    const turnColor = chess.turn();
    const colorMultiplier = turnColor === userColor ? -1 : 1;

    // Check and threatened pieces evaluation
    if (chess.in_check()) {
      totalEvaluation += 50 * colorMultiplier;
    }

    return totalEvaluation;
  }

  // Update the game status
  function updateStatus() {
    if (!gameStarted) {
      statusEl.textContent = 'Zorluk seviyesini seçip "YENİ OYUN" butonuna tıklayın';
      return;
    }

    let status = '';

    // Check for checkmate
    if (game.in_checkmate()) {
      const winner = game.turn() === 'w' ? 'Siyah' : 'Beyaz';
      status = `ŞAH MAT! ${winner} oyuncusu kazandı!`;
      stopTimer(); // Ensure timer stops at checkmate
      endGame();
    }
    // Check for stalemate
    else if (game.in_stalemate()) {
      status = 'AÇMAZ (PAT)! Hamle yapamayan ' + (game.turn() === 'w' ? 'Beyaz' : 'Siyah') + ' oyuncu kaybetti.';
      stopTimer();
      endGame();
    }
    // Check for draw
    else if (game.in_draw()) {
      status = 'Oyun berabere bitti! 50 hamle kuralı.';
      stopTimer();
      endGame();
    }
    // Check for threefold repetition
    else if (game.in_threefold_repetition()) {
      status = 'Üç kez tekrar! Oyun berabere bitti.';
      stopTimer();
      endGame();
    }
    // Check for insufficient material
    else if (game.insufficient_material()) {
      status = 'Yetersiz materyal! Oyun berabere bitti.';
      stopTimer();
      endGame();
    }
    // Game still in progress
    else {
      status = game.turn() === 'w' ? 'Sıra Beyazda' : 'Sıra Siyahta';

      // Check if in check
      if (game.in_check()) {
        status += ' - ŞAH ÇEKİLDİ!';
      }
    }

    // Update display elements
    statusEl.textContent = status;
    fenEl.textContent = `FEN: ${game.fen()}`;
    pgnEl.textContent = `PGN: ${game.pgn()}`;
  }

  // Initial status update
  updateStatus();

  // Ensure responsive design
  window.addEventListener('resize', board.resize);
// Define these functions in global scope
  function enableBoardInteraction() {
    const squares = document.querySelectorAll('.square-55d63');
    squares.forEach(square => {
      square.style.pointerEvents = 'auto';
    });
  }

  function disableBoardInteraction() {
    const squares = document.querySelectorAll('.square-55d63');
    squares.forEach(square => {
      square.style.pointerEvents = 'none';
    });
  }

  function endGame() {
    gameStarted = false;
    disableBoardInteraction();
    stopTimer();

    // Calculate score based on remaining time, captured pieces, and game outcome
    calculateAndSaveScore();

    // Re-enable difficulty selection for next game
    document.querySelectorAll('input[name="difficulty"]').forEach(option => {
      option.disabled = false;
    });
  }

  // Skoru hesapla ve arka planda kaydet (puan gösterim ekranı olmadan)
  function calculateAndSaveScore() {
    // Oyunun temel sonucunu belirle
    let gameResult = '';
    let score = 0;
    
    if (game.in_checkmate()) {
      // Şah mat oldu
      gameResult = game.turn() === 'w' ? 'black_win' : 'white_win';
      score = game.turn() === userColor ? 0 : 1000; // Kazanan veya kaybeden
    } else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
      // Beraberlik durumları
      gameResult = 'draw';
      score = 500; // Beraberlik için orta seviye puan
    }
    
    // Eğer oyun tamamlanmışsa skor kaydet
    if (gameResult) {
      // Oyun istatistiklerini oluştur
      const gameStats = {
        game_result: gameResult,
        move_count: game.history().length,
        difficulty: aiDifficulty,
        remaining_time: userColor === 'w' ? whiteTimeRemaining : blackTimeRemaining
      };
      
      // Skoru arka planda kaydet, kullanıcıya gösterme
      fetch('/api/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_type: 'chess',
          score: score,
          difficulty: aiDifficulty,
          playtime: INITIAL_TIME - (userColor === 'w' ? whiteTimeRemaining : blackTimeRemaining),
          game_stats: gameStats
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("Satranç skoru kaydedildi:", data);
      })
      .catch(error => {
        console.error("Satranç skoru kaydedilirken hata:", error);
      });
    }
  }
});
