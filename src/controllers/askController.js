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

      // Paralel işlemler için hazırlık
      const startTime = Date.now();
      let stepTime = Date.now();
      
      // Vector DB'den ürün verilerini çek (Redis kontrolü içeride yapılacak)
      stepTime = Date.now();
      const productData = await productService.getProductDataFromVectorDB(customerId, productCode, question);
      Logger.info('Product data retrieved', { 
        timeTaken: `${Date.now() - stepTime}ms`,
        recordCount: productData.length 
      });

      // AI yanıtını al
      stepTime = Date.now();
      const aiResponse = await aiService.generateResponse(question, { productData, productCode });
      Logger.info('AI response generated', { 
        timeTaken: `${Date.now() - stepTime}ms`,
        responseLength: aiResponse.length 
      });

      // Cümlelere ayır
      const sentences = aiResponse.match(/[^.!?]+[.!?]+/g) || [aiResponse];
      
      // Response headers'ı hazırla
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Metadata'yı custom header olarak gönder
      const metadata = {
        responseText: aiResponse,
        customerId: customerId,
        productCode: productCode,
        sentences: sentences.map(s => s.trim()).filter(Boolean)
      };
      res.setHeader('X-Response-Metadata', Buffer.from(JSON.stringify(metadata)).toString('base64'));

      // Tüm cümleleri birleştirip tek ses dosyası oluştur
      try {
        const audioStream = await audioService.generateAudioStream(aiResponse);
        audioStream.pipe(res);
      } catch (error) {
        Logger.error('Audio generation failed', { error: error.message });
        res.status(500).json({ error: 'Audio generation failed' });
      }

      Logger.success(`Total processing completed`, { 
        customerId, 
        productCode, 
        totalTime: `${Date.now() - startTime}ms`,
        responseLength: aiResponse.length
      });

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
