# Admin Dashboard Enhancement Plan

## Phase 1: Fix ESLint TypeScript Parsing
The current `eslint.config.js` is failing to parse TypeScript. We will update it to correctly use `tseslint.config`:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

## Phase 2: Dependencies
Install charting library:
`npm install recharts`

## Phase 3: Update `AdminDashboard.tsx` Overview Tab
1. **State Management:**
   - Add state for filters: `searchTerm`, `scoreRange`, `dateRange`.
   - Add mock historical data (until connected to Supabase DB) to feed the charts.
2. **Filter UI Component:**
   - Create a flex-row with an input for text search, select dropdowns for score thresholds, and a date picker.
3. **Charts Implementation:**
   - **LineChart:** Mapping dates (X-axis) to Average SEO Scores (Y-axis).
   - **PieChart:** Breakdown of audit items (Success vs Warnings vs Errors).
4. **Export Implementation:**
   - Add a `handleExportCSV` function that maps the filtered dataset into a CSV string.
   - Use `URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }))` to trigger the download.

## Phase 4: UI Refinement
Ensure all new components use Tailwind CSS and map to the existing Shadcn-inspired design system (`bg-white`, `border-slate-200`, `shadow-sm`, `rounded-lg`).