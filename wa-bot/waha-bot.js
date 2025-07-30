const WAHAClient = require('./waha-client');
const axios = require('axios');
const GoogleSheetsIntegration = require('./google-sheets');
require('dotenv').config();

class MasjidWhatsAppBot {
  constructor() {
    this.client = null;
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    this.sessionName = process.env.WA_SESSION_NAME || 'default';
    this.adminNumbers = process.env.ADMIN_NUMBERS ? process.env.ADMIN_NUMBERS.split(',').map(num => num.trim()) : [];
    this.googleSheets = new GoogleSheetsIntegration();
    this.wahaBaseUrl = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.wahaApiKey = process.env.WAHA_API_KEY || 'admin';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Memulai Masjid WhatsApp Bot dengan WAHA...');
      
      // Initialize WAHA client
      this.client = new WAHAClient({
        baseURL: this.wahaBaseUrl,
        sessionName: this.sessionName,
        apiKey: this.wahaApiKey,
        webhookUrl: process.env.WEBHOOK_URL
      });

      await this.client.initialize();
      
      // Setup message handler
      this.setupMessageHandler();
      
      // Setup status handler
      this.setupStatusHandler();
      
      // Wait a moment then check session status
      setTimeout(async () => {
        try {
          const status = await this.client.getSessionStatus();
          console.log('📱 Session status:', status.status);
          
          if (status.status === 'WORKING') {
            // Send startup notification to admins
            await this.notifyAdmins('🤖 Bot Masjid AI telah aktif dan siap melayani jamaah!');
          } else if (status.status === 'SCAN_QR_CODE') {
            console.log('📱 Please scan QR code to authenticate WhatsApp');
            await this.notifyAdmins('📱 Bot memerlukan autentikasi QR Code. Silakan scan QR di dashboard WAHA.');
          }
        } catch (error) {
          console.error('⚠️ Error checking session status:', error.message);
        }
      }, 3000);

      this.isInitialized = true;
      console.log('✅ WhatsApp Bot berhasil terhubung!');
      
    } catch (error) {
      console.error('❌ Error saat inisialisasi bot:', error);
      throw error;
    }
  }

  setupMessageHandler() {
    this.client.onMessage(async (message) => {
      try {
        // Skip messages from groups, status, and own messages
        if (message.fromMe || !message.from || message.from.includes('@g.us')) {
          return;
        }

        console.log(`📩 Pesan diterima dari ${message.from}: ${message.body || message.type}`);

        // Extract phone number without @c.us
        const phoneNumber = message.from.replace('@c.us', '');
        
        // Check if user is admin (check both formats)
        const isAdmin = this.adminNumbers.includes(phoneNumber) || this.adminNumbers.includes(message.from);
        
        // Prepare message data for n8n
        const messageData = {
          number: phoneNumber,
          text: message.body || '',
          timestamp: new Date().toISOString(),
          messageId: message.id,
          isAdmin: isAdmin,
          messageType: message.type || 'text',
          wahaMessage: message
        };

        // Send to n8n webhook
        const response = await this.sendToN8n(messageData);
        
        if (response && response.reply) {
          // Send reply back to user
          await this.client.sendText(message.from, response.reply);
          console.log(`✅ Balasan dikirim ke ${phoneNumber}`);
          
          // Log to Google Sheets
          try {
            await this.googleSheets.logMessage({
              number: phoneNumber,
              text: message.body || '',
              messageType: response.messageType || message.type || 'unknown',
              reply: response.reply || '',
              isAdmin: isAdmin
            });
          } catch (error) {
            console.error('⚠️ Error logging to Google Sheets:', error.message);
          }
        }

      } catch (error) {
        console.error('❌ Error saat memproses pesan:', error);
        
        // Send error message to user
        try {
          await this.client.sendText(message.from, 
            '🙏 Maaf, terjadi kendala teknis. Silakan coba lagi dalam beberapa saat.');
        } catch (sendError) {
          console.error('❌ Error saat mengirim pesan error:', sendError);
        }
      }
    });
  }

  setupStatusHandler() {
    this.client.onStatusChange(async (status) => {
      console.log('🔄 Status WhatsApp berubah:', status);
      
      if (status.status === 'CONFLICT' || status.status === 'UNPAIRED') {
        console.log('⚠️ WhatsApp session conflict atau unpaired, restart diperlukan');
        await this.notifyAdmins('⚠️ Bot mengalami konflik session. Perlu restart dan autentikasi ulang.');
      } else if (status.status === 'WORKING') {
        console.log('✅ WhatsApp session is working properly');
        await this.notifyAdmins('✅ Bot berhasil terhubung dan siap beroperasi!');
      } else if (status.status === 'SCAN_QR_CODE') {
        console.log('📱 WhatsApp requires QR code scan');
        await this.notifyAdmins('📱 Bot memerlukan scan QR code. Silakan buka dashboard WAHA.');
      }
    });
  }

  async sendToN8n(messageData) {
    try {
      if (!this.n8nWebhookUrl) {
        console.error('❌ N8N_WEBHOOK_URL tidak dikonfigurasi');
        return { reply: '🔧 Bot sedang dalam maintenance. Silakan coba lagi nanti.' };
      }

      const response = await axios.post(this.n8nWebhookUrl, messageData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Masjid-WhatsApp-Bot/2.0-WAHA'
        }
      });

      return response.data;
      
    } catch (error) {
      console.error('❌ Error saat mengirim ke n8n:', error.message);
      
      // Fallback response
      return {
        reply: '🙏 Maaf, sistem sedang sibuk. Silakan coba lagi dalam beberapa menit.'
      };
    }
  }

  async notifyAdmins(message) {
    if (this.adminNumbers.length === 0) {
      console.log('⚠️ Tidak ada admin number yang dikonfigurasi');
      return;
    }

    if (!this.client || !this.isInitialized) {
      console.log('⚠️ Client belum diinisialisasi');
      return;
    }

    for (const adminNumber of this.adminNumbers) {
      try {
        const chatId = adminNumber.includes('@c.us') ? adminNumber : `${adminNumber}@c.us`;
        await this.client.sendText(chatId, `🔔 ADMIN NOTIFICATION\n\n${message}`);
        console.log(`✅ Notifikasi dikirim ke admin: ${adminNumber}`);
      } catch (error) {
        console.error(`❌ Error mengirim notifikasi ke ${adminNumber}:`, error.message);
      }
    }
  }

  async broadcastMessage(message, excludeNumbers = []) {
    try {
      const chats = await this.client.getChats();
      const privateChats = chats.filter(chat => 
        !chat.id.includes('@g.us') && 
        !excludeNumbers.includes(chat.id) &&
        !excludeNumbers.includes(chat.id.replace('@c.us', ''))
      );
      
      console.log(`📢 Memulai broadcast ke ${privateChats.length} kontak...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const chat of privateChats) {
        try {
          await this.client.sendText(chat.id, message);
          successCount++;
          
          // Delay to avoid spam detection
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error broadcast ke ${chat.id}:`, error.message);
          errorCount++;
        }
      }

      const summary = `📊 Broadcast selesai:\n✅ Berhasil: ${successCount}\n❌ Gagal: ${errorCount}`;
      console.log(summary);
      
      // Notify admins about broadcast result
      await this.notifyAdmins(summary);
      
      return { success: successCount, failed: errorCount };
      
    } catch (error) {
      console.error('❌ Error saat broadcast:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      if (!this.client) {
        return { connected: false, error: 'Client not initialized' };
      }
      
      const sessionData = await this.client.getSessionStatus();
      
      return {
        connected: sessionData.status === 'WORKING',
        status: sessionData.status,
        sessionName: this.sessionName,
        wahaUrl: this.wahaBaseUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error mendapatkan status:', error);
      return { connected: false, error: error.message };
    }
  }

  async getQRCode() {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }
      
      return await this.client.getQRCode();
    } catch (error) {
      console.error('❌ Error mendapatkan QR code:', error);
      throw error;
    }
  }

  async getScreenshot() {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }
      
      return await this.client.getScreenshot();
    } catch (error) {
      console.error('❌ Error mendapatkan screenshot:', error);
      throw error;
    }
  }

  async sendMessage(chatId, text) {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }
      
      return await this.client.sendText(chatId, text);
    } catch (error) {
      console.error('❌ Error mengirim pesan:', error);
      throw error;
    }
  }

  async sendImage(chatId, imageUrl, caption = '') {
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }
      
      return await this.client.sendImage(chatId, imageUrl, caption);
    } catch (error) {
      console.error('❌ Error mengirim gambar:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.notifyAdmins('🔴 Bot Masjid AI sedang offline untuk maintenance.');
        await this.client.close();
      }
    } catch (error) {
      console.error('❌ Error saat shutdown:', error);
    }
  }
}

// Initialize and start the bot
const bot = new MasjidWhatsAppBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Menerima signal SIGINT, menutup bot...');
  
  try {
    await bot.close();
  } catch (error) {
    console.error('❌ Error saat shutdown:', error);
  }
  
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the bot
bot.initialize().catch(error => {
  console.error('❌ Fatal error saat memulai bot:', error);
  process.exit(1);
});

module.exports = MasjidWhatsAppBot;