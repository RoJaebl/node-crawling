import { CATEGORY_PATH, pageScrollTo, saveJson } from "./index.js";
import {
    addItemAction,
    crawlingStore,
    driverStore,
    IItem,
    setSubAction,
} from "./store.js";
import fs from "fs";

export enum ECompanyClass {
    "씨앗" = 0,
    "새싹",
    "파워",
    "빅파워",
    "프리미엄",
    "플래티넘",
}
interface ICrawlingItem {
    rating: string;
    id: string;
    url: string;
    name: string;
    price: string;
    img: string;
}
export const findElementsXPathScript = (xPath: string) => `
const findElementsXPath = (xPath) => {
    const iterator = document.evaluate(
        xPath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );
    const nodes = [];
    let curNode = iterator.iterateNext();
    while (curNode) {
        nodes.push(curNode);
        curNode = iterator.iterateNext();
    }
    if(nodes.length === 0 ) return undefined;
    return nodes;
};
let elements = findElementsXPath("${xPath}");
`;
export const clickScript = (xPath: string, index: number = 0) =>
    findElementsXPathScript(xPath) + `elements[${index}].click();`;
const itemInfoScript = (xPath: string) =>
    findElementsXPathScript(xPath) +
    `
    return elements.map((element) => {
        const ratingable = element.querySelector("span.basicList_grade__unbQp");
        const priceable = element.querySelector("span.price_price__LEGN7");
        const imgable = element.querySelector("img");
        const linkable = element.querySelector("a.basicList_mall__BC5Xu");
        const idable = linkable ? linkable.getAttribute("data-nclick") : "";
        const idStart = idable.indexOf("i:") + "i:".length;
        const idEnd = idable.indexOf(",r:");

        const rating = ratingable?.querySelector("img") ? ratingable.innerText : "새싹";
        const id = idable.slice(idStart, idEnd);
        const url = linkable ? linkable.getAttribute("href"): "";
        const name = linkable ? linkable.innerText : "";
        const price = priceable ? priceable.innerText : "0원";
        const img = imgable ? imgable.getAttribute("src") : "";
        return {
            rating,
            id,
            url,
            name,
            price,
            img,
        }
    });`;
export const getItems = async () => {
    const driver = driverStore.getState();
    const cpSubs = { ...crawlingStore.getState().sub };
    for await (const [subId, sub] of Object.entries(cpSubs)) {
        if (sub.itemId.length !== 0) continue;
        await driver.get(sub.url);
        await driver.sleep(100);

        await driver.executeScript(clickScript("//a[text()='네이버페이']"));
        await driver.executeScript(
            clickScript(
                "//div[contains(@class,'subFilter_select_box__dX_vV')][2]"
            )
        );
        await driver.executeScript(
            clickScript(
                "//div[contains(@class,'subFilter_select_box__dX_vV')][2]//li//a[text()='80개씩 보기']"
            )
        );

        await pageScrollTo(driver, { duration: 600, sleep: 100 });

        const items: ICrawlingItem[] = await driver.executeScript(
            itemInfoScript("//div[contains(@class,'basicList_item__0T9JD')]")
        );
        const newItem: { [id: number]: IItem } = {};
        for (const item of items) {
            const { id, name, price, url, img, rating } = item;
            if (
                id === "" ||
                ECompanyClass[rating] !== 2 ||
                url.includes("shopping.naver.com") ||
                (!url.includes("smartstore.naver.com") &&
                    !url.includes("adcr.naver.com"))
            )
                continue;
            newItem[id] = {
                id,
                name,
                price,
                url,
                itemClass: rating,
                majorId: sub.majorId,
                majorName: sub.majorName,
                minorId: sub.minorId,
                minorName: sub.minorName,
                subId: +subId,
                subName: sub.name,
            };
        }
        crawlingStore.dispatch(addItemAction(newItem));
        const itemIds = Object.keys(newItem).map((id) => +id);
        if (itemIds.length === 0) cpSubs[+subId].itemId.push(0);
        cpSubs[+subId].itemId.push(...itemIds);
        crawlingStore.dispatch(setSubAction(cpSubs));

        saveJson(CATEGORY_PATH);
    }
};
