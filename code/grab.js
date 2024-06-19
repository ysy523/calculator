const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

// Function to search for a specific code or name in the JSON data
function searchByCodeOrName(term, jsonData) {
    const result = jsonData.find(item => item.code === term || item.name.toLowerCase().includes(term.toLowerCase()));
    return result ? result : null;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        // Navigate to the page with the table
        await page.goto('https://dividends.my/dividend-ranking/');

        // Wait for the dropdown button to be visible
        await page.waitForSelector('.length_menu .dropdown-toggle');

        // Click the dropdown button to open the menu
        await page.click('.length_menu .dropdown-toggle');

        // Wait for the dropdown menu to be visible
        await page.waitForSelector('.length_menu .dropdown-menu');

        // Click the "All" option in the dropdown menu
        await page.click('.length_menu .dropdown-menu li:last-child');

        // Wait for the table data to load
        await page.waitForSelector('#table_1 tbody tr');

        // Extract table data
        const tableData = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('#table_1 tbody tr');
            rows.forEach(row => {
                const rowData = {};
                const columns = row.querySelectorAll('td');
                rowData.name = columns[0].textContent.trim();
                rowData.code = columns[1].textContent.trim();
                rowData.price = columns[2].textContent.trim();
                rowData.pe = columns[3].textContent.trim();
                rowData.dy_yield = columns[4].textContent.trim();
                try {
                    // Try to access link and handle null case
                    rowData.link = columns[5].querySelector('a').href;
                } catch (error) {
                    // If link not found, set it to null or handle the error as needed
                    rowData.link = null;
                }
                data.push(rowData);
            });
            return data;
        });

        // Convert table data to JSON string
        const jsonData = JSON.stringify(tableData, null, 2);

        // Write JSON data to a text file
        fs.writeFileSync('tableData.json', jsonData);

        console.log('Data saved to tableData.json');

        // Create readline interface for user input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Prompt user to enter code or name
        rl.question('Enter a code or name to search: ', (term) => {
            // Close the readline interface
            rl.close();

            // Read JSON data from file
            const jsonDataFromFile = JSON.parse(fs.readFileSync('tableData.json', 'utf8'));

            // Search for the code or name in the JSON data
            const searchData = searchByCodeOrName(term, jsonDataFromFile);

            // Print the search result
            if (searchData) {
                console.log('Search Result:');
                console.log(searchData);
            } else {
                console.log('Code or name not found.');
            }

            // Close the browser
            browser.close();
        });
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
})();
