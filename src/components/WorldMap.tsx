import { useMemo, useRef } from "react"
import { motion } from "framer-motion"
import DottedMap from "dotted-map"

interface Point {
  lat: number
  lng: number
  label?: string
}

interface WorldMapProps {
  dots?: Array<{ start: Point; end: Point }>
  /** Arc / endpoint color. Defaults to the Aegis crimson. */
  lineColor?: string
  /** Current app theme. Controls dotted-map silhouette color. */
  theme?: "light" | "dark"
}

// Equirectangular projection onto the 800x400 viewBox — matches dotted-map's grid.
const projectPoint = (lat: number, lng: number) => {
  const x = (lng + 180) * (800 / 360)
  const y = (90 - lat) * (400 / 180)
  return { x, y }
}

const createCurvedPath = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const midX = (start.x + end.x) / 2
  const midY = Math.min(start.y, end.y) - 50
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
}

export default function WorldMap({
  dots = [],
  lineColor = "#a91b2c",
  theme = "light",
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Generating the dotted silhouette is expensive — only redo it when theme flips.
  const svgMap = useMemo(() => {
    const map = new DottedMap({ height: 60, grid: "diagonal" })
    return map.getSVG({
      radius: 0.22,
      color: theme === "dark" ? "#ffffff2e" : "#16140f3d",
      shape: "circle",
      backgroundColor: "transparent",
    })
  }, [theme])

  return (
    <div className="aeg-worldmap" style={{ position: "relative", width: "100%", height: "100%", fontFamily: "inherit" }}>
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        style={{
          height: "100%",
          width: "100%",
          objectFit: "contain",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, white 12%, white 88%, transparent)",
          maskImage:
            "linear-gradient(to bottom, transparent, white 12%, white 88%, transparent)",
          pointerEvents: "none",
          userSelect: "none",
        }}
        alt="world map"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <defs>
          <linearGradient id="aeg-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)
          return (
            <motion.path
              key={`path-${i}`}
              d={createCurvedPath(startPoint, endPoint)}
              fill="none"
              stroke="url(#aeg-path-gradient)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, delay: 0.4 * i, ease: "easeOut" }}
            />
          )
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)
          return (
            <g key={`points-${i}`}>
              {[startPoint, endPoint].map((p, j) => (
                <g key={j}>
                  <circle cx={p.x} cy={p.y} r="2" fill={lineColor} />
                  <circle cx={p.x} cy={p.y} r="2" fill={lineColor} opacity="0.5">
                    <animate
                      attributeName="r"
                      from="2"
                      to="8"
                      dur="1.6s"
                      begin={`${0.4 * i}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="1.6s"
                      begin={`${0.4 * i}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
