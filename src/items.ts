import { By } from "selenium-webdriver";
import {
    CATEGORY_PATH,
    click,
    pageScrollTo,
    tryElement,
    tryElements,
} from "./index.js";
import {
    addItemAction,
    crawlingStore,
    driverStore,
    IItem,
    setSubAction,
} from "./store.js";
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

export const getItems = async () => {
    const driver = driverStore.getState();
    const newSubs = { ...crawlingStore.getState()["sub"] };
    const newItems = { ...crawlingStore.getState()["item"] };
    for await (const [subkey, sub] of Object.entries(newSubs)) {
        if (sub.itemId.length !== 0) continue;
        await driver.get(sub.url);
        await driver.sleep(100);

        const newItem: { [id: number]: IItem } = {};
        const paypable = await tryElement(driver, propsXPath.naverPay);
        await click(driver, paypable);

        const selectable = await tryElement(driver, propsXPath.selectItemNum);
        await click(driver, selectable);

        const itemNumpable = await tryElement(
            driver,
            propsXPath.selectItemNum80
        );
        await click(driver, itemNumpable);

        await pageScrollTo(driver, { duration: 600, sleep: 100 });

        let index = 0;
        const items = await tryElements(driver, propsXPath.items, {
            timeout: 500,
        });
        for await (const item of items) {
            index++;
            await driver.sleep(10);
            const itemClassable = await tryElement(
                driver,
                By.xpath(
                    `(//div[contains(@class,'basicList_mall_grade__1hPzs')])[${index}]//span[contains(@class,'basicList_grade__unbQp')]//img/parent::span`
                ),
                { element: item }
            );
            if (itemClassable === undefined) continue;
            const itemClass =
                (await itemClassable.getText()) as keyof typeof ECompanyClass;
            if (ECompanyClass[itemClass] < 3) continue;
            const apable = await tryElement(
                driver,
                By.xpath(
                    `(//a[contains(@class,'basicList_mall__BC5Xu')])[${index}]`
                ),
                { element: item }
            );
            const url = await apable.getAttribute("href");
            if (
                url.includes("shopping.naver.com") ||
                (!url.includes("smartstore.naver.com") &&
                    !url.includes("adcr.naver.com"))
            )
                continue;
            const id = +(await apable
                .getAttribute("data-nclick")
                .then((value) => {
                    const idStart = value.indexOf("i:") + "i:".length;
                    const idEnd = value.indexOf(",r:");
                    return value.slice(idStart, idEnd);
                }));
            const name = await (
                await tryElement(
                    driver,
                    By.xpath(
                        `(//div[contains(@class,'basicList_title__VfX3c')])[${index}]`
                    ),
                    { element: item }
                )
            ).getText();
            const price = await (
                await tryElement(
                    driver,
                    By.xpath(
                        `(//span[contains(@class,'price_price__LEGN7')])[${index}]`
                    ),
                    { element: item }
                )
            ).getText();
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
            };
        }

        Object.assign(newItems, newItem);
        if (Object.keys(newItem).length === 0) newSubs[+subkey].itemId.push(0);
        newSubs[+subkey].itemId.push(...Object.keys(newItem).map((id) => +id));

        crawlingStore.dispatch(setSubAction(newSubs));
        crawlingStore.dispatch(addItemAction(newItems));

        fs.writeFileSync(
            CATEGORY_PATH,
            JSON.stringify(crawlingStore.getState())
        );
    }
};
