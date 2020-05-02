require('dotenv').config();
const express = require('express');
const CRUD = require("./CRUD");
const path = require("path");
const passport = require('passport');
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');

const app = express();
const configDB = require('./config/mongoose/database.js');

let testId;

mongoose.connect(configDB.url, {useNewUrlParser: true});

require("./config/passport/passport")(passport);

//Uses static directory "contest_data"
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : path.join(__dirname,'/tmp/')
}));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "frontend/build")));
app.use(express.static(path.join(__dirname,'/contest_data')));
app.use(express.static(path.join(__dirname,'/loaderio-84c0578445483df9f704d03696525947')));
app.use(passport.initialize());


// schedule.scheduleJob('0 0 * * *', () => {
//     CRUD.endContests();
// });

/**
 * PUT method that ends contests that have reached its final day
 */
app.get('/API/endContests', (req, res) => {
    CRUD.endContests(req, res);
});


/**
 * POST method that registers a new user
 */
app.post('/API/signupUser', (req, res, next) => {
    CRUD.signupUser(req, res, next)
});

/**
 * POST method that authenticates a user using credentials
 */
app.post('/API/loginUser', (req, res, next) => {
    CRUD.loginUser(req, res, next);
});

/**
 * GET method that verifies a user by access token
 */
app.get('/API/getUser', (req, res, next) => {
    CRUD.findUser(req, res, next);
});

/**
 * GET method that obtains a set of contests for a given user
 */
app.get('/API/contests', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.getContests(req, res, req.user);
});

/**
 * GET method that obtains a contests with a given id
 */
app.get('/API/contest/:url', (req, res) => {
    CRUD.getContest(req, res);
});

/**
 * POST method that adds a contest for a given user
 */
app.post('/API/contest', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.addContest(req, res, req.user);
});

/**
 * PUT method that updates a contest for a given user
 */
app.put('/API/contest', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.updateContest(req, res, req.user);
});

/**
 * PUT method that updates the contest winner information
 */
app.put('/API/contest/winner', passport.authenticate('jwt', {session: false}), (req, res)=>{
    CRUD.winContest(req, res, req.user);
});


/**
 * DELETE method that deletes a contest for a given user
 */
app.delete('/API/contest/:contestId', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.deleteContest(req, res, req.user);
});

/**
 * POST method that inserts a banner for a given contest
 */
app.post('/API/banner/:contestId', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.insertBanner(req, res, req.user);
});

/**
 * POST method that inserts a script for a given contest
 */
app.post('/API/script/:contestId', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.insertScript(req, res, req.user);
});

/**
 * POST method that inserts a script for a given contest
 */
app.post('/API/recommendation/:contestId', passport.authenticate('jwt', {session: false}), (req, res) => {
    CRUD.insertRecommendations(req, res, req.user);
});

/**
 * POST method that inserts a recording for a given contest
 */
app.post('/API/recording/:userId/:contestId/:entryId', (req, res) => {
    CRUD.insertRecording(req, res);
});

/**
 * POST method that inserts a recording for a given contest
 */
app.post('/API/load_test_recording/:userId/:contestId/:entryId', (req, res) => {
    CRUD.insertLoadTest(req, res);
});

/**
 * GET method that obtains entries with a given contest id
 */
app.get('/API/entry/:url', (req, res) => {
    CRUD.getEntries(req, res);
});

/**
 * GET method that sends mail informing that audio is ready
 */
app.post('/API/email', (req, res) => {
    CRUD.sendEmail(req, res);
});

/**
 * POST method that adds a contest entry
 */
app.post('/API/entry', (req, res) => {
    CRUD.addEntry(req, res);
});

app.listen(process.env.PORT || 8081, () => {
    testId=1;
    console.log(`Listening on :${process.env.PORT || 8081}`);
});
