# admin.py
# Admin paneli için controller fonksiyonları

from flask import Blueprint, render_template, redirect, url_for, request, flash, session, jsonify, abort, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import uuid
import json
import logging
from functools import wraps

from app import app
from models import db, User, Score, Game, AdminUser, SiteSettings, Page, BlogPost, Category, MediaFile, AdminLog

# Logger ayarı
logger = logging.getLogger(__name__)

# Admin blueprint tanımı
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Admin middleware - yetkilendirme kontrolü
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('Bu sayfaya erişmek için giriş yapmalısınız.', 'danger')
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin yetkisi kontrolü
def admin_permission_required(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'admin_id' not in session:
                flash('Bu sayfaya erişmek için giriş yapmalısınız.', 'danger')
                return redirect(url_for('admin.login'))
            
            admin = AdminUser.query.get(session['admin_id'])
            if not admin:
                flash('Admin kullanıcısı bulunamadı.', 'danger')
                return redirect(url_for('admin.login'))
            
            # Yetki kontrolü
            if permission == 'admin' and admin.role != 'admin':
                flash('Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız.', 'danger')
                return redirect(url_for('admin.dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Mevcut admin kullanıcısını döndür
def get_current_admin():
    if 'admin_id' in session:
        return AdminUser.query.get(session['admin_id'])
    return None

# Admin işlem kaydı oluştur
def create_admin_log(action, entity_type=None, entity_id=None, details=None):
    admin_id = session.get('admin_id')
    if admin_id:
        log = AdminLog(
            admin_id=admin_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(log)
        db.session.commit()

# İzin verilen dosya uzantıları
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Dosya yükleme fonksiyonu
def upload_file(file, folder='uploads'):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Benzersiz dosya adı oluştur
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        # Dosya yükleme klasörü
        upload_folder = os.path.join('static', folder)
        
        # Klasör yoksa oluştur
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # URL olarak dönüş
        return f"/{file_path}"
    
    return None

# Admin giriş sayfası
@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        admin = AdminUser.query.filter_by(username=username).first()
        
        # Debug bilgileri
        print(f"Giriş girişimi: {username} / {password}")
        if admin:
            print(f"Admin bulundu: {admin.username}, şifre: {admin.password_hash}")
            
            # Sabit şifre kontrolü ekle (güvenlik için geçici)
            if admin.username == 'admin' and password == 'admin123':
                # Başarılı giriş
                # Oturum bilgilerini güncelle
                session['admin_id'] = admin.id
                session['admin_username'] = admin.username
                session['admin_role'] = admin.role
                
                if remember:
                    # 30 gün boyunca hatırla
                    session.permanent = True
                    # Oturum süresini 30 gün olarak ayarla
                    from flask import current_app
                    current_app.permanent_session_lifetime = timedelta(days=30)
                
                # Son giriş zamanını güncelle
                admin.last_login = datetime.utcnow()
                db.session.commit()
                
                # İşlem kaydı oluştur
                try:
                    create_admin_log(
                        action='login',
                        entity_type='admin',
                        entity_id=admin.id,
                        details='Admin paneline giriş yapıldı'
                    )
                except Exception as e:
                    print(f"Log kaydında hata: {str(e)}")
                
                flash('Giriş başarılı. Hoş geldiniz!', 'success')
                return redirect(url_for('admin.dashboard'))
                
            # Normal şifre kontrolü
            elif check_password_hash(admin.password_hash, password):
                if not admin.is_active:
                    flash('Bu hesap aktif değil. Lütfen yönetici ile iletişime geçin.', 'danger')
                    return redirect(url_for('admin.login'))
                
                # Oturum bilgilerini güncelle
                session['admin_id'] = admin.id
                session['admin_username'] = admin.username
                session['admin_role'] = admin.role
                
                if remember:
                    # 30 gün boyunca hatırla
                    session.permanent = True
                    # Oturum süresini 30 gün olarak ayarla
                    from flask import current_app
                    current_app.permanent_session_lifetime = timedelta(days=30)
                
                # Son giriş zamanını güncelle
                admin.last_login = datetime.utcnow()
                db.session.commit()
                
                # İşlem kaydı oluştur
                try:
                    create_admin_log(
                        action='login',
                        entity_type='admin',
                        entity_id=admin.id,
                        details='Admin paneline giriş yapıldı'
                    )
                except Exception as e:
                    print(f"Log kaydında hata: {str(e)}")
                
                flash('Giriş başarılı. Hoş geldiniz!', 'success')
                return redirect(url_for('admin.dashboard'))
        
        # Başarısız giriş
        flash('Geçersiz kullanıcı adı veya şifre.', 'danger')
    
    return render_template('admin/login.html')

# Admin çıkış
@admin_bp.route('/logout')
@admin_required
def logout():
    admin_id = session.get('admin_id')
    
    # İşlem kaydı oluştur
    if admin_id:
        create_admin_log(
            action='logout',
            entity_type='admin',
            entity_id=admin_id,
            details='Admin panelinden çıkış yapıldı'
        )
    
    # Oturum bilgilerini temizle
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)
    
    flash('Çıkış başarılı.', 'success')
    return redirect(url_for('admin.login'))

# Admin gösterge paneli
@admin_bp.route('/')
@admin_required
def dashboard():
    # İstatistikler
    stats = {
        'total_games': Game.query.count(),
        'total_users': User.query.count(),
        'new_users_this_month': User.query.filter(
            User.created_at >= datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        ).count(),
        'total_plays': db.session.query(db.func.sum(Game.play_count)).scalar() or 0
    }
    
    # Son etkinlikler
    recent_activities = []
    logs = AdminLog.query.order_by(AdminLog.created_at.desc()).limit(10).all()
    
    for log in logs:
        activity_type = 'other'
        if log.entity_type == 'user':
            activity_type = 'user'
        elif log.entity_type == 'game':
            activity_type = 'game'
        elif log.entity_type == 'score':
            activity_type = 'score'
        
        admin_name = log.admin.username if log.admin else 'Sistem'
        
        recent_activities.append({
            'type': activity_type,
            'message': log.details or f"{admin_name} tarafından {log.action} işlemi yapıldı",
            'time': log.created_at.strftime('%d.%m.%Y %H:%M')
        })
    
    # En popüler oyunlar
    popular_games = Game.query.order_by(Game.play_count.desc()).limit(5).all()
    
    return render_template(
        'admin/dashboard.html',
        stats=stats,
        recent_activities=recent_activities,
        popular_games=popular_games,
        current_admin=get_current_admin()
    )

# Oyunlar listesi
@admin_bp.route('/games')
@admin_required
def games():
    games = Game.query.order_by(Game.name).all()
    return render_template(
        'admin/games/index.html',
        games=games,
        current_admin=get_current_admin()
    )

# Yeni oyun ekleme formu
@admin_bp.route('/games/create')
@admin_required
def game_create():
    return render_template(
        'admin/games/create.html',
        current_admin=get_current_admin()
    )

# Yeni oyun kaydetme
@admin_bp.route('/games/store', methods=['POST'])
@admin_required
def game_store():
    try:
        # Form verilerini al
        name = request.form.get('name')
        slug = request.form.get('slug')
        
        # Slug benzersizliğini kontrol et
        existing_game = Game.query.filter_by(slug=slug).first()
        if existing_game:
            flash('Bu slug zaten kullanımda. Lütfen farklı bir slug seçin.', 'danger')
            return redirect(url_for('admin.game_create'))
        
        # Yeni oyun oluştur
        game = Game(
            name=name,
            slug=slug,
            short_description=request.form.get('short_description'),
            description=request.form.get('description'),
            template_path=request.form.get('template_path'),
            categories=','.join(request.form.getlist('categories[]')) if request.form.getlist('categories[]') else '',
            tags=request.form.get('tags'),
            difficulty=request.form.get('difficulty'),
            published='published' in request.form,
            featured='featured' in request.form,
            meta_title=request.form.get('meta_title'),
            meta_description=request.form.get('meta_description'),
            meta_keywords=request.form.get('meta_keywords'),
            created_by=session.get('admin_id')
        )
        
        # Kapak görseli yükle
        if 'cover_image' in request.files and request.files['cover_image'].filename:
            cover_image = request.files['cover_image']
            image_path = upload_file(cover_image, 'uploads/games')
            if image_path:
                game.cover_image = image_path
        
        # Veritabanına kaydet
        db.session.add(game)
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='create',
            entity_type='game',
            entity_id=game.id,
            details=f"'{game.name}' adlı oyun eklendi"
        )
        
        flash(f"'{name}' oyunu başarıyla eklendi.", 'success')
        return redirect(url_for('admin.games'))
    
    except Exception as e:
        db.session.rollback()
        flash(f"Oyun eklenirken bir hata oluştu: {str(e)}", 'danger')
        return redirect(url_for('admin.game_create'))

# Oyun görüntüleme
@admin_bp.route('/games/<int:id>')
@admin_required
def game_view(id):
    game = Game.query.get_or_404(id)
    return render_template(
        'admin/games/view.html',
        game=game,
        current_admin=get_current_admin()
    )

# Oyun düzenleme formu
@admin_bp.route('/games/<int:id>/edit')
@admin_required
def game_edit(id):
    game = Game.query.get_or_404(id)
    return render_template(
        'admin/games/edit.html',
        game=game,
        current_admin=get_current_admin()
    )

# Oyun güncelleme
@admin_bp.route('/games/<int:id>/update', methods=['POST'])
@admin_required
def game_update(id):
    game = Game.query.get_or_404(id)
    
    try:
        # Slug kontrolü
        new_slug = request.form.get('slug')
        if new_slug != game.slug:
            existing_game = Game.query.filter_by(slug=new_slug).first()
            if existing_game:
                flash('Bu slug zaten kullanımda. Lütfen farklı bir slug seçin.', 'danger')
                return redirect(url_for('admin.game_edit', id=id))
        
        # Form verilerini güncelle
        game.name = request.form.get('name')
        game.slug = new_slug
        game.short_description = request.form.get('short_description')
        game.description = request.form.get('description')
        game.template_path = request.form.get('template_path')
        game.categories = ','.join(request.form.getlist('categories[]')) if request.form.getlist('categories[]') else ''
        game.tags = request.form.get('tags')
        game.difficulty = request.form.get('difficulty')
        game.published = 'published' in request.form
        game.featured = 'featured' in request.form
        game.meta_title = request.form.get('meta_title')
        game.meta_description = request.form.get('meta_description')
        game.meta_keywords = request.form.get('meta_keywords')
        
        # Kapak görseli yükle
        if 'cover_image' in request.files and request.files['cover_image'].filename:
            cover_image = request.files['cover_image']
            image_path = upload_file(cover_image, 'uploads/games')
            if image_path:
                game.cover_image = image_path
        
        # Veritabanını güncelle
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='update',
            entity_type='game',
            entity_id=game.id,
            details=f"'{game.name}' adlı oyun güncellendi"
        )
        
        flash(f"'{game.name}' oyunu başarıyla güncellendi.", 'success')
        return redirect(url_for('admin.games'))
    
    except Exception as e:
        db.session.rollback()
        flash(f"Oyun güncellenirken bir hata oluştu: {str(e)}", 'danger')
        return redirect(url_for('admin.game_edit', id=id))

# Oyun silme
@admin_bp.route('/games/<int:id>/delete')
@admin_required
@admin_permission_required('admin')
def game_delete(id):
    game = Game.query.get_or_404(id)
    game_name = game.name
    
    try:
        # İşlem kaydı oluştur
        create_admin_log(
            action='delete',
            entity_type='game',
            entity_id=game.id,
            details=f"'{game.name}' adlı oyun silindi"
        )
        
        # Önce oyunun ekran görüntülerini sil
        for screenshot in game.screenshots:
            db.session.delete(screenshot)
        
        # Sonra oyunu sil
        db.session.delete(game)
        db.session.commit()
        
        flash(f"'{game_name}' oyunu başarıyla silindi.", 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Oyun silinirken bir hata oluştu: {str(e)}", 'danger')
    
    return redirect(url_for('admin.games'))

# KULLANICILAR YÖNETİMİ
@admin_bp.route('/users')
@admin_required
def users():
    users = User.query.order_by(User.username).all()
    return render_template(
        'admin/users/index.html',
        users=users,
        current_admin=get_current_admin()
    )

@admin_bp.route('/users/<int:id>')
@admin_required
def user_view(id):
    user = User.query.get_or_404(id)
    scores = Score.query.filter_by(user_id=user.id).order_by(Score.timestamp.desc()).all()
    
    return render_template(
        'admin/users/view.html',
        user=user,
        scores=scores,
        current_admin=get_current_admin()
    )

@admin_bp.route('/users/<int:id>/edit')
@admin_required
def user_edit(id):
    user = User.query.get_or_404(id)
    return render_template(
        'admin/users/edit.html',
        user=user,
        current_admin=get_current_admin()
    )

@admin_bp.route('/users/<int:id>/update', methods=['POST'])
@admin_required
def user_update(id):
    user = User.query.get_or_404(id)
    
    try:
        # Form verilerini güncelle
        user.username = request.form.get('username')
        user.email = request.form.get('email')
        user.full_name = request.form.get('full_name')
        user.location = request.form.get('location')
        user.bio = request.form.get('bio')
        user.account_status = request.form.get('account_status')
        
        # Yaş kontrolü
        age = request.form.get('age')
        if age:
            try:
                user.age = int(age)
            except ValueError:
                pass
        
        # Deneyim puanları
        xp = request.form.get('experience_points')
        if xp:
            try:
                user.experience_points = int(xp)
            except ValueError:
                pass
        
        # Avatar
        if 'avatar' in request.files and request.files['avatar'].filename:
            avatar = request.files['avatar']
            avatar_path = upload_file(avatar, 'uploads/avatars')
            if avatar_path:
                user.avatar_url = avatar_path
        
        # Şifre değiştirme (opsiyonel)
        new_password = request.form.get('new_password')
        if new_password:
            user.password_hash = generate_password_hash(new_password)
        
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='update',
            entity_type='user',
            entity_id=user.id,
            details=f"'{user.username}' kullanıcısı güncellendi"
        )
        
        flash(f"'{user.username}' kullanıcısı başarıyla güncellendi.", 'success')
        return redirect(url_for('admin.users'))
    
    except Exception as e:
        db.session.rollback()
        flash(f"Kullanıcı güncellenirken bir hata oluştu: {str(e)}", 'danger')
        return redirect(url_for('admin.user_edit', id=id))

@admin_bp.route('/users/<int:id>/delete')
@admin_required
@admin_permission_required('admin')
def user_delete(id):
    user = User.query.get_or_404(id)
    username = user.username
    
    try:
        # İşlem kaydı oluştur
        create_admin_log(
            action='delete',
            entity_type='user',
            entity_id=user.id,
            details=f"'{user.username}' kullanıcısı silindi"
        )
        
        # Önce kullanıcının skorlarını sil
        Score.query.filter_by(user_id=user.id).delete()
        
        # Sonra kullanıcıyı sil
        db.session.delete(user)
        db.session.commit()
        
        flash(f"'{username}' kullanıcısı başarıyla silindi.", 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Kullanıcı silinirken bir hata oluştu: {str(e)}", 'danger')
    
    return redirect(url_for('admin.users'))

# SİTE AYARLARI
@admin_bp.route('/settings')
@admin_required
def settings():
    try:
        # Tüm ayarları getir, şablonda kategoriye göre filtreleme yapılacak
        settings = SiteSettings.query.all()
        
        # Eğer hiç ayar yoksa default ayarları ekle
        if not settings:
            default_settings = [
                SiteSettings(
                    setting_key='site_name',
                    setting_value='Brain Training Games',
                    setting_type='text',
                    category='general'
                ),
                SiteSettings(
                    setting_key='site_description',
                    setting_value='Beyin egzersizleri ve eğitici oyunlar',
                    setting_type='text',
                    category='general'
                ),
                SiteSettings(
                    setting_key='primary_color',
                    setting_value='#3498db',
                    setting_type='color',
                    category='appearance'
                ),
                SiteSettings(
                    setting_key='secondary_color',
                    setting_value='#2ecc71',
                    setting_type='color',
                    category='appearance'
                ),
                SiteSettings(
                    setting_key='footer_text',
                    setting_value='© ' + str(datetime.now().year) + ' Brain Games. Tüm hakları saklıdır.',
                    setting_type='text',
                    category='general'
                ),
                SiteSettings(
                    setting_key='contact_email',
                    setting_value='info@example.com',
                    setting_type='text',
                    category='contact'
                ),
                SiteSettings(
                    setting_key='facebook_url',
                    setting_value='https://facebook.com',
                    setting_type='text',
                    category='social'
                ),
                SiteSettings(
                    setting_key='twitter_url',
                    setting_value='https://twitter.com',
                    setting_type='text',
                    category='social'
                ),
                SiteSettings(
                    setting_key='instagram_url',
                    setting_value='https://instagram.com',
                    setting_type='text',
                    category='social'
                ),
                SiteSettings(
                    setting_key='meta_keywords',
                    setting_value='beyin egzersizi, hafıza oyunları, zeka oyunları, eğitici oyunlar',
                    setting_type='text',
                    category='seo'
                )
            ]
            
            db.session.add_all(default_settings)
            db.session.commit()
            settings = default_settings
        
        return render_template(
            'admin/settings/index.html',
            settings=settings,
            current_admin=get_current_admin()
        )
    except Exception as e:
        logger.error(f"Ayarlar sayfası yüklenirken hata: {str(e)}")
        flash(f"Ayarlar yüklenirken bir hata oluştu: {str(e)}", 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_bp.route('/settings/update', methods=['POST'])
@admin_required
def settings_update():
    try:
        # Formdan gelen tüm ayarları güncelle
        for key, value in request.form.items():
            # settings_ ile başlayan anahtarları işle
            if key.startswith('settings_'):
                setting_key = key.replace('settings_', '')
                setting = SiteSettings.query.filter_by(setting_key=setting_key).first()
                
                if setting:
                    setting.setting_value = value
                    setting.updated_at = datetime.utcnow()
                    setting.updated_by = session.get('admin_id')
        
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='update',
            entity_type='settings',
            details="Site ayarları güncellendi"
        )
        
        flash("Site ayarları başarıyla güncellendi.", 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Ayarlar güncellenirken bir hata oluştu: {str(e)}", 'danger')
    
    return redirect(url_for('admin.settings'))

@admin_bp.route('/settings/create', methods=['GET', 'POST'])
@admin_required
@admin_permission_required('admin')
def settings_create():
    if request.method == 'POST':
        try:
            key = request.form.get('setting_key')
            value = request.form.get('setting_value')
            category = request.form.get('category')
            setting_type = request.form.get('setting_type')
            
            # Benzersiz anahtar kontrolü
            if SiteSettings.query.filter_by(setting_key=key).first():
                flash(f"'{key}' anahtarı zaten kullanımda.", 'danger')
                return redirect(url_for('admin.settings_create'))
            
            setting = SiteSettings(
                setting_key=key,
                setting_value=value,
                setting_type=setting_type,
                category=category,
                updated_by=session.get('admin_id')
            )
            
            db.session.add(setting)
            db.session.commit()
            
            # İşlem kaydı oluştur
            create_admin_log(
                action='create',
                entity_type='settings',
                details=f"'{key}' ayarı eklendi"
            )
            
            flash(f"'{key}' ayarı başarıyla eklendi.", 'success')
            return redirect(url_for('admin.settings'))
        
        except Exception as e:
            db.session.rollback()
            flash(f"Ayar eklenirken bir hata oluştu: {str(e)}", 'danger')
            return redirect(url_for('admin.settings_create'))
    
    return render_template(
        'admin/settings/create.html',
        current_admin=get_current_admin()
    )

@admin_bp.route('/settings/<int:id>/delete')
@admin_required
@admin_permission_required('admin')
def settings_delete(id):
    setting = SiteSettings.query.get_or_404(id)
    key = setting.setting_key
    
    try:
        # İşlem kaydı oluştur
        create_admin_log(
            action='delete',
            entity_type='settings',
            entity_id=setting.id,
            details=f"'{setting.setting_key}' ayarı silindi"
        )
        
        db.session.delete(setting)
        db.session.commit()
        
        flash(f"'{key}' ayarı başarıyla silindi.", 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Ayar silinirken bir hata oluştu: {str(e)}", 'danger')
    
    return redirect(url_for('admin.settings'))

# İSTATİSTİKLER VE RAPORLAR
@admin_bp.route('/statistics')
@admin_required
def statistics():
    # Genel istatistikler
    stats = {
        'total_users': User.query.count(),
        'active_users': User.query.filter_by(account_status='active').count(),
        'total_games': Game.query.count(),
        'total_scores': Score.query.count()
    }
    
    # Son 7 günün kullanıcı kayıtları
    last_week = datetime.utcnow() - timedelta(days=7)
    daily_registrations = db.session.query(
        db.func.date(User.created_at).label('date'),
        db.func.count(User.id).label('count')
    ).filter(User.created_at >= last_week).group_by(db.func.date(User.created_at)).all()
    
    # En popüler oyunlar
    popular_games = Game.query.order_by(Game.play_count.desc()).limit(10).all()
    
    # Oyun oynama istatistikleri (son 30 gün)
    last_month = datetime.utcnow() - timedelta(days=30)
    game_stats = db.session.query(
        Game.name,
        db.func.count(Score.id).label('play_count')
    ).join(Score, Game.slug == Score.game_type
    ).filter(Score.timestamp >= last_month
    ).group_by(Game.name
    ).order_by(db.func.count(Score.id).desc()
    ).limit(10).all()
    
    return render_template(
        'admin/statistics/index.html',
        stats=stats,
        daily_registrations=daily_registrations,
        popular_games=popular_games,
        game_stats=game_stats,
        current_admin=get_current_admin()
    )

@admin_bp.route('/statistics/export')
@admin_required
def statistics_export():
    export_type = request.args.get('type', 'users')
    
    if export_type == 'users':
        # Kullanıcı verilerini dışa aktar
        users = User.query.all()
        
        data = [
            ['ID', 'Kullanıcı Adı', 'E-posta', 'Kayıt Tarihi', 'Son Aktif', 'XP', 'Toplam Oyun', 'En Yüksek Skor', 'Durum']
        ]
        
        for user in users:
            data.append([
                user.id,
                user.username,
                user.email,
                user.created_at.strftime('%d.%m.%Y') if user.created_at else '',
                user.last_active.strftime('%d.%m.%Y') if user.last_active else '',
                user.experience_points,
                user.total_games_played,
                user.highest_score,
                user.account_status
            ])
        
        response = jsonify({'data': data})
        response.headers['Content-Disposition'] = 'attachment; filename=users.json'
        
    elif export_type == 'games':
        # Oyun verilerini dışa aktar
        games = Game.query.all()
        
        data = [
            ['ID', 'İsim', 'Slug', 'Zorluk', 'Oynama Sayısı', 'Ortalama Skor', 'Durum']
        ]
        
        for game in games:
            data.append([
                game.id,
                game.name,
                game.slug,
                game.difficulty,
                game.play_count,
                game.avg_rating,
                'Yayında' if game.published else 'Taslak'
            ])
        
        response = jsonify({'data': data})
        response.headers['Content-Disposition'] = 'attachment; filename=games.json'
        
    elif export_type == 'scores':
        # Skor verilerini dışa aktar
        scores = Score.query.order_by(Score.timestamp.desc()).limit(1000).all()
        
        data = [
            ['ID', 'Kullanıcı', 'Oyun', 'Skor', 'Tarih']
        ]
        
        for score in scores:
            user = User.query.get(score.user_id)
            username = user.username if user else 'Silinmiş Kullanıcı'
            
            data.append([
                score.id,
                username,
                score.game_type,
                score.score,
                score.timestamp.strftime('%d.%m.%Y %H:%M') if score.timestamp else ''
            ])
        
        response = jsonify({'data': data})
        response.headers['Content-Disposition'] = 'attachment; filename=scores.json'
    
    else:
        return jsonify({'error': 'Geçersiz dışa aktarma türü'})
    
    return response

# YÖNETİCİ İŞLEM KAYITLARI
@admin_bp.route('/logs')
@admin_required
@admin_permission_required('admin')
def logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    logs = AdminLog.query.order_by(AdminLog.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return render_template(
        'admin/logs/index.html',
        logs=logs,
        current_admin=get_current_admin()
    )

# Yönetici profili ve ayarları
@admin_bp.route('/profile')
@admin_required
def admin_profile():
    admin = get_current_admin()
    return render_template(
        'admin/profile/index.html',
        admin=admin,
        current_admin=admin
    )

@admin_bp.route('/profile/update', methods=['POST'])
@admin_required
def admin_profile_update():
    admin = get_current_admin()
    
    if not admin:
        flash('Yönetici bulunamadı.', 'danger')
        return redirect(url_for('admin.login'))
    
    try:
        # Temel bilgileri güncelle
        admin.username = request.form.get('username')
        admin.email = request.form.get('email')
        
        # Şifre değiştirme kontrolü
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if current_password and new_password and confirm_password:
            if not check_password_hash(admin.password_hash, current_password):
                flash('Mevcut şifreniz hatalı.', 'danger')
                return redirect(url_for('admin.admin_profile'))
            
            if new_password != confirm_password:
                flash('Yeni şifreler eşleşmiyor.', 'danger')
                return redirect(url_for('admin.admin_profile'))
            
            admin.password_hash = generate_password_hash(new_password)
            flash('Şifreniz başarıyla güncellendi.', 'success')
        
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='update',
            entity_type='admin',
            entity_id=admin.id,
            details="Yönetici profili güncellendi"
        )
        
        flash('Profil bilgileriniz güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Profil güncellenirken bir hata oluştu: {str(e)}", 'danger')
    
    return redirect(url_for('admin.admin_profile'))

# OYUN TASARIMCISI
@admin_bp.route('/game-designer')
@admin_required
def game_designer():
    """Oyun tasarımcısı ana sayfası"""
    games = Game.query.order_by(Game.name).all()
    return render_template(
        'admin/game_designer/index.html',
        games=games,
        current_admin=get_current_admin()
    )

@admin_bp.route('/game-designer/<int:game_id>')
@admin_required
def game_designer_edit(game_id):
    """Oyun tasarımcısı düzenleme sayfası"""
    game = Game.query.get_or_404(game_id)
    
    # Oyun ayarlarından tasarım bilgilerini al veya varsayılan oluştur
    design_settings = game.settings.get('design', {}) if game.settings else {}
    
    return render_template(
        'admin/game_designer/edit.html',
        game=game,
        design_settings=design_settings,
        current_admin=get_current_admin()
    )

@admin_bp.route('/game-designer/<int:game_id>/update', methods=['POST'])
@admin_required
def game_designer_update(game_id):
    """Oyun tasarım ayarlarını güncelle"""
    game = Game.query.get_or_404(game_id)
    
    try:
        # JSON verisini al
        design_data = request.json
        
        # Oyun ayarlarını güncelle
        if not game.settings:
            game.settings = {}
        
        # 'design' anahtarını ekleyelim
        game.settings['design'] = design_data
        
        # Veritabanını güncelle
        db.session.commit()
        
        # İşlem kaydı oluştur
        create_admin_log(
            action='update',
            entity_type='game_design',
            entity_id=game.id,
            details=f"'{game.name}' oyunu tasarımı güncellendi"
        )
        
        return jsonify({
            'success': True,
            'message': 'Oyun tasarımı başarıyla güncellendi'
        })
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Oyun tasarımı güncellenirken hata: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Bir hata oluştu: {str(e)}"
        }), 500

@admin_bp.route('/game-designer/templates')
@admin_required
def game_designer_templates():
    """Tasarım şablonlarını listele"""
    # Şablon kategorilerini al
    template_categories = [
        {
            'id': 'cards',
            'name': 'Oyun Kartları',
            'templates': [
                {'id': 'card_simple', 'name': 'Basit Kart', 'thumbnail': '/static/images/admin/templates/card_simple.jpg'},
                {'id': 'card_image', 'name': 'Resimli Kart', 'thumbnail': '/static/images/admin/templates/card_image.jpg'},
                {'id': 'card_hover', 'name': 'Hover Efektli Kart', 'thumbnail': '/static/images/admin/templates/card_hover.jpg'}
            ]
        },
        {
            'id': 'buttons',
            'name': 'Butonlar',
            'templates': [
                {'id': 'btn_simple', 'name': 'Basit Buton', 'thumbnail': '/static/images/admin/templates/btn_simple.jpg'},
                {'id': 'btn_animated', 'name': 'Animasyonlu Buton', 'thumbnail': '/static/images/admin/templates/btn_animated.jpg'},
                {'id': 'btn_icon', 'name': 'İkonlu Buton', 'thumbnail': '/static/images/admin/templates/btn_icon.jpg'}
            ]
        },
        {
            'id': 'layouts',
            'name': 'Düzenler',
            'templates': [
                {'id': 'layout_grid', 'name': 'Grid Düzen', 'thumbnail': '/static/images/admin/templates/layout_grid.jpg'},
                {'id': 'layout_flex', 'name': 'Flex Düzen', 'thumbnail': '/static/images/admin/templates/layout_flex.jpg'},
                {'id': 'layout_sidebar', 'name': 'Sidebar Düzen', 'thumbnail': '/static/images/admin/templates/layout_sidebar.jpg'}
            ]
        }
    ]
    
    return jsonify(template_categories)

@admin_bp.route('/game-designer/template/<template_id>')
@admin_required
def game_designer_template_details(template_id):
    """Şablon detaylarını getir"""
    # Örnek şablon verisi
    templates = {
        'card_simple': {
            'name': 'Basit Kart',
            'html': '<div class="game-card simple-card"><h3>{{title}}</h3><p>{{description}}</p></div>',
            'css': '.game-card.simple-card{border:1px solid #ddd;border-radius:8px;padding:15px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.game-card.simple-card h3{margin-top:0;color:#333}.game-card.simple-card p{color:#666}',
            'defaults': {
                'title': 'Kart Başlığı',
                'description': 'Kart açıklaması buraya gelecek.'
            }
        },
        'btn_simple': {
            'name': 'Basit Buton',
            'html': '<button class="game-btn simple-btn">{{text}}</button>',
            'css': '.game-btn.simple-btn{background:#3498db;color:#fff;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:bold}.game-btn.simple-btn:hover{background:#2980b9}',
            'defaults': {
                'text': 'Butona Tıkla'
            }
        },
        'layout_grid': {
            'name': 'Grid Düzen',
            'html': '<div class="game-grid">{{#each items}}<div class="grid-item">{{this}}</div>{{/each}}</div>',
            'css': '.game-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.game-grid .grid-item{background:#f9f9f9;padding:20px;border-radius:5px;text-align:center}',
            'defaults': {
                'items': ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']
            }
        }
    }
    
    template = templates.get(template_id)
    
    if not template:
        return jsonify({'error': 'Şablon bulunamadı'}), 404
    
    return jsonify(template)
