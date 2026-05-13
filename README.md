# Luxeva Commerce Platform

Luxeva is a production-style eCommerce platform built with a React storefront, a hidden role-protected admin portal, and a Node.js microservices backend using MongoDB and Redis. The repo is structured to run locally as a monorepo and to deploy cleanly on Render with one public gateway, one public frontend, and private internal services.

## Stack

- Frontend: React, React Router, Context API, Axios, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Architecture: API gateway + microservices
- Services:
  - `api-gateway`
  - `auth-service`
  - `catalog-service`
  - `order-service`
  - `content-service`
  - `notification-service`
- Shared infrastructure: Redis for JWT blacklist support, catalog caching, and pub/sub order events
- Auth: JWT with hashed passwords
- Payments: Razorpay checkout for online payments plus cash on delivery
- Uploads: Local multi-image upload support for admin product management

## Highlights

- Premium responsive storefront with polished typography, search suggestions, filters, quick view, wishlist, cart, checkout, and account dashboard
- Secure hidden admin login at `/portal/admin/login`
- Backend-enforced role-based access control for every admin API route
- Product, category, brand, coupon, review, banner, content, user, cart, order, and notification models
- Redis-backed catalog caching and order event fan-out
- Sales analytics, low-stock alerts, admin notifications, and status updates
- Render blueprint included in `render.yaml`

## Monorepo Layout

```text
frontend/
packages/shared/
services/
  api-gateway/
  auth-service/
  catalog-service/
  order-service/
  content-service/
  notification-service/
scripts/
```

## Key Features

### Storefront

- Homepage hero, featured products, trending products, category highlights, testimonials, newsletter
- Product listing with filters and sorting
- Product detail with image gallery, reviews, specs, related products, and review submission
- Wishlist, cart, coupon support, checkout, recently viewed products
- Login, signup, forgot password, reset password
- Customer dashboard for profile, orders, addresses, wishlist, and notifications
- About, contact, FAQ, terms, privacy, 404, and error boundary fallback UI
- Dark/light theme toggle

### Admin

- Private admin login route not exposed in public navigation
- Dashboard analytics cards and sales chart
- Product CRUD with local image uploads
- Category and brand creation
- Coupon creation
- Review moderation
- Order management and status changes
- User role/status management
- Banner and content block management
- Sales report snapshot

## Redis Usage

- JWT blacklist support on logout so revoked tokens stop working across protected services
- Cached product list, product detail, and search suggestion responses in the catalog service
- Redis pub/sub channel `orders.events` for order creation and status update notifications

## Environment Setup

Copy `.env.example` to `.env` and adjust values as needed.

Important variables:

- `JWT_SECRET`
- `MONGO_URI`
- `CATALOG_MONGO_URI`
- `ORDER_MONGO_URI`
- `CONTENT_MONGO_URI`
- `NOTIFICATION_MONGO_URI`
- `REDIS_URL`
- `AUTH_SERVICE_URL`
- `CATALOG_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `CONTENT_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `TWO_FACTOR_API_KEY`
- `VITE_USE_PREVIEW_AUTH`

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB and Redis

Use local services or Docker.

```bash
docker compose up -d mongo redis
```

### 3. Run everything

```bash
npm run dev
```

### 4. Optional seed step

```bash
npm run seed
```

### 5. App URLs

- Frontend: `http://localhost:5173`
- Gateway: `http://localhost:8080`
- Auth service: `http://localhost:4001`
- Catalog service: `http://localhost:4002`
- Order service: `http://localhost:4003`
- Content service: `http://localhost:4004`
- Notification service: `http://localhost:4005`


## Docker

The repo includes a root `Dockerfile.workspace` plus `docker-compose.yml` configured to build each workspace from the monorepo root so the shared package is available to every service.

```bash
docker compose up --build
```

## API Overview

### Auth service

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `GET /api/auth/addresses`
- `POST /api/auth/addresses`

### Catalog service

- `GET /api/catalog/meta`
- `GET /api/catalog/products`
- `GET /api/catalog/products/:slug`
- `GET /api/catalog/products/suggestions`
- `POST /api/catalog/products/:productId/reviews`
- `GET /api/catalog/wishlist`
- `POST /api/catalog/wishlist/toggle`
- `POST /api/catalog/coupons/validate`
- Admin CRUD under `/api/catalog/admin/*`

### Order service

- `GET /api/orders/cart`
- `PUT /api/orders/cart`
- `POST /api/orders/payments/intent`
- `POST /api/orders`
- `GET /api/orders/mine`
- Admin analytics and order management under `/api/orders/admin/*`

### Content service

- `GET /api/content/home`
- `GET /api/content/pages/:slug`
- Admin banner/content management under `/api/content/admin/*`

### Notification service

- `GET /api/notifications/mine`
- `PATCH /api/notifications/mine/:id/read`
- `GET /api/notifications/admin/all`

## Notes

- The microservices communicate through the gateway for client-facing traffic.
- Redis is intentionally used for more than caching: it also handles logout invalidation and cross-service order event fan-out.
- In production, preview authentication should stay disabled. The frontend now defaults to preview auth only during local development unless `VITE_USE_PREVIEW_AUTH=true`.
- Local image upload is implemented for product administration; Cloudinary can be layered in later if needed.

## Render Deployment

The repo now includes a Render blueprint at `render.yaml`.

### Recommended Render sequence

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and point it to the repo.
3. Let Render create:
   - `luxeva-frontend` as a static site
   - `luxeva-api-gateway` as the public API
   - `luxeva-auth-service`, `luxeva-catalog-service`, `luxeva-order-service`, `luxeva-content-service`, and `luxeva-notification-service` as private services
   - `luxeva-redis` as a Render Key Value instance
4. Before the first successful deploy, fill the `sync: false` environment variables in Render:
   - `MONGO_URI`
   - `CATALOG_MONGO_URI`
   - `ORDER_MONGO_URI`
   - `CONTENT_MONGO_URI`
   - `NOTIFICATION_MONGO_URI`
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `TWO_FACTOR_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `ADMIN_ALERT_EMAIL`
   - `ADMIN_ALERT_PHONE`
5. Use one Mongo Atlas cluster with separate databases or connection strings for each service. A common pattern is:
   - auth: `luxeva-auth`
   - catalog: `luxeva-catalog`
   - orders: `luxeva-order`
   - content: `luxeva-content`
   - notifications: `luxeva-notifications`
6. After the blueprint finishes, verify these health URLs:
   - frontend: Render static site URL
   - gateway: `/health`
   - auth: internal `/health`
   - catalog: internal `/health`
   - order: internal `/health`
   - content: internal `/health`
   - notification: internal `/health`

### Production checklist

- `VITE_USE_PREVIEW_AUTH=false`
- Mongo Atlas network access allows Render egress
- Redis is connected from Render Key Value or another reachable hosted Redis
- Gmail SMTP or another SMTP provider is configured for OTP and reset email
- Razorpay test or live keys are added only to the order service environment
- `FRONTEND_URL` points to the deployed frontend origin so CORS and reset-password links work
- The gateway points to the private Render service hostports, not localhost

### What is already production-safe in this repo

- Health endpoints exist on every service at `/health`
- Gateway proxy targets now accept Render private `host:port` values directly
- Frontend preview auth no longer turns on by default in production
- Razorpay online payment flow and COD flow both persist backend orders
- Redis failures degrade more gracefully during local development while production still fails fast if core databases are unavailable
