# E2E Testing with Playwright

This directory contains end-to-end tests for the FootyGuess Daily application using Playwright.

## Structure

```
e2e/
├── page-objects/          # Page Object Model implementations
│   ├── BasePage.ts       # Base class with common functionality
│   ├── HomePage.ts       # Home page object
│   ├── LoginPage.ts      # Login page object
│   ├── SignupPage.ts     # Signup page object
│   ├── SubmitPhotoPage.ts # Submit photo page object
│   └── index.ts          # Centralized exports
├── home.spec.ts          # Home page tests
├── login.spec.ts         # Login functionality tests
├── signup.spec.ts        # Signup functionality tests
├── submit-photo.spec.ts  # Photo submission tests
├── api.spec.ts           # API endpoint tests
└── README.md            # This file
```

## Guidelines Followed

This test suite follows the guidelines specified in `.rules/playwright-e2e-testing.md`:

### Configuration
- ✅ Chromium/Desktop Chrome browser only
- ✅ Browser contexts for test isolation
- ✅ Parallel execution enabled

### Page Object Model
- ✅ Implemented in `./e2e/page-objects`
- ✅ Uses `data-testid` attributes for resilient selectors
- ✅ Elements located by `await page.getByTestId('selectorName')`
- ✅ Maintainable and reusable page objects

### Test Structure
- ✅ **Arrange, Act, Assert (AAA)** pattern for simplicity and readability
- ✅ Test hooks (beforeEach/afterEach) for setup and teardown
- ✅ Specific expect assertions with matchers
- ✅ Visual comparison with `expect(page).toHaveScreenshot()`

### Testing Coverage
- ✅ UI component testing
- ✅ API testing for backend validation
- ✅ Visual regression testing
- ✅ Responsive design testing (mobile viewports)
- ✅ Error handling and edge cases

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report

# Install Chromium browser
npm run playwright:install

# Run dev server in test mode
npm run dev:e2e
```

## Test Categories

### Home Page Tests (`home.spec.ts`)
- Page loading and rendering
- Navigation to game modes
- Visual regression testing
- Performance testing

### Login Tests (`login.spec.ts`)
- Form validation
- Authentication flow
- Error handling
- Redirect functionality
- Visual testing

### Signup Tests (`signup.spec.ts`)
- Registration form validation
- Password requirements
- Nickname validation
- Error scenarios
- Mobile responsiveness

### Submit Photo Tests (`submit-photo.spec.ts`)
- Authentication requirements
- Permission checking
- Permission denied view
- Form display for authorized users

### API Tests (`api.spec.ts`)
- Authentication endpoints
- Photo retrieval endpoints
- Daily challenge endpoints
- Admin endpoints
- Error handling
- Request validation

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Create Page Object** (if testing a new page):
   ```typescript
   // e2e/page-objects/NewPage.ts
   import { Page, Locator } from '@playwright/test';
   import { BasePage } from './BasePage';

   export class NewPage extends BasePage {
     private readonly element: Locator;

     constructor(page: Page) {
       super(page);
       this.element = page.getByTestId('element-id');
     }

     async performAction() {
       await this.element.click();
     }
   }
   ```

2. **Add data-testid to components**:
   ```tsx
   <button data-testid="my-button">Click Me</button>
   ```

3. **Write tests using AAA pattern**:
   ```typescript
   test('should perform action', async ({ page }) => {
     // Arrange: Set up test conditions
     const newPage = new NewPage(page);
     await newPage.open();

     // Act: Perform the action
     await newPage.performAction();

     // Assert: Verify the result
     await expect(page).toHaveURL(/expected-url/);
   });
   ```

4. **Export new page object**:
   ```typescript
   // e2e/page-objects/index.ts
   export { NewPage } from './NewPage';
   ```

## Best Practices

1. **Use data-testid selectors** for reliability
2. **Follow AAA pattern** for test clarity
3. **Keep page objects DRY** - reuse common methods
4. **Test both happy and error paths**
5. **Include visual regression tests** for UI changes
6. **Test responsive design** on mobile viewports
7. **Mock API responses** for predictable tests
8. **Use meaningful test descriptions**
9. **Group related tests** with `test.describe()`
10. **Clean up after tests** when necessary

## Debugging

### Using Playwright Inspector
```bash
npm run test:e2e:debug
```

### Using UI Mode
```bash
npm run test:e2e:ui
```

### Viewing Traces
When tests fail, traces are automatically captured. View them with:
```bash
npm run test:e2e:report
```

### Taking Screenshots
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

## CI/CD Integration

Tests are configured to:
- Run with 2 retries on CI
- Use 1 worker on CI (sequential execution)
- Generate HTML, list, and JSON reports
- Capture screenshots and videos on failure
- Collect traces on first retry

## Visual Testing

Visual regression tests create baseline screenshots. To update baselines:

```bash
npm run test:e2e -- --update-snapshots
```

Store screenshots in version control for visual regression detection.

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
