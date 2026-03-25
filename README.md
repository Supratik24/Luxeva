# Luxeva Commerce Platform

Luxeva is a modern full-stack eCommerce platform built with a React storefront, a hidden role-protected admin portal, and a Node.js microservices backend using MongoDB and Redis.

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
- Payments: Stripe-ready payment intent endpoint
- Uploads: Local multi-image upload support for admin product management

## Highlights

- Premium responsive storefront with polished typography, search suggestions, filters, quick view, wishlist, cart, checkout, and account dashboard
- Secure hidden admin login at `/portal/admin/login`
- Backend-enforced role-based access control for every admin API route
- Product, category, brand, coupon, review, banner, content, user, cart, order, and notification models
- Redis-backed catalog caching and order event fan-out
- Sales analytics, low-stock alerts, admin notifications, and status updates
- Seed data for products, content, customers, admin users, carts, orders, and notifications

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
- `STRIPE_SECRET_KEY`

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

### 3. Seed the databases

```bash
npm run seed
```

### 4. Run everything

```bash
npm run dev
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
- Stripe is wired as a backend endpoint and can be completed by adding real keys and frontend payment UI enhancements.
- Local image upload is implemented for product administration; Cloudinary can be layered in later if needed.
