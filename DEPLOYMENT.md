# Smart Billing System - Production Deployment Guide

## Overview
This guide covers deploying the Smart Billing System to:
- **Database:** Supabase (PostgreSQL)
- **Backend:** Zoho Catalyst AppSail
- **Frontend:** Firebase Hosting

---

## Step 1: Setup Supabase Database

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com) and sign up (FREE tier available)
2. Click "New Project"
3. Enter project name: `smart-billing`
4. Choose a database password (save it securely)
5. Select a region close to your users
6. Click "Create new project"

### 1.2 Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `backend/supabase-schema.sql`
4. Click "Run" to create all tables

### 1.3 Get Supabase Credentials
1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (secret - for backend only)

---

## Step 2: Deploy Backend to Catalyst AppSail

### 2.1 Create Zoho Catalyst Account
1. Go to [catalyst.zoho.com](https://catalyst.zoho.com)
2. Sign up or login with Zoho account
3. Create a new project: `SmartBilling`

### 2.2 Install Catalyst CLI
```powershell
npm install -g zcatalyst-cli
```

### 2.3 Login to Catalyst
```powershell
catalyst login
```

### 2.4 Initialize AppSail
Navigate to backend folder:
```powershell
cd backend
catalyst init
```
Select your project when prompted.

### 2.5 Create AppSail Stack
```powershell
catalyst appsail:create
```
Choose:
- Stack: Node.js
- Version: 18
- Name: smart-billing-api

### 2.6 Set Environment Variables
In Catalyst Console:
1. Go to **AppSail** > Your Stack > **Environment Variables**
2. Add these variables:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-app.web.app
   NODE_ENV=production
   PORT=8080
   ```

### 2.7 Deploy Backend
```powershell
catalyst deploy
```

### 2.8 Get Backend URL
After deployment, note your AppSail URL:
`https://smart-billing-api-xxxxx.appsail-apps.com`

---

## Step 3: Deploy Frontend to Firebase

### 3.1 Create Firebase Account
1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Go to Console"
3. Create a new project: `smart-billing`

### 3.2 Install Firebase CLI
```powershell
npm install -g firebase-tools
```

### 3.3 Login to Firebase
```powershell
firebase login
```

### 3.4 Initialize Firebase in Frontend
```powershell
cd frontend
firebase init hosting
```
When prompted:
- Select your Firebase project
- Public directory: `dist`
- Configure as SPA: `Yes`
- Don't overwrite index.html

### 3.5 Update API URL
Edit `frontend/.env.production`:
```
VITE_API_URL=https://smart-billing-api-xxxxx.appsail-apps.com/api
```

### 3.6 Build Frontend
```powershell
npm run build
```

### 3.7 Deploy to Firebase
```powershell
firebase deploy --only hosting
```

### 3.8 Get Frontend URL
After deployment, your app will be at:
`https://your-project.web.app`

---

## Step 4: Update CORS Settings

Go back to Catalyst and update `FRONTEND_URL` environment variable:
```
FRONTEND_URL=https://your-project.web.app
```

Redeploy backend:
```powershell
cd backend
catalyst deploy
```

---

## Step 5: Test Your Deployment

1. Visit your Firebase URL
2. Register a new shop
3. Login with your PIN
4. Add some products
5. Create a bill using voice

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in Catalyst matches your Firebase URL exactly
- Check browser console for specific CORS error messages

### Database Connection Failed
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Ensure you're using the `service_role` key, not the `anon` key

### API Not Responding
- Check Catalyst logs: `catalyst logs`
- Verify all environment variables are set

### Voice Recognition Not Working
- Ensure site is served over HTTPS (Firebase provides this)
- Chrome/Edge browsers work best for Web Speech API

---

## Environment Variables Summary

### Backend (Catalyst AppSail)
| Variable | Description | Example |
|----------|-------------|---------|
| SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| SUPABASE_SERVICE_KEY | Supabase service role key | eyJhbGciOiJIUzI1... |
| JWT_SECRET | Secret for JWT tokens | my-super-secret-key |
| FRONTEND_URL | Firebase hosting URL | https://app.web.app |
| PORT | Server port | 8080 |
| NODE_ENV | Environment | production |

### Frontend (Firebase)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://xxx.appsail-apps.com/api |

---

## Cost Estimates

### Supabase (Free Tier)
- 500MB database storage
- 2GB bandwidth
- Unlimited API requests

### Catalyst AppSail (Free Tier)
- 1 AppSail stack
- Limited compute hours

### Firebase Hosting (Spark Plan - Free)
- 10GB storage
- 360MB/day bandwidth
- Custom domain support

**Total estimated cost: $0/month** (within free tier limits)

---

## Security Checklist

- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Never expose SUPABASE_SERVICE_KEY in frontend
- [ ] Enable Row Level Security in Supabase (optional)
- [ ] Use HTTPS only (Firebase provides this)
- [ ] Rotate daily codes properly
