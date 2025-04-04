/**
 * ZekaPark Sayfa Başlatıcı
 * Gezinti geçmişini başlatan ilk script
 */

(function() {
    'use strict';
    
    // Sayfa ilk yüklendiğinde çalış
    // Bu script tüm sayfalarda öncelikli olarak çalışır
    
    // Yapılandırma
    const CONFIG = {
        historyStorageKey: 'zekapark_nav_history',  // sessionStorage key
        debug: true
    };
    
    // Konsol Hata Ayıklama
    function debugLog(...args) {
        if (CONFIG.debug) {
            console.log(...args);
        }
    }
    
    // Geçmiş fonksiyonları
    function getNavigationHistory() {
        try {
            const historyData = sessionStorage.getItem(CONFIG.historyStorageKey);
            return historyData ? JSON.parse(historyData) : [];
        } catch (e) {
            console.warn('Navigasyon geçmişi okuma hatası:', e);
            return [];
        }
    }
    
    function setNavigationHistory(history) {
        try {
            sessionStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(history));
            debugLog("💾 Navigasyon geçmişi kaydedildi:", history.map(h => h.path).join(' → '));
        } catch (e) {
            console.warn('Navigasyon geçmişi yazma hatası:', e);
        }
    }
    
    // Temel sayfa geçmişi nesnesi
    function createHistoryItem() {
        return {
            path: window.location.pathname,
            title: document.title,
            timestamp: Date.now()
        };
    }
    
    // Sayfa geçmişini başlat
    function initializeNavigationHistory() {
        try {
            let history = getNavigationHistory();
            const currentPage = createHistoryItem();
            
            // İlk ziyaret
            if (!history || history.length === 0) {
                history = [currentPage];
                setNavigationHistory(history);
                debugLog("🚀 İlk kez sayfa geçmişi başlatıldı:", currentPage.path);
                return;
            }
            
            // Son ziyaret edilen sayfa bu sayfa mı?
            const lastPage = history[history.length - 1];
            if (lastPage.path !== currentPage.path) {
                // Farklı sayfa, geçmişe ekle
                history.push(currentPage);
                setNavigationHistory(history);
                debugLog("➕ Sayfa geçmişe eklendi:", currentPage.path);
                debugLog("📜 Güncel geçmiş:", history.map(h => h.path).join(' → '));
            } else {
                debugLog("ℹ️ Aynı sayfa tekrar yüklendi, geçmiş güncellenmedi");
            }
        } catch (err) {
            console.warn("Sayfa geçmişi başlatma hatası:", err);
        }
    }
    
    // Sayfa yüklenme olayı
    window.addEventListener('load', function() {
        try {
            debugLog("🌟 Sayfa yüklendi, geçmiş başlatılıyor...");
            initializeNavigationHistory();
        } catch (err) {
            console.warn("Sayfa başlatma hatası:", err);
        }
    });
})();
