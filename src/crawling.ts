import { By, Button, Builder, WebDriver, Key } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { getAllJSDocTagsOfKind } from "typescript";
import { Categoryies, categoryStore, ICategory, SET } from "./store.js";

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
        const actor = driver.actions({ async: true });
        if (!driver) return;
        /** Driving */
        await driver.get("https://shopping.naver.com/home");
        await driver
            .findElement(By.className("_categoryButton_category_button_1lIOy"))
            .click();
        await driver.sleep(100);
        const majors = await driver.findElements(By.xpath(categoryXPath.major));
        for await (const major of majors) {
            const apable = await major.findElement(By.xpath("a"));
            const newMajor: ICategory = {
                id: +(await apable
                    .getAttribute("href")
                    .then((res) =>
                        res.slice(res.indexOf("catId=") + "carId=".length)
                    )),
                name: await apable.getText(),
                url: await apable.getAttribute("href"),
                downCategory: [],
            };
            await actor.move({ duration: 100, origin: major }).perform();
            const minors = await driver.findElements(
                By.xpath(categoryXPath.minor)
            );
            await actor.clear();
            if ((await apable.getText()) === "나들이/여행") break;
            for await (const minor of minors) {
                const apable = await minor.findElement(By.xpath("a"));
                const newMinor: ICategory = {
                    id: +(await apable
                        .getAttribute("href")
                        .then((res) =>
                            res.slice(res.indexOf("catId=") + "carId=".length)
                        )),
                    name: await apable.getText(),
                    url: await apable.getAttribute("href"),
                    downCategory: [],
                };
                newMajor.downCategory.push(newMinor);
                await actor.move({ duration: 100, origin: minor }).perform();
                const subs = await driver.findElements(
                    By.xpath(categoryXPath.sub)
                );
                await actor.clear();
                for await (const sub of subs) {
                    const apable = await sub.findElement(By.xpath("a"));
                    const newSub: ICategory = {
                        id: +(await apable
                            .getAttribute("href")
                            .then((res) =>
                                res.slice(
                                    res.indexOf("catId=") + "carId=".length
                                )
                            )),
                        name: await apable.getText(),
                        url: await apable.getAttribute("href"),
                        downCategory: undefined,
                    };
                    newMinor.downCategory.push(newSub);
                }
            }
            categoryStore.dispatch({ type: SET, data: newMajor });
        }
        console.log(categoryStore.getState());
        await driver.quit();
    } catch (err) {
        console.log(err);
    }
};

run();
