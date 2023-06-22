const moment = require('moment');
const database = require('./database.js');
const builder = require('./query_builder.js');

// Allowed fields for dynamic queries.
const ALLOWED_FIELDS = ['offer_id', 'organization', 'creation_date', 'status', 'validity_date', 'info', 'recruiter', 'job_offer', 'job_title', 'job_desc', 'job_place', 'job_status', 'job_type', 'salary_min', 'salary_max', 'work_hours', 'telework', 'organization_name', 'organization_type', 'organization_status'];

// Common SQL query with renamed fields. Useful for reuse.
const RENAMED_SQL_QUERY = `SELECT 
    jo.id as offer_id,
    jo.status as status,
    jo.creation_date as creation_date,
    jo.validity_date as validity_date,
    jo.info as info,
    jo.recruiter as recruiter,
    jo.organization as organization,
    jd.id as job_description_id,
    jd.job_title as job_title,
    jd.job_desc as job_desc,
    jd.job_place as job_place,
    jd.job_status as job_status,
    jd.job_type as job_type,
    jd.salary_min as salary_min,
    jd.salary_max as salary_max,
    jd.work_hours as work_hours,
    jd.telework as telework,
    o.name as organization_name,
    o.type as organization_type,
    o.status as organization_status
    FROM job_offers AS jo 
    JOIN job_descriptions AS jd ON jo.id = jd.job_offer
    JOIN organizations as o ON o.siren = jo.organization`;

module.exports = {

    readJobOffers: function (limit = 0, offset = 0, filters, orders, callback) {

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, orders, limit, offset);

        database.query(query.sql, query.values, function (error, result) {
            console.log(error);
            callback(result, error);
        });
    },

    readJobOffer: function (id, callback) {

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query WHERE offer_id = ?;`;

        database.query(sql, [id], function (error, result) {
            callback(error || result.length === 0 ? null : result[0], error);
        });
    },

    readAvailableJobOffers: function (limit = 0, offset = 0, filters, orders, callback) {

        const filtersCopy = [...filters];

        // A job offer is available only if its status is 'published' and its organization is 'active'.
        filtersCopy.push({ name: 'status', operator: '=', value: 'published' });
        filtersCopy.push({ name: 'organization_status', operator: '=', value: 'active'});

        const sql = `SELECT * FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filtersCopy, orders, limit, offset);

        database.query(query.sql, query.values, function (error, result) {
            callback(result, error);
        });
    },

    countJobOffers: function(filters, callback) {

        const sql = `SELECT COUNT(*) as count FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filters, undefined, undefined, undefined);

        database.query(query.sql, query.values, function(error, result) {
            callback(error || result.length === 0 ? null : result[0].count, error);
        });
    },

    countAvailableJobOffers: function(filters, callback) {

        const filtersCopy = [...filters];
        filtersCopy.push({ name: 'status', operator: '=', value: 'published' });
        filtersCopy.push({ name: 'organization_status', operator: '=', value: 'active'});

        const sql = `SELECT COUNT(*) as count FROM (${RENAMED_SQL_QUERY}) as query`;
        const query = builder.buildDynamicQuery(sql, ALLOWED_FIELDS, filtersCopy, undefined, undefined, undefined);

        database.query(query.sql, query.values, function(error, result) {
            callback(error || result.length === 0 ? null : result[0].count, error);
        });
    },

    createJobOffer: function (
        status, validity_date, info, recruiter, organization,
        jobTitle, jobDesc, jobPlace, jobStatus, jobType, salaryMin, salaryMax, workHours, telework,
        callback) {

        const creationDate = moment().format('YYYY-MM-DD');

        const insert1 = `INSERT INTO job_offers (status, creation_date, validity_date, info, recruiter, organization)
                VALUES (?,?,?,?,?,?);`;

        const insert2 = `INSERT INTO job_descriptions (job_offer, job_title, job_desc, job_place, job_status, job_type, salary_min, salary_max, work_hours, telework)
                VALUES (?,?,?,?,?,?,?,?,?,?);`;

        database.getConnection(function (error, connection) {

            if (error) {
                callback(false, error);
                return;
            }

            connection.beginTransaction(function (error) {

                if (error) {
                    callback(false, error);
                    return;
                }

                connection.query(insert1, [status, creationDate, validity_date, info, recruiter, organization], function (error, result) {

                    // First query not passed.
                    if (error) {
                        connection.rollback(() => { callback(false, error); });
                        return;
                    }

                    const jobOfferId = result.insertId;

                    connection.query(insert2, [jobOfferId, jobTitle, jobDesc, jobPlace, jobStatus, jobType, salaryMin, salaryMax, workHours, telework], function (error) {

                        // Second query not passed.
                        if (error) {
                            connection.rollback(() => { callback(false, error); });
                            return;
                        }

                        connection.commit(error => { callback(!error ? jobOfferId : undefined, error); });
                        connection.release();
                    });
                });
            });
        });
    },

    updateJobOffer: function (
        jobOfferId, status, validity_date, info,
        jobDescriptionId, jobTitle, jobDesc, jobPlace, jobStatus, jobType, salaryMin, salaryMax, workHours, telework,
        callback) {

        const update1 = `UPDATE job_offers SET status = ?, validity_date = ?, info = ? WHERE id = ?;`;

        const update2 = `UPDATE job_descriptions SET job_title = ?, job_desc = ?, job_place = ?, job_status = ?, job_type = ?, salary_min = ?, salary_max = ?, work_hours = ?, telework = ?
                WHERE id = ? AND job_offer = ?;`;

        database.getConnection(function (error, connection) {

            if (error) {
                callback(false, error);
                return;
            }

            connection.beginTransaction(function (error) {

                if (error) {
                    callback(false, error);
                    return;
                }

                connection.query(update1, [status, validity_date, info, jobOfferId], function (error, result) {

                    // First query not passed.
                    if (error || result.affectedRows === 0) {
                        connection.rollback(() => { callback(false, error); });
                        return;
                    }

                    connection.query(update2, [jobTitle, jobDesc, jobPlace, jobStatus, jobType, salaryMin, salaryMax, workHours, telework, jobDescriptionId, jobOfferId], function (error) {

                        // Second query not passed.
                        if (error || result.affectedRows === 0) {
                            connection.rollback(() => { callback(false, error); });
                            return;
                        }

                        connection.commit(error => { callback(error == null, error); });
                        connection.release();
                    });
                });
            });
        });
    },

    updateAllJobOfferStatuses: function(callback) {

        const sql = `UPDATE job_offers SET status = 'expired' WHERE validity_date <= NOW() AND status = 'published';`;

        database.query(sql, function(error, result) {
            callback(error ? false : true, error);
        });
    }
};