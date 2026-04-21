import process from 'process';
import { chromium } from 'patchright';
import { solve, setup } from './dist/index.js';

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
    await page.waitForSelector('.geetest_btn_click', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const isVisible = await page.isVisible('.geetest_btn_click');
    return isVisible;
  } catch {
    return false;
  }
}

async function runDemo(config: Partial<DemoConfig> = {}) {
  const cfg = { ...DEFAULT_DEMO_CONFIG, ...config };
  const startTime = Date.now();

  logger.info('Starting GeeTest Solver Demo');
  logger.info(`URL: ${cfg.url}`);
  logger.info(`Max Retries: ${cfg.maxRetries}`);
  logger.info(`Headless: ${cfg.headless}`);

  setup({
    TIMEOUT: {
      DEFAULT: 60000,
      POST_DRAG: 500,
      INITIAL_RETRY: 3000,
      MAX_RETRY: 15000,
      BACKOFF_MULTIPLIER: 1.5
    }
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
    logger.info(`=== Attempt ${attempt}/${cfg.maxRetries} ===`);

    let browser = null;
    let page = null;

    try {
      logger.info('Launching browser...');
      browser = await chromium.launch({
        headless: cfg.headless
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });

      page = await context.newPage();

      logger.info(`Navigating to ${cfg.url}...`);
      await page.goto(cfg.url, { waitUntil: 'networkidle', timeout: 30000 });

      logger.info('Waiting for captcha to load...');
      await page.waitForTimeout(5000);

      const captchaReady = await waitForCaptchaReady(page);
      if (!captchaReady) {
        throw new Error('Captcha không load được');
      }
      logger.info('Captcha ready');

      logger.info('Clicking slider button to show captcha...');
      const sliderButton = await page.$('.geetest_btn_click');
      if (sliderButton) {
        await sliderButton.click();
      }
      await page.waitForTimeout(3000);

      logger.info('Waiting for captcha images to appear...');
      await page.waitForSelector('.geetest_bg', { timeout: 10000 });

      logger.info('Solving captcha... (this may take a while)');
      const success = await solve(page, 120000);

      if (success) {
        logger.success('CAPTCHA SOLVED!');
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
      if (page) await page.close().catch(() => { });
      if (browser) await browser.close().catch(() => { });
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
