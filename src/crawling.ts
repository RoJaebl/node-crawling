import { By, Builder, WebDriver, WebElement, Key } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { crawlingStore, ICompany, ICrawlingStore, SET } from "./store.js";
import { getCategories } from "./categories.js";
import { getCategoryItem } from "./items.js";
import fs from "fs";
import { getCompanyDetail } from "./detail.js";
import XLSX from "xlsx";

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
            await driver.executeScript(
                `window.scrollBy({ left: window.screenLeft });`
            );
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
    // try {
    //     // get driver
    //     const driver = await getDriver("chrome", "/usr/bin/google-chrome");
    //     if (!driver) throw driver;
    //     // get categories data
    //     if (!isfileExist(CATEGORY_PATH) || !fs.statSync(CATEGORY_PATH).size)
    //         await getCategories(driver);
    //     // write categories data into store
    //     else
    //         crawlingStore.dispatch({
    //             type: SET,
    //             data: JSON.parse(fs.readFileSync(CATEGORY_PATH).toString()),
    //         });
    //     // get category item
    //     await getCategoryItem(driver);
    //     await getCompanyDetail(driver);
    // } catch (err) {
    //     console.log(err);
    // }
    const data = [
        { name: "John", age: 25 },
        { name: "Jane", age: 32 },
    ];
    // json file read
    fs.readFile(CATEGORY_PATH, (err, buffer) => {
        const json = JSON.parse(buffer.toString("utf-8")) as ICrawlingStore;

        const major = Object.values(json["major"]).map((value) => value);
        const minor = Object.values(json["minor"]).map((value) => value);
        const sub = Object.values(json["sub"]).map((value) => value);
        var items = {};
        for (const [itemsKey, ItemsVal] of Object.entries(json["item"])) {
            var newItem = {};
            for (const [itemKey, itemVal] of Object.entries(ItemsVal)) {
                if (itemKey != "company")
                    newItem = { ...newItem, [itemKey]: itemVal };
                else newItem = { ...newItem, ...itemVal };
            }
            items = { ...items, [itemsKey]: newItem };
        }
        const item = Object.values(items).map((value) => value);
        const majorWorksheet = XLSX.utils.json_to_sheet(major);
        const minorWorksheet = XLSX.utils.json_to_sheet(minor);
        const subWorksheet = XLSX.utils.json_to_sheet(sub);
        const itemWorksheet = XLSX.utils.json_to_sheet(item);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            workbook,
            majorWorksheet,
            "Major categories"
        );
        XLSX.utils.book_append_sheet(
            workbook,
            minorWorksheet,
            "Minor categories"
        );
        XLSX.utils.book_append_sheet(workbook, subWorksheet, "Sub categories");
        XLSX.utils.book_append_sheet(
            workbook,
            itemWorksheet,
            "item categories"
        );

        const xlsxBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
        });
        fs.writeFileSync("data.xlsx", xlsxBuffer);
    });
};

run();
