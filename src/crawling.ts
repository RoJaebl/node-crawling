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
import { map } from "cheerio/lib/api/traversing.js";

export const edgeHeader = {
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582",
};
export const chromeHeader = {
    userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36",
};

// categories data path
export const CATEGORY_PATH = "categories.json";

export const arrayToObject = (array: any[], keyField: string) => {
    return array.reduce((obj, item) => {
        if (typeof item[keyField] === "undefined")
            throw new Error("keyField is 'undefined'");
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
            .usingHttpAgent(chromeHeader)
            .setChromeOptions(option)
            .build();
        await driver.manage().setTimeouts({ implicit: 1 });
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
const getXlsxToJson = async <T>(
    filePath: string,
    sheetIndex: number
): Promise<T[]> => {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Parse the file using xlsx
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // Get the first sheet in the workbook
    const sheetName = workbook.SheetNames[sheetIndex];
    try {
        const worksheet = workbook.Sheets[sheetName];
        // Convert the worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as T[];
        return jsonData;
    } catch (err) {
        console.log(err);
        return undefined;
    }
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
            fs.writeFileSync(
                CATEGORY_PATH,
                JSON.stringify(crawlingStore.getState())
            );
        }
        if (line === "xlsx" || line === "x") {
            jsonToXlsx();
        }
    });
};
// add item name
const getItemName = async (driver: WebDriver) => {
    const cpItems = { ...crawlingStore.getState()["item"] };
    for await (const item of Object.values(cpItems)) {
        if (item.name != "") continue;
        await driver.get(item.url);
        await driver.sleep(500);
        try {
            const name = await driver
                .findElement(By.xpath("//h3[contains(@class,'_22kNQuEXmb')]"))
                .getText();
            cpItems[item.id] = { ...item, name };
            crawlingStore.dispatch({
                type: SET,
                payload: { ...crawlingStore.getState(), item: cpItems },
            });
        } catch (err) {
            console.log(err);
        }
    }
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
    jsonToXlsx();
};
// run
const run = async () => {
    // get driver
    const driver = await getDriver("chrome", "/usr/bin/google-chrome");
    try {
        // console command
        command(driver);
        if (!driver) throw driver;
        // get categories data
        if (!isfileExist(CATEGORY_PATH) || !fs.statSync(CATEGORY_PATH).size) {
            await getCategories(driver);
        }
        // write categories data into store
        else
            crawlingStore.dispatch({
                type: SET,
                payload: JSON.parse(fs.readFileSync(CATEGORY_PATH).toString()),
            });

        // get category item
        //await getCategoryItem(driver);
        // get company detail
        //await getCompanyDetail(driver);
        // await jsonToXlsx();
        // get item name
        //getItemName(driver);
    } catch (err) {
        console.log(err);
        await driver.close();
    }
};
run();
// interface IXlsx extends IItem, ICompany {}
// (async () => {
//     const data = await getXlsxToJson<IXlsx>("data.xlsx", 3);
//     const newDatas = data.map((item) => {
//         const {
//             title,
//             companyNum,
//             business,
//             adress,
//             phone,
//             mail,
//             ceo,
//             ...otherProperties
//         } = item;

//         const newItem = {
//             ...otherProperties,
//             company: {
//                 title,
//                 ceo,
//                 companyNum,
//                 business,
//                 adress,
//                 phone,
//                 mail,
//             },
//         };
//         return newItem;
//     });
//     const json = (await arrayToObject(newDatas, "id")) as IItem;
//     fs.writeFileSync(
//         CATEGORY_PATH,
//         JSON.stringify({ major: {}, minor: {}, sub: {}, item: json })
//     );
// })();

// const cpItems = { ...crawlingStore.getState()["item"] };
// const newItems = Object.values(cpItems).reduce((items, item) => {
//     if (item.company.title != "") items[item.id] = item;
//     return items;
// }, {});
// fs.writeFileSync(
//     CATEGORY_PATH,
//     JSON.stringify({ ...crawlingStore.getState(), item: newItems })
// );
// jsonToXlsx();
