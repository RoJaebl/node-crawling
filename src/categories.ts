import fs from "fs";
import { By, Locator, WebDriver, WebElement, until } from "selenium-webdriver";
import { crawlingStore, IMajor, IMinor, ISub, SET } from "./store.js";
import { CATEGORY_PATH, click, hover } from "./crawling.js";
import { ICategory } from "./store.js";

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
const getCategoryInfo = async (
    driver: WebDriver,
    el: WebElement
): Promise<ICategory> => {
    await hover(driver, el, { sleep: 1 });
    const apable = await el.findElement(By.xpath("a"));
    const id = +(await apable
        .getAttribute("href")
        .then((res) => res.slice(res.indexOf("catId=") + "carId=".length)));
    const name = await apable.getText();
    const url = await apable.getAttribute("href");
    return { id, name, url };
};
const getCategory = async (
    driver: WebDriver,
    locator: Locator,
    callback: (categoryInfo: ICategory) => {}
): Promise<{}> => {
    try {
        const newCategory = {};
        await driver.sleep(100);
        const categories = await driver.findElements(locator);
        if (categories.length === 0) return {};
        for await (const category of categories) {
            const info = await getCategoryInfo(driver, category);
            newCategory[info.id] = callback(info);
        }
        return newCategory;
    } catch {
        return await getCategory(driver, locator, callback);
    }
};
/**
 * get categories data from naver shopping
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 * @description save categories data to store
 * @example
 * await getCategories(driver);
 * const categories = crawlingStore.get(SET.CATEGORIES);
 * console.log(categories);
 * // { major: { [key: number]: IMajor }, minor: { [key: number]: IMinor }, sub: { [key: number]: ISub } }
 * // major: { id: number, name: string, url: string, minorId: number[] }
 * // minor: { id: number, name: string, url: string, majorId: number, subId: number[] }
 * // sub: { id: number, name: string, url: string, minorId: number }
 * // ex) categories.major[1000000].name === "패션의류"
 * // ex) categories.minor[1000001].name === "여성의류"
 * // ex) categories.sub[1000002].name === "여성의류"
 */
export const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/");
    await driver.wait(until.elementLocated(propsXPath.categoryButton), 1000);
    const buttonpable = await driver.findElement(propsXPath.categoryButton);
    await click(driver, buttonpable);

    // init categories
    const newMajors: { [key: number]: IMajor } = {};
    const newMinors: { [key: number]: IMinor } = {};
    const newSubs: { [key: number]: ISub } = {};
    // iterate major categories
    const newMajor = {};
    await driver.sleep(100);
    const majors = await driver.findElements(propsXPath.major);
    for await (const major of majors) {
        const majorInfo = await getCategoryInfo(driver, major);
        newMajor[majorInfo.id] = {
            id: majorInfo.id,
            name: majorInfo.name,
            url: majorInfo.url,
            minorId: [],
        };
        const newMinor = {};
        await driver.sleep(100);
        const minors = await driver.findElements(propsXPath.minor);
        for await (const minor of minors) {
            const minorInfo = await getCategoryInfo(driver, minor);
            newMinor[minorInfo.id] = {
                id: minorInfo.id,
                name: minorInfo.name,
                url: minorInfo.url,
                majorId: majorInfo.id,
                majorName: majorInfo.name,
                subId: [],
            };
            const newSub = await getCategory(
                driver,
                propsXPath.sub,
                (subInfo) => ({
                    id: subInfo.id,
                    name: subInfo.name,
                    url: subInfo.url,
                    majorId: majorInfo.id,
                    majorName: majorInfo.name,
                    minorId: minorInfo.id,
                    minorName: minorInfo.name,
                    itemId: [],
                })
            );
            Object.assign(newSubs, newSub);
            newMinor[minorInfo.id].subId.push(
                ...Object.keys(newSub).map((id) => +id)
            );
        }
        Object.assign(newMinors, newMinor);
        newMajor[majorInfo.id].minorId.push(
            ...Object.keys(newMinor).map((id) => +id)
        );
    }
    Object.assign(newMajors, newMajor);

    // save categories data to store
    crawlingStore.dispatch({
        type: SET,
        payload: { major: newMajors, minor: newMinors, sub: newSubs },
    });
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
