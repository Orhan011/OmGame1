// Ses dosyaları
  const sounds = {
    nature: [
      new Audio('/static/sounds/note1.mp3'),
      new Audio('/static/sounds/note2.mp3'),
      new Audio('/static/sounds/note3.mp3'),
      new Audio('/static/sounds/note4.mp3')
    ],
    instrument: [
      new Audio('/static/sounds/note5.mp3'),
      new Audio('/static/sounds/note6.mp3'),
      new Audio('/static/sounds/note7.mp3'),
      new Audio('/static/sounds/note8.mp3')
    ],
    urban: [
      new Audio('/static/sounds/note1.mp3'),
      new Audio('/static/sounds/note2.mp3'),
      new Audio('/static/sounds/note3.mp3'),
      new Audio('/static/sounds/note4.mp3')
    ],
    success: new Audio('/static/sounds/success.mp3'),
    error: new Audio('/static/sounds/wrong.mp3'),
    levelUp: new Audio('/static/sounds/level-up.mp3'),
    gameOver: new Audio('/static/sounds/game-over.mp3')
  };

// Pad için ses çal
  function playSoundForPad(padIndex) {
    if (soundOn) {
      try {
        sounds[currentTheme][padIndex].play().catch(error => {
          console.log("Ses çalma hatası:", error);
          // Alternatif ses çalma yöntemi
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 220 + (padIndex * 110); // Her pad için farklı frekans
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => {
              oscillator.stop();
            }, 300);
          } catch (altError) {
            console.log("Alternatif ses çalma hatası:", altError);
          }
        });
      } catch (error) {
        console.log("Ses çalma hatası:", error);
      }
    }
  }

// ... rest of the code (assuming it exists and is relevant to the game) ...