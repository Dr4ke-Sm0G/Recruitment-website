const moment = require('moment');
const fs = require('fs');

// Models
const applicationModel = require('../../model/application');
const jobOfferModel = require('../../model/job_offer');
const attachementModel = require('../../model/attachement');

// Utils
const util = require('../../utils/util');
const uploadConfig = require('../../config/upload');

// Check if a job offer exists.
const checkOfferExists = offerId => {
    return new Promise((resolve, reject) => {
        jobOfferModel.readJobOffer(offerId, function(offer, error) {
            if(error) reject(error);
            else resolve(offer);
        });
    });
};

// Check if an application exists.
const checkHasApplication = (user, offerId) => {
    return new Promise((resolve, reject) => {
        applicationModel.readOfferApplication(offerId, user.email, function(offer, error) {
            if(error) reject(error);
            else resolve(offer);
        });
    });
};

// Get the number of attachements associated with an application.
const countApplicationAttachements = (user, offerId) => {
    return new Promise((resolve, reject) => {
        attachementModel.countApplicationAttachements(offerId, user.email, function(count, error) {
            if(error) reject(error);
            else resolve(count);
        });
    });
}

// Delete attachements using their id.
const deleteAttachements = attachementIds => {

    const promises = [];

    // If one delete fails, we need to stop all the process.
    for(let id of attachementIds) {

        let promise = new Promise((resolve, reject) => {
            
            // Deleting attachement data.
            attachementModel.deleteAttachement(id, function(ignored, error) {

                if(error) {
                    reject(error);
                    return;
                }
                
                // Deleting attachement file on the server.
                try { fs.unlinkSync(uploadConfig.location + id);
                } catch (error) { console.error(error); }

                resolve(true);
            });
        });

        promises.push(promise);
    }

    return Promise.all(promises);
}

// Delete the attachements associated with an application.
const getApplicationAttachements = (user, offerId) => {
    return new Promise((resolve, reject) => {
        attachementModel.readApplicationAttachements(offerId, user.email, function(attachements, error) {
            if(error) reject(error);
            else resolve(attachements);
        });
    });
}

module.exports = {
    getMyApplications: function(req,res) {

        const user = req.user;

        let page = req.query.page;
        let limit = req.query.limit;
        const filters = [{name : 'candidate' , operator : '=' , value : user.email}];

        // Count the number of applications to build the pagination.
        applicationModel.countApplications(filters, function (count, error) {

            if (error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            if (count === 0) {
                res.render('candidate/my-applications', { 'applications': [], 'pagination': null, 'user': req.user, 'util': util, 'moment': moment });
                return;
            }

            const orders = [{ field: 'date', type: 'DESC' }];
            let pagination = util.buildPagination(page, limit, count);

            // Get the applications of the candidate.
            applicationModel.readCandidateApplications(pagination.limit, pagination.offset, filters, orders, function (applications, error) {

                if (error) {
                    console.error(error);
                    res.status(500).end();
                    return;
                }

                // Building pagination url.
                pagination = util.buildPaginationURLs('/candidate/my-applications', pagination, []);

                res.render('candidate/my-applications', { 'applications': applications, 'pagination': pagination, 'user': req.user, 'util': util, 'moment': moment});
            });
        });
    },

    getMyApplication: function(req, res) {

        const user = req.user;
        const offerId = req.params.offerId;
        
        // Retrieving the corresponding job offer.
        const offerPromise = new Promise((resolve, reject) => {
            jobOfferModel.readJobOffer(offerId, function(offer, error) {
                if(error) reject(error);
                else resolve(offer);
            });
        });
        
        // Retrieving the corresponding application.
        const applicationPromise = new Promise((resolve, reject) => {
            applicationModel.readOfferApplication(offerId, user.email, function(application, error) {
                if(error) reject(error);
                else resolve(application);
            });
        });

        // Retrieving application attachements.
        const attachementsPromise = new Promise((resolve, reject) => {
            attachementModel.readApplicationAttachements(offerId, user.email, function(attachements, error) {
                if(error) reject(error);
                else resolve(attachements);
            });
        });

        // Executing all the actions to retrieve the needed data.
        Promise.all([offerPromise, applicationPromise, attachementsPromise])
            .then(values => {

                const offer = values[0];
                const application = values[1];
                const attachements = values[2];

                // Case in which the offer or the application cannot be found.
                if(!offer || !application) {
                    res.status(400).end();
                    return;
                }

                res.render('candidate/my-application', { 'offer': offer, 'application': application, 'attachements': attachements, 'moment': moment, 'user': user, 'util': util })
            
            }).catch(error => {

                console.error(error);
                res.status(500).end();
            });
    },

    getApplicationAttachement: function(req, res) {

        const user = req.user;
        const attachementId = req.params.attachementId;

        // Reading the corresponding attachement.
        attachementModel.readAttachement(attachementId, function(attachement, error) {

            if(error) {
                console.error(error);
                res.status(500).end();
                return;
            }

            // Checking that the user is the owner of the attachement.
            if(attachement.candidate !== user.email) {
                res.status(403).end();
                return;
            }

            const path = uploadConfig.location + attachementId;

            res.download(path, attachement.name);
        });
    },

    postApplication: async function(req, res) {

        const user = req.user;
        const offerId = req.params.offerId;

        const files = req.files;
        const body = req.body;

        // Types can be an array or a single char.
        let types = [];

        if(Array.isArray(body.types)) types = body.types;
        else if(body.types) types = [body.types];

        // Checking that attachement types are valid.
        if(!util.checkAttachementTypes(types)) {
            res.status(404).json({ 'message': 'Un des types de pièce jointe spécifié est invalide.' });
            return;
        }

        // There must be the same number of files and types.
        if(types && files.length !== types.length) {
            res.status(404).json({ 'message': 'Requête invalide.' });
            return;
        }
        
        try {

            const offer = await checkOfferExists(offerId);

            // Checking that the offer exists.
            if(!offer || offer.status !== 'published') {
                res.status(404).json({'message': 'Offre non trouvée.'});
                return;
            }

            // Checking that a recruiter cannot apply to his own job offer.
            if(offer.organization === user.organization) {
                res.status(403).json({'message': "Vous ne pouvez pas candidater à votre propre offre d'emploi."});
                return;
            }

            const application = await checkHasApplication(user, offerId);

            // Checking that the user didn't apply to the job offer.
            if(application) {
                res.status(403).json({'message': 'Vous avez déjà candidaté à cette offre.'});
                return;
            }

            const date = moment().format('YYYY-MM-DD');

            // Creating the application.
            applicationModel.createApplication(offerId, user.email, date, 'pending', function(created, error) {

                if(error) {
                    console.error(error);
                    res.status(500).json({ 'message': 'Une erreur est survenue.' });
                    return;
                }

                if(!created) {
                    res.status(500).json({ 'message': 'Une erreur est survenue.' });
                    return;
                }

                // Creating attachements.
                for(let i = 0; i < files.length; i++) {

                    const file = files[i];
                    const type = types[i];

                    // Callback is empty on purpose.
                    attachementModel.createAttachement(file.filename, offerId, user.email, file.originalname, type, () => {});
                }

                res.redirect('/candidate/my-applications');
            });

        } catch(error) {

            console.error(error);
            res.status(500).json({ 'message': 'Une erreur est survenue.' });
        }
    },

    putApplication: async function(req, res, maxFiles) {

        const user = req.user;
        const offerId = req.params.offerId;

        const files = req.files;
        const body = req.body;
        const filesToDelete = body.filesToDelete ? body.filesToDelete.split(',') : [];

        // Types can be an array or a single char.
        let types = [];

        if(Array.isArray(body.types)) types = body.types;
        else if(body.types) types = [body.types];

        // Checking that attachement types are valid.
        if(!util.checkAttachementTypes(types)) {
            res.status(404).json({ 'message': 'Un des types de pièce jointe spécifié est invalide.' });
            return;
        }

        // There must be the same number of files and types.
        if(types && files.length !== types.length) {
            res.status(404).json({ 'message': 'Requête invalide.' });
            return;
        }
        
        try {

            const application = await checkHasApplication(user, offerId);

            // Checking that the user didn't apply to the job offer.
            if(!application) {
                res.status(403).json({'message': "Vous n'avez pas candidaté à cette offre."});
                return;
            }

            // An application can be edited only if it has the 'pending' status.
            if(application.status !== 'pending') {
                res.status(403).json({'message': "Vous ne pouvez plus éditer cette candidature."});
                return;
            }

            const count = await countApplicationAttachements(user, offerId);

            // Checking max file limit.
            if(files.length + count - filesToDelete.length > maxFiles) {
                res.status(403).json({'message': "Vous ne pouvez insérer que 5 fichiers au maximum."});
                return;
            }

            // Deleting attachements.
            await deleteAttachements(filesToDelete);

            // Creating attachements.
            for(let i = 0; i < files.length; i++) {

                const file = files[i];
                const type = types[i];

                // Callback is empty on purpose.
                attachementModel.createAttachement(file.filename, offerId, user.email, file.originalname, type, () => {});
            }

            // Redirecting on current page to update it.
            res.redirect('/candidate/my-applications/' + offerId);

        } catch(error) {

            console.error(error);
            res.status(500).json({ 'message': 'Une erreur est survenue.' });
        }
    },

    deleteApplication: async function(req, res) {

        const user = req.user;
        const offerId = req.params.offerId;

        try {

            const application = await checkHasApplication(user, offerId);

            // Checking that the user had applied to the job offer.
            if(!application) {
                res.status(403).json({'message': "Candidature non trouvée." });
                return;
            }

            // Checking that the application status is 'pending' as only pending applications can be deleted.
            if(application.status !== 'pending') {
                res.status(403).json({'message': "Vous ne pouvez pas supprimer une candidature qui n'est pas en attente." });
                return;
            }

            // Retrieving attachements to delete them.
            const attachements = await getApplicationAttachements(user, offerId);

            const ids = [];
            for(let attachement of attachements) ids.push(attachement.uuid);

            // Deleting attachements.
            await deleteAttachements(ids);

            // Deleting the application.
            applicationModel.deleteApplication(offerId, user.email, function(deleted, error) {

                if(error) {
                    console.error(error);
                    res.status(500).json({ 'message': "Une erreur est survenue." });
                    return;
                }

                if(!deleted) {
                    res.status(500).json({ 'message': "Une erreur est survenue." });
                    return;
                }

                res.status(200).json({ 'message': "Candidature supprimée." });
            });

        } catch(error) {
            console.error(error);
            res.status(500).json({ 'message': "Une erreur est survenue." });
        }
    }
}