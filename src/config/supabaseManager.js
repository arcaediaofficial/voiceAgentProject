import { createClient } from '@supabase/supabase-js';
import Logger from '../utils/logging.js';
import 'dotenv/config';

class SupabaseManager {
  constructor() {
    this.defaultClient = null;
    this.initializeDefaultClient();
  }

  // Varsayılan Supabase client'ını başlat
  initializeDefaultClient() {
    const defaultUrl = process.env.DEFAULT_SUPABASE_URL;
    const defaultKey = process.env.DEFAULT_SUPABASE_ANON_KEY;
    
    if (defaultUrl && defaultKey) {
      this.defaultClient = createClient(defaultUrl, defaultKey);
      Logger.success('Default Supabase client initialized');
    } else {
      Logger.warning('Default Supabase configuration missing');
    }
  }

  // Müşteri ID'sine göre müşteri bilgilerini çekip Supabase client oluştur
  async createClientForCustomer(customerId) {
    try {
      if (!this.defaultClient) {
        throw new Error('Default client not initialized');
      }

      // Müşteri bilgilerini default database'den çek
      const { data: customerData, error } = await this.defaultClient
        .from('customers')
        .select('supabase_url, supabase_key')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        throw new Error(`Customer data fetch error: ${error.message}`);
      }

      if (!customerData) {
        throw new Error(`No customer found with ID: ${customerId}`);
      }

      // Müşterinin kendi database'i için client oluştur
      const client = createClient(customerData.supabase_url, customerData.supabase_key);
      Logger.success(`Supabase client created for customer`, { customerId });
      return client;
    } catch (error) {
      Logger.error('Client creation failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Varsayılan client'ı al
  getDefaultClient() {
    return this.defaultClient;
  }

  // Bağlantı durumunu kontrol et
  async testConnection(supabaseUrl, supabaseKey) {
    try {
      const client = this.getClientForCustomer(supabaseUrl, supabaseKey);
      
      // Basit bir test sorgusu
      const { data, error } = await client
        .from('customers')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      Logger.success(`Supabase connection test successful`, { supabaseUrl });
      return { success: true, data };
    } catch (error) {
      Logger.error(`Supabase connection test failed`, { supabaseUrl, error: error.message });
      throw error;
    }
  }
}

// Singleton instance
const supabaseManager = new SupabaseManager();

export default supabaseManager;
