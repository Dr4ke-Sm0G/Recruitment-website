const multer = require('multer');

const express = require('express');
const router = express.Router();

const jobOfferController = require('../controller/candidate/job-offer-controller');
const recruiterRequestController = require('../controller/candidate/recruiter-request-controller');
const applicationController = require('../controller/candidate/application-controller');

const UPLOAD_FILES_LIMIT = 5;
const uploadConfig = require('../config/upload');

/* ALL - Check authentication */
router.all("/*", function(req, res, next) {

    if(!req.isAuthenticated()) {
        res.redirect('/sign-in');
        return;
    }

    next();
});

/* GET - Candidate space */
router.get('/', function(req, res, next) {
    res.redirect('/candidate/job-offers');
});

/* GET - Job offer */
router.get("/job-offers/:offerId", function(req, res, next) {
    jobOfferController.getJobOffer(req, res);
});

/* GET - Job offers */
router.get("/job-offers", function(req, res, next){
    jobOfferController.getJobOffers(req, res);
});

/* GET - My applications */
router.get("/my-applications", function(req, res, next){
    applicationController.getMyApplications(req, res);
});

/* GET - My application to a job offer */
router.get("/my-applications/:offerId", function(req, res, next){
    applicationController.getMyApplication(req, res);
});

/* GET - Delete an application to a job offer */
router.delete("/my-applications/:offerId", function(req, res, next){
    applicationController.deleteApplication(req, res);
});

/* GET - Get an application attachement */
router.get('/my-applications/:offerId/attachements/:attachementId', function (req, res, next) {
    applicationController.getApplicationAttachement(req, res);
});

/* PUT - Update an application */
router.put('/my-applications/:offerId/apply', function (req, res, next) {

    upload(req, res, function (err) {

        if (err) {

            console.error(err);
            res.status(500).end();

        } else applicationController.putApplication(req, res, UPLOAD_FILES_LIMIT);
      });
});

/* ALL - Check that the user is a candidate before becoming a recruiter */
router.all("/become-recruiter", function(req, res, next) {

    if(req.user.type !== 'candidate') {
        res.status(403).end();
        return;
    }

    next();
});

/* GET - Create recruiter request */
router.get("/become-recruiter", function(req, res, next){
    recruiterRequestController.getBecomeRecruiter(req, res);
});

/* POST - Join an organization */
router.post("/become-recruiter/join-organization", function(req, res, next){
    recruiterRequestController.postJoinOrganization(req, res);
});

/* POST - Create an organization */
router.post("/become-recruiter/create-organization", recruiterRequestController.validateOrganization(), function(req, res, next){
    recruiterRequestController.postCreateOrganization(req, res);
});

/* ALL - Check that the user is a candidate to access recruiter request contents */
router.all("/my-recruiter-requests", function(req, res, next) {

    if(req.user.type !== 'candidate') {
        res.status(403).end();
        return;
    }

    next();
})

/* GET - Get candidate recruiter requests */
router.get("/my-recruiter-requests", function(req, res, next) {
    recruiterRequestController.getMyRecruiterRequests(req, res);
});

/* GET - Get candidate recruiter requests */
router.delete("/my-recruiter-requests", function(req, res, next) {
    recruiterRequestController.deleteRecruiterRequest(req, res);
});

const upload = multer({storage: uploadConfig.storage}).array('files', UPLOAD_FILES_LIMIT);

/* POST - Post an application to a job offer */
router.post('/job-offers/:offerId/apply', function (req, res, next) {

    upload(req, res, function (error) {

        if(!error) {
            return applicationController.postApplication(req, res);
        }

        if(error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(404).json({ 'message': 'Vous ne pouvez envoyer que 5 fichiers maximum.' });
        }

        console.error(error);
        res.status(500).json({ 'message': 'Une erreur est survenue.' });
      });
});

module.exports = router;
