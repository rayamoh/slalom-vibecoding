/**
 * Common UI Components - Abstraction Layer
 *
 * These components wrap Material-UI and can be easily swapped for
 * Manulife Connected Design System (CDS) components when available.
 *
 * Phase 1A: Material-UI implementation
 * Phase 1B: CDS Web Components integration
 * Phase 2: Full CDS implementation
 */

import React from 'react';

// Material-UI imports (current)
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { Chip as MuiChip, ChipProps as MuiChipProps } from '@mui/material';
import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer as MuiTableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
} from '@mui/material';

// CDS imports (future - uncomment when available)
// import { defineCustomElements } from '@cds/ng-web-components/loader';
// defineCustomElements(window);

// =============================================================================
// Button Component
// =============================================================================

export interface ButtonProps extends MuiButtonProps {
  // Add any CDS-specific props here in the future
}

export const Button: React.FC<ButtonProps> = (props) => {
  // Phase 1A: Material-UI
  return <MuiButton {...props} />;

  // Phase 1B: CDS Web Component (when available)
  // return <cds-button {...props}>{props.children}</cds-button>;
};

// =============================================================================
// Chip/Badge Component
// =============================================================================

export interface ChipProps extends MuiChipProps {
  // Add any CDS-specific props here
}

export const Chip: React.FC<ChipProps> = (props) => {
  // Phase 1A: Material-UI
  return <MuiChip {...props} />;

  // Phase 1B: CDS Badge (when available)
  // return <cds-badge {...props}>{props.label}</cds-badge>;
};

// =============================================================================
// Table Components
// =============================================================================

export const Table = MuiTable;
export const TableBody = MuiTableBody;
export const TableCell = MuiTableCell;
export const TableContainer = MuiTableContainer;
export const TableHead = MuiTableHead;
export const TableRow = MuiTableRow;

// Future: CDS Table components
// export const Table = CDSTable;
// etc.

// =============================================================================
// Export all common components
// =============================================================================

export {
  // Re-export Material-UI components that don't need abstraction yet
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';

// Export types separately
export type { SelectChangeEvent } from '@mui/material';

// Icons
export {
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
