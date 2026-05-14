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

// ─── Colored square by footprint size ────────────────────────────────────────

function thresholdColor(tons: number): string {
  if (tons < 4) return "#F4A261";
  if (tons < 7) return "#B8A9D4";
  if (tons < 11) return "#8FA8C4";
  return "#8D9DA8";
}

type Range = "7d" | "30d" | "all";

function withinRange(snap: Snapshot, range: Range) {
  if (range === "all") return true;
  const created = new Date(snap.createdAt).getTime();
  const days = range === "7d" ? 7 : 30;
  return Date.now() - created <= days * 24 * 60 * 60 * 1000;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      return (
        (s.label?.toLowerCase() ?? "").includes(q) ||
        (s.note?.toLowerCase() ?? "").includes(q) ||
        (s.tags ?? []).join(" ").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const chartData = filtered
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((s) => ({
      t: new Date(s.createdAt).toLocaleDateString(),
      total: s.response.breakdown.total_metric_tons,
    }));

  const exportJson = () => {
    const s = loadSession();
    downloadText(
      "greenr-history.json",
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), snapshots: s.snapshots ?? [] }, null, 2)
    );
  };

  const importJson = async (file: File) => {
    setError("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const snaps: Snapshot[] = parsed?.snapshots;
      if (!Array.isArray(snaps)) throw new Error("Invalid file: missing snapshots[]");
      for (const x of snaps) {
        if (!x?.id || !x?.createdAt || !x?.response?.breakdown)
          throw new Error("Invalid snapshot shape in import");
      }
      const s = loadSession();
      const existingIds = new Set((s.snapshots ?? []).map((x) => x.id));
      const merged = [...(s.snapshots ?? [])];
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
    saveSession({ ...s, requestDraft: snap.request, lastResult: snap.response });
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
    saveSession(deleteSnapshot(s, id));
    window.location.reload();
  };
  const onEditMeta = (
    id: string,
    patch: Partial<Pick<Snapshot, "label" | "note" | "tags">>
  ) => {
    const s = loadSession();
    saveSession(updateSnapshotMeta(s, id, patch));
    window.location.reload();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ paddingBottom: "2rem", borderBottom: "1px solid #D6CFC4" }}>
        <h1 className="text-3xl font-bold text-warm-dark">your history</h1>
        <p className="mt-2 text-warm-mid text-sm">
          Track your calculations over time. Stored locally in this browser.
        </p>
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap items-center gap-6 mt-8">
        <RangeTabs value={range} onChange={setRange} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search label, notes, tags…"
          className="text-sm text-warm-dark placeholder:text-warm-mid focus:outline-none"
          style={{
            border: "none",
            borderBottom: "1px solid #D6CFC4",
            background: "transparent",
            padding: "0.25rem 0",
            borderRadius: 0,
            width: "16rem",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2D5A1B")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#D6CFC4")}
        />
        <div className="ml-auto flex gap-6">
          <button onClick={exportJson} className="btn-underline text-sm">
            Export
          </button>
          <label className="btn-underline text-sm cursor-pointer" style={{ color: "#2D5A1B" }}>
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
      </div>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div style={{ marginTop: "80px" }}>
          <div className="font-bold text-warm-dark text-sm">Trend</div>
          <div className="mt-1 text-xs text-warm-mid">
            Total footprint over time · {filtered.length} entries
          </div>
          <div className="mt-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 10, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D6CFC4" />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "#7A6652", fontSize: 11 }}
                  axisLine={{ stroke: "#D6CFC4" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#7A6652", fontSize: 11 }}
                  axisLine={{ stroke: "#D6CFC4" }}
                  tickLine={false}
                  tickFormatter={(v) => String(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#EDE7DC",
                    border: "1px solid #D6CFC4",
                    color: "#1A1208",
                    fontSize: 13,
                  }}
                  formatter={(v) => [`${Number(v).toFixed(2)} tCO2e`, "Total"]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2D5A1B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Snapshot list */}
      {filtered.length === 0 ? (
        <div className="text-center" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
          <div className="text-warm-mid text-base">
            no calculations yet.{" "}
            <Link to="/start" className="btn-underline" style={{ color: "#2D5A1B" }}>
              start with calculate.
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "80px", borderTop: "1px solid #D6CFC4" }}>
          {filtered.map((snap) => (
            <SnapshotRow
              key={snap.id}
              snap={snap}
              onView={() => setAsCurrent(snap)}
              onBaseline={() => setAsBaseline(snap)}
              onScenario={() => setAsScenario(snap)}
              onDelete={() => onDelete(snap.id)}
              onEdit={(patch) => onEditMeta(snap.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Range tabs ───────────────────────────────────────────────────────────────

function RangeTabs({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
  const opts: { value: Range; label: string }[] = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "all", label: "All time" },
  ];
  return (
    <div className="flex gap-6">
      {opts.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="text-sm pb-1"
            style={{
              background: "none",
              border: "none",
              padding: "0 0 3px 0",
              cursor: "pointer",
              fontWeight: selected ? 700 : 400,
              color: selected ? "#2D5A1B" : "#7A6652",
              borderBottom: selected ? "1.5px solid #2D5A1B" : "1.5px solid transparent",
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Snapshot row ─────────────────────────────────────────────────────────────

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
  const color = thresholdColor(total);
  const mode = snap.request?.mode ?? "quick";

  const save = () => {
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    onEdit({
      label: label.trim() || "Untitled",
      note: note.trim() || undefined,
      tags: tags.length ? tags : undefined,
    });
    setEditing(false);
  };

  return (
    <div style={{ borderBottom: "1px solid #D6CFC4" }}>
      {/* Main row — single line on desktop, two-line on mobile */}
      <div className="flex items-start gap-4 py-4">
        {/* Colored square indicator */}
        <div
          className="flex-none mt-1"
          style={{ width: 8, height: 8, background: color }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Line 1: label + date + mode */}
          <div className="flex items-baseline flex-wrap gap-x-2">
            <span className="font-bold text-warm-dark text-sm">{snap.label}</span>
            <span className="text-xs text-warm-mid">{fmtDate(snap.createdAt)}</span>
            <span className="text-xs text-warm-mid capitalize">· {mode}</span>
            {!!snap.tags?.length && (
              <span className="text-xs text-warm-mid">{snap.tags.join(", ")}</span>
            )}
          </div>
          {/* Line 2: tCO2e — second line on mobile only */}
          <div className="mt-0.5 md:hidden">
            <span className="font-extrabold text-warm-dark text-base">
              {total.toFixed(2)}{" "}
              <span className="text-xs font-normal text-warm-mid">tCO2e</span>
            </span>
          </div>
        </div>

        {/* tCO2e + mode — desktop only, inline right */}
        <div className="hidden md:flex items-center gap-3 whitespace-nowrap">
          <span className="font-extrabold text-warm-dark text-sm">
            {total.toFixed(2)}{" "}
            <span className="text-xs font-normal text-warm-mid">tCO2e</span>
          </span>
        </div>
      </div>

      {/* Action links */}
      <div className="flex flex-wrap gap-5 pb-4 pl-5">
        <button onClick={onView} className="btn-underline text-xs" style={{ color: "#2D5A1B" }}>
          View
        </button>
        <button onClick={onBaseline} className="btn-underline text-xs">
          Set baseline
        </button>
        <button onClick={onScenario} className="btn-underline text-xs">
          Set scenario
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className="btn-underline text-xs"
          style={{ color: "#7A6652" }}
        >
          {editing ? "Cancel" : "Edit"}
        </button>
        <button onClick={onDelete} className="btn-underline text-xs" style={{ color: "#7A6652" }}>
          Delete
        </button>
      </div>

      {snap.note && !editing && (
        <div className="pb-4 pl-5 text-sm text-warm-mid">{snap.note}</div>
      )}

      {/* Editing form */}
      {editing && (
        <div className="pb-6 pl-5 pr-2 space-y-5">
          <div>
            <div className="text-xs text-warm-mid mb-2">Label</div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full max-w-xs text-sm text-warm-dark focus:outline-none"
              style={{
                border: "none",
                borderBottom: "1px solid #D6CFC4",
                background: "transparent",
                padding: "0.25rem 0",
                borderRadius: 0,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2D5A1B")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#D6CFC4")}
            />
          </div>
          <div>
            <div className="text-xs text-warm-mid mb-2">Tags (comma-separated)</div>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="baseline, winter, low-car"
              className="w-full max-w-xs text-sm text-warm-dark placeholder:text-warm-mid focus:outline-none"
              style={{
                border: "none",
                borderBottom: "1px solid #D6CFC4",
                background: "transparent",
                padding: "0.25rem 0",
                borderRadius: 0,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2D5A1B")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#D6CFC4")}
            />
          </div>
          <div>
            <div className="text-xs text-warm-mid mb-2">Note</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What changed? Any context?"
              className="w-full max-w-sm text-sm text-warm-dark placeholder:text-warm-mid focus:outline-none resize-none"
              style={{
                border: "none",
                borderBottom: "1px solid #D6CFC4",
                background: "transparent",
                padding: "0.25rem 0",
                borderRadius: 0,
                minHeight: 64,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2D5A1B")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#D6CFC4")}
            />
          </div>
          <div className="flex gap-6">
            <button onClick={save} className="btn-underline text-sm" style={{ color: "#2D5A1B" }}>
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-underline text-sm"
              style={{ color: "#7A6652" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
