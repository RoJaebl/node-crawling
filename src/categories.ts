import fs from "fs";
import { By, WebDriver, WebElement } from "selenium-webdriver";
import { categoryStore, ICategory, SET } from "./store.js";
import { hover } from "./crawling.js";

// category xpath
const categoryXPath = {
    major: `//div[contains(@class,'_categoryLayer_main_category_2A7mb')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
    minor: `//div[contains(@class,'_categoryLayer_middle_category_2g2zY')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
    sub: `//div[contains(@class,'_categoryLayer_subclass_1K649')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
};
// categories data path
const CATEGORY_PATH = "categories.json";
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
        downCategory: [],
    };
};
/**
 * get categories data from naver shopping
 * @param {WebDriver} driver
 */
export const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/home");
    // category button click
    await driver
        .findElement(By.className("_categoryButton_category_button_1lIOy"))
        .click();
    // wait for category layer
    await driver.sleep(100);
    // create action
    const actor = driver.actions({ async: true });
    // if categories data is not exist or empty, get categories data from naver shopping
    if (!isfileExist(CATEGORY_PATH) || !fs.statSync(CATEGORY_PATH).size) {
        // get major categories
        const majors = await driver.findElements(By.xpath(categoryXPath.major));
        // iterate major categories
        for await (const major of majors) {
            const newMajor = await createCategory(
                await major.findElement(By.xpath("a"))
            );
            await hover(actor, major, 100);
            await driver.sleep(100);
            const minors = await driver.findElements(
                By.xpath(categoryXPath.minor)
            );
            if (
                (await major.findElement(By.xpath("a")).getText()) ===
                "나들이/여행"
            )
                break;
            // iterate minor categories
            for await (const minor of minors) {
                const newMinor = await createCategory(
                    await minor.findElement(By.xpath("a"))
                );
                newMajor.downCategory.push(newMinor);
                await hover(actor, minor, 100);
                await driver.sleep(100);
                const subs = await driver.findElements(
                    By.xpath(categoryXPath.sub)
                );
                // iterate sub categories
                for await (const sub of subs) {
                    const newSub = await createCategory(
                        await sub.findElement(By.xpath("a"))
                    );
                    newMinor.downCategory.push(newSub);
                }
            }
            // write categories data into store
            categoryStore.dispatch({ type: SET, data: newMajor });
        }
        // write categories data into json file
        fs.writeFileSync(
            CATEGORY_PATH,
            JSON.stringify(categoryStore.getState()),
            { encoding: "utf-8" }
        );
        // if categories data is exist, get categories data from json file
    } else {
        // write categories data into store
        const data = JSON.parse(fs.readFileSync(CATEGORY_PATH).toString());
        categoryStore.dispatch({ type: SET, data });
    }
    await driver.quit();
};
