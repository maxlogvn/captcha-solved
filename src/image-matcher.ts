import { PNG } from 'pngjs';
import { CONFIG } from './config.js';
import type { MatchPosition } from './types.js';

const CONFIDENCE_THRESHOLD = 80;

export class ImageMatcher {
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

        if (maxScore / totalPixels * 100 > CONFIDENCE_THRESHOLD) {
          break;
        }
      }
    }

    return {
      position: bestX,
      score: maxScore,
      confidence: totalPixels > 0 ? (maxScore / totalPixels) * 100 : 0
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