# SSIM — Stationery Inventory Management System

A production-grade admin inventory management system built with **Node.js** (native `http` module), **PostgreSQL**, and **React** (Vite).

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** 14+
- Database `ssimdb` created on your local PostgreSQL server

### 1. Database Setup
```bash
psql -U postgres -d ssimdb -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
npm run dev      # starts with --watch for auto-reload
# Server runs on http://localhost:5000
```

### 3. Frontend
```bash
cd web-frontend
npm install
npm run dev      # Vite dev server
# App runs on http://localhost:5173
```

---

## 📐 Architecture

```
SSIM-Project/
├── backend/
│   ├── server.js              # HTTP server & route dispatcher
│   ├── db.js                  # PostgreSQL pool connection
│   ├── schema.sql             # Database schema + seed data
│   ├── .env                   # Environment variables
│   ├── routes/
│   │   ├── auth.js            # Signup, Login, Logout, Profile
│   │   ├── products.js        # Product CRUD + search/filter
│   │   ├── categories.js      # Category CRUD
│   │   ├── suppliers.js       # Supplier CRUD
│   │   ├── stock.js           # Stock increase/decrease/history
│   │   └── dashboard.js       # Aggregated stats + chart data
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── roleMiddleware.js   # Admin role check
│   └── utils/
│       └── parseBody.js        # JSON body parser
├── web-frontend/
│   ├── src/
│   │   ├── api/axios.js        # Axios instance + interceptors
│   │   ├── context/AuthContext.jsx  # Auth state management
│   │   ├── components/         # Sidebar, AdminLayout, ProtectedRoute
│   │   ├── pages/              # All page components
│   │   └── index.css           # Complete design system
│   └── index.html
```

---

## 🔌 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Create admin account |
| POST | `/api/auth/login` | — | Login, get JWT |
| POST | `/api/auth/logout` | — | Logout notice |
| GET | `/api/auth/profile` | ✅ | Current user info |
| GET | `/api/products` | ✅ | List products (?search, ?category_id, ?page) |
| GET | `/api/products/:id` | ✅ | Single product detail |
| POST | `/api/products` | ✅ Admin | Create product |
| PUT | `/api/products/:id` | ✅ Admin | Update product |
| DELETE | `/api/products/:id` | ✅ Admin | Delete product |
| GET | `/api/categories` | ✅ | List categories |
| POST | `/api/categories` | ✅ Admin | Create category |
| PUT | `/api/categories/:id` | ✅ Admin | Update category |
| DELETE | `/api/categories/:id` | ✅ Admin | Delete category |
| GET | `/api/suppliers` | ✅ | List suppliers |
| GET | `/api/suppliers/:id` | ✅ | Supplier detail + products |
| POST | `/api/suppliers` | ✅ Admin | Create supplier |
| PUT | `/api/suppliers/:id` | ✅ Admin | Update supplier |
| DELETE | `/api/suppliers/:id` | ✅ Admin | Delete supplier |
| POST | `/api/stock/increase` | ✅ Admin | Increase product stock |
| POST | `/api/stock/decrease` | ✅ Admin | Decrease product stock |
| GET | `/api/stock/history` | ✅ | Stock change log |
| GET | `/api/stock/low` | ✅ | Low stock alerts |
| GET | `/api/dashboard/stats` | ✅ | Summary counts |
| GET | `/api/dashboard/recent` | ✅ | Recent products |
| GET | `/api/dashboard/stock-overview` | ✅ | Category stock chart data |

---

## 🔐 Environment Variables

Create `backend/.env`:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ssimdb
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_secret_key
PORT=5000
LOW_STOCK_THRESHOLD=10
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 🏗️ Production Deployment

### Backend
```bash
cd backend
NODE_ENV=production node server.js
```

### Frontend
```bash
cd web-frontend
npm run build          # Outputs to dist/
# Serve dist/ with nginx, Vercel, or any static host
```

---

## 🛡️ Security Features
- Bcrypt password hashing (10 salt rounds)
- JWT with 1-hour expiration
- Role-based admin access control
- Parameterized SQL queries (SQL injection safe)
- Request body size limit (1MB)
- CORS origin restriction
- Input validation on all endpoints

---

## 📦 Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js (native `http`) |
| Database | PostgreSQL |
| Frontend | React 19 (Vite) |
| Auth | JWT + bcrypt |
| Charts | Recharts |
| Icons | React Icons |
| Routing | React Router v7 |
| HTTP Client | Axios |
