const cron = require('node-cron');

// Models
const offerModel = require('../model/job_offer');

// Task to execute every day at midnight.
// Update job offer's status if the job offer is expired.
cron.schedule('0 0 * * *', () => {
    
    offerModel.updateAllJobOfferStatuses(function(ignored, error) {
        if(error) console.error(error);
        else console.log("Job offer statuses updated !");
    });
});