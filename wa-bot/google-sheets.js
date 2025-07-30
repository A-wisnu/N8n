const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

class GoogleSheetsIntegration {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY ? 
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;
    this.doc = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Google Sheets connection
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      if (!this.spreadsheetId || !this.serviceAccountEmail || !this.privateKey) {
        console.log('⚠️ Google Sheets not configured properly');
        return false;
      }

      // Create JWT auth
      const serviceAccountAuth = new JWT({
        email: this.serviceAccountEmail,
        key: this.privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      // Initialize document
      this.doc = new GoogleSpreadsheet(this.spreadsheetId, serviceAccountAuth);
      await this.doc.loadInfo();
      
      console.log(`✅ Connected to Google Sheet: ${this.doc.title}`);
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Error initializing Google Sheets:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get or create sheet by title
   * @param {string} sheetTitle - Sheet title
   * @param {Array} headers - Header row
   * @returns {Promise<Object>} Sheet object
   */
  async getOrCreateSheet(sheetTitle, headers = []) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      let sheet = this.doc.sheetsByTitle[sheetTitle];
      
      if (!sheet) {
        console.log(`📄 Creating new sheet: ${sheetTitle}`);
        sheet = await this.doc.addSheet({
          title: sheetTitle,
          headerValues: headers
        });
      } else if (headers.length > 0) {
        // Update headers if provided
        await sheet.setHeaderRow(headers);
      }

      return sheet;

    } catch (error) {
      console.error(`❌ Error getting/creating sheet ${sheetTitle}:`, error.message);
      return null;
    }
  }

  /**
   * Log message interaction to Google Sheets
   * @param {Object} messageData - Message data to log
   * @returns {Promise<Object>} Response from Google Sheets API
   */
  async logMessage(messageData) {
    try {
      const sheet = await this.getOrCreateSheet('MessageLog', [
        'Timestamp', 'Phone Number', 'Message', 'Type', 'Reply', 'Is Admin', 'Source'
      ]);

      if (!sheet) {
        console.log('⚠️ Could not access MessageLog sheet');
        return { success: false, reason: 'sheet_not_accessible' };
      }

      const timestamp = new Date().toISOString();
      const rowData = {
        'Timestamp': timestamp,
        'Phone Number': messageData.number || '',
        'Message': messageData.text || '',
        'Type': messageData.messageType || '',
        'Reply': messageData.reply || '',
        'Is Admin': messageData.isAdmin ? 'Yes' : 'No',
        'Source': messageData.source || 'whatsapp'
      };

      await sheet.addRow(rowData);
      console.log('✅ Message logged to Google Sheets');
      return { success: true, data: rowData };

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
      const sheet = await this.getOrCreateSheet('FAQ', [
        'Question', 'Answer', 'Category', 'Keywords', 'Active'
      ]);

      if (!sheet) {
        console.log('⚠️ Could not access FAQ sheet');
        return [];
      }

      const rows = await sheet.getRows();
      const faqData = [];

      rows.forEach((row, index) => {
        if (row.get('Question') && row.get('Answer')) {
          faqData.push({
            id: index + 1,
            question: row.get('Question') || '',
            answer: row.get('Answer') || '',
            category: row.get('Category') || 'general',
            keywords: row.get('Keywords') ? 
              row.get('Keywords').split(',').map(k => k.trim()) : [],
            active: row.get('Active') !== 'false' // Default to active unless explicitly set to false
          });
        }
      });

      console.log(`✅ Loaded ${faqData.length} FAQ entries from Google Sheets`);
      return faqData;

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
      const sheet = await this.getOrCreateSheet('PrayerLog', [
        'Timestamp', 'Phone Number', 'City', 'Source', 'Status', 'Error'
      ]);

      if (!sheet) {
        console.log('⚠️ Could not access PrayerLog sheet');
        return { success: false, reason: 'sheet_not_accessible' };
      }

      const timestamp = new Date().toISOString();
      const rowData = {
        'Timestamp': timestamp,
        'Phone Number': prayerData.number || '',
        'City': prayerData.city || '',
        'Source': prayerData.source || '',
        'Status': prayerData.success ? 'Success' : 'Failed',
        'Error': prayerData.error || ''
      };

      await sheet.addRow(rowData);
      console.log('✅ Prayer request logged to Google Sheets');
      return { success: true, data: rowData };

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
      if (!this.apiKey || !this.spreadsheetId) {
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
      const sheet = await this.getOrCreateSheet('AdminLog', [
        'Timestamp', 'Admin Number', 'Action', 'Details', 'Status', 'Error'
      ]);

      if (!sheet) {
        console.log('⚠️ Could not access AdminLog sheet');
        return { success: false, reason: 'sheet_not_accessible' };
      }

      const timestamp = new Date().toISOString();
      const rowData = {
        'Timestamp': timestamp,
        'Admin Number': actionData.adminNumber || '',
        'Action': actionData.action || '',
        'Details': actionData.details || '',
        'Status': actionData.success ? 'Success' : 'Failed',
        'Error': actionData.error || ''
      };

      await sheet.addRow(rowData);
      console.log('✅ Admin action logged to Google Sheets');
      return { success: true, data: rowData };

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
      const sheet = await this.getOrCreateSheet('MessageLog', [
        'Timestamp', 'Phone Number', 'Message', 'Type', 'Reply', 'Is Admin', 'Source'
      ]);

      if (!sheet) {
        console.log('⚠️ Could not access MessageLog sheet');
        return { success: false, reason: 'sheet_not_accessible' };
      }

      const rows = await sheet.getRows();
      const today = new Date().toISOString().split('T')[0];
      
      let totalMessages = rows.length;
      let todayMessages = 0;
      let uniqueUsers = new Set();
      let messageTypes = {};

      rows.forEach(row => {
        const timestamp = row.get('Timestamp');
        const phoneNumber = row.get('Phone Number');
        const messageType = row.get('Type');

        // Count today's messages
        if (timestamp && timestamp.startsWith(today)) {
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
      });

      return {
        success: true,
        stats: {
          totalMessages,
          todayMessages,
          uniqueUsers: uniqueUsers.size,
          messageTypes
        }
      };

    } catch (error) {
      console.error('❌ Error getting usage stats:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GoogleSheetsIntegration;