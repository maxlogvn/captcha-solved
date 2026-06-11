import {Page} from "playwright-core";
import {Actions} from "./Geetest/actions";
import {ImageHandler} from "./Geetest/image";
import {Calculator} from "./Geetest/calculator";

export class Solve {


    public static async geeTest(page: Page){
        const action = new Actions(page) ;
        await action.open();
        const image = new ImageHandler(page);
        const backgroundBuffer =await image.getBuffer(".geetest_bg");
        const slideBuffer = await image.getBuffer(".geetest_slice_bg");
        const backgroundCrop = await image.cropHandleZone(backgroundBuffer, slideBuffer);
        const backgroundCropFilter = await image.applyFilter(backgroundCrop);
        const slideFilter = await image.applyFilter(slideBuffer);
        const calculator = new Calculator(page);
        const slidePosition = calculator.findSlidePosition(backgroundCropFilter, slideFilter);
        await action.slideToPosition(slidePosition)

    }

}