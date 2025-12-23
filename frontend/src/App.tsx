import { useEffect, useState } from "react";
import { calculateFootprint, type CalculateResponse } from "./api/greenr";

export default function App() {
  const [data, setData] = useState<CalculateResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const baseUrl = import.meta.env.VITE_GREENR_API_BASE_URL as string;
      const res = await calculateFootprint(baseUrl, { mode: "quick", household_size: 1 });
      setData(res);
    };

    run().catch((e) => setError(String(e)));
  }, []);

  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Greenr</h1>
      <p>Total: {data.breakdown.total_metric_tons} tCO2e / year</p>

      <h2>Warnings</h2>
      <ul>
        {data.warnings.map((w) => (
          <li key={w.code}>
            {w.code}: {w.message}
          </li>
        ))}
      </ul>

      <h2>Raw breakdown</h2>
      <pre>{JSON.stringify(data.breakdown, null, 2)}</pre>
    </div>
  );
}
