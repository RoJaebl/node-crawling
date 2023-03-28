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
    subId: number[];
}
export interface ISub extends ICategory {
    majorId: number;
    minorId: number;
    itemId: number[];
}
export interface ICompany {
    title?: string;
    name?: string;
    companyNum?: number;
    business?: string;
    adress?: string;
    phone?: string;
    main?: string;
}
export interface IItem extends ICategory {
    majorId: number;
    minorId: number;
    subId: number;
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
    { type, data }: { type: string; data: ICrawlingStore }
) => {
    switch (type) {
        case SET:
            return { ...data };
        default:
            return { ...state };
    }
};
export const crawlingStore = createStore(reducer);

/**
 * @description
 * - items 요소에 모든 item을 저장한다. 저장된 item 구성에는 items에 위치한 인덱스 요소를 포함한다.
 * - category를 해시탐색하기 위해 id id를 key로 title를 value로 구성한다.
 * - majorCategory 요소에는 minor id key가 저장된다. 또한 minorCategory 요소에는 major id key가 저장된다.
 * - minorCategory 요소에는 sub id key가 저장된다. 또한 subCategory 요소에는 minor id key가 저장된다.
 * - subCategory 요소에는 item id key가 저장된다. 또한 item 요소에는 sub id key가 저장된다.
 * - item 요소에는 detail 내용이 저장된다.
 */
// case SET_CRAWLING:
//             return { ...(data as ICrawlingAction).crawling };
//         case SET_CATEGORY:
//             return {
//                 ...state,
//                 ["categories"]: [
//                     ...(state["categories"] as ICategory[]),
//                     ...(data as ICategoryAction).category,
//                 ],
//             };
//         case SET_ITEM:
//             const cpCategories = [...(state["categories"] as ICategory[])];
//             let majorIdx: number, minorIdx: number, subIdx: number;
//             const majorItem = cpCategories.find((major, index) => {
//                 if (major.id === (payload as IItemAction).route.majorId) {
//                     majorIdx = index;
//                     return true;
//                 }
//             });
//             const minorItem = majorItem.downCategory.find((minor, index) => {
//                 if (minor.id === (payload as IItemAction).route.minorId) {
//                     minorIdx = index;
//                     return true;
//                 }
//             });
//             const subItem = minorItem.downCategory.find((sub, index) => {
//                 if (sub.id === (payload as IItemAction).route.subId) {
//                     subIdx = index;
//                     return true;
//                 }
//             });
//             const newSubItem = {
//                 ...subItem,
//                 ["items"]: (payload as IItemAction).item,
//             };
//             minorItem.downCategory.splice(subIdx, 1);
//             minorItem.downCategory.splice(subIdx, 0, newSubItem);
//             majorItem.downCategory.splice(minorIdx, 1);
//             majorItem.downCategory.splice(minorIdx, 0, minorItem);
//             cpCategories.splice(majorIdx, 1);
//             cpCategories.splice(majorIdx, 0, majorItem);
//             return { ...state, ["categories"]: cpCategories };

// case ECrawlingType.SET_MAJOR:
//             const cpMajors = { ...state["major"] };
//             const cpMajor = { ...data } as IMajor;
//             const newMajors = { ...cpMajors, [cpMajor.id]: cpMajor };
//             return {
//                 ...state,
//                 major: newMajors,
//             };
//         case ECrawlingType.SET_MINOR:
//             const cpMinors = { ...state["minor"] };
//             const cpMinor = { ...data } as IMinor;
//             const newMinors = { ...cpMinors, [cpMinor.id]: cpMinor };
//             return {
//                 ...state,
//                 minor: newMinors,
//             };
//         case ECrawlingType.SET_SUB:
//             const cpSubs = { ...state["sub"] };
//             const cpSub = { ...data } as ISub;
//             const newSubs = { ...cpSubs, [cpSub.id]: cpSub };
//             return {
//                 ...state,
//                 sub: newSubs,
//             };
//         case ECrawlingType.SET_ITEM:
//             const cpItems = { ...state["item"] };
//             const cpItem = { ...data } as IItem;
//             const newItems = { ...cpItems, [cpItem.id]: cpItem };
//             return {
//                 ...state,
//                 item: newItems,
//             };
