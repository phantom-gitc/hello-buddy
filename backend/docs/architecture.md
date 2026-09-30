# Architecture Specification

## 1. Overview & Monolith-to-Microservices Roadmap

HelloBuddy backend is implemented as a **Modular Monolith** using JavaScript on Node.js and Express. Modules are strictly separated by business domain boundaries:

```text
[ Client (React/Vite) ]
         │ (HTTP / WebSockets)
         ▼
[ Express Application Pipeline (CORS, Helmet, RateLimiter, CookieParser) ]
         │
         ├── Auth Module (JWT, Redis OTP, Password Hashing)
         ├── Users Module (Profile, Career Goals, Preferences)
         ├── Resume Module (PDF Extract, AI Parser, Cloudinary, Qdrant Ingestion)
         ├── Interview Module (State Machine, QA Turns, Dynamic Follow-ups)
         ├── Learning Module (Curriculum, Teacher Persona, Answer Assessment)
         ├── Chat Module (Multi-turn conversations, RAG context injection)
         ├── Evaluation & Progress Module (Score clamping, Readiness indexing)
         └── Uploads Module (MIME validation, Cloudinary storage)
```

### Future Microservices Extraction Path
Each module encapsulates its routes, controllers, services, models, and validations. When throughput requires scaling specific workloads independently:
1. **AI & Interview Service**: Can be decoupled into a dedicated Python or Node worker cluster processing LLM and voice generation.
2. **RAG & Ingestion Service**: Can be extracted behind an event queue (e.g. BullMQ/Redis) for compute-intensive PDF chunking and embedding generation.
3. **Gateway**: An API gateway will route requests to Auth, User, Interview, and Learning microservices without changing the REST or Socket contracts.

---

## 2. Layered Responsibilities

1. **Routes Layer**: Solely mounts paths, applies rate limiters, and attaches Zod validation and authentication middleware.
2. **Controller Layer**: Extracts validated request inputs (`req.body`, `req.params`, `req.user`), invokes the corresponding domain service, sets cookies if applicable, and returns formatted `ApiResponse` payloads. Controllers never contain business logic.
3. **Service Layer**: Houses all domain business rules, coordinates database models, calls external infrastructure (Redis, Brevo, Cloudinary, Qdrant), and invokes the AI abstraction layer.
4. **Data Layer (Mongoose & Qdrant)**: Stores persistent structured state and semantic vectors. Strict `userId` scoping is enforced on every operation.
