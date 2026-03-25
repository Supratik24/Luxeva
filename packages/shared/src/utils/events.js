import { getRedis } from "../config/redis.js";

export const publishEvent = async (channel, payload) => {
  const redis = getRedis();
  await redis.publish(channel, JSON.stringify(payload));
};

