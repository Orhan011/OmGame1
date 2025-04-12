#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import threading
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Logger yapılandırması
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
        password = "nevq zfmo lzvg nxkl"  # Yeni app şifresi (uygulama şifresi)
        
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
            logger.error(f"E-posta gönderimi başarısız")
            return False
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        return False

def send_welcome_email(to_email, username):
    """
    Kayıt olan kullanıcıya modern ve hoş bir karşılama e-postası gönderir.
    
    Args:
        to_email: Kullanıcının e-posta adresi
        username: Kullanıcının adı
        
    Returns:
        bool: E-posta gönderme işleminin başarılı olup olmadığı
    """
    subject = "OmGame Dünyasına Hoş Geldiniz! 🎮"
    
    # Modern HTML e-posta tasarımı
    html_body = f"""
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OmGame'e Hoş Geldiniz</title>
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
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                padding: 30px 0;
                text-align: center;
            }}
            
            .header img {{
                width: 140px;
                height: auto;
            }}
            
            .content {{
                padding: 30px 40px;
            }}
            
            h1 {{
                color: #224abe;
                margin-top: 0;
                font-size: 24px;
                font-weight: 600;
            }}
            
            p {{
                margin-bottom: 20px;
                color: #555;
                font-size: 16px;
            }}
            
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 500;
                margin: 15px 0;
                text-align: center;
                transition: transform 0.3s ease;
            }}
            
            .button:hover {{
                transform: translateY(-2px);
            }}
            
            .features {{
                display: flex;
                flex-wrap: wrap;
                margin: 25px 0;
                justify-content: space-between;
            }}
            
            .feature {{
                flex-basis: 48%;
                background-color: #f8f9fc;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                border-left: 3px solid #4e73df;
            }}
            
            .feature h3 {{
                margin-top: 0;
                color: #224abe;
                font-size: 16px;
                font-weight: 600;
            }}
            
            .feature p {{
                margin-bottom: 0;
                font-size: 14px;
            }}
            
            .footer {{
                background-color: #f8f9fc;
                padding: 20px 40px;
                text-align: center;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eaeaea;
            }}
            
            .social-links {{
                margin-top: 15px;
            }}
            
            .social-links a {{
                display: inline-block;
                margin: 0 8px;
                color: #666;
                font-size: 18px;
                text-decoration: none;
            }}
            
            @media (max-width: 480px) {{
                .container {{
                    margin: 10px;
                    width: auto;
                }}
                
                .content {{
                    padding: 20px;
                }}
                
                .feature {{
                    flex-basis: 100%;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://omgame.repl.co/static/images/logo.png" alt="OmGame Logo">
            </div>
            
            <div class="content">
                <h1>Merhaba {username}!</h1>
                <p>OmGame dünyasına hoş geldiniz! Artık aramıza katıldığınız için çok mutluyuz. OmGame'de zihinsel becerilerinizi geliştirebileceğiniz onlarca oyun, bilişsel yeteneklerinizi test eden zorlu görevler ve daha pek çok keyifli aktivite sizi bekliyor.</p>
                
                <a href="https://omgame.repl.co" class="button">Hemen Oynamaya Başla</a>
                
                <p>İşte OmGame'de seni bekleyen bazı özellikler:</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>Beyin Egzersizleri</h3>
                        <p>Beyin jimnastiği yaparak zihinsel becerilerinizi güçlendirin.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Hafıza Oyunları</h3>
                        <p>Hafıza oyunlarıyla odaklanma ve hatırlama yeteneklerinizi geliştirin.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Liderlik Tablosu</h3>
                        <p>Diğer oyuncularla rekabet edin ve en yüksek skorları görün.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Rozet Sistemi</h3>
                        <p>Başarılarınızı gösteren rozetler kazanın ve koleksiyonunuzu büyütün.</p>
                    </div>
                </div>
                
                <p>Herhangi bir sorunuz veya geri bildiriminiz için bize <a href="mailto:omgameee@gmail.com">omgameee@gmail.com</a> adresinden ulaşabilirsiniz.</p>
                
                <p>İyi oyunlar!</p>
                <p><em>OmGame Ekibi</em></p>
            </div>
            
            <div class="footer">
                <p>© 2024 OmGame. Tüm hakları saklıdır.</p>
                <p>Bu e-posta size kayıt olduğunuz için gönderilmiştir.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # E-postayı gönder
    logger.info(f"'{username}' kullanıcısına hoş geldin e-postası gönderiliyor: {to_email}")
    return send_email_in_background(to_email, subject, html_body)