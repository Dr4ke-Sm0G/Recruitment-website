const moment = require('moment');
const database = require('./database.js');
const builder = require('./query_builder');

// Allowed fields for dynamic queries.
const ALLOWED_FIELDS = ['last_name', 'account_status', 'account_creation_date', 'type', 'organization'];

module.exports = {
    readUsers: function(limit=0, offset=0, filters, orders, callback) {

        const sql = `SELECT * FROM users`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, orders, limit, offset);

        database.query(query.sql, query.values, function(error, result) {
            callback(result, error);
        });
    },

    readUserByEmail: function(email, callback) {

        const sql = `SELECT * FROM users WHERE email = ?;`;

        database.query(sql, [email], function(error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    countUsers: function(filters, callback) {

        const sql = `SELECT COUNT(*) as count FROM users`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, undefined, undefined, undefined);

        database.query(query.sql, query.values, function(error, result) {
            callback(error || result.length === 0 ? null : result[0].count, error);
        });
    },

    userExists: function(email, callback) {

        const sql = `SELECT * FROM users WHERE email = ?;`;

        database.query(sql, [email], function(error, result) {
            callback(!error && result.length > 0, error);
        });
    },

    readUserByCredentials: function(email, password, callback) {

        const sql = `SELECT * FROM users WHERE email = ? AND password = ?;`;

        database.query(sql, [email, password], function(error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    createUser: function(email, password, firstName, lastName, phone, type, status, callback) {

        date = moment().format('YYYY-MM-DD');

        const sql = `INSERT INTO users (email, password, first_name, last_name, phone, account_creation_date, account_status, type)
            VALUES (?,?,?,?,?,?,?,?);`;

        database.query(sql, [email, password, firstName, lastName, phone, date, status, type], function(error) {
            callback(error == null, error);
        });
    },

    updateUserType: function(email, type, organization, callback) {

        if(type === 'recruiter' && !organization) {
            try { throw new Error('Missing organization'); } catch(error) { callback(false, error); }
            return;
        }

        if(type !== 'recruiter') {
            organization = undefined;
        }

        const sql = `UPDATE users SET type = ?, organization = ? WHERE email = ?;`;

        database.query(sql, [type, organization, email], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    },

    updateUserStatus: function(email, status, callback) {

        const sql = `UPDATE users SET account_status = ? WHERE email = ?;`;

        database.query(sql, [status, email], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    }
}