# GeeTest Solver Refactoring Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement.

**Goal:** Refactor the existing code into OOP structure with clear naming, static helpers, and encapsulated exports.

**Architecture:**
- `GeeTestSolver` - Main orchestrator class
- `ImageExtractor` - Static class for extracting image data from page
- `ImageMatcher` - Static class for finding slider position
- `SliderDriver` - Instance class for dragging slider
- `Config` - Settings with env override

**Tech Stack:** TypeScript, Playwright, Sharp, PNGjs

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/index.ts` | Public exports |
| `src/config.ts` | Config class (keep existing, just re-export) |
| `src/types.ts` | Type definitions |
| `src/image-extractor.ts` | NEW - Static ImageExtractor class |
| `src/image-matcher.ts` | NEW - Static ImageMatcher class |
| `src/slider-driver.ts` | NEW - SliderDriver class |
| `src/solver.ts` | Main GeeTestSolver class |
| `src/confirm.ts` | Verify success (internal) |
| `src/helpers.ts` | Utility functions (internal) |

---

### Task 1: Create ImageExtractor Static Class

**Files:**
- Create: `src/image-extractor.ts`

- [ ] **Write the ImageExtractor class**

```typescript
import type { Page } from 'playwright';
import { CONFIG, type ImageData } from './config.js';

/**
 * Trích xuất image URLs và slice Y từ GeeTest captcha page
 */
export class ImageExtractor {
  /**
   * Extract image URLs và position từ page
   * @param page - Playwright Page object
   * @returns ImageData chứa bgUrl, sliceUrl, sliceY
   */
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
```

- [ ] **Update types.ts** - Thêm type ImageData

```typescript
/**
 * Image data trích xuất từ page
 */
export interface ImageData {
  bgUrl: string;
  sliceUrl: string;
  sliceY: number;
}
```

- [ ] **Commit**

```bash
git add src/image-extractor.ts src/types.ts
git commit -m "feat: add ImageExtractor static class"
```

---

### Task 2: Create ImageMatcher Static Class

**Files:**
- Create: `src/image-matcher.ts`

- [ ] **Write the ImageMatcher class**

```typescript
import { PNG } from 'pngjs';
import { CONFIG, type MatchPosition } from './config.js';

export class ImageMatcher {
  /**
   * Tìm vị trí match tốt nhất giữa background và slice
   * @param bgBuffer - Ảnh background
   * @param sliceBuffer - Ảnh slice
   * @param sliceWidth - Chiều rộng slice
   * @param sliceHeight - Chiều cao slice
   * @returns MatchPosition với position, score, confidence
   */
  static find(
    bgBuffer: Buffer,
    sliceBuffer: Buffer,
    sliceWidth: number,
    sliceHeight: number
  ): MatchPosition {
    const bgPng = ImageMatcher.parsePng(bgBuffer);
    const slicePng = ImageMatcher.parsePng(sliceBuffer);

    let bestX = 0;
    let maxScore = -1;
    const totalPixels = ImageMatcher.countOpaquePixels(slicePng);

    for (let x = 0; x <= bgPng.width - sliceWidth; x++) {
      const extracted = ImageMatcher.extractPart(bgPng, x, sliceWidth, sliceHeight);
      const score = ImageMatcher.calculateDiffScore(extracted, slicePng);

      if (score > maxScore) {
        maxScore = score;
        bestX = x;
      }
    }

    return {
      position: bestX,
      score: maxScore,
      confidence: (maxScore / totalPixels) * 100
    };
  }

  private static parsePng(buffer: Buffer): PNG {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Buffer không hợp lệ');
    }
    return PNG.sync.read(buffer);
  }

  private static calculateDiffScore(extracted: PNG, slice: PNG): number {
    let diff = 0;
    const threshold = CONFIG.IMAGE.THRESHOLD;

    for (let i = 0; i < slice.data.length; i += 4) {
      const alpha = slice.data[i + 3];
      if (alpha > 0) {
        const rDiff = Math.abs(extracted.data[i] - slice.data[i]);
        const gDiff = Math.abs(extracted.data[i + 1] - slice.data[i + 1]);
        const bDiff = Math.abs(extracted.data[i + 2] - slice.data[i + 2]);
        if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
          diff++;
        }
      }
    }
    return diff;
  }

  private static extractPart(bg: PNG, x: number, width: number, height: number): PNG {
    const part = new PNG({ width, height });

    for (let y = 0; y < height; y++) {
      for (let p = 0; p < width * 4; p++) {
        const bgIdx = y * bg.width * 4 + x * 4 + p;
        const partIdx = y * width * 4 + p;
        part.data[partIdx] = bg.data[bgIdx];
      }
    }
    return part;
  }

  private static countOpaquePixels(png: PNG): number {
    let count = 0;
    for (let i = 3; i < png.data.length; i += 4) {
      if (png.data[i] > 0) count++;
    }
    return count;
  }
}
```

- [ ] **Update types.ts** - Thêm type MatchPosition

```typescript
/**
 * Kết quả tìm vị trí match
 */
export interface MatchPosition {
  position: number;
  score: number;
  confidence: number;
}
```

- [ ] **Commit**

```bash
git add src/image-matcher.ts src/types.ts
git commit -m "feat: add ImageMatcher static class"
```

---

### Task 3: Create SliderDriver Class

**Files:**
- Create: `src/slider-driver.ts`

- [ ] **Write the SliderDriver class**

```typescript
import type { Page } from 'playwright';
import { CONFIG, type SliderPosition } from './config.js';
import { getRandomJitter, easeOutCubic } from './helpers.js';

export class SliderDriver {
  /**
   * Kéo slider đến vị trí offset
   * @param page - Playwright Page object
   * @param offsetX - Vị trí cần kéo
   */
  static async drag(page: Page, offsetX: number): Promise<void> {
    const position = await SliderDriver.getSliderPosition(page);
    const { STEPS, DELAY, JITTER } = CONFIG.SLIDER;

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

      await page.mouse.move(x, position.centerY + getRandomJitter(JITTER / 2));
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
```

- [ ] **Update types.ts** - Thêm type SliderPosition

```typescript
/**
 * Vị trí slider
 */
export interface SliderPosition {
  centerX: number;
  centerY: number;
}
```

- [ ] **Commit**

```bash
git add src/slider-driver.ts src/types.ts
git commit -m "feat: add SliderDriver class"
```

---

### Task 4: Update Config - Add MatchPosition, ImageData, SliderPosition

**Files:**
- Modify: `src/config.ts`

- [ ] **Update type exports** - Remove duplicate types, re-export from types.ts

```typescript
// Remove these lines - they are now in types.ts:
// export type SolverOptions = import('./types.js').SolverOptions;
// export type MatchResult = import('./types.js').MatchResult;
// export type ImageInfo = import('./types.js').ImageInfo;
// export type SliderInfo = import('./types.js').SliderInfo;
// export type DragOptions = import('./types.js').DragOptions;

// Replace with:
export type {
  SolverOptions,
  MatchPosition,
  ImageData,
  SliderPosition,
  ProgressInfo
} from './types.js';
```

- [ ] **Commit**

```bash
git add src/config.ts
git commit -m "refactor: re-export types from types.ts"
```

---

### Task 5: Create GeeTestSolver Main Class

**Files:**
- Modify: `src/solver.ts`

- [ ] **Rewrite solver.ts**

```typescript
import type { Page } from 'playwright';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { CONFIG, type SolverOptions, type MatchPosition, type ImageData } from './index.js';
import { verifySuccess } from './confirm.js';
import { calculateRetryDelay } from './helpers.js';
import { ImageExtractor } from './image-extractor.js';
import { ImageMatcher } from './image-matcher.js';
import { SliderDriver } from './slider-driver.js';

/**
 * GeeTest Slider Captcha Solver
 *
 * @example
 * import { GeeTestSolver } from 'playwright-geetest-plugin';
 * const solver = new GeeTestSolver({ timeout: 60000 });
 * await solver.solve(page);
 */
export class GeeTestSolver {
  private options: Required<SolverOptions>;

  constructor(options: SolverOptions = {}) {
    this.options = {
      timeout: options.timeout || CONFIG.TIMEOUT.DEFAULT,
      logLevel: options.logLevel || 'minimal',
      onProgress: options.onProgress || (() => {}),
      onAttempt: options.onAttempt || (() => {})
    };
  }

  /**
   * Giải GeeTest captcha - retry cho đến khi thành công hoặc timeout
   * @param page - Playwright Page object
   * @returns true nếu giải thành công
   * @throws Error nếu timeout
   */
  async solve(page: Page): Promise<boolean> {
    const startTime = Date.now();
    const endTime = startTime + this.options.timeout;
    let attempt = 0;

    while (Date.now() < endTime) {
      attempt++;
      const remaining = endTime - Date.now();
      const elapsed = Date.now() - startTime;
      const percentage = ((elapsed / this.options.timeout) * 100).toFixed(1);

      this.options.onProgress({ attempt, remaining, elapsed, percentage });

      try {
        const offset = await this.calculateOffset(page);
        this.options.onAttempt(attempt, offset);

        await SliderDriver.drag(page, offset);
        await page.waitForTimeout(CONFIG.TIMEOUT.POST_DRAG);

        const success = await verifySuccess(page);
        if (success) return true;

        const delay = calculateRetryDelay(
          attempt,
          CONFIG.TIMEOUT.INITIAL_RETRY,
          CONFIG.TIMEOUT.MAX_RETRY
        );

        if (Date.now() + delay >= endTime) break;
        await page.waitForTimeout(delay);
      } catch (error) {
        const delay = calculateRetryDelay(
          attempt,
          CONFIG.TIMEOUT.INITIAL_RETRY,
          CONFIG.TIMEOUT.MAX_RETRY
        );

        if (Date.now() + delay >= endTime) break;
        await page.waitForTimeout(delay);
      }
    }

    throw new Error(`Không thể giải captcha sau ${attempt} lần thử`);
  }

  /**
   * Tính toán offset cần kéo
   */
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

  /**
   * Tải ảnh từ URL
   */
  private async fetchImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Giải nhanh - convenience function
 * @param page - Playwright Page object
 * @param options - Solver options
 * @returns true nếu giải thành công
 */
export const solve = async (page: Page, options?: SolverOptions): Promise<boolean> => {
  const solver = new GeeTestSolver(options);
  return solver.solve(page);
};
```

- [ ] **Commit**

```bash
git add src/solver.ts
git commit -m "refactor: rewrite Solver as GeeTestSolver class"
```

---

### Task 6: Update index.ts Exports

**Files:**
- Modify: `src/index.ts`

- [ ] **Update exports**

```typescript
/**
 * GeeTest Slider Captcha Solver for Playwright
 * @description Tự động giải GeeTest slider captcha
 * @example
 * import { GeeTestSolver, solve } from 'playwright-geetest-plugin';
 *
 * // Cách 1: Dùng class
 * const solver = new GeeTestSolver({ timeout: 60000 });
 * await solver.solve(page);
 *
 * // Cách 2: Dùng function
 * await solve(page);
 */
export { GeeTestSolver, solve } from './solver.js';
export { CONFIG, setup, reset } from './config.js';
export type { SolverOptions, MatchPosition, ImageData, SliderPosition, ProgressInfo } from './types.js';
```

- [ ] **Commit**

```bash
git add src/index.ts
git commit -m "refactor: update public exports"
```

---

### Task 7: Verify Build

**Files:**
- Run: `npm run build`

- [ ] **Run build**

```bash
npm run build
```

- [ ] **Check output in dist/**

Expected: `dist/index.js`, `dist/index.d.ts` có exports đúng

- [ ] **Commit**

```bash
git add dist/
git commit -m "build: generate dist files"
```

---

### Task 8: Cleanup Old Files

**Files:**
- Delete: `src/extract.ts`, `src/insights.ts`, `src/actions.ts`

- [ ] **Remove old files**

```bash
rm src/extract.ts src/insights.ts src/actions.ts
```

- [ ] **Commit**

```bash
git rm src/extract.ts src/insights.ts src/actions.ts
git commit -m "refactor: remove obsolete files"
```

---

## Execution Choice

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** - Execute tasks in this session with checkpoints

Which approach?