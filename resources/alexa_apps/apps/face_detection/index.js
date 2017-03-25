var alexa = require('alexa-app');
var utils = require('../../../utils');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('face_detection');
// app.launch(function(req, res) {
//     utils.downloadKloudlessPhoto()
//     res.say('Nothing is there in front of me.');
// });

app.intent('FaceIntent', {
    "slots": { "NAME": "LITERAL"},
    "utterances": ["this is {NAME}"]
}, function(req, res) {

    return new Promise(function(resolve, reject) {
    	utils.submitNewFace(req.slot('NAME'));
    	res.say('All right! Your have met ' + req.slot('NAME') + ', and I have kept a note of it.');
    	resolve();
    });
});

app.intent('FaceDescribeIntent', {
    "utterances": ["Who is in front of me"]
}, function(req, res) {

    return new Promise(function(resolve, reject) {
    	
        utils.getRestDbMessage('faceapi', function(responseMessage) {
            res.say(responseMessage);
            resolve()
        });
    });
});

module.exports = app;
