const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Currency Converter...');
  await page.goto('http://127.0.0.1:8080/currency-converter/index.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'currency-converter-test.png' });
  console.log('Currency Converter loaded.');

  console.log('Testing Python IDE...');
  await page.goto('http://127.0.0.1:8080/python-IDE/index.html');
  await page.waitForTimeout(2000); // wait for load
  await page.click('#toggle-sidebar');
  await page.waitForTimeout(1000); // wait for animation
  await page.screenshot({ path: 'python-ide-sidebar-test.png' });
  
  await page.fill('#pkg-search-input', 'numpy');
  await page.click('#pkg-search-btn');
  await page.waitForTimeout(3000); // wait for search API and render
  await page.screenshot({ path: 'python-ide-search-test.png' });
  console.log('Python IDE sidebar search complete.');

  await browser.close();
})();
