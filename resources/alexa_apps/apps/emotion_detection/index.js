var alexa = require('alexa-app');
var utils = require('../../../utils');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('emotion_detection');
// app.launch(function(req, res) {
//     utils.downloadKloudlessPhoto()
//     res.say('Nothing is there in front of me.');
// });

app.intent('EmotionIntent', {
    // "slots": { "NAME": "LITERAL", "AGE": "NUMBER" },
    "utterances": ["Describe the person's emotions"]
}, function(req, res) {


    return new Promise(function(resolve, reject) {
        utils.getRestDbMessage('emotionapi', function(responseMessage) {
            res.say(responseMessage);
            resolve()
        });
    });
});

module.exports = app;
