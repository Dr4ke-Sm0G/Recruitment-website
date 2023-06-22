const moment = require('moment');
const { body, validationResult } = require('express-validator');

// Models
const jobOfferModel = require('../../model/job_offer');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');

module.exports = {

    getJobOffers: function(req, res) {

        const user = req.user;

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['offer_id', 'job_title', 'creation_date', 'status'];
        const requestFilters = filter.parseFilterQuery(req.query, allowedFilters);

        let filters = [{ name: 'organization', operator: '=', value: user.organization }];
        filters = filters.concat(requestFilters);

        const orders = [{ field: 'creation_date', type: 'DESC' }, { field: 'offer_id', type: 'DESC' }];

        // Count the number of job offers to build the pagination.
        jobOfferModel.countJobOffers(filters, function(count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(count === 0) {
                res.render('recruiter/job-offers', { 'offers': [], 'pagination': null, 'user': user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);

            // Get the job offers.
            jobOfferModel.readJobOffers(pagination.limit, pagination.offset, filters, orders, function(offers, error) {

                if (error != null) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs('/recruiter/offers', pagination, [filterQueryString]);

                res.render('recruiter/job-offers', { 'offers': offers, 'pagination': pagination, 'user': user, 'util': util, 'moment': moment });
            });
        });
    },

    getJobOfferCreatePage: function(req, res) {
        res.render('recruiter/job-offer', { 'offer': {}, 'title': "Créer une offre d'emploi", 'method': 'POST', 'action': '/recruiter/offers/create', 'user': req.user, 'util': util, 'moment': moment });
    },

    getJobOfferEditPage: function(req, res) {

        const user = req.user;
        const id = req.params['offerId'];

        // Get the job offer.
        jobOfferModel.readJobOffer(id, function(offer, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            // Checking that the offer exists.
            if(!offer) {
                res.status(404).end();
                return;
            }

            // Checking that the recruter has access to the job offer.
            if(offer.organization !== user.organization) {
                res.status(403).end();
                return;
            }

            res.render('recruiter/job-offer', { 'offer': offer, 'title': "Editer une offre d'emploi", 'method': 'POST', 'action': `/recruiter/offers/${id}/edit`, 'user': user, 'util': util, 'moment': moment });
        });
    },

    createJobOffer: function(req, res) {

        const user = req.user;
        const body = req.body;

        const errors = validationResult(req);
        
        // Checking that inputs are valid.
        if (!errors.isEmpty()) {
            return res.status(400).json({ 'message': errors.array()[0].msg });
        }

        // Creating the job offer.
        jobOfferModel.createJobOffer(
            body.status, 
            body.validity, 
            body.jobInfo, 
            user.email, 
            user.organization, 
            body.jobTitle, 
            body.jobDescription,
            body.jobPlace, 
            body.jobStatus, 
            body.jobType, 
            body.jobSalaryMin, 
            body.jobSalaryMax, 
            body.jobWorkHours, 
            body.jobTelework === 'on', 
            function(jobOfferId, error) {

                if(error) {
                    console.error(error);
                    res.status(500).json({ 'message': 'Une erreur est survenue.' });
                    return;
                }

                if(!jobOfferId) {
                    res.status(404).json({ 'message': 'Requête invalide.' });
                    return;
                }

                res.redirect(`/recruiter/offers/${jobOfferId}/edit`);
        });
    },

    updateJobOffer: function(req, res) {

        const user = req.user;
        const body = req.body;
        const offerId = req.params['offerId'];

        const errors = validationResult(req);
        
        // Checking that inputs are valid.
        if (!errors.isEmpty()) {
            return res.status(400).json({ 'message': errors.array()[0].msg });
        }

        // Get the job offer.
        jobOfferModel.readJobOffer(offerId, function(offer, error) {

            if(error) {
                console.error(error);
                res.status(500).json({ 'message': 'Une erreur est survenue.' });
                return;
            }

            // Checking that the offer exists.
            if(!offer) {
                res.status(404).json({ 'message': 'Ressource non trouvée.' });
                return;
            }

            // Checking that the user has access to the job offer.
            if(offer.organization !== user.organization) {
                res.status(403).json({ 'message': 'Accès non accordé.' });
                return;
            }

            // Update the job offer.
            jobOfferModel.updateJobOffer(
                offer.offer_id,
                body.status, 
                body.validity, 
                body.jobInfo,
                offer.job_description_id, 
                body.jobTitle, 
                body.jobDescription,
                body.jobPlace, 
                body.jobStatus, 
                body.jobType, 
                body.jobSalaryMin, 
                body.jobSalaryMax, 
                body.jobWorkHours, 
                body.jobTelework === 'on',
                function(jobOfferId, error) {
    
                    if(error) {
                        console.error(error);
                        res.status(500).json({ 'message': 'Une erreur est survenue.' });
                        return;
                    }
    
                    if(!jobOfferId) {
                        res.status(404).json({ 'message': 'Requête invalide.' });
                        return;
                    }
    
                    res.redirect(`/recruiter/offers/${offerId}/edit`);
            });
        });
    },

    validateJobOffer: function() {

        return [
            body('jobTitle').trim()
                .notEmpty().withMessage("Champ 'Titre' manquant.")
                .isLength({ max: 32 }).withMessage("Champ 'Titre' trop long."),

            body('jobDescription').trim()
                .notEmpty().withMessage("Champ 'Description' manquant."),

            body('jobInfo').trim()
                .notEmpty().withMessage("Champ 'Informations complémentaires' manquant.")
                .isLength({ max: 255 }).withMessage("Champ 'Informations complémentaires' trop long."),

            body('jobPlace').trim()
                .notEmpty().withMessage("Champ 'Lieu' manquant.")
                .isLength({ max: 32 }).withMessage("Champ 'Lieu' trop long."),

            body('jobType').trim()
                .notEmpty().withMessage("Champ 'Type de métier' manquant.")
                .isLength({ max: 32 }).withMessage("Champ 'Type de métier' trop long."),
            
            body('jobStatus').trim()
                .notEmpty().withMessage("Champ 'Statut de poste' manquant.")
                .isLength({ max: 32 }).withMessage("Champ 'Statut de poste' trop long."),
            
            body('jobWorkHours').trim()
                .notEmpty().withMessage("Champ 'Heures / Semaine' manquant.")
                .isInt({ min: 0, max: 50 }).withMessage("Champ 'Heures / Semaine' doit être compris entre 0 et 50."),
            
            body('jobSalaryMin').trim()
                .notEmpty().withMessage("Champ 'Salaire Min' manquant.")
                .isInt({ min: 0, max: 500000 }).withMessage("Champ 'Salaire Min' doit être compris entre 0 et 500000."),
            
            body('jobSalaryMax').trim()
                .notEmpty().withMessage("Champ 'Salaire Max' manquant.")
                .isInt({ min: 0, max: 500000 }).withMessage("Champ 'Salaire Max' doit être compris entre 0 et 500000."),
            
            body('status').trim()
                .notEmpty().withMessage("Champ 'Statut' manquant.")
                .isIn(['editing', 'published', 'expired']).withMessage("Champ 'Statut' invalide."),
            
            body('validity').trim()
                .notEmpty().withMessage("Champ 'Date de validité' manquant.")
                .isISO8601().withMessage("Champ 'Date de validité' invalide.")
                .custom(util.isDateInFuture).withMessage("Champ 'Date de validité' doit être dans le futur.")
        ];
    }
};