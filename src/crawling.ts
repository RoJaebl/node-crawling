import {
    By,
    Builder,
    WebDriver,
    WebElement,
    Actions,
} from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome.js";
import { categoryStore } from "./store.js";
import { getCategories } from "./categories.js";
/**
 * hover action
 * @param {Actions} actor
 * @param {WebElement} origin
 * @param {number} duration
 */
export const hover = async (
    actor: Actions,
    origin: WebElement,
    duration?: number
) => {
    await actor.move({ duration, origin }).perform();
    await actor.clear();
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

// run
const run = async () => {
    try {
        // get driver
        const driver = await getDriver("chrome", "/usr/bin/google-chrome");
        if (!driver) throw driver;
        // get categories data
        await getCategories(driver);
    } catch (err) {
        console.log(err);
    }
};

run();
