import { Box } from "@mui/material";
import { styled } from "@mui/system";

const DashboardBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, rgba(31,42,64,0.6) 0%, rgba(22,30,48,0.7) 100%)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  }
}));

export default DashboardBox;
