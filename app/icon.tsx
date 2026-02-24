import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: 6,
          border: "2px solid #e5e7eb",
        }}
      >
        {/* Clipart dashboard: 2x2 grid of cards inside a screen */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 3,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
          }}
        >
          <div style={{ display: "flex", gap: 2 }}>
            <div
              style={{
                width: 8,
                height: 8,
                background: "#3b82f6",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                background: "#22c55e",
                borderRadius: 1,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <div
              style={{
                width: 8,
                height: 8,
                background: "#f59e0b",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                background: "#8b5cf6",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
