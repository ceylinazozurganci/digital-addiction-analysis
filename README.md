# Ekranlarımızın Ardında — Teknoloji Kullanımı ve Dijital Alışkanlıklar

Büyük Veri Analistliği bölümü için geliştirilmiş, profesyonel, modern, interaktif ve veri odaklı bir **Scrollytelling (Kaydırmalı Veri Gazeteciliği)** web uygulaması.

---

## 📱 Proje Özeti
- **Başlık:** Ekranlarımızın Ardında
- **Alt Başlık:** *Telefonlarımızı nasıl kullanıyoruz ve dijital alışkanlıklarımız bize ne anlatıyor?*
- **Veri Seti:** `user_behavior_dataset.csv` (700 doğrulanmış katılımcı, 11 telemetri değişkeni)
- **Tasarım Dili:** Koyu lacivert/siyah zemin (`#070a12`), siber mor (`#8b5cf6`) ve turkuaz (`#06b6d4`) neon vurgular, modern editoryal tipografi (Outfit, Inter, JetBrains Mono).

---

## 📊 Scrollytelling Bölümleri ve Veri Bulguları

1. **Giriş (Bölüm 1):**
   - 700 Kullanıcı, 5.27 saat/gün ortalama ekran süresi, 271.1 dk/gün ortalama uygulama süresi, 929.6 MB/gün veri tüketimi.
2. **Bir Günümüz Ekranda Ne Kadar Geçiyor? (Bölüm 2):**
   - İnteraktif Kutu Grafiği (Box Plot).
   - Ortanca (Medyan): **4.90 saat**. Q1: 2.50 saat, Q3: 7.40 saat, IQR: 4.90 saat.
   - Tukey 1.5×IQR kuralına göre aykırı değer bulunmamaktadır.
3. **Uygulama Kullanımı ve Ekran Süresi (Bölüm 3):**
   - İnteraktif Saçılım Grafiği (Scatter Plot) & OLS Doğrusal Regresyon Eğrisi.
   - Pearson korelasyon katsayısı: **r = 0.9503** (R² = 0.9031).
   - Denklem: `y = 0.0165x + 0.8107`.
   - *Metodolojik not:* Korelasyon nedensellik göstermez; veri setinde Instagram, TikTok vb. tekil uygulama kırılımı yer almamaktadır.
4. **Yaş ve Cinsiyete Göre Dijital Alışkanlıklar (Bölüm 4):**
   - Yaş grupları (18-29: 5.19h, 30-39: 5.28h, 40-49: 5.27h, 50-59: 5.35h) ve cinsiyet (Kadın: 5.26h, Erkek: 5.28h) kırılımları.
   - Yaş ve cinsiyetler arasında varsayılan uçurumların bulunmadığı, homojen bir yayılım olduğu kanıtlanmıştır.
5. **Daha Fazla Kullanım, Daha Fazla Pil Tüketimi mi? (Bölüm 5):**
   - Uygulama süresi vs. Pil Tüketimi: **r = 0.9564**
   - Uygulama süresi vs. Veri Kullanımı: **r = 0.9423**
6. **Kullanıcı Davranış Sınıfları (Bölüm 6):**
   - 5 eşit orantılı segment (Sınıf 1: 1.49h ortalama minimalistten Sınıf 5: 10.11h power user'a kadar).
7. **Peki, Senin Ekran Süren Ne Kadar? (Bölüm 7 - İnteraktif Hesaplayıcı):**
   - 0.0 – 12.0 saat aralığında canlı slider.
   - Yüzdelik dilim (Percentile) anlık hesabı: `((≤ süre kullanıcı sayısı) / 700) * 100`.
   - Gerçek dağılım grafiği üzerinde canlı konum belirteci.
   - Teşhis niteliği taşımadığına dair nesnel uyarı.
8. **Sonuç, Sınırlılıklar ve Kaynakça (Bölüm 8):**
   - 6 temel sonuç, kesitsel veri sınırları ve kaynakça.

---

## 🚀 Kurulum ve Çalıştırma

### Yöntem 1: Node.js ile (Önerilen)
```bash
# Proje klasöründe:
npm run dev
# veya
node server.js
```
Tarayıcınızda `http://localhost:3000/` adresini açın.

### Yöntem 2: Python ile Veri Analizini Yeniden Çalıştırma
```bash
python analyze.py
```
Bu komut `user_behavior_dataset.csv` dosyasını okuyup istatistikleri ve korelasyonları `data.json` dosyasına aktarır.

---

## 📁 Proje Dosya Yapısı
```
scrollytelling/
├── index.html                  # Semantik HTML5 scrollytelling sayfası
├── style.css                   # Modern koyu editoryal stil ve animasyonlar
├── app.js                      # Plotly.js grafik mantığı, veri entegrasyonu ve hesaplayıcı
├── analyze.py                  # Python & Pandas ile gerçek veri analizi scripti
├── data.json                   # Hesaplanmış istatistikler ve kayıtlar
├── user_behavior_dataset.csv   # Orijinal 700 satırlık veri seti
├── server.js                   # Sıfır bağımlılıklı Node.js yerel sunucusu
├── package.json                # NPM komutları ve proje meta verileri
└── README.md                   # Proje dokümantasyonu
```
