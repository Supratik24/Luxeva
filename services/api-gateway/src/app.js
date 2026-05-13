import { createProxyMiddleware } from "http-proxy-middleware";
import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";

const app = createServiceApp({ serviceName: "api-gateway", rateLimitMax: 300, parseBody: false });

const normalizeServiceUrl = (value, fallback) => {
  const target = String(value || fallback || "").trim();
  if (!target) {
    throw new Error("Missing proxy target");
  }

  return /^https?:\/\//i.test(target) ? target : `http://${target}`;
};

const restreamBody = (proxyReq, req) => {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }

  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader("Content-Type", "application/json");
  proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
};

const proxyConfig = (target, prefix) => ({
  target,
  changeOrigin: true,
  xfwd: true,
  pathRewrite: (path) => `${prefix}${path}`,
  onProxyReq: restreamBody,
  logLevel: "warn"
});

app.use(
  "/api/auth",
  createProxyMiddleware(proxyConfig(normalizeServiceUrl(process.env.AUTH_SERVICE_URL, "localhost:4001"), "/api/auth"))
);
app.use(
  "/api/users",
  createProxyMiddleware(proxyConfig(normalizeServiceUrl(process.env.AUTH_SERVICE_URL, "localhost:4001"), "/api/users"))
);
app.use(
  "/api/catalog",
  createProxyMiddleware(
    proxyConfig(normalizeServiceUrl(process.env.CATALOG_SERVICE_URL, "localhost:4002"), "/api/catalog")
  )
);
app.use(
  "/api/orders",
  createProxyMiddleware(proxyConfig(normalizeServiceUrl(process.env.ORDER_SERVICE_URL, "localhost:4003"), "/api/orders"))
);
app.use(
  "/api/content",
  createProxyMiddleware(
    proxyConfig(normalizeServiceUrl(process.env.CONTENT_SERVICE_URL, "localhost:4004"), "/api/content")
  )
);
app.use(
  "/api/notifications",
  createProxyMiddleware(
    proxyConfig(normalizeServiceUrl(process.env.NOTIFICATION_SERVICE_URL, "localhost:4005"), "/api/notifications")
  )
);

attachErrorHandlers(app);

export default app;
