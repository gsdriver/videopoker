//
// Handles holding of cards after the first deal
//

'use strict';

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Was this a touch item selected?
    if (request.type === 'Alexa.Presentation.APL.UserEvent') {
      return ((request.source.type === 'TouchWrapper')
        && (request.source.handler === 'Press'));
    }

    return ((request.type === 'IntentRequest') && game && (game.state === 'FIRSTDEAL')
      && (request.intent.name === 'ToggleIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];
    let reprompt;
    let error;
    let speech;

    const index = getCardIndex(handlerInput);
    if (index !== undefined) {
      // OK, let's toggle this card
      game.cards[index].hold = !game.cards[index].hold;

      reprompt = (attributes.firstHold)
              ? res.strings.HOLD_FIRST_REPROMPT
              : res.strings.GENERIC_REPROMPT;
      game.lastHeld = [index];
      attributes.firstHold = false;
      speech = (game.cards[index].hold ? res.strings.HOLD_CARDS : res.strings.DISCARD_CARDS)
          .replace('{0}', res.sayCard(game.cards[index]));
      speech += reprompt;
    } else {
      error = 'Something went wrong';
    }

    return handlerInput.responseBuilder
      .speak((error) ? error : speech)
      .reprompt(reprompt)
      .getResponse();
  },
};

function getCardIndex(handlerInput) {
  let index;
  const event = handlerInput.requestEnvelope;

  // Was this a touch item selected?
  if (event.request.type === 'Alexa.Presentation.APL.UserEvent') {
    const cards = event.request.arguments[0].split('.');
    if (cards.length === 2) {
      index = cards[1];
    }
  } else {
    // Look for an intent slot
    if (event.request.intent.slots && event.request.intent.slots.Number
      && event.request.intent.slots.Number.value) {
      index = parseInt(event.request.intent.slots.Number.value);

      if (isNaN(index)) {
        index = undefined;
      } else {
        // Turn into zero-based index
        index--;
      }
    }
  }

  return index;
}
