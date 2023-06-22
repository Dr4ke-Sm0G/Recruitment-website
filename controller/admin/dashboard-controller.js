const moment = require('moment');

// Models
const userModel = require('../../model/user');
const organizationModel = require('../../model/organization');
const recruiterRequestModel = require('../../model/recruiter_request');
const jobOfferModel = require('../../model/job_offer');

// Utils
const util = require('../../utils/util');

// Get the global numbers.
function getCounts(callback) {

    // Count users.
    const p1 = new Promise((resolve, reject) => {
        userModel.countUsers([], function (result, error) {
            if (error != null) reject(error);
            else resolve(result);
        });
    });

    // Count organizations.
    const p2 = new Promise((resolve, reject) => {
        organizationModel.countOrganizations([], function (result, error) {
            if (error != null) reject(error);
            else resolve(result);
        });
    });

    // Count recruiter requests.
    const p3 = new Promise((resolve, reject) => {
        const filters = [{ name: 'status', operator: '=', 'value': 'pending' }];
        recruiterRequestModel.countRecruiterRequests(filters, function (result, error) {
            if (error != null) reject(error);
            else resolve(result);
        });
    });

    // Count job offers.
    const p4 = new Promise((resolve, reject) => {
        jobOfferModel.countJobOffers([], function (result, error) {
            if (error != null) reject(error);
            else resolve(result);
        });
    });

    Promise.all([p1, p2, p3, p4]).then(values => {

        callback({ 'users': values[0], 'organizations': values[1], 'recruiterRequests': values[2], 'jobOffers': values[3] });

    }).catch(() => { callback({ 'users': -1, 'organizations': -1, 'recruiterRequests': -1, 'jobOffers': -1 }); });
}

module.exports = {

    getDashboard: function(req, res) {

        // Retrieving global counts.
        const p1 = new Promise((resolve, reject) => {
            getCounts(function (counts) { resolve(counts); });
        });
        
        // Displaying the 10 last created users.
        const p2 = new Promise((resolve, reject) => {
            const orders = [{ field: 'account_creation_date', type: 'DESC' }];
            userModel.readUsers(10, 0, [], orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });
        
        // Displaying the 10 last created organizations.
        const p3 = new Promise((resolve, reject) => {
            const orders = [{ field: 'creation_date', type: 'DESC' }];
            organizationModel.readOrganizations(10, 0, [], orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });
        
        // Displaying the ten last recruiter requests.
        const p4 = new Promise((resolve, reject) => {
            const orders = [{ field: 'date', type: 'DESC' }];
            recruiterRequestModel.readRecruiterRequests(10, 0, [], orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });
        
        Promise.all([p1, p2, p3, p4]).then(values => {
            res.render("admin/dashboard", { 'counts': values[0], 'users': values[1], 'organizations': values[2], 'recruiterRequests': values[3], 'user': req.user, 'util': util, 'moment': moment });
        }).catch(error => {
            console.error(error);
            res.status(500).end();
        });
    }
};