import { legacy_createStore as createStore, Reducer, Action } from "redux";

interface ICategory {
    id?: number;
    name: string;
    url: string;
}
interface ICategories extends ICategory {
    category: {
        major: ICategory;
        middle: ICategory;
    };
}
const SET = "SET";

const reducer: Reducer = (state = {}, { type, ...data }: Action<string>) => {
    switch (type) {
        case SET:
            return { ...state, data };
        default:
            return { ...state };
    }
};
const categoryStore = createStore(reducer);

export { categoryStore };
export type { ICategories, ICategory };
