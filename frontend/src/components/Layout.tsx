import { Link, Outlet, useLocation } from "react-router-dom";
import MobileNav from "./MobileNav";

const NAV_LINKS = [
  { to: "/start", label: "Calculate" },
  { to: "/history", label: "History" },
  { to: "/insights", label: "Insights" },
];

export default function Layout() {
  const location = useLocation();
  const isHero = location.pathname === "/";
  const isQuestionnaire = location.pathname === "/questions";

  // Hero: full-screen with mobile nav (light icon over dark photo)
  if (isHero) {
    return (
      <>
        <MobileNav lightIcon />
        <Outlet />
      </>
    );
  }

  // Questionnaire: full-screen bg, no nav chrome (questionnaire renders its own)
  if (isQuestionnaire) {
    return (
      <div className="min-h-screen bg-cream">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-warm-dark">
      <MobileNav />

      <header
        className="bg-cream sticky top-0 z-40"
        style={{ borderBottom: "1px solid #D6CFC4" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-forest font-extrabold text-xl tracking-tight">
            Greenr
          </Link>
          {/* Desktop nav only — hidden on mobile */}
          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="btn-underline text-sm">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 pb-20">
        <Outlet />
      </main>

      <footer
        className="mx-auto max-w-5xl px-6 py-8 text-xs text-warm-mid"
        style={{ borderTop: "1px solid #D6CFC4" }}
      >
        Greenr estimates carbon footprint based on data from the US EPA and other sources.{" "}
        <a
          href="https://github.com/pynez/greenr"
          target="_blank"
          rel="noreferrer"
          className="btn-underline text-xs"
          style={{ color: "#2D5A1B" }}
        >
          See our GitHub
        </a>{" "}
        for details.
      </footer>
    </div>
  );
}
