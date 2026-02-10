import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { ShapValue, FEATURE_LABEL_MAP } from '../types';

interface ShapVisualizationProps {
  shapValues: ShapValue[];
  title?: string;
}

/**
 * SHAP Visualization Component
 *
 * Displays SHAP values as a horizontal bar chart showing feature contributions
 * to the ML fraud risk score.
 *
 * - Positive values (red bars): Features that increase fraud risk
 * - Negative values (blue bars): Features that decrease fraud risk
 */
const ShapVisualization: React.FC<ShapVisualizationProps> = ({
  shapValues,
  title = 'ML Feature Contributions (SHAP Values)',
}) => {
  // Sort by absolute value (most important features first)
  const sortedShapValues = [...shapValues].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Prepare data for chart
  const chartData = sortedShapValues.map((shap) => ({
    feature: FEATURE_LABEL_MAP[shap.feature] || shap.feature,
    value: shap.value,
    absValue: Math.abs(shap.value),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const impact = data.value > 0 ? 'Increases' : 'Decreases';
      const color = data.value > 0 ? '#e53935' : '#1976d2';

      return (
        <Paper sx={{ p: 1.5, border: `2px solid ${color}` }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {data.feature}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {impact} fraud risk
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color }}>
            Contribution: {data.value > 0 ? '+' : ''}
            {data.value.toFixed(3)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (!shapValues || shapValues.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No SHAP explanation data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={['dataMin', 'dataMax']} />
            <YAxis type="category" dataKey="feature" width={250} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? '#e53935' : '#1976d2'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 12, bgcolor: '#e53935', borderRadius: 1 }} />
            <Typography variant="caption">Increases fraud risk</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 12, bgcolor: '#1976d2', borderRadius: 1 }} />
            <Typography variant="caption">Decreases fraud risk</Typography>
          </Box>
        </Box>

        {/* Explanation note */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Note: SHAP (SHapley Additive exPlanations) values show how much each feature contributed
          to the ML model's fraud risk score. Longer bars indicate stronger influence.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ShapVisualization;
