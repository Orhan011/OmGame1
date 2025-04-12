#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import logging
import secrets
import string
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from models import db, User

# Blueprint tanımlaması
password_reset = Blueprint('password_reset', __name__)

logger = logging.getLogger(__name__)

def send_email_in_background(to_email, subject, html_body, from_name="OmGame", verification_code=None):
    """
    E-posta gönderme işlemini gerçekleştirir.
    Doğrudan SMTP kullanarak e-posta gönderimi.
    
    Args:
        to_email (str): Gönderilecek e-posta adresi
        subject (str): E-posta konusu
        html_body (str): E-posta içeriği (HTML)
        from_name (str, optional): Gönderen adı. Varsayılan: "OmGame"
        verification_code (str, optional): Doğrulama kodu. Belirtilmezse içerikten otomatik çıkarılmaya çalışılır.
    """
    # İşlem başlangıcını logla
    logger.info(f"E-posta gönderme işlemi başlatıldı: {to_email}, Konu: {subject}")
    
    # Doğrulama kodu verilmediyse ve bu bir şifre sıfırlama e-postası ise, HTML içeriğinden kodu çıkar
    if not verification_code and ("Doğrulama Kodu" in subject or "Şifre Sıfırlama" in subject):
        try:
            import re
            # Verification code'u çıkart (hem h3 etiketindeki hem de verification-code class'ındaki)
            code_match = re.search(r'verification-code">(\d+)<|<h3[^>]*>(\d+)</h3>', html_body)
            if code_match:
                # İki gruptan hangisinde eşleşme varsa onu al
                verification_code = code_match.group(1) if code_match.group(1) else code_match.group(2)
                # Sadece logla, konsola yazdırma
                logger.info(f"Doğrulama Kodu (sadece loglarda): {verification_code} - E-posta: {to_email}")
        except Exception as e:
            logger.error(f"Doğrulama kodu çıkarılırken hata: {str(e)}")
    
    # SMTP ile e-posta gönderimi
    try:
        # Gmail SMTP ayarları - doğrudan SMTP kullan
        from_email = "omgameee@gmail.com"
        password = "nevq zfmo lzvg nxkl"  # Uygulama şifresi
        
        # E-posta mesajını oluştur
        smtp_msg = MIMEMultipart()
        smtp_msg['From'] = f"{from_name} <{from_email}>"
        smtp_msg['To'] = to_email
        smtp_msg['Subject'] = subject
        smtp_msg.attach(MIMEText(html_body, 'html'))
        
        # SMTP sunucusuna bağlan ve e-postayı gönder
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
        server.login(from_email, password)
        text = smtp_msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        
        logger.info(f"E-posta başarıyla gönderildi: {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"E-posta gönderme işlemi sırasında hata: {str(e)}")
        
        # Gmail uygulama şifresiyle ilgili bir hata olabilir
        if "Application-specific password required" in str(e) or "Invalid credentials" in str(e):
            logger.critical("Gmail uygulama şifresi geçersiz veya süresi dolmuş olabilir!")
            logger.error("ÖNEMLİ HATA: Gmail uygulama şifresi geçersiz veya süresi dolmuş olabilir!")
            
        return False

def send_verification_email(to_email, subject, html_message):
    """
    Kullanıcıya bilgilendirme e-postası gönderir.
    
    Args:
        to_email (str): Kullanıcının e-posta adresi
        subject (str): E-posta konusu
        html_message (str): HTML formatında e-posta içeriği
    
    Returns:
        bool: E-posta gönderme işleminin başarılı olup olmadığı
    """
    try:
        # E-posta gönderme işlemi
        result = send_email_in_background(to_email, subject, html_message)
        if result:
            logger.info(f"E-posta başarıyla gönderildi: {to_email}")
            return True
        else:
            logger.error("E-posta gönderimi başarısız")
            return False
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        return False

def generate_token(length=64):
    """
    Güvenli bir şifre sıfırlama token'ı oluşturur
    
    Args:
        length (int): Token uzunluğu (varsayılan: 64)
        
    Returns:
        str: Oluşturulan token
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_verification_code(length=6):
    """
    Sayısal doğrulama kodu oluşturur
    
    Args:
        length (int): Doğrulama kodu uzunluğu (varsayılan: 6)
        
    Returns:
        str: Doğrulama kodu
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))

@password_reset.route('/sifre-sifirlama-talep', methods=['GET', 'POST'])
def request_reset():
    """Şifre sıfırlama talebi sayfası ve işlemi"""
    if request.method == 'POST':
        email = request.form.get('email')
        
        if not email:
            flash('Lütfen email adresinizi giriniz.', 'danger')
            return redirect(url_for('password_reset.request_reset'))
        
        # Kullanıcıyı e-posta adresine göre bul
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Güvenlik nedeniyle kullanıcı bulunamasa bile aynı mesajı göster
            flash('Şifre sıfırlama talimatları email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')
            return redirect(url_for('password_reset.request_reset'))
        
        # Şifre sıfırlama token'ı oluştur
        token = generate_token()
        verification_code = generate_verification_code()
        
        # Token ve son kullanma tarihini veritabanına kaydet
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)  # 1 saat geçerli
        db.session.commit()
        
        # Şifre sıfırlama e-postası içeriği
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #4a6fa5; margin-bottom: 5px;">OmGame Şifre Sıfırlama</h2>
                <p style="color: #666; font-size: 14px;">Hesabınızı korumak için güvenlik önlemleri alıyoruz</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p>Merhaba <strong>{user.username}</strong>,</p>
                <p>OmGame hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanın:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #4a6fa5; background-color: #f5f7fa; padding: 15px; border-radius: 8px; display: inline-block;" class="verification-code">{verification_code}</div>
                </div>
                
                <p>Ya da aşağıdaki butona tıklayarak direkt olarak şifre sıfırlama sayfasına gidebilirsiniz:</p>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{request.host_url.rstrip('/')}{url_for('password_reset.verify_token', token=token)}" style="background-color: #4a6fa5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
                </div>
                
                <p style="color: #666; font-size: 13px;">Bu link ve doğrulama kodu 1 saat boyunca geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #666;">
                <p>Bu otomatik bir e-postadır, lütfen yanıtlamayın.</p>
                <p>&copy; {datetime.now().year} OmGame. Tüm hakları saklıdır.</p>
            </div>
        </div>
        """
        
        # E-posta gönder
        email_result = send_verification_email(
            to_email=user.email,
            subject="OmGame - Şifre Sıfırlama Talebi",
            html_message=html_message
        )
        
        if email_result:
            flash('Şifre sıfırlama talimatları email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')
        else:
            flash('E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
            
        return redirect(url_for('password_reset.request_reset'))
    
    return render_template('password_reset/request.html')

@password_reset.route('/sifre-sifirlama-dogrulama/<token>', methods=['GET', 'POST'])
def verify_token(token):
    """Token doğrulama ve şifre sıfırlama sayfası"""
    # Token doğrulama
    user = User.query.filter_by(reset_token=token).first()
    
    # Token geçersizse veya süresi dolduysa
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        flash('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebinde bulunun.', 'danger')
        return redirect(url_for('password_reset.request_reset'))
    
    if request.method == 'POST':
        code = request.form.get('verification_code')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        # Manuel kod girişi için doğrulama kodu kontrolü - kullanılmayacaksa kaldırılabilir
        # Bu örnekte kodu e-postadan alıp manuel girmek için kullanıyoruz
        # Gerçek bir uygulamada db'de saklanan kod ile karşılaştırılabilir
        
        if not new_password:
            flash('Lütfen yeni şifrenizi girin.', 'danger')
            return redirect(url_for('password_reset.verify_token', token=token))
            
        if new_password != confirm_password:
            flash('Şifreler eşleşmiyor. Lütfen tekrar deneyin.', 'danger')
            return redirect(url_for('password_reset.verify_token', token=token))
            
        if len(new_password) < 8:
            flash('Şifre en az 8 karakter uzunluğunda olmalıdır.', 'danger')
            return redirect(url_for('password_reset.verify_token', token=token))
        
        # Şifreyi güncelle
        user.password_hash = generate_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        flash('Şifreniz başarıyla güncellenmiştir. Yeni şifrenizle giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))
    
    return render_template('password_reset/reset.html', token=token)

@password_reset.route('/sifre-sifirlama-dogrulama-kod', methods=['POST'])
def verify_code():
    """Doğrulama kodu ile şifre sıfırlama"""
    email = request.form.get('email')
    code = request.form.get('verification_code')
    
    if not email or not code:
        flash('Lütfen email adresinizi ve doğrulama kodunu giriniz.', 'danger')
        return redirect(url_for('password_reset.request_reset'))
    
    # Kullanıcıyı bul
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.reset_token or not user.reset_token_expiry:
        flash('Geçersiz doğrulama kodu veya email adresi. Lütfen yeni bir şifre sıfırlama talebinde bulunun.', 'danger')
        return redirect(url_for('password_reset.request_reset'))
    
    if user.reset_token_expiry < datetime.utcnow():
        flash('Doğrulama kodunun süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebinde bulunun.', 'danger')
        return redirect(url_for('password_reset.request_reset'))
    
    # Kullanıcı doğrulandı, şifre sıfırlama sayfasına yönlendir
    return redirect(url_for('password_reset.verify_token', token=user.reset_token))

@password_reset.route('/sifre-sifirlama-tamamlandi', methods=['GET'])
def reset_complete():
    """Şifre sıfırlama tamamlandı sayfası"""
    return render_template('password_reset/complete.html')