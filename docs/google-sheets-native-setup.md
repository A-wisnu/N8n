# 🔧 Google Sheets Native API Setup Guide

Panduan lengkap untuk menggunakan **Google Sheets Native API** dengan Service Account authentication untuk Masjid AI Agent.

## 🎯 **Mengapa Native API?**

### ✅ **Keuntungan Native API:**
- **Lebih Secure**: Menggunakan service account dengan scoped permissions
- **Lebih Reliable**: Tidak ada rate limiting yang ketat seperti API key
- **Auto Sheet Creation**: Otomatis membuat sheet yang diperlukan
- **Better Error Handling**: Error handling yang lebih baik
- **Type Safety**: Menggunakan official Google client library

### ❌ **Masalah API Key (Old Method):**
- Rate limiting yang ketat
- Security risk jika API key exposed
- Manual sheet setup required
- Limited functionality

---

## 🚀 **Setup Guide**

### **Step 1: Create Google Cloud Project**

1. **Buka Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Login dengan Google account Anda

2. **Create New Project**
   ```
   Project Name: Masjid AI Agent
   Project ID: masjid-ai-agent-[random]
   ```

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Enable: **Google Sheets API**
   - Enable: **Google Drive API**

### **Step 2: Create Service Account**

1. **Navigate to Service Accounts**
   ```
   APIs & Services → Credentials → Create Credentials → Service Account
   ```

2. **Service Account Details**
   ```
   Service Account Name: Masjid Bot Sheets
   Service Account ID: masjid-bot-sheets
   Description: Service account for Masjid AI Agent Google Sheets integration
   ```

3. **Grant Permissions (Optional)**
   - Skip this step for now

4. **Create Key**
   - Click on created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key"
   - Choose **JSON** format
   - Download the key file

### **Step 3: Extract Credentials**

From the downloaded JSON file, extract:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "masjid-bot-sheets@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

**Yang Anda butuhkan:**
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

### **Step 4: Create Google Spreadsheet**

1. **Create New Spreadsheet**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Create new spreadsheet
   - Name: "Masjid AI Agent Data"

2. **Get Spreadsheet ID**
   ```
   URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   Copy the SPREADSHEET_ID part
   ```

3. **Share with Service Account**
   - Click "Share" button
   - Add service account email: `masjid-bot-sheets@your-project.iam.gserviceaccount.com`
   - Give "Editor" permission
   - Click "Send"

### **Step 5: Configure Environment Variables**

Update your `.env` file:

```bash
# Google Sheets API (Native with Service Account)
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=masjid-bot-sheets@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important Notes:**
- Keep the `\n` in the private key
- Wrap the private key in double quotes
- Don't remove the `-----BEGIN/END PRIVATE KEY-----` parts

---

## 🧪 **Testing Setup**

### **Test Script**

Create `test-sheets.js`:

```javascript
const GoogleSheetsIntegration = require('./wa-bot/google-sheets');

async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets Integration...');
  
  const sheets = new GoogleSheetsIntegration();
  
  // Test initialization
  const initialized = await sheets.initialize();
  if (!initialized) {
    console.error('❌ Failed to initialize Google Sheets');
    return;
  }
  
  // Test sheet creation
  await sheets.initializeSheets();
  
  // Test logging a message
  const testResult = await sheets.logMessage({
    number: '628123456789',
    text: 'Test message from setup',
    messageType: 'test',
    reply: 'Test reply',
    isAdmin: false,
    source: 'test'
  });
  
  if (testResult.success) {
    console.log('✅ Google Sheets integration working!');
  } else {
    console.error('❌ Google Sheets test failed:', testResult.error);
  }
}

testGoogleSheets();
```

### **Run Test**

```bash
node test-sheets.js
```

**Expected Output:**
```
🧪 Testing Google Sheets Integration...
✅ Connected to Google Sheet: Masjid AI Agent Data
🔧 Initializing Google Sheets structure...
✅ Sheet 'MessageLog' ready
✅ Sheet 'FAQ' ready
✅ Sheet 'PrayerLog' ready
✅ Sheet 'Announcements' ready
✅ Sheet 'AdminLog' ready
✅ Message logged to Google Sheets
✅ Google Sheets integration working!
```

---

## 📊 **Sheet Structure**

Bot akan otomatis membuat sheets dengan struktur berikut:

### **1. MessageLog Sheet**
| Timestamp | Phone Number | Message | Type | Reply | Is Admin | Source |
|-----------|-------------|---------|------|-------|----------|--------|
| 2025-01-15T10:30:00Z | 628123456789 | jadwal sholat | prayer_schedule | 🕌 Jadwal Sholat... | No | whatsapp |

### **2. FAQ Sheet**
| Question | Answer | Category | Keywords | Active |
|----------|--------|----------|----------|--------|
| Kapan sholat Jumat? | Sholat Jumat dimulai pukul 12:00 WIB | sholat | jumat,waktu | true |

### **3. PrayerLog Sheet**
| Timestamp | Phone Number | City | Source | Status | Error |
|-----------|-------------|------|--------|---------|-------|
| 2025-01-15T10:30:00Z | 628123456789 | Jakarta | aladhan | Success | |

### **4. AdminLog Sheet**
| Timestamp | Admin Number | Action | Details | Status | Error |
|-----------|-------------|--------|---------|---------|-------|
| 2025-01-15T10:35:00Z | 628987654321 | broadcast | Kajian malam ini | Success | |

### **5. Announcements Sheet**
| Title | Content | Category | Active |
|-------|---------|----------|--------|
| Kajian Rutin | Kajian setiap Rabu malam | kajian | true |

---

## 🔐 **Security Best Practices**

### **Environment Variables**
```bash
# ✅ Good - Use environment variables
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# ❌ Bad - Don't hardcode in code
const privateKey = "-----BEGIN PRIVATE KEY-----\n...";
```

### **File Permissions**
```bash
# Set proper permissions for .env file
chmod 600 .env

# Don't commit .env to git
echo ".env" >> .gitignore
```

### **Service Account Permissions**
- Only give necessary permissions
- Use specific scopes:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`

---

## 🚨 **Troubleshooting**

### **Common Errors:**

#### 1. **"Error: No key or keyFile set"**
```bash
Solution: Check GOOGLE_PRIVATE_KEY in .env file
Make sure it includes -----BEGIN/END PRIVATE KEY-----
```

#### 2. **"Error: The caller does not have permission"**
```bash
Solution: 
1. Share spreadsheet with service account email
2. Give "Editor" permission
3. Check service account email is correct
```

#### 3. **"Error: Unable to parse key"**
```bash
Solution: 
1. Check private key format
2. Make sure \n are preserved
3. Wrap in double quotes in .env
```

#### 4. **"Error: Spreadsheet not found"**
```bash
Solution:
1. Check GOOGLE_SHEETS_ID is correct
2. Make sure spreadsheet exists
3. Verify service account has access
```

### **Debug Mode**

Enable debug logging:

```javascript
// Add to wa-bot/google-sheets.js constructor
constructor() {
  // ... existing code ...
  this.debug = process.env.NODE_ENV === 'development';
}

// Add debug logging
if (this.debug) {
  console.log('🐛 Debug: Initializing with:', {
    spreadsheetId: this.spreadsheetId,
    serviceAccountEmail: this.serviceAccountEmail,
    hasPrivateKey: !!this.privateKey
  });
}
```

---

## 📈 **Performance & Limits**

### **Google Sheets API Limits:**
- **Read requests**: 300 per minute per project
- **Write requests**: 300 per minute per project
- **Concurrent requests**: 100

### **Optimization Tips:**
- Batch operations when possible
- Cache frequently accessed data
- Use exponential backoff for retries
- Monitor API usage in Google Cloud Console

---

## 🔄 **Migration from API Key**

If you're migrating from the old API key method:

### **1. Update Dependencies**
```bash
npm uninstall googleapis
npm install google-spreadsheet google-auth-library
```

### **2. Update Environment Variables**
```bash
# Remove old
# GOOGLE_SHEETS_API_KEY=...

# Add new
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
```

### **3. Update Code**
The new implementation is backward compatible - just update your `.env` file and restart the bot.

---

## 🎉 **Conclusion**

Native Google Sheets API memberikan:
- ✅ Better security dengan service account
- ✅ More reliable connection
- ✅ Auto sheet management
- ✅ Better error handling
- ✅ No rate limiting issues

Bot sekarang siap untuk production dengan Google Sheets integration yang robust!

---

## 📞 **Support**

Jika ada masalah:
1. Check logs untuk error details
2. Verify service account permissions
3. Test dengan script di atas
4. Check Google Cloud Console untuk API usage

**Happy coding!** 🚀🕌