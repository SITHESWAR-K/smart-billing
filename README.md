# Smart Billing System

A voice-enabled smart billing system with multi-factor authentication (PIN + voice pitch verification), voice-to-text product management, and daily rotating security codes.

## Features

- 🏪 **Shop Registration** - Register a shop and get a unique Shop ID
- 👤 **Role-Based Access** - Main shopkeeper and alternative shopkeeper roles
- 🔐 **Multi-Factor Authentication** - PIN + Voice pitch verification
- 🎤 **Voice-to-Text Product Entry** - Add products using voice (powered by OpenAI Whisper)
- 📅 **Daily Rotating Codes** - 24-hour security codes for additional verification
- 🧾 **Billing System** - Create bills with dual verification
- 🔊 **Synonym Support** - Products can be found by alternative names

## Tech Stack

- **Frontend:** React.js + Vite + TailwindCSS
- **Backend:** Node.js + Express.js
- **Database:** SQLite (better-sqlite3)
- **AI/Voice:** OpenAI Whisper API for speech-to-text
- **Authentication:** JWT + PIN + Voice pitch verification

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PowerShell 7+ (for Windows)
- OpenAI API key (for voice features)

### Setup

1. **Configure OpenAI API Key** (for voice features):
   ```bash
   cd backend
   # Edit .env file and add your OpenAI API key
   ```

2. **Start both servers**:
   ```powershell
   .\start.ps1
   ```
   
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Open the app**: http://localhost:5173

## Usage Flow

### 1. Register a Shop
- Go to "Register Shop"
- Enter shop name, shopkeeper name, and location
- You'll receive a unique Shop ID

### 2. Register Shopkeeper
- Enter the Shop ID
- Set your name, role, and 4-digit PIN

### 3. Login
- Enter Shop ID
- Select your role (Main/Alternative)
- Enter your PIN

### 4. Dashboard
- View the daily rotating code
- Access Products (Main shopkeeper only)
- Access Billing

### 5. Add Products (Voice)
- Click "Add Product"
- Use the voice recording feature
- Speak: "Rice, 50 rupees, Basmati brand"
- The form auto-fills with transcribed data

### 6. Create Bills
- Select products from the list
- Adjust quantities
- Complete voice verification
- Bill is saved with dual verification

## API Endpoints

### Shops
- `POST /api/shops` - Register new shop
- `GET /api/shops/:shop_id` - Get shop details

### Shopkeepers
- `POST /api/shopkeepers/register` - Register shopkeeper
- `POST /api/shopkeepers/get-by-shop` - Get shopkeeper by shop and role
- `POST /api/shopkeepers/verify-pin` - Verify PIN and get token
- `POST /api/shopkeepers/save-pitch` - Save voice pitch signature
- `POST /api/shopkeepers/verify-pitch` - Verify voice pitch

### Products
- `POST /api/products` - Add product
- `GET /api/products/:shop_id` - Get products for shop
- `PUT /api/products/:shop_id/:product_id` - Update product
- `DELETE /api/products/:shop_id/:product_id` - Delete product

### Bills
- `POST /api/bills` - Create bill
- `GET /api/bills/:shop_id` - Get all bills for shop
- `GET /api/bills/:shop_id/:bill_id` - Get specific bill

### Voice
- `POST /api/voice/transcribe` - Transcribe audio to text
- `POST /api/voice/transcribe-product` - Transcribe and parse product info
- `POST /api/voice/update-price` - Transcribe price update

### Daily Codes
- `GET /api/daily-codes/:shop_id` - Get/generate daily code
- `POST /api/daily-codes/verify` - Verify daily code

## Project Structure

```
smart billing/
├── backend/
│   ├── server.js           # Main Express server
│   ├── database/
│   │   └── db.js          # SQLite setup
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   ├── routes/
│   │   ├── shops.js       # Shop endpoints
│   │   ├── shopkeepers.js # Shopkeeper endpoints
│   │   ├── products.js    # Product endpoints
│   │   ├── bills.js       # Billing endpoints
│   │   ├── voice.js       # Voice/Whisper endpoints
│   │   └── dailyCodes.js  # Daily code endpoints
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── api/           # API client
│   │   └── utils/         # Utilities
│   └── dist/              # Production build
└── start.ps1              # Startup script
```

## Environment Variables

Backend `.env`:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

## Security Features

1. **PIN Authentication** - 4-digit PIN with bcrypt hashing
2. **Voice Pitch Verification** - Biometric voice frequency matching
3. **Daily Rotating Codes** - Codes change every 24 hours
4. **JWT Tokens** - Secure API authentication
5. **Role-Based Access** - Main vs Alternative shopkeeper permissions

## License

MIT
# smart-billing
