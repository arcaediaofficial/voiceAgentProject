class Logger {
  static info(message, data = {}) {
    const timestamp = new Date().toISOString();
    if (data.timeTaken) {
      console.log(`[${timestamp}] ⏱️ ${message} (${data.timeTaken})`);
      delete data.timeTaken;
      if (Object.keys(data).length > 0) {
        console.log('   📊 Additional data:', data);
      }
    } else {
      console.log(`[${timestamp}] ℹ️ ${message}`, data);
    }
  }

  static success(message, data = {}) {
    console.log(`✅ ${message}`, data);
  }

  static warning(message, data = {}) {
    console.warn(`⚠️ ${message}`, data);
  }

  static error(message, error = null) {
    console.error(`❌ ${message}`, error);
  }

  static debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${message}`, data);
    }
  }

  // API istekleri için özel logging
  static apiRequest(method, path, customerId = null) {
    this.info(`API Request: ${method} ${path}`, { customerId });
  }

  static apiResponse(method, path, statusCode, customerId = null) {
    this.info(`API Response: ${method} ${path} - ${statusCode}`, { customerId });
  }

  // AI işlemleri için özel logging
  static aiRequest(question, productCode) {
    this.info(`AI Request`, { question: question.substring(0, 50) + '...', productCode });
  }

  static aiResponse(responseLength) {
    this.success(`AI Response generated`, { length: responseLength });
  }

  // Audio işlemleri için özel logging
  static audioGeneration(voiceId, textLength) {
    this.info(`Audio generation started`, { voiceId, textLength });
  }

  static audioComplete(voiceId) {
    this.success(`Audio generation completed`, { voiceId });
  }

  // Supabase işlemleri için özel logging
  static supabaseConnection(customerId) {
    this.success(`Supabase connection established`, { customerId });
  }

  static supabaseQuery(productCode, resultCount) {
    this.info(`Supabase query executed`, { productCode, resultCount });
  }
}

export default Logger;
