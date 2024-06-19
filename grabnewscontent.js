const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

app.use(express.json());

const bot = new TelegramBot('7070539474:AAFLAyrf0StDd6W9LCgkR1z6N6FpvL-zkJE', { polling: false });

// Configuration (move to a separate config file ideally)
const telegramChatId = '590984628';

// Scraping Function (modularized for better readability)
async function scrapeAndSend(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let filename; // Declare filename outside of try/catch for broader scope
  
  try {
      await page.goto(url, { waitUntil: 'networkidle2' }); // Wait for network to settle
      await page.waitForSelector('.fusion-sharing-box');
      
      const data = await page.evaluate(() => {
          const sharingBox = document.querySelector('.fusion-sharing-box');
          return {
              title: sharingBox.getAttribute('data-title'),
              description: sharingBox.getAttribute('data-description'),
              link: sharingBox.getAttribute('data-link'),
          };
      });

      const titleWords = data.title.split(' ').slice(0, 3).join(' ');
      filename = `${titleWords}.txt`; // Assign filename within the try block
      fs.writeFileSync(filename, `Title: ${data.title}\nDescription: ${data.description}\nLink: ${data.link}`);
      
      // Send the text message
      const textMessage = `Check out this interesting article:\n\n${data.title}\n\n${data.description}`; 
      await bot.sendMessage(telegramChatId, textMessage);
      await bot.sendDocument(telegramChatId, filename);
      return { success: true, message: 'Data scraped and sent', filename };
  } catch (error) {
      console.error('Error:', error.message); // Log specific error message
      throw error; // Re-throw error to be handled by API endpoint
  } finally {
      await browser.close();
      if (filename && fs.existsSync(filename)) fs.unlinkSync(filename); // Clean up file if it exists
  }
}
// API Endpoint
app.post('/scrape', async (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    try {
        const result = await scrapeAndSend(url);
        res.json(result); 
    } catch (error) {
        res.status(500).json({ error: 'Scraping failed', details: error.message }); // Send error details
    }
});

app.listen(3001, () => console.log('API running on port 3001'));
