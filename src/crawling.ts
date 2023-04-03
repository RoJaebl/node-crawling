import { By, Builder, WebDriver, WebElement, Key } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import {
    crawlingStore,
    ICompany,
    ICrawlingStore,
    IItem,
    SET,
} from "./store.js";
import readline from "readline";
import { getCategories } from "./categories.js";
import { getCategoryItem } from "./items.js";
import fs from "fs";
import { getCompanyDetail } from "./detail.js";
import XLSX from "xlsx";

// categories data path
export const CATEGORY_PATH = "categories.json";

export const arrayToObject = (array: any[], keyField: string) => {
    return array.reduce((obj, item) => {
        obj[item[keyField]] = item;
        return obj;
    }, {});
};

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
    options?: { sleep?: number }
) => {
    const actor = await driver.actions({ async: true });
    await actor.move({ duration: 1, origin }).perform();
    await actor.clear();
    if (!options) return;
    await driver.sleep(options.sleep);
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
    await actor.move({ duration: 1, origin }).click().perform();
    await actor.clear();
    if (options) await driver.sleep(options.sleep ?? 1);
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
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const addSheet = <T>(workbook: XLSX.WorkBook, name: string, data: T[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
};
const jsonToXlsx = () => {
    // read json
    const json = JSON.parse(
        fs.readFileSync(CATEGORY_PATH).toString("utf-8")
    ) as ICrawlingStore;
    // item reformat
    const itemsArr = Object.entries(json["item"]).map(
        ([itemsKey, ItemsVal]) => {
            let newItem = { ...ItemsVal, ...ItemsVal["company"] };
            delete newItem["company"];
            return { key: itemsKey, value: newItem };
        }
    );
    // array to object
    let items = itemsArr.reduce((acc, cur) => {
        const { key, value } = cur;
        acc[+key] = value;
        return acc;
    }, {});

    // create workbook
    const workbook = XLSX.utils.book_new();
    addSheet(workbook, "Major categories", Object.values(json["major"]));
    addSheet(workbook, "Minor categories", Object.values(json["minor"]));
    addSheet(workbook, "Sub categories", Object.values(json["sub"]));
    addSheet(workbook, "item categories", Object.values(items));
    // write file
    fs.writeFileSync(
        "data.xlsx",
        XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
        })
    );
};
const command = async (driver: WebDriver) => {
    rl.on("line", async (line: string) => {
        if (line === "exit" || line === "q" || line === "quit") {
            fs.writeFileSync(
                CATEGORY_PATH,
                JSON.stringify(crawlingStore.getState())
            );
            jsonToXlsx();
            rl.close();
            driver.close();
            return;
        }
        if (line === "save" || line === "s") {
            fs.writeFile(
                CATEGORY_PATH,
                JSON.stringify(crawlingStore.getState()),
                (err) => {
                    if (err) console.log(err);
                }
            );
        }
        if (line === "xlsx" || line === "x") {
            jsonToXlsx();
        }
    });
};
// run
const run = async () => {
    try {
        // get driver
        const driver = await getDriver("chrome", "/usr/bin/google-chrome");
        // console command
        command(driver);
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
        // get company detail
        await getCompanyDetail(driver);
        await jsonToXlsx();
    } catch (err) {
        console.log(err);
    }
};
run();
