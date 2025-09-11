import supabaseManager from '../config/supabaseManager.js';
import aiService from './aiService.js';
import Logger from '../utils/logging.js';

class ProductService {
  // Müşteri bazlı Supabase client al (test için default fallback)
  async getSupabaseClient(customerId) {
    let supabaseClient = await supabaseManager.createClientForCustomer(customerId);
    if (!supabaseClient) {
      Logger.warning('Using default Supabase client (test mode)', { customerId });
      supabaseClient = supabaseManager.getDefaultClient();
    }
    return supabaseClient;
  }

  // Supabase Vector DB'den ürün verilerini çek
  async getProductDataFromVectorDB(customerId, productCode, question, existingEmbedding = null) {
    try {
      const startTime = Date.now();
      Logger.supabaseConnection(customerId);
      
      // Supabase client ve embedding'i paralel olarak al
      const [supabaseClient, embedding] = await Promise.all([
        this.getSupabaseClient(customerId),
        existingEmbedding || aiService.createEmbedding(question)
      ]);
      
      Logger.info('Client and embedding ready', { 
        timeTaken: `${Date.now() - startTime}ms`,
        hasExistingEmbedding: !!existingEmbedding
      });

      // Supabase'de vector search yap
      const { data, error } = await supabaseClient.rpc('match_documents', {
        filter: { productCode },
        match_count: 10,
        query_embedding: embedding,
        match_threshold: 0.1
      });

      if (error) {
        Logger.error('Vector search error', { customerId, productCode, error: error.message });
        throw new Error(`Vector search error: ${error.message}`);
      }

      // Alternatif olarak, eğer vector search çalışmazsa normal sorgu yap
      if (!data || data.length === 0) {
        Logger.warning('Vector search returned no results, trying normal query', { customerId, productCode });
        return await this.getProductDataFromNormalDB(supabaseClient, productCode);
      }

      Logger.supabaseQuery(productCode, data.length);
      return data;

    } catch (error) {
      Logger.error('Product data retrieval failed', { customerId, productCode, error: error.message });
      throw error;
    }
  }

  // Normal DB'den ürün verilerini çek (fallback)
  async getProductDataFromNormalDB(supabaseClient, productCode) {
    try {
      Logger.debug('Using normal DB query as fallback', { productCode });

      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('product_code', productCode)
        .limit(10);

      if (error) {
        throw new Error(`Product data retrieval error: ${error.message}`);
      }

      Logger.supabaseQuery(productCode, data?.length || 0);
      return data || [];

    } catch (error) {
      Logger.error('Normal DB query failed', { productCode, error: error.message });
      throw error;
    }
  }

  // Ürün verilerini arama ile çek
  async searchProducts(customerId, searchTerm, limit = 10) {
    try {
      Logger.debug('Searching products', { customerId, searchTerm, limit });

      const supabaseClient = await this.getSupabaseClient(customerId);

      // Embedding oluştur
      const embedding = await aiService.createEmbedding(searchTerm);

      // Vector search yap
      const { data, error } = await supabaseClient.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit
      });

      if (error) {
        throw new Error(`Product search error: ${error.message}`);
      }

      Logger.success('Product search completed', { customerId, searchTerm, resultCount: data?.length || 0 });
      return data || [];

    } catch (error) {
      Logger.error('Product search failed', { customerId, searchTerm, error: error.message });
      throw error;
    }
  }

  // Ürün kategorilerini getir
  async getProductCategories(customerId) {
    try {
      Logger.debug('Getting product categories', { customerId });

      const supabaseClient = await this.getSupabaseClient(customerId);

      const { data, error } = await supabaseClient
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        throw new Error(`Category retrieval error: ${error.message}`);
      }

      // Benzersiz kategorileri al
      const categories = [...new Set(data.map(item => item.category))];

      Logger.success('Product categories retrieved', { customerId, categoryCount: categories.length });
      return categories;

    } catch (error) {
      Logger.error('Category retrieval failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Ürün istatistiklerini getir
  async getProductStats(customerId) {
    try {
      Logger.debug('Getting product statistics', { customerId });

      const supabaseClient = await this.getSupabaseClient(customerId);

      // Toplam ürün sayısı
      const { count: totalProducts, error: countError } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Product count error: ${countError.message}`);
      }

      // Kategori sayısı
      const categories = await this.getProductCategories(customerId);

      const stats = {
        totalProducts: totalProducts || 0,
        totalCategories: categories.length,
        categories: categories
      };

      Logger.success('Product statistics retrieved', { customerId, stats });
      return stats;

    } catch (error) {
      Logger.error('Product statistics retrieval failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Ürün verilerini toplu olarak ekle
  async bulkInsertProducts(customerId, products) {
    try {
      Logger.debug('Bulk inserting products', { customerId, productCount: products.length });

      const supabaseClient = await this.getSupabaseClient(customerId);

      // Embedding'leri toplu olarak oluştur
      const texts = products.map(product =>
        `${product.name} ${product.description} ${product.category}`.trim()
      );

      const embeddings = await aiService.createBatchEmbeddings(texts);

      // Ürünlere embedding'leri ekle
      const productsWithEmbeddings = products.map((product, index) => ({
        ...product,
        embedding: embeddings[index]
      }));

      const { data, error } = await supabaseClient
        .from('products')
        .insert(productsWithEmbeddings);

      if (error) {
        throw new Error(`Bulk insert error: ${error.message}`);
      }

      Logger.success('Products bulk inserted successfully', { customerId, insertedCount: data?.length || 0 });
      return data;

    } catch (error) {
      Logger.error('Bulk insert failed', { customerId, error: error.message });
      throw error;
    }
  }

  // Ürün verilerini güncelle
  async updateProduct(customerId, productCode, updateData) {
    try {
      Logger.debug('Updating product', { customerId, productCode });

      const supabaseClient = await this.getSupabaseClient(customerId);

      // Eğer ürün bilgileri değiştiyse embedding'i yeniden oluştur
      if (updateData.name || updateData.description || updateData.category) {
        const text = `${updateData.name || ''} ${updateData.description || ''} ${updateData.category || ''}`.trim();
        updateData.embedding = await aiService.createEmbedding(text);
      }

      const { data, error } = await supabaseClient
        .from('products')
        .update(updateData)
        .eq('product_code', productCode)
        .select();

      if (error) {
        throw new Error(`Product update error: ${error.message}`);
      }

      Logger.success('Product updated successfully', { customerId, productCode });
      return data?.[0] || null;

    } catch (error) {
      Logger.error('Product update failed', { customerId, productCode, error: error.message });
      throw error;
    }
  }
}

export default new ProductService();
