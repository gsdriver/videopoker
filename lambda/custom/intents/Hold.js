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
    let holdCards;

    if (this.attributes.allSelected) {
      holdCards = [1, 2, 3, 4, 5];
      this.attributes.allSelected = undefined;
    } else {
      // See which card(s) were selected
      const selected = utils.getSelectedCards(this.event.request.locale,
              this.attributes, true, this.event.request.intent.slots);
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
      reprompt = (this.attributes.firstHold)
              ? res.strings.HOLD_FIRST_REPROMPT
              : res.strings.GENERIC_REPROMPT;
      game.lastHeld = holdCards;
      this.attributes.firstHold = false;
      speech = res.strings.HOLD_CARDS.replace('{0}',
              speechUtils.and(holdCards.map((index) => res.sayCard(game.cards[index - 1])),
                {locale: this.event.request.locale}));
      speech+= reprompt;
    }

    utils.emitResponse(this, error, null, speech, reprompt);
  },
  handleAllIntent: function() {
    this.attributes.allSelected = true;
    this.emitWithState('HoldIntent');
  },
};
