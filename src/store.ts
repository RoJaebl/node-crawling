import { legacy_createStore as createStore, Reducer } from "redux";
import { ECompanyClass } from "./items.js";

export interface ICategory {
    id: number;
    name: string;
    url: string;
}
export interface IMajor extends ICategory {
    minorId: number[];
}
export interface IMinor extends ICategory {
    majorId: number;
    majorName: string;
    subId: number[];
}
export interface ISub extends ICategory {
    majorId: number;
    majorName: string;
    minorId: number;
    minorName: string;
    itemId: number[];
}
export interface ICompany {
    title?: string;
    ceo?: string;
    companyNum?: any;
    business?: string;
    adress?: string;
    phone?: string;
    mail?: string;
}
export interface IItem extends ICategory {
    majorId: number;
    majorName: string;
    minorId: number;
    minorName: string;
    subId: number;
    subName: string;
    price: string;
    itemClass: keyof typeof ECompanyClass;
    company?: ICompany;
}
export interface ICrawlingStore {
    major: { [id: number]: IMajor };
    minor: { [id: number]: IMinor };
    sub: { [id: number]: ISub };
    item: { [id: number]: IItem };
}
export const SET = "SET";
export const ADD_MAJOR = "ADD_MAJOR";
export const ADD_MINOR = "ADD_MINOR";
export const ADD_SUB = "ADD_SUB";
export const ADD_ITEM = "ADD_ITEM";
export const addMajorAction = (major: { [id: number]: IMajor }) => ({
    type: ADD_MAJOR,
    payload: major,
});
export const addMinorAction = (minor: { [id: number]: IMinor }) => ({
    type: ADD_MINOR,
    payload: minor,
});
export const addSubAction = (sub: { [id: number]: ISub }) => ({
    type: ADD_SUB,
    payload: sub,
});
export const addItemAction = (item: { [id: number]: IItem }) => ({
    type: ADD_ITEM,
    payload: item,
});

const reducer: Reducer<ICrawlingStore> = (
    state: ICrawlingStore = { major: {}, minor: {}, sub: {}, item: {} },
    { type, payload }: { type: string; payload: ICrawlingStore }
) => {
    switch (type) {
        case ADD_MAJOR:
            return { ...state, major: { ...state.major, ...payload } };
        case ADD_MINOR:
            return { ...state, minor: { ...state.minor, ...payload } };
        case ADD_SUB:
            return { ...state, sub: { ...state.sub, ...payload } };
        case ADD_ITEM:
            return { ...state, item: { ...state.item, ...payload } };
        case SET:
            return { ...payload };
        default:
            return { ...state };
    }
};
export const crawlingStore = createStore(reducer);

import * as chrome from "selenium-webdriver/chrome.js";
import { Builder, WebDriver } from "selenium-webdriver";

export const edgeHeader =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582";
export const chromeHeader =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36";

export const getDriver = (
    browser: string,
    binaryPath: string,
    browserHeader: string
): WebDriver | undefined => {
    try {
        const option = new chrome.Options();
        option.setChromeBinaryPath(binaryPath);
        const driver = new Builder()
            .forBrowser(browser)
            .usingHttpAgent(browserHeader)
            .setChromeOptions(option)
            .build();
        return driver;
    } catch (err) {
        console.log("not create driver");
        return undefined;
    }
};
interface IDriverAction {
    type: string;
    payload: WebDriver;
}
export const setDriverAction = (driver: WebDriver): IDriverAction => ({
    type: SET,
    payload: driver,
});
const driverRducer = (state = undefined, { type, payload }: IDriverAction) => {
    switch (type) {
        case SET:
            return payload;
        default:
            return state;
    }
};
export const driverStore = createStore(driverRducer);
