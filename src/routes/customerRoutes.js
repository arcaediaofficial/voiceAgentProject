import express from 'express';
const router = express.Router();
import customerController from '../controllers/customerController.js';

// Müşteri kayıt
router.post('/register', customerController.registerCustomer);

// Müşteri bilgilerini getir
router.get('/:customerId', customerController.getCustomer);

// Müşteri bilgilerini güncelle
router.put('/:customerId', customerController.updateCustomer);

// Müşteriyi sil
router.delete('/:customerId', customerController.deleteCustomer);

// Tüm müşterileri listele
router.get('/', customerController.listCustomers);

// Müşteri istatistiklerini getir
router.get('/stats/overview', customerController.getCustomerStats);

// Müşteri Supabase bağlantısını test et
router.get('/:customerId/test-connection', customerController.testCustomerConnection);

// API key yönetimi
router.get('/:customerId/api-key', customerController.getApiKey);
router.post('/:customerId/regenerate-api-key', customerController.regenerateApiKey);
router.get('/api-keys/list', customerController.listApiKeys);

export default router;
