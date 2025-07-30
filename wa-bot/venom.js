const venom = require('venom-bot');
const axios = require('axios');
const GoogleSheetsIntegration = require('./google-sheets');
require('dotenv').config();

class MasjidWhatsAppBot {
  constructor() {
    this.client = null;
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    this.sessionName = process.env.WA_SESSION_NAME || 'masjid-session';
    this.adminNumbers = process.env.ADMIN_NUMBERS ? process.env.ADMIN_NUMBERS.split(',').map(num => num.trim()) : [];
    this.googleSheets = new GoogleSheetsIntegration();
  }

  async initialize() {
    try {
      console.log('🚀 Memulai Masjid WhatsApp Bot...');
      
      this.client = await venom.create({
        session: this.sessionName,
        multidevice: true,
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        refreshQR: 15000,
        autoClose: 60000,
        disableSpins: true
      });

      console.log('✅ WhatsApp Bot berhasil terhubung!');
      
      // Setup message handler
      this.setupMessageHandler();
      
      // Setup status handler
      this.setupStatusHandler();
      
      // Send startup notification to admins
      await this.notifyAdmins('🤖 Bot Masjid AI telah aktif dan siap melayani jamaah!');
      
    } catch (error) {
      console.error('❌ Error saat inisialisasi bot:', error);
      process.exit(1);
    }
  }

  setupMessageHandler() {
    this.client.onMessage(async (message) => {
      try {
        // Skip messages from status, groups, and own messages
        if (message.isGroupMsg || message.from === 'status@broadcast' || message.fromMe) {
          return;
        }

        console.log(`📩 Pesan diterima dari ${message.from}: ${message.body}`);

        // Extract phone number without @c.us
        const phoneNumber = message.from.replace('@c.us', '');
        
        // Check if user is admin (check both formats)
        const isAdmin = this.adminNumbers.includes(phoneNumber) || this.adminNumbers.includes(message.from);
        
        // Prepare message data for n8n
        const messageData = {
          number: phoneNumber,
          text: message.body,
          timestamp: new Date().toISOString(),
          messageId: message.id,
          isAdmin: isAdmin
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
              text: message.body,
              messageType: response.messageType || 'unknown',
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
    this.client.onStateChange((state) => {
      console.log('🔄 Status WhatsApp berubah:', state);
      
      if (state === 'CONFLICT' || state === 'UNPAIRED') {
        console.log('⚠️ WhatsApp session conflict atau unpaired, restart diperlukan');
        process.exit(1);
      }
    });

    this.client.onIncomingCall(async (call) => {
      console.log('📞 Panggilan masuk dari:', call.peerJid);
      await this.client.rejectCall(call.id);
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
          'User-Agent': 'Masjid-WhatsApp-Bot/1.0'
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

    for (const adminNumber of this.adminNumbers) {
      try {
        await this.client.sendText(`${adminNumber}@c.us`, `🔔 ADMIN NOTIFICATION\n\n${message}`);
        console.log(`✅ Notifikasi dikirim ke admin: ${adminNumber}`);
      } catch (error) {
        console.error(`❌ Error mengirim notifikasi ke ${adminNumber}:`, error.message);
      }
    }
  }

  async broadcastMessage(message, excludeNumbers = []) {
    try {
      const chats = await this.client.getAllChats();
      const privateChats = chats.filter(chat => !chat.isGroup && !excludeNumbers.includes(chat.id));
      
      console.log(`📢 Memulai broadcast ke ${privateChats.length} kontak...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const chat of privateChats) {
        try {
          await this.client.sendText(chat.id, message);
          successCount++;
          
          // Delay to avoid spam detection
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
      const state = await this.client.getConnectionState();
      const batteryLevel = await this.client.getBatteryLevel();
      
      return {
        connected: state === 'CONNECTED',
        state: state,
        battery: batteryLevel,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error mendapatkan status:', error);
      return { connected: false, error: error.message };
    }
  }
}

// Initialize and start the bot
const bot = new MasjidWhatsAppBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Menerima signal SIGINT, menutup bot...');
  
  try {
    if (bot.client) {
      await bot.notifyAdmins('🔴 Bot Masjid AI sedang offline untuk maintenance.');
      await bot.client.close();
    }
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