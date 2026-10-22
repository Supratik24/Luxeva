<div align="center">

# 🛍️ Luxeva

### A Modern Luxury E-Commerce Platform

**Built with a true Microservices Architecture**

[![Live Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://luxeva-alx6.onrender.com/health)
[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://luxeva-frontend.vercel.app)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Microservices](#-microservices)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [Cloud Deployment](#-cloud-deployment)
- [Database](#-database)

---

## 🌟 Overview

Luxeva is a full-stack, production-grade **luxury fashion e-commerce platform** built using a **microservices architecture**. It features a React 19 storefront, a Node.js API gateway, 7 independent backend services, real-time notifications via Socket.IO, Razorpay payment integration, Cloudinary media management, and Clerk authentication — all containerized with Docker and deployed to the cloud.

---

## 🔗 Live Demo

| Service | URL |
|---|---|
| 🖥️ **Frontend** | [luxeva-frontend.vercel.app](https://luxeva-frontend.vercel.app) |
| ⚙️ **Backend API** | [luxeva-alx6.onrender.com](https://luxeva-alx6.onrender.com) |
| ❤️ **Health Check** | [/health](https://luxeva-alx6.onrender.com/health) |

---

## 🏗️ Architecture

Luxeva follows a **microservices** pattern where every business domain is an independently deployable service. All client traffic flows through a single **API Gateway**, which proxies requests to the appropriate backend service.

```
                        ┌──────────────────────────────────┐
                        │         React Frontend            │
                        │    (Vite + Tailwind + Framer)    │
                        └──────────────┬───────────────────┘
                                       │ HTTPS
                        ┌──────────────▼───────────────────┐
                        │          API Gateway             │
                        │        (Port 8080)               │
                        └──┬────┬────┬────┬────┬────┬──────┘
                           │    │    │    │    │    │
          ┌────────────────┘    │    │    │    │    └─────────────────┐
          │                     │    │    │    │                       │
    ┌─────▼──────┐  ┌───────────▼┐  │  ┌─▼──────────┐  ┌────────────▼──┐
    │    Auth    │  │  Catalog   │  │  │   Orders   │  │  Payments     │
    │  Service  │  │  Service   │  │  │   Service  │  │   Service     │
    │  :4001    │  │   :4002    │  │  │   :4003    │  │   :4005       │
    └─────┬──────┘  └─────┬──────┘  │  └─────┬──────┘  └───────┬───────┘
          │               │         │         │                  │
    ┌─────▼──────┐        │   ┌─────▼──────┐ │         ┌───────▼───────┐
    │  auth_db   │  ┌─────▼──►│ catalog_db │ │         │  payments_db  │
    └────────────┘  │    └───────────────────┘         └───────────────┘
                    │
              ┌─────▼──────┐  ┌────────────────┐  ┌──────────────────┐
              │  Content   │  │ Notifications  │  │  orders_db       │
              │  Service  │  │   Service      │  │  content_db      │
              │   :4004   │  │    :4006       │  │  notifications_db │
              └────────────┘  └────────────────┘  └──────────────────┘

                        ┌──────────────────────────────────┐
                        │        MongoDB Atlas Cluster      │
                        │   (6 isolated databases)         │
                        └──────────────────────────────────┘

                        ┌──────────────────────────────────┐
                        │     Redis (Cache / Sessions)     │
                        └──────────────────────────────────┘
```

---

## ✨ Features

### 🛒 Customer Storefront
- Browse **52+ luxury products** across curated categories
- Advanced product filtering by price, brand, size, colour, and rating
- Product detail pages with image gallery, size guide, variants, and reviews
- **Wishlist** — save items for later
- **Shopping Cart** — persistent cart with quantity management
- Smooth checkout flow with address management
- **Razorpay** payment gateway integration

### 👤 User Dashboard
- Order history with real-time status tracking (Socket.IO)
- Submit **Return & Refund** requests with evidence uploads
- Submit **Replacement** requests
- Profile and address management
- Real-time notifications

### 🔐 Authentication
- **Clerk** OAuth — Google login, email/password, 2-factor authentication
- JWT-secured API routes
- Admin role separation

### 🛠️ Admin Panel
- **Dashboard** — sales analytics, revenue charts (Recharts), and KPI cards
- **Products** — CRUD with Cloudinary image upload
- **Orders** — view, update status, filter and search
- **Returns** — review and approve/reject return requests
- **Replacements** — manage replacement requests separately
- **Users** — manage customer accounts
- **Content** — manage site banners and announcements
- **Media** — Cloudinary media library
- **Reports** — PDF/CSV export using jsPDF

### 📦 Order Management
- Full order lifecycle: `pending → confirmed → processing → shipped → delivered`
- Real-time status updates via **Socket.IO**
- Email notifications at each stage (Nodemailer + Gmail SMTP)

### 📬 Notifications
- In-app notifications (bell icon)
- Email notifications for order events and promotions
- Admin alert emails

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **React Router DOM 6** | Client-side routing |
| **Axios** | HTTP client |
| **Socket.IO Client** | Real-time updates |
| **Clerk React** | Authentication & user management |
| **Recharts** | Admin analytics charts |
| **Swiper.js** | Product carousels |
| **jsPDF** | PDF report generation |
| **Lucide React** | Icon set |
| **React Hot Toast** | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20** | Runtime |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Redis** | Caching & session store |
| **Socket.IO** | Real-time WebSocket server |
| **Clerk SDK** | Auth verification |
| **Razorpay** | Payment gateway |
| **Cloudinary** | Image & media storage |
| **Nodemailer** | Email (SMTP) |
| **http-proxy-middleware** | API Gateway routing |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerization |
| **Docker Compose** | Local multi-service orchestration |
| **Render** | Backend cloud deployment |
| **Vercel** | Frontend deployment |
| **MongoDB Atlas** | Managed cloud database |
| **npm Workspaces** | Monorepo management |

---

## 📁 Project Structure

```
luxeva/
├── 📄 package.json              # Root workspace config
├── 📄 docker-compose.yml        # Local Docker orchestration
├── 📄 Dockerfile.backend        # Production backend image
├── 📄 Dockerfile.workspace      # Per-service build image
├── 📄 render.yaml               # Render deployment config
├── 📄 vercel.json               # Vercel SPA routing config
├── 📄 .env.example              # Environment template
│
├── 📂 frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ShopPage.jsx
│   │   │   ├── ProductPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── WishlistPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboardPage.jsx
│   │   │       ├── AdminProductsPage.jsx
│   │   │       ├── AdminOrdersPage.jsx
│   │   │       ├── AdminReturnsPage.jsx
│   │   │       ├── AdminReplacementsPage.jsx
│   │   │       ├── AdminUsersPage.jsx
│   │   │       ├── AdminContentPage.jsx
│   │   │       ├── AdminMediaPage.jsx
│   │   │       └── AdminReportsPage.jsx
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   │       └── api.js           # Axios API client
│   └── package.json
│
├── 📂 packages/
│   └── shared/                  # @luxeva/shared — common utils
│       └── src/
│           ├── database.js
│           ├── middleware.js
│           └── index.js
│
├── 📂 services/
│   ├── api-gateway/             # Port 8080 — Traffic router
│   ├── auth-service/            # Port 4001 — Users & auth
│   ├── catalog-service/         # Port 4002 — Products & catalog
│   ├── order-service/           # Port 4003 — Orders & cart
│   ├── content-service/         # Port 4004 — Banners & CMS
│   ├── payment-service/         # Port 4005 — Razorpay payments
│   └── notification-service/    # Port 4006 — Email & alerts
│
└── 📂 scripts/
    ├── seed-all.js              # Seed all databases
    ├── catalog-seed-data.js     # 52 luxury products seed
    └── start-backend.cjs        # Production backend starter
```

---

## ⚙️ Microservices

### 🔀 API Gateway — Port `8080`
The single entry point for all client requests. Routes traffic using `http-proxy-middleware`.

| Route | Upstream Service |
|---|---|
| `/api/auth/*` | auth-service:4001 |
| `/api/users/*` | auth-service:4001 |
| `/api/catalog/*` | catalog-service:4002 |
| `/api/orders/*` | order-service:4003 |
| `/api/content/*` | content-service:4004 |
| `/api/payments/*` | payment-service:4005 |
| `/api/notifications/*` | notification-service:4006 |

---

### 🔐 Auth Service — Port `4001`
Handles user identity, authentication, and profiles.

**Models:** `User`, `Address`  
**Routes:** `/api/auth`, `/api/users`  
**Features:** Register/login, Clerk JWT verification, 2FA, address CRUD, profile updates

---

### 🛍️ Catalog Service — Port `4002`
Manages all product-related data and the shopping catalog.

**Models:** `Product`, `Category`, `Brand`, `Review`, `Wishlist`, `Coupon`  
**Routes:** `/api/catalog`  
**Database:** `catalog_db` — **52 live luxury products**  
**Features:** Product CRUD, filtering, search, reviews, wishlists, coupon management, Cloudinary image upload

---

### 📦 Order Service — Port `4003`
Manages shopping carts, order creation, and status lifecycle.

**Models:** `Order`, `Cart`  
**Routes:** `/api/orders`  
**Database:** `orders_db`  
**Features:** Cart management, order placement, status updates, return/replacement requests, Socket.IO real-time events

---

### 📄 Content Service — Port `4004`
CMS for managing dynamic site content.

**Routes:** `/api/content`  
**Database:** `content_db`  
**Features:** Banners, homepage sections, FAQs, announcements, admin content editor

---

### 💳 Payment Service — Port `4005`
Integrates with Razorpay for secure payment processing.

**Models:** `Payment`  
**Routes:** `/api/payments`  
**Features:** Create Razorpay orders, verify payment signatures, record transactions, refund initiation

---

### 🔔 Notification Service — Port `4006`
Handles all notification delivery.

**Models:** `Notification`  
**Routes:** `/api/notifications`  
**Features:** In-app notifications, email dispatch (Nodemailer), admin alert emails, event subscriptions

---

## 📡 API Reference

### Health & Status
```
GET  /health                         — API Gateway health check
```

### Auth
```
POST /api/auth/register              — Register a new user
POST /api/auth/login                 — Login with email/password
POST /api/auth/clerk                 — Sync Clerk user
POST /api/auth/2fa/send              — Send 2FA OTP
POST /api/auth/2fa/verify            — Verify 2FA OTP
POST /api/auth/forgot-password       — Request password reset
POST /api/auth/reset-password        — Reset password with token
GET  /api/users/profile              — Get current user profile
PUT  /api/users/profile              — Update profile
GET  /api/users/addresses            — List saved addresses
POST /api/users/addresses            — Add address
```

### Catalog
```
GET  /api/catalog/products           — List products (with filters & pagination)
GET  /api/catalog/products/:id       — Get single product
POST /api/catalog/products           — Create product (Admin)
PUT  /api/catalog/products/:id       — Update product (Admin)
DELETE /api/catalog/products/:id     — Delete product (Admin)
GET  /api/catalog/categories         — List categories
GET  /api/catalog/brands             — List brands
POST /api/catalog/reviews            — Submit a product review
GET  /api/catalog/wishlist           — Get user wishlist
POST /api/catalog/wishlist/:id       — Add to wishlist
DELETE /api/catalog/wishlist/:id     — Remove from wishlist
GET  /api/catalog/coupons/validate   — Validate a coupon code
```

### Orders
```
GET  /api/orders/cart                — Get cart
POST /api/orders/cart/add            — Add item to cart
PUT  /api/orders/cart/update         — Update cart item quantity
DELETE /api/orders/cart/remove/:id   — Remove cart item
POST /api/orders                     — Place a new order
GET  /api/orders                     — Get user orders
GET  /api/orders/:id                 — Get single order
PUT  /api/orders/:id/status          — Update order status (Admin)
POST /api/orders/:id/return          — Submit return request
POST /api/orders/:id/replacement     — Submit replacement request
```

### Payments
```
POST /api/payments/create-order      — Create Razorpay order
POST /api/payments/verify            — Verify payment signature
GET  /api/payments/history           — Get payment history
```

### Notifications
```
GET  /api/notifications              — Get user notifications
PUT  /api/notifications/:id/read     — Mark as read
PUT  /api/notifications/read-all     — Mark all as read
DELETE /api/notifications/:id        — Delete notification
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20 or higher
- **npm** v10 or higher
- **MongoDB** (local) or a MongoDB Atlas connection string
- **Redis** (optional — falls back to in-memory cache)
- **Docker & Docker Compose** (for containerized local setup)

---

### Option 1 — Local Development (No Docker)

**1. Clone the repository**
```bash
git clone https://github.com/your-username/luxeva.git
cd luxeva/luxeva
```

**2. Install all dependencies** (installs for all workspaces at once)
```bash
npm install
```

**3. Configure environment**
```bash
cp .env.example .env
# Fill in your MongoDB URI, Clerk keys, Razorpay keys, etc.
```

**4. Seed the database** (adds 52 products, categories, and brands)
```bash
npm run seed
```

**5. Start all services concurrently**
```bash
# Start all 7 backend services + frontend
npm run dev

# OR start only backend services
npm run dev:backend

# Then in a separate terminal, start frontend
npm run dev --workspace frontend
```

**6. Open the app**
```
Frontend:    http://localhost:5173
API Gateway: http://localhost:8080
```

---

### Option 2 — Docker Compose (Recommended)

Runs the full stack including MongoDB and Redis containers.

```bash
# Clone and enter project
git clone https://github.com/your-username/luxeva.git
cd luxeva/luxeva

# Copy and configure environment
cp .env.example .env
# Edit .env with your Clerk, Cloudinary, Razorpay keys

# Build and start all containers
docker-compose up --build

# To run in background
docker-compose up -d --build

# Seed the database (after containers are up)
docker-compose exec api-gateway npm run seed

# View logs
docker-compose logs -f api-gateway

# Stop everything
docker-compose down
```

**Services started by Docker Compose:**

| Container | Port | Description |
|---|---|---|
| `luxeva-mongo` | 27017 | MongoDB instance |
| `luxeva-redis` | 6379 | Redis cache |
| `auth-service` | 4001 | Auth microservice |
| `catalog-service` | 4002 | Catalog microservice |
| `order-service` | 4003 | Orders microservice |
| `content-service` | 4004 | Content microservice |
| `payment-service` | 4005 | Payments microservice |
| `notification-service` | 4006 | Notifications microservice |
| `api-gateway` | 8080 | API gateway |
| `frontend` | 5173 | React frontend |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# ─── Core ───────────────────────────────────────────
NODE_ENV=production
PORT=8080
INTERNAL_SERVICE_SECRET=your-internal-secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# ─── CORS ───────────────────────────────────────────
FRONTEND_URL=https://your-frontend-url.vercel.app

# ─── Clerk Authentication ───────────────────────────
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ADMIN_EMAIL=admin@yourdomain.com

# ─── MongoDB (per service) ──────────────────────────
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/auth_db
CATALOG_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/catalog_db
ORDER_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/orders_db
CONTENT_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/content_db
NOTIFICATION_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/notifications_db
PAYMENT_MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/payments_db

# ─── Redis ──────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Razorpay ───────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-razorpay-secret

# ─── Cloudinary (Image Storage) ─────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ─── Email (SMTP) ───────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=support@luxeva.com
ADMIN_ALERT_EMAIL=admin@luxeva.com

# ─── Database Seeding ───────────────────────────────
SEED_ON_START=false
SEED_FORCE=false
SEED_VERSION=2026-05-22
```

> **Important:** Every microservice uses its own database URI. If you only set `MONGO_URI`, all services will fall back to it and share the same database, which may cause data mixing. For proper isolation, set each `*_MONGO_URI` variable.

---

## 🐳 Docker Deployment

### Production Docker Image

The `Dockerfile.backend` builds a single optimized image that runs all backend services:

```dockerfile
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY */package.json (each workspace)
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 8080
CMD ["node", "scripts/start-backend.cjs"]
```

**Build and run manually:**
```bash
# Build
docker build -f Dockerfile.backend -t luxeva-backend .

# Run
docker run -p 8080:8080 --env-file .env luxeva-backend
```

---

## ☁️ Cloud Deployment

### Backend → Render

The project includes `render.yaml` for one-click Render deployment:

1. Push code to GitHub
2. Connect the repo in [Render Dashboard](https://dashboard.render.com)
3. Render auto-detects `render.yaml` and creates the service
4. Go to **Environment** tab and fill in all required secrets (Clerk, Mongo URIs, Razorpay, Cloudinary)
5. Click **Deploy**

**Critical: Set all MongoDB URIs** — each service needs its own database URI to avoid data mixing.

| Env Var | Points To |
|---|---|
| `MONGO_URI` | `auth_db` |
| `CATALOG_MONGO_URI` | `catalog_db` |
| `ORDER_MONGO_URI` | `orders_db` |
| `CONTENT_MONGO_URI` | `content_db` |
| `NOTIFICATION_MONGO_URI` | `notifications_db` |
| `PAYMENT_MONGO_URI` | `payments_db` |

---

### Frontend → Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

Set these environment variables in Vercel project settings:
```
VITE_API_URL=https://your-render-backend.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_RAZORPAY_KEY_ID=rzp_live_...
```

The `vercel.json` is already configured to handle SPA client-side routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🗄️ Database

Luxeva uses **6 isolated MongoDB databases** on the same Atlas cluster, one per service domain:

| Database | Service | Contents |
|---|---|---|
| `auth_db` | auth-service | Users, addresses, 2FA records |
| `catalog_db` | catalog-service | **52 products**, categories, brands, reviews, wishlists, coupons |
| `orders_db` | order-service | Orders, carts, return/replacement requests |
| `content_db` | content-service | Banners, announcements, CMS content |
| `notifications_db` | notification-service | Notification records |
| `payments_db` | payment-service | Payment transaction records |

### Seed the Database

To populate the database with 52 luxury products, 10 categories, and brand data:

```bash
# From the luxeva/ root directory
npm run seed
```

> You can force a re-seed by setting `SEED_FORCE=true` in your `.env`.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public distribution.

---

<div align="center">

Made with ❤️ by the Luxeva team

**[Live Demo](https://luxeva-frontend.vercel.app)** · **[API Health](https://luxeva-alx6.onrender.com/health)**

</div>
