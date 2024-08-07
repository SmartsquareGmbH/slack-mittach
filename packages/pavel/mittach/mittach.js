const axios = require("axios");
const { format, getDay } = require("date-fns");
const { de } = require("date-fns/locale");
const cheerio = require("cheerio");

function formatDateToGerman(date) {
  return format(date, "EEEE, dd. MMMM yyyy", { locale: de });
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
        .replace(/<strong>(.*?)<\/strong>/g, "*$1*")
        .replace(/<br\s*\/?>/g, ", ")
        .replace(/, \*/g, "*, ")
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
  const body = {
    response_type: "in_channel",
    text: `Mittagsmenü ${datestring}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:knife_fork_plate: Mittagsmenü ${datestring}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: dishes,
        },
      },
    ],
  };
  return { body: body };
}
main();
exports.main = main;
