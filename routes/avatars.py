from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify, session, g
from models import db, User, Avatar, UserAvatar, Achievement, UserAchievement
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
import json

avatars_bp = Blueprint('avatars', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız.', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@avatars_bp.route('/avatars')
@login_required
def avatar_list():
    """Kullanıcının erişebileceği tüm avatarları göster"""
    user = User.query.get(session['user_id'])
    
    # Kullanıcının kilitlediği avatarlar
    user_avatars = UserAvatar.query.filter_by(user_id=user.id).all()
    
    # Kullanıcının henüz kilitlemeği tüm avatarlar
    unlocked_avatar_ids = [ua.avatar_id for ua in user_avatars]
    locked_avatars = Avatar.query.filter(~Avatar.id.in_(unlocked_avatar_ids) if unlocked_avatar_ids else True).all()
    
    # Başarıma bağlı kilitli avatarlar için başarım adlarını da getir
    for avatar in locked_avatars:
        if avatar.required_achievement_id:
            achievement = Achievement.query.get(avatar.required_achievement_id)
            if achievement:
                avatar.achievement_name = achievement.name
    
    # Kullanıcı seviyesi
    user_level = calculate_level(user.experience_points)
    
    return render_template('avatars.html', 
                          user=user, 
                          user_avatars=user_avatars,
                          locked_avatars=locked_avatars,
                          current_level=user_level)

@avatars_bp.route('/select-avatar', methods=['POST'])
@login_required
def select_avatar():
    """Kullanıcı avatarını değiştir"""
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # AJAX isteği
        data = request.get_json()
        avatar_id = data.get('avatar_id')
    else:
        # Form gönderimi
        avatar_id = request.form.get('avatar_id')
    
    if not avatar_id:
        flash('Geçersiz avatar.', 'danger')
        return jsonify(success=False, message='Geçersiz avatar.') if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else redirect(url_for('avatars.avatar_list'))
    
    user = User.query.get(session['user_id'])
    
    # Kullanıcının bu avatarı var mı kontrol et
    user_avatar = UserAvatar.query.filter_by(user_id=user.id, avatar_id=avatar_id).first()
    
    if not user_avatar:
        flash('Bu avatara erişiminiz yok.', 'danger')
        return jsonify(success=False, message='Bu avatara erişiminiz yok.') if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else redirect(url_for('avatars.avatar_list'))
    
    # Mevcut seçili avatarı kaldır
    UserAvatar.query.filter_by(user_id=user.id, is_selected=True).update({'is_selected': False})
    
    # Yeni avatarı seç
    user_avatar.is_selected = True
    
    # Kullanıcının avatar_url'ini güncelle
    avatar = Avatar.query.get(avatar_id)
    if avatar:
        user.avatar_url = avatar.image_url
    
    db.session.commit()
    
    flash('Avatar başarıyla değiştirildi.', 'success')
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(success=True, message='Avatar başarıyla değiştirildi.')
    
    return redirect(url_for('avatars.avatar_list'))

def calculate_level(xp):
    """Kullanıcının seviyesini hesapla"""
    level = 1
    xp_needed = 100  # Level 1'den 2'ye geçmek için gereken XP
    
    while xp >= xp_needed:
        level += 1
        xp -= xp_needed
        xp_needed = int(xp_needed * 1.5)  # Her seviye için gereken XP %50 artar
    
    return level

def xp_for_level(level):
    """Belirli bir seviyeye ulaşmak için toplam gereken XP'yi hesapla"""
    if level <= 1:
        return 0
    
    total_xp = 0
    xp_needed = 100  # Level 1'den 2'ye geçmek için gereken XP
    
    for i in range(1, level):
        total_xp += xp_needed
        xp_needed = int(xp_needed * 1.5)
    
    return total_xp

def unlock_avatar_by_achievement(user_id, achievement_id):
    """Başarım kilidi açıldığında ilgili avatarı da aç"""
    # Başarımla ilişkili avatarı bul
    avatar = Avatar.query.filter_by(required_achievement_id=achievement_id).first()
    
    if not avatar:
        return False
    
    # Kullanıcının zaten bu avatara sahip olup olmadığını kontrol et
    existing = UserAvatar.query.filter_by(user_id=user_id, avatar_id=avatar.id).first()
    
    if existing:
        return False
    
    # Yeni avatar kilidi aç
    user_avatar = UserAvatar(
        user_id=user_id,
        avatar_id=avatar.id,
        unlocked_at=datetime.utcnow(),
        is_selected=False
    )
    
    db.session.add(user_avatar)
    db.session.commit()
    
    return True

def unlock_avatar_by_level(user_id, level):
    """Kullanıcı seviye atladığında seviyeye bağlı avatarların kilidini aç"""
    # Seviyeye bağlı avatarları bul
    avatars = Avatar.query.filter(Avatar.required_level <= level, Avatar.required_level > 0).all()
    
    if not avatars:
        return False
    
    unlocked_count = 0
    
    for avatar in avatars:
        # Kullanıcının zaten bu avatara sahip olup olmadığını kontrol et
        existing = UserAvatar.query.filter_by(user_id=user_id, avatar_id=avatar.id).first()
        
        if not existing:
            # Yeni avatar kilidi aç
            user_avatar = UserAvatar(
                user_id=user_id,
                avatar_id=avatar.id,
                unlocked_at=datetime.utcnow(),
                is_selected=False
            )
            
            db.session.add(user_avatar)
            unlocked_count += 1
    
    if unlocked_count > 0:
        db.session.commit()
        return True
    
    return False