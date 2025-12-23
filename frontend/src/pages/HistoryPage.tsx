import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loadSession,
  saveSession,
  deleteSnapshot,
  updateSnapshotMeta,
  type Snapshot,
} from "../state/session";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Range = "7d" | "30d" | "all";

function withinRange(snap: Snapshot, range: Range) {
  if (range === "all") return true;
  const created = new Date(snap.createdAt).getTime();
  const now = Date.now();
  const days = range === "7d" ? 7 : 30;
  return now - created <= days * 24 * 60 * 60 * 1000;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const nav = useNavigate();
  const session = useMemo(() => loadSession(), []);
  const [range, setRange] = useState<Range>("30d");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const all = session.snapshots ?? [];
  const filtered = all
    .filter((s) => withinRange(s, range))
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const label = s.label?.toLowerCase() ?? "";
      const note = s.note?.toLowerCase() ?? "";
      const tags = (s.tags ?? []).join(" ").toLowerCase();
      return label.includes(q) || note.includes(q) || tags.includes(q);
    })
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const chartData = filtered
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((s) => ({
      t: new Date(s.createdAt).toLocaleDateString(),
      total: s.response.breakdown.total_metric_tons,
      id: s.id,
    }));

  const exportJson = () => {
    const s = loadSession();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      snapshots: s.snapshots ?? [],
    };
    downloadText("greenr-history.json", JSON.stringify(payload, null, 2));
  };

  const importJson = async (file: File) => {
    setError("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const snaps: Snapshot[] = parsed?.snapshots;
      if (!Array.isArray(snaps)) throw new Error("Invalid file: missing snapshots[]");

      // Very lightweight validation
      for (const x of snaps) {
        if (!x?.id || !x?.createdAt || !x?.response?.breakdown) {
          throw new Error("Invalid snapshot shape found in import");
        }
      }

      const s = loadSession();
      const existingIds = new Set((s.snapshots ?? []).map((x) => x.id));
      const merged = [...(s.snapshots ?? [])];

      // Append only new IDs
      for (const x of snaps) {
        if (!existingIds.has(x.id)) merged.push(x);
      }

      saveSession({ ...s, snapshots: merged });
      window.location.reload();
    } catch (e) {
      setError(String(e));
    }
  };

  const setAsCurrent = (snap: Snapshot) => {
    const s = loadSession();
    saveSession({
      ...s,
      requestDraft: snap.request,
      lastResult: snap.response,
    });
    nav("/results");
  };

  const setAsBaseline = (snap: Snapshot) => {
    const s = loadSession();
    saveSession({ ...s, baselineId: snap.id });
    nav("/insights");
  };

  const setAsScenario = (snap: Snapshot) => {
    const s = loadSession();
    saveSession({ ...s, scenarioId: snap.id });
    nav("/insights");
  };

  const onDelete = (id: string) => {
    const s = loadSession();
    const next = deleteSnapshot(s, id);
    saveSession(next);
    window.location.reload();
  };

  const onEditMeta = (id: string, patch: Partial<Pick<Snapshot, "label" | "note" | "tags">>) => {
    const s = loadSession();
    const next = updateSnapshotMeta(s, id, patch);
    saveSession(next);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="mt-2 text-white/70">
              Track your calculations over time. Stored locally in this browser.
            </p>
          </div>
          <Link to="/start" className="text-sm text-white/70 hover:text-white">
            New calculation
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <RangePills value={range} onChange={setRange} />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search label, notes, tags"
            className="ml-auto w-full md:w-72 rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />

          <button
            onClick={exportJson}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            Export
          </button>

          <label className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Trend</div>
            <div className="mt-1 text-xs text-white/60">Total footprint over time</div>
          </div>
          <div className="text-xs text-white/60">{filtered.length} entries</div>
        </div>

        <div className="mt-4 h-72">
          {chartData.length < 2 ? (
            <div className="text-sm text-white/70">
              Add at least two calculations to see a trend line.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tickFormatter={(v) => String(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.85)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    color: "white",
                  }}
                  formatter={(value) => `${Number(value).toFixed(2)} tCO2e`}
                />
                <Line type="monotone" dataKey="total" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-white/70">
            No entries match your filters.
          </div>
        ) : (
          filtered.map((snap) => (
            <SnapshotRow
              key={snap.id}
              snap={snap}
              onView={() => setAsCurrent(snap)}
              onBaseline={() => setAsBaseline(snap)}
              onScenario={() => setAsScenario(snap)}
              onDelete={() => onDelete(snap.id)}
              onEdit={(patch) => onEditMeta(snap.id, patch)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RangePills({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  const opts: { value: Range; label: string }[] = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "all", label: "All" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "px-3 py-2 rounded-xl text-sm border transition",
              selected ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/80 hover:border-white/20",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SnapshotRow({
  snap,
  onView,
  onBaseline,
  onScenario,
  onDelete,
  onEdit,
}: {
  snap: Snapshot;
  onView: () => void;
  onBaseline: () => void;
  onScenario: () => void;
  onDelete: () => void;
  onEdit: (patch: Partial<Pick<Snapshot, "label" | "note" | "tags">>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(snap.label);
  const [note, setNote] = useState(snap.note ?? "");
  const [tagsText, setTagsText] = useState((snap.tags ?? []).join(", "));

  const total = snap.response.breakdown.total_metric_tons;

  const save = () => {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onEdit({ label: label.trim() || "Untitled", note: note.trim() || undefined, tags: tags.length ? tags : undefined });
    setEditing(false);
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{snap.label}</div>
          <div className="mt-1 text-xs text-white/60">{fmtDate(snap.createdAt)}</div>
          <div className="mt-2 text-sm text-white/70">
            Total: <span className="text-white/90 font-semibold">{total.toFixed(2)} tCO2e</span>
          </div>

          {!!snap.tags?.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {snap.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/70">
                  {t}
                </span>
              ))}
            </div>
          )}

          {snap.note && !editing && (
            <div className="mt-3 text-sm text-white/70">
              {snap.note}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onView} className="rounded-xl bg-white text-black px-3 py-2 text-sm font-medium hover:bg-white/90">
            View
          </button>
          <button onClick={onBaseline} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:text-white">
            Set baseline
          </button>
          <button onClick={onScenario} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:text-white">
            Set scenario
          </button>
          <button onClick={() => setEditing((v) => !v)} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:text-white">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={onDelete} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:text-white">
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-black/30 border border-white/10 p-4">
            <div className="text-xs text-white/60">Label</div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-xl bg-black/30 border border-white/10 p-4">
            <div className="text-xs text-white/60">Tags (comma-separated)</div>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm"
              placeholder="baseline, winter, low-car"
            />
          </div>

          <div className="md:col-span-2 rounded-xl bg-black/30 border border-white/10 p-4">
            <div className="text-xs text-white/60">Note</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm min-h-[90px]"
              placeholder="What changed? Any context?"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={save} className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}