# WHAT IF — The Alternate Movie Universe
### Full-Stack AI + RAG + Real-Time Multiplayer Web Application

> **Rewrite the story. Explore another universe.**

**WHAT IF** is an interactive cinematic web application where players explore alternate timelines of iconic films, change critical canon events, generate divergent story branches with verified screenplay facts, guess mystery movies without leaked titles, collaborate on timelines in real-time, and compete in AI-judged story battles.

---

## 🌟 Key Features

1. **Ground-Truth Movie RAG 2.0**:
   - Curated canon screenplay knowledge base across **Tamil cinema masterpieces** (*Vikram*, *Baahubali*, *Nayakan*, *Kaithi*, *Super Deluxe*, *Anbe Sivam*, *Thalapathi*, *Vikram Vedha*) and **global cinema giants** (*The Dark Knight*, *The Matrix*, *Interstellar*, *Spider-Man: Into the Spider-Verse*, *Inception*, *Parasite*).
   - Decomposes films into semantic chunks: plot acts, character motivations, turning points, and universe rules.
   - Built-in pluggable 128-dimensional normalized vector cosine similarity search with lexical hybrid ranking.
2. **Signature What-If Timeline Creator**:
   - Poses hypothetical divergences ("What if the hero discovered the truth earlier?").
   - Dual-branch generation: **Branch Alpha** (tactical realignment) vs. **Branch Beta** (ideological reversal).
   - Visual comparison: Immediate consequences, character fate shifts, plot fallout, verified canon anchors, and continuity warnings.
3. **Multi-Turn Persistent Multiverse**:
   - Continue any chosen branch chapter by chapter.
   - Tracks character status, deceased states, and universe world rules.
   - Persists durable alternate universes in MongoDB.
4. **Three Real-Time Multiplayer Game Modes (Socket.IO)**:
   - **Mode A: Movie Guess**: Player 1 creates a secret movie puzzle; Player 2 reads a spoiler-sanitized mystery story and unlocks progressive clues. Server-side leak detection prevents name spoiling; scoring with fuzzy title matching (Fuse.js).
   - **Mode B: Co-op Story Room**: Two storytellers take turns building an alternate timeline live over WebSockets.
   - **Mode C: Story Battle**: Both players get the same dilemma, race against a 90-second countdown timer in private editors, reveal simultaneously, and are evaluated with 1–10 scores by the Groq AI Grand Judge.
5. **Developer & Admin Diagnostics Console**:
   - Live vector retrieval benchmark tester with cosine similarity scores.
   - Ingestion job audits and vector chunk inspector.
   - One-click re-indexing and database re-seeding.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6 (14 functional screens)
- **Styling**: Tailwind CSS + Custom Dark Cinematic Theme (Outfit & Plus Jakarta Sans typography)
- **Networking**: Centralized API Client + Socket.IO Client
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js v24 (ES Modules)
- **Server**: Express + Socket.IO Server
- **Database**: MongoDB (Local or MongoDB Atlas) + Mongoose
- **AI / LLM**: Groq SDK (`llama-3.3-70b-versatile`) with structured JSON schema + Context-Aware Fallback Engine
- **Embeddings**: Pluggable adapter (128-dim normalized cosine vectorizer + external embedding provider interface)
- **Utilities**: Fuse.js (Fuzzy movie matching), UUID, Zod

```
┌─────────────────────────────────────────────────────────────────┐
│                          WHAT IF UI                             │
│       React 18 • Vite • Tailwind • Outfit Typography            │
└──────────────┬──────────────────────────────────▲───────────────┘
               │ HTTP REST                        │ WebSockets
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS BACKEND                           │
│             Node.js • Socket.IO • Error Boundary                │
├─────────────────┬───────────────────────┬───────────────────────┤
│   RAG ENGINE    │     GROQ SERVICE      │  MULTIPLAYER ENGINE   │
│  Vector Search  │  Llama-3.3-70b Schema │  Movie Guess / Battle │
│  Hybrid Lexical │  Simulated Fallback   │  Leak Detector Guard  │
└────────┬────────┴───────────┬───────────┴───────────┬───────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐     ┌─────────────────┐
│  MongoDB Atlas  │  │    Groq API     │     │ Socket.IO Rooms │
│ Movies & Chunks │  │   Cloud LLM     │     │ Presence & Turns│
└─────────────────┘  └─────────────────┘     └─────────────────┘
```

---

## 🚀 Quickstart & Setup Commands

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** running locally on port 27017 or a MongoDB Atlas connection string.

### 2. Environment Setup
The project comes pre-configured with a working `.env` in `server/`:
```bash
# server/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/whatif_movies
GROQ_API_KEY=  # Optional: Add your Groq API key for live Llama 3.3 70B
GROQ_MODEL=llama-3.3-70b-versatile
ADMIN_SECRET_KEY=whatif_dev_admin_secret_2026
CLIENT_URL=http://localhost:5173
```

### 3. Installation & Seeding
From the root directory:
```bash
# 1. Install root, backend, and frontend dependencies
npm install --prefix server
npm install --prefix client

# 2. Seed 12 curated Tamil & global movie universes into MongoDB
npm run seed
```

### 4. Running the Development Servers
In two separate terminals:
```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing
Run the backend test suite:
```bash
npm test
```
**Test Coverage**:
- Vector Embedding generation & cosine similarity calculations
- Movie Guess server-side leak detection & redaction
- Fuse.js fuzzy title matching & typo tolerance
- Continuity checker deceased character detection
- Multiplayer Room Manager capacity & join validation

---

## 📡 API Catalog

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, MongoDB status, integrations check |
| `GET` | `/api/movies` | Filterable movie library (language, genre, search) |
| `GET` | `/api/movies/:movieId` | Deep movie record with characters and canon events |
| `GET` | `/api/movies/:movieId/canon` | Isolated canon timeline with What-If triggers |
| `POST` | `/api/rag/retrieve` | Semantic vector search diagnostics |
| `POST` | `/api/rag/generate-branches` | Forges Branch Alpha & Branch Beta from prompt |
| `POST` | `/api/rag/continue-timeline` | Continues timeline for next chapter |
| `GET` | `/api/timelines?guestId=...` | Lists saved universes in MongoDB |
| `POST` | `/api/timelines` | Persists timeline to MongoDB |
| `POST` | `/api/timelines/:id/turn` | Appends chapter turn to timeline |
| `DELETE` | `/api/timelines/:id` | Deletes timeline |
| `GET` | `/api/admin/status` | Ingestion metrics & system diagnostics |
| `POST` | `/api/admin/test-retrieval` | Benchmark vector retrieval tool |
| `POST` | `/api/admin/reseed` | Re-indexes all movie universes |

---

## 🎮 Multiplayer Socket.IO Contract

- `room:create` / `room:join` / `room:toggle_ready` / `room:set_mode`
- **Movie Guess**: `movie_guess:setup_round`, `movie_guess:story_ready`, `movie_guess:unlock_hint`, `movie_guess:submit_guess`, `movie_guess:round_resolved`
- **Co-op Story**: `coop:init_story`, `coop:submit_turn`, `coop:story_updated`
- **Story Battle**: `battle:start`, `battle:submit_entry`, `battle:submissions_revealed`, `battle:judging_complete`

---

## 🚢 Deployment Guide

- **Frontend (Vercel)**:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Set `VITE_API_URL` and `VITE_SOCKET_URL` to your production backend URL.
- **Backend (Render / Railway / Fly.io)**:
  - Build Command: `npm install`
  - Start Command: `node src/server.js`
  - Set `MONGODB_URI` to your MongoDB Atlas connection string.
