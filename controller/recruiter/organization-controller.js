const moment = require('moment');
const { body, validationResult } = require('express-validator');

// Models
const organizationModel = require('../../model/organization');

// Utils
const util = require('../../utils/util');

module.exports = {

    getOrganization: function(req, res) {

        const user = req.user;
        
        // Get the organization.
        organizationModel.readOrganization(user.organization, function(organization, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(!organization) {
                res.status(404).end(); // TODO.
                return;
            }

            res.render('recruiter/my-organization', { 'organization': organization, 'user': user, 'util': util, 'moment': moment });
        });
    },

    updateOrganization: function(req, res) {

        const user = req.user;
        const body = req.body;

        const siren = body.siren;
        const name = body.name;
        const headquarter = body.headquarter;
        const type = body.type;

        const errors = validationResult(req);
        
        // Checking that inputs are valid.
        if (!errors.isEmpty()) {
            return res.status(400).json({ 'message': errors.array()[0].msg });
        }

        if(user.organization !== siren) {
            res.status(403).end();
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

            res.redirect('/recruiter/my-organization');
        });
    },

    validateOrganization: function() {
        return [

            body('name').trim()
                .notEmpty().withMessage("Champ 'Nom' manquant.")
                .isLength({ max: 64 }).withMessage("Champ 'Nom' trop long."),

            body('headquarter').trim()
                .notEmpty().withMessage("Champ 'Siège social' manquant.")
                .isLength({ max: 255 }).withMessage("Champ 'Siège social' trop long."),

            body('type').trim()
                .notEmpty().withMessage("Champ 'Type' manquant.")
                .isIn(util.getOrganizationTypes()).withMessage("Champ 'Type' invalide.")
        ];
    }
}