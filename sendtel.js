const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token from BotFather
const token = '7070539474:AAFLAyrf0StDd6W9LCgkR1z6N6FpvL-zkJE';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Define the inline keyboard menu options
const menuOptions = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Legal Fee Calculator 🧮', callback_data: 'legal_fee_calculator' }],
      [{ text: 'Stamp Duty Calculator 🧮', callback_data: 'stamp_duty_calculator' }],
      [{ text: 'Detail 🔥', callback_data: 'coming_soon' }]
    ]
  }
};


// Function to send the menu
const sendMenu = async (chatId) => {
 await bot.sendMessage(chatId, 'Welcome! choose an option:', menuOptions);
};

const calculateLegalFees = async (purchasePrice) => {
  const firstTierLimit = 500000; // RM500,000
  const secondTierLimit = 7500000; // RM7,500,000

  let legalFees = 0;

  if (purchasePrice <= firstTierLimit) {
     legalFees = purchasePrice * 0.0125; // 1.25% for the first RM500,000
  } else if (purchasePrice <= secondTierLimit) {
    legalFees = firstTierLimit * 0.0125 + (purchasePrice - firstTierLimit) * 0.01;
  } else {
    legalFees = firstTierLimit * 0.0125 + (secondTierLimit - firstTierLimit) * 0.01 + (purchasePrice - secondTierLimit) * 0.01;
  }

  return legalFees;
};

const calculateStampDuty = async(propertyPrice) => {
  const tiers = [
    { limit: 100000, rate: 0.01 }, // 1% for the first RM100,000
    { limit: 400000, rate: 0.02 }, // 2% for the next RM400,000
    { limit: 500000, rate: 0.03 }, // 3% for the next RM500,000
    { limit: Infinity, rate: 0.04 } // 4% for any amount thereafter
  ];

  let stampDuty = 0;
  let remainingValue = propertyPrice;

  for (const tier of tiers) {
    const { limit, rate } = tier;

    if (remainingValue <= 0) break;

    if (remainingValue <= limit) {
      stampDuty += remainingValue * rate;
      break;
    } else {
      stampDuty += limit * rate;
      remainingValue -= limit;
    }
  }

  return stampDuty;
};

const formatCurrency = (amount) => {
  return "RM " + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};



// Example data
const data = [
    {name: 'For the first RM500,000', rate: '1.25%'},
    {name: 'For the next RM7,000,000', rate: '1%'},
    {name: 'Subsequent Purchase Price',rate: 'Negotiable(Subject to maximum 1%)'}
];


// Function to create a text table
const createTextTable =(data)=> {
    let table = 'Formula                 | Rate \n';
    table += '------------------------|-----|\n';
    data.forEach(row => {
        table += `${row.name.padEnd(12)} | ${row.rate.toString().padEnd(3)} \n`;
    });
    return `<pre>${table}</pre>`;
}

// Create the HTML table
const htmlTable = createTextTable(data);


bot.on('polling_error', (error) => {
    console.error(`Polling error: ${error.code} - ${error.response.body.description}`);
    // Handle the specific 403 error
    if (error.code === 'ETELEGRAM' && error.response.statusCode === 403) {
        console.log('Bot was kicked from the supergroup chat. Stopping interaction with the chat.');
        // You can add additional logic here to handle the situation
    }
});


// State management
const userStates = {};

// Handle the '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendMenu(chatId);
  userStates[chatId] = { stage: 'menu' };
});

// Handle the '/help' command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
Welcome to the Fee Calculator Bot! Here are the commands you can use:
/start - Start the bot and show the menu
/help - Show this help message

Menu Options:
- Legal Fee Calculator: Calculate the legal fees based on the property purchase price.
- Stamp Duty Calculator: Calculate the stamp duty based on the property price.
  `;
  bot.sendMessage(chatId, helpMessage);
});

const handleAmountInput = async(chatId, text, calculateFunction, resultMessage) => {
  const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
  if (!isNaN(amount) && amount > 0) {
    const result = await calculateFunction(amount);

    const finalMsg= `You entered: ${formatCurrency(amount)}` +`\n` +`\n` + resultMessage +`\n` +formatCurrency(result)

    await bot.sendMessage(chatId, finalMsg);
    // await bot.sendMessage(chatId, resultMessage + formatCurrency(result));
    userStates[chatId].stage = 'menu'; // Reset to the menu stage
    await sendMenu(chatId);
  } else {
   await bot.sendMessage(chatId, 'Invalid amount. Please enter a valid number:');
  }
};

// Handle callback queries from inline keyboard
bot.on('callback_query', async(query) => {
  const chatId = query.message.chat.id;
  const userState = userStates[chatId] || { stage: 'menu' };

  switch (query.data) {
    case 'legal_fee_calculator':
     await bot.sendMessage(chatId, 'Please enter the purchase price amount:');
      console.log('legal_fee_calculator sent successfully!');
      userState.stage = 'awaiting_legal_fee_amount';
      break;
    case 'stamp_duty_calculator':
     await bot.sendMessage(chatId, 'Please enter the property price amount:');
      console.log('property price amount sent successfully!');
      userState.stage = 'awaiting_stamp_duty_amount';
      break;
    case 'coming_soon':
       await bot.sendMessage(chatId, htmlTable, {parse_mode: 'HTML'})
        .then(() => {
            console.log('Table sent successfully!');
            sendMenu(chatId);
        })
        .catch(error => {
            console.error('Error sending table:', error);
        });

      break;
    default:
     await sendMenu(chatId);
      break;
  }

  userStates[chatId] = userState;
});




// Handle messages for amount input
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log("chat id ---",chatId)
  console.log("text ---",text)

  console.log("details ---",msg)


  if (!userStates[chatId]) {
    userStates[chatId] = { stage: 'menu' };
  }

  const userState = userStates[chatId];

  if (userState.stage === 'awaiting_legal_fee_amount') {
    handleAmountInput(chatId, text, calculateLegalFees, 'The total legal fees payable are: ');
  } else if (userState.stage === 'awaiting_stamp_duty_amount') {
    handleAmountInput(chatId, text, calculateStampDuty, 'The total stamp duty payable is: ');
  } else {
    sendMenu(chatId);
  }
});


// Function to send help guidelines
const sendHelpGuidelines = (chatId ,title) => {
    const guidelines = `
    Welcome to the ` + `*`+ title + `*`+ ` group! Here are some guidelines to help you get started:
    
    1. Be respectful to all members.
    2. No spamming or self-promotion.
    3. Stay on topic.
    4. If you have any questions, feel free to ask.
  
    Enjoy your stay!
    `;
    bot.sendMessage(chatId, guidelines, { parse_mode: 'Markdown' });
  };

// Handle new chat members
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const title = msg.chat.title
    sendHelpGuidelines(chatId, title);
  });


