const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const MySQLStore = require('express-mysql-session')(session);

/* Environment variables */
require('dotenv').config();

/* Uploads folder */
const uploadConfig = require('./config/upload');
uploadConfig.createStorageFolder();

/* Background tasks */
require('./jobs/offer-status');

/* App setup */
const app = express();

/* view engine setup */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* App setup */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Sessions */
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
  }),
  cookie: {
    maxAge: 10 * 60 * 1000 // 10 minutes
  }
}));

require('./config/auth');

app.use(passport.initialize());
app.use(passport.session());

/* Routers */
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const recruiterRouter = require('./routes/recruiter');
const candidateRouter = require('./routes/candidate');

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/recruiter', recruiterRouter);
app.use('/candidate', candidateRouter);

/* Catch 404 and forward to error handler */
app.use(function (req, res, next) {
  next(createError(404));
});

/* Error handler */
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
