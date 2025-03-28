document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start-game');
  const scoreDisplay = document.getElementById('score');
  const timerDisplay = document.getElementById('timer');
  const levelDisplay = document.getElementById('level');
  const patternDisplay = document.getElementById('pattern-display');
  const patternPlaceholder = document.getElementById('pattern-placeholder');
  const optionsContainer = document.getElementById('options-container');
  const messageContainer = document.getElementById('message-container');
  
  // Oyun durum değişkenleri
  let gameActive = false;
  let score = 0;
  let level = 1;
  let timeLeft = 60;
  let timer;
  let currentPattern = [];
  let correctAnswer = null;
  let consecutiveCorrect = 0;
  let combo = 1;
  let difficulty = 1; // 1-3 arası zorluk seviyesi
  let currentPatternType = null;
  
  // Desen türleri ve semboller
  const patternTypes = [
    {
      type: 'shapes',
      symbols: ['▲', '■', '●', '◆', '★', '♦', '♥', '♠', '♣', '⬟', '◐', '◧', '◩', '◪', '◫']
    },
    {
      type: 'numbers',
      symbols: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    },
    {
      type: 'letters',
      symbols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'N', 'P', 'R', 'S', 'T']
    },
    {
      type: 'math',
      symbols: ['+', '-', '×', '÷', '=', '<', '>', '≠', '≤', '≥', '∑', '∏', '∆', '∞', '∂']
    },
    {
      type: 'colors',
      symbols: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪']
    },
    {
      type: 'mixed',
      symbols: ['▲', '7', 'K', '÷', '🔵', '♥', '0', 'P', '≥', '🟡', '◆', '3', 'E', '+', '🟣']
    }
  ];
  
  // Ses efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    tick: new Audio('/static/sounds/tick.mp3')
  };
  
  // Oyun başlama ve durdurma
  startButton.addEventListener('click', startGame);
  
  // Oyunu başlat
  function startGame() {
    // Oyun zaten aktifse, sıfırlayacak
    if (gameActive) {
      clearInterval(timer);
      resetGame();
      return;
    }
    
    // Animasyon ekle
    startButton.classList.add('button-pulse');
    
    // Değişkenleri sıfırla
    gameActive = true;
    score = 0;
    level = 1;
    timeLeft = 90; // Daha uzun süre ver
    consecutiveCorrect = 0;
    combo = 1;
    difficulty = 1;
    
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
    setTimeout(() => {
      startButton.classList.remove('button-pulse');
      generatePattern();
    }, 300);
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    // Son 15 saniye için özel stil
    if (timeLeft <= 15) {
      if (!timerDisplay.classList.contains('pulse-animation')) {
        timerDisplay.classList.add('pulse-animation');
      }
      
      if (timeLeft <= 10) {
        timerDisplay.classList.add('text-danger');
        
        // Ses efekti çal (her saniye için)
        try {
          sounds.tick.currentTime = 0;
          sounds.tick.play().catch(e => console.log("Ses çalınamadı:", e));
        } catch (e) {}
      }
    }
    
    // Zaman doldu
    if (timeLeft <= 0) {
      endGame();
    }
  }
  
  // Oyunu sıfırla
  function resetGame() {
    gameActive = false;
    patternDisplay.innerHTML = '';
    patternPlaceholder.style.display = 'flex';
    optionsContainer.classList.add('d-none');
    startButton.innerHTML = '<i class="fas fa-play me-2"></i>Başlat';
    timerDisplay.classList.remove('text-danger', 'pulse-animation');
    showMessage('Oyun bitti! Tekrar oynamak için başlat butonuna tıklayın.', 'info');
  }
  
  // Desen oluştur
  function generatePattern() {
    patternDisplay.innerHTML = '';
    
    // Seviye ve zorluğa göre desen uzunluğunu belirle
    const baseLength = Math.min(3 + Math.floor(level / 3), 8);
    const patternLength = baseLength + Math.floor(difficulty / 2);
    
    // Bir desen türü seç (seviye arttıkça mixed gelme olasılığı artar)
    const typeIndex = level > 5 && Math.random() < 0.3 ? 5 : Math.floor(Math.random() * 5);
    const patternType = patternTypes[typeIndex];
    currentPatternType = patternType.type;
    
    // Rastgele bir desen oluştur
    currentPattern = [];
    
    // Seviye ve zorluğa bağlı olarak desen türü seç
    const patternStyleRandom = Math.random();
    
    // Fibonacci dizisi (daha zor)
    if (level > 3 && difficulty > 1 && patternStyleRandom < 0.2) {
      const start1 = Math.floor(Math.random() * 3) + 1;
      const start2 = Math.floor(Math.random() * 3) + 1;
      let a = start1;
      let b = start2;
      
      for (let i = 0; i < patternLength; i++) {
        if (i === 0) {
          currentPattern.push(getSymbolForValue(patternType, a));
        } else if (i === 1) {
          currentPattern.push(getSymbolForValue(patternType, b));
        } else {
          const next = (a + b) % patternType.symbols.length;
          currentPattern.push(getSymbolForValue(patternType, next));
          a = b;
          b = next;
        }
      }
    }
    // Artan/azalan diziler
    else if (patternType.type === 'numbers' && patternStyleRandom < 0.4) {
      const start = Math.floor(Math.random() * 5) + 1;
      const step = Math.floor(Math.random() * 3) + 1;
      const isDecreasing = level > 3 && Math.random() < 0.4;
      
      for (let i = 0; i < patternLength; i++) {
        const value = isDecreasing 
          ? (start - i * step + 10) % 10  // Azalan, negatif olmasın diye 10 ekle ve mod al
          : (start + i * step) % 10;      // Artan, 10'dan büyük olmasın diye mod al
        currentPattern.push(patternType.symbols[value]);
      }
    }
    // Dönüşümlü desen
    else if (patternStyleRandom < 0.7) {
      // Seviye ve zorluğa göre desen karmaşıklığı
      const symbolCount = Math.min(Math.max(2, Math.floor(level / 2)), 4);
      const usedSymbols = [];
      
      // Sembolleri seç
      for (let i = 0; i < symbolCount; i++) {
        let symbolIndex;
        do {
          symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        } while (usedSymbols.includes(symbolIndex));
        
        usedSymbols.push(symbolIndex);
      }
      
      // Desen oluştur
      for (let i = 0; i < patternLength; i++) {
        // Daha karmaşık desenlerde aralarda atlamalar olabilir
        const useAltPattern = level > 5 && Math.random() < 0.3;
        const index = useAltPattern 
          ? usedSymbols[(i + Math.floor(i/2)) % usedSymbols.length]  
          : usedSymbols[i % usedSymbols.length];
          
        currentPattern.push(patternType.symbols[index]);
      }
    }
    // Aynalama deseni (seviye 4 ve üzeri)
    else if (level >= 4 && patternStyleRandom < 0.85) {
      const halfLength = Math.floor(patternLength / 2);
      
      // İlk yarısını oluştur
      for (let i = 0; i < halfLength; i++) {
        const symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        currentPattern.push(patternType.symbols[symbolIndex]);
      }
      
      // İkinci yarı: ya aynısı ya tersi
      const isReverse = Math.random() < 0.5;
      
      if (isReverse) {
        // Tersi
        for (let i = halfLength - 1; i >= 0; i--) {
          currentPattern.push(currentPattern[i]);
        }
      } else {
        // Aynısı
        for (let i = 0; i < halfLength; i++) {
          currentPattern.push(currentPattern[i]);
        }
      }
      
      // Tek sayı uzunluğunda ise ortaya ekstra bir sembol
      if (patternLength % 2 !== 0 && currentPattern.length < patternLength) {
        const symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        currentPattern.splice(halfLength, 0, patternType.symbols[symbolIndex]);
      }
    }
    // Tamamen rastgele desen (en zor)
    else {
      for (let i = 0; i < patternLength; i++) {
        const symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
        currentPattern.push(patternType.symbols[symbolIndex]);
      }
    }
    
    // Desen uzunluğunu kısıtla (çok uzunsa)
    if (currentPattern.length > patternLength) {
      currentPattern = currentPattern.slice(0, patternLength);
    }
    
    // Deseni tamamla (eksikse)
    while (currentPattern.length < patternLength) {
      const symbolIndex = Math.floor(Math.random() * patternType.symbols.length);
      currentPattern.push(patternType.symbols[symbolIndex]);
    }
    
    // Doğru cevabı belirle (desen mantığına göre)
    correctAnswer = determineNextInPattern(currentPattern, patternType);
    
    // Animasyonlu şekilde deseni ekrana yansıt
    const sequenceDiv = document.createElement('div');
    sequenceDiv.className = 'pattern-sequence';
    
    // Her sembol için bir kutu oluştur
    currentPattern.forEach((symbol, index) => {
      const item = document.createElement('div');
      item.className = 'pattern-item';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';
      item.textContent = symbol;
      
      // Animasyonla görünür yap
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
      }, index * 100);
      
      sequenceDiv.appendChild(item);
    });
    
    // Soru işareti içeren kutu ekle
    const emptyItem = document.createElement('div');
    emptyItem.className = 'pattern-item empty';
    emptyItem.textContent = '?';
    emptyItem.style.opacity = '0';
    emptyItem.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      emptyItem.style.opacity = '1';
      emptyItem.style.transform = 'scale(1)';
      emptyItem.classList.add('pulse-animation');
    }, currentPattern.length * 100);
    
    sequenceDiv.appendChild(emptyItem);
    patternDisplay.appendChild(sequenceDiv);
    
    // Seçenekleri oluştur
    generateOptions(patternType.symbols, correctAnswer);
  }
  
  // Sayısal değere karşılık gelen sembolü döndür
  function getSymbolForValue(patternType, value) {
    // Sayı sembol tablosu için direkt sayıyı al
    if (patternType.type === 'numbers') {
      return patternType.symbols[value % 10];
    }
    // Diğer sembol tabloları için indeks kullan
    return patternType.symbols[value % patternType.symbols.length];
  }
  
  // Desen analizi ve bir sonraki elemanı tahmin etme
  function determineNextInPattern(pattern, patternType) {
    // Çok kısa desenler için
    if (pattern.length <= 2) {
      return pattern[pattern.length - 1];
    }
    
    // Tekrarlayan örüntü kontrolü: A, B, A, B, ...
    if (pattern.length >= 4) {
      let isAlternating = true;
      for (let i = 0; i < pattern.length - 2; i++) {
        if (pattern[i] !== pattern[i + 2]) {
          isAlternating = false;
          break;
        }
      }
      if (isAlternating) {
        return pattern[pattern.length % 2];
      }
    }
    
    // Aynalama deseni kontrolü
    const halfLength = Math.floor(pattern.length / 2);
    if (pattern.length >= 5) {
      let isReverse = true;
      for (let i = 0; i < halfLength - 1; i++) {
        if (pattern[halfLength + 1 + i] !== pattern[halfLength - 1 - i]) {
          isReverse = false;
          break;
        }
      }
      if (isReverse) {
        return pattern[0]; // Örüntü devam ediyor, ilk eleman gelecek
      }
      
      // Direkt tekrar kontrolü
      let isRepeat = true;
      for (let i = 0; i < halfLength; i++) {
        if (pattern[i] !== pattern[i + halfLength]) {
          isRepeat = false;
          break;
        }
      }
      if (isRepeat) {
        return pattern[pattern.length % halfLength]; // Örüntü devam ediyor
      }
    }
    
    // Sayı dizisi analizleri
    if (patternType.type === 'numbers') {
      const nums = pattern.map(p => parseInt(p));
      
      // Sabit artış/azalış kontrolü
      if (nums.length >= 3) {
        const diffs = [];
        for (let i = 1; i < nums.length; i++) {
          diffs.push(nums[i] - nums[i-1]);
        }
        
        const allSameDiff = diffs.every(d => d === diffs[0]);
        if (allSameDiff) {
          const nextNum = (nums[nums.length-1] + diffs[0]) % 10;
          return nextNum.toString();
        }
        
        // Fibonacci kontrolü (her sayı önceki ikisinin toplamı)
        let isFibonacci = true;
        for (let i = 2; i < nums.length; i++) {
          if ((nums[i-2] + nums[i-1]) % 10 !== nums[i]) {
            isFibonacci = false;
            break;
          }
        }
        if (isFibonacci) {
          const nextNum = (nums[nums.length-2] + nums[nums.length-1]) % 10;
          return nextNum.toString();
        }
      }
    }
    
    // Basit frekans analizi - en çok tekrar eden eleman
    const frequencyMap = {};
    let maxFreq = 0;
    let mostFrequent = pattern[0];
    
    pattern.forEach(item => {
      frequencyMap[item] = (frequencyMap[item] || 0) + 1;
      if (frequencyMap[item] > maxFreq) {
        maxFreq = frequencyMap[item];
        mostFrequent = item;
      }
    });
    
    // Sadece bir kez geçenler içinden rastgele seçim (yüksek zorluk)
    if (difficulty > 2 && Math.random() < 0.3) {
      const rareSymbols = Object.keys(frequencyMap).filter(key => frequencyMap[key] === 1);
      if (rareSymbols.length > 0) {
        return rareSymbols[Math.floor(Math.random() * rareSymbols.length)];
      }
    }
    
    // Pozisyon bazlı tahmin: desenin ilk elemanı
    if (Math.random() < 0.25) {
      return pattern[0];
    }
    
    // Default: Son elemanı döndür
    return pattern[pattern.length - 1];
  }
  
  // Seçenekleri oluştur
  function generateOptions(symbols, correct) {
    const optionsDiv = document.querySelector('.pattern-options');
    optionsDiv.innerHTML = '';
    
    // Doğru cevabı ve birkaç yanlış seçeneği karıştır
    const options = [correct];
    
    // Kullanılan sembolleri takip et
    const usedSymbols = new Set([correct]);
    
    // Seviye ve zorluğa göre seçenek sayısı
    const baseOptionCount = 4;
    const levelBonus = Math.floor(level / 3);
    const difficultyBonus = difficulty - 1;
    const optionCount = Math.min(baseOptionCount + levelBonus + difficultyBonus, 8);
    
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
    
    // Seçenekleri görsel efektlerle ekrana ekle
    options.forEach((option, index) => {
      const optionButton = document.createElement('div');
      optionButton.className = 'pattern-option';
      optionButton.textContent = option;
      optionButton.style.opacity = '0';
      optionButton.style.transform = 'translateY(20px)';
      
      // Efektli görünüm
      setTimeout(() => {
        optionButton.style.opacity = '1';
        optionButton.style.transform = 'translateY(0)';
      }, 100 + index * 50);
      
      // Tıklama olayı
      optionButton.addEventListener('click', () => {
        selectOption(optionButton, option);
      });
      
      optionsDiv.appendChild(optionButton);
    });
  }
  
  // Seçenek seçildiğinde
  function selectOption(optionElement, selectedValue) {
    // Tüm seçenekleri pasif yap
    document.querySelectorAll('.pattern-option').forEach(opt => {
      opt.style.pointerEvents = 'none';
      if (opt !== optionElement) {
        opt.style.opacity = '0.5';
      }
    });
    
    // Seçilen seçeneği vurgula
    optionElement.classList.add('selected');
    
    // Boş kutuyu güncelle
    const emptyItem = document.querySelector('.pattern-item.empty');
    emptyItem.textContent = selectedValue;
    emptyItem.classList.remove('empty', 'pulse-animation');
    
    // Doğru/yanlış kontrolü
    if (selectedValue === correctAnswer) {
      // Doğru
      emptyItem.classList.add('correct');
      consecutiveCorrect++;
      
      // Ardışık doğru cevaplarda combo artışı
      if (consecutiveCorrect >= 3) {
        combo = Math.min(combo + 0.5, 5); // Maksimum 5x combo
      }
      
      // Skoru güncelle (seviye, zorluk ve combo faktörleriyle)
      const basePuan = 10;
      const levelBonus = level * 2;
      const difficultyBonus = difficulty * 5;
      const comboMultiplier = combo;
      const pointsEarned = Math.floor((basePuan + levelBonus + difficultyBonus) * comboMultiplier);
      
      score += pointsEarned;
      scoreDisplay.textContent = score;
      
      // Ses efekti
      try {
        sounds.correct.currentTime = 0;
        sounds.correct.play().catch(e => console.log("Ses çalınamadı:", e));
      } catch (e) {}
      
      // Özel mesaj (combo durumuna göre)
      if (combo > 1) {
        showMessage(`Doğru! +${pointsEarned} puan! (${combo.toFixed(1)}x Combo!)`, 'success');
      } else {
        showMessage(`Doğru! +${pointsEarned} puan kazandınız.`, 'success');
      }
      
      // Belirli skor artışlarında seviye yükseltme
      if (score >= level * 80) {
        level++;
        levelDisplay.textContent = level;
        
        // Ek süre ekle
        const timeBonus = 5 + Math.floor(level / 3);
        timeLeft += timeBonus;
        timerDisplay.textContent = timeLeft;
        
        // Belirli seviyelerde zorluk artışı
        if (level % 3 === 0 && difficulty < 3) {
          difficulty++;
          // Zorluk göstergesini güncelle
          const difficultyStars = '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
          showMessage(`Seviye ${level}! Zorluk artıyor: ${difficultyStars}. +${timeBonus} saniye eklendi.`, 'primary');
        } else {
          showMessage(`Tebrikler! Seviye ${level}'e yükseldiniz. +${timeBonus} saniye eklendi.`, 'primary');
        }
        
        // Ses efekti
        try {
          sounds.levelUp.play().catch(e => console.log("Ses çalınamadı:", e));
        } catch (e) {}
      }
    } else {
      // Yanlış
      emptyItem.classList.add('incorrect');
      consecutiveCorrect = 0;
      combo = 1; // Combo sıfırla
      
      // Ses efekti
      try {
        sounds.wrong.currentTime = 0;
        sounds.wrong.play().catch(e => console.log("Ses çalınamadı:", e));
      } catch (e) {}
      
      showMessage(`Yanlış! Doğru cevap: ${correctAnswer}`, 'danger');
    }
    
    // Kısa beklemeden sonra yeni desen oluştur
    setTimeout(() => {
      if (gameActive) {
        generatePattern();
      }
    }, 1800);
  }
  
  // Oyunu sonlandır
  function endGame() {
    clearInterval(timer);
    gameActive = false;
    
    // Ses efekti
    try {
      sounds.gameOver.play().catch(e => console.log("Ses çalınamadı:", e));
    } catch (e) {}
    
    // Son istatistikler
    const stats = `
      <div class="game-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam Puan:</span>
          <span class="stat-value">${score}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ulaşılan Seviye:</span>
          <span class="stat-value">${level}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Zorluk Seviyesi:</span>
          <span class="stat-value">${'★'.repeat(difficulty)}</span>
        </div>
      </div>
    `;
    
    showMessage(`<h4>Oyun Bitti!</h4>${stats}`, 'info', 8000);
    
    // Skoru API'ye gönder
    saveScore();
    
    setTimeout(() => {
      resetGame();
    }, 5000);
  }
  
  // Skoru kaydet
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
  
  // Mesaj göster
  function showMessage(message, type, duration = 3000) {
    messageContainer.innerHTML = `
      <div class="alert alert-${type} fade-in" role="alert">
        ${message}
      </div>
    `;
    
    // Süre sonunda mesajı gizle
    if (duration > 0) {
      setTimeout(() => {
        const alert = messageContainer.querySelector('.alert');
        if (alert) {
          alert.classList.add('fade-out');
          setTimeout(() => {
            messageContainer.innerHTML = '';
          }, 500);
        }
      }, duration);
    }
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