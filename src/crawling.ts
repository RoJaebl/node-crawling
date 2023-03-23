import { By, Button, Builder, WebDriver, Key } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { categoryStore } from "./store.js";

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

const getCategoryXPath = (className: string): string =>
    `//div[contains(@class,'${className}')]//ul[contains(@class,'_categoryLayer_category_list_2PSxr')]//li[contains(@class,'_categoryLayer_list_34UME')]`;
const categoryXPath = {
    major: getCategoryXPath("_categoryLayer_main_category_2A7mb"),
    minor: getCategoryXPath("_categoryLayer_middle_category_2g2zY"),
    sub: getCategoryXPath("_categoryLayer_subclass_1K649"),
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
            await actor.move({ origin: major }).perform();
            await driver.sleep(200);
            const minors = await driver.findElements(
                By.xpath(categoryXPath.minor)
            );
            await actor.clear();
            for await (const minor of minors) {
                await actor.move({ origin: minor }).perform();
                await driver.sleep(200);
                const subs = await driver.findElements(
                    By.xpath(categoryXPath.sub)
                );
                await actor.clear();
            }
        }
        await driver.quit();
    } catch (err) {
        console.log(err);
    }
};

run();
