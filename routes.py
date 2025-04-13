from flask import Blueprint, render_template, url_for
from functools import wraps # login_required için gerekli

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import session, flash, redirect, request
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
            return redirect(url_for('main.login', redirect=request.url)) # Updated url_for to include blueprint
        return f(*args, **kwargs)
    return decorated_function

# Blueprint tanımı
main = Blueprint('main', __name__)

@main.route('/leaderboard')
def leaderboard():
    """Liderlik tablosu sayfasını gösterir."""
    return render_template('leaderboard.html')

def send_welcome_email(email, username):
    from flask_mail import Message # Import here to avoid circular import
    from app import mail #Import here to avoid circular import
    msg = Message('OmGame Dünyasına Hoş Geldiniz!', sender='noreply@omgame.com', recipients=[email]) # Replace with your actual sender address
    msg.body = f"Merhaba {username},\nOmGame dünyasına hoş geldin!  Keyifli oyunlar dileriz."
    mail.send(msg)