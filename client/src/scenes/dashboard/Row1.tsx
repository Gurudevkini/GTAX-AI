import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import { useGetGSTSummaryQuery } from "@/state/api";
import { useTheme } from "@mui/material";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  BarChart,
  Bar,
  LineChart,
  XAxis,
  YAxis,
  Legend,
  Line,
  Tooltip,
  Area,
} from "recharts";

// ── Normalise ITC trend: handles amount | itcAmount | itcAtRisk | value | risk
const normaliseITC = (raw: any[]): { month: string; amount: number }[] =>
  raw.map((d) => ({
    month: d.month ?? d.Month ?? "",
    amount:
      d.amount ??
      d.itcAmount ??
      d.itcAtRisk ??
      d.itcRisk ??
      d.value ??
      d.risk ??
      0,
  }));

// ── Normalise reconciliation: handles mismatch | mismatched | mismatchCount
//                              and    pending | pendingCount | pendingInvoices
const normaliseRecon = (
  raw: any[]
): { month: string; matched: number; mismatch: number; pending: number }[] =>
  raw.map((d) => ({
    month: d.month ?? d.Month ?? "",
    matched: d.matched ?? d.matchedCount ?? 0,
    mismatch: d.mismatch ?? d.mismatched ?? d.mismatchCount ?? d.misMatch ?? 0,
    pending: d.pending ?? d.pendingCount ?? d.pendingInvoices ?? 0,
  }));

const Row1 = () => {
  const { palette } = useTheme();
  const { data: rawData } = useGetGSTSummaryQuery();
  const data = rawData || null;

  const reconciliationData = useMemo(() => {
    const raw = data?.monthlyReconciliation ?? [];
    const normalised = normaliseRecon(raw);
    // ↓ Check browser console to confirm field names match your API response
    console.log("[Row1] reconciliationData raw:", raw);
    console.log("[Row1] reconciliationData normalised:", normalised);
    return normalised;
  }, [data]);

  const itcTrendData = useMemo(() => {
    const raw = data?.itcRiskTrend ?? [];
    const normalised = normaliseITC(raw);
    // ↓ Check browser console to confirm field names match your API response
    console.log("[Row1] itcTrendData raw:", raw);
    console.log("[Row1] itcTrendData normalised:", normalised);
    return normalised;
  }, [data]);

  const matchRateData = useMemo(
    () =>
      reconciliationData.map((d) => {
        const total = Math.max(d.matched + d.mismatch + d.pending, 1);
        return {
          ...d,
          matchRate: parseFloat(((d.matched / total) * 100).toFixed(1)),
        };
      }),
    [reconciliationData]
  );

  const avgMatchRate = useMemo(() => {
    if (!matchRateData.length) return null;
    const sum = matchRateData.reduce((acc, d) => acc + d.matchRate, 0);
    return (sum / matchRateData.length).toFixed(1);
  }, [matchRateData]);

  return (
    <>
      {/* Box A — Reconciliation bar chart */}
      <DashboardBox gridArea="a">
        <BoxHeader
          title="Invoice Reconciliation"
          subtitle="matched vs mismatched per month"
          sideText={`${data?.matchedInvoices ?? 0} matched`}
        />
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={reconciliationData}
            margin={{ top: 15, right: 25, left: -10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="colorMatched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.primary[300]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={palette.primary[300]} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={palette.grey[800]} />
            <XAxis dataKey="month" tickLine={false} style={{ fontSize: "10px" }} />
            <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                background: palette.background.light,
                border: "none",
                fontSize: "11px",
              }}
            />
            <Legend height={16} wrapperStyle={{ fontSize: "10px", marginBottom: "4px" }} />
            <Bar dataKey="matched" fill={palette.primary[600]} radius={[3, 3, 0, 0]} name="Matched" />
            <Bar dataKey="mismatch" fill="#ff5252" radius={[3, 3, 0, 0]} name="Mismatch" />
          </BarChart>
        </ResponsiveContainer>
      </DashboardBox>

      {/* Box B — ITC at Risk: orange line chart, Y-axis in ₹ Lakhs */}
      <DashboardBox gridArea="b">
        <BoxHeader
          title="ITC at Risk Trend"
          subtitle="monthly ITC exposure (₹ Lakhs)"
          sideText="Monthly view"
        />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={itcTrendData}
            margin={{ top: 15, right: 25, left: 5, bottom: 60 }}
          >
            <CartesianGrid
              stroke={palette.grey[800]}
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
              tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              domain={[
                0,
                (dataMax: number) =>
                  Math.max(
                    Math.ceil((dataMax / 100000 + 1) / 10) * 10 * 100000,
                    1000000
                  ),
              ]}
              tickCount={10}
            />
            <Tooltip
              formatter={(v: number) => [
                `₹${(v / 100000).toFixed(2)}L`,
                "ITC at Risk",
              ]}
              contentStyle={{
                background: palette.background.light,
                border: "none",
                fontSize: "11px",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#f2b455"
              strokeWidth={2}
              dot={{ fill: "#f2b455", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#f2b455" }}
              name="ITC at Risk"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </DashboardBox>

      {/* Box C — Match Rate: teal area + dots */}
      <DashboardBox gridArea="c">
        <BoxHeader
          title="Match Rate by Month"
          subtitle="% invoices reconciled"
          sideText={avgMatchRate ? `${avgMatchRate}% avg` : ""}
        />
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={matchRateData}
            margin={{ top: 20, right: 10, left: -5, bottom: 55 }}
          >
            <defs>
              <linearGradient id="colorMatchRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#12efe8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#12efe8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={palette.grey[800]} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
              domain={[60, 100]}
              ticks={[60, 70, 80, 90, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Match Rate"]}
              contentStyle={{
                background: palette.background.light,
                border: "none",
                fontSize: "11px",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="matchRate"
              stroke="#12efe8"
              strokeWidth={2}
              fill="url(#colorMatchRate)"
              dot={{ fill: "#12efe8", r: 5, strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#12efe8" }}
              name="Match Rate"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardBox>
    </>
  );
};

export default Row1;