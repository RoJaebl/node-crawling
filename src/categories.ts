import fs from "fs";
import { WebDriver, WebElement } from "selenium-webdriver";
import {
    addMajorAction,
    addMinorAction,
    addSubAction,
    crawlingStore,
    IMajor,
    IMinor,
    ISub,
} from "./store.js";
import { CATEGORY_PATH, hover } from "./crawling.js";

interface ICategoryInfo {
    id: number;
    name: string;
    url: string;
    element: WebElement;
}
const findElementsScript = (className: string) => `
const findElements = (className) => {
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
return findElements("${className}");
`;
export const getCategories = async (driver: WebDriver) => {
    await driver.get("https://shopping.naver.com/");
    await driver.executeScript(`
    document.getElementsByClassName("_categoryButton_category_3_5ml")[0].click();
    `);
    await driver.sleep(100);

    const majors = Object.values(
        (await driver.executeScript(
            findElementsScript("_categoryLayer_main_category_2A7mb")
        )) as ICategoryInfo[]
    );
    const newMajor: { [key: number]: IMajor } = majors.reduce(
        (newMajor, { id, name, url }) => {
            newMajor[id] = { id, name, url, minorId: [] };
            return newMajor;
        },
        {}
    );
    for await (const major of majors) {
        await hover(driver, major.element);
        const minors = Object.values(
            (await driver.executeScript(
                findElementsScript("_categoryLayer_middle_category_2g2zY")
            )) as ICategoryInfo[]
        );
        const newMinor: { [key: number]: IMinor } = minors.reduce(
            (newMinor, { id, name, url }) => {
                newMinor[id] = {
                    id,
                    name,
                    url,
                    majorId: major.id,
                    majorName: major.name,
                    subId: [],
                };
                return newMinor;
            },
            {}
        );
        for await (const minor of minors) {
            await hover(driver, minor.element, { sleep: 150 });
            const newSub: { [key: number]: ISub } = Object.values(
                (await driver.executeScript(
                    findElementsScript("_categoryLayer_subclass_1K649")
                )) as ICategoryInfo[]
            ).reduce((newSub, { id, name, url }) => {
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
            }, {});
            crawlingStore.dispatch(addSubAction(newSub));
            const subIds = Object.keys(newSub).map((id) => +id);
            newMinor[minor.id].subId.push(...subIds);
            crawlingStore.dispatch(addMinorAction(newMinor));
        }
        const minorIds = Object.keys(newMinor).map((id) => +id);
        newMajor[major.id].minorId.push(...minorIds);
        crawlingStore.dispatch(addMajorAction(newMajor));
    }
    console.log(
        "sub length: ",
        Object.keys(crawlingStore.getState().sub).length
    );
    // write categories data into json file
    fs.writeFileSync(CATEGORY_PATH, JSON.stringify(crawlingStore.getState()));
};
