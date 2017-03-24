var alexa = require('alexa-app');
var utils = require('../../../utils');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('visual_description');
// app.launch(function(req, res) {
//     utils.downloadKloudlessPhoto()
//     res.say('Nothing is there in front of me.');
// });

app.intent('SceneIntent', {
    // "slots": { "NAME": "LITERAL", "AGE": "NUMBER" },
    "utterances": ["What is there in front of me"]
}, function(req, res) {


    return new Promise(function(resolve, reject) {
        utils.downloadKloudlessPhoto(function(error, imageUrl) {
            if (error) {
                console.log(error);
            } else {
                console.log('---------------')
                console.log(imageUrl)
                console.log('---------------')
                utils.generateComputerVision(imageUrl, function(responseBody) {
                    var responseText = 'I think it is ';
                    responseText += responseBody.description.captions[0].text;
                    responseText += '. The keywords are '
                    for (var i = 0; i < responseBody.tags.length; i++) {
                        var eachTag = responseBody.tags[i];
                        responseText += eachTag.name + ', ';
                    }

                    res.say(responseText);
                    resolve()
                });
            }
        });
    });
});

module.exports = app;
