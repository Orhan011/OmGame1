#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random
import string
import logging

from models import db, User
from main import send_email_in_background

# Blueprint tanımlaması
reset_password = Blueprint('reset_password', __name__)

logger = logging.getLogger(__name__)

def generate_verification_code():
    """
    4 haneli rastgele doğrulama kodu oluşturur
    
    Returns:
        str: 4 haneli doğrulama kodu
    """
    return ''.join(random.choices(string.digits, k=4))

@reset_password.route('/sifre-sifirla', methods=['GET'])
def password_reset_request():
    """
    Şifre sıfırlama talebinde bulunmak için forma yönlendirir
    """
    return render_template('reset_password/request.html')

@reset_password.route('/sifre-sifirla/dogrulama-kodu-gonder', methods=['POST'])
def send_reset_code():
    """
    Kullanıcının e-posta adresine doğrulama kodu gönderir
    """
    email = request.form.get('email')
    
    if not email:
        flash('E-posta adresi gereklidir', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    # E-posta adresinin kayıtlı olup olmadığını kontrol et
    user = User.query.filter_by(email=email).first()
    
    if not user:
        flash('Bu e-posta adresi sistemde kayıtlı değil', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    # 4 haneli doğrulama kodu oluştur
    verification_code = generate_verification_code()
    
    # Doğrulama kodunun geçerlilik süresini ayarla (5 dakika)
    expiry_time = datetime.utcnow() + timedelta(minutes=5)
    
    # Kullanıcının doğrulama kodunu ve süresini veritabanında sakla
    user.reset_token = verification_code
    user.reset_token_expiry = expiry_time
    db.session.commit()
    
    # E-posta için HTML içeriği oluştur
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
                
                <p class="expiry-notice">Bu kod 5 dakika içinde geçerliliğini yitirecektir.</p>
                
                <div class="notice">
                    <strong>Önemli:</strong> Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve hesabınızın güvenliği için şifrenizi değiştirin.
                </div>
            </div>
            <div class="footer">
                <p>Bu e-posta, OmGame şifre sıfırlama talebiniz üzerine gönderilmiştir.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # E-postayı gönder
    subject = "OmGame - Şifre Sıfırlama Doğrulama Kodunuz"
    try:
        email_sent = send_email_in_background(
            to_email=email,
            subject=subject,
            html_body=html_body,
            verification_code=verification_code
        )
        
        if email_sent:
            flash('Doğrulama kodu e-posta adresinize gönderildi', 'success')
            # Doğrulama kodu sayfasına yönlendir ve e-posta adresini session'da tut
            session['reset_email'] = email
            
            return redirect(url_for('reset_password.verify_reset_code'))
        else:
            # E-posta gönderme başarısız olsa bile, kodu kaydedip kullanıcıya gösteriyoruz (test/geliştirme için)
            logger.error(f"E-posta gönderme başarısız: {email}")
            
            # E-posta gönderilemedi hatası göster
            flash('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
            return redirect(url_for('reset_password.password_reset_request'))
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        flash('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))

@reset_password.route('/sifre-sifirla/dogrulama', methods=['GET', 'POST'])
def verify_reset_code():
    """
    Kullanıcının girdiği doğrulama kodunu doğrular
    """
    # Session'dan e-posta adresini al
    email = session.get('reset_email')
    
    if not email:
        flash('Oturumunuz zaman aşımına uğradı. Lütfen tekrar başlayın.', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    if request.method == 'POST':
        verification_code = request.form.get('verification_code')
        
        if not verification_code:
            flash('Doğrulama kodu gereklidir', 'danger')
            return redirect(url_for('reset_password.verify_reset_code'))
        
        # Kullanıcıyı e-posta adresine göre bul
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('Geçersiz e-posta adresi', 'danger')
            return redirect(url_for('reset_password.password_reset_request'))
        
        # Doğrulama kodunun doğruluğunu ve geçerliliğini kontrol et
        if not user.reset_token or user.reset_token != verification_code:
            flash('Doğrulama kodu hatalı', 'danger')
            return redirect(url_for('reset_password.verify_reset_code'))
        
        if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            flash('Doğrulama kodunun süresi doldu. Lütfen yeni bir kod talep edin.', 'danger')
            return redirect(url_for('reset_password.password_reset_request'))
        
        # Doğrulama başarılı, şifre sıfırlama sayfasına yönlendir
        session['reset_verified'] = True
        return redirect(url_for('reset_password.new_password'))
    
    return render_template('reset_password/verify.html')

@reset_password.route('/sifre-sifirla/yeni-sifre', methods=['GET', 'POST'])
def new_password():
    """
    Kullanıcının yeni şifre belirlemesini sağlar
    """
    # Session'dan gerekli bilgileri al
    email = session.get('reset_email')
    reset_verified = session.get('reset_verified')
    
    if not email or not reset_verified:
        flash('Lütfen önce doğrulama kodunu girin', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        if not password or not password_confirm:
            flash('Tüm alanlar gereklidir', 'danger')
            return redirect(url_for('reset_password.new_password'))
        
        if password != password_confirm:
            flash('Şifreler eşleşmiyor', 'danger')
            return redirect(url_for('reset_password.new_password'))
        
        if len(password) < 8:
            flash('Şifre en az 8 karakter uzunluğunda olmalıdır', 'danger')
            return redirect(url_for('reset_password.new_password'))
        
        # Kullanıcıyı e-posta adresine göre bul
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('Geçersiz e-posta adresi', 'danger')
            return redirect(url_for('reset_password.password_reset_request'))
        
        # Şifreyi güncelle
        user.password_hash = generate_password_hash(password)
        
        # Sıfırlama token'larını temizle
        user.reset_token = None
        user.reset_token_expiry = None
        
        db.session.commit()
        
        # Session'daki geçici bilgileri temizle
        session.pop('reset_email', None)
        session.pop('reset_verified', None)
        
        flash('Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))
    
    return render_template('reset_password/new_password.html')

@reset_password.route('/sifre-sifirla/yeniden-gonder', methods=['POST'])
def resend_verification_code():
    """
    Doğrulama kodunu yeniden gönderir
    """
    email = session.get('reset_email')
    
    if not email:
        flash('Oturumunuz zaman aşımına uğradı. Lütfen tekrar başlayın.', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    # E-posta adresinin kayıtlı olup olmadığını kontrol et
    user = User.query.filter_by(email=email).first()
    
    if not user:
        flash('Bu e-posta adresi sistemde kayıtlı değil', 'danger')
        return redirect(url_for('reset_password.password_reset_request'))
    
    # 4 haneli doğrulama kodu oluştur
    verification_code = generate_verification_code()
    
    # Doğrulama kodunun geçerlilik süresini ayarla (5 dakika)
    expiry_time = datetime.utcnow() + timedelta(minutes=5)
    
    # Kullanıcının doğrulama kodunu ve süresini veritabanında güncelle
    user.reset_token = verification_code
    user.reset_token_expiry = expiry_time
    db.session.commit()
    
    # E-posta için HTML içeriği oluştur
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
                <p>Şifrenizi sıfırlamak için yeni bir doğrulama kodu talebinde bulundunuz. Şifre sıfırlama işlemine devam etmek için aşağıdaki doğrulama kodunu kullanın:</p>
                
                <div class="verification-code">{verification_code}</div>
                
                <p class="expiry-notice">Bu kod 5 dakika içinde geçerliliğini yitirecektir.</p>
                
                <div class="notice">
                    <strong>Önemli:</strong> Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve hesabınızın güvenliği için şifrenizi değiştirin.
                </div>
            </div>
            <div class="footer">
                <p>Bu e-posta, OmGame şifre sıfırlama talebiniz üzerine gönderilmiştir.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # E-postayı gönder
    subject = "OmGame - Yeni Şifre Sıfırlama Doğrulama Kodunuz"
    try:
        email_sent = send_email_in_background(
            to_email=email,
            subject=subject,
            html_body=html_body,
            verification_code=verification_code
        )
        
        if email_sent:
            flash('Yeni doğrulama kodu e-posta adresinize gönderildi', 'success')
            return redirect(url_for('reset_password.verify_reset_code'))
        else:
            # E-posta gönderme başarısız olsa bile, kodu göster (geliştirme ortamı için)
            logger.error(f"Yeniden e-posta gönderme başarısız: {email}")
            
            # E-posta gönderilemedi hatası göster
            flash('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
            return redirect(url_for('reset_password.verify_reset_code'))
    except Exception as e:
        logger.error(f"Yeniden e-posta gönderme hatası: {str(e)}")
        flash('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('reset_password.verify_reset_code'))