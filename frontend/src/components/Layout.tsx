import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import logo from "../assets/greenr-logo-clean.png";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { to: "/start", label: "Calculate" },
    { to: "/history", label: "History" },
    { to: "/insights", label: "Insights" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <img src={logo} alt="Greenr" className="h-8 w-8 rounded-xl" />
            <span>Greenr</span>
          </Link>

          <nav className="hidden md:flex gap-4 text-sm text-white/70">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="md:hidden rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:text-white"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen ? (
          <div className="md:hidden mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 text-sm text-white/80">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 sm:px-6 py-10 text-xs text-white/50">
        Greenr estimates carbon footprint based on data from the US EPA and other sources. See{" "}
        <a
          href="https://github.com/pynez/greenr"
          className="underline"
          style={{ color: "var(--accent)" }}
        >
          our GitHub
        </a>{" "}
        for details.
      </footer>
    </div>
  );
}
