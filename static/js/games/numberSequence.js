/**
 * Sayı Dizisi Oyunu - 1.0
 * 
 * Matematiksel akıl yürütme ve örüntü tanıma becerilerini geliştiren profesyonel oyun.
 * 
 * Özellikler:
 * - Matematiksel örüntü tanıma ve analitik düşünme egzersizleri
 * - Artan zorluk seviyelerine sahip sayı dizileri
 * - Özelleştirilebilir zorluk seviyesi
 * - İpucu sistemi ve yardım mekanizmaları
 * - Detaylı skor ve performans analizi
 * - Seviye sistemi ve ilerleme takibi
 * - Görsel ve işitsel geri bildirimler
 * - Profesyonel animasyonlar ve kullanıcı deneyimi
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const gameBoard = document.getElementById('game-board');
  const sequenceDisplay = document.getElementById('sequence-display');
  const answerOptions = document.getElementById('answer-options');
  const patternDescription = document.getElementById('pattern-description');
  const instructionsPanel = document.getElementById('instructions');
  const settingsPanel = document.getElementById('settings-panel');
  const controlPanel = document.getElementById('control-panel');
  const levelInfo = document.getElementById('level-info');
  const timerBarContainer = document.getElementById('timer-bar-container');
  const timerBar = document.getElementById('timer-bar');
  const levelDisplay = document.getElementById('level-display');
  const scoreDisplay = document.getElementById('score-display');
  const timeDisplay = document.getElementById('time-display');
  const soundToggle = document.getElementById('sound-toggle');
  const pauseButton = document.getElementById('pause-button');
  const startButton = document.getElementById('start-game');
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  const messageOverlay = document.getElementById('message-overlay');
  const messageTitle = document.getElementById('message-title');
  const messageContent = document.getElementById('message-content');
  const finalScore = document.getElementById('final-score');
  const restartButton = document.getElementById('restart-button');
  const menuButton = document.getElementById('menu-button');
  const hintButton = document.getElementById('hint-button');
  const hintContent = document.getElementById('hint-content');

  // Game state
  let gameState = {
    isPlaying: false,
    isPaused: false,
    isMuted: false,
    level: 1,
    score: 0, // Puanı sıfırla (gösterim kaldırıldı)
    difficulty: 'easy',
    timeRemaining: 0,
    timer: null,
    currentSequence: [],
    correctAnswer: null,
    missingIndex: null,
    solveTime: 30000, // Time to solve in milliseconds
    sequenceLength: 5, // Starting sequence length
    currentPattern: null, // Current pattern type
    wrongAttempts: 0, // Keep track of wrong answer attempts
    usedHint: false, // If hint was used in current level
    currentPatternDescription: '', // Description of current pattern
    options: [], // Answer options
    wrongAnswerCount: 0, // Yanlış cevap sayısı
    maxWrongAnswers: 2 // Maksimum yanlış cevap sayısı
  };

  // Pattern types and their generators
  const patternTypes = {
    arithmeticProgression: {
      generate: (level, difficulty) => {
        // Arithmetic progression: a, a+d, a+2d, a+3d, ...
        const difficultyFactor = difficulty === 'easy' ? 1 : 
                                 difficulty === 'medium' ? 2 : 3;

        const start = getRandomInt(1, 5 * difficultyFactor);
        const difference = getRandomInt(1, 3 * difficultyFactor);

        const sequence = [];
        for (let i = 0; i < gameState.sequenceLength; i++) {
          sequence.push(start + i * difference);
        }

        return {
          sequence,
          rule: `Sayı dizisi bir aritmetik dizi. Her sayı bir öncekinden ${difference} fazla.`,
          explanation: `Sayı dizisindeki her eleman bir öncekine ${difference} eklenerek elde edilir.`
        };
      }
    },
    geometricProgression: {
      generate: (level, difficulty) => {
        // Geometric progression: a, a*r, a*r^2, a*r^3, ...
        const difficultyFactor = difficulty === 'easy' ? 1 : 
                                 difficulty === 'medium' ? 1.5 : 2;

        const start = getRandomInt(1, 3 * difficultyFactor);
        // Keep ratio simple for early levels
        const ratio = level <= 2 && difficulty === 'easy' ? 2 : getRandomInt(2, 2 + Math.floor(difficultyFactor));

        const sequence = [];
        let current = start;
        for (let i = 0; i < gameState.sequenceLength; i++) {
          sequence.push(current);
          current *= ratio;
        }

        return {
          sequence,
          rule: `Sayı dizisi bir geometrik dizi. Her sayı bir öncekinin ${ratio} katı.`,
          explanation: `Sayı dizisindeki her eleman bir önceki ${ratio} ile çarpılarak elde edilir.`
        };
      }
    },
    fibonacciVariant: {
      generate: (level, difficulty) => {
        // Fibonacci-like: each number is the sum of the two preceding ones
        const difficultyFactor = difficulty === 'easy' ? 1 : 
                                 difficulty === 'medium' ? 2 : 3;

        // For easier difficulty, start with small numbers
        const first = getRandomInt(1, 2 * difficultyFactor);
        const second = getRandomInt(1, 3 * difficultyFactor);

        const sequence = [first, second];
        for (let i = 2; i < gameState.sequenceLength; i++) {
          sequence.push(sequence[i-1] + sequence[i-2]);
        }

        return {
          sequence,
          rule: 'Sayı dizisinde her sayı, kendisinden önceki iki sayının toplamıdır.',
          explanation: 'Bu dizi Fibonacci benzeri bir dizidir. Her sayı, dizideki önceki iki sayının toplamıdır.'
        };
      }
    },
    squareNumbers: {
      generate: (level, difficulty) => {
        // Square numbers: 1, 4, 9, 16, 25, ...
        const difficultyFactor = difficulty === 'easy' ? 0 : 
                                 difficulty === 'medium' ? 1 : 2;

        const offset = getRandomInt(0, difficultyFactor);
        const start = getRandomInt(1, 2 + difficultyFactor);

        const sequence = [];
        for (let i = 0; i < gameState.sequenceLength; i++) {
          sequence.push((start + i) * (start + i) + offset);
        }

        let rule = 'Sayı dizisindeki her sayı bir kare sayı';
        if (offset !== 0) {
          rule += ` artı ${offset}`;
        }
        rule += '.';

        return {
          sequence,
          rule,
          explanation: `Bu dizideki sayılar (n+${start})² ${offset !== 0 ? `+ ${offset}` : ''} formülü ile hesaplanır, n dizideki pozisyonu temsil eder.`
        };
      }
    },
    triangularNumbers: {
      generate: (level, difficulty) => {
        // Triangular numbers: 1, 3, 6, 10, 15, ...
        const difficultyFactor = difficulty === 'easy' ? 0 : 
                                 difficulty === 'medium' ? 1 : 2;

        const offset = getRandomInt(0, difficultyFactor);
        const start = getRandomInt(1, 2 + difficultyFactor);

        const sequence = [];
        for (let i = 0; i < gameState.sequenceLength; i++) {
          const n = start + i;
          sequence.push((n * (n + 1)) / 2 + offset);
        }

        let rule = 'Sayı dizisindeki her sayı bir üçgensel sayı';
        if (offset !== 0) {
          rule += ` artı ${offset}`;
        }
        rule += '.';

        return {
          sequence,
          rule,
          explanation: `Bu dizideki sayılar (n+${start})(n+${start+1})/2 ${offset !== 0 ? `+ ${offset}` : ''} formülü ile hesaplanır, n dizideki pozisyonu temsil eder.`
        };
      }
    },
    powerSequence: {
      generate: (level, difficulty) => {
        // Power sequence: a^1, a^2, a^3, ...
        const difficultyFactor = difficulty === 'easy' ? 1 : 
                                 difficulty === 'medium' ? 1.5 : 2;

        // Use small base for easier difficulty
        const base = getRandomInt(2, 2 + Math.floor(difficultyFactor));
        const offset = difficulty === 'easy' ? 0 : getRandomInt(0, 2);

        const sequence = [];
        for (let i = 0; i < gameState.sequenceLength; i++) {
          sequence.push(Math.pow(base, i + 1) + offset);
        }

        let rule = `Sayı dizisindeki her sayı ${base} üssü n`;
        if (offset !== 0) {
          rule += ` artı ${offset}`;
        }
        rule += '.';

        return {
          sequence,
          rule,
          explanation: `Bu dizideki sayılar ${base}^n ${offset !== 0 ? `+ ${offset}` : ''} formülü ile hesaplanır, n dizideki pozisyonu temsil eder.`
        };
      }
    },
    alternatingAddition: {
      generate: (level, difficulty) => {
        // Alternating addition: a, a+b, a+b+c, a+b+c+b, a+b+c+b+c, ...
        const difficultyFactor = difficulty === 'easy' ? 1 : 
                                 difficulty === 'medium' ? 2 : 3;

        const start = getRandomInt(1, 5 * difficultyFactor);
        const increment1 = getRandomInt(1, 3 * difficultyFactor);
        const increment2 = getRandomInt(1, 3 * difficultyFactor);

        const sequence = [start];
        for (let i = 1; i < gameState.sequenceLength; i++) {
          if (i % 2 === 1) {
            sequence.push(sequence[i-1] + increment1);
          } else {
            sequence.push(sequence[i-1] + increment2);
          }
        }

        return {
          sequence,
          rule: `Sayı dizisinde artış dönüşümlü olarak ${increment1} ve ${increment2}.`,
          explanation: `Bu dizide, bir önceki sayıya sırayla ${increment1} ve ${increment2} eklenerek ilerler.`
        };
      }
    }
  };

  // Audio elements
  const sounds = {
    correct: new Audio(),
    incorrect: new Audio(),
    levelUp: new Audio(),
    click: new Audio(),
    gameOver: new Audio(),
    background: new Audio(),
    hint: new Audio()
  };

  // Initialize sounds with base64 or placeholder URLs
  sounds.correct.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAiIiIiIiIiIiIiIiIiIiIiIiIiIjMzMzMzMzMzMzMzMzMzMzMzMzMzMz///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYHAAAAAAAAsGFLb9AAAAAAAAAAAAAAAAAAAP/jOMAAAAJFgdBAGAZGJAMAgBAMSKrk4DAEACCQH/j0I4QPBJjvwTiQHCcP/MRyJ4EgQP/3Ec8Dg4Efg8IHCB//xHMP/7zmAIH/cB4f/g+D9YHgfB9weD//EP//iQOAP/5wH/YMCcG4Jwd//EPsDg33//sY8g7cAwJwfB5wHgOBwHAfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8P/jOMAAAAGhAMgwAEAHABMIZDIAAAgABQADDmAMI/ERwAhGABAj+cRyJ4+D/+DBwIMfyAPg+/B4OfcHwcBPH//iOeBIPB44MODwf7AeB8HweB//wPDwQ41AOB7/+B45wQCMDwfSM78Hwe/wPgg6QP/8H+YEIsDw8B4Pg+D4JA4Xg8mB4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAAAIhAYhEAIAYAQj2SZcAAQAgCAQAgY5gHiQHBBIAcQHMuHAgyLnMZTEgiDgcH/83H/ZXLnlgGLiy4P/7zGoDA8j0HA8D4P/qgADwQB//9MPDgjqQ8H/8H+MRxIciQfBwEgOB4H9QY4Pgy57g/yA4P8YD9+B78HZRjw+DwPg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABHIJgQAAJCQPJFgqABGAgAgUDBQkBKh44D9QHLnEciHxIMkeAPB4Pg8CBmByJ5/kBwPwcCPB8HwPA8D4Pg+D4PzgPg/9+B4Hgf/B//A7p5cBnWBwfB+DgR/gP/UB/8HA///AA8HwN/+QHBXPLgQch8HwfyAdzg+DHAOA+H/4PDwHgcD8EMOCwOP/3A8B8HwfAYD4Pg+D4Ph/A8HwfB8HwfB8HwfB8HwfB8HwfA';
  sounds.incorrect.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAc8AiIiIiIiIiIiIiIiIiIiIiIiIiIjMzMzMzMzMzMzMzMzMzMzMzMzMzMz///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJARAAAAAAAAAz1kLQwwAAAAAAAAAAAAAAAAAAP/jOMAAAAMRAaBAACBGRQOAEAoFAwCCxkCMDgOBACAYPBBeB4EiA4RwR/yhwfB8HkQ4OBwH/wfB/iHB4iODgOA4HgfB9+D4OCDHA///EcwcCOcHAf5gcHAcB0geB/UByAPDweB4P9gOA6Ef//8Q+B/kAeDweB4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABDYFgQAIAKgPBFAqTAAABCMCBAmIZ44HAjg45gHicJAciOPAAIIODgf/B4EOD4P84POB4Hwf7AeD/GD///OB4HwTAePB8HwcB4EgOB4H/YDoOBB8Hgf/B4APDAOCQPg/+D9GAcBccH2QB8Hwf/B/yAHAcBP/w+D4Pg/B8Hwf7AcHwQA8EAYLAcB0HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABHIJgQAAJCQPJFgqABGAgAgUDBQkBKh44D9QHLnEciHxIMkeAPB4Pg8CBmByJ5/kBwPwcCPB8HwPA8D4Pg+D4PzgPg/9+B4Hgf/B//A7p5cBnWBwfB+DgR/gP/UB/8HA///AA8HwN/+QHBXPLgQch8HwfyAdzg+DHAOA+H/4PDwHgcD8EMOCwOP/3A8B8HwfAYD4Pg+D4Ph/A8HwfB8HwfB8HwfB8HwfB8HwfA';
  sounds.levelUp.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAf8AYGBgYGBgYGBgYGBgYGBgYGBgYGBggICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgwMDAwMDAwMDAwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg4ODg4ODg4ODg////////////////AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAVtAAAAAAAA/6caL0EAAAAAAAAAAAAAAAAAAP/jOMAAAANMAcBgAkBsikHQeEAoIJYFgcQcLAuDwOBQGBALAuCYOdYIA/wfBMkS4fByGBHPxIgOHl0sgkQnH+Y7qkHPweDg4MOC2D/iQcB+BwcH+QHBwIPA4PkwHAjuD8HA8DgOA8DgfB8HgcB0HwfB8HqA6DoPg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABKwJgQAgSTgPEEgqIEuWJcucSJfAEB8HM6HPuQB//kB+LgMA4DuHyoABB//HIh8RLlwGDh/iBIODOcB8EOO////B8HM63LlM4Pg+D4ENx/kBwf4wcjmB/+D+mA/ioDg+DuoHgPgx5gGCOP8w4cLAf/g4EODgcHzA5EPgOB4H/8GAWBJqf//lwfB8DwPA+D4PgTB4HwfAaGAOA6D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABJEHgQAgaWAPBDASZFZEAgAwdpAQIDgPg+CQEAOBwEgj/g7iBA+f8uA4P+XCwPg/zjlw4Pg+DIHhQPg+Af/wPLnHLgfB/kBzhzmBB8HhYHAeB0XB//8iHB4PIlwcB4HgOBwJ2I8H//9YHX/ygPh/zgPggBwPAOCOIc//uB4G+44PDwHwPA8DoPg+DwmcHHLi/yD5gfP/zD/l3/+kBwfKgPy4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABJUJAQAgWjwPAGAQGpZDgfHwYOHwPB3EODhgGBwYBodBKI+Jng84A/+DAsD/9QPAeDvMcueXB//Bw+QBguA+D4OA8D//+PAxwN28B//1AcMAtqg//Bg7mAaDoPg+D4Pg+D2oN+gOBwQB4f7D4Pg+D4iBw+cOeXzh/h/gP8DpAcHwYPDwHwf/wYP/w/xnHLg+C+cHy4Pgx4Pg+D4Pg+D4eBQHgfB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABJoLgQAABJQPGIAYZZSAEhhA4PEwJQwShDjnBL1TLiuJDg+QHA/+H+I+C4c4f4jnzh/+H+QH/sGDg///h/h//8H//wfh8H//h//B//B//B//B///+H///8PA4I5cHwfBADg+7kHB/1Af/B/iO8H/8Hw/h/0gNPLgfB8PhQJAcEoP4eDodB//B9+D/eDvoDgcCGHh8HwcGng/B/1Af/B//B//B//B//B//B//B//B//B//B//B/';
  sounds.click.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAVkAVVVVVVVVVVVVVVVVVVVVVVVVVVVVgICAgICAgICAgICAgICAgICAgICAgIC1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tf////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAPiAAAAAAAAWYpB5YEAAAAAAAAAAAAAAAAAAP/jOMAAAAJpAYFAADAIDgRKgQB4AAAIAACADgYuDA4Jnjl2+PyQBAEAVOJyJ44P//8j/KAcJA8PMf/yP//+IP//5weB4Hw=';
  sounds.gameOver.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAicAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQIAAAACAgICAgICAgICAgICAgICAgICAgICAgKAAAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoMAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwOAAAADg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OAAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAZGAAAAAAAAJ7FQ1ZcAAAAAAAAAAAAAAAAAAP/jOMAAAAPUAeAwBtCMikCBwMAgCBgCAQECEhIUEYZQMCwpDPLHQsWBhQNBYeA4f4N/LO/g8pgnGB4PB4MOApB3B/+D4f8PCh/xIOB//ig4cGePLgMBADhQDg8Dw8B+LgMH/5g5cCcP/+QHBj/EDgYsB4Pig4OQYLB7g//gg4CAGoOD/+D4f/wQcPg+HgYMP/ygPB8P4x0B4CQOAwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABMAFgQAABEAPKegkSAeAACIPxwZBbBpAcdqAgFggBgdYHAYFBBf82D//OJDg4EOJxIflyDgcEAeBA///EOBB8HweHgf/+REn+JB/1AcD/YPB3CQHgf4wcH/yg//B//B8HQQPLD//+B4YGwQB4H/+D/GHFzwcODwfg6D4Pg9MH+mB4HwfB8EAM7Ac0A4Pg+7A8HwOg8XAeB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABMANYQAABEASsWg0YAxBgGAICNxwGBEDBJHXVEzgaCQQBQWDEgY5y5UB7/OHPLh8gcCHBBw5//+QcH//kPNQQB4Hwf/+IHIhwcxnX//hzPkiP/B4MuHBweB80HDg/B//g+Dww+D/MOHy4HwfB8HweB8PuQcc0YeBwPggVg+CYYHgP/+B8Hy6oHB/5cD/qA/+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P/+M4wAAABHwKgQAAAZASyXgzCB6JAcAoBgYCDQIEgVHqI7a6WQEoLQsMBiCDDkP8oEcR+I+EhQQB7uWB//A7/CeP//Ah3/+C4P8R///8uDoK+pZXA8DwgDw58B//CA/wg//g//0g+XJAfjgOB8Hwf/B8MdYH//wOB/1Af48ODwH/8Hw+dw0ePh8Hwf7B+Dx//g71goLgd//B8Hx3LuDglB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABJoLgQAABJQPGIAYZZSAEhhA4PEwJQwShDjnBL1TLiuJDg+QHA/+H+I+C4c4f4jnzh/+H+QH/sGDg///h/h//8H//wfh8H//h//B//B//B//B///+H///8PA4I5cHwfBADg+7kHB/1Af/B/iO8H/8Hw/h/0gNPLgfB8PhQJAcEoP4eDodB//B9+D/eDvoDgcCGHh8HwcGng/B/1Af/B//B//B//B//B//B//B//B//B//B//B/';
  sounds.hint.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAycAR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3d3d3d3d3d3d3d3d3d3d3d3d3d3d3eHh4eHh4eHh4eHh4eHh4eHh4eHh4eH////////////////////////////////////////AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAcAAAAAAAAAJ+4z2i8AAAAAAAAAAAAAAAAAAP/jOMAAAAKlAeCAAGAgCoECAQAgBA0CAMNRnAw9+Hy4fCQHAjgQB8HgeB4DuxHnBweCA////mA4OB4Hwf///IOA4H//IOg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+B4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4HgeB4H/+M4wAAABLECgQAgA24JMKgQAwBJgKApCQOChDBQxw+IA+D4PkxwfB8oHB8HwfB8HqA/B8EPjg8c+w4Pg+D4Pg+D4Pgzh8HwcEgOA4Pg+D4PgzB8HwZUHA6QHwfB8EOHwfCQf8wP/LnO5wf/B/j/ED/B//B/UA4PxB+IcHwQA4DfxHH//5Dg4Dg/B8H3IcMDkeD4eQ4e/4PniQHBj/lz/B8GgPg+DwHwfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABEgBgQAgCigQJFAgSwgEAIAYAoQeB4B4CQcIPg+GBYDgMxB87iQfLgx3y4ceHAeB4Oy4ccc/w6g+I+w/0gPj/CD4YdMQHB+f8Pwcyg+B8H8h/yhwOg+D4PCJQeCDpgHgfccSHIj/B//+I4kQHEgB9wHAeDvmB88eH+I/wH+EA4P+QB8HwfcBweB4TIMgQcc/kP8B98wDyDgPg+/cdAfB8HwfB8HwfB8HwfB8HwfB8HwfB8HwfB8H/+M4wAAABB8DAQAgBywQJFQgIpAMCANJDgOuuByGXdw4Dg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4Pg+D4P';

  // Preload all sounds
  for (const sound in sounds) {
    sounds[sound].load();
  }

  // Set background music properties
  sounds.background.loop = true;
  sounds.background.volume = 0.3;

  // Event listeners
  startButton.addEventListener('click', startSettings);
  soundToggle.addEventListener('click', toggleSound);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', restartGame);
  menuButton.addEventListener('click', () => {
    window.location.href = '/';
  });
  hintButton.addEventListener('click', showHint);

  difficultyOptions.forEach(option => {
    option.addEventListener('click', () => {
      difficultyOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      gameState.difficulty = option.dataset.difficulty;
      playSound('click');
    });
  });

  // Game functions
  function startSettings() {
    playSound('click');
    instructionsPanel.style.display = 'none';
    settingsPanel.style.display = 'block';

    const startGameBtn = document.createElement('button');
    startGameBtn.className = 'btn-game';
    startGameBtn.textContent = 'Oyunu Başlat';
    startGameBtn.style.marginTop = '20px';
    startGameBtn.style.display = 'block';
    startGameBtn.style.margin = '20px auto 0';

    settingsPanel.appendChild(startGameBtn);

    startGameBtn.addEventListener('click', () => {
      playSound('click');
      startGame();
    });
  }

  function startGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;

    // Set difficulty parameters
    updateDifficultySettings();

    // Update UI
    settingsPanel.style.display = 'none';
    controlPanel.style.display = 'flex';
    gameBoard.style.display = 'block';
    levelInfo.style.display = 'block';
    timerBarContainer.style.display = 'block';

    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;

    // Start background music
    if (!gameState.isMuted) {
      sounds.background.play();
    }

    startLevel();
  }

  function updateDifficultySettings() {
    // Set parameters based on difficulty and level
    switch(gameState.difficulty) {
      case 'easy':
        gameState.sequenceLength = 5 + Math.min(Math.floor((gameState.level - 1) / 2), 2);
        gameState.solveTime = 30000 - (gameState.level - 1) * 1000;
        gameState.solveTime = Math.max(gameState.solveTime, 15000);
        break;
      case 'medium':
        gameState.sequenceLength = 6 + Math.min(Math.floor((gameState.level - 1) / 2), 3);
        gameState.solveTime = 25000 - (gameState.level - 1) * 1000;
        gameState.solveTime = Math.max(gameState.solveTime, 12000);
        break;
      case 'hard':
        gameState.sequenceLength = 7 + Math.min(Math.floor((gameState.level - 1) / 2), 4);
        gameState.solveTime = 20000 - (gameState.level - 1) * 1000;
        gameState.solveTime = Math.max(gameState.solveTime, 10000);
        break;
    }
  }

  function startLevel() {
    // Reset level state
    gameState.usedHint = false;
    hintContent.style.display = 'none';

    // Update level info
    levelInfo.textContent = `Seviye ${gameState.level}: Sayı dizisindeki eksik sayıyı bulun`;
    updateScoreDisplay();

    // Clear displays
    sequenceDisplay.innerHTML = '';
    answerOptions.innerHTML = '';

    // Generate new sequence
    generateSequence();

    // Display sequence
    displaySequence();

    // Generate answer options
    generateAnswerOptions();

    // Update pattern description
    patternDescription.textContent = 'Sayı dizisindeki örüntüyü bulun ve eksik sayıyı tahmin edin';

    // Set timer for level
    gameState.timeRemaining = gameState.solveTime / 1000;
    updateTimerDisplay();

    // Animate timer
    timerBar.style.width = '100%';

    // Start timer
    startTimer(gameState.solveTime, () => {
      // Time's up!
      gameOver();
    });
  }

  function generateSequence() {
    // Choose a random pattern type
    const patternKeys = Object.keys(patternTypes);
    const patternIndex = Math.floor(Math.random() * patternKeys.length);
    gameState.currentPattern = patternKeys[patternIndex];

    // Generate sequence based on pattern type, level, and difficulty
    const pattern = patternTypes[gameState.currentPattern].generate(gameState.level, gameState.difficulty);
    gameState.currentSequence = pattern.sequence;
    gameState.currentPatternDescription = pattern.rule;

    // Choose a random position for the missing number (not first or last for easier play)
    gameState.missingIndex = getRandomInt(1, gameState.sequenceLength - 2);
    gameState.correctAnswer = gameState.currentSequence[gameState.missingIndex];
  }

  function displaySequence() {
    for (let i = 0; i < gameState.currentSequence.length; i++) {
      const item = document.createElement('div');

      if (i === gameState.missingIndex) {
        item.className = 'question-mark';
        item.textContent = '?';
      } else {
        item.className = 'sequence-number';
        item.textContent = gameState.currentSequence[i];
      }

      sequenceDisplay.appendChild(item);
    }
  }

  function generateAnswerOptions() {
    answerOptions.innerHTML = '';

    // Create array with the correct answer and some wrong answers
    const correctAnswer = gameState.correctAnswer;

    // Setup number input controls for manual entry
    const numberControls = document.getElementById('number-controls');
    const numberInput = document.getElementById('number-input');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    const submitAnswer = document.getElementById('submit-answer');

    // Reset input value
    numberInput.value = 0;
    numberControls.style.display = 'flex';

    // Generate reasonable wrong answers based on the pattern
    const wrongAnswers = [];
    const offsets = [-7, -5, -4, -3, -2, -1, +1, +2, +3, +4, +5, +7]; // Daha geniş offset seçenekleri

    // Yanlış cevap sayısını zorluk seviyesine göre belirle
    const wrongAnswerCount = gameState.difficulty === 'easy' ? 4 :
                              gameState.difficulty === 'medium' ? 5 : 6;

    for (let i = 0; i < wrongAnswerCount; i++) {
      let wrongAnswer;
      let attemptCount = 0;

      do {
        attemptCount++;
        // Uygun bir offset seç
        const offset = offsets[Math.floor(Math.random() * offsets.length)];

        // Eğer ileri seviye ise, daha karmaşık yanlış cevaplar da ekle
        if (gameState.level > 3 && gameState.difficulty === 'hard' && Math.random() > 0.5) {
          const sequenceLength = gameState.currentSequence.length;
          const patternInd = getRandomInt(0, sequenceLength - 1);
          if (patternInd !== gameState.missingIndex) {
            wrongAnswer = gameState.currentSequence[patternInd];
          } else {
            wrongAnswer = correctAnswer + offset;
          }
        } else {
          wrongAnswer = correctAnswer + offset;
        }

        // Yanlış cevap listesinde fazla deneme yaparsa çık
        if (attemptCount > 20) {
          if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
            break;
          }
          // Rastgele bir sayı üret
          wrongAnswer = Math.abs(correctAnswer + getRandomInt(-10, 10));
          if (wrongAnswer === correctAnswer) wrongAnswer += 1;
          break;
        }

        // Cevabın uygun olup olmadığını kontrol et
        if (wrongAnswer > 0 && !wrongAnswers.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
          break;
        }
      } while (true);

      wrongAnswers.push(wrongAnswer);
    }

    // Combine all answers and shuffle
    const allOptions = [correctAnswer, ...wrongAnswers];
    gameState.options = shuffleArray(allOptions);

    // Setup event listeners for number controls
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(numberInput.value);
      if (currentValue > 0) {
        numberInput.value = currentValue - 1;
      }
      playSound('click');
    });

    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(numberInput.value);
      numberInput.value = currentValue + 1;
      playSound('click');
    });

    // Allow number entry through input field
    numberInput.addEventListener('change', () => {
      // Keep input in reasonable range
      const value = parseInt(numberInput.value);
      if (isNaN(value) || value < 0) {
        numberInput.value = 0;
      } else if (value > 999) {
        numberInput.value = 999;
      }
    });

    // Submit button
    submitAnswer.addEventListener('click', () => {
      if (gameState.isPaused) return;

      const answer = parseInt(numberInput.value);
      if (!isNaN(answer)) {
        checkAnswer(answer);
      }
      playSound('click');
    });

    // Display options as buttons for quick selection
    gameState.options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'answer-option';
      optionElement.textContent = option;

      optionElement.addEventListener('click', () => {
        if (gameState.isPaused) return;

        numberInput.value = option; // Set the input value to selected option
        checkAnswer(option);
      });

      answerOptions.appendChild(optionElement);
    });
  }

  function checkAnswer(selectedAnswer) {
    if (selectedAnswer === gameState.correctAnswer) {
      // Correct answer
      const correctOption = document.querySelector(`.answer-option:nth-child(${gameState.options.indexOf(selectedAnswer) + 1})`);
      if (correctOption) {
        correctOption.classList.add('correct');
      }

      // Highlight the sequence number
      const questionMark = document.querySelector('.question-mark');
      if (questionMark) {
        questionMark.textContent = selectedAnswer;
        questionMark.classList.remove('question-mark');
        questionMark.classList.add('sequence-number');
        questionMark.classList.add('highlight');
      }

      playSound('correct');

      // Sıfırla yanlış cevap sayısını
      gameState.wrongAnswerCount = 0;

      // Calculate score based on time remaining and difficulty
      const timeBonus = Math.ceil(gameState.timeRemaining * 5);
      const levelBonus = gameState.level * 50;
      const difficultyMultiplier = gameState.difficulty === 'easy' ? 1 : 
                                  gameState.difficulty === 'medium' ? 1.5 : 2;

      // Apply hint penalty if hint was used
      const hintPenalty = gameState.usedHint ? 0.5 : 1;

      const pointsEarned = Math.floor((100 + timeBonus + levelBonus) * difficultyMultiplier * hintPenalty);
      gameState.score += pointsEarned;

      // Clear timer
      if (gameState.timer) {
        clearInterval(gameState.timer);
      }

      // Show success message with animation
      const successOverlay = document.createElement('div');
      successOverlay.className = 'message-overlay';
      successOverlay.style.backgroundColor = 'rgba(50, 205, 50, 0.7)';

      const successBox = document.createElement('div');
      successBox.className = 'message-box';
      successBox.style.background = 'linear-gradient(135deg, #34c759 0%, #2ea043 100%)';

      successBox.innerHTML = `
        <h2 class="message-title">Harika!</h2>
        <p class="message-content">
          Doğru cevap!
          <span class="score-highlight">+${pointsEarned}</span>
          puan kazandınız!
        </p>
      `;

      successOverlay.appendChild(successBox);
      document.body.appendChild(successOverlay);

      // Update score display
      updateScoreDisplay();

      // Remove success message after a short delay and go to next level
      setTimeout(() => {
        document.body.removeChild(successOverlay);
        nextLevel();
      }, 1500);
    } else {
      // Wrong answer - increment wrong answer counter
      gameState.wrongAnswerCount++;

      // Find the wrong option if it exists
      const wrongOption = document.querySelector(`.answer-option:nth-child(${gameState.options.indexOf(selectedAnswer) + 1})`);
      if (wrongOption) {
        wrongOption.classList.add('incorrect');
      }

      playSound('incorrect');

      // Reduce score (if greater than 0)
      const penaltyPoints = Math.min(25, gameState.score);
      gameState.score = Math.max(0, gameState.score - penaltyPoints);
      updateScoreDisplay();

      // Check if we've reached maximum wrong answers
      if (gameState.wrongAnswerCount >= gameState.maxWrongAnswers) {
        // Reset wrong answer counter
        gameState.wrongAnswerCount = 0;

        // Show a message that we're changing the question
        const changeMessage = document.createElement('div');
        changeMessage.className = 'change-question-message';
        changeMessage.textContent = '2 yanlış cevap verdiniz. Yeni soru geliyor...';
        changeMessage.style.position = 'absolute';
        changeMessage.style.top = '50%';
        changeMessage.style.left = '50%';
        changeMessage.style.transform = 'translate(-50%, -50%)';
        changeMessage.style.background = 'rgba(255, 59, 48, 0.9)';
        changeMessage.style.color = 'white';
        changeMessage.style.padding = '15px 20px';
        changeMessage.style.borderRadius = '8px';
        changeMessage.style.fontWeight = 'bold';
        changeMessage.style.zIndex = '100';

        gameBoard.appendChild(changeMessage);

        // Clear any timer
        if (gameState.timer) {
          clearInterval(gameState.timer);
        }

        // Wait a moment and then generate a new question
        setTimeout(() => {
          gameBoard.removeChild(changeMessage);
          startLevel(); // Generate a new question
        }, 1500);
      } else {
        // If not max wrong answers yet, just remove the incorrect class after a delay
        setTimeout(() => {
          if (wrongOption) {
            wrongOption.classList.remove('incorrect');
          }
        }, 500);
      }
    }
  }

  function showHint() {
    playSound('hint');

    // Mark hint as used
    gameState.usedHint = true;

    // Show hint content
    hintContent.style.display = 'block';
    hintContent.textContent = patternTypes[gameState.currentPattern].explanation || gameState.currentPatternDescription;

    // Disable hint button
    hintButton.disabled = true;
    hintButton.style.opacity = '0.5';
  }

  function nextLevel() {
    gameState.level++;

    // Play level up sound
    playSound('levelUp');

    // Update difficulty settings based on new level
    updateDifficultySettings();

    // Start the next level
    startLevel();
  }

  function gameOver() {
    // Clear all timers
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }

    // Stop background music
    sounds.background.pause();
    sounds.background.currentTime = 0;

    // Play game over sound
    playSound('gameOver');

    // Show answer
    const questionMark = document.querySelector('.question-mark');
    if (questionMark) {
      questionMark.textContent = gameState.correctAnswer;
      questionMark.classList.remove('question-mark');
      questionMark.classList.add('sequence-number');
      questionMark.classList.add('highlight');
    }

    // Highlight correct answer in options
    const correctOptionIndex = gameState.options.indexOf(gameState.correctAnswer);
    if (correctOptionIndex !== -1) {
      const correctOption = document.querySelector(`.answer-option:nth-child(${correctOptionIndex + 1})`);
      correctOption.classList.add('correct');
    }

    // Set game state
    gameState.isPlaying = false;

    // Prepare game over message
    messageTitle.textContent = 'Oyun Bitti!';

    // Customize message based on score
    let message = '';
    if (gameState.score > 2000) {
      message = 'İnanılmaz bir performans! Olağanüstü matematiksel düşünme becerinizi gösterdiniz!';
    } else if (gameState.score > 1000) {
      message = 'Muhteşem! Matematiksel örüntüleri çok iyi analiz ediyorsunuz!';
    } else if (gameState.score > 500) {
      message = 'Harika bir çaba! Matematiksel düşünme becerileriniz gelişiyor!';
    } else {
      message = 'İyi bir başlangıç! Düzenli pratikle matematiksel algınızı geliştirebilirsiniz.';
    }

    messageContent.innerHTML = `
      ${message}
      <span class="score-highlight">${gameState.score}</span>
      puan kazandınız!
    `;

    finalScore.textContent = gameState.score;

    // Show message overlay
    messageOverlay.style.display = 'flex';

    // Try to save score
    saveScore();
  }

  function restartGame() {
    // Hide message overlay
    messageOverlay.style.display = 'none';

    // Start new game
    startGame();
  }

  function togglePause() {
    if (!gameState.isPlaying) return;

    if (gameState.isPaused) {
      // Unpause
      gameState.isPaused = false;
      pauseButton.innerHTML = '<i class="fas fa-pause"></i>';

      // If in the middle of a timer, restart it
      startTimer(gameState.timeRemaining * 1000);

      // Unpause background music
      if (!gameState.isMuted) {
        sounds.background.play();
      }
    } else {
      // Pause
      gameState.isPaused = true;
      pauseButton.innerHTML = '<i class="fas fa-play"></i>';

      // Clear existing timer
      if (gameState.timer) {
        clearInterval(gameState.timer);
      }

      // Pause background music
      sounds.background.pause();
    }
  }

  function toggleSound() {
    gameState.isMuted = !gameState.isMuted;

    if (gameState.isMuted) {
      soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
      sounds.background.pause();
    } else {
      soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
      if (gameState.isPlaying && !gameState.isPaused) {
        sounds.background.play();
      }
    }
  }

  function playSound(soundName) {
    if (gameState.isMuted) return;

    // Instead of trying to play sounds (which causes errors),
    // we'll just log that we would play a sound
    console.log(`Sound effect played: ${soundName}`);

    // Using a visual feedback instead of sound
    // This creates a brief flash effect to indicate something happened
    switch(soundName) {
      case 'correct':
        flashEffect('#34c759', 300); // Green flash for correct
        break;
      case 'incorrect':
        flashEffect('#ff3b30', 300); // Red flash for incorrect
        break;
      case 'levelUp':
        flashEffect('#5b42f3', 500); // Purple flash for level up
        break;
      case 'gameOver':
        flashEffect('#ff9500', 700); // Orange flash for game over
        break;
      case 'hint':
        flashEffect('#ffcc00', 300); // Yellow flash for hint
        break;
      default:
        // No flash effect for other sounds
        break;
    }
  }

  // Visual feedback instead of sound
  function flashEffect(color, duration) {
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'fixed';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = '0.2';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.zIndex = '9999';
    flashOverlay.style.transition = 'opacity 0.3s ease';

    document.body.appendChild(flashOverlay);

    setTimeout(() => {
      flashOverlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 300);
    }, duration);
  }

  function startTimer(duration, callbackFn) {
    // Clear existing timer
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }

    const startTime = Date.now();
    const endTime = startTime + duration;

    gameState.timer = setInterval(() => {
      const currentTime = Date.now();
      const timeLeft = Math.max(0, endTime - currentTime);

      if (timeLeft <= 0) {
        clearInterval(gameState.timer);
        gameState.timeRemaining = 0;
        updateTimerDisplay();
        timerBar.style.width = '0%';

        if (callbackFn) {
          callbackFn();
        }
      } else {
        gameState.timeRemaining = timeLeft / 1000;
        updateTimerDisplay();

        // Update timer bar
        const percentLeft = (timeLeft / duration) * 100;
        timerBar.style.width = `${percentLeft}%`;
      }
    }, 100);
  }

  function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
  }

  function updateTimerDisplay() {
    timeDisplay.textContent = Math.ceil(gameState.timeRemaining);
  }

  function saveScore() {
    // Ana sayfaya yönlendir
    setTimeout(() => {
      window.location.href = '/all_games';
    }, 1500);
  }

  // Utility functions
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffleArray(array) {
    // Create a copy of the array
    const shuffled = [...array];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
});