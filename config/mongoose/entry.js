var mongoose = require('mongoose');

var entrySchema = mongoose.Schema({
    CONTEST_ID: String,
    USER_ID: String,
    NAME: String,
    LAST_NAME: String,
    DATE: String,
    EMAIL: String,
    STATUS: String,
    URL_ORIGINAL: String,
    URL_CONVERTED: String,
    CREATED_AT: Number,
    URL_CONTEST: String
});

// create the model and expose it to our app
module.exports = mongoose.model('Entry', entrySchema);