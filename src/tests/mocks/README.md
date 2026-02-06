# Test Mocks Directory

This directory contains shared mock utilities to reduce duplication across test files.

## Available Mocks

### UI Component Mocks (`ui-components.js`)

Provides reusable mocks for common Radix UI components:

- `mockButton` - Button component mock
- `mockTooltip` - Tooltip component mock
- `mockDialog` - Dialog component mock
- `mockDropdownMenu` - DropdownMenu component mock
- `mockBadge` - Badge component mock
- `mockAccordion` - Accordion component mock
- `mockAIModelRouter` - AIModelRouter component mock

### Usage

#### Option 1: Import individual mocks

```javascript
import { mockButton, mockTooltip } from '@/tests/mocks/ui-components';

vi.mock('@/components/ui/button', () => mockButton);
vi.mock('@/components/ui/tooltip', () => mockTooltip);
```

#### Option 2: Use the helper function

```javascript
import { setupCommonUIMocks } from '@/tests/mocks/ui-components';

// Mocks button, tooltip, dialog, and badge automatically
setupCommonUIMocks();
```

## Benefits

1. **No Duplication** - Define mocks once, use everywhere
2. **Consistency** - All tests use the same mock implementations
3. **Maintainability** - Update mock behavior in one place
4. **Discoverability** - Easy to find and reuse mocks

## Adding New Mocks

When adding a new shared mock:

1. Add the mock export to the appropriate file
2. Document it in this README
3. Update existing test files to use the shared mock
4. Add JSDoc comments explaining the mock's purpose
