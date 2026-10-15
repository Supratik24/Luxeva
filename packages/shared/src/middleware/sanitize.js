/**
 * Input Sanitization Middleware:
 * Protects against NoSQL Operator Injection and Cross-Site Scripting (XSS).
 */

const cleanNoSqlString = (str) => {
  if (typeof str !== "string") return str;
  return str;
};

const cleanNoSqlObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanNoSqlObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip keys starting with '$' (e.g. $gt, $ne, $where, $regex) or containing '.'
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }

    if (value && typeof value === "object") {
      cleaned[key] = cleanNoSqlObject(value);
    } else if (typeof value === "string") {
      cleaned[key] = cleanNoSqlString(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const cleanXssString = (val) => {
  if (typeof val !== "string") return val;
  // Neutralize dangerous HTML tags and script vectors while preserving safe text
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    .replace(/javascript:[^"'>\s]+/gi, "");
};

const cleanXssObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanXssObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      cleaned[key] = cleanXssString(value);
    } else if (value && typeof value === "object") {
      cleaned[key] = cleanXssObject(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

/**
 * Express Middleware: Deep sanitizes req.body, req.query, and req.params
 */
export const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = cleanXssObject(cleanNoSqlObject(req.body));
    }

    if (req.query && typeof req.query === "object") {
      req.query = cleanXssObject(cleanNoSqlObject(req.query));
    }

    if (req.params && typeof req.params === "object") {
      req.params = cleanXssObject(cleanNoSqlObject(req.params));
    }

    next();
  } catch (err) {
    next(err);
  }
};
