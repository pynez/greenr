import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { to: "/start", label: "Calculate" },
  { to: "/history", label: "History" },
  { to: "/insights", label: "Insights" },
];

export default function MobileNav({ lightIcon = false }: { lightIcon?: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const iconColor = lightIcon ? "white" : "#2D5A1B";

  return (
    <>
      {/* Hamburger — fixed top-right, mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed z-50 flex flex-col items-center justify-center gap-[5px]"
        style={{
          top: 16,
          right: 20,
          width: 48,
          height: 48,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span style={{ width: 24, height: 2, background: iconColor, display: "block", borderRadius: 0 }} />
        <span style={{ width: 24, height: 2, background: iconColor, display: "block", borderRadius: 0 }} />
        <span style={{ width: 24, height: 2, background: iconColor, display: "block", borderRadius: 0 }} />
      </button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] md:hidden flex flex-col"
            style={{
              background: "rgba(245, 240, 232, 0.96)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Top bar: wordmark + close */}
            <div className="flex items-center justify-between px-6 py-5">
              <Link
                to="/"
                className="text-forest font-extrabold text-xl tracking-tight"
              >
                Greenr
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex items-center justify-center"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  width: 48,
                  height: 48,
                  fontSize: "1.75rem",
                  color: "#1A1208",
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Nav items — centered */}
            <nav className="flex-1 flex flex-col items-center justify-center">
              {NAV_LINKS.map((link, i) => (
                <div
                  key={link.to}
                  className="w-full"
                  style={{
                    borderTop: i === 0 ? "1px solid #D6CFC4" : undefined,
                    borderBottom: "1px solid #D6CFC4",
                  }}
                >
                  <Link
                    to={link.to}
                    className="btn-underline"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      padding: "1.5rem",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#1A1208",
                      minHeight: 80,
                    }}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
