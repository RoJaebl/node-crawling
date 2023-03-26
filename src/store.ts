import { legacy_createStore as createStore, Reducer, Action } from "redux";

interface ICompanyInfo {
    title?: string;
    name?: string;
    companyNum?: number;
    business?: string;
    adress?: string;
    phone?: string;
    main?: string;
}
interface IItemInfo {
    title: string;
    price: string;
    image: string;
    company: ICompanyInfo;
}
interface ICategory {
    id: number;
    name: string;
    url: string;
    items?: IItemInfo[];
    downCategory: ICategory[] | undefined;
}
type CrawlingData = {
    [key: string]: ICategory[] | string | number;
};

export const SET: Action<string> = { type: "SET" };
interface ICategoriesAction {
    type: Action<string>;
    data: CrawlingData;
}
const reducer: Reducer<CrawlingData> = (
    state: CrawlingData = {},
    { type, data }: ICategoriesAction
) => {
    switch (type) {
        case SET:
            return { ...state, ...data };
        default:
            return { ...state };
    }
};
const crawlingStore = createStore(reducer);

export { crawlingStore };
export type { CrawlingData, ICategory };
