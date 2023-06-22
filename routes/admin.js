var express = require('express');
var router = express.Router();

const dashboardController = require('../controller/admin/dashboard-controller');
const userController = require('../controller/admin/user-controller');
const organizationController = require('../controller/admin/organization-controller');
const recruiterRequestController = require('../controller/admin/recruiter-request-controller');

/* ALL - Check authentication */
router.all("/*", function (req, res, next) {

    if (!req.isAuthenticated()) {
        res.redirect('/sign-in');
        return;
    }

    if (req.user.type !== 'admin') {
        res.status(403).end();
        return;
    }

    next();
});

/* GET - Admin dashboard */
router.get("/dashboard", function (req, res, next) {
    dashboardController.getDashboard(req, res);
});

/* GET - Users */
router.get("/users", function (req, res, next) {
    userController.getUsers(req, res);
});

/* GET - User profile */
router.get("/users/:email", function (req, res, next) {
    userController.getUserProfile(req, res);
});

/* PATCH - User profile status change */
router.patch('/users/:email', function (req, res, next) {
    userController.patchUserProfile(req, res);
});

/* GET - Organizations */
router.get('/organizations', function (req, res, next) {
    organizationController.getOrganizations(req, res);
});

/* GET - Organization profile */
router.get('/organizations/:siren', function (req, res, next) {
    organizationController.getOrganization(req, res);
});

/* PATCH - Organization profile patch */
router.patch('/organizations/:siren', function (req, res, next) {
    organizationController.patchOrganization(req, res);
});

/* POST - Update organization */
router.post('/organizations/:siren', function (req, res, next) {
    organizationController.updateOrganization(req, res);
});

/* GET - Recruiter requests */
router.get('/recruiter-requests', function (req, res, next) {
    recruiterRequestController.getRecruiterRequests(req, res);
});

/* PATCH - Recruiter request */
router.patch('/recruiter-requests/recruiter-request', function (req, res, next) {
    recruiterRequestController.patchRecruiterRequest(req, res);
});

/* DELETE - Recruiter request */
router.delete('/recruiter-requests/recruiter-request', function (req, res, next) {
    recruiterRequestController.deleteRecruiterRequest(req, res);
});

module.exports = router;