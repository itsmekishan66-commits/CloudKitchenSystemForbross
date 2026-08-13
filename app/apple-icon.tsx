import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/get-site-settings";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default async function AppleIcon() {
  const { siteName } = await getSiteSettings();
  const initial = (siteName || "C").trim().charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
        }}
      >
        <span
          style={{
            fontSize: "110px",
            fontWeight: 800,
            color: "white",
          }}
        >
          {initial}
        </span>
      </div>
    ),
    { ...size }
  );
}