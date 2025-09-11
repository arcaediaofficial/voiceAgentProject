# Voice Agent Project

Text and voice based AI agent that can answer questions about products.

## Features

- OpenAI GPT integration for intelligent responses
- Text-to-Speech capability using OpenAI TTS
- Supabase Vector DB for semantic product search
- Real-time audio streaming
- Multi-tenant architecture

## Installation

```bash
# Install dependencies
npm install

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