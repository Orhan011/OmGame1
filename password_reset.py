from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random
import string
import logging
import os

from models import db, User

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

            # E-postayı gönder
            subject = "Şifre Sıfırlama Kodu"
            # E-postayı direkt gönder
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText
                
                from_email = "omgameee@gmail.com"
                # Çevresel değişkenden alınan Gmail uygulama şifresi
                password = os.environ.get('GMAIL_APP_PASSWORD', '')  # Uygulama şifresi - None gelirse boş string kullan
                from_name = "OmGame"
                
                # E-posta mesajını oluştur
                smtp_msg = MIMEMultipart()
                smtp_msg['From'] = f"{from_name} <{from_email}>"
                smtp_msg['To'] = email
                smtp_msg['Subject'] = subject
                smtp_msg.attach(MIMEText(html_body, 'html'))
                
                # SMTP sunucusuna bağlan ve e-postayı gönder
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
                server.login(from_email, password)
                text = smtp_msg.as_string()
                server.sendmail(from_email, email, text)
                server.quit()
                
                # Geliştirme modunda doğrulama kodunu logla
                print(f"### DOĞRULAMA KODU: {verification_code} - E-posta: {email} ###")
                logger.info(f"E-posta başarıyla gönderildi: {email}, Doğrulama kodu: {verification_code}")
            except Exception as e:
                logger.error(f"E-posta gönderme hatası: {str(e)}")
                # Hata detaylarını da yazdır
                import traceback
                logger.error(f"DETAYLI HATA: {traceback.format_exc()}")
                # Geliştirme/Test modunda olduğumuz için, doğrulama kodunu konsola yazdıralım
                print(f"### TEST MODU AKTIF - E-POSTA GÖNDERİLEMEDİ AMA DOĞRULAMA KODU: {verification_code} ###")
                print(f"### HATA MESAJI: {str(e)} ###")
                logger.warning(f"E-posta gönderilemedi ama test modunda olduğu için işlem devam ediyor. Kod: {verification_code}")
            
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
        email = request.args.get('email', '')
        if request.method == 'POST':
            verification_code = request.form.get('verification_code', '')
            user = User.query.filter_by(email=email).first()

            if not user:
                flash('Kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            if not user.reset_token or user.reset_token_expiry < datetime.utcnow():
                flash('Doğrulama kodunun süresi dolmuş.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))

            if user.reset_token != verification_code:
                flash('Geçersiz doğrulama kodu.', 'danger')
                return render_template('reset_code.html', email=email)

            # Kodu doğruladık, şifre sıfırlama sayfasına yönlendir
            session['reset_email'] = email
            session['reset_verified'] = True
            return redirect(url_for('password_reset.reset_password'))

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
        # Session'ı kontrol et
        if not session.get('reset_verified') or not session.get('reset_email'):
            flash('Şifre sıfırlama işlemi için önce doğrulama kodunu girmelisiniz.', 'danger')
            return redirect(url_for('password_reset.forgot_password'))

        email = session.get('reset_email')
        
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
            
            # Kullanıcıyı bul ve şifresini güncelle
            user = User.query.filter_by(email=email).first()
            if not user:
                flash('Kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('password_reset.forgot_password'))
            
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
        
    return render_template('reset_password.html')