/**
 * PurifyGameResults - 100% Güvenilir Rastgele Puan Temizleyici
 * 
 * Bu script oyun sonu ekranında görüntülenen rastgele puanları kaldırır
 * ve bunları gerçek API yanıtından gelen doğrulanmış skorlar ile değiştirir.
 */
(function() {
  "use strict";
  
  // Sayfa yüklendiğinde başlat
  window.addEventListener('DOMContentLoaded', function() {
    // Hemen başlat
    PurifyResults.init();
    
    // Sayfa tamamen yüklendikten sonra tekrar çalıştır
    window.addEventListener('load', function() {
      setTimeout(PurifyResults.init, 500);
    });
  });

  // Ana kapsayıcı
  const PurifyResults = {
    // Son API yanıtından gelen gerçek skor
    realScore: null,
    
    // Sayaç - kaç kez çalıştı
    cleanupCounter: 0,
    
    // Güncelleyici ID
    updateTimerId: null,
    
    // Selektörler
    selectors: {
      // Skor elementleri
      scoreElements: [
        '#final-score', '#finalScore', '.final-score', '.result-score', 
        '[id$="-score"]', '.game-score', '.result-stat-value span', 
        '.stat-value', '.score-value'
      ],
      
      // Skor kapları
      scoreContainers: [
        '.results-stats', '.game-result-stats', '.game-stats', 
        '.result-details', '.game-results', '.memory-results-body',
        '.result-summary'
      ],
      
      // Gizlenecek elementler
      elementsToHide: [
        '.rating-stars', '.rating-text', '#rating-stars', '#rating-text',
        '.results-rating', '.performance-rating', '.game-rating'
      ]
    },
    
    /**
     * Başlangıç - tüm işlemleri başlatır
     */
    init: function() {
      // API işleyicisini kur
      PurifyResults.setupApiListeners();
      
      // Temizleme işlemini başlat
      PurifyResults.cleanAllResults();
      
      // DOM değişikliklerini izle
      PurifyResults.observeDOM();
      
      // Periyodik temizleme başlat (her 800ms)
      if (!PurifyResults.updateTimerId) {
        PurifyResults.updateTimerId = setInterval(PurifyResults.cleanAllResults, 800);
        
        // 20 saniye sonra interval'ı durdur (güç tasarrufu)
        setTimeout(function() {
          clearInterval(PurifyResults.updateTimerId);
          PurifyResults.updateTimerId = null;
        }, 20000);
      }
    },
    
    /**
     * DOM değişikliklerini izle
     */
    observeDOM: function() {
      try {
        // Mutation Observer
        const observer = new MutationObserver(function(mutations) {
          let needsCleanup = false;
          
          // Her mutasyonu kontrol et
          mutations.forEach(function(mutation) {
            // Yeni eklenen nodeları kontrol et
            if (mutation.addedNodes && mutation.addedNodes.length) {
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                
                // Sadece Element nodelarıyla ilgileniyoruz
                if (node.nodeType === 1) {
                  // Element bir class name'e sahipse
                  if (node.className) {
                    try {
                      // Class bir string ise
                      if (typeof node.className === 'string') {
                        // result, stat, score gibi kelimeler içeriyor mu kontrol et
                        if (node.className.indexOf('result') !== -1 || 
                            node.className.indexOf('stat') !== -1 ||
                            node.className.indexOf('score') !== -1) {
                          needsCleanup = true;
                          break;
                        }
                      }
                    } catch (err) {
                      console.log("Node sınıf kontrolü hatası:", err);
                    }
                  }
                }
              }
            }
            
            // display değişikliklerini kontrol et
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                mutation.target.style &&
                (mutation.target.style.display === 'block' || 
                 mutation.target.style.display === 'flex')) {
                
              // Sonuç, oyun sonu veya istatistik paneli mi?
              try {
                if (typeof mutation.target.className === 'string' &&
                    (mutation.target.className.indexOf('result') !== -1 || 
                     mutation.target.className.indexOf('game-over') !== -1 ||
                     mutation.target.className.indexOf('stat') !== -1)) {
                  needsCleanup = true;
                }
                
                // ID kontrolü
                if (mutation.target.id && 
                    (mutation.target.id.indexOf('result') !== -1 || 
                     mutation.target.id.indexOf('score') !== -1 ||
                     mutation.target.id.indexOf('stats') !== -1)) {
                  needsCleanup = true;
                }
              } catch (err) {
                console.log("Mutation hedef kontrolü hatası:", err);
              }
            }
          });
          
          // Temizleme gerekiyorsa çalıştır
          if (needsCleanup) {
            PurifyResults.cleanAllResults();
          }
        });
        
        // Tüm DOM'u izle
        observer.observe(document.body, {
          childList: true,    // DOM'a eklenen/çıkarılan nodeları izle
          subtree: true,      // Tüm alt elementleri izle
          attributes: true,   // Özellikleri izle
          attributeFilter: ['style', 'class']  // Sadece stil ve sınıf değişikliklerini izle
        });
        
        console.log("DOM gözlemcisi başlatıldı");
      } catch (error) {
        console.error("DOM gözlemcisi başlatılamadı:", error);
      }
    },
    
    /**
     * API olaylarını dinle (skor yanıtlarını yakalamak için)
     */
    setupApiListeners: function() {
      try {
        // Özel olayları dinle
        document.addEventListener('scoreApiResponse', function(e) {
          if (e.detail && e.detail.data) {
            const data = e.detail.data;
            const score = data.points?.total || data.score || 0;
            
            console.log("Gerçek skor yakalandı:", score);
            
            // Gerçek skoru sakla ve temizleme işlemini başlat
            PurifyResults.realScore = score;
            PurifyResults.cleanAllResults();
          }
        });
        
        // ScoreHandler.saveScore metodunu override et
        if (window.ScoreHandler && window.ScoreHandler.saveScore) {
          const originalSaveScore = window.ScoreHandler.saveScore;
          
          window.ScoreHandler.saveScore = function() {
            // Orijinal metodu çağır
            const result = originalSaveScore.apply(this, arguments);
            
            // Promise dönerse işle
            if (result && typeof result.then === 'function') {
              result.then(function(data) {
                if (data && data.success) {
                  // Gerçek skoru al
                  const score = data.points?.total || data.score || 0;
                  console.log("API'den gerçek skor yakalandı:", score);
                  
                  // Gerçek skoru güncelle ve temizleme işlemini başlat
                  PurifyResults.realScore = score;
                  PurifyResults.cleanAllResults();
                  
                  // Diğer kodların da haberi olsun diye özel olay yayınla
                  document.dispatchEvent(new CustomEvent('scoreApiResponse', {
                    detail: { data: data }
                  }));
                }
              }).catch(function(error) {
                console.error("Skor kaydetme hatası:", error);
              });
            }
            
            return result;
          };
        }
        
        console.log("API olayları dinleyicisi kuruldu");
      } catch (error) {
        console.error("API olayları dinleyicisi kurulamadı:", error);
      }
    },
    
    /**
     * Tüm sonuç ekranlarını temizler ve gerçek skorlarla günceller
     */
    cleanAllResults: function() {
      try {
        PurifyResults.cleanupCounter++;
        console.log("Temizleme #" + PurifyResults.cleanupCounter + " başlatılıyor...");
        
        // 1. Tüm skor konteynerlerini temizle
        PurifyResults.selectors.scoreContainers.forEach(function(selector) {
          const containers = document.querySelectorAll(selector);
          containers.forEach(PurifyResults.cleanStatContainer);
        });
        
        // 2. Derecelendirme yıldızları ve benzer elementleri gizle
        PurifyResults.selectors.elementsToHide.forEach(function(selector) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(function(element) {
            element.style.display = 'none';
          });
        });
        
        // 3. Gerçek skor varsa, tüm skor gösterimlerini güncelle
        if (PurifyResults.realScore !== null) {
          PurifyResults.updateAllScores(PurifyResults.realScore);
        }
        
        console.log("Temizleme #" + PurifyResults.cleanupCounter + " tamamlandı.");
      } catch (error) {
        console.error("Temizleme işlemi sırasında hata:", error);
      }
    },
    
    /**
     * Bir istatistik konteynerini temizler
     */
    cleanStatContainer: function(container) {
      try {
        if (!container) return;
        
        // İkon ve skor dışındaki tüm içeriği gizle
        const children = container.children;
        let scoreElement = null;
        
        // Her bir çocuk elementi kontrol et
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          
          // Text içeriğinde puan/skor kelimeleri varsa sakla, diğerlerini gizle
          const text = child.textContent.toLowerCase();
          if (text.indexOf('puan') !== -1 || 
              text.indexOf('skor') !== -1 || 
              text.indexOf('toplam puan') !== -1) {
            scoreElement = child;
          } else {
            child.style.display = 'none';
          }
        }
        
        // Skor elementi bulunduysa düzenle
        if (scoreElement) {
          scoreElement.style.flex = '1';
          scoreElement.style.textAlign = 'center';
          
          // Skor elementi haricindeki diğer kardeş elementleri gizle
          Array.from(container.children).forEach(function(sibling) {
            if (sibling !== scoreElement) {
              sibling.style.display = 'none';
            }
          });
          
          // Özelleştirme
          PurifyResults.enhanceScoreElement(scoreElement);
        }
      } catch (error) {
        console.error("Konteyner temizleme hatası:", error);
      }
    },
    
    /**
     * Skor elementini görsel olarak iyileştirir
     */
    enhanceScoreElement: function(element) {
      try {
        if (!element) return;
        
        // Skor değer elementini bul
        const valueElement = element.querySelector('.result-stat-value, .stat-value');
        if (valueElement) {
          valueElement.style.fontSize = '3rem';
          valueElement.style.fontWeight = 'bold';
          valueElement.style.color = '#6a5ae0';
          valueElement.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
          valueElement.style.padding = '20px 0';
          valueElement.style.display = 'block';
        }
        
        // İkonu bul ve güzelleştir
        const iconElement = element.querySelector('i');
        if (iconElement) {
          iconElement.style.fontSize = '2.5rem';
          iconElement.style.color = '#6a5ae0';
          iconElement.style.margin = '10px 0';
          iconElement.style.display = 'block';
        }
      } catch (error) {
        console.error("Skor elementi iyileştirme hatası:", error);
      }
    },
    
    /**
     * Tüm skor gösterimlerini günceller
     */
    updateAllScores: function(score) {
      try {
        if (score === null || score === undefined) return;
        
        // Tüm skor elementlerini bul
        let allScoreElements = [];
        
        PurifyResults.selectors.scoreElements.forEach(function(selector) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(function(element) {
            allScoreElements.push(element);
          });
        });
        
        // Her elementi animasyonlu şekilde güncelle
        allScoreElements.forEach(function(element) {
          const currentValue = parseInt(element.textContent) || 0;
          PurifyResults.animateScoreChange(element, currentValue, score);
        });
      } catch (error) {
        console.error("Skor gösterimi güncelleme hatası:", error);
      }
    },
    
    /**
     * Skor değişimini animasyonlu şekilde gösterir
     */
    animateScoreChange: function(element, startValue, endValue) {
      try {
        if (!element) return;
        
        // Başlangıç ve bitiş değeri aynıysa animasyona gerek yok
        if (startValue === endValue) {
          element.textContent = endValue;
          return;
        }
        
        const duration = 1000; // 1 saniye
        const startTime = performance.now();
        
        // Animasyon fonksiyonu
        function updateFrame(currentTime) {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          
          // Easing (yavaşlayan hareket)
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          
          // Geçerli değeri hesapla
          const currentValue = Math.floor(startValue + ((endValue - startValue) * easedProgress));
          
          // Elementi güncelle
          element.textContent = currentValue;
          
          // Animasyon bitmediyse devam et
          if (progress < 1) {
            requestAnimationFrame(updateFrame);
          }
        }
        
        // Animasyonu başlat
        requestAnimationFrame(updateFrame);
      } catch (error) {
        console.error("Skor animasyon hatası:", error);
        // Hata durumunda direkt değeri ata
        if (element) element.textContent = endValue;
      }
    }
  };
  
  // Global erişim
  window.PurifyResults = PurifyResults;
})();