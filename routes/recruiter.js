var express = require('express');
var router = express.Router();

const dashboardController = require('../controller/recruiter/dashboard-controller');
const applicationController = require('../controller/recruiter/application-controller');
const recruiterRequestController = require('../controller/recruiter/recruiter-request-controller');
const jobOfferController = require('../controller/recruiter/job-offer-controller');
const organizationController = require('../controller/recruiter/organization-controller');

/* ALL - Check authentication */
router.all("/*", function(req, res, next) {

    if(!req.isAuthenticated()) {
        res.redirect('/sign-in');
        return;
    }

    if(req.user.type !== 'recruiter') {
        res.status(403).end();
        return;
    }

    next();
});

/* GET - Recruiter dashboard */
router.get('/dashboard', function(req, res, next) {
    dashboardController.getDashboard(req, res);
});

/* GET - All applications */
router.get('/applications', function(req, res, next) {
    applicationController.getAllApplications(req, res);
});

/* GET - Job offers */
router.get('/offers', function(req, res, next) {
    jobOfferController.getJobOffers(req, res);
 });

/* GET - Offer applications */
router.get('/offers/:offer/applications', function(req, res, next) {
    applicationController.getOfferApplications(req, res);
});

/* GET - Offer application */
router.get('/offers/:offer/applications/:candidate', function(req, res, next) {
    applicationController.getOfferApplication(req, res);
});

/* GET - Offer application attachement */
router.get('/offers/:offer/applications/:candidate/attachements/:attachementId', function(req, res, next) {
    applicationController.getOfferApplicationAttachement(req, res);
});

/* PATCH - Offer application */
router.patch('/offers/:offer/applications/:candidate', function(req, res, next) {
    applicationController.patchApplication(req, res);
});

/* GET - Recruiter requests */
router.get('/recruiter-requests', function(req, res, next) {
    recruiterRequestController.getRecruiterRequests(req, res);
});

/* PATCH - Recruiter request */
router.patch('/recruiter-requests/recruiter-request', function(req, res, next) {
    recruiterRequestController.patchRecruiterRequest(req, res);
});

/* DELETE - Recruiter request */
router.delete('/recruiter-requests/recruiter-request', function(req, res, next) {
    recruiterRequestController.deleteRecruiterRequest(req, res);
});

/* GET - Job offers */
router.get('/offers', function(req, res, next) {
   jobOfferController.getJobOffers(req, res);
});

/* GET - My organization */
router.get('/my-organization', organizationController.validateOrganization(), function(req, res, next) {
    organizationController.getOrganization(req, res);
});

/* POST - Update organization */
router.post('/my-organization', function(req, res, next) {
    organizationController.updateOrganization(req, res);
});

/* GET - Job offer create page */
router.get('/offers/create', function(req, res, next) {
    jobOfferController.getJobOfferCreatePage(req, res);
});

/* POST - Job offer create */
router.post('/offers/create', jobOfferController.validateJobOffer(), function(req, res, next) {
    jobOfferController.createJobOffer(req, res);
});

/* GET - Job offer edit page */
router.get('/offers/:offerId/edit', function(req, res, next) {
    jobOfferController.getJobOfferEditPage(req, res);
});

/* POST - Job offer edit */
router.post('/offers/:offerId/edit', jobOfferController.validateJobOffer(), function(req, res, next) {
    jobOfferController.updateJobOffer(req, res);
});

module.exports = router;