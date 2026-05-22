const { spawn } = require("node:child_process");

const gatewayPort = String(process.env.PORT || 8080);

const internalServiceUrls = {
  AUTH_SERVICE_URL: "http://127.0.0.1:4001",
  CATALOG_SERVICE_URL: "http://127.0.0.1:4002",
  ORDER_SERVICE_URL: "http://127.0.0.1:4003",
  CONTENT_SERVICE_URL: "http://127.0.0.1:4004",
  NOTIFICATION_SERVICE_URL: "http://127.0.0.1:4005"
};

const services = [
  {
    name: "auth-service",
    workspace: "services/auth-service",
    port: "4001"
  },
  {
    name: "catalog-service",
    workspace: "services/catalog-service",
    port: "4002"
  },
  {
    name: "order-service",
    workspace: "services/order-service",
    port: "4003"
  },
  {
    name: "content-service",
    workspace: "services/content-service",
    port: "4004"
  },
  {
    name: "notification-service",
    workspace: "services/notification-service",
    port: "4005"
  },
  {
    name: "api-gateway",
    workspace: "services/api-gateway",
    port: gatewayPort,
    extraEnv: internalServiceUrls
  }
];

const children = new Map();
let shuttingDown = false;

const prefixOutput = (serviceName, stream, chunk) => {
  const lines = chunk.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line) {
      stream.write(`[${serviceName}] ${line}\n`);
    }
  }
};

const stopAll = (signal = "SIGTERM") => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

const startService = ({ name, workspace, port, extraEnv = {} }) => {
  const child = spawn("npm", ["run", "start", "--workspace", workspace], {
    env: {
      ...process.env,
      ...extraEnv,
      PORT: port
    },
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"]
  });

  children.set(name, child);
  child.stdout.on("data", (chunk) => prefixOutput(name, process.stdout, chunk));
  child.stderr.on("data", (chunk) => prefixOutput(name, process.stderr, chunk));
  child.on("exit", (code, signal) => {
    children.delete(name);

    if (shuttingDown) {
      return;
    }

    console.error(`[supervisor] ${name} exited with code ${code ?? "none"} signal ${signal ?? "none"}`);
    stopAll();
    process.exitCode = code || 1;
  });

  child.on("error", (error) => {
    console.error(`[supervisor] failed to start ${name}: ${error.message}`);
    stopAll();
    process.exitCode = 1;
  });
};

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
process.on("exit", () => stopAll());

const main = async () => {
  if (String(process.env.SEED_ON_START || "").toLowerCase() === "true") {
    console.log("[supervisor] Running startup seed check before launching backend services.");
    const { runSeed } = await import("./seed-all.js");
    await runSeed({ force: String(process.env.SEED_FORCE || "").toLowerCase() === "true" });
  }

  console.log(`[supervisor] Starting backend services. Gateway will listen on port ${gatewayPort}.`);
  for (const service of services) {
    startService(service);
  }
};

main().catch((error) => {
  console.error(`[supervisor] startup failed: ${error.message}`);
  process.exit(1);
});
