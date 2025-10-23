# Tax Optimization Page - Testing Guide

## Running Validation Tests

The Tax page includes a comprehensive validation and testing system. Since Jest is not installed in this project, we've created a browser-based testing system.

### Browser Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the Tax page in your browser:
   ```
   http://localhost:3000/tax
   ```

3. Open the browser console (F12) and run the validation tests:
   ```javascript
   // Import the validation functions (they're globally available)
   const { runValidationTests } = window.taxPageValidation;
   
   // Run all validation tests
   const results = runValidationTests();
   console.log(`Tests: ${results.passed} passed, ${results.failed} failed`);
   results.results.forEach(result => console.log(result));
   ```

4. Test individual utility functions:
   ```javascript
   const { formatCurrency, getKpiTooltip, validateTaxData, SAMPLE_TAX_DATA } = window.taxPageValidation;
   
   // Test currency formatting
   console.log(formatCurrency(46230)); // Should output: "$46,230"
   
   // Test KPI tooltips
   console.log(getKpiTooltip('tax_liability_ytd')); // Should output tooltip text
   
   // Test data validation
   console.log(validateTaxData(SAMPLE_TAX_DATA)); // Should output: true
   ```

### Manual Testing Checklist

#### Basic Functionality
- [ ] Page loads without errors
- [ ] KPI cards display with correct formatting
- [ ] Charts render properly (liability forecast, expense mix, peer comparison)
- [ ] All sections are present and visible

#### Interactive Features
- [ ] "Send to Accountant" buttons trigger success toasts
- [ ] "Add Reminder" buttons open the reminder modal
- [ ] "Run in Scenario Lab" buttons open the scenario modal
- [ ] Set-aside slider updates values and chart
- [ ] Tax Coach chat submits questions and shows responses

#### Error Handling
- [ ] API failures fall back to stub data gracefully
- [ ] Missing data displays "—" instead of crashing
- [ ] Toast notifications appear for both success and error cases
- [ ] Modals can be opened and closed properly

#### UI/UX
- [ ] Tooltips appear on hover for KPI cards and info icons
- [ ] Provenance badges show data source information
- [ ] Color coding works correctly (green/yellow/red for states)
- [ ] Responsive layout works on different screen sizes
- [ ] Loading states show shimmer animations

#### Data Integration
- [ ] Backend-first API call to `/api/ai/tax/full` is attempted
- [ ] Fallback to `callIntent("tax_optimization")` works
- [ ] Final fallback to STUB data provides consistent UI
- [ ] Real backend data overrides stub when available

### Performance Testing

1. Check network requests in browser DevTools:
   - Should see POST to `/api/ai/tax/full` on page load
   - Action buttons should trigger appropriate API calls
   - Failed requests should not cause UI errors

2. Check console for errors:
   - No JavaScript errors should appear
   - TypeScript compilation should be clean

3. Test with simulated slow network:
   - Loading states should appear
   - Timeouts should be handled gracefully

## TypeScript Validation

Run the TypeScript compiler to ensure no type errors:

```bash
npx tsc --noEmit
```

This should complete without any errors, confirming that:
- All components have correct prop types
- API interfaces match expected data structures
- Utility functions have proper return types

## Component Architecture

The Tax page is built with:

1. **Main Page Component** (`app/tax/page.tsx`):
   - Client-side component with data fetching
   - Backend-first approach with multiple fallbacks
   - State management for modals and data

2. **Chart Components** (`components/charts/TaxCharts.tsx`):
   - Uses recharts library for visualizations
   - Responsive and handles empty data gracefully

3. **UI Components**:
   - **ToastProvider** (`components/ui/ToastProvider.tsx`): Non-blocking notifications
   - **TaxModals** (`components/ui/TaxModals.tsx`): Scenario lab and reminder modals  
   - **Tooltip** (`components/ui/Tooltip.tsx`): Enhanced tooltips with provenance

4. **Validation Module** (`app/tax/__tests__/tax.test.ts`):
   - Utility functions and type definitions
   - Data validation and browser-based testing
   - Sample data and integration tests

## API Endpoints

The page integrates with these endpoints:

- `POST /api/ai/tax/full` - Main data fetch
- `POST /api/ai/tax/priorities/save` - Send to accountant
- `POST /api/ai/tax/ask` - Tax coach questions
- Fallback: `callIntent("tax_optimization")` helper

All endpoints include error handling and user feedback via toasts.