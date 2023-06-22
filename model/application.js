const database = require('./database.js');
const builder = require('./query_builder');

// Allowed fields for dynamic queries.
const ALLOWED_FIELDS = ['candidate', 'job_offer', 'date', 'status', 'organization', 'last_name', 'first_name', 'email'];

// Common SQL query with renamed fields. Useful for reuse.
const RENAMED_SQL_QUERY = `SELECT 
    app.job_offer as job_offer, 
    app.candidate as candidate, 
    app.date as date, 
    app.status as status,
    u.first_name as first_name,
    u.last_name as last_name,
    u.email as email,
    u.phone as phone,
    u.account_creation_date as account_creation_date,
    jo.organization as organization,
    jd.job_title as job_title
    FROM applications app
    JOIN users u ON app.candidate = u.email
    JOIN job_offers jo ON app.job_offer = jo.id
    JOIN job_descriptions jd ON jd.job_offer = jo.id
`

module.exports = {
    readCandidateApplications: function(limit=0, offset=0, filters, orders, callback) {

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, orders, limit, offset);

        database.query(query.sql, query.values, function(error, result) {
            callback(result, error);
        });
    },

    readOfferApplications: function(jobOfferId, limit=0, offset=0, callback) {

        const sql = `SELECT * FROM applications WHERE job_offer = ? LIMIT ? OFFSET ?;`;

        database.query(sql, [jobOfferId, limit, offset], function(error, result) {
            callback(result, error);
        });
    },

    readOfferApplication: function(jobOfferId, candidate, callback) {

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query WHERE job_offer = ? AND candidate = ?;`;

        database.query(sql, [jobOfferId, candidate], function(error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    countApplications: function(filters, callback) {

        // Using a nested query to avoid field name conflicts.
        const sql = `SELECT COUNT(*) as count FROM (${RENAMED_SQL_QUERY}) as query`;

        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, undefined, undefined, undefined);
        
        database.query(query.sql, query.values, function(error, result) {
            callback(error ? 0 : result[0].count, error);
        });
    },

    createApplication: function(jobOffer, candidate, date, status, callback) {

        const sql = `INSERT INTO applications (job_offer, candidate, date, status) VALUES (?,?,?,?);`;

        database.query(sql, [jobOffer, candidate, date, status], function(error, result) {
            callback(!error && result.affectedRows > 0, error);
        });
    },

    updateApplicationStatus: function(jobOffer, candidate, status, callback) {

        const sql = `UPDATE applications SET status = ? WHERE job_offer = ? AND candidate = ?;`;

        database.query(sql, [status, jobOffer, candidate], function(error, result) {
            callback(!error && result.affectedRows > 0, error);
        });
    },

    deleteApplication: function(jobOffer, candidate, callback) {

        const sql = `DELETE FROM applications WHERE job_offer = ? AND candidate = ?;`;

        database.query(sql, [jobOffer, candidate], function(error, result) {
            callback(error ? false : true, error);
        });
    }
};