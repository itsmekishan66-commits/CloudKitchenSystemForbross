import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/get-site-settings";

export const alt = "Cloud Kitchen Delivery";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpengraphImage() {
  const { siteName } = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: "80px",
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            textShadow: "0 4px 16px rgba(0,0,0,0.3)",
            maxWidth: "900px",
            lineHeight: 1.1,
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            marginTop: "24px",
            fontSize: "34px",
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          Fresh Meals Delivered Fast
        </div>
        <div
          style={{
            marginTop: "48px",
            fontSize: "24px",
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            letterSpacing: "2px",
          }}
        >
          CLOUD KITCHEN DELIVERY
        </div>
      </div>
    ),
    { ...size }
  );
}