import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import MobileNav from "../components/MobileNav";

const NAV_LINKS = [
  { to: "/start", label: "Calculate" },
  { to: "/history", label: "History" },
  { to: "/insights", label: "Insights" },
];

const SHADOW_TEXT = "0 2px 12px rgba(0,0,0,0.4)";
const SHADOW_NAV = "0 1px 8px rgba(0,0,0,0.4)";

export default function NotFoundPage() {
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  // Same parallax feel as the landing hero, minus scroll/gyro — this page never scrolls.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const skyX = useTransform(smoothX, [-1, 1], [-8, 8]);
  const skyY = useTransform(smoothY, [-1, 1], [-4, 4]);
  const mountainX = useTransform(smoothX, [-1, 1], [-18, 18]);
  const mountainY = useTransform(smoothY, [-1, 1], [-10, 10]);
  const fgX = useTransform(smoothX, [-1, 1], [-30, 30]);
  const fgY = useTransform(smoothY, [-1, 1], [-16, 16]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
    mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      <MobileNav lightIcon />

      {/* ── Fixed photo layers ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ x: skyX, y: skyY, scale: 1.08 }}>
          <img src="/layers/final sky layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[1] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ x: mountainX, y: mountainY, scale: 1.08 }}>
          <img src="/layers/final mountain layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[2] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ x: fgX, y: fgY, scale: 1.08 }}>
          <img src="/layers/final foreground layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[3] pointer-events-none bg-black/40" />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col" style={{ minHeight: "100dvh" }}>
        {/* Desktop nav — hidden on mobile */}
        <nav className="flex-none items-center justify-between px-6 sm:px-10 py-6 hidden md:flex">
          <Link
            to="/"
            className="text-white font-extrabold text-xl tracking-tight"
            style={{ textShadow: SHADOW_NAV }}
          >
            Greenr
          </Link>
          <div className="flex gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="btn-underline text-sm"
                style={{ color: "white", textShadow: SHADOW_NAV }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex-none h-14 md:hidden" />

        {/* Hero copy */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div
            className="font-extrabold leading-none select-none"
            style={{
              fontSize: "clamp(5rem, 18vw, 10rem)",
              letterSpacing: "-0.03em",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            404
          </div>
          <h1
            className="text-white font-extrabold leading-tight"
            style={{
              fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)",
              letterSpacing: "-0.01em",
              textShadow: SHADOW_TEXT,
              marginTop: "-1rem",
            }}
          >
            you've wandered off the trail
          </h1>
          <p
            className="text-white font-normal text-base md:text-[1.1rem]"
            style={{ textShadow: SHADOW_TEXT, marginTop: "0.75rem", maxWidth: 440 }}
          >
            this page doesn't exist, or it's been moved somewhere else.
          </p>

          <div
            className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-3 w-full max-w-xs md:max-w-none md:w-auto"
            style={{ marginTop: "2.5rem" }}
          >
            <Link
              to="/"
              className="text-white font-bold px-7 py-3 text-sm text-center"
              style={{ background: "rgba(255,255,255,0.15)", textShadow: SHADOW_TEXT }}
            >
              back to basecamp
            </Link>
            <Link
              to="/start"
              className="text-white font-medium px-7 py-3 text-sm text-center"
              style={{ background: "rgba(255,255,255,0.15)", textShadow: SHADOW_TEXT }}
            >
              calculate your footprint
            </Link>
          </div>
        </div>

        <div className="flex-none pb-8 flex flex-col items-center gap-3">
          <span className="text-white font-normal" style={{ opacity: 0.35, fontSize: "0.65rem", letterSpacing: "0.04em" }}>
            made with ♡, by{" "}
            <a
              href="https://pyne.dev"
              target="_blank"
              rel="noreferrer"
              className="text-white"
              style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              victor
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
