import {Page} from "playwright-core";

export class Actions{
    private readonly page: Page;
    constructor(page : Page) {
        this.page = page;
    }
    public async open(element : string =".geetest_btn_click"){
        const page = this.page;
        await page.waitForSelector(element, { timeout: 15_000 });
        const openBnt = page.locator(element);
        await openBnt.click();
        await page.waitForSelector('.geetest_bg', { timeout: 10_000 });
    }

    public async slideToPosition(position: number): Promise<void> {
        const page = this.page;
        const button = page.locator('.geetest_btn');
        const boundingBox = await button.boundingBox();
        if (!boundingBox) throw new Error('Không tìm thấy nút kéo');

        const startX = boundingBox.x + boundingBox.width / 2;
        const startY = boundingBox.y + boundingBox.height / 2;

        // Di chuyển chuột đến nút, nhấn giữ
        await page.mouse.move(startX, startY);
        await page.mouse.down();

        // Kéo từ từ đến vị trí đích
        await page.mouse.move(startX + position, startY, { steps: 20 });

        // Thả chuột
        await page.mouse.up();
    }


    public async validate(): Promise<boolean> {
        const page = this.page;
        const selector = ".geetest_result_tips";
        const failureMsg = [
            "Please try again",
            "Vui lòng thử lại",
            "请再试一次"
        ];

        // Chờ element kết quả xuất hiện
        await page.waitForSelector(selector, {timeout: 5_000});
        const element = await page.$(selector);
        if (!element) return false;

        const text = await element.textContent();

        // Nếu có text thì kiểm tra có chứa thông báo lỗi không
        if (text && text.trim() !== '') {
            const hasFailed = failureMsg.some(msg => text.includes(msg));
            return !hasFailed;
        }

        // Không có text thì kiểm tra qua class CSS
        const className = await page.$eval(selector, el => el.className);
        return className.includes('success') || !className.includes('error');
    }

}