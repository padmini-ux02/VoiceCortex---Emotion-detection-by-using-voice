# 🎤 VoiceCortex — Speech Emotion Recognition Platform

> A production-grade AI platform that detects human emotions from voice recordings in real time using Deep Learning and advanced Speech Signal Processing.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688?style=flat-square&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0-EE4C2C?style=flat-square&logo=pytorch)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## 🧠 AI Architecture

The emotion recognition pipeline uses a **hybrid deep learning architecture**:

```
Audio Input
    │
    ▼
┌──────────────────────────────────────┐
│   Librosa Feature Extraction         │
│  ├── MFCCs (40 coefficients)         │
│  ├── Chroma STFT (pitch/harmony)     │
│  ├── Mel Spectrogram (energy map)    │
│  ├── Spectral Contrast (texture)     │
│  └── Zero Crossing Rate (rhythm)     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│   CNN Feature Encoder                │
│  3× Conv2D → BN → ReLU → MaxPool    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│   BiLSTM Temporal Processor          │
│   2-Layer Bidirectional LSTM         │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│   Self-Attention Mechanism           │
│   Weighted temporal aggregation      │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│   Heuristic Acoustic Calibration     │
│   Energy + Pitch + ZCR biasing       │
└──────────────────┬───────────────────┘
                   │
                   ▼
        8-Class Emotion Output
  (Neutral, Calm, Happy, Sad, Angry,
       Fear, Disgust, Surprise)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- (Optional) PostgreSQL — falls back to SQLite automatically

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
# Edit .env if you want PostgreSQL; leave DATABASE_URL empty for SQLite

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs will be available at: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend: **http://localhost:3000**

---

## 🐳 Docker Deployment (Full Stack)

```bash
# From the project root
docker-compose up --build

# Services:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

---

## ☁️ Cloud Deployment

### Backend → Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Set the **Root Directory** to `backend`
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable `DATABASE_URL` (from Render PostgreSQL addon)
6. Add `SECRET_KEY` (a random 32+ char string)

### Frontend → Vercel
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1`
4. Deploy!

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | ❌ | Register a new user |
| POST | `/api/v1/auth/login` | ❌ | Login and get JWT token |
| GET  | `/api/v1/auth/me` | ✅ | Get current user profile |
| POST | `/api/v1/audio/predict` | Optional | Upload audio + run emotion AI |
| POST | `/api/v1/audio/trim` | Optional | Trim audio and re-analyze |
| GET  | `/api/v1/audio/history` | ✅ | Get prediction history |
| GET  | `/api/v1/audio/prediction/{id}` | Optional | Get prediction by ID |
| DELETE | `/api/v1/audio/prediction/{id}` | ✅ | Delete a prediction |
| GET  | `/api/v1/reports/pdf/{id}` | ✅ | Download PDF report |
| GET  | `/api/v1/reports/excel` | ✅ | Download Excel history |
| GET  | `/api/v1/reports/csv` | ✅ | Download CSV history |
| POST | `/api/v1/assistant/chat` | Optional | Query AI wellness advisor |

---

## 🗃️ Database Schema

```sql
-- Users table
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name     VARCHAR,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
    audio_filename    VARCHAR NOT NULL,
    detected_emotion  VARCHAR NOT NULL,
    confidence_scores JSONB NOT NULL,
    timeline_analysis JSONB,
    attention_weights JSONB,
    feature_importance JSONB,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    report_type   VARCHAR NOT NULL,  -- 'pdf', 'excel', 'csv'
    file_path     VARCHAR NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest
pytest tests/ -v
```

---

## 🎭 Emotion Classes

| Emotion | Emoji | Acoustic Signature |
|---------|-------|-------------------|
| Happy | 😊 | High pitch variance, moderate energy |
| Sad | 😢 | Low energy, flat pitch, slow ZCR |
| Angry | 😡 | High energy, high ZCR, rapid changes |
| Neutral | 😐 | Balanced across all features |
| Fear | 😨 | Unstable pitch, high spectral contrast |
| Surprise | 😲 | Sudden pitch spike, high energy burst |
| Disgust | 🤢 | Slow rate, pitch drops, harsh texture |
| Calm | 😌 | Low energy, smooth transitions, low ZCR |

---

## 📁 Project Structure

```
Emotion Recognition from Speech/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, Database, Security
│   │   ├── ml/           # Feature extraction, Model, XAI
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # AI Assistant, Report generators
│   ├── tests/            # pytest test suite
│   ├── main.py           # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # UI components
│   │   ├── context/      # Auth & Theme contexts
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # API client, helpers
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📄 License

MIT License — Built with ❤️ by VoiceCortex Team
