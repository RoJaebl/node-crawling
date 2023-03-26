import { By, WebDriver } from "selenium-webdriver";
import { click, pageScrollTo } from "./crawling.js";
import { crawlingStore, ICategory } from "./store.js";

const propsXPath = {
    naverPay: `//a[text()='네이버페이']`,
    selectItemNum: `//div[contains(@class,'subFilter_select_box__dX_vV')][2]`,
    selectItemNum20: `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='20개씩 보기']`,
    selectItemNum40: `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='40개씩 보기']`,
    selectItemNum60: `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='60개씩 보기']`,
    selectItemNum80: `//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='80개씩 보기']`,
};
enum ECompanyClass {
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
                // TODO: all sub category crawling
                // naver pay click
                const naverPay = await driver.findElement(
                    By.xpath(propsXPath.naverPay)
                );
                await click(driver, naverPay, { sleep: 100 });
                // select item click
                const selectItemNum = await driver.findElement(
                    By.xpath(propsXPath.selectItemNum)
                );
                await click(driver, selectItemNum);
                // select item num 80 click
                const itemNum = await driver.findElement(
                    By.xpath(propsXPath.selectItemNum80)
                );
                await click(driver, itemNum);
                // scroll to bottom
                await pageScrollTo(driver);

                const item = await driver.findElements(
                    By.xpath("//div[contains(@class,'basicList_item__0T9JD')]")
                );
                //TODO: item data crawling
                const title = await item[0]
                    .findElement(
                        By.xpath(
                            "//div[contains(@class,'basicList_title__VfX3c')]"
                        )
                    )
                    .getText();
                const price = await item[0]
                    .findElement(By.xpath("//span"))
                    .getText();
                const itemURL = await item[0]
                    .findElement(
                        By.xpath(
                            "//div[contains(@class,'basicList_mall_area__faH62')]//a[contains(@class, 'basicList_mall__BC5Xu')]"
                        )
                    )
                    .getAttribute("href");
                const companyClass = (await item[0]
                    .findElement(
                        By.xpath(
                            "//span[contains(@class,'basicList_grade__unbQp')]"
                        )
                    )
                    .getText()) as keyof typeof ECompanyClass;
                if (ECompanyClass[companyClass] > 2) {
                    await driver.get(itemURL);
                    await driver.sleep(100);
                    await pageScrollTo(driver);
                    await pageScrollTo(driver, "horizon");
                    await click(
                        driver,
                        await driver.findElement(
                            By.xpath("//div[contains(@class,'_2TupsMhDnt')]")
                        ),
                        { sleep: 100 }
                    );
                    const companyDetail = await driver.findElements(
                        By.xpath("//div[contains(@class,'_1r4A1x_ryD')]")
                    );
                    const name = await companyDetail[0].findElements(
                        By.xpath("/span")
                    );
                }
            }
        }
    }
};
