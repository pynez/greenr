import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
} from "framer-motion";
import MobileNav from "../components/MobileNav";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/start", label: "Calculate" },
  { to: "/history", label: "History" },
  { to: "/insights", label: "Insights" },
];

const SHADOW_TEXT = "0 2px 12px rgba(0,0,0,0.4)";
const SHADOW_NAV = "0 1px 8px rgba(0,0,0,0.4)";
const SECTION_BG = "rgba(245, 240, 232, 0.88)";

const vh = typeof window !== "undefined" ? window.innerHeight : 800;

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  // ── Parallax motion values (shared between mouse & gyroscope) ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { stiffness: 80, damping: 20 };
  const smoothX = useSpring(mouseX, springCfg);
  const smoothY = useSpring(mouseY, springCfg);

  // Mobile: use tighter parallax ranges per spec
  const skyX = useTransform(smoothX, [-1, 1], isMobile ? [-6, 6] : [-8, 8]);
  const skyY = useTransform(smoothY, [-1, 1], isMobile ? [-3, 3] : [-4, 4]);
  const mountainX = useTransform(smoothX, [-1, 1], isMobile ? [-14, 14] : [-18, 18]);
  const mountainY = useTransform(smoothY, [-1, 1], isMobile ? [-8, 8] : [-10, 10]);
  const fgX = useTransform(smoothX, [-1, 1], isMobile ? [-24, 24] : [-30, 30]);
  const fgY = useTransform(smoothY, [-1, 1], isMobile ? [-13, 13] : [-16, 16]);

  // ── Scroll-driven blur + overlay ──
  const { scrollY } = useScroll();
  const blurFilter = useTransform(
    scrollY,
    [0, vh, vh * 20],
    ["blur(0px)", "blur(10px)", "blur(10px)"]
  );
  const scrollOverlay = useTransform(scrollY, [0, vh, vh * 20], [0, 0.35, 0.35]);

  // ── Desktop: cursor parallax ──
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

  // ── Mobile: gyroscope parallax ──
  const gyroState = useRef({ beta: 45, gamma: 0 });
  const gyroAttached = useRef(false);
  const gyroHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const [showMotionPrompt, setShowMotionPrompt] = useState(false);

  // Keep handler up-to-date (stable ref pattern)
  useEffect(() => {
    gyroHandlerRef.current = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 45;

      // Low-pass: 85% old + 15% new
      gyroState.current.gamma = gyroState.current.gamma * 0.85 + gamma * 0.15;
      gyroState.current.beta = gyroState.current.beta * 0.85 + beta * 0.15;

      // Normalize to -1..1 (gamma: ÷45; beta: offset 45 then ÷45)
      const nx = Math.max(-1, Math.min(1, gyroState.current.gamma / 45));
      const ny = Math.max(-1, Math.min(1, (gyroState.current.beta - 45) / 45));

      mouseX.set(nx);
      mouseY.set(ny);
    };
  }, [mouseX, mouseY]);

  const attachGyro = useCallback(() => {
    if (gyroAttached.current || !gyroHandlerRef.current) return;
    window.addEventListener("deviceorientation", gyroHandlerRef.current);
    gyroAttached.current = true;
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const stored = localStorage.getItem("greenr_motion_permission");
    const needsPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";

    if (!needsPermission) {
      attachGyro();
    } else if (stored === "granted") {
      attachGyro();
    } else if (stored !== "denied") {
      setShowMotionPrompt(true);
    }

    return () => {
      if (gyroHandlerRef.current) {
        window.removeEventListener("deviceorientation", gyroHandlerRef.current);
      }
    };
  }, [isMobile, attachGyro]);

  const handleMotionRequest = async () => {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === "granted") {
        localStorage.setItem("greenr_motion_permission", "granted");
        attachGyro();
      } else {
        localStorage.setItem("greenr_motion_permission", "denied");
      }
    } catch {
      localStorage.setItem("greenr_motion_permission", "denied");
    }
    setShowMotionPrompt(false);
  };

  // Animation durations scaled for mobile
  const dur = (d: number) => d * (isMobile ? 0.75 : 1);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: dur(0.5), ease: "easeOut" },
    },
  };

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Mobile hamburger — light icon for dark hero */}
      <MobileNav lightIcon />

      {/* ── Fixed photo layers ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ x: skyX, y: skyY, scale: 1.08, filter: blurFilter }}
        >
          <img src="/layers/final sky layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[1] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ x: mountainX, y: mountainY, scale: 1.08, filter: blurFilter }}
        >
          <img src="/layers/final mountain layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[2] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ x: fgX, y: fgY, scale: 1.08, filter: blurFilter }}
        >
          <img src="/layers/final foreground layer.png" alt="" className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="fixed inset-0 z-[3] pointer-events-none bg-black/30" />
      <motion.div
        className="fixed inset-0 z-[4] pointer-events-none bg-black"
        style={{ opacity: scrollOverlay }}
      />

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* Hero viewport */}
        <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
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

          {/* Mobile: minimal top spacer so content isn't behind hamburger */}
          <div className="flex-none h-14 md:hidden" />

          {/* Hero copy */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <h1
              className="text-white font-extrabold leading-none"
              style={{
                fontSize: "clamp(3rem, 8vw, 5rem)",
                letterSpacing: "-0.02em",
                textShadow: SHADOW_TEXT,
                marginTop: "-5vh",
              }}
            >
              Greenr
            </h1>
            <p
              className="text-white font-normal text-base md:text-[1.25rem]"
              style={{ textShadow: SHADOW_TEXT, marginTop: "0.75rem" }}
            >
              Carbon footprints, made simple.
            </p>

            {/* CTAs: stacked on mobile, side-by-side on desktop */}
            <div
              className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-3 w-full max-w-xs md:max-w-none md:w-auto"
              style={{ marginTop: "2.5rem" }}
            >
              <Link
                to="/start"
                className="text-white font-bold px-7 py-3 text-sm text-center"
                style={{ background: "rgba(255,255,255,0.15)", textShadow: SHADOW_TEXT }}
              >
                Calculate now
              </Link>
              <a
                href="https://github.com/pynez/greenr"
                target="_blank"
                rel="noreferrer"
                className="text-white font-medium px-7 py-3 text-sm text-center"
                style={{ background: "rgba(255,255,255,0.15)", textShadow: SHADOW_TEXT }}
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Bottom: motion prompt (iOS) + scroll indicator + footer */}
          <div className="flex-none pb-8 flex flex-col items-center gap-3 pointer-events-none">
            {showMotionPrompt && (
              <button
                onClick={handleMotionRequest}
                className="btn-underline pointer-events-auto"
                style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem" }}
              >
                enable motion for full experience
              </button>
            )}
            <span className="text-white font-normal" style={{ opacity: 0.35, fontSize: "0.65rem", letterSpacing: "0.04em" }}>
              made with ♡, by{" "}
              <a
                href="https://pyne.dev"
                target="_blank"
                rel="noreferrer"
                className="text-white pointer-events-auto"
                style={{ textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                victor
              </a>
            </span>
            <span className="text-white text-xs font-normal" style={{ opacity: 0.6 }}>
              scroll to explore
            </span>
            <motion.div
              style={{ opacity: 0.6 }}
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: dur(1.5), ease: "easeInOut" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 2.5L7 11.5M7 11.5L3 7.5M7 11.5L11 7.5"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* ── Section 1: How it works ──────────────────────────────────────── */}
        <section style={{ background: SECTION_BG, padding: "120px 0" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 860 }}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
            >
              <SectionLabel>how it works</SectionLabel>
            </motion.div>

            {/* Desktop: 3-column grid. Mobile: stacked with rules + 60px gaps */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 md:gap-10">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ delay: i * 0.1 }}
                  className={i > 0 ? "pt-[60px] md:pt-0" : ""}
                >
                  <div
                    className="font-extrabold leading-none select-none"
                    style={{
                      fontSize: "4.5rem",
                      color: "rgba(45, 90, 27, 0.15)",
                      lineHeight: 1,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-bold text-warm-dark" style={{ fontSize: "1.25rem" }}>
                    {step.title}
                  </div>
                  <div className="text-warm-mid mt-3 leading-relaxed" style={{ fontSize: "1rem" }}>
                    {step.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: Why it matters ────────────────────────────────────── */}
        <section style={{ background: SECTION_BG, padding: "120px 0" }}>
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 640 }}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              className="space-y-8"
            >
              <SectionLabel>why it matters</SectionLabel>

              <blockquote
                className="font-extrabold text-warm-dark leading-tight"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}
              >
                the average American produces 14 tCO2e per year. the global target is 2.
              </blockquote>

              <p className="text-warm-mid text-base md:text-[1.1rem]" style={{ lineHeight: 1.8 }}>
                most people have no idea what their footprint looks like or where it comes from.
                Greenr changes that. understanding your impact is the first step toward reducing it.
              </p>

              <div className="pt-2">
                <Link
                  to="/start"
                  className="btn-underline"
                  style={{ color: "#2D5A1B", fontSize: "0.875rem" }}
                >
                  calculate yours
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Section 3: Feature highlights ───────────────────────────────── */}
        <section style={{ background: SECTION_BG, padding: "120px 0" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 860 }}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
            >
              <SectionLabel>what greenr offers</SectionLabel>
            </motion.div>

            <div className="mt-16">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur(0.5), ease: "easeOut", delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-10%" }}
                  style={{
                    borderTop: i === 0 ? "1px solid rgba(214,207,196,0.7)" : undefined,
                    borderBottom: "1px solid rgba(214,207,196,0.7)",
                    padding: "2.5rem 0",
                  }}
                >
                  <div className="font-bold text-warm-dark" style={{ fontSize: "1.1rem" }}>
                    {feat.name}
                  </div>
                  <div className="text-warm-mid mt-3" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
                    {feat.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA bar ────────────────────────────────────────────────── */}
        <div
          className="bg-forest w-full flex flex-col items-center justify-center gap-6 text-center"
          style={{ padding: "80px 24px" }}
        >
          <p className="text-white font-bold" style={{ fontSize: "1.5rem" }}>
            ready to see your footprint?
          </p>
          <Link to="/start" className="btn-underline-light text-sm">
            get started
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-center text-forest font-medium uppercase"
      style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}
    >
      {children}
    </div>
  );
}

// ─── Content data ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    title: "answer a few questions",
    description: "tell us about your home, travel, diet, and habits. it takes under five minutes.",
  },
  {
    title: "see your footprint",
    description: "get your annual carbon footprint broken down by category, calculated from real emissions data.",
  },
  {
    title: "know where to start",
    description: "understand which habits have the biggest impact and what changes would matter most.",
  },
];

const FEATURES = [
  {
    name: "quick estimate",
    description: "answer seven questions and get your footprint in under a minute. uses national averages where data is missing.",
  },
  {
    name: "full questionnaire",
    description: "go deeper with detailed inputs across energy, travel, diet, and consumption for a more accurate breakdown.",
  },
  {
    name: "history and insights",
    description: "track your footprint over time and compare scenarios to see exactly how your choices change your impact.",
  },
];
