class ModernMergePuzzle {
    constructor() {
        this.columns = Array(5).fill().map(() => []);  // 5 columns
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.level = parseInt(localStorage.getItem('level')) || 1;
        this.moveHistory = [];
        this.gameOver = false;
        this.won = false;
        this.draggingBlock = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.blockSize = 60;
        this.gap = 10;
        this.maxBlocksPerColumn = 6;  // Maximum blocks visible in a column
        this.nextBlockValue = null;
        this.soundEnabled = localStorage.getItem('soundEnabled') === 'false' ? false : true;
        this.themeMode = localStorage.getItem('themeMode') || 'light';

        // Ses efektleri
        this.sounds = {};

        // Sesleri yükle
        this.loadSounds = () => {
            // Ses desteğini tamamen kapatıyoruz, çünkü hata oluşturuyor
            this.soundEnabled = false;
            document.getElementById('toggle-sound').textContent = '🔇';

            // Ses çalma işlevlerini boş fonksiyonlara dönüştür
            this.playSound = () => {};
        };

        // Sesleri yükle
        this.loadSounds();

        this.setupGame();
        this.generateNextBlock();
        this.setupEventListeners();
        this.applyTheme();
    }

    setupGame() {
        // Get DOM elements
        this.columnsGridElement = document.querySelector('.columns-grid');
        this.blockSourceElement = document.querySelector('.block-source');
        this.finalScoreElement = document.querySelector('.final-score');

        // Clear existing grid
        this.columnsGridElement.innerHTML = '';

        // Create columns
        for (let i = 0; i < 5; i++) {
            const column = document.createElement('div');
            column.className = 'column';
            column.dataset.index = i;
            this.columnsGridElement.appendChild(column);
        }
    }

    generateNextBlock() {
        // Clear the source block container
        this.blockSourceElement.innerHTML = '';

        // Add the next-label back
        const nextLabel = document.createElement('div');
        nextLabel.className = 'next-label';
        nextLabel.textContent = 'SONRAKI BLOK';
        this.blockSourceElement.appendChild(nextLabel);

        // Tablodaki en yüksek taş değerini bul
        let highestValue = 0;
        this.columns.forEach(column => {
            column.forEach(value => {
                highestValue = Math.max(highestValue, value);
            });
        });

        // Yüksek değere göre minimum taş değeri belirle
        let minBlockValue = 2;

        if (highestValue >= 4096) {
            minBlockValue = 32;
        } else if (highestValue >= 2048) {
            minBlockValue = 16;
        } else if (highestValue >= 1024) {
            minBlockValue = 8;
        } else if (highestValue >= 512) {
            minBlockValue = 4;
        }

        // Minimum taş değerine göre değer havuzu oluştur
        let possibleValues = [];
        let baseValue = minBlockValue;

        // Değer havuzuna 4 farklı değer ekle (minimum ve 3 üst seviye)
        for (let i = 0; i < 4; i++) {
            possibleValues.push(baseValue * Math.pow(2, i));
        }

        // Olasılık dağılımını ayarla (düşük değerler daha sık gelsin)
        const rand = Math.random();
        let selectedIndex;

        if (rand < 0.5) {
            selectedIndex = 0; // %50 olasılıkla en küçük değer
        } else if (rand < 0.8) {
            selectedIndex = 1; // %30 olasılıkla ikinci değer
        } else if (rand < 0.95) {
            selectedIndex = 2; // %15 olasılıkla üçüncü değer
        } else {
            selectedIndex = 3; // %5 olasılıkla en büyük değer
        }

        // Seçilen değeri ata
        this.nextBlockValue = possibleValues[selectedIndex];

        // Create the block element
        const block = document.createElement('div');
        block.className = 'block';
        block.dataset.value = this.nextBlockValue;
        block.textContent = this.nextBlockValue;

        // Style the block
        block.style.width = `${this.blockSize}px`;
        block.style.height = `${this.blockSize}px`;

        // Add to DOM
        this.blockSourceElement.appendChild(block);

        // Setup dragging
        this.setupBlockDrag(block);
    }

    setupBlockDrag(block) {
        // Touch events for mobile
        block.addEventListener('touchstart', (e) => {
            if (this.gameOver || this.won) return;
            e.preventDefault();

            const touch = e.touches[0];
            this.startDragging(block, touch.clientX, touch.clientY);
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.draggingBlock) return;
            e.preventDefault();

            const touch = e.touches[0];
            this.updateDragging(touch.clientX, touch.clientY);
        });

        document.addEventListener('touchend', () => {
            if (!this.draggingBlock) return;
            this.endDragging();
        });

        // Mouse events for desktop
        block.addEventListener('mousedown', (e) => {
            if (this.gameOver || this.won) return;
            e.preventDefault();

            this.startDragging(block, e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.draggingBlock) return;
            this.updateDragging(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', () => {
            if (!this.draggingBlock) return;
            this.endDragging();
        });
    }

    startDragging(block, clientX, clientY) {
        // Create a clone of the block for dragging
        this.draggingBlock = block.cloneNode(true);
        this.draggingBlock.classList.add('dragging');
        document.body.appendChild(this.draggingBlock);

        // Store starting position for calculating offset
        const rect = block.getBoundingClientRect();
        this.dragStartPos = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        // Track current position
        this.lastDragPos = {
            x: clientX,
            y: clientY
        };

        // Position the dragging block
        this.draggingBlock.style.position = 'fixed';
        this.draggingBlock.style.width = `${this.blockSize}px`;
        this.draggingBlock.style.height = `${this.blockSize}px`;
        this.draggingBlock.style.left = `${clientX - this.dragStartPos.x}px`;
        this.draggingBlock.style.top = `${clientY - this.dragStartPos.y}px`;

        // Highlight columns to show where block can be placed
        document.querySelectorAll('.column').forEach(col => {
            col.classList.add('highlight');
        });
    }

    updateDragging(clientX, clientY) {
        // Update position of dragging block
        this.draggingBlock.style.left = `${clientX - this.dragStartPos.x}px`;
        this.draggingBlock.style.top = `${clientY - this.dragStartPos.y}px`;

        // Track current position
        this.lastDragPos = { x: clientX, y: clientY };
    }

    endDragging() {
        // Find which column the block was dropped on
        const columnIndex = this.getColumnFromPosition(this.lastDragPos);

        if (columnIndex !== -1) {
            // Save current state for undo
            this.saveGameState();

            // Add block to column
            this.placeBlockInColumn(columnIndex, this.nextBlockValue);
        }

        // Clean up
        if (this.draggingBlock && this.draggingBlock.parentElement) {
            this.draggingBlock.remove();
        }
        this.draggingBlock = null;

        // Remove column highlights
        document.querySelectorAll('.column').forEach(col => {
            col.classList.remove('highlight');
        });
    }

    getColumnFromPosition(pos) {
        // Get the column where the block was dropped
        const gridRect = this.columnsGridElement.getBoundingClientRect();

        // Check if position is over the grid
        if (pos.x < gridRect.left || pos.x > gridRect.right || 
            pos.y < gridRect.top || pos.y > gridRect.bottom) {
            return -1;
        }

        // Calculate column index based on x-position
        const relativeX = pos.x - gridRect.left;
        const columnWidth = gridRect.width / 5;
        const columnIndex = Math.floor(relativeX / columnWidth);

        return Math.max(0, Math.min(columnIndex, 4));
    }

    placeBlockInColumn(columnIndex, value) {
        // If column is full, return
        if (this.columns[columnIndex].length >= this.maxBlocksPerColumn) {
            this.checkGameOver();
            return;
        }

        // Add block to column data structure (at the end for visual placement at top)
        this.columns[columnIndex].push(value);

        // Blok pozisyonu (en üstte)
        const blockPosition = this.columns[columnIndex].length - 1;

        // Önce bloğu havada oluştur
        const block = this.renderBlockWithAnimation(columnIndex, blockPosition, value);

        // Yerleştirme sesi çal
        if (this.soundEnabled && this.sounds.place) {
            try {
                this.sounds.place.play().catch(err => console.log("Ses çalma hatası:", err));
            } catch (error) {
                console.error("Ses çalma hatası:", error);
            }
        }

        // Check for merges
        this.checkForMerges(columnIndex);

        // Generate next block after rendering and merging
        this.generateNextBlock();

        // Check game state
        this.checkGameState();
    }

    renderBlock(columnIndex, position, value) {
        const column = document.querySelectorAll('.column')[columnIndex];
        if (!column) return null; // Safety check

        const block = document.createElement('div');

        block.className = 'block';
        block.dataset.value = value;
        block.dataset.column = columnIndex;
        block.dataset.position = position;
        block.textContent = value;

        // Calculate position
        const columnRect = column.getBoundingClientRect();
        const blockWidth = Math.max(30, Math.floor(columnRect.width - 10));
        const blockHeight = blockWidth;

        block.style.width = `${blockWidth}px`;
        block.style.height = `${blockHeight}px`;

        // Position within column (top-down) - hassas hesaplama
        const topOffset = 5;  // Top padding
        const gap = 10; // Bloklar arası boşluk
        const topPosition = Math.floor((position * (blockHeight + gap)) + topOffset);

        // Merkezi hizalama için sol pozisyonu hesaplama (tam sayı değerleri)
        const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

        // Doğrudan son pozisyona yerleştir (animasyon yok)
        block.style.left = `${leftOffset}px`;
        block.style.top = `${topPosition}px`;

        column.appendChild(block);

        return block;
    }

    renderBlockWithAnimation(columnIndex, position, value) {
        const column = document.querySelectorAll('.column')[columnIndex];
        if (!column) return null; // Safety check

        const block = document.createElement('div');

        // Animasyon sınıfını başlangıçta ekleme, daha sonra ekleyeceğiz
        block.className = 'block';
        block.dataset.value = value;
        block.dataset.column = columnIndex;
        block.dataset.position = position;
        block.textContent = value;

        // Calculate position
        const columnRect = column.getBoundingClientRect();
        const blockWidth = Math.max(30, Math.floor(columnRect.width - 10));
        const blockHeight = blockWidth;

        block.style.width = `${blockWidth}px`;
        block.style.height = `${blockHeight}px`;

        // Position within column (top-down)
        const topOffset = 5;  // Top padding
        const gap = 10; // Bloklar arası boşluk

        // Bloğun hedef konumu
        const targetTopPosition = Math.floor((position * (blockHeight + gap)) + topOffset);

        // Başlangıç pozisyonu (sütunun ALTINDA) - Alttan yukarıya kayma animasyonu için
        const columnHeight = column.clientHeight;
        const startTopPosition = columnHeight;

        // Merkezi hizalama için sol pozisyonu hesaplama
        const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

        // Başlangıç pozisyonuna yerleştir (sütunun altına)
        block.style.left = `${leftOffset}px`;
        block.style.top = `${startTopPosition}px`;

        // Bloğun transform-origin özelliğini ayarla (daha doğal bir hareket için)
        block.style.transformOrigin = 'center bottom';

        // Performans iyileştirmesi için will-change ekle
        block.style.willChange = 'transform, top, left';

        column.appendChild(block);

        // requestAnimationFrame kullanarak daha akıcı animasyon
        requestAnimationFrame(() => {
            // Önce falling-block sınıfını ekle
            block.classList.add('falling-block');

            // Animasyon süresini 1 saniye olarak ayarla (istenildiği gibi)
            block.style.transition = 'top 1s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';

            // Hedef pozisyona git
            block.style.top = `${targetTopPosition}px`;

            // Animasyon tamamlandığında temizlik işlemleri
            const transitionEndHandler = () => {
                block.classList.remove('falling-block');
                block.style.willChange = 'auto'; // Performans iyileştirmesi için will-change'i sıfırla
                block.removeEventListener('transitionend', transitionEndHandler);
            };

            block.addEventListener('transitionend', transitionEndHandler);
        });

        return block;
    }

    checkForMerges(columnIndex) {
        const column = this.columns[columnIndex];
        if (!column || column.length === 0) return;

        // Son eklenen bloğun pozisyonu
        const currentBlockPosition = column.length - 1; 

        // Sadece doğrudan komşu taşları kontrol et (üst, alt, sol, sağ)
        const merged = this.checkAdjacentMerges(columnIndex, currentBlockPosition);

        // Ekranı güncelle
        this.updateDisplay();

        // Eğer birleşme olduysa, birleşen bloğu kontrol et (zincirleme reaksiyon)
        if (merged.merged) {
            this.checkForMerges(merged.mergedColumnIndex);
        }
    }

    // Komşu bloklardaki birleştirme kontrolü (üst/alt/sol/sağ - çapraz eşleşmeler olmadan)
    checkAdjacentMerges(columnIndex, blockPosition) {
        const column = this.columns[columnIndex];
        if (!column || column.length === 0 || blockPosition < 0 || blockPosition >= column.length) {
            return { merged: false };
        }

        const currentValue = column[blockPosition];
        let comboMerge = false;
        let comboValue = currentValue;
        let leftMerged = false;
        let rightMerged = false;

        // SOL ve SAĞ kontrolü - Combo için aynı anda bakıyoruz
        if (columnIndex > 0 && this.columns[columnIndex - 1].length > blockPosition) {
            const leftValue = this.columns[columnIndex - 1][blockPosition];
            leftMerged = (leftValue === currentValue);
        }

        if (columnIndex < this.columns.length - 1 && this.columns[columnIndex + 1].length > blockPosition) {
            const rightValue = this.columns[columnIndex + 1][blockPosition];
            rightMerged = (rightValue === currentValue);
        }

        // Eğer hem sol hem sağ blok aynı değerdeyse - COMBO!
        if (leftMerged && rightMerged) {
            comboMerge = true;
            // Combo birleşme: 3 taş birleşiyor (sol + mevcut + sağ)
            comboValue = currentValue * 3; // 3 kat değer (2 ile çarpmak yerine 3 ile çarp)

            // Sol bloğu kaldır
            this.columns[columnIndex - 1].splice(blockPosition, 1);

            // Sağ bloğu kaldır
            this.columns[columnIndex + 1].splice(blockPosition, 1);

            // Mevcut bloğun değerini güncelle
            column[blockPosition] = comboValue;

            // Ekstra combo skoru (normal birleşmenin 2 katı)
            this.score += comboValue * 2;

            // Efekt göster ve ekranı güncelle
            this.showComboEffect(columnIndex, blockPosition);
            this.updateMergedBlock(columnIndex, blockPosition, comboValue);

            return { merged: true, mergedColumnIndex: columnIndex, mergedPosition: blockPosition, combo: true };
        }

        // 1. ÜST - Aynı sütunda üstteki blok kontrolü
        if (blockPosition > 0 && column[blockPosition - 1] === currentValue) {
            // Üstteki blok ile birleştir
            const newValue = currentValue * 2;
            column[blockPosition - 1] = newValue;
            column.splice(blockPosition, 1);
            this.score += newValue;
            this.updateMergedBlock(columnIndex, blockPosition - 1, newValue);

            return { merged: true, mergedColumnIndex: columnIndex, mergedPosition: blockPosition - 1 };
        }

        // 2. ALT - Aynı sütunda alttaki blok kontrolü (eğer varsa)
        if (blockPosition < column.length - 1 && column[blockPosition + 1] === currentValue) {
            // Alttaki blok ile birleştir
            const newValue = currentValue * 2;
            column[blockPosition] = newValue;  // Şu anki bloğun değerini güncelle
            column.splice(blockPosition + 1, 1); // Alttaki bloğu kaldır
            this.score += newValue;
            this.updateMergedBlock(columnIndex, blockPosition, newValue);

            return { merged: true, mergedColumnIndex: columnIndex, mergedPosition: blockPosition };
        }

        // 3. SOL - Sol sütundaki aynı hizadaki blok kontrolü (tek taraflı birleşme)
        if (leftMerged) {
            // Sol taraftaki blok ile birleştir
            const newValue = currentValue * 2;

            // Şu anki bloğun değerini güncelle
            column[blockPosition] = newValue;

            // Sol taraftaki bloğu kaldır
            this.columns[columnIndex - 1].splice(blockPosition, 1);

            this.score += newValue;
            this.updateMergedBlock(columnIndex, blockPosition, newValue);

            return { merged: true, mergedColumnIndex: columnIndex, mergedPosition: blockPosition };
        }

        // 4. SAĞ - Sağ sütundaki aynı hizadaki blok kontrolü (tek taraflı birleşme)
        if (rightMerged) {
            // Sağ taraftaki blok ile birleştir
            const newValue = currentValue * 2;

            // Şu anki bloğun değerini güncelle
            column[blockPosition] = newValue;

            // Sağ taraftaki bloğu kaldır
            this.columns[columnIndex + 1].splice(blockPosition, 1);

            this.score += newValue;
            this.updateMergedBlock(columnIndex, blockPosition, newValue);

            return { merged: true, mergedColumnIndex: columnIndex, mergedPosition: blockPosition };
        }

        return { merged: false };
    }

    // Birleşme efekti - animasyonlar kaldırıldı
    playMergeEffect(columnIndex, position) {
        // Animasyonlar kaldırıldı
    }

    // Combo efekti gösterme fonksiyonu - geliştirilmiş
    showComboEffect(columnIndex, position) {
        // Combo bildirimini göster
        const notification = document.createElement('div');
        notification.className = 'combo-notification';
        notification.textContent = 'COMBO!';
        notification.style.position = 'absolute';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '32px';
        notification.style.color = '#FFD700';
        notification.style.textShadow = '0 0 15px rgba(255, 215, 0, 0.9), 0 0 25px rgba(255, 100, 0, 0.7)';
        notification.style.zIndex = '1000';
        notification.style.transform = 'translateX(-50%)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease-in-out';

        // Pozisyonu ayarla
        const columnElem = document.querySelectorAll('.column')[columnIndex];
        if (columnElem) {
            const columnRect = columnElem.getBoundingClientRect();
            notification.style.left = `${columnRect.left + columnRect.width/2}px`;
            notification.style.top = `${columnRect.top + position * 70 + 30}px`;
            document.body.appendChild(notification);

            // Animasyon için fade in
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(-50%) scale(1.2)';
            }, 50);

            // Animasyon bittiğinde kaldır
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) scale(0.8) translateY(-20px)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 1000);
        }

        // Combo skoru için ekstra görsel efekt
        this.addComboScoreEffect(this.score, columnIndex, position);
    }

    // Combo için puan efekti
    addComboScoreEffect(score, columnIndex, position) {
        const scoreEffect = document.createElement('div');
        scoreEffect.textContent = `+${score}`;
        scoreEffect.style.position = 'absolute';
        scoreEffect.style.fontWeight = 'bold';
        scoreEffect.style.fontSize = '22px';
        scoreEffect.style.color = '#FF5757';
        scoreEffect.style.textShadow = '0 0 8px rgba(255, 87, 87, 0.7)';
        scoreEffect.style.zIndex = '999';
        scoreEffect.style.transition = 'all 0.6s ease-out';

        // Pozisyonu combo bildiriminin altında
        const columnElem = document.querySelectorAll('.column')[columnIndex];
        if (columnElem) {
            const columnRect = columnElem.getBoundingClientRect();
            scoreEffect.style.left = `${columnRect.left + columnRect.width/2 - 25}px`;
            scoreEffect.style.top = `${columnRect.top + position * 70 + 60}px`;
            scoreEffect.style.opacity = '0';
            scoreEffect.style.transform = 'translateY(0)';

            document.body.appendChild(scoreEffect);

            // Animasyon
            setTimeout(() => {
                scoreEffect.style.opacity = '1';
            }, 50);

            setTimeout(() => {
                scoreEffect.style.opacity = '0';
                scoreEffect.style.transform = 'translateY(-30px)';
                setTimeout(() => {
                    scoreEffect.remove();
                }, 600);
            }, 800);
        }
    }

    // Zincirleme reaksiyon kontrolü  - Kaldırıldı
    checkForChainReactions(columnIndex) {
        //Bu fonksiyon kaldırıldı.
    }

    // Yatay zincirleme reaksiyon kontrolü - Kaldırıldı
    checkHorizontalChainReactions(columnIndex, blockPosition) {
        //Bu fonksiyon kaldırıldı.
    }

    // Birleştirme işlevi - geliştirilmiş animasyonlar ve efektler
    updateMergedBlock(columnIndex, position, newValue) {
        // Birleştirilen taş efekti
        const columns = document.querySelectorAll('.column');
        if (columns.length <= columnIndex) return;

        const column = columns[columnIndex];
        const blocks = column.querySelectorAll('.block');

        // İlgili pozisyondaki taşı bul
        let targetBlock = null;
        for (let i = 0; i < blocks.length; i++) {
            const blockPos = parseInt(blocks[i].dataset.position);
            if (blockPos === position) {
                targetBlock = blocks[i];
                break;
            }
        }

        if (targetBlock) {
            // Taşın değerini güncelle
            targetBlock.dataset.value = newValue;
            targetBlock.textContent = newValue;

            // Parçacık efekti oluştur (merging taşların etrafında)
            this.createParticleEffect(targetBlock);

            // Kayma animasyonu ekle (birleşme sonrası hafif bir kayma efekti)
            targetBlock.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease';
            targetBlock.style.transform = 'scale(1.15)';
            targetBlock.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';

            // Combo özelliğine göre özel sınıf ekle
            if (newValue >= 32) {
                // Yüksek değerli taşlar için daha dikkat çekici efekt
                targetBlock.classList.add('combo-merged');
                setTimeout(() => {
                    targetBlock.classList.remove('combo-merged');
                    // Birleşme sonrası kayma animasyonu (yaylanma)
                    targetBlock.style.transform = 'scale(1)';
                    targetBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
                }, 800);
            } else {
                // Standart birleşme efekti
                targetBlock.classList.add('merged');
                setTimeout(() => {
                    targetBlock.classList.remove('merged');
                    // Birleşme sonrası kayma animasyonu (yaylanma)
                    targetBlock.style.transform = 'scale(1)';
                    targetBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
                }, 500);
            }

            // Bloğun doğru pozisyonunu hesapla ve emilme efekti uygula
            const columnElem = document.querySelectorAll('.column')[columnIndex];
            if (columnElem) {
                const columnRect = columnElem.getBoundingClientRect();
                const blockWidth = parseInt(targetBlock.style.width);
                const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

                // Pozisyonu tekrar ayarla (bazı durumlarda kayabilir)
                setTimeout(() => {
                    targetBlock.style.left = `${leftOffset}px`;
                    // Animasyon bitiminde stil temizliği
                    setTimeout(() => {
                        targetBlock.style.transition = '';
                    }, 200);
                }, 600);
            }
        }

        // Tüm blokları yeniden çiz
        this.updateDisplay();
    }

    // Parçacık efekti oluşturma (birleşen taşların etrafında)
    createParticleEffect(targetBlock) {
        const rect = targetBlock.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Renk seçenekleri (taşların değerine göre renklendirilebilir)
        const colors = ['#FFD700', '#FFA500', '#FF5757', '#4facfe'];

        // 10 parçacık oluştur
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'fixed';
            particle.style.width = '5px';
            particle.style.height = '5px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.zIndex = '5';

            // Rastgele bir başlangıç pozisyonu belirle (merkeze yakın)
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            particle.style.left = `${centerX + offsetX}px`;
            particle.style.top = `${centerY + offsetY}px`;

            // Rastgele bir yöne doğru hareket et
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const targetX = centerX + Math.cos(angle) * distance;
            const targetY = centerY + Math.sin(angle) * distance;

            document.body.appendChild(particle);

            // Anima başlangıcı
            setTimeout(() => {
                particle.style.transition = 'all 0.5s ease-out';
                particle.style.left = `${targetX}px`;
                particle.style.top = `${targetY}px`;
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0.5)';

                // Animasyon bittiğinde temizle
                setTimeout(() => {
                    particle.remove();
                }, 500);
            }, 10);
        }
    }

    updateDisplay() {
        // Performans için sadece değişen alanları güncelle
        // Update score - silinen elementlere erişim kaldırıldı
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }

        // Seviye kontrolü - her 1000 puan için seviye artışı
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            localStorage.setItem('level', this.level);
            
            // Seviye atlama bildirimi göster
            this.showLevelUpNotification();

            // Ses efekti çal
            if (this.soundEnabled && this.sounds.levelUp) {
                try {
                    this.sounds.levelUp.play().catch(err => console.log("Ses çalma hatası:", err));
                } catch (error) {
                    console.error("Ses çalma hatası:", error);
                }
            }
            
            // Yeni seviyeye geçildiğinde skoru kaydet
            this.saveScore();
        }

        // Performans iyileştirmesi: Sadece önceki ve şimdiki durum arasında değişiklik olduğunda render
        // Clear all blocks and redraw efficiently
        const columnElements = document.querySelectorAll('.column');

        // requestAnimationFrame ile daha verimli render
        requestAnimationFrame(() => {
            // DOM manipülasyonlarını minimize et
            columnElements.forEach((column, colIndex) => {
                column.innerHTML = '';
                const columnData = this.columns[colIndex];

                // Bellek kullanımını optimize etmek için fragment kullan
                const fragment = document.createDocumentFragment();

                // Blokları oluştur ve fragment'e ekle
                for (let position = 0; position < columnData.length; position++) {
                    const value = columnData[position];
                    const block = this.createBlockElement(colIndex, position, value);
                    fragment.appendChild(block);
                }

                // Tek seferde DOM'a ekle (daha verimli)
                column.appendChild(fragment);
            });
        });
    }

    // Performans için yeni yardımcı metot
    createBlockElement(colIndex, position, value) {
        const column = document.querySelectorAll('.column')[colIndex];
        if (!column) return null;

        const block = document.createElement('div');
        block.className = 'block';
        block.dataset.value = value;
        block.dataset.column = colIndex;
        block.dataset.position = position;
        block.textContent = value;

        // Pozisyon hesaplamaları
        const columnRect = column.getBoundingClientRect();
        const blockWidth = Math.max(30, Math.floor(columnRect.width - 10));
        const blockHeight = blockWidth;

        block.style.width = `${blockWidth}px`;
        block.style.height = `${blockHeight}px`;

        // Pozisyon hesaplamaları
        const topOffset = 5;
        const gap = 10;
        const topPosition = Math.floor((position * (blockHeight + gap)) + topOffset);
        const leftOffset = Math.floor((columnRect.width - blockWidth) / 2);

        block.style.left = `${leftOffset}px`;
        block.style.top = `${topPosition}px`;

        return block;
    }

    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-notification';
        notification.textContent = `Seviye ${this.level}!`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 2000);
        }, 100);
    }

    checkGameState() {
        // Check for 2048 tile
        let highest = 0;
        this.columns.forEach(column => {
            column.forEach(value => {
                highest = Math.max(highest, value);
            });
        });

        if (highest >= 2048 && !this.won) {
            this.won = true;
            document.getElementById('game-won').classList.remove('hidden');
            // Oyun kazanıldığında skoru kaydet
            this.saveScore();
            return;
        }

        this.checkGameOver();
    }

    checkGameOver() {
        // Count full columns
        let fullColumns = 0;
        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].length >= this.maxBlocksPerColumn) {
                fullColumns++;
            }
        }

        // If all columns are full, game over
        if (fullColumns === this.columns.length) {
            this.gameOver = true;
            this.finalScoreElement.textContent = this.score;
            document.getElementById('game-over').classList.remove('hidden');
            // Oyun bittiğinde skoru kaydet
            this.saveScore();
        }
    }

    saveGameState() {
        // Save current state for undo
        this.moveHistory.push({
            columns: JSON.parse(JSON.stringify(this.columns)),
            score: this.score
        });

        // Limit history size
        if (this.moveHistory.length > 20) {
            this.moveHistory.shift();
        }
    }

    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            try {
                // Eğer ses zaten çalıyorsa, başa sar
                if (!this.sounds[soundName].paused) {
                    this.sounds[soundName].pause();
                    this.sounds[soundName].currentTime = 0;
                }

                // Sesi çal
                const playPromise = this.sounds[soundName].play();

                // Promise kontrolü
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Ses çalma hatası:", error);
                    });
                }
            } catch (error) {
                console.error("Ses çalma hatası:", error);
            }
        }
    }

    setupEventListeners() {
        // Button events
        document.getElementById('new-game').addEventListener('click', () => this.resetGame());
        document.getElementById('undo').addEventListener('click', () => this.undoMove());
        document.getElementById('retry').addEventListener('click', () => this.resetGame());
        document.getElementById('continue').addEventListener('click', () => {
            document.getElementById('game-won').classList.add('hidden');
            this.won = false;
        });

        // Ses efekti kontrolü
        document.getElementById('toggle-sound').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('soundEnabled', this.soundEnabled);
            document.getElementById('toggle-sound').textContent = this.soundEnabled ? '🔊' : '🔇';

            // Ses durumu değiştiğinde sesleri yükle veya temizle
            if (this.soundEnabled) {
                this.loadSounds();
            } else {
                this.sounds = {};
            }
        });

        // Tema değiştirme
        document.getElementById('toggle-theme').addEventListener('click', () => {
            this.themeMode = this.themeMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', this.themeMode);
            this.applyTheme();
        });
    }

    applyTheme() {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(this.themeMode + '-theme');

        // Tema ikonunu güncelle
        document.getElementById('toggle-theme').textContent = this.themeMode === 'light' ? '🌙' : '☀️';
    }

    usePowerUp(type) {
        if (this.gameOver) return;

        // Power-ups would normally have requirements (points, ads, etc)
        // For demo purposes, they work without restrictions

        switch(type) {
            case 'clear':
                // Clear the most filled column
                let fullestColumn = 0;
                let maxBlocks = 0;

                for (let i = 0; i < this.columns.length; i++) {
                    if (this.columns[i].length > maxBlocks) {
                        maxBlocks = this.columns[i].length;
                        fullestColumn = i;
                    }
                }

                if (maxBlocks > 0) {
                    this.saveGameState();
                    this.columns[fullestColumn] = [];
                    this.updateDisplay();
                }
                break;

            case 'double':
                // Double the value of next block
                if (this.nextBlockValue) {
                    this.nextBlockValue *= 2;
                    const block = this.blockSourceElement.querySelector('.block');
                    if (block) {
                        block.textContent = this.nextBlockValue;
                        block.dataset.value = this.nextBlockValue;
                    }
                }
                break;

            case 'extra':
                // Add a new random low value block in a random spot
                const availableColumns = [];
                for (let i = 0; i < this.columns.length; i++) {
                    if (this.columns[i].length < this.maxBlocksPerColumn) {
                        availableColumns.push(i);
                    }
                }

                if (availableColumns.length > 0) {
                    this.saveGameState();
                    const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)];
                    const value = Math.random() < 0.7 ? 2 : 4;

                    this.columns[randomColumn].push(value);
                    this.updateDisplay();
                }
                break;
        }
    }

    resetGame() {
        // Reset game state
        this.columns = Array(5).fill().map(() => []);
        this.score = 0;
        this.level = 1;
        localStorage.setItem('level', this.level);

        this.gameOver = false;
        this.won = false;
        this.moveHistory = [];

        // Hide overlays
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-won').classList.add('hidden');

        // Reset display
        this.updateDisplay();
        this.generateNextBlock();
    }
    
    // Skor kaydetme fonksiyonu
    saveScore() {
        // Skoru kontrol et - skor 0 veya undefined ise gönderme
        if (!this.score) {
            console.log('Kaydedilecek skor yok');
            return;
        }
        
        console.log(`Skor gönderiliyor: ${this.score}`);
        
        // Backend'e skoru gönder
        fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_type: '2048_game', // API endpoint'imiz game_type parametresi bekliyor
                score: this.score
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP hata! Durum: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Skor başarıyla kaydedildi:', data);
            
            if (data.success && data.achievement) {
                // Başarı bildirimi göster
                const notification = document.createElement('div');
                notification.className = 'level-notification';
                notification.textContent = `🏆 Başarı: ${data.achievement.title}`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        setTimeout(() => {
                            notification.remove();
                        }, 500);
                    }, 2000);
                }, 100);
            }
        })
        .catch(error => {
            console.error('Skor gönderme hatası:', error);
            // Hata bilgisini daha detaylı göster
            const errorNotification = document.createElement('div');
            errorNotification.className = 'level-notification';
            errorNotification.style.background = 'linear-gradient(135deg, rgba(255, 0, 0, 0.9), rgba(200, 0, 0, 0.9))';
            errorNotification.textContent = `❌ Skor kaydedilemedi`;
            document.body.appendChild(errorNotification);
            
            setTimeout(() => {
                errorNotification.classList.add('show');
                setTimeout(() => {
                    errorNotification.classList.remove('show');
                    setTimeout(() => {
                        errorNotification.remove();
                    }, 500);
                }, 2000);
            }, 100);
        });
    }

    undoMove() {
        if (this.moveHistory.length > 0) {
            const lastState = this.moveHistory.pop();
            this.columns = lastState.columns;
            this.score = lastState.score;
            this.updateDisplay();
            
            // İptal sesini çal
            if (this.soundEnabled && this.sounds.undo) {
                try {
                    this.sounds.undo.play().catch(err => console.log("Ses çalma hatası:", err));
                } catch (error) {
                    console.error("Ses çalma hatası:", error);
                }
            }
        }
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.columns-grid') && document.querySelector('.block-source')) {
        const game = new ModernMergePuzzle();
    }
});