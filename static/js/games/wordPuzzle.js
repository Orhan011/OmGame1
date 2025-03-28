document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const letterContainer = document.getElementById('letter-container');
  const wordInput = document.getElementById('word-input');
  const submitBtn = document.getElementById('submit-word');
  const timerDisplay = document.getElementById('timer-display');
  const scoreDisplay = document.getElementById('score-display');
  const wordList = document.getElementById('word-list');
  const startBtn = document.getElementById('start-game');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const finalScoreDisplay = document.getElementById('final-score');
  const wordsFoundCount = document.getElementById('words-found-count');
  const longestWordDisplay = document.getElementById('longest-word');
  const shuffleBtn = document.getElementById('shuffle-letters');
  const hintBtn = document.getElementById('hint-button');
  
  // Game State
  let letters = [];
  let score = 0;
  let foundWords = [];
  let possibleWords = []; // For hints
  let timer;
  let isGameActive = false;
  let hintCount = 0;
  let selectedLetters = [];
  let gameStartTime;
  
  // Constants 
  const GAME_DURATION = 90; // in seconds
  const MIN_WORD_LENGTH = 3;
  const HINT_MAX = 3;
  const HINT_PENALTY = 15; // Time penalty for using a hint
  
  // Turkish word list - basic words for demo
  const turkishWordList = [
    'kapı', 'masa', 'kalem', 'kitap', 'kedi', 'köpek', 'kuş', 'balık', 
    'ağaç', 'çiçek', 'güneş', 'ay', 'yıldız', 'deniz', 'göl', 'nehir', 
    'dağ', 'orman', 'bulut', 'yağmur', 'kar', 'rüzgar', 'ateş', 'su',
    'toprak', 'hava', 'el', 'ayak', 'kol', 'bacak', 'baş', 'göz', 'burun',
    'ağız', 'kulak', 'saç', 'diş', 'dil', 'kalp', 'akıl', 'anne', 'baba', 
    'kardeş', 'arkadaş', 'ev', 'okul', 'iş', 'araba', 'bisiklet', 'uçak', 
    'tren', 'gemi', 'otobüs', 'sokak', 'cadde', 'park', 'bahçe', 'oyun',
    'dans', 'müzik', 'resim', 'film', 'kitap', 'dergi', 'gazete', 'saat',
    'gün', 'hafta', 'ay', 'yıl', 'renk', 'sayı', 'para', 'yemek', 'içmek',
    'uyumak', 'gülmek', 'ağlamak', 'aşk', 'sevgi', 'hayat', 'dünya', 'insan',
    'doğa', 'hayvan', 'bitki', 'çocuk', 'kadın', 'erkek', 'genç', 'yaşlı',
    'büyük', 'küçük', 'uzun', 'kısa', 'güzel', 'çirkin', 'sıcak', 'soğuk',
    'hızlı', 'yavaş', 'yeni', 'eski', 'iyi', 'kötü', 'doğru', 'yanlış'
  ];
  
  // Dictionary to verify words
  const wordDictionary = new Set(turkishWordList);
  
  // Consonants and vowels in Turkish
  const consonants = ['b', 'c', 'ç', 'd', 'f', 'g', 'ğ', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 'ş', 't', 'v', 'y', 'z'];
  const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
  
  // Event Listeners
  startBtn.addEventListener('click', startGame);
  submitBtn.addEventListener('click', submitWord);
  
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', shuffleLetters);
  }
  
  if (hintBtn) {
    hintBtn.addEventListener('click', provideHint);
  }
  
  // Add pulse animation to start button for visual appeal
  if (startBtn.classList.contains('pulse-animation')) {
    startBtn.addEventListener('animationend', () => {
      startBtn.classList.remove('pulse-animation');
      setTimeout(() => {
        startBtn.classList.add('pulse-animation');
      }, 1000);
    });
  }
  
  /**
   * Main game functions
   */
  function startGame() {
    // Hide start screen, show game
    if (startScreen) startScreen.style.display = 'none';
    startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Initialize game state
    score = 0;
    foundWords = [];
    possibleWords = [];
    isGameActive = true;
    hintCount = 0;
    selectedLetters = [];
    gameStartTime = Date.now();
    
    // Generate letters and set up game
    generateLetters();
    findPossibleWords();
    
    // Update displays
    updateScoreDisplay();
    updateWordListDisplay();
    
    // Start the timer 
    timer = window.startTimer(GAME_DURATION, 'timer-display', endGame);
    
    // Setup input, button, and keyboard events
    wordInput.value = '';
    wordInput.focus();
    
    wordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        submitWord();
      }
    });
    
    // Add animations to game elements
    animateGameStart();
  }
  
  function generateLetters() {
    // Clear previous letters
    letterContainer.innerHTML = '';
    letters = [];
    
    // Generate 4 vowels and 6 consonants (ensures playable words are possible)
    for (let i = 0; i < 4; i++) {
      letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
    }
    
    for (let i = 0; i < 6; i++) {
      letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
    }
    
    // Shuffle the letters
    letters = shuffleArray(letters);
    
    // Create letter tiles with enhanced UI
    createLetterTiles();
  }
  
  function createLetterTiles() {
    letters.forEach((letter, index) => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.textContent = letter;
      tile.dataset.index = index;
      tile.dataset.letter = letter;
      
      // Add a slight random delay for staggered animation
      tile.style.animationDelay = `${index * 0.1}s`;
      
      // Add click handler with selection effect
      tile.addEventListener('click', () => {
        if (!isGameActive) return;
        
        // Add tile selection effect
        tile.classList.add('selected');
        selectedLetters.push({tile, letter});
        
        // Add letter to input
        wordInput.value += letter;
        wordInput.focus();
        
        // Play a subtle sound (optional)
        playTileSound(index % 4); // Different sounds for variety
        
        // Remove selection after a delay for visual feedback
        setTimeout(() => {
          tile.classList.remove('selected');
        }, 300);
      });
      
      letterContainer.appendChild(tile);
      
      // Add animation class for entrance effect
      setTimeout(() => {
        tile.classList.add('animated');
      }, index * 50);
    });
  }
  
  function shuffleLetters() {
    if (!isGameActive) return;
    
    // Shuffle the letters array
    letters = shuffleArray([...letters]);
    
    // Update the DOM
    const tiles = letterContainer.querySelectorAll('.letter-tile');
    
    // Apply animation to all tiles
    tiles.forEach(tile => {
      tile.classList.add('shuffle-animation');
    });
    
    // After animation completes, update the letters
    setTimeout(() => {
      tiles.forEach((tile, index) => {
        tile.textContent = letters[index];
        tile.dataset.letter = letters[index];
        tile.classList.remove('shuffle-animation');
      });
      
      // Update possible words with new letter arrangement
      findPossibleWords();
      
    }, 500); // Match this to the animation duration
    
    // Show feedback
    showMessage('Harfler karıştırıldı!', 'info');
  }
  
  function submitWord() {
    if (!isGameActive) return;
    
    const word = wordInput.value.trim().toLowerCase();
    
    // Validate word
    if (word.length < MIN_WORD_LENGTH) {
      showMessage(`Kelimeler en az ${MIN_WORD_LENGTH} harf içermelidir`, 'danger');
      shakeTiles(); // Visual feedback for error
      return;
    }
    
    if (foundWords.includes(word)) {
      showMessage('Bu kelimeyi zaten buldunuz', 'warning');
      shakeTiles(); // Visual feedback for error
      return;
    }
    
    // Check if word can be formed with available letters
    if (!canFormWord(word, [...letters])) {
      showMessage('Bu kelime verilen harflerle oluşturulamaz', 'danger');
      shakeTiles(); // Visual feedback for error
      return;
    }
    
    // Check if word exists in dictionary
    if (!wordDictionary.has(word)) {
      showMessage('Sözlüğümüzde geçerli bir kelime değil', 'danger');
      shakeTiles(); // Visual feedback for error
      return;
    }
    
    // Valid word - add to found words and update score
    foundWords.push(word);
    
    // Calculate score based on word length (longer words = more points)
    const wordScore = calculateWordScore(word);
    score += wordScore;
    
    // Update displays
    updateScoreDisplay();
    updateWordListDisplay();
    
    // Clear input and selected letters
    wordInput.value = '';
    selectedLetters.forEach(item => item.tile.classList.remove('selected'));
    selectedLetters = [];
    
    // Animate tiles for positive feedback
    highlightTilesForWord(word);
    
    // Show success message
    showMessage(`Harika! +${wordScore} puan kazandınız`, 'success');
  }
  
  function canFormWord(word, availableLetters) {
    const wordLetters = word.split('');
    
    for (let letter of wordLetters) {
      const index = availableLetters.indexOf(letter);
      if (index === -1) {
        return false;
      }
      // Allowing multiple uses of the same letter makes the game more fun
      // availableLetters.splice(index, 1);
    }
    
    return true;
  }
  
  function calculateWordScore(word) {
    // Bonus points for longer words
    const baseScore = word.length * 10;
    let bonusMultiplier = 1;
    
    if (word.length >= 6) bonusMultiplier = 1.5;
    if (word.length >= 8) bonusMultiplier = 2;
    
    return Math.floor(baseScore * bonusMultiplier);
  }
  
  function findPossibleWords() {
    possibleWords = [];
    
    // This is a simplified approach - in a real game we'd use a more sophisticated algorithm
    turkishWordList.forEach(word => {
      if (word.length >= MIN_WORD_LENGTH && canFormWord(word, [...letters])) {
        possibleWords.push(word);
      }
    });
    
    // Sort by length for hints (show shorter words first)
    possibleWords.sort((a, b) => a.length - b.length);
  }
  
  function provideHint() {
    if (!isGameActive || hintCount >= HINT_MAX) {
      showMessage(`Maksimum ipucu sayısına ulaştınız (${HINT_MAX})`, 'warning');
      return;
    }
    
    // Find a word that hasn't been discovered yet
    const availableHints = possibleWords.filter(word => !foundWords.includes(word));
    
    if (availableHints.length === 0) {
      showMessage('Tüm olası kelimeleri buldunuz!', 'success');
      return;
    }
    
    // Choose a hint from the first third of the available words (easier words)
    const hintIndex = Math.floor(Math.random() * Math.min(5, availableHints.length));
    const hint = availableHints[hintIndex];
    
    // Show hint and apply time penalty
    showMessage(`İpucu: ${hint.slice(0, 2)}...`, 'info');
    hintCount++;
    
    // Apply time penalty if timer exists
    if (timer && timer.subtractTime) {
      timer.subtractTime(HINT_PENALTY);
      showMessage(`İpucu kullandınız: ${HINT_PENALTY} saniye ceza`, 'warning');
    }
    
    // Update hint button state
    hintBtn.textContent = `İpucu (${HINT_MAX - hintCount})`;
    if (hintCount >= HINT_MAX) {
      hintBtn.classList.add('disabled');
      hintBtn.setAttribute('disabled', true);
    }
  }
  
  function updateScoreDisplay() {
    // Animate score change
    if (scoreDisplay.textContent !== score.toString()) {
      scoreDisplay.classList.add('score-updated');
      setTimeout(() => {
        scoreDisplay.classList.remove('score-updated');
      }, 500);
    }
    
    scoreDisplay.textContent = score;
  }
  
  function updateWordListDisplay() {
    wordList.innerHTML = '';
    
    if (foundWords.length === 0) {
      wordList.innerHTML = '<p class="text-secondary">Henüz kelime bulunmadı.</p>';
      return;
    }
    
    // Sort words by length for better display
    const sortedWords = [...foundWords].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      const wordElement = document.createElement('span');
      wordElement.className = 'word-tag';
      wordElement.textContent = word;
      
      // Add tooltip showing points earned for this word
      wordElement.title = `+${calculateWordScore(word)} puan`;
      
      wordList.appendChild(wordElement);
    });
  }
  
  function endGame() {
    isGameActive = false;
    
    // Stop the timer
    if (timer && timer.stop) {
      timer.stop();
    }
    
    // Calculate statistics
    const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const wordsCount = foundWords.length;
    let longestWord = foundWords.reduce((longest, word) => 
      word.length > longest.length ? word : longest, '');
      
    if (!longestWord) longestWord = '-';
    
    // Update stats display
    finalScoreDisplay.textContent = score;
    wordsFoundCount.textContent = wordsCount;
    longestWordDisplay.textContent = longestWord;
    
    // Show game over screen with animation
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    
    // Add classes for animation
    gameOverContainer.classList.add('fade-in');
    
    // Save score to leaderboard
    window.saveScore('wordPuzzle', score);
    
    // Add play again button functionality
    document.getElementById('play-again').addEventListener('click', startGame);
  }
  
  /**
   * Utility functions and animations
   */
  function showMessage(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        if (alertContainer.contains(alert)) {
          alertContainer.removeChild(alert);
        }
      }, 150);
    }, 3000);
  }
  
  function shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  
  function animateGameStart() {
    // Add entrance animations for game elements
    const elements = gameContainer.querySelectorAll('.game-header, .letter-container, .input-group, .game-footer');
    
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 100);
    });
  }
  
  function highlightTilesForWord(word) {
    const letters = word.split('');
    const tiles = letterContainer.querySelectorAll('.letter-tile');
    const tileIndices = [];
    
    // Find tiles for the word
    for (let letter of letters) {
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].textContent.toLowerCase() === letter && !tileIndices.includes(i)) {
          tileIndices.push(i);
          break;
        }
      }
    }
    
    // Highlight tiles sequentially
    tileIndices.forEach((index, i) => {
      setTimeout(() => {
        tiles[index].classList.add('match-animation');
        setTimeout(() => {
          tiles[index].classList.remove('match-animation');
        }, 500);
      }, i * 100);
    });
  }
  
  function shakeTiles() {
    // Visual feedback for errors
    letterContainer.classList.add('shake-animation');
    setTimeout(() => {
      letterContainer.classList.remove('shake-animation');
    }, 500);
  }
  
  function playTileSound(variant = 0) {
    // Optional: Add sound effects if needed
    // We'd implement this function if we want actual sounds
    // For now, it's just a placeholder
  }
  
  // Add CSS for new animations
  const style = document.createElement('style');
  style.textContent = `
    .score-updated {
      animation: pulse 0.5s ease;
    }
    
    .shake-animation {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    .match-animation {
      animation: match 0.5s ease;
    }
    
    .shuffle-animation {
      animation: shuffle 0.5s ease;
    }
    
    .fade-in {
      animation: fadeIn 0.5s ease;
    }
    
    .pulse-animation {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes match {
      0% { transform: scale(1); background-color: var(--card-bg); }
      50% { transform: scale(1.2); background-color: var(--accent-color); }
      100% { transform: scale(1); background-color: var(--card-bg); }
    }
    
    @keyframes shuffle {
      0% { transform: translateY(0) rotate(0); }
      50% { transform: translateY(-10px) rotate(5deg); }
      100% { transform: translateY(0) rotate(0); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Initialize the result card
  const resultCard = document.createElement('style');
  resultCard.textContent = `
    .result-card {
      background: rgba(33, 33, 61, 0.5);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .result-score {
      font-size: 3rem;
      font-weight: 700;
      color: var(--accent-color);
      text-align: center;
      margin-bottom: 15px;
    }
    
    .result-score small {
      font-size: 1rem;
      color: var(--secondary-text);
      display: block;
      margin-top: 5px;
    }
    
    .result-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
    }
    
    .stat-item {
      text-align: center;
      color: var(--secondary-text);
    }
    
    .stat-item i {
      color: var(--accent-color);
      margin-right: 5px;
    }
  `;
  document.head.appendChild(resultCard);
});
