import { Page } from "playwright-core";
import { PNG } from 'pngjs';

const THRESHOLD = 10;

export class Calculator {
    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }



    // Đếm số pixel khác nhau giữa vùng cắt từ ảnh nền và mảnh ghép
    private countDifferentPixels(region: PNG, slide: PNG): number {
        let count = 0;

        // Mỗi pixel gồm 4 byte: R, G, B, Alpha
        for (let i = 0; i < slide.data.length; i += 4) {
            const alpha = slide.data[i + 3];

            // Bỏ qua pixel trong suốt
            if (alpha === 0) continue;

            const rDiff = Math.abs(region.data[i]     - slide.data[i]);
            const gDiff = Math.abs(region.data[i + 1] - slide.data[i + 1]);
            const bDiff = Math.abs(region.data[i + 2] - slide.data[i + 2]);

            // Nếu bất kỳ kênh màu nào vượt ngưỡng thì tính là khác nhau
            if (rDiff > THRESHOLD || gDiff > THRESHOLD || bDiff > THRESHOLD) {
                count++;
            }
        }

        return count;
    }

    // Cắt một vùng từ ảnh nền tại vị trí offsetX, cùng kích thước với mảnh ghép
    private extractBackgroundRegion(offsetX: number, background: PNG, slide: PNG): PNG {
        const region = new PNG({ width: slide.width, height: slide.height });

        for (let row = 0; row < slide.height; row++) {
            for (let byteIndex = 0; byteIndex < slide.width * 4; byteIndex++) {
                const backgroundIndex = row * background.width * 4 + offsetX * 4 + byteIndex;
                const regionIndex = row * slide.width * 4 + byteIndex;
                region.data[regionIndex] = background.data[backgroundIndex];
            }
        }

        return region;
    }

    public findSlidePosition(background: Buffer, slide: Buffer): number {
        const backgroundPNG = PNG.sync.read(background);
        const slidePNG = PNG.sync.read(slide);

        let bestPosition = 0;
        let minScore = Infinity;

        for (let x = 0; x <= backgroundPNG.width - slidePNG.width; x++) {
            const backgroundRegion = this.extractBackgroundRegion(x, backgroundPNG, slidePNG);
            const score = this.countDifferentPixels(backgroundRegion, slidePNG);

            if (score < minScore) {
                minScore = score;
                bestPosition = x;
            }
        }

        return bestPosition;
    }
}