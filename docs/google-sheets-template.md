# 📊 Google Sheets Template untuk Masjid AI Agent

Dokumen ini menjelaskan struktur Google Sheets yang diperlukan untuk integrasi dengan Masjid AI Agent.

## 🔧 Setup Google Sheets

### 1. Buat Google Spreadsheet Baru

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik "Blank" untuk membuat spreadsheet baru
3. Rename spreadsheet menjadi "Masjid AI Agent Data"
4. Copy Spreadsheet ID dari URL (bagian setelah `/d/` dan sebelum `/edit`)

### 2. Dapatkan API Key

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih project yang ada
3. Enable "Google Sheets API"
4. Buat credentials → API Key
5. Copy API key yang dihasilkan

## 📋 Struktur Sheets

Buat 5 sheet dengan nama dan struktur berikut:

### Sheet 1: MessageLog

**Nama Sheet:** `MessageLog`

| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|----------|----------|----------|----------|----------|----------|----------|
| Timestamp | Phone Number | Message | Type | Reply | Is Admin | Source |

**Contoh Data:**
```
2024-01-15T10:30:00Z | 628123456789 | jadwal sholat | prayer_schedule | 🕌 Jadwal Sholat Jakarta... | No | whatsapp
2024-01-15T10:35:00Z | 628987654321 | /broadcast Kajian malam ini | admin_broadcast | ✅ Broadcast berhasil dikirim! | Yes | whatsapp
```

### Sheet 2: FAQ

**Nama Sheet:** `FAQ`

| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Question | Answer | Category | Keywords | Active |

**Contoh Data:**
```
Apa itu puasa sunnah? | Puasa sunnah adalah puasa yang dianjurkan dalam Islam seperti puasa Senin-Kamis, puasa Daud, dan puasa 6 hari di bulan Syawal. | ibadah | puasa,sunnah,senin,kamis | true
Kapan waktu sholat Jumat? | Sholat Jumat dilaksanakan setelah masuk waktu Dzuhur hingga sebelum waktu Ashar, biasanya dimulai pukul 12:00 WIB. | sholat | jumat,waktu,dzuhur | true
```

### Sheet 3: PrayerLog

**Nama Sheet:** `PrayerLog`

| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Timestamp | Phone Number | City | Source | Status | Error |

**Contoh Data:**
```
2024-01-15T10:30:00Z | 628123456789 | Jakarta | aladhan | Success |
2024-01-15T10:31:00Z | 628555666777 | Surabaya | myquran | Failed | City not found
```

### Sheet 4: Announcements

**Nama Sheet:** `Announcements`

| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Title | Content | Category | Active |

**Contoh Data:**
```
Kajian Rutin | Kajian rutin setiap Rabu malam ba'da Maghrib. Tema: Akhlak dalam Islam. | kajian | true
Sholat Jumat | Sholat Jumat akan dimulai pukul 12:00 WIB. Jamaah diharapkan hadir 15 menit sebelumnya. | sholat | true
```

### Sheet 5: AdminLog

**Nama Sheet:** `AdminLog`

| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Timestamp | Admin Number | Action | Details | Status | Error |

**Contoh Data:**
```
2024-01-15T10:35:00Z | 628987654321 | broadcast | Kajian malam ini pukul 19:30 | Success |
2024-01-15T10:40:00Z | 628987654321 | status | Check bot status | Success |
```

## 🔐 Permissions & Security

### 1. Set Sheet Permissions

1. Klik "Share" di kanan atas Google Sheets
2. Pilih "Anyone with the link can view"
3. Atau tambahkan email service account jika menggunakan service account

### 2. API Key Security

⚠️ **PENTING:** 
- Jangan share API key di public repository
- Gunakan environment variables
- Restrict API key hanya untuk Google Sheets API
- Set HTTP referrer restrictions jika diperlukan

## 🧪 Testing Integration

### 1. Test Manual

Gunakan curl untuk test API:

```bash
# Test read data
curl "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/FAQ?key=YOUR_API_KEY"

# Test write data (gunakan POST)
curl -X POST \
  "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/MessageLog:append?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "values": [["2024-01-15T10:30:00Z", "628123456789", "test message", "test", "test reply", "No", "whatsapp"]],
    "majorDimension": "ROWS"
  }'
```

### 2. Test via Bot

1. Kirim pesan ke bot WhatsApp
2. Cek apakah data masuk ke MessageLog sheet
3. Test FAQ dengan mengirim pertanyaan yang ada di FAQ sheet

## 📈 Analytics & Reporting

### Contoh Formula untuk Analytics

**Total Messages Today:**
```
=COUNTIF(MessageLog!A:A, ">="&TODAY())
```

**Unique Users This Month:**
```
=SUMPRODUCT((MONTH(MessageLog!A:A)=MONTH(TODAY()))*(YEAR(MessageLog!A:A)=YEAR(TODAY()))/COUNTIFS(MessageLog!B:B,MessageLog!B:B,MessageLog!A:A,">="&EOMONTH(TODAY(),-1)+1,MessageLog!A:A,"<="&EOMONTH(TODAY(),0)))
```

**Most Asked Prayer Cities:**
```
=QUERY(PrayerLog!C:C, "SELECT C, COUNT(C) WHERE C != '' GROUP BY C ORDER BY COUNT(C) DESC LIMIT 10")
```

## 🔄 Maintenance

### Regular Tasks

1. **Weekly:** Review dan clean up duplicate entries
2. **Monthly:** Archive old logs (>3 months) ke sheet terpisah
3. **Quarterly:** Update FAQ berdasarkan pertanyaan yang sering muncul

### Backup

1. Download sheets sebagai Excel/CSV secara berkala
2. Gunakan Google Takeout untuk backup lengkap
3. Setup automated backup via Google Apps Script (optional)

## 🚨 Troubleshooting

### Common Issues

**"API key not valid"**
- Pastikan API key benar
- Cek apakah Google Sheets API sudah enabled
- Verify API key restrictions

**"Sheet not found"**
- Pastikan nama sheet exact match (case sensitive)
- Cek apakah sheet ID benar

**"Insufficient permissions"**
- Pastikan sheet permissions correct
- Cek service account permissions jika menggunakan service account

**"Quota exceeded"**
- Google Sheets API limit: 300 requests per minute per project
- Implement rate limiting di aplikasi
- Consider caching untuk reduce API calls

## 📞 Support

Jika ada masalah dengan Google Sheets integration:

1. Cek logs di aplikasi untuk error details
2. Test manual API calls dengan curl
3. Verify sheet structure dan permissions
4. Check Google Cloud Console untuk API usage dan errors

---

*Template ini dirancang untuk mendukung full functionality Masjid AI Agent dengan logging, FAQ management, dan analytics* 📊🕌