const bcrypt = require('bcrypt');

// Number of hash rounds.
const SALT_ROUNDS = 10;

module.exports = {

    generateHash: function(password, callback) {

        bcrypt.hash(password, SALT_ROUNDS, function(error, hash) {
            callback(error, hash);
        });
    },

    comparePassword: function(password, hash, callback) {

        bcrypt.compare(password, hash, function(error, result) {
            callback(error, result);
        });
    },

    generateHashAsync: function(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    },
};