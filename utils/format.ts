export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = toDate(date);

  return d.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kathmandu",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = toDate(date);

  return d.toLocaleString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kathmandu",
  });
}

// The database stores datetimes as Asia/Kathmandu wall-clock time, but the
// driver tags them with a "Z" (UTC) or returns them as naive strings. In every
// case we want to display the stored wall-clock as Asia/Kathmandu time, so we
// strip any timezone marker and re-anchor the value to +05:45. The
// Asia/Kathmandu formatting below then converts it back to the same wall-clock.
function toDate(date: Date | string): Date {
  let s: string;
  if (typeof date === "string") {
    s = date.trim();
  } else {
    s = date.toISOString();
  }
  s = s.replace(" ", "T");
  s = s.replace(/Z$/, "").replace(/[+-]\d{2}:?\d{2}$/, "");
  return new Date(s + "+05:45");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  // Nepal mobile number (98XXXXXXXX)
  if (cleaned.length === 10) {
    return `+977 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Already contains country code
  if (cleaned.length === 13 && cleaned.startsWith("977")) {
    return `+977 ${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }

  return phone;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}