import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import StatusChip from "@/components/StatusChip";
import FlexBetween from "@/components/FlexBetween";
import { useGetAlertsQuery, useGetInvoicesQuery } from "@/state/api";
import PremiumLock, { PlanType } from "@/components/PremiumLock";
import { Box, Typography, useTheme } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useState } from "react";

const typeLabel: Record<string, string> = {
  ITC_MISMATCH: "ITC Mismatch",
  VENDOR_RISK: "Vendor Risk",
  FILING_DUE: "Filing Due",
  RECONCILE: "Reconciliation",
};

const AlertIcon = ({ severity }: { severity: string }) => {
  if (severity === "High") return <ErrorOutlineIcon sx={{ fontSize: "16px", color: "#ff5252" }} />;
  if (severity === "Medium") return <WarningAmberIcon sx={{ fontSize: "16px", color: "#f2b455" }} />;
  return <InfoOutlinedIcon sx={{ fontSize: "16px", color: "#8884d8" }} />;
};

const Alerts = () => {
  const { palette } = useTheme();
  const { data: alerts } = useGetAlertsQuery();
  const { data: rawInvoices } = useGetInvoicesQuery();

  const [currentPlan] = useState<PlanType>(() => {
    const u = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    return (u.planType as PlanType) || "free";
  });

  const hasData = rawInvoices && rawInvoices.length > 0;

  const open = alerts?.filter((a) => a.status === "open") ?? [];
  const resolved = alerts?.filter((a) => a.status === "resolved") ?? [];

  const severityColor = (s: string) =>
    s === "High" ? "#ff5252" : s === "Medium" ? "#f2b455" : "#8884d8";

  return (
    <PremiumLock currentPlan={currentPlan} requiredPlan="business">
      {!hasData ? (
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="4rem"
          sx={{
            background: "rgba(255,255,255,0.02)",
            border: `1px dashed ${palette.grey[800]}`,
            borderRadius: "16px",
            minHeight: "500px"
          }}
        >
          <Box
            sx={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(18,239,200,0.1), rgba(18,239,200,0.05))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: "1.5rem"
            }}
          >
            <UploadFileIcon sx={{ fontSize: "40px", color: palette.grey[500] }} />
          </Box>
          <Typography variant="h3" color="white" fontWeight={700} mb="0.5rem">
            No Active Alerts
          </Typography>
          <Typography color={palette.grey[400]} textAlign="center" maxWidth="400px">
            Please first upload your <b>Invoices</b> and <b>GSTR-2B</b> files on the Dashboard for the AI to generate compliance alerts.
          </Typography>
        </Box>
      ) : (
        <Box display="grid" gridTemplateColumns="1fr" gap="1.5rem">
          {/* Stats */}
          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap="1rem">
            {[
              { label: "Total Alerts", count: alerts?.length ?? 0, color: palette.grey[300] },
              { label: "High Severity", count: alerts?.filter((a) => a.severity === "High").length ?? 0, color: "#ff5252" },
              { label: "Medium Severity", count: alerts?.filter((a) => a.severity === "Medium").length ?? 0, color: "#f2b455" },
              { label: "Resolved", count: resolved.length, color: palette.primary[400] },
            ].map((item) => (
              <Box key={item.label} sx={{ background: palette.background.light, border: `1px solid ${palette.grey[800]}`, borderRadius: "10px", padding: "14px 18px" }}>
                <Typography sx={{ fontSize: "10px", color: palette.grey[600], mb: "4px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</Typography>
                <Typography sx={{ fontSize: "28px", fontWeight: 700, color: item.color, fontFamily: "IBM Plex Mono, monospace", lineHeight: 1 }}>{item.count}</Typography>
              </Box>
            ))}
          </Box>

          {/* Open alerts */}
          <DashboardBox>
            <BoxHeader title="Open Alerts" subtitle="sorted by severity — action required" sideText={`${open.length} open`} />
            <Box p="0.5rem 1rem">
              {open.map((alert) => (
                <Box
                  key={alert._id}
                  display="flex"
                  gap="0.75rem"
                  mb="0.75rem"
                  p="12px 14px"
                  sx={{
                    background: palette.background.default,
                    borderRadius: "10px",
                    borderLeft: `3px solid ${severityColor(alert.severity)}`,
                    transition: "background 0.15s",
                    "&:hover": { background: `${severityColor(alert.severity)}08` },
                  }}
                >
                  <Box mt="1px"><AlertIcon severity={alert.severity} /></Box>
                  <Box flex={1}>
                    <FlexBetween mb="4px">
                      <Box display="flex" gap="8px" alignItems="center">
                        <Typography sx={{ fontSize: "10px", color: palette.grey[600], background: palette.background.light, padding: "1px 8px", borderRadius: "4px" }}>
                          {typeLabel[alert.type] ?? alert.type}
                        </Typography>
                        <StatusChip status={`${alert.severity}-sev`} />
                      </Box>
                      <Typography sx={{ fontSize: "10px", color: palette.grey[700] }}>{alert.date}</Typography>
                    </FlexBetween>
                    <Typography sx={{ fontSize: "12px", color: palette.grey[300], lineHeight: 1.5 }}>
                      {alert.message}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </DashboardBox>

          {/* Resolved alerts */}
          {resolved.length > 0 && (
            <DashboardBox>
              <BoxHeader title="Resolved Alerts" subtitle="no action needed" sideText={`${resolved.length} resolved`} />
              <Box p="0.5rem 1rem">
                {resolved.map((alert) => (
                  <Box key={alert._id} display="flex" gap="0.75rem" mb="0.5rem" p="10px 14px"
                    sx={{ background: palette.background.default, borderRadius: "8px", opacity: 0.6 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: "16px", color: palette.primary[500], mt: "1px" }} />
                    <Box flex={1}>
                      <Typography sx={{ fontSize: "11px", color: palette.grey[400] }}>{alert.message}</Typography>
                      <Typography sx={{ fontSize: "10px", color: palette.grey[700], mt: "2px" }}>{alert.date}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </DashboardBox>
          )}
        </Box>
      )}
    </PremiumLock>
  );
};

export default Alerts;
