import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import FlexBetween from "@/components/FlexBetween";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const Navbar = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("dashboard");

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
        <FlexBetween
          gap="0.5rem"
          sx={{
            background: "rgba(18,239,200,0.08)",
            border: "1px solid rgba(18,239,200,0.2)",
            borderRadius: "20px",
            padding: "4px 14px",
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: palette.primary[500],
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
          <Typography fontSize="11px" fontWeight={600} color={palette.primary[400]}>
            Health Score: 72 / 100
          </Typography>
        </FlexBetween>

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