import { Link, Outlet } from "react-router-dom";
import logo from "../assets/greenr-logo-clean.png";

export default function Layout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <img src={logo} alt="Greenr" className="h-8 w-8 rounded-xl" />
          <span>Greenr</span>
        </Link>
        <nav className="flex gap-4 text-sm text-white/70">
          <Link to="/start" className="hover:text-white">Calculate</Link>
          <Link to= "/history" className="hover:text-white">History</Link>
          <Link to= "/insights" className="hover:text-white">Insights</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-white/50">
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
