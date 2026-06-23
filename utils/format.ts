export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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