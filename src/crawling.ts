import {
    By,
    Builder,
    WebDriver,
    WebElement,
    Key,
    until,
    Locator,
} from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import fs from "fs";
import XLSX from "xlsx";
import {
    addItemAction,
    crawlingStore,
    ICategory,
    ICrawlingStore,
    IItem,
    SET,
} from "./store.js";
import readline from "readline";
import { getCategories } from "./categories.js";
import { getItems } from "./items.js";
import { getDetail } from "./detail.js";
import { ECompanyClass } from "./items.js";

const edgeHeader = {
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582",
};
const chromeHeader = {
    userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36",
};
// categories data path
export const CATEGORY_PATH = "categories.json";

interface ISeleniumOption {
    duration?: number;
    sleep?: number;
}
interface ITryElementOption {
    timeout?: number;
    element?: WebElement;
}
export const tryElement = async (
    driver: WebDriver,
    locator: Locator,
    option: ITryElementOption = {}
): Promise<WebElement | undefined> => {
    try {
        const { timeout, element } = option;
        await driver.wait(until.elementLocated(locator), timeout ?? 100);
        if (!element) return await driver.findElement(locator);
        else return await element.findElement(locator);
    } catch (err) {
        console.log("not found element: ", locator.toString());
        return undefined;
    }
};
export const tryElements = async (
    driver: WebDriver,
    locator: Locator,
    option: ITryElementOption = {}
): Promise<WebElement[] | undefined> => {
    try {
        const { timeout, element } = option;
        await driver.wait(until.elementLocated(locator), timeout ?? 100);
        if (!element) return await driver.findElements(locator);
        else return await element.findElements(locator);
    } catch (err) {
        console.log("not found elements:", locator.toString());
        return undefined;
    }
};
interface IPageScrollToOption extends ISeleniumOption {
    direction?: "horizon";
}
export const pageScrollTo = async (
    driver: WebDriver,
    option: IPageScrollToOption = {}
) => {
    const { duration, sleep, direction } = option;
    let oldDirect = (await driver.executeScript(
        direction ? `return window.scrollX;` : `return window.scrollY;`
    )) as number;
    // scroll to bottom
    for await (const _ of Array(100)) {
        if (direction)
            await driver.executeScript(
                `window.scrollBy({ left: window.screenLeft });`
            );
        else await driver.findElement(By.xpath("//body")).sendKeys(Key.END);
        await driver.sleep(duration ?? 1);
        const newDirect = (await driver.executeScript(
            direction ? `return window.scrollX;` : `return window.scrollY;`
        )) as number;
        if (oldDirect === newDirect) break;
        oldDirect = newDirect;
    }
    await driver.sleep(sleep ?? 1);
};

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

export const click = async (
    driver: WebDriver,
    origin: WebElement,
    options: ISeleniumOption = {}
) => {
    const { duration, sleep } = options;
    const actor = await driver.actions({ async: true });
    await actor.move({ duration, origin }).click().perform();
    await actor.clear();
    await driver.sleep(sleep ?? 1);
};
export const getDriver = async (
    browser: string,
    binaryPath: string
): Promise<WebDriver | undefined> => {
    try {
        const option = new chrome.Options();
        option.setChromeBinaryPath(binaryPath);
        const driver = await new Builder()
            .forBrowser(browser)
            .usingHttpAgent(chromeHeader.userAgent)
            .setChromeOptions(option)
            .build();
        return driver;
    } catch (err) {
        console.log("not create driver");
        return undefined;
    }
};
const isfileExist = (path: string) => {
    try {
        fs.accessSync(path, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
};
const command = async (driver: WebDriver) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.on("line", async (line: string) => {
        if (line === "exit" || line === "q" || line === "quit") {
            fs.writeFileSync(
                CATEGORY_PATH,
                JSON.stringify(crawlingStore.getState())
            );
            jsonToXlsx(CATEGORY_PATH, "data.xlsx");
            rl.close();
            driver.execute("window.close();" as any);
            driver.quit();
            return;
        }
        if (line === "save" || line === "s") {
            fs.writeFileSync(
                CATEGORY_PATH,
                JSON.stringify(crawlingStore.getState())
            );
        }
        if (line === "xlsx" || line === "x") {
            jsonToXlsx(CATEGORY_PATH, "data.xlsx");
        }
    });
};
const addSheet = <T>(workbook: XLSX.WorkBook, name: string, data: T[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
};
const jsonToXlsx = (jsonPath: string, xlsxPath: string) => {
    // read json
    const json = JSON.parse(
        fs.readFileSync(jsonPath).toString("utf-8")
    ) as ICrawlingStore;
    // item reformat
    const itemsArr = Object.entries(json["item"]).map(
        ([itemsKey, ItemsVal]) => {
            const newItem = { ...ItemsVal, ...ItemsVal["company"] };
            delete newItem["company"];
            return { key: itemsKey, value: newItem };
        }
    );
    // array to object
    const newItems = itemsArr.reduce((newItem, { key, value }) => {
        newItem[+key] = value;
        return newItem;
    }, {});

    // create workbook
    const workbook = XLSX.utils.book_new();
    addSheet(workbook, "Major categories", Object.values(json["major"]));
    addSheet(workbook, "Minor categories", Object.values(json["minor"]));
    addSheet(workbook, "Sub categories", Object.values(json["sub"]));
    addSheet(workbook, "item categories", Object.values(newItems));
    // write file
    fs.writeFileSync(
        xlsxPath,
        XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
        })
    );
};
// run
const run = async () => {
    // get driver
    const driver = await getDriver("chrome", "/usr/bin/google-chrome");
    if (driver === undefined) return;
    // console command
    command(driver);
    try {
        // get categories data
        if (!isfileExist(CATEGORY_PATH) || !fs.statSync(CATEGORY_PATH).size)
            await getCategories(driver);
        // write categories data into store
        else
            crawlingStore.dispatch({
                type: SET,
                payload: JSON.parse(fs.readFileSync(CATEGORY_PATH).toString()),
            });

        // // get category item
        // await getItems(driver);
        // // get company detail
        // await getDetail(driver);
        // // get item name
        // jsonToXlsx(CATEGORY_PATH, "data.xlsx");
        // // close driver
        // await driver.quit();
    } catch (err) {
        console.log(err);
        await driver.quit();
    }
};
run();
const emptyIgnore = () => {
    crawlingStore.dispatch({
        type: SET,
        payload: onpenJson(CATEGORY_PATH),
    });
    const cpItem = { ...crawlingStore.getState().item };
    const newItem = Object.values(cpItem).reduce((acc, cur) => {
        if (cur.company && cur.company.title !== "") acc[cur.id] = cur;
        return acc;
    }, {});
    crawlingStore.dispatch({
        type: SET,
        payload: { ...crawlingStore.getState(), item: newItem },
    });
    saveJson("ignore.json");
    jsonToXlsx("ignore.json", "ignore.xlsx");
};
// open json file
const onpenJson = (path: string) =>
    JSON.parse(fs.readFileSync(path).toString());
// save json file
const saveJson = (path: string) =>
    fs.writeFileSync(path, JSON.stringify(crawlingStore.getState()));
// try number
const tryNum = (str: string): number | undefined => {
    const tryNum = parseFloat(str);
    if (!isNaN(tryNum) && isFinite(tryNum)) return tryNum;
    return undefined;
};
// convert company class
const classConverte = () => {
    crawlingStore.dispatch({
        type: SET,
        payload: onpenJson(CATEGORY_PATH),
    });
    const cpItem = { ...crawlingStore.getState().item };
    const newItem = Object.values(cpItem).reduce((acc, cur) => {
        const enumNum = tryNum(cur.itemClass);
        if (typeof enumNum === "number")
            acc[cur.id] = {
                ...cur,
                itemClass: ECompanyClass[enumNum] as keyof typeof ECompanyClass,
            };
        else acc[cur.id] = cur;
        return acc;
    }, {});
    crawlingStore.dispatch({
        type: SET,
        payload: { ...crawlingStore.getState(), item: newItem },
    });
    saveJson("renameClass.json");
    jsonToXlsx("renameClass.json", "renameClass.xlsx");
};

// Item company duplicate filter
const itemCompanyFilter = () => {
    const cpCategory = { ...crawlingStore.getState() };
    const newItem: { [id: number]: IItem } = {};
    const map = new Map<string, IItem>();
    for (const item of Object.values(cpCategory["item"])) {
        if (!item.company) continue;
        map.set(item.company.mail, item);
    }
    const iterator = map.values();
    while (true) {
        const item = iterator.next().value;
        if (!item) break;
        newItem[item.id] = item;
    }
    crawlingStore.dispatch(addItemAction(newItem));
    saveJson("filterItems.json");
    jsonToXlsx("filterItems.json", "filterItems.xlsx");
};

// get array to object
const arrayToObject = (array: any[], keyField: string) => {
    return array.reduce((obj, item) => {
        if (typeof item[keyField] === "undefined")
            throw new Error("keyField is 'undefined'");
        obj[item[keyField]] = item;
        return obj;
    }, {});
};

// get xlsx file to json
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
    jsonToXlsx(CATEGORY_PATH, "data.xlsx");
};

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
// jsonToXlsx(CATEGORY_PATH, "data.xlsx");
