import fetch from 'node-fetch';
import Logger from '../utils/logging.js';
import 'dotenv/config';

class AudioService {
  constructor() {
    this.baseUrl = 'https://api.openai.com/v1/audio/speech';
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async generateAudioStream(text) {
    try {
      Logger.audioGeneration('coral', text.length);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'coral',
          input: text,
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI streaming error: ${response.status} - ${errorText}`);
      }

      Logger.success('OpenAI streaming started', { voice: 'coral' });
      return response.body;

    } catch (error) {
      Logger.error('Audio generation failed', error);
      throw error;
    }
  }
}

export default new AudioService();
