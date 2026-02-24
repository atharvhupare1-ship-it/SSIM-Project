# 🚀 Deploy SSIM to Render (Free Tier)

Deploy your app with **three Render services**: PostgreSQL database, backend Web Service, and frontend Static Site.

---

## Prerequisites

- A [Render account](https://render.com) (sign up free with GitHub)
- Your code pushed to a **GitHub repository**
- `psql` CLI installed locally (for running the schema)

---

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | Name | `ssim-db` |
   | Database | `ssimdb` |
   | User | `ssim_user` |
   | Region | Pick the closest to you |
   | Plan | **Free** |
3. Click **Create Database**
4. Once created, copy the **Internal Database URL** and **External Database URL** from the Info tab

---

## Step 2: Set Up the Database Schema

Run the schema SQL against your Render database using the **External Database URL**:

```bash
psql "YOUR_EXTERNAL_DATABASE_URL" -f backend/schema.sql
```

> Replace `YOUR_EXTERNAL_DATABASE_URL` with the URL from Step 1 (it looks like `postgres://ssim_user:password@host/ssimdb`).

Optionally, load seed data:
```bash
psql "YOUR_EXTERNAL_DATABASE_URL" -f backend/seed_data.sql
```

---

## Step 3: Deploy the Backend (Web Service)

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your **GitHub repository**
3. Configure:

   | Field | Value |
   |-------|-------|
   | Name | `ssim-backend` |
   | Region | Same as your database |
   | Branch | `main` (or your default branch) |
   | Root Directory | `backend` |
   | Runtime | **Node** |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | **Free** |

4. Add **Environment Variables** (under "Environment"):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste the **Internal Database URL** from Step 1 |
   | `JWT_SECRET` | A strong random string (e.g. `openssl rand -hex 32`) |
   | `PORT` | `10000` |
   | `LOW_STOCK_THRESHOLD` | `10` |
   | `CORS_ORIGIN` | `*` (update after frontend is deployed — see Step 5) |
   | `NODE_ENV` | `production` |

5. Click **Create Web Service**
6. Wait for the deploy to finish. Copy the service URL (e.g. `https://ssim-backend-xxxx.onrender.com`)

---

## Step 4: Deploy the Frontend (Static Site)

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect the **same GitHub repository**
3. Configure:

   | Field | Value |
   |-------|-------|
   | Name | `ssim-frontend` |
   | Branch | `main` |
   | Root Directory | `web-frontend` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

4. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://ssim-backend-xxxx.onrender.com/api` |

   > Replace with your actual backend URL from Step 3. **Include `/api` at the end.**

5. Under **Redirects/Rewrites**, add a rule for SPA routing:

   | Source | Destination | Action |
   |--------|-------------|--------|
   | `/*` | `/index.html` | **Rewrite** |

6. Click **Create Static Site**

---

## Step 5: Update CORS on Backend

After the frontend is deployed and you have its URL (e.g. `https://ssim-frontend-xxxx.onrender.com`):

1. Go to your **ssim-backend** service on Render
2. Go to **Environment** tab
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   https://ssim-frontend-xxxx.onrender.com
   ```
4. Click **Save Changes** — the backend will redeploy automatically

---

## ✅ Verify the Deployment

1. Visit your **frontend URL** → Login page should load
2. **Sign up** a new admin account
3. **Login** → Dashboard should load with stats
4. Test **Products, Categories, Suppliers, Stock** pages

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Spin down**: Free web services spin down after 15 minutes of inactivity. The first request after sleeping takes ~30 seconds (cold start).
- **Database expiry**: Free PostgreSQL databases expire after **90 days**. You'll need to recreate or upgrade before then.

### Redeployment
- Render auto-deploys on every push to your `main` branch
- To trigger a manual redeploy, go to the service → **Manual Deploy** → **Deploy latest commit**

### Custom Domain (Optional)
1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain and configure the DNS as instructed by Render

---

## 📁 Environment Variables Reference

### Backend (Web Service)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `JWT_SECRET` | Secret key for JWT signing | Random hex string |
| `PORT` | Server port (Render uses 10000) | `10000` |
| `LOW_STOCK_THRESHOLD` | Alert threshold for low stock | `10` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://ssim-frontend-xxxx.onrender.com` |
| `NODE_ENV` | Environment mode | `production` |

### Frontend (Static Site)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (with `/api`) | `https://ssim-backend-xxxx.onrender.com/api` |
