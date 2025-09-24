import { createClient } from 'redis';
import Logger from '../utils/logging.js';

class RedisManager {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => Logger.error('Redis Client Error', err));
    this.client.on('connect', () => Logger.info('Redis Client Connected'));

    // Bağlantıyı başlat
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      Logger.error('Redis connection failed', error);
    }
  }

  // Müşteri-ürün bazlı anahtar oluştur
  generateKey(customerId, productCode) {
    return `product_data:${customerId}:${productCode}`;
  }

  // Veriyi cache'e kaydet (24 saat TTL ile)
  async setProductData(customerId, productCode, data) {
    try {
      const key = this.generateKey(customerId, productCode);
      await this.client.set(key, JSON.stringify(data), {
        EX: 24 * 60 * 60 // 24 saat
      });
      Logger.info('Product data cached', { customerId, productCode });
    } catch (error) {
      Logger.error('Redis set failed', error);
      throw error;
    }
  }

  // Cache'den veri al
  async getProductData(customerId, productCode) {
    try {
      const key = this.generateKey(customerId, productCode);
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      Logger.error('Redis get failed', error);
      throw error;
    }
  }

  // Cache'den veriyi sil
  async deleteProductData(customerId, productCode) {
    try {
      const key = this.generateKey(customerId, productCode);
      await this.client.del(key);
      Logger.info('Product data cache cleared', { customerId, productCode });
    } catch (error) {
      Logger.error('Redis delete failed', error);
      throw error;
    }
  }

  // Bağlantıyı kapat
  async disconnect() {
    try {
      await this.client.quit();
      Logger.info('Redis connection closed');
    } catch (error) {
      Logger.error('Redis disconnect failed', error);
    }
  }
}

export default new RedisManager();
