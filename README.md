# Anonymous Chat API

A real-time anonymous group chat service built with NestJS, PostgreSQL, Redis, and Socket.io.

---

## 🚀 Quick Setup

### 1. Clone Repository

```bash
git clone https://github.com/Sharif-11/Anonymous-Chat-API.git
```

```bash
cd Anonymous-Chat-API
```

---

## 📦 Project Setup

```bash
npm install
```

---

## ▶️ Run the Project

### Development

```bash
npm run start
```

### Watch Mode

```bash
npm run start:dev
```

### Production

```bash
npm run start:prod
```

---

## 🗄️ Database Commands

### Generate Migration

```bash
npm run db:generate
```

### Run Migration

```bash
npm run db:migrate
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and follow this format:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Redis
REDIS_URL=your_redis_connection_string

# App
PORT=3000
SESSION_TTL=86400

# Socket
SOCKET_PATH=/chat
```

---