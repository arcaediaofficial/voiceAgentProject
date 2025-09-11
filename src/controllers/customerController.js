import customerService from '../services/customerService.js';
import apiKeyManager from '../config/apiKeyManager.js';

class CustomerController {
  // Yeni müşteri kaydet
  async registerCustomer(req, res) {
    try {
      const { customerId, name, supabaseUrl, supabaseKey, email } = req.body;

      // Validasyon
      if (!customerId || !supabaseUrl || !supabaseKey) {
        return res.status(400).json({
          success: false,
          error: 'Müşteri ID, Supabase URL ve Key gerekli'
        });
      }

      // Müşteri zaten var mı kontrol et
      const exists = await customerService.customerExists(customerId);
      if (exists) {
        return res.status(409).json({
          success: false,
          error: `Müşteri ${customerId} zaten mevcut`
        });
      }

      const customer = await customerService.registerCustomer({
        customerId,
        name,
        supabaseUrl,
        supabaseKey,
        email
      });

      // Müşteri için API key oluştur
      const apiKey = await apiKeyManager.generateApiKey(customerId);

      res.status(201).json({
        success: true,
        message: 'Müşteri başarıyla kaydedildi',
        data: {
          ...customer,
          apiKey: apiKey
        }
      });

    } catch (error) {
      console.error('Müşteri kayıt hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri bilgilerini getir
  async getCustomer(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.getCustomer(customerId);

      res.json({
        success: true,
        data: customer
      });

    } catch (error) {
      console.error('Müşteri getirme hatası:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri bilgilerini güncelle
  async updateCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const updateData = req.body;

      const customer = await customerService.updateCustomer(customerId, updateData);

      res.json({
        success: true,
        message: 'Müşteri başarıyla güncellendi',
        data: customer
      });

    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteriyi sil
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.deleteCustomer(customerId);

      res.json({
        success: true,
        message: 'Müşteri başarıyla silindi',
        data: customer
      });

    } catch (error) {
      console.error('Müşteri silme hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Tüm müşterileri listele
  async listCustomers(req, res) {
    try {
      const customers = await customerService.listCustomers();

      res.json({
        success: true,
        data: customers,
        count: customers.length
      });

    } catch (error) {
      console.error('Müşteri listeleme hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri istatistiklerini getir
  async getCustomerStats(req, res) {
    try {
      const stats = await customerService.getCustomerStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Müşteri istatistik hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri Supabase bağlantısını test et
  async testCustomerConnection(req, res) {
    try {
      const { customerId } = req.params;

      const supabaseClient = await customerService.getCustomerSupabaseClient(customerId);
      
      // Basit bir test sorgusu
      const { data, error } = await supabaseClient
        .from('test_table')
        .select('*')
        .limit(1);

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Supabase bağlantı hatası',
          details: error.message
        });
      }

      res.json({
        success: true,
        message: 'Supabase bağlantısı başarılı',
        data: {
          customerId,
          connectionStatus: 'active',
          testResult: data
        }
      });

    } catch (error) {
      console.error('Bağlantı test hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri için API key yenile
  async regenerateApiKey(req, res) {
    try {
      const { customerId } = req.params;

      // Müşteri var mı kontrol et
      await customerService.getCustomer(customerId);

      // API key yenile
      const newApiKey = await apiKeyManager.regenerateApiKey(customerId);

      res.json({
        success: true,
        message: 'API key başarıyla yenilendi',
        data: {
          customerId,
          apiKey: newApiKey
        }
      });

    } catch (error) {
      console.error('API key yenileme hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Müşteri API key'ini getir
  async getApiKey(req, res) {
    try {
      const { customerId } = req.params;

      // Müşteri var mı kontrol et
      await customerService.getCustomer(customerId);

      // API key'i al
      const apiKey = await apiKeyManager.getApiKeyFromCustomerId(customerId);

      res.json({
        success: true,
        data: {
          customerId,
          apiKey: apiKey
        }
      });

    } catch (error) {
      console.error('API key getirme hatası:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  // Tüm API key'leri listele (admin endpoint)
  async listApiKeys(req, res) {
    try {
      const apiKeys = await apiKeyManager.listAllApiKeys();

      res.json({
        success: true,
        data: apiKeys,
        count: apiKeys.length
      });

    } catch (error) {
      console.error('API key listeleme hatası:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new CustomerController();
