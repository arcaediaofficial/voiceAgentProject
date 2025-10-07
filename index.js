import express from 'express';
import cors from 'cors';
import 'dotenv/config';
const app = express();

const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Güvenlik için frontend URL'ini .env'den alın
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json());
app.use(express.static('public'));

// Routes
import customerRoutes from './src/routes/customerRoutes.js';
import askRoutes from './src/routes/askRoutes.js';

// API Routes
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}`, askRoutes);

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    message: 'Node.js projesi başarıyla çalışıyor!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Dinamik Supabase bağlantıları',
      'Müşteri yönetimi',
      'RESTful API'
    ]
  });
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API dokümantasyonu
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'API Dokümantasyonu',
    endpoints: {
      customers: {
        'POST /api/customers/register': 'Yeni müşteri kaydet',
        'GET /api/customers': 'Tüm müşterileri listele',
        'GET /api/customers/:customerId': 'Müşteri bilgilerini getir',
        'PUT /api/customers/:customerId': 'Müşteri bilgilerini güncelle',
        'DELETE /api/customers/:customerId': 'Müşteriyi sil',
        'GET /api/customers/stats/overview': 'Müşteri istatistiklerini getir',
        'GET /api/customers/:customerId/test-connection': 'Supabase bağlantısını test et'
      },
      ask: {
        'POST /api/ask': 'Sesli soru-cevap (audio/mpeg döndürür) - x-api-key gerekli',
        'POST /api/ask/text': 'Metin soru-cevap (JSON döndürür) - x-api-key gerekli',
        'GET /api/voices': 'Kullanılabilir sesleri listele - x-api-key gerekli'
      },
      apiKeys: {
        'GET /api/customers/:customerId/api-key': 'Müşteri API key\'ini getir',
        'POST /api/customers/:customerId/regenerate-api-key': 'Müşteri API key\'ini yenile',
        'GET /api/customers/api-keys/list': 'Tüm API key\'leri listele'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Bir şeyler ters gitti!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Sayfa bulunamadı',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 Sağlık kontrolü: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Dokümantasyonu: http://localhost:${PORT}/api/docs`);
  console.log(`👥 Müşteri API: http://localhost:${PORT}/api/customers`);
  console.log(`🤖 Ask API: http://localhost:${PORT}/api/ask`);
});

export default app;
