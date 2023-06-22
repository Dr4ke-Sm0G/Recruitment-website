const moment = require('moment');

// Models
const userModel = require('../../model/user');
const recruiterRequestModel = require('../../model/recruiter_request');

// Utils
const util = require('../../utils/util');
const filter = require('../../utils/filter');
const mailer = require('../../config/mailer');

function updateUserStatus(req, res, email, status) {

    const user = req.user;

    if(user.email === email) {
        res.status(403).json({ message: 'Vous ne pouvez pas modifier le statut de votre propre compte.' });
        return;
    }

    // Update the user account status.
    userModel.updateUserStatus(email, status, function(changed, error) {

        if(error) {
            console.error(error);
            res.status(500).json({ message: 'Une erreur est survenue.' });
            return;
        }

        if(!changed) {
            res.status(400).json({ message: 'Requête invalide.' });
            return;
        }

        res.status(200).json({ message: 'Statut modifié.' });
    });
}

function updateUserType(req, res, user, type, organization) {

    if(user.email === req.user.email) {
        res.status(403).json({ message: 'Vous ne pouvez pas modifier votre propre rôle.' });
        return;
    }

    // Update the user role.
    userModel.updateUserType(user.email, type, organization, function(changed, error) {

        if(error) {
            console.error(error);
            res.status(500).json({ message: 'Une erreur est survenue.' });
            return;
        }

        if(!changed) {
            res.status(400).json({ message: 'Requête invalide.' });
            return;
        }

        // Sending an email.
        const subject = "Plateforme AI16 - Modification de vos droits";
        const content = `Votre compte a été modifié en compte ${util.getRoleName(type)}.`;

        mailer.sendEmail(user.email, subject, content);

        // Sending result.
        res.status(200).json({ message: 'Role modifié.', type: type });

        // If the user was a recruiter, we need to perform some actions to ensure data consistency.
        if(user.type !== 'recruiter') return;

        // Deleting the last recruiter request of the candidate to enable him to create new ones.
        // If there is no recruiter request (because it has been deleted before), this will have no impact.
        // The last recruiter request is the one to his organization.
        recruiterRequestModel.deleteRecruiterRequest(user.email, user.organization, function(ignored, error) {
            if(error) console.error(error);
        });
    });
}

module.exports = {

    getUserProfile: function (req, res) {

        const email = req.params['email'];

        // Get the user.
        userModel.readUserByEmail(email, function (user, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if(!user) {
                res.status(404).end();
                return;
            }

            res.render('admin/user-account', { 'userAccount': user, 'user': req.user, 'util': util, 'moment': moment });
        });
    },

    patchUserProfile: function(req, res) {

        const email = req.params['email'];

        const status = req.body['status'];
        const type = req.body['type'];

        // Retrieving target user data.
        userModel.readUserByEmail(email, function(user, error) {

            if(error) {
                console.error(error);
                return res.status(500).end();
            }

            // Checking that the user exists.
            if(!user) {
                return res.status(404).json({ 'message': 'Utilisateur non trouvé.' });
            }

            // Updating the user's data.
            if(status && util.isValidAccountStatus(status)) {
                updateUserStatus(req, res, email, status);
            } else if(type && util.isValidAccountType(type)) {
                updateUserType(req, res, user, type, undefined);
            } else {
                res.status(400).json({ 'message': 'Requête invalide.' });
            }
        });
    },

    getUsers: function(req, res) {

        let page = req.query.page;
        let limit = req.query.limit;

        const allowedFilters = ['last_name', 'account_creation_date', 'type', 'account_status'];
        const filters = filter.parseFilterQuery(req.query, allowedFilters);

        // Count the number of users to build the pagination.
        userModel.countUsers(filters, function(count, error) {

            if (error) {
                res.status(500).end(); // TODO.
                return;
            }

            if(count === 0) {
                res.render('admin/users', { 'users': [], 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            let pagination = util.buildPagination(page, limit, count);
            const orders = [{ field: 'account_creation_date', type: 'DESC' }];

            // Get the users.
            userModel.readUsers(pagination.limit, pagination.offset, filters, orders, function(users, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                const filterQueryString = filter.createFilterQuery(filters, allowedFilters);
                pagination = util.buildPaginationURLs('/admin/users', pagination, [filterQueryString]);

                res.render('admin/users', { 'users': users, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment });
            });
        });
    }
};