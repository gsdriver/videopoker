//
// Handles discarding of cards after the first deal
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((request.type === 'IntentRequest') && game && (game.state === 'FIRSTDEAL')
      && ((request.intent.name === 'DiscardIntent') || (request.intent.name === 'DiscardAllIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];
    let reprompt;
    let error;
    let speech;
    let discardCards;

    if (event.request.intent.name === 'DiscardAllIntent') {
      discardCards = [1, 2, 3, 4, 5];
    } else {
      // See which card(s) were selected
      const selected = utils.getSelectedCards(event.request.locale,
              attributes, false, event.request.intent.slots);
      if (selected.error) {
        error = selected.error;
        reprompt = res.strings.HOLD_NOTFOUND_REPROMPT.replace('{0}', res.sayCard(game.cards[0]));
        error += reprompt;
      } else {
        discardCards = selected.cards;
      }
    }

    if (discardCards) {
      // Mark each card as held
      discardCards.map((card) => {
        game.cards[card - 1].hold = undefined;
      });
    }

    if (!error) {
      reprompt = res.strings.DISCARD_REPROMPT;
      speech = res.strings.DISCARD_CARDS.replace('{0}',
              speechUtils.and(discardCards.map((index) => res.sayCard(game.cards[index - 1])),
                {locale: event.request.locale}));
      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak((error) ? error : speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
