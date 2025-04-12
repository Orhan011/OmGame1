
/**
 * Oyun entegrasyon yardımcı işlevleri
 * Bu dosya, oyunlar için ortak yardımcı işlevleri içerir
 */

// HTML UI Modernizer sınıflarını yükle
function loadGameModernizer() {
  if (typeof GameModernizer === 'undefined') {
    console.log('GameModernizer yükleniyor...');
    
    const script = document.createElement('script');
    script.src = '/static/js/game-modernizer.js';
    document.head.appendChild(script);
    
    const responsiveScript = document.createElement('script');
    responsiveScript.src = '/static/js/game-responsive-modernizer.js';
    document.head.appendChild(responsiveScript);
    
    console.log('GameModernizer yüklendi');
  }
}

// Zorluk seçici eklemek için yardımcı fonksiyon
function addDifficultySelector(containerId, defaultDifficulty = 'medium', callback = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`'${containerId}' ID'li konteyner bulunamadı`);
    return;
  }
  
  // Zorluk seçici HTML'i
  const html = `
    <div class="difficulty-selector">
      <button class="difficulty-btn easy ${defaultDifficulty === 'easy' ? 'selected' : ''}" data-difficulty="easy">
        <i class="fas fa-baby"></i>
        <span>Kolay</span>
      </button>
      <button class="difficulty-btn medium ${defaultDifficulty === 'medium' ? 'selected' : ''}" data-difficulty="medium">
        <i class="fas fa-check"></i>
        <span>Orta</span>
      </button>
      <button class="difficulty-btn hard ${defaultDifficulty === 'hard' ? 'selected' : ''}" data-difficulty="hard">
        <i class="fas fa-fire"></i>
        <span>Zor</span>
      </button>
      <button class="difficulty-btn expert ${defaultDifficulty === 'expert' ? 'selected' : ''}" data-difficulty="expert">
        <i class="fas fa-crown"></i>
        <span>Uzman</span>
      </button>
    </div>
  `;
  
  // HTML'i ekle
  container.innerHTML = html;
  
  // CSS dosyasını ekle (eğer yüklü değilse)
  if (!document.querySelector('link[href*="difficulty-selector.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/difficulty-selector.css';
    document.head.appendChild(link);
  }
  
  // Düğmelere tıklama olayları ekle
  const buttons = container.querySelectorAll('.difficulty-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      // Seçili sınıfını kaldır
      buttons.forEach(btn => btn.classList.remove('selected'));
      
      // Bu düğmeyi seçili yap
      this.classList.add('selected');
      
      // Seçilen zorluk değerini al
      const difficulty = this.getAttribute('data-difficulty');
      
      // Callback fonksiyonu varsa çağır
      if (typeof callback === 'function') {
        callback(difficulty);
      }
    });
  });
  
  // Seçilen zorluk değerini döndüren yardımcı fonksiyon
  container.getSelectedDifficulty = function() {
    const selectedButton = container.querySelector('.difficulty-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-difficulty') : defaultDifficulty;
  };
  
  return container;
}

// Ses efektleri yürütücüsü - ortak kullanım için
class SoundPlayer {
  constructor() {
    this.sounds = {};
    this.muted = false;
    this.volume = 0.5; // Varsayılan ses düzeyi
  }
  
  // Ses yükle
  loadSound(name, path) {
    this.sounds[name] = new Audio(path);
    this.sounds[name].volume = this.volume;
    return this;
  }
  
  // Ses çal
  play(name) {
    if (this.muted || !this.sounds[name]) return this;
    
    // Sesi durdur ve baştan başlat
    this.sounds[name].pause();
    this.sounds[name].currentTime = 0;
    
    // Sesi oynat
    const playPromise = this.sounds[name].play();
    
    // Oynatma hatalarını yönet
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn(`Ses oynatma hatası (${name}):`, error);
      });
    }
    
    return this;
  }
  
  // Ses düzeyini ayarla (0.0 - 1.0)
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
    
    // Tüm seslerin düzeyini güncelle
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
    
    return this;
  }
  
  // Sesi kapat/aç
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
  
  // Sesi kapat
  mute() {
    this.muted = true;
    return this;
  }
  
  // Sesi aç
  unmute() {
    this.muted = false;
    return this;
  }
}

// Standart oyun sesleri yükleyen yardımcı fonksiyon
function loadGameSounds() {
  const soundPlayer = new SoundPlayer();
  
  // Temel oyun sesleri
  soundPlayer
    .loadSound('click', '/static/sounds/click.mp3')
    .loadSound('correct', '/static/sounds/correct.mp3')
    .loadSound('wrong', '/static/sounds/wrong.mp3')
    .loadSound('success', '/static/sounds/success.mp3')
    .loadSound('hint', '/static/sounds/hint.mp3')
    .loadSound('gameOver', '/static/sounds/game-over.mp3')
    .loadSound('gameComplete', '/static/sounds/game-complete.mp3');
  
  return soundPlayer;
}

// Global nesneler
window.GameHelper = {
  loadGameModernizer,
  addDifficultySelector,
  loadGameSounds,
  SoundPlayer
};
