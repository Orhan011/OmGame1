document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start-game');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const levelDisplay = document.getElementById('level');
  const patternDisplay = document.getElementById('pattern-display');
  const patternPlaceholder = document.getElementById('pattern-placeholder');
  const optionsContainer = document.getElementById('options-container');
  const messageContainer = document.getElementById('message-container');
  
  let gameActive = false;
  let score = 0;
  let level = 1;
  let timeLeft = 60;
  let timer;
  let currentPattern = [];
  let correctAnswer = null;
  let patternTypes = [
    {
      type: 'shapes',
      symbols: ['▲', '■', '●', '◆', '★', '♦', '♥', '♠', '♣', '⬟']
    },
    {
      type: 'numbers',
      symbols: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    },
    {
      type: 'letters',
      symbols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M']
    },
    {
      type: 'math',
      symbols: ['+', '-', '×', '÷', '=', '<', '>', '≠', '≤', '≥']
    }
  ];
  
  // Oyun başlama
  startButton.addEventListener('click', startGame);
  
  function startGame() {
    // Oyun zaten aktifse, resetlenecek
    if (gameActive) {
      clearInterval(timer);
      resetGame();
      return;
    }
    
    gameActive = true;
    score = 0;
    level = 1;
    timeLeft = 60;
    
    // UI güncellemeleri
    startButton.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Yeniden Başlat';
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    timerDisplay.textContent = timeLeft;
    patternPlaceholder.style.display = 'none';
    optionsContainer.classList.remove('d-none');
    messageContainer.innerHTML = '';
    
    // Geri sayım başlat
    timer = setInterval(updateTimer, 1000);
    
    // İlk deseni oluştur
    generatePattern();
  }
  
  function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    if (timeLeft <= 10) {
      timerDisplay.classList.add('text-danger');
    }
    
    if (timeLeft <= 0) {
      endGame();
    }
  }
  
  function resetGame() {
    gameActive = false;
    patternDisplay.innerHTML = '';
    patternPlaceholder.style.display = 'flex';
    optionsContainer.classList.add('d-none');
    startButton.innerHTML = '<i class="fas fa-play me-2"></i>Başlat';
    timerDisplay.classList.remove('text-danger');
    showMessage('Oyun bitti! Tekrar oynamak için başlat butonuna tıklayın.', 'info');
  }
  
  function generatePattern() {
    patternDisplay.innerHTML = '';
    
    // Seviyeye göre desen karmaşıklığını belirle
    const patternLength = Math.min(3 + Math.floor(level / 2), 7);
    
    // Rastgele bir desen türü seç
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    // Rastgele bir desen oluştur
    currentPattern = [];
    
    // Basit sayı dizileri, artan veya çarpım 
    if (patternType.type === 'numbers' && Math.random() < 0.5) {
      const start = Math.floor(Math.random() * 5) + 1;
      const step = Math.floor(Math.random() * 3) + 1;
      
      if (Math.random() < 0.7) { // Artış
        for (let i = 0; i < patternLength; i++) {
          currentPattern.push(patternType.symbols[start + i * step - 1] || patternType.symbols[0]);
        }
      } else { // Çarpım
        for (let i = 0; i < patternLength; i++) {
          const value = start * Math.pow(2, i);
          const symbol = value <= 9 ? patternType.symbols[value - 1] : patternType.symbols[9];
          currentPattern.push(symbol);
        }
      }
    } 
    // Dönüşümlü desen
    else if (Math.random() < 0.4) {
      const symbolCount = Math.min(3, Math.floor(patternLength / 2));
      const usedSymbols = [];
      
      for (let i = 0; i < symbolCount; i++) {
        let symbolIndex;
        do {
          symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        } while (usedSymbols.includes(symbolIndex));
        
        usedSymbols.push(symbolIndex);
      }
      
      for (let i = 0; i < patternLength; i++) {
        currentPattern.push(patternType.symbols[usedSymbols[i % symbolCount]]);
      }
    }
    // Tamamen rastgele desen
    else {
      for (let i = 0; i < patternLength; i++) {
        const symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        currentPattern.push(patternType.symbols[symbolIndex]);
      }
    }
    
    // Doğru cevabı belirle (desen mantığına göre)
    correctAnswer = determineNextInPattern(currentPattern);
    
    // Deseni ekrana yansıt
    const sequenceDiv = document.createElement('div');
    sequenceDiv.className = 'pattern-sequence';
    
    for (let i = 0; i < currentPattern.length; i++) {
      const item = document.createElement('div');
      item.className = 'pattern-item';
      item.textContent = currentPattern[i];
      sequenceDiv.appendChild(item);
    }
    
    // Soru işareti içeren kutu ekle
    const emptyItem = document.createElement('div');
    emptyItem.className = 'pattern-item empty';
    emptyItem.textContent = '?';
    sequenceDiv.appendChild(emptyItem);
    
    patternDisplay.appendChild(sequenceDiv);
    
    // Seçenekleri oluştur
    generateOptions(patternType.symbols, correctAnswer);
  }
  
  function determineNextInPattern(pattern) {
    // Basit örüntü tespiti
    // Tekrarlanan örüntü (A, B, A, B, ...)
    if (pattern.length >= 4 && 
        pattern[0] === pattern[2] && 
        pattern[1] === pattern[3]) {
      return pattern[pattern.length % 2];
    }
    
    // Aynı sembolün tekrarı
    if (pattern.every(item => item === pattern[0])) {
      return pattern[0];
    }
    
    // Sayı dizisi ise ve artış deseni varsa
    if (!isNaN(pattern[0]) && pattern.length >= 3) {
      const diff1 = parseInt(pattern[1]) - parseInt(pattern[0]);
      const diff2 = parseInt(pattern[2]) - parseInt(pattern[1]);
      
      if (diff1 === diff2) {
        return (parseInt(pattern[pattern.length - 1]) + diff1).toString();
      }
    }
    
    // Desen belirlenemezse son elemanı döndür veya rastgele bir eleman
    return pattern[pattern.length - 1];
  }
  
  function generateOptions(symbols, correct) {
    const optionsDiv = document.querySelector('.pattern-options');
    optionsDiv.innerHTML = '';
    
    // Doğru cevabı ve birkaç yanlış seçeneği karıştır
    const options = [correct];
    
    // Kullanılan sembolleri takip et
    const usedSymbols = new Set([correct]);
    
    // Seviyeye göre seçenek sayısı
    const optionCount = Math.min(4 + Math.floor(level / 2), 6);
    
    // Yanlış seçenekleri ekle
    while (options.length < optionCount) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      if (!usedSymbols.has(symbol)) {
        options.push(symbol);
        usedSymbols.add(symbol);
      }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenekleri ekrana ekle
    options.forEach(option => {
      const optionButton = document.createElement('div');
      optionButton.className = 'pattern-option';
      optionButton.textContent = option;
      
      optionButton.addEventListener('click', () => {
        selectOption(optionButton, option);
      });
      
      optionsDiv.appendChild(optionButton);
    });
  }
  
  function selectOption(optionElement, selectedValue) {
    // Tüm seçenekleri pasif yap
    document.querySelectorAll('.pattern-option').forEach(opt => {
      opt.style.pointerEvents = 'none';
    });
    
    // Seçilen seçeneği vurgula
    optionElement.classList.add('selected');
    
    // Boş kutuyu güncelle
    const emptyItem = document.querySelector('.pattern-item.empty');
    emptyItem.textContent = selectedValue;
    emptyItem.classList.remove('empty');
    
    // Doğru/yanlış kontrolü
    if (selectedValue === correctAnswer) {
      // Doğru
      emptyItem.classList.add('correct');
      
      // Skoru güncelle (seviyeye göre)
      const pointsEarned = 10 * level;
      score += pointsEarned;
      scoreDisplay.textContent = score;
      
      showMessage(`Doğru! +${pointsEarned} puan kazandınız.`, 'success');
      
      // Belirli aralıklarla seviye artışı
      if (score >= level * 50) {
        level++;
        levelDisplay.textContent = level;
        
        // Ek süre ekle
        timeLeft += 5;
        timerDisplay.textContent = timeLeft;
        
        showMessage(`Tebrikler! Seviye ${level}'e yükseldiniz. +5 saniye eklendi.`, 'success');
      }
    } else {
      // Yanlış
      emptyItem.classList.add('incorrect');
      showMessage(`Yanlış! Doğru cevap: ${correctAnswer}`, 'danger');
    }
    
    // Kısa beklemeden sonra yeni desen oluştur
    setTimeout(() => {
      if (gameActive) {
        generatePattern();
      }
    }, 1500);
  }
  
  function endGame() {
    clearInterval(timer);
    gameActive = false;
    
    // Final skor ve seviyeyi göster
    showMessage(`Oyun bitti! Toplam puanınız: ${score}, Ulaştığınız seviye: ${level}`, 'info');
    
    // Skoru API'ye gönder
    saveScore();
    
    setTimeout(() => {
      resetGame();
    }, 3000);
  }
  
  function saveScore() {
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'patternRecognition',
        score: score
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
  
  function showMessage(message, type) {
    messageContainer.innerHTML = `
      <div class="alert alert-${type}" role="alert">
        ${message}
      </div>
    `;
    
    // Mesajı belirli bir süre sonra gizle
    setTimeout(() => {
      if (messageContainer.querySelector('.alert')) {
        messageContainer.querySelector('.alert').style.opacity = '0';
        setTimeout(() => {
          messageContainer.innerHTML = '';
        }, 500);
      }
    }, 3000);
  }
  
  // Yardımcı fonksiyonlar
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});