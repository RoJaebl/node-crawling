import * as cheerio from "cheerio";
import axios from "axios";

interface IScraper {
    category: string;
    image: string;
}
const scraper = async () => {
    try {
        const url = "https://shopping.naver.com/home";
        const html = await axios(url);
        const $ = cheerio.load(html.data);
        const $categories = $(".category_list__bmz__");

        const categories: IScraper[] = [];
        $categories.each((index, category) => {
            categories.push({
                category: $(category).find("button").text(),
                image: $(category).find("img").attr("src") ?? "",
            });
        });
        console.log(categories);
    } catch (err) {
        console.log(err);
    }
};

scraper();
