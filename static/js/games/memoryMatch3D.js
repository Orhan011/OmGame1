/**
 * Memory Match 3D Oyunu
 * Modern ve tamamen işlevsel 3D efektli hafıza kartları oyunu
 */

// Oyun değişkenleri
window.memoryMatchGame = {
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  totalPairs: 0,
  moves: 0,
  timer: null,
  time: 0,
  gameStarted: false,
  gamePaused: false,
  gameOver: false,
  difficulty: 'easy',
  hints: 0,
  onComplete: null,
  onMove: null,
  onHint: null,

  // Oyunu başlat
  init: function(difficulty = 'easy') {
    this.difficulty = difficulty;
    this.moves = 0;
    this.time = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.hints = 0;
    this.gameStarted = false;
    this.gamePaused = false;
    this.gameOver = false;

    // Zorluk seviyesine göre oyun tahtası boyutlarını ayarla
    let gridSize;
    switch(difficulty) {
      case 'hard': gridSize = 8; break;
      case 'medium': gridSize = 6; break;
      default: gridSize = 4; break;
    }

    this.totalPairs = (gridSize * gridSize) / 2;
    this.createCards(gridSize);
    this.updateStats();

    // Kartları yerleştir
    this.renderCards();

    // Event dinleyicileri kur
    document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
    document.getElementById('new-game-modal').addEventListener('click', () => {
      $('#result-modal').modal('hide');
      this.newGame();
    });
    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.newGame();
    });
    document.getElementById('help-btn').addEventListener('click', () => {
      document.getElementById('help-panel').classList.toggle('hidden');
    });
    document.getElementById('close-help-btn').addEventListener('click', () => {
      document.getElementById('help-panel').classList.add('hidden');
    });

    // Ayarları kontrol et
    this.checkSettings();
  },

  // Kartları oluştur
  createCards: function(gridSize) {
    // İkon setini oluştur
    const icons = [
      'fas fa-gem', 'fas fa-heart', 'fas fa-star', 'fas fa-bolt',
      'fas fa-crown', 'fas fa-moon', 'fas fa-sun', 'fas fa-cloud',
      'fas fa-tree', 'fas fa-apple-alt', 'fas fa-car', 'fas fa-plane',
      'fas fa-book', 'fas fa-music', 'fas fa-camera', 'fas fa-key',
      'fas fa-bell', 'fas fa-bomb', 'fas fa-gamepad', 'fas fa-gift',
      'fas fa-magnet', 'fas fa-rocket', 'fas fa-anchor', 'fas fa-globe',
      'fas fa-cat', 'fas fa-dog', 'fas fa-horse', 'fas fa-fish',
      'fas fa-coffee', 'fas fa-cookie', 'fas fa-pizza-slice', 'fas fa-ice-cream'
    ];

    // Zorluk seviyesine göre ihtiyacımız olan benzersiz kart sayısı
    const pairsNeeded = (gridSize * gridSize) / 2;

    // İkonları karıştır ve ihtiyacımız kadar al
    const shuffledIcons = [...icons].sort(() => 0.5 - Math.random()).slice(0, pairsNeeded);

    // Her ikon için 2 kart oluştur (çiftleri)
    this.cards = [];
    shuffledIcons.forEach(icon => {
      for (let i = 0; i < 2; i++) {
        this.cards.push({
          id: Math.random().toString(36).substring(2, 9),
          icon: icon,
          flipped: false,
          matched: false
        });
      }
    });

    // Kartları karıştır
    this.cards.sort(() => 0.5 - Math.random());
  },

  // Kartları oyun tahtasına yerleştir
  renderCards: function() {
    const board = document.getElementById('memory-board');
    board.innerHTML = '';

    // Zorluk seviyesine göre ızgara boyutunu belirle
    let gridSize;
    switch(this.difficulty) {
      case 'hard': gridSize = 8; break;
      case 'medium': gridSize = 6; break;
      default: gridSize = 4; break;
    }

    // Izgarayı ayarla
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Kartları ekle
    this.cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'memory-card';
      cardElement.dataset.id = card.id;

      cardElement.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <i class="${card.icon}"></i>
          </div>
          <div class="card-back">
            <div class="card-pattern"></div>
          </div>
        </div>
      `;

      cardElement.addEventListener('click', () => this.flipCard(card.id));
      board.appendChild(cardElement);
    });
  },

  // Kart çevirme
  flipCard: function(cardId) {
    // Oyun henüz başlamadıysa başlat
    if (!this.gameStarted) {
      this.startGame();
    }

    // Oyun duraklatıldıysa veya bittiyse, kart çevirmeye izin verme
    if (this.gamePaused || this.gameOver) return;

    // Kartı bul
    const card = this.cards.find(c => c.id === cardId);
    const cardElement = document.querySelector(`.memory-card[data-id="${cardId}"]`);

    // Eğer kart zaten eşleşmiş veya zaten çevrilmişse, bir şey yapma
    if (card.matched || card.flipped || this.flippedCards.length >= 2) return;

    // Kartı çevir
    card.flipped = true;
    cardElement.classList.add('flipped');
    this.flippedCards.push({ card, element: cardElement });

    // Ses efekti oynat (eğer açıksa)
    if (document.getElementById('sound-effects').checked) {
      const flipSound = new Audio('/static/sounds/card-flip.mp3');
      flipSound.volume = 0.5;
      flipSound.play();
    }

    // İki kart açıldıysa, eşleşmeyi kontrol et
    if (this.flippedCards.length === 2) {
      // Hamle sayısını artır
      this.moves++;
      this.updateStats();

      // Callback fonksiyonu varsa çağır
      if (typeof this.onMove === 'function') {
        this.onMove(this.moves);
      }

      const [firstCard, secondCard] = this.flippedCards;

      // Eşleşme kontrolü
      if (firstCard.card.icon === secondCard.card.icon) {
        // Eşleşme var!
        this.matchedPairs++;

        // Kartları eşleşmiş olarak işaretle
        firstCard.card.matched = true;
        secondCard.card.matched = true;

        // Animasyon ekle
        firstCard.element.classList.add('matched');
        secondCard.element.classList.add('matched');

        // Eşleşme ses efekti oynat (eğer açıksa)
        if (document.getElementById('sound-effects').checked) {
          const matchSound = new Audio('/static/sounds/match.mp3');
          matchSound.volume = 0.6;
          matchSound.play();
        }

        // Eşleşmiş animasyonu (eğer animasyonlar açıksa)
        if (document.getElementById('animations').checked) {
          firstCard.element.classList.add('match-animation');
          secondCard.element.classList.add('match-animation');

          setTimeout(() => {
            firstCard.element.classList.remove('match-animation');
            secondCard.element.classList.remove('match-animation');
          }, 800);
        }

        // Flipped kartları temizle
        this.flippedCards = [];

        // Oyun tamamlandı mı kontrol et
        if (this.matchedPairs === this.totalPairs) {
          this.endGame();
        }
      } else {
        // Eşleşme yok
        // Eşleşmeyen efekti ekle
        if (document.getElementById('animations').checked) {
          firstCard.element.classList.add('no-match');
          secondCard.element.classList.add('no-match');
        }

        // Eşleşmeyen ses efekti oynat (eğer açıksa)
        if (document.getElementById('sound-effects').checked) {
          const noMatchSound = new Audio('/static/sounds/no-match.mp3');
          noMatchSound.volume = 0.4;
          noMatchSound.play();
        }

        // Kısa bir süre bekledikten sonra kartları geri çevir
        setTimeout(() => {
          firstCard.card.flipped = false;
          secondCard.card.flipped = false;

          firstCard.element.classList.remove('flipped', 'no-match');
          secondCard.element.classList.remove('flipped', 'no-match');

          this.flippedCards = [];
        }, 1000);
      }
    }
  },

  // Oyunu başlat
  startGame: function() {
    this.gameStarted = true;
    this.time = 0;

    // Zamanlayıcıyı başlat
    this.timer = setInterval(() => {
      this.time++;
      this.updateStats();
    }, 1000);
  },

  // Oyunu duraklat
  pauseGame: function() {
    if (this.gameStarted && !this.gamePaused) {
      this.gamePaused = true;
      clearInterval(this.timer);
    }
  },

  // Oyunu devam ettir
  resumeGame: function() {
    if (this.gameStarted && this.gamePaused) {
      this.gamePaused = false;
      this.timer = setInterval(() => {
        this.time++;
        this.updateStats();
      }, 1000);
    }
  },

  // Oyunu bitir
  endGame: function() {
    this.gameOver = true;
    clearInterval(this.timer);

    // Bitiş ses efekti
    if (document.getElementById('sound-effects').checked) {
      const completeSound = new Audio('/static/sounds/game-complete.mp3');
      completeSound.volume = 0.7;
      completeSound.play();
    }

    // Sonuç bilgilerini göster
    document.getElementById('result-time').textContent = this.formatTime(this.time);
    document.getElementById('result-moves').textContent = this.moves;

    // Zorluk seviyesini Türkçe olarak ayarla
    let difficultyText;
    switch(this.difficulty) {
      case 'hard': difficultyText = 'Zor'; break;
      case 'medium': difficultyText = 'Orta'; break;
      default: difficultyText = 'Kolay'; break;
    }
    document.getElementById('result-difficulty').textContent = difficultyText;

    // Completion callback
    if (typeof this.onComplete === 'function') {
      this.onComplete({
        time: this.time,
        moves: this.moves,
        difficulty: this.difficulty,
        hints: this.hints
      });
    }

    // Sonuç modalını göster
    const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
    resultModal.show();
  },

  // Yeni oyun başlat
  newGame: function() {
    // Timer'ı temizle
    clearInterval(this.timer);

    // Oyunu yeniden başlat
    this.init(this.difficulty);
  },

  // İstatistikleri güncelle
  updateStats: function() {
    document.getElementById('moves-count').textContent = this.moves;
    document.getElementById('timer').textContent = this.formatTime(this.time);
  },

  // Zamanı formatla
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // İpucu göster
  showHint: function() {
    // Hint kullanma sayısını arttır
    this.hints++;

    // İpucu callback'i
    if (typeof this.onHint === 'function') {
      this.onHint();
    }

    // İpucu modalını göster
    $('#hint-modal').modal('show');

    document.getElementById('hint-text').textContent = "İpucu göstermek için hazırlanıyor...";
    document.getElementById('show-hint-btn').onclick = () => this.displayHint();
  },

  // İpucu göster
  displayHint: function() {
    // Ses efekti
    if (document.getElementById('sound-effects').checked) {
      const hintSound = new Audio('/static/sounds/hint.mp3');
      hintSound.volume = 0.5;
      hintSound.play();
    }

    // Eşleşmemiş kartlardan iki tane bul (aynı simgeye sahip olanlar)
    const unmatched = this.cards.filter(card => !card.matched);
    const icons = [...new Set(unmatched.map(card => card.icon))];

    if (icons.length > 0) {
      // Rastgele bir simge seç
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];

      // Bu simgeye sahip kartları bul
      const cardsWithIcon = unmatched.filter(card => card.icon === randomIcon);

      if (cardsWithIcon.length === 2) {
        // İpucu metnini güncelle
        const iconClass = randomIcon.split(' ')[1]; // fa-* kısmını al
        const iconName = iconClass.replace('fa-', '').replace(/-/g, ' ');
        document.getElementById('hint-text').innerHTML = `İşte sana bir ipucu: <i class="${randomIcon}"></i> ikonlarını bul!`;

        // Kartları geçici olarak vurgula
        const card1Element = document.querySelector(`.memory-card[data-id="${cardsWithIcon[0].id}"]`);
        const card2Element = document.querySelector(`.memory-card[data-id="${cardsWithIcon[1].id}"]`);

        card1Element.classList.add('hint');
        card2Element.classList.add('hint');

        setTimeout(() => {
          card1Element.classList.remove('hint');
          card2Element.classList.remove('hint');

          // İpucu modalını kapat
          $('#hint-modal').modal('hide');
        }, 2000);
      } else {
        document.getElementById('hint-text').textContent = "Bu tur için ipucu bulunamadı!";
      }
    } else {
      document.getElementById('hint-text').textContent = "Tüm kartlar eşleşmiş durumda!";
    }
  },

  // Ayarları kontrol et
  checkSettings: function() {
    // Zorluk seviyesini select menüsünde ayarla
    document.getElementById('difficulty-select').value = this.difficulty;
  }
};

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener('DOMContentLoaded', function() {
  window.memoryMatchGame.init('easy');
});