# Patchright Integration + Demo Test Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement.

**Goal:** Tích hợp patchright thay cho playwright, tạo demo test với retry và logging.

**Architecture:** Thay thế hoàn toàn playwright bằng patchright trong dependencies. Demo test sử dụng GeeTestSolver để giải captcha trên demo site với retry và verbose logging.

**Tech Stack:** Patchright, TypeScript, GeeTestSolver

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Thay đổi dependency playwright → patchright |
| `demo.ts` | Script test demo với retry + logging |
| `tsconfig.json` | Cập nhật config nếu cần |

---

### Task 1: Thay thế Playwright bằng Patchright

**Files:**
- Modify: `package.json`

- [ ] **Thay playwright bằng patchright**

```json
"dependencies": {
  "patchright": "^1.59.1",
  "pngjs": "^7.0.0",
  "sharp": "^0.34.4",
  "node-fetch": "^3.3.2"
}
```

```bash
npm uninstall playwright
npm install patchright
```

- [ ] **Update imports trong code**

Thay tất cả `from 'playwright'` → `from 'patchright'`:

```bash
grep -r "from 'playwright'" src/
```

Cập nhật các file import:

```typescript
// src/solver.ts
import type { Page } from 'patchright';

// src/image-extractor.ts
import type { Page } from 'patchright';

// src/slider-driver.ts
import type { Page } from 'patchright';

// src/config.ts
import process from 'process';

// src/confirm.ts
import type { Page } from 'patchright';
```

- [ ] **Build verify**

```bash
npm run build
```

- [ ] **Commit**

```bash
git add package.json src/
git commit -m "feat: replace playwright with patchright"
```

---

### Task 2: Tạo Demo Test Script

**Files:**
- Create: `demo.ts`

- [ ] **Viết demo script với retry + logging**

```typescript
import { chromium } from 'patchright';
import { GeeTestSolver, solve, CONFIG, setup } from './dist/index.js';

interface LogLevel {
  info: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
}

const logger: LogLevel = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`)
};

interface DemoConfig {
  url: string;
  maxRetries: number;
  headless: boolean;
  verbose: boolean;
}

const DEFAULT_DEMO_CONFIG: DemoConfig = {
  url: 'https://gt4.geetest.com/demov4/slide-popup-en.html',
  maxRetries: 3,
  headless: false,
  verbose: true
};

async function waitForCaptchaReady(page: any): Promise<boolean> {
  try {
    await page.waitForSelector('.geetest_btn', { timeout: 10000 });
    await page.waitForSelector('.geetest_bg', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function runDemo(config: Partial<DemoConfig> = {}) {
  const cfg = { ...DEFAULT_DEMO_CONFIG, ...config };
  const startTime = Date.now();

  logger.info(`Starting GeeTest Solver Demo`);
  logger.info(`URL: ${cfg.url}`);
  logger.info(`Max Retries: ${cfg.maxRetries}`);
  logger.info(`Headless: ${cfg.headless}`);

  setup({
    TIMEOUT: {
      DEFAULT: 60000,
      INITIAL_RETRY: 3000,
      MAX_RETRY: 15000
    }
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
    logger.info(`=== Attempt ${attempt}/${cfg.maxRetries} ===`);

    let browser = null;
    let page = null;

    try {
      logger.info(`Launching browser...`);
      browser = await chromium.launch({
        headless: cfg.headless,
        channel: 'chrome'
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });

      page = await context.newPage();

      logger.info(`Navigating to ${cfg.url}...`);
      await page.goto(cfg.url, { waitUntil: 'networkidle', timeout: 30000 });

      logger.info(`Waiting for captcha to load...`);
      const captchaReady = await waitForCaptchaReady(page);
      if (!captchaReady) {
        throw new Error('Captcha không load được');
      }
      logger.info(`Captcha ready`);

      logger.info(`Clicking slider button...`);
      const sliderButton = await page.$('.geetest_btn');
      if (sliderButton) {
        await sliderButton.click();
      }
      await page.waitForTimeout(2000);

      logger.info(`Solving captcha...`);
      const success = await solve(page, {
        timeout: 60000,
        logLevel: cfg.verbose ? 'verbose' : 'minimal',
        onProgress: (progress) => {
          logger.info(`Progress: Attempt ${progress.attempt}, ${progress.percentage}%`);
        },
        onAttempt: (attemptNum, offset) => {
          logger.info(`Attempt ${attemptNum}: offset=${offset}`);
        }
      });

      if (success) {
        logger.success(`CAPTCHA SOLVED!`);
        logger.info(`Total time: ${Date.now() - startTime}ms`);

        await page.waitForTimeout(2000);
        const result = await page.$('.geetest_result_tips');
        if (result) {
          const text = await result.textContent();
          logger.info(`Result: ${text}`);
        }

        await browser.close();
        return true;
      }
    } catch (error: any) {
      logger.error(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;

      if (cfg.verbose) {
        logger.error(`Stack: ${error.stack}`);
      }
    } finally {
      if (page) await page.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }

    if (attempt < cfg.maxRetries) {
      const waitTime = Math.min(5000 * attempt, 20000);
      logger.info(`Waiting ${waitTime}ms before retry...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }

  logger.error(`All ${cfg.maxRetries} attempts failed`);
  logger.error(`Last error: ${lastError?.message}`);
  logger.info(`Total time: ${Date.now() - startTime}ms`);

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const config: Partial<DemoConfig> = {};

  for (const arg of args) {
    if (arg.startsWith('--url=')) config.url = arg.split('=')[1];
    if (arg.startsWith('--retries=')) config.maxRetries = parseInt(arg.split('=')[1]);
    if (arg === '--headless') config.headless = true;
    if (arg === '--quiet') config.verbose = false;
  }

  const success = await runDemo(config);
  process.exit(success ? 0 : 1);
}

main();
```

- [ ] **Commit**

```bash
git add demo.ts
git commit -m "feat: add demo test script with retry and logging"
```

---

### Task 3: Chạy Demo Test

**Files:**
- Run: `npx tsx demo.ts`

- [ ] **Chạy demo với headless=false để xem browser**

```bash
npx tsx demo.ts --retries=3
```

- [ ] **Nếu fail, chạy debug với verbose**

```bash
npx tsx demo.ts --retries=5 --headless --verbose 2>&1 | tee demo.log
```

- [ ] **Commit kết quả**

```bash
git add demo.log
git commit -m "test: run demo test"
```

---

## Execution Choice

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** - Execute tasks in this session with checkpoints

Which approach?