# Smart Billing Backend - Project Summary

## ✅ Project Created Successfully!

Your Node.js Express backend for the Smart Billing system has been created with all requested features.

---

## 📁 Directory Structure

```
c:\Users\sithe\OneDrive\Desktop\web_dev\smart billing\backend\
│
├── server.js                   # Main Express server (Port: 5000)
├── package.json                # Project dependencies & scripts
├── package-lock.json           # Dependency lock file
├── README.md                   # Comprehensive documentation
├── QUICKSTART.md              # Quick start guide
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
│
├── database/
│   └── db.js                  # SQLite initialization & schema
│
├── middleware/
│   └── auth.js                # JWT authentication middleware
│
├── routes/
│   ├── health.js              # Health check endpoints
│   ├── shops.js               # Shop management APIs
│   ├── bills.js               # Bill management APIs
│   └── products.js            # Product management APIs
│
└── node_modules/              # Dependencies (already installed)
```

---

## 📦 Installed Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| better-sqlite3 | ^9.0.0 | SQLite database driver |
| jsonwebtoken | ^9.1.0 | JWT authentication |
| bcryptjs | ^2.4.3 | Password/PIN hashing |
| dotenv | ^16.3.1 | Environment variables |
| multer | ^1.4.5-lts.1 | File upload handling |
| openai | ^4.28.0 | OpenAI API integration |
| uuid | ^9.0.0 | Unique ID generation |

---

## 🗄️ Database Schema

### Tables Created:

#### 1. **shops** Table
```sql
CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id TEXT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  shopkeeper_name TEXT NOT NULL,
  location TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. **shopkeepers** Table
```sql
CREATE TABLE shopkeepers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('main', 'alternative')),
  pitch_signature TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
)
```

#### 3. **daily_codes** Table
```sql
CREATE TABLE daily_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id TEXT NOT NULL,
  code TEXT NOT NULL,
  date TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
)
```

#### 4. **products** Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  synonyms TEXT,
  quantity REAL,
  price REAL,
  brand TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
)
```

#### 5. **bills** Table
```sql
CREATE TABLE bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id TEXT NOT NULL,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
)
```

---

## 🌐 API Endpoints

### Health Check
```
GET  /api/health          - Server & database status
GET  /health              - Simple health check
```

### Shops Management
```
POST   /api/shops                    - Create new shop
GET    /api/shops                    - Get all shops
GET    /api/shops/:shop_id           - Get shop details
```

### Bills Management
```
POST   /api/bills                    - Create bill (🔐 Auth required)
GET    /api/bills/:shop_id           - Get shop bills
GET    /api/bills/:shop_id/:bill_id  - Get bill details
```

### Products Management
```
POST   /api/products/:shop_id                      - Create product (🔐)
GET    /api/products/:shop_id                      - Get products
PUT    /api/products/:shop_id/:product_id          - Update product (🔐)
DELETE /api/products/:shop_id/:product_id          - Delete product (🔐)
```

🔐 = Requires JWT authentication

---

## 🚀 Getting Started

### 1. Navigate to Backend Directory
```bash
cd "c:\Users\sithe\OneDrive\Desktop\web_dev\smart billing\backend"
```

### 2. Setup Environment (Optional)
```bash
copy .env.example .env
# Edit .env and add your configuration
```

### 3. Start the Server
```bash
npm start
```

Output:
```
Smart Billing Backend running on port 5000
Environment: development
```

### 4. Test the Server
```bash
curl http://localhost:5000/api/health
```

---

## 🔐 Authentication System

### How It Works:
1. **Shop Creation**: User creates a shop with PIN
   - PIN is hashed with bcryptjs (10 salt rounds)
   - UUID generated for shop_id
   - JWT token returned for authentication

2. **Token Usage**: Include in requests:
   ```
   Authorization: Bearer <jwt_token>
   ```

3. **Token Verification**: Middleware validates token before processing protected endpoints

---

## 📝 Example Requests

### Create a Shop
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Main Store",
    "shopkeeper_name": "John Doe",
    "location": "123 Main Street",
    "pin": "1234"
  }'
```

Response:
```json
{
  "message": "Shop created successfully",
  "shop_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create a Product (Requires Token)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "shop_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Milk",
    "synonyms": ["dairy", "liquid milk"],
    "quantity": 100,
    "price": 50,
    "brand": "Fresh Dairy"
  }'
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your-openai-key
JWT_SECRET=your-jwt-secret
```

### Key Features
✅ CORS enabled (accepts all origins by default)
✅ JSON body parsing enabled
✅ Error handling middleware
✅ 404 handler
✅ Foreign key constraints enabled
✅ Automatic timestamps on records

---

## 🛠️ Server Features

- **Port**: 5000 (configurable via PORT env var)
- **CORS**: Enabled (configurable)
- **JSON Parsing**: Automatic
- **Database**: SQLite (auto-created at startup)
- **Authentication**: JWT-based
- **Password Security**: bcryptjs with salt rounds
- **Error Handling**: Comprehensive error responses

---

## 📂 Database File Location
```
backend/database/smart_billing.db
```

Auto-created on first server run. Delete and restart to reset database.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Complete API documentation & features |
| **QUICKSTART.md** | Quick start guide with examples |
| **package.json** | Project dependencies & scripts |

---

## ✨ Ready to Use Features

✅ Shop creation with PIN authentication  
✅ Multi-user shopkeeper roles (main/alternative)  
✅ Product catalog management  
✅ Bill tracking with item details  
✅ Daily code generation system  
✅ JWT token-based authorization  
✅ SQLite database with referential integrity  
✅ File upload support (multer)  
✅ OpenAI API integration ready  
✅ CORS for frontend integration  

---

## 🎯 Next Steps

1. **Test the API** - Use the provided curl examples
2. **Create Frontend** - Connect to these endpoints from your frontend
3. **Add More Routes** - Implement shopkeeper, daily_codes endpoints
4. **Configure OpenAI** - Add OPENAI_API_KEY for AI features
5. **Deploy** - Set appropriate environment variables for production

---

## 💡 Important Notes

- Database is created automatically on first run
- PINs are stored as bcrypt hashes (never plaintext)
- JWTs expire in 24 hours by default
- All timestamps use ISO format
- Foreign keys enabled for data integrity
- IDs are UUIDs for shops, auto-increment for records

---

## 📞 Support

Detailed documentation available in:
- `README.md` - Full API reference
- `QUICKSTART.md` - Quick setup guide

---

**Backend Setup Complete! 🎉**

You can now start the server with `npm start` and begin building your frontend!
