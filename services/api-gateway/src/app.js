import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";

const app = createServiceApp({ serviceName: "api-gateway", rateLimitMax: 300 });

const proxyConfig = (target, prefix) => ({
  target,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path) => `${prefix}${path}`,
  on: {
    proxyReq: fixRequestBody
  },
  logLevel: "warn"
});

app.use(
  "/api/auth",
  createProxyMiddleware(proxyConfig(process.env.AUTH_SERVICE_URL || "http://localhost:4001", "/api/auth"))
);
app.use(
  "/api/users",
  createProxyMiddleware(proxyConfig(process.env.AUTH_SERVICE_URL || "http://localhost:4001", "/api/users"))
);
app.use(
  "/api/catalog",
  createProxyMiddleware(proxyConfig(process.env.CATALOG_SERVICE_URL || "http://localhost:4002", "/api/catalog"))
);
app.use(
  "/api/orders",
  createProxyMiddleware(proxyConfig(process.env.ORDER_SERVICE_URL || "http://localhost:4003", "/api/orders"))
);
app.use(
  "/api/content",
  createProxyMiddleware(proxyConfig(process.env.CONTENT_SERVICE_URL || "http://localhost:4004", "/api/content"))
);
app.use(
  "/api/notifications",
  createProxyMiddleware(
    proxyConfig(process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005", "/api/notifications")
  )
);

attachErrorHandlers(app);

export default app;
