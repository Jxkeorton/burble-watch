import { monitorAjaxTraffic } from './utils/monitor.js'; // Note the .js extension

const main = async () => {
    try {
        const stateEmitter = await monitorAjaxTraffic();

        // Listen for processed jump updates
        stateEmitter.on('loadProcessed', (loadId) => {
            console.log(`Load processed: ${loadId}`);
        });

        stateEmitter.on('cameraJumpAdded', () => {
            console.log(`A camera jump was added.`);
        });
    } catch (error) {
        console.error('Error starting monitoring:', error);
    }
};

main();