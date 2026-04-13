# Smart Billing System

A voice-enabled smart billing system with PIN authentication and voice recognition for billing and product management.

## Features

- 🏪 **Shop Registration** - Register a shop and get a unique Shop ID
- 👤 **Role-Based Access** - Main shopkeeper and alternative shopkeeper roles
- 🔐 **PIN Authentication** - Login with Shop ID, role, and PIN
- 🎤 **Voice Product Upsert** - Add/update products by voice with simple logic
- 🧾 **Voice Billing** - Add items to bill using voice commands
- 🔊 **Synonym Support** - Products can be found by alternative names

## Tech Stack

- **Frontend:** React.js + Vite + TailwindCSS
- **Backend:** Node.js + Express.js
- **Database:** SQLite (better-sqlite3)
- **AI/Voice:** Browser Web Speech API + server-side text parsing
- **Authentication:** JWT + PIN

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PowerShell 7+ (for Windows)

### Setup

1. **Start both servers**:
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

2. **Open the app**: http://localhost:5173

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
- Access Products (Main shopkeeper only)
- Access Billing

### 5. Add Products (Voice)
- Click "Add Product"
- Speak examples:
  - "tomato 10kg 50rs" → add if missing, else add qty + set price
  - "tomato 20kg" → add qty to existing, else create with qty
  - "tomato 45rs" → update price, else create with price
- Matching is product + brand aware when brand is spoken

### 6. Create Bills
- Select products from the list
- Adjust quantities
- Voice commands continue to work throughout billing
- Bill is saved

## API Endpoints

### Shops
- `POST /api/shops` - Register new shop
- `GET /api/shops/:shop_id` - Get shop details

### Shopkeepers
- `POST /api/shopkeepers/register` - Register shopkeeper
- `POST /api/shopkeepers/get-by-shop` - Get shopkeeper by shop and role
- `POST /api/shopkeepers/verify-pin` - Verify PIN and get token

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
- `POST /api/voice/parse-product` - Parse product text to name/qty/price
- `GET /api/voice/status` - Voice parser status

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
│   │   └── voice.js       # Voice parsing endpoints
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
```

## Security Features

1. **PIN Authentication** - 4-digit PIN with bcrypt hashing
2. **JWT Tokens** - Secure API authentication
3. **Role-Based Access** - Main vs Alternative shopkeeper permissions

## License

MIT
# smart-billing
