export const currency = (value = 0) => {
  const num = Number(value);
  const safeVal = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(safeVal);
};

export const shortDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(d);
  } catch {
    return "";
  }
};

export const cls = (...values) => values.filter(Boolean).join(" ");
