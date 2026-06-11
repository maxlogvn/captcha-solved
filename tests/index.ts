import { chromium } from 'fingerprint-chromium-engine';
import {Solve} from "../src";


(async () => {
    const engine = new chromium();

    const browser = engine.launch({
        headless: false,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://gt4.geetest.com/demov4/slide-popup-en.html", {waitUntil : "domcontentloaded"});
    await Solve.geeTest(page);

    // Đợi 10s để  người dùng kiểm tra
    await page.waitForTimeout(10_000);
    await page.close();
    await browser.close();
})()