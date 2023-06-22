const moment = require('moment');

// Models
const recruiterRequestModel = require('../../model/recruiter_request');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');
const mailer = require('../../config/mailer');

module.exports = {

    getRecruiterRequests: function(req, res) {

        const user = req.user;

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['user_last_name', 'date', 'status'];
        const requestFilters = filter.parseFilterQuery(req.query, allowedFilters);

        let filters = [{name: 'organization_siren', operator: '=', value: user.organization}]; 
        filters = filters.concat(requestFilters);

        // Count the number of organizations to build the pagination.
        recruiterRequestModel.countRecruiterRequests(filters, function(count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(count === 0) {
                res.render('recruiter/recruiter-requests', { 'recruiterRequests': [], 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);
            const orders = [{field: 'date', type: 'DESC'}];

            // Get the recruiter requests.
            recruiterRequestModel.readRecruiterRequests(pagination.limit, pagination.offset, filters, orders, function(organizations, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs('/recruiter/recruiter-requests', pagination, [filterQueryString]);

                res.render('recruiter/recruiter-requests', { 'recruiterRequests': organizations, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment });
            });
        });
    },

    deleteRecruiterRequest: function(req, res) {

        const user = req.user;

        const candidate = req.body['candidate'];
        const organization = req.body['organization'];

        // Checking inputs.
        if(!candidate || !organization) {
            res.status(400).json({'message': 'Requête invalide.'});
            return;
        }

        // Checking that the user has access to the organization.
        if(organization !== user.organization) {
            res.status(404).json({'message': 'Vous ne pouvez pas accéder à cette organisation.'});
            return; 
        }

        // Delete the recruiter request.
        recruiterRequestModel.deleteRecruiterRequest(candidate, organization, function(deleted, error) {

            if(error) {
                console.error(error);
                res.status(500).json({ message: 'Une erreur est survenue.' });
                return;
            }

            if(!deleted) {
                res.status(400).json({'message': 'Impossible de supprimer la demande recruteur.'});
                return;
            }

            res.status(200).json({'message': 'Demande recruteur supprimée'});
        });
    }, 

    patchRecruiterRequest: function(req, res) {

        const user = req.user;

        const candidate = req.body['candidate'];
        const organization = req.body['organization'];
        const status = req.body['status'];

        // Checking values.
        if(!candidate || !organization || !status) {
            res.status(400).json({'message': 'Requête invalide.'});
            return;
        }

        // Only requests in the user organization can be accepted.
        if(organization !== user.organization) {
            res.status(404).json({'message': 'Vous ne pouvez pas accéder à cette organisation.'});
            return; 
        }

        let promise;

        if(status === 'accepted') {

            // Validate the recruiter request.
            promise = new Promise((resolve, reject) => {
                recruiterRequestModel.validateRecruiterRequest(candidate, organization, false, function(changed, error) {
                    if(error) reject(error);
                    else resolve(changed);
                });
            });

        } else if (status === 'refused') {

            // Refuse the recruiter request.
            promise = new Promise((resolve, reject) => {
                recruiterRequestModel.updateRecruiterRequestStatus(candidate, organization, 'refused', function(changed, error) {
                    if(error) reject(error);
                    else resolve(changed);
                });
            });
        }

        promise.then(updated => {

            if(!updated) {
                res.status(400).json({ message: 'Impossible de modifier le statut de la demande recruteur.' });
                return;
            }

            const subject = "Plateforme AI16 - Demande recruteur";
            const content = `Votre demande recruteur a été ${status === 'accepted' ? 'validée' : 'refusée'}.`;

            mailer.sendEmail(candidate, subject, content);

            res.status(200).json({ message: 'Statut modifié.', status: status });

        }).catch(error => {
            console.error(error);
            res.status(500).json({ message: 'Une erreur est survenue.' });
        });
    }
};