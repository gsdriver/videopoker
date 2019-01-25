//
// Reads the top high scores
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'HighScoreIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');

    return utils.readLeaderBoard(event.request.locale, event.session.user.userId, attributes)
    .then((highScores) => {
      const speech = highScores + '. ' + res.strings.GENERIC_REPROMPT;
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(res.strings.GENERIC_REPROMPT)
        .getResponse();
    });
  },
};
