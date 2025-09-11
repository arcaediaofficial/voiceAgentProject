import supabaseManager from './supabaseManager.js';
import Logger from '../utils/logging.js';

class ApiKeyManager {
  constructor() {
    this.defaultClient = supabaseManager.getDefaultClient();
  }

  // Müşteri için API key oluştur
  async generateApiKey(customerId) {
    try {
      // Basit bir API key oluşturma (gerçek uygulamada daha güvenli olmalı)
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const apiKey = `CUSTOMER_${customerId.toUpperCase()}_${timestamp}_${random}`;
      
      // API key'i veritabanına kaydet
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .insert({
          customer_id: customerId,
          api_key: apiKey,
          name: 'Default API Key'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`API key creation failed: ${error.message}`);
      }

      Logger.success(`API key created for customer`, { customerId, apiKey });
      return apiKey;
    } catch (error) {
      Logger.error('API key generation failed', { customerId, error: error.message });
      throw error;
    }
  }

  // API key'den müşteri ID'sini al
  async getCustomerIdFromApiKey(apiKey) {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .select('customer_id, is_active, expires_at')
        .eq('api_key', apiKey)
        .single();

      if (error || !data) {
        throw new Error('Invalid API key');
      }

      // API key aktif mi kontrol et
      if (!data.is_active) {
        throw new Error('API key is inactive');
      }

      // Süresi dolmuş mu kontrol et
      if (data.expires_at && new Date() > new Date(data.expires_at)) {
        throw new Error('API key has expired');
      }

      // Kullanım istatistiğini güncelle
      await this.updateApiKeyUsage(apiKey);

      return data.customer_id;
    } catch (error) {
      Logger.error('Failed to get customer ID from API key', { apiKey, error: error.message });
      throw error;
    }
  }

  // Müşteri ID'sinden API key'i al
  async getApiKeyFromCustomerId(customerId) {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .select('api_key')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        throw new Error(`No active API key found for customer ${customerId}`);
      }

      return data.api_key;
    } catch (error) {
      Logger.error('Failed to get API key from customer ID', { customerId, error: error.message });
      throw error;
    }
  }

  // API key'in geçerli olup olmadığını kontrol et
  async isValidApiKey(apiKey) {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .select('is_active, expires_at')
        .eq('api_key', apiKey)
        .single();

      if (error || !data) {
        return false;
      }

      // Aktif mi kontrol et
      if (!data.is_active) {
        return false;
      }

      // Süresi dolmuş mu kontrol et
      if (data.expires_at && new Date() > new Date(data.expires_at)) {
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('API key validation failed', { apiKey, error: error.message });
      return false;
    }
  }

  // Müşteri için API key'i yenile
  async regenerateApiKey(customerId) {
    try {
      // Eski API key'leri deaktif et
      await this.defaultClient
        .from('api_keys')
        .update({ is_active: false })
        .eq('customer_id', customerId);

      // Yeni API key oluştur
      const newApiKey = await this.generateApiKey(customerId);

      Logger.success(`API key regenerated for customer`, { customerId });
      return newApiKey;
    } catch (error) {
      Logger.error('API key regeneration failed', { customerId, error: error.message });
      throw error;
    }
  }

  // API key'i sil
  async deleteApiKey(apiKey) {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .update({ is_active: false })
        .eq('api_key', apiKey)
        .select('customer_id')
        .single();

      if (error) {
        throw new Error(`API key deletion failed: ${error.message}`);
      }

      Logger.success(`API key deleted`, { customerId: data.customer_id, apiKey });
      return true;
    } catch (error) {
      Logger.error('API key deletion failed', { apiKey, error: error.message });
      throw error;
    }
  }

  // Tüm API key'leri listele
  async listAllApiKeys() {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .select(`
          api_key,
          name,
          is_active,
          created_at,
          last_used_at,
          expires_at,
          customers!inner(customer_id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list API keys: ${error.message}`);
      }

      return data.map(key => ({
        customerId: key.customers.customer_id,
        customerName: key.customers.name,
        apiKey: key.api_key.substring(0, 20) + '...', // Güvenlik için kısaltılmış
        name: key.name,
        isActive: key.is_active,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
        expiresAt: key.expires_at
      }));
    } catch (error) {
      Logger.error('Failed to list API keys', { error: error.message });
      throw error;
    }
  }

  // Müşteri için API key var mı kontrol et
  async hasApiKey(customerId) {
    try {
      const { data, error } = await this.defaultClient
        .from('api_keys')
        .select('id')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      Logger.error('Failed to check API key existence', { customerId, error: error.message });
      return false;
    }
  }

  // API key sayısını getir
  async getApiKeyCount() {
    try {
      const { count, error } = await this.defaultClient
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      Logger.error('Failed to get API key count', { error: error.message });
      return 0;
    }
  }

  // API key kullanımını güncelle
  async updateApiKeyUsage(apiKey) {
    try {
      await this.defaultClient.rpc('update_api_key_usage', { api_key_param: apiKey });
    } catch (error) {
      Logger.error('Failed to update API key usage', { apiKey, error: error.message });
    }
  }


}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

export default apiKeyManager;
