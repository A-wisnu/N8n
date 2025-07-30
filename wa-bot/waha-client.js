const axios = require('axios');
const WebSocket = require('ws');
require('dotenv').config();

class WAHAClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.sessionName = options.sessionName || process.env.WA_SESSION_NAME || 'default';
    this.apiKey = options.apiKey || process.env.WAHA_API_KEY || 'admin';
    this.webhookUrl = options.webhookUrl || process.env.WEBHOOK_URL;
    this.ws = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.statusHandlers = [];
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    
    // Setup axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey
      },
      timeout: 30000
    });
  }

  async initialize() {
    try {
      console.log('🚀 Initializing WAHA WhatsApp Bot...');
      
      // Check if WAHA service is running
      await this.checkHealth();
      
      // Start session
      await this.startSession();
      
      // Setup webhook for receiving messages
      if (this.webhookUrl) {
        await this.setupWebhook();
      }
      
      // Setup WebSocket for real-time events
      await this.setupWebSocket();
      
      console.log('✅ WAHA WhatsApp Bot successfully initialized!');
      this.isConnected = true;
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing WAHA bot:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await this.api.get('/api/version');
      console.log('📡 WAHA service is running, version:', response.data.version);
      return response.data;
    } catch (error) {
      throw new Error(`WAHA service is not available at ${this.baseURL}. Make sure WAHA is running.`);
    }
  }

  async startSession() {
    try {
      // Check if session already exists
      const sessions = await this.api.get('/api/sessions');
      const existingSession = sessions.data.find(s => s.name === this.sessionName);
      
      if (existingSession && existingSession.status === 'WORKING') {
        console.log(`📱 Session '${this.sessionName}' is already running`);
        return existingSession;
      }
      
      // Start new session
      const response = await this.api.post('/api/sessions', {
        name: this.sessionName,
        config: {
          proxy: null,
          webhooks: this.webhookUrl ? [{
            url: this.webhookUrl,
            events: ['message', 'session.status']
          }] : []
        }
      });
      
      console.log(`📱 Session '${this.sessionName}' started successfully`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`📱 Session '${this.sessionName}' already exists`);
        return await this.getSession();
      }
      throw error;
    }
  }

  async getSession() {
    try {
      const response = await this.api.get(`/api/sessions/${this.sessionName}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get session '${this.sessionName}': ${error.message}`);
    }
  }

  async getQRCode() {
    try {
      const response = await this.api.get(`/api/sessions/${this.sessionName}/qr`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      throw new Error(`Failed to get QR code: ${error.message}`);
    }
  }

  async getScreenshot() {
    try {
      const response = await this.api.get(`/api/screenshot`, {
        params: { session: this.sessionName },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      throw new Error(`Failed to get screenshot: ${error.message}`);
    }
  }

  async sendText(chatId, text) {
    try {
      const response = await this.api.post('/api/sendText', {
        session: this.sessionName,
        chatId: chatId,
        text: text
      });
      
      console.log(`✅ Message sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send message to ${chatId}:`, error.message);
      throw error;
    }
  }

  async sendImage(chatId, imageUrl, caption = '') {
    try {
      const response = await this.api.post('/api/sendImage', {
        session: this.sessionName,
        chatId: chatId,
        url: imageUrl,
        caption: caption
      });
      
      console.log(`✅ Image sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send image to ${chatId}:`, error.message);
      throw error;
    }
  }

  async sendFile(chatId, fileUrl, filename = '') {
    try {
      const response = await this.api.post('/api/sendFile', {
        session: this.sessionName,
        chatId: chatId,
        url: fileUrl,
        filename: filename
      });
      
      console.log(`✅ File sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send file to ${chatId}:`, error.message);
      throw error;
    }
  }

  async getContacts() {
    try {
      const response = await this.api.get('/api/contacts', {
        params: { session: this.sessionName }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }

  async getChats() {
    try {
      const response = await this.api.get('/api/chats', {
        params: { session: this.sessionName }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get chats: ${error.message}`);
    }
  }

  async getSessionStatus() {
    try {
      const response = await this.api.get(`/api/sessions/${this.sessionName}`);
      return response.data;
    } catch (error) {
      return { status: 'FAILED', error: error.message };
    }
  }

  async setupWebhook() {
    try {
      const response = await this.api.post(`/api/sessions/${this.sessionName}/webhooks`, {
        url: this.webhookUrl,
        events: ['message', 'session.status', 'message.reaction', 'message.revoked']
      });
      
      console.log('🔗 Webhook configured successfully');
      return response.data;
    } catch (error) {
      console.error('⚠️ Failed to setup webhook:', error.message);
    }
  }

  async setupWebSocket() {
    try {
      const wsUrl = this.baseURL.replace('http', 'ws') + `/ws`;
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      this.ws.on('open', () => {
        console.log('🔗 WebSocket connected');
        // Subscribe to session events
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          session: this.sessionName,
          events: ['message', 'session.status']
        }));
      });

      this.ws.on('message', (data) => {
        try {
          const event = JSON.parse(data);
          this.handleWebSocketEvent(event);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
        // Attempt to reconnect
        setTimeout(() => this.reconnectWebSocket(), this.retryDelay);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
      });
      
    } catch (error) {
      console.error('⚠️ Failed to setup WebSocket:', error.message);
    }
  }

  handleWebSocketEvent(event) {
    switch (event.event) {
      case 'message':
        this.messageHandlers.forEach(handler => {
          try {
            handler(event.payload);
          } catch (error) {
            console.error('❌ Error in message handler:', error);
          }
        });
        break;
        
      case 'session.status':
        this.statusHandlers.forEach(handler => {
          try {
            handler(event.payload);
          } catch (error) {
            console.error('❌ Error in status handler:', error);
          }
        });
        break;
    }
  }

  async reconnectWebSocket() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Attempting to reconnect WebSocket (${this.retryCount}/${this.maxRetries})`);
      await this.setupWebSocket();
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onStatusChange(handler) {
    this.statusHandlers.push(handler);
  }

  async stopSession() {
    try {
      await this.api.delete(`/api/sessions/${this.sessionName}`);
      console.log(`🛑 Session '${this.sessionName}' stopped`);
    } catch (error) {
      console.error('❌ Error stopping session:', error.message);
    }
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
    console.log('👋 WAHA client closed');
  }
}

module.exports = WAHAClient;