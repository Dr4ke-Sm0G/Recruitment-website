const moment = require('moment');
const { body, validationResult } = require('express-validator');

// Models
const recruiterRequestModel = require('../../model/recruiter_request');
const organizationModel = require('../../model/organization');

// Utils
const util = require('../../utils/util');

// Check if a recruiter request already exists for a user.
const canCreateRecruiterRequest = (user, siren) => {
    return new Promise((resolve, reject) => {

        recruiterRequestModel.canCreateRecruiterRequest(user.email, siren, function(canCreate, error) {
            if(error) reject(error);
            else resolve(canCreate);
        });
    });
};

// Check if an organization exists.
const checkOrganizationExists = (siren) => {
    return new Promise((resolve, reject) => {

        organizationModel.readOrganization(siren, (organization, error) => {
            if(error) reject(error);
            else resolve(organization);
        });
    });
};

// Create an organization.
const createOrganization = (siren, name, type, headquarter) => {
    return new Promise((resolve, reject) => {

        organizationModel.createOrganization(siren, name, type, headquarter, 'inactive', function(created, error) {
            if(error) reject(error);
            else resolve(created);
        });
    });
};

// Create a recruiter request.
const createRecruiterRequest = (user, organization) => {
    return new Promise((resolve, reject) => {

        recruiterRequestModel.createRecruiterRequest(user.email, organization, function(created, error) {
            if(error) reject(error);
            else resolve(created);
        });
    });
};

// Read a recruiter request.
const readRecruiterRequest = (user, organization) => {
    return new Promise((resolve, reject) => {

        recruiterRequestModel.readRecruiterRequest(user.email, organization, function(request, error) {
            if(error) reject(error);
            else resolve(request);
        });
    });
};

// Delete a recruiter request.
const deleteRecruiterRequest = (user, organization) => {
    return new Promise((resolve, reject) => {

        recruiterRequestModel.deleteRecruiterRequest(user.email, organization, function(deleted, error) {
            if(error) reject(error);
            else resolve(deleted);
        });
    });
};

module.exports = {
    getBecomeRecruiter: function(req, res) {

        const user = req.user;

        res.render('candidate/become-recruiter', { 'user': user, 'util': util });
    },

    getMyRecruiterRequests: function(req, res) {

        const user = req.user;

        const filters = [{ 'name': 'user_email', 'operator': '=', 'value': user.email }];
        const orders = [{field: 'date', type: 'DESC'}];

        // Get the recruiter requests of the user.
        recruiterRequestModel.readRecruiterRequests(999, 0, filters, orders, function(result, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            res.render('candidate/my-recruiter-requests', { 'recruiterRequests': result, 'user': user, 'util': util, 'moment': moment });
        });
    },

    postJoinOrganization: async function(req, res) {

        const user = req.user;
        const siren = req.body.siren;

        if(!siren) {
            res.status(400).json({ 'message': 'SIREN non spécifié.' });
            return;
        }

        try {

            // Checking that the user doesn't have a pending recruiter request.
            const canCreateRequest = await canCreateRecruiterRequest(user, siren);

            if(!canCreateRequest) {
                res.status(400).json({ 'message': 'Vous avez déjà une demande en attente ou une demande pour cette organisation a déjà été refusée.' });
                return;
            }

            // Checking that the organization the user wants to join exists.
            const exists = await checkOrganizationExists(siren);

            if(!exists) {
                res.status(404).json({'message': 'Organisation non trouvée.'});
                return;
            }

            // Creating the recruiter request.
            const requestCreated = await createRecruiterRequest(user, siren);

            if(requestCreated) {
                res.redirect('/candidate/my-recruiter-requests');
            } else {
                res.status(500).json({'message': 'Une erreur est survenue.'});
            }

        } catch(error) {
            console.error(error);
            res.status(500).json({'message': 'Une erreur est survenue.'});
        }
    },

    postCreateOrganization: async function(req, res) {

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

        try {

            // Checking that the user doesn't have a pending recruiter request.
            const canCreateRequest = await canCreateRecruiterRequest(user, undefined);

            if(!canCreateRequest) {
                res.status(400).json({ 'message': 'Vous avez déjà une demande en attente ou une demande pour cette organisation a déjà été refusée.' });
                return;
            }

            // Checking that the organization the user wants to join doesn't exist.
            const exists = await checkOrganizationExists(siren);

            if(exists) {
                res.status(404).json({'message': 'Une organisation avec ce SIREN existe déjà.'});
                return;
            }

            // Creating the recruiter organization.
            const organizationCreated = await createOrganization(siren, name, type, headquarter);

            if(!organizationCreated) {
                res.status(500).json({'message': 'Une erreur est survenue.'});
                return;
            }

            // Creating the recruiter request.
            const requestCreated = await createRecruiterRequest(user, siren);

            if(requestCreated) {
                res.redirect('/candidate/my-recruiter-requests');
            } else {
                res.status(500).json({'message': 'Une erreur est survenue.'});
            }

        } catch(error) {
            console.error(error);
            res.status(500).json({'message': 'Une erreur est survenue.'});
        }
    },

    deleteRecruiterRequest: async function(req, res) {

        const user = req.user;
        const organization = req.body.organization;

        if(!organization) {
            res.status(404).json({ 'message': "Organisation non spécifiée." });
            return;
        }

        try {

            const request = await readRecruiterRequest(user, organization);

            if(request.status !== 'pending') {
                res.status(403).json({'message': 'Seule une demande en attente peut être supprimée.'});
                return;
            }

            const deleted = await deleteRecruiterRequest(user, organization);

            if(deleted) {
                res.status(200).json({ 'message': "Demande recruteur supprimée." });
            } else {
                res.status(500).json({'message': 'Une erreur est survenue.'});
            }

        } catch(error) {
            console.error(error);
            res.status(500).json({'message': 'Une erreur est survenue.'});
        }
    },

    validateOrganization: function() {
        return [
            body('siren').trim()
                .notEmpty().withMessage("Champ 'SIREN' manquant.")
                .isInt().withMessage("Champ 'SIREN' invalide.")
                .isLength({ max: 64 }).withMessage("Champ 'SIREN' trop long."),

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
};