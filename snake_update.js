  function gameOver() {
    // Stop game loop
    clearInterval(gameLoop);
    gameRunning = false;
    
    // Clear special food timer
    if (specialFoodTimer) clearTimeout(specialFoodTimer);
    
    // Play sound
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    
    // Calculate final score with bonuses
    let finalScore = score;
    
    // Level bonus (higher levels get more bonus)
    const levelBonus = level > 1 ? Math.round(score * ((level - 1) * 0.1)) : 0;
    
    // Length bonus (longer snake gets more bonus)
    const lengthBonus = Math.round((snake.length - 3) * 5); // 5 points per segment after initial 3
    
    // Difficulty bonus
    let difficultyBonus = 0;
    if (difficulty === "hard") {
      difficultyBonus = Math.round(score * 0.2); // 20% bonus for hard mode
    }
    
    // Speed bonus
    let speedBonus = 0;
    if (speed < 120) { // Fast speed
      speedBonus = Math.round(score * 0.15); // 15% bonus for fast speed
    } else if (speed < 170) { // Medium speed
      speedBonus = Math.round(score * 0.05); // 5% bonus for medium speed
    }
    
    // Apply all bonuses
    const totalBonus = levelBonus + lengthBonus + difficultyBonus + speedBonus;
    finalScore += totalBonus;
    
    // Update high score
    if (finalScore > highScore) {
      highScore = finalScore;
      highScoreEl.textContent = highScore;
      localStorage.setItem("snakeHighScore", highScore);
    }
    
    // Update game over modal
    finalScoreEl.textContent = finalScore;
    finalLevelEl.textContent = level;
    foodCountEl.textContent = foodEaten;
    snakeLengthEl.textContent = snake.length;
    
    // Add bonuses section to modal
    const modalContent = document.querySelector(".modal-content");
    
    // Remove existing bonus section if it exists
    const existingBonusSection = document.querySelector(".modal-bonuses");
    if (existingBonusSection) {
      existingBonusSection.remove();
    }
    
    // Create bonus section
    const bonusSection = document.createElement("div");
    bonusSection.className = "modal-bonuses";
    bonusSection.innerHTML = `
      <h3>Bonus Puanlar</h3>
      <div class="bonus-grid">
        <div class="bonus-item ${levelBonus > 0 ? "active" : ""}">
          <div class="bonus-name">Seviye Bonusu</div>
          <div class="bonus-value">+${levelBonus}</div>
        </div>
        <div class="bonus-item ${lengthBonus > 0 ? "active" : ""}">
          <div class="bonus-name">Uzunluk Bonusu</div>
          <div class="bonus-value">+${lengthBonus}</div>
        </div>
        <div class="bonus-item ${difficultyBonus > 0 ? "active" : ""}">
          <div class="bonus-name">Zorluk Bonusu</div>
          <div class="bonus-value">+${difficultyBonus}</div>
        </div>
        <div class="bonus-item ${speedBonus > 0 ? "active" : ""}">
          <div class="bonus-name">Hız Bonusu</div>
          <div class="bonus-value">+${speedBonus}</div>
        </div>
      </div>
    `;
    
    // Style the bonus section
    bonusSection.style.padding = "0 30px 20px";
    bonusSection.style.animation = "fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.8s both";
    
    // Style the heading
    const bonusHeading = bonusSection.querySelector("h3");
    bonusHeading.style.color = "#FFD700";
    bonusHeading.style.fontSize = "1.1rem";
    bonusHeading.style.marginBottom = "10px";
    bonusHeading.style.textAlign = "center";
    bonusHeading.style.fontWeight = "600";
    
    // Style the bonus grid
    const bonusGrid = bonusSection.querySelector(".bonus-grid");
    bonusGrid.style.display = "grid";
    bonusGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    bonusGrid.style.gap = "10px";
    
    // Style the bonus items
    const bonusItems = bonusSection.querySelectorAll(".bonus-item");
    bonusItems.forEach(item => {
      item.style.background = "rgba(40, 40, 80, 0.5)";
      item.style.borderRadius = "8px";
      item.style.padding = "10px";
      item.style.transition = "all 0.3s ease";
      
      if (item.classList.contains("active")) {
        item.style.borderLeft = "3px solid #FFD700";
      } else {
        item.style.opacity = "0.5";
      }
    });
    
    // Style the bonus names
    const bonusNames = bonusSection.querySelectorAll(".bonus-name");
    bonusNames.forEach(name => {
      name.style.fontSize = "0.85rem";
      name.style.color = "rgba(255, 255, 255, 0.7)";
      name.style.marginBottom = "3px";
    });
    
    // Style the bonus values
    const bonusValues = bonusSection.querySelectorAll(".bonus-value");
    bonusValues.forEach(value => {
      value.style.fontSize = "1.1rem";
      value.style.fontWeight = "700";
      value.style.color = "#4CAF50";
    });
    
    // Insert before modal-actions
    const modalDetails = document.querySelector(".modal-details");
    const modalActions = document.querySelector(".modal-actions");
    modalContent.insertBefore(bonusSection, modalActions);
    
    // Add leaderboard button if it doesn't exist
    const existingLeaderboardBtn = modalActions.querySelector(".leaderboard-btn");
    if (!existingLeaderboardBtn) {
      const leaderboardBtn = document.createElement("a");
      leaderboardBtn.href = "/leaderboard";
      leaderboardBtn.className = "btn btn-outline-secondary leaderboard-btn";
      leaderboardBtn.innerHTML = "<i class=\"fas fa-trophy me-2\"></i>Puan Tablosu";
      leaderboardBtn.style.marginTop = "10px";
      
      // Add after play-again button
      modalActions.appendChild(leaderboardBtn);
    }
    
    // Save score
    saveScore(finalScore);
    
    // Show game over modal with fade-in animation
    gameOverModal.style.display = "flex";
    gameOverModal.style.animation = "modalFadeIn 0.3s forwards";
    
    // Reset button states
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Add game over animation
    drawGameOverAnimation();
  }
  
  function drawGameOverAnimation() {
    // Create ripple effect from snake head
    const head = snake[0];
    const headX = head.x * gridSize + gridSize / 2;
    const headY = head.y * gridSize + gridSize / 2;
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const particle = {
          x: headX,
          y: headY,
          size: Math.random() * 5 + 2,
          speedX: (Math.random() - 0.5) * 7,
          speedY: (Math.random() - 0.5) * 7,
          color: i % 2 === 0 ? colors.snake.head : colors.snake.body,
          alpha: 1,
          life: Math.random() * 40 + 20
        };
        
        particles.push(particle);
      }, i * 20);
    }
    
    // Add score popup animation
    const scorePopup = document.createElement("div");
    scorePopup.className = "score-popup";
    scorePopup.textContent = "+" + score;
    scorePopup.style.position = "absolute";
    scorePopup.style.top = headY + "px";
    scorePopup.style.left = headX + "px";
    scorePopup.style.transform = "translate(-50%, -50%)";
    scorePopup.style.color = "#FFD700";
    scorePopup.style.fontSize = "2rem";
    scorePopup.style.fontWeight = "bold";
    scorePopup.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.5)";
    scorePopup.style.zIndex = "100";
    scorePopup.style.pointerEvents = "none";
    scorePopup.style.animation = "scorePopup 1.5s forwards";
    
    document.querySelector(".canvas-wrapper").appendChild(scorePopup);
    
    // Add score popup animation keyframes
    const scorePopupStyles = document.createElement("style");
    scorePopupStyles.textContent = `
      @keyframes scorePopup {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -80%) scale(1.2); }
        80% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -120%) scale(0.8); }
      }
    `;
    document.head.appendChild(scorePopupStyles);
    
    // Remove score popup after animation
    setTimeout(() => {
      scorePopup.remove();
    }, 1500);
    
    // Animation loop
    function animate() {
      drawGame();
      updateParticles();
      
      if (particles.length > 0) {
        requestAnimationFrame(animate);
      }
    }
    
    animate();
  }
  
  // Function to save score to the server
  function saveScore(score) {
    fetch("/api/save-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game_type: "snake",
        score: score
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Score saved:", data);
      
      if (data.success) {
        // Show notification of score saved
        showScoreNotification(score);
      }
    })
    .catch(error => {
      console.error("Error saving score:", error);
    });
  }
  
  // Function to show a floating notification when score is saved
  function showScoreNotification(score) {
    const notification = document.createElement("div");
    notification.className = "score-notification";
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${score} puan kaydedildi!</span>
    `;
    
    // Style the notification
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "rgba(76, 175, 80, 0.9)";
    notification.style.color = "white";
    notification.style.padding = "12px 20px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
    notification.style.display = "flex";
    notification.style.alignItems = "center";
    notification.style.gap = "10px";
    notification.style.zIndex = "9999";
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";
    notification.style.transition = "all 0.3s ease";
    notification.style.fontWeight = "600";
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 100);
    
    // Remove after a few seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(20px)";
      
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
