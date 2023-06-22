const moment = require('moment');

// Models
const organizationModel = require('../../model/organization');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');

function updateOrganizationStatus(res, siren, status) {

    // Update the organization status.
    organizationModel.updateOrganizationStatus(siren, status, function(changed, error) {

        if(error) {
            console.error(error);
            res.status(500).json({ message: 'Une erreur est survenue.' });
            return;
        }

        if(!changed) {
            res.status(400).json({ message: 'Impossible de modifier le statut.' });
            return;
        }

        res.status(200).json({ message: 'Statut modifié.' });
    });
}

module.exports = {

    getOrganizations: function(req, res) {

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['name', 'type', 'creation_date', 'status'];
        const filters = filter.parseFilterQuery(req.query, allowedFilters);

        // Count the number of organizations to build the pagination.
        organizationModel.countOrganizations(filters, function(count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(count === 0) {
                res.render('admin/organizations', { 'organizations': [], 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);
            const orders = [{ field: 'creation_date', type: 'DESC' }];

            // Get the organizations.
            organizationModel.readOrganizations(pagination.limit, pagination.offset, filters, orders, function(organizations, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end(); 
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs('/admin/organizations', pagination, [filterQueryString]);

                res.render('admin/organizations', { 'organizations': organizations, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment });
            });
        });
    },

    getOrganization: function (req, res) {

        const siren = req.params['siren'];

        // Get a single organization.
        organizationModel.readOrganization(siren, function (organization, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(!organization) {
                res.status(404).end();
                return;
            }

            res.render('admin/organization', { 'organization': organization, 'user': req.user, 'util': util, 'moment': moment });
        });
    },

    patchOrganization: function(req, res) {

        const siren = req.params['siren'];
        const status = req.body['status'];

        if(status && util.isValidOrganizationStatus(status)) {
            updateOrganizationStatus(res, siren, status);
        } else {
            res.status(400).json({ 'message': 'Requête invalide.' });
        }
    },

    updateOrganization: function(req, res) {

        const body = req.body;

        const siren = req.params['siren'];
        const name = body.name;
        const headquarter = body.headquarter;
        const type = body.type;

        // Checking inputs.
        if(!siren || !name || !headquarter || !util.isValidOrganizationType(type)) {
            res.status(404).json({ 'message': 'Requête invalide.' });
            return;
        }

        // Update the organization.
        organizationModel.updateOrganization(siren, name, type, headquarter, function(updated, error) {

            if(error) {
                console.error(error);
                res.status(500).json({ 'message': 'Une erreur est survenue' });
                return;
            }

            if(!updated) {
                res.status(404).json({ 'message': 'Requête invalide.' });
                return;
            }

            res.redirect(`/admin/organizations/${siren}`);
        });
    }
};