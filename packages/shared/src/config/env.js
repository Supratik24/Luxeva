import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({
  path: path.resolve(import.meta.dirname, "../../../../.env"),
  override: false
});

export const getEnv = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const isProduction = process.env.NODE_ENV === "production";
