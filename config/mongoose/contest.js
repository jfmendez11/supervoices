var mongoose = require('mongoose');

var contestSchema = mongoose.Schema({
    USER_ID: String,
    NAME: String,
    IMAGE_PATH: String,
    URL: String,
    STATUS: String,
    INIT_DATE: String,
    END_DATE: String,
    PAYMENT: Number,
    SCRIPT_PATH: String,
    RECOMMENDATIONS_PATH: String,
});

// create the model and expose it to our app
module.exports = mongoose.model('Contest', contestSchema);