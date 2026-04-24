import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import StatusChip from "@/components/StatusChip";
import FlexBetween from "@/components/FlexBetween";
import PremiumLock, { PlanType } from "@/components/PremiumLock";
import { useGetVendorsQuery, useGetInvoicesQuery } from "@/state/api";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridCellParams } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useState } from "react";

const Vendors = () => {
  const { palette } = useTheme();
  const { data: vendors } = useGetVendorsQuery();
  const { data: rawInvoices } = useGetInvoicesQuery();

  const [currentPlan] = useState<PlanType>(() => {
    const u = JSON.parse(localStorage.getItem("gtax_user") || "{}");
    return (u.planType as PlanType) || "free";
  });

  const hasData = rawInvoices && rawInvoices.length > 0;

  const highRisk = vendors?.filter((v) => v.riskLevel === "High") ?? [];
  const medRisk = vendors?.filter((v) => v.riskLevel === "Medium") ?? [];
  const lowRisk = vendors?.filter((v) => v.riskLevel === "Low") ?? [];

  const columns = [
    { field: "name", headerName: "Vendor Name", flex: 1.5 },
    { field: "gstin", headerName: "GSTIN", flex: 1.2, renderCell: (p: GridCellParams) => (
      <Typography sx={{ fontSize: "11px", fontFamily: "IBM Plex Mono, monospace", color: palette.grey[500] }}>{p.value as string}</Typography>
    )},
    { field: "complianceScore", headerName: "Compliance Score", flex: 0.8, renderCell: (p: GridCellParams) => {
      const score = p.value as number;
      const color = score >= 75 ? palette.primary[400] : score >= 50 ? "#f2b455" : "#ff5252";
      return (
        <Box display="flex" alignItems="center" gap="8px" width="100%">
          <Box sx={{ flex: 1, height: "4px", background: palette.grey[800], borderRadius: "2px", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${score}%`, background: color, borderRadius: "2px" }} />
          </Box>
          <Typography sx={{ fontSize: "11px", fontFamily: "IBM Plex Mono, monospace", color, fontWeight: 700, minWidth: "28px" }}>{score}</Typography>
        </Box>
      );
    }},
    { field: "riskLevel", headerName: "Risk Level", flex: 0.6, renderCell: (p: GridCellParams) => <StatusChip status={p.value as string} /> },
    { field: "totalInvoices", headerName: "Total Invoices", flex: 0.6 },
    { field: "mismatchCount", headerName: "Mismatches", flex: 0.6, renderCell: (p: GridCellParams) => (
      <Typography sx={{ fontSize: "12px", color: (p.value as number) > 4 ? "#ff5252" : (p.value as number) > 2 ? "#f2b455" : palette.grey[400], fontWeight: 600 }}>{p.value as number}</Typography>
    )},
  ];

  const dataGridStyles = {
    "& .MuiDataGrid-root": { color: palette.grey[300], border: "none" },
    "& .MuiDataGrid-cell": { borderBottom: `1px solid ${palette.grey[800]} !important` },
    "& .MuiDataGrid-columnHeaders": { borderBottom: `1px solid ${palette.grey[800]} !important` },
    "& .MuiDataGrid-columnSeparator": { visibility: "hidden" },
    "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10px", color: palette.grey[600], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  };

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
            No Vendors Available
          </Typography>
          <Typography color={palette.grey[400]} textAlign="center" maxWidth="400px">
            Please first upload your <b>Invoices</b> and <b>GSTR-2B</b> files on the Dashboard to populate the Vendor Risk Board.
          </Typography>
        </Box>
      ) : (
        <Box display="grid" gridTemplateColumns="1fr" gap="1.5rem">
          {/* Stats row */}
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1rem">
            {[
              { label: "High Risk Vendors", count: highRisk.length, color: "#ff5252", bg: "rgba(255,82,82,0.06)" },
              { label: "Medium Risk Vendors", count: medRisk.length, color: "#f2b455", bg: "rgba(242,180,85,0.06)" },
              { label: "Low Risk Vendors", count: lowRisk.length, color: palette.primary[400], bg: `rgba(18,239,200,0.06)` },
            ].map((item) => (
              <Box key={item.label} sx={{ background: item.bg, border: `1px solid ${item.color}22`, borderRadius: "10px", padding: "16px 20px" }}>
                <Typography sx={{ fontSize: "10px", color: palette.grey[600], mb: "6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</Typography>
                <Typography sx={{ fontSize: "32px", fontWeight: 700, color: item.color, fontFamily: "IBM Plex Mono, monospace", lineHeight: 1 }}>{item.count}</Typography>
              </Box>
            ))}
          </Box>

          {/* Full vendor table */}
          <DashboardBox height="500px">
            <BoxHeader
              title="All Vendors"
              subtitle="sorted by compliance score — lowest first"
              sideText={`${vendors?.length ?? 0} vendors`}
            />
            <Box mt="0.5rem" p="0 0.5rem" height="80%" sx={dataGridStyles}>
              <DataGrid
                columnHeaderHeight={28}
                rowHeight={40}
                rows={vendors ?? []}
                columns={columns}
                getRowId={(row) => row._id}
                pageSizeOptions={[10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              />
            </Box>
          </DashboardBox>
        </Box>
      )}
    </PremiumLock>
  );
};

export default Vendors;
