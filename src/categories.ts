import fs from "fs";
import { WebDriver, WebElement } from "selenium-webdriver";
import { crawlingStore, IMajor, IMinor, ISub, SET } from "./store.js";
import { CATEGORY_PATH, hover } from "./crawling.js";
interface ICategoryInfo {
    id: number;
    name: string;
    url: string;
    element: WebElement;
}
const findElements = (className: string) => {
    const container = document.getElementsByClassName(className)[0];
    try {
        const list = Object.values(container.querySelectorAll("li"));
        return list.reduce((infos, cur) => {
            const element = cur.querySelector("a");
            const url = element.getAttribute("href");
            const id = +url.slice(url.indexOf("catId=") + "carId=".length);
            const name = element.textContent;
            infos[id] = { id, name, url, element };
            return infos;
        }, {});
    } catch {
        return {};
    }
};
export const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/");
    await driver.executeScript(`
        document.getElementsByClassName("_categoryButton_category_3_5ml")[0].click();
    `);
    await driver.sleep(100);

    // init categories
    const newMajors: { [key: number]: IMajor } = {};
    const newMinors: { [key: number]: IMinor } = {};
    const newSubs: { [key: number]: ISub } = {};

    const newMajor = {};
    const majors: ICategoryInfo[] = await driver.executeScript(
        findElements,
        "_categoryLayer_main_category_2A7mb"
    );
    for await (const major of Object.values(majors)) {
        const { id, name, url, element } = major;
        await hover(driver, element, { sleep: 1 });
        newMajor[id] = { id, name, url, minorId: [] };
        const newMinor = {};
        const minors: ICategoryInfo[] = await driver.executeScript(
            findElements,
            "_categoryLayer_middle_category_2g2zY"
        );
        for await (const minor of Object.values(minors)) {
            const { id, name, url, element } = minor;
            await hover(driver, element, { sleep: 200 });
            newMinor[id] = {
                id,
                name,
                url,
                majorId: major.id,
                majorName: major.name,
                subId: [],
            };
            const subs: ICategoryInfo[] = await driver.executeScript(
                findElements,
                "_categoryLayer_subclass_1K649"
            );
            const newSub = Object.values(subs).reduce(
                (newSub, { id, name, url }) => {
                    newSub[id] = {
                        id,
                        name,
                        url,
                        majorId: major.id,
                        majorName: major.name,
                        minorId: minor.id,
                        minorName: minor.name,
                        itemId: [],
                    };
                    return newSub;
                },
                {}
            );
            Object.assign(newSubs, newSub);
            Object.assign(newMinors, newMinor);
            newMinors[minor.id].subId.push(
                ...Object.keys(newSub).map((id) => +id)
            );
        }
        Object.assign(newMajors, newMajor);
        newMajors[major.id].minorId.push(
            ...Object.keys(newMinor).map((id) => +id)
        );
    }

    // save categories data to store
    crawlingStore.dispatch({
        type: SET,
        payload: { major: newMajors, minor: newMinors, sub: newSubs, item: {} },
    });
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
