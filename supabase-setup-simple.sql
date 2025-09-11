-- Müşteri tablosu
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  supabase_url TEXT NOT NULL,
  supabase_key TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API key tablosu
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) DEFAULT 'Default API Key',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE(customer_id, api_key)
);

-- Index'ler
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_api_keys_customer_id ON api_keys(customer_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Trigger fonksiyonu - updated_at alanını güncelle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları ekle
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- API key kullanımını takip etmek için fonksiyon
CREATE OR REPLACE FUNCTION update_api_key_usage(api_key_param VARCHAR(255))
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys 
    SET last_used_at = NOW() 
    WHERE api_key = api_key_param;
END;
$$ language 'plpgsql';
