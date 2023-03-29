import { By, WebDriver } from "selenium-webdriver";
import fs from "fs";
import { crawlingStore } from "./store.js";
import { click, pageScrollTo, tryXPath } from "./crawling.js";

export const getCompanyDetail = async (driver: WebDriver) => {
    const cpItems = { ...crawlingStore.getState()["item"] };
    for await (const [itemKey, item] of Object.entries(cpItems)) {
        await driver.get(item.url);
        await driver.sleep(1000);
        await pageScrollTo(driver, { duration: 500, sleep: 100 });
        await pageScrollTo(driver, {
            direction: "horizon",
            sleep: 100,
        });
        let company = await tryXPath(
            driver,
            "//div[contains(@class,'_8ulQk8xi5m')]",
            { sleep: 100 }
        );
        if (!company === null || !company) {
            company = await driver.findElement(
                By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
            );
            await click(driver, company, { sleep: 10 });
            const companyDetail = await company.findElements(
                By.xpath("//div[contains(@class,'_1lLY1TyclY')]")
            );
        } else {
            const companyDetail = await driver.findElements(
                By.xpath("//div[contains(@class,'_8ulQk8xi5m')]//tbody")
            );
        }

        //const name = await companyDetail[0].findElements(By.xpath("/span"));
    }
};
