import OpenAI from 'openai';
import Logger from '../utils/logging.js';
import 'dotenv/config';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // OpenAI ile embedding oluştur
  async createEmbedding(text) {
    try {
      Logger.debug('Creating embedding for text', { textLength: text.length });
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      Logger.success('Embedding created successfully', { 
        textLength: text.length, 
        embeddingLength: response.data[0].embedding.length,
        embedding: response.data[0].embedding
      });

      return response.data[0].embedding;
    } catch (error) {
      Logger.error('Embedding creation failed', error);
      throw error;
    }
  }

  // OpenAI ile stream cevap üret
  async generateResponseStream(question, context) {
    try {
      Logger.aiRequest(question, context.productCode || 'unknown');

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(context)
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
        stream: true
      });

      // Stream'i Readable stream'e dönüştür
      const { Readable } = await import('stream');
      const readableStream = new Readable({
        read() {}
      });

      // Her chunk geldiğinde stream'e aktar
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          readableStream.push(content);
        }
      }
      readableStream.push(null);

      return readableStream;
    } catch (error) {
      Logger.error('AI response stream generation failed', error);
      throw error;
    }
  }

  // OpenAI ile cevap üret
  async generateResponse(question, context) {
    try {
      Logger.aiRequest(question, context.productCode || 'unknown');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(context)
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
        response_format: { "type": "text" }
      });

      const aiResponse = response.choices[0].message.content;
      Logger.aiResponse(aiResponse);

      return aiResponse;

    } catch (error) {
      Logger.error('AI response generation failed', error);
      throw error;
    }
  }

  // System prompt oluştur
  buildSystemPrompt(context) {
    const productContext = this.prepareProductContext(context.productData);
    
    return `You are a product advisor. Answer customer questions using the product information below.
    Keep responses concise, clear, and direct. Focus only on the specific question asked. Do not say product code in the response.
    Add "Do you have any other questions?" at the end.

    Product Information:
    ${productContext}`;
  }

  // Ürün verilerini context olarak hazırla
  prepareProductContext(productData) {
    if (!productData || productData.length === 0) {
      return 'Ürün bilgisi bulunamadı.';
    }

    return productData.map((item, index) => {
      return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
    }).join('\n\n');
  }

  // Batch embedding oluştur (birden fazla metin için)
  async createBatchEmbeddings(texts) {
    try {
      Logger.debug('Creating batch embeddings', { count: texts.length });
      
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      });

      Logger.success('Batch embeddings created successfully', { 
        count: texts.length 
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      Logger.error('Batch embedding creation failed', error);
      throw error;
    }
  }

  // Model bilgilerini getir
  async getAvailableModels() {
    try {
      const models = await this.openai.models.list();
      return models.data.map(model => ({
        id: model.id,
        object: model.object,
        created: model.created,
        owned_by: model.owned_by
      }));
    } catch (error) {
      Logger.error('Failed to get available models', error);
      throw error;
    }
  }
}

export default new AIService();
