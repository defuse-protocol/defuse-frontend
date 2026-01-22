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

// SVG paths for the animated tokens to follow
// Container is 500x416, final segment at y=208 (middle)
// Top path: first vertical at x=100, last vertical at x=360 (shifted right), shorter final horizontal
const TOKEN_PATH_TOP =
  "M 0 50 L 80 50 Q 100 50 100 70 L 100 100 Q 100 120 120 120 L 340 120 Q 360 120 360 140 L 360 188 Q 360 208 380 208 L 500 208"

// Bottom path: first vertical at x=140, last vertical at x=300 (shifted left), longer final horizontal
const TOKEN_PATH_BOTTOM =
  "M 0 366 L 120 366 Q 140 366 140 346 L 140 316 Q 140 296 160 296 L 280 296 Q 300 296 300 276 L 300 228 Q 300 208 320 208 L 500 208"

// Total cycle = 144s (6 tokens × 24s gap)
// Varied durations (27-33s) for less monotonous animation
// Bottom offset by 12s to avoid overlap on shared segment
const TOKENS: {
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  delay: number
  duration: number
}[] = [
  // Top path tokens - slightly faster (27-30s)
  { path: TOKEN_PATH_TOP, icon: BtcIcon, delay: 0, duration: 28 },
  { path: TOKEN_PATH_TOP, icon: EthIcon, delay: 24, duration: 27 },
  { path: TOKEN_PATH_TOP, icon: UsdtIcon, delay: 48, duration: 29 },
  { path: TOKEN_PATH_TOP, icon: SolIcon, delay: 72, duration: 28 },
  { path: TOKEN_PATH_TOP, icon: XrpIcon, delay: 96, duration: 27 },
  { path: TOKEN_PATH_TOP, icon: DogeIcon, delay: 120, duration: 29 },
  // Bottom path tokens - slightly slower (31-33s)
  { path: TOKEN_PATH_BOTTOM, icon: UsdcIcon, delay: 12, duration: 32 },
  { path: TOKEN_PATH_BOTTOM, icon: BnbIcon, delay: 36, duration: 31 },
  { path: TOKEN_PATH_BOTTOM, icon: NearIcon, delay: 60, duration: 33 },
  { path: TOKEN_PATH_BOTTOM, icon: TrxIcon, delay: 84, duration: 32 },
  { path: TOKEN_PATH_BOTTOM, icon: AuroraIcon, delay: 108, duration: 31 },
  { path: TOKEN_PATH_BOTTOM, icon: ZecIcon, delay: 132, duration: 33 },
]

// Total cycle time for repeat calculation
const CYCLE_TIME = 144

function AnimatedTokenPath() {
  return (
    <div className="absolute -top-16 right-full -mr-12 w-[500px] h-[416px] pointer-events-none">
      <div className="relative size-full shrink-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 416"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e5e5e5" stopOpacity="0" />
              <stop offset="30%" stopColor="#e5e5e5" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Top path */}
          <path
            d={TOKEN_PATH_TOP}
            stroke="url(#pathGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Bottom path */}
          <path
            d={TOKEN_PATH_BOTTOM}
            stroke="url(#pathGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Animated tokens */}
        {TOKENS.map((token) => (
          <motion.div
            key={`${token.icon.name}-${token.delay}`}
            // className="absolute size-10"
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
