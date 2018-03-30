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
    let discardCards;

    if (this.attributes.allSelected) {
      discardCards = [1, 2, 3, 4, 5];
      this.attributes.allSelected = undefined;
    } else {
      // See which card(s) were selected
      const selected = utils.getSelectedCards(this.event.request.locale,
              this.attributes, false, this.event.request.intent.slots);
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
                {locale: this.event.request.locale}));
      speech += reprompt;
    }

    utils.emitResponse(this, error, null, speech, reprompt);
  },
  handleAllIntent: function() {
    this.attributes.allSelected = true;
    this.emitWithState('DiscardIntent');
  },
};
