/**
 * 3D Labirent Oyunu - 1.0
 * 
 * Three.js ile geliştirilmiş gerçekçi, 3D labirent deneyimi sunan oyun.
 * 
 * Özellikler:
 * - First-person perspektifiyle 3D labirentte gezinme
 * - Dinamik olarak oluşturulan labirentler
 * - Gerçekçi ışıklandırma ve gölgeler
 * - Mini-harita ile konumunu takip etme
 * - Zamanla yarışma ve puan toplama
 * - Çeşitli zorluk seviyeleri
 * - Responsive tasarım ve mobil kontroller
 */

document.addEventListener('DOMContentLoaded', function() {
  // Sabit ve yapılandırma
  const CELL_SIZE = 10;
  const WALL_HEIGHT = 8;
  const PLAYER_HEIGHT = 4;
  const PLAYER_SPEED = 0.15;
  const PLAYER_TURN_SPEED = 0.04;
  const COLLECTIBLE_ROTATE_SPEED = 0.02;
  const COLLECTIBLE_HOVER_AMPLITUDE = 0.3;
  const COLLECTIBLE_HOVER_SPEED = 0.01;
  
  // Oyun durumu
  let gameState = {
    isPlaying: false,
    isPaused: false,
    difficulty: 'easy',
    level: 1,
    score: 0,
    timer: 0,
    timerInterval: null,
    maze: null,
    playerPosition: { x: 0, y: 0 },
    playerRotation: 0,
    collectibles: [],
    collected: 0,
    totalCollectibles: 0,
    soundEnabled: true
  };
  
  // Three.js değişkenleri
  let scene, camera, renderer, controls;
  let playerLight;
  let minimapCanvas, minimapContext;
  let keyboard = {};
  let isMobile = window.innerWidth <= 768;
  
  // DOM elementleri
  const gameContainer = document.getElementById('game-container');
  const gameMenu = document.getElementById('game-menu');
  const levelCompleteScreen = document.getElementById('level-complete');
  const gameOverScreen = document.getElementById('game-over');
  const instructionsScreen = document.getElementById('instructions');
  const levelDisplay = document.getElementById('level-display');
  const timeDisplay = document.getElementById('time-display');
  const scoreDisplay = document.getElementById('score-display');
  const itemsDisplay = document.getElementById('items-display');
  
  // Ses efektleri
  const sounds = {
    collect: new Audio('/static/sounds/collect.mp3'),
    complete: new Audio('/static/sounds/complete.mp3'),
    move: new Audio('/static/sounds/move.mp3'),
    gameOver: new Audio('/static/sounds/gameover.mp3')
  };
  
  // Oyunu başlat
  initEventListeners();
  setupDifficulty();
  showGameMenu();
  
  // Event listener'ları başlat
  function initEventListeners() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
    // Menü butonları
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('how-to-play').addEventListener('click', showInstructions);
    document.getElementById('return-home').addEventListener('click', () => { window.location.href = '/'; });
    document.getElementById('close-instructions').addEventListener('click', hideInstructions);
    document.getElementById('toggle-menu').addEventListener('click', togglePause);
    document.getElementById('toggle-sound').addEventListener('click', toggleSound);
    
    // Level tamamlama butonları
    document.getElementById('next-level').addEventListener('click', nextLevel);
    document.getElementById('replay-level').addEventListener('click', restartLevel);
    document.getElementById('exit-to-menu').addEventListener('click', showGameMenu);
    
    // Game over butonları
    document.getElementById('play-again').addEventListener('click', resetGame);
    document.getElementById('exit-game').addEventListener('click', showGameMenu);
    
    // Zorluk seçenekleri
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', () => {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        gameState.difficulty = button.getAttribute('data-difficulty');
      });
    });
    
    // Mobil kontroller
    if (isMobile) {
      document.getElementById('mobile-forward').addEventListener('touchstart', () => { keyboard[87] = true; });
      document.getElementById('mobile-forward').addEventListener('touchend', () => { keyboard[87] = false; });
      document.getElementById('mobile-backward').addEventListener('touchstart', () => { keyboard[83] = true; });
      document.getElementById('mobile-backward').addEventListener('touchend', () => { keyboard[83] = false; });
      document.getElementById('mobile-left').addEventListener('touchstart', () => { keyboard[65] = true; });
      document.getElementById('mobile-left').addEventListener('touchend', () => { keyboard[65] = false; });
      document.getElementById('mobile-right').addEventListener('touchstart', () => { keyboard[68] = true; });
      document.getElementById('mobile-right').addEventListener('touchend', () => { keyboard[68] = false; });
    }
  }
  
  // Zorluk seviyesi ayarı
  function setupDifficulty() {
    const difficultyMap = {
      'easy': { size: 11, collectibles: 5, timeLimit: 180 },
      'medium': { size: 15, collectibles: 8, timeLimit: 240 },
      'hard': { size: 21, collectibles: 12, timeLimit: 300 }
    };
    
    gameState.difficultySettings = difficultyMap;
  }
  
  // Three.js ortamını başlat
  function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f1a);
    scene.fog = new THREE.FogExp2(0x0f0f1a, 0.02);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameContainer.innerHTML = '';
    gameContainer.appendChild(renderer.domElement);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);
    
    // Player point light
    playerLight = new THREE.PointLight(0xccccff, 1, 30);
    playerLight.position.set(0, PLAYER_HEIGHT, 0);
    playerLight.castShadow = true;
    playerLight.shadow.mapSize.width = 512;
    playerLight.shadow.mapSize.height = 512;
    scene.add(playerLight);
    
    // Minimap canvas
    minimapCanvas = document.getElementById('minimap');
    minimapContext = minimapCanvas.getContext('2d');
    
    // Window resize handler
    onWindowResize();
  }
  
  // Pencere boyutu değişimini ele al
  function onWindowResize() {
    if (!camera) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Minimap canvas'ını yeniden boyutlandır
    const minimapSize = Math.min(150, window.innerWidth * 0.2);
    minimapCanvas.width = minimapSize;
    minimapCanvas.height = minimapSize;
    
    // Mobil kontrolü güncelle
    isMobile = window.innerWidth <= 768;
  }
  
  // Keyboard olaylarını yakala
  function onKeyDown(event) {
    keyboard[event.keyCode] = true;
  }
  
  function onKeyUp(event) {
    keyboard[event.keyCode] = false;
  }
  
  // Yeni oyun başlat
  function startGame() {
    hideGameMenu();
    initThreeJS();
    resetGame();
    generateMaze();
    buildMaze3D();
    positionPlayerAtStart();
    addCollectibles();
    updateUI();
    startTimer();
    gameState.isPlaying = true;
    animate();
  }
  
  // Oyun menüsünü göster/gizle
  function showGameMenu() {
    pauseGame();
    gameMenu.classList.remove('hidden');
    levelCompleteScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    instructionsScreen.classList.add('hidden');
  }
  
  function hideGameMenu() {
    gameMenu.classList.add('hidden');
  }
  
  // Talimatları göster/gizle
  function showInstructions() {
    gameMenu.classList.add('hidden');
    instructionsScreen.classList.remove('hidden');
  }
  
  function hideInstructions() {
    instructionsScreen.classList.add('hidden');
    gameMenu.classList.remove('hidden');
  }
  
  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (!gameState.isPlaying) return;
    
    if (gameState.isPaused) {
      gameMenu.classList.add('hidden');
      gameState.isPaused = false;
      startTimer();
    } else {
      pauseGame();
      gameMenu.classList.remove('hidden');
    }
  }
  
  function pauseGame() {
    gameState.isPaused = true;
    clearInterval(gameState.timerInterval);
  }
  
  // Sesi aç/kapat
  function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundIcon = document.querySelector('#toggle-sound i');
    if (gameState.soundEnabled) {
      soundIcon.className = 'fas fa-volume-up';
    } else {
      soundIcon.className = 'fas fa-volume-mute';
    }
  }
  
  // Ses çal
  function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    
    try {
      const sound = sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }
  
  // Labirent oluştur
  function generateMaze() {
    const settings = gameState.difficultySettings[gameState.difficulty];
    const size = settings.size + (gameState.level - 1) * 2;
    const width = size;
    const height = size;
    
    // Boş labirent oluştur
    const maze = Array(height).fill().map(() => Array(width).fill(1));
    
    // Yol açma algoritması
    const carvePassages = (x, y, maze) => {
      // Yönleri karıştır
      const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]].sort(() => Math.random() - 0.5);
      
      // Her yönde gezin
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Sınırları kontrol et
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
          // Duvarı yık
          maze[y + dy/2][x + dx/2] = 0;
          maze[ny][nx] = 0;
          carvePassages(nx, ny, maze);
        }
      }
    };
    
    // Başlangıç noktası
    const startX = 1;
    const startY = 1;
    maze[startY][startX] = 0;
    
    // Labirenti oluştur
    carvePassages(startX, startY, maze);
    
    // Bitiş noktası oluştur (sağ alt köşeden başla ve en yakın yolu bul)
    let endX = width - 2;
    let endY = height - 2;
    
    // Eğer son hücre duvarsa, açık bir hücre bul
    if (maze[endY][endX] === 1) {
      let found = false;
      for (let y = height - 2; y > 0 && !found; y--) {
        for (let x = width - 2; x > 0 && !found; x--) {
          if (maze[y][x] === 0) {
            endX = x;
            endY = y;
            found = true;
          }
        }
      }
    }
    
    // Başlangıç ve bitiş noktalarını kaydet
    gameState.maze = maze;
    gameState.startPoint = { x: startX, y: startY };
    gameState.endPoint = { x: endX, y: endY };
    
    return maze;
  }
  
  // 3D labirenti oluştur
  function buildMaze3D() {
    const maze = gameState.maze;
    const height = maze.length;
    const width = maze[0].length;
    
    // Zemin
    const floorGeometry = new THREE.PlaneGeometry(width * CELL_SIZE, height * CELL_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333366,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((width * CELL_SIZE) / 2 - CELL_SIZE / 2, 0, (height * CELL_SIZE) / 2 - CELL_SIZE / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Tavan
    const ceilingGeometry = new THREE.PlaneGeometry(width * CELL_SIZE, height * CELL_SIZE);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222244,
      roughness: 0.9,
      metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set((width * CELL_SIZE) / 2 - CELL_SIZE / 2, WALL_HEIGHT, (height * CELL_SIZE) / 2 - CELL_SIZE / 2);
    scene.add(ceiling);
    
    // Duvar geometrisi ve materyali
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6a5ae0,
      roughness: 0.7,
      metalness: 0.3
    });
    
    // Bitiş noktası materyali
    const exitMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff88,
      roughness: 0.5,
      metalness: 0.5,
      emissive: 0x00aa44,
      emissiveIntensity: 0.5
    });
    
    // Duvarları oluştur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (maze[y][x] === 1) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(x * CELL_SIZE, WALL_HEIGHT/2, y * CELL_SIZE);
          wall.castShadow = true;
          wall.receiveShadow = true;
          scene.add(wall);
        }
        
        // Bitiş noktasını işaretle
        if (x === gameState.endPoint.x && y === gameState.endPoint.y) {
          const exitMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(CELL_SIZE/3, CELL_SIZE/3, WALL_HEIGHT, 16),
            exitMaterial
          );
          exitMarker.position.set(x * CELL_SIZE, WALL_HEIGHT/2, y * CELL_SIZE);
          exitMarker.userData = { isExit: true };
          scene.add(exitMarker);
        }
      }
    }
  }
  
  // Oyuncuyu başlangıç noktasına yerleştir
  function positionPlayerAtStart() {
    const startPoint = gameState.startPoint;
    gameState.playerPosition = { 
      x: startPoint.x * CELL_SIZE, 
      z: startPoint.y * CELL_SIZE 
    };
    camera.position.x = gameState.playerPosition.x;
    camera.position.z = gameState.playerPosition.z;
    camera.position.y = PLAYER_HEIGHT;
    
    // Başlangıçta rastgele bir yöne bak
    gameState.playerRotation = Math.random() * Math.PI * 2;
    camera.rotation.y = gameState.playerRotation;
  }
  
  // Toplanabilir eşyaları ekle
  function addCollectibles() {
    const maze = gameState.maze;
    const height = maze.length;
    const width = maze[0].length;
    const settings = gameState.difficultySettings[gameState.difficulty];
    const collectibleCount = settings.collectibles + (gameState.level - 1) * 2;
    gameState.totalCollectibles = collectibleCount;
    gameState.collected = 0;
    
    // Eşya materyali
    const collectibleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5
    });
    
    // Kullanılabilir pozisyonları bul (duvar olmayan yerler ve başlangıç/bitiş noktaları hariç)
    const availablePositions = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (maze[y][x] === 0 && 
            !(x === gameState.startPoint.x && y === gameState.startPoint.y) &&
            !(x === gameState.endPoint.x && y === gameState.endPoint.y)) {
          availablePositions.push({ x, y });
        }
      }
    }
    
    // Pozisyonları karıştır ve gerekli sayıda seç
    shuffleArray(availablePositions);
    const selectedPositions = availablePositions.slice(0, collectibleCount);
    
    // Eşyaları oluştur
    gameState.collectibles = [];
    selectedPositions.forEach(pos => {
      // Farklı şekillerde eşyalar
      let geometry;
      const type = Math.floor(Math.random() * 4);
      switch (type) {
        case 0:
          geometry = new THREE.TetrahedronGeometry(CELL_SIZE/4);
          break;
        case 1:
          geometry = new THREE.OctahedronGeometry(CELL_SIZE/4);
          break;
        case 2:
          geometry = new THREE.IcosahedronGeometry(CELL_SIZE/4);
          break;
        default:
          geometry = new THREE.SphereGeometry(CELL_SIZE/4);
      }
      
      const collectible = new THREE.Mesh(geometry, collectibleMaterial);
      collectible.position.set(
        pos.x * CELL_SIZE,
        PLAYER_HEIGHT / 2,
        pos.y * CELL_SIZE
      );
      collectible.castShadow = true;
      collectible.userData = { 
        isCollectible: true, 
        gridX: pos.x, 
        gridY: pos.y,
        originalY: PLAYER_HEIGHT / 2,
        phase: Math.random() * Math.PI * 2 // Rastgele başlangıç fazı
      };
      
      scene.add(collectible);
      gameState.collectibles.push(collectible);
    });
  }
  
  // Ana animasyon döngüsü
  function animate() {
    if (!gameState.isPlaying) return;
    
    requestAnimationFrame(animate);
    
    if (!gameState.isPaused) {
      updatePlayerMovement();
      updateCollectibles();
      updatePlayerLight();
      checkCollisions();
      updateMinimap();
    }
    
    renderer.render(scene, camera);
  }
  
  // Oyuncu hareketini güncelle
  function updatePlayerMovement() {
    const moveSpeed = PLAYER_SPEED;
    const turnSpeed = PLAYER_TURN_SPEED;
    
    // Yön tuşları
    const moveForward = keyboard[87] || keyboard[38]; // W veya yukarı ok
    const moveBackward = keyboard[83] || keyboard[40]; // S veya aşağı ok
    const turnLeft = keyboard[65] || keyboard[37]; // A veya sol ok
    const turnRight = keyboard[68] || keyboard[39]; // D veya sağ ok
    
    // Dönüş hareketi
    if (turnLeft) {
      gameState.playerRotation += turnSpeed;
      camera.rotation.y = gameState.playerRotation;
    }
    if (turnRight) {
      gameState.playerRotation -= turnSpeed;
      camera.rotation.y = gameState.playerRotation;
    }
    
    // İleri/geri hareket
    let moved = false;
    if (moveForward || moveBackward) {
      // Hareket yönü
      const direction = moveForward ? 1 : -1;
      
      // Yeni pozisyonu hesapla
      const moveX = Math.sin(gameState.playerRotation) * moveSpeed * direction;
      const moveZ = Math.cos(gameState.playerRotation) * moveSpeed * direction;
      
      // Çarpışma kontrolü
      const newPosition = {
        x: camera.position.x + moveX,
        z: camera.position.z + moveZ
      };
      
      if (!checkWallCollision(newPosition)) {
        camera.position.x = newPosition.x;
        camera.position.z = newPosition.z;
        gameState.playerPosition = { x: camera.position.x, z: camera.position.z };
        moved = true;
      }
    }
    
    // Hareket sesi
    if (moved && !gameState.moveSound) {
      playSound('move');
      gameState.moveSound = true;
      setTimeout(() => { gameState.moveSound = false; }, 300);
    }
  }
  
  // Duvar çarpışmalarını kontrol et
  function checkWallCollision(position) {
    const maze = gameState.maze;
    const height = maze.length;
    const width = maze[0].length;
    
    // Grid pozisyonlarını hesapla
    const gridX = Math.floor(position.x / CELL_SIZE);
    const gridZ = Math.floor(position.z / CELL_SIZE);
    
    // Sınırları kontrol et
    if (gridX < 0 || gridX >= width || gridZ < 0 || gridZ >= height) {
      return true; // Çarpışma var
    }
    
    // Duvar kontrolü
    return maze[gridZ][gridX] === 1;
  }
  
  // Toplanabilir eşyaları ve çıkışı kontrol et
  function checkCollisions() {
    const playerPosition = gameState.playerPosition;
    const maze = gameState.maze;
    
    // Grid pozisyonu
    const gridX = Math.floor(playerPosition.x / CELL_SIZE);
    const gridZ = Math.floor(playerPosition.z / CELL_SIZE);
    
    // Çıkışı kontrol et
    if (gridX === gameState.endPoint.x && gridZ === gameState.endPoint.y) {
      completeLevel();
      return;
    }
    
    // Toplanabilir eşyaları kontrol et
    gameState.collectibles.forEach((collectible, index) => {
      if (collectible.visible && 
          Math.abs(collectible.position.x - playerPosition.x) < CELL_SIZE/1.5 && 
          Math.abs(collectible.position.z - playerPosition.z) < CELL_SIZE/1.5) {
        collectItem(collectible, gridX, gridZ);
      }
    });
  }
  
  // Eşya topla
  function collectItem(collectible, gridX, gridZ) {
    collectible.visible = false;
    gameState.collected++;
    
    // Toplama efekti göster
    showCollectEffect(collectible.position.x, collectible.position.y, collectible.position.z);
    
    // Ses çal
    playSound('collect');
    
    // Puanı güncelle
    gameState.score += 50 * gameState.level;
    
    // Arayüzü güncelle
    updateUI();
  }
  
  // Toplama efekti
  function showCollectEffect(x, y, z) {
    const particles = [];
    const particleCount = 15;
    const particleGeometry = new THREE.SphereGeometry(0.1);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, y, z);
      scene.add(particle);
      
      // Rastgele bir yönde hareket et
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      direction.normalize();
      
      // Parçacık hareketini başlat
      animateParticle(particle, direction);
      particles.push(particle);
    }
    
    // Bir süre sonra parçacıkları temizle
    setTimeout(() => {
      particles.forEach(p => scene.remove(p));
    }, 1000);
  }
  
  // Parçacık animasyonu
  function animateParticle(particle, direction) {
    const speed = 0.1 + Math.random() * 0.1;
    const duration = 500 + Math.random() * 500;
    const startTime = Date.now();
    
    function updateParticle() {
      const elapsedTime = Date.now() - startTime;
      const progress = elapsedTime / duration;
      
      if (progress < 1) {
        particle.position.x += direction.x * speed;
        particle.position.y += direction.y * speed;
        particle.position.z += direction.z * speed;
        
        // Yerçekimi etkisi
        particle.position.y -= 0.01 * progress;
        
        // Şeffaflık (three.js bu şekilde desteklemediği için ölçeklendirme ile simüle ediyoruz)
        particle.scale.set(1 - progress, 1 - progress, 1 - progress);
        
        requestAnimationFrame(updateParticle);
      }
    }
    
    updateParticle();
  }
  
  // Toplanabilir eşyaları güncelle (döndür ve havada asılı tut)
  function updateCollectibles() {
    gameState.collectibles.forEach(collectible => {
      if (collectible.visible) {
        // Döndür
        collectible.rotation.y += COLLECTIBLE_ROTATE_SPEED;
        collectible.rotation.x += COLLECTIBLE_ROTATE_SPEED * 0.5;
        
        // Aşağı yukarı hareket et
        collectible.userData.phase += COLLECTIBLE_HOVER_SPEED;
        collectible.position.y = collectible.userData.originalY + 
                               Math.sin(collectible.userData.phase) * COLLECTIBLE_HOVER_AMPLITUDE;
      }
    });
  }
  
  // Oyuncu ışığını güncelle
  function updatePlayerLight() {
    playerLight.position.set(
      camera.position.x,
      PLAYER_HEIGHT,
      camera.position.z
    );
  }
  
  // Mini haritayı güncelle
  function updateMinimap() {
    const maze = gameState.maze;
    const height = maze.length;
    const width = maze[0].length;
    const gridX = Math.floor(gameState.playerPosition.x / CELL_SIZE);
    const gridZ = Math.floor(gameState.playerPosition.z / CELL_SIZE);
    
    // Canvas'ı temizle
    minimapContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    minimapContext.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Hücre boyutu
    const cellSize = minimapCanvas.width / width;
    
    // Labirenti çiz
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (maze[y][x] === 0) {
          // Bu hücreyi ziyaret ettik mi?
          const distance = Math.sqrt(Math.pow(x - gridX, 2) + Math.pow(y - gridZ, 2));
          if (distance < 5) {
            minimapContext.fillStyle = 'rgba(100, 100, 200, 0.5)';
            minimapContext.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }
    
    // Başlangıç ve bitiş noktaları
    minimapContext.fillStyle = '#6a5ae0';
    minimapContext.fillRect(
      gameState.startPoint.x * cellSize,
      gameState.startPoint.y * cellSize,
      cellSize,
      cellSize
    );
    
    minimapContext.fillStyle = '#00ff88';
    minimapContext.fillRect(
      gameState.endPoint.x * cellSize,
      gameState.endPoint.y * cellSize,
      cellSize,
      cellSize
    );
    
    // Toplanabilir eşyalar
    gameState.collectibles.forEach(collectible => {
      if (collectible.visible) {
        const x = collectible.userData.gridX;
        const y = collectible.userData.gridY;
        
        // Eşyayı sadece keşfedilen bölgede göster
        const distance = Math.sqrt(Math.pow(x - gridX, 2) + Math.pow(y - gridZ, 2));
        if (distance < 5) {
          minimapContext.fillStyle = '#ffcc00';
          minimapContext.beginPath();
          minimapContext.arc(
            (x + 0.5) * cellSize,
            (y + 0.5) * cellSize,
            cellSize / 4,
            0,
            Math.PI * 2
          );
          minimapContext.fill();
        }
      }
    });
    
    // Oyuncu
    minimapContext.fillStyle = '#ff3366';
    minimapContext.beginPath();
    minimapContext.arc(
      (gridX + 0.5) * cellSize,
      (gridZ + 0.5) * cellSize,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    minimapContext.fill();
    
    // Yön göstergesi
    minimapContext.strokeStyle = '#ff3366';
    minimapContext.lineWidth = 2;
    minimapContext.beginPath();
    minimapContext.moveTo(
      (gridX + 0.5) * cellSize,
      (gridZ + 0.5) * cellSize
    );
    minimapContext.lineTo(
      (gridX + 0.5 + Math.sin(gameState.playerRotation) * 0.5) * cellSize,
      (gridZ + 0.5 + Math.cos(gameState.playerRotation) * 0.5) * cellSize
    );
    minimapContext.stroke();
  }
  
  // Seviyeyi tamamla
  function completeLevel() {
    pauseGame();
    
    // Ses çal
    playSound('complete');
    
    // Bonus puanları hesapla
    let bonusPoints = 0;
    
    // Eşya bonusu
    const collectibleBonus = Math.floor((gameState.collected / gameState.totalCollectibles) * 100) * gameState.level * 10;
    
    // Zaman bonusu
    const settings = gameState.difficultySettings[gameState.difficulty];
    const timeLimit = settings.timeLimit + (gameState.level - 1) * 30;
    const timeRemaining = Math.max(0, timeLimit - gameState.timer);
    const timeBonus = Math.floor((timeRemaining / timeLimit) * 100) * gameState.level * 5;
    
    // Toplam bonus
    bonusPoints = collectibleBonus + timeBonus;
    gameState.score += bonusPoints;
    
    // Ekran değerlerini güncelle
    document.getElementById('final-time').textContent = formatTime(gameState.timer);
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-items').textContent = `${gameState.collected}/${gameState.totalCollectibles}`;
    
    // Bonus mesajını oluştur
    let bonusMessage = '';
    if (collectibleBonus > 0) {
      bonusMessage += `<p>Eşya Bonusu: +${collectibleBonus} puan</p>`;
    }
    if (timeBonus > 0) {
      bonusMessage += `<p>Zaman Bonusu: +${timeBonus} puan</p>`;
    }
    document.getElementById('level-bonus').innerHTML = bonusMessage;
    
    // Tamamlama ekranını göster
    levelCompleteScreen.classList.remove('hidden');
    
    // Seviye skorunu kaydet
    saveScore();
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
      gameState.timer++;
      timeDisplay.textContent = formatTime(gameState.timer);
      
      // Zaman doldu mu kontrol et
      const settings = gameState.difficultySettings[gameState.difficulty];
      const timeLimit = settings.timeLimit + (gameState.level - 1) * 30;
      if (gameState.timer >= timeLimit) {
        endGame();
      }
    }, 1000);
  }
  
  // Arayüzü güncelle
  function updateUI() {
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    itemsDisplay.textContent = `${gameState.collected}/${gameState.totalCollectibles}`;
    timeDisplay.textContent = formatTime(gameState.timer);
  }
  
  // Zamanı biçimlendir (saniyeden MM:SS formatına)
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Sonraki seviyeye geç
  function nextLevel() {
    gameState.level++;
    levelCompleteScreen.classList.add('hidden');
    generateMaze();
    clearScene();
    buildMaze3D();
    positionPlayerAtStart();
    addCollectibles();
    gameState.timer = 0;
    updateUI();
    startTimer();
    gameState.isPaused = false;
  }
  
  // Seviyeyi yeniden başlat
  function restartLevel() {
    levelCompleteScreen.classList.add('hidden');
    generateMaze();
    clearScene();
    buildMaze3D();
    positionPlayerAtStart();
    addCollectibles();
    gameState.timer = 0;
    updateUI();
    startTimer();
    gameState.isPaused = false;
  }
  
  // Sahneyi temizle
  function clearScene() {
    // Three.js sahnedeki tüm nesneleri temizle
    while(scene.children.length > 0) { 
      scene.remove(scene.children[0]); 
    }
    
    // Işıkları yeniden ekle
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);
    
    playerLight = new THREE.PointLight(0xccccff, 1, 30);
    playerLight.position.set(0, PLAYER_HEIGHT, 0);
    playerLight.castShadow = true;
    playerLight.shadow.mapSize.width = 512;
    playerLight.shadow.mapSize.height = 512;
    scene.add(playerLight);
  }
  
  // Oyunu sıfırla
  function resetGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.timer = 0;
    gameState.collected = 0;
    gameState.totalCollectibles = 0;
    gameState.isPaused = false;
    updateUI();
  }
  
  // Oyunu sonlandır
  function endGame() {
    pauseGame();
    
    // Ses çal
    playSound('gameOver');
    
    // Game over ekranını güncelle
    document.getElementById('total-score').textContent = gameState.score;
    document.getElementById('max-level').textContent = gameState.level;
    
    // Game over ekranını göster
    gameOverScreen.classList.remove('hidden');
    
    // Skoru kaydet
    saveScore();
  }
  
  // Skoru kaydet
  function saveScore() {
    // Server'a skoru gönder
    fetch('/api/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameType: 'labyrinth3d',
        score: gameState.score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Score saved:', data);
      
      // XP kazanım bildirimi göster
      if (data.xp_gained > 0) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.textContent = `+${data.xp_gained} XP kazandın!`;
        
        if (data.is_level_up) {
          notification.textContent += ` Seviye atladın! Yeni seviye: ${data.level}`;
        }
        
        document.body.appendChild(notification);
        
        // Bildirimi bir süre sonra kaldır
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    })
    .catch(error => {
      console.error('Error saving score:', error);
    });
  }
  
  // Array'i karıştır (Fisher-Yates shuffle)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});