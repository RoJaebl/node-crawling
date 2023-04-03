import fs from "fs";
import { By, WebDriver, WebElement } from "selenium-webdriver";
import { crawlingStore, IMajor, IMinor, ISub, SET } from "./store.js";
import { CATEGORY_PATH, hover } from "./crawling.js";

/**
 * @typedef {Object} ICategory
 * @property {IMajor[]} major
 * @property {IMinor[]} minor
 * @property {ISub[]} sub
 * @description category data
 * @example
 * const categories: ICategory = {
 *    major: [
 *      { id: 1000000, name: "패션의류", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000000", minorId: [1000001, 1000002] },
 *     { id: 1000001, name: "패션잡화", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000001", minorId: [1000003, 1000004] },
 *    { id: 1000002, name: "화장품/미용", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000002", minorId: [1000005, 1000006] },
 *   ],
 *  minor: [
 *    { id: 1000003, name: "여성의류", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000003", subId: [1000007, 1000008] },
 *   { id: 1000004, name: "남성의류", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000004", subId: [1000009, 1000010] },
 * { id: 1000005, name: "여성화", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000005", subId: [1000011, 1000012] },
 * ],
 * sub: [
 * { id: 1000007, name: "블라우스", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000007" },
 * { id: 1000008, name: "셔츠/남방", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000008" },
 * { id: 1000009, name: "셔츠", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000009" },
 * { id: 1000010, name: "남방", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000010" },
 * { id: 1000011, name: "힐", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000011" },
 * { id: 1000012, name: "부츠", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000012" },
 * ],
 * };
 * console.log(categories);
 * // { major: { [key: number]: IMajor }, minor: { [key: number]: IMinor }, sub: { [key: number]: ISub } }
 * // major: { id: number, name: string, url: string, minorId: number[] }
 * // minor: { id: number, name: string, url: string, subId: number[] }
 * // sub: { id: number, name: string, url: string }
 * console.log(categories.major[1000000]);
 * // { id: 1000000, name: "패션의류", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000000", minorId: [1000001, 1000002] }
 * console.log(categories.minor[1000003]);
 * // { id: 1000003, name: "여성의류", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000003", subId: [1000007, 1000008] }
 * console.log(categories.sub[1000007]);
 * // { id: 1000007, name: "블라우스", url: "https://shopping.naver.com/home/p/index.nhn?catId=1000007" }
 * console.log(categories.major[1000000].minorId);
 * // [1000001, 1000002]
 * console.log(categories.minor[1000003].subId);
 * // [1000007, 1000008]
 * console.log(categories.major[1000000].minorId[0]);
 * // 1000001
 * console.log(categories.minor[1000003].subId[0]);
 * // 1000007
 * console.log(categories.major[1000000].minorId[0] === categories.minor[1000003].subId[0]);
 * // false
 * console.log(categories.major[1000000].minorId[0] === categories.minor[1000003].subId[0] - 1000000);
 * // true
 */
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
 * get category data from naver shopping
 * @param {WebDriver} driver
 * @param {WebElement} el
 * @returns {[WebElement, number]}
 * @description return [element, id]
 * @example
 * const [element, id] = await getCategory(driver, el);
 * const name = await element.getText();
 * const url = await element.getAttribute("href");
 * const id = +(await element.getAttribute("href").then((res) => res.slice(res.indexOf("catId=") + "carId=".length)));
 * const category = { id, name, url };
 * return [element, id];
 */
const getCategory = async (
    driver: WebDriver,
    el: WebElement
): Promise<[WebElement, number]> => {
    await hover(driver, el, { sleep: 1 });
    const element = await el.findElement(By.xpath("a"));
    const elementId = +(await el
        .findElement(By.xpath("a"))
        .getAttribute("href")
        .then((res) => res.slice(res.indexOf("catId=") + "carId=".length)));
    return [element, elementId];
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
    // go to naver shopping
    await driver.get("https://shopping.naver.com/home");
    // open category layer
    await driver.sleep(100);
    await driver.findElement(propsXPath.categoryButton).click();
    // wait for category layer
    await driver.sleep(100);
    // init categories
    let newMajor: { [key: number]: IMajor } = {};
    let newMinor: { [key: number]: IMinor } = {};
    let newSub: { [key: number]: ISub } = {};
    // iterate major categories
    const majors = await driver.findElements(propsXPath.major);
    for await (const major of majors) {
        // get major category
        const [majorEl, majorId] = await getCategory(driver, major);
        // save major category
        newMajor[majorId] = {
            id: majorId,
            name: await majorEl.getText(),
            url: await majorEl.getAttribute("href"),
            minorId: [],
        } as IMajor;
        // iterate minor categories
        const minors = await driver.findElements(propsXPath.minor);
        for await (const minor of minors) {
            const [minorEl, minorId] = await getCategory(driver, minor);
            newMinor[minorId] = {
                id: minorId,
                name: await minorEl.getText(),
                url: await minorEl.getAttribute("href"),
                majorId: majorId,
                subId: [],
            } as IMinor;
            // save minor id to major
            newMajor[majorId].minorId.push(minorId);
            // iterate sub categories
            const subs = await driver.findElements(propsXPath.sub);
            for await (const sub of subs) {
                const [subEl, subId] = await getCategory(driver, sub);
                newSub[subId] = {
                    id: subId,
                    name: await subEl.getText(),
                    url: await subEl.getAttribute("href"),
                    majorId,
                    minorId,
                    itemId: [],
                } as ISub;
                newMinor[minorId].subId.push(subId);
            }
        }
    }
    // save categories data to store
    crawlingStore.dispatch({
        type: SET,
        data: {
            ...crawlingStore.getState(),
            major: {
                ...crawlingStore.getState()["major"],
                ...newMajor,
            },
            minor: {
                ...crawlingStore.getState()["minor"],
                ...newMinor,
            },
            sub: { ...crawlingStore.getState()["sub"], ...newSub },
        },
    });
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
