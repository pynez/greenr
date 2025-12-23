import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Understand your footprint in minutes.
        </h1>
        <p className="mt-4 text-white/70 max-w-2xl">
          Greenr estimates your annual carbon footprint and shows the biggest levers to reduce it.
          Built with transparent assumptions and clear warnings when averages are used.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            to="/start"
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
          >
            Calculate now
          </Link>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            View API docs
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card title="Quick Estimate" body="2–3 minutes. Great for a fast snapshot." />
        <Card title="Full Questionnaire" body="8–12 minutes. More accurate inputs and breakdowns." />
        <Card title="Transparent Methodology" body="Warnings explain what we assumed and why." />
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/70">{body}</div>
    </div>
  );
}
