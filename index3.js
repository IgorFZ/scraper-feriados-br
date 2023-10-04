const puppeteer = require('puppeteer-extra')
const stealthPlugin = require('puppeteer-extra-plugin-stealth')
const adblockerPlugin = require('puppeteer-extra-plugin-adblocker')

puppeteer.use(stealthPlugin())
puppeteer.use(adblockerPlugin({ blockTrackers: true }))

const delay = require('util').promisify(setTimeout)
const fs = require('fs');
const { extractHolidays } = require('./utils/getInfo');

let browser;

(async () => {
  browser = await puppeteer.launch({
    headless: false,
  })
  
  const [page] = await browser.pages()
  await page.setViewport({ width: 1920, height: 1080 })

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const filters = [
      'image',
      'stylesheet',
    ];

    if (filters.includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto('https://www.feriados.com.br/feriados-acrelandia-ac.php?ano=2023')
  await delay(2000)

  const states = ['SC', 'SP', 'SE', 'TO']
  const data = {}

  for (const state of states) {
    await page.select('#estado', state);
    await delay(2000);

    const cities = await page.evaluate(() => {
      const selectCity = document.getElementById('cidade');
      const cityOptions = Array.from(selectCity.options).map(option => option.value);
      cityOptions.shift();
      return cityOptions;
    });

    const citiesData = {}

    for (const city of cities) {
      await page.select('#cidade', city);
      await delay(4000);

      const holidays = await extractHolidays(page);
      citiesData[city] = holidays;
    }
    data[state] = citiesData;

    const jsonData = JSON.stringify(citiesData, null, 2);
    fs.writeFileSync(`${state}.json`, jsonData, 'utf8');

    console.log(state);
  }
  
  await browser.close();

  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync('feriados.json', jsonData, 'utf8');

  console.log('Dados salvos em feriados.json');
  process.exit();
})();
