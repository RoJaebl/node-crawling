import { By, Builder, WebDriver, WebElement, Key } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { crawlingStore, SET } from "./store.js";
import { getCategories } from "./categories.js";
import { getCategoryItem } from "./items.js";
import fs from "fs";
import { getCompanyDetail } from "./detail.js";

// categories data path
export const CATEGORY_PATH = "categories.json";

export const tryXPath = async (
    driver: WebDriver,
    xpath: string,
    options?: { sleep: number }
) => {
    try {
        return await driver.findElement(By.xpath(xpath));
    } catch (e) {
        return null;
    }
};
export const pageScrollTo = async (
    driver: WebDriver,
    option?: { duration?: number; sleep?: number; direction?: "horizon" }
) => {
    let oldDirect = (await driver.executeScript(
        option.direction ? `return window.scrollX;` : `return window.scrollY;`
    )) as number;
    // scroll to bottom
    while (true) {
        if (option.direction)
            await driver.executeScript(`window.scrollBy({ left: 100 });`);
        else await driver.findElement(By.xpath("//body")).sendKeys(Key.END);
        await driver.sleep(option.duration ?? 1);
        const newDirect = (await driver.executeScript(
            option.direction
                ? `return window.scrollX;`
                : `return window.scrollY;`
        )) as number;
        if (oldDirect === newDirect) break;
        oldDirect = newDirect;
    }
    await driver.sleep(option.sleep ?? 1);
};
/**
 * hover action
 * @param {Actions} actor
 * @param {WebElement} origin
 * @param {number} duration
 */
export const hover = async (
    driver: WebDriver,
    origin: WebElement,
    potions?: { duration?: number; sleep?: number }
) => {
    const actor = await driver.actions({ async: true });
    await actor
        .move({ duration: potions.duration ?? undefined, origin })
        .perform();
    await actor.clear();
    if (potions) driver.sleep(potions.sleep ?? 1);
};
/**
 * click action
 * @param {Actions} actor
 * @param {WebElement} origin
 */
export const click = async (
    driver: WebDriver,
    origin: WebElement,
    options?: { sleep?: number }
) => {
    const actor = await driver.actions({ async: true });
    await actor.move({ origin }).click().perform();
    await actor.clear();
    if (options) driver.sleep(options.sleep ?? 1);
};
/**
 *
 * @param {string} browser
 * @param {string} binaryPath
 * @returns {Promise<WebDriver | null>}
 */
const getDriver = async (
    browser: string,
    binaryPath: string
): Promise<WebDriver | null> => {
    try {
        const option = new chrome.Options();
        option.setChromeBinaryPath(binaryPath);
        const driver = await new Builder()
            .forBrowser(browser)
            .setChromeOptions(option)
            .build();
        return driver;
    } catch (err) {
        console.log(err);
        return null;
    }
};
/**
 * check file is exist
 * @param {string} path
 * @returns {boolean}
 */
const isfileExist = (path: string) => {
    try {
        fs.accessSync(path, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
};
// run
const run = async () => {
    try {
        // get driver
        const driver = await getDriver("chrome", "/usr/bin/google-chrome");
        if (!driver) throw driver;
        // get categories data
        if (!isfileExist(CATEGORY_PATH) || !fs.statSync(CATEGORY_PATH).size)
            await getCategories(driver);
        // write categories data into store
        else
            crawlingStore.dispatch({
                type: SET,
                data: JSON.parse(fs.readFileSync(CATEGORY_PATH).toString()),
            });
        // get category item
        //await getCategoryItem(driver);
        await getCompanyDetail(driver);
    } catch (err) {
        console.log(err);
    }
};

run();
