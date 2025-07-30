const axios = require('axios');
require('dotenv').config();

class GoogleSheetsIntegration {
  constructor() {
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  /**
   * Check if Google Sheets is configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(this.apiKey && this.spreadsheetId);
  }

  /**
   * Log message interaction to Google Sheets
   * @param {Object} messageData - Message data to log
   * @returns {Promise<Object>} Response from Google Sheets API
   */
  async logMessage(messageData) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Google Sheets not configured, skipping log');
        return { success: false, reason: 'not_configured' };
      }

      const timestamp = new Date().toISOString();
      const values = [
        [
          timestamp,
          messageData.number || '',
          messageData.text || '',
          messageData.messageType || '',
          messageData.reply || '',
          messageData.isAdmin ? 'Yes' : 'No',
          messageData.source || 'whatsapp'
        ]
      ];

      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}/values/MessageLog:append`,
        {
          values: values,
          majorDimension: 'ROWS',
          valueInputOption: 'RAW'
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Message logged to Google Sheets');
      return { success: true, data: response.data };

    } catch (error) {
      console.error('❌ Error logging to Google Sheets:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get FAQ data from Google Sheets
   * @returns {Promise<Array>} Array of FAQ entries
   */
  async getFAQData() {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Google Sheets not configured');
        return [];
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.spreadsheetId}/values/FAQ`,
        {
          params: {
            key: this.apiKey
          }
        }
      );

      if (response.data && response.data.values) {
        const rows = response.data.values;
        const faqData = [];

        // Skip header row (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 3) {
            faqData.push({
              id: i,
              question: row[0] || '',
              answer: row[1] || '',
              category: row[2] || 'general',
              keywords: row[3] ? row[3].split(',').map(k => k.trim()) : [],
              active: row[4] !== 'false' // Default to active unless explicitly set to false
            });
          }
        }

        console.log(`✅ Loaded ${faqData.length} FAQ entries from Google Sheets`);
        return faqData;
      }

      return [];

    } catch (error) {
      console.error('❌ Error fetching FAQ from Google Sheets:', error.message);
      return [];
    }
  }

  /**
   * Search FAQ based on user query
   * @param {string} query - User query
   * @returns {Promise<Object|null>} Matching FAQ entry or null
   */
  async searchFAQ(query) {
    try {
      const faqData = await this.getFAQData();
      if (faqData.length === 0) return null;

      const queryLower = query.toLowerCase();
      
      // First, try exact keyword match
      for (const faq of faqData) {
        if (!faq.active) continue;
        
        for (const keyword of faq.keywords) {
          if (queryLower.includes(keyword.toLowerCase())) {
            return faq;
          }
        }
      }

      // Then, try partial question match
      for (const faq of faqData) {
        if (!faq.active) continue;
        
        if (faq.question.toLowerCase().includes(queryLower) || 
            queryLower.includes(faq.question.toLowerCase())) {
          return faq;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error searching FAQ:', error.message);
      return null;
    }
  }

  /**
   * Log prayer time request
   * @param {Object} prayerData - Prayer time request data
   * @returns {Promise<Object>} Response from Google Sheets API
   */
  async logPrayerRequest(prayerData) {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const timestamp = new Date().toISOString();
      const values = [
        [
          timestamp,
          prayerData.number || '',
          prayerData.city || '',
          prayerData.source || '',
          prayerData.success ? 'Success' : 'Failed',
          prayerData.error || ''
        ]
      ];

      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}/values/PrayerLog:append`,
        {
          values: values,
          majorDimension: 'ROWS',
          valueInputOption: 'RAW'
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Prayer request logged to Google Sheets');
      return { success: true, data: response.data };

    } catch (error) {
      console.error('❌ Error logging prayer request:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get announcement templates from Google Sheets
   * @returns {Promise<Array>} Array of announcement templates
   */
  async getAnnouncementTemplates() {
    try {
      if (!this.isConfigured()) {
        return [];
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.spreadsheetId}/values/Announcements`,
        {
          params: {
            key: this.apiKey
          }
        }
      );

      if (response.data && response.data.values) {
        const rows = response.data.values;
        const templates = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 2) {
            templates.push({
              id: i,
              title: row[0] || '',
              content: row[1] || '',
              category: row[2] || 'general',
              active: row[3] !== 'false'
            });
          }
        }

        console.log(`✅ Loaded ${templates.length} announcement templates`);
        return templates;
      }

      return [];

    } catch (error) {
      console.error('❌ Error fetching announcements:', error.message);
      return [];
    }
  }

  /**
   * Log admin action
   * @param {Object} actionData - Admin action data
   * @returns {Promise<Object>} Response from Google Sheets API
   */
  async logAdminAction(actionData) {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const timestamp = new Date().toISOString();
      const values = [
        [
          timestamp,
          actionData.adminNumber || '',
          actionData.action || '',
          actionData.details || '',
          actionData.success ? 'Success' : 'Failed',
          actionData.error || ''
        ]
      ];

      const response = await axios.post(
        `${this.baseUrl}/${this.spreadsheetId}/values/AdminLog:append`,
        {
          values: values,
          majorDimension: 'ROWS',
          valueInputOption: 'RAW'
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Admin action logged to Google Sheets');
      return { success: true, data: response.data };

    } catch (error) {
      console.error('❌ Error logging admin action:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create initial sheets structure if they don't exist
   * @returns {Promise<Object>} Creation result
   */
  async initializeSheets() {
    try {
      console.log('🔧 Initializing Google Sheets structure...');
      
      // Define sheet structures
      const sheets = [
        {
          name: 'MessageLog',
          headers: ['Timestamp', 'Phone Number', 'Message', 'Type', 'Reply', 'Is Admin', 'Source']
        },
        {
          name: 'FAQ',
          headers: ['Question', 'Answer', 'Category', 'Keywords', 'Active']
        },
        {
          name: 'PrayerLog',
          headers: ['Timestamp', 'Phone Number', 'City', 'Source', 'Status', 'Error']
        },
        {
          name: 'Announcements',
          headers: ['Title', 'Content', 'Category', 'Active']
        },
        {
          name: 'AdminLog',
          headers: ['Timestamp', 'Admin Number', 'Action', 'Details', 'Status', 'Error']
        }
      ];

      for (const sheetConfig of sheets) {
        const sheet = await this.getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
        if (sheet) {
          console.log(`✅ Sheet '${sheetConfig.name}' ready`);
        } else {
          console.log(`⚠️ Could not initialize sheet '${sheetConfig.name}'`);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error initializing sheets:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get usage statistics from logs
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      if (!this.isConfigured()) {
        return { success: false, reason: 'not_configured' };
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.spreadsheetId}/values/MessageLog`,
        {
          params: {
            key: this.apiKey
          }
        }
      );

      if (response.data && response.data.values) {
        const rows = response.data.values;
        const today = new Date().toISOString().split('T')[0];
        
        let totalMessages = rows.length - 1; // Exclude header
        let todayMessages = 0;
        let uniqueUsers = new Set();
        let messageTypes = {};

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 4) {
            const timestamp = row[0];
            const phoneNumber = row[1];
            const messageType = row[3];

            // Count today's messages
            if (timestamp.startsWith(today)) {
              todayMessages++;
            }

            // Count unique users
            if (phoneNumber) {
              uniqueUsers.add(phoneNumber);
            }

            // Count message types
            if (messageType) {
              messageTypes[messageType] = (messageTypes[messageType] || 0) + 1;
            }
          }
        }

        return {
          success: true,
          stats: {
            totalMessages,
            todayMessages,
            uniqueUsers: uniqueUsers.size,
            messageTypes
          }
        };
      }

      return { success: false, reason: 'no_data' };

    } catch (error) {
      console.error('❌ Error getting usage stats:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search FAQ by query
   * @param {string} query - Search query
   * @returns {Promise<Object>} FAQ entry or null
   */
  async searchFAQ(query) {
    try {
      const faqData = await this.getFAQData();
      
      if (faqData.length === 0) {
        return null;
      }

      const queryLower = query.toLowerCase();
      
      // Search in questions, answers, and keywords
      for (const faq of faqData) {
        if (!faq.active) continue;
        
        // Check question
        if (faq.question.toLowerCase().includes(queryLower)) {
          return faq;
        }
        
        // Check answer
        if (faq.answer.toLowerCase().includes(queryLower)) {
          return faq;
        }
        
        // Check keywords
        if (faq.keywords && faq.keywords.some(keyword => 
          keyword.toLowerCase().includes(queryLower)
        )) {
          return faq;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error searching FAQ:', error.message);
      return null;
    }
  }
}

module.exports = GoogleSheetsIntegration;