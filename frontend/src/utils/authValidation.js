export const validateEmail = (email = "") => {
  const normalized = String(email).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const validatePasswordStrength = (password = "") => {
  const value = String(password);

  return {
    minLength: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value)
  };
};

export const isStrongPassword = (password = "") =>
  Object.values(validatePasswordStrength(password)).every(Boolean);

export const getPasswordError = (password = "") => {
  if (!password) {
    return "Password is required";
  }

  if (!isStrongPassword(password)) {
    return "Use 8+ characters with uppercase, lowercase, number, and special character";
  }

  return "";
};

export const validatePhone = (phone = "") => /^[0-9+\-\s()]{10,}$/.test(String(phone).trim());

export const maskPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) {
    return digits;
  }

  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};
