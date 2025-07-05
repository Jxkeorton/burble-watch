import { monitorBurble } from './utils/monitor.js';

const isWithinOperatingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 20; // 8am to 8pm
};

const waitUntilOperatingHours = () => {
    return new Promise((resolve) => {
        const checkTime = () => {
            if (isWithinOperatingHours()) {
                resolve();
            } else {
                const now = new Date();
                const hour = now.getHours();
                
                // Calculate minutes until 8am next day or today
                let minutesUntil8am;
                if (hour < 8) {
                    // Before 8am today
                    minutesUntil8am = (8 - hour) * 60 - now.getMinutes();
                } else {
                    // After 8pm today, wait until 8am tomorrow
                    minutesUntil8am = (24 - hour + 8) * 60 - now.getMinutes();
                }
                
                console.log(`Outside operating hours. Waiting ${minutesUntil8am} minutes until 8am...`);
                setTimeout(checkTime, Math.min(minutesUntil8am * 60 * 1000, 60000)); // Check every minute max
            }
        };
        checkTime();
    });
};

const main = async () => {
    while (true) {
        try {
            await waitUntilOperatingHours();
            
            console.log('Starting Burble monitoring (8am-8pm)...');
            
            const stateEmitter = await monitorBurble();

            // Listen for processed jump updates
            stateEmitter.on('loadProcessed', (loadId) => {
                console.log(`Load processed: ${loadId}`);
            });

            stateEmitter.on('cameraJumpAdded', () => {
                console.log(`A camera jump was added.`);
            });

            // Monitor time and stop at 8pm
            const timeChecker = setInterval(() => {
                if (!isWithinOperatingHours()) {
                    console.log('Reached 8pm, stopping monitoring...');
                    clearInterval(timeChecker);
                    process.emit('SIGTERM');
                }
            }, 60000); // Check every minute

        } catch (error) {
            console.error('Error in monitoring cycle:', error);
            
            // Wait 5 minutes before retrying
            console.log('Waiting 5 minutes before restart...');
            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }
    }
};

main();