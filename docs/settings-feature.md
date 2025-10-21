# Settings / Data Connections Feature

## Overview

Full implementation of the Settings / Data Connections page for LightSignal frontend. This page provides comprehensive management of integrations, demo/live mode toggle, data provenance tracking, and troubleshooting assistance.

## Files Added/Modified

### Core Implementation
- `app/settings/page.tsx` - Main settings page component (replaced placeholder)
- `app/layout.tsx` - Added Settings link to navigation

### Extracted Components
- `components/settings/ConnectionCard.tsx` - Individual connection provider cards
- `components/settings/ProvenancePanel.tsx` - Data provenance and confidence display
- `components/settings/AssistantPanel.tsx` - Troubleshooting assistant with prompts
- `components/settings/SettingsControls.tsx` - Masked inputs and import/export controls
- `components/settings/AuditLog.tsx` - Action audit log display

## Features Implemented

### 1. Connection Overview (Cards Grid)
- Provider cards for QuickBooks, Google Drive, Pinecone/Benchmarks, Weather, etc.
- Status indicators (Connected/Disconnected/Error)
- Last sync timestamps and duration
- Data usage categories
- Action buttons (Connect/Test/Re-sync/Disconnect)
- Provenance tags and error banners

### 2. Global Demo/Live Toggle
- Switch controlling data mode across the app
- Confirmation modal before switching to Live mode
- Backend integration with POST to /api/ai/settings/demo-toggle
- Automatic settings re-fetch after toggle

### 3. Data Provenance & Confidence
- Baseline source display
- Prior usage indicators with weights
- Source list (QuickBooks Cohort, Public Filings, etc.)
- Confidence badges (Low/Medium/High)
- Tooltips explaining each field

### 4. Troubleshooting Assistant
- Chat-style helper for connection issues
- Pre-defined prompts for common problems
- Custom question input
- Suggestion copying to clipboard
- Integration with backend diagnostics

### 5. Permissions & Scopes
- Per-provider scope display
- Missing scope indicators
- Limit scope toggles (UI-only)

### 6. Sync Schedule & Webhooks
- Next scheduled sync display
- Cron expression visibility
- Webhook status badges per provider

### 7. API Keys & Secrets
- Masked password inputs
- Save & Test functionality
- Never displays secrets after save

### 8. Export/Import Settings
- Export settings as JSON download
- Import JSON with drag/drop
- Confirmation modals
- Preview before save

### 9. Audit Log
- Last 20 actions displayed
- Timestamped entries with color-coded results
- Action types: connect/disconnect/test/resync

## Backend Integration

### Primary Endpoint
```typescript
POST ${NEXT_PUBLIC_API_URL}/api/ai/settings/full
Body: { "company_id": "demo", "include_diagnostics": true }
```

### Action Endpoints
- `POST /api/ai/settings/connect { provider }`
- `POST /api/ai/settings/test { provider }`
- `POST /api/ai/settings/resync { provider }`
- `POST /api/ai/settings/disconnect { provider }`
- `POST /api/ai/settings/demo-toggle { mode }`
- `POST /api/ai/settings/api-key { provider, key }`

### Fallback Strategy
1. Primary: Direct API call to NEXT_PUBLIC_API_URL
2. Secondary: callIntent("settings", ...) helper
3. Final: Safe UI stub with consistent shape

## Data Shape

```typescript
type SettingsShape = {
  mode: "demo" | "live";
  connections: Connection[];
  provenance: {
    baseline_source?: string;
    sources?: string[];
    used_priors?: boolean;
    prior_weight?: number;
    confidence?: "low" | "medium" | "high";
  };
  schedule?: { next_sync_human?: string; cron?: string };
  webhooks?: Record<string, { status: string }>;
  audit?: Array<{ at: string; action: string; provider: string; result: string }>;
  assistant_suggestions?: string[];
};
```

## UX Features

### Visual Design
- Clean, minimal styling with Tailwind CSS
- Card-based layout for connections
- Responsive grid (1 col mobile, 2-3 cols desktop)
- Consistent color coding for status indicators

### Loading States
- Shimmer loading placeholders (no spinners)
- Optimistic UI updates for actions
- Loading indicators during async operations

### Error Handling
- Graceful fallback to stub data
- Error banners for failed connections
- Non-blocking toast notifications
- Retry mechanisms built-in

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Testing & Validation

### TypeScript Validation
- `npx tsc --noEmit` passes cleanly
- All components properly typed
- No build errors

### Build Validation
- `npm run build` completes successfully
- Route properly included in build output
- Static analysis passes

### Manual Testing
- Page renders without console errors
- All interactive elements functional
- Responsive design works across breakpoints
- Fallback data displays correctly

## Usage

1. Navigate to `/settings` or click "Settings" in the top navigation
2. View current connection status and data sources
3. Toggle between Demo/Live modes as needed
4. Use troubleshooting assistant for connection issues
5. Export/import settings for backup or migration
6. Monitor sync schedules and audit log

## Future Enhancements

- Real-time webhook status updates
- Advanced filtering for audit log
- Bulk connection management
- Custom sync scheduling
- Enhanced diagnostics modal
- Toast notification system
- Unit test coverage