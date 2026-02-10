import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SecurityIcon from '@mui/icons-material/Security';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <AppBar position="static">
      <Toolbar>
        <SecurityIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Fraud Detection System
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/alerts"
            sx={{
              backgroundColor: isActive('/alerts') ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            Alert Queue
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/cases"
            sx={{
              backgroundColor: isActive('/cases') ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            Cases
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" sx={{ mr: 2 }}>
          User: Demo Analyst
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
