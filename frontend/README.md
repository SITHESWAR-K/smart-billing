# Smart Billing Frontend

A modern React + Vite frontend application for a voice-authenticated billing system. This application provides a complete billing solution with dual verification, product management, and voice-based security features.

## 🚀 Features

- **Voice-Authenticated Billing**: Uses Web Audio API for voice verification
- **Pitch Detection**: Real-time pitch frequency extraction for voice verification
- **Product Management**: Add, edit, and delete products (Main shopkeeper only)
- **Billing System**: Create bills with dual verification
- **Role-Based Access**: Main and Alternative shopkeeper roles
- **Daily Code Generation**: Rotating daily code for additional security
- **Protected Routes**: Secure authentication and authorization
- **Responsive Design**: Works on desktop and mobile devices
- **Beautiful UI**: TailwindCSS styling with indigo/purple theme

## 📁 Project Structure

```
frontend/
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Main app component with routing
│   ├── index.css                # Global styles with TailwindCSS directives
│   │
│   ├── api/
│   │   └── api.js              # Axios instance with auth interceptor
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # Global authentication state management
│   │
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── RegisterShop.jsx      # Shop registration
│   │   ├── RegisterShopkeeper.jsx # Shopkeeper registration
│   │   ├── Login.jsx            # Authentication login
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── Products.jsx         # Product management
│   │   ├── Billing.jsx          # Create new bills
│   │   └── Bills.jsx            # View all bills
│   │
│   ├── components/
│   │   ├── ProtectedRoute.jsx   # Protected route wrapper
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── DailyCode.jsx        # Daily code display component
│   │   ├── PinInput.jsx         # 4-digit PIN input component
│   │   ├── VoiceRecorder.jsx    # Audio recording component
│   │   ├── VoiceVerification.jsx # Voice verification component
│   │   ├── ProductCard.jsx      # Product card component
│   │   └── BillItem.jsx         # Bill item component
│   │
│   └── utils/
│       ├── pitchDetection.js    # Web Audio API pitch detection
│       └── generateDailyCode.js # Daily code generation
│
├── public/                       # Static assets
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # TailwindCSS configuration
└── postcss.config.js           # PostCSS configuration
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS 3.4
- **Routing**: React Router DOM 6.28
- **HTTP Client**: Axios 1.7
- **UI Icons**: Lucide React 0.460
- **UI Components**: Headless UI 2.2
- **Language**: JavaScript (ES6+)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Setup Steps

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Output will be in the `dist/` directory.

## 🔑 Key Components

### AuthContext
Manages global authentication state including:
- Shop ID and Shop Name
- Shopkeeper Name and Role
- Authentication token
- Login/Logout functionality

### API Client
Axios instance configured with:
- Base URL: `http://localhost:5000/api`
- Authorization header injection
- Request/response interceptors

### Pitch Detection
Web Audio API implementation for:
- Real-time pitch frequency extraction
- Magnitude detection
- Frequency range validation

### Daily Code Generator
- Generates unique 6-digit codes based on current date
- Updates every 24 hours
- Used for additional security layer

## 🎨 Styling

The application uses TailwindCSS with a custom color theme:
- **Primary Color**: Indigo (#667eea)
- **Secondary Color**: Purple (#764ba2)
- **Background**: Gradient from Indigo to Purple

All components are fully responsive and work across all device sizes.

## 🔒 Security Features

1. **Protected Routes**: Unauthenticated users redirected to login
2. **Token-Based Auth**: JWT tokens stored in localStorage
3. **Voice Verification**: Pitch-based voice authentication
4. **PIN Protection**: 4-digit PIN for shopkeeper access
5. **Role-Based Access**: Different permissions for Main/Alternative roles

## 📝 API Integration

The frontend communicates with the backend API at `http://localhost:5000/api` with the following endpoints:

### Shops
- `POST /shops/register` - Register new shop
- `GET /shops/:id` - Get shop details

### Shopkeepers
- `POST /shopkeepers/register` - Register shopkeeper
- `POST /shopkeepers/get-by-shop` - Get shopkeeper by shop
- `POST /shopkeepers/verify-pin` - Verify PIN

### Products
- `GET /products` - Get all products
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Bills
- `GET /bills` - Get all bills
- `POST /bills` - Create bill
- `GET /bills/:id` - Get bill details

## 🎯 Workflow

### Shop Registration
1. User registers shop with name, shopkeeper name, and location
2. System generates unique shop ID
3. User is redirected to shopkeeper registration

### Shopkeeper Login/Registration
1. Register as main or alternative shopkeeper
2. Set 4-digit PIN for security
3. Login with shop ID, role, and PIN

### Billing Process
1. View available products
2. Add items to bill
3. Verify with voice authentication (pitch detection)
4. Submit bill

### Product Management (Main Shopkeeper Only)
1. View all products
2. Add new products with voice input option
3. Edit existing products
4. Delete products

## 🐛 Troubleshooting

### Build Errors
- Clear `node_modules` and `dist` folders
- Run `npm install` again
- Check Node.js version (should be v16+)

### Microphone Permission
- Ensure browser has microphone permission
- For development, use `http://localhost` (HTTPS required for production)

### API Connection Issues
- Verify backend is running on `http://localhost:5000`
- Check CORS configuration on backend
- Verify API routes match backend implementation

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Hosting
The `dist/` folder contains the production build. Deploy to:
- Vercel
- Netlify
- AWS S3
- GitHub Pages
- Any static hosting service

## 📄 License

This project is part of the Smart Billing System.

## 🤝 Contributing

For feature requests or bug reports, please contact the development team.

---

**Note**: This frontend requires the Smart Billing Backend to be running for full functionality.
