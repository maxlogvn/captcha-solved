import type { Page } from 'patchright';
import { CONFIG } from './config.js';

const checkElementClass = async (page: Page, selector: string): Promise<boolean> => {
  try {
    const className = await page.$eval(selector, el => el.className);
    return className.includes('success') || !className.includes('error');
  } catch {
    return false;
  }
};

export const verifySuccess = async (page: Page): Promise<boolean> => {
  const selector = CONFIG.SELECTORS.RESULT;

  try {
    const element = await page.$(selector);
    if (!element) return false;

    const text = await element.textContent();
    if (!text || text.trim() === '') {
      return checkElementClass(page, selector);
    }

    const hasFailed = CONFIG.FAILURE_MESSAGES.some(msg => text.includes(msg));
    return !hasFailed;
  } catch {
    return false;
  }
};