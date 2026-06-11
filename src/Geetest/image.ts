import {Page} from "playwright-core";
import sharp from "sharp";


// Mức độ làm nét — giá trị càng cao thì viền càng sắc, nhưng dễ gây nhiễu
const SHARPEN = 4;

// Độ tương phản — giá trị âm làm tối vùng sáng, giúp viền lỗ hổng nổi bật hơn
const CONTRAST = -60;

// Selector của mảnh ghép trong captcha GeeTest
const SLIDE_SELECTOR = ".geetest_slice_bg";


export class ImageHandler {
    private readonly page: Page;
    constructor(page: Page) {
        this.page = page;
    }
    public async cropHandleZone(backgroundBuffer: Buffer, slideBuffer: Buffer) {
        const page = this.page;
        const topSpace = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element ? Math.round(parseFloat(getComputedStyle(element).top)) : 0;
        }, "geetest_slice");

        const backgroundSharp = sharp(backgroundBuffer);
        const slideSharp = sharp(slideBuffer);

        const [bgMeta, slideMeta] = await Promise.all([
            backgroundSharp.metadata(),
            slideSharp.metadata(),
        ]);

        const cropData = backgroundSharp.extract({
            top: topSpace,
            left: 0,
            width: bgMeta.width!,
            height: slideMeta.height!,
        });
        return cropData.toBuffer()
    }

    public async applyFilter(imageBuffer: Buffer): Promise<Buffer> {
        return sharp(imageBuffer)
            .grayscale()              // chuyển sang ảnh xám, loại bỏ nhiễu màu sắc
            .sharpen()                // làm nét viền
            .linear(SHARPEN, CONTRAST) // tăng độ tương phản để viền rõ hơn
            .png()                    // xuất ra định dạng PNG (không nén mất dữ liệu)
            .toBuffer();              // trả về dữ liệu thô thay vì ghi ra file
    }

    public async getBuffer(selector: string){
        const page = this.page;
        const imageUrl =  await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const style = getComputedStyle(element);
            const match = style.backgroundImage.match(/url\("(.*)"\)/);
            return match ? match[1] : null;
        }, selector);
        if (!imageUrl) throw new Error(`Không tìm thấy ảnh với selector: ${selector}`);
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bufferArr = await response.arrayBuffer();
       return Buffer.from(bufferArr)

    }
}