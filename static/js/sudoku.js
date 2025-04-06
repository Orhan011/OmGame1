/**
 * Profesyonel Sudoku Oyunu
 * 
 * Bu dosya, profesyonel Sudoku oyunu için tüm mantık ve kullanıcı arayüzü özelliklerini içerir.
 * Özellikler:
 * - Gelişmiş Sudoku tahtası oluşturma algoritması
 * - Zorluk seviyelerine göre oyun deneyimi
 * - Notlar, ipuçları ve doğrulama sistemi
 * - Performans odaklı yapı ve animasyonlar
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elemanları
  const board = document.getElementById('sudoku-board');
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const newGameBtn = document.querySelector('.new-game');
  const hintBtn = document.querySelector('.hint');
  const notesToggle = document.getElementById('notes-toggle');
  const eraseBtn = document.getElementById('erase');
  const numpadBtns = document.querySelectorAll('.numpad-btn[data-num]');
  const timerElement = document.querySelector('.timer');
  const difficultyLabel = document.querySelector('.info-value.difficulty');
  const statusLabel = document.querySelector('.info-value.status');
  const successAlert = document.getElementById('success-alert');
  const errorAlert = document.getElementById('error-alert');
  const infoAlert = document.getElementById('info-alert');
  const pauseMenu = document.getElementById('pause-menu');
  const resumeGameBtn = document.getElementById('resume-game');
  const restartGameBtn = document.getElementById('restart-game');
  const exitGameBtn = document.getElementById('exit-game');

  // Ses Efektleri
  const sounds = {
    place: new Audio('/static/sounds/click.mp3'),
    select: new Audio('/static/sounds/number.mp3'),
    correct: new Audio('/static/sounds/correct.mp3'),
    error: new Audio('/static/sounds/wrong.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    complete: new Audio('/static/sounds/success.mp3')
  };

  // Oyun Durumu
  let gameState = {
    difficulty: 'easy',
    board: Array(9).fill().map(() => Array(9).fill(0)),
    solution: Array(9).fill().map(() => Array(9).fill(0)),
    fixed: Array(9).fill().map(() => Array(9).fill(false)),
    notes: Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false))),
    selectedCell: { row: -1, col: -1 },
    isNotesMode: false,
    timer: 0,
    timerInterval: null,
    isPaused: false,
    hintsUsed: 0,
    maxHints: 3,
    isComplete: false,
    startTime: null,
    errors: 0,
    soundEnabled: true,
    highlightSameNumbers: true,
    score: 0
  };

  /**
   * Ses Çalma - tüm ses çalma işlemleri için merkezi fonksiyon
   */
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    try {
      const sound = sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Ses çalma hatası:", e));
      }
    } catch (error) {
      console.error("Ses çalma hatası:", error);
    }
  }

  /**
   * Yeni bir oyun başlatır
   */
  function startNewGame() {
    // Oyun durumunu sıfırla
    resetGameState();

    // Zorluk seviyesine göre maksimum ipucu sayısını ayarla
    updateMaxHints();

    // Yeni bir Sudoku tahtası oluştur
    generateSudoku();

    // Sudoku tahtasını HTML'e dönüştür
    renderBoard();

    // Zamanı başlat
    startTimer();

    // Durum etiketini güncelle
    updateStatusLabel('Devam Ediyor');

    // İlk cell'i seç
    selectCell(0, 0);
    
    // Başlangıç sesi çal
    playSound('select');
    
    // Başlangıç mesajı göster
    const difficultyText = difficultyLabel.textContent;
    showAlert(`${difficultyText} zorlukta yeni oyun başlatıldı!`, 'info');
  }

  /**
   * Oyun durumunu sıfırlar
   */
  function resetGameState() {
    gameState.board = Array(9).fill().map(() => Array(9).fill(0));
    gameState.solution = Array(9).fill().map(() => Array(9).fill(0));
    gameState.fixed = Array(9).fill().map(() => Array(9).fill(false));
    gameState.notes = Array(9).fill().map(() => Array(9).fill().map(() => Array(9).fill(false)));
    gameState.selectedCell = { row: -1, col: -1 };
    gameState.isNotesMode = false;
    gameState.isPaused = false;
    gameState.isComplete = false;
    gameState.hintsUsed = 0;
    gameState.errors = 0;
    gameState.startTime = Date.now();
    gameState.score = 0;

    // Zamanı sıfırla
    clearInterval(gameState.timerInterval);
    gameState.timer = 0;
    timerElement.textContent = '00:00';

    // Notlar modunu sıfırla
    notesToggle.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
    gameState.isNotesMode = false;
    notesToggle.classList.remove('active');
  }

  /**
   * Zorluk seviyesine göre maksimum ipucu sayısını ayarlar
   */
  function updateMaxHints() {
    switch (gameState.difficulty) {
      case 'easy':
        gameState.maxHints = 5;
        break;
      case 'medium':
        gameState.maxHints = 3;
        break;
      case 'hard':
        gameState.maxHints = 2;
        break;
      default:
        gameState.maxHints = 3;
    }
  }

  /**
   * Yeni bir Sudoku tahtası oluşturur
   * Bu fonksiyon kompakt bir Sudoku çözücüsü ve oluşturucusu içerir
   */
  function generateSudoku() {
    // Boş tahta oluştur
    const emptyBoard = Array(9).fill().map(() => Array(9).fill(0));
    
    // Dolu tahta oluştur (backtracking ile)
    const solvedBoard = solveSudoku(emptyBoard);
    
    // Çözümü kaydet
    gameState.solution = solvedBoard.map(row => [...row]);
    
    // Zorluk seviyesine göre ipuçlarını kaldır
    generateClues();
  }

  /**
   * Sudoku bulmacasını çözer (backtracking algoritması)
   */
  function solveSudoku(board) {
    const result = [...board.map(row => [...row])];
    
    if (solveBoard(result)) {
      return result;
    }
    return null;
    
    // İç yardımcı fonksiyon - Rekürsif backtracking çözücü
    function solveBoard(board) {
      // Boş hücre bul
      let emptyCell = findEmptyCell(board);
      if (!emptyCell) return true; // Çözüm tamamlandı
      
      const [row, col] = emptyCell;
      
      // 1-9 sayılarını karışık sırayla dene (rastgelelik için)
      const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      for (const num of nums) {
        // Sayı bu hücreye yerleştirilebilir mi?
        if (isValidPlacement(board, row, col, num)) {
          // Sayıyı yerleştir
          board[row][col] = num;
          
          // Rekürsif olarak kalan tahtayı çözmeye çalış
          if (solveBoard(board)) {
            return true;
          }
          
          // Eğer bu sayı çözüme yol açmazsa, geri al
          board[row][col] = 0;
        }
      }
      
      return false; // Hiçbir sayı çözüme yol açmadı
    }
    
    // Boş hücre bul
    function findEmptyCell(board) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            return [row, col];
          }
        }
      }
      return null; // Boş hücre yok, tahta dolu
    }
    
    // Verilen sayının verilen konuma yerleştirilmesinin geçerli olup olmadığını kontrol et
    function isValidPlacement(board, row, col, num) {
      // Satırı kontrol et
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) {
          return false;
        }
      }
      
      // Sütunu kontrol et
      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) {
          return false;
        }
      }
      
      // 3x3 bloğu kontrol et
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (board[boxRow + r][boxCol + c] === num) {
            return false;
          }
        }
      }
      
      return true; // Yerleştirme geçerli
    }
  }

  /**
   * Diziyi karıştırır (yardımcı fonksiyon)
   */
  function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Çözümden ipuçları oluşturur (zorluk seviyesine göre)
   */
  function generateClues() {
    // Başlangıç tahtasını çözüm ile doldur
    gameState.board = gameState.solution.map(row => [...row]);
    
    // Zorluk seviyesine göre ipuçlarının sayısını ayarla
    let cluesCount = 0;
    switch (gameState.difficulty) {
      case 'easy':
        cluesCount = 36; // 81 - 36 = 45 boş hücre (daha kolay)
        break;
      case 'medium':
        cluesCount = 30; // 81 - 30 = 51 boş hücre (orta zorluk)
        break;
      case 'hard':
        cluesCount = 24; // 81 - 24 = 57 boş hücre (daha zor)
        break;
      default:
        cluesCount = 32;
    }
    
    // Tüm hücrelerin pozisyonlarını içeren diziyi oluştur
    const positions = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({ row, col });
      }
    }
    
    // Pozisyonları karıştır (rastgele seçim için)
    shuffleArray(positions);
    
    // Belirli bir sayıda ipucu bırak, geri kalanını boşalt
    for (let i = cluesCount; i < 81; i++) {
      const pos = positions[i];
      gameState.board[pos.row][pos.col] = 0;
    }
    
    // Sabit ipuçlarını işaretle
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        gameState.fixed[row][col] = gameState.board[row][col] !== 0;
      }
    }
  }

  /**
   * Sudoku tahtasını HTML'de oluşturur
   */
  function renderBoard() {
    // Önce tahtayı temizle
    board.innerHTML = '';
    
    // 9x9 hücreyi oluştur
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Kalın kenar sınırları
        if (col === 2 || col === 5) {
          cell.classList.add('border-right');
        }
        if (row === 2 || row === 5) {
          cell.classList.add('border-bottom');
        }
        
        // Sabit (ipucu) hücre ise işaretle
        if (gameState.fixed[row][col]) {
          cell.classList.add('fixed');
          cell.textContent = gameState.board[row][col];
        } else if (gameState.board[row][col] !== 0) {
          // Kullanıcının doldurduğu hücreler
          cell.textContent = gameState.board[row][col];
        } else {
          // Boş hücre - notlar için konteyner oluştur
          const notesContainer = document.createElement('div');
          notesContainer.className = 'notes-container';
          
          // 9 not için divler oluştur
          for (let num = 1; num <= 9; num++) {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.dataset.num = num;
            
            // Not görünür olmalı mı?
            if (gameState.notes[row][col][num - 1]) {
              noteElement.textContent = num;
            }
            
            notesContainer.appendChild(noteElement);
          }
          
          cell.appendChild(notesContainer);
        }
        
        // Hücreye tıklama olayı ekle
        cell.addEventListener('click', () => {
          selectCell(row, col);
        });
        
        board.appendChild(cell);
      }
    }
  }

  /**
   * Bir hücreyi seçer
   */
  function selectCell(row, col) {
    // Oyun tamamlandıysa veya duraklatıldıysa seçime izin verme
    if (gameState.isComplete || gameState.isPaused) return;
    
    // Önceki seçimi kaldır
    const prevSelected = document.querySelector('.sudoku-cell.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    
    // Aynı sayıları vurgulama sınıflarını temizle
    const highlightedCells = document.querySelectorAll('.sudoku-cell.same-number');
    highlightedCells.forEach(cell => {
      cell.classList.remove('same-number');
    });
    
    // Yeni hücreyi seç
    gameState.selectedCell = { row, col };
    
    // Görsel olarak işaretle
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.add('selected');
      
      // Eğer seçilen hücrede bir sayı varsa, aynı sayıları vurgula
      const cellValue = gameState.board[row][col];
      if (cellValue !== 0 && gameState.highlightSameNumbers) {
        highlightSameNumbers(cellValue);
      }
    }
    
    // Seçim sesi çal
    playSound('select');
  }

  /**
   * Tahta üzerindeki aynı sayıları vurgular
   */
  function highlightSameNumbers(num) {
    if (!gameState.highlightSameNumbers) return;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] === num) {
          const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
          if (cell) {
            cell.classList.add('same-number');
          }
        }
      }
    }
  }

  /**
   * Numpad'e tıklandığında sayı ekler veya not alır
   */
  function handleNumpadClick(num) {
    const { row, col } = gameState.selectedCell;
    
    // Geçerli bir hücre seçilmemişse çık
    if (row === -1 || col === -1) {
      showAlert('Lütfen önce bir hücre seçin', 'info');
      return;
    }
    
    // Oyun duraklatılmışsa veya tamamlanmışsa işlem yapma
    if (gameState.isPaused || gameState.isComplete) return;
    
    // Sabit hücreyse değiştirme
    if (gameState.fixed[row][col]) {
      showAlert('Bu hücre değiştirilemez!', 'error');
      playSound('error');
      return;
    }
    
    if (gameState.isNotesMode) {
      // Not alma modu - notu ekle/kaldır
      toggleNote(row, col, num);
      renderBoard();
      
      // Seçilen hücreyi tekrar vurgula
      selectCell(row, col);
    } else {
      // Normal mod - sayıyı ekle
      placeNumber(row, col, num);
    }
    
    // Oyun tamamlandı mı?
    checkGameCompletion();
  }

  /**
   * Bir hücreye sayı yerleştirir
   */
  function placeNumber(row, col, num) {
    // Eski değeri kaydet
    const oldValue = gameState.board[row][col];
    
    // Yeni değeri ayarla
    gameState.board[row][col] = num;
    
    // Notları temizle
    gameState.notes[row][col] = Array(9).fill(false);
    
    // Hücreyi güncelle
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      // Varsa notları temizle
      cell.innerHTML = '';
      
      // Sayıyı ekle
      cell.textContent = num;
      
      // Doğru/yanlış kontrolü
      if (gameState.solution[row][col] === num) {
        // Doğru sayı
        cell.classList.add('correct');
        cell.classList.remove('incorrect');
        
        // Doğru ses çal
        playSound('correct');
        
        // Doğru bir etki için kısa bir gecikme
        setTimeout(() => {
          cell.classList.remove('correct');
        }, 1000);
        
        // Aynı sayıları vurgula
        highlightSameNumbers(num);
      } else {
        // Yanlış sayı
        cell.classList.add('incorrect');
        gameState.errors++;
        
        // Hata sesi çal
        playSound('error');
        
        // Hata bildirimini göster
        showAlert('Hatalı hamle!', 'error');
      }
    }
    
    // Yerleştirme sesi çal
    playSound('place');
  }

  /**
   * Bir hücredeki notu ekler/kaldırır
   */
  function toggleNote(row, col, num) {
    // Hücre boş değilse notlar eklenemez
    if (gameState.board[row][col] !== 0) {
      showAlert('Notlar sadece boş hücrelere eklenebilir', 'info');
      return;
    }
    
    // Not durumunu tersine çevir
    gameState.notes[row][col][num - 1] = !gameState.notes[row][col][num - 1];
    
    // Not ekleme/kaldırma sesi çal
    playSound('place');
  }

  /**
   * Notlardan etkilenen hücreleri günceller
   * Bir sayı yerleştirildiğinde, ilgili notların otomatik olarak temizlenmesi
   */
  function updateRelatedNotes(row, col, num) {
    // Satır boyunca notları güncelle
    for (let c = 0; c < 9; c++) {
      if (c !== col && gameState.board[row][c] === 0) {
        if (gameState.notes[row][c][num - 1]) {
          gameState.notes[row][c][num - 1] = false;
        }
      }
    }
    
    // Sütun boyunca notları güncelle
    for (let r = 0; r < 9; r++) {
      if (r !== row && gameState.board[r][col] === 0) {
        if (gameState.notes[r][col][num - 1]) {
          gameState.notes[r][col][num - 1] = false;
        }
      }
    }
    
    // 3x3 blok içinde notları güncelle
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const curRow = blockRow + r;
        const curCol = blockCol + c;
        if ((curRow !== row || curCol !== col) && gameState.board[curRow][curCol] === 0) {
          if (gameState.notes[curRow][curCol][num - 1]) {
            gameState.notes[curRow][curCol][num - 1] = false;
          }
        }
      }
    }
  }

  /**
   * Oyunun tamamlanıp tamamlanmadığını kontrol eder
   */
  function checkGameCompletion() {
    // Tüm hücrelerin doğru doldurulup doldurulmadığını kontrol et
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] !== gameState.solution[row][col]) {
          return false; // Tamamlanmamış
        }
      }
    }
    
    // Oyun tamamlandı
    gameComplete();
    return true;
  }

  /**
   * Oyun tamamlandığında çağrılır
   */
  function gameComplete() {
    // Oyun durumunu güncelle
    gameState.isComplete = true;
    
    // Zamanı durdur
    clearInterval(gameState.timerInterval);
    
    // Tamamlama sesi çal
    playSound('complete');
    
    // Başarı mesajını göster
    showAlert('Tebrikler! Sudoku\'yu tamamladınız!', 'success');
    
    // Durum etiketini güncelle
    updateStatusLabel('Tamamlandı');
    
    // Skoru hesapla ve kaydet
    calculateScore();
    saveScore();
  }

  /**
   * Skoru hesaplar
   */
  function calculateScore() {
    // Oyun süresini hesapla
    const gameTime = gameState.timer;
    
    // Skor hesaplaması (süre + zorluk + ipucu kullanımı + hata sayısı)
    let score = 1000;
    
    // Zorluk bonusu
    switch (gameState.difficulty) {
      case 'easy':
        score += 100;
        break;
      case 'medium':
        score += 300;
        break;
      case 'hard':
        score += 500;
        break;
    }
    
    // Süre cezası (her saniye -0.5 puan)
    score -= Math.floor(gameTime / 2);
    
    // İpucu cezası (her ipucu -50 puan)
    score -= gameState.hintsUsed * 50;
    
    // Hata cezası (her hata -20 puan)
    score -= gameState.errors * 20;
    
    // Minimum skoru sınırla
    score = Math.max(score, 100);
    
    // Skorun negatif olmasını engelle ve tam sayıya yuvarla
    score = Math.max(Math.round(score), 0);
    
    // Oyun durumuna kaydet
    gameState.score = score;
    
    // Skor bilgisini göster
    showAlert(`Skorunuz: ${score} puan!`, 'success');
  }

  /**
   * Skoru kaydeder
   */
  function saveScore() {
    // Skoru API'ye gönder
    fetch('/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_type: 'sudoku',
        score: gameState.score
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Skor başarıyla kaydedildi.');
      } else {
        console.error('Skor kaydedilirken hata oluştu:', data.error);
      }
    })
    .catch(error => {
      console.error('Skor kaydedilirken hata oluştu:', error);
    });
  }

  /**
   * Zamanı başlatır
   */
  function startTimer() {
    // Önceki zamanlayıcıyı temizle
    clearInterval(gameState.timerInterval);
    
    // Yeni zamanlayıcı başlat
    gameState.timer = 0;
    timerElement.textContent = '00:00';
    
    gameState.timerInterval = setInterval(() => {
      // Oyun duraklatılmışsa zamanlayıcıyı çalıştırma
      if (gameState.isPaused || gameState.isComplete) return;
      
      // Süreyi artır
      gameState.timer++;
      
      // Görüntüyü güncelle
      updateTimerDisplay();
    }, 1000);
  }

  /**
   * Zamanlayıcı görüntüsünü günceller
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    
    // İki basamaklı format
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    timerElement.textContent = `${minutesStr}:${secondsStr}`;
  }

  /**
   * Durum etiketini günceller
   */
  function updateStatusLabel(status) {
    statusLabel.textContent = status;
    
    // Stil sınıflarını sıfırla
    statusLabel.classList.remove('status-completed', 'status-paused', 'status-ongoing');
    
    // Uygun sınıfı ekle
    switch (status) {
      case 'Tamamlandı':
        statusLabel.classList.add('status-completed');
        break;
      case 'Duraklatıldı':
        statusLabel.classList.add('status-paused');
        break;
      case 'Devam Ediyor':
        statusLabel.classList.add('status-ongoing');
        break;
    }
  }

  /**
   * Zorluk etiketini günceller
   */
  function updateDifficultyLabel() {
    let difficultyText = 'Kolay';
    
    switch (gameState.difficulty) {
      case 'medium':
        difficultyText = 'Orta';
        break;
      case 'hard':
        difficultyText = 'Zor';
        break;
    }
    
    difficultyLabel.textContent = difficultyText;
  }

  /**
   * İpucu verir
   */
  function giveHint() {
    // Oyun duraklatılmışsa veya tamamlanmışsa işlem yapma
    if (gameState.isPaused || gameState.isComplete) return;
    
    // İpucu hakkı kalmadıysa çık
    if (gameState.hintsUsed >= gameState.maxHints) {
      showAlert(`Maksimum ipucu sayısına ulaştınız (${gameState.maxHints})`, 'error');
      playSound('error');
      return;
    }
    
    const { row, col } = gameState.selectedCell;
    
    // Geçerli bir hücre seçilmemişse çık
    if (row === -1 || col === -1) {
      showAlert('Lütfen bir hücre seçin', 'info');
      return;
    }
    
    // Zaten doğru veya sabit bir hücreyse çık
    if (gameState.fixed[row][col] || gameState.board[row][col] === gameState.solution[row][col]) {
      showAlert('Bu hücre zaten doğru doldurulmuş', 'info');
      return;
    }
    
    // İpucu kullanım sayısını artır
    gameState.hintsUsed++;
    
    // Doğru sayıyı yerleştir
    placeNumber(row, col, gameState.solution[row][col]);
    
    // İpucu sesi çal
    playSound('hint');
    
    // İpucu mesajı göster
    showAlert(`İpucu kullanıldı (${gameState.hintsUsed}/${gameState.maxHints})`, 'info');
    
    // Oyun tamamlandı mı?
    checkGameCompletion();
  }

  /**
   * Oyunu duraklat/devam ettir
   */
  function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
      // Duraklatıldı
      pauseMenu.style.display = 'flex';
      updateStatusLabel('Duraklatıldı');
      pauseMenu.classList.add('active');
    } else {
      // Devam ediyor
      pauseMenu.style.display = 'none';
      updateStatusLabel('Devam Ediyor');
      pauseMenu.classList.remove('active');
    }
  }

  /**
   * Hücredeki sayıyı veya notları siler
   */
  function eraseCell() {
    // Oyun duraklatılmışsa veya tamamlanmışsa işlem yapma
    if (gameState.isPaused || gameState.isComplete) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Geçerli bir hücre seçilmemişse çık
    if (row === -1 || col === -1) {
      showAlert('Lütfen bir hücre seçin', 'info');
      return;
    }
    
    // Sabit hücreyse silemezsin
    if (gameState.fixed[row][col]) {
      showAlert('Sabit hücreler silinemez', 'error');
      playSound('error');
      return;
    }
    
    // Hücre zaten boşsa ve notu yoksa çık
    if (gameState.board[row][col] === 0 && !gameState.notes[row][col].some(note => note)) {
      return;
    }
    
    // Hücreyi temizle
    gameState.board[row][col] = 0;
    
    // Notları da temizle
    gameState.notes[row][col] = Array(9).fill(false);
    
    // Silme sesi çal
    playSound('place');
    
    // Tahtayı yeniden oluştur
    renderBoard();
    
    // Hücreyi yeniden seç
    selectCell(row, col);
  }

  /**
   * Notlar modunu aç/kapat
   */
  function toggleNotes() {
    // Oyun duraklatılmışsa veya tamamlanmışsa işlem yapma
    if (gameState.isPaused || gameState.isComplete) return;
    
    gameState.isNotesMode = !gameState.isNotesMode;
    
    if (gameState.isNotesMode) {
      // Not alma modu açık
      notesToggle.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Açık)';
      notesToggle.classList.add('active');
      showAlert('Not alma modu açıldı', 'info');
    } else {
      // Not alma modu kapalı
      notesToggle.innerHTML = '<i class="fas fa-pencil-alt"></i> Notlar (Kapalı)';
      notesToggle.classList.remove('active');
      showAlert('Not alma modu kapatıldı', 'info');
    }
    
    // Not değiştirme sesi çal
    playSound('select');
  }

  /**
   * Uyarı mesajı gösterir
   */
  function showAlert(message, type = 'info') {
    let alertElement;
    
    switch (type) {
      case 'success':
        alertElement = successAlert;
        break;
      case 'error':
        alertElement = errorAlert;
        break;
      default:
        alertElement = infoAlert;
    }
    
    alertElement.textContent = message;
    alertElement.classList.add('show');
    
    // Belirli bir süre sonra gizle
    setTimeout(() => {
      alertElement.classList.remove('show');
    }, 3000);
  }

  /**
   * Akıllı ipucu - gelişmiş bir ipucu algoritması
   * Çözümde ilerleme sağlayacak mantıklı bir adımı kullanıcıya gösterir
   */
  function smartHint() {
    // Temel ipucu ile aynı kontroller
    if (gameState.isPaused || gameState.isComplete) return;
    
    if (gameState.hintsUsed >= gameState.maxHints) {
      showAlert(`Maksimum ipucu sayısına ulaştınız (${gameState.maxHints})`, 'error');
      playSound('error');
      return;
    }
    
    // Tüm boş hücreleri bul
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) {
      showAlert('Tüm hücreler dolu!', 'info');
      return;
    }
    
    // Kullanıcının seçtiği hücreye öncelik ver
    const { row: selRow, col: selCol } = gameState.selectedCell;
    if (selRow !== -1 && selCol !== -1 && gameState.board[selRow][selCol] === 0) {
      // Seçili hücre boşsa, doğru değeri buraya yerleştir
      gameState.hintsUsed++;
      placeNumber(selRow, selCol, gameState.solution[selRow][selCol]);
      playSound('hint');
      showAlert(`İpucu kullanıldı (${gameState.hintsUsed}/${gameState.maxHints})`, 'info');
      checkGameCompletion();
      return;
    }
    
    // Rastgele bir boş hücre seç
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Hücreyi seç ve doğru değeri yerleştir
    selectCell(randomCell.row, randomCell.col);
    gameState.hintsUsed++;
    
    // Bir saniye sonra doğru değeri yerleştir (efekt için)
    setTimeout(() => {
      placeNumber(randomCell.row, randomCell.col, gameState.solution[randomCell.row][randomCell.col]);
      playSound('hint');
      showAlert(`İpucu kullanıldı (${gameState.hintsUsed}/${gameState.maxHints})`, 'info');
      checkGameCompletion();
    }, 500);
  }

  // Event Listeners
  
  // Numpad butonları
  numpadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.num);
      handleNumpadClick(num);
    });
  });
  
  // Zorluk seçimi
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Aktif zorluk butonunu güncelle
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Oyun durumunu güncelle
      gameState.difficulty = btn.dataset.difficulty;
      
      // Zorluk etiketini güncelle
      updateDifficultyLabel();
      
      // Yeni oyun başlat
      startNewGame();
    });
  });
  
  // Yeni oyun butonu
  newGameBtn.addEventListener('click', startNewGame);
  
  // İpucu butonu - akıllı ipucu kullan
  hintBtn.addEventListener('click', smartHint);
  
  // Notlar butonu
  notesToggle.addEventListener('click', toggleNotes);
  
  // Silme butonu
  eraseBtn.addEventListener('click', eraseCell);
  
  // Duraklat menüsü butonları
  resumeGameBtn.addEventListener('click', togglePause);
  restartGameBtn.addEventListener('click', () => {
    togglePause();
    startNewGame();
  });
  exitGameBtn.addEventListener('click', () => {
    togglePause();
    window.location.href = '/all_games';
  });
  
  // Klavye olaylarını dinle
  document.addEventListener('keydown', (e) => {
    // Oyun tamamlandıysa çık
    if (gameState.isComplete) return;
    
    // Duraklatma tuşu (Escape)
    if (e.key === 'Escape') {
      togglePause();
      return;
    }
    
    // Oyun duraklatılmışsa diğer tuşları işleme
    if (gameState.isPaused) return;
    
    // Sayı tuşları (1-9)
    if (e.key >= '1' && e.key <= '9') {
      const num = parseInt(e.key);
      handleNumpadClick(num);
      e.preventDefault();
    }
    
    // Not alma modu (N tuşu)
    if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
      e.preventDefault();
    }
    
    // Ok tuşları
    const { row, col } = gameState.selectedCell;
    if (row !== -1 && col !== -1) {
      let newRow = row;
      let newCol = col;
      
      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(8, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(8, col + 1);
          break;
      }
      
      if (newRow !== row || newCol !== col) {
        selectCell(newRow, newCol);
        e.preventDefault();
      }
    }
    
    // Silme tuşu (Delete, Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      eraseCell();
      e.preventDefault();
    }
    
    // İpucu tuşu (H)
    if (e.key === 'h' || e.key === 'H') {
      smartHint();
      e.preventDefault();
    }
  });
  
  // Oyunu başlat
  updateDifficultyLabel();
  startNewGame();
});
