
import { scrapeAndUpdate } from './utils/monitor.js';

const runInterval = 60 * 1000; // 1 minute

// Fetches manifest data and updates relevant sheets
const runScrapeAndUpdate = async () => {
    try {
        await scrapeAndUpdate();
    } catch (error) {
        console.error('Error while monitoring: ', error);
    }
};

// Run immediately, then every minute
runScrapeAndUpdate();
setInterval(runScrapeAndUpdate, runInterval);