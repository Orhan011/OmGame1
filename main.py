import os
import re
import time
import uuid
import json
import random
import secrets
import logging
from datetime import datetime, timedelta

from flask import Flask, request, session, redirect, url_for, render_template, make_response, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

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
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import ssl

    # Gmail hesap bilgileri (güvenlik için çevresel değişkenlerden alınmalı)
    sender_email = "omgameee@gmail.com"
    sender_password = os.environ.get("EMAIL_PASSWORD", "htvh fmfz eeic kkls")  # Daha güvenli bir yöntem kullanılmalı

    if not sender_password:
        logger.error("Gmail app password not found")
        raise ValueError("Email sending failed: Missing Gmail password")

    # SSL context oluştur
    context = ssl.create_default_context()

    # Email içeriği
    subject = "ZekaPark Şifre Sıfırlama Kodu"
    message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">ZekaPark Şifre Sıfırlama</h2>
            <p>Merhaba,</p>
            <p>Şifre sıfırlama talebiniz için doğrulama kodunuz aşağıdadır:</p>
            <div style="background-color: #3498db; color: white; font-size: 24px; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <strong>{verification_code}</strong>
            </div>
            <p>Bu kodu şifre sıfırlama ekranına giriniz. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">Bu otomatik bir email'dir, lütfen cevaplamayınız.</p>
        </div>
    </body>
    </html>
    """

    # Email oluştur
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    # HTML içeriğini ekle
    msg.attach(MIMEText(message, 'html'))

    try:
        logger.info(f"Attempting to send verification email to {to_email}")

        # Gmail SMTP sunucusuna bağlan
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp_server:
            # Giriş yap
            smtp_server.login(sender_email, sender_password)
            logger.info("Successfully logged in to SMTP server")

            # Email'i gönder
            smtp_server.sendmail(sender_email, to_email, msg.as_string())
            logger.info(f"Verification email successfully sent to {to_email}")

            return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        raise ValueError("Email gönderimi başarısız: Gmail kimlik doğrulama hatası")
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
        
        # Her oyun türü için en yüksek skoru bul
        score_dict = {}
        for score in scores:
            game_type = score.game_type
            if game_type not in score_dict or score.score > score_dict[game_type]:
                score_dict[game_type] = score.score
                # Son oyun tarihini de ekle
                score_dict[f"{game_type}_date"] = score.timestamp.strftime('%d/%m/%Y')
        
        return score_dict

    # Tüm yardımcı fonksiyonları şablonlarda kullanılabilir hale getir
    return dict(
        get_current_user=get_current_user,
        get_user_data=get_user_data,
        get_avatar_url=get_avatar_url,
        get_user_scores=get_user_scores,
        calculate_level=calculate_level,
        xp_for_level=xp_for_level
    )

# Database initialization function
def initialize_database():
    """Initialize the database with sample data"""

    # Create sample articles
    if Article.query.count() == 0:
        articles = [
            Article(
                title="ZekaPark'a Hoş Geldiniz",
                content="""
                <p>ZekaPark, beyninizi çalıştıracak ve bilişsel yeteneklerinizi geliştirecek bir platform olarak tasarlanmıştır.</p>
                <p>Burada bulacağınız mini oyunlar ve bulmacalar; hafıza, mantık, dikkat ve problem çözme yeteneklerinizi geliştirmenize yardımcı olacaktır.</p>
                <p>Yeni özellikler ve içerikler düzenli olarak eklenecektir, bizi takip etmeye devam edin!</p>
                """,
                category="article"
            ),
            Article(
                title="Beyin Egzersizlerinin Faydaları",
                content="""
                <p>Düzenli beyin egzersizleri yapmanın birçok faydası vardır:</p>
                <ul>
                    <li>Hafızanızı güçlendirir</li>
                    <li>Odaklanma yeteneğinizi artırır</li>
                    <li>Problem çözme becerilerinizi geliştirir</li>
                    <li>Yaratıcılığınızı tetikler</li>
                    <li>Yaşla birlikte oluşabilecek bilişsel gerilemeyi yavaşlatır</li>
                </ul>
                <p>ZekaPark'taki oyunları düzenli olarak oynayarak bu faydaları elde edebilirsiniz.</p>
                """,
                category="article"
            ),
            Article(
                title="Nöroplastisite ve Beyin Gelişimi",
                content="""
                <h3>Beynin Kendini Yenileme Gücü</h3>
                <p>Nöroplastisite, beynin yaşam boyu kendini yenileme ve yeniden yapılandırma yeteneğidir. Bu, yeni nöral bağlantılar oluşturarak ve mevcut olanları güçlendirerek gerçekleşir.</p>
                <p>Temel nöroplastisite prensipleri:</p>
                <ul>
                    <li><strong>Kullan ya da Kaybet:</strong> Kullanılmayan beyin bölgeleri zayıflarken, aktif olarak kullanılanlar güçlenir.</li>
                    <li><strong>Yoğunluk Önemlidir:</strong> Düzenli ve yoğun pratik, beyin bağlantılarını daha hızlı güçlendirir.</li>
                    <li><strong>Zorluk Seviyesi:</strong> Mevcut beceri seviyenizin biraz üzerinde çalışmak, beyin gelişimini en üst düzeye çıkarır.</li>
                    <li><strong>Çeşitlilik:</strong> Farklı beyin alanlarını çalıştıran çeşitli aktiviteler, genel bilişsel sağlık için önemlidir.</li>
                </ul>
                <p>ZekaPark'taki farklı oyun türleri, nöroplastisiteyi desteklemek ve beyninizin farklı bölgelerini aktif tutmak için özel olarak tasarlanmıştır.</p>
                """,
                category="article"
            ),
            Article(
                title="Bilişsel Rezerv Nedir ve Nasıl Geliştirilir?",
                content="""
                <h3>Zihinsel Sağlığınız İçin Bilişsel Rezerv</h3>
                <p>Bilişsel rezerv, beynin yaşlanma ve hastalık etkilerine karşı koruyucu bir tampon görevi gören zihinsel kapasitedir. Yaş ilerledikçe ve hatta Alzheimer gibi hastalıklar gelişse bile, daha yüksek bilişsel rezerve sahip kişiler daha iyi bilişsel işleyiş gösterebilir.</p>

                <h4>Bilişsel rezervi geliştirmek için:</h4>
                <ul>
                    <li><strong>Sürekli Öğrenme:</strong> Yeni beceriler edinmek, dil öğrenmek veya bir enstrüman çalmak beyin bağlantılarını zenginleştirir.</li>
                    <li><strong>Zihinsel Zorluklar:</strong> Bulmacalar, strateji oyunları ve diğer zihinsel meydan okumalar beyni aktif tutar.</li>
                    <li><strong>Sosyal Etkileşim:</strong> Sosyal ilişkiler beyin sağlığını destekler ve yalnızlığın olumsuz etkilerini azaltır.</li>
                    <li><strong>Fiziksel Egzersiz:</strong> Düzenli egzersiz, beyne kan akışını artırır ve hafıza ile öğrenmeyi geliştiren nörotrofinleri uyarır.</li>
                    <li><strong>Kaliteli Uyku:</strong> Yeterli uyku, hafızanın pekiştirilmesi ve beyin toksinlerinin temizlenmesi için gereklidir.</li>
                </ul>
                <p>ZekaPark'ta düzenli bilişsel alıştırmalar yaparak bilişsel rezervinizi güçlendirebilirsiniz.</p>
                """,
                category="article"
            ),
            Article(
                title="Beyin Gücünü En Üst Düzeye Çıkaran Beslenme Stratejileri",
                content="""
                <h3>Beyniniz İçin Süper Yakıtlar</h3>
                <p>Beyin, vücudun en aktif organlarından biridir ve tüm enerjimizin yaklaşık %20'sini tüketir. Doğru beslenme, optimal beyin performansı için hayati öneme sahiptir.</p>

                <h4>Beyin sağlığını destekleyen besinler:</h4>
                <ul>
                    <li><strong>Yağlı Balıklar:</strong> Somon, sardalya ve uskumru gibi balıklar, beyin hücresi zarlarının yapı taşı olan omega-3 yağ asitleri açısından zengindir.</li>
                    <li><strong>Fındık ve Tohumlar:</strong> Ceviz, badem ve keten tohumu gibi besinler E vitamini, antioksidanlar ve sağlıklı yağlar içerir.</li>
                    <li><strong>Koyu Yeşil Yapraklı Sebzeler:</strong> Ispanak ve lahana gibi sebzeler, beyin fonksiyonu için önemli olan folat, E vitamini ve K vitamini içerir.</li>
                    <li><strong>Yaban Mersini ve Diğer Meyveler:</strong> Antioksidanlarla dolu olan bu meyveler, beyin hücrelerini oksidatif stresten korur.</li>
                    <li><strong>Tam Tahıllar:</strong> Kompleks karbonhidratlar, beyninize sabit bir enerji kaynağı sağlar.</li>
                    <li><strong>Zerdeçal ve Tarçın:</strong> Bu baharatlar güçlü anti-enflamatuar özelliklere sahiptir ve nöron sağlığını destekleyebilir.</li>
                    <li><strong>Koyu Çikolata:</strong> Flavonoidler içeren koyu çikolata, beyin kan akışını artırabilir.</li>
                </ul>
                <p>Beyninizi beslemek için bu besinleri düzenli olarak tüketmeyi ve işlenmiş gıdaları, rafine şekerleri ve trans yağları sınırlandırmayı hedefleyin.</p>
                """,
                category="article"
            ),
            Article(
                title="Stresin Beyin Üzerindeki Etkileri ve Yönetimi",
                content="""
                <h3>Stres ve Bilişsel Performans</h3>
                <p>Kısa süreli stres, odaklanmayı ve performansı artırabilirken, kronik stres beyin yapısını ve işlevini olumsuz etkileyebilir.</p>

                <h4>Kronik stresin beyin üzerindeki etkileri:</h4>
                <ul>
                    <li>Hipokampusta (hafıza merkezi) hacim kaybı</li>
                    <li>Nöron bağlantılarının azalması</li>
                    <li>Kortizon seviyelerinin yükselmesi ve hafıza üzerinde olumsuz etki</li>
                    <li>Beyin kimyasalları dengesi üzerinde bozucu etki</li>
                    <li>Prefrontal korteksin (karar verme merkezi) işlevinde azalma</li>
                </ul>

                <h4>Stres yönetimi teknikleri:</h4>
                <ul>
                    <li><strong>Derin Nefes Egzersizleri:</strong> Günde birkaç dakika derin nefes alıp vermek, sempatik sinir sistemini sakinleştirebilir.</li>
                    <li><strong>Meditasyon ve Mindfulness:</strong> Bu pratikler, beynin stres tepkisini düzenleyen bölgelerini güçlendirir.</li>
                    <li><strong>Düzenli Fiziksel Aktivite:</strong> Egzersiz, stresi azaltan endorfinlerin salınımını tetikler.</li>
                    <li><strong>Yeterli Uyku:</strong> Kaliteli uyku, stres hormonlarını düzenler ve duygusal dengeyi destekler.</li>
                    <li><strong>Sosyal Bağlantılar:</strong> Destekleyici ilişkiler, stres tepkilerini hafifletebilir.</li>
                    <li><strong>Eğlenceli Aktiviteler:</strong> ZekaPark'taki beyin oyunları gibi eğlenceli aktiviteler, zihinsel molanın bir formudur ve stresi azaltabilir.</li>
                </ul>
                <p>Düzenli stres yönetimi, bilişsel sağlığınızı korumanın ve ZekaPark oyunlarında optimal performans göstermenin anahtarıdır.</p>
                """,
                category="article"
            ),
            Article(
                title="Daha İyi Konsantrasyon İçin İpuçları",
                content="""
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
                title="Zihinsel Dayanıklılık Geliştirme",
                content="""
                <h3>Zorluklarla Başa Çıkma Kapasitesini Artırmak</h3>
                <p>Zihinsel dayanıklılık, bilişsel zorluklarla karşılaştığınızda pes etmeden devam etme yeteneğidir. Bu özellik, tüm beyin egzersizlerinde ve gerçek yaşam zorluklarında başarı için kritiktir.</p>

                <h4>Zihinsel dayanıklılığı geliştirme stratejileri:</h4>
                <ul>
                    <li><strong>Zorluk Seviyesini Kademeli Artırın:</strong> Kendinizi konfor alanınızın biraz dışına çıkaran, ama tamamen bunaltmayan zorluklarla düzenli olarak meydan okuyun.</li>
                    <li><strong>Hatalardan Öğrenin:</strong> Her başarısızlığı öğrenme fırsatı olarak görün ve neyin işe yaramadığını analiz edin.</li>
                    <li><strong>Olumlu İç Konuşma:</strong> Kendinizle konuşma şeklinize dikkat edin. "Yapamam" yerine "Henüz yapamıyorum, ama pratikle gelişeceğim" demeyi deneyin.</li>
                    <li><strong>Mikro-Hedefler Belirleyin:</strong> Büyük zorlukları daha küçük, ulaşılabilir adımlara bölün.</li>
                    <li><strong>Başarılarınızı Takdir Edin:</strong> Küçük ilerlemeleri bile kutlayın ve kendinizi düzenli olarak ödüllendirin.</li>
                </ul>
                <p>ZekaPark'taki oyunları oynarken, zor bölümlerde pes etmeyip stratejinizi ayarlayarak zihinsel dayanıklılığınızı geliştirebilirsiniz. Bu yetenek zamanla gelişir ve günlük yaşamınızdaki engelleri aşmanıza da yardımcı olur.</p>
                """,
                category="tip"
            ),
            Article(
                title="Bilişsel Egzersizlerde İlerleme İzleme",
                content="""
                <h3>Gelişiminizi Ölçme ve Optimize Etme</h3>
                <p>Bilişsel egzersizlerden maksimum faydayı sağlamak için ilerlemenizi izlemek ve pratiklerinizi buna göre ayarlamak önemlidir.</p>

                <h4>Etkili ilerleme izleme yöntemleri:</h4>
                <ul>
                    <li><strong>Tutarlı Ölçümler:</strong> ZekaPark'taki oyun skorlarınızı düzenli olarak takip edin. Puanlarınızdaki artış, bilişsel performansınızın geliştiğini gösterir.</li>
                    <li><strong>Zorluk Seviyesini Ayarlama:</strong> Skorlarınız yükseldiğinde zorluk seviyesini artırın, ancak sürekli başarısızlık yaşıyorsanız geçici olarak daha basit seviyelere dönün.</li>
                    <li><strong>Çeşitli Becerileri Dengeleme:</strong> Tüm bilişsel alanları geliştirmek için farklı oyun türlerinde pratik yapın ve hangilerinde daha çok gelişmeye ihtiyacınız olduğunu belirleyin.</li>
                    <li><strong>Günlük Tutma:</strong> Her seanstan sonra nasıl hissettiğinizi, ne kadar süre oynadığınızı ve karşılaştığınız zorlukları not edin.</li>
                    <li><strong>Platoları Tanıma:</strong> İlerlemeniz durduğunda, farklı stratejiler deneyin veya geçici olarak başka bir oyun türüne geçin.</li>
                </ul>
                <p>ZekaPark profilinizde görüntülenen istatistikler, gelişiminizi izlemeniz ve egzersiz rejiminizi optimize etmeniz için güçlü bir araçtır.</p>
                """,
                category="tip"
            ),
            Article(
                title="Kelime Bulmaca İpuçları",
                content="""
                <h3>Kelime Bulmaca oyununda başarılı olmak için ipuçları:</h3>
                <ol>
                    <li>İpucu metnini dikkatlice okuyun ve anahtar kelimelere odaklanın.</li>
                    <li>Harflerin sayısını dikkate alın ve buna göre muhtemel cevapları düşünün.</li>
                    <li>Bilemediğiniz sorularda "Pas Geç" seçeneğini kullanarak zaman kaybetmeyin.</li>
                    <li>Türkçe'de en sık kullanılan harfleri (e, a, i, n, r, s, t) düşünerek tahminlerde bulunun.</li>
                    <li>Zamanınızı akıllıca kullanın - hızlı ama dikkatlice düşünün.</li>
                </ol>
                <p>Düzenli pratik yaparak kelime haznenizi ve bulmaca çözme becerilerinizi geliştirebilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Etkili Hafıza Eşleştirme Stratejileri",
                content="""
                <h3>Hafıza Eşleştirme oyununda daha iyi performans için:</h3>
                <ul>
                    <li>Oyun başladığında, tüm kartlara kısaca göz atın ve konumlarını hafızanıza almaya çalışın.</li>
                    <li>Stratejik olarak ilerleyin - rastgele kart açmak yerine belirli bir düzen takip edin.</li>
                    <li>Açtığınız her kartın konumunu hafızanızda tutmaya çalışın.</li>
                    <li>İlk turdaki amacınız mümkün olduğunca çok kartı görüntülemek olmalıdır.</li>
                    <li>Görsel çağrışımlar yaratarak kartların konumlarını daha kolay hatırlayabilirsiniz.</li>
                </ul>
                <p>Beyin, desenler ve bağlantılar üzerinden daha kolay öğrenir. Bu stratejileri kullanarak hafıza kapasitenizi artırabilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Bilişsel Esnekliği Geliştirme",
                content="""
                <h3>Zihinsel Çeviklik İçin Stratejiler</h3>
                <p>Bilişsel esneklik, düşünce ve stratejilerinizi değişen durumlara uyarlama yeteneğidir. Bu beceri, problem çözme, yaratıcılık ve değişimle başa çıkma için kritik öneme sahiptir.</p>

                <h4>Bilişsel esnekliği geliştirme yolları:</h4>
                <ul>
                    <li><strong>Farklı Stratejiler Deneyin:</strong> ZekaPark oyunlarında aynı seviyeyi tamamlamak için çeşitli yaklaşımlar kullanın.</li>
                    <li><strong>Düzenli Olarak Yeni Şeyler Öğrenin:</strong> Beyninizi yeni bilgileri işlemeye ve entegre etmeye zorlayın.</li>
                    <li><strong>Konfor Alanınızdan Çıkın:</strong> Alışık olmadığınız zorlukları kabul edin ve yeni yollar denemeye istekli olun.</li>
                    <li><strong>Perspektif Değiştirin:</strong> Bir probleme farklı açılardan bakmayı alışkanlık haline getirin.</li>
                    <li><strong>Rutinlerinizi Değiştirin:</strong> Günlük alışkanlıklarınızda küçük değişiklikler yaparak beyninizi uyanık tutun.</li>
                </ul>
                <p>ZekaPark'taki farklı oyun türleri arasında düzenli olarak geçiş yapmak, bilişsel esnekliğinizi güçlendirmenin etkili bir yoludur. Bu esneklik, günlük yaşamda daha iyi uyum sağlamanıza ve problem çözmede daha yaratıcı olmanıza yardımcı olur.</p>
                """,
                category="tip"
            ),
            Article(
                title="Labirent Oyununda Başarılı Olma Taktikleri",
                content="""
                <h3>Labirent oyununda zorlanıyor musunuz? Bu taktikleri deneyin:</h3>
                <ol>
                    <li><strong>Sağ El Kuralı:</strong> Labirentte ilerlerken sürekli sağ (veya sol) duvarı takip edin.</li>
                    <li><strong>Zihinsel Harita:</strong> İlerledikçe labirentin zihinsel bir haritasını oluşturmaya çalışın.</li>
                    <li><strong>Çıkmaz Sokakları İşaretleyin:</strong> Zihinsel olarak, daha önce denediğiniz ve çıkmaz olan yolları işaretleyin.</li>
                    <li><strong>Sistematik Yaklaşın:</strong> Rastgele hareket etmek yerine, sistematik bir yaklaşım benimseyin.</li>
                    <li><strong>Sabırlı Olun:</strong> Labirent çözmek hız değil, strateji gerektirir.</li>
                </ol>
                <p>Bu taktikleri uygulayarak labirentleri daha hızlı ve etkili bir şekilde çözebilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Beyin Egzersizlerinde Tutarlılığın Önemi",
                content="""
                <h3>Düzenli Pratik, Kalıcı Kazanımlar</h3>
                <p>Beyni güçlendirmek vücut geliştirmeye benzer - tek bir yoğun egzersiz değil, düzenli ve tutarlı pratik en iyi sonuçları verir.</p>

                <h4>Etkili bir bilişsel antrenman rutini oluşturmak için:</h4>
                <ul>
                    <li><strong>Günlük Alışkanlık Geliştirin:</strong> Her gün belirli bir zamanda kısa bile olsa beyin egzersizleri yapmak, uzun vadeli gelişim için kritiktir.</li>
                    <li><strong>Süreyi Kademeli Olarak Artırın:</strong> Başlangıçta günde 5-10 dakika ile başlayın, zamanla bu süreyi artırın.</li>
                    <li><strong>Denge Kurun:</strong> Hafıza, dikkat, problem çözme ve mantıksal düşünme dahil farklı bilişsel becerileri çalıştırın.</li>
                    <li><strong>İlerlemenizi İzleyin:</strong> Düzenli olarak performansınızı kaydedin, böylece gelişiminizi görebilirsiniz.</li>
                    <li><strong>"Hepsini Birden" Yaklaşımından Kaçının:</strong> Bir günde saatlerce pratik yapmak yerine, düzenli kısa seanslar tercih edin.</li>
                </ul>
                <p>ZekaPark'ta günlük oturum hedefleri belirlemek ve bunları takip etmek, bilişsel gelişiminizi hızlandırabilir ve beyin sağlığınıza uzun vadeli yatırım yapmanızı sağlar.</p>
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
            age=30,
            bio="Sistem yöneticisi",
            rank="Yönetici",
            experience_points=5000
        )

        # Ek test kullanıcıları
        user1 = User(
            username="mehmet",
            email="mehmet@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Mehmet Yılmaz",
            age=25,
            bio="Bilgisayar mühendisi",
            rank="İlerleyen",
            experience_points=12500
        )

        user2 = User(
            username="ayse",
            email="ayse@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Ayşe Demir",
            age=29,
            bio="Matematik öğretmeni",
            rank="Usta",
            experience_points=18700
        )

        user3 = User(
            username="emin",
            email="emin@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Emin Kaya",
            age=22,
            bio="Bilgisayar bilimi öğrencisi",
            rank="Acemi",
            experience_points=8200
        )

        db.session.add_all([admin, user1, user2, user3])
        db.session.commit()

        # Test kullanıcıları için örnek skorlar ekle
        scores = [
            # Mehmet'in skorları
            Score(user_id=2, game_type="wordPuzzle", score=1200),
            Score(user_id=2, game_type="memoryMatch", score=1800),
            Score(user_id=2, game_type="labyrinth", score=950),
            Score(user_id=2, game_type="puzzle", score=2200),

            # Ayşe'nin skorları
            Score(user_id=3, game_type="wordPuzzle", score=1500),
            Score(user_id=3, game_type="memoryMatch", score=2100),
            Score(user_id=3, game_type="labyrinth", score=1100),
            Score(user_id=3, game_type="puzzle", score=2500),

            # Emin'in skorları
            Score(user_id=4, game_type="wordPuzzle", score=900),
            Score(user_id=4, game_type="memoryMatch", score=1300),
            Score(user_id=4, game_type="labyrinth", score=700),
            Score(user_id=4, game_type="puzzle", score=1800),
        ]

        db.session.add_all(scores)
        db.session.commit()

        logger.info("Admin ve test kullanıcıları oluşturuldu")

# Init database route
@app.route('/init-db')
def init_db_route():
    initialize_database()
    return 'Database initialized'

# Routes for main pages
@app.route('/')
def index():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('index.html', user=user, current_user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash('Lütfen email ve şifrenizi girin.', 'danger')
            return redirect(url_for('login'))

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password_hash, password):
            flash('Geçersiz email veya şifre.', 'danger')
            return redirect(url_for('login'))

        # Kullanıcı oturum bilgilerini kaydet
        session['user_id'] = user.id
        session['username'] = user.username

        # Avatar URL'sini session'a kaydet
        if user.avatar_url:
            session['avatar_url'] = user.avatar_url
        else:
            session['avatar_url'] = 'images/default-avatar.png'

        flash('Başarıyla giriş yaptınız!', 'success')
        return redirect(url_for('index'))

    if session.get('user_id'):
        return redirect(url_for('index'))

    return render_template('login.html')

# Profile routes have been removed from the application

# Game routes
@app.route('/games/3d-labyrinth')
def three_d_labyrinth():
    return render_template('games/3dLabyrinth.html')

@app.route('/games/word-puzzle')
def word_puzzle():
    return render_template('games/wordPuzzle.html')

@app.route('/games/memory-match')
def memory_match():
    return render_template('games/memoryMatch.html')

@app.route('/games/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

@app.route('/games/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

# Removed Visual Attention game as requested
# @app.route('/games/visual-attention')
# def visual_attention():
#     return render_template('games/visualAttention.html')

@app.route('/games/number-sequence')
def number_sequence():
    return render_template('games/numberSequence.html')

# Yeni Hafıza Güçlendirme Oyunları
# Route for "Kim Nerede?" game has been removed

@app.route('/games/memory-cards')
def memory_cards():
    return render_template('games/memoryCards.html')

@app.route('/games/number-chain')
def number_chain():
    return render_template('games/numberChain.html')

@app.route('/games/audio-memory')
def audio_memory():
    flash('Sesli Hafıza Oyunu şu anda geliştirme aşamasındadır ve yakında yenilenmiş haliyle geri dönecektir.', 'info')
    return render_template('games/audioMemory.html')

@app.route('/games/n-back')
def n_back():
    return render_template('games/nBack.html')

# Yeni IQ Geliştirme Oyunları
# Removed routes for IQ development games

# Tüm Oyunlar Sayfası
@app.route('/all-games')
def all_games():
    return render_template('all_games.html')

# Skor Tablosu
@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

# Articles
@app.route('/articles')
def articles():
    articles = Article.query.filter_by(category='article').all()
    return render_template('articles.html', articles=articles)

# Tips
@app.route('/tips')
def tips():
    tips = Article.query.filter_by(category='tip').all()
    return render_template('tips.html', tips=tips)

# User management routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        if not username or not email or not password:
            flash('Tüm alanları doldurunuz.')
            return redirect(url_for('register'))

        # Email validation
        if not '@' in email or not '.' in email:
            flash('Geçerli bir email adresi giriniz.')
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
    # Basit bir XP hesaplama formülü: 1000 * level * (level + 1) / 2
    return int(1000 * level * (level + 1) / 2)

def calculate_level(xp):
    """Toplam XP'ye göre kullanıcı seviyesini hesaplar."""
    # Seviye 1 için gereken minimum XP: 0
    if xp < 1000:
        return 1
    
    # Quadratic formülü çözerek seviyeyi hesaplama
    # n^2 + n - (2*xp/1000) = 0 formülünden n'yi çözümle
    a = 1
    b = 1
    c = -2 * xp / 1000
    
    # Quadratic formülü kullanarak pozitif değeri bul: (-b + sqrt(b^2 - 4ac)) / 2a
    import math
    level = (-b + math.sqrt(b*b - 4*a*c)) / (2*a)
    
    # Tamsayıya yuvarla (aşağı)
    return int(level)

def xp_for_level(level):
    """Belirli bir seviyeye ulaşmak için gereken XP miktarını hesaplar."""
    # Seviye 1 için XP: 0
    if level <= 1:
        return 0
    
    # Formül: level * (level - 1) * 500
    return int(level * (level - 1) * 500)

def get_user_scores():
    """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
    if 'user_id' not in session:
        return {}
    
    user_id = session['user_id']
    
    # Kullanıcının tüm oyun skorlarını al
    scores = Score.query.filter_by(user_id=user_id).all()
    
    # Her oyun türü için en yüksek skoru bul
    score_dict = {}
    for score in scores:
        game_type = score.game_type
        if game_type not in score_dict or score.score > score_dict[game_type]:
            score_dict[game_type] = score.score
            # Son oyun tarihini de ekle
            score_dict[f"{game_type}_date"] = score.timestamp.strftime('%d/%m/%Y')
    
    return score_dict

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
    
    # Kullanıcının seviyesini ve gereken XP miktarlarını hesapla
    # calculate_level fonksiyonunu doğrudan çağırmak yerine rank hesaplamasını kendimiz yapalım
    # Seviye 1 için gereken minimum XP: 0
    user_xp = user.experience_points or 0
    if user_xp < 1000:
        current_level = 1
    else:
        # Quadratic formülü çözerek seviyeyi hesaplama
        # n^2 + n - (2*xp/1000) = 0 formülünden n'yi çözümle
        import math
        a = 1
        b = 1
        c = -2 * user_xp / 1000
        
        # Quadratic formülü kullanarak pozitif değeri bul: (-b + sqrt(b^2 - 4ac)) / 2a
        current_level = int((-b + math.sqrt(b*b - 4*a*c)) / (2*a))
    
    xp_for_current = xp_for_level(current_level)
    xp_for_next = xp_for_level(current_level + 1)
    
    # Yeni profil sayfasını render et
    return render_template(
        'profile_v2.html',
        user=user,
        game_scores=game_scores,
        calculate_level=calculate_level,
        xp_for_level=xp_for_level,
        current_level=current_level,
        xp_for_current=xp_for_current,
        xp_for_next=xp_for_next
    )

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Profil bilgilerini güncelleme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    username = request.form.get('username')
    email = request.form.get('email')
    full_name = request.form.get('full_name')
    bio = request.form.get('bio')
    
    # Kullanıcı adı kontrol - mevcut kullanıcı hariç
    if username != user.username and User.query.filter_by(username=username).first():
        flash('Bu kullanıcı adı zaten kullanılıyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # E-posta kontrol - mevcut kullanıcı hariç
    if email != user.email and User.query.filter_by(email=email).first():
        flash('Bu e-posta adresi zaten kullanılıyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Kullanıcı bilgilerini güncelle
    user.username = username
    user.email = email
    user.full_name = full_name
    user.bio = bio
    
    # Session'daki kullanıcı adını da güncelle
    session['username'] = username
    
    try:
        db.session.commit()
        flash('Profil bilgileriniz başarıyla güncellendi.', 'success')
    except:
        db.session.rollback()
        flash('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return redirect(url_for('profile_v2'))

@app.route('/update-avatar', methods=['POST'])
def update_avatar():
    """Profil fotoğrafını güncelleme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Avatar yüklendi mi kontrol et
    if 'avatar' not in request.files:
        flash('Profil fotoğrafı yüklenirken bir hata oluştu.', 'danger')
        return redirect(url_for('profile_v2'))
    
    file = request.files['avatar']
    
    # Dosya seçilmedi ise
    if file.filename == '':
        flash('Lütfen bir dosya seçin.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Güvenli dosya ismi oluştur
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            # Benzersiz isim üretmek için timestamp ekle
            unique_filename = f"{user.id}_{int(time.time())}_{filename}"
            filepath = os.path.join('static/uploads/avatars', unique_filename)
            
            # Dizin yoksa oluştur
            os.makedirs('static/uploads/avatars', exist_ok=True)
            
            # Dosyayı kaydet
            file.save(filepath)
            
            # Kullanıcının avatar_url'sini güncelle
            user.avatar_url = f'uploads/avatars/{unique_filename}'
            session['avatar_url'] = user.avatar_url
            
            db.session.commit()
            flash('Profil fotoğrafınız başarıyla güncellendi.', 'success')
        except Exception as e:
            db.session.rollback()
            logger.error(f"Avatar upload error: {e}")
            flash('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    else:
        flash('İzin verilen dosya formatları: png, jpg, jpeg, gif', 'danger')
    
    return redirect(url_for('profile_v2'))

@app.route('/change-password', methods=['POST'])
def change_password():
    """Şifre değiştirme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Mevcut şifreyi kontrol et
    if not check_password_hash(user.password_hash, current_password):
        flash('Mevcut şifreniz yanlış.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Yeni şifre doğrulama
    if new_password != confirm_password:
        flash('Yeni şifreler eşleşmiyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    if len(new_password) < 6:
        flash('Yeni şifre en az 6 karakter olmalıdır.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Şifreyi güncelle
    user.password_hash = generate_password_hash(new_password)
    
    try:
        db.session.commit()
        flash('Şifreniz başarıyla değiştirildi.', 'success')
    except:
        db.session.rollback()
        flash('Şifre değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return redirect(url_for('profile_v2'))

@app.route('/update-security-settings', methods=['POST'])
def update_security_settings():
    """Güvenlik ayarlarını güncelleme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Form verilerini al
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Mevcut şifreyi kontrol et
    if not check_password_hash(user.password_hash, current_password):
        flash('Mevcut şifreniz yanlış.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Yeni şifre doğrulama
    if new_password != confirm_password:
        flash('Yeni şifreler eşleşmiyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    if len(new_password) < 6:
        flash('Yeni şifre en az 6 karakter olmalıdır.', 'danger')
        return redirect(url_for('profile_v2'))
    
    # Şifreyi güncelle
    user.password_hash = generate_password_hash(new_password)
    
    try:
        db.session.commit()
        flash('Güvenlik ayarlarınız başarıyla güncellendi.', 'success')
    except:
        db.session.rollback()
        flash('Güvenlik ayarları güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
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
    email_notifications = 'email_notifications' in request.form
    achievement_notifications = 'achievement_notifications' in request.form
    leaderboard_notifications = 'leaderboard_notifications' in request.form
    
    # Kullanıcı modelinde bu alanlar yoksa eklemeli veya farklı bir yaklaşım kullanmalıyız
    # Bu örnekte varsayalım ki User modelinde bu alanlar var:
    try:
        user.email_notifications = email_notifications
        user.achievement_notifications = achievement_notifications
        user.leaderboard_notifications = leaderboard_notifications
        
        db.session.commit()
        flash('Bildirim ayarlarınız başarıyla güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Notification settings update error: {e}")
        flash('Bildirim ayarları güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return redirect(url_for('profile_v2'))

@app.route('/update-theme', methods=['POST'])
def update_theme():
    """Tema tercihini güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Giriş yapmamış kullanıcı'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı'})
    
    data = request.json
    theme = data.get('theme', 'dark')
    
    try:
        user.theme_preference = theme
        db.session.commit()
        return jsonify({'success': True, 'theme': theme})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Theme update error: {e}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/delete-account', methods=['POST'])
def delete_account():
    """Hesabı silme."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Şifre ve onay kontrolü
    password = request.form.get('password')
    confirm_delete = request.form.get('confirm_delete') == 'on'
    
    if not check_password_hash(user.password_hash, password):
        flash('Şifreniz yanlış.', 'danger')
        return redirect(url_for('profile_v2'))
    
    if not confirm_delete:
        flash('Hesap silme işlemini onaylamanız gerekiyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    try:
        # Kullanıcıya ait tüm skorları sil
        Score.query.filter_by(user_id=user.id).delete()
        
        # Kullanıcıyı sil
        db.session.delete(user)
        db.session.commit()
        
        # Oturumu temizle
        session.clear()
        
        flash('Hesabınız başarıyla silindi.', 'success')
        return redirect(url_for('index'))
    except Exception as e:
        db.session.rollback()
        logger.error(f"Account deletion error: {e}")
        flash('Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
        return redirect(url_for('profile_v2'))

@app.route('/suspend-account', methods=['POST'])
def suspend_account():
    """Hesabı dondurma."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    # Şifre ve onay kontrolü
    password = request.form.get('password')
    confirm_suspend = request.form.get('confirm_suspend') == 'on'
    
    if not check_password_hash(user.password_hash, password):
        flash('Şifreniz yanlış.', 'danger')
        return redirect(url_for('profile_v2'))
    
    if not confirm_suspend:
        flash('Hesap dondurma işlemini onaylamanız gerekiyor.', 'danger')
        return redirect(url_for('profile_v2'))
    
    try:
        # Hesabı dondur - 30 gün sonrası için tarih hesapla
        suspended_until = datetime.utcnow() + timedelta(days=30)
        user.account_status = 'suspended'
        user.suspended_until = suspended_until
        
        db.session.commit()
        
        # Oturumu temizle
        session.clear()
        
        flash('Hesabınız 30 gün boyunca donduruldu. Bu süre sonunda tekrar giriş yapabilirsiniz.', 'info')
        return redirect(url_for('index'))
    except Exception as e:
        db.session.rollback()
        logger.error(f"Account suspension error: {e}")
        flash('Hesap dondurulurken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
        return redirect(url_for('profile_v2'))

# Password reset routes
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()

        if not user:
            flash('Bu email adresi ile kayıtlı bir kullanıcı bulunamadı.', 'danger')
            return redirect(url_for('forgot_password'))

        # Generate a random 4-digit verification code
        verification_code = ''.join(random.choices('0123456789', k=4))
        token_expiry = datetime.utcnow() + timedelta(minutes=30)  # Token valid for 30 minutes

        # Save the verification code and expiry in the user's record
        user.reset_token = verification_code
        user.reset_token_expiry = token_expiry
        db.session.commit()

        # Try to send the verification code via email
        # For security purposes, we don't reveal if email exists or not
        try:
            # Even if we can't send email, show success message but log the code for testing
            logger.info(f"Password reset code for {email}: {verification_code}")

            # Try to send email
            send_verification_email(email, verification_code)

            # Always show success message to prevent email enumeration attacks
            flash('Doğrulama kodu email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')

            # In development mode, also show the code on screen
            if app.debug:
                flash(f'TEST MODU - Doğrulama kodunuz: {verification_code}', 'info')
        except Exception as e:
            # Still log the error but don't tell the user
            logger.error(f"Error sending email: {e}")

            # Show success message anyway for security
            flash('Doğrulama kodu email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')

            # In development mode, show code and error
            if app.debug:
                flash(f'TEST MODU - Doğrulama kodunuz: {verification_code}', 'info')
                flash(f'E-posta gönderme hatası (yalnızca geliştirme): {str(e)}', 'warning')

        # Redirect to the verification code page
        return redirect(url_for('reset_code', email=email))

    email = request.args.get('email', '')
    return render_template('forgot_password.html', email=email)

@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    email = request.args.get('email', '')
    if not email and request.method == 'POST':
        email = request.form.get('email', '')

    if not email:
        flash('Email adresi belirtilmedi.', 'danger')
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        # Debug: log form data
        logger.debug(f"Reset code form data: {request.form}")

        # İki farklı form parametresi kontrolü
        verification_code = request.form.get('verification_code', '')

        if not verification_code:
            # Try to get individual digits and combine them
            code_parts = []
            for i in range(1, 5):
                digit = request.form.get(f'code{i}', '')
                if not digit:
                    break
                code_parts.append(digit)

            if len(code_parts) == 4:
                verification_code = ''.join(code_parts)

        user = User.query.filter_by(email=email).first()

        if not user:
            flash('Geçersiz email adresi.', 'danger')
            return redirect(url_for('forgot_password'))

        # Debug: log verification details
        logger.debug(f"Verification attempt: code={verification_code}, user_token={user.reset_token}")

        if not user.reset_token or user.reset_token != verification_code:
            flash('Geçersiz doğrulama kodu.', 'danger')
            return render_template('reset_code.html', email=email)

        if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
            flash('Doğrulama kodunun süresi doldu. Lütfen yeni bir kod talep edin.', 'danger')
            return redirect(url_for('forgot_password'))

        try:
            # Generate a secure token for the password reset page
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = reset_token
            user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)  # Token valid for 15 minutes
            db.session.commit()

            return redirect(url_for('reset_password', email=email, token=reset_token))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error generating reset token: {e}")
            flash('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
            return redirect(url_for('forgot_password'))

    return render_template('reset_code.html', email=email)

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email', '')
    token = request.args.get('token', '')

    if request.method == 'POST':
        email = request.form.get('email', '')
        token = request.form.get('token', '')

        # Debug: Print form data
        logger.debug(f"Reset password form data: {request.form}")

    if not email or not token:
        flash('Geçersiz istek. Email veya token eksik.', 'danger')
        logger.error(f"Invalid reset request: email={email}, token={token}")
        return redirect(url_for('login'))

    user = User.query.filter_by(email=email, reset_token=token).first()

    if not user:
        flash('Geçersiz link. Lütfen şifre sıfırlama sürecini tekrar başlatın.', 'danger')
        logger.error(f"User not found for reset: email={email}, token={token}")
        return redirect(url_for('forgot_password'))

    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        flash('Şifre sıfırlama linkinin süresi doldu. Lütfen tekrar deneyin.', 'danger')
        logger.error(f"Token expired for user: {user.email}")
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not password or len(password) < 6:
            flash('Şifre en az 6 karakter uzunluğunda olmalıdır.', 'danger')
            return render_template('reset_password.html', email=email, token=token)

        if password != confirm_password:
            flash('Şifreler eşleşmiyor.', 'danger')
            return render_template('reset_password.html', email=email, token=token)

        try:
            # Update password
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()

            flash('Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating password: {e}")
            flash('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')

    return render_template('reset_password.html', email=email, token=token)

# API routes for game scores
@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json

    # Use anonymous user or a session-based temporary user if not logged in
    user_id = session.get('user_id')

    # Kullanıcı giriş yapmamışsa
    if not user_id:
        # Skorları kaydetmeyi devre dışı bırak ve kullanıcıya bildir
        return jsonify({
            'success': False, 
            'message': 'Login required',
            'score': data.get('score', 0)
        })

    # Kullanıcı bilgilerini getir
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'})

    # game_type parametresini kontrol et (hem game_type hem de gameType'ı destekle)
    game_type = data.get('game_type', data.get('gameType', None))
    if not game_type:
        return jsonify({'success': False, 'message': 'Game type not provided'})

    # XP ve seviye hesaplamaları için değerler
    original_level = user.experience_points // 1000 + 1
    xp_gain = min(data['score'] // 10, 100)  # Her 10 puan 1 XP, maksimum 100 XP

    from sqlalchemy import func
    
    is_high_score = False

    # Her oyun için yeni bir skor kaydı oluştur
    new_score = Score(
        user_id=user_id,
        game_type=game_type,
        score=data['score']
    )

    db.session.add(new_score)

    # Kullanıcının bu oyun için en yüksek skorunu bul
    highest_game_score = db.session.query(func.max(Score.score)).filter_by(
        user_id=user_id,
        game_type=game_type
    ).scalar() or 0

    # Eğer yeni skor, bu oyun için en yüksek skorsa, bonus XP ekle
    if data['score'] > highest_game_score:
        xp_gain += 20
        is_high_score = True

    # Kullanıcının tüm zamanların en yüksek skorunu kontrol et ve güncelle
    if data['score'] > user.highest_score:
        user.highest_score = data['score']

    # İlk kez oynama kontrolü
    game_play_count = Score.query.filter_by(
        user_id=user_id,
        game_type=game_type
    ).count()

    # İlk defa oynamak için bonus XP (yeni kayıt eklenmeden önce sayıldığı için 0 ise ilk kez)
    if game_play_count == 0:
        xp_gain += 10

    # XP ekle
    user.experience_points += xp_gain

    # Toplam oyun sayısını artır
    user.total_games_played += 1

    # Seviye yükseldi mi kontrol et
    new_level = user.experience_points // 1000 + 1

    # Rank güncelleme
    if new_level <= 5:
        user.rank = 'Başlangıç'
    elif new_level <= 10:
        user.rank = 'Acemi'
    elif new_level <= 15:
        user.rank = 'İlerleyen'
    elif new_level <= 20:
        user.rank = 'Usta'
    elif new_level <= 30:
        user.rank = 'Uzman'
    else:
        user.rank = 'Efsane'

    db.session.commit()

    # Kullanıcıya dönecek bilgileri hazırla
    response_data = {
        'success': True,
        'xp_gained': xp_gain,
        'new_total_xp': user.experience_points,
        'level': new_level,
        'is_level_up': new_level > original_level,
        'is_high_score': is_high_score,
        'rank': user.rank
    }

    return jsonify(response_data)

@app.route('/api/get-current-user')
def get_current_user_api():
    """Mevcut kullanıcı kimliğini döndür (API)"""
    user_id = session.get('user_id')
    return jsonify({
        'success': True if user_id else False,
        'user_id': user_id
    })

@app.route('/api/get-scores/<game_type>')
def get_scores(game_type):
    from sqlalchemy import func

    try:
        # "all" özelliği eklenmiş - tüm oyunların verilerini getir
        if game_type == 'all':
            # Tüm oyun türleri için en yüksek skorları getir
            game_types = [
                'wordPuzzle', 'memoryMatch', 'labyrinth', 'puzzle', 'visualAttention', 'numberSequence',
                'memoryCards', 'numberChain', 'audioMemory', 'nBack', 'sudoku', '2048', 'chess', 
                'logicPuzzles', 'tangram', 'rubikCube'
            ]
            all_scores = {}

            for internal_game_type in game_types:
                try:
                    # Her oyun türü için kullanıcı başına en yüksek puanları bul
                    max_scores_subquery = db.session.query(
                        Score.user_id, 
                        func.max(Score.score).label('max_score')
                    ).filter_by(
                        game_type=internal_game_type
                    ).group_by(
                        Score.user_id
                    ).subquery()

                    # Tam skor kayıtlarını ve kullanıcı bilgilerini getir
                    scores = db.session.query(Score, User).join(
                        max_scores_subquery, 
                        db.and_(
                            Score.user_id == max_scores_subquery.c.user_id,
                            Score.score == max_scores_subquery.c.max_score,
                            Score.game_type == internal_game_type
                        )
                    ).join(
                        User, 
                        User.id == Score.user_id
                    ).order_by(
                        Score.score.desc()
                    ).limit(10).all()

                    # Skor listesini oyun türüne göre oluştur
                    score_list = []
                    for score, user in scores:
                        score_list.append({
                            'user_id': score.user_id,
                            'username': user.username if user else 'Anonim',
                            'score': score.score,
                            'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                            'game_type': internal_game_type,
                            'rank': user.rank if user else 'Başlangıç'
                        })

                    # Her oyun türü için skorları ekle
                    all_scores[internal_game_type] = score_list
                except Exception as e:
                    logger.error(f"Error getting scores for {internal_game_type}: {e}")
                    all_scores[internal_game_type] = []

            return jsonify(all_scores)
        else:
            # Belirli bir oyun türü için skorları getir
            game_type_map = {
                'word-puzzle': 'wordPuzzle',
                'memory-match': 'memoryMatch',
                'labyrinth': 'labyrinth',
                'puzzle': 'puzzle',
                'visual-attention': 'visualAttention',
                'number-sequence': 'numberSequence',
                'memory-cards': 'memoryCards',
                'number-chain': 'numberChain',
                'audio-memory': 'audioMemory',
                'n-back': 'nBack',
                'sudoku': 'sudoku',
                '2048': '2048',
                'chess': 'chess',
                'logic-puzzles': 'logicPuzzles',
                'tangram': 'tangram',
                'rubik-cube': 'rubikCube',
                '3d-rotation': '3dRotation'
            }

            internal_game_type = game_type_map.get(game_type)
            if not internal_game_type:
                logger.warning(f"Invalid game type requested: {game_type}")
                return jsonify([])  # Geçersiz oyun türü için boş liste döndür

            try:
                # Önce her kullanıcı için maksimum skoru bulalım
                max_scores_subquery = db.session.query(
                    Score.user_id, 
                    func.max(Score.score).label('max_score')
                ).filter_by(
                    game_type=internal_game_type
                ).group_by(
                    Score.user_id
                ).subquery()

                # Sonra tam skor kayıtlarını ve kullanıcı bilgilerini alalım
                scores = db.session.query(Score, User).join(
                    max_scores_subquery, 
                    db.and_(
                        Score.user_id == max_scores_subquery.c.user_id,
                        Score.score == max_scores_subquery.c.max_score,
                        Score.game_type == internal_game_type
                    )
                ).join(
                    User, 
                    User.id == Score.user_id
                ).order_by(
                    Score.score.desc()
                ).limit(10).all()

                # Skor listesini hazırla
                score_list = []
                for score, user in scores:
                    score_list.append({
                        'user_id': score.user_id,
                        'username': user.username if user else 'Anonim',
                        'score': score.score,
                        'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'game_type': internal_game_type,
                        'rank': user.rank if user else 'Başlangıç',
                        'avatar_url': user.avatar_url if user and user.avatar_url else 'images/default-avatar.png'
                    })

                return jsonify(score_list)
            except Exception as e:
                logger.error(f"Error querying scores for {internal_game_type}: {e}")
                return jsonify([])  # Sorgu hatasında boş liste döndür
    except Exception as e:
        logger.error(f"Error in get_scores API: {e}")
        return jsonify([])  # Genel hata durumunda boş liste döndür

@app.route('/get_scores/<game_type>')  # Profil sayfası için eklenen alternatif endpoint
def get_scores_alt(game_type):
    return get_scores(game_type)

@app.route('/api/aggregated_scores')
def get_aggregated_scores():
    """Tüm oyunlardaki toplam skorları getiren API."""
    from sqlalchemy import func, desc
    try:
        # Her kullanıcının tüm oyunlardaki toplam puanını hesapla
        aggregated_scores = db.session.query(
            User.id.label('user_id'),
            User.username,
            User.rank,
            User.avatar_url,
            func.sum(Score.score).label('total_score')
        ).join(
            Score, User.id == Score.user_id
        ).group_by(
            User.id, User.username, User.rank, User.avatar_url
        ).order_by(
            desc('total_score')
        ).all()
        
        # Sonuçları sözlük listesine dönüştür
        result = [
            {
                'user_id': row.user_id,
                'username': row.username,
                'rank': row.rank,
                'avatar_url': row.avatar_url if row.avatar_url else '/static/images/avatars/avatar1.svg',
                'total_score': row.total_score
            } for row in aggregated_scores
        ]
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_aggregated_scores API: {e}")
        return jsonify([])

@app.route('/api/leaderboard/<game_type>')
def get_leaderboard(game_type):
    # Kabul edilen oyun türleri listesi - kategori ve id eşleştirmesi
    game_types = {
        'all': 'all',  # Özel durum - tüm oyunlar
        'wordPuzzle': 'wordpuzzle',
        'memoryMatch': 'memorymatch',
        'numberSequence': 'numbersequence',
        'labyrinth': 'labyrinth',
        'puzzle': 'puzzle',
        'memoryCards': 'memorycards',
        'numberChain': 'numberchain',
        'audioMemory': 'audiomemory',
        'nBack': 'nback',
        'sudoku': 'sudoku',
        '2048': '2048',
        'chess': 'chess',
        'logicPuzzles': 'logicpuzzles',
        'tangram': 'tangram',
        'rubikCube': 'rubikcube',
        '3dRotation': '3drotation',
        '3dLabyrinth': '3dlabyrinth'
    }
    
    # Oyun türü kontrolü
    normalized_game_type = game_types.get(game_type)
    if not normalized_game_type and game_type != 'all':
        logger.warning(f"Invalid game type requested: {game_type}")
        return jsonify([])

    from sqlalchemy import func
    try:
        if game_type == 'all':
            # Tüm oyun türleri için lider tablosu verilerini getir
            all_leaderboards = {}
            for game_id, internal_id in game_types.items():
                if game_id != 'all':  # 'all' türünü atla
                    leaderboard_data = get_leaderboard_data(internal_id)
                    all_leaderboards[game_id] = leaderboard_data
            return jsonify(all_leaderboards)
        else:
            # Belirli bir oyun türü için lider tablosu verilerini getir
            return jsonify(get_leaderboard_data(normalized_game_type))
    except Exception as e:
        logger.error(f"Error in get_leaderboard API: {e}")
        return jsonify([])

def get_leaderboard_data(game_type):
    from sqlalchemy import func
    try:
        # Oyun türü adını düzgün formata dönüştür
        internal_game_type = game_type.replace("-", "")
        
        # Her oyun türü için en yüksek puanları bul
        max_scores_subquery = db.session.query(
            Score.user_id, 
            func.max(Score.score).label('max_score')
        ).filter_by(
            game_type=internal_game_type
        ).group_by(
            Score.user_id
        ).subquery()

        # Tam skor kayıtlarını ve kullanıcı bilgilerini getir (sıralamayı puanı yüksekten düşüğe doğru yap)
        scores = db.session.query(Score, User).join(
            max_scores_subquery, 
            db.and_(
                Score.user_id == max_scores_subquery.c.user_id,
                Score.score == max_scores_subquery.c.max_score,
                Score.game_type == internal_game_type
            )
        ).join(
            User, 
            User.id == Score.user_id
        ).order_by(
            Score.score.desc()
        ).limit(25).all()  # Daha fazla skoruyla göster

        # Skor listesini oluştur ve zengin kullanıcı bilgileriyle doldur
        score_list = []
        for score, user in scores:
            score_list.append({
                'user_id': score.user_id,
                'username': user.username if user else 'Anonim',
                'full_name': user.full_name if user and user.full_name else None,
                'score': score.score,
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'game_type': internal_game_type,
                'rank': user.rank if user else 'Başlangıç',
                'level': calculate_level(score.score),  # Puana göre seviye hesapla
                'experience_points': user.experience_points if user else 0,
                'total_games_played': user.total_games_played if user else 0,
                'avatar_url': user.avatar_url if user and user.avatar_url else '/static/images/avatars/avatar1.svg'
            })

        return score_list
    except Exception as e:
        logger.error(f"Error querying leaderboard for {game_type}: {e}")
        return []
        
# Puana göre seviye hesaplama fonksiyonu
def calculate_level(score):
    if score < 100:
        return "Başlangıç"
    elif score < 300:
        return "Acemi"
    elif score < 600:
        return "Orta"
    elif score < 1000:
        return "İleri"
    elif score < 2000:
        return "Uzman"
    else:
        return "Üstadı"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)