const fetch = require("node-fetch");
const { parse } = require("node-html-parser");

const endpoint = "https://www.asicminervalue.com/miners/";
const { CHAT_ID, BOT_TOKEN, MINER, PRICE, PRICE_KWH } = process.env;

if (!CHAT_ID || !BOT_TOKEN || !MINER) {
  console.error("Please set a BOT_TOKEN, CHAT_ID and MINER in your environment!");
  process.exit(1);
}

const getFloat = (str) => {
  return parseFloat(str.replace(/[\$,]/, ""));
};

const sendMessage = (message) => {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });
};

fetch(endpoint + MINER, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "currency=USD&electricitycost=" + PRICE_KWH,
})
  .then((r) => r.text())
  .then((html) => {
    const dom = parse(html);

    let title = dom.querySelector("body > div.container > div.row-fluid > h1").innerText.trim();

    let today = new Date().toLocaleString();

    let titles = ["Daily", "Monthly", "Yearly"];

    let message = `‎\n*${title}*\n`;

    let income = dom.querySelector(
      "body > div.container > div:nth-child(2) > div:nth-child(2) > table.table.table-striped.rentability > tbody > tr:nth-child(1)"
    ).childNodes;

    message += "\n💡 *Income*: ";
    for (let i = 0; i < 3; i++) {
      message += `\n📈 ${titles[i]}: *${income[i + 2].innerText.trim()}*`;
    }

    let electricity = null;
    if (PRICE_KWH) {
      electricity = dom.querySelector(
        "body > div.container > div:nth-child(2) > div:nth-child(2) > table.table.table-striped.rentability > tbody > tr:nth-child(2)"
      ).childNodes;

      message += "\n\n💡 *Electricity*: ";
      for (let i = 0; i < 3; i++) {
        message += `\n📈 ${titles[i]}: *${electricity[i + 2].innerText.trim()}*`;
      }
    }

    message = message.replaceAll(",", "'");

    if (PRICE) {
      let daily = getFloat(income[2].innerText);

      if (electricity) {
        daily += getFloat(electricity[2].innerText);
      }

      let roi = getFloat(PRICE) / daily;

      let months = Math.floor(roi / 30);
      let days = Math.floor(roi - months * 30);

      message += `\n\n💰 ROI: _${months} month` + (months > 1 ? "s" : "");

      if (days > 0) {
        message += ` and ${days} day` + (days > 1 ? "s" : "");
      }

      message += `_`;
    }

    message += `\n‎\n_${today}_`;
    sendMessage(message);
  });
