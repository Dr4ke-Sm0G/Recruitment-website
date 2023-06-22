database = require('./database.js');

module.exports = {
    readAttachement: function(uuid, callback) {

        const sql = `SELECT * FROM attachements WHERE uuid = ?;`;

        database.query(sql, [uuid], function (error, result) {
            callback(result.length > 0 ? result[0] : null, error);
        });
    },

    readApplicationAttachements: function(jobOffer, candidate, callback) {

        const sql = `SELECT * FROM attachements WHERE job_offer = ? AND candidate = ?;`;

        database.query(sql, [jobOffer, candidate], function (error, result) {
            callback(result, error);
        });
    },

    countApplicationAttachements: function(jobOffer, candidate, callback) {

        const sql = "SELECT COUNT(*) as count FROM attachements WHERE job_offer = ? AND candidate = ?;";

        database.query(sql, [jobOffer, candidate], function(error, result) {
            callback(error === null ? result.count : 0, error);
        });
    },

    createAttachement: function(uuid, jobOffer, candidate, name, type, callback) {

        const sql = `INSERT INTO attachements (uuid, job_offer, candidate, name, type) VALUES (?,?,?,?,?);`;

        database.query(sql, [uuid, jobOffer, candidate, name, type], function(error) {
            callback(error == null, error);
        });
    },

    attachementExists: function(uuid, callback) {

        const sql = "SELECT * FROM attachements WHERE uuid = ?;";

        database.query(sql, [uuid], function(error, result) {
            callback(result.length > 0, error);
        });
    },

    deleteAttachement: function(uuid, callback) {

        const sql = "DELETE FROM attachements WHERE uuid = ?;";

        database.query(sql, [uuid], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    },

    deleteApplicationAttachements: function(jobOffer, candidate, callback) {

        const sql = "DELETE FROM attachements WHERE job_offer = ? AND candidate = ?;";

        database.query(sql, [jobOffer, candidate], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    }
};