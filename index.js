const fetch = require("node-fetch");
const { parse } = require("node-html-parser");

const endpoint = "https://www.asicminervalue.com/miners/";
const { CHAT_ID, BOT_TOKEN, MINER, PRICE } = process.env;

if (!CHAT_ID || !BOT_TOKEN || !MINER) {
  console.error("Please set a BOT_TOKEN, CHAT_ID and MINER in your environment!");
  process.exit(1);
}

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

fetch(endpoint + MINER)
  .then((r) => r.text())
  .then((html) => {
    const dom = parse(html);

    let title = dom.querySelector("body > div.container > div.row-fluid > h1").innerText.trim();

    let daily = dom
      .querySelector(
        "body > div.container > div:nth-child(2) > div:nth-child(2) > table.table.table-striped.rentability > tbody > tr:nth-child(1) > td:nth-child(2)"
      )
      .innerText.trim();

    let monthly = dom
      .querySelector(
        "body > div.container > div:nth-child(2) > div:nth-child(2) > table.table.table-striped.rentability > tbody > tr:nth-child(1) > td:nth-child(3)"
      )
      .innerText.trim();

    let yearly = dom
      .querySelector(
        "body > div.container > div:nth-child(2) > div:nth-child(2) > table.table.table-striped.rentability > tbody > tr:nth-child(1) > td:nth-child(4)"
      )
      .innerText.trim();

    let today = new Date().toLocaleString();

    let message = `‎\n*${title}*\n\n📈 Daily: *${daily}*\n📈 Monthly: *${monthly}*\n📈 Yearly: *${yearly}*`;

    message = message.replaceAll(",", "'");

    if (PRICE) {
      daily = parseFloat(daily.replaceAll("$", "").replaceAll(",", ""));
      let roi = parseFloat(PRICE) / daily;

      let months = Math.floor(roi / 30);
      let days = Math.floor(roi - months * 30);

      message += `\n\n💰 ROI: _${months} month`;
      if (months > 1) {
        message += "s";
      }

      if (days > 0) {
        message += ` and ${days} day`;
        if (days > 1) {
          message += "s";
        }
      }

      message += `_`;
    }

    message += `\n‎\n_${today}_`;

    sendMessage(message);
  });
