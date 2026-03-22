# Smart Billing Backend

A Node.js Express backend for the Smart Billing system - a comprehensive billing and product management solution for shops.

## Project Structure

```
backend/
├── server.js                 # Main Express server entry point
├── database/
│   └── db.js                # SQLite database setup and initialization
├── routes/
│   ├── health.js            # Health check endpoints
│   ├── shops.js             # Shop management endpoints
│   ├── bills.js             # Bill management endpoints
│   └── products.js          # Product management endpoints
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── package.json             # Project dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your configuration:**
   - Add your OpenAI API key
   - Configure JWT secret (required for production)
   - Set PORT if different from 5000

4. **Start the server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## Database Schema

### tables Table
Stores shop information
```sql
- id: INTEGER PRIMARY KEY
- shop_id: TEXT UNIQUE
- shop_name: TEXT
- shopkeeper_name: TEXT
- location: TEXT
- created_at: TEXT
```

### shopkeepers Table
Manages shop staff with PIN authentication
```sql
- id: INTEGER PRIMARY KEY
- shop_id: TEXT (Foreign Key)
- name: TEXT
- pin_hash: TEXT (bcrypt hashed)
- role: TEXT ('main' or 'alternative')
- pitch_signature: TEXT
- created_at: TEXT
```

### daily_codes Table
Stores daily access codes for shops
```sql
- id: INTEGER PRIMARY KEY
- shop_id: TEXT (Foreign Key)
- code: TEXT
- date: TEXT
- expires_at: TEXT
- created_at: TEXT
```

### products Table
Product catalog for each shop
```sql
- id: INTEGER PRIMARY KEY
- shop_id: TEXT (Foreign Key)
- name: TEXT
- synonyms: TEXT (JSON)
- quantity: REAL
- price: REAL
- brand: TEXT
- created_at: TEXT
- updated_at: TEXT
```

### bills Table
Billing records
```sql
- id: INTEGER PRIMARY KEY
- shop_id: TEXT (Foreign Key)
- items: TEXT (JSON)
- total: REAL
- created_by: TEXT
- created_at: TEXT
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Check server and database status
- **GET** `/health` - Simple health check

### Shops
- **POST** `/api/shops` - Create a new shop
  ```json
  {
    "shop_name": "My Shop",
    "shopkeeper_name": "John Doe",
    "location": "Address",
    "pin": "1234"
  }
  ```
- **GET** `/api/shops` - Get all shops
- **GET** `/api/shops/:shop_id` - Get shop details

### Bills
- **POST** `/api/bills` - Create a bill (requires authentication)
  ```json
  {
    "shop_id": "uuid",
    "items": [{"name": "item", "price": 100, "quantity": 1}],
    "total": 100,
    "created_by": "user_name"
  }
  ```
- **GET** `/api/bills/:shop_id` - Get bills for a shop
- **GET** `/api/bills/:shop_id/:bill_id` - Get specific bill

### Products
- **POST** `/api/products` - Create a product (requires authentication)
  ```json
  {
    "shop_id": "uuid",
    "name": "Product Name",
    "synonyms": ["alias1", "alias2"],
    "quantity": 10,
    "price": 99.99,
    "brand": "Brand Name"
  }
  ```
- **GET** `/api/products/:shop_id` - Get products for a shop
- **PUT** `/api/products/:shop_id/:product_id` - Update a product (requires authentication)
- **DELETE** `/api/products/:shop_id/:product_id` - Delete a product (requires authentication)

## Authentication

The API uses JWT (JSON Web Tokens) for protected endpoints.

1. **Get token:**
   - Create a shop via POST `/api/shops`
   - Token is returned in response

2. **Use token:**
   - Add to request header: `Authorization: Bearer <token>`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `OPENAI_API_KEY` | OpenAI API key | Required for AI features |
| `JWT_SECRET` | JWT signing secret | your-secret-key |

## Development

### Start server in development mode:
```bash
npm run dev
```

### Project Dependencies
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **better-sqlite3** - SQLite database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **multer** - File upload handling
- **openai** - OpenAI API integration
- **uuid** - Unique ID generation

## Features

- ✅ Shop management with multi-user support
- ✅ PIN-based authentication with bcrypt hashing
- ✅ Bill creation and tracking
- ✅ Product catalog management
- ✅ JWT authentication for API endpoints
- ✅ Daily code generation for shops
- ✅ OpenAI integration ready
- ✅ File upload support with multer
- ✅ CORS enabled for frontend integration
- ✅ SQLite database with referential integrity

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Additional details (if available)"
}
```

## Security Notes

1. Change `JWT_SECRET` in production
2. Use HTTPS in production
3. Keep `.env` file out of version control
4. Regularly update dependencies
5. PINs are hashed with bcryptjs before storage
6. Foreign key constraints enabled for data integrity

## Future Enhancements

- [ ] Shopkeeper management endpoints
- [ ] Daily code generation endpoints
- [ ] OpenAI integration for smart suggestions
- [ ] File upload endpoints for images/documents
- [ ] Advanced billing reports
- [ ] Analytics and statistics
- [ ] Webhook support
- [ ] Rate limiting

## License

ISC

## Support

For issues or questions, please contact the development team.
