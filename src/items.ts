import { By, Locator, WebDriver, WebElement, until } from "selenium-webdriver";
import { CATEGORY_PATH, click, pageScrollTo, tryElement } from "./crawling.js";
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

export const getItems = async (driver: WebDriver) => {
    const newSubs = { ...crawlingStore.getState()["sub"] };
    const newItems = {};
    for (const [subkey, sub] of Object.entries(newSubs)) {
        if (sub.itemId.length !== 0) continue;
        await driver.get(sub.url);

        const paypable = await tryElement(driver, propsXPath.naverPay);
        if (paypable === undefined) continue;
        const selectable = await tryElement(driver, propsXPath.selectItemNum);
        await click(driver, paypable);
        if (selectable === undefined) continue;
        await click(driver, selectable);
        const itemNumpable = await tryElement(
            driver,
            propsXPath.selectItemNum80
        );
        if (itemNumpable === undefined) continue;
        await click(driver, itemNumpable);

        await pageScrollTo(driver, { duration: 200, sleep: 100 });
        await driver.wait(until.elementLocated(propsXPath.items), 500);
        const items = await driver.findElements(propsXPath.items);
        let index = 0;
        const newItem = {};
        for await (const item of items) {
            index++;
            await driver.sleep(10);
            const apable = await item.findElement(
                By.xpath(
                    `(//a[contains(@class,'basicList_mall__BC5Xu')])[${index}]`
                )
            );
            const url = await apable.getAttribute("href");
            const id = +(await apable
                .getAttribute("data-nclick")
                .then((value) => {
                    const idStart = value.indexOf("i:") + "i:".length;
                    const idEnd = value.indexOf(",r:");
                    return value.slice(idStart, idEnd);
                }));
            const itemClassable = await tryElement(
                driver,
                By.xpath(
                    `(//div[contains(@class,'basicList_mall_grade__1hPzs')])[${index}]//span[contains(@class,'basicList_grade__unbQp')]//img/parent::span`
                ),
                item
            );
            if (itemClassable === undefined) continue;
            const itemClass = await itemClassable.getText();
            if (ECompanyClass[itemClass] < 3 || !url.includes("naver.com"))
                continue;
            const name = await item
                .findElement(
                    By.xpath(
                        `(//div[contains(@class,'basicList_title__VfX3c')])[${index}]`
                    )
                )
                .getText();
            const price = await item
                .findElement(
                    By.xpath(
                        `(//span[contains(@class,'price_price__LEGN7')])[${index}]`
                    )
                )
                .getText();
            newItem[id] = {
                id,
                name,
                price,
                url,
                itemClass,
                majorId: sub.majorId,
                majorName: sub.majorName,
                minorId: sub.minorId,
                minorName: sub.minorName,
                subId: +subkey,
                subName: sub.name,
            } as IItem;
        }
        Object.assign(newItems, newItem);
        newSubs[+subkey].itemId.push(...Object.keys(newItem).map((id) => +id));

        crawlingStore.dispatch({
            type: SET,
            payload: {
                ...crawlingStore.getState(),
                sub: newSubs,
                item: newItems,
            },
        });

        fs.writeFileSync(
            CATEGORY_PATH,
            JSON.stringify(crawlingStore.getState())
        );
    }
};
