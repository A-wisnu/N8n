# WAHA WhatsApp Bot - API Guide

This guide covers the migration from venom-bot to WAHA and the enhanced API functionality.

## 🔄 Migration Summary

### What Changed
- **venom-bot** → **WAHA HTTP API**
- Direct WhatsApp Web integration → HTTP API service
- Browser automation → Containerized service
- Local sessions → WAHA session management

### Benefits
- More stable and reliable
- Better scaling capabilities
- Rich HTTP API
- Professional webhook support
- Multiple session support
- Better media handling

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Key environment variables:
```env
WAHA_BASE_URL=http://localhost:3000
WAHA_API_KEY=your_secure_api_key
WA_SESSION_NAME=default
ADMIN_NUMBERS=6281234567890,6289876543210
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/wa
```

### 2. Install and Run

```bash
# Make setup script executable
chmod +x setup-waha.sh

# Run setup (will install dependencies and start services)
./setup-waha.sh

# Or manual installation
npm install
docker compose up -d
```

### 3. Access Services

- **WAHA Dashboard**: http://localhost:3000/dashboard
- **WAHA API**: http://localhost:3000/swagger
- **Webhook Service**: http://localhost:3001/health

## 📡 API Endpoints

### Core Messaging

#### Send Text Message
```http
POST /webhook/send-message
Content-Type: application/json

{
  "chatId": "6281234567890@c.us",
  "text": "Hello World!",
  "sessionName": "default"
}
```

#### Send Image
```http
POST /webhook/send-image
Content-Type: application/json

{
  "chatId": "6281234567890@c.us",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check this out!",
  "sessionName": "default"
}
```

#### Broadcast Message
```http
POST /webhook/broadcast
Content-Type: application/json

{
  "message": "📢 Important announcement for all users!",
  "excludeNumbers": ["6281234567890"],
  "sessionName": "default"
}
```

### Enhanced Features

#### Send Location
```javascript
const bot = new EnhancedWAHABot();
await bot.sendLocation(
  '6281234567890@c.us',
  -6.2088,  // latitude
  106.8456, // longitude
  'Jakarta', // name
  'Jakarta, Indonesia' // address
);
```

#### Send Voice Message
```javascript
await bot.sendVoice(
  '6281234567890@c.us',
  'https://example.com/audio.mp3'
);
```

#### Send Contact
```javascript
await bot.sendContact('6281234567890@c.us', {
  name: 'John Doe',
  number: '+6281234567890'
});
```

#### Reply to Message
```javascript
await bot.replyToMessage(
  '6281234567890@c.us',
  'Thanks for your message!',
  'message_id_here'
);
```

#### React to Message
```javascript
await bot.reactToMessage(
  '6281234567890@c.us',
  'message_id_here',
  '👍'
);
```

### Group Management

#### Create Group
```javascript
await bot.createGroup(
  'My New Group',
  ['6281234567890@c.us', '6289876543210@c.us']
);
```

#### Add Participant
```javascript
await bot.addParticipant(
  'group_id@g.us',
  '6281234567890@c.us'
);
```

#### Remove Participant
```javascript
await bot.removeParticipant(
  'group_id@g.us',
  '6281234567890@c.us'
);
```

#### Promote/Demote Admin
```javascript
await bot.promoteParticipant('group_id@g.us', '6281234567890@c.us');
await bot.demoteParticipant('group_id@g.us', '6281234567890@c.us');
```

#### Update Group Info
```javascript
await bot.setGroupSubject('group_id@g.us', 'New Group Name');
await bot.setGroupDescription('group_id@g.us', 'Updated description');
```

### Contact Management

#### Get Contact Info
```javascript
const contact = await bot.getContactInfo('6281234567890@c.us');
```

#### Block/Unblock Contact
```javascript
await bot.blockContact('6281234567890@c.us');
await bot.unblockContact('6281234567890@c.us');
```

#### Get Profile Picture
```javascript
const profilePic = await bot.getProfilePicture('6281234567890@c.us');
```

### Chat Operations

#### Mute/Unmute Chat
```javascript
await bot.muteChat('6281234567890@c.us');
await bot.unmuteChat('6281234567890@c.us');
```

#### Clear/Delete Chat
```javascript
await bot.clearChat('6281234567890@c.us');
await bot.deleteChat('6281234567890@c.us');
```

### Advanced Features

#### Message Queue with Priority
```javascript
// High priority message (sent first)
await bot.sendTextWithQueue(
  '6281234567890@c.us',
  'Urgent message!',
  'high'
);

// Normal priority
await bot.sendTextWithQueue(
  '6281234567890@c.us',
  'Regular message',
  'normal'
);
```

#### Schedule Message
```javascript
const scheduleTime = new Date(Date.now() + 3600000); // 1 hour from now
await bot.scheduleMessage(
  '6281234567890@c.us',
  'This is a scheduled message',
  scheduleTime.getTime()
);
```

#### Bulk Messages
```javascript
const messages = [
  { type: 'text', chatId: '6281234567890@c.us', text: 'Message 1' },
  { type: 'text', chatId: '6289876543210@c.us', text: 'Message 2' }
];

const results = await bot.sendBulkMessages(messages);
```

#### Typing Indicators
```javascript
await bot.startTyping('6281234567890@c.us');
// Simulate typing for 3 seconds
setTimeout(async () => {
  await bot.stopTyping('6281234567890@c.us');
  await bot.sendText('6281234567890@c.us', 'Hello!');
}, 3000);
```

#### Download Media
```javascript
const filePath = await bot.downloadMedia('message_id_with_media');
console.log('Media saved to:', filePath);
```

## 🔗 Webhook Events

### Message Received
```json
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "message_id",
    "from": "6281234567890@c.us",
    "body": "Hello!",
    "type": "text",
    "timestamp": 1640995200,
    "fromMe": false
  }
}
```

### Session Status
```json
{
  "event": "session.status",
  "session": "default",
  "payload": {
    "status": "WORKING"
  }
}
```

## 🔧 Admin Commands

### Via HTTP API

#### Get Status
```http
POST /webhook/admin
Content-Type: application/json

{
  "command": "status",
  "adminNumber": "6281234567890",
  "sessionName": "default"
}
```

#### Get Statistics
```http
POST /webhook/admin
Content-Type: application/json

{
  "command": "stats",
  "adminNumber": "6281234567890",
  "sessionName": "default"
}
```

#### Admin Broadcast
```http
POST /webhook/admin
Content-Type: application/json

{
  "command": "broadcast",
  "adminNumber": "6281234567890",
  "sessionName": "default",
  "data": {
    "message": "Admin announcement"
  }
}
```

#### Take Screenshot
```http
POST /webhook/admin
Content-Type: application/json

{
  "command": "screenshot",
  "adminNumber": "6281234567890",
  "sessionName": "default"
}
```

## 📊 Status and Monitoring

### Get Session Status
```http
GET /api/session/status/default
```

### Get Screenshot
```http
GET /api/screenshot/default
```

### Health Check
```http
GET /health
```

### Enhanced Status
```javascript
const status = await bot.getDetailedStatus();
console.log(status);
// Returns: session info, chat counts, queue status, etc.
```

## 🔄 Integration Examples

### N8N Integration

The bot automatically forwards messages to N8N if `N8N_WEBHOOK_URL` is configured:

```javascript
// Incoming message is automatically sent to N8N as:
{
  "type": "message",
  "session": "default",
  "message": {
    "from": "6281234567890@c.us",
    "body": "Hello bot!",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Google Sheets Logging

Messages are automatically logged to Google Sheets if configured:

```javascript
// Configure in .env
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
```

### Custom Webhook Processing

```javascript
// Handle custom webhook events
app.post('/webhook/custom', (req, res) => {
  const { chatId, action, data } = req.body;
  
  switch (action) {
    case 'send_prayer_time':
      await bot.sendText(chatId, `🕌 Waktu Sholat: ${data.prayer} - ${data.time}`);
      break;
    case 'send_reminder':
      await bot.scheduleMessage(chatId, data.message, data.scheduleTime);
      break;
  }
  
  res.json({ success: true });
});
```

## 🚨 Error Handling

### Retry Logic
The enhanced bot includes automatic retry logic for failed messages:

```javascript
// Messages are retried up to 3 times with exponential backoff
// Failed messages are logged for manual inspection
```

### Rate Limiting
Built-in rate limiting prevents spam detection:

```javascript
// Default: 1 second delay between messages
// Configurable via rateLimitDelay property
bot.rateLimitDelay = 2000; // 2 seconds
```

### Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Security

### API Key Authentication
All WAHA API calls require authentication:

```http
X-Api-Key: your_secure_api_key
```

### Admin Authorization
Admin endpoints verify phone numbers:

```javascript
// Only numbers in ADMIN_NUMBERS can execute admin commands
const adminNumbers = process.env.ADMIN_NUMBERS.split(',');
```

### Webhook Validation
Implement webhook signature validation for production:

```javascript
// Add webhook signature validation
const crypto = require('crypto');

function validateWebhook(signature, body, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

## 📱 Mobile App Integration

### Send Message via API
```curl
curl -X POST http://your-server.com/webhook/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "6281234567890@c.us",
    "text": "Hello from mobile app!"
  }'
```

### Get Status
```curl
curl -X GET http://your-server.com/api/session/status
```

## 🔄 Migration from Venom

### Code Changes Required

1. **Update imports**:
```javascript
// Old
const venom = require('venom-bot');

// New
const WAHAClient = require('./wa-bot/waha-client');
// or
const EnhancedWAHABot = require('./wa-bot/waha-enhanced');
```

2. **Update initialization**:
```javascript
// Old
const client = await venom.create({...});

// New
const client = new WAHAClient({...});
await client.initialize();
```

3. **Update message handling**:
```javascript
// Old
client.onMessage(callback);

// New
client.onMessage(callback);
// (API is compatible)
```

### Environment Variables Migration
```env
# Remove venom-specific variables
# WA_SESSION_NAME → WA_SESSION_NAME (same)

# Add WAHA-specific variables
WAHA_BASE_URL=http://localhost:3000
WAHA_API_KEY=your_api_key
```

## 🧪 Testing

### Run Integration Tests
```bash
# Test all functionality
node tests/test-waha-integration.js

# Test specific features
npm test
```

### Manual Testing
```bash
# Start services
docker compose up -d

# Check health
curl http://localhost:3000/api/version
curl http://localhost:3001/health

# Send test message
curl -X POST http://localhost:3001/webhook/send-message \
  -H "Content-Type: application/json" \
  -d '{"chatId":"6281234567890@c.us","text":"Test message"}'
```

## 📝 Logging

### View Logs
```bash
# WAHA service logs
docker compose logs -f waha

# Bot service logs
docker compose logs -f masjid-bot

# Webhook service logs
docker compose logs -f masjid-server
```

### Log Levels
- **INFO**: General information
- **WARNING**: Non-critical issues
- **ERROR**: Critical errors requiring attention

## 🔧 Troubleshooting

### Common Issues

#### WAHA Service Not Starting
```bash
# Check Docker logs
docker compose logs waha

# Restart service
docker compose restart waha
```

#### Session Not Working
```bash
# Check session status
curl http://localhost:3000/api/sessions

# Restart session
curl -X DELETE http://localhost:3000/api/sessions/default
curl -X POST http://localhost:3000/api/sessions -d '{"name":"default"}'
```

#### Messages Not Sending
```bash
# Check webhook logs
docker compose logs masjid-server

# Test direct WAHA API
curl -X POST http://localhost:3000/api/sendText \
  -H "X-Api-Key: admin" \
  -d '{"session":"default","chatId":"6281234567890@c.us","text":"test"}'
```

### Support

For issues and support:
1. Check the logs first
2. Verify environment configuration
3. Test API endpoints manually
4. Review WAHA documentation: https://waha.devlike.pro/

## 🚀 Production Deployment

### Docker Compose Production
```yaml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    restart: always
    environment:
      - WAHA_API_KEY=${WAHA_API_KEY}
    volumes:
      - waha_sessions:/app/.sessions
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

### Environment Security
```env
# Use strong, unique API keys
WAHA_API_KEY=sha256:your_hashed_api_key

# Secure webhook URLs
WEBHOOK_URL=https://your-secure-domain.com/webhook

# Restrict admin access
ADMIN_NUMBERS=verified_admin_numbers_only
```

This completes the WAHA WhatsApp Bot API migration and enhancement guide. The system now provides a robust, scalable, and feature-rich WhatsApp bot platform.