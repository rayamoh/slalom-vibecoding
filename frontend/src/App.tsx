import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { SnackbarProvider } from 'notistack';

// Pages
import AlertQueue from './pages/AlertQueue';
import AlertDetail from './pages/AlertDetail';
import CaseManagement from './pages/CaseManagement';
import CaseDetail from './pages/CaseDetail';
import EntityProfile from './pages/EntityProfile';

// Components
import Navigation from './components/Navigation';

// Create Material-UI theme with Manulife branding
// Will align with CDS theme when available
const theme = createTheme({
  palette: {
    primary: {
      main: '#00854D', // Manulife signature green
      light: '#4CAF50',
      dark: '#005A33',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#003F2D', // Manulife dark green
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00',
    },
    info: {
      main: '#1976d2',
    },
    success: {
      main: '#388e3c',
    },
  },
  typography: {
    fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Manulife style - no all caps
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={6000}
      >
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5' }}>
              <Routes>
                <Route path="/" element={<Navigate to="/alerts" replace />} />
                <Route path="/alerts" element={<AlertQueue />} />
                <Route path="/alerts/:id" element={<AlertDetail />} />
                <Route path="/cases" element={<CaseManagement />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/entities/:id" element={<EntityProfile />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
