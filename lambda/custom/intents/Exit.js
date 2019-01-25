//
// Handles stop, which will exit the skill
//

'use strict';

const ads = require('../ads');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.CancelIntent')
        || (request.intent.name === 'AMAZON.StopIntent')
        || ((request.intent.name === 'AMAZON.NoIntent') && game &&
          ((game.state === 'FIRSTDEAL') || (game.state === 'NEWGAME')))));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');

    return ads.getAd(attributes, 'videopoker', event.request.locale)
    .then((adText) => {
      return handlerInput.responseBuilder
        .speak(res.strings.EXIT_GAME.replace('{0}', adText))
        .withShouldEndSession(true)
        .getResponse();
    });
  },
};
