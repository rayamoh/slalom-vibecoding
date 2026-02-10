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
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import api from '../api/client';
import { Case, CaseStatus, Priority, PRIORITY_COLORS, CASE_STATUS_COLORS } from '../types';

const CaseManagement: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [sortBy, setSortBy] = useState<'priority' | 'created_at' | 'updated_at'>('created_at');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCases, setTotalCases] = useState(0);

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.cases.getCases({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          sort_by: sortBy,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        });

        setCases(response.data);
        setTotalCases(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cases');
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [statusFilter, priorityFilter, sortBy, page, rowsPerPage]);

  // Handlers
  const handleStatusFilterChange = (event: SelectChangeEvent<CaseStatus | ''>) => {
    setStatusFilter(event.target.value as CaseStatus | '');
    setPage(0);
  };

  const handlePriorityFilterChange = (event: SelectChangeEvent<Priority | ''>) => {
    setPriorityFilter(event.target.value as Priority | '');
    setPage(0);
  };

  const handleSortChange = (event: SelectChangeEvent<'priority' | 'created_at' | 'updated_at'>) => {
    setSortBy(event.target.value as 'priority' | 'created_at' | 'updated_at');
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleCreateCase = () => {
    window.alert('Create Case functionality - to be implemented');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FolderOpenIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Case Management</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCase}
        >
          Create New Case
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="pending_review">Pending Review</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={priorityFilter} onChange={handlePriorityFilterChange} label="Priority">
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort By">
              <MenuItem value="created_at">Created Date</MenuItem>
              <MenuItem value="updated_at">Last Updated</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Cases Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Case ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Alerts</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'error.main' }}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No cases found
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    hover
                    onClick={() => handleRowClick(caseItem.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {caseItem.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {caseItem.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={caseItem.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: CASE_STATUS_COLORS[caseItem.status],
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={caseItem.priority.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: PRIORITY_COLORS[caseItem.priority],
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {caseItem.assigned_to || <em>Unassigned</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={caseItem.linked_alerts.length}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(caseItem.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(caseItem.updated_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCases}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default CaseManagement;
