
// Common utility functions for all games

// Function to show login notification
function showLoginNotification() {
    const notification = document.createElement('div');
    notification.className = 'login-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>Giriş Yapın</h3>
            <p>Skorunuzu kaydetmek ve liderlik tablosunda yer almak için giriş yapmanız gerekiyor.</p>
            <div class="notification-buttons">
                <button class="btn-login">Giriş Yap</button>
                <button class="btn-dismiss">Şimdi Değil</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Handle login button click
    notification.querySelector('.btn-login').addEventListener('click', () => {
        window.location.href = '/login?save_score=true&next=' + encodeURIComponent(window.location.href);
    });
    
    // Handle dismiss button click
    notification.querySelector('.btn-dismiss').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto dismiss after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 10000);
}

// Generic error handler function for fetch requests
function handleFetchError(error, context = 'operation') {
    console.error(`Error during ${context}:`, error);
    return { success: false, message: `İşlem sırasında bir hata oluştu: ${error.message}` };
}

// Generic score saving function that can be used by all games
function saveGameScore(score, gameType) {
    return fetch('/api/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            score: score,
            game_type: gameType
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Score saved successfully!');
            
            // Display XP gain if applicable
            if (data.xp_gained && typeof showXPGain === 'function') {
                showXPGain(data.xp_gained);
                
                // If player leveled up, show celebration
                if (data.is_level_up && typeof showLevelUp === 'function') {
                    showLevelUp(data.level);
                }
            }
            return data;
        } else {
            console.log('Failed to save score:', data.message);
            
            // If login is required, show login modal
            if (data.message === 'Login required' && data.redirect) {
                if (typeof showLoginNotification === 'function') {
                    showLoginNotification();
                } else if (confirm('Skorunuzu kaydetmek için giriş yapmanız gerekiyor. Giriş sayfasına yönlendirilmek ister misiniz?')) {
                    window.location.href = data.redirect;
                }
            }
            return data;
        }
    })
    .catch(error => handleFetchError(error, 'score saving'));
}

// Add CSS for login notification
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .login-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            color: white;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.5s ease-out;
            max-width: 300px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification-content h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #5cb85c;
        }
        
        .notification-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        
        .btn-login, .btn-dismiss {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .btn-login {
            background-color: #5cb85c;
            color: white;
        }
        
        .btn-login:hover {
            background-color: #4cae4c;
        }
        
        .btn-dismiss {
            background-color: #f0f0f0;
            color: #333;
        }
        
        .btn-dismiss:hover {
            background-color: #e0e0e0;
        }
    `;
    document.head.appendChild(style);
});
