const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:8000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }
    ],
    webServer: {
        command: 'npx http-server ./ -p 8000',
        url: 'http://localhost:8000',
        reuseExistingServer: !process.env.CI,
    },
});
