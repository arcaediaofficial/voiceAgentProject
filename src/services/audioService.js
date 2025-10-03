import textToSpeech from '@google-cloud/text-to-speech';
import { Readable } from 'stream';
import Logger from '../utils/logging.js';
import 'dotenv/config';

class AudioService {
  constructor() {
    let credentials;
    
    // Environment variables'dan credentials oluştur
    if (process.env.GOOGLE_PRIVATE_KEY) {
      credentials = {
        type: process.env.GOOGLE_CREDENTIALS_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.split('\\n').join('\n') : undefined,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
      };
    }

    this.client = new textToSpeech.TextToSpeechClient({
      credentials: credentials || undefined,
      keyFilename: !credentials ? process.env.GOOGLE_APPLICATION_CREDENTIALS : undefined
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
