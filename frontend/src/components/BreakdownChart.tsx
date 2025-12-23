import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Item = {
  name: string;
  kg: number;
};

function formatKg(n: number): string {
  const rounded = Math.round(n);
  return `${rounded.toLocaleString()} kg`;
}

function formatPercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function toNumber(value: number | string | (number | string)[] | undefined): number {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "number" ? first : Number(first ?? 0);
  }

  return typeof value === "number" ? value : Number(value ?? 0);
}

type BreakdownTooltipProps = {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  totalKg: number;
};

function BreakdownTooltip({
  active,
  payload,
  label,
  totalKg,
}: BreakdownTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const value = toNumber(payload[0].value);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        color: "white",
        padding: "8px 10px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: 4 }}>
        {formatKg(value)} <span style={{ color: "rgba(255,255,255,0.7)" }}>({formatPercent(value, totalKg)})</span>
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
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="text-sm font-semibold">Breakdown</div>
      <div className="mt-1 text-xs text-white/60">Annual emissions by category</div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              type="number"
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
            />
            <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                content={<BreakdownTooltip totalKg={totalKg} />}
            />
            <Bar dataKey="kg" radius={[10, 10, 10, 10]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
