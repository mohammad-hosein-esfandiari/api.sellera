const cron = require('node-cron');
const { Website } = require('../models/Website'); // Assuming you're importing the Website model

const batchSize = 1000; // Number of websites processed in each batch

// Function to process a batch of websites
async function processBatch(expiredWebsites) {
    const updatePromises = expiredWebsites.map(async (website) => {
        website.subscription.isActive = false;
        return await website.save();
    });
    await Promise.all(updatePromises); // Update simultaneously
}

// Schedule a cron job to check for expired subscriptions
function startSubscriptionJob() {
    cron.schedule('0 3 * * *', async () => { // Runs every day at 3 AM
        try {
            console.log('Checking for expired subscriptions...');
            let offset = 0;

            while (true) {
                // Retrieve expired websites in batches
                const expiredWebsites = await Website.find({
                    "subscription.isActive": true,
                    "subscription.nextPaymentDate": { $lte: new Date() }
                }).skip(offset).limit(batchSize); // Use skip and limit for batching

                if (expiredWebsites.length === 0) {
                    console.log('No more expired subscriptions found.');
                    break; // Exit the loop if there are no more websites
                }

                console.log(`Processing ${expiredWebsites.length} expired websites from offset ${offset}...`);
                
                // Process the batch of websites
                await processBatch(expiredWebsites);
                
                offset += batchSize; // Update offset for the next batch
            }
    
        } catch (error) {
            console.error("Error during cron job execution:", error);
        }
    });
}

// Export the function
module.exports = startSubscriptionJob;
