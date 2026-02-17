const puppeteer = require('puppeteer');
const path = require('path');

const TOTAL_SLIDES = 17;
const PASSWORD = 'parkbunny2026';
const OUTPUT = path.join(__dirname, '..', 'public', 'ParkBunny-Investor-Deck.pdf');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate and login
    console.log('Opening investor deck...');
    await page.goto('http://localhost:3000/investordeck', { waitUntil: 'networkidle2' });

    // Type password and submit
    await page.type('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('section', { timeout: 10000 });
    console.log('Logged in. Waiting for slides to render...');
    await new Promise(r => setTimeout(r, 3000));

    // Hide fixed UI elements (nav dots, slide counter, download button)
    await page.evaluate(() => {
        document.querySelectorAll('.fixed').forEach(el => el.style.display = 'none');
    });

    // Capture each slide as a screenshot
    const screenshots = [];
    for (let i = 0; i < TOTAL_SLIDES; i++) {
        console.log(`Capturing slide ${i + 1}/${TOTAL_SLIDES}...`);

        // Scroll to slide
        await page.evaluate((idx) => {
            const sections = document.querySelectorAll('section');
            if (sections[idx]) sections[idx].scrollIntoView({ behavior: 'instant' });
        }, i);

        await new Promise(r => setTimeout(r, 800));

        // Get the slide element's bounding box
        const clip = await page.evaluate((idx) => {
            const sections = document.querySelectorAll('section');
            const rect = sections[idx].getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }, i);

        const screenshot = await page.screenshot({
            clip: { x: 0, y: clip.y, width: 1920, height: 1080 },
            type: 'jpeg',
            quality: 95,
        });
        screenshots.push(screenshot);
    }

    // Build PDF from screenshots using jspdf
    console.log('Building PDF...');
    const { jsPDF } = require('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

    for (let i = 0; i < screenshots.length; i++) {
        const imgData = `data:image/jpeg;base64,${screenshots[i].toString('base64')}`;
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
    }

    pdf.save(OUTPUT);
    console.log(`PDF saved to: ${OUTPUT}`);

    await browser.close();
})();
