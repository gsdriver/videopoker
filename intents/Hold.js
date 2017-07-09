//
// Handles holding of cards after the first deal
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or 1 unit
    let reprompt;
    let error;
    let speech;
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];

    // See which card(s) were selected
    const holdCards = getCards(this.event.request.intent.slots);
    if (!holdCards || (holdCards.length === 0)) {
      error = res.strings.BET_INVALID_AMOUNT.replace('{0}', amount);
      reprompt = res.strings.BET_INVALID_REPROMPT;
    }

    if (!error) {
      speech = res.strings.HOLD_CARDS.replace('{0}',
              speechUtils.and(holdCards.map((index) => res.sayCard(game.cards[index])),
                {locale: this.event.request.locale}));
    }

    utils.emitResponse(this.emit, this.event.request.locale, error, null, speech, reprompt);
  },
};

function getCards(locale, attributes, slots) {
  const res = require('../' + locale + '/resources');
  let index;
  const game = attributes[attributes.currentGame];

  // You can say the card in lots of different ways
  if (slots.CardNumber && slots.CardNumber.value) {
    index = parseInt(slots.CardNumber.value);
    if (isNaN(index) || (index < 1) || (index > 5)) {
      return [];
    } else {
      return [index];
    }
  }
  if (slots.CardOrdinal && slots.CardOrdinal.value) {
    return res.ordinalMapping(slots.CardOrdinal.value);
  }
  if (slots.CardRank && slots.CardRank.value) {
    const foundCards = [];
    const rank = res.getRank(slots.CardRank.value);
    if (slots.CardSuit && slots.CardSuit.value) {
      const suit = res.getSuit(slots.CardSuit.value);

      // Make sure this is in the hand
      for (index = 0; index < game.cards.length; index++) {
        if ((game.cards[index].rank === rank) && (game.cards[index].suit === suit)) {
          foundCards.push(index);
        }
      }
    } else {
      // Select all cards of this rank
      for (index = 0; index < game.cards.length; index++) {
        if (game.cards[index].rank === rank) {
          foundCards.push(index);
        }
      }
    }

    return foundCards;
  }
}
