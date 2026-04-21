import type { Page } from 'patchright';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { CONFIG } from './config.js';
import type { MatchPosition } from './types.js';
import { verifySuccess } from './confirm.js';
import { calculateRetryDelay } from './helpers.js';
import { ImageExtractor } from './image-extractor.js';
import { ImageMatcher } from './image-matcher.js';
import { SliderDriver } from './slider-driver.js';

export class GeeTestSolver {
  async solve(page: Page, timeout?: number): Promise<boolean> {
    const startTime = Date.now();
    const timeoutMs = timeout || 90000;
    const endTime = startTime + timeoutMs;
    let attempt = 0;

    while (Date.now() < endTime) {
      attempt++;

      try {
        const offset = await this.calculateOffset(page);

        await SliderDriver.drag(page, offset);
        await page.waitForTimeout(500);

        const success = await verifySuccess(page);
        if (success) return true;

        const delay = calculateRetryDelay(attempt, 1000, 5000);
        if (Date.now() + delay >= endTime) break;
        await page.waitForTimeout(delay);
      } catch (error: any) {
        try {
          const delay = calculateRetryDelay(attempt, 1000, 5000);
          if (Date.now() + delay >= endTime) break;
          await page.waitForTimeout(delay);
        } catch {
        }
      }
    }

    throw new Error(`Không thể giải captcha sau ${attempt} lần thử`);
  }

  private async calculateOffset(page: Page): Promise<number> {
    const imageData = await ImageExtractor.extract(page);

    if (!imageData.bgUrl || !imageData.sliceUrl) {
      throw new Error('Không trích xuất được image URLs');
    }

    const [bgBuffer, sliceBuffer] = await Promise.all([
      this.fetchImage(imageData.bgUrl),
      this.fetchImage(imageData.sliceUrl)
    ]);

    const [bgMeta, sliceMeta] = await Promise.all([
      sharp(bgBuffer).metadata(),
      sharp(sliceBuffer).metadata()
    ]);

    const processedBg = await sharp(bgBuffer)
      .extract({ top: imageData.sliceY, left: 0, width: bgMeta.width, height: sliceMeta.height })
      .grayscale()
      .sharpen()
      .linear(CONFIG.IMAGE.SHARPEN, CONFIG.IMAGE.CONTRAST)
      .png()
      .toBuffer();

    const processedSlice = await sharp(sliceBuffer)
      .grayscale()
      .sharpen()
      .linear(CONFIG.IMAGE.SHARPEN, CONFIG.IMAGE.CONTRAST)
      .png()
      .toBuffer();

    const result: MatchPosition = ImageMatcher.find(
      processedBg,
      processedSlice,
      sliceMeta.width || 0,
      sliceMeta.height || 0
    );

    return result.position;
  }

  private async fetchImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const solve = async (page: Page, timeout?: number): Promise<boolean> => {
  const solver = new GeeTestSolver();
  return solver.solve(page, timeout);
};