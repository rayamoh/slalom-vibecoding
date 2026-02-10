import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert as MuiAlert,
  SelectChangeEvent,
  Badge,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useSnackbar } from 'notistack';

import api from '../api/client';
import { Alert, AlertStatus, Priority, PRIORITY_COLORS, STATUS_COLORS } from '../types';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';

const AlertQueue: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [sortBy, setSortBy] = useState<'priority' | 'risk_score' | 'amount' | 'created_at'>(
    'priority'
  );

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Real-time updates
  const { newAlerts, connected, newAlertCount, clearNewAlerts } = useRealtimeAlerts({
    autoConnect: true,
    onNewAlert: (alert: Alert) => {
      // Show toast notification for critical and high priority alerts
      if (alert.priority === 'critical' || alert.priority === 'high') {
        const severity = alert.priority === 'critical' ? 'error' : 'warning';
        enqueueSnackbar(
          `New ${alert.priority.toUpperCase()} alert: ${alert.transaction.type} - $${alert.transaction.amount.toLocaleString()}`,
          {
            variant: severity,
            autoHideDuration: 8000,
            action: (key) => (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  navigate(`/alerts/${alert.id}`);
                }}
              >
                View
              </Button>
            ),
          }
        );
      }
    },
  });

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.alerts.getAlerts({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sort_by: sortBy,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });

      setAlerts(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts on mount and when filters/pagination change
  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, sortBy, page, rowsPerPage]);

  // Auto-refresh when new alerts arrive (if on first page and no filters)
  useEffect(() => {
    if (newAlertCount > 0 && page === 0 && !statusFilter && !priorityFilter) {
      // Auto-refresh to show new alerts
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAlertCount]);

  // Handlers
  const handleStatusFilterChange = (event: SelectChangeEvent<AlertStatus | ''>) => {
    setStatusFilter(event.target.value as AlertStatus | '');
    setPage(0); // Reset to first page
  };

  const handlePriorityFilterChange = (event: SelectChangeEvent<Priority | ''>) => {
    setPriorityFilter(event.target.value as Priority | '');
    setPage(0); // Reset to first page
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value as 'priority' | 'risk_score' | 'amount' | 'created_at');
    setPage(0); // Reset to first page
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (alertId: string) => {
    navigate(`/alerts/${alertId}`);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('priority');
    setPage(0);
  };

  const handleViewNewAlerts = () => {
    clearNewAlerts();
    setPage(0);
    setStatusFilter('');
    setPriorityFilter('');
    fetchAlerts();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Box>
      {/* Header with connection status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Alert Queue</Typography>
          {connected ? (
            <Chip
              icon={<NotificationsActiveIcon />}
              label="Live"
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip label="Offline" color="default" size="small" />
          )}
        </Box>
        {newAlertCount > 0 && (
          <Button
            variant="contained"
            color="error"
            onClick={handleViewNewAlerts}
            startIcon={
              <Badge badgeContent={newAlertCount} color="error">
                <NotificationsActiveIcon />
              </Badge>
            }
          >
            View {newAlertCount} New Alert{newAlertCount > 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="in_review">In Review</MenuItem>
              <MenuItem value="pending_info">Pending Info</MenuItem>
              <MenuItem value="escalated">Escalated</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              onChange={handlePriorityFilterChange}
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort By">
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="risk_score">Risk Score</MenuItem>
              <MenuItem value="amount">Amount</MenuItem>
              <MenuItem value="created_at">Created Date</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleResetFilters}>
            Reset Filters
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchAlerts}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Error message */}
      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Assigned To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No alerts found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    hover
                    onClick={() => handleRowClick(alert.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{alert.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={alert.priority.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: PRIORITY_COLORS[alert.priority],
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>{alert.transaction.type}</TableCell>
                    <TableCell align="right">{formatCurrency(alert.transaction.amount)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ fontWeight: 'bold' }}>
                        {Math.round(alert.ml_score * 100)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: STATUS_COLORS[alert.status],
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatTimestamp(alert.created_at)}</TableCell>
                    <TableCell>{alert.assigned_to || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default AlertQueue;
