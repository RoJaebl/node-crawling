import { By, WebDriver } from "selenium-webdriver";
import fs from "fs";
import { crawlingStore } from "./store.js";
import {
    CATEGORY_PATH,
    click,
    pageScrollTo,
    tryElement,
    tryElements,
} from "./index.js";
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
        if (item.company && item.company.title) continue;
        try {
            await driver.get(item.url);
            let url = await driver.getCurrentUrl();
            await driver.get(url);
            // TODO: 아이피 우회하는 링크 타파하는 방법 강구
            // https://xn--hz2b15nw6b91c77vqrd.com/ip_collect/naver.html?n_keyword=&n_rank=6&n_query=&n_campaign_type=2&n_media=11068&n_final_url=https%3A%2F%2Fsmartstore.naver.com%2Fmain%2Fproducts%2F5780288777&homecode=smip20230321S2019T4560&NaPm=ct%3Dlgeo7c60%7Cci%3D0AG00037y3rynobxp1kL%7Ctr%3Dpla%7Chk%3D5a81c94d4911ee84d76a0286e1cc82342b10b473

            // 외부사이트 연결 아이템 제거
            if (!url.includes(".naver.com")) {
                delete newItems[itemKey];
                crawlingStore.dispatch({
                    type: SET,
                    payload: { ...crawlingStore.getState(), item: newItems },
                });
                console.log("delete", item.id);
                continue;
            }

            const companyTabbable = await tryElement(
                driver,
                By.xpath("//div[contains(@class,'_8ulQk8xi5m')]")
            );
            // normal company
            const newCompany: ICompany = {
                title: "none",
                ceo: "none",
                companyNum: "none",
                business: "none",
                adress: "none",
                phone: "none",
                mail: "none",
            };
            if (!companyTabbable) {
                let company = await tryElement(
                    driver,
                    By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                );

                try {
                    await driver.executeScript(
                        `const company = document.getElementsByClassName("_2TupsMhDnt");
                        company[0].children[0].click();`
                    );
                } catch {
                    throw new Error(`company click error : ${item}`);
                }
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
                        else if (infoTag.includes("소재지"))
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
            if (!driver) break;
            console.log(err);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
