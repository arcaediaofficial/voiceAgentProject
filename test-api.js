import fetch from 'node-fetch';
import fs from 'fs';

class APITester {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.apiKey = null;
    this.customerId = 'test_customer';
  }

  async testCustomerRegistration() {
    console.log('🧪 Testing customer registration...');
    
    try {
      const response = await fetch(`${this.baseUrl}/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: this.customerId,
          name: 'Test Müşteri',
          supabaseUrl: process.env.DEFAULT_SUPABASE_URL,
          supabaseKey: process.env.DEFAULT_SUPABASE_ANON_KEY,
          email: 'test@example.com'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.apiKey = data.data.apiKey;
        console.log('✅ Customer registered successfully');
        console.log(`🔑 API Key: ${this.apiKey}`);
        return true;
      } else {
        console.log('❌ Customer registration failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Customer registration error:', error.message);
      return false;
    }
  }

  async testTextAsk() {
    console.log('\n🧪 Testing text ask endpoint...');
    
    if (!this.apiKey) {
      console.log('❌ No API key available');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/ask/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          productCode: 'PROD001',
          question: 'Bu ürünün fiyatı nedir?'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Text ask successful');
        console.log(`🤖 Answer: ${data.data.answer}`);
        return true;
      } else {
        console.log('❌ Text ask failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Text ask error:', error.message);
      return false;
    }
  }

  async testAudioAsk() {
    console.log('\n🧪 Testing audio ask endpoint...');
    
    if (!this.apiKey) {
      console.log('❌ No API key available');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          productCode: 'PROD001',
          question: 'Bu ürünün özellikleri nelerdir?',
          voiceId: '21m00Tcm4TlvDq8ikWAM'
        })
      });

      if (response.ok) {
        const audioBuffer = await response.buffer();
        fs.writeFileSync('test-response.mp3', audioBuffer);
        console.log('✅ Audio ask successful');
        console.log('🎵 Audio saved as test-response.mp3');
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ Audio ask failed:', errorData.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Audio ask error:', error.message);
      return false;
    }
  }

  async testVoicesList() {
    console.log('\n🧪 Testing voices list endpoint...');
    
    if (!this.apiKey) {
      console.log('❌ No API key available');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Voices list successful');
        console.log(`🎤 Available voices: ${data.data.length}`);
        console.log('📝 First 3 voices:');
        data.data.slice(0, 3).forEach(voice => {
          console.log(`  - ${voice.name} (${voice.id})`);
        });
        return true;
      } else {
        console.log('❌ Voices list failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Voices list error:', error.message);
      return false;
    }
  }

  async testHealthCheck() {
    console.log('\n🧪 Testing health check...');
    
    try {
      const response = await fetch('http://localhost:3000/api/health');
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('✅ Health check successful');
        console.log(`⏱️ Uptime: ${data.uptime}s`);
        return true;
      } else {
        console.log('❌ Health check failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Health check error:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API tests...\n');
    
    const tests = [
      { name: 'Health Check', fn: () => this.testHealthCheck() },
      { name: 'Customer Registration', fn: () => this.testCustomerRegistration() },
      { name: 'Text Ask', fn: () => this.testTextAsk() },
      { name: 'Audio Ask', fn: () => this.testAudioAsk() },
      { name: 'Voices List', fn: () => this.testVoicesList() }
    ];

    const results = [];
    
    for (const test of tests) {
      console.log(`\n📋 Running: ${test.name}`);
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    }

    console.log('\n📊 Test Results:');
    console.log('================');
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
    });

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above.');
    }
  }
}

// Test'i çalıştır
import 'dotenv/config';

const tester = new APITester();
tester.runAllTests().catch(console.error);

export default APITester;
