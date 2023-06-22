const moment = require('moment');

// Models
const applicationModel = require('../../model/application');
const offerModel = require('../../model/job_offer');
const attachementModel = require('../../model/attachement');
const job_offer = require('../../model/job_offer');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');
const uploadConfig = require('../../config/upload');

module.exports = {

    getAllApplications: function(req, res) {

        const user = req.user;

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['job_offer', 'last_name', 'date', 'status'];
        const requestFilters = filter.parseFilterQuery(req.query, allowedFilters);

        let filters = [{ name: 'organization', operator: '=', value: user.organization }];
        filters = filters.concat(requestFilters);

        // Count the number of applications to build the pagination.
        applicationModel.countApplications(filters, function(count, error) {

            if (error != null) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(count === 0) {
                res.render('recruiter/applications', { 'applications': [], 'offer': null, 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);
            const orders = [{field: 'date', type: 'DESC'}];

            // Get the applications of the candidate.
            applicationModel.readCandidateApplications(pagination.limit, pagination.offset, filters, orders, function(applications, error) {

                if (error != null) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs(`/recruiter/applications`, pagination, [filterQueryString]);


                res.render('recruiter/applications', { 'applications': applications, 'offer': null, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment });
            });
        });
    },

    getOfferApplications: function(req, res) {

        const user = req.user;
        const offerId = req.params['offer'];

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['last_name', 'date', 'status'];
        const requestFilters = filter.parseFilterQuery(req.query, allowedFilters);

        let filters = [
            {name: 'organization', operator: '=', value: user.organization},
            {name: 'job_offer', operator: '=', value: offerId}
        ];

        filters = filters.concat(requestFilters);

        const orders = [{field: 'date', type: 'DESC'}];

        // Count the number of applications to build the pagination.
        applicationModel.countApplications(filters, function(count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(count === 0) {
                res.render('recruiter/applications', { 'applications': [], 'offer': job_offer, 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);

            // Get the applications of the job offer.
            applicationModel.readCandidateApplications(pagination.limit, pagination.offset, filters, orders, function(applications, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs(`/recruiter/offers/${offerId}/applications`, pagination, [filterQueryString]);

                res.render('recruiter/applications', { 'applications': applications, 'offer': job_offer, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment });
            });
        });
    },

    getOfferApplication: function(req, res) {

        const user = req.user;

        const offerId = req.params['offer'];
        const candidate = req.params['candidate'];

        // Get the application.
        const p1 = new Promise((resolve, reject) => {

            applicationModel.readOfferApplication(offerId, candidate, function (application, error) {
                if(error) { reject(error); }
                else { resolve(application); }
            });
        });

        // Get the application attachements.
        const p2 = new Promise((resolve, reject) => {

            attachementModel.readApplicationAttachements(offerId, candidate, function (attachements, error) {
                if(error) { reject(error); }
                else { resolve(attachements); }
            });
        });

        Promise.all([p1, p2]).then(values => {

            const application = values[0];
            const attachements = values[1];

            if(!application) {
                res.status(404).end();
                return;
            }
            
            // Checking that the recruiter has access to the application.
            if(application.organization !== user.organization) {
                res.status(403).end();
                return;
            }

            res.render('recruiter/application', { 'application': application, 'attachements': attachements, 'user': user, 'util': util, 'moment': moment });
        })
    },

    getOfferApplicationAttachement: function(req, res) {

        const user = req.user;
        const offerId = req.params.offer;
        const attachementId = req.params.attachementId;

        // Reading the corresponding job offer to check if it belongs to the organization of the recruiter.
        offerModel.readJobOffer(offerId, function(offer, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            // Check that the offer exists.
            if(!offer) {
                res.status(404).end();
                return;
            }

            // Check that the organization of the offer is the same than the user.
            if(offer.organization !== user.organization) {
                res.status(403);
                return;
            }

            // Reading the corresponding attachement.
            attachementModel.readAttachement(attachementId, function(attachement, error) {

                if(error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                const path = uploadConfig.location + attachementId;

                res.download(path, attachement.name);
            });
        });
    },

    patchApplication: function(req, res) {

        const user = req.user;

        const offerId = req.params['offer'];
        const candidate = req.params['candidate'];

        const status = req.body.status;

        // Checking inputs.
        if(!status || !util.isValidApplicationStatus(status)) {
            res.status(400).json({ 'message': 'Requête invalide.' });
            return;
        }

        // Get the application.
        applicationModel.readOfferApplication(offerId, candidate, function (application, error) {

            if(error) {
                console.error(error);
                res.status(500).json({ 'message': "Une erreur est survenue." });
                return;
            }

            // Checking that the application exists.
            if(!application) {
                res.status(404).end();
                return;
            }
            
            // Checking that the recruiter has access to the organization.
            if(application.organization !== user.organization) {
                res.status(403).end();
                return;
            }

            // Update the application status.
            applicationModel.updateApplicationStatus(offerId, candidate, status, function(updated, error) {

                if(error) {
                    console.error(error);
                    res.status(500).json({ 'message': "Une erreur est survenue." });
                    return;
                }

                if(!updated) {
                    res.status(400).json({ 'message': "Requête invalide." });
                    return;
                }

                res.status(201).json({ 'message': 'Statut mis à jour.' });
            });
        });
    }
}