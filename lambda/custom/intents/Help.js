//
// Handles stop, which will exit the skill
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'AMAZON.HelpIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    let speech = '';
    const game = attributes[attributes.currentGame];
    const reprompt = utils.readAvailableActions(event.request.locale, attributes);
    const rules = utils.getGame(attributes.currentGame);
    let cardText;

    if (attributes.choices) {
      speech = res.strings.HELP_SELECTGAME;
    } else {
      speech = res.strings.HELP_STATUS
          .replace('{0}', res.sayGame(attributes.currentGame))
          .replace('{1}', utils.readCoins(event.request.locale, game.bankroll));
      speech += reprompt;
    }

    cardText = res.strings[rules.help];
    cardText += utils.readPayoutTable(event.request.locale, rules);
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .withSimpleCard(res.strings.HELP_CARD_TITLE, cardText)
      .getResponse();
  },
};
