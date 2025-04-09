/**
 * Space Shooter - Modern HTML/CSS/JS implementation
 * A space themed shooting game with multiple enemy types,
 * power-ups, and increasing difficulty levels
 */
document.addEventListener('DOMContentLoaded', function() {
    // Game configuration
    const config = {
        difficulty: 'medium',
        difficultyMultipliers: {
            easy: 0.75,
            medium: 1.0,
            hard: 1.5
        },
        starCount: 100,
        enemySpawnInterval: { 
            easy: 1800, 
            medium: 1500, 
            hard: 1200 
        },
        asteroidSpawnInterval: { 
            easy: 3000, 
            medium: 2500, 
            hard: 2000 
        },
        powerUpSpawnInterval: 10000, // ms
        bulletCooldown: 250, // ms
        maxLives: 5,
        pointsPerLevel: 200,
        bossThreshold: 5, // boss appears every X levels
        initialEnemySpeed: {
            normal: { easy: 1.5, medium: 2, hard: 2.5 },
            fast: { easy: 2.5, medium: 3, hard: 3.5 },
            tank: { easy: 0.8, medium: 1, hard: 1.2 },
            boss: { easy: 0.6, medium: 0.8, hard: 1 }
        }
    };
    
    // Game state
    const game = {
        container: document.getElementById('gameCanvas'),
        started: false,
        paused: false,
        gameOver: false,
        score: 0,
        lives: 3,
        level: 1,
        width: 0,
        height: 0,
        objects: {
            player: null,
            enemies: [],
            bullets: [],
            powerUps: [],
            asteroids: [],
            explosions: []
        },
        activePowerUps: [],
        keys: {},
        intervals: {
            enemies: null,
            asteroids: null,
            powerUps: null,
            main: null
        },
        lastBulletTime: 0,
        startTime: 0,
        gameTime: 0,
        stars: [],
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
    
    // Initialize game
    function init() {
        // Set dimensions
        game.width = game.container.offsetWidth;
        game.height = game.container.offsetHeight;
        
        // Create stars background
        createStars();
        
        // Initialize difficulty buttons
        initDifficultyButtons();
        
        // Initialize event listeners
        initEventListeners();
        
        // Show start overlay
        document.getElementById('startOverlay').style.display = 'flex';
        
        // Create game object containers
        createContainers();
    }
    
    function createContainers() {
        // Create containers for different game objects if they don't exist
        const containers = ['enemies', 'bullets', 'asteroids', 'powerUps', 'explosions'];
        
        containers.forEach(containerName => {
            if (!document.getElementById(`${containerName}Container`)) {
                const container = document.createElement('div');
                container.id = `${containerName}Container`;
                container.style.position = 'absolute';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.zIndex = '5';
                game.container.appendChild(container);
            }
        });
    }
    
    function createStars() {
        for (let i = 0; i < config.starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            // Random size between 1-3px
            const size = Math.floor(Math.random() * 3) + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // Random position
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // Random animation delay
            star.style.animationDelay = `${Math.random() * 4}s`;
            
            game.container.appendChild(star);
            game.stars.push(star);
        }
    }
    
    function initDifficultyButtons() {
        const buttons = document.querySelectorAll('.difficulty-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const difficulty = this.dataset.difficulty;
                config.difficulty = difficulty;
                
                // Update UI
                buttons.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        // Select medium difficulty by default
        document.querySelector('[data-difficulty="medium"]').classList.add('selected');
    }
    
    function initEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Button click events
        document.getElementById('startGameBtn').addEventListener('click', startGame);
        document.getElementById('playAgainBtn').addEventListener('click', resetGame);
        document.getElementById('returnBtn').addEventListener('click', () => window.location.href = '/');
        
        // Touch events for mobile
        if (game.isTouchDevice) {
            initTouchControls();
        }
        
        // Window resize event
        window.addEventListener('resize', handleResize);
    }
    
    function initTouchControls() {
        // Add touch joystick for mobile devices
        const joystick = document.createElement('div');
        joystick.className = 'touch-joystick';
        joystick.innerHTML = `
            <div class="joystick-base">
                <div class="joystick-handle"></div>
            </div>
        `;
        game.container.appendChild(joystick);
        
        // Add shoot button for mobile devices
        const shootBtn = document.createElement('div');
        shootBtn.className = 'shoot-button';
        shootBtn.innerHTML = `<i class="fas fa-meteor"></i>`;
        game.container.appendChild(shootBtn);
        
        // Implement touch controls logic
        // (This is a simplified version, a full implementation would require more code)
        const handle = joystick.querySelector('.joystick-handle');
        const base = joystick.querySelector('.joystick-base');
        
        // Make joystick draggable
        let isDragging = false;
        let startX, startY;
        
        handle.addEventListener('touchstart', function(e) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            const rect = base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = touchX - centerX;
            const deltaY = touchY - centerY;
            
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 40);
            const angle = Math.atan2(deltaY, deltaX);
            
            const moveX = Math.cos(angle) * distance;
            const moveY = Math.sin(angle) * distance;
            
            handle.style.transform = `translate(${moveX}px, ${moveY}px)`;
            
            // Update movement based on joystick position
            game.keys['KeyA'] = moveX < -10;
            game.keys['KeyD'] = moveX > 10;
            game.keys['KeyW'] = moveY < -10;
            game.keys['KeyS'] = moveY > 10;
            
            e.preventDefault();
        });
        
        document.addEventListener('touchend', function() {
            if (!isDragging) return;
            isDragging = false;
            handle.style.transform = 'translate(0, 0)';
            
            // Reset movement keys
            game.keys['KeyA'] = false;
            game.keys['KeyD'] = false;
            game.keys['KeyW'] = false;
            game.keys['KeyS'] = false;
        });
        
        // Shoot button logic
        shootBtn.addEventListener('touchstart', function() {
            game.keys['Space'] = true;
        });
        
        shootBtn.addEventListener('touchend', function() {
            game.keys['Space'] = false;
        });
    }
    
    function handleKeyDown(e) {
        game.keys[e.code] = true;
        
        // Prevent space bar from scrolling the page
        if (e.code === 'Space') {
            e.preventDefault();
        }
    }
    
    function handleKeyUp(e) {
        game.keys[e.code] = false;
    }
    
    function handleResize() {
        game.width = game.container.offsetWidth;
        game.height = game.container.offsetHeight;
        
        // Reposition stars
        game.stars.forEach(star => {
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
        });
        
        // Adjust player position if it's offscreen
        if (game.objects.player) {
            const player = game.objects.player.element;
            const maxX = game.width - parseInt(player.style.width);
            const maxY = game.height - parseInt(player.style.height);
            
            let x = parseInt(player.style.left);
            let y = parseInt(player.style.top);
            
            if (x > maxX) player.style.left = `${maxX}px`;
            if (y > maxY) player.style.top = `${maxY}px`;
        }
    }
    
    // Start game
    function startGame() {
        if (game.started) return;
        
        game.started = true;
        game.gameOver = false;
        game.startTime = Date.now();
        document.getElementById('startOverlay').style.display = 'none';
        
        // Create player
        createPlayer();
        
        // Start game loops
        game.intervals.main = setInterval(mainLoop, 16); // ~60fps
        game.intervals.enemies = setInterval(spawnEnemy, config.enemySpawnInterval[config.difficulty]);
        game.intervals.asteroids = setInterval(spawnAsteroid, config.asteroidSpawnInterval[config.difficulty]);
        game.intervals.powerUps = setInterval(spawnPowerUp, config.powerUpSpawnInterval);
        
        // Reset game stats
        game.score = 0;
        game.lives = 3;
        game.level = 1;
        updateGameStats();
    }
    
    // Reset game for replay
    function resetGame() {
        // Clear previous game
        clearAllIntervals();
        clearGameObjects();
        
        // Reset game state
        game.started = false;
        game.gameOver = false;
        game.score = 0;
        game.lives = 3;
        game.level = 1;
        game.activePowerUps = [];
        
        // Hide game over screen and show start screen
        document.getElementById('gameOverOverlay').style.display = 'none';
        document.getElementById('startOverlay').style.display = 'flex';
        
        // Update UI
        updateGameStats();
        document.getElementById('powerUpIndicator').innerHTML = '';
    }
    
    function clearAllIntervals() {
        clearInterval(game.intervals.main);
        clearInterval(game.intervals.enemies);
        clearInterval(game.intervals.asteroids);
        clearInterval(game.intervals.powerUps);
    }
    
    function clearGameObjects() {
        // Remove all game objects
        document.getElementById('enemiesContainer').innerHTML = '';
        document.getElementById('bulletsContainer').innerHTML = '';
        document.getElementById('asteroidsContainer').innerHTML = '';
        document.getElementById('powerUpsContainer').innerHTML = '';
        document.getElementById('explosionsContainer').innerHTML = '';
        
        // Remove player
        if (game.objects.player && game.objects.player.element) {
            game.container.removeChild(game.objects.player.element);
        }
        
        // Reset object arrays
        game.objects.player = null;
        game.objects.enemies = [];
        game.objects.bullets = [];
        game.objects.powerUps = [];
        game.objects.asteroids = [];
        game.objects.explosions = [];
    }
    
    // Main game loop
    function mainLoop() {
        if (game.gameOver) return;
        
        game.gameTime = Date.now() - game.startTime;
        
        // Check for level up
        checkLevelProgress();
        
        // Update player
        updatePlayer();
        
        // Update bullets
        updateBullets();
        
        // Update enemies
        updateEnemies();
        
        // Update asteroids
        updateAsteroids();
        
        // Update power-ups
        updatePowerUps();
        
        // Update explosions
        updateExplosions();
        
        // Check power-up durations
        checkPowerUpDurations();
        
        // Handle player shooting
        handlePlayerShooting();
    }
    
    function checkLevelProgress() {
        const nextLevel = Math.floor(game.score / config.pointsPerLevel) + 1;
        
        if (nextLevel > game.level) {
            game.level = nextLevel;
            updateGameStats();
            
            // Show level up notification
            showLevelUpNotification();
            
            // Spawn a boss every X levels
            if (game.level % config.bossThreshold === 0) {
                spawnBoss();
            }
        }
    }
    
    function showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.textContent = `Level ${game.level}`;
        
        game.container.appendChild(notification);
        
        // Remove after animation completes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Create player
    function createPlayer() {
        const playerElem = document.createElement('div');
        playerElem.className = 'game-object player';
        
        // Set initial position in the bottom center
        const width = 50;
        const height = 50;
        const x = (game.width / 2) - (width / 2);
        const y = game.height - height - 20;
        
        playerElem.style.width = `${width}px`;
        playerElem.style.height = `${height}px`;
        playerElem.style.left = `${x}px`;
        playerElem.style.top = `${y}px`;
        
        game.container.appendChild(playerElem);
        
        game.objects.player = {
            element: playerElem,
            width: width,
            height: height,
            x: x,
            y: y,
            speed: 5,
            bulletType: 'normal',
            invulnerable: false
        };
    }
    
    // Update player
    function updatePlayer() {
        if (!game.objects.player) return;
        
        const player = game.objects.player;
        
        // Movement
        if (game.keys['KeyW'] || game.keys['ArrowUp']) {
            player.y = Math.max(0, player.y - player.speed);
        }
        if (game.keys['KeyS'] || game.keys['ArrowDown']) {
            player.y = Math.min(game.height - player.height, player.y + player.speed);
        }
        if (game.keys['KeyA'] || game.keys['ArrowLeft']) {
            player.x = Math.max(0, player.x - player.speed);
        }
        if (game.keys['KeyD'] || game.keys['ArrowRight']) {
            player.x = Math.min(game.width - player.width, player.x + player.speed);
        }
        
        // Update position
        player.element.style.left = `${player.x}px`;
        player.element.style.top = `${player.y}px`;
        
        // Check for collisions with enemies and asteroids
        checkPlayerCollisions();
    }
    
    function checkPlayerCollisions() {
        if (!game.objects.player || game.objects.player.invulnerable) return;
        
        const player = game.objects.player;
        
        // Check collision with enemies
        for (let i = game.objects.enemies.length - 1; i >= 0; i--) {
            const enemy = game.objects.enemies[i];
            
            if (checkCollision(player, enemy)) {
                // Handle collision with enemy
                handlePlayerHit();
                
                // Create explosion at enemy position
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width + 20);
                
                // Remove enemy
                removeGameObject(enemy, 'enemies');
                break;
            }
        }
        
        // Check collision with asteroids
        for (let i = game.objects.asteroids.length - 1; i >= 0; i--) {
            const asteroid = game.objects.asteroids[i];
            
            if (checkCollision(player, asteroid)) {
                // Handle collision with asteroid
                handlePlayerHit();
                
                // Create explosion at asteroid position
                createExplosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2, asteroid.width + 10);
                
                // Remove asteroid
                removeGameObject(asteroid, 'asteroids');
                break;
            }
        }
    }
    
    function handlePlayerHit() {
        // Check if player has shield
        const hasShield = game.activePowerUps.some(p => p.type === 'shield');
        
        if (hasShield) {
            // Remove shield and return
            const shieldIndex = game.activePowerUps.findIndex(p => p.type === 'shield');
            game.activePowerUps.splice(shieldIndex, 1);
            updatePowerUpDisplay();
            
            // Visual feedback for shield hit
            const player = game.objects.player;
            player.element.style.boxShadow = '0 0 20px 10px rgba(52, 152, 219, 0.8)';
            setTimeout(() => {
                player.element.style.boxShadow = '';
            }, 300);
            
            return;
        }
        
        // Player loses a life
        game.lives--;
        updateGameStats();
        
        if (game.lives <= 0) {
            endGame();
            return;
        }
        
        // Make player temporarily invulnerable
        game.objects.player.invulnerable = true;
        game.objects.player.element.style.opacity = '0.5';
        
        // End invulnerability after 2 seconds
        setTimeout(() => {
            if (game.objects.player) {
                game.objects.player.invulnerable = false;
                game.objects.player.element.style.opacity = '1';
            }
        }, 2000);
    }
    
    // Handle player shooting
    function handlePlayerShooting() {
        if (!game.objects.player) return;
        
        const currentTime = Date.now();
        const timeSinceLastBullet = currentTime - game.lastBulletTime;
        
        if ((game.keys['Space'] || game.keys[' ']) && timeSinceLastBullet >= config.bulletCooldown) {
            // Create bullets based on bullet type
            createPlayerBullets();
            game.lastBulletTime = currentTime;
        }
    }
    
    function createPlayerBullets() {
        const player = game.objects.player;
        
        switch (player.bulletType) {
            case 'normal':
                createBullet(
                    player.x + player.width / 2 - 2,
                    player.y,
                    4, 10, 
                    0, -10,
                    'bullet',
                    1
                );
                break;
                
            case 'double':
                createBullet(
                    player.x + player.width / 4,
                    player.y,
                    4, 10, 
                    0, -10,
                    'bullet',
                    1
                );
                createBullet(
                    player.x + player.width * 3/4 - 4,
                    player.y,
                    4, 10, 
                    0, -10,
                    'bullet',
                    1
                );
                break;
                
            case 'triple':
                createBullet(
                    player.x + player.width / 2 - 2,
                    player.y,
                    4, 10, 
                    0, -10,
                    'bullet',
                    1
                );
                createBullet(
                    player.x + player.width / 4,
                    player.y + 10,
                    4, 10, 
                    -2, -9,
                    'bullet',
                    1
                );
                createBullet(
                    player.x + player.width * 3/4 - 4,
                    player.y + 10,
                    4, 10, 
                    2, -9,
                    'bullet',
                    1
                );
                break;
                
            case 'laser':
                createBullet(
                    player.x + player.width / 2 - 5,
                    player.y,
                    10, 20, 
                    0, -12,
                    'laser',
                    2
                );
                break;
        }
    }
    
    // Spawn enemy
    function spawnEnemy() {
        if (game.gameOver) return;
        
        // Determine enemy type based on level and random chance
        let enemyType = 'normal';
        const roll = Math.random();
        
        if (game.level >= 3 && roll < 0.2) {
            enemyType = 'tank';
        } else if (roll < 0.3) {
            enemyType = 'fast';
        }
        
        createEnemy(enemyType);
    }
    
    function spawnBoss() {
        if (game.gameOver) return;
        createEnemy('boss');
    }
    
    function createEnemy(type) {
        let width, height, speed, health, points;
        
        // Set enemy properties based on type
        switch (type) {
            case 'normal':
                width = 40;
                height = 40;
                speed = config.initialEnemySpeed.normal[config.difficulty] + (game.level * 0.1);
                health = 1;
                points = 10;
                break;
                
            case 'fast':
                width = 30;
                height = 30;
                speed = config.initialEnemySpeed.fast[config.difficulty] + (game.level * 0.15);
                health = 1;
                points = 15;
                break;
                
            case 'tank':
                width = 50;
                height = 50;
                speed = config.initialEnemySpeed.tank[config.difficulty] + (game.level * 0.05);
                health = 3;
                points = 20;
                break;
                
            case 'boss':
                width = 80;
                height = 80;
                speed = config.initialEnemySpeed.boss[config.difficulty] + (game.level * 0.04);
                health = 10;
                points = 50;
                break;
                
            default:
                width = 40;
                height = 40;
                speed = 2;
                health = 1;
                points = 10;
        }
        
        // Apply difficulty multiplier to health
        health = Math.ceil(health * config.difficultyMultipliers[config.difficulty]);
        
        // Create enemy element
        const enemyElem = document.createElement('div');
        enemyElem.className = `game-object enemy ${type}-enemy`;
        
        // Random position along the top
        const x = Math.random() * (game.width - width);
        const y = -height;
        
        enemyElem.style.width = `${width}px`;
        enemyElem.style.height = `${height}px`;
        enemyElem.style.left = `${x}px`;
        enemyElem.style.top = `${y}px`;
        
        // Add health bar for tanks and bosses
        if (type === 'tank' || type === 'boss') {
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthFill.style.width = '100%';
            
            healthBar.appendChild(healthFill);
            enemyElem.appendChild(healthBar);
        }
        
        document.getElementById('enemiesContainer').appendChild(enemyElem);
        
        // Add to game objects
        const enemy = {
            element: enemyElem,
            type: type,
            width: width,
            height: height,
            x: x,
            y: y,
            speed: speed,
            health: health,
            maxHealth: health,
            points: points,
            shootCooldown: type === 'boss' ? 60 : 0
        };
        
        game.objects.enemies.push(enemy);
    }
    
    // Create bullet
    function createBullet(x, y, width, height, speedX, speedY, type, damage) {
        const bulletElem = document.createElement('div');
        bulletElem.className = `game-object ${type}`;
        
        bulletElem.style.width = `${width}px`;
        bulletElem.style.height = `${height}px`;
        bulletElem.style.left = `${x}px`;
        bulletElem.style.top = `${y}px`;
        
        document.getElementById('bulletsContainer').appendChild(bulletElem);
        
        // Add to game objects
        const bullet = {
            element: bulletElem,
            width: width,
            height: height,
            x: x,
            y: y,
            speedX: speedX,
            speedY: speedY,
            type: type,
            damage: damage
        };
        
        game.objects.bullets.push(bullet);
    }
    
    // Create enemy bullet
    function createEnemyBullet(x, y) {
        const bulletElem = document.createElement('div');
        bulletElem.className = 'game-object enemy-bullet';
        
        bulletElem.style.width = '4px';
        bulletElem.style.height = '10px';
        bulletElem.style.left = `${x}px`;
        bulletElem.style.top = `${y}px`;
        
        document.getElementById('enemiesContainer').appendChild(bulletElem);
        
        // Add to game objects
        const enemyBullet = {
            element: bulletElem,
            type: 'enemy-bullet',
            width: 4,
            height: 10,
            x: x,
            y: y,
            speed: 5
        };
        
        game.objects.enemies.push(enemyBullet);
    }
    
    // Create asteroid
    function spawnAsteroid() {
        if (game.gameOver) return;
        
        // Size between 30-60px
        const size = 30 + Math.random() * 30;
        
        // Create asteroid element
        const asteroidElem = document.createElement('div');
        asteroidElem.className = 'game-object asteroid';
        
        // Random position along the top
        const x = Math.random() * (game.width - size);
        const y = -size;
        
        asteroidElem.style.width = `${size}px`;
        asteroidElem.style.height = `${size}px`;
        asteroidElem.style.left = `${x}px`;
        asteroidElem.style.top = `${y}px`;
        
        document.getElementById('asteroidsContainer').appendChild(asteroidElem);
        
        // Add to game objects
        const asteroid = {
            element: asteroidElem,
            width: size,
            height: size,
            x: x,
            y: y,
            speed: 1 + Math.random() * 2 + (game.level * 0.1),
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            health: Math.ceil(size / 15),
            points: Math.ceil(size / 10)
        };
        
        game.objects.asteroids.push(asteroid);
    }
    
    // Create power-up
    function spawnPowerUp() {
        if (game.gameOver) return;
        
        // 30% chance to spawn a power-up
        if (Math.random() > 0.3) return;
        
        // Power-up types
        const types = ['double', 'triple', 'laser', 'shield', 'life'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Create power-up element
        const powerUpElem = document.createElement('div');
        powerUpElem.className = 'game-object power-up';
        
        // Add power-up type label
        const label = document.createElement('span');
        label.className = 'power-up-label';
        label.textContent = type[0].toUpperCase();
        label.style.position = 'absolute';
        label.style.top = '50%';
        label.style.left = '50%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.color = 'white';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        powerUpElem.appendChild(label);
        
        // Random position along the top
        const width = 25;
        const height = 25;
        const x = Math.random() * (game.width - width);
        const y = -height;
        
        powerUpElem.style.width = `${width}px`;
        powerUpElem.style.height = `${height}px`;
        powerUpElem.style.left = `${x}px`;
        powerUpElem.style.top = `${y}px`;
        
        document.getElementById('powerUpsContainer').appendChild(powerUpElem);
        
        // Add to game objects
        const powerUp = {
            element: powerUpElem,
            type: type,
            width: width,
            height: height,
            x: x,
            y: y,
            speed: 2
        };
        
        game.objects.powerUps.push(powerUp);
    }
    
    // Create explosion
    function createExplosion(x, y, size) {
        const explosionElem = document.createElement('div');
        explosionElem.className = 'game-object explosion';
        
        explosionElem.style.width = `${size}px`;
        explosionElem.style.height = `${size}px`;
        explosionElem.style.left = `${x - size/2}px`;
        explosionElem.style.top = `${y - size/2}px`;
        
        document.getElementById('explosionsContainer').appendChild(explosionElem);
        
        // Add to game objects
        const explosion = {
            element: explosionElem,
            x: x,
            y: y,
            size: size,
            width: size,
            height: size,
            timeCreated: Date.now()
        };
        
        game.objects.explosions.push(explosion);
    }
    
    // Update bullets
    function updateBullets() {
        for (let i = game.objects.bullets.length - 1; i >= 0; i--) {
            const bullet = game.objects.bullets[i];
            
            // Move bullet
            bullet.x += bullet.speedX;
            bullet.y += bullet.speedY;
            
            // Update position
            bullet.element.style.left = `${bullet.x}px`;
            bullet.element.style.top = `${bullet.y}px`;
            
            // Check if bullet is out of bounds
            if (bullet.y < -bullet.height || 
                bullet.y > game.height || 
                bullet.x < -bullet.width || 
                bullet.x > game.width) {
                removeGameObject(bullet, 'bullets');
                continue;
            }
            
            // Check for collision with enemies
            checkBulletCollisions(bullet, i);
        }
    }
    
    function checkBulletCollisions(bullet, bulletIndex) {
        // Check collision with enemies
        for (let i = game.objects.enemies.length - 1; i >= 0; i--) {
            const enemy = game.objects.enemies[i];
            
            // Skip enemy bullets
            if (enemy.type === 'enemy-bullet') continue;
            
            if (checkCollision(bullet, enemy)) {
                // Damage enemy
                enemy.health -= bullet.damage;
                
                // Remove bullet
                removeGameObject(bullet, 'bullets');
                
                // Update health bar if enemy has one
                if ((enemy.type === 'tank' || enemy.type === 'boss') && enemy.element.querySelector('.health-fill')) {
                    const healthPercentage = (enemy.health / enemy.maxHealth) * 100;
                    enemy.element.querySelector('.health-fill').style.width = `${healthPercentage}%`;
                }
                
                // Check if enemy is destroyed
                if (enemy.health <= 0) {
                    // Add score
                    game.score += enemy.points;
                    updateGameStats();
                    
                    // Create explosion
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width + 20);
                    
                    // Chance to drop power-up
                    if (Math.random() < 0.1) {
                        spawnPowerUpAtPosition(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    }
                    
                    // Remove enemy
                    removeGameObject(enemy, 'enemies');
                }
                
                break; // Bullet hit something, stop checking
            }
        }
        
        // Check collision with asteroids
        for (let i = game.objects.asteroids.length - 1; i >= 0; i--) {
            const asteroid = game.objects.asteroids[i];
            
            if (checkCollision(bullet, asteroid)) {
                // Damage asteroid
                asteroid.health -= bullet.damage;
                
                // Remove bullet
                removeGameObject(bullet, 'bullets');
                
                // Check if asteroid is destroyed
                if (asteroid.health <= 0) {
                    // Add score
                    game.score += asteroid.points;
                    updateGameStats();
                    
                    // Create explosion
                    createExplosion(asteroid.x + asteroid.width/2, asteroid.y + asteroid.height/2, asteroid.width + 10);
                    
                    // Chance to split into smaller asteroids
                    if (asteroid.width > 40 && Math.random() < 0.3) {
                        for (let j = 0; j < 2; j++) {
                            const smallSize = asteroid.width / 2;
                            
                            // Create smaller asteroid
                            const smallAsteroidElem = document.createElement('div');
                            smallAsteroidElem.className = 'game-object asteroid';
                            
                            smallAsteroidElem.style.width = `${smallSize}px`;
                            smallAsteroidElem.style.height = `${smallSize}px`;
                            smallAsteroidElem.style.left = `${asteroid.x + (j === 0 ? -10 : 10)}px`;
                            smallAsteroidElem.style.top = `${asteroid.y}px`;
                            
                            document.getElementById('asteroidsContainer').appendChild(smallAsteroidElem);
                            
                            // Add to game objects
                            const smallAsteroid = {
                                element: smallAsteroidElem,
                                width: smallSize,
                                height: smallSize,
                                x: asteroid.x + (j === 0 ? -10 : 10),
                                y: asteroid.y,
                                speed: asteroid.speed * 1.2,
                                rotation: 0,
                                rotationSpeed: (Math.random() - 0.5) * 0.1,
                                health: Math.ceil(smallSize / 15),
                                points: Math.ceil(smallSize / 10)
                            };
                            
                            game.objects.asteroids.push(smallAsteroid);
                        }
                    }
                    
                    // Remove asteroid
                    removeGameObject(asteroid, 'asteroids');
                }
                
                break; // Bullet hit something, stop checking
            }
        }
    }
    
    // Update enemies
    function updateEnemies() {
        for (let i = game.objects.enemies.length - 1; i >= 0; i--) {
            const enemy = game.objects.enemies[i];
            
            // Move enemy
            enemy.y += enemy.speed;
            
            // Update position
            enemy.element.style.top = `${enemy.y}px`;
            
            // Boss shooting
            if (enemy.type === 'boss' && enemy.shootCooldown !== undefined) {
                if (enemy.shootCooldown <= 0) {
                    // Shoot enemy bullet
                    createEnemyBullet(enemy.x + enemy.width/2 - 2, enemy.y + enemy.height);
                    enemy.shootCooldown = 90; // Reset cooldown
                } else {
                    enemy.shootCooldown--;
                }
            }
            
            // Check if enemy is out of bounds
            if (enemy.y > game.height) {
                if (enemy.type !== 'enemy-bullet') {
                    // Player loses a life if enemy passes through
                    game.lives--;
                    updateGameStats();
                    
                    if (game.lives <= 0) {
                        endGame();
                        break;
                    }
                }
                
                removeGameObject(enemy, 'enemies');
                continue;
            }
            
            // For enemy bullets, check collision with player
            if (enemy.type === 'enemy-bullet' && game.objects.player && !game.objects.player.invulnerable) {
                if (checkCollision(enemy, game.objects.player)) {
                    handlePlayerHit();
                    removeGameObject(enemy, 'enemies');
                }
            }
        }
    }
    
    // Update asteroids
    function updateAsteroids() {
        for (let i = game.objects.asteroids.length - 1; i >= 0; i--) {
            const asteroid = game.objects.asteroids[i];
            
            // Move asteroid
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Update position
            asteroid.element.style.top = `${asteroid.y}px`;
            asteroid.element.style.transform = `rotate(${asteroid.rotation}rad)`;
            
            // Check if asteroid is out of bounds
            if (asteroid.y > game.height) {
                removeGameObject(asteroid, 'asteroids');
            }
        }
    }
    
    // Update power-ups
    function updatePowerUps() {
        for (let i = game.objects.powerUps.length - 1; i >= 0; i--) {
            const powerUp = game.objects.powerUps[i];
            
            // Move power-up
            powerUp.y += powerUp.speed;
            
            // Update position
            powerUp.element.style.top = `${powerUp.y}px`;
            
            // Check if power-up is out of bounds
            if (powerUp.y > game.height) {
                removeGameObject(powerUp, 'powerUps');
                continue;
            }
            
            // Check collision with player
            if (game.objects.player && checkCollision(powerUp, game.objects.player)) {
                activatePowerUp(powerUp.type);
                removeGameObject(powerUp, 'powerUps');
            }
        }
    }
    
    // Update explosions
    function updateExplosions() {
        const currentTime = Date.now();
        
        for (let i = game.objects.explosions.length - 1; i >= 0; i--) {
            const explosion = game.objects.explosions[i];
            
            // Remove explosion after 500ms
            if (currentTime - explosion.timeCreated > 500) {
                removeGameObject(explosion, 'explosions');
            }
        }
    }
    
    // Spawn power-up at a position (when enemy is destroyed)
    function spawnPowerUpAtPosition(x, y) {
        // Power-up types
        const types = ['double', 'triple', 'laser', 'shield', 'life'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Create power-up element
        const powerUpElem = document.createElement('div');
        powerUpElem.className = 'game-object power-up';
        
        // Add power-up type label
        const label = document.createElement('span');
        label.className = 'power-up-label';
        label.textContent = type[0].toUpperCase();
        label.style.position = 'absolute';
        label.style.top = '50%';
        label.style.left = '50%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.color = 'white';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        powerUpElem.appendChild(label);
        
        // Set position
        const width = 25;
        const height = 25;
        
        powerUpElem.style.width = `${width}px`;
        powerUpElem.style.height = `${height}px`;
        powerUpElem.style.left = `${x - width/2}px`;
        powerUpElem.style.top = `${y - height/2}px`;
        
        document.getElementById('powerUpsContainer').appendChild(powerUpElem);
        
        // Add to game objects
        const powerUp = {
            element: powerUpElem,
            type: type,
            width: width,
            height: height,
            x: x - width/2,
            y: y - height/2,
            speed: 2
        };
        
        game.objects.powerUps.push(powerUp);
    }
    
    // Activate power-up
    function activatePowerUp(type) {
        const duration = 10000; // 10 seconds
        
        const activePowerUp = {
            type: type,
            startTime: game.gameTime,
            duration: duration,
            endTime: game.gameTime + duration
        };
        
        switch (type) {
            case 'double':
            case 'triple':
            case 'laser':
                // Check if there's already a weapon power-up
                const existingWeaponIndex = game.activePowerUps.findIndex(p => 
                    ['double', 'triple', 'laser'].includes(p.type));
                
                if (existingWeaponIndex !== -1) {
                    // Remove existing weapon power-up
                    game.activePowerUps.splice(existingWeaponIndex, 1);
                }
                
                game.objects.player.bulletType = type;
                game.activePowerUps.push(activePowerUp);
                break;
                
            case 'shield':
                // Add shield power-up
                game.activePowerUps.push(activePowerUp);
                
                // Add visual shield effect to player
                game.objects.player.element.style.boxShadow = '0 0 10px 5px rgba(52, 152, 219, 0.5)';
                break;
                
            case 'life':
                // Add extra life
                if (game.lives < config.maxLives) {
                    game.lives++;
                    updateGameStats();
                }
                break;
        }
        
        updatePowerUpDisplay();
    }
    
    // Check power-up durations
    function checkPowerUpDurations() {
        if (game.activePowerUps.length === 0) return;
        
        for (let i = game.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = game.activePowerUps[i];
            
            // Check if power-up has expired
            if (game.gameTime >= powerUp.endTime) {
                // Remove power-up effect
                switch (powerUp.type) {
                    case 'double':
                    case 'triple':
                    case 'laser':
                        game.objects.player.bulletType = 'normal';
                        break;
                        
                    case 'shield':
                        // Remove shield visual effect
                        if (game.objects.player) {
                            game.objects.player.element.style.boxShadow = '';
                        }
                        break;
                }
                
                // Remove from active power-ups
                game.activePowerUps.splice(i, 1);
            }
        }
        
        updatePowerUpDisplay();
    }
    
    // Update power-up display
    function updatePowerUpDisplay() {
        const container = document.getElementById('powerUpIndicator');
        container.innerHTML = '';
        
        game.activePowerUps.forEach(powerUp => {
            const remaining = powerUp.endTime - game.gameTime;
            if (remaining <= 0) return;
            
            const percentage = (remaining / powerUp.duration) * 100;
            
            const powerUpElement = document.createElement('div');
            powerUpElement.className = 'power-up-item';
            
            const icon = document.createElement('div');
            icon.className = 'power-up-icon';
            icon.style.backgroundImage = 'url(/static/images/powerup.svg)';
            icon.style.backgroundSize = 'contain';
            icon.style.backgroundRepeat = 'no-repeat';
            icon.style.width = '20px';
            icon.style.height = '20px';
            powerUpElement.appendChild(icon);
            
            const label = document.createElement('span');
            label.textContent = powerUp.type;
            powerUpElement.appendChild(label);
            
            const timer = document.createElement('div');
            timer.className = 'power-up-timer';
            
            const fill = document.createElement('div');
            fill.className = 'power-up-fill';
            fill.style.width = `${percentage}%`;
            
            timer.appendChild(fill);
            powerUpElement.appendChild(timer);
            
            container.appendChild(powerUpElement);
        });
    }
    
    // End game
    function endGame() {
        game.gameOver = true;
        clearAllIntervals();
        
        // Calculate score
        const basePoints = Math.min(Math.max(game.score, 10), 100);
        const difficultyMultiplier = config.difficultyMultipliers[config.difficulty];
        const levelBonus = (game.level - 1) * 5;
        const timeBonus = Math.floor(game.gameTime / 1000 / 10);
        const bonusPoints = Math.min(levelBonus + timeBonus, 20);
        const totalPoints = Math.floor((basePoints * difficultyMultiplier) + bonusPoints);
        
        // Calculate XP
        const baseXP = Math.floor(game.gameTime / 1000 / 12); // 1 XP per 12 seconds
        const difficultyBonus = baseXP * (difficultyMultiplier - 0.5);
        const xpEarned = Math.floor(baseXP + difficultyBonus);
        
        // Update score display
        document.getElementById('basePoints').textContent = basePoints;
        document.getElementById('difficultyMultiplier').textContent = `x${difficultyMultiplier.toFixed(1)}`;
        document.getElementById('bonusPoints').textContent = bonusPoints;
        document.getElementById('totalPoints').textContent = totalPoints;
        document.getElementById('xpEarned').textContent = xpEarned;
        
        // Game stats for backend
        const gameStats = {
            difficulty: config.difficulty,
            level: game.level,
            score: game.score,
            gameTime: Math.floor(game.gameTime / 1000) // seconds
        };
        
        // Submit score to server if user is logged in
        if (document.body.dataset.userId) {
            submitScore(totalPoints, gameStats, xpEarned);
        }
        
        // Show game over screen
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }
    
    // Submit score to server
    function submitScore(score, gameStats, xp) {
        fetch('/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                score: score,
                game_type: 'space_shooter',
                game_stats: gameStats,
                xp_earned: xp
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
    
    // Update game stats
    function updateGameStats() {
        document.getElementById('score').textContent = game.score;
        document.getElementById('lives').textContent = game.lives;
        document.getElementById('level').textContent = game.level;
    }
    
    // Helper function to remove a game object
    function removeGameObject(obj, arrayName) {
        // Remove from DOM
        if (obj.element && obj.element.parentNode) {
            obj.element.parentNode.removeChild(obj.element);
        }
        
        // Remove from game objects array
        const index = game.objects[arrayName].indexOf(obj);
        if (index !== -1) {
            game.objects[arrayName].splice(index, 1);
        }
    }
    
    // Check collision between two objects
    function checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    // Initialize the game
    init();
});