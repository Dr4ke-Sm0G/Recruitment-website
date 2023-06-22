const { body, validationResult } = require('express-validator');

// Models
const userModel = require('../model/user');

// Utils
const mailer = require('../config/mailer');
const passwordHasher = require('../config/password');

// This regex must:
// - contains at least 1 uppercase letter
// - contains at least 1 lowercase letter
// - contains at least 1 number
// - contains at least 1 special character among a list of 37 ones
// - have a length between 12 and 24
const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%\\\^&*\(\)\-_=+\[\]\{\}\|:éèç<>,\.\?])[A-Za-z0-9!@#$%\\\^&*\(\)\-_=+\[\]\{\}\|:éèç<>,\.\?]{12,24}$/

// Check if a user exists.
const checkUserExists = email => {
    return new Promise((resolve, reject) => {
        userModel.userExists(email, function (exists, error) {
            if(error) reject(error);
            else resolve(exists);
        });
    });
}

module.exports = {

    postSignUp: async function (req, res) {

        // Retrieving form data.
        const body = req.body;
        const firstName = body.firstName;
        const lastName = body.lastName;
        const email = body.email;
        const phone = body.phone;
        const password = body.password;

        const errors = validationResult(req);
        
        // Checking that inputs are valid.
        if (!errors.isEmpty()) {
            return res.status(400).json({ 'message': errors.array()[0].msg });
        }

        const exists = await checkUserExists(email);

        // Checking if the user exists.
        if (exists) {
            res.status(400).json({ 'message': "Cette adresse email n'est pas disponible." });
            return;
        }

        // Generating hash.
        const hash = await passwordHasher.generateHashAsync(password);
        
        // Creating the user.
        userModel.createUser(email, hash, firstName, lastName, phone, 'candidate', 'active', function (user, error) {

            if(error) {
                console.error(error);
                res.status(500).json({ 'message': 'Une erreur est survenue. Veuillez réessayer.' });
                return;
            }

            // Sending an email.
            const subject = "Plateforme AI16 - Compte créé";
            const content = "Votre compte sur la plateforme de recrutement AI16 UTC a bien été créé.";

            mailer.sendEmail(email, subject, content);

            // Sending result.
            res.status(201).send({ 'message': 'Inscription validée.' });
        });
    },

    getSignUp: function (req, res) {
        res.render("sign-up");
    },
    
    getSignIn: function (req, res) {

        let authError = null;

        if(req.query.result && req.query.result === 'failed') {
            authError = { 'message': "Email ou mot de passe invalide." }
        }

        res.render("sign-in", { 'error': authError } );
    },

    validateSignUp: function() {

        return [
            body('email').trim()
                .notEmpty().withMessage("Champ 'Email' manquant.")
                .isEmail().withMessage("Champ 'Email' invalide.")
                .isLength({ max: 64 }).withMessage("Champ 'Email' trop long."),

            body('password')
                .notEmpty().withMessage("Champ 'Mot de passe' manquant.")
                .matches(PASSWORD_REGEX).withMessage("Champ 'Mot de passe' invalide."),

            body('phone').trim()
                .notEmpty().withMessage("Champ 'N° Téléphone' manquant.")
                .isLength({ max: 32 }).withMessage("Champ 'N° Téléphone' trop long."),

            body('firstName').trim()
                .notEmpty().withMessage("Champ 'Prénom' manquant.")
                .isLength({ max: 64 }).withMessage("Champ 'Prénom' trop long."),

            body('lastName').trim()
                .notEmpty().withMessage("Champ 'Nom' manquant.")
                .isLength({ max: 64 }).withMessage("Champ 'Nom' trop long.")
        ];
    }
};
