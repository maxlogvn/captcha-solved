import type { Page } from 'patchright';
import { CONFIG } from './config.js';
import type { ImageData } from './types.js';

export class ImageExtractor {
  static async extract(page: Page): Promise<ImageData> {
    const selectors = CONFIG.SELECTORS;

    return await page.evaluate((sel) => {
      const getBgUrl = (selector: string): string | null => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const style = getComputedStyle(el);
        const match = style.backgroundImage.match(/url\("(.*)"\)/);
        return match ? match[1] : null;
      };

      const bgUrl = getBgUrl(sel.BACKGROUND);
      const sliceUrl = getBgUrl(sel.SLICE_BG);

      const sliceEl = document.querySelector(sel.SLICE);
      const sliceY = sliceEl ? Math.round(parseFloat(getComputedStyle(sliceEl).top)) : 0;

      return { bgUrl: bgUrl || '', sliceUrl: sliceUrl || '', sliceY };
    }, selectors);
  }
}