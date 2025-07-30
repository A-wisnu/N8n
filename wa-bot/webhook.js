const express = require('express');
const axios = require('axios');
require('dotenv').config();

class WebhookHandler {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
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
        service: 'Masjid WhatsApp Bot Webhook'
      });
    });

    // Webhook endpoint for receiving broadcast messages from n8n
    this.app.post('/webhook/broadcast', async (req, res) => {
      try {
        const { message, excludeNumbers = [] } = req.body;

        if (!message) {
          return res.status(400).json({
            error: 'Message is required',
            received: req.body
          });
        }

        console.log('📢 Broadcast request received:', { message, excludeNumbers });

        // Here you would integrate with your WhatsApp bot instance
        // For now, we'll just log and return success
        const result = {
          success: true,
          message: 'Broadcast initiated',
          timestamp: new Date().toISOString()
        };

        res.json(result);

      } catch (error) {
        console.error('❌ Error handling broadcast webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for receiving status updates
    this.app.post('/webhook/status', async (req, res) => {
      try {
        const statusData = req.body;
        console.log('📊 Status update received:', statusData);

        // Process status update (log to database, notify admins, etc.)
        
        res.json({
          success: true,
          message: 'Status update processed',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error handling status webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // Webhook endpoint for receiving prayer time notifications
    this.app.post('/webhook/prayer-notification', async (req, res) => {
      try {
        const { prayerName, time, city } = req.body;

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

        // Here you would send this to all users via WhatsApp bot
        const result = {
          success: true,
          message: 'Prayer notification sent',
          prayerName,
          time,
          city,
          timestamp: new Date().toISOString()
        };

        res.json(result);

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
        const { command, data, adminNumber } = req.body;

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
            result = await this.handleAdminBroadcast(data);
            break;
          case 'status':
            result = await this.handleAdminStatus();
            break;
          case 'stats':
            result = await this.handleAdminStats();
            break;
          default:
            return res.status(400).json({
              error: 'Unknown admin command',
              availableCommands: ['broadcast', 'status', 'stats']
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

  async handleMessageReply(payload) {
    // Handle message reply from n8n
    const { number, message } = payload;
    
    // Here you would send the message via WhatsApp bot
    console.log(`💬 Sending reply to ${number}: ${message}`);
    
    return {
      success: true,
      action: 'message_sent',
      number,
      message
    };
  }

  async handleBroadcast(payload) {
    // Handle broadcast message
    const { message, excludeNumbers = [] } = payload;
    
    console.log(`📢 Broadcasting message: ${message}`);
    
    return {
      success: true,
      action: 'broadcast_initiated',
      message,
      excludeNumbers
    };
  }

  async handlePrayerReminder(payload) {
    // Handle prayer time reminder
    const { prayerName, time, city } = payload;
    
    console.log(`🕌 Prayer reminder: ${prayerName} at ${time}`);
    
    return {
      success: true,
      action: 'prayer_reminder_sent',
      prayerName,
      time,
      city
    };
  }

  async handleAdminBroadcast(data) {
    // Handle admin broadcast command
    const { message } = data;
    
    console.log(`👨‍💼 Admin broadcast: ${message}`);
    
    return {
      action: 'admin_broadcast',
      message,
      status: 'initiated'
    };
  }

  async handleAdminStatus() {
    // Return bot status for admin
    return {
      action: 'status_check',
      status: 'online',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  async handleAdminStats() {
    // Return bot statistics for admin
    return {
      action: 'stats',
      stats: {
        messagesProcessed: 0, // This would come from actual tracking
        activeUsers: 0,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Webhook server started on port ${this.port}`);
      console.log(`📡 Health check: http://localhost:${this.port}/health`);
    });
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  const webhookHandler = new WebhookHandler();
  webhookHandler.start();
}

module.exports = WebhookHandler;