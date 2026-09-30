# API Reference Specification

All responses follow the unified standard response envelope:

### Success Response (HTTP 200/201/202)
```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error Response (HTTP 4xx/5xx)
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}
```

---

## Endpoint Index

### Auth
- `POST /api/v1/auth/register` — `{ name, email, password }`
- `POST /api/v1/auth/verify-email` — `{ email, otp }`
- `POST /api/v1/auth/resend-otp` — `{ email, action }`
- `POST /api/v1/auth/login` — `{ email, password }`
- `POST /api/v1/auth/logout` — Requires Auth
- `POST /api/v1/auth/refresh` — Cookie or `{ refreshToken }`
- `POST /api/v1/auth/forgot-password` — `{ email }`
- `POST /api/v1/auth/reset-password` — `{ email, otp, newPassword }`
- `POST /api/v1/auth/change-password` — `{ currentPassword, newPassword }`
- `GET  /api/v1/auth/me` — Current user info

### Users
- `GET    /api/v1/users/me` — Profile
- `PATCH  /api/v1/users/me` — Update name, career goals, target package, skills
- `PATCH  /api/v1/users/me/preferences` — Update difficulty and topics
- `DELETE /api/v1/users/me` — Soft delete account

### Resumes
- `POST   /api/v1/resumes` — Multipart form with `resume` (PDF)
- `GET    /api/v1/resumes` — List all
- `GET    /api/v1/resumes/:id` — Single resume
- `GET    /api/v1/resumes/:id/analysis` — AI scoring & extraction
- `POST   /api/v1/resumes/:id/analyze` — Trigger re-analysis
- `DELETE /api/v1/resumes/:id` — Remove resume & vectors

### Interview Simulations
- `POST /api/v1/interviews` — `{ role, experienceYears, difficulty, interviewType, topics, resumeId }`
- `GET  /api/v1/interviews` — List past sessions
- `GET  /api/v1/interviews/:id` — Session details
- `POST /api/v1/interviews/:id/start` — Start and receive Q1
- `POST /api/v1/interviews/:id/answer` — `{ answer }`
- `POST /api/v1/interviews/:id/complete` — Conclude interview
- `GET  /api/v1/interviews/:id/report` — Final evaluation report

### Learning
- `GET  /api/v1/learning/domains` — Available domains
- `GET  /api/v1/learning/topics?domain=X` — Topics
- `POST /api/v1/learning/sessions` — Start lesson
- `GET  /api/v1/learning/sessions` — List sessions
- `GET  /api/v1/learning/sessions/:id` — Details
- `POST /api/v1/learning/sessions/:id/message` — Send teacher message
- `POST /api/v1/learning/sessions/:id/answer` — Answer question
- `GET  /api/v1/learning/progress` — Learner progress

### Chats
- `POST   /api/v1/chats` — Create chat
- `GET    /api/v1/chats` — List chats
- `GET    /api/v1/chats/:id` — View chat
- `DELETE /api/v1/chats/:id` — Delete chat
- `POST   /api/v1/chats/:id/messages` — Send message
- `GET    /api/v1/chats/:id/messages` — View messages
- `POST   /api/v1/chats/:id/attachments` — Upload attachment

### Progress
- `GET  /api/v1/progress` — Overall readiness score & weak areas
- `POST /api/v1/progress/sync` — Synchronize metrics
