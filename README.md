# Nexus AI

Nexus AI is a production-ready MERN productivity platform with a cyberpunk UI, JWT auth, task/note management, analytics, and Gemini-powered AI assistance.

## Live Deployments

- Frontend (Vercel): https://nexus-ai-mu-one.vercel.app/
- Backend (Render): https://nexus-ai-backend-fcdy.onrender.com/
- Backend health: https://nexus-ai-backend-fcdy.onrender.com/api/health

## Tech Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Auth: JWT (Bearer token)
- AI: Gemini API with local fallback mode

## Project Structure

```text
.
├── src/                    # Frontend app
│   ├── api/                # API client + service modules
│   ├── context/            # Auth, theme, notifications, toasts
│   ├── pages/              # UI screens (dashboard, auth, analytics, etc.)
│   ├── components/         # Reusable UI components
│   └── ai/                 # Local AI intelligence/fallback modules
├── backend/                # Express API
│   ├── controllers/        # Route controllers
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route modules
│   └── config/             # DB connection
└── Screenshots/            # UI screenshots used in this README
```

## Environment Variables

### Frontend (`.env`)

```env
VITE_API_URL=https://nexus-ai-backend-fcdy.onrender.com
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=YOUR_MONGODB_ATLAS_URI
JWT_SECRET=YOUR_STRONG_JWT_SECRET
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
ALLOWED_ORIGINS=https://nexus-ai-mu-one.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
```

Reference templates:

- `.env.example`
- `backend/.env.example`

## Local Development

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Install backend dependencies:
   ```bash
   cd backend && npm install
   ```
3. Run backend:
   ```bash
   cd backend && npm run dev
   ```
4. Run frontend:
   ```bash
   npm run dev
   ```

## API Overview

Base URL:

```text
https://nexus-ai-backend-fcdy.onrender.com
```

Core routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `POST /api/auth/logout-all`
- `GET|POST|PUT|DELETE /api/tasks`
- `GET|POST|PUT|DELETE /api/notes`
- `GET /api/analytics`
- `GET /api/analytics/dashboard-stats`
- `GET /api/health`

## Deployment Notes

### Vercel (Frontend)

- Build command: `npm run build`
- Output directory: `dist`
- Required env:
  - `VITE_API_URL=https://nexus-ai-backend-fcdy.onrender.com`
  - `VITE_GEMINI_API_KEY=...`

### Render (Backend)

- Start command: `npm start` (inside `backend`)
- Node environment must include:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `ALLOWED_ORIGINS` (include Vercel domain)

## Screenshots

### Intro Page

![Intro Page](Screenshots/Intro%20Page.png)

### Dashboard

![Dashboard](Screenshots/Dashboard_NexusAI.png)

### AI Assistant

![AI Assistant](Screenshots/AI%20Assistant.png)

### Tasks

![Tasks](Screenshots/Tasks%20Nexus.png)

### Notes

![Notes](Screenshots/Notes%20Nexus.png)

### Analytics

![Analytics](Screenshots/Analytics%20Nexus.png)

### Features

![Features](Screenshots/Features.png)

## Production Checklist

- Frontend API calls use deployed backend URL
- CORS supports production Vercel domain + preview domains
- JWT auth flow validates on app load (`/api/auth/me`)
- Gemini API fallback behavior is preserved
- Health endpoint available for uptime checks
- Vite production build succeeds

## License

ISC
