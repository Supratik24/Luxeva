# Luxeva Commerce Platform

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/API-Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Cache%20%2B%20Events-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451?style=for-the-badge)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=111827)

Luxeva is a production-style eCommerce platform with a polished React storefront, hidden role-protected admin portal, and Node.js microservices backend. It is built as a monorepo, runs locally with one command, and includes a Render blueprint for production deployment.

## Stickers

| Storefront | Admin | Backend | Production |
| --- | --- | --- | --- |
| Premium shopping UX | Hidden admin portal | API gateway + services | Render blueprint |
| Search, filters, wishlist | Analytics and inventory | MongoDB + Mongoose | Private service topology |
| Cart, coupons, checkout | Products, orders, content | Redis cache + pub/sub | Health checks included |
| Razorpay + COD | Role-based protection | JWT auth + blacklist | Environment checklist |

## What It Includes

- Responsive storefront with homepage, product listing, product detail, wishlist, cart, checkout, account dashboard, content pages, and theme toggle.
- Hidden admin login at `/portal/admin/login` with backend-enforced role-based access control.
- Product, category, brand, coupon, review, banner, content, user, cart, order, and notification models.
- Redis-backed catalog caching, JWT logout invalidation, and order event fan-out.
- Razorpay online payments plus cash on delivery.
- Local multi-image upload support for admin product management.
- Render deployment blueprint in `render.yaml`.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React, React Router, Context API, Axios, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Architecture | API gateway, microservices, shared package workspace |
| Infrastructure | Redis, Docker Compose, Render |
| Auth | JWT, hashed passwords, admin RBAC |
| Payments | Razorpay checkout, cash on delivery |

## Monorepo Map

```text
frontend/
packages/
  shared/
services/
  api-gateway/
  auth-service/
  catalog-service/
  order-service/
  content-service/
  notification-service/
scripts/
docker-compose.yml
render.yaml
```

## Services

| Service | Purpose | Local Port |
| --- | --- | --- |
| `api-gateway` | Public API entrypoint and proxy | `8080` |
| `auth-service` | Auth, users, profile, addresses, admin login | `4001` |
| `catalog-service` | Products, categories, reviews, wishlist, coupons | `4002` |
| `order-service` | Cart, checkout, payments, orders, analytics | `4003` |
| `content-service` | Homepage content, banners, static pages | `4004` |
| `notification-service` | Customer and admin notifications | `4005` |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in the values you need.

```bash
cp .env.example .env
```

Important variables:

```text
JWT_SECRET
MONGO_URI
CATALOG_MONGO_URI
ORDER_MONGO_URI
CONTENT_MONGO_URI
NOTIFICATION_MONGO_URI
REDIS_URL
AUTH_SERVICE_URL
CATALOG_SERVICE_URL
ORDER_SERVICE_URL
CONTENT_SERVICE_URL
NOTIFICATION_SERVICE_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
SMTP_USER
SMTP_PASS
SMTP_FROM
TWO_FACTOR_API_KEY
VITE_USE_PREVIEW_AUTH
```

### 3. Start MongoDB and Redis

```bash
docker compose up -d mongo redis
```

### 4. Run the full app

```bash
npm run dev
```

### 5. Seed demo data

```bash
npm run seed
```

## Local URLs

| App | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Gateway | `http://localhost:8080` |
| Auth service | `http://localhost:4001` |
| Catalog service | `http://localhost:4002` |
| Order service | `http://localhost:4003` |
| Content service | `http://localhost:4004` |
| Notification service | `http://localhost:4005` |

## NPM Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run gateway, all services, and frontend together |
| `npm run dev:backend` | Run only backend services |
| `npm run build` | Build the frontend workspace |
| `npm run start:frontend` | Start the built frontend |
| `npm run start:gateway` | Start the API gateway |
| `npm run start:auth` | Start auth service |
| `npm run start:catalog` | Start catalog service |
| `npm run start:order` | Start order service |
| `npm run start:content` | Start content service |
| `npm run start:notifications` | Start notification service |
| `npm run seed` | Seed all demo data |

## Storefront Features

- Homepage hero, featured products, trending products, category highlights, testimonials, and newsletter.
- Product listings with search, suggestions, filters, and sorting.
- Product detail pages with image gallery, specs, reviews, related products, and review submission.
- Wishlist, cart, coupons, checkout, recently viewed products, and order history.
- Login, signup, forgot password, reset password, profile, addresses, and notifications.
- About, contact, FAQ, terms, privacy, 404, and error boundary fallback UI.

## Admin Features

- Private admin login route that is not exposed in public navigation.
- Dashboard analytics cards, sales chart, low-stock alerts, and admin notifications.
- Product CRUD with local image uploads.
- Category and brand management.
- Coupon creation and review moderation.
- Order management with status changes.
- User role and account status management.
- Banner, content block, and sales report management.

## Redis Usage

- JWT blacklist support after logout so revoked tokens stop working across protected services.
- Catalog cache for product lists, product details, and search suggestions.
- Pub/sub channel `orders.events` for order creation and status update notifications.

## API Snapshot

### Auth

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/admin/login
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/password
GET  /api/auth/addresses
POST /api/auth/addresses
```

### Catalog

```text
GET  /api/catalog/meta
GET  /api/catalog/products
GET  /api/catalog/products/:slug
GET  /api/catalog/products/suggestions
POST /api/catalog/products/:productId/reviews
GET  /api/catalog/wishlist
POST /api/catalog/wishlist/toggle
POST /api/catalog/coupons/validate
```

Admin CRUD routes live under:

```text
/api/catalog/admin/*
```

### Orders

```text
GET  /api/orders/cart
PUT  /api/orders/cart
POST /api/orders/payments/intent
POST /api/orders
GET  /api/orders/mine
```

Admin analytics and order management live under:

```text
/api/orders/admin/*
```

### Content

```text
GET /api/content/home
GET /api/content/pages/:slug
```

Admin banner and content management live under:

```text
/api/content/admin/*
```

### Notifications

```text
GET   /api/notifications/mine
PATCH /api/notifications/mine/:id/read
GET   /api/notifications/admin/all
```

## Docker

Run the whole stack with Docker Compose:

```bash
docker compose up --build
```

The root `Dockerfile.workspace` is set up so every service can build from the monorepo root and access the shared workspace package.

## Render Deployment

This repo includes a Render blueprint at `render.yaml`.

Recommended flow:

1. Push this repo to GitHub.
2. Create a new Render Blueprint and connect it to the repo.
3. Let Render create the frontend, gateway, private services, and Redis instance.
4. Fill every `sync: false` environment variable before the first successful deploy.
5. Verify the frontend URL and every `/health` endpoint.

Render services created by the blueprint:

| Render Service | Type |
| --- | --- |
| `luxeva-frontend` | Static site |
| `luxeva-api-gateway` | Public API |
| `luxeva-auth-service` | Private service |
| `luxeva-catalog-service` | Private service |
| `luxeva-order-service` | Private service |
| `luxeva-content-service` | Private service |
| `luxeva-notification-service` | Private service |
| `luxeva-redis` | Render Key Value |

Production checklist:

- `VITE_USE_PREVIEW_AUTH=false`
- Mongo Atlas network access allows Render egress.
- Redis is connected from Render Key Value or another hosted Redis.
- SMTP credentials are configured for OTP and reset email.
- Razorpay keys are added only to the order service environment.
- `FRONTEND_URL` points to the deployed frontend origin.
- Gateway service URLs point to Render private hostports, not localhost.

## Production Notes

- Health endpoints exist on every service at `/health`.
- Gateway proxy targets support Render private `host:port` values.
- Frontend preview auth does not turn on by default in production.
- Razorpay online payment flow and COD flow both persist backend orders.
- Redis failures degrade more gracefully during local development while production database failures remain strict.

## License

Private project.
