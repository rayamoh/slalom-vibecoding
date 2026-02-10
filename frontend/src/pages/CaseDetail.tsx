import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent,
  Stack,
  Alert as MuiAlert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';

import api from '../api/client';
import {
  Case,
  Alert,
  CaseStatus,
  Priority,
  Disposition,
  PRIORITY_COLORS,
  CASE_STATUS_COLORS,
} from '../types';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [linkedAlerts, setLinkedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState<CaseStatus>('open');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<Disposition | ''>('');

  // Fetch case details
  useEffect(() => {
    const fetchCaseData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.cases.getCaseById(id);

        if (data) {
          setCaseData(data);
          setStatus(data.status);
          setPriority(data.priority);
          setAssignedTo(data.assigned_to || '');
          setNotes(data.notes || '');
          setDisposition(data.disposition || '');

          // Fetch linked alerts
          const alerts = await Promise.all(
            data.linked_alerts.map((alertId) => api.alerts.getAlertById(alertId))
          );
          setLinkedAlerts(alerts.filter((a): a is Alert => a !== null));
        } else {
          setError('Case not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch case');
        console.error('Error fetching case:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [id]);

  // Handlers
  const handleStatusChange = (event: SelectChangeEvent<CaseStatus>) => {
    setStatus(event.target.value as CaseStatus);
  };

  const handlePriorityChange = (event: SelectChangeEvent<Priority>) => {
    setPriority(event.target.value as Priority);
  };

  const handleAssignedToChange = (event: SelectChangeEvent<string>) => {
    setAssignedTo(event.target.value);
  };

  const handleDispositionChange = (event: SelectChangeEvent<Disposition | ''>) => {
    setDisposition(event.target.value as Disposition | '');
  };

  const handleSaveChanges = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const updated = await api.cases.updateCase(id, {
        status,
        priority,
        notes: notes || undefined,
        disposition: disposition || undefined,
      });
      setCaseData(updated);
      window.alert('Case updated successfully');
    } catch (err) {
      console.error('Error updating case:', err);
      window.alert('Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkAlerts = () => {
    window.alert('Link additional alerts functionality - to be implemented');
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !caseData) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/cases')} sx={{ mb: 2 }}>
          Back to Case Management
        </Button>
        <MuiAlert severity="error">{error || 'Case not found'}</MuiAlert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/cases')}>
            Back
          </Button>
          <FolderOpenIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Case {caseData.id}</Typography>
          <Chip
            label={caseData.priority.toUpperCase()}
            sx={{
              bgcolor: PRIORITY_COLORS[caseData.priority],
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={caseData.status.replace('_', ' ').toUpperCase()}
            sx={{
              bgcolor: CASE_STATUS_COLORS[caseData.status],
              color: 'white',
            }}
          />
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Column: Case Info + Linked Alerts */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66%' } }}>
          {/* Case Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Case Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {caseData.title}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatTimestamp(caseData.created_at)}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">{formatTimestamp(caseData.updated_at)}</Typography>
                </Box>
              </Stack>

              {caseData.disposition && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Disposition
                  </Typography>
                  <Chip
                    label={caseData.disposition.replace('_', ' ').toUpperCase()}
                    color={caseData.disposition === 'fraud' ? 'error' : 'success'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Linked Alerts */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Linked Alerts ({linkedAlerts.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LinkIcon />}
                onClick={handleLinkAlerts}
              >
                Link More Alerts
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {linkedAlerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No alerts linked to this case
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Alert ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>ML Score</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {linkedAlerts.map((alert) => (
                      <TableRow key={alert.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {alert.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.status.replace('_', ' ').toUpperCase()}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.priority.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: PRIORITY_COLORS[alert.priority],
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {Math.round(alert.ml_score * 100)}/100
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(alert.transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/alerts/${alert.id}`}
                            size="small"
                            variant="text"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        {/* Right Column: Actions Panel */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 33%' } }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 16 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Status */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={handleStatusChange} label="Status">
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="pending_review">Pending Review</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} onChange={handlePriorityChange} label="Priority">
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            {/* Assign To */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Assign To</InputLabel>
              <Select value={assignedTo} onChange={handleAssignedToChange} label="Assign To">
                <MenuItem value="">Unassigned</MenuItem>
                <MenuItem value="analyst1">Analyst 1</MenuItem>
                <MenuItem value="analyst2">Analyst 2</MenuItem>
                <MenuItem value="analyst3">Analyst 3</MenuItem>
              </Select>
            </FormControl>

            {/* Disposition */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Disposition</InputLabel>
              <Select value={disposition} onChange={handleDispositionChange} label="Disposition">
                <MenuItem value="">Not Set</MenuItem>
                <MenuItem value="fraud">Fraud</MenuItem>
                <MenuItem value="not_fraud">Not Fraud</MenuItem>
                <MenuItem value="inconclusive">Inconclusive</MenuItem>
              </Select>
            </FormControl>

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Save Changes Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            {/* Metadata */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Created: {formatTimestamp(caseData.created_at)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Updated: {formatTimestamp(caseData.updated_at)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Case ID: {caseData.id}
            </Typography>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
};

export default CaseDetail;
