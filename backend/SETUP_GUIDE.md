# Smart Billing Backend - Complete Setup Guide

## 🎉 Project Setup Complete!

Your Node.js Express backend has been successfully created and is ready to use.

---

## 📋 What Was Created

### ✅ Directory Structure
```
backend/
├── server.js                    ← Main entry point
├── package.json                 ← Dependencies list
├── package-lock.json           
├── .env.example                ← Environment template
├── .gitignore                  ← Git ignore rules
│
├── database/
│   └── db.js                   ← SQLite setup & schema
│
├── middleware/
│   └── auth.js                 ← JWT authentication
│
├── routes/
│   ├── health.js              ← Health endpoints
│   ├── shops.js               ← Shop management
│   ├── bills.js               ← Bill management
│   └── products.js            ← Product management
│
├── Documentation/
│   ├── README.md              ← Full documentation
│   ├── QUICKSTART.md          ← Quick start guide
│   ├── PROJECT_SUMMARY.md     ← Project overview
│   └── POSTMAN_COLLECTION.json ← Postman import file
│
└── node_modules/              ← Dependencies installed
```

### ✅ Installed Dependencies (9 packages)
- ✅ express - Web framework
- ✅ cors - Cross-origin requests
- ✅ better-sqlite3 - Database
- ✅ jsonwebtoken - JWT auth
- ✅ bcryptjs - Password hashing
- ✅ dotenv - Environment config
- ✅ multer - File uploads
- ✅ openai - AI integration
- ✅ uuid - ID generation

### ✅ Database Tables Created
- ✅ shops - Shop information
- ✅ shopkeepers - Staff with PIN auth
- ✅ daily_codes - Daily access codes
- ✅ products - Product catalog
- ✅ bills - Bill records

---

## 🚀 How to Use

### Step 1: Navigate to Backend
```bash
cd "c:\Users\sithe\OneDrive\Desktop\web_dev\smart billing\backend"
```

### Step 2: Start Server
```bash
npm start
```

You'll see:
```
Smart Billing Backend running on port 5000
Environment: development
Database initialized successfully
```

### Step 3: Test It Works
Open browser or terminal and test:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Smart Billing Backend is operational",
  "timestamp": "2024-01-XX...",
  "database": "connected",
  "shops": 0
}
```

---

## 🔧 Configuration

### Create Environment File
```bash
copy .env.example .env
```

### Edit .env with your settings
```
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your-key-here
JWT_SECRET=your-secret-here
```

**Important for Production:**
- Change JWT_SECRET to a secure random value
- Set NODE_ENV=production
- Add valid OPENAI_API_KEY if using AI features

---

## 📡 API Usage Examples

### 1. Create a Shop (No Auth Required)
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Fresh Market",
    "shopkeeper_name": "Admin User",
    "location": "123 Main St",
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

**Save the shop_id and token for next steps!**

### 2. Create a Product (Auth Required)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "shop_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Milk Packet",
    "synonyms": ["milk", "dairy"],
    "quantity": 50,
    "price": 45,
    "brand": "Amul"
  }'
```

### 3. Create a Bill (Auth Required)
```bash
curl -X POST http://localhost:5000/api/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "shop_id": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {"name": "Milk Packet", "price": 45, "quantity": 2},
      {"name": "Bread", "price": 30, "quantity": 1}
    ],
    "total": 120,
    "created_by": "Admin User"
  }'
```

### 4. Get All Products
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:5000/api/products/550e8400-e29b-41d4-a716-446655440000"
```

### 5. Get All Bills
```bash
curl "http://localhost:5000/api/bills/550e8400-e29b-41d4-a716-446655440000"
```

---

## 📊 Complete API Reference

### Health & Status
```
GET  /health                    → Simple health check
GET  /api/health               → Detailed health (with DB check)
```

### Shop Operations
```
POST /api/shops                → Create shop (returns token)
GET  /api/shops                → List all shops
GET  /api/shops/:shop_id       → Get shop details
```

### Product Operations (🔒 = Auth Required)
```
POST   /api/products           → Create product 🔒
GET    /api/products/:shop_id  → List products
PUT    /api/products/:shop_id/:product_id  → Update product 🔒
DELETE /api/products/:shop_id/:product_id  → Delete product 🔒
```

### Bill Operations
```
POST /api/bills                                → Create bill 🔒
GET  /api/bills/:shop_id                     → List bills
GET  /api/bills/:shop_id/:bill_id            → Get bill details
```

---

## 🔐 Authentication

### How It Works
1. **Create Shop** → Get JWT token
2. **Use Token** → Add to headers: `Authorization: Bearer <token>`
3. **Protected Routes** → API validates token before processing

### Token Duration
- Default: 24 hours
- Configurable in auth.js

### JWT Structure
```javascript
{
  shop_id: "...",
  name: "...",
  role: "main" or "alternative"
}
```

---

## 💾 Database

### Location
```
backend/database/smart_billing.db
```

### Created On
- First server startup
- Automatically initialized with all tables and constraints

### Reset Database
```bash
# Stop server (Ctrl+C)
# Delete the .db file
# Restart server with: npm start
```

### Tables with Relationships
```
shops (primary)
  ├── shopkeepers (foreign key: shop_id)
  ├── products (foreign key: shop_id)
  ├── bills (foreign key: shop_id)
  └── daily_codes (foreign key: shop_id)
```

---

## 🛠️ Development Features

### Automatic Features
✅ CORS enabled (all origins by default)
✅ JSON body parsing
✅ Error handling
✅ 404 responses
✅ Timestamps auto-added
✅ Foreign key constraints
✅ PIN hashing with bcrypt
✅ UUID generation

### Features Ready to Extend
📦 File upload support (multer configured)
🤖 OpenAI integration (ready to use)
🔑 Multi-role authentication (main/alternative)
📅 Daily code system (schema ready)

---

## 📝 Important Files Explained

### server.js
Main Express server that:
- Initializes middleware (CORS, JSON parsing)
- Sets up database
- Mounts all routes
- Handles errors and 404s
- Runs on port 5000

### database/db.js
Handles:
- SQLite connection
- Database initialization
- Schema creation
- Foreign key enforcement
- Exports database instance

### middleware/auth.js
Provides:
- JWT token verification
- Token generation
- Protected endpoint middleware
- Error handling for auth failures

### routes/*.js
Each route file handles:
- POST requests (create)
- GET requests (retrieve)
- PUT requests (update)
- DELETE requests (delete)
- Error responses

---

## 🧪 Testing Workflow

### Phase 1: Server Test
```bash
npm start
# Should see: "Smart Billing Backend running on port 5000"
```

### Phase 2: Health Check
```bash
curl http://localhost:5000/api/health
# Should get: status "ok" with database connected
```

### Phase 3: Create Shop
```bash
# POST /api/shops with shop details
# Save the token from response
```

### Phase 4: Create Product
```bash
# POST /api/products with token in header
# Verify it creates successfully
```

### Phase 5: Create Bill
```bash
# POST /api/bills with token in header
# Verify it saves items as JSON
```

---

## ✨ Key Features Implemented

### Security
- ✅ PIN hashing with bcryptjs (10 rounds)
- ✅ JWT authentication
- ✅ Role-based access (main/alternative)
- ✅ Secure token generation

### Data Management
- ✅ SQLite with referential integrity
- ✅ Foreign key constraints enabled
- ✅ Auto-generated UUIDs for shops
- ✅ Timestamps on all records

### API Design
- ✅ RESTful endpoints
- ✅ Consistent error responses
- ✅ Pagination support (limit/offset)
- ✅ CORS enabled

### Performance
- ✅ SQLite (lightweight, no external DB needed)
- ✅ Connection pooling ready
- ✅ Efficient queries
- ✅ JSON data storage for complex items

---

## 🎓 Learning Resources

### Documentation Files
1. **README.md** - Complete API reference
2. **QUICKSTART.md** - Quick setup guide
3. **PROJECT_SUMMARY.md** - Technical overview
4. **POSTMAN_COLLECTION.json** - Ready-to-import API tests

### Files to Study
1. **server.js** - Express setup pattern
2. **database/db.js** - SQLite schema design
3. **middleware/auth.js** - JWT implementation
4. **routes/shops.js** - Complete CRUD example

---

## 🚨 Troubleshooting

### Problem: Server won't start
**Solution:**
```bash
# Check Node version
node --version

# Try npm install again
npm install

# Check if port 5000 is free
# Try different port: PORT=3000 npm start
```

### Problem: "Database locked" error
**Solution:**
```bash
# Make sure only one instance running
# Delete .db-journal file if it exists
# Restart server
```

### Problem: Auth errors on protected routes
**Solution:**
```bash
# Verify token is in header
Authorization: Bearer YOUR_TOKEN

# Check token wasn't modified
# Tokens expire after 24h - create new shop for new token
```

### Problem: CORS errors from frontend
**Solution:**
```bash
# Edit .env file
CORS_ORIGIN=http://your-frontend-url

# Or use default (*) for development
```

---

## 📞 Next Steps

1. ✅ **Backend Running** - Start with `npm start`
2. 🔨 **Test APIs** - Use curl or Postman
3. 📱 **Build Frontend** - Connect to these endpoints
4. 🔌 **Add Endpoints** - Shopkeeper and daily_codes routes
5. 🚀 **Deploy** - Set production environment variables

---

## 📋 Quick Reference

### Start Server
```bash
npm start
```

### Stop Server
```bash
Ctrl+C
```

### Check Health
```bash
curl http://localhost:5000/api/health
```

### View Files
```bash
backend/
```

### Edit Config
```bash
Edit backend/.env file
```

---

## 🎉 You're All Set!

Your Smart Billing Backend is ready to:
- ✅ Manage multiple shops
- ✅ Store product catalogs
- ✅ Track bills and transactions
- ✅ Authenticate users with JWT
- ✅ Support file uploads
- ✅ Integrate with OpenAI

**Start with:** `npm start`

Happy coding! 🚀
