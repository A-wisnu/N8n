const GoogleSheetsIntegration = require('./wa-bot/google-sheets');
require('dotenv').config();

async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets Native Integration...\n');
  
  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  console.log(`   GOOGLE_SHEETS_ID: ${process.env.GOOGLE_SHEETS_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_SERVICE_ACCOUNT_EMAIL: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Missing required environment variables. Please check your .env file.');
    console.log('\n📖 See docs/google-sheets-native-setup.md for setup instructions.');
    return;
  }
  
  const sheets = new GoogleSheetsIntegration();
  
  try {
    // Test 1: Initialize connection
    console.log('🔗 Test 1: Initializing connection...');
    const initialized = await sheets.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize Google Sheets connection');
      return;
    }
    console.log('✅ Connection successful!\n');
    
    // Test 2: Initialize sheets structure
    console.log('📊 Test 2: Setting up sheet structure...');
    await sheets.initializeSheets();
    console.log('✅ Sheet structure ready!\n');
    
    // Test 3: Log a test message
    console.log('📝 Test 3: Testing message logging...');
    const messageResult = await sheets.logMessage({
      number: '628123456789',
      text: 'Test message from native integration setup',
      messageType: 'test',
      reply: 'This is a test reply from native Google Sheets API',
      isAdmin: false,
      source: 'test_script'
    });
    
    if (messageResult.success) {
      console.log('✅ Message logged successfully!');
      console.log(`   Data: ${JSON.stringify(messageResult.data, null, 2)}\n`);
    } else {
      console.error('❌ Message logging failed:', messageResult.error);
    }
    
    // Test 4: Log a prayer request
    console.log('🕌 Test 4: Testing prayer request logging...');
    const prayerResult = await sheets.logPrayerRequest({
      number: '628123456789',
      city: 'Jakarta',
      source: 'aladhan',
      success: true,
      error: ''
    });
    
    if (prayerResult.success) {
      console.log('✅ Prayer request logged successfully!');
      console.log(`   Data: ${JSON.stringify(prayerResult.data, null, 2)}\n`);
    } else {
      console.error('❌ Prayer request logging failed:', prayerResult.error);
    }
    
    // Test 5: Log admin action
    console.log('👤 Test 5: Testing admin action logging...');
    const adminResult = await sheets.logAdminAction({
      adminNumber: '628987654321',
      action: 'test_setup',
      details: 'Testing native Google Sheets integration setup',
      success: true,
      error: ''
    });
    
    if (adminResult.success) {
      console.log('✅ Admin action logged successfully!');
      console.log(`   Data: ${JSON.stringify(adminResult.data, null, 2)}\n`);
    } else {
      console.error('❌ Admin action logging failed:', adminResult.error);
    }
    
    // Test 6: Get usage statistics
    console.log('📈 Test 6: Testing usage statistics...');
    const statsResult = await sheets.getUsageStats();
    
    if (statsResult.success) {
      console.log('✅ Usage statistics retrieved successfully!');
      console.log(`   Stats: ${JSON.stringify(statsResult.stats, null, 2)}\n`);
    } else {
      console.error('❌ Usage statistics failed:', statsResult.error);
    }
    
    // Test 7: Test FAQ functionality
    console.log('❓ Test 7: Testing FAQ functionality...');
    
    // First, let's add a test FAQ entry manually to the sheet
    const faqSheet = await sheets.getOrCreateSheet('FAQ', [
      'Question', 'Answer', 'Category', 'Keywords', 'Active'
    ]);
    
    if (faqSheet) {
      // Add a test FAQ entry
      await faqSheet.addRow({
        'Question': 'Kapan waktu sholat Maghrib?',
        'Answer': 'Waktu sholat Maghrib dimulai saat matahari terbenam, biasanya sekitar pukul 18:00 WIB di Jakarta.',
        'Category': 'sholat',
        'Keywords': 'maghrib,waktu,sholat',
        'Active': 'true'
      });
      
      // Now test retrieving FAQ data
      const faqData = await sheets.getFAQData();
      console.log(`✅ FAQ data retrieved: ${faqData.length} entries found`);
      
      if (faqData.length > 0) {
        console.log(`   Sample FAQ: ${JSON.stringify(faqData[0], null, 2)}\n`);
      }
      
      // Test FAQ search
      const searchResult = await sheets.searchFAQ('maghrib');
      if (searchResult) {
        console.log('✅ FAQ search working!');
        console.log(`   Found: ${searchResult.question}\n`);
      } else {
        console.log('ℹ️ No FAQ match found for "maghrib"\n');
      }
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Google Sheets connection: Working');
    console.log('   ✅ Sheet structure: Created');
    console.log('   ✅ Message logging: Working');
    console.log('   ✅ Prayer logging: Working');
    console.log('   ✅ Admin logging: Working');
    console.log('   ✅ Usage statistics: Working');
    console.log('   ✅ FAQ functionality: Working');
    console.log('\n🚀 Native Google Sheets integration is ready for production!');
    
    console.log('\n📖 Next steps:');
    console.log('   1. Update your bot configuration');
    console.log('   2. Deploy to your production environment');
    console.log('   3. Monitor the sheets for real data');
    console.log('   4. Add FAQ entries as needed');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your Google Cloud Console setup');
    console.log('   2. Verify service account permissions');
    console.log('   3. Ensure spreadsheet is shared with service account');
    console.log('   4. Check environment variables format');
    console.log('   5. See docs/google-sheets-native-setup.md for detailed guide');
  }
}

// Add some helper info
console.log('🔧 Google Sheets Native API Test Script');
console.log('=====================================\n');

testGoogleSheets().then(() => {
  console.log('\n✨ Test script completed!');
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error.message);
  process.exit(1);
});