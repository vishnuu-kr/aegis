import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface RotatingWordProps {
  words?: string[]
  intervalMs?: number
}

export default function RotatingWord({
  words = ["identity", "policy", "audit trail"],
  intervalMs = 2800,
}: RotatingWordProps) {
  const [index, setIndex] = useState(0)
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })
  const [widths, setWidths] = useState<number[]>([])
  const measureRef = useRef<HTMLDivElement>(null)

  // Measure widths on mount, font load, and screen resize
  useEffect(() => {
    const measure = () => {
      if (!measureRef.current) return
      const children = measureRef.current.children
      const measured: number[] = []
      for (let i = 0; i < children.length; i++) {
        measured.push(children[i].getBoundingClientRect().width)
      }
      setWidths(measured)
    }

    // Run initial measurement after a brief timeout to ensure styles and fonts are fully loaded
    const timer = setTimeout(measure, 100)

    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", measure)
    }
  }, [words])

  // Handle prefers-reduced-motion and intervals
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }
    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  useEffect(() => {
    if (prefersReduced) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [prefersReduced, words.length, intervalMs])

  const activeWord = prefersReduced ? words[0] : words[index]
  const currentWidth = widths[index]

  return (
    <>
      {/* Hidden off-screen container for exact font-size measurements */}
      <div 
        ref={measureRef} 
        style={{ 
          position: "absolute", 
          visibility: "hidden", 
          pointerEvents: "none", 
          userSelect: "none",
          whiteSpace: "nowrap",
          left: -9999,
          top: -9999
        }}
      >
        {words.map((w) => (
          <span 
            key={w} 
            style={{ 
              padding: "0.08em 0.55em", 
              border: "1px solid transparent", 
              fontSize: "clamp(36px, 5.2vw, 60px)", 
              fontWeight: "inherit",
              letterSpacing: "-.025em",
              lineHeight: "1.1",
              fontFamily: "inherit"
            }}
          >
            {w}
          </span>
        ))}
      </div>

      <span 
        style={{
          display: "inline-flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "999px",
          border: "1px solid var(--line-soft)",
          verticalAlign: "middle",
          margin: "0 0.15em",
          color: "var(--crimson)",
          background: "var(--surface-2)",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          transition: "width 0.42s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
          lineHeight: "1.1",
          width: currentWidth ? `${currentWidth}px` : "auto",
          height: "1.34em",
          overflow: "hidden"
        }}
      >
        {/* Animated changing word */}
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={prefersReduced ? {} : { opacity: 0, y: 12, filter: "blur(2px)" }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={prefersReduced ? {} : { opacity: 0, y: -12, filter: "blur(2px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              color: "var(--crimson)",
              fontWeight: "inherit"
            }}
          >
            {activeWord}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}
