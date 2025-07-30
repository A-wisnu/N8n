# 📋 Changelog - Masjid AI Agent

## [1.1.0] - 2025-01-15 - API Updates & Google Sheets Integration

### ✨ New Features
- **Google Sheets Integration**: Added comprehensive logging and knowledge base functionality
  - Message logging untuk tracking semua interaksi
  - FAQ management system
  - Prayer request analytics
  - Admin action logging
  - Usage statistics dashboard

### 🔄 API Updates
- **Prayer Times API**: 
  - Switched to Aladhan API sebagai primary source (more reliable)
  - MyQuran API v2 sebagai fallback system
  - Improved error handling dan city detection
  
- **OpenRouter AI**: 
  - Updated to use `z-ai/glm-4.5-air:free` model
  - Configured with provided API key: `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`
  - Better Indonesian language support

### 🔧 Configuration Updates
- **Environment Variables**: 
  - Added Google Sheets API key: `a3cf10afe2a6fd236ce7f1ab6e457c5faff9e88d`
  - Updated prayer API endpoints
  - New OpenRouter model configuration

### 📊 Enhanced Logging
- **Message Tracking**: All WhatsApp interactions logged to Google Sheets
- **Prayer Analytics**: Track most requested cities and success rates  
- **Admin Monitoring**: Log all admin commands and broadcast activities
- **Usage Statistics**: Real-time stats untuk monitoring bot performance

### 🛠️ Technical Improvements
- **Fallback System**: Dual API system untuk prayer times (Aladhan + MyQuran)
- **Error Handling**: Improved error handling dengan detailed logging
- **Rate Limiting**: Smart API call management to avoid quota issues
- **Documentation**: Added Google Sheets template dan setup guide

### 📁 New Files Added
- `wa-bot/google-sheets.js` - Google Sheets integration module
- `docs/google-sheets-template.md` - Complete setup guide
- `.env` - Production environment configuration

### 🔄 Updated Files
- `n8n/workflows/wa_ai_agent_flow.json` - Updated untuk Aladhan API dan new model
- `.env.example` - Added Google Sheets configuration
- `package.json` - Added googleapis dependency
- `docker-compose.yml` - Updated environment variables
- `scripts/deploy-railway.sh` - Added Google Sheets deployment variables
- `README.md` - Updated API documentation dan examples

### 🎯 Ready for Production
- All API keys configured dan tested
- Google Sheets templates ready to use
- Comprehensive logging system active
- Fallback mechanisms in place
- Full documentation provided

---

## [1.0.0] - 2025-01-15 - Initial Release

### ✨ Core Features
- WhatsApp Bot dengan Venom.js
- n8n Workflow automation
- Prayer times dari MyQuran API
- OpenRouter AI integration
- Admin broadcast system
- Docker containerization
- Railway deployment ready

### 📚 Documentation
- Complete README dengan setup instructions
- Contributing guidelines
- Project structure documentation
- Deployment scripts

---

**🎉 Status: READY FOR PRODUCTION USE!**

Semua fitur telah diimplementasi dan siap untuk digunakan oleh jamaah masjid. Bot dapat langsung di-deploy dan mulai melayani dengan:

1. ✅ API keys sudah dikonfigurasi
2. ✅ Google Sheets integration ready
3. ✅ Dual prayer API system
4. ✅ Comprehensive logging
5. ✅ Admin management tools
6. ✅ Error handling & fallbacks

*Alhamdulillah, semoga bermanfaat untuk kemudahan ibadah umat* 🕌🤲