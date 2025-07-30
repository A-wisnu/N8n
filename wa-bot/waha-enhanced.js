const WAHAClient = require('./waha-client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EnhancedWAHABot extends WAHAClient {
  constructor(options = {}) {
    super(options);
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 1000; // 1 second between messages
    this.mediaUploadPath = './uploads';
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.mediaUploadPath)) {
      fs.mkdirSync(this.mediaUploadPath, { recursive: true });
    }
  }

  // Enhanced message sending with queue management
  async sendTextWithQueue(chatId, text, priority = 'normal') {
    return this.addToQueue({
      type: 'text',
      chatId,
      text,
      priority
    });
  }

  // Send location
  async sendLocation(chatId, latitude, longitude, name = '', address = '') {
    try {
      const response = await this.api.post('/api/sendLocation', {
        session: this.sessionName,
        chatId: chatId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: name,
        address: address
      });
      
      console.log(`✅ Location sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send location to ${chatId}:`, error.message);
      throw error;
    }
  }

  // Send contact card
  async sendContact(chatId, contactData) {
    try {
      const response = await this.api.post('/api/sendContact', {
        session: this.sessionName,
        chatId: chatId,
        contact: contactData
      });
      
      console.log(`✅ Contact sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send contact to ${chatId}:`, error.message);
      throw error;
    }
  }

  // Send voice message
  async sendVoice(chatId, audioUrl) {
    try {
      const response = await this.api.post('/api/sendVoice', {
        session: this.sessionName,
        chatId: chatId,
        url: audioUrl
      });
      
      console.log(`✅ Voice message sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send voice message to ${chatId}:`, error.message);
      throw error;
    }
  }

  // Send document
  async sendDocument(chatId, documentUrl, filename = '', caption = '') {
    try {
      const response = await this.api.post('/api/sendFile', {
        session: this.sessionName,
        chatId: chatId,
        url: documentUrl,
        filename: filename,
        caption: caption
      });
      
      console.log(`✅ Document sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send document to ${chatId}:`, error.message);
      throw error;
    }
  }

  // Reply to a specific message
  async replyToMessage(chatId, text, messageId) {
    try {
      const response = await this.api.post('/api/reply', {
        session: this.sessionName,
        chatId: chatId,
        text: text,
        reply_to: messageId
      });
      
      console.log(`✅ Reply sent to ${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to send reply to ${chatId}:`, error.message);
      throw error;
    }
  }

  // React to a message
  async reactToMessage(chatId, messageId, emoji) {
    try {
      const response = await this.api.post('/api/reaction', {
        session: this.sessionName,
        chatId: chatId,
        messageId: messageId,
        reaction: emoji
      });
      
      console.log(`✅ Reaction ${emoji} sent to message ${messageId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to react to message:`, error.message);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(chatId, messageId) {
    try {
      const response = await this.api.post('/api/markAsRead', {
        session: this.sessionName,
        chatId: chatId,
        messageId: messageId
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to mark message as read:`, error.message);
      throw error;
    }
  }

  // Set typing indicator
  async startTyping(chatId) {
    try {
      const response = await this.api.post('/api/startTyping', {
        session: this.sessionName,
        chatId: chatId
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to start typing:`, error.message);
      throw error;
    }
  }

  async stopTyping(chatId) {
    try {
      const response = await this.api.post('/api/stopTyping', {
        session: this.sessionName,
        chatId: chatId
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to stop typing:`, error.message);
      throw error;
    }
  }

  // Group management functions
  async createGroup(groupName, participants) {
    try {
      const response = await this.api.post('/api/groups', {
        session: this.sessionName,
        name: groupName,
        participants: participants
      });
      
      console.log(`✅ Group "${groupName}" created`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create group:`, error.message);
      throw error;
    }
  }

  async addParticipant(groupId, participantId) {
    try {
      const response = await this.api.post(`/api/groups/${groupId}/participants`, {
        session: this.sessionName,
        participants: [participantId]
      });
      
      console.log(`✅ Participant added to group ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to add participant:`, error.message);
      throw error;
    }
  }

  async removeParticipant(groupId, participantId) {
    try {
      const response = await this.api.delete(`/api/groups/${groupId}/participants`, {
        data: {
          session: this.sessionName,
          participants: [participantId]
        }
      });
      
      console.log(`✅ Participant removed from group ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to remove participant:`, error.message);
      throw error;
    }
  }

  async promoteParticipant(groupId, participantId) {
    try {
      const response = await this.api.post(`/api/groups/${groupId}/admin/promote`, {
        session: this.sessionName,
        participants: [participantId]
      });
      
      console.log(`✅ Participant promoted in group ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to promote participant:`, error.message);
      throw error;
    }
  }

  async demoteParticipant(groupId, participantId) {
    try {
      const response = await this.api.post(`/api/groups/${groupId}/admin/demote`, {
        session: this.sessionName,
        participants: [participantId]
      });
      
      console.log(`✅ Participant demoted in group ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to demote participant:`, error.message);
      throw error;
    }
  }

  async setGroupDescription(groupId, description) {
    try {
      const response = await this.api.put(`/api/groups/${groupId}/description`, {
        session: this.sessionName,
        description: description
      });
      
      console.log(`✅ Group description updated for ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update group description:`, error.message);
      throw error;
    }
  }

  async setGroupSubject(groupId, subject) {
    try {
      const response = await this.api.put(`/api/groups/${groupId}/subject`, {
        session: this.sessionName,
        subject: subject
      });
      
      console.log(`✅ Group subject updated for ${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update group subject:`, error.message);
      throw error;
    }
  }

  // Message queue management
  async addToQueue(messageData) {
    this.messageQueue.push({
      ...messageData,
      timestamp: Date.now(),
      id: this.generateId()
    });

    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return messageData.id;
  }

  async processQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // Sort by priority (high -> normal -> low)
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      try {
        await this.processQueuedMessage(message);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      } catch (error) {
        console.error(`❌ Failed to process queued message:`, error);
        
        // Retry logic for failed messages
        if (message.retryCount < 3) {
          message.retryCount = (message.retryCount || 0) + 1;
          message.timestamp = Date.now() + (message.retryCount * 5000); // Exponential backoff
          this.messageQueue.push(message);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  async processQueuedMessage(message) {
    switch (message.type) {
      case 'text':
        return await this.sendText(message.chatId, message.text);
      case 'image':
        return await this.sendImage(message.chatId, message.imageUrl, message.caption);
      case 'voice':
        return await this.sendVoice(message.chatId, message.audioUrl);
      case 'document':
        return await this.sendDocument(message.chatId, message.documentUrl, message.filename, message.caption);
      case 'location':
        return await this.sendLocation(message.chatId, message.latitude, message.longitude, message.name, message.address);
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  // Utility functions
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Bulk operations
  async sendBulkMessages(messages) {
    const results = [];
    
    for (const message of messages) {
      try {
        const messageId = await this.addToQueue(message);
        results.push({ success: true, messageId, chatId: message.chatId });
      } catch (error) {
        results.push({ success: false, error: error.message, chatId: message.chatId });
      }
    }
    
    return results;
  }

  // Advanced media handling
  async downloadMedia(messageId) {
    try {
      const response = await this.api.get(`/api/files/${messageId}`, {
        params: { session: this.sessionName },
        responseType: 'stream'
      });
      
      const filename = `media_${messageId}_${Date.now()}`;
      const filepath = path.join(this.mediaUploadPath, filename);
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filepath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`❌ Failed to download media:`, error.message);
      throw error;
    }
  }

  // Message scheduling
  async scheduleMessage(chatId, text, scheduleTime) {
    const delay = scheduleTime - Date.now();
    
    if (delay <= 0) {
      return await this.sendText(chatId, text);
    }
    
    setTimeout(async () => {
      try {
        await this.sendText(chatId, text);
        console.log(`✅ Scheduled message sent to ${chatId}`);
      } catch (error) {
        console.error(`❌ Failed to send scheduled message:`, error);
      }
    }, delay);
    
    console.log(`📅 Message scheduled for ${new Date(scheduleTime).toISOString()}`);
    return { scheduled: true, scheduleTime };
  }

  // Presence management
  async setPresence(presence) {
    try {
      const response = await this.api.post('/api/presence', {
        session: this.sessionName,
        presence: presence // 'available', 'unavailable', 'composing', 'recording'
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to set presence:`, error.message);
      throw error;
    }
  }

  // Contact operations
  async getContactInfo(contactId) {
    try {
      const response = await this.api.get(`/api/contacts/${contactId}`, {
        params: { session: this.sessionName }
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to get contact info:`, error.message);
      throw error;
    }
  }

  async getProfilePicture(contactId) {
    try {
      const response = await this.api.get(`/api/contacts/${contactId}/picture`, {
        params: { session: this.sessionName }
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to get profile picture:`, error.message);
      throw error;
    }
  }

  async blockContact(contactId) {
    try {
      const response = await this.api.post('/api/contacts/block', {
        session: this.sessionName,
        contactId: contactId
      });
      
      console.log(`✅ Contact ${contactId} blocked`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to block contact:`, error.message);
      throw error;
    }
  }

  async unblockContact(contactId) {
    try {
      const response = await this.api.post('/api/contacts/unblock', {
        session: this.sessionName,
        contactId: contactId
      });
      
      console.log(`✅ Contact ${contactId} unblocked`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to unblock contact:`, error.message);
      throw error;
    }
  }

  // Chat operations
  async muteChat(chatId) {
    try {
      const response = await this.api.post('/api/chats/mute', {
        session: this.sessionName,
        chatId: chatId
      });
      
      console.log(`✅ Chat ${chatId} muted`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to mute chat:`, error.message);
      throw error;
    }
  }

  async unmuteChat(chatId) {
    try {
      const response = await this.api.post('/api/chats/unmute', {
        session: this.sessionName,
        chatId: chatId
      });
      
      console.log(`✅ Chat ${chatId} unmuted`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to unmute chat:`, error.message);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      const response = await this.api.delete(`/api/chats/${chatId}`, {
        data: { session: this.sessionName }
      });
      
      console.log(`✅ Chat ${chatId} deleted`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to delete chat:`, error.message);
      throw error;
    }
  }

  async clearChat(chatId) {
    try {
      const response = await this.api.post('/api/chats/clear', {
        session: this.sessionName,
        chatId: chatId
      });
      
      console.log(`✅ Chat ${chatId} cleared`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to clear chat:`, error.message);
      throw error;
    }
  }

  // Enhanced status management
  async getDetailedStatus() {
    try {
      const [session, chats, contacts] = await Promise.all([
        this.getSessionStatus(),
        this.getChats().catch(() => []),
        this.getContacts().catch(() => [])
      ]);

      return {
        session: session,
        totalChats: chats.length,
        privateChats: chats.filter(chat => !chat.id.includes('@g.us')).length,
        groupChats: chats.filter(chat => chat.id.includes('@g.us')).length,
        totalContacts: contacts.length,
        queueSize: this.messageQueue.length,
        isProcessingQueue: this.isProcessingQueue,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = EnhancedWAHABot;