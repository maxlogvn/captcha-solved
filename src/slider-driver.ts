import type { Page } from 'patchright';
import { CONFIG } from './config.js';
import type { SliderPosition } from './types.js';
import { getRandomJitter, easeOutCubic } from './helpers.js';

export class SliderDriver {
  static async drag(page: Page, offsetX: number): Promise<void> {
    const position = await SliderDriver.getSliderPosition(page);
    const { STEPS, DELAY, JITTER, MOUSE_MOVE_STEPS } = CONFIG.SLIDER;

    await page.mouse.move(position.centerX, position.centerY);
    await page.waitForTimeout(100 + Math.random() * 200);
    await page.mouse.down();
    await page.waitForTimeout(50 + Math.random() * 100);

    for (let i = 1; i <= STEPS; i++) {
      const progress = i / STEPS;
      const eased = easeOutCubic(progress);
      let x = position.centerX + offsetX * eased;

      if (i < STEPS) {
        x += getRandomJitter(JITTER);
      }

      await page.mouse.move(
        x,
        position.centerY + getRandomJitter(JITTER / 2),
        { steps: MOUSE_MOVE_STEPS }
      );
      await page.waitForTimeout(DELAY + Math.random() * DELAY * 0.5);
    }

    await page.waitForTimeout(50 + Math.random() * 100);
    await page.mouse.up();
  }

  private static async getSliderPosition(page: Page): Promise<SliderPosition> {
    const button = await page.$(CONFIG.SELECTORS.BUTTON);
    if (!button) {
      throw new Error(`Slider button không tìm thấy: ${CONFIG.SELECTORS.BUTTON}`);
    }

    const box = await button.boundingBox();
    if (!box) {
      throw new Error('Không lấy được bounding box');
    }

    return {
      centerX: box.x + box.width / 2,
      centerY: box.y + box.height / 2
    };
  }
}