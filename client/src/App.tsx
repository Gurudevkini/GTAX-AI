import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { themeSettings } from "./theme";
import Navbar from "@/scenes/navbar";
import Dashboard from "@/scenes/dashboard";
import Vendors from "@/scenes/vendors";
import Alerts from "@/scenes/alerts";
import Login from "@/scenes/auth/login";
import Register from "@/scenes/auth/register";
import Profile from "@/scenes/profile";
import Onboarding from "@/scenes/onboarding/index";

function App() {
  const theme = useMemo(() => createTheme(themeSettings), []);
  const authed = !!localStorage.getItem("gtax_token");
  const user = JSON.parse(localStorage.getItem("gtax_user") || "{}");
  const hasOnboarded = user.hasCompletedOnboarding === true;

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={authed ? <Navigate to={hasOnboarded ? "/" : "/onboarding"} replace /> : <Login />}
            />
            <Route
              path="/register"
              element={authed ? <Navigate to={hasOnboarded ? "/" : "/onboarding"} replace /> : <Register />}
            />

            {/* Protected Onboarding Route */}
            <Route
              path="/onboarding"
              element={
                !authed ? <Navigate to="/login" replace /> :
                hasOnboarded ? <Navigate to="/" replace /> :
                <Onboarding />
              }
            />

            {/* Main Application Routes */}
            <Route
              path="/*"
              element={
                !authed ? (
                  <Navigate to="/login" replace />
                ) : !hasOnboarded ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <Box width="100%" height="100%" padding="1rem 2rem 4rem 2rem">
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/vendors" element={<Vendors />} />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </Box>
                )
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;