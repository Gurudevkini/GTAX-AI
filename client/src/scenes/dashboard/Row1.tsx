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

const Row1 = () => {
  const { palette } = useTheme();
  const { data: rawData } = useGetGSTSummaryQuery();
  // Strictly rely on server data if uploaded
  const data = rawData || null;

  const reconciliationData = useMemo(() => {
    return data?.monthlyReconciliation ?? [];
  }, [data]);

  const itcTrendData = useMemo(() => {
    return data?.itcRiskTrend ?? [];
  }, [data]);

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
              contentStyle={{ background: palette.background.light, border: "none", fontSize: "11px" }}
            />
            <Legend height={16} wrapperStyle={{ fontSize: "10px", marginBottom: "4px" }} />
            <Bar dataKey="matched" fill={palette.primary[600]} radius={[3, 3, 0, 0]} name="Matched" />
            <Bar dataKey="mismatch" fill="#ff5252" radius={[3, 3, 0, 0]} name="Mismatch" />
          </BarChart>
        </ResponsiveContainer>
      </DashboardBox>

      {/* Box B — ITC risk area chart */}
      <DashboardBox gridArea="b">
        <BoxHeader
          title="ITC at Risk Trend"
          subtitle="monthly ITC exposure (₹)"
          sideText={data ? `₹${(data.itcAtRisk / 100000).toFixed(1)}L at risk` : ""}
        />
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={itcTrendData}
            margin={{ top: 15, right: 25, left: -10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="colorITCRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.secondary[400]} stopOpacity={0.5} />
                <stop offset="95%" stopColor={palette.secondary[400]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickLine={false} style={{ fontSize: "10px" }} />
            <YAxis
              tickLine={false}
              axisLine={{ strokeWidth: 0 }}
              style={{ fontSize: "10px" }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "ITC at Risk"]}
              contentStyle={{ background: palette.background.light, border: "none", fontSize: "11px" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={palette.secondary[400]}
              fill="url(#colorITCRisk)"
              dot={{ fill: palette.secondary[400], r: 3 }}
              name="ITC at Risk (₹)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardBox>

      {/* Box C — Match rate line */}
      <DashboardBox gridArea="c">
        <BoxHeader
          title="Match Rate by Month"
          subtitle="% invoices successfully reconciled"
          sideText={data ? `${Math.round((data.matchedInvoices / data.totalInvoices) * 100)}% avg` : ""}
        />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={reconciliationData.map((d) => ({
              ...d,
              matchRate: Math.round((d.matched / (d.matched + d.mismatch + d.pending)) * 100),
            }))}
            margin={{ top: 20, right: 0, left: -10, bottom: 55 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grey[800]} />
            <XAxis dataKey="month" tickLine={false} style={{ fontSize: "10px" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
              domain={[60, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Match Rate"]}
              contentStyle={{ background: palette.background.light, border: "none", fontSize: "11px" }}
            />
            <Line
              type="monotone"
              dataKey="matchRate"
              stroke={palette.primary.main}
              dot={{ fill: palette.primary.main, r: 3 }}
              strokeWidth={2}
              name="Match Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </DashboardBox>
    </>
  );
};

export default Row1;
