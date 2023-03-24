import { legacy_createStore as createStore, Reducer, Action } from "redux";

interface ICategory {
    id: number;
    name: string;
    url: string;
    downCategory: ICategory[] | undefined;
}
type Categoryies = ICategory[];

export const SET = "SET";

const reducer: Reducer = (
    state: Categoryies = [],
    { type, ...data }: Action<string>
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
export type { Categoryies, ICategory };
