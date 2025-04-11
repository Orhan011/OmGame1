/**
 * Yapboz Oyunu - 1.0
 * 
 * Modern ve profesyonel bir yapboz oyunu uygulaması.
 * Oyuncular bir görseli parçalara ayırıp karıştırarak doğru şekilde yeniden birleştirmeye çalışırlar.
 * 
 * Özellikler:
 * - Görsellerin parçalara ayrılması ve yeniden birleştirilmesi
 * - Sürükle-Bırak arayüzü
 * - Zorluk seviyeleri (Kolay, Orta, Zor)
 * - Puan sistemi
 * - Süre takibi ve hamle sayacı
 * - Ses efektleri
 * - Yıldız derecelendirme sistemi
 * - Başarımlar
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elementleri
  const introSection = document.getElementById('intro-section');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const referenceImage = document.getElementById('reference-image');
  const startGameButton = document.getElementById('start-game');
  const pauseButton = document.getElementById('pause-game');
  const resumeButton = document.getElementById('resume-game');
  const restartButton = document.getElementById('restart-game');
  const shuffleButton = document.getElementById('shuffle-puzzle');
  const pauseOverlay = document.getElementById('pause-overlay');
  const soundToggle = document.getElementById('sound-toggle');
  const playAgainButton = document.getElementById('play-again');
  const copyScoreButton = document.getElementById('copy-score');
  const shareScoreButton = document.getElementById('share-score');
  const levelButtons = document.querySelectorAll('.level-btn');

  // Skore ve zaman göstergeleri
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const movesDisplay = document.getElementById('moves-display');
  const levelDisplay = document.getElementById('level-display');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalMoves = document.getElementById('final-moves');
  const ratingStars = document.getElementById('rating-stars');
  const ratingText = document.getElementById('rating-text');
  const alertContainer = document.getElementById('alert-container');

  // Oyun durumu
  let gameState = {
    isPlaying: false,
    isPaused: false,
    difficulty: 'EASY',
    level: 1,
    score: 0,
    moves: 0,
    timeRemaining: 300, // 5 dakika
    timerInterval: null,
    soundEnabled: true,
    grid: {
      rows: 3,
      cols: 3
    },
    puzzlePieces: [],
    selectedPiece: null,
    correctPlacements: 0,
    bonusPoints: 0,
    achievements: []
  };

  // Seslerin ön yüklemesi
  const sounds = {
    pickup: new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAD+/wMA+v8IAA8ABgAIABkA9v/o//v/AgAFABQA/P/P/+3/AsAPAAQAyf+h/7T/2//9//H/vf+Z/7P/2P8DAA0A+/+9/8L/x//z/+//zv+//+7/8v/R/7r/qf/E/9X/AwAQAPL/xP/V/+z/6P/1//z/9//f/+X/7v8QAAEA7P/c/9f/vP/R//L/5/++/9D//f8hAAUA0f/a/9X/CQAMAPz/4//X/9//AQD2/x0A9v/3/wMAxf/n/wcAFgACAPP//P8GAAcAAgAHAAEADgAQAAwA+v/5/+L/8/8DABcA+P/6/+X/5P/s/+P/2P/P//j/7f/e/9H/5//1//P/7/8IAAQA+f8QAAwAKQAEAO//9f/l/wMA4//1/wAA3//0//D/BQAUAOv/8v/4/w4ABwAJABIA9v/6/+f/8v/t//n/6f8CAOv/9P/X/9//8//9/+v/4//n//n//f8aAAgABwADAAUA7v/O/9v/8f/2//j/7P/0//3/6//8/wsACgADAPL/6//4/+7/8v/r/+v/+f/5//b//v/9//7/AgACAAAA9v/t//f//v8GAPH/8P/0//T/+P/5//n//f8BAAIA/f/5//j/+f/7//3//v///wEA///9//z//f8AAAMAAQAAAP7//v8AAAEAAQAAAP7//v///wEAAQABAAAA//8AAAAAAAAAAAAAAAAAAAEAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    place: new Audio('data:audio/wav;base64,UklGRrQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YaADAAD/////Gxz//9fXra3t7UlJoJ/Q0CMj/v6Dg8/P5eUvLykpmpkoKP//MjIzMysrIyOVlYWF1tYQED09y8vi4jMzGBg3N1BQ7e2np62tpaWtrb29vb21ta2tra2Rkbm5n5+Hh7m5wcGvr5+fqalYWDIyHh4YGDAwEBDw8Nra2trh4e/v+fnu7vHx/f0GBg8PEREKChUVGhoYGBISGRkYGBMTDw8NDQ0NCQkLCwcHBwcHBwcEBAcHBQUDAwICAgIBAfz8+fn39/X19PTz8/Pz8/Py8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vI='),
    complete: new Audio('data:audio/wav;base64,UklGRiQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAAD////////+//////7//v/////////+/////v////////////7////+//////////////7////9////+//5//j/+v/7//v//P/+//7///8AAP////8AAAAA/v///wAAAAD//wAA//8AAP//AQD+/wAAAAACAP//AQD9/wAA//8DAP//AgD8/wEA/v8DAP//AwD7/wEA/f8FAAIABAACAAEA/f8CAAUABQAFAPz/AAD//wMAAwAHAP//AgDy/wIAAQAHAAAA//8OAAoADgAHAAUAEgD//xIACwADAPD/AAD4//H/CAAEABIA7v/x/wYA7//7//X/7f/z/wcA8v/P//T/y/8cAP//LQAaAA0AFgAEAP//z/8MAPL/HQAdACwAEQD7/wQA4P8iAN//EAAtAAQAUQA0AP//8//u//r/5P/z/+j/3//H//b/6v8kAPD/8P8KAOf/FgD3/wEADQDu//j/3//3/w8A6f8PAOv/3v8YAOv/FwD9/wIAAwDv//H/7f8MAAAADwAfAAcAJgA5APj/KwAcAPL/CQASAOf/NQACAPb/9/8CAPL/AwD//xMATABBAEYAKwAWAP3/9P8FAOz/AgDm/wQA5v/W/9z/zf/p//7//v8IAAEABgAEAP7///8GAAQABgAEAP7/AAAGAP//AQAAAP7/AAABAP//AgD//wEAAAD+/wAAAQD//wEA//8BAP//AgAAAP//AAABAP7/AQAAAP//AgAAAP//AAABAP//AwD+/wEA/v8BAP//AgD//wEA//8BAP//AgD//wEAAAD//wEAAAD//wEA//8CAP//AgD//wEA//8BAAAA//8BAAAA//8BAP//AQD//wEA//8BAAAAAAD//wEA//8BAP//AQAAAP//AQAAAP//AQD//wEA//8BAAAAAAAAAAAAAQD//wEA/////wAA//8BAAAAAAD//wAAAAAAAAEA/////wAA//8=')
  };

  // Örnek görseller (SVG)
  const puzzleImages = [
    // Geometrik desenler
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#1a1a2e"/>
      <circle cx="150" cy="150" r="100" fill="#4d3ee3"/>
      <rect x="100" y="100" width="100" height="100" fill="#f72585"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2d3436"/>
      <polygon points="150,50 250,150 150,250 50,150" fill="#00b894"/>
      <circle cx="150" cy="150" r="50" fill="#fd79a8"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#130f40"/>
      <rect x="50" y="50" width="200" height="200" fill="#e056fd" transform="rotate(45 150 150)"/>
      <circle cx="150" cy="150" r="70" fill="#7bed9f"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2c3e50"/>
      <circle cx="100" cy="100" r="60" fill="#e74c3c"/>
      <circle cx="200" cy="200" r="60" fill="#3498db"/>
      <circle cx="150" cy="150" r="40" fill="#2ecc71"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#192a56"/>
      <path d="M150 50 L250 150 L150 250 L50 150 Z" fill="#ffa502"/>
      <circle cx="150" cy="150" r="50" fill="#ff6348"/>
    </svg>`,
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#1a1a2e"/>
      <rect x="25" y="25" width="250" height="250" fill="#38184c" rx="20"/>
      <circle cx="100" cy="100" r="40" fill="#f72585"/>
      <circle cx="200" cy="100" r="40" fill="#7209b7"/>
      <circle cx="100" cy="200" r="40" fill="#4cc9f0"/>
      <circle cx="200" cy="200" r="40" fill="#4d3ee3"/>
    </svg>`,

    // Yeni Eklenen Görseller - Manzaralar ve Sanatsal Tasarımlar
    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2c3e50"/>
      <!-- Güneş -->
      <circle cx="200" cy="80" r="40" fill="#f39c12"/>
      <!-- Arka dağlar -->
      <path d="M0,200 L60,140 L100,170 L150,110 L200,160 L240,120 L300,180 L300,300 L0,300 Z" fill="#34495e"/>
      <!-- Ön dağlar -->
      <path d="M0,230 L50,180 L100,220 L150,170 L200,220 L250,150 L300,200 L300,300 L0,300 Z" fill="#2c3e50"/>
      <!-- Nehir -->
      <path d="M120,300 C150,250 180,230 170,180 C160,130 130,100 130,50 L150,50 C150,100 180,130 190,180 C200,230 170,250 180,300 Z" fill="#3498db"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#1e3c72"/>
      <!-- Deniz -->
      <rect x="0" y="150" width="300" height="150" fill="#4ca1af"/>
      <!-- Ay -->
      <circle cx="70" cy="70" r="30" fill="#ecf0f1"/>
      <!-- Ay gölgesi -->
      <circle cx="85" cy="65" r="25" fill="#1e3c72"/>
      <!-- Gemi -->
      <path d="M180,180 L220,180 L240,200 L160,200 Z" fill="#34495e"/>
      <rect x="190" y="160" width="10" height="20" fill="#7f8c8d"/>
      <rect x="200" y="150" width="2" height="30" fill="#7f8c8d"/>
      <!-- Dalgalar -->
      <path d="M20,210 Q35,200 50,210 Q65,220 80,210 Q95,200 110,210" stroke="#fff" fill="none" stroke-width="2"/>
      <path d="M220,230 Q235,220 250,230 Q265,240 280,230" stroke="#fff" fill="none" stroke-width="2"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#005C97"/>
      <!-- Gökyüzü gradyanı -->
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1CB5E0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000046;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="300" height="300" fill="url(#skyGradient)"/>
      <!-- Yıldızlar -->
      <circle cx="30" cy="30" r="1" fill="white"/>
      <circle cx="60" cy="50" r="1.5" fill="white"/>
      <circle cx="120" cy="40" r="1" fill="white"/>
      <circle cx="180" cy="20" r="2" fill="white"/>
      <circle cx="220" cy="60" r="1" fill="white"/>
      <circle cx="250" cy="30" r="1.5" fill="white"/>
      <circle cx="280" cy="70" r="1" fill="white"/>
      <!-- Dağlar -->
      <polygon points="0,200 50,120 100,180 150,80 180,150 220,90 250,150 300,110 300,300 0,300" fill="#001529"/>
      <!-- Orman -->
      <path d="M0,300 L0,220 C20,210 40,225 60,215 C80,205 100,220 120,210 C140,200 160,220 180,210 C200,200 220,215 240,205 C260,195 280,210 300,200 L300,300 Z" fill="#003300"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#FEE140"/>
      <!-- Arka plan gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FA709A;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FEE140;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="300" height="300" fill="url(#bgGradient)"/>
      <!-- Geometrik şekiller -->
      <circle cx="80" cy="80" r="30" fill="rgba(255,255,255,0.5)"/>
      <circle cx="110" cy="120" r="50" fill="rgba(255,255,255,0.3)"/>
      <circle cx="220" cy="150" r="60" fill="rgba(255,255,255,0.4)"/>
      <circle cx="180" cy="240" r="40" fill="rgba(255,255,255,0.5)"/>
      <circle cx="40" cy="200" r="25" fill="rgba(255,255,255,0.6)"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#3A1C71"/>
      <!-- Arkaplan gradient -->
      <defs>
        <linearGradient id="retroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3A1C71;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#D76D77;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFAF7B;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="300" height="300" fill="url(#retroGradient)"/>
      <!-- Retro Güneş -->
      <circle cx="150" cy="150" r="80" fill="none" stroke="#fff" stroke-width="5"/>
      <circle cx="150" cy="150" r="60" fill="none" stroke="#fff" stroke-width="5"/>
      <circle cx="150" cy="150" r="40" fill="none" stroke="#fff" stroke-width="5"/>
      <circle cx="150" cy="150" r="20" fill="#fff"/>
      <!-- Retro çizgiler -->
      <line x1="150" y1="0" x2="150" y2="70" stroke="#fff" stroke-width="5"/>
      <line x1="150" y1="230" x2="150" y2="300" stroke="#fff" stroke-width="5"/>
      <line x1="0" y1="150" x2="70" y2="150" stroke="#fff" stroke-width="5"/>
      <line x1="230" y1="150" x2="300" y2="150" stroke="#fff" stroke-width="5"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#000000"/>
      <!-- Gece gökyüzü -->
      <rect x="0" y="0" width="300" height="200" fill="#0D0221"/>
      <!-- Şehir silüeti -->
      <path d="M0,200 L20,200 L20,180 L40,180 L40,160 L50,160 L50,180 L60,180 L60,150 L70,150 L70,170 L80,170 L80,140 L100,140 L100,160 L120,160 L120,130 L140,130 L140,150 L150,150 L150,120 L160,120 L160,140 L180,140 L180,110 L200,110 L200,150 L210,150 L210,100 L220,100 L220,130 L240,130 L240,150 L260,150 L260,140 L280,140 L280,160 L300,160 L300,200 Z" fill="#353535"/>
      <!-- Pencere ışıkları -->
      <rect x="30" y="170" width="5" height="5" fill="#FFD700"/>
      <rect x="45" y="165" width="3" height="5" fill="#FFD700"/>
      <rect x="65" y="160" width="4" height="4" fill="#FFD700"/>
      <rect x="85" y="150" width="5" height="5" fill="#FFD700"/>
      <rect x="105" y="150" width="3" height="5" fill="#FFD700"/>
      <rect x="125" y="140" width="4" height="4" fill="#FFD700"/>
      <rect x="155" y="130" width="3" height="5" fill="#FFD700"/>
      <rect x="185" y="120" width="5" height="5" fill="#FFD700"/>
      <rect x="215" y="110" width="3" height="5" fill="#FFD700"/>
      <rect x="245" y="140" width="4" height="4" fill="#FFD700"/>
      <rect x="265" y="145" width="5" height="5" fill="#FFD700"/>
      <rect x="285" y="150" width="3" height="5" fill="#FFD700"/>
      <!-- Zemin -->
      <rect x="0" y="200" width="300" height="100" fill="#121212"/>
      <!-- Ay -->
      <circle cx="250" cy="50" r="20" fill="#fff"/>
      <circle cx="240" cy="45" r="15" fill="#0D0221"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#111111"/>
      <!-- Uzay arka planı -->
      <!-- Yıldızlar -->
      <circle cx="20" cy="40" r="1" fill="white"/>
      <circle cx="50" cy="70" r="1.5" fill="white"/>
      <circle cx="90" cy="30" r="1" fill="white"/>
      <circle cx="140" cy="90" r="1.2" fill="white"/>
      <circle cx="180" cy="40" r="0.8" fill="white"/>
      <circle cx="220" cy="80" r="1.3" fill="white"/>
      <circle cx="260" cy="20" r="1" fill="white"/>
      <circle cx="280" cy="60" r="1.5" fill="white"/>
      <circle cx="40" cy="120" r="1" fill="white"/>
      <circle cx="80" cy="180" r="1.2" fill="white"/>
      <circle cx="120" cy="220" r="0.8" fill="white"/>
      <circle cx="200" cy="170" r="1.3" fill="white"/>
      <circle cx="230" cy="250" r="1" fill="white"/>
      <circle cx="270" cy="210" r="1.5" fill="white"/>
      <!-- Gezegen -->
      <circle cx="150" cy="150" r="70" fill="#2980b9"/>
      <!-- Gezegen yüzeyi -->
      <path d="M100,120 Q130,90 170,100 Q210,110 230,140 Q250,170 220,210 Q190,250 150,240 Q110,230 90,190 Q70,150 100,120 Z" fill="#3498db"/>
      <!-- Kraterler -->
      <circle cx="120" cy="130" r="10" fill="#1a5276"/>
      <circle cx="190" cy="170" r="15" fill="#1a5276"/>
      <circle cx="140" cy="200" r="8" fill="#1a5276"/>
      <!-- Uydu -->
      <circle cx="80" cy="80" r="15" fill="#7f8c8d"/>
      <circle cx="85" cy="75" r="5" fill="#55555"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#f1c40f"/>
      <!-- Sarı Arka plan -->
      <!-- Emoji Yüz -->
      <circle cx="150" cy="150" r="100" fill="#f39c12"/>
      <!-- Gözler -->
      <ellipse cx="120" cy="120" rx="15" ry="20" fill="white"/>
      <ellipse cx="180" cy="120" rx="15" ry="20" fill="white"/>
      <circle cx="120" cy="120" r="7" fill="#2c3e50"/>
      <circle cx="180" cy="120" r="7" fill="#2c3e50"/>
      <!-- Gülümseyen Ağız -->
      <path d="M100,180 Q150,220 200,180" stroke="#2c3e50" stroke-width="8" fill="none"/>
    </svg>`,

    `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="300" fill="#2ecc71"/>
      <!-- Yeşil Arka plan -->

      <!-- Ağaç gövdesi -->
      <rect x="130" y="150" width="40" height="100" fill="#8B4513"/>

      <!-- Ağaç tacı -->
      <circle cx="150" cy="120" r="70" fill="#27ae60"/>
      <circle cx="110" cy="100" r="40" fill="#27ae60"/>
      <circle cx="190" cy="100" r="40" fill="#27ae60"/>
      <circle cx="150" cy="70" r="40" fill="#27ae60"/>

      <!-- Çiçekler -->
      <circle cx="100" cy="80" r="10" fill="#e74c3c"/>
      <circle cx="130" cy="50" r="8" fill="#f1c40f"/>
      <circle cx="170" cy="55" r="9" fill="#e74c3c"/>
      <circle cx="200" cy="85" r="7" fill="#f1c40f"/>
      <circle cx="210" cy="120" r="10" fill="#e74c3c"/>
      <circle cx="185" cy="150" r="8" fill="#f1c40f"/>
      <circle cx="115" cy="150" r="9" fill="#e74c3c"/>
      <circle cx="90" cy="120" r="7" fill="#f1c40f"/>

      <!-- Çimen -->
      <rect x="0" y="250" width="300" height="50" fill="#27ae60"/>
      <path d="M20,250 L30,230 L40,250" stroke="#27ae60" stroke-width="3" fill="none"/>
      <path d="M60,250 L70,235 L80,250" stroke="#27ae60" stroke-width="3" fill="none"/>
      <path d="M100,250 L110,230 L120,250" stroke="#27ae60" stroke-width="3" fill="none"/>
      <path d="M180,250 L190,235 L200,250" stroke="#27ae60" stroke-width="3" fill="none"/>
      <path d="M220,250 L230,230 L240,250" stroke="#27ae60" stroke-width="3" fill="none"/>
      <path d="M260,250 L270,235 L280,250" stroke="#27ae60" stroke-width="3" fill="none"/>
    </svg>`
  ];

  // Başarımlar
  const achievements = [
    { id: 'quick_solver', name: 'Hızlı Çözücü', condition: (state) => state.timeRemaining > 180 && state.difficulty === 'EASY' },
    { id: 'perfect_puzzle', name: 'Mükemmel Yapboz', condition: (state) => state.moves < state.grid.rows * state.grid.cols * 2 },
    { id: 'master_puzzler', name: 'Yapboz Ustası', condition: (state) => state.difficulty === 'HARD' && state.correctPlacements === state.grid.rows * state.grid.cols }
  ];

  // Oyunu başlat
  startGameButton.addEventListener('click', startGame);
  playAgainButton.addEventListener('click', resetGame);

  // Zorluk seviyesi ayarları
  levelButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Aktif sınıfı kaldır
      levelButtons.forEach(btn => btn.classList.remove('active'));
      // Seçilen düğmeye aktif sınıfı ekle
      button.classList.add('active');
      // Zorluğu ayarla
      gameState.difficulty = button.dataset.level;

      // Zorluk seviyesine göre ızgara boyutları ayarla
      // Cihaz genişliğini kontrol et
      const isMobile = window.innerWidth < 576;

      if (gameState.difficulty === 'EASY') {
        gameState.grid.rows = 3;
        gameState.grid.cols = 3;
      } else if (gameState.difficulty === 'MEDIUM') {
        gameState.grid.rows = 4;
        gameState.grid.cols = 4;
      } else if (gameState.difficulty === 'HARD') {
        // Mobil cihazlar için en zor seviyeyi azalt
        if (isMobile) {
          gameState.grid.rows = 4;
          gameState.grid.cols = 4;
        } else {
          gameState.grid.rows = 5;
          gameState.grid.cols = 5;
        }
      }
    });
  });

  // Ses ayarları
  soundToggle.addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggle.innerHTML = gameState.soundEnabled ? 
      '<i class="fas fa-volume-up"></i>' : 
      '<i class="fas fa-volume-mute"></i>';
    soundToggle.classList.toggle('active', gameState.soundEnabled);
  });

  // Duraklatma işlemleri
  pauseButton.addEventListener('click', togglePause);
  resumeButton.addEventListener('click', resumeGame);
  restartButton.addEventListener('click', resetGame);

  // Yapbozu karıştır
  shuffleButton.addEventListener('click', () => {
    if (!gameState.isPaused && gameState.isPlaying) {
      shufflePuzzle();
      gameState.moves += 3; // Karıştırma hamle sayısını artırır
      updateMovesDisplay();
    }
  });

  // Paylaşım butonları
  copyScoreButton.addEventListener('click', copyScore);
  shareScoreButton.addEventListener('click', shareScore);

  /**
   * Oyunu başlatır
   */
  function startGame() {
    // Giriş ekranını gizle, oyun ekranını göster
    introSection.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';

    // Oyun durumunu ayarla
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.moves = 0;
    gameState.correctPlacements = 0;
    gameState.bonusPoints = 0;
    gameState.achievements = [];

    // Cihaz genişliğini kontrol et
    const isMobile = window.innerWidth < 576;

    // Zorluğa göre ızgara boyutlarını ve süreyi ayarla
    if (gameState.difficulty === 'EASY') {
      gameState.grid.rows = 3;
      gameState.grid.cols = 3;
      gameState.timeRemaining = 300; // 5 dakika
    } else if (gameState.difficulty === 'MEDIUM') {
      gameState.grid.rows = 4;
      gameState.grid.cols = 4;
      gameState.timeRemaining = 450; // 7.5 dakika
      gameState.level = 2;
    } else if (gameState.difficulty === 'HARD') {
      // Mobil cihazlar için en zor seviyeyi azalt
      if (isMobile) {
        gameState.grid.rows = 4;
        gameState.grid.cols = 4;
      } else {
        gameState.grid.rows = 5;
        gameState.grid.cols = 5;
      }
      gameState.timeRemaining = 600; // 10 dakika
      gameState.level = 3;
    }

    updateLevelDisplay();
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();

    // Yapbozu oluştur
    createPuzzle();

    // Zamanlayıcıyı başlat
    startTimer();
  }

  /**
   * Zamanlayıcıyı başlatır
   */
  function startTimer() {
    clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
      if (!gameState.isPaused && gameState.isPlaying) {
        gameState.timeRemaining--;
        updateTimerDisplay();

        if (gameState.timeRemaining <= 0) {
          endGame(false);
        }
      }
    }, 1000);
  }

  /**
   * Yapbozu oluşturur
   */
  function createPuzzle() {
    // Rastgele bir görsel seç
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    const selectedImage = puzzleImages[randomIndex];

    // Referans görseli göster
    referenceImage.innerHTML = selectedImage;

    // Izgara boyutlarını ayarla - cihaz boyutuna göre optimize et
    puzzleGrid.style.gridTemplateRows = `repeat(${gameState.grid.rows}, 1fr)`;
    puzzleGrid.style.gridTemplateColumns = `repeat(${gameState.grid.cols}, 1fr)`;

    // Izgara içeriğini temizle
    puzzleGrid.innerHTML = '';

    // Yapboz parçalarını oluştur
    gameState.puzzlePieces = [];

    for (let i = 0; i < gameState.grid.rows; i++) {
      for (let j = 0; j < gameState.grid.cols; j++) {
        const piece = {
          id: i * gameState.grid.cols + j,
          correctRow: i,
          correctCol: j,
          currentRow: i,
          currentCol: j,
          isCorrect: false
        };

        gameState.puzzlePieces.push(piece);

        // Parça elementi oluştur
        const pieceElement = document.createElement('div');
        pieceElement.className = 'puzzle-piece';
        pieceElement.dataset.id = piece.id;

        // SVG'yi kırparak her parçaya uygun görseli yerleştir
        const svgClone = selectedImage.replace('<svg', `<svg data-id="${piece.id}"`);

        // Her bir parça için görünüm stilleri ekle
        const viewBox = `${j * 300 / gameState.grid.cols} ${i * 300 / gameState.grid.rows} ${300 / gameState.grid.cols} ${300 / gameState.grid.rows}`;
        pieceElement.innerHTML = svgClone.replace('viewBox="0 0 300 300"', `viewBox="${viewBox}"`);

        // SVG kenar çizgisini hafiflet
        const svgElement = pieceElement.querySelector('svg');
        if (svgElement) {
          svgElement.style.strokeWidth = '0.8'; // Daha ince kenar çizgisi
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
        }

        // Dokunmatik ve fare olaylarını ekle
        // Fare olayları
        pieceElement.draggable = true;
        pieceElement.addEventListener('dragstart', dragStart);
        pieceElement.addEventListener('dragover', dragOver);
        pieceElement.addEventListener('drop', drop);
        pieceElement.addEventListener('dragend', dragEnd);
        pieceElement.addEventListener('click', selectPiece);

        // Dokunmatik olaylar
        pieceElement.addEventListener('touchstart', dragStart);
        pieceElement.addEventListener('touchmove', function(e) {
          e.preventDefault(); // Sayfanın sürüklenmesini engelle
        });
        pieceElement.addEventListener('touchend', drop);

        puzzleGrid.appendChild(pieceElement);
      }
    }

    // Mobil cihazlar için grid boyutunu düşürme işlemi 
    // (Bu işlem zaten zorluk seçildiğinde yapılıyor, 
    // burada tekrar edilmesine gerek yok)

    // Parçaları karıştır
    shufflePuzzle();
  }

  /**
   * Yapboz parçalarını karıştırır
   */
  function shufflePuzzle() {
    const pieces = [...gameState.puzzlePieces];

    // Fisher-Yates algoritması ile karıştır
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Parçaların pozisyonunu değiştir
      [pieces[i].currentRow, pieces[j].currentRow] = [pieces[j].currentRow, pieces[i].currentRow];
      [pieces[i].currentCol, pieces[j].currentCol] = [pieces[j].currentCol, pieces[i].currentCol];
    }

    updatePuzzleDisplay();

    // Tüm parçalar için doğru yerleşim kontrolü
    pieces.forEach(piece => {
      piece.isCorrect = (piece.currentRow === piece.correctRow && piece.currentCol === piece.correctCol);
    });

    gameState.correctPlacements = pieces.filter(p => p.isCorrect).length;
  }

  /**
   * Sürükleme işlemi başlangıcı
   */
  function dragStart(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    // Dokunmatik cihazlar için kontrol
    const isTouchEvent = e.type === 'touchstart';
    const target = isTouchEvent ? 
      document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : 
      e.target;

    const pieceElement = target.closest('.puzzle-piece');
    if (!pieceElement) return;

    const pieceId = parseInt(pieceElement.dataset.id);
    gameState.selectedPiece = gameState.puzzlePieces.find(p => p.id === pieceId);

    // Seçilen parçaya stil ekle
    pieceElement.classList.add('selected');

    // Ses çal
    playSound('pickup');

    if (!isTouchEvent) {
      // Sürüklenen veriyi ayarla (mouse için)
      e.dataTransfer.setData('text/plain', pieceId);
      e.dataTransfer.effectAllowed = 'move';
    }

    // İçerik menüsünü engelle
    e.preventDefault();
  }

  /**
   * Sürükleme hedefi üzerinde olayı
   */
  function dragOver(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Parçayı bırakma olayı
   */
  function drop(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    e.preventDefault();

    // Dokunmatik cihazlar için kontrol
    let sourceId, targetElement;

    const isTouchEvent = e.type === 'touchend';

    if (isTouchEvent) {
      // Dokunmatik olayı: selectedPiece değerini kullan
      if (!gameState.selectedPiece) return;
      sourceId = gameState.selectedPiece.id;

      const touch = e.changedTouches[0];
      targetElement = document.elementFromPoint(touch.clientX, touch.clientY).closest('.puzzle-piece');
    } else {
      // Mouse olayı: dataTransfer'dan al
      sourceId = parseInt(e.dataTransfer.getData('text/plain'));
      targetElement = e.target.closest('.puzzle-piece');
    }

    if (!targetElement) return;

    const targetId = parseInt(targetElement.dataset.id);

    // Aynı parça değilse değiştir
    if (sourceId !== targetId) {
      swapPieces(sourceId, targetId);
      gameState.moves++;
      updateMovesDisplay();

      // Ses çal
      playSound('place');
    }
  }

  /**
   * Sürükleme işlemi sonu
   */
  function dragEnd(e) {
    // Seçili stil sınıfını kaldır
    document.querySelectorAll('.puzzle-piece').forEach(el => {
      el.classList.remove('selected');
    });

    gameState.selectedPiece = null;
  }

  /**
   * Tıklama ile parça seçimi
   */
  function selectPiece(e) {
    if (gameState.isPaused || !gameState.isPlaying) return;

    // Dokunmatik cihazlar için kontrol
    const isTouchEvent = e.type.startsWith('touch');
    const target = isTouchEvent ? 
      document.elementFromPoint(
        e.touches ? e.touches[0].clientX : e.changedTouches[0].clientX, 
        e.touches ? e.touches[0].clientY : e.changedTouches[0].clientY
      ) : 
      e.target;

    const pieceElement = target.closest('.puzzle-piece');
    if (!pieceElement) return;

    const pieceId = parseInt(pieceElement.dataset.id);

    // Eğer zaten seçili bir parça varsa
    if (gameState.selectedPiece !== null) {
      const selectedId = gameState.selectedPiece.id;

      // Farklı bir parçaya tıklandıysa değiştir
      if (selectedId !== pieceId) {
        swapPieces(selectedId, pieceId);
        gameState.moves++;
        updateMovesDisplay();

        // Ses çal
        playSound('place');
      }

      // Seçimleri temizle
      document.querySelectorAll('.puzzle-piece').forEach(el => {
        el.classList.remove('selected');
      });

      gameState.selectedPiece = null;
    } else {
      // İlk seçim
      gameState.selectedPiece = gameState.puzzlePieces.find(p => p.id === pieceId);
      pieceElement.classList.add('selected');

      // Ses çal
      playSound('pickup');
    }

    // İçerik menüsünü engelle
    e.preventDefault();
  }

  /**
   * İki parçanın yerini değiştirir
   */
  function swapPieces(sourceId, targetId) {
    const sourcePiece = gameState.puzzlePieces.find(p => p.id === sourceId);
    const targetPiece = gameState.puzzlePieces.find(p => p.id === targetId);

    // Geçici değişkenler ile değiştir
    const tempRow = sourcePiece.currentRow;
    const tempCol = sourcePiece.currentCol;

    sourcePiece.currentRow = targetPiece.currentRow;
    sourcePiece.currentCol = targetPiece.currentCol;

    targetPiece.currentRow = tempRow;
    targetPiece.currentCol = tempCol;

    // Doğru yerleşim kontrolü
    sourcePiece.isCorrect = (sourcePiece.currentRow === sourcePiece.correctRow && sourcePiece.currentCol === sourcePiece.correctCol);
    targetPiece.isCorrect = (targetPiece.currentRow === targetPiece.correctRow && targetPiece.currentCol === targetPiece.correctCol);

    // Doğru yerleşim sayısını güncelle
    gameState.correctPlacements = gameState.puzzlePieces.filter(p => p.isCorrect).length;

    // Puan ekle
    if (sourcePiece.isCorrect) {
      gameState.score += 10;
      gameState.bonusPoints += 5;
    }

    if (targetPiece.isCorrect) {
      gameState.score += 10;
      gameState.bonusPoints += 5;
    }

    updateScoreDisplay();
    updatePuzzleDisplay();

    // Yapboz tamamlandı mı kontrol et
    if (gameState.correctPlacements === gameState.grid.rows * gameState.grid.cols) {
      // Kısa bir gecikme ile oyunu bitir
      setTimeout(() => {
        endGame(true);
      }, 300);
    }
  }

  /**
   * Yapboz görünümünü günceller
   */
  function updatePuzzleDisplay() {
    const pieces = document.querySelectorAll('.puzzle-piece');

    gameState.puzzlePieces.forEach(piece => {
      const pieceElement = document.querySelector(`.puzzle-piece[data-id="${piece.id}"]`);

      if (pieceElement) {
        // Grid pozisyonunu ayarla
        pieceElement.style.gridRow = piece.currentRow + 1;
        pieceElement.style.gridColumn = piece.currentCol + 1;

        // Doğru yerleşim durumuna göre stil ekle/kaldır
        pieceElement.classList.toggle('correct', piece.isCorrect);
      }
    });
  }

  /**
   * Puan göstergesini günceller
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }

  /**
   * Hamle göstergesini günceller
   */
  function updateMovesDisplay() {
    movesDisplay.textContent = gameState.moves;
  }

  /**
   * Seviye göstergesini günceller
   */
  function updateLevelDisplay() {
    levelDisplay.textContent = gameState.level;
  }

  /**
   * Zamanlayıcı göstergesini günceller
   */
  function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Oyunu duraklatır veya devam ettirir
   */
  function togglePause() {
    if (!gameState.isPlaying) return;

    gameState.isPaused = !gameState.isPaused;
    pauseOverlay.style.display = gameState.isPaused ? 'flex' : 'none';
  }

  /**
   * Oyunu devam ettirir
   */
  function resumeGame() {
    if (!gameState.isPlaying) return;

    gameState.isPaused = false;
    pauseOverlay.style.display = 'none';
  }

  /**
   * Oyunu sıfırlar
   */
  function resetGame() {
    // Öncelikle zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);

    // Ekranları sıfırla
    introSection.style.display = 'block';
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';

    // Oyun durumunu sıfırla
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.moves = 0;
    gameState.timeRemaining = 300;
    gameState.correctPlacements = 0;
    gameState.bonusPoints = 0;
    gameState.achievements = [];

    // Görünümü güncelle
    updateScoreDisplay();
    updateMovesDisplay();
    updateTimerDisplay();
  }

  /**
   * Oyunu sonlandırır
   */
  function endGame(completed) {
    // Zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);

    // Oyun durumunu güncelle
    gameState.isPlaying = false;

    // Son puan hesaplama
    if (completed) {
      // Kalan süre bonusu
      const timeBonus = Math.floor(gameState.timeRemaining / 10);
      gameState.score += timeBonus;

      // Hamle verimliliği bonusu
      const efficiencyBonus = Math.max(0, 100 - Math.floor(gameState.moves / (gameState.grid.rows * gameState.grid.cols) * 10));
      gameState.score += efficiencyBonus;

      // Zorluk seviyesi bonusu
      if (gameState.difficulty === 'MEDIUM') {
        gameState.score = Math.floor(gameState.score * 1.5);
      } else if (gameState.difficulty === 'HARD') {
        gameState.score = Math.floor(gameState.score * 2);
      }

      // Başarımları kontrol et
      checkAchievements();

      // Başarım tamamlanmasını ses ile bildir
      playSound('complete');
    }

    // Sonuç ekranını güncelle
    finalScore.textContent = gameState.score;

    const minutes = Math.floor((300 - gameState.timeRemaining) / 60);
    const seconds = (300 - gameState.timeRemaining) % 60;
    finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    finalMoves.textContent = gameState.moves;

    // Derecelendirmeyi hesapla
    const rating = calculateRating();
    updateRatingDisplay(rating);

    // Başarım varsa göster
    if (gameState.achievements.length > 0) {
      const achievement = gameState.achievements[0];
      document.getElementById('puzzle-achievement').style.display = 'flex';
      document.getElementById('achievement-name').textContent = achievement.name;
    } else {
      document.getElementById('puzzle-achievement').style.display = 'none';
    }

    // Oyun sonucu ekranını göster
    gameContainer.style.display = 'none';
    gameOverContainer.style.display = 'block';

    // Skoru API'ye kaydet
    if (completed) {
      saveScore();
    }
  }

  /**
   * Oyun puanını hesaplar ve API'ye kaydeder
   */
  function saveScore() {
    // Zorluk seviyesini belirle
    const difficulty = gameState.difficulty.toLowerCase();
    
    // Toplam parça sayısı
    const totalPieces = gameState.grid.rows * gameState.grid.cols;
    // Harcanan süre
    const timeSpent = 300 - gameState.timeRemaining;
    // Optimal süre (zorluk seviyesine göre)
    const optimalTime = 60 + (totalPieces * 5);
    // Toplam ve doğru hamle sayısı
    const totalMoves = gameState.moves;
    const correctMoves = gameState.correctPlacements;
    // Hatalı hamle sayısı
    const wrongMoves = Math.max(0, totalMoves - correctMoves);
    // Kullanılan ipucu sayısı tahmini
    const hintsUsed = gameState.bonusPoints > 0 ? Math.floor(gameState.bonusPoints / 5) : 0;
    
    // Standardize edilmiş puan hesaplama sistemi için parametreler
    const scoreParams = {
      gameType: 'puzzle',
      difficulty: difficulty,
      timeSpent: timeSpent,
      optimalTime: optimalTime,
      totalMoves: totalMoves,
      correctMoves: correctMoves,
      hintsUsed: hintsUsed,
      level: gameState.level,
      maxLevel: 1, // Yapboz oyunu seviye içermiyor, tek seviyeli
      gameSpecificStats: {
        completed: gameState.correctPlacements === totalPieces,
        pieces: totalPieces,
        wrongMoves: wrongMoves,
        bonusPoints: gameState.bonusPoints,
        gridSize: gameState.grid.rows + 'x' + gameState.grid.cols
      }
    };
    
    // Puan hesaplama sistemini kullan
    let scoreDetails = { finalScore: 0, breakdown: {} };
    
    // Eğer global ScoreCalculator mevcutsa kullan, değilse kendi hesaplamamızı yapalım
    if (window.ScoreCalculator && typeof window.ScoreCalculator.calculate === 'function') {
      scoreDetails = window.ScoreCalculator.calculate(scoreParams);
      console.log("Standartlaştırılmış yapboz puanı hesaplandı:", scoreDetails);
    } else {
      // Geriye dönük uyumluluk için eski puan hesaplamayı da tutalım
      const finalScore = calculateRealScore();
      scoreDetails.finalScore = finalScore;
      console.log("Yapboz puanı hesaplandı (eski sistem):", finalScore);
    }
    
    // Oyun istatistiklerini hazırla (geriye dönük uyumluluk için eski formatı koruyoruz)
    const gameStats = {
      moves: gameState.moves,
      wrong_moves: wrongMoves,
      time_spent: timeSpent,
      hints_used: hintsUsed,
      level: gameState.level,
      grid_size: gameState.grid.rows + 'x' + gameState.grid.cols,
      completion_time: timeSpent,
      scoreBreakdown: scoreDetails.breakdown
    };

    // Oyun tamamlandı eventi oluştur
    const gameCompletedEvent = new CustomEvent('gameCompleted', {
      detail: {
        gameType: 'puzzle',
        score: scoreDetails.finalScore,
        difficulty: difficulty,
        playtime: timeSpent,
        stats: gameStats
      }
    });
    
    // Eventi dağıt
    document.dispatchEvent(gameCompletedEvent);
    
    // Puan gösterimi ve kaydetme (geriye dönük uyumluluk için)
    saveScoreAndDisplay('puzzle', scoreDetails.finalScore, timeSpent, difficulty, gameStats, function(html) {
      // Puan gösterimi kaldırıldı - sadece kaydetme işlemi yapılıyor
      console.log('Score saved successfully');
    });
  }

  // Gerçekçi puan hesaplama sistemi (10-100 arası)
  function calculateRealScore() {
    // Temel parametreler
    const totalPieces = gameState.grid.rows * gameState.grid.cols;
    const optimalMoves = totalPieces * 1.5; // Optimal hamle sayısı
    const optimalTime = 60 + (totalPieces * 5); // Zorluk seviyesine göre optimal süre (saniye)
    const timeSpent = 300 - gameState.timeRemaining; // Harcanan süre
    const hintsUsed = gameState.bonusPoints > 0 ? Math.floor(gameState.bonusPoints / 5) : 0; // Kullanılan ipucu tahmini

    // Temel puan - oyun zorluğuna göre
    let baseScore;
    if (gameState.difficulty === 'EASY') {
      baseScore = 60;
    } else if (gameState.difficulty === 'MEDIUM') {
      baseScore = 75;
    } else { // HARD
      baseScore = 90;
    }

    // Hamle verimliliği puanı (maksimum 30 puan)
    let moveEfficiencyScore = 30;
    if (gameState.moves > optimalMoves) {
      // Optimal hamle sayısını aşınca puanı azalt
      moveEfficiencyScore = Math.max(0, moveEfficiencyScore - ((gameState.moves - optimalMoves) / optimalMoves) * 30);
    }

    // Zaman verimliliği puanı (maksimum 30 puan)
    let timeEfficiencyScore = 30;
    if (timeSpent > optimalTime) {
      // Optimal süreyi aşınca puanı azalt
      timeEfficiencyScore = Math.max(0, timeEfficiencyScore - ((timeSpent - optimalTime) / optimalTime) * 30);
    }

    // İpucu cezası (her ipucu 5 puan düşürür)
    const hintPenalty = hintsUsed * 5;

    // Yanlış hamlelerin cezası (maksimum 15 puan)
    const wrongMoves = Math.max(0, gameState.moves - gameState.correctPlacements);
    const wrongMovePenalty = Math.min(15, wrongMoves * 1.5);

    // Toplam puanı hesapla
    let finalScore = baseScore + moveEfficiencyScore + timeEfficiencyScore - hintPenalty - wrongMovePenalty;

    // Puanı 10-100 aralığına sınırla
    finalScore = Math.max(10, Math.min(100, Math.round(finalScore)));

    // Sonuç ekranı için puanı kaydet
    gameState.finalCalculatedScore = finalScore;

    return finalScore;
  }

  /**
   * Oyun performansını derecelendirir
   */
  function calculateRating() {
    // Tamamlanan oyunlar için
    if (gameState.correctPlacements === gameState.grid.rows * gameState.grid.cols) {
      // Zorluğa ve hamle verimliliğine göre derecelendirme
      const totalPieces = gameState.grid.rows * gameState.grid.cols;
      const optimalMoves = totalPieces * 1.5; // Optimal hamle sayısı tahmini

      if (gameState.moves <= optimalMoves) {
        return 5; // Mükemmel
      } else if (gameState.moves <= optimalMoves * 1.5) {
        return 4; // Çok iyi
      } else if (gameState.moves <= optimalMoves * 2) {
        return 3; // İyi
      } else {
        return 2; // Ortalama
      }
    }

    // Tamamlanmayan oyunlar için
    return Math.max(1, Math.floor(gameState.correctPlacements / (gameState.grid.rows * gameState.grid.cols) * 5));
  }

  /**
   * Derecelendirme göstergesini günceller
   */
  function updateRatingDisplay(rating) {
    // Yıldız simgelerini güncelle
    const stars = ratingStars.querySelectorAll('i');

    for (let i = 0; i < stars.length; i++) {
      if (i < rating) {
        stars[i].className = 'fas fa-star';
      } else {
        stars[i].className = 'far fa-star';
      }
    }

    // Derecelendirme metnini güncelle
    const ratingTexts = ['Zayıf', 'Normal', 'İyi', 'Çok İyi', 'Harika!'];
    ratingText.textContent = ratingTexts[Math.max(0, rating - 1)];
  }

  /**
   * Başarımları kontrol eder
   */
  function checkAchievements() {
    achievements.forEach(achievement => {
      if (achievement.condition(gameState)) {
        gameState.achievements.push(achievement);
      }
    });
  }

  /**
   * Skoru panoya kopyalar
   */
  function copyScore() {
    const scoreText = `Yapboz Oyunu: ${gameState.score} puan, ${gameState.moves} hamle, Zorluk: ${gameState.difficulty} 🧩`;

    navigator.clipboard.writeText(scoreText)
      .then(() => {
        showAlert('Skor kopyalandı!', 'success');
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
        showAlert('Kopyalama başarısız!', 'error');
      });
  }

  /**
   * Skoru paylaşır (Web Share API)
   */
  function shareScore() {
    const scoreText = `Yapboz Oyunu: ${gameState.score} puan, ${gameState.moves} hamle, Zorluk: ${gameState.difficulty} 🧩`;

    if (navigator.share) {
      navigator.share({
        title: 'Beyin Geliştirme Oyunu Skorum',
        text: scoreText,
        url: window.location.href
      })
      .then(() => console.log('Paylaşım başarılı'))
      .catch(error => console.log('Paylaşım hatası:', error));
    } else {
      copyScore();
    }
  }

  /**
   * Bildirim gösterir
   */
  function showAlert(message, type = 'info') {
    alertContainer.innerHTML = `
      <div class="alert-message ${type}">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    alertContainer.style.display = 'block';

    // 3 saniye sonra gizle
    setTimeout(() => {
      alertContainer.style.display = 'none';
    }, 3000);
  }

  /**
   * Ses çalar
   */
  function playSound(soundName) {
    if (gameState.soundEnabled) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play();
    }
  }

  // Puan kaydetme fonksiyonu (ScoreHandler veya API kullanımı)
  function saveScoreAndDisplay(gameType, score, time, difficulty, gameStats = {}, callback) {
    try {
      console.log(`Saving score for ${gameType}: ${score} points, difficulty: ${difficulty}`);

      // Global saveScoreAndDisplay fonksiyonu varsa kullan
      if (typeof window.saveScoreAndDisplay === 'function' && window.saveScoreAndDisplay !== saveScoreAndDisplay) {
        window.saveScoreAndDisplay(gameType, score, time, difficulty, gameStats, callback);
        return;
      }

      // ScoreHandler mevcutsa kullan
      if (typeof window.ScoreHandler !== 'undefined' && typeof window.ScoreHandler.saveScore === 'function') {
        window.ScoreHandler.saveScore(gameType, score, difficulty, time, gameStats)
          .then(data => {
            if (typeof callback === 'function') {
              let scoreHtml = '';

              // Skor özeti HTML'i oluştur
              if (data.success) {
                scoreHtml = `
                  <div class="score-summary">
                    <h3>Skor Özeti</h3>
                    <div class="score-detail">
                      <span>Temel Puan:</span>
                      <span>${data.points?.rewards?.base_points || score}</span>
                    </div>
                    <div class="score-detail">
                      <span>Zorluk Çarpanı:</span>
                      <span>x${data.points?.rewards?.difficulty_multiplier || (window.ScoreHandler?.getDifficultyMultiplier ? window.ScoreHandler.getDifficultyMultiplier(difficulty) : 1)}</span>
                    </div>
                    <div class="score-detail total">
                      <span>Toplam:</span>
                      <span>${data.points?.total || score} puan</span>
                    </div>
                  </div>
                `;
              } else if (data.guest) {
                scoreHtml = `
                  <div class="score-summary guest">
                    <h3>Giriş Yapmalısınız</h3>
                    <p>Skorunuzu kaydetmek ve liderlik tablosunda yer almak için giriş yapın.</p>
                    <a href="/login?redirect=${encodeURIComponent(window.location.pathname)}" class="btn btn-primary">Giriş Yap</a>
                  </div>
                `;
              }

              callback(scoreHtml, data);
            }
          })
          .catch(error => {
            console.error("Score saving error:", error);
            if (typeof callback === 'function') {
              callback('', { success: false, error: error.message });
            }
          });
      } else {
        // Yoksa doğrudan API'ye gönder
        fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_type: gameType,
            score: score,
            difficulty: difficulty,
            playtime: time,
            game_stats: gameStats
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log("Score saved:", data);
          if (typeof callback === 'function') {
            let scoreHtml = data.success ? 
              `<div class="score-summary"><p>Skor başarıyla kaydedildi.</p></div>` : 
              `<div class="score-summary"><p>Skor kaydedilirken bir sorun oluştu.</p></div>`;
            callback(scoreHtml, data);
          }
        })
        .catch(error => {
          console.error('Skor kaydetme hatası:', error);
          if (typeof callback === 'function') {
            callback('<p>Skor kaydedilemedi.</p>', { success: false, error: error.message });
          }
        });
      }
    } catch (e) {
      console.error("saveScoreAndDisplay fonksiyonunda hata:", e);
      if (typeof callback === 'function') {
        callback('<p>Skor kaydedilemedi.</p>', { success: false, error: e.message });
      }
    }
  }
});