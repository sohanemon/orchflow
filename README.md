# OrchFlow

A lightweight, chainable browser automation library for simulating user interactions and automating web workflows. Perfect for testing, automation, and scripting browser interactions.

## Features

- 🎯 **Chainable API** - Fluent interface for building automation sequences
- ⏱️ **Smart Waits** - Automatic element detection with configurable timeouts
- 🔄 **Retry Logic** - Built-in retry mechanisms for flaky operations
- 📊 **Execution Reports** - Detailed metrics on every action performed
- 🛑 **Abort Control** - Stop execution at any time
- 🔀 **Conditional Branching** - Execute different actions based on conditions
- 🐛 **Debug Mode** - Detailed logging for troubleshooting

## Installation

\`\`\`bash
npm install orchflow
# or
pnpm add orchflow
\`\`\`

## Quick Start

\`\`\`typescript
import { Orchestrator } from 'orchflow';

const orchflow = new Orchestrator({ debug: true });

await orchflow
  .click('#login-button')
  .fill('#email', 'user@example.com')
  .fill('#password', 'password123')
  .click('#submit')
  .waitForVisible('#dashboard')
  .execute();
\`\`\`

## Configuration

\`\`\`typescript
const orchflow = new Orchestrator({
  defaultTimeout: 15000,        // Default wait timeout in ms
  debug: true,                  // Enable debug logging
  delayBetweenActions: 500,     // Delay between actions in ms
});
\`\`\`

## API Reference

### Action Methods (Chainable)

All action methods return `this` for chaining, except `getText()` and `getAttribute()` which return promises.

#### `click(selector, options?)`

Clicks an element. Waits for the element to exist before clicking.

\`\`\`typescript
orchflow
  .click('#submit-button')
  .click('.modal-close', { timeout: 5000 })
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout for this action

---

#### `fill(selector, text, options?)`

Fills an input field with text. Sets the value and triggers input/change events.

\`\`\`typescript
orchflow
  .fill('#email', 'user@example.com')
  .fill('#password', 'secret123', { retry: 3 })
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout
- `retry?: number` - Number of retry attempts (default: 1)

---

#### `type(selector, text, options?)`

Types text character by character, simulating real keyboard input. Useful for fields with input validation.

\`\`\`typescript
orchflow
  .type('#search', 'hello world', { delay: 50 })
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout
- `delay?: number` - Delay between each character in ms

---

#### `clear(selector, options?)`

Clears the value of an input field.

\`\`\`typescript
orchflow
  .fill('#search', 'old text')
  .clear('#search')
  .fill('#search', 'new text')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `hover(selector, options?)`

Hovers over an element, triggering mouseover events.

\`\`\`typescript
orchflow
  .hover('#dropdown-trigger')
  .waitForVisible('#dropdown-menu')
  .click('#dropdown-item')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `select(selector, value, options?)`

Selects an option in a dropdown/select element.

\`\`\`typescript
orchflow
  .select('#country', 'US')
  .select('#category', 'electronics')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `press(key, options?)`

Presses a keyboard key globally.

\`\`\`typescript
orchflow
  .press('Enter')
  .press('Escape')
  .press('Tab')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `waitFor(selector, options?)`

Waits for an element to exist in the DOM.

\`\`\`typescript
orchflow
  .click('#load-more')
  .waitFor('.new-items')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout (default: 15000ms)

---

#### `waitForVisible(selector, options?)`

Waits for an element to be visible (not hidden, not display:none, opacity > 0).

\`\`\`typescript
orchflow
  .click('#show-modal')
  .waitForVisible('.modal')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `waitForClickable(selector, options?)`

Waits for an element to be both visible and enabled (not disabled).

\`\`\`typescript
orchflow
  .fill('#form-input', 'data')
  .waitForClickable('#submit-btn')
  .click('#submit-btn')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `waitForText(text, options?)`

Waits for specific text to appear anywhere on the page.

\`\`\`typescript
orchflow
  .click('#search-button')
  .waitForText('Results found')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `waitForAttribute(selector, attribute, value, options?)`

Waits for an element's attribute to have a specific value.

\`\`\`typescript
orchflow
  .click('#process-button')
  .waitForAttribute('#status', 'data-status', 'complete')
  .execute();
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `assert(selector, options?)`

Asserts that an element meets certain conditions. Throws an error if assertion fails.

\`\`\`typescript
orchflow
  .assert('#success-message', { visible: true })
  .assert('#error-box', { exists: false })
  .assert('#title', { text: 'Welcome' })
  .execute();
\`\`\`

**Options:**
- `text?: string` - Assert element has exact text
- `visible?: boolean` - Assert element is visible
- `exists?: boolean` - Assert element exists (or doesn't exist if false)
- `timeout?: number` - Custom timeout

---

#### `delay(ms)`

Adds a delay between actions.

\`\`\`typescript
orchflow
  .click('#button')
  .delay(1000)
  .click('#next-button')
  .execute();
\`\`\`

---

#### `if(condition)`

Creates a conditional branch. Execute different actions based on a condition.

\`\`\`typescript
orchflow
  .if(() => document.querySelector('#premium-badge'))
  .do((orch) => orch.click('#premium-feature'))
  .else((orch) => orch.click('#upgrade-button'))
  .execute();
\`\`\`

The condition can be synchronous or async:

\`\`\`typescript
orchflow
  .if(async () => {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data.isPremium;
  })
  .do((orch) => orch.click('#premium-action'))
  .else((orch) => orch.click('#free-action'))
  .execute();
\`\`\`

---

### Query Methods (Return Promises)

These methods don't chain and return promises instead.

#### `getText(selector, options?)`

Gets the text content of an element.

\`\`\`typescript
const text = await orchflow.getText('#title');
console.log(text); // "Welcome to our site"
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

#### `getAttribute(selector, attribute, options?)`

Gets an attribute value from an element.

\`\`\`typescript
const href = await orchflow.getAttribute('a.link', 'href');
const dataId = await orchflow.getAttribute('#item', 'data-id');
\`\`\`

**Options:**
- `timeout?: number` - Custom timeout

---

### Execution Methods

#### `execute()`

Executes all queued actions in sequence. Returns an `ExecutionReport`.

\`\`\`typescript
const report = await orchflow
  .click('#button')
  .fill('#input', 'text')
  .execute();

console.log(report);
// {
//   totalDuration: 1234,
//   success: true,
//   steps: [
//     { action: 'click', selector: '#button', duration: 100, status: 'success' },
//     { action: 'fill', selector: '#input', duration: 50, status: 'success' }
//   ]
// }
\`\`\`

---

#### `abort()`

Stops execution immediately.

\`\`\`typescript
const orchflow = new Orchestrator();
orchflow.click('#button').delay(5000).click('#next');

setTimeout(() => orchflow.abort(), 1000);

try {
  await orchflow.execute();
} catch (error) {
  console.log(error.message); // "Orchestration aborted"
}
\`\`\`

---

#### `getHistory()`

Returns the execution history of all completed actions.

\`\`\`typescript
const history = orchflow.getHistory();
history.forEach((step) => {
  console.log(`${step.action}: ${step.duration}ms - ${step.status}`);
});
\`\`\`

---

## Complete Examples

### Example 1: Login Flow

\`\`\`typescript
const orchflow = new Orchestrator({ debug: true });

await orchflow
  .waitForVisible('#login-form')
  .fill('#email', 'user@example.com')
  .fill('#password', 'password123')
  .click('#remember-me')
  .click('#login-button')
  .waitForVisible('#dashboard')
  .assert('#user-profile', { visible: true })
  .execute();
\`\`\`

### Example 2: Form Submission with Validation

\`\`\`typescript
const orchflow = new Orchestrator({ delayBetweenActions: 300 });

await orchflow
  .fill('#name', 'John Doe')
  .fill('#email', 'john@example.com')
  .select('#country', 'US')
  .click('#terms-checkbox')
  .waitForClickable('#submit')
  .click('#submit')
  .waitForText('Thank you for your submission')
  .execute();
\`\`\`

### Example 3: Search and Filter

\`\`\`typescript
const orchflow = new Orchestrator();

await orchflow
  .click('#search-input')
  .type('#search-input', 'laptop', { delay: 50 })
  .press('Enter')
  .waitForVisible('.results')
  .click('#filter-price')
  .select('#price-range', '500-1000')
  .waitForText('Showing')
  .execute();
\`\`\`

### Example 4: Dynamic Content with Retries

\`\`\`typescript
const orchflow = new Orchestrator();

await orchflow
  .click('#load-data')
  .waitForVisible('.spinner', { timeout: 3000 })
  .waitFor('.data-loaded', { timeout: 10000 })
  .fill('#filter', 'active', { retry: 3 })
  .click('#apply-filter')
  .assert('.results', { visible: true })
  .execute();
\`\`\`

### Example 5: Conditional Actions

\`\`\`typescript
const orchflow = new Orchestrator();

await orchflow
  .click('#check-status')
  .delay(500)
  .if(() => document.querySelector('.error-message'))
  .do((orch) => orch.click('#retry').delay(1000))
  .else((orch) => orch.click('#continue'))
  .execute();
\`\`\`

### Example 6: Multi-step Workflow with Assertions

\`\`\`typescript
const orchflow = new Orchestrator({ debug: true });

const report = await orchflow
  .click('#start-wizard')
  .waitForVisible('.step-1')
  .fill('#step1-input', 'value1')
  .click('#next-step')
  .waitForVisible('.step-2')
  .assert('.step-2', { visible: true })
  .fill('#step2-input', 'value2')
  .click('#next-step')
  .waitForVisible('.step-3')
  .click('#complete')
  .waitForText('Success!')
  .execute();

console.log(`Completed in ${report.totalDuration}ms`);
console.log(`Steps: ${report.steps.length}`);
\`\`\`

### Example 7: Extract Data

\`\`\`typescript
const orchflow = new Orchestrator();

// Queue actions
orchflow
  .click('#load-profile')
  .waitForVisible('#profile-card');

// Execute and get data
await orchflow.execute();

// Extract data after execution
const name = await orchflow.getText('#profile-name');
const email = await orchflow.getAttribute('#profile-email', 'data-email');
const userId = await orchflow.getAttribute('#profile', 'data-id');

console.log({ name, email, userId });
\`\`\`

### Example 8: Error Handling

\`\`\`typescript
const orchflow = new Orchestrator();

try {
  await orchflow
    .click('#button')
    .waitFor('#expected-element', { timeout: 5000 })
    .execute();
} catch (error) {
  console.error('Automation failed:', error.message);
  
  const history = orchflow.getHistory();
  const failedStep = history.find((step) => step.status === 'error');
  console.error('Failed at:', failedStep?.action, failedStep?.error);
}
\`\`\`

---

## Best Practices

1. **Use specific selectors** - Prefer IDs over classes for reliability
2. **Add delays for animations** - Use `delay()` or `delayBetweenActions` for smooth transitions
3. **Wait for visibility** - Use `waitForVisible()` instead of just `waitFor()` when possible
4. **Enable debug mode during development** - Helps troubleshoot issues
5. **Use assertions** - Verify expected state at key points
6. **Handle errors gracefully** - Wrap `execute()` in try-catch
7. **Set appropriate timeouts** - Longer timeouts for slow operations
8. **Use retry for flaky operations** - Especially useful for network-dependent actions

---

## Types

\`\`\`typescript
interface ExecutionStep {
  action: string;
  selector?: string;
  value?: string;
  timestamp: number;
  duration: number;
  status: 'success' | 'error';
  error?: string;
}

interface ExecutionReport {
  totalDuration: number;
  steps: ExecutionStep[];
  success: boolean;
  error?: string;
}

interface OrchestratorConfig {
  defaultTimeout?: number;      // Default: 15000ms
  debug?: boolean;              // Default: false
  delayBetweenActions?: number; // Default: 0ms
}
\`\`\`

---

## License

MIT
