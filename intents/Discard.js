//
// Handles discarding of cards after the first deal
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
    let discardCards = utils.getSelectedCards(this.event.request.locale,
            this.attributes, this.event.request.intent.slots);
    if (!discardCards || (discardCards.length === 0)) {
      // Use the last held cards
      discardCards = game.lastHeld;
    }

    if (!discardCards || (discardCards.length === 0)) {
      error = res.strings.BET_INVALID_AMOUNT.replace('{0}', amount);
      reprompt = res.strings.BET_INVALID_REPROMPT;
    } else {
      // Mark each card as no longer held
      holdCards.map((card) => {
        game.cards[card - 1].hold = undefined;
      });
    }

    if (!error) {
      reprompt = res.strings.DISCARD_REPROMPT;
      speech = res.strings.DISCARD_CARDS.replace('{0}',
              speechUtils.and(holdCards.map((index) => res.sayCard(game.cards[index - 1])),
                {locale: this.event.request.locale}));
      speech += reprompt;
    }

    utils.emitResponse(this.emit, this.event.request.locale, error, null, speech, reprompt);
  },
};
