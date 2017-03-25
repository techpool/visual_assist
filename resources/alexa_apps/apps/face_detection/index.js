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
    "slots": { "NAME": "LITERAL", "RELATION": "LITERAL" },
    "utterances": ["this is {NAME} and she is {RELATION} of mine"]
}, function(req, res) {


    return new Promise(function(resolve, reject) {
    	res.say('Your have met ' + req.slot('NAME') + ' and she is a ' + req.slot('RELATION'));
    	resolve();
        // utils.getRestDbMessage('emotionapi', function(responseMessage) {
        //     res.say(responseMessage);
        //     resolve()
        // });
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
