const normalizePhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

export const sendResetOtp = async ({ phone, otp }) => {
  if (!process.env.TWO_FACTOR_API_KEY) {
    throw new Error("TWO_FACTOR_API_KEY is not configured");
  }

  const mobile = normalizePhone(phone);
  const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${mobile}/${otp}`;

  const response = await fetch(url, {
    method: "POST"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.Status === "Error") {
    throw new Error(data.Details || "Failed to send OTP");
  }

  return {
    success: true,
    mobile,
    details: data.Details
  };
};

export const formatIndianPhone = (phone = "") => normalizePhone(phone);
