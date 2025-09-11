import aiService from '../services/aiService.js';
import audioService from '../services/audioService.js';
import productService from '../services/productService.js';
import Logger from '../utils/logging.js';

class AskController {
  constructor() {
    // Controller sadece HTTP request/response ile ilgilenir
    Logger.info('AskController initialized');
  }

  // Ana ask fonksiyonu
  async askQuestion(req, res) {
    try {
      const { productCode, question } = req.body;
      const customerId = req.customerId;
      // Validasyon
      if (!productCode || !question) {
        return res.status(400).json({
          success: false,
          error: 'productCode ve question gerekli'
        });
      }

      console.log(`🤔 Müşteri ${customerId} için soru: ${question} (Ürün: ${productCode})`);

      // 1. Paralel işlemler için hazırlık
      const startTime = Date.now();
      let stepTime = Date.now();
      
      // Embedding'i bir kere oluştur ve paylaş
      const embedding = await aiService.createEmbedding(question);
      Logger.info('Embedding created', { timeTaken: `${Date.now() - stepTime}ms` });
      
      // Vector DB'den ürün verilerini çek
      stepTime = Date.now();
      const productData = await productService.getProductDataFromVectorDB(customerId, productCode, question, embedding);
      Logger.info('Product data retrieved', { 
        timeTaken: `${Date.now() - stepTime}ms`,
        recordCount: productData.length 
      });
      
      // AI yanıtı üret
      stepTime = Date.now();
      const aiResponse = await aiService.generateResponse(question, { productData, productCode });
      Logger.info('AI response generated', { 
        timeTaken: `${Date.now() - stepTime}ms`,
        responseLength: aiResponse.length 
      });

      Logger.success(`Total processing completed`, { 
        customerId, 
        productCode, 
        totalTime: `${Date.now() - startTime}ms`
      });

      // 2. Ses üretimini paralel başlat ve response headers'ı hazırla
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // Custom header'ları hemen gönder
      const metadata = Buffer.from(JSON.stringify({
        responseText: aiResponse,
        customerId: customerId,
        productCode: productCode
      })).toString('base64');
      res.setHeader('X-Response-Metadata', metadata);

      // Ses üretimini başlat
      stepTime = Date.now();
      const audioStream = await audioService.generateAudioStream(aiResponse);
      Logger.info('Audio stream ready', { 
        timeTaken: `${Date.now() - stepTime}ms`,
        totalTimeSoFar: `${Date.now() - startTime}ms`
      });
      
      // Stream'i pipe et
      audioStream.pipe(res);
      // Hata yönetimi ekle
      audioStream.on('error', (error) => {
        Logger.error('Audio streaming error', { error: error.message });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Audio streaming failed' });
        }
      });

      audioStream.pipe(res);

    } catch (error) {
      Logger.error('Ask operation failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }



  async askTextOnly(req, res) {
    try {
      const { productCode, question } = req.body;
      const customerId = req.customerId;

      if (!productCode || !question) {
        return res.status(400).json({
          success: false,
          error: 'productCode ve question gerekli'
        });
      }

      const productData = await productService.getProductDataFromVectorDB(customerId, productCode);
      const aiResponse = await aiService.generateResponse(question, { productData, productCode });

      res.json({
        success: true,
        data: {
          question,
          answer: aiResponse,
          productCode,
          customerId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      Logger.error('Text-only ask failed', { customerId, productCode, error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Kullanılabilir sesleri listele
  async listVoices(req, res) {
    try {
      const voices = await audioService.getAvailableVoices();
      
      res.json({
        success: true,
        data: voices
      });

    } catch (error) {
      Logger.error('Voices list failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new AskController();
