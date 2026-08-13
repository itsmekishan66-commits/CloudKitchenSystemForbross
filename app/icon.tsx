import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/get-site-settings";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: "12px",
        }}
      >
        <span
          style={{
            fontSize: "40px",
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