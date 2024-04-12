const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/search-vin', async (req, res) => {
    const { vin } = req.body;
    if (!vin) {
        return res.status(400).send('VIN is required');
    }

    const result = await searchVinOnExternalSite(vin);
    res.json({ result });
});

async function searchVinOnExternalSite(vin) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(`https://vindocs.com/precheck?vin=${vin}`, { waitUntil: 'networkidle0', timeout: 0  });
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'image')
                req.abort();
            else
                req.continue();
        });

        const data = await page.evaluate(() => {
            const success = document.querySelector(".sc-ksZaOG.kNAbef.MuiTypography-root.MuiTypography-body2")?.innerText;
            const make = document.querySelector(".sc-ksZaOG.hKnJvP.MuiTypography-root.MuiTypography-body1")?.innerText;
            console.log('success'+success);
            return { success, make };
        });

        await browser.close();
        return data;
    } catch (error) {
        console.error('Error searching VIN:', error);
        await browser.close();
        return 'Error occurred while searching VIN';
    }
}

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
