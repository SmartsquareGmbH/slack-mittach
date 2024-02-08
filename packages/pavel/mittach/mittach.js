const axios = require("axios");
const { format, getDay } = require("date-fns");
const { de } = require("date-fns/locale");
const cheerio = require("cheerio");

function formatDateToGerman(date) {
  return format(date, "EEEE, d. MMMM yyyy", { locale: de });
}

async function getDishesForDay(url, datestring) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const tableRows = $(`h2:contains("${datestring}")`)
    .parent()
    .find("table > tbody > tr");
  const gericht1 = tableRows.first();
  const gericht2 = gericht1.next();
  const gericht3 = gericht2.next();

  const rows = [gericht1, gericht2, gericht3];

  const dishes = [];
  rows.forEach((row) => {
    const textContents = [];
    row.find("td").each((i, element) => {
      const innerHtml = $(element).html();
      const text = innerHtml
        .replace(/<strong>(.*?)<\/strong>/g, "$1")
        .replace(/<br\s*\/?>/g, ", ")
        .trim();
      textContents.push(text);
    });
    const dishText = textContents.join(": ");
    dishes.push(dishText);
  });
  return dishes.join("\n");
}

const cafeUrl = "https://www.cafe-kriemelmann.de/speiseplan/";
const today = new Date();
const datestring = formatDateToGerman(today);

async function main(args) {
  const dishes = await getDishesForDay(cafeUrl, datestring);
  console.log(dishes);
  const body = {
    "response_type": "in_channel",
    "text": dishes
  }
  return { body: body };
}

exports.main = main