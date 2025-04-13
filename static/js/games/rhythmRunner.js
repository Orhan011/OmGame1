
/**
 * Rhythm Runner Oyunu
 * Ritim temelli müzik oyunu - Müzik ritmine uygun tuşlara basarak puan toplama
 */

// Oyun değişkenleri
window.rhythmRunnerGame = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  isPlaying: false,
  isPaused: false,
  difficulty: 'easy',
  currentSong: null,
  notes: [],
  keyBindings: {
    'KeyA': 1, // Lane 1
    'KeyS': 2, // Lane 2
    'KeyD': 3, // Lane 3
    'KeyF': 4  // Lane 4
  },
  activeKeys: {},
  hitStats: {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    total: 0
  },
  noteSpeed: 2.5, // Saniyede kaç piksel hareket edeceği
  hitWindow: {
    perfect: 50, // ms
    great: 100,   // ms
    good: 150     // ms
  },
  gameLoop: null,
  songTimeout: null,
  songDuration: 0,
  onComplete: null,
  
  // Oyunu başlat
  init: function() {
    this.setEventListeners();
    this.resetGame();
    this.updateStats();
  },
  
  // Oyunu sıfırla
  resetGame: function() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.notes = [];
    this.activeKeys = {};
    this.hitStats = {
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      total: 0
    };
    
    // Not konteynerlerini temizle
    for (let i = 1; i <= 4; i++) {
      const container = document.getElementById(`notes-container-${i}`);
      if (container) container.innerHTML = '';
    }
    
    // Feedback ekranını temizle
    const feedbackDisplay = document.getElementById('feedback-display');
    if (feedbackDisplay) feedbackDisplay.innerHTML = '';
    
    // İstatistikleri güncelle
    this.updateStats();
  },
  
  // Olay dinleyicilerini kur
  setEventListeners: function() {
    // Başlat butonu
    const startButton = document.getElementById('start-game-btn');
    startButton.addEventListener('click', () => this.startGame());
    
    // Tuş basma olayları
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Yardım butonu
    document.getElementById('help-btn').addEventListener('click', () => {
      document.getElementById('help-panel').classList.toggle('hidden');
    });
    
    // Yardım panelini kapat
    document.getElementById('close-help-btn').addEventListener('click', () => {
      document.getElementById('help-panel').classList.add('hidden');
    });
    
    // Modal'daki "Tekrar Oyna" butonu
    document.getElementById('play-again-btn').addEventListener('click', () => {
      $('#result-modal').modal('hide');
      this.resetGame();
      this.startGame();
    });
  },
  
  // Oyunu başlat
  startGame: function() {
    // Daha önce başladıysa temizle
    if (this.isPlaying) {
      this.stopGame();
    }
    
    // Oyunu sıfırla
    this.resetGame();
    
    // Zorluk seviyesini al
    this.difficulty = document.getElementById('song-select').value;
    
    // Seçilen zorluğa göre ayarları yap
    switch(this.difficulty) {
      case 'hard':
        this.noteSpeed = 4.0;
        this.hitWindow = { perfect: 40, great: 80, good: 120 };
        break;
      case 'medium':
        this.noteSpeed = 3.2;
        this.hitWindow = { perfect: 45, great: 90, good: 135 };
        break;
      default: // 'easy'
        this.noteSpeed = 2.5;
        this.hitWindow = { perfect: 50, great: 100, good: 150 };
        break;
    }
    
    // Şarkıyı başlat
    this.isPlaying = true;
    this.generateNotes();
    
    // Oyun döngüsünü başlat
    this.gameLoop = setInterval(() => this.update(), 16); // ~60 FPS
    
    // Şarkı süresi (örnek olarak)
    this.songDuration = this.difficulty === 'hard' ? 90000 : (this.difficulty === 'medium' ? 75000 : 60000);
    
    // Oyun bitişi için zamanlayıcı
    this.songTimeout = setTimeout(() => this.endGame(), this.songDuration);
    
    // Ses efekti oynat (eğer açıksa)
    if (document.getElementById('sound-effects').checked) {
      const startSound = new Audio('/static/sounds/game-complete.mp3');
      startSound.volume = 0.5;
      startSound.play();
    }
  },
  
  // Oyunu durdur
  stopGame: function() {
    this.isPlaying = false;
    clearInterval(this.gameLoop);
    clearTimeout(this.songTimeout);
    this.gameLoop = null;
    this.songTimeout = null;
  },
  
  // Oyunu bitir
  endGame: function() {
    this.stopGame();
    
    // Sonuçları hesapla
    const accuracy = this.calculateAccuracy();
    
    // Sonuçları göster
    document.getElementById('result-score').textContent = this.score;
    document.getElementById('result-max-combo').textContent = this.maxCombo;
    document.getElementById('result-accuracy').textContent = `${accuracy.toFixed(1)}%`;
    
    // Callback'i çağır
    if (typeof this.onComplete === 'function') {
      this.onComplete({
        score: this.score,
        maxCombo: this.maxCombo,
        accuracy: accuracy,
        difficulty: this.difficulty,
        stats: this.hitStats
      });
    }
    
    // Sonuç modalını göster
    const resultModal = new bootstrap.Modal(document.getElementById('result-modal'));
    resultModal.show();
  },
  
  // Doğruluk yüzdesini hesapla
  calculateAccuracy: function() {
    if (this.hitStats.total === 0) return 0;
    
    const weightedSum = (
      this.hitStats.perfect * 100 + 
      this.hitStats.great * 75 + 
      this.hitStats.good * 50
    );
    
    return (weightedSum / (this.hitStats.total * 100)) * 100;
  },
  
  // Notaları oluştur (zorluk seviyesine göre)
  generateNotes: function() {
    const gameContainer = document.getElementById('rhythm-game-container');
    const containerHeight = gameContainer.offsetHeight;
    
    // Notaların ne kadar sürede aşağıya ineceğini hesapla (piksel/ms)
    const noteVelocity = this.noteSpeed / 1000; // piksel/ms
    
    // Zorluk seviyesine göre oluşturulacak nota sayısı
    let noteCount;
    let minInterval, maxInterval;
    
    switch (this.difficulty) {
      case 'hard':
        noteCount = 120;
        minInterval = 300;
        maxInterval = 700;
        break;
      case 'medium':
        noteCount = 90;
        minInterval = 400;
        maxInterval = 900;
        break;
      default: // 'easy'
        noteCount = 60;
        minInterval = 500;
        maxInterval = 1200;
        break;
    }
    
    // Notaları oluştur
    let currentTime = 1000; // İlk notanın gelme süresi (ms)
    
    for (let i = 0; i < noteCount; i++) {
      // Rastgele bir şerit seç (1, 2, 3, veya 4)
      const lane = Math.floor(Math.random() * 4) + 1;
      
      // Bu notayı planla
      setTimeout(() => {
        this.createNote(lane, containerHeight);
      }, currentTime);
      
      // Bir sonraki nota için süreyi artır
      currentTime += minInterval + Math.floor(Math.random() * (maxInterval - minInterval));
    }
  },
  
  // Yeni bir nota oluştur
  createNote: function(lane, containerHeight) {
    if (!this.isPlaying) return;
    
    // Not konteynerini bul
    const container = document.getElementById(`notes-container-${lane}`);
    
    // Yeni nota elementi oluştur
    const note = document.createElement('div');
    note.className = 'note';
    note.style.top = '0px';
    
    // Nota nesnesini oluştur
    const noteObj = {
      element: note,
      lane: lane,
      position: 0,
      hit: false,
      missed: false,
      createdAt: Date.now()
    };
    
    // Notayı diziye ekle
    this.notes.push(noteObj);
    
    // Notayı DOM'a ekle
    container.appendChild(note);
  },
  
  // Oyun döngüsü (her frame'de çağrılır)
  update: function() {
    if (!this.isPlaying || this.isPaused) return;
    
    const containerHeight = document.getElementById('rhythm-game-container').offsetHeight;
    const targetPosition = containerHeight - 80; // Hedef çizgisinin konumu
    
    // Her notayı güncelle
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      if (note.hit || note.missed) continue;
      
      // Notanın yeni pozisyonunu hesapla
      note.position += this.noteSpeed;
      note.element.style.top = `${note.position}px`;
      
      // Not ekranın dışına çıktı mı kontrol et
      if (note.position > containerHeight + 20) {
        note.missed = true;
        note.element.remove();
        this.notes.splice(i, 1);
        this.handleMiss();
      }
      // Nota hedefi geçtiyse ve vurulmadıysa
      else if (note.position > targetPosition + this.hitWindow.good && !note.hit) {
        note.missed = true;
        note.element.remove();
        this.notes.splice(i, 1);
        this.handleMiss();
      }
    }
  },
  
  // Tuşa basma olayını yakala
  handleKeyDown: function(e) {
    if (!this.isPlaying || this.isPaused) return;
    
    // Tuş zaten basılı mı kontrol et
    if (this.activeKeys[e.code]) return;
    
    // Tuşun bir lane'e karşılık gelip gelmediğini kontrol et
    const lane = this.keyBindings[e.code];
    if (!lane) return;
    
    // Tuşun basılı olduğunu işaretle
    this.activeKeys[e.code] = true;
    
    // Hedef elementini vurgula
    const targetKey = document.querySelector(`#lane-${lane} .target-key`);
    if (targetKey) {
      targetKey.style.backgroundColor = 'rgba(255, 50, 120, 0.8)';
      targetKey.style.boxShadow = '0 0 15px rgba(255, 50, 120, 0.8)';
    }
    
    // Bu lane'deki en yakın notayı bul
    this.checkNoteHit(lane);
  },
  
  // Tuş bırakma olayını yakala
  handleKeyUp: function(e) {
    // Tuşun basılı olmadığını işaretle
    this.activeKeys[e.code] = false;
    
    // Tuşun bir lane'e karşılık gelip gelmediğini kontrol et
    const lane = this.keyBindings[e.code];
    if (!lane) return;
    
    // Hedef elementinin vurgusunu kaldır
    const targetKey = document.querySelector(`#lane-${lane} .target-key`);
    if (targetKey) {
      targetKey.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      targetKey.style.boxShadow = 'none';
    }
  },
  
  // En yakın notayı kontrol et ve vur
  checkNoteHit: function(lane) {
    if (!this.isPlaying) return;
    
    const containerHeight = document.getElementById('rhythm-game-container').offsetHeight;
    const targetPosition = containerHeight - 80; // Hedef çizgisinin konumu
    
    // Bu lane'deki vurulmamış ve kaçırılmamış notaları filtreleme
    const laneNotes = this.notes.filter(note => 
      note.lane === lane && !note.hit && !note.missed
    );
    
    if (laneNotes.length === 0) return; // Bu lane'de nota yoksa
    
    // Hedef çizgisine en yakın notayı bul
    const closestNote = laneNotes.reduce((closest, note) => {
      const distanceToTarget = Math.abs(note.position - targetPosition);
      const closestDistance = Math.abs(closest.position - targetPosition);
      return distanceToTarget < closestDistance ? note : closest;
    }, laneNotes[0]);
    
    // Notanın vurma hedefine olan uzaklığını hesapla
    const hitDistance = Math.abs(closestNote.position - targetPosition);
    
    // Vurma penceresi dışındaysa hiçbir şey yapma
    if (hitDistance > this.hitWindow.good) return;
    
    // Notayı vuruldu olarak işaretle
    closestNote.hit = true;
    
    // Vurma kalitesini belirle
    let hitQuality;
    if (hitDistance <= this.hitWindow.perfect) {
      hitQuality = 'perfect';
    } else if (hitDistance <= this.hitWindow.great) {
      hitQuality = 'great';
    } else {
      hitQuality = 'good';
    }
    
    // Vuruşu işle
    this.handleHit(hitQuality, closestNote);
  },
  
  // Vuruşu işle
  handleHit: function(quality, note) {
    // Puanları hesapla
    let points;
    let comboBonus = Math.floor(this.combo / 10) * 5; // Her 10 combo için 5 puan bonus
    
    switch (quality) {
      case 'perfect':
        points = 100 + comboBonus;
        this.hitStats.perfect++;
        break;
      case 'great':
        points = 75 + comboBonus;
        this.hitStats.great++;
        break;
      case 'good':
        points = 50 + comboBonus;
        this.hitStats.good++;
        break;
    }
    
    // İstatistikleri güncelle
    this.hitStats.total++;
    this.score += points;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Vuruş geri bildirimi göster
    this.showFeedback(quality, points);
    
    // Notayı güzel bir şekilde kaldır
    note.element.style.transform = 'scale(1.5)';
    note.element.style.opacity = '0';
    setTimeout(() => {
      note.element.remove();
      const index = this.notes.indexOf(note);
      if (index > -1) {
        this.notes.splice(index, 1);
      }
    }, 200);
    
    // İstatistikleri güncelle
    this.updateStats();
    
    // Ses efekti oynat (eğer açıksa)
    if (document.getElementById('sound-effects').checked) {
      let sound;
      switch (quality) {
        case 'perfect':
          sound = new Audio('/static/sounds/correct.mp3');
          break;
        case 'great':
          sound = new Audio('/static/sounds/click.mp3');
          break;
        case 'good':
          sound = new Audio('/static/sounds/card-flip.mp3');
          break;
      }
      if (sound) {
        sound.volume = 0.3;
        sound.play();
      }
    }
  },
  
  // Kaçırma durumunu işle
  handleMiss: function() {
    // Comboyu sıfırla
    this.combo = 0;
    
    // İstatistikleri güncelle
    this.hitStats.miss++;
    this.hitStats.total++;
    
    // Ekranda geri bildirim göster
    this.showFeedback('miss', 0);
    
    // İstatistikleri güncelle
    this.updateStats();
    
    // Ses efekti oynat (eğer açıksa)
    if (document.getElementById('sound-effects').checked) {
      const missSound = new Audio('/static/sounds/wrong.mp3');
      missSound.volume = 0.2;
      missSound.play();
    }
  },
  
  // Vuruş geri bildirimi göster
  showFeedback: function(quality, points) {
    const feedbackDisplay = document.getElementById('feedback-display');
    const feedback = document.createElement('div');
    feedback.className = `feedback ${quality}`;
    
    // Kaliteye göre metin
    let text;
    switch (quality) {
      case 'perfect':
        text = `PERFECT! +${points}`;
        break;
      case 'great':
        text = `GREAT! +${points}`;
        break;
      case 'good':
        text = `GOOD! +${points}`;
        break;
      case 'miss':
        text = 'MISS!';
        break;
    }
    
    feedback.textContent = text;
    feedbackDisplay.appendChild(feedback);
    
    // Animasyon bittikten sonra elementi kaldır
    setTimeout(() => {
      feedback.remove();
    }, 500);
  },
  
  // İstatistikleri güncelle
  updateStats: function() {
    document.getElementById('score-count').textContent = this.score;
    document.getElementById('combo-count').textContent = this.combo;
  }
};

// Sayfa yüklendiğinde oyunu başlat
document.addEventListener('DOMContentLoaded', function() {
  window.rhythmRunnerGame.init();
});
