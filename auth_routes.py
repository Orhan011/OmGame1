#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import logging
import uuid
import re
import secrets
import threading

from models import db, User
from mail_service import send_verification_email

# Blueprint tanımlaması
auth = Blueprint('auth', __name__)

logger = logging.getLogger(__name__)

# Şifre sıfırlama fonksiyonları
def generate_verification_code():
    """4 haneli rastgele doğrulama kodu oluşturur"""
    return ''.join(random.choices('0123456789', k=4))

def generate_reset_token():
    """Güvenli sıfırlama token'ı oluşturur"""
    return secrets.token_urlsafe(32)

@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Şifremi unuttum sayfası"""
    if request.method == 'POST':
        email = request.form.get('email')
        if not email:
            flash('Lütfen e-posta adresinizi girin.', 'error')
            return redirect(url_for('auth.forgot_password'))
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Güvenlik sebebiyle var olmayan kullanıcılar için bile olumlu mesaj göster
            flash('Doğrulama kodu e-posta adresinize gönderildi.', 'info')
            return render_template('auth/verification_code.html', email=email)
        
        # 4 haneli doğrulama kodu oluştur
        verification_code = generate_verification_code()
        reset_token = generate_reset_token()
        
        # Veritabanında sıfırlama bilgilerini güncelle
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        
        # Oturum değişkenlerine bilgileri kaydet
        session['reset_email'] = email
        session['verification_code'] = verification_code
        session['reset_token'] = reset_token
        session['code_expiry'] = (datetime.utcnow() + timedelta(minutes=10)).timestamp()
        
        # E-posta şablonunu oluştur
        subject = "OmGame Şifre Sıfırlama Doğrulama Kodunuz"
        html_message = render_template('emails/password_reset.html', 
                                        code=verification_code, 
                                        username=user.username)
        
        # Arka planda e-posta gönder
        email_thread = threading.Thread(
            target=send_verification_email,
            args=(email, subject, html_message)
        )
        email_thread.start()
        
        flash('Doğrulama kodu e-posta adresinize gönderildi.', 'success')
        return redirect(url_for('auth.verify_code', email=email))
    
    return render_template('auth/forgot_password.html')

@auth.route('/verify-code', methods=['GET', 'POST'])
def verify_code():
    """Doğrulama kodu sayfası"""
    email = request.args.get('email', session.get('reset_email', ''))
    
    if not email or 'code_expiry' not in session or 'verification_code' not in session:
        flash('Şifre sıfırlama talebinizin süresi dolmuş. Lütfen tekrar deneyin.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    # Kodun geçerlilik süresini kontrol et
    now = datetime.utcnow().timestamp()
    if now > session.get('code_expiry', 0):
        flash('Doğrulama kodunun süresi dolmuş. Lütfen tekrar deneyin.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        entered_code = ''.join(request.form.get(f'code_{i}', '') for i in range(1, 5))
        correct_code = session.get('verification_code')
        
        if not entered_code:
            flash('Lütfen doğrulama kodunu girin.', 'error')
            return render_template('auth/verification_code.html', email=email)
        
        if entered_code != correct_code:
            flash('Doğrulama kodu hatalı. Lütfen tekrar deneyin.', 'error')
            return render_template('auth/verification_code.html', email=email)
        
        # Kod doğruysa reset token ile şifre sıfırlama sayfasına yönlendir
        reset_token = session.get('reset_token')
        return redirect(url_for('auth.reset_password', token=reset_token))
    
    # GET isteği için doğrulama kodu giriş formunu göster
    return render_template('auth/verification_code.html', email=email)

@auth.route('/resend-code', methods=['POST'])
def resend_code():
    """Doğrulama kodunu yeniden gönder"""
    email = request.form.get('email', session.get('reset_email', ''))
    
    if not email:
        return jsonify({'success': False, 'message': 'E-posta adresi bulunamadı.'})
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': True, 'message': 'Yeni doğrulama kodu gönderildi.'})
    
    # Yeni kod oluştur
    verification_code = generate_verification_code()
    
    # Veritabanında ve oturumda bilgileri güncelle
    user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()
    
    session['verification_code'] = verification_code
    session['code_expiry'] = (datetime.utcnow() + timedelta(minutes=10)).timestamp()
    
    # E-posta şablonunu oluştur
    subject = "OmGame Şifre Sıfırlama Doğrulama Kodunuz"
    html_message = render_template('emails/password_reset.html', 
                                   code=verification_code, 
                                   username=user.username)
    
    # Arka planda e-posta gönder
    email_thread = threading.Thread(
        target=send_verification_email,
        args=(email, subject, html_message)
    )
    email_thread.start()
    
    return jsonify({'success': True, 'message': 'Yeni doğrulama kodu gönderildi.'})

@auth.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Şifre sıfırlama sayfası"""
    # Token kontrolü
    if not token or token != session.get('reset_token'):
        flash('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    # E-posta adresi kontrolü
    email = session.get('reset_email')
    if not email:
        flash('Şifre sıfırlama oturumunuz sona ermiş.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    user = User.query.filter_by(email=email, reset_token=token).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        flash('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not password:
            flash('Lütfen yeni şifrenizi girin.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        if len(password) < 6:
            flash('Şifre en az 6 karakter olmalıdır.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        # Şifreyi güncelle
        user.password_hash = generate_password_hash(password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        # Oturum değişkenlerini temizle
        for key in ['reset_email', 'verification_code', 'reset_token', 'code_expiry']:
            if key in session:
                session.pop(key)
        
        flash('Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/reset_password.html', token=token)