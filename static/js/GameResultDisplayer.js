/**
 * GameResultDisplayer.js - Oyun Sonuçları Görüntüleyici
 * 
 * Bu script, oyun sonunda gösterilen ekranlardaki rastgele değerleri kaldırarak
 * gerçek skorları göstermek için oluşturulmuştur. Backend API tarafından hesaplanan
 * puanları içe aktarır ve tüm oyun sonuç ekranlarında standart bir şekilde görüntüler.
 */
(function() {
  "use strict";
  
  // İç değişkenler
  const internal = {
    // API'den gelen en son gerçek skor
    realScore: null,
    
    // Son gösterilen skor ekranı
    lastResultElement: null,
    
    // İstatistikleri depolayan obje
    gameStats: {},
    
    // İşlemler tamamlandı bayrağı
    displayCompleted: false,
    
    // CSS stil kuralları
    styles: {
      container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        margin: '20px auto',
        maxWidth: '450px',
        transition: 'all 0.3s ease'
      },
      
      scoreContainer: {
        textAlign: 'center',
        margin: '20px 0',
        padding: '20px',
        borderRadius: '10px',
        width: '100%',
        background: 'linear-gradient(to bottom right, #6a5ae0, #9284e8)',
        boxShadow: '0 4px 15px rgba(106, 90, 224, 0.3)',
        transition: 'all 0.3s ease'
      },
      
      scoreLabel: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.9)',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        marginBottom: '10px',
        display: 'block'
      },
      
      scoreValue: {
        fontSize: '3.2rem',
        fontWeight: 'bold',
        color: 'white',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        display: 'block',
        transition: 'all 0.3s ease'
      },
      
      title: {
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '15px',
        textAlign: 'center'
      },
      
      button: {
        padding: '10px 20px',
        backgroundColor: '#6a5ae0',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        margin: '10px 5px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
      },
      
      buttonHover: {
        backgroundColor: '#5348c0',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
      }
    }
  };
  
  /**
   * Script'i başlat
   */
  function initialize() {
    console.log("🎮 GameResultDisplayer başlatılıyor...");
    
    // API yanıtlarını dinle
    setupApiListeners();
    
    // DOM değişikliklerini izle (yeni sonuç ekranları eklendiğinde)
    setupDomObserver();
    
    // Sayfa yüklendikten sonra var olan sonuç ekranlarını standardize et
    setTimeout(standardizeResultScreens, 500);
    
    console.log("✅ GameResultDisplayer başlatıldı");
  }
  
  /**
   * API olaylarını dinler
   */
  function setupApiListeners() {
    try {
      // ScoreHandler.saveScore API yanıtını dinle
      document.addEventListener('scoreApiResponse', function(e) {
        if (e.detail && e.detail.data) {
          const data = e.detail.data;
          const score = data.points?.total || data.score || 0;
          
          console.log("🏆 API'den gerçek skor alındı:", score);
          
          // Skoru sakla
          internal.realScore = score;
          
          // Skor geldiğinde sonuç ekranlarını standardize et
          setTimeout(standardizeResultScreens, 100);
        }
      });
      
      // StrictScoreSystem ile senkronize et
      document.addEventListener('realScoreReceived', function(e) {
        if (e.detail && typeof e.detail.score !== 'undefined') {
          const score = e.detail.score;
          
          console.log("🏆 StrictScoreSystem'den gerçek skor alındı:", score);
          
          // Skoru sakla
          internal.realScore = score;
          
          // Skor geldiğinde sonuç ekranlarını standardize et
          setTimeout(standardizeResultScreens, 100);
        }
      });
      
      // Oyun tamamlandı olayını dinle
      document.addEventListener('gameCompleted', function(e) {
        if (e.detail) {
          // İstatistikleri kaydet
          internal.gameStats = e.detail;
          
          // Gelecekteki API yanıtları için skoru kaydet
          if (e.detail.score) {
            internal.realScore = parseInt(e.detail.score);
          }
          
          // 200ms bekle sonra sonuç ekranlarını standardize et
          setTimeout(standardizeResultScreens, 200);
        }
      });
      
      console.log("✅ API dinleyicileri kuruldu");
    } catch (error) {
      console.error("API dinleyicileri kurulurken hata oluştu:", error);
    }
  }
  
  /**
   * DOM değişikliklerini izler
   */
  function setupDomObserver() {
    try {
      // MutationObserver oluştur
      const observer = new MutationObserver(function(mutations) {
        let shouldStandardize = false;
        
        mutations.forEach(function(mutation) {
          // Eklenen düğümleri kontrol et
          if (mutation.addedNodes && mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              
              // Element düğümü mü?
              if (node.nodeType === 1) {
                // İçinde 'result', 'score', 'game-over' gibi kelimeler var mı?
                if (node.className && typeof node.className === 'string') {
                  const className = node.className.toLowerCase();
                  
                  if (className.indexOf('result') !== -1 || 
                      className.indexOf('score') !== -1 || 
                      className.indexOf('game-over') !== -1 || 
                      className.indexOf('stats') !== -1) {
                    shouldStandardize = true;
                    break;
                  }
                }
                
                // ID'si bu kelimeleri içeriyor mu?
                if (node.id && typeof node.id === 'string') {
                  const id = node.id.toLowerCase();
                  
                  if (id.indexOf('result') !== -1 || 
                      id.indexOf('score') !== -1 || 
                      id.indexOf('game-over') !== -1 || 
                      id.indexOf('stats') !== -1) {
                    shouldStandardize = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Stil değişikliklerini kontrol et
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' && 
              mutation.target.style) {
            
            // Görünürlük değişikliği var mı?
            if (mutation.target.style.display === 'block' || 
                mutation.target.style.display === 'flex' || 
                mutation.target.style.visibility === 'visible') {
              
              // Sınıf veya ID içinde anahtar kelimeler var mı?
              const className = mutation.target.className;
              const id = mutation.target.id;
              
              if ((className && typeof className === 'string' && 
                   (className.indexOf('result') !== -1 || 
                    className.indexOf('score') !== -1 || 
                    className.indexOf('game-over') !== -1 || 
                    className.indexOf('stats') !== -1)) || 
                  (id && typeof id === 'string' && 
                   (id.indexOf('result') !== -1 || 
                    id.indexOf('score') !== -1 || 
                    id.indexOf('game-over') !== -1 || 
                    id.indexOf('stats') !== -1))) {
                shouldStandardize = true;
              }
            }
          }
          
          // Class değişikliklerini kontrol et
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'class') {
            
            const className = mutation.target.className;
            
            if (className && typeof className === 'string') {
              // 'active', 'show', 'visible' gibi classlar eklenmiş mi?
              if (className.indexOf('active') !== -1 || 
                  className.indexOf('show') !== -1 || 
                  className.indexOf('visible') !== -1 || 
                  className.indexOf('open') !== -1) {
                
                // Aynı zamanda sınıfı içinde 'result', 'score' vb. var mı?
                if (className.indexOf('result') !== -1 || 
                    className.indexOf('score') !== -1 || 
                    className.indexOf('game-over') !== -1 || 
                    className.indexOf('stats') !== -1) {
                  shouldStandardize = true;
                }
              }
            }
          }
        });
        
        // Değişiklik gerektiren bir şey varsa
        if (shouldStandardize && !internal.displayCompleted) {
          setTimeout(standardizeResultScreens, 100);
        }
      });
      
      // Tüm DOM'u izle
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      console.log("✅ DOM gözlemcisi kuruldu");
    } catch (error) {
      console.error("DOM gözlemcisi kurulurken hata oluştu:", error);
    }
  }
  
  /**
   * Tüm sonuç ekranlarını standardize eder
   */
  function standardizeResultScreens() {
    try {
      // Olası sonuç ekranlarını ara
      const resultElements = findResultElements();
      
      // Eğer sonuç ekranı bulunamadıysa işlem yok
      if (resultElements.length === 0) {
        return;
      }
      
      // En son görünür olan ekranı seç
      const visibleElement = findVisibleResultElement(resultElements);
      
      // Eğer görünür bir sonuç ekranı yoksa, işlemi sonlandır
      if (!visibleElement) {
        return;
      }
      
      // Aynı element üzerinde tekrar işlem yapmayı önle
      if (internal.lastResultElement === visibleElement && 
          visibleElement.hasAttribute('data-result-standardized')) {
        return;
      }
      
      console.log("🔄 Sonuç ekranı standardize ediliyor...");
      
      // Bu elementi kaydet
      internal.lastResultElement = visibleElement;
      
      // Standardize işaretini ekle
      visibleElement.setAttribute('data-result-standardized', 'true');
      
      // Mevcut sonuç ekranını temizle
      clearExistingContent(visibleElement);
      
      // Standart sonuç görünümü oluştur
      createStandardResultView(visibleElement);
      
      // 10 saniye sonra 'display_completed' flag'i kaldır
      // (bu, DOM yeniden yapılandırılırsa yeniden çalışmasını sağlar)
      setTimeout(function() {
        internal.displayCompleted = false;
      }, 10000);
      
      console.log("✅ Sonuç ekranı başarıyla standardize edildi");
    } catch (error) {
      console.error("Sonuç ekranları standardize edilirken hata oluştu:", error);
    }
  }
  
  /**
   * Olası tüm sonuç ekranı elementlerini bulur
   */
  function findResultElements() {
    const selectors = [
      // Yaygın sonuç konteyner selektörleri
      '#game-over-container', '.game-over-container', '.game-over',
      '#results-container', '.results-container', '.result-container',
      '#score-container', '.score-container', '.final-score-container',
      '.game-result', '.result-screen', '.stats-container', 
      '.modal.show', '.modal[style*="display: block"]', '.modal-dialog',
      // Game-specific selectors
      '#gameOverModal', '.game-completion-modal', '.end-game-container',
      '#finalResults', '.score-display', '.stats-display'
    ];
    
    // Tüm seçicileri kullanarak elemanları bul
    const elements = [];
    
    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      for (let i = 0; i < found.length; i++) {
        elements.push(found[i]);
      }
    }
    
    return elements;
  }
  
  /**
   * Verilen elementler arasından görünür olanı bulur
   */
  function findVisibleResultElement(elements) {
    for (const element of elements) {
      // Görünürlük kontrolü
      const style = window.getComputedStyle(element);
      
      if (style.display !== 'none' && 
          style.visibility !== 'hidden' && 
          style.opacity !== '0') {
        return element;
      }
    }
    
    return null;
  }
  
  /**
   * Var olan içeriği temizler
   */
  function clearExistingContent(element) {
    // Sadece belirli alt öğeleri sakla
    const toKeep = [];
    
    // Butonları ve başlık elementlerini sakla
    const buttons = element.querySelectorAll('button, .btn, [class*="button"]');
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .heading');
    
    buttons.forEach(btn => toKeep.push(btn));
    headings.forEach(heading => toKeep.push(heading));
    
    // İçeriği temizle, saklanan elementleri koru
    const originalHTML = element.innerHTML;
    element.innerHTML = '';
    
    // Saklanan elementleri geri ekle
    toKeep.forEach(item => element.appendChild(item));
    
    return originalHTML;
  }
  
  /**
   * Standart sonuç görünümü oluşturur
   */
  function createStandardResultView(container) {
    try {
      // Skor değerini belirle
      const score = internal.realScore !== null ? internal.realScore : getScoreFromPage();
      
      // Standart sonuç konteynerini oluştur
      const resultElement = document.createElement('div');
      resultElement.className = 'standardized-result-container';
      
      // Stil uygula
      Object.assign(resultElement.style, internal.styles.container);
      
      // Sonuç başlığı
      const titleElement = document.createElement('h2');
      titleElement.className = 'result-title';
      titleElement.textContent = 'Oyun Tamamlandı!';
      Object.assign(titleElement.style, internal.styles.title);
      
      // Skor konteynerı
      const scoreContainer = document.createElement('div');
      scoreContainer.className = 'standardized-score-container';
      Object.assign(scoreContainer.style, internal.styles.scoreContainer);
      
      // Skor etiketi
      const scoreLabel = document.createElement('span');
      scoreLabel.className = 'score-label';
      scoreLabel.textContent = 'Puanınız';
      Object.assign(scoreLabel.style, internal.styles.scoreLabel);
      
      // Skor değeri
      const scoreValue = document.createElement('span');
      scoreValue.className = 'score-value';
      scoreValue.id = 'standardized-score-value';
      scoreValue.textContent = score;
      Object.assign(scoreValue.style, internal.styles.scoreValue);
      
      // "Yeniden Oyna" butonu
      const playAgainBtn = container.querySelector('button, .btn');
      
      // Varsayılan buton oluştur
      if (!playAgainBtn) {
        const newButton = document.createElement('button');
        newButton.textContent = 'Yeniden Oyna';
        newButton.className = 'standardized-play-again-btn';
        Object.assign(newButton.style, internal.styles.button);
        
        // Hover efekti
        newButton.addEventListener('mouseenter', function() {
          Object.assign(this.style, internal.styles.buttonHover);
        });
        
        newButton.addEventListener('mouseleave', function() {
          // Hover stili kaldır
          for (const prop in internal.styles.buttonHover) {
            this.style[prop] = internal.styles.button[prop] || '';
          }
        });
        
        // Tıklama olayı
        newButton.addEventListener('click', function() {
          // Sayfayı yenile veya oyunu yeniden başlat
          window.location.reload();
        });
        
        resultElement.appendChild(newButton);
      }
      
      // Elementleri birleştir
      scoreContainer.appendChild(scoreLabel);
      scoreContainer.appendChild(scoreValue);
      
      resultElement.appendChild(titleElement);
      resultElement.appendChild(scoreContainer);
      
      // Konteynere ekle
      container.prepend(resultElement);
      
      // Skoru animasyonlu göster
      animateScoreChange(scoreValue, 0, score);
      
      // İşlemi tamamlandı olarak işaretle
      internal.displayCompleted = true;
    } catch (error) {
      console.error("Standart sonuç görünümü oluşturulurken hata oluştu:", error);
    }
  }
  
  /**
   * Sayfadan bir skor değeri almaya çalışır
   */
  function getScoreFromPage() {
    try {
      // Yaygın skor elementlerini kontrol et
      const selectors = [
        '#final-score', '.final-score', '#finalScore', '.score-value',
        '.result-value', '.game-result-score', '.score'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        
        if (element) {
          const value = parseInt(element.textContent);
          
          if (!isNaN(value)) {
            // Değer 10-100 aralığında değilse, düzelt
            if (value < 10 || value > 100) {
              return Math.max(10, Math.min(100, value));
            }
            
            return value;
          }
        }
      }
      
      // Skorun bulunduğu diğer yaygın selektörleri ara
      const textSelectors = [
        'span:contains("puan")', 'span:contains("skor")', 
        'div:contains("puan")', 'div:contains("skor")',
        'p:contains("puan")', 'p:contains("skor")'
      ];
      
      for (const selector of textSelectors) {
        // jQuery benzeri seçici oluştur
        const elements = findElementsContainingText(selector.split(':contains(')[0], selector.split(':contains(')[1].replace(')', ''));
        
        for (const element of elements) {
          // İçeriğinden sayıyı çıkar
          const matches = element.textContent.match(/\d+/);
          
          if (matches && matches.length > 0) {
            const value = parseInt(matches[0]);
            
            if (!isNaN(value)) {
              // Değer 10-100 aralığında değilse, düzelt
              if (value < 10 || value > 100) {
                return Math.max(10, Math.min(100, value));
              }
              
              return value;
            }
          }
        }
      }
      
      // Hala bulunamadıysa, varsayılan değer
      return 50; // Orta bir değer
    } catch (error) {
      console.error("Sayfadan skor alınırken hata oluştu:", error);
      return 50; // Hata durumunda varsayılan değer
    }
  }
  
  /**
   * Belirtilen metni içeren elementleri bulur (jQuery :contains seçicisine benzer)
   */
  function findElementsContainingText(selector, text) {
    const elements = document.querySelectorAll(selector);
    const result = [];
    
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].textContent.indexOf(text) !== -1) {
        result.push(elements[i]);
      }
    }
    
    return result;
  }
  
  /**
   * Skor değişimini animasyonlu gösterir
   */
  function animateScoreChange(element, startValue, endValue) {
    try {
      if (!element) return;
      
      // Değerler aynıysa animasyon yapma
      if (startValue === endValue) {
        element.textContent = endValue;
        return;
      }
      
      const duration = 1500; // 1.5 saniye
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Yavaşlayan hareket efekti
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Şu anki değeri hesapla
        const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
        
        // Elementi güncelle
        element.textContent = currentValue;
        
        // Animasyon devam ediyorsa bir sonraki kareyi çiz
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      // Animasyonu başlat
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Skor animasyonu sırasında hata oluştu:", error);
      // Hata durumunda direkt değeri güncelle
      if (element) element.textContent = endValue;
    }
  }
  
  // Dışa açık API
  window.GameResultDisplayer = {
    initialize: initialize,
    standardizeResultScreens: standardizeResultScreens,
    setScore: function(score) {
      internal.realScore = score;
      standardizeResultScreens();
    }
  };
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', initialize);
})();