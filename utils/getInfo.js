async function extractHolidays(page) {
  try {
    await page.waitForSelector('.multi-column', { timeout: 10000 }).catch(e => { console.log(e) });
    const ulElement = await page.$('.multi-column')

    const holidaysHtml = await ulElement.evaluate(el => {
      const liElements = el.querySelectorAll('li');
      const arrayHtml = []
      liElements.forEach(li => {
        arrayHtml.push(li.innerHTML)
      })

      return arrayHtml;
    });

    return stringToJSON(holidaysHtml);
  } catch (error) {
    console.log('Error: ', error);
  }
}

function stringToJSON(arrayStrings) {
  const holidays = {};

  for (const str of arrayStrings) {
    const hasLink = str.includes('<a href="');
    const match = str.match(/(\d{2}\/\d{2}\/\d{4}) - (.+)/);
    if (match) {
      let date = match[1];
      let description = match[2];

      if (hasLink) {
        const typeMatch = str.match(/<b>(.*?)<\/b>/);
        let type = typeMatch ? typeMatch[1] : 'Desconhecido';

        const nameMatch = str.match(/<a[^>]+>(.*?)<\/a>/);
        const name = nameMatch ? nameMatch[1] : 'Desconhecido';

        holidays[date] = {
          type,
          name,
        };
      } else {
        description = description.replace('</span></div>', '');
        if (description == 'Dia do Município') {
          type = 'Feriado Municipal'
        } else {
          type = 'Desconhecido'
        }
        holidays[date] = {
          type: type,
          name: description,
        };
      }
    }
  }

  return holidays;
}

module.exports = {
  extractHolidays,
}