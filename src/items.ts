import { By, WebDriver } from "selenium-webdriver";
import { CATEGORY_PATH, click, pageScrollTo } from "./crawling.js";
import { crawlingStore, IItem, SET } from "./store.js";
import fs from "fs";

const propsXPath = {
    naverPay: By.xpath(`//a[text()='네이버페이']`),
    selectItemNum: By.xpath(
        `//div[contains(@class,'subFilter_select_box__dX_vV')][2]`
    ),
    selectItemNum20: By.xpath(
        `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='20개씩 보기']`
    ),
    selectItemNum40: By.xpath(
        `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='40개씩 보기']`
    ),
    selectItemNum60: By.xpath(
        `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='60개씩 보기']`
    ),
    selectItemNum80: By.xpath(
        `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='80개씩 보기']`
    ),
    items: By.xpath("//div[contains(@class,'basicList_item__0T9JD')]"),
};
export enum ECompanyClass {
    "씨앗" = 0,
    "새싹",
    "파워",
    "빅파워",
    "프리미엄",
    "플래티넘",
}
export const getCategoryItem = async (driver: WebDriver) => {
    const cpSubs = { ...crawlingStore.getState()["sub"] };
    for (const [subkey, sub] of Object.entries(cpSubs)) {
        if (sub.itemId.length > 0) continue;
        await driver.get(sub.url);
        await driver.sleep(500);
        try {
            const naverPay = await driver.findElement(propsXPath.naverPay);
            await click(driver, naverPay);
        } catch (err) {
            console.log("카테고리 아이템이 없습니다.", sub.name);
            continue;
        }
        const selectItemNum = await driver.findElement(
            propsXPath.selectItemNum
        );
        await click(driver, selectItemNum);
        const itemNum = await driver.findElement(propsXPath.selectItemNum80);
        await click(driver, itemNum);
        await pageScrollTo(driver, { duration: 200, sleep: 200 });
        const items = await driver.findElements(propsXPath.items);
        let index = 0;
        let newItem: { [id: number]: IItem } = {};
        for await (const item of items) {
            index++;
            await driver.sleep(10);
            const agable = await item.findElement(
                By.xpath(
                    `(//a[contains(@class,'basicList_mall__BC5Xu')])[${index}]`
                )
            );
            const url = await agable.getAttribute("href");
            const itemId = +(await agable
                .getAttribute("data-nclick")
                .then((value) => {
                    const idStart = value.indexOf("i:") + "i:".length;
                    const idEnd = value.indexOf(",r:");
                    return value.slice(idStart, idEnd);
                }));
            let itemClass: keyof typeof ECompanyClass;
            try {
                itemClass = (await item
                    .findElement(
                        By.xpath(
                            `(//div[contains(@class,'basicList_mall_grade__1hPzs')])[${index}]//span[contains(@class,'basicList_grade__unbQp')]//img/parent::span`
                        )
                    )
                    .getText()) as keyof typeof ECompanyClass;
            } catch (err) {
                continue;
            }
            if (ECompanyClass[itemClass] < 3 || !url.includes("naver.com"))
                continue;
            cpSubs[+subkey].itemId.push(itemId);
            newItem[itemId] = {
                id: itemId,
                name: await item
                    .findElement(
                        By.xpath(
                            `(//div[contains(@class,'basicList_title__VfX3c')])[${index}]`
                        )
                    )
                    .getText(),
                price: await item
                    .findElement(
                        By.xpath(
                            `(//span[contains(@class,'price_price__LEGN7')])[${index}]`
                        )
                    )
                    .getText(),
                url,
                itemClass,
                majorId: sub.majorId,
                minorId: sub.minorId,
                subId: +subkey,
                company: {
                    title: "",
                    ceo: "",
                    companyNum: 0,
                    business: "",
                    adress: "",
                    phone: "",
                    mail: "",
                },
            } as IItem;
        }

        crawlingStore.dispatch({
            type: SET,
            data: Object.assign(
                crawlingStore.getState(),
                { sub: { ...cpSubs } },
                { item: { ...crawlingStore.getState()["item"], ...newItem } }
            ),
        });
        // write categories data into json file
        fs.writeFileSync(
            CATEGORY_PATH,
            JSON.stringify(crawlingStore.getState())
        );
    }
};
