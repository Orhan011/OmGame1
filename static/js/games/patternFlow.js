
/**
 * Pattern Flow - Gelişmiş Zeka Oyunu (v1.0)
 * 
 * Bu oyun, örüntü tanıma, mantıksal çıkarım ve soyut düşünme becerilerini
 * geliştirmek için tasarlanmış ileri seviye bir bilişsel egzersizdir.
 * 
 * Özellikler:
 * - Çok boyutlu örüntü analizi
 * - Dinamik zorluk seviyesi
 * - Görsel-uzamsal ve matematiksel düşünme egzersizleri
 * - Adaptif öğrenme algoritması
 * - Zengin görsel ve işitsel geri bildirim
 */

document.addEventListener('DOMContentLoaded', function() {
  // Temel DOM Elementleri - querySelector ile daha güvenli seçim yapma
  const gameContainer = document.getElementById('pattern-flow-container');
  const patternDisplay = document.querySelector('#pattern-display') || document.createElement('div');
  const controlPanel = document.querySelector('#control-panel') || document.createElement('div');
  const scoreDisplay = document.querySelector('#score-display');
  const timerDisplay = document.querySelector('#timer-display');
  const levelDisplay = document.querySelector('#level-display');
  const startButton = document.querySelector('#start-game');
  const pauseButton = document.querySelector('#pause-game');
  const resetButton = document.querySelector('#reset-game');
  const settingsButton = document.querySelector('#settings-button');
  const feedbackArea = document.querySelector('#feedback-area') || document.createElement('div');
  const tutorialArea = document.querySelector('#tutorial-container');
  const resultsContainer = document.querySelector('#results-container');
  
  console.log("DOM elementleri yükleniyor:", {
    gameContainer: !!gameContainer,
    patternDisplay: !!patternDisplay,
    controlPanel: !!controlPanel,
    startButton: !!startButton
  });
  
  // Sonuç Ekranı Elementleri
  const finalScoreDisplay = document.getElementById('final-score');
  const highScoreDisplay = document.getElementById('high-score');
  const accuracyDisplay = document.getElementById('accuracy-display');
  const levelReachedDisplay = document.getElementById('level-reached');
  const playAgainButton = document.getElementById('play-again');
  const shareButton = document.getElementById('share-score');
  
  // Oyun Ayarları
  const SETTINGS = {
    sound: true,
    difficulty: 'normal', // easy, normal, hard
    timerEnabled: true,
    initialTime: 180, // 3 dakika
    bonusTimePerCorrect: 5,
    penaltyPerWrong: 10,
    minPatternSize: 3,
    maxPatternSize: 9,
    adaptiveDifficulty: true
  };
  
  // Oyun Durumu
  let gameState = {
    active: false,
    paused: false,
    score: 0,
    level: 1,
    currentPhase: 'observation', // observation, solution
    timeRemaining: SETTINGS.initialTime,
    timerInterval: null,
    currentPattern: [],
    targetPattern: null,
    userPattern: [],
    startTime: 0,
    endTime: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    totalQuestions: 0,
    comboMultiplier: 1,
    streak: 0,
    highestCombo: 0,
    patternHistory: []
  };
  
  // Ses Efektleri
  const sounds = {
    correct: new Audio('/static/sounds/correct.mp3'),
    wrong: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    click: new Audio('/static/sounds/click.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3'),
    hint: new Audio('/static/sounds/hint.mp3'),
    combo: new Audio('/static/sounds/combo.mp3')
  };
  
  // Görüntü Türleri
  const patternTypes = [
    'sequential',  // Ardışık değişimler
    'arithmetic',  // Aritmetik ilişkiler
    'geometric',   // Geometrik ilişkiler
    'fibonacci',   // Fibonacci benzeri seriler
    'recursive',   // Öz yinelemeli görüntüler
    'alternating', // Dönüşümlü/Alternatif görüntüler
    'mirrored',    // Aynalama görüntüleri
    'composite'    // Karmaşık, çok kurallı görüntüler
  ];
  
  // Semboller
  const symbols = {
    basic: ['■', '●', '▲', '★', '◆', '✦', '◉', '▣', '◢', '◧', '⬟', '⬢'],
    advanced: ['⎔', '⟡', '⟠', '⟢', '⟣', '⟤', '⟥', '⟦', '⟧', '⟰', '⟱', '⟲', '⟳'],
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  };
  
  // Renkler
  const colors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', 
    '#1abc9c', '#e67e22', '#34495e', '#7f8c8d', '#2c3e50'
  ];
  
  // Oyun Başlatma
  function initGame() {
    // Event Listeners - daha güvenli hale getirme
    try {
      if (startButton) {
        console.log("Start button bulundu, event listener ekleniyor");
        startButton.addEventListener('click', startGame);
      } else {
        console.error("Start button bulunamadı");
      }
      if (pauseButton) pauseButton.addEventListener('click', togglePause);
      if (resetButton) resetButton.addEventListener('click', resetGame);
      if (settingsButton) settingsButton.addEventListener('click', toggleSettings);
      
      const playAgainButton = document.querySelector('#play-again');
      const shareButton = document.querySelector('#share-score');
      
      if (playAgainButton) playAgainButton.addEventListener('click', resetGame);
      if (shareButton) shareButton.addEventListener('click', shareScore);
    } catch (error) {
      console.error("Event listener hatası:", error);
    }
    
    // Oyun konteynerini hazırla
    prepareGameContainer();
    
    // Ayarları Yükle
    loadSettings();
    
    // Tutorial Göster (ilk kez oynayan kullanıcılar için)
    showTutorial();
  }
  
  // Oyun konteynerini hazırla
  function prepareGameContainer() {
    // Görsel stilleri ayarla
    applyVisualStyles();
    
    // Arayüz oluştur
    createGameInterface();
  }
  
  // Görsel stilleri uygula
  function applyVisualStyles() {
    // Eğer CSS dosyası yoksa dinamik stil ekleme
    const styleExists = document.querySelector('link[href*="patternFlow.css"]');
    
    if (!styleExists) {
      const style = document.createElement('style');
      style.textContent = `
        /* Pattern Flow Temel Stiller */
        #pattern-flow-container {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        #pattern-display {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 20px;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          position: relative;
        }
        
        #control-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .stats-container {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .stat-box {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 8px 15px;
          color: white;
          font-weight: bold;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }
        
        .stat-label {
          font-size: 0.8rem;
          opacity: 0.7;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 1.2rem;
        }
        
        #timer-display.warning {
          color: #ff5252;
          animation: pulse 1s infinite;
        }
        
        .button-container {
          display: flex;
          gap: 10px;
        }
        
        .game-button {
          padding: 8px 15px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .game-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        #start-game {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
        }
        
        #pause-game {
          background: linear-gradient(135deg, #FFC107, #FFA000);
          color: white;
        }
        
        #reset-game {
          background: linear-gradient(135deg, #F44336, #D32F2F);
          color: white;
        }
        
        #settings-button {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
        }
        
        .pattern-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 15px;
          margin: 20px 0;
        }
        
        .pattern-item {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          transform-style: preserve-3d;
          position: relative;
        }
        
        .pattern-item:hover {
          transform: scale(1.05) translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .pattern-item.selected {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8);
        }
        
        .pattern-item.match {
          animation: match 0.5s;
        }
        
        .pattern-item.error {
          animation: error 0.5s;
        }
        
        .option-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        
        .option-item {
          min-width: 120px;
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          color: white;
          transition: all 0.3s ease;
        }
        
        .option-item:hover {
          background: rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }
        
        .option-item.selected {
          background: rgba(106, 90, 205, 0.5);
          box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.8);
        }
        
        #feedback-area {
          min-height: 50px;
          margin-top: 20px;
          text-align: center;
          color: white;
        }
        
        .feedback-message {
          padding: 10px 15px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 10px;
          animation: fadeIn 0.5s;
        }
        
        .feedback-message.success {
          background: rgba(76, 175, 80, 0.3);
          border-left: 3px solid #4CAF50;
        }
        
        .feedback-message.error {
          background: rgba(244, 67, 54, 0.3);
          border-left: 3px solid #F44336;
        }
        
        .feedback-message.info {
          background: rgba(33, 150, 243, 0.3);
          border-left: 3px solid #2196F3;
        }
        
        #tutorial-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        
        .tutorial-card {
          background: linear-gradient(135deg, #2c3e50, #34495e);
          border-radius: 15px;
          padding: 30px;
          max-width: 600px;
          color: white;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .tutorial-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .tutorial-steps {
          margin-bottom: 20px;
        }
        
        .tutorial-step {
          margin-bottom: 15px;
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }
        
        .step-number {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(106, 90, 205, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .tutorial-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        #results-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        
        #results-container.active {
          opacity: 1;
          pointer-events: all;
        }
        
        .results-card {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 15px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          color: white;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .results-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .results-header h2 {
          color: #6a5acd;
          margin-bottom: 10px;
          font-size: 2rem;
        }
        
        .results-content {
          margin-bottom: 30px;
        }
        
        .result-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .result-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .result-value {
          font-weight: bold;
        }
        
        .highlight-score {
          font-size: 2.5rem;
          color: #6a5acd;
          text-align: center;
          margin: 20px 0;
        }
        
        .results-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        .settings-panel {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        
        .settings-panel.active {
          opacity: 1;
          pointer-events: all;
        }
        
        .settings-card {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 15px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          color: white;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .settings-option {
          margin-bottom: 15px;
        }
        
        .settings-label {
          margin-bottom: 5px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .settings-controls {
          display: flex;
          gap: 10px;
        }
        
        .settings-button {
          padding: 8px 15px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.2);
          color: white;
          transition: all 0.3s ease;
        }
        
        .settings-button.active {
          background: rgba(106, 90, 205, 0.5);
        }
        
        .settings-actions {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          gap: 15px;
        }
        
        /* Animasyonlar */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes match {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); background: rgba(76, 175, 80, 0.3); }
        }
        
        @keyframes error {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); background: rgba(244, 67, 54, 0.3); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        /* Mobil optimizasyonlar */
        @media (max-width: 768px) {
          .pattern-item {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }
          
          .control-panel {
            flex-direction: column;
            align-items: stretch;
          }
          
          .stats-container {
            justify-content: center;
            margin-bottom: 15px;
          }
          
          .button-container {
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .pattern-item {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
          
          .stat-box {
            min-width: 60px;
            padding: 5px 10px;
          }
          
          .stat-value {
            font-size: 1rem;
          }
          
          .game-button {
            padding: 6px 12px;
            font-size: 0.9rem;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Oyun arayüzünü oluştur
  function createGameInterface() {
    // Kontrol paneli
    const controlPanelHTML = `
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-label">SKOR</div>
          <div class="stat-value" id="score-display">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">SEVİYE</div>
          <div class="stat-value" id="level-display">1</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">SÜRE</div>
          <div class="stat-value" id="timer-display">03:00</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">KOMBO</div>
          <div class="stat-value" id="combo-display">x1</div>
        </div>
      </div>
      <div class="button-container">
        <button id="start-game" class="game-button">
          <i class="fas fa-play"></i> BAŞLA
        </button>
        <button id="pause-game" class="game-button" disabled>
          <i class="fas fa-pause"></i> DURAKLAT
        </button>
        <button id="reset-game" class="game-button">
          <i class="fas fa-redo"></i> SIFIRLA
        </button>
        <button id="settings-button" class="game-button">
          <i class="fas fa-cog"></i> AYARLAR
        </button>
      </div>
    `;
    
    // Pattern Display
    const patternDisplayHTML = `
      <div class="phase-indicator">GÖZLEM AŞAMASI</div>
      <div class="pattern-grid" id="pattern-grid"></div>
      <div class="option-grid" id="option-grid"></div>
    `;
    
    // Tutorial
    const tutorialHTML = `
      <div class="tutorial-card">
        <div class="tutorial-header">
          <h2>Pattern Flow'a Hoş Geldiniz</h2>
          <p>Bu ileri düzey zeka oyunu, örüntü tanıma ve mantıksal düşünme becerilerinizi geliştirecek.</p>
        </div>
        <div class="tutorial-steps">
          <div class="tutorial-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <strong>Gözlem Aşaması:</strong> Size gösterilen görüntüyü dikkatlice inceleyin. Bu görüntü matematik, mantık veya görsel kurallara göre oluşturulmuştur.
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Analiz Yapın:</strong> Görüntüdeki elemanların birbiriyle ilişkisini, tekrarlayan yapıları veya aralarındaki matematiksel bağlantıları keşfetmeye çalışın.
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Çözüm Aşaması:</strong> Tespit ettiğiniz mantığa göre, görüntünün bir sonraki elemanını veya eksik parçayı seçin.
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <strong>İlerleyin:</strong> Her doğru cevap size puan ve zaman bonusu kazandırır. Seviye atladıkça örüntüler zorlaşır ve daha karmaşık mantıklar içerir.
            </div>
          </div>
        </div>
        <div class="tutorial-buttons">
          <button id="start-tutorial" class="game-button">
            <i class="fas fa-play"></i> BAŞLA
          </button>
        </div>
      </div>
    `;
    
    // Sonuç ekranı
    const resultsHTML = `
      <div class="results-card">
        <div class="results-header">
          <h2>Oyun Bitti!</h2>
          <p>Pattern Flow'da mantıksal düşünme ve örüntü tanıma becerilerinizi test ettiniz.</p>
        </div>
        <div class="highlight-score" id="final-score">0</div>
        <div class="results-content">
          <div class="result-row">
            <div class="result-label">En Yüksek Skor</div>
            <div class="result-value" id="high-score">0</div>
          </div>
          <div class="result-row">
            <div class="result-label">Doğruluk Oranı</div>
            <div class="result-value" id="accuracy-display">% 0</div>
          </div>
          <div class="result-row">
            <div class="result-label">Ulaşılan Seviye</div>
            <div class="result-value" id="level-reached">1</div>
          </div>
          <div class="result-row">
            <div class="result-label">En Yüksek Kombo</div>
            <div class="result-value" id="highest-combo">0</div>
          </div>
        </div>
        <div class="results-actions">
          <button id="play-again" class="game-button">
            <i class="fas fa-redo"></i> YENİDEN OYNA
          </button>
          <button id="share-score" class="game-button">
            <i class="fas fa-share-alt"></i> PAYLAŞ
          </button>
        </div>
      </div>
    `;
    
    // Ayarlar paneli
    const settingsHTML = `
      <div class="settings-card">
        <div class="settings-header">
          <h2>Oyun Ayarları</h2>
        </div>
        <div class="settings-option">
          <div class="settings-label">Zorluk Seviyesi</div>
          <div class="settings-controls">
            <button data-difficulty="easy" class="settings-button">Kolay</button>
            <button data-difficulty="normal" class="settings-button active">Normal</button>
            <button data-difficulty="hard" class="settings-button">Zor</button>
          </div>
        </div>
        <div class="settings-option">
          <div class="settings-label">Zamanlayıcı</div>
          <div class="settings-controls">
            <button data-timer="on" class="settings-button active">Açık</button>
            <button data-timer="off" class="settings-button">Kapalı</button>
          </div>
        </div>
        <div class="settings-option">
          <div class="settings-label">Ses</div>
          <div class="settings-controls">
            <button data-sound="on" class="settings-button active">Açık</button>
            <button data-sound="off" class="settings-button">Kapalı</button>
          </div>
        </div>
        <div class="settings-option">
          <div class="settings-label">Adaptif Zorluk</div>
          <div class="settings-controls">
            <button data-adaptive="on" class="settings-button active">Açık</button>
            <button data-adaptive="off" class="settings-button">Kapalı</button>
          </div>
        </div>
        <div class="settings-actions">
          <button id="save-settings" class="game-button">
            <i class="fas fa-save"></i> KAYDET
          </button>
          <button id="cancel-settings" class="game-button">
            <i class="fas fa-times"></i> İPTAL
          </button>
        </div>
      </div>
    `;
    
    // HTML'i konteyner içine yerleştir
    if (controlPanel) controlPanel.innerHTML = controlPanelHTML;
    if (patternDisplay) patternDisplay.innerHTML = patternDisplayHTML;
    if (tutorialArea) tutorialArea.innerHTML = tutorialHTML;
    if (resultsContainer) resultsContainer.innerHTML = resultsHTML;
    
    // Ayarlar panelini dinamik olarak oluştur
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'settings-panel';
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = settingsHTML;
    
    if (gameContainer) {
      gameContainer.appendChild(settingsPanel);
      
      // Event listener'ları ayarla
      const startTutorial = document.getElementById('start-tutorial');
      if (startTutorial) {
        startTutorial.addEventListener('click', closeTutorial);
      } else {
        console.error('Start tutorial button bulunamadı');
      }
      document.getElementById('save-settings').addEventListener('click', saveSettings);
      document.getElementById('cancel-settings').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.remove('active');
      });
      
      // Zorluk seçimi
      const difficultyButtons = document.querySelectorAll('[data-difficulty]');
      difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
          difficultyButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          SETTINGS.difficulty = this.dataset.difficulty;
        });
      });
      
      // Zamanlayıcı seçimi
      const timerButtons = document.querySelectorAll('[data-timer]');
      timerButtons.forEach(button => {
        button.addEventListener('click', function() {
          timerButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          SETTINGS.timerEnabled = this.dataset.timer === 'on';
        });
      });
      
      // Ses seçimi
      const soundButtons = document.querySelectorAll('[data-sound]');
      soundButtons.forEach(button => {
        button.addEventListener('click', function() {
          soundButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          SETTINGS.sound = this.dataset.sound === 'on';
        });
      });
      
      // Adaptif zorluk seçimi
      const adaptiveButtons = document.querySelectorAll('[data-adaptive]');
      adaptiveButtons.forEach(button => {
        button.addEventListener('click', function() {
          adaptiveButtons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');
          SETTINGS.adaptiveDifficulty = this.dataset.adaptive === 'on';
        });
      });
    }
  }
  
  // Tutorial göster
  function showTutorial() {
    if (tutorialArea) {
      tutorialArea.style.display = 'flex';
    }
  }
  
  // Tutorial'ı kapat
  function closeTutorial() {
    if (tutorialArea) {
      tutorialArea.style.display = 'none';
    }
  }
  
  // Oyunu başlat
  function startGame() {
    gameState.active = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.totalQuestions = 0;
    gameState.comboMultiplier = 1;
    gameState.streak = 0;
    gameState.highestCombo = 0;
    gameState.timeRemaining = SETTINGS.initialTime;
    gameState.patternHistory = [];
    
    // UI güncelle
    updateUI();
    
    // Butonları güncelle
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetButton.disabled = false;
    
    // Zamanlayıcıyı başlat
    if (SETTINGS.timerEnabled) {
      startTimer();
    }
    
    // İlk örüntüyü oluştur
    generatePattern();
    
    // Ses çal
    playSound('click');
    
    // Bildirim göster
    showFeedback('Oyun başladı! Görüntüyü analiz edin...', 'info');
  }
  
  // Oyunu duraklat/devam ettir
  function togglePause() {
    if (!gameState.active) return;
    
    gameState.paused = !gameState.paused;
    
    if (gameState.paused) {
      // Zamanlayıcıyı durdur
      clearInterval(gameState.timerInterval);
      
      // Buton metnini güncelle
      pauseButton.innerHTML = '<i class="fas fa-play"></i> DEVAM';
      
      // Bildirim göster
      showFeedback('Oyun duraklatıldı', 'info');
    } else {
      // Zamanlayıcıyı yeniden başlat
      if (SETTINGS.timerEnabled) {
        gameState.timerInterval = setInterval(updateTimer, 1000);
      }
      
      // Buton metnini güncelle
      pauseButton.innerHTML = '<i class="fas fa-pause"></i> DURAKLAT';
      
      // Bildirim göster
      showFeedback('Oyun devam ediyor', 'info');
    }
    
    // Ses çal
    playSound('click');
  }
  
  // Oyunu sıfırla
  function resetGame() {
    // Oyunu durdur
    gameState.active = false;
    clearInterval(gameState.timerInterval);
    
    // Sonuç ekranını kapat
    if (resultsContainer) {
      resultsContainer.classList.remove('active');
    }
    
    // Butonları güncelle
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.innerHTML = '<i class="fas fa-pause"></i> DURAKLAT';
    
    // Alanları temizle
    clearGameArea();
    
    // Değerleri sıfırla
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeRemaining = SETTINGS.initialTime;
    
    // UI güncelle
    updateUI();
    
    // Ses çal
    playSound('click');
    
    // Bildirim göster
    showFeedback('Oyun sıfırlandı', 'info');
  }
  
  // Oyun alanını temizle
  function clearGameArea() {
    const patternGrid = document.getElementById('pattern-grid');
    const optionGrid = document.getElementById('option-grid');
    
    if (patternGrid) patternGrid.innerHTML = '';
    if (optionGrid) optionGrid.innerHTML = '';
  }
  
  // Ayarlar panelini göster
  function toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      settingsPanel.classList.toggle('active');
      
      // Mevcut ayarları seçili göster
      document.querySelector(`[data-difficulty="${SETTINGS.difficulty}"]`).classList.add('active');
      document.querySelector(`[data-timer="${SETTINGS.timerEnabled ? 'on' : 'off'}"]`).classList.add('active');
      document.querySelector(`[data-sound="${SETTINGS.sound ? 'on' : 'off'}"]`).classList.add('active');
      document.querySelector(`[data-adaptive="${SETTINGS.adaptiveDifficulty ? 'on' : 'off'}"]`).classList.add('active');
    }
    
    // Ses çal
    playSound('click');
  }
  
  // Ayarları kaydet
  function saveSettings() {
    // Ayarlar kaydedildi, paneli kapat
    document.getElementById('settings-panel').classList.remove('active');
    
    // Bildirim göster
    showFeedback('Ayarlar kaydedildi', 'success');
    
    // Ses çal
    playSound('click');
  }
  
  // Zamanlayıcıyı başlat
  function startTimer() {
    // Önceki zamanlayıcıyı temizle
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    // Zamanlayıcıyı başlat
    gameState.timerInterval = setInterval(updateTimer, 1000);
  }
  
  // Zamanlayıcıyı güncelle
  function updateTimer() {
    if (gameState.paused) return;
    
    gameState.timeRemaining--;
    
    // Zamanı güncelle
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Uyarı stili
    if (gameState.timeRemaining <= 30) {
      timerDisplay.classList.add('warning');
    } else {
      timerDisplay.classList.remove('warning');
    }
    
    // Süre doldu mu kontrol et
    if (gameState.timeRemaining <= 0) {
      endGame();
    }
  }
  
  // Yeni bir örüntü oluştur
  function generatePattern() {
    // Zorluk seviyesine göre örüntü boyutunu belirle
    const patternSize = determinePatternSize();
    
    // Örüntü türünü belirle
    const patternType = determinePatternType();
    
    // Sembol setini belirle
    const symbolSet = determineSymbolSet();
    
    // Örüntüyü oluştur
    const pattern = createPattern(patternType, patternSize, symbolSet);
    
    // Hedef (doğru cevabı) belirle
    const target = determineTarget(pattern, patternType);
    
    // Seçenekleri oluştur
    const options = createOptions(target, symbolSet);
    
    // Oyun durumunu güncelle
    gameState.currentPattern = pattern;
    gameState.targetPattern = target;
    gameState.currentPhase = 'observation';
    
    // UI'yi güncelle
    displayPattern(pattern);
    displayPhaseIndicator('GÖZLEM AŞAMASI');
    
    // Gözlem süresi sonunda çözüm aşamasına geç
    const observationTime = determineObservationTime();
    
    setTimeout(() => {
      if (!gameState.active || gameState.paused) return;
      
      gameState.currentPhase = 'solution';
      displayPhaseIndicator('ÇÖZÜM AŞAMASI');
      displayOptions(options);
      
      // Analiz için başlangıç zamanını kaydet
      gameState.startTime = Date.now();
    }, observationTime);
  }
  
  // Örüntü boyutunu belirle
  function determinePatternSize() {
    // Zorluk seviyesine göre temel boyut
    const baseSize = SETTINGS.minPatternSize;
    
    // Seviyeye göre ek boyut
    const levelBonus = Math.min(Math.floor(gameState.level / 2), SETTINGS.maxPatternSize - baseSize);
    
    // Zorluk çarpanı
    const difficultyMultiplier = {
      'easy': 0.5,
      'normal': 1,
      'hard': 1.5
    }[SETTINGS.difficulty];
    
    // Toplam boyut
    return Math.min(
      SETTINGS.maxPatternSize,
      Math.floor(baseSize + (levelBonus * difficultyMultiplier))
    );
  }
  
  // Örüntü türünü belirle
  function determinePatternType() {
    // Seviyeye göre kullanılabilir örüntü türleri
    let availableTypes = [];
    
    if (gameState.level <= 3) {
      // Kolay seviyeler: Basit örüntü türleri
      availableTypes = ['sequential', 'arithmetic', 'mirrored'];
    } else if (gameState.level <= 7) {
      // Orta seviyeler: Orta zorlukta örüntü türleri
      availableTypes = ['sequential', 'arithmetic', 'geometric', 'mirrored', 'alternating'];
    } else {
      // Zor seviyeler: Tüm örüntü türleri
      availableTypes = patternTypes;
    }
    
    // Rastgele bir tür seç
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  
  // Sembol setini belirle
  function determineSymbolSet() {
    // Seviyeye göre sembol seti
    if (gameState.level <= 3) {
      return symbols.basic;
    } else if (gameState.level <= 6) {
      return Math.random() > 0.5 ? symbols.basic : symbols.letters;
    } else if (gameState.level <= 10) {
      const sets = [symbols.basic, symbols.letters, symbols.numbers];
      return sets[Math.floor(Math.random() * sets.length)];
    } else {
      const sets = [symbols.basic, symbols.letters, symbols.numbers, symbols.advanced];
      return sets[Math.floor(Math.random() * sets.length)];
    }
  }
  
  // Belirli bir tür için örüntü oluştur
  function createPattern(type, size, symbolSet) {
    const pattern = [];
    
    switch (type) {
      case 'sequential':
        // Ardışık elemanlar
        const startIndex = Math.floor(Math.random() * (symbolSet.length - size));
        for (let i = 0; i < size; i++) {
          pattern.push({
            symbol: symbolSet[(startIndex + i) % symbolSet.length],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        break;
        
      case 'arithmetic':
        // Aritmetik ilişkiler (örn: 2, 4, 6, 8, ...)
        const step = Math.max(1, Math.floor(Math.random() * 3));
        const start = Math.floor(Math.random() * (symbolSet.length - size * step));
        
        for (let i = 0; i < size; i++) {
          pattern.push({
            symbol: symbolSet[(start + i * step) % symbolSet.length],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        break;
        
      case 'geometric':
        // Geometrik ilişkiler (örn: 2, 4, 8, 16, ...)
        if (symbolSet === symbols.numbers) {
          // Sayılar için geometrik dizi
          const base = Math.floor(Math.random() * 3) + 2; // 2, 3, veya 4
          const startValue = Math.floor(Math.random() * 3) + 1; // 1, 2, veya 3
          
          let value = startValue;
          for (let i = 0; i < size; i++) {
            pattern.push({
              symbol: (value % 10).toString(),
              color: colors[Math.floor(Math.random() * colors.length)]
            });
            value *= base;
          }
        } else {
          // Diğer semboller için çarpan tabanlı dizi
          const ratio = Math.floor(Math.random() * 2) + 2; // 2 veya 3
          const start = Math.floor(Math.random() * (symbolSet.length / 2));
          
          for (let i = 0; i < size; i++) {
            const index = (start * Math.pow(ratio, i)) % symbolSet.length;
            pattern.push({
              symbol: symbolSet[Math.floor(index)],
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
        }
        break;
        
      case 'fibonacci':
        // Fibonacci benzeri seriler
        if (symbolSet === symbols.numbers) {
          // Sayılar için fibonacci
          let a = 1, b = 1;
          
          for (let i = 0; i < size; i++) {
            if (i < 2) {
              pattern.push({
                symbol: '1',
                color: colors[Math.floor(Math.random() * colors.length)]
              });
            } else {
              const next = (a + b) % 10; // 0-9 arası
              pattern.push({
                symbol: next.toString(),
                color: colors[Math.floor(Math.random() * colors.length)]
              });
              a = b;
              b = next;
            }
          }
        } else {
          // Diğer semboller için
          const indices = [0, 1];
          
          for (let i = 0; i < size; i++) {
            if (i < 2) {
              pattern.push({
                symbol: symbolSet[i % symbolSet.length],
                color: colors[Math.floor(Math.random() * colors.length)]
              });
            } else {
              const nextIndex = (indices[i-1] + indices[i-2]) % symbolSet.length;
              indices.push(nextIndex);
              pattern.push({
                symbol: symbolSet[nextIndex],
                color: colors[Math.floor(Math.random() * colors.length)]
              });
            }
          }
        }
        break;
        
      case 'mirrored':
        // Aynalama örüntüleri
        const halfSize = Math.ceil(size / 2);
        
        // İlk yarıyı rastgele doldur
        for (let i = 0; i < halfSize; i++) {
          pattern.push({
            symbol: symbolSet[Math.floor(Math.random() * symbolSet.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        
        // İkinci yarı, ilk yarının aynası
        for (let i = size - halfSize - 1; i >= 0; i--) {
          pattern.push({
            symbol: pattern[i].symbol,
            color: pattern[i].color
          });
        }
        break;
        
      case 'alternating':
        // Dönüşümlü örüntüler (örn: A, B, A, B, ...)
        const alternationLength = Math.min(3, Math.max(2, Math.floor(Math.random() * 3) + 2));
        const basePattern = [];
        
        // Temel dönüşüm örüntüsünü oluştur
        for (let i = 0; i < alternationLength; i++) {
          basePattern.push({
            symbol: symbolSet[Math.floor(Math.random() * symbolSet.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        
        // Örüntüyü tekrarlayarak doldur
        for (let i = 0; i < size; i++) {
          pattern.push({...basePattern[i % alternationLength]});
        }
        break;
        
      case 'recursive':
        // Öz yinelemeli örüntüler
        if (symbolSet === symbols.numbers) {
          let lastValue = Math.floor(Math.random() * 5) + 1;
          pattern.push({
            symbol: lastValue.toString(),
            color: colors[Math.floor(Math.random() * colors.length)]
          });
          
          for (let i = 1; i < size; i++) {
            // Son değerin karesinin son basamağı veya küpünün son basamağı
            const operation = Math.random() > 0.5 ? 'square' : 'cube';
            
            if (operation === 'square') {
              lastValue = (lastValue * lastValue) % 10;
            } else {
              lastValue = (lastValue * lastValue * lastValue) % 10;
            }
            
            pattern.push({
              symbol: lastValue.toString(),
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
        } else {
          // Diğer semboller için basitleştirilmiş öz yineleme
          const initialIndex = Math.floor(Math.random() * symbolSet.length);
          pattern.push({
            symbol: symbolSet[initialIndex],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
          
          for (let i = 1; i < size; i++) {
            // Son sembolün indeksinin iki katının mod'u
            const lastIndex = symbolSet.indexOf(pattern[i-1].symbol);
            const nextIndex = (lastIndex * 2) % symbolSet.length;
            
            pattern.push({
              symbol: symbolSet[nextIndex],
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
        }
        break;
        
      case 'composite':
        // Karmaşık, çok kurallı örüntüler
        // Birkaç kuralı birleştir
        
        // Örneğin, ardışık ve ayna kurallarını birleştir
        const quarterSize = Math.ceil(size / 4);
        
        // İlk çeyrek: Ardışık
        const startIdx = Math.floor(Math.random() * (symbolSet.length / 2));
        for (let i = 0; i < quarterSize; i++) {
          pattern.push({
            symbol: symbolSet[(startIdx + i) % symbolSet.length],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        
        // İkinci çeyrek: İlk çeyreğin tersi
        for (let i = quarterSize - 1; i >= 0; i--) {
          pattern.push({
            symbol: pattern[i].symbol,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
        
        // Kalan kısım: Fibonacci benzeri
        const remaining = size - (quarterSize * 2);
        if (remaining > 0) {
          let a = symbolSet.indexOf(pattern[0].symbol);
          let b = symbolSet.indexOf(pattern[quarterSize].symbol);
          
          for (let i = 0; i < remaining; i++) {
            const nextIndex = (a + b) % symbolSet.length;
            pattern.push({
              symbol: symbolSet[nextIndex],
              color: colors[Math.floor(Math.random() * colors.length)]
            });
            a = b;
            b = nextIndex;
          }
        }
        break;
        
      default:
        // Varsayılan olarak rastgele örüntü
        for (let i = 0; i < size; i++) {
          pattern.push({
            symbol: symbolSet[Math.floor(Math.random() * symbolSet.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
    }
    
    return pattern;
  }
  
  // Hedef (doğru cevabı) belirle
  function determineTarget(pattern, patternType) {
    // Örüntü tipine göre doğru cevabı belirle
    switch (patternType) {
      case 'sequential':
        // Bir sonraki ardışık eleman
        const lastIndex = pattern.length - 1;
        const symbolIndex = pattern[0].symbol.charCodeAt(0) + pattern.length % pattern[0].symbol.length;
        return {
          symbol: String.fromCharCode(symbolIndex),
          color: pattern[lastIndex].color
        };
        
      case 'arithmetic':
        // Aritmetik ilerlemeyi devam ettir
        if (pattern.length >= 2) {
          const lastIndex = pattern.length - 1;
          const lastSymbolIndex = pattern[lastIndex].symbol.charCodeAt(0);
          const secondLastSymbolIndex = pattern[lastIndex - 1].symbol.charCodeAt(0);
          const difference = lastSymbolIndex - secondLastSymbolIndex;
          
          return {
            symbol: String.fromCharCode(lastSymbolIndex + difference),
            color: pattern[lastIndex].color
          };
        }
        break;
        
      case 'geometric':
        // Geometrik ilerlemeyi devam ettir
        if (pattern.length >= 2 && pattern[0].symbol.match(/[0-9]/)) {
          const lastIndex = pattern.length - 1;
          const lastValue = parseInt(pattern[lastIndex].symbol);
          const secondLastValue = parseInt(pattern[lastIndex - 1].symbol);
          
          if (secondLastValue !== 0) {
            const ratio = lastValue / secondLastValue;
            const nextValue = Math.round(lastValue * ratio) % 10;
            
            return {
              symbol: nextValue.toString(),
              color: pattern[lastIndex].color
            };
          }
        }
        break;
        
      case 'fibonacci':
        // Fibonacci dizisini devam ettir
        if (pattern.length >= 2) {
          const lastIndex = pattern.length - 1;
          
          if (pattern[0].symbol.match(/[0-9]/)) {
            // Sayısal fibonacci
            const lastValue = parseInt(pattern[lastIndex].symbol);
            const secondLastValue = parseInt(pattern[lastIndex - 1].symbol);
            const nextValue = (lastValue + secondLastValue) % 10;
            
            return {
              symbol: nextValue.toString(),
              color: pattern[lastIndex].color
            };
          } else {
            // Sembolik fibonacci
            const symbolSet = determinePatternSymbolSet(pattern);
            const lastSymbolIndex = symbolSet.indexOf(pattern[lastIndex].symbol);
            const secondLastSymbolIndex = symbolSet.indexOf(pattern[lastIndex - 1].symbol);
            
            if (lastSymbolIndex !== -1 && secondLastSymbolIndex !== -1) {
              const nextIndex = (lastSymbolIndex + secondLastSymbolIndex) % symbolSet.length;
              
              return {
                symbol: symbolSet[nextIndex],
                color: pattern[lastIndex].color
              };
            }
          }
        }
        break;
        
      case 'mirrored':
        // Aynalama örüntüsüne uygun yeni eleman
        const halfSize = Math.ceil(pattern.length / 2);
        
        if (pattern.length % 2 === 0) {
          // Çift uzunluklu örüntü, ortadan aynalama
          return {
            symbol: pattern[0].symbol,
            color: pattern[0].color
          };
        } else {
          // Tek uzunluklu örüntü, ortadan aynalama
          return {
            symbol: pattern[pattern.length - halfSize].symbol,
            color: pattern[pattern.length - halfSize].color
          };
        }
        break;
        
      case 'alternating':
        // Dönüşümlü örüntüyü devam ettir
        // Temel dönüşüm uzunluğunu bul
        for (let i = 2; i <= Math.min(6, Math.floor(pattern.length / 2)); i++) {
          let isRepeating = true;
          
          for (let j = 0; j < i && j + i < pattern.length; j++) {
            if (pattern[j].symbol !== pattern[j + i].symbol) {
              isRepeating = false;
              break;
            }
          }
          
          if (isRepeating) {
            // i uzunluğunda tekrarlayan desen bulundu
            return {
              symbol: pattern[pattern.length % i].symbol,
              color: pattern[pattern.length - 1].color
            };
          }
        }
        
        // Belirgin bir desen bulunamadıysa, son elemanı tekrarla
        return {
          symbol: pattern[pattern.length - 1].symbol,
          color: pattern[pattern.length - 1].color
        };
        
      case 'recursive':
        // Öz yinelemeli örüntüyü devam ettir
        if (pattern.length >= 2 && pattern[0].symbol.match(/[0-9]/)) {
          const lastValue = parseInt(pattern[pattern.length - 1].symbol);
          const nextValue = (lastValue * lastValue) % 10;
          
          return {
            symbol: nextValue.toString(),
            color: pattern[pattern.length - 1].color
          };
        } else {
          // Sembolik öz yineleme
          const symbolSet = determinePatternSymbolSet(pattern);
          const lastSymbolIndex = symbolSet.indexOf(pattern[pattern.length - 1].symbol);
          
          if (lastSymbolIndex !== -1) {
            const nextIndex = (lastSymbolIndex * 2) % symbolSet.length;
            
            return {
              symbol: symbolSet[nextIndex],
              color: pattern[pattern.length - 1].color
            };
          }
        }
        break;
        
      case 'composite':
        // Karmaşık örüntüler için basit bir yaklaşım
        // Örneğin, son üç elemanı analiz et
        if (pattern.length >= 3) {
          const last3 = pattern.slice(pattern.length - 3);
          
          // Son üç eleman arasında ardışık ilişki var mı?
          if (symbolHasSequentialPattern(last3)) {
            const lastSymbol = last3[2].symbol;
            const secondLastSymbol = last3[1].symbol;
            
            // Ardışık farkı hesapla
            const diff = lastSymbol.charCodeAt(0) - secondLastSymbol.charCodeAt(0);
            const nextSymbol = String.fromCharCode(lastSymbol.charCodeAt(0) + diff);
            
            return {
              symbol: nextSymbol,
              color: last3[2].color
            };
          }
          
          // Else, try other patterns...
        }
        break;
        
      default:
        // Varsayılan olarak son elemanı tekrarla
        return {
          symbol: pattern[pattern.length - 1].symbol,
          color: pattern[pattern.length - 1].color
        };
    }
    
    // Varsayılan olarak son elemanı tekrarla
    return {
      symbol: pattern[pattern.length - 1].symbol,
      color: pattern[pattern.length - 1].color
    };
  }
  
  // Seçenekleri oluştur
  function createOptions(target, symbolSet) {
    const options = [target]; // Doğru cevap
    
    // Olası seçenek sayısı
    const optionCount = Math.min(6, Math.max(4, Math.floor(gameState.level / 2) + 3));
    
    // Yanlış seçenekler ekle
    while (options.length < optionCount) {
      const randomSymbol = symbolSet[Math.floor(Math.random() * symbolSet.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Zaten eklenmiş bir seçenek mi kontrol et
      const isDuplicate = options.some(option => 
        option.symbol === randomSymbol && option.color === randomColor
      );
      
      if (!isDuplicate) {
        options.push({
          symbol: randomSymbol,
          color: randomColor
        });
      }
    }
    
    // Seçenekleri karıştır
    return shuffleArray(options);
  }
  
  // Örüntüyü ekranda göster
  function displayPattern(pattern) {
    const patternGrid = document.getElementById('pattern-grid');
    if (!patternGrid) return;
    
    // Grid'i temizle
    patternGrid.innerHTML = '';
    
    // Her eleman için bir kartı göster
    pattern.forEach((item, index) => {
      const patternItem = document.createElement('div');
      patternItem.className = 'pattern-item';
      patternItem.style.backgroundColor = item.color;
      patternItem.style.color = getContrastColor(item.color);
      patternItem.textContent = item.symbol;
      
      // Gösterme animasyonu
      patternItem.style.animationDelay = `${index * 100}ms`;
      
      // Elemente ekle
      patternGrid.appendChild(patternItem);
    });
    
    // "?" işareti ile sonraki elemanı ima et
    const nextItem = document.createElement('div');
    nextItem.className = 'pattern-item next-item';
    nextItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    nextItem.textContent = '?';
    
    patternGrid.appendChild(nextItem);
  }
  
  // Seçenekleri ekranda göster
  function displayOptions(options) {
    const optionGrid = document.getElementById('option-grid');
    if (!optionGrid) return;
    
    // Grid'i temizle
    optionGrid.innerHTML = '';
    
    // Her seçenek için bir kartı göster
    options.forEach((item, index) => {
      const optionItem = document.createElement('div');
      optionItem.className = 'pattern-item option-item';
      optionItem.style.backgroundColor = item.color;
      optionItem.style.color = getContrastColor(item.color);
      optionItem.textContent = item.symbol;
      
      // Gösterme animasyonu
      optionItem.style.animationDelay = `${index * 100}ms`;
      
      // Tıklama olayı
      optionItem.addEventListener('click', () => {
        if (gameState.paused) return;
        
        // Cevap verme süresini hesapla
        gameState.endTime = Date.now();
        const responseTime = gameState.endTime - gameState.startTime;
        
        checkAnswer(item, index, responseTime);
      });
      
      // Elemente ekle
      optionGrid.appendChild(optionItem);
    });
  }
  
  // Aşama göstergesini güncelle
  function displayPhaseIndicator(text) {
    const phaseIndicator = document.querySelector('.phase-indicator');
    if (phaseIndicator) {
      phaseIndicator.textContent = text;
    }
  }
  
  // Cevabı kontrol et
  function checkAnswer(selectedOption, optionIndex, responseTime) {
    const isCorrect = (
      selectedOption.symbol === gameState.targetPattern.symbol &&
      selectedOption.color === gameState.targetPattern.color
    );
    
    gameState.totalQuestions++;
    
    if (isCorrect) {
      // Doğru cevap
      gameState.correctAnswers++;
      
      // Combo'yu artır
      gameState.streak++;
      gameState.highestCombo = Math.max(gameState.highestCombo, gameState.streak);
      
      // Combo çarpanını güncelle
      updateComboMultiplier();
      
      // Puanı hesapla
      const basePoints = 10;
      const levelBonus = gameState.level * 2;
      const timeBonus = Math.max(0, 20 - Math.floor(responseTime / 1000)) * 2;
      const comboBonus = Math.floor(basePoints * (gameState.comboMultiplier - 1));
      
      const totalPoints = (basePoints + levelBonus + timeBonus) * gameState.comboMultiplier;
      
      // Puanı ekle
      gameState.score += totalPoints;
      
      // Zaman bonusu ekle (eğer zamanlayıcı aktifse)
      if (SETTINGS.timerEnabled) {
        gameState.timeRemaining += SETTINGS.bonusTimePerCorrect;
      }
      
      // Doğru cevabı vurgula
      highlightAnswer(optionIndex, true);
      
      // Ses çal
      playSound(gameState.comboMultiplier >= 2 ? 'combo' : 'correct');
      
      // Bildirim göster
      showFeedback(`Doğru! +${totalPoints} puan ${comboBonus > 0 ? `(+${comboBonus} kombo bonus)` : ''}`, 'success');
    } else {
      // Yanlış cevap
      gameState.wrongAnswers++;
      
      // Streaki sıfırla
      gameState.streak = 0;
      gameState.comboMultiplier = 1;
      
      // Zaman cezası (eğer zamanlayıcı aktifse)
      if (SETTINGS.timerEnabled) {
        gameState.timeRemaining = Math.max(0, gameState.timeRemaining - SETTINGS.penaltyPerWrong);
      }
      
      // Yanlış cevabı vurgula ve doğru cevabı göster
      highlightAnswer(optionIndex, false);
      highlightCorrectAnswer();
      
      // Ses çal
      playSound('wrong');
      
      // Bildirim göster
      showFeedback('Yanlış cevap! Doğru cevap işaretlendi.', 'error');
    }
    
    // UI'yı güncelle
    updateUI();
    
    // Seviye kontrolü
    checkLevelUp();
    
    // Kısa bir gecikme sonra bir sonraki örüntüye geç
    setTimeout(() => {
      if (gameState.active && !gameState.paused) {
        generatePattern();
      }
    }, isCorrect ? 1500 : 2500);
  }
  
  // Kombo çarpanını güncelle
  function updateComboMultiplier() {
    if (gameState.streak >= 10) {
      gameState.comboMultiplier = 3.0;
    } else if (gameState.streak >= 7) {
      gameState.comboMultiplier = 2.5;
    } else if (gameState.streak >= 5) {
      gameState.comboMultiplier = 2.0;
    } else if (gameState.streak >= 3) {
      gameState.comboMultiplier = 1.5;
    } else {
      gameState.comboMultiplier = 1.0;
    }
  }
  
  // Seçilen cevabı vurgula
  function highlightAnswer(index, isCorrect) {
    const optionItems = document.querySelectorAll('.option-item');
    if (!optionItems || optionItems.length <= index) return;
    
    optionItems[index].classList.add(isCorrect ? 'match' : 'error');
    optionItems.forEach(item => {
      item.style.pointerEvents = 'none';
    });
  }
  
  // Doğru cevabı vurgula
  function highlightCorrectAnswer() {
    const optionItems = document.querySelectorAll('.option-item');
    if (!optionItems) return;
    
    // Her seçeneği kontrol et
    optionItems.forEach((item, index) => {
      const backgroundColor = item.style.backgroundColor;
      const symbol = item.textContent;
      
      // Hedef örüntü ile karşılaştır
      if (
        symbol === gameState.targetPattern.symbol &&
        compareColors(backgroundColor, gameState.targetPattern.color)
      ) {
        // Doğru cevabı vurgula
        item.classList.add('match');
      }
    });
  }
  
  // Seviye atlamayı kontrol et
  function checkLevelUp() {
    // Doğru cevap oranı
    const correctRatio = gameState.correctAnswers / gameState.totalQuestions;
    
    // Minimum doğru soru sayısı kontrolü
    if (gameState.correctAnswers >= gameState.level * 3 && correctRatio >= 0.7) {
      // Seviyeyi artır
      gameState.level++;
      
      // Seviye atlama bildirimi
      showFeedback(`Tebrikler! Seviye ${gameState.level}'e yükseldiniz!`, 'success');
      
      // Seviye atlama sesi
      playSound('levelUp');
    }
  }
  
  // Gözlem süresi belirle
  function determineObservationTime() {
    // Temel süre (ms)
    const baseTime = 5000;
    
    // Zorluk çarpanı
    const difficultyMultiplier = {
      'easy': 1.5,
      'normal': 1.0,
      'hard': 0.7
    }[SETTINGS.difficulty];
    
    // Seviye zorluğu
    const levelFactor = Math.max(0.5, 1 - (gameState.level - 1) * 0.05);
    
    // Toplam süre
    return Math.max(2000, Math.floor(baseTime * difficultyMultiplier * levelFactor));
  }
  
  // Bildirim göster
  function showFeedback(message, type = 'info') {
    const feedbackArea = document.getElementById('feedback-area');
    if (!feedbackArea) return;
    
    const feedbackMessage = document.createElement('div');
    feedbackMessage.className = `feedback-message ${type}`;
    feedbackMessage.textContent = message;
    
    // Var olan bildirimleri temizle
    feedbackArea.innerHTML = '';
    
    // Yeni bildirimi ekle
    feedbackArea.appendChild(feedbackMessage);
    
    // Belirli bir süre sonra kaldır
    setTimeout(() => {
      if (feedbackArea.contains(feedbackMessage)) {
        feedbackMessage.style.opacity = '0';
        setTimeout(() => {
          if (feedbackArea.contains(feedbackMessage)) {
            feedbackArea.removeChild(feedbackMessage);
          }
        }, 500);
      }
    }, 3000);
  }
  
  // Oyunu bitir
  function endGame() {
    // Oyun durumunu güncelle
    gameState.active = false;
    
    // Zamanlayıcıyı durdur
    clearInterval(gameState.timerInterval);
    
    // Sonuçları göster
    displayResults();
    
    // Ses çal
    playSound('gameOver');
    
    // Butonları güncelle
    startButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.innerHTML = '<i class="fas fa-pause"></i> DURAKLAT';
    
    // Skoru kaydet
    saveScore();
  }
  
  // Sonuçları göster
  function displayResults() {
    // Sonuç ekranını getir
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // Sonuç verilerini güncelle
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreDisplay = document.getElementById('high-score');
    const accuracyDisplay = document.getElementById('accuracy-display');
    const levelReachedDisplay = document.getElementById('level-reached');
    const highestComboDisplay = document.getElementById('highest-combo');
    
    if (finalScoreDisplay) finalScoreDisplay.textContent = gameState.score;
    
    // Yüksek skoru kontrol et (localStorage)
    const highScore = getHighScore();
    if (highScoreDisplay) highScoreDisplay.textContent = highScore;
    
    // Doğruluk oranı
    const accuracy = gameState.totalQuestions > 0 
      ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) 
      : 0;
      
    if (accuracyDisplay) accuracyDisplay.textContent = `% ${accuracy}`;
    
    // Seviye
    if (levelReachedDisplay) levelReachedDisplay.textContent = gameState.level;
    
    // En yüksek kombo
    if (highestComboDisplay) highestComboDisplay.textContent = gameState.highestCombo;
    
    // Sonuç ekranını göster
    resultsContainer.classList.add('active');
  }
  
  // Skoru kaydet
  function saveScore() {
    // Yerel depolamada yüksek skoru güncelle
    const highScore = getHighScore();
    if (gameState.score > highScore) {
      localStorage.setItem('patternFlow_highScore', gameState.score);
    }
    
    // Sunucuya skor kaydet
    try {
      fetch('/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game_type: 'patternFlow',
          score: gameState.score,
          level: gameState.level,
          accuracy: gameState.totalQuestions > 0 
            ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) 
            : 0,
          highest_combo: gameState.highestCombo,
          time_played: SETTINGS.initialTime - gameState.timeRemaining
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Score saved:', data);
      })
      .catch(error => {
        console.error('Error saving score:', error);
      });
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }
  
  // Yüksek skoru al
  function getHighScore() {
    return parseInt(localStorage.getItem('patternFlow_highScore') || '0');
  }
  
  // Skoru paylaş
  function shareScore() {
    const scoreText = `Pattern Flow'da ${gameState.score} puan topladım! Seviye ${gameState.level}'e ulaştım ve en yüksek kombom ${gameState.highestCombo}. ZekaPark'ta dene!`;
    
    // Paylaşım API'sini kullan (varsa)
    if (navigator.share) {
      navigator.share({
        title: 'Pattern Flow Skorumu Paylaş',
        text: scoreText
      })
      .catch(error => {
        console.log('Sharing failed:', error);
        // Fallback: Panoya kopyala
        copyToClipboard(scoreText);
      });
    } else {
      // Fallback: Panoya kopyala
      copyToClipboard(scoreText);
    }
  }
  
  // Panoya kopyala
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      showFeedback(successful ? 'Skor panoya kopyalandı!' : 'Kopyalama başarısız oldu!', successful ? 'success' : 'error');
    } catch (err) {
      showFeedback('Kopyalama başarısız oldu!', 'error');
    }
    
    document.body.removeChild(textarea);
  }
  
  // UI'yı güncelle
  function updateUI() {
    // Skor
    if (scoreDisplay) scoreDisplay.textContent = gameState.score;
    
    // Seviye
    if (levelDisplay) levelDisplay.textContent = gameState.level;
    
    // Zamanlayıcı
    if (timerDisplay && SETTINGS.timerEnabled) {
      const minutes = Math.floor(gameState.timeRemaining / 60);
      const seconds = gameState.timeRemaining % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Uyarı stili
      if (gameState.timeRemaining <= 30) {
        timerDisplay.classList.add('warning');
      } else {
        timerDisplay.classList.remove('warning');
      }
    }
    
    // Kombo
    const comboDisplay = document.getElementById('combo-display');
    if (comboDisplay) {
      comboDisplay.textContent = `x${gameState.comboMultiplier.toFixed(1)}`;
      
      // Kombo renklendirme
      comboDisplay.style.color = '';
      if (gameState.comboMultiplier >= 3) {
        comboDisplay.style.color = '#f44336'; // Kırmızı
      } else if (gameState.comboMultiplier >= 2) {
        comboDisplay.style.color = '#ff9800'; // Turuncu
      } else if (gameState.comboMultiplier > 1) {
        comboDisplay.style.color = '#4caf50'; // Yeşil
      }
    }
  }
  
  // Ses çal
  function playSound(soundName) {
    if (!SETTINGS.sound || !sounds[soundName]) return;
    
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(error => {
        console.log('Sound play error:', error);
      });
    } catch (error) {
      console.log('Sound play error:', error);
    }
  }
  
  // Ayarları yükle
  function loadSettings() {
    // Yerel depolamadan ayarları yükle
    const savedSettings = localStorage.getItem('patternFlow_settings');
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Kaydedilmiş ayarları birleştir
        Object.assign(SETTINGS, parsedSettings);
        
        // UI'yı güncelle
        updateSettingsUI();
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }
  
  // Ayarları kaydet
  function saveUserSettings() {
    try {
      localStorage.setItem('patternFlow_settings', JSON.stringify(SETTINGS));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  // Ayarlar UI'sını güncelle
  function updateSettingsUI() {
    // Zorluk butonları
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.difficulty === SETTINGS.difficulty);
    });
    
    // Zamanlayıcı butonları
    const timerButtons = document.querySelectorAll('[data-timer]');
    timerButtons.forEach(button => {
      button.classList.toggle('active', 
        (button.dataset.timer === 'on' && SETTINGS.timerEnabled) || 
        (button.dataset.timer === 'off' && !SETTINGS.timerEnabled)
      );
    });
    
    // Ses butonları
    const soundButtons = document.querySelectorAll('[data-sound]');
    soundButtons.forEach(button => {
      button.classList.toggle('active', 
        (button.dataset.sound === 'on' && SETTINGS.sound) || 
        (button.dataset.sound === 'off' && !SETTINGS.sound)
      );
    });
    
    // Adaptif zorluk butonları
    const adaptiveButtons = document.querySelectorAll('[data-adaptive]');
    adaptiveButtons.forEach(button => {
      button.classList.toggle('active', 
        (button.dataset.adaptive === 'on' && SETTINGS.adaptiveDifficulty) || 
        (button.dataset.adaptive === 'off' && !SETTINGS.adaptiveDifficulty)
      );
    });
  }
  
  // Yardımcı fonksiyonlar
  
  // Array'i karıştır
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Sembol seti belirle
  function determinePatternSymbolSet(pattern) {
    // Örüntüdeki sembollere bakarak olası sembol setini belirle
    const symbolSets = [symbols.basic, symbols.letters, symbols.numbers, symbols.advanced];
    
    for (const set of symbolSets) {
      const allSymbolsInSet = pattern.every(item => set.includes(item.symbol));
      if (allSymbolsInSet) return set;
    }
    
    // Belirli bir set bulunamadıysa basic dön
    return symbols.basic;
  }
  
  // Sembol dizisinde ardışık ilişki var mı
  function symbolHasSequentialPattern(symbols) {
    if (symbols.length < 2) return false;
    
    // İlk iki sembol arasındaki farkı hesapla
    const diff = symbols[1].symbol.charCodeAt(0) - symbols[0].symbol.charCodeAt(0);
    
    // Kalan sembolleri kontrol et
    for (let i = 2; i < symbols.length; i++) {
      const currentDiff = symbols[i].symbol.charCodeAt(0) - symbols[i-1].symbol.charCodeAt(0);
      if (currentDiff !== diff) return false;
    }
    
    return true;
  }
  
  // Renkleri karşılaştır
  function compareColors(color1, color2) {
    // Basit karşılaştırma için renkleri normalize et
    return normalizeColor(color1) === normalizeColor(color2);
  }
  
  // Rengi normalize et
  function normalizeColor(color) {
    // RGB(A) değerlerini hexadecimal'e dönüştür
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    return color.toLowerCase();
  }
  
  // Kontrast rengi hesapla
  function getContrastColor(hexcolor) {
    // Normalize renk
    const hex = normalizeColor(hexcolor);
    
    // Hex'i RGB'ye dönüştür
    let r = 0, g = 0, b = 0;
    
    // 3 karakterli hex
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } 
    // 6 karakterli hex
    else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    // RGB formatı
    else if (hex.startsWith('rgb')) {
      const rgb = hex.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        r = parseInt(rgb[0]);
        g = parseInt(rgb[1]);
        b = parseInt(rgb[2]);
      }
    }
    
    // Parlaklığı hesapla
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Koyu renkler için beyaz, açık renkler için siyah döndür
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }
  
  // Başlangıç
  initGame();
});
