const express = require('express');
const axios = require('axios');
require('dotenv').config();

class WebhookHandler {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.wahaBaseUrl = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.wahaApiKey = process.env.WAHA_API_KEY || 'admin';
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Masjid WhatsApp Bot Webhook (WAHA)',
        version: '2.0'
      });
    });

    // WAHA webhook endpoint for receiving messages
    this.app.post('/webhook/waha', async (req, res) => {
      try {
        const webhookData = req.body;
        console.log('📨 WAHA webhook received:', JSON.stringify(webhookData, null, 2));

        // Acknowledge receipt immediately
        res.json({
          success: true,
          message: 'Webhook received',
          timestamp: new Date().toISOString()
        });

        // Process the webhook data based on event type
        await this.handleWAHAWebhook(webhookData);

      } catch (error) {
        console.error('❌ Error handling WAHA webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for receiving broadcast messages from n8n
    this.app.post('/webhook/broadcast', async (req, res) => {
      try {
        const { message, excludeNumbers = [], sessionName = 'default' } = req.body;

        if (!message) {
          return res.status(400).json({
            error: 'Message is required',
            received: req.body
          });
        }

        console.log('📢 Broadcast request received:', { message, excludeNumbers, sessionName });

        // Send broadcast via WAHA
        const result = await this.sendBroadcastViaWAHA(message, excludeNumbers, sessionName);

        res.json(result);

      } catch (error) {
        console.error('❌ Error handling broadcast webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for sending individual messages
    this.app.post('/webhook/send-message', async (req, res) => {
      try {
        const { chatId, text, sessionName = 'default' } = req.body;

        if (!chatId || !text) {
          return res.status(400).json({
            error: 'chatId and text are required'
          });
        }

        console.log(`💬 Send message request: ${chatId} -> ${text}`);

        const result = await this.sendMessageViaWAHA(chatId, text, sessionName);
        res.json(result);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for sending images
    this.app.post('/webhook/send-image', async (req, res) => {
      try {
        const { chatId, imageUrl, caption = '', sessionName = 'default' } = req.body;

        if (!chatId || !imageUrl) {
          return res.status(400).json({
            error: 'chatId and imageUrl are required'
          });
        }

        console.log(`🖼️ Send image request: ${chatId} -> ${imageUrl}`);

        const result = await this.sendImageViaWAHA(chatId, imageUrl, caption, sessionName);
        res.json(result);

      } catch (error) {
        console.error('❌ Error sending image:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for prayer time notifications
    this.app.post('/webhook/prayer-notification', async (req, res) => {
      try {
        const { prayerName, time, city, sessionName = 'default' } = req.body;

        if (!prayerName || !time) {
          return res.status(400).json({
            error: 'Prayer name and time are required'
          });
        }

        console.log(`🕌 Prayer notification: ${prayerName} at ${time} in ${city || 'default city'}`);

        // Format prayer notification message
        const notificationMessage = `🕌 *Waktu Sholat ${prayerName}*\n\n` +
          `⏰ Waktu: ${time}\n` +
          `📍 Lokasi: ${city || process.env.DEFAULT_CITY}\n\n` +
          `🤲 Mari bersiap untuk menunaikan sholat ${prayerName}`;

        // Broadcast prayer notification
        const result = await this.sendBroadcastViaWAHA(notificationMessage, [], sessionName);

        res.json({
          success: true,
          message: 'Prayer notification sent',
          prayerName,
          time,
          city,
          broadcastResult: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error handling prayer notification webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for admin commands
    this.app.post('/webhook/admin', async (req, res) => {
      try {
        const { command, data, adminNumber, sessionName = 'default' } = req.body;

        // Verify admin authorization
        const adminNumbers = process.env.ADMIN_NUMBERS ? process.env.ADMIN_NUMBERS.split(',') : [];
        if (!adminNumbers.includes(adminNumber)) {
          return res.status(403).json({
            error: 'Unauthorized: Not an admin number'
          });
        }

        console.log(`👨‍💼 Admin command received from ${adminNumber}:`, { command, data });

        let result;

        switch (command) {
          case 'broadcast':
            result = await this.handleAdminBroadcast(data, sessionName);
            break;
          case 'status':
            result = await this.handleAdminStatus(sessionName);
            break;
          case 'stats':
            result = await this.handleAdminStats(sessionName);
            break;
          case 'screenshot':
            result = await this.handleAdminScreenshot(sessionName);
            break;
          default:
            return res.status(400).json({
              error: 'Unknown admin command',
              availableCommands: ['broadcast', 'status', 'stats', 'screenshot']
            });
        }

        res.json({
          success: true,
          command,
          result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error handling admin webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Generic webhook endpoint for n8n integration
    this.app.post('/webhook/n8n', async (req, res) => {
      try {
        const webhookData = req.body;
        console.log('🔗 n8n webhook received:', webhookData);

        // Process the webhook data based on type
        const { type, payload } = webhookData;

        let response;

        switch (type) {
          case 'message_reply':
            response = await this.handleMessageReply(payload);
            break;
          case 'broadcast':
            response = await this.handleBroadcast(payload);
            break;
          case 'prayer_reminder':
            response = await this.handlePrayerReminder(payload);
            break;
          default:
            response = {
              success: false,
              error: 'Unknown webhook type',
              type
            };
        }

        res.json(response);

      } catch (error) {
        console.error('❌ Error handling n8n webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Get WAHA session status
    this.app.get('/api/session/status/:sessionName?', async (req, res) => {
      try {
        const sessionName = req.params.sessionName || 'default';
        const status = await this.getWAHASessionStatus(sessionName);
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get WAHA screenshot
    this.app.get('/api/screenshot/:sessionName?', async (req, res) => {
      try {
        const sessionName = req.params.sessionName || 'default';
        const screenshot = await this.getWAHAScreenshot(sessionName);
        
        res.set({
          'Content-Type': 'image/png',
          'Content-Length': screenshot.length
        });
        
        res.send(screenshot);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  async handleWAHAWebhook(webhookData) {
    // Handle different types of WAHA webhooks
    const { event, session, payload } = webhookData;

    switch (event) {
      case 'message':
        console.log(`📩 Message received in session ${session}:`, payload);
        // Forward to n8n or process directly
        if (process.env.N8N_WEBHOOK_URL) {
          await this.forwardToN8n({
            type: 'message',
            session,
            message: payload
          });
        }
        break;
        
      case 'session.status':
        console.log(`📱 Session status changed for ${session}:`, payload.status);
        break;
        
      default:
        console.log(`🔔 Unknown webhook event: ${event}`);
    }
  }

  async forwardToN8n(data) {
    try {
      await axios.post(process.env.N8N_WEBHOOK_URL, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Data forwarded to n8n');
    } catch (error) {
      console.error('❌ Error forwarding to n8n:', error.message);
    }
  }

  async sendMessageViaWAHA(chatId, text, sessionName = 'default') {
    try {
      const response = await axios.post(`${this.wahaBaseUrl}/api/sendText`, {
        session: sessionName,
        chatId: chatId,
        text: text
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.wahaApiKey
        }
      });

      return {
        success: true,
        action: 'message_sent',
        chatId,
        text,
        wahaResponse: response.data
      };
    } catch (error) {
      throw new Error(`Failed to send message via WAHA: ${error.message}`);
    }
  }

  async sendImageViaWAHA(chatId, imageUrl, caption = '', sessionName = 'default') {
    try {
      const response = await axios.post(`${this.wahaBaseUrl}/api/sendImage`, {
        session: sessionName,
        chatId: chatId,
        url: imageUrl,
        caption: caption
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.wahaApiKey
        }
      });

      return {
        success: true,
        action: 'image_sent',
        chatId,
        imageUrl,
        caption,
        wahaResponse: response.data
      };
    } catch (error) {
      throw new Error(`Failed to send image via WAHA: ${error.message}`);
    }
  }

  async sendBroadcastViaWAHA(message, excludeNumbers = [], sessionName = 'default') {
    try {
      // Get all chats from WAHA
      const chatsResponse = await axios.get(`${this.wahaBaseUrl}/api/chats`, {
        params: { session: sessionName },
        headers: { 'X-Api-Key': this.wahaApiKey }
      });

      const chats = chatsResponse.data;
      const privateChats = chats.filter(chat => 
        !chat.id.includes('@g.us') && 
        !excludeNumbers.includes(chat.id) &&
        !excludeNumbers.includes(chat.id.replace('@c.us', ''))
      );

      console.log(`📢 Broadcasting to ${privateChats.length} chats`);

      let successCount = 0;
      let errorCount = 0;

      for (const chat of privateChats) {
        try {
          await this.sendMessageViaWAHA(chat.id, message, sessionName);
          successCount++;
          
          // Delay between messages to avoid spam detection
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Broadcast error for ${chat.id}:`, error.message);
          errorCount++;
        }
      }

      return {
        success: true,
        action: 'broadcast_completed',
        message,
        successCount,
        errorCount,
        totalChats: privateChats.length
      };
    } catch (error) {
      throw new Error(`Failed to broadcast via WAHA: ${error.message}`);
    }
  }

  async getWAHASessionStatus(sessionName = 'default') {
    try {
      const response = await axios.get(`${this.wahaBaseUrl}/api/sessions/${sessionName}`, {
        headers: { 'X-Api-Key': this.wahaApiKey }
      });
      return response.data;
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  async getWAHAScreenshot(sessionName = 'default') {
    try {
      const response = await axios.get(`${this.wahaBaseUrl}/api/screenshot`, {
        params: { session: sessionName },
        headers: { 'X-Api-Key': this.wahaApiKey },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to get screenshot: ${error.message}`);
    }
  }

  async handleMessageReply(payload) {
    const { chatId, message, sessionName = 'default' } = payload;
    return await this.sendMessageViaWAHA(chatId, message, sessionName);
  }

  async handleBroadcast(payload) {
    const { message, excludeNumbers = [], sessionName = 'default' } = payload;
    return await this.sendBroadcastViaWAHA(message, excludeNumbers, sessionName);
  }

  async handlePrayerReminder(payload) {
    const { prayerName, time, city, sessionName = 'default' } = payload;
    
    const message = `🕌 *Waktu Sholat ${prayerName}*\n\n` +
      `⏰ Waktu: ${time}\n` +
      `📍 Lokasi: ${city}\n\n` +
      `🤲 Mari bersiap untuk menunaikan sholat ${prayerName}`;
    
    return await this.sendBroadcastViaWAHA(message, [], sessionName);
  }

  async handleAdminBroadcast(data, sessionName = 'default') {
    const { message } = data;
    return await this.sendBroadcastViaWAHA(message, [], sessionName);
  }

  async handleAdminStatus(sessionName = 'default') {
    const status = await this.getWAHASessionStatus(sessionName);
    return {
      action: 'status_check',
      sessionName,
      status: status.status,
      details: status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  async handleAdminStats(sessionName = 'default') {
    try {
      const chatsResponse = await axios.get(`${this.wahaBaseUrl}/api/chats`, {
        params: { session: sessionName },
        headers: { 'X-Api-Key': this.wahaApiKey }
      });

      const chats = chatsResponse.data;
      const privateChats = chats.filter(chat => !chat.id.includes('@g.us'));
      const groupChats = chats.filter(chat => chat.id.includes('@g.us'));

      return {
        action: 'stats',
        sessionName,
        stats: {
          totalChats: chats.length,
          privateChats: privateChats.length,
          groupChats: groupChats.length,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        action: 'stats',
        error: error.message
      };
    }
  }

  async handleAdminScreenshot(sessionName = 'default') {
    try {
      const screenshot = await this.getWAHAScreenshot(sessionName);
      return {
        action: 'screenshot',
        sessionName,
        screenshotSize: screenshot.length,
        message: 'Screenshot captured successfully'
      };
    } catch (error) {
      return {
        action: 'screenshot',
        error: error.message
      };
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Webhook server started on port ${this.port}`);
      console.log(`📡 Health check: http://localhost:${this.port}/health`);
      console.log(`🔗 WAHA webhook: http://localhost:${this.port}/webhook/waha`);
    });
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  const webhookHandler = new WebhookHandler();
  webhookHandler.start();
}

module.exports = WebhookHandler;