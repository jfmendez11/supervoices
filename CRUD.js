const jwtSecret = require('./config/passport/jwtConfig');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('./config/mongoose/conf');
const Contest = require('./config/mongoose/contest');
const Entry = require('./config/mongoose/entry');
const del = require('delete');
const AWS = require('aws-sdk');
const mv = require('mv');
const fs = require('fs');
const sha256 = require('sha256');
var memjs = require('memjs')

AWS.config.update({
    region: process.env.SES_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {Bucket: process.env.S3_BUCKET_NAME}
});

let mc = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
    failover: true,  // default: false
    timeout: 1,      // default: 0.5 (seconds)
    keepAlive: true,  // default: false
    username: process.env.MEMCACHIER_USERNAME,
    password: process.env.MEMCACHIER_PASSWORD
});

/**
 * Method meant to register a user
 * @param req
 * @param res
 * @param next
 */
exports.signupUser = (req, res, next) => {
    passport.authenticate('register', (err, user, info) => {
        if (err) {
            console.log(err);
        }
        if (info !== undefined) {
            console.log(info.message);
            res.send(info);
        } else {
            req.logIn(user, err => {
                const data = {
                    name: req.body.name,
                    lastname: req.body.lastname,
                    email: req.body.email,
                };
                let ses = new AWS.SES({apiVersion: '2010-12-01'});
                let params = {
                    EmailAddress: req.body.email
                };
                ses.verifyEmailIdentity(params, function (err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else console.log(data);           // successful response
                });
                User.findOne({email: data.email})
                    .then((user) => {
                        user.updateOne({
                            name: data.name,
                            lastname: data.lastname
                        }).then(() => {
                            console.log('user created in db');
                            const token = jwt.sign({id: user._id}, jwtSecret.secret, {expiresIn: '1h'});
                            return res.status(200).send({
                                message: null,
                                auth: true,
                                token: token,
                                id: user._id
                            });
                        });
                    });
            });
        }
    })(req, res, next);
};

/**
 * Method meant to login a user
 * @param req
 * @param res
 * @param next
 */
exports.loginUser = (req, res, next) => {
    console.log(req.body);
    passport.authenticate('login', (err, user, info) => {
        if (err) {
            console.log(err);
        }
        if (info !== undefined) {
            console.log(info.message);
            res.send(info);
        } else {
            req.logIn(user, err => {
                User.findOne({email: req.body.email}).then(user => {
                    const token = jwt.sign({id: user._id}, jwtSecret.secret, {expiresIn: '2h'});
                    return res.status(200).send({
                        auth: true,
                        token: token,
                        message: null,
                        id: user._id
                    });
                });
            });
        }
    })(req, res, next);
};

/**
 * Method meant to find a user from a given token
 * @param req
 * @param res
 * @param next
 */
exports.findUser = (req, res, next) => {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if (err) {
            console.log(err);
        }
        if (info !== undefined) {
            console.log(info.message);
            return res.status(400).send("Unauthorized");
        } else {
            console.log('user found in db from route');
            return res.status(200).send({
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                _id: user._id,
            });
        }
    })(req, res, next);
};

/**
 * Method that obtains a set of contests for a given user
 * @param req
 * @param res
 * @param next
 */
exports.getContests = (req, res, user) => {
    let userId = user._id;
    mc.get(userId.toString(), function(err, val) {
        if(err != null) {
            console.log('Error getting value: ' + err)
        }
        if (val) {
            console.log("Get from cache");
            return res.status(200).send(JSON.parse(val));
        }
        else {
            console.log("Get from DB");
            Contest.find({USER_ID: userId}, (err, rows) => {
                mc.set(userId.toString(), JSON.stringify(rows),  {expires: 900});
                return res.status(200).json(rows);
            }).sort({NAME: 1});
        }
    })


};

/**
 * Method that retrieves a contest given by id
 * @param req
 * @param res
 * @param next
 */
exports.getContest = (req, res) => {
    let contestId = req.params.url;

    Contest.find({URL: contestId}, (err, rows) => {
        return res.status(200).json(rows);
    });

};


/**
 * Method that add a new contest
 * @param req
 * @param res
 * @param next
 */
exports.addContest = (req, res, user) => {
    let userId = user._id;
    let contest = req.body;

    const newContest = new Contest({
        USER_ID: userId,
        NAME: contest.name,
        IMAGE_PATH: contest.imagePath,
        URL: contest.url,
        STATUS: "ongoing",
        INIT_DATE: contest.initDate,
        END_DATE: contest.endDate,
        PAYMENT: contest.payment,
        SCRIPT_PATH: contest.scriptPath,
        RECOMMENDATIONS_PATH: contest.recommendationsPath,
    });

    mc.delete(userId.toString(), function(err) {
        if(err != null) {
            console.log('Error deleting value: ' + err)
        }
    });

    newContest.save(function (err) {
        if (err) console.log(err);
        Contest.findOne({URL: contest.url}, (err, row) => {
            return res.status(200).json(row);
        });
    });

};

/**
 * Method that edits a contest by a given ID
 * @param req
 * @param res
 * @param user
 */
exports.updateContest = (req, res, user) => {
    let contest = req.body;
    let userId = user.id;
    mc.delete(userId.toString(), function(err) {
        if(err != null) {
            console.log('Error deleting value: ' + err)
        }
    });
    Contest.updateOne({USER_ID: userId, _id: contest.id},
        {
            NAME: contest.name,
            IMAGE_PATH: contest.imagePath,
            URL: contest.url,
            STATUS: "ongoing",
            INIT_DATE: contest.initDate,
            END_DATE: contest.endDate,
            PAYMENT: contest.payment,
            SCRIPT_PATH: contest.scriptPath,
            RECOMMENDATIONS_PATH: contest.recommendationsPath
        }
        , function (err, doc) {
            if (err) {
                console.log(err);
            }
            return res.status(200).json(doc);
        });
};

/**
 * Method that ends the contest with a given ID
 * @param req
 * @param res
 * @param user
 */
exports.winContest = (req, res, user) => {
    let contest = req.body;

    let userId = user._id;
    let connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT,
    });

    connection.connect();

    let query = 'UPDATE CONTESTS SET NAME="' + contest.NAME + '", STATUS="finished",' + 'WINNER_NAME="' + contest.WINNER_NAME
        + '", WINNER_EMAIL="' + contest.WINNER_EMAIL + '", IMAGE_PATH="' + contest.IMAGE_PATH + '", URL="' + contest.URL + '", INIT_DATE="' +
        contest.INIT_DATE + '", END_DATE="' + contest.END_DATE + '", PAYMENT=' + contest.PAYMENT + ', SCRIPT_PATH="' +
        contest.SCRIPT_PATH + '", RECOMMENDATIONS_PATH="' + contest.RECOMMENDATIONS_PATH + '" WHERE ID=' + contest.ID + ' AND USER_ID="' + userId + '";';
    connection.query(query,
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.json({message: 'No se pudo editar el evento, revise sus parámetros e intente nuevamente'});
            }
            res.json(rows)
        });

    connection.end()
};

/**
 * Method that deletes a contest by a given ID. It also deletes all related files uploaded by user
 * @param req
 * @param res
 * @param user
 */
exports.deleteContest = (req, res, user) => {
    let contestId = req.params.contestId;
    let userId = user._id;

    mc.delete(userId.toString(), function(err) {
        if(err != null) {
            console.log('Error deleting value: ' + err)
        }
    });

    s3.listObjects({Prefix: `contests/${userId}/${contestId}/`}, function (err, data) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        let objects = data.Contents.map(function (object) {
            return {Key: object.Key};
        });
        s3.deleteObjects({
            Delete: {Objects: objects, Quiet: true}
        }, function (err, data) {
            if (err) {
                return res.status(500).send("Database error, try again later");
            }
            Entry.deleteMany({CONTEST_ID: contestId}, function (err) {
                if (err) console.log(err);
                Contest.deleteOne({_id: contestId, USER_ID: userId}, function (err) {
                    if (err) console.log(err);
                    return res.status(200).json(data);
                });
            });
        });
    });
};

/**
 * Method that inserts a banner image into the file system
 * @param req
 * @param res
 * @param user
 */
exports.insertBanner = (req, res, user) => {
    let userId = user._id;
    let contestId = req.params.contestId;
    let uploadFile = req.files.file;
    let fileName = uploadFile.name;

    console.log("Contest id: ", contestId);
    console.log("User id: ", userId);

    let timestamp = Date.now();

    let path = `contests/${userId}/${contestId}/banner/${timestamp}_${fileName}`;

    Contest.updateOne({USER_ID: userId, _id: contestId},
        {
            IMAGE_PATH: `${process.env.CLOUDFRONT_DOMAIN_NAME}/${path}`
        }
        , function (err, doc) {
            if (err) {
                console.log(err);
                return res.status(200).json({
                    file: `${process.env.S3_URL}/${path}`,
                });
            }
        });


    let tmpPath = `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`;
    uploadFile.mv(tmpPath, (err) => {
        if (err) {
            console.log("ERROR");
            console.log(err);
            return res.status(500).send(err)
        }
        let params = {
            Body: fs.createReadStream(tmpPath),
            Key: path,
            ACL: 'public-read'
        };

        s3.upload(params, (err, data) => {
            if (err) console.log("Unable to upload file. Error: ", err);
            if (data) {
                console.log("Uploaded in: ", data.location);
                del.sync(tmpPath, {force: true}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                return res.status(200).json({
                    message: 'File uploaded',
                });
            }
        });
    });
};

/**
 * Method that inserts a script file system
 * @param req
 * @param res
 * @param user
 */
exports.insertScript = (req, res, user) => {
    let userId = user._id;
    let contestId = req.params.contestId;
    let uploadFile = req.files.file;
    let fileName = uploadFile.name;

    let timestamp = Date.now();

    let path = `contests/${userId}/${contestId}/script/${timestamp}_${fileName}`;
    console.log('path script: ', path);
    console.log('tmp path script: ', `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`);
    console.log(`${process.env.CLOUDFRONT_DOMAIN_NAME}/${path}`);

    // TO-DO: resource URL update with S3 bucket url prefix in MongoDB (S3_URL env variable)
    Contest.updateOne({USER_ID: userId, _id: contestId},
        {
            SCRIPT_PATH: `${process.env.CLOUDFRONT_DOMAIN_NAME}/${path}`
        }
        , function (err, doc) {
            if (err) {
                console.log(err);
                return res.status(200).json({
                    file: `${process.env.S3_URL}/${path}`,
                });
            }
        });

    let tmpPath = `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`;
    uploadFile.mv(tmpPath, (err) => {
        if (err) {
            console.log("ERROR");
            console.log(err);
            return res.status(500).send(err);
        }
        let params = {
            Body: fs.createReadStream(tmpPath),
            Key: path,
            ACL: 'public-read'
        };

        s3.upload(params, (err, data) => {
            if (err) console.log("Unable to upload file. Error: ", err);
            if (data) {
                console.log(data);
                console.log("Uploaded in: ", data.location);
                del.sync(tmpPath, {force: true}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                return res.status(200).json({
                    message: 'File uploaded',
                });
            }
        });
    });


};

/**
 * Method that inserts a recommendations file into the file system
 * @param req
 * @param res
 * @param user
 */
exports.insertRecommendations = (req, res, user) => {
    let userId = user._id;
    let contestId = req.params.contestId;
    let uploadFile = req.files.file;
    let fileName = uploadFile.name;

    let timestamp = Date.now();

    let path = `contests/${userId}/${contestId}/recommendations/${timestamp}_${fileName}`;
    console.log('path recom: ', path);
    console.log('tmp path recom: ', `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`);
    console.log(`${process.env.CLOUDFRONT_DOMAIN_NAME}/${path}`);

    // TO-DO: resource URL update with S3 bucket url prefix in MongoDB (S3_URL env variable)
    Contest.updateOne({USER_ID: userId, _id: contestId},
        {
            RECOMMENDATIONS_PATH: `${process.env.CLOUDFRONT_DOMAIN_NAME}/${path}`
        }
        , function (err, doc) {
            if (err) {
                console.log(err);
                return res.status(200).json({
                    file: `${process.env.S3_URL}/${url}`,
                });
            }
        });

    let tmpPath = `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`;
    uploadFile.mv(tmpPath, (err) => {
        if (err) {
            console.log("ERROR");
            console.log(err);
            return res.status(500).send(err)
        }
        let params = {
            Body: fs.createReadStream(tmpPath),
            Key: path,
            ACL: 'public-read'
        };

        s3.upload(params, (err, data) => {
            if (err) console.log("Unable to upload file. Error: ", err);
            if (data) {
                console.log("Uploaded in: ", data.location);
                del.sync(tmpPath, {force: true}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                return res.status(200).json({
                    message: 'File uploaded',
                });
            }
        });
    });
};

/**
 * Method that inserts a recording into the file system
 * @param req
 * @param res
 */
exports.insertRecording = (req, res) => {
    let userId = req.params.userId;
    let contestId = req.params.contestId;
    let entryId = req.params.entryId;
    let fileName = req.files.file.name;
    let uploadFile = req.files.file;

    let timestamp = Date.now();
    let url = `contests/${userId}/${contestId}/entries/${entryId}_${timestamp}_${fileName}`;

    console.log(entryId);

    Entry.updateOne({_id: entryId},
        {
            URL_ORIGINAL: `${process.env.CLOUDFRONT_DOMAIN_NAME}/${url}`
        }
        , function (err, doc) {
            if (err) {
                console.log(err);
                return res.status(200).json({
                    file: `${process.env.S3_URL}/${path}`,
                });
            }
        });

    // TO-DO: resource URL update with S3 bucket url prefix in MongoDB (S3_URL env variable)

    // Store in S3
    let tmpPath = `${__dirname}/contest_data/${contestId}_${timestamp}_${fileName}`;
    uploadFile.mv(tmpPath, (err) => {
        if (err) {
            console.log("ERROR");
            console.log(err);
            return res.status(500).send(err)
        }
        let params = {
            Body: fs.createReadStream(tmpPath),
            Key: url,
            ACL: 'public-read'
        };

        s3.upload(params, (err, data) => {
            if (err) console.log("Unable to upload file. Error: ", err);
            if (data) {
                del.sync(tmpPath, {force: true}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
        // Upload conversion request to queue

        let sqsParams = {
            DelaySeconds: 0,
            MessageAttributes: {
                "EntryId": {
                    DataType: "String",
                    StringValue: `${entryId}`
                },
                "ContestId": {
                    DataType: "String",
                    StringValue: `${userId}/${contestId}`
                },
                "RecordingPath": {
                    DataType: "String",
                    StringValue: `${process.env.S3_URL}/${url}`
                },
            },
            MessageBody: `${process.env.S3_URL}/${url}`,
            MessageGroupId: 'conversion',
            QueueUrl: process.env.SQS_URL,
            MessageDeduplicationId: sha256(`${process.env.S3_URL}/${url}`)
        };

        sqs.sendMessage(sqsParams, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.MessageId);
            }
        });
        return res.status(200).json();
    });
};

/**
 * Method that inserts a recording into the file system
 * @param req
 * @param res
 */
exports.insertLoadTest = (req, res) => {
    // Upload conversion request to queue
    let userId = req.params.userId;
    let contestId = req.params.contestId;
    let entryId = req.params.entryId;

    let url = req.body.url;

    let sqsParams = {
        DelaySeconds: 0,
        MessageAttributes: {
            "EntryId": {
                DataType: "String",
                StringValue: `${entryId}`
            },
            "ContestId": {
                DataType: "String",
                StringValue: `${userId}/${contestId}`
            },
            "RecordingPath": {
                DataType: "String",
                StringValue: `${process.env.S3_URL}/${url}`
            },
        },
        MessageBody: `${process.env.S3_URL}/${url}`,
        MessageGroupId: 'conversion',
        QueueUrl: process.env.SQS_URL,
        MessageDeduplicationId: sha256(`${process.env.S3_URL}/${url}/${Date.now()}`)
    };

    sqs.sendMessage(sqsParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
    return res.status(200).json();
};

/**
 * Method that obtains a set of entries for a given contest
 * @param req
 * @param res
 */
exports.getEntries = (req, res) => {
    const contestURL = req.params.url;
    Entry.find({URL_CONTEST: contestURL}, (err, rows) => {
        if (err) return console.error(err);
        return res.status(200).json(rows);
    }).sort({CREATED_AT: -1});
};

/**
 * Method that adds a new entry for a contest
 * @param req
 * @param res
 */
exports.addEntry = (req, res) => {
    let entry = req.body;
    let currDate = new Date();
    let created = currDate.getTime();

    const newEntry = new Entry({
        CONTEST_ID: entry.contestId,
        USER_ID: entry.userId,
        NAME: entry.name,
        LAST_NAME: entry.lastName,
        DATE: entry.date,
        EMAIL: entry.email,
        STATUS: entry.status,
        URL_ORIGINAL: entry.urlOriginal,
        URL_CONVERTED: entry.urlConverted,
        CREATED_AT: created,
        URL_CONTEST: entry.urlContest
    });

    newEntry.save(function (err) {
        if (err) console.log(err);
        Entry.findOne({EMAIL: entry.email, CREATED_AT: created}, (err, row) => {
            if (err) return console.error(err);
            return res.status(200).json(row);
        });
    });
};

/**
 * Function that deletes the S3 resource specified by param
 * @param resourceKey the key reference to the resource
 */
function deleteResource(resourceKey) {
    let parsedKey = resourceKey.split('/');
    parsedKey = parsedKey[parsedKey.length - 1];
    s3.deleteObject({Key: parsedKey}, function (err, data) {
        if (err) {
            return res.status(500).send("Database error, try again later");
        }
    });
}

exports.sendEmail = (req, res) => {

    console.log(req.body);
    email = req.body.email;

    // SES CONFIGURATION
    let params = {
        Destination: {
            CcAddresses: [],
            ToAddresses: [
                email,
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
  	<meta name="viewport" content="width=device-width, initial-scale=1.0;">
 	<meta name="format-detection" content="telephone=no"/>
	<style>
/* Reset styles */ 
body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important;}
body, table, td, div, p, a { -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; border-spacing: 0; }
img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
#outlook a { padding: 0; }
.ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; }
.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
/* Rounded corners for advanced mail clients only */ 
@media all and (min-width: 560px) {
	.container { border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; -khtml-border-radius: 8px;}
}
/* Set color for auto links (addresses, dates, etc.) */ 
a, a:hover {
	color: #127DB3;
}
.footer a, .footer a:hover {
	color: #999999;
}
 	</style>
	<title>SuperVoices</title>
</head>
<body topmargin="0" rightmargin="0" bottommargin="0" leftmargin="0" marginwidth="0" marginheight="0" width="100%" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%; height: 100%; -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%;
	background-color: #F0F0F0;
	color: #000000;"
	bgcolor="#F0F0F0"
	text="#000000">
<table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; margin-top: 5%; padding: 0; width: 100%;" class="background"><tr><td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;"
	bgcolor="#F0F0F0">
<table border="0" cellpadding="0" cellspacing="0" align="center"
	width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
	max-width: 560px;" class="wrapper">
</table>
<table border="0" cellpadding="0" cellspacing="0" align="center"
	bgcolor="#FFFFFF"
	width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
	max-width: 560px;" class="container">
	<!-- HEADER -->
	<tr>
		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 24px; font-weight: bold; line-height: 130%;
			padding-top: 25px;
			color: #000000;
			font-family: sans-serif;" class="header">
				Gracias por usar SuperVoices
		</td>
	</tr>
	<tr>
		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-bottom: 3px; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 18px; font-weight: 300; line-height: 150%;
			padding-top: 5px;
			color: #000000;
			font-family: sans-serif;" class="subheader">
				${req.body.name}, tu voz ya está disponible en el concurso!
		</td>
	</tr>
	<tr>
		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
			padding-top: 25px; 
			color: #000000;
			font-family: sans-serif;" class="paragraph">
				La entrada ya fue cargada a la página del concurso donde podrá ser revisada por el organizador.
		</td>
	</tr>
	<tr>
		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;
			padding-top: 25px;" class="line"><hr
			color="#E0E0E0" align="center" width="100%" size="1" noshade style="margin: 0; padding: 0;" />
		</td>
	</tr>
	<tr>
		<td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
			padding-top: 20px;
			padding-bottom: 25px;
			color: #000000;
			font-family: sans-serif;" class="paragraph">
				Ver en la página del concurso: <a href="http://54.227.39.108/contest/${req.body.url_contest}" target="_blank" style="color: #127DB3; font-family: sans-serif; font-size: 17px; font-weight: 400; line-height: 160%;">supervoices.com</a>
		</td>
	</tr>
</table>
</td></tr></table>
</body>
</html>
`
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `${req.body.name}, tu voz ha sido enviada al concurso!`
            }
        },
        Source: process.env.SES_MAIL,
        ReplyToAddresses: [
            process.env.SES_MAIL,
        ],
    };

    let sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

    sendPromise.then(
        function (data) {
            console.log(data.MessageId);
        }).catch(
        function (err) {
            console.error(err, err.stack);
        });

}

/**
 * Method that ends contests that have reached its final day
 */
exports.endContests = (req, res) => {

    let connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT,
    });

    connection.connect();

    connection.query('UPDATE CONTESTS SET STATUS="finished" WHERE END_DATE',
        function (err, rows) {
            if (err) {
                console.log(err);
                res.json({message: 'No se pudo actualizar los concursos'});
            }
            res.json(rows);
        });

    connection.end();
};