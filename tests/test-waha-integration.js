const axios = require('axios');
require('dotenv').config();

class WAHAIntegrationTest {
  constructor() {
    this.wahaBaseUrl = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.wahaApiKey = process.env.WAHA_API_KEY || 'admin';
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';
    this.sessionName = process.env.WA_SESSION_NAME || 'default';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting WAHA Integration Tests...\n');

    await this.testWAHAHealth();
    await this.testWAHASession();
    await this.testWebhookHealth();
    await this.testSendMessage();
    await this.testSendImage();
    await this.testBroadcast();
    await this.testAdminFunctions();
    await this.testSessionStatus();
    
    this.printResults();
  }

  async testWAHAHealth() {
    console.log('1. Testing WAHA Service Health...');
    try {
      const response = await axios.get(`${this.wahaBaseUrl}/api/version`, {
        headers: { 'X-Api-Key': this.wahaApiKey },
        timeout: 5000
      });

      if (response.status === 200) {
        console.log(`✅ WAHA is running - Version: ${response.data.version}`);
        this.testResults.push({ test: 'WAHA Health', status: 'PASS', details: response.data });
      }
    } catch (error) {
      console.log(`❌ WAHA health check failed: ${error.message}`);
      this.testResults.push({ test: 'WAHA Health', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testWAHASession() {
    console.log('2. Testing WAHA Session Management...');
    try {
      // List sessions
      const sessionsResponse = await axios.get(`${this.wahaBaseUrl}/api/sessions`, {
        headers: { 'X-Api-Key': this.wahaApiKey }
      });

      console.log(`📱 Found ${sessionsResponse.data.length} sessions`);

      // Check specific session
      try {
        const sessionResponse = await axios.get(`${this.wahaBaseUrl}/api/sessions/${this.sessionName}`, {
          headers: { 'X-Api-Key': this.wahaApiKey }
        });

        console.log(`✅ Session '${this.sessionName}' status: ${sessionResponse.data.status}`);
        this.testResults.push({ 
          test: 'Session Management', 
          status: 'PASS', 
          details: sessionResponse.data 
        });
      } catch (sessionError) {
        if (sessionError.response?.status === 404) {
          console.log(`⚠️ Session '${this.sessionName}' not found - may need to be created`);
          
          // Try to create session
          try {
            const createResponse = await axios.post(`${this.wahaBaseUrl}/api/sessions`, {
              name: this.sessionName
            }, {
              headers: { 'X-Api-Key': this.wahaApiKey }
            });

            console.log(`✅ Session '${this.sessionName}' created successfully`);
            this.testResults.push({ 
              test: 'Session Management', 
              status: 'PASS', 
              details: createResponse.data 
            });
          } catch (createError) {
            console.log(`❌ Failed to create session: ${createError.message}`);
            this.testResults.push({ 
              test: 'Session Management', 
              status: 'FAIL', 
              error: createError.message 
            });
          }
        } else {
          throw sessionError;
        }
      }
    } catch (error) {
      console.log(`❌ Session management failed: ${error.message}`);
      this.testResults.push({ test: 'Session Management', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testWebhookHealth() {
    console.log('3. Testing Webhook Service Health...');
    try {
      const response = await axios.get(`${this.webhookBaseUrl}/health`, {
        timeout: 5000
      });

      if (response.status === 200) {
        console.log(`✅ Webhook service is running - Version: ${response.data.version}`);
        this.testResults.push({ test: 'Webhook Health', status: 'PASS', details: response.data });
      }
    } catch (error) {
      console.log(`❌ Webhook health check failed: ${error.message}`);
      this.testResults.push({ test: 'Webhook Health', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testSendMessage() {
    console.log('4. Testing Send Message Functionality...');
    try {
      // Test sending message via webhook
      const testChatId = '6281234567890@c.us'; // Replace with valid test number
      const testMessage = `🧪 Test message from WAHA Integration Test at ${new Date().toISOString()}`;

      const response = await axios.post(`${this.webhookBaseUrl}/webhook/send-message`, {
        chatId: testChatId,
        text: testMessage,
        sessionName: this.sessionName
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        console.log(`✅ Message sent successfully to ${testChatId}`);
        this.testResults.push({ 
          test: 'Send Message', 
          status: 'PASS', 
          details: response.data 
        });
      } else {
        console.log(`⚠️ Message sending had issues: ${JSON.stringify(response.data)}`);
        this.testResults.push({ 
          test: 'Send Message', 
          status: 'PARTIAL', 
          details: response.data 
        });
      }
    } catch (error) {
      console.log(`❌ Send message test failed: ${error.message}`);
      this.testResults.push({ test: 'Send Message', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testSendImage() {
    console.log('5. Testing Send Image Functionality...');
    try {
      const testChatId = '6281234567890@c.us'; // Replace with valid test number
      const testImageUrl = 'https://via.placeholder.com/300x200.png?text=WAHA+Test+Image';
      const testCaption = '🖼️ Test image from WAHA Integration Test';

      const response = await axios.post(`${this.webhookBaseUrl}/webhook/send-image`, {
        chatId: testChatId,
        imageUrl: testImageUrl,
        caption: testCaption,
        sessionName: this.sessionName
      }, {
        timeout: 15000
      });

      if (response.data.success) {
        console.log(`✅ Image sent successfully to ${testChatId}`);
        this.testResults.push({ 
          test: 'Send Image', 
          status: 'PASS', 
          details: response.data 
        });
      } else {
        console.log(`⚠️ Image sending had issues: ${JSON.stringify(response.data)}`);
        this.testResults.push({ 
          test: 'Send Image', 
          status: 'PARTIAL', 
          details: response.data 
        });
      }
    } catch (error) {
      console.log(`❌ Send image test failed: ${error.message}`);
      this.testResults.push({ test: 'Send Image', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testBroadcast() {
    console.log('6. Testing Broadcast Functionality...');
    try {
      const testMessage = `📢 Test broadcast from WAHA Integration Test at ${new Date().toISOString()}\n\nThis is a test broadcast message. Please ignore.`;
      const excludeNumbers = ['6281234567890']; // Exclude test numbers

      const response = await axios.post(`${this.webhookBaseUrl}/webhook/broadcast`, {
        message: testMessage,
        excludeNumbers: excludeNumbers,
        sessionName: this.sessionName
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        console.log(`✅ Broadcast completed - Success: ${response.data.successCount}, Failed: ${response.data.errorCount}`);
        this.testResults.push({ 
          test: 'Broadcast', 
          status: 'PASS', 
          details: response.data 
        });
      } else {
        console.log(`⚠️ Broadcast had issues: ${JSON.stringify(response.data)}`);
        this.testResults.push({ 
          test: 'Broadcast', 
          status: 'PARTIAL', 
          details: response.data 
        });
      }
    } catch (error) {
      console.log(`❌ Broadcast test failed: ${error.message}`);
      this.testResults.push({ test: 'Broadcast', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testAdminFunctions() {
    console.log('7. Testing Admin Functions...');
    
    // Test admin status
    try {
      const adminNumber = process.env.ADMIN_NUMBERS?.split(',')[0] || '6281234567890';
      
      const statusResponse = await axios.post(`${this.webhookBaseUrl}/webhook/admin`, {
        command: 'status',
        adminNumber: adminNumber,
        sessionName: this.sessionName
      });

      if (statusResponse.data.success) {
        console.log(`✅ Admin status check successful`);
        console.log(`📊 Session: ${statusResponse.data.result.sessionName}, Status: ${statusResponse.data.result.status}`);
      }

      // Test admin stats
      const statsResponse = await axios.post(`${this.webhookBaseUrl}/webhook/admin`, {
        command: 'stats',
        adminNumber: adminNumber,
        sessionName: this.sessionName
      });

      if (statsResponse.data.success) {
        console.log(`✅ Admin stats check successful`);
        console.log(`📈 Total chats: ${statsResponse.data.result.stats.totalChats}`);
      }

      this.testResults.push({ 
        test: 'Admin Functions', 
        status: 'PASS', 
        details: { status: statusResponse.data, stats: statsResponse.data } 
      });

    } catch (error) {
      console.log(`❌ Admin functions test failed: ${error.message}`);
      this.testResults.push({ test: 'Admin Functions', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testSessionStatus() {
    console.log('8. Testing Session Status API...');
    try {
      const response = await axios.get(`${this.webhookBaseUrl}/api/session/status/${this.sessionName}`);

      console.log(`✅ Session status retrieved: ${response.data.status}`);
      this.testResults.push({ 
        test: 'Session Status API', 
        status: 'PASS', 
        details: response.data 
      });
    } catch (error) {
      console.log(`❌ Session status test failed: ${error.message}`);
      this.testResults.push({ test: 'Session Status API', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testScreenshot() {
    console.log('9. Testing Screenshot Functionality...');
    try {
      const response = await axios.get(`${this.webhookBaseUrl}/api/screenshot/${this.sessionName}`, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      if (response.data && response.data.byteLength > 0) {
        console.log(`✅ Screenshot captured - Size: ${response.data.byteLength} bytes`);
        this.testResults.push({ 
          test: 'Screenshot', 
          status: 'PASS', 
          details: { size: response.data.byteLength } 
        });
      } else {
        console.log(`⚠️ Screenshot was empty`);
        this.testResults.push({ test: 'Screenshot', status: 'PARTIAL', details: 'Empty screenshot' });
      }
    } catch (error) {
      console.log(`❌ Screenshot test failed: ${error.message}`);
      this.testResults.push({ test: 'Screenshot', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  printResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    let passed = 0;
    let failed = 0;
    let partial = 0;

    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
      
      if (result.status === 'PASS') passed++;
      else if (result.status === 'FAIL') failed++;
      else partial++;
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n📈 STATISTICS');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Partial: ${partial}`);
    console.log(`   Total: ${this.testResults.length}`);

    const successRate = ((passed + partial * 0.5) / this.testResults.length * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);

    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! WAHA integration is working properly.');
    } else if (failed < this.testResults.length / 2) {
      console.log('\n⚠️ Some tests failed, but core functionality appears to be working.');
    } else {
      console.log('\n🚨 Many tests failed. Please check your WAHA and webhook configuration.');
    }
  }

  async testGoogleSheetsIntegration() {
    console.log('10. Testing Google Sheets Integration...');
    try {
      const GoogleSheetsIntegration = require('../wa-bot/google-sheets');
      const googleSheets = new GoogleSheetsIntegration();

      const testLogData = {
        number: '6281234567890',
        text: 'Test message for Google Sheets integration',
        messageType: 'text',
        reply: 'Test reply',
        isAdmin: false
      };

      await googleSheets.logMessage(testLogData);
      
      console.log('✅ Google Sheets integration test passed');
      this.testResults.push({ test: 'Google Sheets Integration', status: 'PASS' });
    } catch (error) {
      console.log(`❌ Google Sheets integration test failed: ${error.message}`);
      this.testResults.push({ test: 'Google Sheets Integration', status: 'FAIL', error: error.message });
    }
    console.log('');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new WAHAIntegrationTest();
  
  console.log('🚀 WAHA Integration Test Suite');
  console.log('===============================\n');
  
  // Check environment variables
  console.log('🔧 Configuration:');
  console.log(`   WAHA URL: ${tester.wahaBaseUrl}`);
  console.log(`   Webhook URL: ${tester.webhookBaseUrl}`);
  console.log(`   Session: ${tester.sessionName}`);
  console.log('');

  tester.runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = WAHAIntegrationTest;