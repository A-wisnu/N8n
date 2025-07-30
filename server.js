const express = require('express');
const axios = require('axios');
const GoogleSheetsIntegration = require('./wa-bot/google-sheets');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for global access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Google Sheets
const googleSheets = new GoogleSheetsIntegration();

// Homepage with API documentation
app.get('/', (req, res) => {
  res.json({
    message: '🕌 Masjid AI Agent - Global Testing Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      {
        method: 'GET',
        path: '/api/status',
        description: 'Check server status'
      },
      {
        method: 'POST',
        path: '/api/message',
        description: 'Send message to AI agent',
        body: {
          number: '628123456789',
          text: 'jadwal sholat jakarta'
        }
      },
      {
        method: 'GET',
        path: '/api/prayer/:city',
        description: 'Get prayer times for city'
      },
      {
        method: 'POST',
        path: '/api/ai-chat',
        description: 'Chat with AI directly',
        body: {
          message: 'Kapan waktu sholat Maghrib?'
        }
      },
      {
        method: 'GET',
        path: '/api/sheets/test',
        description: 'Test Google Sheets connection'
      },
      {
        method: 'GET',
        path: '/api/faq',
        description: 'Get FAQ data from Google Sheets'
      }
    ],
    configuration: {
      openrouter_model: process.env.OPENROUTER_MODEL,
      prayer_api: process.env.PRAYER_API_BASE,
      google_sheets_configured: !!(process.env.GOOGLE_SHEETS_API_KEY && process.env.GOOGLE_SHEETS_ID)
    }
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: {
      node_version: process.version,
      platform: process.platform,
      openrouter_configured: !!process.env.OPENROUTER_API_KEY,
      google_sheets_configured: googleSheets.isConfigured(),
      prayer_api: process.env.PRAYER_API_BASE || 'https://api.aladhan.com/v1'
    }
  });
});

// Message processing endpoint (simulates WhatsApp message)
app.post('/api/message', async (req, res) => {
  try {
    const { number, text } = req.body;
    
    if (!number || !text) {
      return res.status(400).json({
        error: 'Missing required fields: number and text'
      });
    }

    console.log(`📩 Received message from ${number}: ${text}`);

    // Simulate message analysis
    const messageData = {
      number: number,
      text: text,
      timestamp: new Date().toISOString(),
      messageId: `test_${Date.now()}`,
      isAdmin: false
    };

    // Send to n8n webhook (if configured)
    let n8nResponse = null;
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await axios.post(process.env.N8N_WEBHOOK_URL, messageData, {
          timeout: 10000
        });
        n8nResponse = response.data;
      } catch (error) {
        console.error('❌ N8N webhook error:', error.message);
        n8nResponse = { error: 'N8N webhook not available' };
      }
    }

    // Log to Google Sheets
    let sheetsResponse = null;
    if (googleSheets.isConfigured()) {
      sheetsResponse = await googleSheets.logMessage({
        number: number,
        text: text,
        messageType: 'api_test',
        reply: n8nResponse?.reply || 'No reply from n8n',
        isAdmin: false,
        source: 'api_test'
      });
    }

    res.json({
      success: true,
      message: 'Message processed successfully',
      data: {
        original_message: messageData,
        n8n_response: n8nResponse,
        sheets_logged: sheetsResponse?.success || false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Message processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Prayer times endpoint
app.get('/api/prayer/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const apiBase = process.env.PRAYER_API_BASE || 'https://api.aladhan.com/v1';
    
    console.log(`🕌 Getting prayer times for ${city}`);

    // Try Aladhan API first
    try {
      const response = await axios.get(
        `${apiBase}/timingsByCity?city=${city}&country=ID&method=2`,
        { timeout: 10000 }
      );

      if (response.data.code === 200 && response.data.data && response.data.data.timings) {
        const timings = response.data.data.timings;
        const date = response.data.data.date.readable;

        const prayerTimes = {
          city: city,
          date: date,
          source: 'aladhan',
          timings: {
            subuh: timings.Fajr,
            dzuhur: timings.Dhuhr,
            ashar: timings.Asr,
            maghrib: timings.Maghrib,
            isya: timings.Isha
          }
        };

        // Log to Google Sheets
        if (googleSheets.isConfigured()) {
          await googleSheets.logPrayerRequest({
            number: 'api_test',
            city: city,
            source: 'aladhan',
            success: true,
            error: ''
          });
        }

        return res.json({
          success: true,
          data: prayerTimes
        });
      }
    } catch (aladhanError) {
      console.log('⚠️ Aladhan API failed, trying MyQuran API...');
    }

    // Fallback to MyQuran API
    const myquranBase = process.env.MYQURAN_API_BASE || 'https://api.myquran.com/v2';
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    // For MyQuran, we need city ID (simplified mapping)
    const cityMap = {
      'jakarta': '1301',
      'bandung': '3273',
      'surabaya': '3578',
      'medan': '1275',
      'semarang': '3374'
    };

    const cityId = cityMap[city.toLowerCase()] || '1301'; // Default to Jakarta

    const myquranResponse = await axios.get(
      `${myquranBase}/sholat/jadwal/${cityId}/${year}/${month}/${date}`,
      { timeout: 10000 }
    );

    if (myquranResponse.data.status && myquranResponse.data.data) {
      const data = myquranResponse.data.data;
      const prayerTimes = {
        city: city,
        date: `${date}/${month}/${year}`,
        source: 'myquran',
        timings: {
          subuh: data.subuh,
          dzuhur: data.dzuhur,
          ashar: data.ashar,
          maghrib: data.maghrib,
          isya: data.isya
        }
      };

      // Log to Google Sheets
      if (googleSheets.isConfigured()) {
        await googleSheets.logPrayerRequest({
          number: 'api_test',
          city: city,
          source: 'myquran',
          success: true,
          error: ''
        });
      }

      return res.json({
        success: true,
        data: prayerTimes
      });
    }

    throw new Error('Both prayer APIs failed');

  } catch (error) {
    console.error('❌ Prayer times error:', error.message);
    
    // Log error to Google Sheets
    if (googleSheets.isConfigured()) {
      await googleSheets.logPrayerRequest({
        number: 'api_test',
        city: req.params.city,
        source: 'api_error',
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get prayer times',
      message: error.message
    });
  }
});

// AI Chat endpoint
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Missing required field: message'
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: 'OpenRouter API not configured'
      });
    }

    console.log(`🤖 AI Chat request: ${message}`);

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah asisten AI untuk masjid. Jawab dengan ramah, informatif, dan sesuai dengan nilai-nilai Islam. Gunakan bahasa Indonesia.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiReply = response.data.choices[0].message.content;

    // Log to Google Sheets
    if (googleSheets.isConfigured()) {
      await googleSheets.logMessage({
        number: 'api_test',
        text: message,
        messageType: 'ai_chat',
        reply: aiReply,
        isAdmin: false,
        source: 'api_direct'
      });
    }

    res.json({
      success: true,
      data: {
        question: message,
        answer: aiReply,
        model: process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: 'AI Chat failed',
      message: error.message
    });
  }
});

// Google Sheets test endpoint
app.get('/api/sheets/test', async (req, res) => {
  try {
    if (!googleSheets.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured',
        message: 'GOOGLE_SHEETS_API_KEY or GOOGLE_SHEETS_ID missing'
      });
    }

    // Test logging a message
    const testResult = await googleSheets.logMessage({
      number: 'api_test',
      text: 'Test message from API endpoint',
      messageType: 'api_test',
      reply: 'Test successful',
      isAdmin: false,
      source: 'api_endpoint'
    });

    res.json({
      success: testResult.success,
      message: testResult.success ? 'Google Sheets connection working!' : 'Google Sheets test failed',
      data: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sheets test error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Google Sheets test failed',
      message: error.message
    });
  }
});

// FAQ endpoint
app.get('/api/faq', async (req, res) => {
  try {
    if (!googleSheets.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    const faqData = await googleSheets.getFAQData();

    res.json({
      success: true,
      count: faqData.length,
      data: faqData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAQ error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get FAQ data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /api/status',
      'POST /api/message',
      'GET /api/prayer/:city',
      'POST /api/ai-chat',
      'GET /api/sheets/test',
      'GET /api/faq',
      'GET /health'
    ]
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log('🚀 Masjid AI Agent Server Started!');
  console.log('=====================================');
  console.log(`📡 Server running on: http://0.0.0.0:${port}`);
  console.log(`🌍 Global access: http://YOUR_IP:${port}`);
  console.log('');
  console.log('📋 Configuration:');
  console.log(`   OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Google Sheets: ${googleSheets.isConfigured() ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Prayer API: ${process.env.PRAYER_API_BASE || 'https://api.aladhan.com/v1'}`);
  console.log('');
  console.log('🔗 Available Endpoints:');
  console.log(`   Homepage: http://0.0.0.0:${port}/`);
  console.log(`   Status: http://0.0.0.0:${port}/api/status`);
  console.log(`   Prayer Times: http://0.0.0.0:${port}/api/prayer/jakarta`);
  console.log(`   Sheets Test: http://0.0.0.0:${port}/api/sheets/test`);
  console.log('');
  console.log('🌐 Ready for global testing!');
});

module.exports = app;