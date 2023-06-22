const passport = require('passport');
var express = require('express');
var router = express.Router();

const controller = require('../controller/common-controller');

/* GET - home page. */
router.get('/', function(req, res, next) {
    
    if(!req.isAuthenticated()) {
        res.redirect('/sign-in');
        return;
    }

    res.redirect('/candidate');
});

  
/* GET - sign-up page. */
router.get("/sign-up", function(req, res, next) {
    controller.getSignUp(req, res);
});

/* POST - sign-up form. */
router.post('/sign-up', controller.validateSignUp(), function (req, res, next) {
    controller.postSignUp(req, res);
});

/* GET - sign-in page. */
router.get("/sign-in", function(req, res, next) {
    
    if(req.isAuthenticated()) {
        res.redirect('/candidate');
        return;
    }

    controller.getSignIn(req,res);
});

/* POST sign-in form. */
router.post('/sign-in', passport.authenticate('local', { failureRedirect: '/sign-in?result=failed', successRedirect: '/candidate'}));

/* GET - logout */
router.get('/logout', function(req, res, next) {

    req.logout(function(err) {

        if (err) { return next(err); }

        res.redirect('/sign-in');
    });
});

  
module.exports = router;





