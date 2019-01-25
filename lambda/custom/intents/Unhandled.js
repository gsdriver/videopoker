//
// Unhandled intents
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const res = require('../' + event.request.locale + '/resources');
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let reprompt;

    if (attributes.choices) {
      speech = res.strings.UNKNOWN_SELECT_INTENT;
      reprompt = res.strings.UNKNOWN_SELECT_INTENT_REPROMPT;
    } else {
      const game = attributes[attributes.currentGame];
      if (game.state === 'FIRSTDEAL') {
        speech = res.strings.UNKNOWN_DEAL_INTENT;
        reprompt = res.strings.UNKNOWN_DEAL_INTENT_REPROMPT;
      } else {
        speech = res.strings.UNKNOWN_INTENT;
        reprompt = res.strings.UNKNOWN_INTENT_REPROMPT;
      }
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
