# OrchFlow

A lightweight, chainable browser automation library for simulating user interactions and automating web workflows. Perfect for testing, automation, and scripting browser interactions.

## Features

* 🎯 **Chainable API** – Fluent interface for building automation sequences
* ⏱️ **Smart Waits** – Automatic element detection with configurable timeouts
* 🔄 **Retry Logic** – Built-in retry mechanisms for flaky operations
* 📊 **Execution Reports** – Detailed metrics on every action performed
* 🛑 **Abort Control** – Stop execution at any time
* 🔀 **Conditional Branching** – Execute different actions based on conditions
* 🐛 **Debug Mode** – Detailed logging for troubleshooting

## Installation

```bash
npm install orchflow
# or
pnpm add orchflow
```

## Quick Start

```typescript
import { Orchestrator } from 'orchflow';

const orchflow = new Orchestrator({ debug: true });

await orchflow
  .click('#login-button')
  .fill('#email', 'user@example.com')
  .fill('#password', 'password123')
  .click('#submit')
  .waitForVisible('#dashboard')
  .execute();
```

## Configuration

```typescript
const orchflow = new Orchestrator({
  defaultTimeout: 15000,        // Default wait timeout in ms
  debug: true,                  // Enable debug logging
  delayBetweenActions: 500,     // Delay between actions in ms
});
```

---

## API Reference

### Action Methods (Chainable)

All action methods return `this` for chaining, except `getText()` and `getAttribute()` which return promises.

#### `click(selector, options?)`

Clicks an element. Waits for the element to exist before clicking.

```typescript
orchflow
  .click('#submit-button')
  .click('.modal-close', { timeout: 5000 })
  .execute();
```

**Options:**

* `timeout?: number` - Custom timeout for this action

---

#### `fill(selector, text, options?)`

Fills an input field with text. Sets the value and triggers input/change events.

```typescript
orchflow
  .fill('#email', 'user@example.com')
  .fill('#password', 'secret123', { retry: 3 })
  .execute();
```

**Options:**

* `timeout?: number` - Custom timeout
* `retry?: number` - Number of retry attempts (default: 1)

---

#### `type(selector, text, options?)`

Types text character by character, simulating real keyboard input.

```typescript
orchflow
  .type('#search', 'hello world', { delay: 50 })
  .execute();
```

**Options:**

* `timeout?: number`
* `delay?: number` - Delay between each character in ms

---

#### `clear(selector, options?)`

Clears the value of an input field.

```typescript
orchflow
  .fill('#search', 'old text')
  .clear('#search')
  .fill('#search', 'new text')
  .execute();
```

---

#### `hover(selector, options?)`

Hovers over an element, triggering mouseover events.

```typescript
orchflow
  .hover('#dropdown-trigger')
  .waitForVisible('#dropdown-menu')
  .click('#dropdown-item')
  .execute();
```

---

#### `select(selector, value, options?)`

Selects an option in a dropdown/select element.

```typescript
orchflow
  .select('#country', 'US')
  .select('#category', 'electronics')
  .execute();
```

---

#### `press(key, options?)`

Presses a keyboard key globally.

```typescript
orchflow
  .press('Enter')
  .press('Escape')
  .press('Tab')
  .execute();
```

---

#### `waitFor(selector, options?)`

Waits for an element to exist in the DOM.

```typescript
orchflow
  .click('#load-more')
  .waitFor('.new-items')
  .execute();
```

---

#### `waitForVisible(selector, options?)`

Waits for an element to be visible.

```typescript
orchflow
  .click('#show-modal')
  .waitForVisible('.modal')
  .execute();
```

---

#### `waitForClickable(selector, options?)`

Waits for an element to be visible and enabled.

```typescript
orchflow
  .fill('#form-input', 'data')
  .waitForClickable('#submit-btn')
  .click('#submit-btn')
  .execute();
```

---

#### `waitForText(text, options?)`

Waits for specific text to appear anywhere on the page.

```typescript
orchflow
  .click('#search-button')
  .waitForText('Results found')
  .execute();
```

---

#### `waitForAttribute(selector, attribute, value, options?)`

Waits for an element’s attribute to have a specific value.

```typescript
orchflow
  .click('#process-button')
  .waitForAttribute('#status', 'data-status', 'complete')
  .execute();
```

---

#### `assert(selector, options?)`

Asserts that an element meets certain conditions.

```typescript
orchflow
  .assert('#success-message', { visible: true })
  .assert('#error-box', { exists: false })
  .assert('#title', { text: 'Welcome' })
  .execute();
```

**Options:**

* `text?: string`
* `visible?: boolean`
* `exists?: boolean`
* `timeout?: number`

---

#### `delay(ms)`

Adds a delay between actions.

```typescript
orchflow
  .click('#button')
  .delay(1000)
  .click('#next-button')
  .execute();
```

---

#### `if(condition)`

Creates a conditional branch. Execute different actions based on a condition.

```typescript
orchflow
  .if(() => document.querySelector('#premium-badge'))
  .do((orch) => orch.click('#premium-feature'))
  .else((orch) => orch.click('#upgrade-button'))
  .execute();
```

Async condition:

```typescript
orchflow
  .if(async () => {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data.isPremium;
  })
  .do((orch) => orch.click('#premium-action'))
  .else((orch) => orch.click('#free-action'))
  .execute();
```

---

### Query Methods (Return Promises)

#### `getText(selector, options?)`

Gets the text content of an element.

```typescript
const text = await orchflow.getText('#title');
console.log(text); // "Welcome to our site"
```

---

#### `getAttribute(selector, attribute, options?)`

Gets an attribute value from an element.

```typescript
const href = await orchflow.getAttribute('a.link', 'href');
const dataId = await orchflow.getAttribute('#item', 'data-id');
```

---

### Execution Methods

#### `execute()`

Executes all queued actions in sequence.

```typescript
const report = await orchflow
  .click('#button')
  .fill('#input', 'text')
  .execute();

console.log(report);
```

---

#### `abort()`

Stops execution immediately.

```typescript
const orchflow = new Orchestrator();
orchflow.click('#button').delay(5000).click('#next');

setTimeout(() => orchflow.abort(), 1000);

try {
  await orchflow.execute();
} catch (error) {
  console.log(error.message); // "Orchestration aborted"
}
```

---

#### `getHistory()`

Returns the execution history.

```typescript
const history = orchflow.getHistory();
history.forEach((step) => {
  console.log(`${step.action}: ${step.duration}ms - ${step.status}`);
});
```

---

## Examples

### 1️⃣ Login Flow

```typescript
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
```

### 2️⃣ Form Submission

```typescript
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
```

### 3️⃣ Search and Filter

```typescript
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
```

### 4️⃣ Dynamic Content with Retries

```typescript
const orchflow = new Orchestrator();

await orchflow
  .click('#load-data')
  .waitForVisible('.spinner', { timeout: 3000 })
  .waitFor('.data-loaded', { timeout: 10000 })
  .fill('#filter', 'active', { retry: 3 })
  .click('#apply-filter')
  .assert('.results', { visible: true })
  .execute();
```

### 5️⃣ Conditional Actions

```typescript
const orchflow = new Orchestrator();

await orchflow
  .click('#check-status')
  .delay(500)
  .if(() => document.querySelector('.error-message'))
  .do((orch) => orch.click('#retry').delay(1000))
  .else((orch) => orch.click('#continue'))
  .execute();
```

### 6️⃣ Multi-step Workflow with Assertions

```typescript
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
```

### 7️⃣ Extract Data

```typescript
const orchflow = new Orchestrator();

orchflow.click('#load-profile').waitForVisible('#profile-card');

await orchflow.execute();

const name = await orchflow.getText('#profile-name');
const email = await orchflow.getAttribute('#profile-email', 'data-email');
const userId = await orchflow.getAttribute('#profile', 'data-id');

console.log({ name, email, userId });
```

### 8️⃣ Error Handling

```typescript
const orchflow = new Orchestrator();

try {
  await orchflow
    .click('#button')
    .waitFor('#expected-element', { timeout: 5000 })
    .execute();
} catch (error) {
  console.error('Automation failed:', error.message);
  
  const history = orchflow.getHistory();
  const failedStep = history.find((s) => s.status === 'error');
  console.error('Failed at:', failedStep?.action, failedStep?.error);
}
```

---

## Best Practices

1. ✅ Use specific selectors (`#id` > `.class`)
2. 🕐 Add delays for animations
3. 👀 Prefer `waitForVisible()` over `waitFor()`
4. 🧩 Enable `debug: true` in development
5. ✅ Use assertions for validation
6. 🚫 Wrap `execute()` in try/catch
7. ⏱️ Adjust timeouts for slower operations
8. 🔁 Use retries for flaky actions

---

## Types

```typescript
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
```

