import { By, WebDriver } from "selenium-webdriver";
import { click, find, pageScrollTo } from "./crawling.js";
import { crawlingStore, ICategory, IItem } from "./store.js";

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
    item: {
        url: By.xpath("//a[contains(@class,'basicList_mall__BC5Xu')]"),
        itemClass: By.xpath(
            "//span[contains(@class,'basicList_grade__unbQp')]"
        ),
        title: By.xpath("//div[contains(@class,'basicList_title__VfX3c')]"),
        image: By.xpath(
            "//div[contains(@class,'basicList_mall_area__faH62')]//a[contains(@class, 'basicList_mall__BC5Xu')]"
        ),
    },
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
    const majors = crawlingStore.getState()["categories"] as ICategory[];
    for await (const major of majors) {
        const minors = major.downCategory;
        for await (const minor of minors) {
            const subs = minor.downCategory;
            for await (const sub of subs) {
                await driver.get(sub.url);
                await driver.sleep(100);
                // naver pay click
                const naverPay = await driver.findElement(propsXPath.naverPay);
                await click(driver, naverPay, { sleep: 100 });
                // select item click
                const selectItemNum = await driver.findElement(
                    propsXPath.selectItemNum
                );
                await click(driver, selectItemNum);
                // select item num 80 click
                const itemNum = await driver.findElement(
                    propsXPath.selectItemNum80
                );
                await click(driver, itemNum);
                // scroll to bottom
                await pageScrollTo(driver);

                // TODO: all sub category crawling
                // all sub category items crawling
                const items = await driver.findElements(propsXPath.items);

                for await (const item of items) {
                    const url = await find(item, propsXPath.item.url, (el) =>
                        el.getAttribute("href")
                    );
                    const itemClass = (await find(
                        item,
                        propsXPath.item.itemClass,
                        (el) => el.getText()
                    )) as keyof typeof ECompanyClass;
                    //TODO: item data crawling
                    if (
                        ECompanyClass[itemClass] < 3 ||
                        !url.includes("naver.com")
                    )
                        continue;
                    const newItem = {
                        title: await find(item, propsXPath.item.title, (el) =>
                            el.getText()
                        ),
                        price: await item
                            .findElement(By.xpath("//span"))
                            .getText(),
                        image: await find(item, propsXPath.item.image, (el) =>
                            el.getAttribute("href")
                        ),
                        url,
                        itemClass,
                    } as IItem;
                    console.log("milestone5");
                    sub.items = [...sub.items, newItem];
                }
            }
        }
    }
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