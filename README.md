# Node.js Projesi

Bu basit bir Node.js web uygulamasıdır.

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start

# Geliştirme modunda çalıştır (nodemon ile)
npm run dev
```

## Kullanım

Uygulama başlatıldıktan sonra:

- Ana sayfa: `http://localhost:3000`
- Sağlık kontrolü: `http://localhost:3000/api/health`

## API Endpoints

- `GET /` - Ana sayfa
- `GET /api/health` - Sunucu sağlık durumu

## Özellikler

- Express.js web framework
- JSON API endpoints
- Hata yönetimi
- Statik dosya sunumu
- Sağlık kontrolü endpoint'i

## Geliştirme

```bash
# Geliştirme bağımlılıklarını yükle
npm install --save-dev nodemon

# Geliştirme modunda çalıştır
npm run dev
```
