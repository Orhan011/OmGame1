import os
import re
import time
import uuid
import json
import random
import secrets
import logging
from datetime import datetime, timedelta

from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, session, redirect, url_for, render_template, make_response, jsonify, flash

from app import app, db
from models import User, Score, Article

# Configure logging
logger = logging.getLogger(__name__)

# İzin verilen dosya uzantıları - avatar yüklemeleri için
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Dosya uzantısının izin verilen uzantılardan olup olmadığını kontrol eder."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
logging.basicConfig(level=logging.DEBUG)

# Email verification
def send_verification_email(to_email, verification_code):
    """
    Sends a verification email with the provided code

    Uses the configured Gmail account (omgameee@gmail.com) to send verification emails
    """
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    
    # Gmail SMTP sunucu bilgileri
    smtp_server = "smtp.gmail.com"
    port = 587
    sender_email = "omgameee@gmail.com"
    password = os.environ.get("EMAIL_PASSWORD")
    
    # Email içeriği
    message = MIMEMultipart("alternative")
    message["Subject"] = "ZekaPark - Email Doğrulama Kodu"
    message["From"] = sender_email
    message["To"] = to_email
    
    # HTML içeriği
    html = f"""
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #6A5AE0;">ZekaPark - Email Doğrulama</h2>
          <p>Merhabalar,</p>
          <p>Email adresinizi doğrulamak için aşağıdaki kodu kullanabilirsiniz:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            {verification_code}
          </div>
          <p>Bu kod 30 dakika süreyle geçerlidir.</p>
          <p>Eğer böyle bir talepte bulunmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
          <p>İyi günler dileriz,<br>ZekaPark Ekibi</p>
        </div>
      </body>
    </html>
    """
    
    # Email'in HTML kısmını ekle
    message.attach(MIMEText(html, "html"))
    
    try:
        # SMTP oturumu başlat
        server = smtplib.SMTP(smtp_server, port)
        server.ehlo()  # SMTP sunucusuyla el sıkışma
        server.starttls()  # TLS şifrelemeyi başlat
        server.ehlo()  # Şifrelenmiş bağlantı üzerinden yeniden el sıkışma
        
        # Giriş yap
        if password:
            server.login(sender_email, password)
            # Email gönder
            server.sendmail(sender_email, to_email, message.as_string())
            logger.info(f"Verification email sent to {to_email}")
        else:
            logger.error("Email password not set in environment variables")
            raise ValueError("Email gönderimi başarısız: Şifre bulunamadı")
            
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed")
        raise ValueError("Email gönderimi başarısız: Kimlik doğrulama hatası")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error occurred: {e}")
        raise ValueError(f"Email gönderimi başarısız: SMTP hatası - {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in email sending: {e}")
        raise ValueError(f"Email gönderimi başarısız: {str(e)}")

# Template utility function for getting current user
@app.template_filter('get_user_avatar')
def get_user_avatar(user_id):
    """
    Kullanıcının profil fotoğrafının URL'sini döndürür.
    Profil fotoğrafı yoksa varsayılan avatar URL'sini döndürür.

    URL'leri frontend'de kullanmak için hazır hale getirir.
    """
    user = User.query.get(user_id)
    if user and user.avatar_url:
        # Avatar URL'si zaten statik klasöründe bir yolu işaret ediyorsa,
        # doğrudan bu yolu dön (url_for ile sarmalamadan)
        return user.avatar_url
    return 'images/default-avatar.png'  # Varsayılan avatar

@app.context_processor
def utility_processor():
    def get_current_user():
        if 'user_id' in session:
            return User.query.get(session['user_id'])
        return None

    def get_user_data():
        """Session'daki kullanıcı bilgilerini döndürür"""
        if 'user_id' in session:
            return {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'avatar_url': session.get('avatar_url', 'images/default-avatar.png')
            }
        return None

    def get_avatar_url():
        """Kullanıcının avatar URL'sini döndürür"""
        return session.get('avatar_url', 'images/default-avatar.png')
    
    def get_user_scores():
        """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
        if 'user_id' not in session:
            return {}
        
        user_id = session['user_id']
        
        # Kullanıcının tüm oyun skorlarını al
        scores = Score.query.filter_by(user_id=user_id).all()
        
        # Oyun türüne göre grupla
        game_scores = {}
        for score in scores:
            if score.game_type not in game_scores:
                game_scores[score.game_type] = []
            game_scores[score.game_type].append({
                'score': score.score,
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M')
            })
            
        return game_scores
    
    return dict(
        get_current_user=get_current_user,
        get_user_data=get_user_data,
        get_avatar_url=get_avatar_url,
        get_user_scores=get_user_scores
    )

# Database initialization
def initialize_database():
    """Initialize the database with sample data"""
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        logger.info("Database tables created successfully")
        
        # Add sample articles if none exist
        if Article.query.count() == 0:
            articles = [
                Article(
                    title="Düzenli Beyin Egzersizlerinin Faydaları",
                    content="""
                    <h3>Beyninizi Formda Tutmanın Bilimsel Kanıtları</h3>
                    <p>Düzenli olarak beyin egzersizleri yapmak, tıpkı fiziksel egzersiz gibi bilişsel fonksiyonlarınızı geliştirerek beyninizi zinde tutar. Bilimsel araştırmalar, beyin egzersizlerinin hafıza performansını artırdığını, dikkat süresini uzattığını ve yaşlanmayla ilişkili bilişsel gerilemeye karşı koruma sağladığını göstermiştir.</p>
                    
                    <h4>Düzenli beyin egzersizlerinin sağladığı faydalar:</h4>
                    <ul>
                        <li><strong>Nöroplastisite Artışı:</strong> Beyin egzersizleri, beyindeki nöronlar arasında yeni bağlantılar oluşturarak nöroplastisiteyi artırır. Bu, yeni becerileri daha hızlı öğrenebilmeniz anlamına gelir.</li>
                        <li><strong>Hafıza Güçlendirme:</strong> Hafıza oyunları oynamak, hem kısa hem de uzun süreli hafızanızı geliştirerek bilgileri daha kolay hatırlamanızı sağlar.</li>
                        <li><strong>Odaklanma Yeteneği:</strong> Dikkat gerektiren oyunlar, konsantrasyon sürenizi uzatarak günlük görevlerde daha odaklı kalmanıza yardımcı olur.</li>
                        <li><strong>Problem Çözme Becerisi:</strong> Bulmaca ve mantık oyunları, analitik düşünme ve problem çözme becerilerinizi geliştirerek karmaşık sorunları daha etkili çözmenizi sağlar.</li>
                        <li><strong>İşlem Hızı:</strong> Hız gerektiren oyunlar, beyninizin bilgiyi işleme hızını artırarak daha hızlı düşünmenize ve tepki vermenize olanak tanır.</li>
                        <li><strong>Bilişsel Rezerv Oluşturma:</strong> Düzenli zihinsel aktivite, beyinde "bilişsel rezerv" oluşturarak Alzheimer ve demans gibi nörodejeneratif hastalıklara karşı koruma sağlar.</li>
                    </ul>
                    <p>ZekaPark'ta sunulan çeşitli oyunlarla, bu faydaların tümünden yararlanabilir ve bilişsel becerilerinizi eğlenceli bir şekilde geliştirebilirsiniz.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Beyin Sağlığı İçin Beslenme İpuçları",
                    content="""
                    <h3>Beyin Performansınızı Artıracak Beslenme Stratejileri</h3>
                    <p>Beyin sağlığı ve bilişsel performans, yalnızca zihinsel egzersizlerle değil, aynı zamanda doğru beslenme ile de desteklenir. Beyniniz, vücut ağırlığınızın sadece %2'sini oluşturmasına rağmen, vücudunuzun tükettiği enerjinin yaklaşık %20'sini kullanır.</p>
                    
                    <h4>Beyin sağlığını destekleyen besinler:</h4>
                    <ul>
                        <li><strong>Omega-3 Yağ Asitleri:</strong> Somon, chia tohumu ve ceviz gibi besinlerde bulunan omega-3'ler, beyin hücresi zarlarının yapısını güçlendirir ve nöronlar arası iletişimi artırır.</li>
                        <li><strong>Antioksidanlar:</strong> Yaban mersini, ıspanak ve bitter çikolata gibi antioksidan açısından zengin besinler, beyni oksidatif strese karşı korur.</li>
                        <li><strong>B Vitaminleri:</strong> Tam tahıllar, yumurta ve yeşil yapraklı sebzelerde bulunan B vitaminleri, nörotransmiter üretimini destekleyerek ruh halini ve bilişsel fonksiyonları iyileştirir.</li>
                        <li><strong>Sağlıklı Yağlar:</strong> Zeytinyağı ve avokado gibi tekli doymamış yağlar, beyin hücresi zarlarının bütünlüğünü korur.</li>
                        <li><strong>Kurkumin:</strong> Zerdeçalda bulunan kurkumin, güçlü anti-inflamatuar özelliklere sahiptir ve nöron büyümesini teşvik eder.</li>
                        <li><strong>Flavonoidler:</strong> Kakao, çay ve narenciyede bulunan flavonoidler, hafıza ve öğrenmeyi geliştirir.</li>
                        <li><strong>Kolin:</strong> Yumurta sarısı ve karaciğerde bulunan kolin, hafıza ve düşünme için kritik öneme sahip asetilkolin nörotransmiterinin üretiminde rol oynar.</li>
                    </ul>
                    
                    <h4>Beyin performansını olumsuz etkileyen besinler:</h4>
                    <ul>
                        <li><strong>Rafine Şeker:</strong> Yüksek şeker tüketimi, hafıza ve öğrenme becerilerini zayıflatabilir.</li>
                        <li><strong>Trans Yağlar:</strong> İşlenmiş gıdalarda bulunan trans yağlar, beyin iltihabı ve bilişsel gerileme ile ilişkilidir.</li>
                        <li><strong>Aşırı Alkol:</strong> Kronik alkol tüketimi, beyin hücrelerine zarar verebilir ve hafıza sorunlarına yol açabilir.</li>
                    </ul>
                    
                    <p>Beyin sağlığınızı desteklemek için Akdeniz tarzı beslenme gibi dengeli bir diyet benimsemeyi ve bol su içmeyi unutmayın. Beyniniz %75 su olduğundan, yeterli hidrasyon optimal beyin fonksiyonu için çok önemlidir.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Etkili Beyin Egzersizi İçin 5 Altın Kural",
                    content="""
                    <h3>Bilişsel Antrenmanlarınızdan Maksimum Fayda Sağlayın</h3>
                    <p>Beyin egzersizleri yapmak, bilişsel yeteneklerinizi geliştirmek için harika bir yoldur. Ancak, bu egzersizlerden en üst düzeyde fayda sağlamak için bazı temel prensipleri uygulamanız önemlidir.</p>
                    
                    <h4>Beyin egzersizlerinden maksimum fayda sağlamak için 5 altın kural:</h4>
                    <ol>
                        <li><strong>Düzenlilik ve Tutarlılık:</strong> Kısa süreli yoğun çalışmalar yerine, günlük düzenli egzersizler yapmak çok daha etkilidir. Her gün 15-20 dakikalık bir beyin egzersizi rutini oluşturun.</li>
                        <li><strong>Çeşitlilik:</strong> Farklı bilişsel becerileri hedefleyen çeşitli egzersizler yapın. Sadece hafıza oyunları değil, problem çözme, dikkat ve hız gerektiren farklı oyunlar da deneyin.</li>
                        <li><strong>Zorluk Seviyesi:</strong> Egzersizler ne çok kolay ne de imkansız olmalıdır. Kendinizi biraz zorlayan ama tamamen hayal kırıklığına uğratmayan bir zorluk seviyesi seçin ve becerileriniz geliştikçe zorluğu artırın.</li>
                        <li><strong>Odaklanmış Dikkat:</strong> Egzersiz yaparken tam konsantrasyon sağlayın. Dikkat dağıtıcı unsurlardan uzak, sessiz bir ortamda çalışın ve egzersiz sırasında çoklu görev yapmaktan kaçının.</li>
                        <li><strong>Geri Bildirim ve İzleme:</strong> İlerlemenizi takip edin ve performansınızla ilgili geri bildirim alın. ZekaPark'ın skor takip sistemi, gelişiminizi görmenize yardımcı olacaktır.</li>
                    </ol>
                    
                    <h4>Beyin egzersizi için ideal ortam koşulları:</h4>
                    <ol>
                        <li><strong>Yeterli Uyku:</strong> Düzenli ve kaliteli uyku, beyin fonksiyonlarınız için kritik öneme sahiptir.</li>
                        <li><strong>Beslenme:</strong> Omega-3, antioksidanlar ve kompleks karbonhidratlar beyin sağlığınız için önemlidir.</li>
                        <li><strong>Meditasyon:</strong> Günlük kısa meditasyon seansları odaklanma yeteneğinizi artırabilir.</li>
                        <li><strong>Egzersiz:</strong> Fiziksel aktivite, beyninize oksijen akışını artırır ve bilişsel işlevleri destekler.</li>
                        <li><strong>Mola Verin:</strong> Uzun süre aynı göreve odaklanmak yerine düzenli molalar verin.</li>
                    </ol>
                    """,
                    category="article"
                ),
                Article(
                    title="Bilişsel Becerileri Geliştirmenin Günlük Yaşama Etkileri",
                    content="""
                    <h3>Oyunlar Ötesinde Faydalar</h3>
                    <p>Beyin egzersizlerinin yararları sadece oyun performansınızla sınırlı değildir. Geliştirdiğiniz bilişsel beceriler, günlük yaşamın çeşitli alanlarında da size avantaj sağlar.</p>

                    <h4>Gelişmiş bilişsel becerilerin günlük yaşamdaki yansımaları:</h4>
                    <ul>
                        <li><strong>İş ve Akademik Performans:</strong> Daha hızlı öğrenme, daha iyi problem çözme ve gelişmiş kritik düşünme becerileri.</li>
                        <li><strong>Günlük Görevler:</strong> Alışveriş listesini hatırlama, randevulara zamanında gitme ve çoklu görevleri daha verimli yönetme.</li>
                        <li><strong>İletişim:</strong> Daha iyi dinleme, daha keskin sözel beceriler ve daha iyi sosyal ipuçları algılama.</li>
                        <li><strong>Yaratıcılık:</strong> Daha geniş düşünme, farklı bakış açıları geliştirme ve daha yenilikçi çözümler bulma.</li>
                        <li><strong>Duygusal Zeka:</strong> Duyguları daha iyi tanıma, dürtüleri kontrol etme ve stresle başa çıkma yeteneği.</li>
                        <li><strong>Yaşla İlgili Gerilemeye Karşı Koruma:</strong> Bilişsel rezerv oluşturarak yaşlanmanın etkilerine karşı direnç geliştirme.</li>
                    </ul>
                    <p>ZekaPark'ta düzenli olarak egzersiz yapmak, beyninizin "kas belleğini" geliştirerek bu becerileri günlük yaşamınıza daha kolay aktarmanızı sağlar.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Hafıza Geliştirme Teknikleri",
                    content="""
                    <h3>Hafızanızı geliştirmek için deneyebileceğiniz etkili teknikler:</h3>
                    <ul>
                        <li><strong>Görselleştirme:</strong> Hatırlamak istediğiniz bilgiyi canlı görüntülerle ilişkilendirin.</li>
                        <li><strong>Çağrışım:</strong> Yeni bilgileri, zaten bildiğiniz şeylerle ilişkilendirin.</li>
                        <li><strong>Bölme:</strong> Uzun bilgi dizilerini daha küçük, yönetilebilir parçalara ayırın.</li>
                        <li><strong>Tekrar:</strong> Aralıklı tekrar, bilgilerin uzun süreli hafızaya geçmesini sağlar.</li>
                        <li><strong>Hikaye Tekniği:</strong> Hatırlanması gereken öğeleri bir hikaye içinde birleştirin.</li>
                    </ul>
                    <p>Bu teknikleri ZekaPark oyunlarında pratik ederek hafızanızı güçlendirebilirsiniz.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Konsantrasyon Artırma Yöntemleri",
                    content="""
                    <h3>Odaklanma gücünüzü artırmak için deneyebileceğiniz teknikler:</h3>
                    <ul>
                        <li><strong>Pomodoro Tekniği:</strong> 25 dakika konsantre çalışma ve 5 dakika mola vererek döngüyü tekrarlayın.</li>
                        <li><strong>Çalışma Ortamını Düzenleme:</strong> Dikkat dağıtıcı unsurları ortadan kaldırın.</li>
                        <li><strong>Tek Görev Odaklı Çalışma:</strong> Aynı anda birden fazla iş yapmak yerine tek bir göreve odaklanın.</li>
                        <li><strong>Meditasyon:</strong> Günlük 10 dakikalık mindfulness meditasyonu, dikkat süresini uzatabilir.</li>
                        <li><strong>Düzenli Molalar:</strong> Uzun süre aynı işe odaklanmak yerine kısa molalar verin.</li>
                    </ul>
                    <p>ZekaPark'taki dikkat oyunları, bu teknikleri uygulamanız için mükemmel bir antrenman platformu sunar.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Puzzle Oyunu İçin Etkili Stratejiler",
                    content="""
                    <h3>Puzzle oyununda daha başarılı olmak için ipuçları:</h3>
                    <ul>
                        <li>Önce kenar ve köşe parçalarını bularak çerçeveyi oluşturun.</li>
                        <li>Parçaları renklere veya desenlere göre gruplandırın.</li>
                        <li>Bir bölümü tamamladıktan sonra diğerine geçin.</li>
                        <li>Zorlandığınız parçaları geçici olarak kenara ayırıp daha sonra tekrar deneyin.</li>
                        <li>Düzenli molalar verin - bazen uzaklaşıp sonra geri dönmek yeni perspektifler kazandırabilir.</li>
                    </ul>
                    <p>Puzzle çözmek, görsel-uzamsal zeka ve problem çözme becerilerinizi geliştirir.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Beyin Sisi ile Başa Çıkma Yöntemleri",
                    content="""
                    <h3>Zihinsel Netlik İçin Stratejiler</h3>
                    <p>Beyin sisi veya bilişsel bulanıklık, konsantre olma zorluğu, zihinsel yorgunluk ve düşünme hızında azalma ile kendini gösterir. Bu durum, stres, yetersiz uyku, beslenme eksiklikleri veya sağlık sorunları nedeniyle ortaya çıkabilir.</p>

                    <h4>Beyin sisini azaltmak için etkili yöntemler:</h4>
                    <ul>
                        <li><strong>Hidrasyon:</strong> Hafif dehidratasyon bile bilişsel performansı etkileyebilir. Gün boyunca yeterli su için.</li>
                        <li><strong>Düzenli Egzersiz:</strong> 20-30 dakikalık orta yoğunlukta aktivite, beyne kan akışını artırır ve netliği geliştirir.</li>
                        <li><strong>Beyin Dinlenme Molaları:</strong> Pomodoro tekniği gibi yöntemlerle düzenli kısa molalar verin.</li>
                        <li><strong>Çoklu Görev Yapmaktan Kaçının:</strong> Bir seferde bir işe odaklanın, sürekli görev değiştirmek zihinsel yorgunluğu artırır.</li>
                        <li><strong>Uyku Hijyeni:</strong> Kaliteli ve yeterli uyku, bilişsel fonksiyonların yenilenmesi için şarttır.</li>
                        <li><strong>Mindfulness:</strong> 5-10 dakikalık meditasyon, zihinsel netliği önemli ölçüde artırabilir.</li<li><strong>Beslenme Düzeni:</strong> Düzenli öğünler ve beyin sağlığını destekleyen besinleri tüketmek.</li>
                    </ul>
                    <p>ZekaPark oyunlarını oynamak için kendinizi en iyi hissettiğiniz zamanları seçin. Düzenli bilişsel egzersizler, beyin sisine karşı genel direncin artmasına yardımcı olabilir.</p>
                    """,
                    category="tip"
                )
            ]

            for article in articles:
                db.session.add(article)

            db.session.commit()
            logger.info("Sample articles created")

        # Create admin user if no users exist
        if User.query.count() == 0:
            # Admin kullanıcısı
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=generate_password_hash("admin123"),
                full_name="Admin User",
                account_status="active",
                experience_points=1000,
                favorite_games=["wordPuzzle", "memoryMatch", "numberSequence"]
            )
            
            # Test kullanıcısı
            test_user = User(
                username="test",
                email="test@example.com",
                password_hash=generate_password_hash("test123"),
                full_name="Test User",
                account_status="active",
                experience_points=500,
                favorite_games=["labyrinth", "3dRotation"]
            )
            
            db.session.add(admin)
            db.session.add(test_user)
            db.session.commit()
            logger.info("Admin and test users created")
            
            # Add sample scores
            sample_scores = [
                Score(user_id=1, game_type="wordPuzzle", score=120),
                Score(user_id=1, game_type="memoryMatch", score=85),
                Score(user_id=1, game_type="numberSequence", score=150),
                Score(user_id=1, game_type="3dRotation", score=95),
                Score(user_id=2, game_type="wordPuzzle", score=90),
                Score(user_id=2, game_type="memoryMatch", score=75),
                Score(user_id=2, game_type="numberSequence", score=110),
                Score(user_id=2, game_type="3dRotation", score=85)
            ]
            
            for score in sample_scores:
                db.session.add(score)
                
            db.session.commit()
            logger.info("Sample scores created")

@app.route('/init-db')
def init_db_route():
    initialize_database()
    return "Database initialized with sample data."

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        # Kullanıcı adı veya email kontrolü
        user = User.query.filter((User.username == username) | (User.email == username)).first()
        
        if user and check_password_hash(user.password_hash, password):
            if user.account_status == 'suspended':
                if user.suspended_until and user.suspended_until > datetime.utcnow():
                    flash(f'Hesabınız {user.suspended_until.strftime("%d.%m.%Y %H:%M")} tarihine kadar askıya alınmıştır.')
                    return redirect(url_for('login'))
                else:
                    # Askıya alma süresi dolduysa hesabı aktifleştir
                    user.account_status = 'active'
                    user.suspended_until = None
                    db.session.commit()
            
            # Kullanıcı bilgilerini session'a ekle
            session['user_id'] = user.id
            session['username'] = user.username
            
            # Avatar URL'sini session'a ekle
            if user.avatar_url:
                session['avatar_url'] = user.avatar_url
            else:
                session['avatar_url'] = 'images/default-avatar.png'
            
            # Son giriş zamanını güncelle
            user.last_active = datetime.utcnow()
            db.session.commit()
            
            flash('Başarıyla giriş yaptınız!')
            return redirect(url_for('index'))
        else:
            flash('Geçersiz kullanıcı adı veya şifre.')
    
    return render_template('login.html')

# Game Routes
@app.route('/3d-rotation')
def three_d_rotation():
    return render_template('games/3d_rotation.html')

@app.route('/word-puzzle')
def word_puzzle():
    return render_template('games/word_puzzle.html')

@app.route('/memory-match')
def memory_match():
    return render_template('games/memory_match.html')

@app.route('/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

@app.route('/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

@app.route('/number-sequence')
def number_sequence():
    return render_template('games/number_sequence.html')

@app.route('/memory-cards')
def memory_cards():
    """Hafıza Kartları oyunu

    Eşleşen kartları bulma oyunu. Kullanıcılar, bir dizi kartın yerini hatırlayarak eşlerini bulmaya çalışır.
    Bu oyun, görsel bellek ve dikkat becerisini geliştirir.
    """
    return render_template('games/memory_cards.html')

@app.route('/number-chain')
def number_chain():
    """Sayı Zinciri oyunu

    Kullanıcılara kısa bir süre gösterilen sayı dizisini doğru sırada hatırlama oyunu.
    Bu oyun, kısa süreli hafıza ve dikkat becerilerini geliştirir.
    """
    return render_template('games/number_chain.html')

@app.route('/audio-memory')
def audio_memory():
    """Sesli Hafıza: Melodi oyunu
    İşitsel hafızayı geliştirmek için tasarlanmış interaktif bir oyun.
    Doğa sesleri, enstrümanlar veya diğer sesler ile hafıza egzersizi."""
    return render_template('games/audio_memory.html')

@app.route('/n-back')
def n_back():
    """N-Back Test

    Çalışma belleğini test eden ve geliştiren bir beyin egzersizi.
    Kullanıcılar, n adım önceki uyaranın mevcut uyaranla eşleşip eşleşmediğini hatırlamaya çalışır.
    """
    return render_template('games/n_back.html')

@app.route('/sudoku')
def sudoku():
    """Sudoku oyunu

    Klasik Sudoku bulmaca oyunu. 9x9 grid üzerinde 1-9 arası rakamları yerleştirerek
    her satır, sütun ve 3x3 kutuya her rakamın bir kez geldiği çözümleri bulmaya çalışır.
    Mantık ve düşünme becerilerini geliştirir.
    """
    return render_template('games/sudoku.html')

@app.route('/2048')
def game_2048():
    """2048 sayı birleştirme oyunu

    Aynı değerdeki karoları birleştirerek 2048 sayısına ulaşmaya çalıştığınız bir bulmaca oyunu.
    Stratejik düşünme ve planlama becerilerini geliştirir.
    """
    return render_template('games/2048.html')

@app.route('/wordle')
def wordle():
    """Wordle kelime tahmin oyunu"""
    return render_template('games/wordle.html')

@app.route('/chess')
def chess():
    """Satranç oyunu"""
    return render_template('games/chess.html')

@app.route('/all-games')
def all_games():
    return render_template('all_games.html')

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/articles')
def articles():
    # Makaleleri ve ipuçlarını veritabanından al
    articles = Article.query.filter_by(category="article").all()
    tips = Article.query.filter_by(category="tip").all()
    
    return render_template('articles.html', articles=articles, tips=tips)

@app.route('/tips')
def tips():
    # Sadece ipuçlarını veritabanından al
    tips = Article.query.filter_by(category="tip").all()
    
    return render_template('tips.html', tips=tips)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Doğrulama
        if not username or not email or not password:
            flash('Lütfen tüm alanları doldurun.')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor.')
            return redirect(url_for('register'))
        
        # Email formatı doğrulama
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            flash('Geçersiz email formatı.')
            return redirect(url_for('register'))

        email_domain = email.split('@')[1]
        valid_domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com']
        if email_domain not in valid_domains:
            flash('Lütfen geçerli bir email servis sağlayıcısı kullanın (Gmail, Hotmail, Yahoo, Outlook).')
            return redirect(url_for('register'))

        if User.query.filter_by(username=username).first():
            flash('Bu kullanıcı adı zaten kullanılıyor.')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
            flash('Bu email adresi zaten kullanılıyor.')
            return redirect(url_for('register'))

        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )

        try:
            db.session.add(new_user)
            db.session.commit()

            session['user_id'] = new_user.id
            session['username'] = new_user.username
            session['avatar_url'] = 'images/default-avatar.png'  # Varsayılan avatar
            flash('Kayıt başarılı! Hoş geldiniz!')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            flash('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.')
            return redirect(url_for('register'))

    if session.get('user_id'):
        return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/logout')
def logout():
    # Tüm oturum verilerini temizle
    session.clear()
    flash('Başarıyla çıkış yaptınız.')
    return redirect(url_for('login'))

# Profile management routes
def xp_for_level(level):
    """Belirli bir seviyeye ulaşmak için gereken toplam XP değerini hesaplar."""
    # Basit bir formül: seviye^2 * 50
    return level * level * 50

def calculate_level(xp):
    """Toplam XP'ye göre kullanıcı seviyesini hesaplar."""
    level = 1
    while xp >= xp_for_level(level + 1):
        level += 1
    return level

def get_user_scores():
    """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
    if 'user_id' not in session:
        return {}
    
    user_id = session['user_id']
    
    # Kullanıcının tüm oyun skorlarını al
    scores = Score.query.filter_by(user_id=user_id).all()
    
    # Oyun türüne göre grupla
    game_scores = {}
    for score in scores:
        if score.game_type not in game_scores:
            game_scores[score.game_type] = []
        game_scores[score.game_type].append({
            'score': score.score,
            'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M')
        })
        
    return game_scores

@app.route('/profile')
def profile():
    """Mevcut profil sayfası."""
    # Kullanıcı girişi yapılmamışsa login sayfasına yönlendir
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Kullanıcı bilgilerini veritabanından al
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Kullanıcının oyun skorlarını al
    scores = Score.query.filter_by(user_id=user.id).order_by(Score.timestamp.desc()).all()
    
    # Oyun türlerine göre skorları grupla
    game_scores = {}
    for score in scores:
        if score.game_type not in game_scores:
            game_scores[score.game_type] = []
        game_scores[score.game_type].append(score)
    
    # Profil sayfasını render et
    return render_template('profile_new.html', user=user, game_scores=game_scores)

@app.route('/profile-v2')
def profile_v2():
    """Yeni tasarımlı profil sayfası."""
    # Kullanıcı girişi yapılmamışsa login sayfasına yönlendir
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    # Kullanıcı bilgilerini veritabanından al
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Kullanıcının oyun skorlarını al
    scores = Score.query.filter_by(user_id=user.id).order_by(Score.timestamp.desc()).all()
    
    # Oyun türlerine göre skorları grupla
    game_scores = {}
    for score in scores:
        if score.game_type not in game_scores:
            game_scores[score.game_type] = []
        game_scores[score.game_type].append(score)
    
    return render_template('profile_v2.html', user=user, game_scores=game_scores)

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Profil bilgilerini güncelleme."""
    # Kullanıcı girişi kontrolü
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    full_name = request.form.get('full_name', '').strip()
    bio = request.form.get('bio', '').strip()
    age = request.form.get('age', '')
    location = request.form.get('location', '').strip()
    
    # Verileri güncelle
    user.full_name = full_name
    user.bio = bio
    
    # Yaş doğrulama
    if age:
        try:
            age = int(age)
            if 13 <= age <= 100:  # Makul bir yaş aralığı
                user.age = age
        except ValueError:
            flash('Geçersiz yaş değeri.')
    
    user.location = location
    
    # Veritabanına kaydet
    try:
        db.session.commit()
        flash('Profil bilgileri başarıyla güncellendi.')
        
    except Exception as e:
        db.session.rollback()
        flash('Profil güncellenirken bir hata oluştu.')
        logger.error(f"Profile update error: {e}")
    
    return redirect(url_for('profile_v2'))

@app.route('/update-avatar', methods=['POST'])
def update_avatar():
    """Profil fotoğrafını güncelleme."""
    # Kullanıcı girişi kontrolü
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Dosya kontrolü
    if 'avatar' not in request.files:
        flash('Dosya seçilmedi.')
        return redirect(url_for('profile_v2'))
    
    file = request.files['avatar']
    
    # Dosya adı boş ise
    if file.filename == '':
        flash('Dosya seçilmedi.')
        return redirect(url_for('profile_v2'))
    
    # Dosya türü kontrolü
    if file and allowed_file(file.filename):
        # Güvenli dosya adı oluştur
        filename = secure_filename(file.filename)
        
        # Benzersiz bir dosya adı oluştur
        unique_filename = f"{str(uuid.uuid4())}_{filename}"
        
        # Dosya yolunu belirle
        avatar_path = os.path.join('static', 'uploads', 'avatars', unique_filename)
        
        # Dizin yoksa oluştur
        os.makedirs(os.path.dirname(avatar_path), exist_ok=True)
        
        # Dosyayı kaydet
        file.save(avatar_path)
        
        # URL'i veritabanında güncelle (static/ öneki olmadan)
        avatar_url = os.path.join('uploads', 'avatars', unique_filename)
        user.avatar_url = avatar_url
        session['avatar_url'] = avatar_url
        
        # Veritabanına kaydet
        try:
            db.session.commit()
            flash('Profil fotoğrafı başarıyla güncellendi.')
            
        except Exception as e:
            db.session.rollback()
            flash('Profil fotoğrafı güncellenirken bir hata oluştu.')
            logger.error(f"Avatar update error: {e}")
    else:
        flash('İzin verilen dosya türleri: png, jpg, jpeg, gif.')
    
    return redirect(url_for('profile_v2'))

@app.route('/change-password', methods=['POST'])
def change_password():
    """Şifre değiştirme."""
    # Kullanıcı girişi kontrolü
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    # Mevcut şifre kontrolü
    if not check_password_hash(user.password_hash, current_password):
        flash('Mevcut şifre hatalı.')
        return redirect(url_for('profile_v2'))
    
    # Yeni şifre kontrolü
    if new_password != confirm_password:
        flash('Yeni şifreler eşleşmiyor.')
        return redirect(url_for('profile_v2'))
    
    # Şifre karmaşıklık kontrolü
    if len(new_password) < 6:
        flash('Şifre en az 6 karakter uzunluğunda olmalıdır.')
        return redirect(url_for('profile_v2'))
    
    # Şifreyi güncelle
    user.password_hash = generate_password_hash(new_password)
    
    # Veritabanına kaydet
    try:
        db.session.commit()
        flash('Şifre başarıyla değiştirildi.')
        
    except Exception as e:
        db.session.rollback()
        flash('Şifre değiştirilirken bir hata oluştu.')
        logger.error(f"Password change error: {e}")
    
    return redirect(url_for('profile_v2'))

@app.route('/update-security-settings', methods=['POST'])
def update_security_settings():
    """Güvenlik ayarlarını güncelleme."""
    # Gelecekte şüpheli girişleri bildirim gönderme, iki faktörlü kimlik doğrulama vb. 
    # gibi gelişmiş güvenlik özellikleri eklenebilir
    flash('Güvenlik ayarları güncellendi.')
    return redirect(url_for('profile_v2'))

@app.route('/update-notification-settings', methods=['POST'])
def update_notification_settings():
    """Bildirim ayarlarını güncelleme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    email_notifications = request.form.get('email_notifications') == 'on'
    achievement_notifications = request.form.get('achievement_notifications') == 'on'
    leaderboard_notifications = request.form.get('leaderboard_notifications') == 'on'
    
    # Kullanıcı ayarlarını güncelle
    user.email_notifications = email_notifications
    user.achievement_notifications = achievement_notifications
    user.leaderboard_notifications = leaderboard_notifications
    
    # Veritabanına kaydet
    try:
        db.session.commit()
        flash('Bildirim ayarları güncellendi.')
    except Exception as e:
        db.session.rollback()
        flash('Bildirim ayarları güncellenirken bir hata oluştu.')
        logger.error(f"Notification settings update error: {e}")
    
    return redirect(url_for('profile_v2'))

@app.route('/update-theme', methods=['POST'])
def update_theme():
    """Tema tercihini güncelleme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    theme = request.form.get('theme', 'dark')
    
    # Kullanıcı temasını güncelle
    user.theme_preference = theme
    
    # Veritabanına kaydet
    try:
        db.session.commit()
        flash('Tema tercihi güncellendi.')
    except Exception as e:
        db.session.rollback()
        flash('Tema tercihi güncellenirken bir hata oluştu.')
        logger.error(f"Theme preference update error: {e}")
    
    return redirect(url_for('profile_v2'))

@app.route('/delete-account', methods=['POST'])
def delete_account():
    """Hesabı silme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Şifre kontrolü
    password = request.form.get('password', '')
    if not check_password_hash(user.password_hash, password):
        flash('Şifre hatalı. Hesabınız silinmedi.')
        return redirect(url_for('profile_v2'))
    
    # İlişkili skorları sil
    Score.query.filter_by(user_id=user.id).delete()
    
    # Kullanıcıyı sil
    db.session.delete(user)
    
    try:
        db.session.commit()
        
        # Oturumu kapat
        session.clear()
        flash('Hesabınız başarıyla silindi.')
        
    except Exception as e:
        db.session.rollback()
        flash('Hesap silinirken bir hata oluştu.')
        logger.error(f"Account deletion error: {e}")
        return redirect(url_for('profile_v2'))
    
    return redirect(url_for('index'))

@app.route('/suspend-account', methods=['POST'])
def suspend_account():
    """Hesabı dondurma."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Şifre kontrolü
    password = request.form.get('password', '')
    if not check_password_hash(user.password_hash, password):
        flash('Şifre hatalı. Hesabınız dondurulmadı.')
        return redirect(url_for('profile_v2'))
    
    # Hesabı askıya al
    user.account_status = 'suspended'
    
    # Askıya alma süresini belirle (30 gün)
    user.suspended_until = datetime.utcnow() + timedelta(days=30)
    
    try:
        db.session.commit()
        
        # Oturumu kapat
        session.clear()
        flash('Hesabınız 30 günlüğüne donduruldu.')
        
    except Exception as e:
        db.session.rollback()
        flash('Hesap dondurulurken bir hata oluştu.')
        logger.error(f"Account suspension error: {e}")
        return redirect(url_for('profile_v2'))
    
    return redirect(url_for('index'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Reset token oluştur
            token = secrets.token_urlsafe(32)
            user.reset_token = token
            user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
            
            # Veritabanına kaydet
            try:
                db.session.commit()
                
                # Şifre sıfırlama e-postası gönder
                reset_link = url_for('reset_password', token=token, _external=True)
                
                # Burada gerçek bir e-posta gönderme işlemi yapılacak
                # Bu örnekte sadece konsola yazdırıyoruz
                logger.info(f"Password reset link: {reset_link}")
                
                flash('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.')
                
            except Exception as e:
                db.session.rollback()
                flash('Bir hata oluştu. Lütfen tekrar deneyin.')
                logger.error(f"Password reset error: {e}")
        else:
            # Kullanıcı bulunamadı, ancak güvenlik nedeniyle aynı mesajı göster
            flash('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.')
        
        return redirect(url_for('login'))
    
    return render_template('forgot_password.html')

@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    if request.method == 'POST':
        code = request.form.get('code', '').strip()
        
        # Kod kontrolü yapılacak ve geçerliyse şifre sıfırlama sayfasına yönlendirilecek
        flash('Kod doğrulandı. Yeni şifrenizi belirleyin.')
        return redirect(url_for('reset_password'))
    
    return render_template('reset_code.html')

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'GET':
        token = request.args.get('token')
        
        if not token:
            flash('Geçersiz veya süresi dolmuş token.')
            return redirect(url_for('login'))
        
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            flash('Geçersiz veya süresi dolmuş token.')
            return redirect(url_for('login'))
        
        # Token geçerli, şifre sıfırlama formunu göster
        return render_template('reset_password.html', token=token)
    
    elif request.method == 'POST':
        token = request.form.get('token')
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not token:
            flash('Geçersiz istek.')
            return redirect(url_for('login'))
        
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            flash('Geçersiz veya süresi dolmuş token.')
            return redirect(url_for('login'))
        
        # Şifre kontrolü
        if password != confirm_password:
            flash('Şifreler eşleşmiyor.')
            return render_template('reset_password.html', token=token)
        
        if len(password) < 6:
            flash('Şifre en az 6 karakter olmalıdır.')
            return render_template('reset_password.html', token=token)
        
        # Şifreyi güncelle
        user.password_hash = generate_password_hash(password)
        
        # Token'ı temizle
        user.reset_token = None
        user.reset_token_expiry = None
        
        try:
            db.session.commit()
            flash('Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.')
            
        except Exception as e:
            db.session.rollback()
            flash('Şifre sıfırlanırken bir hata oluştu.')
            logger.error(f"Password reset error: {e}")
        
        return redirect(url_for('login'))

# API Routes
@app.route('/api/save-score', methods=['POST'])
def save_score():
    """Oyun skorunu kaydet"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    if not data or 'gameType' not in data or 'score' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    game_type = data['gameType']
    score_value = data['score']
    
    try:
        # Skoru kaydet
        score = Score(
            user_id=session['user_id'],
            game_type=game_type,
            score=score_value
        )
        db.session.add(score)
        
        # Kullanıcının deneyim puanlarını güncelle
        user = User.query.get(session['user_id'])
        
        if user:
            # Basit bir formül: skor değerinin %10'u kadar XP
            xp_gain = int(score_value * 0.1)
            user.experience_points += xp_gain
            
            # Toplam oyun sayısını güncelle
            user.total_games_played += 1
            
            # En yüksek skoru güncelle (gerekirse)
            if score_value > user.highest_score:
                user.highest_score = score_value
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Score saved successfully',
            'score_id': score.id,
            'xp_gain': xp_gain if user else 0,
            'total_xp': user.experience_points if user else 0,
            'level': calculate_level(user.experience_points) if user else 1
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving score: {e}")
        return jsonify({'error': 'Failed to save score'}), 500

@app.route('/api/user', methods=['GET'])
def get_current_user_api():
    """Mevcut kullanıcı kimliğini döndür (API)"""
    if 'user_id' not in session:
        return jsonify({'logged_in': False})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'logged_in': False})
    
    return jsonify({
        'logged_in': True,
        'user_id': user.id,
        'username': user.username,
        'avatar_url': user.avatar_url if user.avatar_url else 'images/default-avatar.png',
        'experience_points': user.experience_points,
        'level': calculate_level(user.experience_points),
        'total_games_played': user.total_games_played,
        'highest_score': user.highest_score
    })

@app.route('/api/get-scores/<game_type>', methods=['GET'])
def get_scores(game_type):
    """Bir oyun türü için skor tablosunu getir. Mevcut kullanıcının skorlarını vurgular."""
    # Belirli bir oyun türü için en yüksek 10 skoru al
    top_scores = db.session.query(
        Score, User.username
    ).join(
        User, Score.user_id == User.id
    ).filter(
        Score.game_type == game_type
    ).order_by(
        Score.score.desc()
    ).limit(10).all()
    
    scores_list = []
    for score, username in top_scores:
        scores_list.append({
            'score_id': score.id,
            'user_id': score.user_id,
            'username': username,
            'score': score.score,
            'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M'),
            'is_current_user': score.user_id == session.get('user_id')
        })
    
    return jsonify(scores_list)

@app.route('/api/get-scores-alt/<game_type>', methods=['GET'])
def get_scores_alt(game_type):
    """Alternatif skor getirme API'si. Skoru olmayan kullanıcılar için daha uygun.
    Oyun kategorisine göre filtreleme yapar ve o oyunu oynamamış kullanıcıları listelemez."""
    
    # Belirli bir oyun türü için skorları al
    scores = Score.query.filter_by(game_type=game_type).order_by(Score.score.desc()).all()
    
    # Kullanıcı bilgilerini birleştir
    results = []
    for score in scores:
        user = User.query.get(score.user_id)
        if user:
            results.append({
                'score_id': score.id,
                'user_id': score.user_id,
                'username': user.username,
                'score': score.score,
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M'),
                'is_current_user': score.user_id == session.get('user_id')
            })
    
    return jsonify(results)

@app.route('/api/get-aggregated-scores', methods=['GET'])
def get_aggregated_scores():
    """Tüm oyunlardaki toplam skorları getiren API."""
    # Kullanıcı ID'ye göre toplamda en yüksek skorlara sahip kullanıcıları bul
    users_with_total_scores = db.session.query(
        User,
        db.func.sum(Score.score).label('total_score'),
        db.func.count(Score.id).label('game_count')
    ).join(
        Score, User.id == Score.user_id
    ).group_by(
        User.id
    ).order_by(
        db.desc('total_score')
    ).limit(10).all()
    
    results = []
    for user, total_score, game_count in users_with_total_scores:
        results.append({
            'user_id': user.id,
            'username': user.username,
            'avatar_url': user.avatar_url if user.avatar_url else 'images/default-avatar.png',
            'total_score': int(total_score),
            'game_count': game_count,
            'average_score': int(total_score / game_count) if game_count > 0 else 0,
            'experience_points': user.experience_points,
            'level': calculate_level(user.experience_points),
            'is_current_user': user.id == session.get('user_id')
        })
    
    return jsonify(results)

@app.route('/leaderboard/<game_type>')
def get_leaderboard(game_type):
    """Belirli bir oyun için lider tablosunu görüntüle"""
    return render_template('leaderboard.html', game_type=game_type)

@app.route('/api/leaderboard/<game_type>')
def get_leaderboard_data(game_type):
    """Belirli bir oyun için lider tablosu verilerini getir"""
    # Belirli bir oyun türü için en yüksek 10 skoru al
    top_scores = db.session.query(
        Score, User.username, User.avatar_url
    ).join(
        User, Score.user_id == User.id
    ).filter(
        Score.game_type == game_type
    ).order_by(
        Score.score.desc()
    ).limit(10).all()
    
    scores_list = []
    for score, username, avatar_url in top_scores:
        scores_list.append({
            'score_id': score.id,
            'user_id': score.user_id,
            'username': username,
            'avatar_url': avatar_url if avatar_url else 'images/default-avatar.png',
            'score': score.score,
            'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M'),
            'is_current_user': score.user_id == session.get('user_id')
        })
    
    return jsonify(scores_list)

@app.route('/api/level/<int:score>')
def calculate_level(score):
    """Belirli bir skor için seviyeyi hesapla"""
    level = 1
    threshold = 100
    
    while score >= threshold:
        level += 1
        # Her seviye için gereken XP'yi artır
        threshold = int(threshold * 1.5)
    
    return jsonify({
        'level': level,
        'score': score,
        'next_level_threshold': threshold,
        'progress': score / threshold * 100
    })

# Favori oyunlar API'leri
@app.route('/api/get-favorites', methods=['GET'])
def get_favorites():
    """Kullanıcının favori oyunlarını getir"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'favorites': user.favorite_games or []
    })

@app.route('/api/toggle-favorite', methods=['POST'])
def toggle_favorite():
    """Oyunu favorilere ekle veya çıkar"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    if not data or 'gameType' not in data or 'action' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    game_type = data['gameType']
    action = data['action']
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Favori oyunları listesi yoksa oluştur
    if user.favorite_games is None:
        user.favorite_games = []
    
    if action == 'add':
        # Limiti kontrol et (en fazla 4 favori)
        if len(user.favorite_games) >= 4 and game_type not in user.favorite_games:
            return jsonify({
                'success': False,
                'message': 'Maksimum 4 favori oyun eklenebilir. Önce bazı favorileri kaldırın.',
                'favorites': user.favorite_games
            }), 400
        
        # Oyun zaten favorilerde değilse ekle
        if game_type not in user.favorite_games:
            user.favorite_games.append(game_type)
    
    elif action == 'remove':
        # Oyun favorilerde varsa çıkar
        if game_type in user.favorite_games:
            user.favorite_games.remove(game_type)
    
    try:
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Favori oyunlar güncellendi',
            'favorites': user.favorite_games
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating favorites: {e}")
        return jsonify({'error': 'Failed to update favorites'}), 500

# Uygulama başlatıldığında veritabanını başlat
initialize_database()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)