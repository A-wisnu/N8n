# 🤝 Contributing to Masjid AI Agent

Terima kasih atas minat Anda untuk berkontribusi pada proyek Masjid AI Agent! Kontribusi dari komunitas sangat membantu untuk mengembangkan bot yang lebih baik untuk jamaah masjid.

## 🎯 Cara Berkontribusi

### 1. Melaporkan Bug

Jika Anda menemukan bug, silakan buat issue dengan informasi berikut:

- **Deskripsi bug**: Jelaskan apa yang terjadi
- **Langkah reproduksi**: Bagaimana cara memunculkan bug tersebut
- **Hasil yang diharapkan**: Apa yang seharusnya terjadi
- **Screenshot/logs**: Jika ada, sertakan screenshot atau log error
- **Environment**: OS, Node.js version, dll

### 2. Mengusulkan Fitur Baru

Untuk fitur baru, buat issue dengan label "feature request" dan sertakan:

- **Deskripsi fitur**: Jelaskan fitur yang diinginkan
- **Use case**: Kapan dan mengapa fitur ini dibutuhkan
- **Mockup/contoh**: Jika ada, berikan contoh implementasi

### 3. Pull Request

Sebelum membuat pull request:

1. **Fork repository** ini
2. **Create branch** untuk fitur/perbaikan Anda
3. **Commit changes** dengan pesan yang jelas
4. **Push branch** ke fork Anda
5. **Create pull request** dengan deskripsi lengkap

#### Format Commit Message

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: fitur baru
- `fix`: perbaikan bug
- `docs`: update dokumentasi
- `style`: perubahan formatting
- `refactor`: refactoring code
- `test`: menambah/update tests
- `chore`: maintenance tasks

**Contoh:**
```
feat(bot): add prayer reminder notification

- Add automatic prayer time notifications
- Support multiple cities
- Configurable reminder intervals

Closes #123
```

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 16.0.0
- Docker (optional)
- Git

### Setup Lokal

```bash
# Clone your fork
git clone https://github.com/your-username/masjid-ai-agent.git
cd masjid-ai-agent

# Setup development environment
./scripts/setup-local.sh

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Start development
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📋 Development Guidelines

### Code Style

- Gunakan **ESLint** dan **Prettier** untuk formatting
- Ikuti **JavaScript Standard Style**
- Gunakan **camelCase** untuk variabel dan fungsi
- Gunakan **PascalCase** untuk class names
- Tambahkan **JSDoc comments** untuk fungsi kompleks

### File Structure

```
/masjid-ai-agent
├── /wa-bot           # WhatsApp bot logic
├── /n8n              # n8n workflows
├── /scripts          # Deployment & setup scripts
├── /tests            # Test files
└── /docs             # Additional documentation
```

### Naming Conventions

- **Files**: `kebab-case.js`
- **Functions**: `camelCase()`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Environment variables**: `UPPER_SNAKE_CASE`

### Error Handling

```javascript
// Good
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('❌ Error in apiCall:', error.message);
  throw new Error(`API call failed: ${error.message}`);
}

// Bad
const result = await apiCall(); // No error handling
```

### Logging

```javascript
// Use consistent logging format
console.log('✅ Success message');
console.warn('⚠️ Warning message');
console.error('❌ Error message');
console.info('ℹ️ Info message');
```

## 🧪 Testing

### Unit Tests

```javascript
// Example test structure
describe('Prayer Schedule API', () => {
  test('should fetch prayer times for Jakarta', async () => {
    const result = await getPrayerTimes('Jakarta');
    expect(result).toHaveProperty('subuh');
    expect(result).toHaveProperty('maghrib');
  });
});
```

### Integration Tests

- Test WhatsApp bot message handling
- Test n8n workflow execution
- Test API integrations

### Manual Testing

1. Test WhatsApp bot dengan berbagai jenis pesan
2. Verify n8n workflow responses
3. Check API error handling
4. Test admin commands

## 📚 Documentation

### Code Documentation

```javascript
/**
 * Fetch prayer times for a specific city
 * @param {string} cityName - Name of the city
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Prayer times object
 * @throws {Error} When API request fails
 */
async function getPrayerTimes(cityName, date) {
  // Implementation
}
```

### README Updates

Jika Anda menambah fitur baru, update:
- Feature list di README.md
- Usage examples
- Configuration options
- Troubleshooting section

## 🔄 Pull Request Process

### Checklist PR

- [ ] Code mengikuti style guide
- [ ] Tests telah ditambahkan/diupdate
- [ ] Documentation telah diupdate
- [ ] No breaking changes (atau dijelaskan)
- [ ] Commit messages mengikuti format
- [ ] PR description lengkap dan jelas

### Review Process

1. **Automated checks** harus pass (linting, tests)
2. **Code review** oleh maintainer
3. **Manual testing** jika diperlukan
4. **Merge** setelah approval

### After Merge

- Branch akan dihapus otomatis
- Changes akan di-deploy ke staging
- Release notes akan diupdate

## 🏷️ Versioning

Kami menggunakan [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## 🤝 Community Guidelines

### Code of Conduct

- Bersikap hormat dan profesional
- Hindari bahasa yang menyinggung
- Fokus pada konstruktif feedback
- Bantu newcomers

### Communication

- **Issues**: Untuk bug reports dan feature requests
- **Discussions**: Untuk pertanyaan umum dan diskusi
- **PR Comments**: Untuk code review feedback

## 🏆 Recognition

Kontributor akan diakui di:

- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub Contributors** - Automatic recognition

## ❓ Pertanyaan?

Jika ada pertanyaan tentang contributing:

1. Cek **existing issues** dan **discussions**
2. Buat **new discussion** jika belum ada
3. Tag **@maintainers** jika urgent

## 🙏 Terima Kasih

Setiap kontribusi, sekecil apapun, sangat berarti untuk komunitas jamaah masjid. Jazakallahu khairan!

---

*Semoga berkah dalam setiap kontribusi untuk kemudahan ibadah umat* 🤲