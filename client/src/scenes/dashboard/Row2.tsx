import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { useGetGSTSummaryQuery, useGetAlertsQuery } from "@/state/api";
import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const AlertIcon = ({ severity }: { severity: string }) => {
  if (severity === "High")
    return <ErrorOutlineIcon sx={{ fontSize: "14px", color: "#ff5252", mt: "1px" }} />;
  if (severity === "Medium")
    return <WarningAmberIcon sx={{ fontSize: "14px", color: "#f2b455", mt: "1px" }} />;
  return <InfoOutlinedIcon sx={{ fontSize: "14px", color: "#8884d8", mt: "1px" }} />;
};

const Row2 = () => {
  const { palette } = useTheme();
  const { data: summary } = useGetGSTSummaryQuery();
  const { data: alertsData } = useGetAlertsQuery();

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Matched", value: summary.matchedInvoices },
      { name: "Mismatch", value: summary.mismatchedInvoices },
      { name: "Pending", value: summary.pendingInvoices },
    ];
  }, [summary]);

  const pieColors = [palette.primary[500], "#ff5252", "#8884d8"];

  const openAlerts = useMemo(
    () => alertsData?.filter((a) => a.status === "open").slice(0, 5) ?? [],
    [alertsData]
  );

  return (
    <>
      {/* Box D — GST KPI cards */}
      <DashboardBox gridArea="d">
        <BoxHeader
          title="GST Summary"
          subtitle={summary?.period ?? "Current Period"}
          sideText={`Health: ${summary?.healthScore ?? 0}/100`}
        />
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap="0.75rem" p="0.5rem 1rem 1rem 1rem">
          {[
            { label: "Total Invoices", value: summary?.totalInvoices ?? 0, color: palette.grey[200] },
            { label: "Matched", value: summary?.matchedInvoices ?? 0, color: palette.primary[400] },
            { label: "Mismatched", value: summary?.mismatchedInvoices ?? 0, color: "#ff5252" },
            { label: "Pending", value: summary?.pendingInvoices ?? 0, color: "#8884d8" },
          ].map((kpi) => (
            <Box
              key={kpi.label}
              sx={{
                background: palette.background.default,
                borderRadius: "8px",
                padding: "10px 14px",
                border: `1px solid ${palette.grey[900]}`,
              }}
            >
              <Typography sx={{ fontSize: "10px", color: palette.grey[600], mb: "4px", fontWeight: 500 }}>
                {kpi.label}
              </Typography>
              <Typography sx={{ fontSize: "22px", fontWeight: 700, color: kpi.color, fontFamily: "IBM Plex Mono, monospace" }}>
                {kpi.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DashboardBox>

      {/* Box E — Invoice status mix (FIXED) */}
      <DashboardBox gridArea="e" sx={{ overflow: "hidden" }}>
        <BoxHeader
          title="Invoice Status Mix"
          subtitle="current period breakdown"
          sideText=""
        />

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          p="0.5rem 1rem 1rem 1rem"
        >
          {/* Chart */}
          <Box width="100%" height="110px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  stroke="none"
                  data={pieData}
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: palette.background.light,
                    border: "none",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Legend */}
          <Box width="100%" mt="0.5rem">
            {pieData.map((item, i) => (
              <FlexBetween key={item.name} mb="0.25rem">
                <FlexBetween gap="0.4rem">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "2px",
                      background: pieColors[i],
                    }}
                  />
                  <Typography fontSize="11px">{item.name}</Typography>
                </FlexBetween>
                <Typography fontSize="11px" color={pieColors[i]} fontWeight={600}>
                  {item.value}
                </Typography>
              </FlexBetween>
            ))}

            <Box
              mt="0.5rem"
              pt="0.4rem"
              sx={{ borderTop: `1px solid ${palette.grey[800]}` }}
            >
              <Typography fontSize="10px">
                ITC Claimable:{" "}
                <span style={{ color: palette.primary[400], fontWeight: 600 }}>
                  ₹{((summary?.totalITC ?? 0) / 100000).toFixed(1)}L
                </span>
              </Typography>

              <Typography fontSize="10px" mt="0.2rem">
                ITC at Risk:{" "}
                <span style={{ color: "#ff5252", fontWeight: 600 }}>
                  ₹{((summary?.itcAtRisk ?? 0) / 100000).toFixed(1)}L
                </span>
              </Typography>
            </Box>
          </Box>
        </Box>
      </DashboardBox>

      {/* Box F — Alerts panel */}
      <DashboardBox gridArea="f">
        <BoxHeader
          title="Active Alerts"
          subtitle="requires your attention"
          sideText={`${openAlerts.length} open`}
        />
        <Box p="0.25rem 1rem" sx={{ overflow: "auto", maxHeight: "220px" }}>
          {openAlerts.map((alert) => (
            <Box
              key={alert._id}
              display="flex"
              gap="0.6rem"
              mb="0.6rem"
              p="8px 10px"
              sx={{
                background: palette.background.default,
                borderRadius: "8px",
                borderLeft: `3px solid ${
                  alert.severity === "High"
                    ? "#ff5252"
                    : alert.severity === "Medium"
                    ? "#f2b455"
                    : "#8884d8"
                }`,
              }}
            >
              <AlertIcon severity={alert.severity} />
              <Box flex={1}>
                <Typography sx={{ fontSize: "11px", color: palette.grey[300], lineHeight: 1.4 }}>
                  {alert.message}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: palette.grey[700], mt: "2px" }}>
                  {alert.date}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DashboardBox>
    </>
  );
};

export default Row2;