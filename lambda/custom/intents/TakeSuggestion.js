//
// Provides a suggestion for play
//

'use strict';

const utils = require('../utils');
const Deal = require('./Deal');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    return ((request.type === 'IntentRequest') && game && game.suggestedHold
      && ((request.intent.name === 'AMAZON.YesIntent') || (request.intent.name === 'AMAZON.NoIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];

    if (event.request.intent.name === 'AMAZON.YesIntent') {
      let i;

      // Mark each suggested card as held, and issue a deal
      for (i = 0; i < game.cards.length; i++) {
        game.cards[i].hold = (game.suggestedHold && game.suggestedHold.indexOf(i + 1) > -1)
                ? true : undefined;
      }
      game.state = 'FIRSTDEAL';
      return Deal.handle(handlerInput);
    } else {
      let speech;
      const reprompt = res.strings.SUGGEST_NOT_TAKING;

      game.state = 'FIRSTDEAL';
      game.suggestedHold = undefined;
      speech = utils.readHand(event.request.locale, game);
      speech += reprompt;
      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }
  },
};
