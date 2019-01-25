//
// Handles holding of cards after the first deal
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    return ((request.type === 'IntentRequest') && game && (game.state === 'FIRSTDEAL')
      && ((request.intent.name === 'HoldIntent') || (request.intent.name === 'HoldAllIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];
    let reprompt;
    let error;
    let speech;
    let holdCards;

    if (event.request.intent.name === 'HoldAllIntent') {
      holdCards = [1, 2, 3, 4, 5];
    } else {
      // See which card(s) were selected
      const selected = utils.getSelectedCards(event.request.locale,
              attributes, true, event.request.intent.slots);
      if (selected.error) {
        error = selected.error;
        reprompt = res.strings.HOLD_NOTFOUND_REPROMPT.replace('{0}', res.sayCard(game.cards[0]));
        error += reprompt;
      } else {
        holdCards = selected.cards;
      }
    }

    if (holdCards) {
      // Mark each card as held
      holdCards.map((card) => {
        game.cards[card - 1].hold = true;
      });
    }

    if (!error) {
      reprompt = (attributes.firstHold)
              ? res.strings.HOLD_FIRST_REPROMPT
              : res.strings.GENERIC_REPROMPT;
      game.lastHeld = holdCards;
      attributes.firstHold = false;
      speech = res.strings.HOLD_CARDS.replace('{0}',
              speechUtils.and(holdCards.map((index) => res.sayCard(game.cards[index - 1])),
                {locale: event.request.locale}));
      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak((error) ? error : speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
