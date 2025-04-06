// Oyun sonu
function gameOver() {
  playerTurn = false;
  gameStarted = false;
  updateStatusMessage('Oyun bitti! Tekrar denemek için "Başla" butonuna basın.');

  // Patlama efekti
  soundPads.forEach(pad => {
    setTimeout(() => {
      animatePad(pad);
    }, Math.random() * 500);
  });

  // Skoru kaydet
  saveScore();

  startBtn.textContent = 'Tekrar Başla';
}

// Skoru sunucuya gönderme
function saveScore() {
  // Skor 0 ise kaydetmeye gerek yok
  if (score <= 0) {
    console.log('Kaydedilecek skor yok');
    return;
  }
  
  console.log(`Skor gönderiliyor: ${score}`);
  
  // Backend'e skoru gönder
  fetch('/api/save-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_type: 'audio_memory',
      score: score
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
      notification.className = 'achievement-notification';
      notification.textContent = `🏆 Başarı: ${data.achievement.title}`;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '15px';
      notification.style.background = 'linear-gradient(135deg, rgba(106, 90, 224, 0.9), rgba(90, 55, 200, 0.9))';
      notification.style.color = 'white';
      notification.style.borderRadius = '10px';
      notification.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      notification.style.zIndex = '1000';
      notification.style.transform = 'translateX(120%)';
      notification.style.transition = 'transform 0.3s ease-in-out';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        setTimeout(() => {
          notification.style.transform = 'translateX(120%)';
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      }, 100);
    }
  })
  .catch(error => {
    console.error('Skor gönderme hatası:', error);
  });
}
