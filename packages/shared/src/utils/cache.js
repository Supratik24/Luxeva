export const buildCacheKey = (prefix, payload) =>
  `${prefix}:${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;

