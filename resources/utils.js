var fs = require('fs');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var qs = require('querystring')

var isValidDirectory = function(dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
};

var isValidFile = function(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
};

var readFile = function(file) {
    return fs.readFileSync(file, 'utf8');
};

var readJsonFile = function(file) {
    return JSON.parse(readFile(file));
};

var normalizeApiPath = function(apiPath) {
    return path.posix.normalize(path.posix.join('/', apiPath));
};

var downloadKloudlessPhoto = function(callback) {
    var async = require('async'); // for clean demonstration

    var kloudless = require('kloudless')('KgH5wcL5WwIZT_Vush15K_AOnOfX17o_Q64eDCvdBCJ6cL3l');
    var fs = require('fs');

    var accountId, fileId, folderId, fileName, kloudlessImageURL;

    async.series([
        function(cb) {
            // to get the base account data
            kloudless.accounts.base({}, function(err, res) {
                if (err) {
                    return console.log("Error getting the account data: " + err);
                }
                // assuming you authorized at least one service (Dropbox, Google Drive, etc.)
                console.log("We got the account data!");
                accountId = res["objects"][0]["id"];
                cb();
            });
        },

        function(cb) {
            // and now we're going to download that file we just uploaded
            kloudless.folders.contents({
                "account_id": accountId,
                "folder_id": 'root'
            }, function(err, folders) {
                if (err) {
                    return console.log("Files contents: " + err);
                }
                console.log("got the folders:");
                // console.log(folders)

                for (var i = 0; i < folders.objects.length; i++) {
                    var eachFolder = folders.objects[i];
                    if (eachFolder.name == 'Technika') {
                        folderId = eachFolder.id;
                    }
                }
                cb();
            });
        },

        function(cb) {
            // and now we're going to download that file we just uploaded
            kloudless.folders.contents({
                "account_id": accountId,
                "folder_id": folderId
            }, function(err, folders) {
                if (err) {
                    return console.log("Files contents: " + err);
                }
                console.log("got the folders:");
                console.log(folders)

                fileId = folders.objects[0].id;
                fileName = folders.objects[0].name;
                cb();
            });
        },

        function(cb) {
            // and now we're going to download that file we just uploaded
            kloudless.links.create({
                "account_id": accountId,
                "file_id": fileId
            }, function(err, fileDetails) {
                if (err) {
                    return console.log("Files contents: " + err);
                }
                kloudlessImageURL = fileDetails.url;
                cb();
            });
        },
        function(cb) {
            // and now we're going to download that file we just uploaded
            request.get(kloudlessImageURL, function(error, response, body) {
                // console.log(body)
                var $ = cheerio.load(body);
                var title = $('meta[property="og:image"]').attr('content')
                cb(null, title)
                    // console.log(title)
            });
        }
    ], function(error, url) {

        for (var i = 0; i < url.length; i++) {
            var eachUrl = url[i];
            if (eachUrl) {
                callback(error, eachUrl)
                break;
            }
        }
    });
}

var generateComputerVision = function(url, callback) {
    const COMPUTER_VISION_KEY = '3936f08cea1f4a578988ef3cbf38cf0c';
    var query = {
        'visualFeatures': 'Tags,Description',
        'language': 'en'
    }
    console.log(qs.stringify(query));

    var requestOptions = {
        'uri': 'https://westus.api.cognitive.microsoft.com/vision/v1.0/analyze?' + qs.stringify(query),
        'method': 'POST',
        'headers': {
            'Ocp-Apim-Subscription-Key': COMPUTER_VISION_KEY,
            'Content-Type': 'application/json'
        },
        'json': {
            "url": url
        }
    }

    request(requestOptions, function(error, response, body) {
        console.log(JSON.stringify(body));
        callback(body)
    });
}

// generateComputerVision()

module.exports = {
    isValidDirectory: isValidDirectory,
    isValidFile: isValidFile,
    readFile: readFile,
    readJsonFile: readJsonFile,
    normalizeApiPath: normalizeApiPath,
    downloadKloudlessPhoto: downloadKloudlessPhoto,
    generateComputerVision: generateComputerVision
};
