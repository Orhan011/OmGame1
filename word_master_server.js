const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Statik dosyaları sunma
app.use(express.static(path.join(__dirname, './')));
app.use(bodyParser.json());

// E-posta göndermek için transporter oluştur
// NOT: Gerçek uygulamada bu bilgileri environment variable olarak saklamalısınız
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Gerçek email adresinizi environment variable olarak ayarlayın
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Gmail App Password (2FA açıksa gerekli)
  }
});

// Sertifika gönderme endpoint'i
app.post('/send-certificate', async (req, res) => {
  try {
    const { userName, userEmail, score, successRate, level, date } = req.body;

    // E-posta içeriği
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: userEmail,
      subject: 'İngilizce Dil Sertifikası - English Word Quest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8a6fff;">İngilizce Dil Sertifikası</h1>
            <p style="font-size: 18px; color: #555;">English Word Quest</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #8a6fff; border-radius: 10px;">
            <h2 style="margin-bottom: 5px;">Bu belge</h2>
            <h1 style="margin: 10px 0; color: #333; font-size: 24px;">${userName}</h1>
            <h2 style="margin-top: 5px;">adına düzenlenmiştir</h2>

            <p style="margin: 20px 0; font-size: 18px;">
              İngilizce dil seviyesi: <strong style="color: #8a6fff;">${level}</strong>
            </p>

            <p style="font-size: 16px; color: #555;">
              Başarı oranı: ${successRate}<br>
              Doğru cevap: ${score}<br>
              Tarih: ${date}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #777; font-size: 14px;">
            <p>Bu sertifika, English Word Quest uygulamasında tamamlanan final deneme sınavı sonucuna göre düzenlenmiştir.</p>
            <p>©️ ${new Date().getFullYear()} English Word Quest</p>
          </div>
        </div>
      `
    };

    // E-postayı gönder
    await transporter.sendMail(mailOptions);

    res.json({ success: true });
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ses tanıma durumu kontrolü API endpoint'i
app.post('/api/toggle-microphone', (req, res) => {
  try {
    const { status } = req.body;
    // Gelen status değeri ile işlem yapılabilir (ileride kullanım için)
    res.json({ success: true, microphoneStatus: status });
  } catch (error) {
    console.error('Mikrofon durum değiştirme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});