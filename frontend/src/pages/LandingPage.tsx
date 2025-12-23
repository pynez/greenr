import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          Understand your footprint in minutes.
        </h1>
        <p className="mt-4 text-white/70 max-w-2xl">
          Greenr estimates your annual carbon footprint and helps you take meaningful steps to reduce it.
          Run multiple calculations and track your impact over time.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            to="/start"
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90"
          >
            Calculate now
          </Link>
          <a
            href="https://github.com/pynez/greenr"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            Learn more
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card title="Quick Estimate" body="The fastest way to estimate your footprint." />
        <Card title="Full Questionnaire" body="Fine-tune your calculation with more accurate inputs and breakdowns." />
        <Card title="History & Insights" body="Get in-depth information on how we calculated your footprint and track your habits over time." />
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
