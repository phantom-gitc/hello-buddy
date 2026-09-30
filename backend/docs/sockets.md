# WebSockets & Real-Time Events (Socket.IO)

## 1. Authentication Handshake

Sockets authenticate using server-side JWT verification:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken,
  },
  withCredentials: true,
});
```

The connection is rejected if the token is invalid, expired, or blacklisted in Redis.

## 2. Event Catalog

### Interview Room (`interview:<id>`)
* Client emits `interview:join` with `{ interviewId }`.
* Client emits `interview:start` with `{ interviewId }`.
* Server emits `interview:question` with `{ turnIndex, totalTurns, question }`.
* Client emits `interview:answer` with `{ interviewId, answer }`.
* Server emits `interview:evaluating` during AI scoring.
* Server emits `interview:feedback` with evaluation details.
* Server emits `interview:followup` if follow-up is warranted.
* Server emits `interview:complete` with full report when all turns finish.

### Chat Room (`chat:<id>`)
* Client emits `chat:join` with `{ chatId }`.
* Client emits `chat:message` with `{ chatId, content }`.
* Server emits `chat:response:start`.
* Server streams `chat:response:chunk` with text tokens.
* Server emits `chat:response:end` with the persisted message object.
