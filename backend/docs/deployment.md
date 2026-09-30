# Deployment & Production Hardening Guide

## 1. Environment Checklist

Before deploying to production:
* `NODE_ENV=production`
* Generate cryptographically strong random strings (64+ chars) for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET`.
* Set production `MONGO_URI` (with replica set enabled).
* Set production `REDIS_URL` (password protected, TLS).
* Configure actual `BREVO_API_KEY` for transactional email delivery.
* Configure `CLOUDINARY_*` keys and `QDRANT_*` connection url & api key.
* Ensure `CLIENT_URL` matches your frontend domain for CORS protection.

## 2. Docker Deployment

A standard container setup:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 3. Reverse Proxy (Nginx) Configuration
Ensure `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";` are enabled in Nginx to support Socket.IO WebSocket upgrading.
