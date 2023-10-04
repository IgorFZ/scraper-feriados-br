const { Cluster } = require("puppeteer-cluster");
const fs = require("fs");
const { extractHolidays } = require("./utils/getInfo");
const delay = require("util").promisify(setTimeout);

async function getStates(states) {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 1,
    monitor: true,
    puppeteerOptions: {
      headless: false,
    },
  });

  const getHolidays = async ({ page, data: state }) => {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`https://www.feriados.com.br/feriados.php?ano=2023`);
    await delay(2000);

    try {
      await page.select("#estado", state);
      await delay(2000);

      const cities = await page.evaluate(() => {
        const selectCity = document.getElementById("cidade");
        const cityOptions = Array.from(selectCity.options).map(
          (option) => option.value
        );
        cityOptions.slice(0, 4)
        return cityOptions;
      });

      const citiesData = {};

      for (const city of cities) {
        await page.select("#cidade", city);
        await delay(10000);

        const holidays = await extractHolidays(page);
        citiesData[city] = holidays;
      }

      const jsonData = JSON.stringify(citiesData, null, 2);
      fs.writeFileSync(`${state}.json`, jsonData, "utf8");

      console.log(`Data for ${state} saved.`);
    } catch (error) {
      console.log('Error: ', error);
    }
  };

  for (const state of states) {
    cluster.queue(state, getHolidays);
  }

  await cluster.idle();
  await cluster.close();

  console.log("Dados salvos em arquivos JSON.");
}

module.exports = { getStates };