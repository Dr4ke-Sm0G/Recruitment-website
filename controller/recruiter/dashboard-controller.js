const moment = require('moment');

const userModel = require('../../model/user');
const applicationModel = require('../../model/application');
const recruiterRequestModel = require('../../model/recruiter_request');
const jobOfferModel = require('../../model/job_offer');
const util = require('../../utils/util');

function getCounts(organization, callback) {

    // Number of active offers.
    const p1 = new Promise((resolve, reject) => {
        
        const filters = [
            {name: 'organization', operator: '=', value: organization},
            {name: 'status', operator: '=', value: 'published'}
        ];
        
        jobOfferModel.countJobOffers(filters, function(result, error) {
            if(error) reject(error);
            else resolve(result);
        });
    });

    // Number of expired offers.
    const p2 = new Promise((resolve, reject) => {
        
        const filters = [
            {name: 'organization', operator: '=', value: organization},
            {name: 'status', operator: '=', value: 'expired'}
        ];
        
        jobOfferModel.countJobOffers(filters, function(result, error) {
            if(error) reject(error);
            else resolve(result);
        });
    });

    // Number of pending applications.
    const p3 = new Promise((resolve, reject) => {
        
        const filters = [
            {name: 'organization', operator: '=', value: organization},
            {name: 'status', operator: '=', value: 'pending'}
        ];
        
        applicationModel.countApplications(filters, function(result, error) {
            if(error) reject(error);
            else resolve(result);
        });
    });

    // Number of recruiters inside the organization.
    const p4 = new Promise((resolve, reject) => {
        
        const filters = [
            {name: 'organization', operator: '=', value: organization},
            {name: 'account_status', operator: '=', value: 'active'}
        ];
        
        userModel.countUsers(filters, function(result, error) {
            if(error) reject(error);
            else resolve(result);
        });
    });

    // Number of pending recruiter requests.
    const p5 = new Promise((resolve, reject) => {
        
        const filters = [
            {name: 'organization', operator: '=', value: organization},
            {name: 'status', operator: '=', value: 'pending'}
        ];
        
        recruiterRequestModel.countRecruiterRequests(filters, function(result, error) {
            if(error) reject(error);
            else resolve(result);
        });
    });

    Promise.all([p1, p2, p3, p4, p5]).then(values => {
        callback({ 'activeOffers': values[0], 'expiredOffers': values[1], 'pendingApplications': values[2], 'recruiters': values[3], 'pendingRecruiterRequests': values[4] });
    }).catch(() => { 
        callback({ 'activeOffers': 'erreur', 'expiredOffers': 'erreur', 'pendingApplications': 'erreur', 'recruiters': 'erreur', 'pendingRecruiterRequests': 'erreur' });
    });
}

module.exports = {

    getDashboard: function(req, res) {

        const user = req.user;

        // Retrieving counts for info cards.
        const p1 = new Promise((resolve, reject) => {
            getCounts(user.organization, function (counts) { resolve(counts); });
        });
        
        // Retrieving last job offers.
        const p2 = new Promise((resolve, reject) => {

            const filters = [{name: 'organization', operator: '=', value: user.organization}];
            const orders = [{ field: 'creation_date', type: 'DESC' }, { field: 'offer_id', type: 'DESC' }];

            jobOfferModel.readJobOffers(10, 0, filters, orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });

        // Retrieving last applications.
        const p3 = new Promise((resolve, reject) => {

            const filters = [{name: 'organization', operator: '=', value: user.organization}];
            const orders = [{field: 'date', type: 'DESC'}];

            applicationModel.readCandidateApplications(10, 0, filters, orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });

        // Retrieving last recruiter requests.
        const p4 = new Promise((resolve, reject) => {

            const filters = [{name: 'organization_siren', operator: '=', value: user.organization}];
            const orders = [{field: 'date', type: 'DESC'}];

            recruiterRequestModel.readRecruiterRequests(10, 0, filters, orders, function (result, error) {
                if (error != null) reject(error);
                else resolve(result);
            });
        });
        
        Promise.all([p1, p2, p3, p4]).then(values => {
            res.render("recruiter/dashboard", { 'counts': values[0], 'offers': values[1], 'applications': values[2], 'recruiterRequests': values[3], 'user': req.user, 'util': util, 'moment': moment });
        }).catch(error => {
            console.error(error);
            res.status(500).end();
        });
    }
};