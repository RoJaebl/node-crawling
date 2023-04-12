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

const reducer: Reducer<ICrawlingStore> = (
    state: ICrawlingStore = { major: {}, minor: {}, sub: {}, item: {} },
    { type, payload }: { type: string; payload: ICrawlingStore }
) => {
    switch (type) {
        case SET:
            return { ...payload };
        default:
            return { ...state };
    }
};
export const crawlingStore = createStore(reducer);
