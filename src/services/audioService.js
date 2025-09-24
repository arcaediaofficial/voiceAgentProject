import textToSpeech from '@google-cloud/text-to-speech';
import { Readable } from 'stream';
import Logger from '../utils/logging.js';
import 'dotenv/config';

class AudioService {
  constructor() {
    this.client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    this.defaultVoice = {
      languageCode: 'en-US',
      name: 'en-US-Standard-A',
      ssmlGender: 'FEMALE'
    };
  }

  async generateAudioStream(text, voiceConfig = {}) {
    try {
      const voice = { ...this.defaultVoice, ...voiceConfig };
      Logger.audioGeneration(voice.name, text.length);

      const request = {
        input: { text },
        voice: voice,
        audioConfig: { 
          audioEncoding: 'MP3',
          speakingRate: 1.2
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      Logger.success('Google TTS completed', { voice: voice.name });
      
      // Buffer'ı stream'e çevir
      const stream = new Readable();
      stream.push(response.audioContent);
      stream.push(null);
      
      return stream;

    } catch (error) {
      Logger.error('Audio generation failed', error);
      throw error;
    }
  }
}

export default new AudioService();
