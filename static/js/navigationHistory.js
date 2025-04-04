/**
 * ZekaPark - Sayfa Geçmişi Yönetim Sistemi
 * Sayfa geçmişini yöneten ve kaydeden merkezi sistem
 * v1.0
 */

// Hemen çalıştırılacak modül (sayfa yüklenmesini beklemez)
const NavigationHistory = (function() {
    'use strict';

    // Yapılandırma
    const CONFIG = {
        historyStorageKey: 'zekapark_nav_history',
        maxHistoryLength: 20,
        debug: true
    };

    // Geçmişi tutacak array
    let navigationPath = [];
    
    // Konsol log fonksiyonu
    function log(...args) {
        if (CONFIG.debug) {
            console.log(...args);
        }
    }

    // LocalStorage ve SessionStorage ile senkronize geçmiş tutma
    function loadHistory() {
        try {
            // Önce localStorage'dan
            let history = localStorage.getItem(CONFIG.historyStorageKey);
            
            // Eğer localStorage'da yoksa sessionStorage'dan dene  
            if (!history) {
                history = sessionStorage.getItem(CONFIG.historyStorageKey);
            }
            
            // Parse et ve array olarak döndür
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.warn('Geçmiş yükleme hatası:', e);
            return [];
        }
    }

    // Değişiklikleri tüm storage'lara kaydet
    function saveHistory(history) {
        try {
            const historyString = JSON.stringify(history);
            
            // Her iki depolama alanına da kaydet
            localStorage.setItem(CONFIG.historyStorageKey, historyString);
            sessionStorage.setItem(CONFIG.historyStorageKey, historyString);
            
            log('🔄 Geçmiş kaydedildi:', history.map(h => h.path).join(' → '));
        } catch (e) {
            console.warn('Geçmiş kaydetme hatası:', e);
        }
    }

    // Sayfa geçmişi item oluşturma
    function createHistoryItem() {
        return {
            path: window.location.pathname,
            title: document.title,
            timestamp: Date.now()
        };
    }

    // Geçmişi ekranda göster (debug için)
    function showDebugHistory() {
        const history = loadHistory();
        if (history.length > 0) {
            let debugElement = document.getElementById('history-debug');
            if (!debugElement) {
                debugElement = document.createElement('div');
                debugElement.id = 'history-debug';
                debugElement.style.position = 'fixed';
                debugElement.style.bottom = '10px';
                debugElement.style.right = '10px';
                debugElement.style.padding = '8px 12px';
                debugElement.style.background = 'rgba(0,0,0,0.7)';
                debugElement.style.color = 'white';
                debugElement.style.borderRadius = '4px';
                debugElement.style.fontSize = '12px';
                debugElement.style.zIndex = '9999';
                debugElement.style.maxWidth = '80%';
                debugElement.style.pointerEvents = 'none';
                document.body.appendChild(debugElement);
            }
            
            const pathChain = history.map(h => {
                const timeAgo = Math.round((Date.now() - h.timestamp) / 1000);
                return `${h.path} (${timeAgo}s)`;
            }).join(' → ');
            
            debugElement.innerHTML = `<strong>Geçmiş:</strong> ${pathChain}`;
        }
    }

    // Geçmişi başlat
    function initialize() {
        // Mevcut geçmişi yükle
        navigationPath = loadHistory();
        
        // Mevcut sayfa bilgisi
        const currentPage = createHistoryItem();
        
        // Eğer geçmiş boşsa, başlat
        if (navigationPath.length === 0) {
            navigationPath = [currentPage];
            saveHistory(navigationPath);
            log('📝 Geçmiş başlatıldı:', currentPage.path);
            return;
        }
        
        // Son ziyaret edilen sayfa mevcut sayfa mı kontrol et
        const lastPage = navigationPath[navigationPath.length - 1];
        
        // Sadece farklı bir sayfaya gittiyse ve son sayfa olarak eklenmemişse geçmişe ekle
        if (lastPage.path !== currentPage.path) {
            // Sayfayı geçmişe ekle
            navigationPath.push(currentPage);
            
            // Geçmiş çok uzunsa eski kayıtları temizle
            if (navigationPath.length > CONFIG.maxHistoryLength) {
                navigationPath = navigationPath.slice(-CONFIG.maxHistoryLength);
            }
            
            // Güncellenmiş geçmişi kaydet
            saveHistory(navigationPath);
            log('✅ Yeni sayfa geçmişe eklendi:', currentPage.path);
            log('📋 Güncel geçmiş:', navigationPath.map(h => h.path).join(' → '));
        } else {
            log('ℹ️ Zaten geçmişte olan bir sayfa, eklenmedi:', currentPage.path);
        }
        
        // Debug ekranını göster
        if (CONFIG.debug) {
            showDebugHistory();
        }
    }

    // Sayfa linklerini dinleyecek işlev
    function trackPageLinks() {
        try {
            document.querySelectorAll('a[href]').forEach(function(link) {
                // Aynı domain için ve daha önce işlenmemiş linkler
                if (link.hostname === window.location.hostname && 
                    !link.getAttribute('data-history-tracked') &&
                    !link.getAttribute('href').includes('javascript:') && 
                    !link.getAttribute('href').includes('#')) {
                    
                    link.setAttribute('data-history-tracked', 'true');
                    
                    link.addEventListener('click', function(e) {
                        // Özel durumlar (ctrl/cmd+click gibi)
                        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                        
                        try {
                            // Geçmişi güncelle
                            navigationPath = loadHistory();
                            const targetPath = new URL(link.href).pathname;
                            
                            // Mevcut sayfayı ekle (daha önce eklenmemişse)
                            const currentPage = createHistoryItem();
                            
                            // Mevcut sayfa en son eklenen sayfa değilse, ekle
                            if (navigationPath.length === 0 || 
                                navigationPath[navigationPath.length - 1].path !== currentPage.path) {
                                navigationPath.push(currentPage);
                            }
                            
                            saveHistory(navigationPath);
                            log('🔗 Link tıklandı, geçmiş güncellendi. Hedef:', targetPath);
                        } catch (err) {
                            console.warn('Link tıklama geçmiş hatası:', err);
                        }
                    });
                }
            });
        } catch (e) {
            console.warn('Link izleme hatası:', e);
        }
    }

    // Önceki sayfaya git
    function goBack() {
        navigationPath = loadHistory();
        
        if (navigationPath.length <= 1) {
            log('⚠️ Geri gidilecek sayfa yok, geçmiş boş veya sadece mevcut sayfa var');
            return false;
        }
        
        // Son sayfayı çıkar (o mevcut sayfa)
        navigationPath.pop();
        
        // Önceki sayfayı al
        const previousPage = navigationPath[navigationPath.length - 1];
        
        // Geçmişi kaydet
        saveHistory(navigationPath);
        
        log('⬅️ Önceki sayfaya dönülüyor:', previousPage.path);
        
        // Sayfaya git
        window.location.href = previousPage.path;
        return true;
    }

    // API
    return {
        initialize: initialize,
        trackLinks: trackPageLinks,
        goBack: goBack,
        getHistory: loadHistory,
        debug: showDebugHistory
    };
})();

// Sayfa yüklendiğinde geçmişi başlat
document.addEventListener('DOMContentLoaded', function() {
    // Geçmişi başlat
    NavigationHistory.initialize();
    
    // Linkleri takip et
    NavigationHistory.trackLinks();
});

// Bu script'i head içinde çalıştırıyoruz, bu yüzden sayfa tamamen yüklenmeden de çalışmalı
// İlk çalışma
if (document.readyState !== 'loading') {
    // DOMContentLoaded zaten tetiklendi
    NavigationHistory.initialize();
} else {
    // Sayfa henüz yüklenmedi, olayı bekle
    setTimeout(function() {
        NavigationHistory.initialize();
    }, 0);
}
