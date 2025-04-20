/**
 * Bot avatarları için destek fonksiyonları
 * Bot kullanıcıları için tutarlı renk ve görünüm sağlar
 */

// Bot avatarlarını işle - sayfa yüklendiğinde çalışır
document.addEventListener('DOMContentLoaded', function() {
    initializeBotAvatars();
});

/**
 * Sayfadaki tüm bot avatarlarını bulup stillendirir
 */
function initializeBotAvatars() {
    // Bot placeholder avatarlarını bul
    const botAvatars = document.querySelectorAll('[id^="avatar-placeholder-color-"]');
    
    botAvatars.forEach(avatar => {
        const colorCode = avatar.id.replace('avatar-placeholder-color-', '');
        styleBotAvatar(avatar, colorCode);
    });
}

/**
 * Bir bot avatar elementini belirli bir renkle stillendirir
 * 
 * @param {HTMLElement} element - Avatar elementi
 * @param {string} colorCode - Renk kodu (hexadecimal, ör: "ff5733")
 */
function styleBotAvatar(element, colorCode) {
    // Renk kodunu hexadecimal formatta ayarla
    const hexColor = `#${colorCode}`;
    
    // Arkaplan rengini ayarla
    element.style.backgroundColor = hexColor;
    
    // İlk harfi al ve büyük harfe çevir
    let initial = '';
    
    // Element içinde text varsa
    if (element.textContent) {
        initial = element.textContent.trim()[0].toUpperCase();
    } 
    // Yoksa parent elementten kullanıcı adını al
    else {
        // En yakın veri elementini bul
        const parent = element.closest('[data-username]');
        if (parent && parent.dataset.username) {
            initial = parent.dataset.username[0].toUpperCase();
        }
    }
    
    // İçeriği ayarla
    element.textContent = initial;
    
    // Stiller
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.color = '#ffffff';
    element.style.fontSize = '1.5em';
    element.style.fontWeight = 'bold';
    element.style.borderRadius = '50%';
}