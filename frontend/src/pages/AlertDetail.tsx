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
  Card,
  CardContent,
  LinearProgress,
  Alert as MuiAlert,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RuleIcon from '@mui/icons-material/Rule';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';

import api from '../api/client';
import { Alert, AlertStatus, PRIORITY_COLORS, STATUS_COLORS, RISK_BAND_COLORS } from '../types';
import ShapVisualization from '../components/ShapVisualization';

const AlertDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState<AlertStatus>('new');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Tab state
  const [explanationTab, setExplanationTab] = useState(0);

  // Fetch alert details
  useEffect(() => {
    const fetchAlert = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await api.alerts.getAlertById(id);

        if (data) {
          setAlert(data);
          setStatus(data.status);
          setNotes(data.notes || '');
          setAssignedTo(data.assigned_to || '');
        } else {
          setError('Alert not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alert');
        console.error('Error fetching alert:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [id]);

  // Handlers
  const handleStatusChange = (event: SelectChangeEvent<AlertStatus>) => {
    setStatus(event.target.value as AlertStatus);
  };

  const handleAssignedToChange = (event: SelectChangeEvent<string>) => {
    setAssignedTo(event.target.value);
  };

  const handleSaveChanges = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const updated = await api.alerts.updateAlert(id, {
        status,
        notes: notes || undefined,
        assigned_to: assignedTo || undefined,
      });
      setAlert(updated);
      // Show success message (could use a snackbar here)
      window.alert('Alert updated successfully');
    } catch (err) {
      console.error('Error updating alert:', err);
      window.alert('Failed to update alert');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCase = () => {
    // Navigate to case creation or open modal
    window.alert('Create Case functionality - to be implemented');
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !alert) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/alerts')} sx={{ mb: 2 }}>
          Back to Alert Queue
        </Button>
        <MuiAlert severity="error">{error || 'Alert not found'}</MuiAlert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/alerts')}>
            Back
          </Button>
          <Typography variant="h4">Alert Detail: {alert.id}</Typography>
          <Chip
            label={alert.priority.toUpperCase()}
            sx={{
              bgcolor: PRIORITY_COLORS[alert.priority],
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={alert.status.replace('_', ' ').toUpperCase()}
            sx={{
              bgcolor: STATUS_COLORS[alert.status],
              color: 'white',
            }}
          />
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Column: Transaction Summary + Risk Assessment */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66%' } }}>
          {/* Transaction Summary Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon /> Transaction Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountCircleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Origin
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <Link to={`/entities/${alert.transaction.nameOrig}`} style={{ textDecoration: 'none' }}>
                          {alert.transaction.nameOrig}
                        </Link>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={alert.transaction.type}
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatCurrency(alert.transaction.amount)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        <Link to={`/entities/${alert.transaction.nameDest}`} style={{ textDecoration: 'none' }}>
                          {alert.transaction.nameDest}
                        </Link>
                      </Typography>
                    </Box>
                    <AccountCircleIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body2">{alert.transaction_id}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body2">{formatTimestamp(alert.transaction.timestamp)}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Step
                  </Typography>
                  <Typography variant="body2">{alert.transaction.step}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatTimestamp(alert.created_at)}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Risk Assessment Panel */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RuleIcon /> Risk Assessment
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* ML Score Gauge */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ML Fraud Risk Score
                </Typography>
                <Chip
                  label={alert.ml_risk_band.toUpperCase()}
                  sx={{
                    bgcolor: RISK_BAND_COLORS[alert.ml_risk_band],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={alert.ml_score * 100}
                  sx={{
                    flexGrow: 1,
                    height: 24,
                    borderRadius: 2,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: RISK_BAND_COLORS[alert.ml_risk_band],
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                  {Math.round(alert.ml_score * 100)}/100
                </Typography>
              </Box>
            </Box>

            {/* Rules Triggered */}
            {alert.rules_triggered && alert.rules_triggered.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Rules Triggered ({alert.rules_triggered.length})
                </Typography>
                <List dense>
                  {alert.rules_triggered.map((rule, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        bgcolor: '#fff3e0',
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid #ffb74d',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rule.rule_name}
                          </Typography>
                        }
                        secondary={rule.reason}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          {/* Explanation Panel */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Explanation
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Tabs value={explanationTab} onChange={(_, v) => setExplanationTab(v)} sx={{ mb: 2 }}>
              <Tab label="ML Features (SHAP)" />
              <Tab label="Rule Details" />
            </Tabs>

            {explanationTab === 0 && (
              <Box>
                <ShapVisualization
                  shapValues={alert.shap_values}
                  title="Feature Contributions to Fraud Risk"
                />
              </Box>
            )}

            {explanationTab === 1 && (
              <Box>
                {alert.rules_triggered && alert.rules_triggered.length > 0 ? (
                  <List>
                    {alert.rules_triggered.map((rule, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {rule.rule_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {rule.reason}
                          </Typography>
                          <Chip label={rule.rule_id} size="small" variant="outlined" />
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No rules were triggered for this alert. The alert was generated based on ML risk score only.
                  </Typography>
                )}
              </Box>
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
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="in_review">In Review</MenuItem>
                <MenuItem value="pending_info">Pending Info</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
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
              sx={{ mb: 2 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Case Management */}
            <Typography variant="subtitle2" gutterBottom>
              Case Management
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateCase}
              sx={{ mb: 1 }}
            >
              Create New Case
            </Button>
            <Button fullWidth variant="outlined" sx={{ mb: 2 }}>
              Add to Existing Case
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Disposition */}
            <Typography variant="subtitle2" gutterBottom>
              Disposition
            </Typography>
            <Button fullWidth variant="outlined" color="error" sx={{ mb: 1 }}>
              Mark as Fraud
            </Button>
            <Button fullWidth variant="outlined" color="success">
              Mark as Not Fraud
            </Button>

            {/* Metadata */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Last Updated: {formatTimestamp(alert.updated_at)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alert ID: {alert.id}
            </Typography>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
};

export default AlertDetail;
