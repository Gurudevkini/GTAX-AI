import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import FlexBetween from "@/components/FlexBetween";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useGetGSTSummaryQuery } from "@/state/api";
import { MOCK_SUMMARY } from "@/state/mockData";

const Navbar = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("dashboard");

  const { data: rawSummary } = useGetGSTSummaryQuery();
  const summary = (rawSummary && rawSummary.totalInvoices > 0) ? rawSummary : MOCK_SUMMARY;
  const healthScore = summary.healthScore;
  const healthColor = healthScore >= 75 ? "#12efe8" : healthScore >= 50 ? "#f2b455" : "#ff5252";
  const healthBg    = healthScore >= 75 ? "rgba(18,239,200,0.08)" : healthScore >= 50 ? "rgba(242,180,85,0.08)" : "rgba(255,82,82,0.08)";
  const healthBorder = healthScore >= 75 ? "rgba(18,239,200,0.25)" : healthScore >= 50 ? "rgba(242,180,85,0.25)" : "rgba(255,82,82,0.25)";

  const handleLogout = () => {
    localStorage.removeItem("gtax_token");
    localStorage.removeItem("gtax_user");
    window.location.href = "/login";
  };

  const navItem = (label: string, path: string, key: string) => (
    <Box key={key} sx={{ "&:hover": { color: palette.primary[100] } }}>
      <Link
        to={path}
        onClick={() => setSelected(key)}
        style={{
          color: selected === key ? palette.primary[400] : palette.grey[700],
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: selected === key ? 600 : 400,
          borderBottom: selected === key ? `2px solid ${palette.primary[400]}` : "2px solid transparent",
          paddingBottom: "4px",
          transition: "all 0.15s",
        }}
      >
        {label}
      </Link>
    </Box>
  );

  return (
    <FlexBetween mb="1rem" p="0.5rem 0" color={palette.grey[300]}>
      {/* LEFT — Brand */}
      <FlexBetween gap="0.75rem">
        <Box
          sx={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg, ${palette.primary[500]}, ${palette.primary[700]})`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ReceiptLongIcon sx={{ fontSize: "18px", color: "#1a1d23" }} />
        </Box>
        <Box>
          <Typography variant="h4" fontSize="16px" fontWeight={700} color={palette.grey[200]} letterSpacing="-0.3px">
            GTax AI
          </Typography>
          <Typography variant="h6" fontSize="10px" color={palette.grey[700]}>
            AI Co-Pilot for Smarter GST Compliance
          </Typography>
        </Box>
      </FlexBetween>

      {/* CENTER — Nav links */}
      <FlexBetween gap="2rem">
        {navItem("Dashboard", "/", "dashboard")}
        {navItem("Vendors", "/vendors", "vendors")}
        {navItem("Alerts", "/alerts", "alerts")}
      </FlexBetween>

      {/* RIGHT — Health score + logout */}
      <FlexBetween gap="1rem">

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
          onClick={() => {
            navigate("/profile");
            setSelected("profile");
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: palette.primary[700],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: `2px solid ${selected === "profile" ? palette.primary[400] : "transparent"}`,
            }}
          >
            {localStorage.getItem("gtax_user") ? (
              <img
                src={JSON.parse(localStorage.getItem("gtax_user") || "{}")?.profileImage || `https://ui-avatars.com/api/?name=${JSON.parse(localStorage.getItem("gtax_user") || "{}")?.firstName || "User"}&background=random`}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Typography fontSize="14px" fontWeight={600} color="#fff">U</Typography>
            )}
          </Box>
        </Box>

        <Box
          onClick={handleLogout}
          sx={{
            cursor: "pointer",
            fontSize: "11px",
            color: palette.grey[700],
            "&:hover": { color: "#ff5252" },
            transition: "color 0.15s",
          }}
        >
          Sign out
        </Box>
      </FlexBetween>
    </FlexBetween>
  );
};

export default Navbar;