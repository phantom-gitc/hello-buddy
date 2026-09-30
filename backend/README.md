# HelloBuddy AI Career Preparation Platform — Backend

A production-grade, secure, modular monolith backend built in JavaScript (Node.js/Express) powering an AI Career Preparation Platform. The platform provides interactive AI teaching, mock interview simulations with structured evaluations and state machines, resume intelligence with RAG, vector semantic retrieval, and real-time streaming over Socket.IO.

---

## 1. Project Overview & Features

* **AI Interactive Learning**: Domain and role-based pedagogical sessions where an AI teacher explains concepts, poses check-for-understanding questions, evaluates student comprehension, and tracks weak areas.
* **AI Mock Interviews**: End-to-end interview simulations (HR, Technical, Behavioral, Coding, Full) backed by an explicit state machine, dynamic turn progression, contextual follow-ups, answer scoring, and comprehensive hiring committee reports.
* **Resume Intelligence & RAG**: Cloudinary upload pipeline, automated PDF text extraction, structured JSON parsing, chunking with token overlap, vector embeddings, and tenant-isolated Qdrant indexing.
* **ChatGPT-Style AI Chat**: Multi-turn conversational interface supporting text, uploaded attachments (images, PDFs), resume context injection, and streaming.
* **Robust Authentication & OTP**: Register, email OTP verification, password reset, login, and token revocation logout. Secure HTTP-only cookies, JWT access/refresh token rotation, constant-time hash comparison, and brute-force protection in Redis.
* **Real-Time WebSockets**: Full Socket.IO integration for live interview question/answer exchanges, chat streaming, and interactive learning.

---

## 2. Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js (v18+)** | Runtime environment (JavaScript only, no TypeScript) |
| **Express.js (v5)** | REST API framework & routing |
| **MongoDB & Mongoose** | Primary database for application state, users, resumes, chats, sessions |
| **Redis (ioredis)** | OTP storage with TTL, token blacklist on logout, rate limiting, and session caching |
| **Socket.IO** | Bi-directional real-time events for interviews, learning, and chat streaming |
| **Qdrant** | Vector database for document & resume semantic chunk search |
| **Cloudinary** | Secure media and PDF document storage |
| **Brevo (Sendinblue)** | Transactional email delivery for OTP verification, password reset, and alerts |
| **Groq / OpenAI / xAI** | LLM providers with automatic fallback, streaming, and structured JSON output |
| **Zod** | Declarative runtime request & payload validation |
| **Helmet & CORS** | Security headers and cross-origin controls |
| **Jest & Supertest** | Automated unit and integration testing suite |

---

## 3. Project Architecture

The backend follows a **Modular Monolith Architecture** organized by business domains so heavy subsystems can later be extracted into microservices:

```text
backend/
├── src/
│   ├── app.js                          # Express app configuration & middleware pipeline
│   ├── server.js                       # Server entry point, DB connection, Socket.IO
│   ├── config/                         # Centralized configuration (env, db, redis, cloudinary, qdrant, brevo)
│   ├── constants/                      # Roles, interview types, difficulty levels
│   ├── middleware/                     # Auth, error, rate-limit, upload, and Zod validation
│   ├── modules/                        # Domain modules (Controller -> Service -> Model)
│   │   ├── auth/                       # Register, verify email, login, logout, refresh, reset password
│   │   ├── users/                      # User profile, career goals, target package, preferences
│   │   ├── resume/                     # PDF extraction, AI analysis, RAG ingestion
│   │   ├── chat/                       # ChatGPT-style conversation and attachments
│   │   ├── learning/                   # Interactive teacher, questions, evaluation, mastery
│   │   ├── interview/                  # State machine, turns, follow-ups, final assessment reports
│   │   ├── evaluation/                 # Metrics processing, score clamping, session aggregation
│   │   ├── progress/                   # User readiness score, weakness aggregation
│   │   └── uploads/                    # Media upload and Cloudinary synchronization
│   ├── routes/                         # Central route aggregator mounted at /api/v1
│   ├── services/                       # Vendor-isolated domain services
│   │   ├── ai/                         # Multi-provider LLM abstraction, prompt engineering, context builder
│   │   ├── rag/                        # Chunking, embeddings, Qdrant vectors, retrieval
│   │   ├── email/                      # Brevo email service with responsive HTML templates
│   │   ├── storage/                    # Cloudinary upload and deletion service
│   │   └── voice/                      # Whisper STT & Kokoro/OpenAI TTS abstractions
│   ├── sockets/                        # Socket.IO authenticated event handlers
│   └── utils/                          # ApiError, ApiResponse, asyncHandler, jwt, crypto, logger
├── tests/                              # Automated Jest test suites
├── docs/                               # In-depth architectural & API specifications
├── .env.example                        # Environment variable template
├── package.json
└── README.md
```

---

## 4. Environment Setup

Create `.env` inside `backend/` copied from `.env.example`:

```bash
cp .env.example .env
```

Key environment parameters:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/hello-buddy
REDIS_URL=redis://127.0.0.1:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_super_secure_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_super_secure_key
JWT_REFRESH_EXPIRY=7d
COOKIE_SECRET=your_cookie_signing_secret_key

BREVO_API_KEY=xkeysib-your-key
BREVO_SENDER_EMAIL=no-reply@hellobuddy.ai
BREVO_SENDER_NAME=HelloBuddy AI Career Prep

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

QDRANT_URL=http://127.0.0.1:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=career_prep_vectors

DEFAULT_AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key
GROQ_MODEL=qwen-2.5-32b
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

*Note: For local development without external credentials, the application includes automatic in-memory fallbacks for Redis, Qdrant, Cloudinary, and Brevo.*

---

## 5. Running Locally

```bash
# Install dependencies
npm install

# Start in development mode with nodemon
npm run dev

# Start in production mode
npm start

# Run automated tests
npm test
```

---

## 6. API Route Summary

All REST endpoints are versioned under `/api/v1`:

### Authentication & Sessions
* `POST /api/v1/auth/register` — Creates user account & sends OTP verification email
* `POST /api/v1/auth/verify-email` — Confirms email via 6-digit OTP, sets HTTP-only cookies
* `POST /api/v1/auth/resend-otp` — Resends verification or reset code with rate limiting cooldown
* `POST /api/v1/auth/login` — Authenticates credentials, issues JWT access & refresh tokens
* `POST /api/v1/auth/logout` — Revokes tokens in Redis and clears cookies
* `POST /api/v1/auth/refresh` — Rotates access & refresh tokens
* `POST /api/v1/auth/forgot-password` — Sends password reset OTP
* `POST /api/v1/auth/reset-password` — Validates OTP and updates password
* `POST /api/v1/auth/change-password` — Updates password for authenticated user
* `GET  /api/v1/auth/me` — Returns current authenticated user profile

### User Profile
* `GET    /api/v1/users/me` — Retrieves authenticated user profile
* `PATCH  /api/v1/users/me` — Updates career role, target salary, experience, and skills
* `PATCH  /api/v1/users/me/preferences` — Updates difficulty and topic preferences
* `DELETE /api/v1/users/me` — Deactivates account

### Resume Intelligence
* `POST   /api/v1/resumes` — Uploads PDF resume (Cloudinary + PDF parsing + AI analysis + Qdrant RAG)
* `GET    /api/v1/resumes` — Lists candidate resumes
* `GET    /api/v1/resumes/:id` — Retrieves single resume
* `GET    /api/v1/resumes/:id/analysis` — Returns AI scoring, skills, projects, and actionable tips
* `POST   /api/v1/resumes/:id/analyze` — Re-triggers background AI analysis
* `DELETE /api/v1/resumes/:id` — Removes resume from MongoDB, Cloudinary, and Qdrant

### AI Interview Simulation
* `POST /api/v1/interviews` — Generates custom interview plan based on role, type, and resume context
* `GET  /api/v1/interviews` — Lists past interviews
* `GET  /api/v1/interviews/:id` — Retrieves interview session details
* `POST /api/v1/interviews/:id/start` — Transitions state to IN_PROGRESS, asks first question
* `POST /api/v1/interviews/:id/answer` — Evaluates candidate answer, asks follow-up or next question
* `POST /api/v1/interviews/:id/complete` — Concludes interview and generates final hiring report
* `GET  /api/v1/interviews/:id/report` — Returns hiring recommendation and preparation roadmap

### Interactive AI Learning
* `GET  /api/v1/learning/domains` — Curated software engineering domains
* `GET  /api/v1/learning/topics` — Topics for selected domain
* `POST /api/v1/learning/sessions` — Launches interactive session with concept explanation & check question
* `GET  /api/v1/learning/sessions` — Lists user learning sessions
* `GET  /api/v1/learning/sessions/:id` — Retrieves session interaction history
* `POST /api/v1/learning/sessions/:id/message` — Asks AI teacher a clarifying question
* `POST /api/v1/learning/sessions/:id/answer` — Submits answer to check question, receives score & feedback
* `GET  /api/v1/learning/progress` — Retrieves learner progress, mastery score, and identified weak areas

### AI Chat
* `POST   /api/v1/chats` — Creates new chat conversation
* `GET    /api/v1/chats` — Lists user chat sessions
* `GET    /api/v1/chats/:id` — Retrieves conversation messages
* `DELETE /api/v1/chats/:id` — Deletes conversation
* `POST   /api/v1/chats/:id/messages` — Sends message with RAG context injection
* `POST   /api/v1/chats/:id/attachments` — Uploads PDF or image attachment

---

## 7. Socket.IO Real-Time Events

Connections require valid JWT credentials sent via `auth: { token }` or cookies.

* **Interview Events**: `interview:join`, `interview:start`, `interview:question`, `interview:answer`, `interview:evaluating`, `interview:feedback`, `interview:followup`, `interview:complete`.
* **Chat Events**: `chat:join`, `chat:typing`, `chat:message`, `chat:response:start`, `chat:response:chunk`, `chat:response:end`.
* **Learning Events**: `learning:join`, `learning:message`, `learning:teacher:reply`, `learning:answer`, `learning:feedback`, `learning:question`.

---

## 8. Security Highlights

* **Tenant Isolation**: Every database query, vector search, and file manipulation enforces `userId: req.user._id`.
* **HTTP-Only Cookies**: Prevents XSS token exfiltration; tokens are never accessible via client-side JavaScript.
* **Token Blacklisting**: Logout immediately blacklists access tokens in Redis and deletes stored refresh tokens.
* **Brute-Force Protection**: Rate limiters applied on auth, OTP requests, and costly AI generation endpoints.
* **Cryptographic OTP**: Uses `crypto.randomBytes` instead of pseudo-random generators, with SHA-256 constant-time hash verification.
* **Sanitized Logging**: Strict redaction prevents passwords, tokens, API keys, and OTPs from leaking into logs.
