/**
 * Zihin Haritası Oyunu - 1.0
 * 
 * Kullanıcının uzamsal belleğini ve bilişsel haritalama becerilerini geliştiren oyun.
 * 
 * Özellikler:
 * - Farklı zorluk seviyelerinde artan kart sayısı
 * - Mekânsal hafıza egzersizi
 * - Görsel algı ve uzamsal zeka geliştirme
 * - İlerleme ve başarı sistemi
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elementleri
  const gameContainer = document.getElementById('mindMapGame');
  const startBtn = document.getElementById('mindMapStartBtn');
  const gameMenu = document.getElementById('mindMapMenu');
  const gameplayArea = document.getElementById('mindMapGameplay');
  const difficultyBtns = document.querySelectorAll('.difficulty-option');
  const scoreDisplay = document.getElementById('mindMapScore');
  const levelDisplay = document.getElementById('mindMapLevel');
  const livesDisplay = document.getElementById('mindMapLives');
  const gridContainer = document.getElementById('gridContainer');
  const messageDisplay = document.getElementById('mindMapMessage');
  const soundToggle = document.getElementById('mindMapSoundToggle');
  
  // Oyun durumu
  let gameState = {
    grid: [],
    targetLocations: [],
    currentTargetIndex: 0,
    revealed: false,
    memorizationPhase: true,
    gridSize: 5, // Default 5x5
    level: 1,
    score: 0,
    lives: 3,
    maxLevel: 15,
    difficultyMultiplier: 1,
    soundEnabled: true,
    targetCount: 3 // Başlangıçta gösterilecek hedef sayısı
  };
  
  // Ses efektleri
  const sounds = {
    reveal: new Audio('/static/sounds/reveal.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3')
  };
  
  // Event listeners
  startBtn.addEventListener('click', startGame);
  
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      difficultyBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const difficulty = parseInt(this.dataset.difficulty, 10);
      gameState.difficultyMultiplier = difficulty;
      
      // Zorluk seviyesine göre grid boyutunu ayarla
      switch(difficulty) {
        case 1: // Kolay
          gameState.gridSize = 4;
          break;
        case 2: // Normal
          gameState.gridSize = 5;
          break;
        case 3: // Zor
          gameState.gridSize = 6;
          break;
        case 4: // Uzman
          gameState.gridSize = 7;
          break;
      }
    });
  });
  
  soundToggle.addEventListener('click', toggleSound);
  
  // Oyunu başlat
  function startGame() {
    resetGameState();
    gameMenu.classList.add('d-none');
    gameplayArea.classList.remove('d-none');
    
    updateScoreDisplay();
    updateLevelDisplay();
    updateLivesDisplay();
    
    createGrid();
    generateTargets();
    revealTargets();
  }
  
  // Oyun durumunu sıfırla
  function resetGameState() {
    gameState.grid = [];
    gameState.targetLocations = [];
    gameState.currentTargetIndex = 0;
    gameState.revealed = false;
    gameState.memorizationPhase = true;
    gameState.level = 1;
    gameState.score = 0;
    gameState.lives = 3;
    
    // Zorluk seviyesine göre hedef sayısını belirle
    gameState.targetCount = 3 + Math.floor(gameState.difficultyMultiplier / 2);
  }
  
  // Grid oluştur
  function createGrid() {
    gridContainer.innerHTML = '';
    gameState.grid = [];
    
    // CSS Grid düzenini ayarla
    gridContainer.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${gameState.gridSize}, 1fr)`;
    
    // Kareler oluştur
    for (let row = 0; row < gameState.gridSize; row++) {
      gameState.grid[row] = [];
      
      for (let col = 0; col < gameState.gridSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        cell.addEventListener('click', () => handleCellClick(row, col));
        
        gridContainer.appendChild(cell);
        gameState.grid[row][col] = {
          element: cell,
          isTarget: false
        };
      }
    }
  }
  
  // Hedef konumları oluştur
  function generateTargets() {
    gameState.targetLocations = [];
    
    // Seviyeye göre hedef sayısını ayarla
    const targetCount = gameState.targetCount + Math.floor((gameState.level - 1) / 2);
    
    // Rastgele hedefler oluştur
    while (gameState.targetLocations.length < targetCount) {
      const row = Math.floor(Math.random() * gameState.gridSize);
      const col = Math.floor(Math.random() * gameState.gridSize);
      
      // Aynı konumda hedef yoksa ekle
      if (!gameState.targetLocations.some(target => target.row === row && target.col === col)) {
        gameState.targetLocations.push({ row, col });
        gameState.grid[row][col].isTarget = true;
      }
    }
  }
  
  // Hedefleri göster
  function revealTargets() {
    gameState.revealed = true;
    showMessage("Konumları ezberleyin!", "info");
    
    // Tüm hedefleri göster
    gameState.targetLocations.forEach(target => {
      const cell = gameState.grid[target.row][target.col].element;
      cell.classList.add('target');
    });
    
    if (gameState.soundEnabled) {
      sounds.reveal.play();
    }
    
    // Belirli bir süre sonra hedefleri gizle
    const memorizeTime = 1000 + (gameState.targetLocations.length * 600) - (gameState.difficultyMultiplier * 200);
    
    setTimeout(() => {
      hideTargets();
    }, memorizeTime);
  }
  
  // Hedefleri gizle
  function hideTargets() {
    gameState.revealed = false;
    gameState.memorizationPhase = false;
    
    // Tüm hedefleri gizle
    gameState.targetLocations.forEach(target => {
      const cell = gameState.grid[target.row][target.col].element;
      cell.classList.remove('target');
    });
    
    showMessage("Şimdi hedefleri doğru sırayla tıklayın!", "info");
  }
  
  // Hücre tıklaması
  function handleCellClick(row, col) {
    // Ezberleme aşamasında ise tıklamaları yoksay
    if (gameState.memorizationPhase || gameState.revealed) {
      return;
    }
    
    const cell = gameState.grid[row][col].element;
    const targetIndex = gameState.currentTargetIndex;
    
    // Doğru hedefi seçti mi?
    if (row === gameState.targetLocations[targetIndex].row && 
        col === gameState.targetLocations[targetIndex].col) {
      // Doğru seçim
      cell.classList.add('correct');
      
      if (gameState.soundEnabled) {
        sounds.correct.play();
      }
      
      gameState.currentTargetIndex++;
      
      // Tüm hedefler bulundu mu?
      if (gameState.currentTargetIndex >= gameState.targetLocations.length) {
        // Seviye tamamlandı
        handleLevelComplete();
      }
    } else {
      // Yanlış seçim
      cell.classList.add('wrong');
      
      if (gameState.soundEnabled) {
        sounds.wrong.play();
      }
      
      gameState.lives--;
      updateLivesDisplay();
      
      // Oyun bitti mi?
      if (gameState.lives <= 0) {
        handleGameOver();
      } else {
        showMessage("Yanlış! Dikkatli ol!", "error");
        
        // Kısa süre sonra yanlış işaretini kaldır
        setTimeout(() => {
          cell.classList.remove('wrong');
        }, 800);
      }
    }
  }
  
  // Seviye tamamlandı
  function handleLevelComplete() {
    // Seviye tamamlandığında puan ver
    const basePoints = 100 * gameState.level * gameState.difficultyMultiplier;
    gameState.score += basePoints;
    updateScoreDisplay();
    
    showMessage(`Harika! +${basePoints} puan kazandınız`, "success");
    
    if (gameState.soundEnabled) {
      sounds.levelUp.play();
    }
    
    // Son seviye miydi?
    if (gameState.level >= gameState.maxLevel) {
      setTimeout(() => {
        handleGameComplete();
      }, 1500);
      return;
    }
    
    // Grid'i temizle
    clearGridClasses();
    
    // Seviyeyi artır
    gameState.level++;
    updateLevelDisplay();
    
    // Sonraki seviyeye geç
    setTimeout(() => {
      gameState.memorizationPhase = true;
      gameState.currentTargetIndex = 0;
      
      // Grid'i ve hedefleri yeniden oluştur
      createGrid();
      generateTargets();
      revealTargets();
    }, 1500);
  }
  
  // Oyun tamamlandı
  function handleGameComplete() {
    showMessage("Tebrikler! Tüm seviyeleri tamamladınız!", "success");
    
    // Puanı kaydet
    saveScore();
    
    // Oyun menüsüne dön
    setTimeout(() => {
      gameplayArea.classList.add('d-none');
      gameMenu.classList.remove('d-none');
    }, 3000);
  }
  
  // Oyun bitti
  function handleGameOver() {
    showMessage("Oyun bitti!", "error");
    
    if (gameState.soundEnabled) {
      sounds.gameOver.play();
    }
    
    // Tüm hedefleri göster
    gameState.targetLocations.forEach(target => {
      const cell = gameState.grid[target.row][target.col].element;
      cell.classList.add('target-reveal');
    });
    
    // Puanı kaydet
    saveScore();
    
    // Oyun menüsüne dön
    setTimeout(() => {
      gameplayArea.classList.add('d-none');
      gameMenu.classList.remove('d-none');
    }, 3000);
  }
  
  // Grid sınıflarını temizle
  function clearGridClasses() {
    for (let row = 0; row < gameState.gridSize; row++) {
      for (let col = 0; col < gameState.gridSize; col++) {
        const cell = gameState.grid[row][col].element;
        cell.classList.remove('target', 'correct', 'wrong', 'target-reveal');
      }
    }
  }
  
  // Puanı kaydet
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'mindMap',
        score: gameState.score
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
  
  // Mesaj göster
  function showMessage(message, type) {
    messageDisplay.textContent = message;
    messageDisplay.className = `message ${type}`;
    messageDisplay.style.display = 'block';
    
    setTimeout(() => {
      messageDisplay.style.display = 'none';
    }, 3000);
  }
  
  // Ses durumunu değiştir
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggle.innerHTML = gameState.soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
  }
  
  // UI güncellemeleri
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }
  
  function updateLevelDisplay() {
    levelDisplay.textContent = gameState.level;
  }
  
  function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
      const heartIcon = document.createElement('i');
      heartIcon.className = 'fas fa-heart';
      livesDisplay.appendChild(heartIcon);
    }
    
    for (let i = 0; i < 3 - gameState.lives; i++) {
      const emptyHeartIcon = document.createElement('i');
      emptyHeartIcon.className = 'far fa-heart';
      livesDisplay.appendChild(emptyHeartIcon);
    }
  }
  
  // İlk görünümü ayarla
  gameplayArea.classList.add('d-none');
  // Normal zorluk seviyesini varsayılan olarak seç
  difficultyBtns[1].classList.add('active');
});