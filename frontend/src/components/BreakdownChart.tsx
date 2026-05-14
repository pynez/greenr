import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Item = { name: string; kg: number };

function formatKg(n: number) {
  return `${Math.round(n).toLocaleString()} kg`;
}
function formatPct(part: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
function toNum(v: number | string | (number | string)[] | undefined): number {
  if (Array.isArray(v)) return typeof v[0] === "number" ? v[0] : Number(v[0] ?? 0);
  return typeof v === "number" ? v : Number(v ?? 0);
}

function WarmTooltip({
  active,
  payload,
  label,
  totalKg,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  totalKg: number;
}) {
  if (!active || !payload?.length) return null;
  const value = toNum(payload[0].value);
  return (
    <div
      style={{
        background: "#EDE7DC",
        border: "1px solid #D6CFC4",
        padding: "8px 12px",
        color: "#1A1208",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 3, color: "#7A6652" }}>
        {formatKg(value)}{" "}
        <span style={{ color: "#2D5A1B" }}>({formatPct(value, totalKg)})</span>
      </div>
    </div>
  );
}

export default function BreakdownChart({
  items,
  totalKg,
}: {
  items: Item[];
  totalKg: number;
}) {
  const data = [...items].sort((a, b) => b.kg - a.kg);

  return (
    <div>
      <div className="font-bold text-warm-dark text-sm">Breakdown</div>
      <div className="mt-0.5 text-xs text-warm-mid">Annual emissions by category</div>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D6CFC4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#7A6652", fontSize: 11 }}
              axisLine={{ stroke: "#D6CFC4" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: "#1A1208", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(214,207,196,0.3)" }}
              content={<WarmTooltip totalKg={totalKg} />}
            />
            <Bar dataKey="kg" fill="#2D5A1B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
