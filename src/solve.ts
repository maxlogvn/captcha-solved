import {Page} from "playwright-core";
import {Actions} from "./Geetest/actions";
import {ImageHandler} from "./Geetest/image";
import {Calculator} from "./Geetest/calculator";

export class Solve {


    public static async geeTest(page: Page, maxRetry = 3){
        let status = false;
        let round = 0;
        const action = new Actions(page) ;
        await action.open();
        const image = new ImageHandler(page);
        while (!status && round <= maxRetry){
            const backgroundBuffer =await image.getBuffer(".geetest_bg");
            const slideBuffer = await image.getBuffer(".geetest_slice_bg");
            const backgroundCrop = await image.cropHandleZone(backgroundBuffer, slideBuffer);
            const backgroundCropFilter = await image.applyFilter(backgroundCrop);
            const slideFilter = await image.applyFilter(slideBuffer);
            const calculator = new Calculator(page);
            const slidePosition = calculator.findSlidePosition(backgroundCropFilter, slideFilter);
            await calculator.debugSaveMatch(backgroundCropFilter, slideFilter, slidePosition);
            await action.slideToPosition(slidePosition)
            status = await action.validate().catch(()=> false);
        }
        if(!status) throw new Error(`Can't solve geetest after ${maxRetry}`);
        return status;
    }

}