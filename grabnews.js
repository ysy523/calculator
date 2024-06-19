const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to the webpage
  await page.goto('https://theedgemalaysia.com/categories/news');

  // Extract data using Puppeteer selectors
  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.NewsList_newsListItemWrap__XovMP'));

    // Define an array to store the extracted data
    const extractedData = [];

    // Loop through each item and extract relevant information
    items.forEach(item => {
      const timestamp = item.querySelector('.NewsList_infoNewsListSubMobile__SPmAG').innerText;
      const headline = item.querySelector('.NewsList_newsListItemHead__dg7eK').innerText;
      const description = item.querySelector('.NewsList_newsList__2fXyv').innerText;
      const author = item.querySelector('.NewsList_author__5Q2CR').innerText;
      
      // Push the extracted data into the array
      extractedData.push({ timestamp, headline, description, author });
    });

    // Return the extracted data
    return extractedData;
  });

  console.log(data);

  await browser.close();
})();
