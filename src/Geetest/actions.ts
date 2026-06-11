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

    public async slideToPosition(position : number){
        const page = this.page;
        const button =  page.locator('.geetest_btn');
        // Lấy tọa độ của nút trên màn hình
        const boundingBox = await button.boundingBox();
        if (!boundingBox) throw new Error('Không tìm thấy nút kéo');

        // Tính tọa độ trung tâm của nút
        const startX = boundingBox.x + boundingBox.width / 2;
        const startY = boundingBox.y + boundingBox.height / 2;
        // Nhấn chuột vào nút rồi kéo đến vị trí đích
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + position, startY);
        await page.mouse.up();

    }

}