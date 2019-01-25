//
// Reads the payout table
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'RulesIntent') &&
      !attributes.choices);
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const rules = utils.getGame(attributes.currentGame);
    let speech;
    const reprompt = res.strings.GENERIC_REPROMPT;

    // Any special message for this game
    speech = res.strings[rules.special];
    speech += res.strings.RULES_READ_CARD;
    speech += reprompt;

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .withSimpleCard(res.strings.RULES_CARD_TITLE, utils.readPayoutTable(event.request.locale, rules))
      .getResponse();
  },
};
