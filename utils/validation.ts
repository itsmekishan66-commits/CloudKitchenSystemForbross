export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return { valid: errors.length === 0, errors };
}

export function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidOrderStatus(
  status: string
): status is
  | "Pending"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled" {
  return [
    "Pending",
    "Preparing",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ].includes(status);
}

export function isValidPaymentMethod(
  method: string
): method is "COD" | "ONLINE" {
  return ["COD", "ONLINE"].includes(method);
}
