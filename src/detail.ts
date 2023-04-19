import fs from "fs";
import { crawlingStore, driverStore, setItemAction } from "./store.js";
import { CATEGORY_PATH, saveJson, tryElement, tryElements } from "./index.js";
import { findElementsXPathScript } from "./items.js";

const companyInfoScript = (xPath: string) =>
    findElementsXPathScript(xPath) +
    `
    const companyInfo = {};
    if(elements){
        elements[0].querySelector("button").click();
        const infos = elements[0].querySelectorAll("div._1r4A1x_ryD");
        for (const info of infos){
            const indicator = info.querySelector("span.GR1wWoAgYe").innerText;
            companyInfo[indicator] = info.querySelector("span._10PxysFyMd").innerText;
        }
    }else{
        const tableable = findElementsXPath("//table[contains(@class,'IA34ue2o2i')]")[0];
        const infos = tableable.querySelectorAll("td._3fpUfPAXM5");

        const addressInfo = infos[4].innerText.split("\\n");
        const addressMail = addressInfo[0].split(" (메일: ");
        companyInfo["상호명"] = infos[0] ? infos[0].innerText : "";
        companyInfo["대표자"] = infos[1] ? infos[1].innerText : "";
        companyInfo["사업자등록번호"] = infos[2] ? infos[2].innerText : "";
        companyInfo["통신판매업번호"] = infos[3] ? infos[3].innerText : "";
        companyInfo["사업장 소재지"] = addressMail[0]??"";
        companyInfo["고객센터"] = addressInfo[1] ? addressInfo[1].replace("고객센터: ", "") : "";
        companyInfo["e-mail"] = addressMail[1] ? addressMail[1].replace(")", "") : "";
    }
    return companyInfo;
`;

export const getDetail = async () => {
    const driver = driverStore.getState();
    const cpItems = { ...crawlingStore.getState().item };
    const saveCount = 0;
    const standardSaveCount = 100;
    for await (const [itemKey, item] of Object.entries(cpItems)) {
        if (item.url.includes("shopping.naver.com")) {
            delete cpItems[itemKey];
            crawlingStore.dispatch(setItemAction(cpItems));
            console.log("delete item: ", item.id);
            continue;
        }
        if (item.company && item.company.상호명) continue;
        try {
            await driver.get(item.url);
            let url = await driver.getCurrentUrl();
            await driver.get(url);
            await driver.sleep(100);

            // 외부사이트 연결 아이템 제거
            if (!url.includes(".naver.com")) {
                delete cpItems[itemKey];
                crawlingStore.dispatch(setItemAction(cpItems));
                console.log("delete item: ", item.id);
                continue;
            }
            const newCompany = await driver.executeScript(
                companyInfoScript("//div[contains(@class,'_2TupsMhDnt')]")
            );
            console.log(newCompany);
            cpItems[item.id].company = newCompany;
            crawlingStore.dispatch(setItemAction(cpItems));
            if (saveCount % standardSaveCount === 0) saveJson(CATEGORY_PATH);
        } catch (err) {
            if (!driver) break;
            console.log("company info crawling fail");
            console.log(err);
        }
    }
    saveJson(CATEGORY_PATH);
};
