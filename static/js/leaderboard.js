
document.addEventListener('DOMContentLoaded', function() {
  // Game tabs interaction
  const tabs = document.querySelectorAll('.game-tab');
  const loadingIndicator = document.querySelector('.loading');
  const container = document.querySelector('#leaderboardsContainer');
  
  // Initialize with the first tab (Tüm Oyunlar)
  loadLeaderboard('all');
  
  // Add click event to each tab
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Update active state
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Get the game type
      const gameType = this.getAttribute('data-game');
      
      // Load the corresponding leaderboard
      loadLeaderboard(gameType);
    });
  });
  
  // Function to load leaderboard data
  function loadLeaderboard(gameType) {
    console.log('Skor yükleniyor:', gameType);
    
    // Show loading indicator
    container.innerHTML = '';
    loadingIndicator.style.display = 'flex';
    
    // API call to get scores
    fetch(`/api/get-scores/${gameType}`)
      .then(response => response.json())
      .then(data => {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        if (gameType === 'all') {
          // If "Tüm Oyunlar" tab, create multiple tables
          console.log('Tüm yüklenen skorlar:', data);
          
          // Create a leaderboard for each game type
          const gameTypes = {
            'wordPuzzle': { name: 'Kelime Bulmaca', icon: 'fas fa-font' },
            'memoryMatch': { name: 'Hafıza Eşleştirme', icon: 'fas fa-th' },
            'labyrinth': { name: 'Labirent', icon: 'fas fa-map-signs' },
            'puzzle': { name: 'Puzzle', icon: 'fas fa-puzzle-piece' },
            'numberSequence': { name: 'Sayı Dizisi', icon: 'fas fa-sort-numeric-up' },
            'memoryCards': { name: 'Hafıza Kartları', icon: 'fas fa-clone' },
            'numberChain': { name: 'Sayı Zinciri', icon: 'fas fa-link' },
            'audioMemory': { name: 'Sesli Hafıza', icon: 'fas fa-music' },
            'nBack': { name: 'N-Back', icon: 'fas fa-brain' },
            'sudoku': { name: 'Sudoku', icon: 'fas fa-table' },
            '2048': { name: '2048', icon: 'fas fa-cube' },
            'chess': { name: 'Satranç', icon: 'fas fa-chess' },
            'visualAttention': { name: 'Görsel Dikkat', icon: 'fas fa-eye' }
          };
          
          Object.keys(gameTypes).forEach(type => {
            if (data[type] && data[type].length > 0) {
              const card = createLeaderboardCard(gameTypes[type].name, gameTypes[type].icon, data[type]);
              container.appendChild(card);
            }
          });
          
          // If no data was added, show a message
          if (container.innerHTML === '') {
            container.innerHTML = `
              <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>Henüz hiçbir skorunuz bulunmamaktadır. Oyunları oynayarak skor tablosunda yerinizi alın!</p>
              </div>
            `;
          }
        } else {
          // Single game leaderboard
          let gameName = '';
          let gameIcon = '';
          
          // Set the appropriate game name based on the game type
          switch(gameType) {
            case 'wordPuzzle':
            case 'word-puzzle': 
              gameName = 'Kelime Bulmaca';
              gameIcon = 'fas fa-font';
              break;
            case 'memoryMatch':
            case 'memory-match': 
              gameName = 'Hafıza Eşleştirme';
              gameIcon = 'fas fa-th';
              break;
            case 'labyrinth': 
              gameName = 'Labirent';
              gameIcon = 'fas fa-map-signs';
              break;
            case 'puzzle': 
              gameName = 'Puzzle';
              gameIcon = 'fas fa-puzzle-piece';
              break;
            case 'visualAttention':
            case 'visual-attention': 
              gameName = 'Görsel Dikkat';
              gameIcon = 'fas fa-eye';
              break;
            case 'numberSequence':
            case 'number-sequence': 
              gameName = 'Sayı Dizisi';
              gameIcon = 'fas fa-sort-numeric-up';
              break;
            case 'memoryCards':
            case 'memory-cards': 
              gameName = 'Hafıza Kartları';
              gameIcon = 'fas fa-clone';
              break;
            case 'numberChain':
            case 'number-chain': 
              gameName = 'Sayı Zinciri';
              gameIcon = 'fas fa-link';
              break;
            case 'audioMemory':
            case 'audio-memory': 
              gameName = 'Sesli Hafıza';
              gameIcon = 'fas fa-music';
              break;
            case 'nBack':
            case 'n-back': 
              gameName = 'N-Back';
              gameIcon = 'fas fa-brain';
              break;
            case 'sudoku': 
              gameName = 'Sudoku';
              gameIcon = 'fas fa-table';
              break;
            case '2048': 
              gameName = '2048';
              gameIcon = 'fas fa-cube';
              break;
            case 'chess': 
              gameName = 'Satranç';
              gameIcon = 'fas fa-chess';
              break;
            case 'rubikCube':
            case 'rubik-cube': 
              gameName = 'Rubik Küpü';
              gameIcon = 'fas fa-cube';
              break;
            case 'logicPuzzles':
            case 'logic-puzzles': 
              gameName = 'Mantık Bulmacaları';
              gameIcon = 'fas fa-brain';
              break;
            case 'tangram': 
              gameName = 'Tangram';
              gameIcon = 'fas fa-shapes';
              break;
            case '3dRotation':
            case '3d-rotation': 
              gameName = '3D Rotasyon';
              gameIcon = 'fas fa-cube';
              break;
            default: 
              gameName = 'Skorlar';
              gameIcon = 'fas fa-trophy';
          }
          
          try {
            // Create the leaderboard card
            const card = createLeaderboardCard(gameName, gameIcon, data);
            container.appendChild(card);
          } catch (error) {
            console.error('Error loading scores:', error);
            container.innerHTML = `
              <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
              </div>
            `;
          }
        }
      })
      .catch(error => {
        console.error('Error loading scores:', error);
        loadingIndicator.style.display = 'none';
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Skorlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `;
      });
  }
  
  // Function to create a leaderboard card
  function createLeaderboardCard(title, icon, scores) {
    const card = document.createElement('div');
    card.className = 'leaderboard-card active';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <h3><i class="${icon}"></i> ${title}</h3>
      <button class="refresh-btn"><i class="fas fa-sync-alt"></i></button>
    `;
    
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'leaderboard-table-container';
    
    if (scores && scores.length > 0) {
      // Create table
      const table = document.createElement('table');
      table.className = 'leaderboard-table';
      
      // Table header
      table.innerHTML = `
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Oyuncu</th>
            <th>Skor</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody id="scoreTableBody">
        </tbody>
      `;
      
      // Add scores to table
      const tbody = table.querySelector('#scoreTableBody');
      scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.className = 'player-row';
        
        // Format date
        const date = new Date(score.timestamp);
        const formattedDate = date.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Determine rank class
        let rankClass = '';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';
        
        // Avatar URL
        const avatarUrl = score.avatar_url ? `/static/${score.avatar_url}` : '/static/images/default-avatar.png';
        
        row.innerHTML = `
          <td class="rank-cell ${rankClass}">${index + 1}</td>
          <td>
            <div class="player-info">
              <img src="${avatarUrl}" alt="${score.username}" class="player-avatar">
              <span class="player-name">${score.username}<span class="player-rank">${score.rank}</span></span>
            </div>
          </td>
          <td class="score-cell">${score.score.toLocaleString()}</td>
          <td class="date-cell">${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
      });
      
      tableContainer.appendChild(table);
    } else {
      // No scores found
      tableContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>Bu oyunda henüz skor kaydedilmemiş. İlk sırada yer almak için hemen oynamaya başlayın!</p>
        </div>
      `;
    }
    
    // Add refresh functionality
    card.appendChild(header);
    card.appendChild(tableContainer);
    
    const refreshBtn = card.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', function() {
      // Add rotation animation
      this.classList.add('rotating');
      
      // Get the game type from the card title
      let gameType = '';
      switch(title) {
        case 'Kelime Bulmaca': gameType = 'word-puzzle'; break;
        case 'Hafıza Eşleştirme': gameType = 'memory-match'; break;
        case 'Labirent': gameType = 'labyrinth'; break;
        case 'Puzzle': gameType = 'puzzle'; break;
        case 'Görsel Dikkat': gameType = 'visual-attention'; break;
        case 'Sayı Dizisi': gameType = 'number-sequence'; break;
        case 'Hafıza Kartları': gameType = 'memory-cards'; break;
        case 'Sayı Zinciri': gameType = 'number-chain'; break;
        case 'Sesli Hafıza': gameType = 'audio-memory'; break;
        case 'N-Back': gameType = 'n-back'; break;
        case 'Sudoku': gameType = 'sudoku'; break;
        case '2048': gameType = '2048'; break;
        case 'Satranç': gameType = 'chess'; break;
        case 'Rubik Küpü': gameType = 'rubik-cube'; break;
        case 'Mantık Bulmacaları': gameType = 'logic-puzzles'; break;
        case 'Tangram': gameType = 'tangram'; break;
        case '3D Rotasyon': gameType = '3d-rotation'; break;
        default: gameType = 'all';
      }
      
      // Reload the leaderboard
      loadLeaderboard(gameType);
      
      // Remove rotation class after animation completes
      setTimeout(() => {
        this.classList.remove('rotating');
      }, 1000);
    });
    
    return card;
  }
});
