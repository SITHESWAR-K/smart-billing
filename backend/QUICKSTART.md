# Quick Start Guide - Smart Billing Backend

## 📦 Installation Complete!

Your Node.js Express backend has been successfully created with all dependencies installed.

## 🚀 Quick Start

### 1. Start the Server
```bash
cd backend
npm start
```

The server will start on **http://localhost:5000**

### 2. Test the Health Endpoint
Open your browser or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Smart Billing Backend is operational",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected",
  "shops": 0
}
```

## 📁 Project Structure

```
backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── README.md                # Full documentation
│
├── database/
│   └── db.js                # SQLite setup & schema
│
├── middleware/
│   └── auth.js              # JWT authentication
│
└── routes/
    ├── health.js            # Health check
    ├── shops.js             # Shop endpoints
    ├── bills.js             # Bill endpoints
    └── products.js          # Product endpoints
```

## ⚙️ Configuration

### Create .env file
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your-api-key-here
JWT_SECRET=your-secret-key
```

## 🗄️ Database

SQLite database is automatically created at:
```
backend/database/smart_billing.db
```

**Tables Created:**
- `shops` - Shop information
- `shopkeepers` - Shop staff with PIN authentication
- `daily_codes` - Daily access codes
- `products` - Product catalog
- `bills` - Billing records

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - Server & database status
- `GET /health` - Simple health check

### Shops
- `POST /api/shops` - Create shop
- `GET /api/shops` - Get all shops
- `GET /api/shops/:shop_id` - Get shop details

### Bills (requires authentication)
- `POST /api/bills` - Create bill
- `GET /api/bills/:shop_id` - Get bills
- `GET /api/bills/:shop_id/:bill_id` - Get bill details

### Products (requires authentication)
- `POST /api/products` - Create product
- `GET /api/products/:shop_id` - Get products
- `PUT /api/products/:shop_id/:product_id` - Update product
- `DELETE /api/products/:shop_id/:product_id` - Delete product

## 🔐 Authentication

### Create a Shop
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "My Shop",
    "shopkeeper_name": "John Doe",
    "location": "Main Street",
    "pin": "1234"
  }'
```

Response includes a JWT token for authenticated requests.

### Use Token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/bills
```

## 📚 Dependencies Installed

- **express** - Web framework
- **cors** - Cross-origin support
- **better-sqlite3** - SQLite database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **multer** - File uploads
- **openai** - OpenAI API
- **uuid** - ID generation

## 🧪 Testing Example

### 1. Create a Shop
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Content-Type: application/json" \
  -d '{"shop_name": "Test Shop", "shopkeeper_name": "Admin", "pin": "1234"}'
```

Save the `shop_id` and `token` from response.

### 2. Create a Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shop_id": "YOUR_SHOP_ID",
    "name": "Product",
    "price": 99.99
  }'
```

### 3. Create a Bill
```bash
curl -X POST http://localhost:5000/api/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shop_id": "YOUR_SHOP_ID",
    "items": [{"name": "Product", "price": 99.99, "qty": 1}],
    "total": 99.99
  }'
```

## 📖 Documentation

For detailed documentation, see `README.md`

## 🆘 Troubleshooting

### Server won't start
- Check if port 5000 is available
- Verify Node.js is installed: `node --version`
- Reinstall dependencies: `npm install`

### Database errors
- Delete `backend/database/smart_billing.db` and restart
- Check file permissions in `backend/database/` folder

### CORS errors
- Update CORS_ORIGIN in `.env`
- Default allows all origins (`*`)

## ✨ Next Steps

1. ✅ Backend created
2. 🔄 Create frontend (React/Vue/etc.)
3. 📝 Add email notifications
4. 🔔 Add push notifications
5. 📊 Add analytics
6. 🤖 Integrate OpenAI features

## 📞 Support

Refer to `README.md` for detailed API documentation and examples.

Happy coding! 🎉
