from flask import url_for, render_template, login_required
from app import app # Assuming app is defined elsewhere
from flask_mail import Message # Assuming flask_mail is installed and configured
from app import mail # Assuming mail is configured in app.py


# Wordle rota tanımını ekleyin
@app.route('/games/wordle')
@login_required # Added login_required decorator as suggested by the context
def game_wordle():
    return render_template('games/wordle.html')

@app.route('/games/wordPuzzle')
@login_required
def game_wordPuzzle():
    return render_template('games/wordPuzzle.html')

def send_welcome_email(email, username):
    msg = Message('OmGame Dünyasına Hoş Geldiniz!', sender='noreply@omgame.com', recipients=[email]) # Replace with your actual sender address
    msg.body = f"Merhaba {username},\nOmGame dünyasına hoş geldin!  Keyifli oyunlar dileriz."
    mail.send(msg)

@app.route('/games/minesweeper')
@login_required
def minesweeper():
    return render_template('games/minesweeper.html')


# routes.py
# Bu dosya artık kullanılmıyor, yönlendirmeler main.py içerisinde.
# 2048 oyunu kaldırıldı
# 2048 API endpoint'i kaldırıldı