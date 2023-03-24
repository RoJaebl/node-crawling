import {
    legacy_createStore as createStore,
    Reducer,
    Action,
    AnyAction,
} from "redux";

interface ICategory {
    id: number;
    name: string;
    url: string;
    downCategory: ICategory[] | undefined;
}
type Categories = ICategory[];

export const SET: Action<string> = { type: "SET" };
interface ICategoriesAction {
    type: Action<string>;
    data: ICategory;
}
const reducer: Reducer<Categories> = (
    state: Categories = [],
    { type, data }: ICategoriesAction
) => {
    switch (type) {
        case SET:
            return [...state, data];
        default:
            return [...state];
    }
};
const categoryStore = createStore(reducer);

export { categoryStore };
export type { Categories, ICategory };
