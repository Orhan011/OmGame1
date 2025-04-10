from flask import url_for, render_template
from app import app, mail # app ve mail app.py'den import ediliyor
from flask_mail import Message
from functools import wraps # login_required için gerekli

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import session, flash, redirect, request
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
            return redirect(url_for('login', redirect=request.url))
        return f(*args, **kwargs)
    return decorated_function


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
    """Mayın Tarlası: Mantık ve strateji oyunu
    Mantık yürüterek mayınları işaretle ve tarlanı temizle!"""
    return render_template('games/minesweeper.html')


# routes.py
# Bu dosya artık kullanılmıyor, yönlendirmeler main.py içerisinde.
# 2048 oyunu kaldırıldı
# 2048 API endpoint'i kaldırıldı