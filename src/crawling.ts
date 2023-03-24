import {
    By,
    Builder,
    WebDriver,
    WebElement,
    Actions,
} from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { Categories, categoryStore, ICategory, SET } from "./store.js";
import fs from "fs";

const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/home");
    await driver
        .findElement(By.className("_categoryButton_category_button_1lIOy"))
        .click();
    await driver.sleep(100);
    const actor = driver.actions({ async: true });
    const majors = await driver.findElements(By.xpath(categoryXPath.major));
    for await (const major of majors) {
        const newMajor = await createCategory(
            await major.findElement(By.xpath("a"))
        );
        await hover(actor, major, 100);
        const minors = await driver.findElements(By.xpath(categoryXPath.minor));

        if (
            (await major.findElement(By.xpath("a")).getText()) === "나들이/여행"
        )
            break;
        for await (const minor of minors) {
            const newMinor = await createCategory(
                await minor.findElement(By.xpath("a"))
            );
            newMajor.downCategory.push(newMinor);
            await hover(actor, minor, 100);
            const subs = await driver.findElements(By.xpath(categoryXPath.sub));
            for await (const sub of subs) {
                const newSub = await createCategory(
                    await sub.findElement(By.xpath("a"))
                );
                newMinor.downCategory.push(newSub);
            }
        }
        categoryStore.dispatch({ type: SET, data: newMajor });
    }
    await driver.quit();

    // write categories data into json file
    fs.writeFile(
        "categoris.json",
        JSON.stringify(categoryStore.getState()),
        "utf8",
        (err) => {
            if (err) throw err;
            console.log("File saved!");
        }
    );
};

const hover = async (actor: Actions, origin: WebElement, duration?: number) => {
    await actor.move({ duration, origin }).perform();
    await actor.clear();
};

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

const categoryXPath = {
    major: `//div[contains(@class,'_categoryLayer_main_category_2A7mb')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
    minor: `//div[contains(@class,'_categoryLayer_middle_category_2g2zY')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
    sub: `//div[contains(@class,'_categoryLayer_subclass_1K649')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`,
};
const run = async () => {
    try {
        const driver = await getDriver("chrome", "/usr/bin/google-chrome");
        if (!driver) throw driver;
        await getCategories(driver);
    } catch (err) {
        console.log(err);
    }
};

run();
