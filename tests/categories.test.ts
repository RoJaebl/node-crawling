import { describe, expect, test } from "@jest/globals";
import { getDriver } from "../src/crawling.js";

describe("Categyries crawling", () => {
    test("getDriver", () => {
        expect(getDriver("chrome", "/usr/bin/google-chrome")).toBe(
            "get chrome driver"
        );
    });
});
// geategories.test.ts
