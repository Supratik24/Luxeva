import { getRedis } from "../config/redis.js";

export const publishEvent = async (channel, payload) => {
  try {
    const redis = getRedis();
    await redis.publish(channel, JSON.stringify(payload));
  } catch (error) {
    console.warn(`[Redis] Failed to publish event to ${channel}: ${error.message}`);
  }
};

