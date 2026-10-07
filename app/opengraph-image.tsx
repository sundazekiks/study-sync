import { ImageResponse } from "next/og";

export const alt = "StudySync — one course hub for collaborative study materials.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#0b1120",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "80px",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: "#6366f1",
            borderRadius: "24px",
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            height: 96,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            width: 96,
          }}
        >
          S
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>
          StudySync
        </div>
        <div
          style={{
            color: "#a1a1aa",
            display: "flex",
            fontSize: 40,
            marginTop: 24,
          }}
        >
          One course hub for collaborative study materials.
        </div>
      </div>
    ),
    { ...size }
  );
}