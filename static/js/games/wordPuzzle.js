document.addEventListener('DOMContentLoaded', function() {
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
  
  let letters = [];
  let score = 0;
  let foundWords = [];
  let timer;
  let isGameActive = false;
  
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
    'uyumak', 'gülmek', 'ağlamak'
  ];
  
  // Dictionary to verify words
  const wordDictionary = new Set(turkishWordList);
  
  // Consonants and vowels in Turkish
  const consonants = ['b', 'c', 'ç', 'd', 'f', 'g', 'ğ', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 'ş', 't', 'v', 'y', 'z'];
  const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
  
  startBtn.addEventListener('click', startGame);
  
  function startGame() {
    // Hide start button, show game
    startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Reset game state
    score = 0;
    foundWords = [];
    isGameActive = true;
    
    // Generate letters
    generateLetters();
    
    // Update displays
    updateScoreDisplay();
    updateWordListDisplay();
    
    // Start the timer (90 seconds)
    timer = window.startTimer(90, 'timer-display', endGame);
    
    // Setup input and button
    wordInput.value = '';
    wordInput.focus();
    submitBtn.addEventListener('click', submitWord);
    
    // Setup keyboard event
    wordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        submitWord();
      }
    });
  }
  
  function generateLetters() {
    // Clear previous letters
    letterContainer.innerHTML = '';
    letters = [];
    
    // Generate 4 vowels and 6 consonants
    for (let i = 0; i < 4; i++) {
      letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
    }
    
    for (let i = 0; i < 6; i++) {
      letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
    }
    
    // Shuffle the letters
    letters = shuffleArray(letters);
    
    // Create letter tiles
    letters.forEach(letter => {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.textContent = letter;
      tile.addEventListener('click', () => {
        if (isGameActive) {
          wordInput.value += letter;
          wordInput.focus();
        }
      });
      letterContainer.appendChild(tile);
    });
  }
  
  function submitWord() {
    if (!isGameActive) return;
    
    const word = wordInput.value.trim().toLowerCase();
    
    // Validate word
    if (word.length < 3) {
      showMessage('Words must be at least 3 letters long', 'danger');
      return;
    }
    
    if (foundWords.includes(word)) {
      showMessage('You already found this word', 'warning');
      return;
    }
    
    // Check if word can be formed with available letters
    if (!canFormWord(word, [...letters])) {
      showMessage('Word cannot be formed with the available letters', 'danger');
      return;
    }
    
    // Check if word exists in dictionary
    if (!wordDictionary.has(word)) {
      showMessage('Not a valid word in our dictionary', 'danger');
      return;
    }
    
    // Valid word - add to found words and update score
    foundWords.push(word);
    // Score is word length * 10
    score += word.length * 10;
    
    // Update displays
    updateScoreDisplay();
    updateWordListDisplay();
    
    // Clear input
    wordInput.value = '';
    wordInput.focus();
    
    showMessage(`Great! +${word.length * 10} points`, 'success');
  }
  
  function canFormWord(word, availableLetters) {
    const wordLetters = word.split('');
    
    for (let letter of wordLetters) {
      const index = availableLetters.indexOf(letter);
      if (index === -1) {
        return false;
      }
      // Remove the used letter (comment this line to allow multiple uses of the same letter)
      // availableLetters.splice(index, 1);
    }
    
    return true;
  }
  
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
  }
  
  function updateWordListDisplay() {
    wordList.innerHTML = '';
    
    if (foundWords.length === 0) {
      wordList.innerHTML = '<p class="text-secondary">No words found yet.</p>';
      return;
    }
    
    foundWords.forEach(word => {
      const wordElement = document.createElement('span');
      wordElement.className = 'badge bg-success me-2 mb-2';
      wordElement.textContent = word;
      wordList.appendChild(wordElement);
    });
  }
  
  function endGame() {
    isGameActive = false;
    
    // Stop the timer
    if (timer && timer.stop) {
      timer.stop();
    }
    
    // Show game over screen
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';
    finalScoreDisplay.textContent = score;
    
    // Save score
    window.saveScore('wordPuzzle', score);
    
    // Add play again button functionality
    document.getElementById('play-again').addEventListener('click', startGame);
  }
  
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
        alertContainer.removeChild(alert);
      }, 150);
    }, 3000);
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
