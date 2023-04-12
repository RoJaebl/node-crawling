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
    const saveCount = 0;
    const standardSaveCount = 100;
    for await (const [itemKey, item] of Object.entries(newItems)) {
        if (item.url.includes("shopping.naver.com")) {
            delete newItems[itemKey];
            crawlingStore.dispatch({
                type: SET,
                payload: { ...crawlingStore.getState(), item: newItems },
            });
            console.log("delete", item.id);
            continue;
        }
        if (item.company) continue;

        try {
            await driver.get(item.url);
            await driver.sleep(100);
            const url = await driver.getCurrentUrl();
            if (!url.includes(".naver.com")) {
                delete newItems[itemKey];
                crawlingStore.dispatch({
                    type: SET,
                    payload: { ...crawlingStore.getState(), item: newItems },
                });
                console.log("delete", item.id);
                continue;
            }
            await pageScrollTo(driver, { duration: 500, sleep: 100 });
            // await pageScrollTo(driver, {
            //     direction: "horizon",
            //     sleep: 100,
            // });

            const companyTabbable = await tryElement(
                driver,
                By.xpath("//div[contains(@class,'_8ulQk8xi5m')]")
            );
            // normal company
            const newCompany: ICompany = {
                title: "none  ",
                ceo: "none",
                companyNum: "none ",
                business: "non",
                adress: "none ",
                phone: "none  ",
                mail: "non",
            };
            if (!companyTabbable) {
                const company = await tryElement(
                    driver,
                    By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                );
                await click(driver, company);
                const infos = await tryElements(
                    driver,
                    By.xpath(
                        "//div[contains(@class,'_1lLY1TyclY')]//span[contains(@class,'GR1wWoAgYe')]"
                    ),
                    { element: company }
                ).then(async (infos) => {
                    const companyInfo: ICompany = {};
                    let index = 0;
                    for await (const info of infos) {
                        index++;
                        const infoTag = await info.getText();
                        const text = await info
                            .findElement(
                                By.xpath(
                                    `(//span[contains(@class,'GR1wWoAgYe')]//following-sibling::span)[${index}]`
                                )
                            )
                            .getText();
                        if (infoTag.includes("상호명"))
                            companyInfo["title"] = text;
                        else if (infoTag.includes("대표자"))
                            companyInfo["ceo"] = text;
                        else if (infoTag.includes("사업자등록번호"))
                            companyInfo["companyNum"] = text;
                        else if (infoTag.includes("통신판매"))
                            companyInfo["business"] = text;
                        else if (infoTag.includes("소새지"))
                            companyInfo["adress"] = text;
                        else if (infoTag.includes("고객센터"))
                            companyInfo["phone"] = text;
                        else if (infoTag.includes("e-mail"))
                            companyInfo["mail"] = text;
                    }
                    return companyInfo;
                });
                Object.assign(newCompany, infos);
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
                Object.assign(newCompany, {
                    title: await infos[0].getText(),
                    ceo: await infos[1].getText(),
                    companyNum: +(await infos[2].getText()),
                    business: await infos[3].getText(),
                    phone: contents[1].replace("고객센터: ", ""),
                    mail: adresAndMail[1].replace(")", ""),
                    adress: adresAndMail[0],
                });
            }
            newItems[item.id].company = newCompany;
            crawlingStore.dispatch({
                type: SET,
                payload: { ...crawlingStore.getState(), item: newItems },
            });
            console.log(newItems[item.id].company);
            if (saveCount % standardSaveCount === 0)
                fs.writeFileSync(
                    CATEGORY_PATH,
                    JSON.stringify(crawlingStore.getState())
                );
        } catch (err) {
            console.log(err);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
