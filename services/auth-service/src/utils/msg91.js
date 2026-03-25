const MSG91_BASE_URL = "https://api.msg91.com/api";

const normalizePhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

const buildQuery = (params) => new URLSearchParams(params).toString();

export const sendResetOtp = async ({ phone, otp }) => {
  if (!process.env.MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  const mobile = normalizePhone(phone);
  const url = `${MSG91_BASE_URL}/sendotp.php?${buildQuery({
    authkey: process.env.MSG91_AUTH_KEY,
    mobile,
    otp,
    otp_expiry: 10
  })}`;

  const response = await fetch(url, {
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.type === "error") {
    throw new Error(data.message || "Failed to send OTP");
  }

  return {
    success: true,
    mobile
  };
};

export const verifyResetOtp = async ({ phone, otp }) => {
  if (!process.env.MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY is not configured");
  }

  const mobile = normalizePhone(phone);
  const url = `${MSG91_BASE_URL}/verifyRequestOTP.php?${buildQuery({
    authkey: process.env.MSG91_AUTH_KEY,
    mobile,
    otp
  })}`;

  const response = await fetch(url, {
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.type === "error") {
    throw new Error(data.message || "OTP verification failed");
  }

  return data;
};

export const formatIndianPhone = (phone = "") => normalizePhone(phone);
