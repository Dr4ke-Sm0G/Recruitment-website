const moment = require('moment');

const database = require('./database.js');
const builder = require('./query_builder');

// Allowed fields for dynamic queries.
const ALLOWED_FIELDS = ['name', 'type', 'creation_date', 'status'];

module.exports = {
    readOrganizations: function(limit=0, offset=0, filters, orders, callback) {

        const sql = `SELECT * FROM organizations`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, orders, limit, offset);

        database.query(query.sql, query.values, function(error, result) {
            callback(result, error);
        });
    },

    readOrganization: function(siren, callback) {

        const sql = `SELECT * FROM organizations WHERE siren = ?;`;

        database.query(sql, [siren], function(error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    countOrganizations: function(filters, callback) {

        const sql = `SELECT COUNT(*) as count FROM organizations`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, undefined, undefined, undefined);

        database.query(query.sql, query.values, function(error, result) {
            callback(error || result.length === 0 ? null : result[0].count, error);
        });
    },

    organizationExists: function(siren, callback) {

        const sql = `SELECT * FROM organizations WHERE siren = ?;`;

        database.query(sql, [siren], function(error, result) {
            callback(result.length > 0, error);
        });
    },

    createOrganization: function(siren, name, type, headquarter, status, callback) {

        date = moment().format('YYYY-MM-DD');

        const sql = `INSERT INTO organizations (siren, name, type, headquarter, status, creation_date) VALUES (?,?,?,?,?,?);`;

        database.query(sql, [siren, name, type, headquarter, status, date], function(error) {
            console.log(error);
            callback(error === null, error);
        });
    },

    updateOrganization: function(siren, name, type, headquarter, callback) {

        const sql = `UPDATE organizations SET name = ?, type = ?, headquarter = ? WHERE siren = ?;`;

        database.query(sql, [name, type, headquarter, siren], function(error, result) {
            callback(!error && result.affectedRows > 0, error);
        });
    },

    updateOrganizationStatus: function(siren, status, callback) {

        const sql = `UPDATE organizations SET status = ? WHERE siren = ?;`;

        database.query(sql, [status, siren], function(error, result) {
            callback(!error && result.affectedRows > 0, error);
        });
    },
};