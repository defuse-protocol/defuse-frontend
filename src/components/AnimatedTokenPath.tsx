import clsx from "clsx"
import { motion } from "framer-motion"
import type { ComponentType, SVGProps } from "react"
import {
  AuroraIcon,
  BnbIcon,
  BtcIcon,
  DogeIcon,
  EthIcon,
  NearIcon,
  SolIcon,
  TrxIcon,
  UsdcIcon,
  UsdtIcon,
  XrpIcon,
  ZecIcon,
} from "../icons"

const TOKEN_PATH_TOP_LEFT =
  "M 0 50 L 80 50 Q 100 50 100 70 L 100 100 Q 100 120 120 120 L 340 120 Q 360 120 360 140 L 360 188 Q 360 208 380 208 L 500 208"
const TOKEN_PATH_BOTTOM_LEFT =
  "M 0 366 L 120 366 Q 140 366 140 346 L 140 316 Q 140 296 160 296 L 280 296 Q 300 296 300 276 L 300 228 Q 300 208 320 208 L 500 208"

const TOKEN_PATH_TOP_RIGHT =
  "M 500 50 L 420 50 Q 400 50 400 70 L 400 100 Q 400 120 380 120 L 160 120 Q 140 120 140 140 L 140 188 Q 140 208 120 208 L 0 208"
const TOKEN_PATH_BOTTOM_RIGHT =
  "M 500 366 L 380 366 Q 360 366 360 346 L 360 316 Q 360 296 340 296 L 220 296 Q 200 296 200 276 L 200 228 Q 200 208 180 208 L 0 208"

const CYCLE_TIME = 144

function getTokens(side: "left" | "right") {
  const pathTop = side === "left" ? TOKEN_PATH_TOP_LEFT : TOKEN_PATH_TOP_RIGHT
  const pathBottom =
    side === "left" ? TOKEN_PATH_BOTTOM_LEFT : TOKEN_PATH_BOTTOM_RIGHT

  return [
    // Top path tokens - slightly faster (27-29s)
    { path: pathTop, icon: BtcIcon, delay: 0, duration: 28 },
    { path: pathTop, icon: EthIcon, delay: 24, duration: 27 },
    { path: pathTop, icon: UsdtIcon, delay: 48, duration: 29 },
    { path: pathTop, icon: SolIcon, delay: 72, duration: 28 },
    { path: pathTop, icon: XrpIcon, delay: 96, duration: 27 },
    { path: pathTop, icon: DogeIcon, delay: 120, duration: 29 },
    // Bottom path tokens - slightly slower (31-33s)
    { path: pathBottom, icon: UsdcIcon, delay: 12, duration: 32 },
    { path: pathBottom, icon: BnbIcon, delay: 36, duration: 31 },
    { path: pathBottom, icon: NearIcon, delay: 60, duration: 33 },
    { path: pathBottom, icon: TrxIcon, delay: 84, duration: 32 },
    { path: pathBottom, icon: AuroraIcon, delay: 108, duration: 31 },
    { path: pathBottom, icon: ZecIcon, delay: 132, duration: 33 },
  ] as {
    path: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    delay: number
    duration: number
  }[]
}

function AnimatedTokenPath({ side = "left" }: { side?: "left" | "right" }) {
  const tokens = getTokens(side)
  const pathTop = side === "left" ? TOKEN_PATH_TOP_LEFT : TOKEN_PATH_TOP_RIGHT
  const pathBottom =
    side === "left" ? TOKEN_PATH_BOTTOM_LEFT : TOKEN_PATH_BOTTOM_RIGHT
  const gradientId = `pathGradient-${side}`

  return (
    <div
      className={clsx(
        "absolute -top-16 w-[500px] h-[416px] pointer-events-none select-none",
        side === "left" ? "right-full -mr-12" : "left-full -ml-12"
      )}
    >
      <div className="relative size-full shrink-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 416"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1={side === "left" ? "0%" : "100%"}
              y1="0%"
              x2={side === "left" ? "100%" : "0%"}
              y2="0%"
            >
              <stop offset="0%" stopColor="#e5e5e5" stopOpacity="0" />
              <stop offset="30%" stopColor="#e5e5e5" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Top path */}
          <path
            d={pathTop}
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Bottom path */}
          <path
            d={pathBottom}
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Animated tokens */}
        {tokens.map((token) => (
          <motion.div
            key={`${side}-${token.icon.name}-${token.delay}`}
            className="absolute size-10 overflow-hidden flex justify-center items-center rounded-full outline-1 outline-gray-900/10 -outline-offset-1"
            style={{
              offsetPath: `path("${token.path}")`,
              offsetRotate: "0deg",
              offsetAnchor: "center",
            }}
            initial={{
              offsetDistance: "0%",
              opacity: 0,
              scale: 0.75,
              filter: "blur(6px)",
            }}
            animate={{
              offsetDistance: "100%",
              opacity: [0, 1, 1, 1],
              scale: [0.75, 1, 1, 1],
              filter: ["blur(6px)", "blur(0px)", "blur(0px)", "blur(0px)"],
            }}
            transition={{
              duration: token.duration,
              delay: token.delay,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: CYCLE_TIME - token.duration,
              opacity: {
                duration: token.duration,
                delay: token.delay,
                times: [0, 5 / token.duration, 0.5, 1],
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: CYCLE_TIME - token.duration,
              },
              scale: {
                duration: token.duration,
                delay: token.delay,
                times: [0, 5 / token.duration, 0.5, 1],
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: CYCLE_TIME - token.duration,
              },
              filter: {
                duration: token.duration,
                delay: token.delay,
                times: [0, 5 / token.duration, 0.5, 1],
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: CYCLE_TIME - token.duration,
              },
            }}
          >
            <token.icon className="size-full" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default AnimatedTokenPath
