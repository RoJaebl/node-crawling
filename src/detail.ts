import { By, WebDriver } from "selenium-webdriver";
import fs from "fs";
import { crawlingStore } from "./store.js";
import { CATEGORY_PATH, click, pageScrollTo, tryXPath } from "./crawling.js";
import { ICompany, SET } from "./store.js";

export const getCompanyDetail = async (driver: WebDriver) => {
    let cpItems = { ...crawlingStore.getState()["item"] };
    let isCheck = false;
    for await (const [itemKey, item] of Object.entries(cpItems)) {
        if (itemKey != "82208365412" && !isCheck) continue;
        if (itemKey === "82208365412") isCheck = !isCheck;
        if (item.company.title !== "") continue;
        try {
            await driver.get(item.url);
            const url = await driver.getCurrentUrl();
            if (!url.includes(".naver.com")) throw new Error("not naver url");
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
            let index = 0;

            // normal company
            if (!company === null || !company) {
                company = await driver.findElement(
                    By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                );
                await click(driver, company, { sleep: 10 });

                const els = await company.findElements(
                    By.xpath(
                        "//div[contains(@class,'_1lLY1TyclY')]//span[contains(@class,'_10PxysFyMd')]"
                    )
                );
                let cpCompany: ICompany = {
                    title: "",
                    ceo: "",
                    companyNum: 0,
                    business: "",
                    adress: "",
                    phone: "",
                    mail: "",
                };
                for await (const prop of Object.keys(cpCompany)) {
                    cpCompany = Object.assign(cpCompany, {
                        [prop]: await els[index].getText(),
                    });
                    index++;
                }
                cpItems[item.id].company = cpCompany;
                crawlingStore.dispatch({
                    type: SET,
                    data: { ...crawlingStore.getState(), item: cpItems },
                });
                console.log(cpItems[item.id].company);
            }
            // table company
            else {
                const els = await driver.findElements(
                    By.xpath(
                        "//div[contains(@class,'_8ulQk8xi5m')]//tbody//td[contains(@class,'_2jA5rc-8oC')]"
                    )
                );
                for await (const prop of Object.keys(item.company)) {
                    if (index <= 3) {
                        cpItems[item.id].company[prop] = await els[
                            index
                        ].getText();
                        index++;
                        continue;
                    }
                    const contents = await (
                        await els[index].getText()
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
        } catch (err) {
            console.log(err);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
