const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Models
const model = require('../model/user');

// Utils
const passwordHasher = require('../config/password');

// Custom login fields
const fields = {
    'usernameField': 'email',
    'passwordField': 'password'
};

// Authentication function
const verify = function(email, password, done) {

    model.readUserByEmail(email, function(user, error) {

        if(error) { return done(error); }

        if(user === null) { return done(null, false); }

        if(user.account_status === 'inactive') { return done(null, false); }

        // Comparing plain text password with its hash.
        passwordHasher.comparePassword(password, user.password, function(error, result) {
            if(error) done(error);
            else if(result) done(null, user);
            else done(null, false);
        });
    });
}

// Initializing passport with the local strategy that uses email and password
const stategy = new LocalStrategy(fields, verify);
passport.use(stategy);

// Session data storage configuration
const serialization = function(user, done) {
    done(null, user.email);
};

const deserialization = function(email, done) {

    model.readUserByEmail(email, function(user, error) {

        if(error) { return done(error); }

        if(user === null) { return done(null, false); }

        if(user.account_status === 'inactive') { return done(null, false); }

        return done(null, user);
    });
}

passport.serializeUser(serialization);
passport.deserializeUser(deserialization);
