import Redis from "ioredis";

let redisClient;
let redisSubscriber;
let redisDisabled = false;

const memoryStore = new Map();

const createMemoryRedis = () => ({
  async get(key) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },
  async set(key, value) {
    memoryStore.set(key, value);
    return "OK";
  },
  async del(...keys) {
    keys.flat().forEach((key) => memoryStore.delete(key));
    return 1;
  },
  async keys(pattern = "*") {
    if (pattern === "*") {
      return [...memoryStore.keys()];
    }

    const regex = new RegExp(`^${pattern.replaceAll("*", ".*")}$`);
    return [...memoryStore.keys()].filter((key) => regex.test(key));
  },
  async publish() {
    return 0;
  },
  async subscribe() {
    return 0;
  },
  on() {
    return this;
  }
});

const createRedisClient = () => {
  if (redisDisabled || !process.env.REDIS_URL) {
    redisDisabled = true;
    return createMemoryRedis();
  }

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });

    client.on("error", (error) => {
      if (!redisDisabled) {
        redisDisabled = true;
        console.warn(`Redis unavailable, falling back to in-memory mode: ${error.message}`);
      }
    });

    return client;
  } catch (error) {
    redisDisabled = true;
    console.warn(`Redis setup failed, falling back to in-memory mode: ${error.message}`);
    return createMemoryRedis();
  }
};

export const getRedis = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }

  return redisClient;
};

export const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient();
  }

  return redisSubscriber;
};
