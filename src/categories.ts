import fs from "fs";
import { By, WebDriver, WebElement } from "selenium-webdriver";
import { crawlingStore, ICategory, SET_CATEGOTY } from "./store.js";
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
    await driver.findElement(propsXPath.categoryButton).click();
    // wait for category layer
    await driver.sleep(100);
    // get major categories
    const majors = await driver.findElements(propsXPath.major);
    // iterate major categories
    for await (const major of majors) {
        const newMajor = await createCategory(
            await major.findElement(By.xpath("a"))
        );
        await hover(driver, major, { sleep: 100 });
        const minors = await driver.findElements(propsXPath.minor);
        if (
            (await major.findElement(By.xpath("a")).getText()) === "나들이/여행"
        )
            break;
        // iterate minor categories
        for await (const minor of minors) {
            const newMinor = await createCategory(
                await minor.findElement(By.xpath("a"))
            );
            newMajor.downCategory.push(newMinor);
            await hover(driver, minor, { sleep: 100 });
            await driver.sleep(100);
            const subs = await driver.findElements(propsXPath.sub);
            // iterate sub categories
            for await (const sub of subs) {
                const newSub = await createCategory(
                    await sub.findElement(By.xpath("a"))
                );
                newMinor.downCategory.push(newSub);
            }
        }
        // write categories data into store
        crawlingStore.dispatch({
            type: SET_CATEGOTY,
            data: { ["categories"]: [newMajor] },
        });
    }
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
