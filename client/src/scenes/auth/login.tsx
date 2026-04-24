import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useLoginMutation } from "@/state/api";

const Login = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      const result = await loginMutation({ email, password }).unwrap();
      localStorage.setItem("gtax_token", result.token);
      localStorage.setItem("gtax_user", JSON.stringify(result.user));
      // Force full reload so App re-checks auth state
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.data?.message ?? "Login failed. Please try again.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: palette.background.default,
    border: `1px solid ${palette.grey[800]}`,
    borderRadius: "8px",
    color: palette.grey[300],
    fontSize: "13px",
    fontFamily: "IBM Plex Sans, Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: palette.background.default,
        p: "1rem",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "420px",
          background: palette.background.light,
          border: `1px solid ${palette.grey[900]}`,
          borderRadius: "14px",
          padding: "2rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Brand */}
        <Box display="flex" alignItems="center" gap="10px" mb="1.75rem">
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
            <Typography fontSize="16px" fontWeight={700} color={palette.grey[200]} letterSpacing="-0.3px">
              GTax AI
            </Typography>
            <Typography fontSize="10px" color={palette.grey[700]}>
              AI Co-Pilot for Smarter GST Compliance
            </Typography>
          </Box>
        </Box>

        {/* Pulse badge */}
        <Box
          display="inline-flex"
          alignItems="center"
          gap="6px"
          sx={{
            px: "10px",
            py: "3px",
            background: "rgba(18,239,200,0.08)",
            border: "1px solid rgba(18,239,200,0.2)",
            borderRadius: "20px",
            mb: "1.25rem",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: palette.primary[500],
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%,100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
          <Typography fontSize="10px" fontWeight={600} color={palette.primary[400]}>
            Secure Login
          </Typography>
        </Box>

        <Typography fontSize="20px" fontWeight={700} color={palette.grey[200]} mb="4px">
          Welcome back
        </Typography>
        <Typography fontSize="12px" color={palette.grey[700]} mb="1.5rem">
          Sign in to your GTax AI account
        </Typography>

        {error && (
          <Typography
            fontSize="12px"
            color="#ff5252"
            mb="1rem"
            sx={{
              background: "rgba(255,82,82,0.08)",
              p: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,82,82,0.2)",
            }}
          >
            {error}
          </Typography>
        )}

        <Box mb="1rem">
          <Typography
            fontSize="11px"
            color={palette.grey[600]}
            fontWeight={500}
            sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: "6px" }}
          >
            Email Address
          </Typography>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </Box>

        <Box mb="1.5rem">
          <Box display="flex" justifyContent="space-between" mb="6px">
            <Typography
              fontSize="11px"
              color={palette.grey[600]}
              fontWeight={500}
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              Password
            </Typography>
            <Typography fontSize="11px" color={palette.primary[400]} sx={{ cursor: "pointer" }}>
              Forgot password?
            </Typography>
          </Box>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </Box>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "11px",
            background: isLoading ? "#0b8f78" : palette.primary[500],
            color: "#0a1628",
            fontSize: "13px",
            fontWeight: 700,
            border: "none",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "IBM Plex Sans, Inter, sans-serif",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Signing in…" : "Sign In"}
        </button>

        <Typography fontSize="12px" color={palette.grey[700]} textAlign="center" mt="1.25rem">
          Don't have an account?{" "}
          <Link to="/register" style={{ color: palette.primary[400], fontWeight: 600, textDecoration: "none" }}>
            Create one →
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;