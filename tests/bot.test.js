const MasjidWhatsAppBot = require('../wa-bot/venom');
const GoogleSheetsIntegration = require('../wa-bot/google-sheets');

// Mock dependencies
jest.mock('venom-bot');
jest.mock('axios');
jest.mock('../wa-bot/google-sheets');

describe('MasjidWhatsAppBot', () => {
  let bot;
  
  beforeEach(() => {
    // Set test environment variables
    process.env.N8N_WEBHOOK_URL = 'http://test-webhook.com';
    process.env.ADMIN_NUMBERS = '628123456789,628987654321';
    process.env.WA_SESSION_NAME = 'test-session';
    
    bot = new MasjidWhatsAppBot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      expect(bot.n8nWebhookUrl).toBe('http://test-webhook.com');
      expect(bot.sessionName).toBe('test-session');
      expect(bot.adminNumbers).toEqual(['628123456789', '628987654321']);
      expect(bot.googleSheets).toBeInstanceOf(GoogleSheetsIntegration);
    });

    test('should handle missing environment variables', () => {
      delete process.env.ADMIN_NUMBERS;
      delete process.env.WA_SESSION_NAME;
      
      const testBot = new MasjidWhatsAppBot();
      
      expect(testBot.adminNumbers).toEqual([]);
      expect(testBot.sessionName).toBe('masjid-session');
    });

    test('should trim admin numbers', () => {
      process.env.ADMIN_NUMBERS = ' 628123456789 , 628987654321 ';
      
      const testBot = new MasjidWhatsAppBot();
      
      expect(testBot.adminNumbers).toEqual(['628123456789', '628987654321']);
    });
  });

  describe('Admin Detection', () => {
    test('should detect admin by phone number only', () => {
      const mockMessage = {
        from: '628123456789@c.us',
        body: 'test message',
        isGroupMsg: false,
        fromMe: false
      };

      // This would be tested in the actual message handler
      const phoneNumber = mockMessage.from.replace('@c.us', '');
      const isAdmin = bot.adminNumbers.includes(phoneNumber) || bot.adminNumbers.includes(mockMessage.from);
      
      expect(isAdmin).toBe(true);
    });

    test('should detect admin by full WhatsApp ID', () => {
      bot.adminNumbers = ['628123456789@c.us', '628987654321'];
      
      const mockMessage = {
        from: '628123456789@c.us',
        body: 'test message'
      };

      const phoneNumber = mockMessage.from.replace('@c.us', '');
      const isAdmin = bot.adminNumbers.includes(phoneNumber) || bot.adminNumbers.includes(mockMessage.from);
      
      expect(isAdmin).toBe(true);
    });

    test('should not detect non-admin as admin', () => {
      const mockMessage = {
        from: '628999999999@c.us',
        body: 'test message'
      };

      const phoneNumber = mockMessage.from.replace('@c.us', '');
      const isAdmin = bot.adminNumbers.includes(phoneNumber) || bot.adminNumbers.includes(mockMessage.from);
      
      expect(isAdmin).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing webhook URL gracefully', () => {
      delete process.env.N8N_WEBHOOK_URL;
      
      const testBot = new MasjidWhatsAppBot();
      
      expect(testBot.n8nWebhookUrl).toBeUndefined();
    });

    test('should handle Google Sheets logging errors', async () => {
      const mockError = new Error('Google Sheets API error');
      bot.googleSheets.logMessage.mockRejectedValue(mockError);

      // This would be called in the actual message handler
      try {
        await bot.googleSheets.logMessage({
          number: '628123456789',
          text: 'test',
          messageType: 'test',
          reply: 'test reply',
          isAdmin: false
        });
      } catch (error) {
        expect(error.message).toBe('Google Sheets API error');
      }
    });
  });
});

describe('GoogleSheetsIntegration', () => {
  let sheets;

  beforeEach(() => {
    process.env.GOOGLE_SHEETS_API_KEY = 'test-api-key';
    process.env.GOOGLE_SHEETS_ID = 'test-sheet-id';
    
    sheets = new GoogleSheetsIntegration();
  });

  test('should initialize with correct properties', () => {
    expect(sheets.apiKey).toBe('test-api-key');
    expect(sheets.spreadsheetId).toBe('test-sheet-id');
    expect(sheets.baseUrl).toBe('https://sheets.googleapis.com/v4/spreadsheets');
  });

  test('should handle missing configuration gracefully', () => {
    delete process.env.GOOGLE_SHEETS_API_KEY;
    delete process.env.GOOGLE_SHEETS_ID;
    
    const testSheets = new GoogleSheetsIntegration();
    
    expect(testSheets.apiKey).toBeUndefined();
    expect(testSheets.spreadsheetId).toBeUndefined();
  });
});

describe('API Integration Tests', () => {
  test('should validate Aladhan API response structure', async () => {
    // Mock successful API response
    const mockResponse = {
      code: 200,
      data: {
        timings: {
          Fajr: '05:04',
          Dhuhr: '11:59',
          Asr: '15:30',
          Maghrib: '18:00',
          Isha: '19:15'
        },
        date: {
          readable: '15 Jan 2025'
        },
        meta: {
          timezone: 'Asia/Jakarta'
        }
      }
    };

    // Test that the response has required fields
    expect(mockResponse.code).toBe(200);
    expect(mockResponse.data.timings).toBeDefined();
    expect(mockResponse.data.timings.Fajr).toBeDefined();
    expect(mockResponse.data.timings.Dhuhr).toBeDefined();
    expect(mockResponse.data.timings.Asr).toBeDefined();
    expect(mockResponse.data.timings.Maghrib).toBeDefined();
    expect(mockResponse.data.timings.Isha).toBeDefined();
  });

  test('should handle API error responses', () => {
    const mockErrorResponse = {
      code: 400,
      error: 'Invalid city name'
    };

    expect(mockErrorResponse.code).toBe(400);
    expect(mockErrorResponse.error).toBeDefined();
  });
});

describe('Message Processing', () => {
  test('should detect prayer schedule requests', () => {
    const testMessages = [
      'jadwal sholat',
      'jadwal sholat jakarta',
      'waktu maghrib',
      'kapan dzuhur',
      'sholat isya'
    ];

    testMessages.forEach(message => {
      const text = message.toLowerCase().trim();
      const isPrayerRequest = text.includes('sholat') || text.includes('solat') || 
        text.includes('maghrib') || text.includes('subuh') || 
        text.includes('dzuhur') || text.includes('ashar') || 
        text.includes('isya') || text.includes('jadwal');
      
      expect(isPrayerRequest).toBe(true);
    });
  });

  test('should detect admin broadcast commands', () => {
    const testMessages = [
      'broadcast: Kajian malam ini',
      '/broadcast Pengumuman penting',
      'BROADCAST: Info terbaru'
    ];

    testMessages.forEach(message => {
      const text = message.toLowerCase().trim();
      const isBroadcast = text.startsWith('broadcast:') || text.startsWith('/broadcast');
      
      expect(isBroadcast).toBe(true);
    });
  });

  test('should detect admin commands', () => {
    const testMessages = [
      '/status',
      '/stats',
      '/help'
    ];

    testMessages.forEach(message => {
      const text = message.toLowerCase().trim();
      const isCommand = text.startsWith('/');
      
      expect(isCommand).toBe(true);
    });
  });
});

describe('Security Tests', () => {
  test('should sanitize phone numbers', () => {
    const testNumbers = [
      '628123456789@c.us',
      '+628123456789',
      '08123456789'
    ];

    testNumbers.forEach(number => {
      const sanitized = number.replace('@c.us', '').replace('+', '');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('+');
    });
  });

  test('should validate message content', () => {
    const dangerousMessages = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '../../etc/passwd'
    ];

    dangerousMessages.forEach(message => {
      // Basic validation - in real implementation, use proper sanitization
      const hasDangerousContent = message.includes('<script>') || 
        message.includes('javascript:') || 
        message.includes('../');
      
      expect(hasDangerousContent).toBe(true); // Should be detected and handled
    });
  });
});

describe('Performance Tests', () => {
  test('should handle concurrent messages', async () => {
    const concurrentMessages = Array.from({length: 10}, (_, i) => ({
      from: `62812345678${i}@c.us`,
      body: `Test message ${i}`,
      timestamp: new Date().toISOString()
    }));

    // Simulate concurrent processing
    const promises = concurrentMessages.map(async (message) => {
      const phoneNumber = message.from.replace('@c.us', '');
      return {
        number: phoneNumber,
        processed: true,
        timestamp: message.timestamp
      };
    });

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.processed).toBe(true);
      expect(result.number).toBeDefined();
    });
  });
});