import apiKeyManager from '../config/apiKeyManager.js';
import Logger from '../utils/logging.js';

// API key kimlik doğrulama middleware'i
const authenticateApiKey = async (req, res, next) => {
  try {
    Logger.apiRequest(req.method, req.path);

    // API key'i header'dan al
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      Logger.warning('API key missing in request', { path: req.path });
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'x-api-key header is missing'
      });
    }

    // API key'in geçerli olup olmadığını kontrol et
    const isValid = await apiKeyManager.isValidApiKey(apiKey);
    if (!isValid) {
      Logger.warning('Invalid API key provided', { path: req.path });
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'Provided API key is invalid'
      });
    }

    // Müşteri ID'sini al ve request'e ekle
    const customerId = await apiKeyManager.getCustomerIdFromApiKey(apiKey);
    req.customerId = customerId;
    req.apiKey = apiKey;

    Logger.success('API key authenticated', { customerId, path: req.path });
    next();

  } catch (error) {
    Logger.error('API key authentication error', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      message: error.message
    });
  }
};

// Opsiyonel API key middleware'i (bazı endpoint'ler için)
const optionalApiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey) {
      const isValid = await apiKeyManager.isValidApiKey(apiKey);
      if (isValid) {
        const customerId = await apiKeyManager.getCustomerIdFromApiKey(apiKey);
        req.customerId = customerId;
        req.apiKey = apiKey;
        Logger.success('Optional API key authenticated', { customerId, path: req.path });
      } else {
        Logger.info('Invalid API key provided', { path: req.path });
      }
    } else {
      Logger.info('No API key provided', { path: req.path });
    }
    
    next();

  } catch (error) {
    Logger.error('Optional API key authentication error', error);
    next(); // Hata durumunda da devam et
  }
};

// Customer ID doğrulama middleware'i
const validateCustomerId = (req, res, next) => {
  try {
    const customerId = req.params.customerId || req.body.customerId;
    
    if (!customerId) {
      Logger.warning('Customer ID missing', { path: req.path });
      return res.status(400).json({
        success: false,
        error: 'Customer ID required',
        message: 'customerId parameter is missing'
      });
    }

    // Customer ID formatını kontrol et (basit validasyon)
    if (typeof customerId !== 'string' || customerId.trim().length === 0) {
      Logger.warning('Invalid customer ID format', { customerId, path: req.path });
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID format',
        message: 'Customer ID must be a non-empty string'
      });
    }

    req.validatedCustomerId = customerId.trim();
    Logger.debug('Customer ID validated', { customerId: req.validatedCustomerId, path: req.path });
    next();

  } catch (error) {
    Logger.error('Customer ID validation error', error);
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: error.message
    });
  }
};

// Rate limiting middleware'i (basit implementasyon)
const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const customerId = req.customerId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Eski istekleri temizle
    if (requests.has(customerId)) {
      requests.set(customerId, requests.get(customerId).filter(time => time > windowStart));
    } else {
      requests.set(customerId, []);
    }

    const customerRequests = requests.get(customerId);

    // Rate limit kontrolü
    if (customerRequests.length >= maxRequests) {
      Logger.warning('Rate limit exceeded', { customerId, path: req.path });
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} requests per ${windowMs / 1000} seconds`
      });
    }

    // İsteği kaydet
    customerRequests.push(now);
    requests.set(customerId, customerRequests);

    Logger.debug('Request rate limit check passed', { customerId, path: req.path });
    next();
  };
};

// Admin yetki kontrolü middleware'i
const requireAdmin = (req, res, next) => {
  try {
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_API_KEY;
    
    if (!isAdmin) {
      Logger.warning('Admin access denied', { path: req.path });
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        message: 'This endpoint requires admin privileges'
      });
    }

    Logger.success('Admin access granted', { path: req.path });
    next();

  } catch (error) {
    Logger.error('Admin authentication error', error);
    return res.status(403).json({
      success: false,
      error: 'Admin authentication error',
      message: error.message
    });
  }
};

export {
  authenticateApiKey,
  optionalApiKeyAuth,
  validateCustomerId,
  rateLimit,
  requireAdmin
};
