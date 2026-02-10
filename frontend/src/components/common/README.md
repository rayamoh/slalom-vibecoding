# Common UI Components - CDS Integration Strategy

## Purpose

This directory provides an abstraction layer between our application code and the UI component library. This allows us to:

1. **Phase 1A (Current)**: Use Material-UI for rapid POC development
2. **Phase 1B (Future)**: Gradually integrate Manulife Connected Design System (CDS) Web Components
3. **Phase 2 (Production)**: Complete migration to CDS with full Manulife branding

## How It Works

### Current Implementation (Material-UI)

All components in `index.ts` currently wrap or re-export Material-UI components:

```typescript
import { Button as MuiButton } from '@mui/material';

export const Button: React.FC<ButtonProps> = (props) => {
  return <MuiButton {...props} />;
};
```

### Future CDS Integration

When CDS packages are available (after Artifactory authentication), we can swap implementations:

```typescript
// Uncomment CDS imports
import { defineCustomElements } from '@cds/ng-web-components/loader';
defineCustomElements(window);

export const Button: React.FC<ButtonProps> = (props) => {
  // Switch to CDS web component
  return <cds-button {...props}>{props.children}</cds-button>;
};
```

## Usage in Application

Instead of importing directly from Material-UI:

```typescript
// ❌ Don't do this
import { Button } from '@mui/material';
```

Import from our common components:

```typescript
// ✅ Do this
import { Button } from '../../components/common';
```

This ensures all component usage can be updated in one place when we migrate to CDS.

## CDS Web Components Integration

### Prerequisites

1. **Artifactory Authentication**: Obtain credentials for Manulife Artifactory
2. **Install Packages**:
   ```bash
   npm install @cds/ng-core@latest @cds/ng-themes@latest @cds/ng-web-components@latest
   ```

3. **Configure Registry** (already done in `.npmrc`):
   ```
   @cds:registry=https://artifactory.ap.manulife.com/artifactory/api/npm/npm/
   ```

### Integration Steps

1. **Load Web Components**:
   ```typescript
   import { defineCustomElements } from '@cds/ng-web-components/loader';
   import '@cds/ng-themes/styles/manulife-theme.css';

   defineCustomElements(window);
   ```

2. **TypeScript Declarations**:
   Create `src/types/cds.d.ts`:
   ```typescript
   declare namespace JSX {
     interface IntrinsicElements {
       'cds-button': any;
       'cds-badge': any;
       // Add other CDS components as needed
     }
   }
   ```

3. **Update Component Wrappers**:
   - Replace MUI implementation with CDS web components
   - Map MUI props to CDS equivalents
   - Add prop transformations if needed

## Component Mapping

| Our Component | Phase 1A (MUI) | Phase 1B (CDS) |
| ------------- | -------------- | -------------- |
| Button        | MuiButton      | `<cds-button>` |
| Chip          | MuiChip        | `<cds-badge>`  |
| Table         | MuiTable       | `<cds-table>`  |
| Alert         | MuiAlert       | `<cds-alert>`  |

## Testing Strategy

1. **Visual Regression**: Capture screenshots before/after CDS migration
2. **Prop Compatibility**: Ensure all props work with both MUI and CDS
3. **Accessibility**: Verify WCAG 2.1 AA compliance with CDS components
4. **Browser Testing**: Test web components across browsers

## Known Limitations

- **No CDS Access Yet**: Waiting for Artifactory credentials
- **Web Components in React**: May require additional polyfills for older browsers
- **Event Handling**: CDS web components may use different event patterns than MUI

## Next Steps

1. ✅ Created component abstraction layer
2. ⏳ Obtain Artifactory authentication
3. ⏳ Install CDS packages
4. ⏳ Test CDS web components in isolation
5. ⏳ Gradually migrate components
6. ⏳ Apply Manulife branding and themes

## Questions for Manulife Team

1. What is the process to obtain Artifactory access?
2. Are there React-specific CDS components available?
3. Which CDS components are mandatory for compliance?
4. Are there CDS design tokens we should use for colors/spacing?
5. What accessibility standards must be met?

---

**Last Updated**: 2026-02-10
**Status**: Phase 1A - Material-UI with abstraction layer
