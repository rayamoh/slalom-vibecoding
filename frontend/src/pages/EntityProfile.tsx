import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert as MuiAlert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import api from '../api/client';
import { EntityProfile as EntityProfileType } from '../types';

const EntityProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EntityProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.entities.getEntityProfile(id);

        if (data) {
          setProfile(data);
        } else {
          setError('Entity profile not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch entity profile');
        console.error('Error fetching entity profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'sender':
        return 'primary';
      case 'receiver':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/alerts')} sx={{ mb: 2 }}>
          Back
        </Button>
        <MuiAlert severity="error">{error || 'Entity profile not found'}</MuiAlert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountCircleIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Entity Profile</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {profile.entity_id}
            </Typography>
          </Box>
          <Chip label={profile.role.toUpperCase()} color={getRoleColor(profile.role)} />
        </Box>
      </Box>

      {/* Risk Indicators */}
      {(profile.prior_alerts > 0 || profile.prior_cases > 0) && (
        <MuiAlert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          This entity has {profile.prior_alerts} prior alert{profile.prior_alerts !== 1 ? 's' : ''} and{' '}
          {profile.prior_cases} prior case{profile.prior_cases !== 1 ? 's' : ''}.
        </MuiAlert>
      )}

      {/* Statistics Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {profile.total_transactions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {formatCurrency(profile.total_amount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Average Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {formatCurrency(profile.avg_amount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Prior Alerts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: profile.prior_alerts > 0 ? 'error.main' : 'text.secondary' }}>
                {profile.prior_alerts}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Transaction Type Distribution */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapHorizIcon /> Transaction Type Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {profile.transaction_types.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transaction history available
              </Typography>
            ) : (
              <Box>
                {profile.transaction_types.map((txType) => {
                  const percentage = (txType.count / profile.total_transactions) * 100;
                  return (
                    <Box key={txType.type} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {txType.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {txType.count.toLocaleString()} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          bgcolor: '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            bgcolor: 'primary.main',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>

        {/* Top Counterparties */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon /> Top Counterparties
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {profile.top_counterparties.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No counterparty data available
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.top_counterparties.slice(0, 10).map((counterparty, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {counterparty.entity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{counterparty.count}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(counterparty.total_amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
};

export default EntityProfile;

