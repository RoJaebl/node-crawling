import fs from "fs";
import { By, WebDriver, WebElement } from "selenium-webdriver";
import {
    crawlingStore,
    ICategory,
    IMajor,
    IMinor,
    ISub,
    SET,
} from "./store.js";
import { CATEGORY_PATH, hover } from "./crawling.js";

// category xpath
const propsXPath = {
    categoryButton: By.xpath(
        `//div[contains(@class,'_categoryButton_category_button_1lIOy')]`
    ),
    major: By.xpath(
        `//div[contains(@class,'_categoryLayer_main_category_2A7mb')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`
    ),
    minor: By.xpath(
        `//div[contains(@class,'_categoryLayer_middle_category_2g2zY')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`
    ),
    sub: By.xpath(
        `//div[contains(@class,'_categoryLayer_subclass_1K649')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`
    ),
};
/**
 * create category object
 * @param {WebElement} el category element
 * @returns {Promise<ICategory>} category object
 */
const createCategory = async (el: WebElement): Promise<ICategory> => {
    return {
        id: +(await el
            .getAttribute("href")
            .then((res) => res.slice(res.indexOf("catId=") + "carId=".length))),
        name: await el.getText(),
        url: await el.getAttribute("href"),
    };
};
/**
 * get categories data from naver shopping
 * @param {WebDriver} driver
 */
export const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/home");
    // category button click
    await driver.findElement(propsXPath.categoryButton).click();
    // wait for category layer
    await driver.sleep(100);
    // get major categories
    const majors = await driver.findElements(propsXPath.major);
    // iterate major categories
    for await (const major of majors) {
        if (
            (await major.findElement(By.xpath("a")).getText()) === "나들이/여행"
        )
            break;
        const el = major.findElement(By.xpath("a"));
        const majorId = +(await el
            .getAttribute("href")
            .then((res) => res.slice(res.indexOf("catId=") + "carId=".length)));
        const newMajor = {
            [majorId]: {
                id: majorId,
                name: await el.getText(),
                url: await el.getAttribute("href"),
                minorId: [],
            } as IMajor,
        };
        await hover(driver, major, { sleep: 100 });
        const minors = await driver.findElements(propsXPath.minor);
        // iterate minor categories
        for await (const minor of minors) {
            const cpMinor = { ...crawlingStore.getState()["minor"] };
            const el = minor.findElement(By.xpath("a"));
            const minorId = +(await el
                .getAttribute("href")
                .then((res) =>
                    res.slice(res.indexOf("catId=") + "carId=".length)
                ));
            const newMinor = {
                [minorId]: {
                    id: minorId,
                    name: await el.getText(),
                    url: await el.getAttribute("href"),
                    majorId: majorId,
                    subId: [],
                } as IMinor,
            };
            newMajor[majorId].minorId.push(minorId);
            crawlingStore.dispatch({
                type: SET,
                data: {
                    ...crawlingStore.getState(),
                    major: {
                        ...crawlingStore.getState()["major"],
                        ...newMajor,
                    },
                },
            });
            await hover(driver, minor, { sleep: 100 });
            const subs = await driver.findElements(propsXPath.sub);
            // iterate sub categories
            for await (const sub of subs) {
                const el = sub.findElement(By.xpath("a"));
                const subId = +(await el
                    .getAttribute("href")
                    .then((res) =>
                        res.slice(res.indexOf("catId=") + "carId=".length)
                    ));
                const newSub = {
                    [subId]: {
                        id: subId,
                        name: await el.getText(),
                        url: await el.getAttribute("href"),
                        majorId,
                        minorId,
                        itemId: [],
                    } as ISub,
                };
                newMinor[minorId].subId.push(subId);
                crawlingStore.dispatch({
                    type: SET,
                    data: {
                        ...crawlingStore.getState(),
                        minor: { ...cpMinor, ...newMinor },
                        sub: { ...crawlingStore.getState()["sub"], ...newSub },
                    },
                });
            }
        }
    }
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
