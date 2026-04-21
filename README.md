# playwright-geetest-plugin

GeeTest Slider Captcha Solver for Playwright/Patchright.

## Install

```bash
npm install playwright-geetest-plugin
```

## Usage

```typescript
import { GeeTestSolver } from 'playwright-geetest-plugin';
import { patchright } from 'patchright';

const browser = await patchright.launch();
const page = await browser.newPage();

await page.goto('https://example.com/captcha');

// Solve GeeTest Slider Captcha
const solver = new GeeTestSolver();
await solver.solve(page);
```

## API

### `GeeTestSolver`

Main solver class.

#### `solve(page, timeout?)`

Solve GeeTest slider captcha on the page.

- `page` (Page): Playwright/Patchright page object
- `timeout` (number, optional): Timeout in ms (default: 90000)

Returns `Promise<boolean>` - true if solved, throws error if failed.

#### `reset()`

Reset solver state for reuse.

#### `setup(page)`

Setup page event listeners.

## Configuration

```typescript
import { GeeTestSolver, CONFIG } from 'playwright-geetest-plugin';

// Override default config
CONFIG.SLIDER.POST_DRAG = 1000;
```

## Demo

```bash
npm run demo
```