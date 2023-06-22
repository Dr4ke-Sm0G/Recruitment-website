const moment = require('moment');

// Models
const jobOfferModel = require('../../model/job_offer');
const applicationModel = require('../../model/application');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');

module.exports = {
    getJobOffer: function (req, res) {

        const user = req.user;
        const offerId = req.params.offerId;

        // Retrieving the corresponding offer.
        jobOfferModel.readJobOffer(offerId, function (offer, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if (!offer) {
                res.status(404).end();
                return;
            }

            // Checking if the user does not already have an application.
            applicationModel.readOfferApplication(offerId, user.email, function(application, error) {

                // if the user has an application, redirecting to it.
                if(application) {
                    res.redirect('/candidate/my-applications/' + offerId);
                    return;
                }

                if(error) {
                    console.error(error);
                }

                res.render('candidate/job-offer', { 'offer': offer, 'user': user, 'util': util, 'moment': moment });
            });
        });
    },

    getJobOffers: function (req, res) {

        const user = req.user;

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['job_title', 'job_place', 'job_status', 'telework', 'creation_date', 'organization_name', 'organization_type'];
        const requestFilters = filter.parseFilterQuery(req.query, allowedFilters);

        // A job offer is available only if it is published.
        let filters = [{ name: 'status', operator: '=', value: 'published' }];
        filters = filters.concat(requestFilters);

        const orders = [{ field: 'creation_date', type: 'DESC' }, { field: 'offer_id', type: 'DESC' }];

        // Count the number of job offers to build the pagination.
        jobOfferModel.countAvailableJobOffers(filters, function (count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if (count === 0) {
                res.render('candidate/job-offers', { 'offers': [], 'pagination': null, 'user': user, 'util': util });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);

            // Get the available job offers for the user.
            jobOfferModel.readAvailableJobOffers(pagination.limit, pagination.offset, filters, orders, function (offers, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs('/candidate/job-offers', pagination, [filterQueryString]);

                res.render('candidate/job-offers', { 'offers': offers, 'pagination': pagination, 'user': user, 'util': util });
            });
        });
    }
}