import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { themeSettings } from "./theme";
import Navbar from "@/scenes/navbar";
import Dashboard from "@/scenes/dashboard";
import Vendors from "@/scenes/vendors";
import Alerts from "@/scenes/alerts";
import Login from "@/scenes/auth/Login";
import Register from "@/scenes/auth/Register";

function App() {
  const theme = useMemo(() => createTheme(themeSettings), []);
  const authed = !!localStorage.getItem("gtax_token");

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={authed ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={authed ? <Navigate to="/" replace /> : <Register />}
            />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                authed ? (
                  <Box width="100%" height="100%" padding="1rem 2rem 4rem 2rem">
                    <Navbar />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/vendors" element={<Vendors />} />
                      <Route path="/alerts" element={<Alerts />} />
                    </Routes>
                  </Box>
                ) : (
                  <Navigate to="/login" replace />
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