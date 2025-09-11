import supabaseManager from '../config/supabaseManager.js';
import Logger from '../utils/logging.js';

class CustomerService {
  constructor() {
    this.defaultClient = supabaseManager.getDefaultClient();
  }

  // Yeni müşteri kaydet
  async registerCustomer(customerData) {
    const { customerId, name, supabaseUrl, supabaseKey, email } = customerData;

    if (!customerId || !supabaseUrl || !supabaseKey) {
      throw new Error('Müşteri ID, Supabase URL ve Key gerekli');
    }

    try {
      // Müşteri zaten var mı kontrol et
      const exists = await this.customerExists(customerId);
      if (exists) {
        throw new Error(`Müşteri ${customerId} zaten mevcut`);
      }

      // Müşteri bilgilerini veritabanına kaydet
      const { data, error } = await this.defaultClient
        .from('customers')
        .insert({
          customer_id: customerId,
          name: name,
          email: email,
          supabase_url: supabaseUrl,
          supabase_key: supabaseKey,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Müşteri kayıt hatası: ${error.message}`);
      }

      Logger.success(`Customer registered successfully`, { customerId, name });
      return data;

    } catch (error) {
      Logger.error('Customer registration failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Müşteri bilgilerini getir
  async getCustomer(customerId) {
    try {
      const { data, error } = await this.defaultClient
        .from('customers')
        .select('*')
        .eq('customer_id', customerId)
        .single();
  
      if (error) {
        throw new Error(`Supabase hatası: ${error.message}`);
      }
  
      if (!data) {
        throw new Error(`Müşteri ${customerId} bulunamadı`);
      }
  
      return data;
    } catch (error) {
      Logger.error('Failed to get customer', { customerId, error: error.message });
      throw error;
    }
  }
  
  // Müşteri Supabase client'ını getir
  async getCustomerSupabaseClient(customerId) {
    try {
      const customer = await this.getCustomer(customerId);

      // Müşterinin Supabase bilgileri ile client oluştur
      const client = supabaseManager.getClientForCustomer(
        customer.supabase_url,
        customer.supabase_key
      );

      return client;
    } catch (error) {
      Logger.error('Failed to get customer Supabase client', { customerId, error: error.message });
      throw error;
    }
  }

  // Müşteri bilgilerini güncelle
  async updateCustomer(customerId, updateData) {
    try {
      // Müşteri var mı kontrol et
      await this.getCustomer(customerId);

      const { data, error } = await this.defaultClient
        .from('customers')
        .update(updateData)
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Müşteri güncelleme hatası: ${error.message}`);
      }

      Logger.success(`Customer updated successfully`, { customerId });
      return data;
    } catch (error) {
      Logger.error('Customer update failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Müşteriyi sil
  async deleteCustomer(customerId) {
    try {
      const customer = await this.getCustomer(customerId);

      const { error } = await this.defaultClient
        .from('customers')
        .delete()
        .eq('customer_id', customerId);

      if (error) {
        throw new Error(`Müşteri silme hatası: ${error.message}`);
      }

      Logger.success(`Customer deleted successfully`, { customerId });
      return customer;
    } catch (error) {
      Logger.error('Customer deletion failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Tüm müşterileri listele
  async listCustomers() {
    try {
      const { data, error } = await this.defaultClient
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Müşteri listesi hatası: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      Logger.error('Failed to list customers', { error: error.message });
      throw error;
    }
  }

  // Müşteri var mı kontrol et
  async customerExists(customerId) {
    try {
      const { data, error } = await this.defaultClient
        .from('customers')
        .select('customer_id')
        .eq('customer_id', customerId)
        .limit(1);

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error) {
      Logger.error('Failed to check customer existence', { customerId, error: error.message });
      return false;
    }
  }

  // Müşteri sayısını getir
  async getCustomerCount() {
    try {
      const { count, error } = await this.defaultClient
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      Logger.error('Failed to get customer count', { error: error.message });
      return 0;
    }
  }

  // Müşteri istatistiklerini getir
  async getCustomerStats() {
    try {
      const totalCustomers = await this.getCustomerCount();
      const { data: customers, error } = await this.defaultClient
        .from('customers')
        .select('status')
        .eq('status', 'active');

      if (error) {
        throw new Error(`İstatistik hatası: ${error.message}`);
      }

      const activeCustomers = customers.length;
      const inactiveCustomers = totalCustomers - activeCustomers;

      return {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers
      };
    } catch (error) {
      Logger.error('Failed to get customer stats', { error: error.message });
      throw error;
    }
  }

  // Müşteri bağlantısını test et
  async testCustomerConnection(customerId) {
    try {
      const customer = await this.getCustomer(customerId);
      
      const result = await supabaseManager.testConnection(
        customer.supabase_url, 
        customer.supabase_key
      );

      Logger.success(`Customer connection test successful`, { customerId });
      return result;
    } catch (error) {
      Logger.error('Customer connection test failed', { customerId, error: error.message });
      throw error;
    }
  }
}

export default new CustomerService();
