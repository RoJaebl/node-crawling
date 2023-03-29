import { By, WebDriver } from "selenium-webdriver";
import fs from "fs";
import { crawlingStore } from "./store.js";
import { CATEGORY_PATH, click, pageScrollTo, tryXPath } from "./crawling.js";
import { ICompany, SET } from "./store.js";

export const getCompanyDetail = async (driver: WebDriver) => {
    let cpItems = { ...crawlingStore.getState()["item"] };
    for await (const [itemKey, item] of Object.entries(cpItems)) {
        await driver.get(item.url);
        await driver.sleep(500);
        await pageScrollTo(driver, { duration: 100, sleep: 200 });
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
            const companyDetail = await company.findElement(
                By.xpath("//div[contains(@class,'_1lLY1TyclY')]")
            );
            const content = await companyDetail.findElements(
                By.xpath("//span[contains(@class,'_10PxysFyMd')]")
            );
            let index = 0;
            for await (const prop of Object.keys(item.company)) {
                cpItems[item.id].company[prop] = await content[index].getText();
                index++;
            }
            crawlingStore.dispatch({
                type: SET,
                data: { ...crawlingStore.getState(), item: cpItems },
            });
            console.log(cpItems[item.id].company);
        } else {
            const companyDetail = await driver.findElement(
                By.xpath("//div[contains(@class,'_8ulQk8xi5m')]//tbody")
            );
            const content = await companyDetail.findElements(
                By.xpath("//td[contains(@class,'_2jA5rc-8oC')]")
            );
            let index = 0;
            for await (const prop of Object.keys(item.company)) {
                if (index <= 3) {
                    cpItems[item.id].company[prop] = await content[
                        index
                    ].getText();
                    index++;
                    continue;
                }
                const contents = await (
                    await content[index].getText()
                ).split("\n");
                const adresAndMail = contents[0].split(" (메일: ");
                cpItems[item.id].company["adress"] = adresAndMail[0];
                cpItems[item.id].company["mail"] = adresAndMail[1].replace(
                    ")",
                    ""
                );
                cpItems[item.id].company["phone"] = contents[1].replace(
                    "고객센터: ",
                    ""
                );
                break;
            }
            crawlingStore.dispatch({
                type: SET,
                data: { ...crawlingStore.getState(), item: cpItems },
            });
            console.log(cpItems[item.id].company);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
