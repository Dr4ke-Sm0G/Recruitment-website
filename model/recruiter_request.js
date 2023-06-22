const moment = require('moment');

const database = require('./database');
const builder = require('./query_builder');

// Allowed fields for dynamic queries.
const ALLOWED_FIELDS = ['user_first_name', 'user_last_name', 'user_email', 'date', 'status', 'organization_name',
            'organization_siren', 'organization_date'];

// Common SQL query with renamed fields. Useful for reuse.
const RENAMED_SQL_QUERY = `SELECT * FROM (
    SELECT 
    u.first_name as user_first_name, 
    u.last_name as user_last_name, 
    u.email as user_email, 
    u.phone as user_phone, 
    u.type as user_type, 
    rr.date, 
    rr.status, 
    o.name as organization_name, 
    o.siren as organization_siren, 
    o.type as organization_type, 
    o.status as organization_status, 
    o.creation_date as organization_date,
    o.headquarter as organization_headquarter 
    FROM recruiter_requests rr 
    JOIN users u ON u.email = rr.candidate
    JOIN organizations o ON o.siren = rr.organization
) as query`;

module.exports = {
    readRecruiterRequest: function(candidate, organization, callback) {

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query WHERE user_email = ? AND organization_siren = ?;`;

        database.query(sql, [candidate, organization], function(error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    readRecruiterRequests: function(limit=0, offset=0, filters, orders, callback) {

        const query = builder.buildDynamicQuery(RENAMED_SQL_QUERY, ALLOWED_FIELDS, filters, orders, limit, offset);

        database.query(query.sql, query.values, function(error, result) {
            callback(result, error);
        });
    },

    countRecruiterRequests: function(filters, callback) {

        const sql = `SELECT COUNT(*) as count FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, undefined, undefined, undefined);

        database.query(query.sql, query.values, function(error, result) {
            callback(error || result.length === 0 ? null : result[0].count, error);
        });
    },

    createRecruiterRequest: function(candidate, siren, callback) {

        const date = moment().format('YYYY-MM-DD');
        const sql = `INSERT INTO recruiter_requests (candidate, organization, status, date) VALUES (?,?,?,?);`;

        database.query(sql, [candidate, siren, 'pending', date], function(error, result) {
            callback(error === null, error);
        });
    },

    updateRecruiterRequestStatus: function(candidate, organization, status, callback) {

        const sql = `UPDATE recruiter_requests SET status = ? WHERE candidate = ? AND organization = ?;`;

        database.query(sql, [status, candidate, organization], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    },

    deleteRecruiterRequest: function(candidate, organization, callback) {

        const sql = `DELETE FROM recruiter_requests WHERE candidate = ? AND organization = ?;`;

        database.query(sql, [candidate, organization], function(error, result) {
            callback(error == null && result.affectedRows > 0, error);
        });
    },

    canCreateRecruiterRequest: function(candidate, organization, callback) {

        const sql = `SELECT COUNT(*) as count FROM recruiter_requests 
            WHERE candidate = ? AND (organization = ? OR status <> 'refused');`;

        database.query(sql, [candidate, organization], function(error, result) {
            callback(error || result.length === 0 ? false : result[0].count === 0, error);
        });
    },

    validateRecruiterRequest: async function(candidate, organization, activate, callback) {

        const updateRequestStatus = (connection) => {
            return new Promise((resolve, reject) => {

                const sql = `UPDATE recruiter_requests SET status = ? WHERE candidate = ? AND organization = ?;`;

                connection.query(sql, ['accepted', candidate, organization], function(error, result) {
                    if(error) reject(error);
                    else resolve(result.affectedRows > 0);
                });
            });
        };

        const updateCandidateRole = (connection) => { 
            return new Promise((resolve, reject) => {

                const sql = `UPDATE users SET type = ?, organization = ? WHERE email = ?;`;

                connection.query(sql, ['recruiter', organization, candidate], function(error, result) {
                    if(error) reject(error);
                    else resolve(result.affectedRows > 0);
                });
            });
        };

        const updateOrganizationStatus = (connection) => {
            return new Promise((resolve, reject) => {

                if(!activate) resolve(true);

                const sql = `UPDATE organizations SET status = ? WHERE siren = ?;`;

                connection.query(sql, ['active', organization], function(error, result) {
                    if(error) reject(error);
                    else resolve(result.affectedRows > 0);
                });
            });
        };

        // Retrieving a connection.
        database.getConnection(function (error, connection) {

            if (error) {
                callback(false, error);
                return;
            }

            // Begining a transaction to ensure data consistency.
            connection.beginTransaction(function (error) {

                if (error) {
                    callback(false, error);
                    return;
                }

                Promise.all([updateCandidateRole(connection), updateRequestStatus(connection), updateOrganizationStatus(connection)]).then(values => {

                    // Case in which all values have been updated.
                    if(values[0] && values[1]) {
                        connection.commit(error => { callback(error === null, error); });
                        connection.release();
                    }

                }).catch(error => {
                    connection.rollback(() => { callback(false, error); });
                });
            });
        });
    }
};