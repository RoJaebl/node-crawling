interface ICategoryInfo {
    id: number;
    name: string;
    url: string;
    element: Element;
}
const findElementsXPath = (xPath: string) => {
    const result = [];
    const iterator = document.evaluate(
        xPath,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );

    let curNode = iterator.iterateNext();
    while (curNode) {
        result.push(curNode);
        curNode = iterator.iterateNext();
    }
    return result;
};
const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));
const hover = (hoverOver, element) => {
    const rect = element.getBoundingClientRect();
    hoverOver.view.moveTo(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
    );
    element.dispatchEvent(hoverOver);
};
const click = (click, element) => {
    const rect = element.getBoundingClientRect();
    click.view.moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
    element.dispatchEvent(click);
};
const findElements = (className: string) => {
    const container = document.getElementsByClassName(className)[0];
    try {
        const list = Object.values(container.querySelectorAll("li"));
        return list.reduce<{ [key: number]: ICategoryInfo }>((infos, cur) => {
            const element = cur.querySelector("a")!;
            const url = element.getAttribute("href")!;
            const id = +url.slice(url.indexOf("catId=") + "carId=".length);
            const name = element.textContent!;
            infos[id] = { id, name, url, element };
            return infos;
        }, {});
    } catch {
        return {};
    }
};
export const getScriptCategories = async () => {
    const mouseOut = new MouseEvent("mouseout", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    const mouseClick = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    await delay(100);
    const categoryBtn = document.getElementsByClassName(
        "_categoryButton_category_3_5ml"
    )[0];
    click(mouseClick, categoryBtn);
    await delay(100);
    // init categories
    const newMajors = {};
    const newMinors = {};
    const newSubs = {};

    const newMajor = {};
    const majors = findElements("_categoryLayer_main_category_2A7mb");
    console.log(majors);
    for (const major of Object.values(majors)) {
        const { id, name, url, element } = major;
        hover(mouseOut, element);
        newMajor[id] = { id, name, url, minorId: [] };

        const newMinor = {};
        const minors = findElements("_categoryLayer_middle_category_2g2zY");
        for (const minor of Object.values(minors)) {
            const { id, name, url, element } = minor;
            hover(mouseOut, element);
            newMinor[id] = {
                id,
                name,
                url,
                majorId: major.id,
                majorName: major.name,
                subId: [],
            };
            const subs = findElements("_categoryLayer_subclass_1K649");
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
    return { major: newMajors, minor: newMinors, sub: newSubs };
};
