document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const scoreDisplay = document.getElementById('score-display');
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-game');
  const gameContainer = document.getElementById('game-container');
  const gameOverContainer = document.getElementById('game-over-container');
  const finalScoreDisplay = document.getElementById('final-score');
  const container3D = document.getElementById('three-d-container');
  const questionContainer = document.getElementById('question-container');
  const answerBtns = document.querySelectorAll('.answer-btn');
  
  // Game state
  let score = 0;
  let level = 1;
  let timer;
  let isGameActive = false;
  let currentCorrectAnswer = '';
  
  // Three.js variables
  let scene, camera, renderer, shape, targetRotation;
  
  // Initialize the game
  initThreeJS();
  startBtn.addEventListener('click', startGame);
  
  // Set up Three.js scene
  function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container3D.clientWidth, container3D.clientHeight);
    container3D.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = container3D.clientWidth / container3D.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container3D.clientWidth, container3D.clientHeight);
    });
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Initial animation frame
    animate();
  }
  
  function animate() {
    requestAnimationFrame(animate);
    
    if (shape && isGameActive) {
      // Animate the shape rotation
      shape.rotation.x += 0.005;
      shape.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
  }
  
  function startGame() {
    // Hide start button, show game
    startBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    gameOverContainer.style.display = 'none';
    
    // Reset game state
    score = 0;
    level = 1;
    isGameActive = true;
    
    // Update displays
    updateScoreDisplay();
    
    // Set up answer buttons
    answerBtns.forEach(btn => {
      btn.addEventListener('click', checkAnswer);
    });
    
    // Start the first challenge
    generateChallenge();
    
    // Start the timer (3 minutes)
    timer = window.startTimer(180, 'timer-display', endGame);
  }
  
  function generateChallenge() {
    // Remove previous shape if exists
    if (shape) {
      scene.remove(shape);
    }
    
    // Different shape types based on level
    const shapes = [
      // Level 1-2: Simple shapes
      createCube,
      createPyramid,
      
      // Level 3-4: More complex shapes
      createOctahedron,
      createDodecahedron,
      
      // Level 5+: Compound shapes
      createCompoundShape
    ];
    
    // Determine shape index based on level
    const shapeIndex = Math.min(Math.floor((level - 1) / 2), shapes.length - 1);
    
    // Create the shape
    shape = shapes[shapeIndex]();
    scene.add(shape);
    
    // Generate target rotation
    targetRotation = {
      x: Math.round(Math.random() * 4) * (Math.PI / 2),
      y: Math.round(Math.random() * 4) * (Math.PI / 2),
      z: Math.round(Math.random() * 4) * (Math.PI / 2)
    };
    
    // Save correct answer direction
    const directions = ['X-axis', 'Y-axis', 'Z-axis'];
    const rotationAmount = ['90°', '180°', '270°', '360°'];
    
    // Randomly choose which axis will be the correct answer
    const correctAxis = directions[Math.floor(Math.random() * directions.length)];
    const correctAmount = rotationAmount[Math.floor(Math.random() * rotationAmount.length)];
    currentCorrectAnswer = `${correctAxis} ${correctAmount}`;
    
    // Generate question text
    questionContainer.innerHTML = `
      <p class="mb-3">Level ${level}: What rotation would align this shape with the standard position?</p>
    `;
    
    // Generate 4 possible answers (including the correct one)
    const answers = [currentCorrectAnswer];
    
    // Generate 3 incorrect answers
    while (answers.length < 4) {
      const axis = directions[Math.floor(Math.random() * directions.length)];
      const amount = rotationAmount[Math.floor(Math.random() * rotationAmount.length)];
      const answer = `${axis} ${amount}`;
      
      if (!answers.includes(answer)) {
        answers.push(answer);
      }
    }
    
    // Shuffle the answers
    const shuffledAnswers = shuffleArray(answers);
    
    // Assign answers to buttons
    answerBtns.forEach((btn, index) => {
      btn.textContent = shuffledAnswers[index];
    });
  }
  
  function checkAnswer(event) {
    if (!isGameActive) return;
    
    const selectedAnswer = event.target.textContent;
    
    if (selectedAnswer === currentCorrectAnswer) {
      // Correct answer
      const pointsGained = 10 * level;
      score += pointsGained;
      level++;
      
      showMessage(`Correct! +${pointsGained} points`, 'success');
    } else {
      // Incorrect answer
      const pointsLost = 5;
      score = Math.max(0, score - pointsLost);
      
      showMessage(`Incorrect. The answer was ${currentCorrectAnswer}. -${pointsLost} points`, 'danger');
    }
    
    // Update score display
    updateScoreDisplay();
    
    // Generate next challenge
    generateChallenge();
  }
  
  function createCube() {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x4c8bf5,
      flatShading: true,
    });
    
    const cube = new THREE.Mesh(geometry, material);
    
    // Add some distinguishing features (colored sides or patterns)
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    cube.add(line);
    
    return cube;
  }
  
  function createPyramid() {
    const geometry = new THREE.TetrahedronGeometry(1.2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x28a745,
      flatShading: true
    });
    
    const pyramid = new THREE.Mesh(geometry, material);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    pyramid.add(line);
    
    return pyramid;
  }
  
  function createOctahedron() {
    const geometry = new THREE.OctahedronGeometry(1.2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xdc3545,
      flatShading: true
    });
    
    const octahedron = new THREE.Mesh(geometry, material);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    octahedron.add(line);
    
    return octahedron;
  }
  
  function createDodecahedron() {
    const geometry = new THREE.DodecahedronGeometry(1.2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xffc107,
      flatShading: true
    });
    
    const dodecahedron = new THREE.Mesh(geometry, material);
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    dodecahedron.add(line);
    
    return dodecahedron;
  }
  
  function createCompoundShape() {
    const group = new THREE.Group();
    
    // Create a cube base
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4c8bf5,
      flatShading: true
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    group.add(cube);
    
    // Add a pyramid on top
    const pyramidGeometry = new THREE.ConeGeometry(0.7, 1, 4);
    const pyramidMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x28a745,
      flatShading: true
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.position.y = 1;
    group.add(pyramid);
    
    // Add some smaller cubes as features
    const smallCubeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const smallCubeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xdc3545,
      flatShading: true
    });
    
    // Add small cubes at corners
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const smallCube = new THREE.Mesh(smallCubeGeometry, smallCubeMaterial);
        smallCube.position.set(x * 0.65, -0.65, z * 0.65);
        group.add(smallCube);
      }
    }
    
    // Add edges
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const cubeLine = new THREE.LineSegments(cubeEdges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    cube.add(cubeLine);
    
    const pyramidEdges = new THREE.EdgesGeometry(pyramidGeometry);
    const pyramidLine = new THREE.LineSegments(pyramidEdges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    pyramid.add(pyramidLine);
    
    return group;
  }
  
  function updateScoreDisplay() {
    scoreDisplay.textContent = score;
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
    window.saveScore('3dRotation', score);
    
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
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
});
