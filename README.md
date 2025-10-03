# Voice Agent Project

Text and voice based AI agent that can answer questions about products.

## Features

- OpenAI GPT integration for intelligent responses
- Text-to-Speech capability using Google Cloud TTS
- Supabase Vector DB for semantic product search
- Real-time audio streaming
- Multi-tenant architecture

## Installation

```bash
# Install dependencies
npm install

# Configure credentials
# 1. Create src/config/CloudTTSCredential.json with your Google Cloud credentials:
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-service-account-email",
  "client_id": "your-client-id"
}

# 2. Create .env file with required environment variables:
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=your-redis-url # Local: redis://localhost:6379, Railway: redis://default:PASSWORD@trolley.proxy.rlwy.net:36273
GOOGLE_APPLICATION_CREDENTIALS=src/config/CloudTTSCredential.json

# For Railway deployment:
# 1. Convert Google Cloud credentials to base64:
#    base64 -i src/config/CloudTTSCredential.json
# 2. Set these environment variables in Railway Dashboard:
#    GOOGLE_CREDENTIALS_BASE64=<base64_output_from_step_1>
#    REDIS_URL=redis://default:PASSWORD@trolley.proxy.rlwy.net:36273
#    OPENAI_API_KEY=your-openai-api-key

# Start the application
npm start

# Run in development mode (with nodemon)
npm run dev
```

## API Endpoints

- `POST /api/ask` - Ask questions about products (returns audio)
- `POST /api/ask/text` - Ask questions (text-only response)
- `GET /api/voices` - List available TTS voices

## Development

```bash
# Install development dependencies
npm install --save-dev nodemon

# Run in development mode
npm run dev
```

## Architecture

- Express.js web framework
- OpenAI GPT & TTS APIs
- Supabase Vector Database
- Streaming audio responses
- Multi-tenant customer isolation
