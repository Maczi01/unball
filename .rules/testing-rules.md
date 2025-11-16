# Testing Guide

This document provides comprehensive guidelines for testing in the FootyGuess Daily project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [Component Testing](#component-testing)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [API Mocking with MSW](#api-mocking-with-msw)
- [Best Practices](#best-practices)
- [Coverage Requirements](#coverage-requirements)

## Overview

The project uses a comprehensive testing strategy:

- **Vitest** - Fast unit and integration tests
- **React Testing Library** - Component testing with accessibility focus
- **Playwright** - End-to-end testing (Chromium only)
- **MSW (Mock Service Worker)** - API request mocking

## Test Structure

```
.
├── tests/                    # Test utilities and setup
│   ├── setup/
│   │   └── vitest.setup.ts  # Global test setup
│   ├── mocks/
│   │   ├── handlers.ts      # MSW API handlers
│   │   └── server.ts        # MSW server setup
│   └── utils/
│       └── test-utils.tsx   # Custom testing utilities
├── src/
│   ├── **/*.test.ts(x)      # Unit/component tests (co-located)
│   └── lib/
│       └── utils.test.ts    # Example unit test
├── e2e/                      # Playwright E2E tests
│   ├── pages/               # Page Object Models
│   │   ├── BasePage.ts
│   │   └── HomePage.ts
│   └── *.spec.ts            # E2E test files
├── vitest.config.ts         # Vitest configuration
└── playwright.config.ts     # Playwright configuration
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm run test

# Watch mode (recommended during development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open UI mode for interactive testing
npm run test:ui
```

### End-to-End Tests

```bash
# Install Playwright browsers (one-time setup)
npm run playwright:install

# Run E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

## Unit Testing with Vitest

### Basic Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange - Set up test data
    const input = 'test';

    // Act - Execute the function
    const result = myFunction(input);

    // Assert - Verify the result
    expect(result).toBe('expected output');
  });
});
```

### Mocking with Vitest

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on existing function
const spy = vi.spyOn(object, 'method');

// Mock a module
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

### Testing Utilities

Use the custom test utilities from `tests/utils/test-utils.tsx`:

```typescript
import { createMockSupabaseClient, waitFor } from '@/tests/utils/test-utils';

// Create mock Supabase client
const mockSupabase = createMockSupabaseClient();

// Wait for async operations
await waitFor(100);
```

## Component Testing

### Testing React Components

```typescript
import { render, screen, userEvent } from '@/tests/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);

    const heading = screen.getByRole('heading', { name: /my component/i });
    expect(heading).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Accessible Queries (Preferred)

Use accessibility-focused queries in this order:

1. `getByRole` - Best for interactive elements
2. `getByLabelText` - For form inputs
3. `getByPlaceholderText` - For inputs without labels
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort only

### Testing Async Components

```typescript
import { waitFor } from '@testing-library/react';

it('should load data asynchronously', async () => {
  render(<AsyncComponent />);

  // Wait for element to appear
  const data = await screen.findByText(/loaded data/i);
  expect(data).toBeInTheDocument();

  // Or use waitFor for complex conditions
  await waitFor(() => {
    expect(screen.getByText(/status: complete/i)).toBeInTheDocument();
  });
});
```

## E2E Testing with Playwright

### Page Object Model (POM)

Always use the Page Object Model pattern:

```typescript
// e2e/pages/GamePage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class GamePage extends BasePage {
  private readonly mapContainer: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mapContainer = page.locator('[data-testid="map-container"]');
    this.submitButton = page.getByRole('button', { name: /submit guess/i });
  }

  async placePin(lat: number, lng: number) {
    await this.mapContainer.click();
    // Implementation
  }

  async submitGuess() {
    await this.submitButton.click();
  }
}
```

### Writing E2E Tests

```typescript
// e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';
import { GamePage } from './pages/GamePage';

test.describe('Game Flow', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto('/play/normal');
  });

  test('should complete a full game round', async ({ page }) => {
    // Place pin on map
    await gamePage.placePin(51.5074, -0.1278);

    // Select year
    await gamePage.selectYear(1966);

    // Submit guess
    await gamePage.submitGuess();

    // Verify score is displayed
    await expect(page.getByText(/score:/i)).toBeVisible();
  });
});
```

### Visual Regression Testing

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

## API Mocking with MSW

### Adding Mock Handlers

Add API handlers in `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET endpoint
  http.get('/api/photos', () => {
    return HttpResponse.json({
      photos: [
        { id: 1, url: 'https://example.com/photo.jpg' },
      ],
    });
  }),

  // POST endpoint
  http.post('/api/scores', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // Error handling
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];
```

### Using MSW in Tests

MSW is automatically set up in `tests/mocks/server.ts`. For test-specific handlers:

```typescript
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('should handle API error', async () => {
  // Override handler for this test only
  server.use(
    http.get('/api/photos', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  // Test implementation
  render(<PhotoGallery />);
  expect(await screen.findByText(/error loading/i)).toBeInTheDocument();
});
```

## Best Practices

### General Testing Principles

1. **Test behavior, not implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or implementation details

2. **Write descriptive test names**
   ```typescript
   // Good
   it('should display error message when form submission fails')

   // Bad
   it('should work')
   ```

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` for setup
   - Clean up after tests

4. **Use meaningful assertions**
   ```typescript
   // Good
   expect(result).toBe(expected);

   // Better (with message)
   expect(result).toBe(expected, 'Score calculation should match formula');
   ```

### Vitest Best Practices

- Use `describe` blocks to group related tests
- Leverage `vi.mock()` at the top level for module mocks
- Use inline snapshots for better readability
- Enable type checking in tests with TypeScript
- Use `expectTypeOf()` for type-level assertions

### Playwright Best Practices

- **Always use Chromium only** (as per project guidelines)
- Use resilient locators (role, label, test-id)
- Implement Page Object Model for maintainability
- Use `expect(page).toHaveURL()` instead of checking `page.url()`
- Enable trace on first retry for debugging
- Use browser contexts for test isolation

### React Testing Library Best Practices

- Use accessible queries (`getByRole`, `getByLabelText`)
- Use `userEvent` over `fireEvent` for realistic interactions
- Wait for async updates with `waitFor` or `findBy*` queries
- Test components from the user's perspective
- Avoid `container.querySelector()` - use accessible queries

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
# Located at: ./coverage/index.html
```

### Coverage Configuration

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 75,
    functions: 75,
    branches: 75,
    statements: 75,
  },
}
```

## Troubleshooting

### Common Issues

**Tests fail with module import errors**
- Ensure path aliases are configured in both `tsconfig.json` and `vitest.config.ts`

**Playwright tests timeout**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify correct base URL configuration

**MSW handlers not working**
- Check handler URL matches exactly
- Verify server setup is imported in test files
- Ensure handlers are defined before tests run

**React Testing Library queries fail**
- Use `screen.debug()` to see current DOM
- Check if element is rendered asynchronously (use `findBy*`)
- Verify correct query type for the element

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
