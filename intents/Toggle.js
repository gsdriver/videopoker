//
// Handles holding of cards after the first deal
//

'use strict';

const utils = require('../utils');

module.exports = {
  handleIntent: function() {
    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or 1 unit
    let reprompt;
    let error;
    let speech;
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];

    const index = getCardIndex(this);
    if (index !== undefined) {
      // OK, let's toggle this card
      game.cards[index].hold = !game.cards[index].hold;

      reprompt = (this.attributes.firstHold)
              ? res.strings.HOLD_FIRST_REPROMPT
              : res.strings.GENERIC_REPROMPT;
      game.lastHeld = [index];
      this.attributes.firstHold = false;
      speech = (game.cards[index].hold ? res.strings.HOLD_CARDS : res.strings.DISCARD_CARDS)
          .replace('{0}', res.sayCard(game.cards[index]));
      speech+= reprompt;
    } else {
      error = 'Something went wrong';
    }

    utils.emitResponse(this, error, null, speech, reprompt);
  },
};

function getCardIndex(context) {
  let index;

  if (context.event.request.token) {
    const cards = context.event.request.token.split('.');
    if (cards.length === 2) {
      index = cards[1];
    }
  } else {
    // Look for an intent slot
    if (context.event.request.intent.slots && context.event.request.intent.slots.Number
      && context.event.request.intent.slots.Number.value) {
      index = parseInt(context.event.request.intent.slots.Number.value);

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
