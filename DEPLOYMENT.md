# WHAT IF — The Alternate Movie Universe
## Production Deployment Guide

This guide provides step-by-step instructions for deploying **WHAT IF — The Alternate Movie Universe** to production using **GitHub**, **Vercel** (for the React frontend), **Render / Railway** (for the persistent Node.js + Socket.IO backend), and **MongoDB Atlas** (for database storage).

---

## 1. System Architecture Overview

```
[ User Browser ]
       │
       ├─── HTTPS / Static Assets ────────► [ Vercel Edge CDN ]
       │                                     └── React 18 + Vite SPA (client/)
       │
       ├─── REST API Requests ────────────► [ Render / Persistent Backend ]
       │    (/api/movies, /api/rag, etc.)    └── Node.js + Express (server/)
       │                                            │
       └─── WebSockets (Socket.IO) ────────►        ├──► [ MongoDB Atlas Cluster ]
            (Real-time Multiplayer)                 │    (Canon lore, chunks, timelines)
                                                    │
                                                    └──► [ Groq Cloud API ]
                                                         (llama-3.3-70b-versatile)
```

> [!IMPORTANT]
> **Why Render / Railway for Backend?**
> The application features real-time 2-player multiplayer games (Movie Guess, Co-Op Story, Story Battle) that rely on **Socket.IO persistent WebSockets** and in-memory room synchronization. Serverless platforms like Vercel Serverless do not support persistent WebSockets. Deploying the backend to a persistent Node host (Render or Railway) allows both REST endpoints and real-time multiplayer to work 100%.

---

## 2. Step 1: MongoDB Atlas Setup

1. **Create an Atlas Cluster**:
   - Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free **M0 Sandbox** or higher cluster.
2. **Configure Database User**:
   - Go to **Database Access** under Security.
   - Create a database user with username and password (e.g. `whatif_admin`).
   - Grant `Read and write to any database` privileges.
3. **Configure IP Whitelist**:
   - Go to **Network Access** under Security.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Note: Cloud hosting platforms use dynamic IP pools. Restricting to a single IP will cause database connection timeouts.*
4. **Copy Connection String**:
   - Click **Connect** on your cluster -> **Drivers** (Node.js).
   - Copy the SRV URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/whatif_movies?retryWrites=true&w=majority
     ```

---

## 3. Step 2: Seed Canon Movie Lore into MongoDB Atlas

Before players can explore universes or generate alternate timelines, the 12 curated movie universes and vector embeddings must be seeded:

### Option A: From Local Terminal (Recommended)
```bash
cd server
$env:MONGODB_URI="your_mongodb_atlas_connection_string"
npm run seed
```
*(On macOS/Linux use `MONGODB_URI="your_uri" npm run seed`)*

### Option B: From the Web Admin Console (Post-Deployment)
1. Deploy the application.
2. Visit `https://<your-frontend>.vercel.app/admin`.
3. Enter your configured `ADMIN_SECRET_KEY`.
4. Click **Reseed Knowledge Base**.

---

## 4. Step 3: Backend Deployment (Render or Railway)

### Deploying on Render (Recommended for Multiplayer)
1. Log in to [Render.com](https://render.com) and click **New + -> Web Service**.
2. Connect your GitHub repository: `https://github.com/kit2824bad161/what-if-game`.
3. Configure settings:
   - **Name**: `what-if-movie-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Port assigned by Render |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `GROQ_API_KEY` | `gsk_...` | Your Groq Cloud API key |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` | Recommended Groq LLM |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | Your Vercel frontend URL (for CORS) |
   | `ADMIN_SECRET_KEY`| `whatif_production_secret_2026` | Secret token for dev/admin console |
   | `EMBEDDING_PROVIDER` | `local` | Built-in semantic vectorizer |
5. Click **Create Web Service**. Note your backend URL (e.g., `https://what-if-movie-backend.onrender.com`).

---

## 5. Step 4: Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com) and click **Add New... -> Project**.
2. Select your repository: `what-if-game`.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://what-if-movie-backend.onrender.com/api` | Full URL to backend REST API |
   | `VITE_SOCKET_URL` | `https://what-if-movie-backend.onrender.com` | Base URL for Socket.IO multiplayer |
5. Click **Deploy**. Vercel will build and assign your production domain.
6. Once deployed, update the `CLIENT_URL` variable in your Render backend settings to match your exact Vercel URL.

---

## 6. Alternative: Deploying Backend on Vercel Serverless

If you prefer deploying the backend on Vercel alongside the frontend:
1. In Vercel, create a second project from the same repository.
2. Set **Root Directory** to `server`.
3. Add backend environment variables (`MONGODB_URI`, `GROQ_API_KEY`, `CLIENT_URL`, etc.).
4. The backend includes [`server/vercel.json`](file:///c:/Users/vinus/what-if%20game/server/vercel.json) and [`server/api/index.js`](file:///c:/Users/vinus/what-if%20game/server/api/index.js) for serverless execution.
5. **Limitation**: All REST API routes (`/api/movies`, `/api/health`, `/api/rag`, `/api/timelines`) will work, but **Socket.IO multiplayer requires a persistent server** and will not establish WebSocket connections on Vercel Serverless.

---

## 7. Post-Deployment Verification Checklist

1. **Health Probe**:
   Visit `https://<your-backend-domain>/api/health`.
   Verify JSON response:
   ```json
   {
     "status": "healthy",
     "environment": "production",
     "database": {
       "status": "connected",
       "isConnected": true,
       "name": "whatif_movies"
     }
   }
   ```
2. **Movie Library**:
   Visit `https://<your-frontend-domain>/movies`.
   Verify all 12 movie cards display with images and canon tags.
3. **AI Timeline Generation**:
   Visit `https://<your-frontend-domain>/creator`.
   Select a movie, submit a What-If question (e.g. *"What if Amar arrested Vikram at the clinic?"*), and verify that Groq generates alternate narrative branches with reality checks.
4. **Multiplayer Arena**:
   Visit `https://<your-frontend-domain>/lobby`.
   Click **Create Room**, verify a 6-character room code is generated, and confirm Player 2 can join from another tab or device.

