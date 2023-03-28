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
    for (const sub of Object.values(cpSubs)) {
        if (sub.id === 100010504) break;
        await driver.get(sub.url);
        await driver.sleep(1000);
        // naver pay click
        const naverPay = await driver.findElement(propsXPath.naverPay);
        await click(driver, naverPay, { sleep: 500 });
        // select item click
        const selectItemNum = await driver.findElement(
            propsXPath.selectItemNum
        );
        await click(driver, selectItemNum);
        // select item num 80 click
        const itemNum = await driver.findElement(propsXPath.selectItemNum80);
        await click(driver, itemNum);
        // scroll to bottom
        await pageScrollTo(driver, { duration: 500, sleep: 100 });
        // all sub category items crawling
        const items = await driver.findElements(propsXPath.items);
        let index = 0;
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
            const newItem = {
                [itemId]: {
                    id: itemId,
                    name: await item
                        .findElement(
                            By.xpath(
                                `(//div[contains(@class,'basicList_title__VfX3c')])[${index}]`
                            )
                        )
                        .getText(),
                    price: await item.findElement(By.xpath("//span")).getText(),
                    url,
                    itemClass,
                    majorId: sub.majorId,
                    minorId: sub.minorId,
                    subId: sub.id,
                    company: {},
                } as IItem,
            };
            cpSubs[sub.id].itemId.push(itemId);
            crawlingStore.dispatch({
                type: SET,
                data: {
                    ...crawlingStore.getState(),
                    sub: { ...cpSubs },
                    item: {
                        ...crawlingStore.getState()["item"],
                        ...newItem,
                    },
                },
            });
        }
    }
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
// item detail info
//     await driver.get(url);
//     await driver.sleep(100);
//     await pageScrollTo(driver);
//     await pageScrollTo(driver, "horizon");
//     await click(
//         driver,
//         await driver.findElement(
//             By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
//         ),
//         { sleep: 100 }
//     );
//     const companyDetail = await driver.findElements(
//         By.xpath("//div[contains(@class,'_1r4A1x_ryD')]")
//     );
//     const name = await companyDetail[0].findElements(By.xpath("/span"));
// };
