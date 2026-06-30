const FALLBACK_IMAGE = "/images/hero-bg.png";

export function safeImageUrl(src: string): string {
  if (!src) return FALLBACK_IMAGE;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      new URL(src);
      return src;
    } catch {
      return FALLBACK_IMAGE;
    }
  }
  if (src.startsWith("/")) {
    return src;
  }
  return FALLBACK_IMAGE;
}
