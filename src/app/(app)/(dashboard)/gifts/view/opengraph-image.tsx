import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Claim your Gift"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 30%, #a78bfa 60%, #6366f1 100%)",
        }}
      />

      {/* Organic wave shapes */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        viewBox="0 0 1200 630"
        preserveAspectRatio="none"
      >
        <path
          d="M0,200 Q300,100 600,200 T1200,150 L1200,0 L0,0 Z"
          fill="rgba(139, 92, 246, 0.5)"
        />
        <path
          d="M0,500 Q400,400 800,480 T1200,450 L1200,630 L0,630 Z"
          fill="rgba(99, 102, 241, 0.4)"
        />
        <path
          d="M-100,300 Q200,250 500,350 Q800,450 1100,300 Q1300,200 1200,400"
          fill="none"
          stroke="rgba(167, 139, 250, 0.3)"
          strokeWidth="100"
        />
      </svg>

      {/* Top-left hand */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -20,
          left: 40,
          width: 280,
          height: 280,
          transform: "rotate(15deg)",
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M50,10 C55,10 58,15 58,22 L58,45 C58,47 60,48 62,48 C64,48 66,46 66,44 L66,35 C66,30 70,28 74,30 C78,32 78,36 78,40 L78,55 C78,58 80,60 82,58 C84,56 86,52 86,48 L86,42 C86,38 90,36 93,38 C96,40 96,44 96,48 L96,65 C96,80 85,95 65,95 L55,95 C40,95 30,85 30,70 L30,55 C30,50 25,48 22,50 C19,52 18,56 18,60 L18,65 C18,68 15,70 12,68 C9,66 8,62 10,58 L15,45 C18,38 25,35 32,35 L40,35 C42,35 42,33 42,30 L42,20 C42,14 45,10 50,10 Z"
          fill="#4ade80"
          stroke="#22c55e"
          strokeWidth="1"
        />
      </svg>

      {/* Bottom-right hand */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -30,
          right: 20,
          width: 300,
          height: 300,
          transform: "rotate(-165deg)",
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M50,10 C55,10 58,15 58,22 L58,45 C58,47 60,48 62,48 C64,48 66,46 66,44 L66,35 C66,30 70,28 74,30 C78,32 78,36 78,40 L78,55 C78,58 80,60 82,58 C84,56 86,52 86,48 L86,42 C86,38 90,36 93,38 C96,40 96,44 96,48 L96,65 C96,80 85,95 65,95 L55,95 C40,95 30,85 30,70 L30,55 C30,50 25,48 22,50 C19,52 18,56 18,60 L18,65 C18,68 15,70 12,68 C9,66 8,62 10,58 L15,45 C18,38 25,35 32,35 L40,35 C42,35 42,33 42,30 L42,20 C42,14 45,10 50,10 Z"
          fill="#4ade80"
          stroke="#22c55e"
          strokeWidth="1"
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* NEAR Logo */}
        <svg
          aria-hidden="true"
          width="80"
          height="80"
          viewBox="0 0 90 90"
          style={{ marginBottom: 24 }}
        >
          <path
            d="M72.2 4.6L53.4 32.5c-1.3 1.9 1.2 4.2 3 2.6l16.3-14.1c.5-.4 1.2-.1 1.2.6v45.9c0 .6-.8.9-1.2.4L22.3 4.2c-2.7-3.1-6.6-4.9-10.7-4.9h-1.5C4.5-.7 0 4 0 9.7v70.6C0 85.9 4.6 90.6 10.3 90.6c3.6 0 6.9-1.8 8.8-4.9l18.8-27.9c1.3-1.9-1.2-4.2-3-2.6l-16.3 14.1c-.5.4-1.2.1-1.2-.6V23c0-.6.8-.9 1.2-.4l50.4 63.7c2.7 3.1 6.6 4.9 10.7 4.9h1.5c5.6 0 10.1-4.7 10.1-10.4V10.3c0-5.6-4.5-10.3-10.2-10.3-3.5 0-6.8 1.8-8.9 4.6z"
            fill="white"
          />
        </svg>

        {/* Text */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: "0.05em",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          CLAIM YOUR GIFT
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  )
}
