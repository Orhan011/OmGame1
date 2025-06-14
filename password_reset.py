from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random
import string
import logging
import os

from models import db, User
from main import app  # Ana uygulama değişkenini import et

# Blueprint tanımlaması
password_reset = Blueprint('password_reset', __name__)

logger = logging.getLogger(__name__)

def generate_verification_code():
    """
    4 haneli rastgele doğrulama kodu oluşturur
    
    Returns:
        str: 4 haneli doğrulama kodu
    """
    return ''.join(random.choices('0123456789', k=4))

@password_reset.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """
    Şifre unutma sayfası - kullanıcı e-posta adresini girer
    """
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            if not email:
                flash('Lütfen e-posta adresinizi girin.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            user = User.query.filter_by(email=email).first()
            if not user:
                # Kullanıcı bulunamadı mesajı
                flash('Bu email ile kayıtlı bir kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            # 4 haneli doğrulama kodu oluşturma
            verification_code = generate_verification_code()
            token_expiry = datetime.utcnow() + timedelta(minutes=30)
            user.reset_token = verification_code
            user.reset_token_expiry = token_expiry
            db.session.commit()

            # HTML E-posta içeriği
            html_body = f"""
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Şifre Sıfırlama Doğrulama Kodu</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    
                    body {{
                        font-family: 'Poppins', sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f5f7;
                        color: #333;
                        line-height: 1.6;
                    }}
                    
                    .container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                    }}
                    
                    .header {{
                        background: linear-gradient(135deg, #6b46c1 0%, #8a63d2 100%);
                        padding: 30px 40px;
                        text-align: center;
                    }}
                    
                    .header h1 {{
                        color: white;
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }}
                    
                    .content {{
                        padding: 40px;
                        text-align: center;
                    }}
                    
                    .verification-code {{
                        font-size: 36px;
                        font-weight: 700;
                        letter-spacing: 5px;
                        margin: 30px 0;
                        color: #6b46c1;
                        background: #f7f4ff;
                        padding: 15px 25px;
                        border-radius: 8px;
                        display: inline-block;
                    }}
                    
                    .expiry-notice {{
                        color: #e53e3e;
                        margin-top: 25px;
                        font-size: 14px;
                        font-weight: 500;
                    }}
                    
                    .notice {{
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        padding: 15px;
                        margin-top: 30px;
                        font-size: 14px;
                        color: #718096;
                    }}
                    
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #a0aec0;
                        border-top: 1px solid #edf2f7;
                    }}
                    
                    @media only screen and (max-width: 600px) {{
                        .container {{
                            margin: 0;
                            border-radius: 0;
                        }}
                        
                        .header, .content {{
                            padding: 20px;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Şifre Sıfırlama Doğrulama Kodunuz</h1>
                    </div>
                    <div class="content">
                        <p>Merhaba,</p>
                        <p>Şifrenizi sıfırlamak için talepte bulundunuz. Şifre sıfırlama işlemine devam etmek için aşağıdaki doğrulama kodunu kullanın:</p>
                        
                        <div class="verification-code">{verification_code}</div>
                        
                        <p class="expiry-notice">Bu kod 30 dakika içinde geçerliliğini yitirecektir.</p>
                        
                        <div class="notice">
                            <strong>Önemli:</strong> Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve hesabınızın güvenliği için şifrenizi değiştirin.
                        </div>
                    </div>
                    <div class="footer">
                        <p>Bu e-posta, şifre sıfırlama talebiniz üzerine gönderilmiştir.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Ana modüldeki e-posta gönderme fonksiyonunu kullan
            from main import send_email_in_background
            
            # E-postayı gönder
            subject = "Şifre Sıfırlama Kodu"
            email_sent = send_email_in_background(
                to_email=email,
                subject="OmGame - Şifre Sıfırlama Doğrulama Kodunuz",
                html_body=html_body,
                verification_code=verification_code
            )
            
            # Sadece loglama amaçlı kaydet (sunucu loglarında görünecek, kullanıcıya gösterilmeyecek)
            logger.info(f"E-posta: {email}, Doğrulama kodu gönderildi")
            
            flash('Doğrulama kodu e-posta adresinize gönderildi.', 'success')
            return redirect(url_for('password_reset.reset_code', email=email))

    except Exception as e:
        logger.error(f"Hata: {e}")
        flash('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger')

    return render_template('forgot_password.html')

@password_reset.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    """
    Doğrulama kodu sayfası - kullanıcı e-posta ile gönderilen kodu girer
    """
    try:
        # E-posta adresini farklı kaynaklardan almayı dene
        email = request.form.get('email') or request.args.get('email', '')
        
        # E-posta adresi boş ise, session'dan almayı dene
        if not email:
            email = session.get('reset_email', '')
            logger.warning(f"E-posta form veya URL'de bulunamadı, session'dan alındı: {email}")
        
        logger.info(f"Doğrulama sayfası çağrıldı: method={request.method}, email={email}")
        
        if request.method == 'POST':
            verification_code = request.form.get('verification_code', '')
            # Debug logu ekle
            logger.info(f"Doğrulama kodu girişi: email={email}, code={verification_code}, tüm form: {request.form}")
            
            if not email:
                logger.error("E-posta adresi bulunamadı!")
                flash('E-posta adresi bulunamadı. Lütfen şifre sıfırlama işlemini baştan başlatın.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))
            
            user = User.query.filter_by(email=email).first()

            if not user:
                logger.error(f"Kullanıcı bulunamadı hatası: email={email}")
                flash('Kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            if not user.reset_token or user.reset_token_expiry < datetime.utcnow():
                flash('Doğrulama kodunun süresi dolmuş.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            if user.reset_token != verification_code:
                flash('Geçersiz doğrulama kodu.', 'danger')
                return render_template('reset_code.html', email=email)

            # Kodu doğruladık, şifre sıfırlama sayfasına yönlendir
            # Yeni token oluştur (UUID yerine basitleştirilmiş token)
            reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
            user.reset_token = reset_token
            db.session.commit()
            
            # Session'a doğrulama bilgilerini kaydet
            session['reset_email'] = email
            session['reset_verified'] = True
            
            logger.info(f"Doğrulama başarılı: {email}, token: {reset_token}")
            
            # Hem email hem token parametrelerini URL'e ekle
            return redirect(url_for('password_reset.reset_password', email=email, token=reset_token))

    except Exception as e:
        logger.error(f"Hata: {e}")
        flash('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return render_template('reset_code.html', email=email)

@password_reset.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    """
    Şifre sıfırlama sayfası - kullanıcı yeni şifresini belirler
    """
    try:
        # URL'den parametreleri al
        email = request.args.get('email') or request.form.get('email')
        token = request.args.get('token') or request.form.get('token')
        
        # Şifre sıfırlama sayfasına doğrudan erişimi engelle
        if not email or not token:
            # Session'ı kontrol et (eski yöntem desteği için)
            if not session.get('reset_verified') or not session.get('reset_email'):
                flash('Şifre sıfırlama işlemi için önce doğrulama kodunu girmelisiniz.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))
            email = session.get('reset_email')
        
        # Parametreleri logla (debug)
        logger.info(f"Reset Password: email={email}, token={token}, session={session.get('reset_verified')}")
        
        # Önce sadece e-posta ile kullanıcıyı bul
        user = User.query.filter_by(email=email).first()
        
        # Kullanıcı bulunamadı mı?
        if not user:
            logger.error(f"Şifre sıfırlamada kullanıcı bulunamadı: {email}")
            flash('Kullanıcı bulunamadı.', 'danger')
            return redirect(url_for('password_reset.forgot_password'))
        
        # Oturum doğrulaması veya token doğrulaması
        is_verified = False
        
        # Session kontrolü
        if session.get('reset_verified') and session.get('reset_email') == email:
            is_verified = True
            logger.info(f"Oturum üzerinden doğrulandı: {email}")
            
        # Token kontrolü
        elif token and user.reset_token == token:
            is_verified = True
            logger.info(f"Token üzerinden doğrulandı: {email}, token: {token}")
            
        elif not token or not user.reset_token:
            logger.error(f"Token eksik veya bulunamadı: URL token={token}, User token={user.reset_token}")
        
        # Doğrulama başarısız
        if not is_verified:
            flash('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.', 'danger')
            return redirect(url_for('password_reset.forgot_password'))
        
        if request.method == 'POST':
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            # Şifre doğrulama kontrolleri
            if not password or not confirm_password:
                flash('Lütfen tüm alanları doldurun.', 'danger')
                return render_template('reset_password.html', email=email)
            
            if password != confirm_password:
                flash('Şifreler eşleşmiyor.', 'danger')
                return render_template('reset_password.html', email=email)
            
            if len(password) < 6:
                flash('Şifre en az 6 karakter uzunluğunda olmalıdır.', 'danger')
                return render_template('reset_password.html', email=email)
            
            # Kullanıcı doğrulaması zaten yapıldı, tekrar kontrol etmeye gerek yok
            
            # Şifreyi güncelle
            user.password_hash = generate_password_hash(password)
            # Reset tokenı temizle
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            
            # Session'dan reset bilgilerini temizle
            session.pop('reset_email', None)
            session.pop('reset_verified', None)
            
            flash('Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))
            
    except Exception as e:
        logger.error(f"Hata: {e}")
        flash('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        
    # Şifre sıfırlama sayfasına hem email hem token bilgilerini gönder
    # Formda hidden input olarak kullanılacak
    return render_template('reset_password.html', email=email, token=token)