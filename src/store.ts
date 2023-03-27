import { legacy_createStore as createStore, Reducer, Action } from "redux";
import { ECompanyClass } from "./items.js";

export interface ICompany {
    title?: string;
    name?: string;
    companyNum?: number;
    business?: string;
    adress?: string;
    phone?: string;
    main?: string;
}
export interface IItem {
    title: string;
    price: string;
    image: string;
    url: string;
    itemClass: keyof typeof ECompanyClass;
    company?: ICompany;
}
export interface ICategory {
    id: number;
    name: string;
    url: string;
    items?: IItem[];
    downCategory: ICategory[] | undefined;
}
export type CrawlingData = {
    [key: string]: ICategory[] | string | number;
};

export const SET_CATEGOTY: Action<string> = { type: "SET_CATEGOTY" };
interface ICategoriesAction {
    type: Action<string>;
    data: CrawlingData;
}
const reducer: Reducer<CrawlingData> = (
    state: CrawlingData = { categories: [] },
    { type, data }: ICategoriesAction
) => {
    switch (type) {
        case SET_CATEGOTY:
            return {
                ...state,
                ["categories"]: [
                    ...(state["categories"] as ICategory[]),
                    ...(data["categories"] as ICategory[]),
                ],
            };
        default:
            return { ...state };
    }
};
export const crawlingStore = createStore(reducer);
