import { By, WebDriver } from "selenium-webdriver";
import fs from "fs";
import { crawlingStore } from "./store.js";
import {
    CATEGORY_PATH,
    click,
    pageScrollTo,
    tryElement,
    tryElements,
} from "./crawling.js";
import { ICompany, SET } from "./store.js";

export const getDetail = async (driver: WebDriver) => {
    const newItems = { ...crawlingStore.getState()["item"] };
    for await (const [itemKey, item] of Object.entries(newItems)) {
        if (item.company) continue;
        try {
            await driver.get(item.url);
            const url = await driver.getCurrentUrl();
            if (!url.includes(".naver.com")) continue;
            await driver.sleep(100);
            await pageScrollTo(driver, { duration: 500, sleep: 100 });
            await pageScrollTo(driver, {
                direction: "horizon",
                sleep: 100,
            });

            const companyTabbable = await tryElement(
                driver,
                By.xpath("//div[contains(@class,'_8ulQk8xi5m')]")
            );
            // normal company
            if (!companyTabbable) {
                const company = await tryElement(
                    driver,
                    By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                );
                // const company = await driver.findElement(
                //     By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                // );
                console.log("company", company);
                await click(driver, company);
                const infos = await tryElements(
                    driver,
                    By.xpath(
                        "//div[contains(@class,'_1lLY1TyclY')]//span[contains(@class,'_10PxysFyMd')]"
                    ),
                    { element: company }
                );

                const newCompnay = {
                    title: await infos[0].getText(),
                    ceo: await infos[1].getText(),
                    companyNum: +(await infos[2].getText()),
                    business: await infos[3].getText(),
                    adress: await infos[4].getText(),
                    phone: await infos[5].getText(),
                    mail: await infos[6].getText(),
                };
                newItems[item.id]["company"] = newCompnay;
                crawlingStore.dispatch({
                    type: SET,
                    payload: { ...crawlingStore.getState(), item: newItems },
                });
                console.log(newItems[item.id].company);
            }
            // table company
            else {
                const infos = await tryElements(
                    driver,
                    By.xpath(
                        "//div[contains(@class,'_8ulQk8xi5m')]//tbody//td[contains(@class,'_2jA5rc-8oC')]"
                    )
                );
                const contents = await (await infos[4].getText()).split("\n");
                const adresAndMail = contents[0].split(" (메일: ");

                const newCompnay = {
                    title: await infos[0].getText(),
                    ceo: await infos[1].getText(),
                    companyNum: +(await infos[2].getText()),
                    business: await infos[3].getText(),
                    phone: contents[1].replace("고객센터: ", ""),
                    mail: adresAndMail[1].replace(")", ""),
                    adress: adresAndMail[0],
                };
                newItems[item.id]["company"] = newCompnay;
                crawlingStore.dispatch({
                    type: SET,
                    payload: { ...crawlingStore.getState(), item: newItems },
                });
                console.log(newItems[item.id].company);
            }
        } catch (err) {
            console.log(err);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
